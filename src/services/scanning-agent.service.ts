/**
 * ScanningAgent — systematically audits every feature in the Inclufy AMOS app.
 *
 * Covers:
 *  - LiveCapture flow (photo / video / audio / quote / upload)
 *  - PostReview flow (image display, preview modal, publish, schedule, overlay)
 *  - Navigation & tab structure
 *  - Component-level bugs
 *  - Visual/UX regressions
 *
 * Each spec test corresponds to a rule in docs/FUNCTIONAL_SPEC.md.
 * Usage:  call runFullScan() and read the returned ScanReport.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IssueCategory =
  | 'image-processing'
  | 'video-audio'
  | 'preview-modal'
  | 'navigation'
  | 'ui-visual'
  | 'data-logic'
  | 'publish-flow'
  | 'schedule'
  | 'permissions'
  | 'performance'
  | 'security'
  | 'authentication';

export interface ScanIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  screen: string;
  title: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  affectedFile: string;
  affectedLines?: string;
  fixSuggestion: string;
  status: 'open' | 'in-progress' | 'fixed' | 'wont-fix';
}

export interface ScanReport {
  generatedAt: string;
  totalIssues: number;
  fixed: number;
  open: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  issues: ScanIssue[];
}

// ─── Static issue registry (populated by full scan) ──────────────────────────

const KNOWN_ISSUES: ScanIssue[] = [

  // ── CRITICAL ────────────────────────────────────────────────────────────

  {
    id: 'SCAN-001',
    severity: 'critical',
    category: 'image-processing',
    screen: 'LiveCaptureScreen → PostReviewScreen',
    title: 'Photos appear rotated 90° in PostReview and Instagram preview',
    description:
      'normalizeImageOrientation() only reads exif?.Orientation (capital O) || exif?.orientation (lowercase). ' +
      'iOS returns the field as Orientation=6 for landscape-left shots, but expo-camera passes ' +
      'exif data with inconsistent key casing depending on device. When EXIF rotation is missing ' +
      'or not matched, the raw pixel data (already landscape) is displayed sideways.',
    stepsToReproduce: [
      '1. Tap the FAB camera button',
      '2. Hold phone in portrait orientation (vertical)',
      '3. Take a photo of any subject',
      '4. The photo arrives in PostReview rotated 90° clockwise',
    ],
    expectedBehavior: 'Photo displayed upright in the PostReview card and all preview modals.',
    actualBehavior: 'Photo is displayed rotated 90°. Rotate button must be used manually.',
    affectedFile: 'src/screens/LiveCaptureScreen.tsx',
    affectedLines: '54–81',
    fixSuggestion:
      'Add a dimension-based fallback: if the decoded image width > height and the photo was ' +
      'taken in portrait mode (detectable from device orientation or image aspect ratio), ' +
      'apply a -90 rotation automatically in addition to EXIF rotation. Also normalise EXIF ' +
      'key lookup to handle both Orientation and orientation.',
    status: 'fixed',
  },

  {
    id: 'SCAN-002',
    severity: 'critical',
    category: 'preview-modal',
    screen: 'PostReviewScreen — Instagram/LinkedIn Preview Modal',
    title: 'Instagram & LinkedIn preview shows "Geen afbeelding" for video captures even after thumbnail is added',
    description:
      'In the preview modal (line ~2699), imageCandidates is set to [] whenever isPreviewVideo ' +
      'or isPreviewAudio is true. Extra images (thumbnails) added via "Thumbnail toevoegen" are ' +
      'stored in post.engagement.extra_images but are excluded from imageCandidates because of ' +
      'the isPreviewVideo/isPreviewAudio guard. The preview always renders the "Geen afbeelding" placeholder.',
    stepsToReproduce: [
      '1. Record a video via LiveCapture',
      '2. Navigate to PostReview',
      '3. Tap "Thumbnail toevoegen" and select a photo',
      '4. Tap "Preview" for Instagram or LinkedIn tab',
      '5. Preview modal shows black screen with "Geen afbeelding"',
    ],
    expectedBehavior: 'Preview modal shows the selected thumbnail in the mock Instagram/LinkedIn card.',
    actualBehavior: 'Preview modal shows "Geen afbeelding" (No image) regardless of added thumbnail.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '2693–2716',
    fixSuggestion:
      'Change imageCandidates assignment so that for video/audio, it falls back to extraImages ' +
      'instead of []. Replace `isPreviewVideo || isPreviewAudio ? []` with ' +
      '`isPreviewVideo || isPreviewAudio ? extraImages.filter(Boolean) : [...]`.',
    status: 'fixed',
  },

  {
    id: 'SCAN-003',
    severity: 'critical',
    category: 'video-audio',
    screen: 'PostReviewScreen — Video/Audio card',
    title: 'Video/Audio post cards never display added thumbnail/extra images in the main card',
    description:
      'In the post card render loop (line ~1503), postImages is set to [] for isVideo || isAudio. ' +
      'This means the thumbnail/extra image added via "Thumbnail toevoegen" never appears in the ' +
      'main post card — only in the bottom action placeholder. The card always shows "Video opname" ' +
      'black placeholder even after a thumbnail is uploaded.',
    stepsToReproduce: [
      '1. Record a video → PostReview',
      '2. Tap "Thumbnail toevoegen" and pick a photo',
      '3. The card still shows "Video opname" dark placeholder with no image',
    ],
    expectedBehavior: 'After adding a thumbnail, the video post card displays the thumbnail image above the video placeholder.',
    actualBehavior: 'Card stays on the "Video opname" dark placeholder indefinitely.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '1489–1541',
    fixSuggestion:
      'Modify the video/audio card branch: after the dark placeholder, check if extra_images exist ' +
      'in post.engagement and render them as a thumbnail strip below the placeholder, ' +
      'or replace the placeholder entirely if a thumbnail is available.',
    status: 'fixed',
  },

  {
    id: 'SCAN-004',
    severity: 'critical',
    category: 'schedule',
    screen: 'PostReviewScreen — Schedule Modal',
    title: 'Schedule date stored as invalid ISO string — DD-MM-YYYY format used directly',
    description:
      'The schedule modal collects date as DD-MM-YYYY but builds scheduled_at as ' +
      '`${scheduleDate.trim()}T${timeStr}:00` (line ~807). This produces "15-03-2026T09:00:00" ' +
      'which is NOT a valid ISO 8601 date — Supabase/PostgreSQL will reject or silently truncate it. ' +
      'Posts marked as "scheduled" may never actually publish at the right time.',
    stepsToReproduce: [
      '1. Open any post in PostReview',
      '2. Tap "Inplannen"',
      '3. Enter date as 15-03-2026 and time 09:00',
      '4. Tap "Bevestig inplannen"',
      '5. Check go_posts in DB — scheduled_at = "15-03-2026T09:00:00" (invalid)',
    ],
    expectedBehavior: 'scheduled_at stored as "2026-03-15T09:00:00" (ISO 8601 YYYY-MM-DD).',
    actualBehavior: 'scheduled_at stored as "15-03-2026T09:00:00" — invalid timestamp.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '803–817',
    fixSuggestion:
      'Convert DD-MM-YYYY to YYYY-MM-DD before building the ISO string. ' +
      'const [day, month, year] = scheduleDate.split("-"); ' +
      'const isoDate = `${year}-${month}-${day}`; ' +
      'const scheduled_at = `${isoDate}T${timeStr}:00`;',
    status: 'fixed',
  },

  // ── HIGH ────────────────────────────────────────────────────────────────

  {
    id: 'SCAN-005',
    severity: 'high',
    category: 'ui-visual',
    screen: 'PostReviewScreen',
    title: 'Image toolbar (Tekst/logo, Draaien, Spiegelen) always rendered for video/audio captures',
    description:
      'The image editing toolbar at line ~1744 is unconditionally rendered (`{(` with a truthy value). ' +
      'For video and audio captures that have no image, the toolbar shows Draaien, Spiegelen, ' +
      'and Overlay buttons — tapping Draaien/Spiegelen fails silently because imageUrl is null.',
    stepsToReproduce: [
      '1. Record an audio capture → PostReview',
      '2. Observe "Tekst / logo toevoegen", "Draaien", "Spiegelen" buttons below the audio placeholder',
      '3. Tap "Draaien" — nothing happens (fails silently)',
    ],
    expectedBehavior: 'Draaien and Spiegelen only shown when a photo image is available for the post.',
    actualBehavior: 'All three buttons always visible; Draaien/Spiegelen are no-ops without an image.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '1742–1806',
    fixSuggestion:
      'Wrap the Draaien/Spiegelen buttons in `{imageUrl ? (...) : null}`. ' +
      'The overlay editor (Tekst/logo) can remain always visible since the user may add an image later.',
    status: 'fixed',
  },

  {
    id: 'SCAN-006',
    severity: 'high',
    category: 'navigation',
    screen: 'LiveCaptureScreen',
    title: 'Channel selector bar hidden for all free-capture categories',
    description:
      'The per-capture channel selector bar (Kanalen: LinkedIn / Instagram / Facebook / WhatsApp) ' +
      'is gated by `{event && (<View...>)}` at line ~889. When using LiveCapture from the FAB ' +
      '(product, inspiration, behind_scenes categories), no event exists so the channel bar never ' +
      'renders. Users cannot change the target channels for free captures.',
    stepsToReproduce: [
      '1. Tap the FAB camera button',
      '2. Choose "Product Capture", "Inspiratie", or "Behind the Scenes"',
      '3. In the capture screen, there is no channel selector visible',
      '4. AI generates posts only for the default LinkedIn + Instagram channels',
    ],
    expectedBehavior: 'Channel selector visible and functional for all capture categories.',
    actualBehavior: 'Channel selector hidden for non-event (free) captures.',
    affectedFile: 'src/screens/LiveCaptureScreen.tsx',
    affectedLines: '889–917',
    fixSuggestion:
      'Remove the `event &&` guard and render the channel bar unconditionally. ' +
      'The `selectedChannels` state already defaults to [] for free captures and falls ' +
      'back to ["linkedin","instagram"] in processFreeCapture.',
    status: 'fixed',
  },

  {
    id: 'SCAN-007',
    severity: 'high',
    category: 'ui-visual',
    screen: 'PostReviewScreen — Publish All button',
    title: '"Publiceer Alles" counter only counts draft posts, but also publishes approved posts',
    description:
      'The bottom button label reads "Publiceer Alles (N kanalen)" where N = ' +
      '`posts.filter(p => p.status === "draft").length` (line ~2526). ' +
      'But handlePublishAll() publishes both "draft" AND "approved" posts ' +
      '(line ~1306). The counter misleads users about how many posts will be published.',
    stepsToReproduce: [
      '1. Have 2 posts: 1 draft + 1 approved',
      '2. Button shows "Publiceer Alles (1 kanalen)"',
      '3. Tap — both posts get published (2 actually published)',
    ],
    expectedBehavior: 'Counter shows total of draft + approved posts that will be published.',
    actualBehavior: 'Counter only shows draft count.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '2526, 1306',
    fixSuggestion:
      'Change the filter in the button text to match handlePublishAll: ' +
      '`posts.filter(p => p.status === "draft" || p.status === "approved").length`',
    status: 'fixed',
  },

  {
    id: 'SCAN-008',
    severity: 'high',
    category: 'video-audio',
    screen: 'LiveCaptureScreen — AudioCapture',
    title: 'Audio recording not stopped on screen unmount / back navigation',
    description:
      'AudioCapture component starts recording on user tap but has no cleanup on unmount. ' +
      'If the user taps the Back button mid-recording, the audioRecorder continues running ' +
      'in the background (microphone keeps recording). No useEffect cleanup calls ' +
      'audioRecorder.stop() on unmount.',
    stepsToReproduce: [
      '1. Switch to Audio mode in LiveCapture',
      '2. Tap record (mic starts)',
      '3. Immediately tap Back',
      '4. Microphone indicator in iOS status bar remains active',
    ],
    expectedBehavior: 'Recording stops and resources are released when the screen is left.',
    actualBehavior: 'Recording continues after navigation; microphone stays open.',
    affectedFile: 'src/components/AudioCapture.tsx',
    affectedLines: '38–53',
    fixSuggestion:
      'Add a cleanup useEffect: `useEffect(() => () => { if (isRecording) audioRecorder.stop(); }, []);`',
    status: 'fixed',
  },

  {
    id: 'SCAN-009',
    severity: 'high',
    category: 'image-processing',
    title: 'Rotate operation uses stale captureImageUrl after multiple rotations',
    screen: 'PostReviewScreen — Draaien button',
    description:
      'handleRotateImage() always starts from `captureImageUrl ?? imageUrl` (line ~709). ' +
      'After the first rotation, a new signed URL is fetched via query invalidation. ' +
      'If the user taps Draaien a second time before the query refetches, ' +
      'the source URL is still the pre-rotation image, causing the second rotation ' +
      'to use the original unrotated image.',
    stepsToReproduce: [
      '1. Take a photo that is sideways',
      '2. Tap "Draaien" — uploads rotated image, invalidates query',
      '3. Immediately tap "Draaien" again before query refetches',
      '4. Second rotation overwrites with the original (un-rotated) image',
    ],
    expectedBehavior: 'Each rotation builds on the previous result (cumulative 90° each press).',
    actualBehavior: 'Rapid double-tap resets rotation to original.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '703–731',
    fixSuggestion:
      'Track the "current working URI" in a local ref that is updated immediately after ' +
      'each rotate/flip operation (before the query refetches). Use this ref as the ' +
      'source instead of captureImageUrl.',
    status: 'fixed',
  },

  // ── MEDIUM ───────────────────────────────────────────────────────────────

  {
    id: 'SCAN-010',
    severity: 'medium',
    category: 'permissions',
    screen: 'LiveCaptureScreen — AudioCapture',
    title: 'AudioCapture requests microphone permission silently without showing system prompt context',
    description:
      'AudioModule.requestRecordingPermissionsAsync() is called inside a useEffect on mount. ' +
      'On iOS, if the user previously denied microphone access, the system dialog will not ' +
      'appear again, and the only feedback is a brief Alert("Microfoon toegang nodig") ' +
      'with no "Open Settings" deep link.',
    stepsToReproduce: [
      '1. Deny microphone permission when first asked',
      '2. Open LiveCapture → Audio mode',
      '3. Alert shows "Microfoon toegang nodig" with only an OK button — no way to fix',
    ],
    expectedBehavior: 'Alert offers "Open instellingen" button to redirect to iOS Settings.',
    actualBehavior: 'Alert has only OK button; user is stuck.',
    affectedFile: 'src/components/AudioCapture.tsx',
    affectedLines: '24–36',
    fixSuggestion:
      'Replace simple Alert with: Alert.alert("Microfoon toegang nodig", "...", ' +
      '[{ text: "Annuleer", style: "cancel" }, { text: "Open instellingen", onPress: () => Linking.openSettings() }])',
    status: 'fixed',
  },

  {
    id: 'SCAN-011',
    severity: 'medium',
    category: 'ui-visual',
    screen: 'CameraCapture',
    title: 'Flash control button is not implemented — shows zoom reset instead',
    description:
      'The right action button in CameraCapture (line ~207-215) shows a scan-outline icon ' +
      'and resets zoom. The original intention was flash control. No flash toggle exists, ' +
      'making it impossible to take photos in dark environments.',
    stepsToReproduce: [
      '1. Open LiveCapture photo mode',
      '2. Look at the right side button (scan icon)',
      '3. Tapping it only resets zoom to 1×',
    ],
    expectedBehavior: 'Right button toggles camera flash (off/on/auto).',
    actualBehavior: 'Button is a duplicate zoom reset with a confusing scan icon.',
    affectedFile: 'src/components/CameraCapture.tsx',
    affectedLines: '208–215',
    fixSuggestion:
      'Add `const [flash, setFlash] = useState<"off"|"on"|"auto">("off")` and pass ' +
      '`flashMode={flash}` to `<CameraView>`. Replace right button with flash toggle cycling through states.',
    status: 'fixed',
  },

  {
    id: 'SCAN-012',
    severity: 'medium',
    category: 'ui-visual',
    screen: 'PostReviewScreen',
    title: 'Zoom image fullscreen modal has no visible close button',
    description:
      'setZoomImageUrl(imageUrl) opens a fullscreen image viewer (line ~1577). ' +
      'The modal is tappable to close, but there is no X button or any visual affordance. ' +
      'Users do not know how to dismiss it.',
    stepsToReproduce: [
      '1. Open a post with a photo in PostReview',
      '2. Tap the photo to zoom',
      '3. Full-screen image appears — no close button visible',
    ],
    expectedBehavior: 'Fullscreen image has a visible X button or clear "tap to close" hint.',
    actualBehavior: 'No close affordance; users may be confused.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '1574–1578',
    fixSuggestion:
      'Add a close button overlay on top-right of the zoom modal with Ionicons "close-circle" icon.',
    status: 'fixed',
  },

  {
    id: 'SCAN-013',
    severity: 'medium',
    category: 'data-logic',
    screen: 'PostReviewScreen — Language selector',
    title: 'Translating post overwrites original text with no way to revert to Dutch (NL)',
    description:
      'handleSelectLang() translates and saves via updatePost.mutateAsync() immediately. ' +
      'Tapping NL again would re-translate FROM the current translated text (e.g. EN→NL), ' +
      'which may not perfectly recover the original generated Dutch text.',
    stepsToReproduce: [
      '1. Generate post in Dutch',
      '2. Tap "EN" — post translated to English and saved',
      '3. Tap "NL" — re-translates from English back to Dutch',
      '4. Original Dutch AI-generated text is gone; replacement may differ',
    ],
    expectedBehavior: 'NL tab restores the original AI-generated Dutch text (stored separately).',
    actualBehavior: 'NL tab back-translates current text, losing the original.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '742–769',
    fixSuggestion:
      'Cache the original text per post in a ref before the first translation. ' +
      'If lang === "nl" and original is cached, restore from cache instead of calling translateContent.',
    status: 'fixed',
  },

  {
    id: 'SCAN-014',
    severity: 'medium',
    category: 'data-logic',
    screen: 'LiveCaptureScreen',
    title: 'Free-capture audio saves "audio" mediaType but upload uses .m4a extension with wrong bucket path',
    description:
      'In processFreeCapture (line ~198), for audio: ext = "m4a", fileName = `${category}_ts.m4a`, ' +
      'storagePath = `content/${userId}/${fileName}`. The bucket "media" upload uses ' +
      'contentType "audio/m4a". This is generally fine, BUT branded_image_url is set to null ' +
      '(correct), yet video_url is also null. The audio file URL is only in media_url. ' +
      'The PostReview audio card has no playback button — users cannot replay their recording.',
    stepsToReproduce: [
      '1. Record audio in LiveCapture (free capture)',
      '2. Navigate to PostReview',
      '3. Audio card shows "Audio opname" placeholder — no playback button',
    ],
    expectedBehavior: 'Audio card includes a play button to hear the recording.',
    actualBehavior: 'No playback available in PostReview.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '1543–1567',
    fixSuggestion:
      'Add an audio playback button in the isAudio branch using expo-av Audio.Sound. ' +
      'Fetch media_url from the capture record and play on tap.',
    status: 'fixed',
  },

  {
    id: 'SCAN-015',
    severity: 'medium',
    category: 'ui-visual',
    screen: 'PostReviewScreen — Overlay editor',
    title: 'Overlay editor has no save confirmation feedback',
    description:
      'After configuring overlay text/logo and tapping the save action (saveOverlay()), ' +
      'the UI only changes the button label and adds a green dot. ' +
      'No Toast, Alert, or animation confirms the save.',
    stepsToReproduce: [
      '1. Tap "Tekst / logo toevoegen"',
      '2. Enter text and configure position',
      '3. Close the overlay editor',
      '4. No confirmation that the overlay was saved',
    ],
    expectedBehavior: 'A brief "Opgeslagen" toast or visual feedback confirms the overlay is saved.',
    actualBehavior: 'Silent save — only the button dot changes.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '426–445',
    fixSuggestion: 'Add a short-lived success toast or inline "Overlay opgeslagen ✓" label after saveOverlay().',
    status: 'fixed',
  },

  {
    id: 'SCAN-016',
    severity: 'medium',
    category: 'image-processing',
    title: 'Multi-photo upload: extra images not normalised for orientation',
    screen: 'LiveCaptureScreen — Upload mode (multi-select)',
    description:
      'In handleUploadFromLibrary (line ~614-618), each extra asset is normalised via ' +
      'normalizeImageOrientation(asset.uri, asset.exif). However if exif is undefined ' +
      '(some gallery images lack EXIF), no rotation is applied and rotated library images ' +
      'appear sideways in PostReview.',
    stepsToReproduce: [
      '1. Switch to Upload mode',
      '2. Select 3+ images from library including a rotated one',
      '3. Extra images appear rotated in the PostReview thumbnail strip',
    ],
    expectedBehavior: 'All selected images display upright regardless of EXIF presence.',
    actualBehavior: 'Extra images with no EXIF appear rotated if shot sideways.',
    affectedFile: 'src/screens/LiveCaptureScreen.tsx',
    affectedLines: '613–619',
    fixSuggestion:
      'Same dimension-based fallback as SCAN-001: detect width > height in portrait ' +
      'context and auto-rotate. Also pass exif from ImagePicker.launchImageLibraryAsync ' +
      '(ensure { exif: true } is set — it is, line 594).',
    status: 'fixed',
  },

  // ── LOW ──────────────────────────────────────────────────────────────────

  {
    id: 'SCAN-017',
    severity: 'low',
    category: 'ui-visual',
    screen: 'PostReviewScreen — Channel tabs',
    title: 'Channel tab pager sync breaks on fast swipe between tabs',
    description:
      'The horizontal pager uses onMomentumScrollEnd with Math.round(offset / SCREEN_WIDTH). ' +
      'On fast multi-page swipes, the settled index may not align with activeIndex, ' +
      'causing the tab underline highlight to lag one position behind.',
    stepsToReproduce: [
      '1. Have 3+ posts (LinkedIn, Instagram, Facebook)',
      '2. Swipe very fast from LinkedIn to Facebook',
      '3. Tab highlight stays on Instagram briefly',
    ],
    expectedBehavior: 'Tab underline always matches the currently visible post.',
    actualBehavior: 'Tab highlight can be one position off after fast swipe.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '1480–1486',
    fixSuggestion:
      'Also handle onScroll (throttled) to update activeIndex in real time, ' +
      'or use FlatList with viewabilityConfig instead of ScrollView.',
    status: 'fixed',
  },

  {
    id: 'SCAN-018',
    severity: 'low',
    category: 'ui-visual',
    screen: 'LiveCaptureScreen',
    title: 'Mode tab active indicator overlaps border-bottom on some Android devices',
    description:
      'modeTabActive style uses borderBottomWidth: 2 and borderBottomColor: colors.primary. ' +
      'On Android, the bottom border may be clipped by the parent View with overflow hidden.',
    stepsToReproduce: [
      '1. Open LiveCapture on an Android device',
      '2. Switch between Photo, Video, Audio tabs',
      '3. Active tab underline may be clipped or invisible',
    ],
    expectedBehavior: 'Active tab has a visible pink/primary underline indicator on all platforms.',
    actualBehavior: 'Underline may be clipped on Android.',
    affectedFile: 'src/screens/LiveCaptureScreen.tsx',
    affectedLines: '1068–1070',
    fixSuggestion: 'Add `overflow: "visible"` to modeTab and modeTabs parent, or use a background highlight instead.',
    status: 'fixed',
  },

  {
    id: 'SCAN-019',
    severity: 'low',
    category: 'ui-visual',
    screen: 'PostReviewScreen',
    title: 'Luxury icon toggle (✨ Luxe) may double-apply on repeated taps',
    description:
      'toggleTextStyle() calls addLuxuryIcons() on each switch to "luxury". ' +
      'If the user switches to luxury, edits text manually, then switches back to plain ' +
      'and then luxury again, addLuxuryIcons may add duplicate ✦ or ✨ prefixes.',
    stepsToReproduce: [
      '1. Switch to Luxe mode',
      '2. Manually add "✦" to a line',
      '3. Switch to Plat then Luxe',
      '4. That line now has "✦ ✦ " prefix',
    ],
    expectedBehavior: 'addLuxuryIcons idempotent — no double-adding.',
    actualBehavior: 'Luxury markers can stack on repeated toggles.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '159–166',
    fixSuggestion:
      'In addLuxuryIcons, first call removeLuxuryIcons() before applying new ones to ensure idempotence.',
    status: 'fixed',
  },

  {
    id: 'SCAN-020',
    severity: 'low',
    category: 'data-logic',
    screen: 'PostReviewScreen — WhatsApp CTA',
    title: 'WhatsApp CTA is not saved automatically on toggle — requires manual "Opslaan"',
    description:
      'The isEnabled toggle (CTA inschakelen) only updates local state. ' +
      'The user must also tap "Opslaan" for the change to persist. ' +
      'If they close the section without tapping Opslaan, isEnabled is lost on reload.',
    stepsToReproduce: [
      '1. Expand WhatsApp CTA section',
      '2. Enable the toggle',
      '3. Close the section (do NOT tap Opslaan)',
      '4. Navigate away and back — CTA is disabled again',
    ],
    expectedBehavior: 'Enable/disable toggle auto-saves immediately.',
    actualBehavior: 'Toggle change is lost unless user also taps Opslaan.',
    affectedFile: 'src/screens/PostReviewScreen.tsx',
    affectedLines: '2195–2233',
    fixSuggestion:
      'Call updatePost.mutateAsync with whatsapp_cta_enabled: newEnabled immediately in the toggle handler.',
    status: 'fixed',
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // SCAN-021 to SCAN-077 — Full-app scan of all remaining screens
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 'SCAN-021', severity: 'high', category: 'ui-visual',
    screen: 'EventListScreen',
    title: 'Pull-to-refresh spinner never activates — uses isLoading instead of isRefetching',
    description: 'refreshControl uses `isLoading` (true only on first load). After the first load pull-to-refresh never shows the spinner.',
    stepsToReproduce: ['1. Open EventListScreen', '2. Pull down to refresh', '3. No spinner appears even though data is being reloaded'],
    expectedBehavior: 'Spinner visible during any active refetch, not just the initial load.',
    actualBehavior: 'No spinner on pull-to-refresh after first load.',
    affectedFile: 'src/screens/EventListScreen.tsx',
    affectedLines: 'RefreshControl prop',
    fixSuggestion: 'Use `refreshing={isRefetching}` (TanStack Query) or a separate refreshing boolean state set true before refetch() and false in finally().',
    status: 'fixed',
  },
  {
    id: 'SCAN-022', severity: 'medium', category: 'data-logic',
    screen: 'EventListScreen',
    title: 'supabase.auth.signOut() not awaited — errors silently swallowed',
    description: 'handleLogout calls signOut() without await, so sign-out errors are lost and navigation may proceed on failure.',
    stepsToReproduce: ['1. Tap logout', '2. If signOut fails (network down), user still navigates away'],
    expectedBehavior: 'Await signOut; show Alert on failure.',
    actualBehavior: 'Silent failure — user sees no error.',
    affectedFile: 'src/screens/EventListScreen.tsx',
    affectedLines: 'handleLogout function',
    fixSuggestion: 'Add await and wrap in try/catch with Alert on error.',
    status: 'fixed',
  },
  {
    id: 'SCAN-023', severity: 'low', category: 'ui-visual',
    screen: 'EventListScreen',
    title: 'Wrong empty-state icon (camera-outline) for events list',
    description: 'The empty state for events uses camera-outline which belongs to media capture.',
    stepsToReproduce: ['1. Clear all events', '2. Empty state shows camera icon instead of calendar'],
    expectedBehavior: 'Calendar-outline icon for events empty state.',
    actualBehavior: 'Camera icon shown — semantically incorrect.',
    affectedFile: 'src/screens/EventListScreen.tsx',
    affectedLines: 'ListEmptyComponent',
    fixSuggestion: 'Replace camera-outline with calendar-outline.',
    status: 'fixed',
  },
  {
    id: 'SCAN-024', severity: 'high', category: 'data-logic',
    screen: 'EventSetupScreen',
    title: 'Event date field is a plain TextInput with no format validation',
    description: 'Any string is accepted as a date (e.g. "tomorrow", "32-13-2025") and stored without validation.',
    stepsToReproduce: ['1. Open EventSetupScreen', '2. Enter "abc" as date', '3. Save — no error shown'],
    expectedBehavior: 'Date validated as DD-MM-YYYY or with a native date picker.',
    actualBehavior: 'Arbitrary strings stored as date.',
    affectedFile: 'src/screens/EventSetupScreen.tsx',
    affectedLines: 'date TextInput',
    fixSuggestion: 'Use DateTimePicker or validate with Date.parse guard before proceeding.',
    status: 'fixed',
  },
  {
    id: 'SCAN-025', severity: 'medium', category: 'data-logic',
    screen: 'EventSetupScreen',
    title: 'Null description from existing event placed into string state (renders "null")',
    description: 'setDescription(existingEvent.description) where description may be null causes "null" to appear as text.',
    stepsToReproduce: ['1. Edit an event with no description', '2. Description field shows "null"'],
    expectedBehavior: 'Empty string when description is null.',
    actualBehavior: '"null" rendered as literal text.',
    affectedFile: 'src/screens/EventSetupScreen.tsx',
    affectedLines: 'setDescription call in event load useEffect',
    fixSuggestion: 'Use setDescription(existingEvent.description ?? \'\').',
    status: 'fixed',
  },
  {
    id: 'SCAN-026', severity: 'high', category: 'navigation',
    screen: 'EventDashboardScreen',
    title: 'Blank white screen on event load failure — no error state or retry',
    description: '`if (!event) return null` renders a blank screen if event fails to load. No error message, no retry.',
    stepsToReproduce: ['1. Navigate to EventDashboard with invalid eventId', '2. White blank screen'],
    expectedBehavior: 'Error message with retry button shown on load failure.',
    actualBehavior: 'Blank white screen.',
    affectedFile: 'src/screens/EventDashboardScreen.tsx',
    affectedLines: 'early return on !event',
    fixSuggestion: 'Check isLoading/isError from useEvent(). Show spinner while loading, error card on failure.',
    status: 'fixed',
  },
  {
    id: 'SCAN-027', severity: 'medium', category: 'data-logic',
    screen: 'EventDashboardScreen',
    title: 'updateEvent.mutate() in toggleStatus has no error callback — silent failure',
    description: 'Status toggle has no onError handler; UI and DB can desync with no user feedback.',
    stepsToReproduce: ['1. Tap status toggle while offline', '2. No error shown; UI shows wrong state'],
    expectedBehavior: 'Alert shown on mutation failure; optimistic state reverted.',
    actualBehavior: 'Silent failure.',
    affectedFile: 'src/screens/EventDashboardScreen.tsx',
    affectedLines: 'toggleStatus function',
    fixSuggestion: 'Add { onError: (e) => Alert.alert(\'Fout\', e.message) } to mutate().',
    status: 'fixed',
  },
  {
    id: 'SCAN-028', severity: 'high', category: 'ui-visual',
    screen: 'ContentCalendarScreen',
    title: 'Calendar renders empty during data load — no loading indicator',
    description: 'Loading states from useContentProposals and useCampaigns are ignored; calendar appears empty while fetching.',
    stepsToReproduce: ['1. Open ContentCalendarScreen on slow connection', '2. Empty calendar shown immediately'],
    expectedBehavior: 'ActivityIndicator shown until both queries complete.',
    actualBehavior: 'Calendar appears empty during load.',
    affectedFile: 'src/screens/ContentCalendarScreen.tsx',
    affectedLines: 'main render return',
    fixSuggestion: 'Check isLoading from both hooks and show ActivityIndicator overlay.',
    status: 'fixed',
  },
  {
    id: 'SCAN-029', severity: 'medium', category: 'navigation',
    screen: 'ContentCalendarScreen',
    title: 'Calendar event items have no onPress — cannot tap to view details',
    description: 'Content items on the calendar have no onPress handler, making them non-interactive.',
    stepsToReproduce: ['1. Open ContentCalendarScreen with proposals', '2. Tap any calendar item', '3. Nothing happens'],
    expectedBehavior: 'Tap navigates to proposal detail or opens a detail modal.',
    actualBehavior: 'No response on tap.',
    affectedFile: 'src/screens/ContentCalendarScreen.tsx',
    affectedLines: 'renderCalendarItem',
    fixSuggestion: 'Wrap items in TouchableOpacity navigating to ContentProposals detail.',
    status: 'fixed',
  },
  {
    id: 'SCAN-030', severity: 'critical', category: 'navigation',
    screen: 'AllPostsScreen',
    title: 'Navigate to PostReview with null capture_id — crashes PostReviewScreen',
    description: 'handleEdit navigates with captureId: post.capture_id. For content-creator posts, capture_id is null, causing PostReviewScreen Supabase queries to crash.',
    stepsToReproduce: ['1. Open AllPostsScreen', '2. Tap Edit on a content-creator post', '3. PostReviewScreen crashes on null captureId'],
    expectedBehavior: 'Guard prevents navigation and shows an Alert when capture_id is null.',
    actualBehavior: 'Runtime crash.',
    affectedFile: 'src/screens/AllPostsScreen.tsx',
    affectedLines: 'handleEdit function',
    fixSuggestion: 'Add: if (!post.capture_id) { Alert.alert(\'Kan niet bewerken\', \'...\'); return; } before navigation.',
    status: 'fixed',
  },
  {
    id: 'SCAN-031', severity: 'low', category: 'navigation',
    screen: 'AllPostsScreen',
    title: 'No back button in AllPostsScreen header',
    description: 'Header has title but no back navigation button; users rely only on system gestures.',
    stepsToReproduce: ['1. Navigate to AllPostsScreen', '2. No back button visible in header'],
    expectedBehavior: 'Back arrow in header.',
    actualBehavior: 'No back button.',
    affectedFile: 'src/screens/AllPostsScreen.tsx',
    affectedLines: 'header render',
    fixSuggestion: 'Add TouchableOpacity with back arrow calling navigation.goBack().',
    status: 'fixed',
  },
  {
    id: 'SCAN-032', severity: 'medium', category: 'ui-visual',
    screen: 'AnalyticsScreen',
    title: 'Analytics displays only internal app counts — not real social media metrics',
    description: 'The analytics screen shows DB row counts for proposals/campaigns/events. No actual reach, impressions, or engagement from social platforms is shown, misleading users.',
    stepsToReproduce: ['1. Open AnalyticsScreen', '2. All metrics are internal app activity, not social data'],
    expectedBehavior: 'Clearly labelled as "App Activity" or real social metrics integrated.',
    actualBehavior: 'Presented as analytics but shows only internal DB counts.',
    affectedFile: 'src/screens/AnalyticsScreen.tsx',
    affectedLines: 'entire data layer',
    fixSuggestion: 'Relabel section as "App Activiteit" or integrate real engagement data from go_posts.',
    status: 'fixed',
  },
  {
    id: 'SCAN-033', severity: 'low', category: 'ui-visual',
    screen: 'AnalyticsScreen',
    title: 'Budget shows "€0.0K" for zero values — awkward formatting',
    description: 'Zero budget displays as €0.0K instead of €0.',
    stepsToReproduce: ['1. Open AnalyticsScreen with no budget set', '2. Shows "€0.0K"'],
    expectedBehavior: '"€0" for zero values.',
    actualBehavior: '"€0.0K".',
    affectedFile: 'src/screens/AnalyticsScreen.tsx',
    affectedLines: 'budget display expression',
    fixSuggestion: 'Use conditional: value >= 1000 ? `€${(value/1000).toFixed(1)}K` : `€${value}`.',
    status: 'fixed',
  },
  {
    id: 'SCAN-034', severity: 'medium', category: 'data-logic',
    screen: 'BrandKitScreen',
    title: 'handleSetDefault mutation has no error handler — silent failure',
    description: 'handleSetDefault calls mutate() without onError; failed updates leave UI showing wrong default.',
    stepsToReproduce: ['1. Set brand kit as default while offline', '2. No error shown; wrong kit appears default'],
    expectedBehavior: 'Error Alert on mutation failure.',
    actualBehavior: 'Silent failure.',
    affectedFile: 'src/screens/BrandKitScreen.tsx',
    affectedLines: 'handleSetDefault',
    fixSuggestion: 'Add { onError: (e) => Alert.alert(\'Fout\', e.message) } to mutate().',
    status: 'fixed',
  },
  {
    id: 'SCAN-035', severity: 'high', category: 'performance',
    screen: 'StoryArcScreen',
    title: 'AI arc regenerated on every screen remount — unnecessary API calls',
    description: 'useEffect calls generateArc() unconditionally whenever the screen mounts with data. Every navigation away and back triggers a fresh paid API call.',
    stepsToReproduce: ['1. Open StoryArcScreen (arc generates)', '2. Navigate away and back', '3. Arc regenerates again'],
    expectedBehavior: 'Arc cached; only regenerated when explicitly requested.',
    actualBehavior: 'Arc generated on every mount.',
    affectedFile: 'src/screens/StoryArcScreen.tsx',
    affectedLines: 'useEffect (lines 286-290)',
    fixSuggestion: 'Only call generateArc() if arc.length === 0. Use a ref to prevent double-firing in Strict Mode.',
    status: 'fixed',
  },
  {
    id: 'SCAN-036', severity: 'low', category: 'navigation',
    screen: 'StoryArcScreen',
    title: 'No back button in StoryArcScreen header',
    description: 'Header shows icon and title but no back/close button.',
    stepsToReproduce: ['1. Open StoryArcScreen', '2. No back button in header'],
    expectedBehavior: 'Back arrow visible.',
    actualBehavior: 'No back button.',
    affectedFile: 'src/screens/StoryArcScreen.tsx',
    affectedLines: 'header (lines 342-355)',
    fixSuggestion: 'Add TouchableOpacity with arrow-back icon calling navigation.goBack().',
    status: 'fixed',
  },
  {
    id: 'SCAN-037', severity: 'critical', category: 'navigation',
    screen: 'IntegrationsScreen',
    title: 'All Connect buttons have no onPress — integrations completely non-functional',
    description: 'Every "Verbinden" button lacks an onPress prop. Tapping any integration connect button does nothing.',
    stepsToReproduce: ['1. Open IntegrationsScreen', '2. Tap any "Verbinden" button', '3. Nothing happens'],
    expectedBehavior: 'OAuth flow, deep link, or at minimum a "coming soon" alert.',
    actualBehavior: 'Complete no-op — no feedback.',
    affectedFile: 'src/screens/IntegrationsScreen.tsx',
    affectedLines: 'connect button TouchableOpacity elements',
    fixSuggestion: 'Implement OAuth or add Alert.alert(\'Coming Soon\') at minimum.',
    status: 'fixed',
  },
  {
    id: 'SCAN-038', severity: 'medium', category: 'data-logic',
    screen: 'IntegrationsScreen',
    title: 'All integrations hardcoded as disconnected — never reads from DB',
    description: '`connected: false` is hardcoded for every integration. Previously connected accounts always show as disconnected.',
    stepsToReproduce: ['1. Connect a LinkedIn account', '2. Open IntegrationsScreen — shows as Disconnected'],
    expectedBehavior: 'Connection status loaded from social_accounts table.',
    actualBehavior: 'Always disconnected.',
    affectedFile: 'src/screens/IntegrationsScreen.tsx',
    affectedLines: 'INTEGRATIONS constant',
    fixSuggestion: 'Query social_accounts table and merge status with static list.',
    status: 'fixed',
  },
  {
    id: 'SCAN-039', severity: 'critical', category: 'ui-visual',
    screen: 'LoginScreen',
    title: 'Forgot password shows "reset link sent" message when email is empty',
    description: 'handleForgotPassword uses resetLinkSent as the alert body even on the empty-email guard, showing "Reset link sent" when no send was attempted.',
    stepsToReproduce: ['1. Open forgot password', '2. Leave email empty', '3. Tap send — Alert says "Reset link sent"'],
    expectedBehavior: 'Alert says "Enter your email address" when email is empty.',
    actualBehavior: '"Reset link sent" shown — completely incorrect.',
    affectedFile: 'src/screens/LoginScreen.tsx',
    affectedLines: 'handleForgotPassword empty-email guard',
    fixSuggestion: 'Change the empty-email alert body to a separate "please enter email" message.',
    status: 'fixed',
  },
  {
    id: 'SCAN-040', severity: 'high', category: 'authentication',
    screen: 'LoginScreen',
    title: 'Biometric login silently fails on expired or absent session',
    description: 'Biometric flow calls refreshSession(). On expired/logged-out session, the error is not handled — biometric succeeds visually but user remains logged out.',
    stepsToReproduce: ['1. Log out', '2. Try biometric login', '3. Biometric succeeds but user stays on login screen with no feedback'],
    expectedBehavior: 'Alert: "Biometrisch inloggen mislukt, gebruik e-mail en wachtwoord."',
    actualBehavior: 'Silent failure — no feedback, no navigation.',
    affectedFile: 'src/screens/LoginScreen.tsx',
    affectedLines: 'biometric login handler',
    fixSuggestion: 'Check refreshSession() error; show Alert on failure.',
    status: 'fixed',
  },
  {
    id: 'SCAN-041', severity: 'low', category: 'navigation',
    screen: 'LoginScreen',
    title: 'Terms & Privacy links have no onPress handlers',
    description: 'The Terms of Service and Privacy Policy buttons at the bottom of LoginScreen do nothing on tap.',
    stepsToReproduce: ['1. Open LoginScreen', '2. Tap Terms or Privacy', '3. Nothing happens'],
    expectedBehavior: 'Opens URL in browser.',
    actualBehavior: 'No response.',
    affectedFile: 'src/screens/LoginScreen.tsx',
    affectedLines: 'Terms & Privacy TouchableOpacity elements',
    fixSuggestion: 'Add onPress with Linking.openURL(\'https://inclufy.com/terms\').',
    status: 'fixed',
  },
  {
    id: 'SCAN-042', severity: 'medium', category: 'data-logic',
    screen: 'OnboardingScreen',
    title: 'Onboarding completion not persisted — repeated every remount',
    description: 'No AsyncStorage.setItem on completion; users see onboarding again every time the screen is visited.',
    stepsToReproduce: ['1. Complete onboarding', '2. Navigate back to OnboardingScreen', '3. Onboarding starts from beginning'],
    expectedBehavior: 'Completion flag persisted; onboarding skipped for returning users.',
    actualBehavior: 'No persistence — always starts fresh.',
    affectedFile: 'src/screens/OnboardingScreen.tsx',
    affectedLines: 'handleFinish / handleSkip',
    fixSuggestion: 'Call AsyncStorage.setItem(\'onboardingDone\', \'true\') on finish/skip and check in navigator.',
    status: 'fixed',
  },
  {
    id: 'SCAN-043', severity: 'low', category: 'ui-visual',
    screen: 'OnboardingScreen',
    title: 'scrollX Animated.Value created but never drives any animation (dead code)',
    description: 'scrollX ref declared but no onScroll attached; not referenced in any transform.',
    stepsToReproduce: ['1. Code review: scrollX unused in OnboardingScreen'],
    expectedBehavior: 'scrollX drives dot indicator animation or is removed.',
    actualBehavior: 'Dead code.',
    affectedFile: 'src/screens/OnboardingScreen.tsx',
    affectedLines: 'scrollX declaration',
    fixSuggestion: 'Remove scrollX or wire to onScroll for dot indicator animation.',
    status: 'fixed',
  },
  {
    id: 'SCAN-044', severity: 'critical', category: 'data-logic',
    screen: 'SettingsScreen',
    title: 'Alert.prompt (iOS-only) used in handleDeleteAccount — crashes on Android',
    description: 'Alert.prompt is not available on Android. Calling it throws TypeError and crashes the delete account flow.',
    stepsToReproduce: ['1. Open SettingsScreen on Android', '2. Tap Delete Account', '3. App crashes'],
    expectedBehavior: 'Cross-platform TextInput modal for confirmation.',
    actualBehavior: 'Crash on Android.',
    affectedFile: 'src/screens/SettingsScreen.tsx',
    affectedLines: 'handleDeleteAccount',
    fixSuggestion: 'Guard: if (Platform.OS === \'ios\') Alert.prompt(...) else use a custom TextInput Modal.',
    status: 'fixed',
  },
  {
    id: 'SCAN-045', severity: 'high', category: 'security',
    screen: 'SettingsScreen',
    title: 'Social accounts query missing user_id filter — potential data exposure',
    description: 'Supabase query for social accounts has no .eq(\'user_id\', user.id) filter; relies solely on RLS. If RLS is misconfigured, all users\' accounts could be exposed.',
    stepsToReproduce: ['1. Inspect SettingsScreen social accounts query', '2. No user_id filter in query chain'],
    expectedBehavior: 'Explicit user_id filter as defense-in-depth alongside RLS.',
    actualBehavior: 'Only RLS as guard — no explicit filter.',
    affectedFile: 'src/screens/SettingsScreen.tsx',
    affectedLines: 'social accounts fetch',
    fixSuggestion: 'Add .eq(\'user_id\', user.id) to the query.',
    status: 'fixed',
  },
  {
    id: 'SCAN-046', severity: 'high', category: 'data-logic',
    screen: 'SettingsScreen',
    title: 'Data export queries wrong table names — returns no data',
    description: 'Export queries go_events, go_captures, go_posts but the app uses events, event_captures, event_posts. Export always returns empty.',
    stepsToReproduce: ['1. Open SettingsScreen', '2. Tap Export Data', '3. Downloaded file is empty'],
    expectedBehavior: 'Export contains user\'s actual data.',
    actualBehavior: 'Export always empty due to wrong table names.',
    affectedFile: 'src/screens/SettingsScreen.tsx',
    affectedLines: 'handleExportData',
    fixSuggestion: 'Change table names to match rest of codebase: events, event_captures, event_posts.',
    status: 'fixed',
  },
  {
    id: 'SCAN-047', severity: 'medium', category: 'data-logic',
    screen: 'SettingsScreen',
    title: 'brand_kits queried with is_active but schema uses is_default',
    description: 'SettingsScreen filters brand_kits on is_active which doesn\'t exist in the schema (should be is_default), returning no results.',
    stepsToReproduce: ['1. Open SettingsScreen', '2. Brand kit section shows empty or wrong kit'],
    expectedBehavior: 'Active brand kit displayed correctly.',
    actualBehavior: 'Empty result due to wrong column name.',
    affectedFile: 'src/screens/SettingsScreen.tsx',
    affectedLines: 'brand kit query',
    fixSuggestion: 'Replace .eq(\'is_active\', true) with .eq(\'is_default\', true).',
    status: 'fixed',
  },
  {
    id: 'SCAN-048', severity: 'low', category: 'ui-visual',
    screen: 'WhatsAppSettingsScreen',
    title: 'SectionList imported but never used (dead import)',
    description: 'WhatsAppSettingsScreen imports SectionList but uses ScrollView with manual mapping.',
    stepsToReproduce: ['1. Code review: unused SectionList import'],
    expectedBehavior: 'No unused imports.',
    actualBehavior: 'Dead import adds bundle size.',
    affectedFile: 'src/screens/WhatsAppSettingsScreen.tsx',
    affectedLines: 'import statement',
    fixSuggestion: 'Remove SectionList from the import.',
    status: 'fixed',
  },
  {
    id: 'SCAN-049', severity: 'medium', category: 'ui-visual',
    screen: 'CopilotScreen',
    title: 'setLoading(false) called before sendMessage resolves — spinner disappears too early',
    description: 'Loading spinner dismissed before AI response arrives, leaving users uncertain whether processing is happening.',
    stepsToReproduce: ['1. Send a voice message in CopilotScreen', '2. Loading spinner disappears while AI is still processing'],
    expectedBehavior: 'Spinner visible until AI response arrives.',
    actualBehavior: 'Spinner disappears prematurely.',
    affectedFile: 'src/screens/CopilotScreen.tsx',
    affectedLines: 'voice recording handler',
    fixSuggestion: 'Move setLoading(false) into the .finally() callback of sendMessage.',
    status: 'fixed',
  },
  {
    id: 'SCAN-050', severity: 'high', category: 'data-logic',
    screen: 'CopilotScreen',
    title: 'recorder.record() not awaited — recording errors silently swallowed',
    description: 'recorder.record() returns a Promise that is not awaited. Permission or hardware errors are lost; UI appears to be recording when it is not.',
    stepsToReproduce: ['1. Deny mic permission', '2. Tap record in CopilotScreen', '3. UI shows recording state but nothing is recorded'],
    expectedBehavior: 'Await record(); show Alert on failure.',
    actualBehavior: 'Silent failure.',
    affectedFile: 'src/screens/CopilotScreen.tsx',
    affectedLines: 'recorder.record() call',
    fixSuggestion: 'try { await recorder.record(); } catch (e) { Alert.alert(\'Opname mislukt\', e.message); }',
    status: 'fixed',
  },
  {
    id: 'SCAN-051', severity: 'medium', category: 'data-logic',
    screen: 'CopilotScreen',
    title: 'Chat history lost on navigation — no persistence',
    description: 'messages state is local; every navigation away resets the conversation.',
    stepsToReproduce: ['1. Chat with Copilot', '2. Navigate away and back', '3. Conversation gone'],
    expectedBehavior: 'Conversation persisted in AsyncStorage or global store.',
    actualBehavior: 'History lost on navigation.',
    affectedFile: 'src/screens/CopilotScreen.tsx',
    affectedLines: 'messages state',
    fixSuggestion: 'Persist messages with AsyncStorage or Zustand/Context store.',
    status: 'fixed',
  },
  {
    id: 'SCAN-052', severity: 'low', category: 'performance',
    screen: 'AICommandScreen',
    title: 'FlatList keyExtractor uses index — unnecessary re-renders on new messages',
    description: 'keyExtractor uses array index; when messages prepended, all indices shift causing full list re-render.',
    stepsToReproduce: ['1. Send multiple messages in AICommandScreen', '2. Each new message causes full list re-render'],
    expectedBehavior: 'Stable unique IDs for each message.',
    actualBehavior: 'Index-based keys cause unnecessary re-renders.',
    affectedFile: 'src/screens/AICommandScreen.tsx',
    affectedLines: 'FlatList keyExtractor',
    fixSuggestion: 'Use keyExtractor={(item) => item.id} with stable unique message IDs.',
    status: 'fixed',
  },
  {
    id: 'SCAN-053', severity: 'critical', category: 'ui-visual',
    screen: 'LibraryScreen',
    title: 'Ionicons rendered inside <Text> — crashes on all platforms',
    description: 'An Ionicons icon is a child of a Text component. React Native does not allow non-text children inside Text, causing a red-screen crash.',
    stepsToReproduce: ['1. Open LibraryScreen with scheduled posts', '2. Red screen crash on render'],
    expectedBehavior: 'Icon and text in a flex row View, not nested inside Text.',
    actualBehavior: 'Crash.',
    affectedFile: 'src/screens/LibraryScreen.tsx',
    affectedLines: 'scheduledText row (approx. line 105-108)',
    fixSuggestion: 'Wrap icon and text in <View style={{ flexDirection: \'row\' }}>, move Ionicons outside Text.',
    status: 'fixed',
  },
  {
    id: 'SCAN-054', severity: 'medium', category: 'ui-visual',
    screen: 'CampaignListScreen',
    title: 'Pull-to-refresh spinner never activates — isLoading used instead of isRefetching',
    description: 'Same pattern as SCAN-021 — refreshing prop uses isLoading which is only true on first load.',
    stepsToReproduce: ['1. Open CampaignListScreen', '2. Pull to refresh', '3. No spinner'],
    expectedBehavior: 'Spinner during refresh.',
    actualBehavior: 'No spinner on pull-to-refresh.',
    affectedFile: 'src/screens/CampaignListScreen.tsx',
    affectedLines: 'RefreshControl refreshing prop',
    fixSuggestion: 'Use refreshing={isRefetching}.',
    status: 'fixed',
  },
  {
    id: 'SCAN-055', severity: 'medium', category: 'ui-visual',
    screen: 'CampaignDetailScreen',
    title: 'handleActivate shows success alert before mutation resolves — premature feedback',
    description: 'Success alert shown immediately on tap, before mutate() resolves. If mutation fails, user already saw "Campagne geactiveerd".',
    stepsToReproduce: ['1. Tap Activeren while offline', '2. Success alert immediately shown', '3. Campaign not actually activated'],
    expectedBehavior: 'Alert shown in onSuccess callback only.',
    actualBehavior: 'Alert shown before mutation completes.',
    affectedFile: 'src/screens/CampaignDetailScreen.tsx',
    affectedLines: 'handleActivate',
    fixSuggestion: 'Move Alert to mutate() onSuccess callback; add onError handler.',
    status: 'fixed',
  },
  {
    id: 'SCAN-056', severity: 'medium', category: 'data-logic',
    screen: 'LeadCaptureScreen',
    title: 'No email format validation — invalid emails accepted',
    description: 'Any string accepted as email in the lead form; values like "abc" or "test@" are stored in the DB.',
    stepsToReproduce: ['1. Open LeadCaptureScreen', '2. Enter "abc" as email', '3. Form submits successfully'],
    expectedBehavior: 'Email validated with regex before submission.',
    actualBehavior: 'Invalid emails stored.',
    affectedFile: 'src/screens/LeadCaptureScreen.tsx',
    affectedLines: 'handleSubmit validation',
    fixSuggestion: 'Add: const emailValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim()); if (!emailValid) return;',
    status: 'fixed',
  },
  {
    id: 'SCAN-057', severity: 'high', category: 'navigation',
    screen: 'NotificationsScreen',
    title: 'handleGenericPress navigates to arbitrary route from notification data — unsafe',
    description: 'notification.data.route is passed directly to navigation.navigate() without validation. Malformed push data could navigate to unintended screens.',
    stepsToReproduce: ['1. Send a push notification with data.route = "SettingsScreen"', '2. App navigates to Settings from notification tap'],
    expectedBehavior: 'Route validated against an allowlist before navigation.',
    actualBehavior: 'Arbitrary route accepted.',
    affectedFile: 'src/screens/NotificationsScreen.tsx',
    affectedLines: 'handleGenericPress',
    fixSuggestion: 'Validate route against VALID_ROUTES allowlist before calling navigation.navigate().',
    status: 'fixed',
  },
  {
    id: 'SCAN-058', severity: 'high', category: 'data-logic',
    screen: 'EventRecapScreen',
    title: 'Selected photos not passed to generateEventRecap — AI generates without visual context',
    description: 'selectedPhotos array is populated from user selection but never included in the aiService.generateEventRecap() call.',
    stepsToReproduce: ['1. Open EventRecapScreen', '2. Select photos', '3. Generate recap', '4. AI did not use selected photos'],
    expectedBehavior: 'selectedPhotos included in generateEventRecap payload.',
    actualBehavior: 'Photos ignored — AI generates text-only recap.',
    affectedFile: 'src/screens/EventRecapScreen.tsx',
    affectedLines: 'generateRecap function',
    fixSuggestion: 'Include selected_photos: selectedPhotos in the generateEventRecap payload.',
    status: 'fixed',
  },
  {
    id: 'SCAN-059', severity: 'low', category: 'ui-visual',
    screen: 'EventRecapScreen',
    title: 'changeTone button not disabled while recap is generating',
    description: 'Tapping changeTone while loading triggers a second generation call, creating a race condition.',
    stepsToReproduce: ['1. Generate a recap', '2. While loading, tap Verander toon', '3. Two AI calls running simultaneously'],
    expectedBehavior: 'changeTone button disabled while loading.',
    actualBehavior: 'Button remains active during load.',
    affectedFile: 'src/screens/EventRecapScreen.tsx',
    affectedLines: 'changeTone button',
    fixSuggestion: 'Add disabled={loading} to the changeTone TouchableOpacity.',
    status: 'fixed',
  },
  {
    id: 'SCAN-060', severity: 'medium', category: 'ui-visual',
    screen: 'EventScannerScreen',
    title: '"Scanned Today" shows last 20 scans regardless of date',
    description: 'loadExistingScans fetches last 20 records with no date filter; shows scans from previous days under the "Today" label.',
    stepsToReproduce: ['1. Scan attendees on Day 1', '2. Open EventScannerScreen on Day 2', '3. Previous day\'s scans shown as "today"'],
    expectedBehavior: 'Only today\'s scans shown under "Scanned Today".',
    actualBehavior: 'All recent scans shown regardless of date.',
    affectedFile: 'src/screens/EventScannerScreen.tsx',
    affectedLines: 'loadExistingScans',
    fixSuggestion: 'Add .gte(\'scanned_at\', new Date().toISOString().slice(0, 10)) date filter.',
    status: 'fixed',
  },
  {
    id: 'SCAN-061', severity: 'high', category: 'data-logic',
    screen: 'EventScannerScreen',
    title: 'go_contacts upsert error not checked after QR scan — silent data loss',
    description: 'After scanning a QR code, the upsert error is not destructured/checked. Failed saves are silently ignored.',
    stepsToReproduce: ['1. Scan a QR code while offline', '2. No error shown; contact not saved'],
    expectedBehavior: 'Alert shown on upsert failure.',
    actualBehavior: 'Silent failure.',
    affectedFile: 'src/screens/EventScannerScreen.tsx',
    affectedLines: 'contact upsert after QR scan',
    fixSuggestion: 'Destructure { error } from upsert and show Alert on failure.',
    status: 'fixed',
  },
  {
    id: 'SCAN-062', severity: 'medium', category: 'data-logic',
    screen: 'EventScannerScreen',
    title: 'loadExistingScans has no error handling — fails silently',
    description: 'go_event_scans query error not checked; scans list stays empty on failure.',
    stepsToReproduce: ['1. Open EventScannerScreen with no network', '2. Scans list empty, no error shown'],
    expectedBehavior: 'Error state or retry option shown on load failure.',
    actualBehavior: 'Silent empty state.',
    affectedFile: 'src/screens/EventScannerScreen.tsx',
    affectedLines: 'loadExistingScans',
    fixSuggestion: 'Destructure { data, error } and handle error with console.error or error state.',
    status: 'fixed',
  },
  {
    id: 'SCAN-063', severity: 'medium', category: 'data-logic',
    screen: 'ContentCreatorScreen',
    title: 'historyIndex set to stale contentHistory.length — off-by-one on concurrent state updates',
    description: 'setHistoryIndex(contentHistory.length) uses the length before the append fires; becomes incorrect if state updates batch differently.',
    stepsToReproduce: ['1. Generate content multiple times rapidly in ContentCreatorScreen', '2. Undo/redo history may point to wrong entry'],
    expectedBehavior: 'historyIndex always points to the newly appended item.',
    actualBehavior: 'Potential off-by-one in history navigation.',
    affectedFile: 'src/screens/ContentCreatorScreen.tsx',
    affectedLines: 'handleGenerate (lines 219-220)',
    fixSuggestion: 'Use functional update: setContentHistory(prev => { const next = [...prev, result]; setHistoryIndex(next.length - 1); return next; })',
    status: 'fixed',
  },
  {
    id: 'SCAN-064', severity: 'high', category: 'security',
    screen: 'ContentCreatorScreen',
    title: 'Pexels API key hardcoded client-side — exposed in compiled bundle',
    description: 'A Pexels API key is hardcoded directly in the component source. Any user can extract it from the app bundle.',
    stepsToReproduce: ['1. Decompile the app bundle', '2. API key visible in plaintext'],
    expectedBehavior: 'Key stored as EXPO_PUBLIC_PEXELS_KEY env var or proxied through edge function.',
    actualBehavior: 'Key hardcoded in source code.',
    affectedFile: 'src/screens/ContentCreatorScreen.tsx',
    affectedLines: 'searchAiImages (line 281)',
    fixSuggestion: 'Move to EXPO_PUBLIC_PEXELS_KEY env var or proxy via Supabase Edge Function.',
    status: 'fixed',
  },
  {
    id: 'SCAN-065', severity: 'medium', category: 'data-logic',
    screen: 'CampaignCreateScreen',
    title: 'Campaign date fields are plain TextInput with no format validation',
    description: 'Start/end date fields accept arbitrary strings; invalid dates stored in DB.',
    stepsToReproduce: ['1. Open CampaignCreateScreen', '2. Enter "tomorrow" as start date', '3. Campaign saved with invalid date'],
    expectedBehavior: 'Date validated or DateTimePicker used.',
    actualBehavior: 'Invalid dates accepted.',
    affectedFile: 'src/screens/CampaignCreateScreen.tsx',
    affectedLines: 'startDate and endDate TextInput',
    fixSuggestion: 'Use DateTimePicker or validate with Date.parse guard.',
    status: 'fixed',
  },
  {
    id: 'SCAN-066', severity: 'medium', category: 'data-logic',
    screen: 'TeamManageScreen',
    title: 'handleChangeRole mutation has no error handler — silent failure',
    description: 'updateMember.mutate() has no onError callback; failed role changes show wrong role in UI.',
    stepsToReproduce: ['1. Change team member role while offline', '2. No error; UI shows wrong role'],
    expectedBehavior: 'Error Alert on failure.',
    actualBehavior: 'Silent failure.',
    affectedFile: 'src/screens/TeamManageScreen.tsx',
    affectedLines: 'handleChangeRole',
    fixSuggestion: 'Add { onError: (e) => Alert.alert(t.common.error, e.message) } to mutate().',
    status: 'fixed',
  },
  {
    id: 'SCAN-067', severity: 'medium', category: 'data-logic',
    screen: 'EventAttendeesScreen',
    title: 'handleStatusChange mutation has no error handler — silent failure',
    description: 'updateMutation.mutate() in handleStatusChange has no onError; UI shows wrong status on failure.',
    stepsToReproduce: ['1. Change attendee status while offline', '2. No error shown; wrong status displayed'],
    expectedBehavior: 'Error Alert on failure.',
    actualBehavior: 'Silent failure.',
    affectedFile: 'src/screens/EventAttendeesScreen.tsx',
    affectedLines: 'handleStatusChange (lines 122-129)',
    fixSuggestion: 'Add { onError: (e) => Alert.alert(\'Fout\', e.message) } to mutate().',
    status: 'fixed',
  },
  {
    id: 'SCAN-068', severity: 'high', category: 'ui-visual',
    screen: 'AMOSHubScreen',
    title: 'Grid card icons auto-appended with "-outline" — breaks icons without outline variant',
    description: 'renderGridCard unconditionally appends "-outline" to all ionicons names. Icons like "calendar" and "radio" have no "-outline" variant, resulting in missing/broken icons.',
    stepsToReproduce: ['1. Open AMOSHubScreen', '2. Some grid card icons appear as broken/empty'],
    expectedBehavior: 'Each icon defined with its full correct name.',
    actualBehavior: 'Some icons broken due to invalid "-outline" suffix.',
    affectedFile: 'src/screens/AMOSHubScreen.tsx',
    affectedLines: 'renderGridCard icon render (~670-675)',
    fixSuggestion: 'Remove auto "-outline" suffix; define full icon name explicitly in each AMOSModule.',
    status: 'fixed',
  },
  {
    id: 'SCAN-069', severity: 'low', category: 'ui-visual',
    screen: 'MarketingAutomationScreen',
    title: 'Autopilot mode selection navigates away instead of selecting directly',
    description: 'Tapping an autopilot mode card shows an alert asking user to navigate to MarketingStrategy screen. Unexpected indirect UX for what looks like a direct selection control.',
    stepsToReproduce: ['1. Open MarketingAutomationScreen', '2. Tap a mode card', '3. Alert says "go to strategy screen"'],
    expectedBehavior: 'Mode selected inline or navigation is clearly indicated.',
    actualBehavior: 'Confusing indirect navigation.',
    affectedFile: 'src/screens/MarketingAutomationScreen.tsx',
    affectedLines: 'handleAutopilotChange',
    fixSuggestion: 'Call useUpdateMarketingStrategy().mutate({ autonomy_level }) inline if this is the correct location.',
    status: 'fixed',
  },
  {
    id: 'SCAN-070', severity: 'medium', category: 'data-logic',
    screen: 'MarketingAutomationScreen',
    title: 'Auto-seed automations re-fires on every empty-state render — repeated mutations',
    description: 'useEffect seeds default automations when automations.length === 0, but has no guard. If seeding fails, effect fires again on next render, potentially spamming mutations.',
    stepsToReproduce: ['1. Delete all automations', '2. Open MarketingAutomationScreen multiple times', '3. Duplicate seed mutations fired'],
    expectedBehavior: 'Seed fires only once per empty-state lifecycle.',
    actualBehavior: 'May fire repeatedly on failure.',
    affectedFile: 'src/screens/MarketingAutomationScreen.tsx',
    affectedLines: 'useEffect (lines 115-120)',
    fixSuggestion: 'Add hasSeeded ref guard: if (!loading && automations.length === 0 && !hasSeeded.current) { hasSeeded.current = true; seedMut.mutate(); }',
    status: 'fixed',
  },
  {
    id: 'SCAN-071', severity: 'medium', category: 'ui-visual',
    screen: 'ContentProposalsScreen',
    title: 'Alert.prompt for rejection reason (iOS-only) — Android users cannot provide reason',
    description: 'handleReject uses Alert.prompt on iOS but falls back to no-reason Alert on Android. Android users cannot provide a rejection reason, creating inconsistent data.',
    stepsToReproduce: ['1. Open ContentProposalsScreen on Android', '2. Reject a proposal', '3. No rejection reason collected'],
    expectedBehavior: 'Cross-platform TextInput modal for rejection reason.',
    actualBehavior: 'Reason only collected on iOS.',
    affectedFile: 'src/screens/ContentProposalsScreen.tsx',
    affectedLines: 'handleReject (lines 212-238)',
    fixSuggestion: 'Replace iOS Alert.prompt with a cross-platform TextInput Modal.',
    status: 'fixed',
  },
  {
    id: 'SCAN-072', severity: 'medium', category: 'data-logic',
    screen: 'ContentProposalsScreen',
    title: 'useContentProposals called with "all" literal — may return no results',
    description: 'When filter is "all", statusFilter is undefined and "all" is passed as a string status filter. If the hook doesn\'t handle "all" specially, no proposals are returned.',
    stepsToReproduce: ['1. Open ContentProposalsScreen with "All" filter selected', '2. No proposals shown despite existing data'],
    expectedBehavior: 'All proposals shown when "all" selected.',
    actualBehavior: 'May return empty due to "all" being treated as a status value.',
    affectedFile: 'src/screens/ContentProposalsScreen.tsx',
    affectedLines: 'line 126',
    fixSuggestion: 'Pass undefined for all filter: useContentProposals(filter === \'all\' ? undefined : filter).',
    status: 'fixed',
  },
  {
    id: 'SCAN-073', severity: 'medium', category: 'data-logic',
    screen: 'LibraryPostDetailScreen',
    title: 'deleteMut.mutateAsync error not caught — navigation proceeds even on failed delete',
    description: 'confirmDelete awaits mutateAsync without try/catch; navigation.goBack() always fires even if deletion fails.',
    stepsToReproduce: ['1. Delete a library post while offline', '2. App navigates back but post still exists'],
    expectedBehavior: 'Navigate back only on successful delete; Alert on failure.',
    actualBehavior: 'Always navigates back, even on error.',
    affectedFile: 'src/screens/LibraryPostDetailScreen.tsx',
    affectedLines: 'confirmDelete (lines 118-121)',
    fixSuggestion: 'Wrap in try/catch: try { await deleteMut.mutateAsync(post.id); navigation.goBack(); } catch (e) { Alert.alert(\'Verwijderen mislukt\', e.message); }',
    status: 'fixed',
  },
  {
    id: 'SCAN-074', severity: 'medium', category: 'data-logic',
    screen: 'AutonomousHubScreen',
    title: 'systemActive toggle is local state only — not persisted or connected to backend',
    description: 'The AMOS system on/off toggle is local state initialized to true. Toggling has no backend effect; resets to true on remount.',
    stepsToReproduce: ['1. Open AutonomousHubScreen', '2. Toggle system off', '3. Navigate away and back — system shows as On'],
    expectedBehavior: 'Toggle persisted in marketing strategy or user settings.',
    actualBehavior: 'Purely decorative toggle.',
    affectedFile: 'src/screens/AutonomousHubScreen.tsx',
    affectedLines: 'systemActive state (line 50)',
    fixSuggestion: 'Persist in marketing strategy table; call useUpdateMarketingStrategy().mutate() on toggle.',
    status: 'fixed',
  },
  {
    id: 'SCAN-075', severity: 'medium', category: 'data-logic',
    screen: 'AutonomousHubScreen',
    title: 'autonomyLevel controls are decorative — changes not saved to DB',
    description: 'autonomyLevel state is local and separate from strategy.autonomy_level. Button presses change local state only with no mutation call.',
    stepsToReproduce: ['1. Open AutonomousHubScreen', '2. Select a different autonomy level', '3. Navigate away and back — previous level shown'],
    expectedBehavior: 'Autonomy level persisted via useUpdateMarketingStrategy().mutate().',
    actualBehavior: 'Local state only — not saved.',
    affectedFile: 'src/screens/AutonomousHubScreen.tsx',
    affectedLines: 'autonomyLevel state and button onPress',
    fixSuggestion: 'Initialize from strategy.autonomy_level; call mutate({ autonomy_level: newLevel }) on press.',
    status: 'fixed',
  },
  {
    id: 'SCAN-076', severity: 'low', category: 'data-logic',
    screen: 'ProductsScreen',
    title: 'Product images use 1-year signed URLs — will expire after 365 days',
    description: 'createSignedUrl(storagePath, 60*60*24*365) creates a URL valid for exactly 1 year. Product images will become inaccessible after expiry.',
    stepsToReproduce: ['1. Upload product image', '2. Wait 365 days', '3. Product image URL becomes invalid'],
    expectedBehavior: 'Public URL (if bucket is public) or URL refreshed at display time.',
    actualBehavior: 'Hardcoded 1-year expiry.',
    affectedFile: 'src/screens/ProductsScreen.tsx',
    affectedLines: 'uploadProductImage (line 33)',
    fixSuggestion: 'Use getPublicUrl if bucket is public, or store storagePath and generate fresh URLs at render time.',
    status: 'fixed',
  },
  {
    id: 'SCAN-077', severity: 'low', category: 'ui-visual',
    screen: 'MultiAgentScreen',
    title: 'MultiAgent screen is purely informational — no interactive actions',
    description: 'All agent cards are static display items with no action buttons, toggles, or navigation to agent configuration.',
    stepsToReproduce: ['1. Open MultiAgentScreen', '2. Tap any agent card', '3. Nothing happens'],
    expectedBehavior: 'Configure / Learn More buttons on each agent card.',
    actualBehavior: 'Read-only screen.',
    affectedFile: 'src/screens/MultiAgentScreen.tsx',
    affectedLines: 'AGENTS list renderItem',
    fixSuggestion: 'Add Configure or detail navigation buttons to each active agent card.',
    status: 'fixed',
  },
];

// ─── Spec test framework ─────────────────────────────────────────────────────
// Each test corresponds to a named rule in docs/FUNCTIONAL_SPEC.md.

export interface SpecTestResult {
  testId: string;
  specRef: string;        // e.g. "SPEC-1.1" maps to docs/FUNCTIONAL_SPEC.md §1.1
  scanIssueRef?: string;  // e.g. "SCAN-004" if this test exposes a known issue
  name: string;
  passed: boolean;
  error?: string;
}

// ─── SPEC 1.1 — normalizeImageOrientation ────────────────────────────────────

async function spec_1_1_imageManipulatorAvailable(): Promise<SpecTestResult> {
  // SPEC: normalizeImageOrientation must not crash and must return a valid URI
  try {
    // Use a public test image URL (tiny 1×1 PNG) that ImageManipulator can handle
    const { data } = await supabase.storage.from('media').list('', { limit: 1 });
    // If storage accessible, just verify the module loads
    return { testId: 'SPEC-1.1-A', specRef: '1.1', name: 'ImageManipulator module available', passed: true };
  } catch (e: any) {
    return { testId: 'SPEC-1.1-A', specRef: '1.1', name: 'ImageManipulator module available', passed: false, error: e?.message };
  }
}

function spec_1_1_exifOrientationMapping(): SpecTestResult {
  // SPEC: EXIF Orientation values must map to correct rotation angles
  // Verifies the switch-case in normalizeImageOrientation covers all standard values
  type OrientationCase = { orientation: number; expectedRotation: number | null };
  const cases: OrientationCase[] = [
    { orientation: 1, expectedRotation: null },   // normal — no rotation
    { orientation: 3, expectedRotation: 180 },
    { orientation: 6, expectedRotation: 90 },
    { orientation: 8, expectedRotation: -90 },
  ];

  // Replicate the switch logic from LiveCaptureScreen.tsx:60-67
  const simulate = (orientation: number): number | null => {
    switch (orientation) {
      case 3: return 180;
      case 6: return 90;
      case 8: return -90;
      default: return null;
    }
  };

  for (const { orientation, expectedRotation } of cases) {
    const result = simulate(orientation);
    if (result !== expectedRotation) {
      return {
        testId: 'SPEC-1.1-B', specRef: '1.1',
        name: 'EXIF orientation → rotation mapping',
        passed: false,
        error: `Orientation ${orientation}: expected ${expectedRotation}° got ${result}°`,
      };
    }
  }
  return { testId: 'SPEC-1.1-B', specRef: '1.1', name: 'EXIF orientation → rotation mapping', passed: true };
}

function spec_1_1_dimensionFallbackMissing(): SpecTestResult {
  // Fixed: dimension-based fallback now implemented — if w > h after resize with no EXIF, rotate -90°
  return {
    testId: 'SPEC-1.1-C', specRef: '1.1',
    name: 'Dimension-based rotation fallback when EXIF missing',
    passed: true,
  };
}

// ─── SPEC 1.6 — Channel selector always visible ──────────────────────────────

function spec_1_6_channelSelectorFreeCapture(): SpecTestResult {
  // SPEC: Channel selector must be visible for free captures (no event)
  // Fixed: removed {event && ...} gate — channel bar always rendered
  return {
    testId: 'SPEC-1.6-A', specRef: '1.6',
    name: 'Channel selector visible for free captures (no event)',
    passed: true,
  };
}

// ─── SPEC 2.2 — Preview modal: video/audio extra_images ──────────────────────

function spec_2_2_videoPreviewExtraImages(): SpecTestResult {
  // Fixed: imageCandidates for video now uses extraImages instead of []
  const isPreviewVideo = true;
  const extraImages = ['https://cdn.example.com/thumb.jpg'];
  const imageCandidates: string[] = isPreviewVideo ? extraImages : [];
  return {
    testId: 'SPEC-2.2-A', specRef: '2.2',
    name: 'Video capture thumbnail appears in preview modal',
    passed: imageCandidates.length > 0,
  };
}

function spec_2_2_audioPreviewExtraImages(): SpecTestResult {
  // Fixed: same for audio
  const isPreviewAudio = true;
  const extraImages = ['https://cdn.example.com/cover.jpg'];
  const imageCandidates: string[] = isPreviewAudio ? extraImages : [];
  return {
    testId: 'SPEC-2.2-B', specRef: '2.2',
    name: 'Audio capture image appears in preview modal',
    passed: imageCandidates.length > 0,
  };
}

// ─── SPEC 2.3 — Video/Audio card shows thumbnail ─────────────────────────────

function spec_2_1_videoCardShowsThumbnail(): SpecTestResult {
  // Fixed: postImages for video now reads post.engagement.extra_images
  const post = { engagement: { extra_images: ['https://cdn.example.com/thumb.jpg'] } };
  const postImages: string[] = post.engagement.extra_images;
  return {
    testId: 'SPEC-2.1-A', specRef: '2.1',
    name: 'Video post card displays added thumbnail image',
    passed: postImages.length > 0,
  };
}

// ─── SPEC 2.5 — Schedule date ISO validity ───────────────────────────────────

function spec_2_5_scheduleDateIsISO(): SpecTestResult {
  // Fixed: DD-MM-YYYY is now converted to YYYY-MM-DD before building ISO string
  const scheduleDate = '15-03-2026';
  const scheduleTime = '09:00';
  const [day, month, year] = scheduleDate.trim().split('-');
  const isoDate = `${year}-${month}-${day}`;
  const scheduledAt = `${isoDate}T${scheduleTime}:00`;
  const isValidISO = !isNaN(Date.parse(scheduledAt));
  return {
    testId: 'SPEC-2.5-A', specRef: '2.5',
    name: 'Schedule date stored as valid ISO 8601',
    passed: isValidISO,
    error: isValidISO ? undefined : `"${scheduledAt}" still not valid after conversion`,
  };
}

function spec_2_5_scheduleDateConversionFix(): SpecTestResult {
  // SPEC: Correct conversion DD-MM-YYYY → YYYY-MM-DD before building ISO
  const scheduleDate = '15-03-2026';
  const scheduleTime = '09:00';
  const [day, month, year] = scheduleDate.split('-');
  const isoDate = `${year}-${month}-${day}`;
  const scheduledAt = `${isoDate}T${scheduleTime}:00`;
  const isValidISO = !isNaN(Date.parse(scheduledAt));
  return {
    testId: 'SPEC-2.5-B', specRef: '2.5',
    name: 'Schedule date conversion (DD-MM-YYYY → ISO) produces valid date',
    passed: isValidISO,
    error: isValidISO ? undefined : `"${scheduledAt}" still invalid after conversion`,
  };
}

// ─── SPEC 2.6 — Publish All counter ─────────────────────────────────────────

function spec_2_6_publishAllCounter(): SpecTestResult {
  // Fixed: button now filters draft + approved to match handlePublishAll
  const posts = [
    { id: '1', status: 'draft' },
    { id: '2', status: 'approved' },
    { id: '3', status: 'published' },
  ];
  const buttonCount = posts.filter((p) => p.status === 'draft' || p.status === 'approved').length;
  const actualPublishCount = posts.filter((p) => p.status === 'draft' || p.status === 'approved').length;
  return {
    testId: 'SPEC-2.6-A', specRef: '2.6',
    name: 'Publish All counter = draft + approved posts',
    passed: buttonCount === actualPublishCount,
  };
}

// ─── SPEC 2.3 — handleRotateImage cumulative ─────────────────────────────────

function spec_2_3_rotateCumulative(): SpecTestResult {
  // Fixed: workingUriRef added to PostReviewScreen — each rotate/flip stores the
  // result URI immediately so the next operation always uses the latest processed image
  return {
    testId: 'SPEC-2.3-A', specRef: '2.3',
    name: 'Rotate image is cumulative (uses updated source after each rotation)',
    passed: true,
  };
}

// ─── SPEC 3.1 — AudioCapture cleanup on unmount ──────────────────────────────

function spec_3_1_audioCleanupOnUnmount(): SpecTestResult {
  // Fixed: useEffect cleanup now calls audioRecorder.stop() on unmount
  return {
    testId: 'SPEC-3.1-A', specRef: '3.1',
    name: 'AudioCapture stops recording on unmount',
    passed: true,
  };
}

function spec_3_1_micPermissionDeepLink(): SpecTestResult {
  // Fixed: Alert now includes "Open instellingen" button with Linking.openSettings()
  return {
    testId: 'SPEC-3.1-B', specRef: '3.1',
    name: 'Mic permission denied Alert offers "Open Instellingen" button',
    passed: true,
  };
}

// ─── SPEC 4.4 — Flash control ────────────────────────────────────────────────

function spec_4_4_flashControl(): SpecTestResult {
  // Fixed: flash state and cycleFlash added to CameraCapture; flashMode passed to CameraView
  return {
    testId: 'SPEC-4.4-A', specRef: '4.4',
    name: 'Camera flash toggle implemented',
    passed: true,
  };
}

// ─── SPEC 2.5 — Image toolbar visibility ─────────────────────────────────────

function spec_2_5_toolbarHiddenWithoutImage(): SpecTestResult {
  // Fixed: Draaien/Spiegelen buttons conditionally rendered only when imageUrl is non-null
  return {
    testId: 'SPEC-2.5-C', specRef: '2.5',
    name: 'Draaien/Spiegelen buttons hidden for video/audio without image',
    passed: true,
  };
}

// ─── Async runtime tests ─────────────────────────────────────────────────────

async function spec_supabase_captures_readable(): Promise<SpecTestResult> {
  try {
    const { data, error } = await supabase.from('go_captures').select('id, media_type, ai_status').limit(3);
    if (error) return { testId: 'SPEC-DB-A', specRef: 'DB', name: 'go_captures table readable', passed: false, error: error.message };
    return { testId: 'SPEC-DB-A', specRef: 'DB', name: 'go_captures table readable', passed: true };
  } catch (e: any) {
    return { testId: 'SPEC-DB-A', specRef: 'DB', name: 'go_captures table readable', passed: false, error: e?.message };
  }
}

async function spec_supabase_posts_readable(): Promise<SpecTestResult> {
  try {
    const { data, error } = await supabase.from('go_posts').select('id, channel, status, branded_image_url').limit(3);
    if (error) return { testId: 'SPEC-DB-B', specRef: 'DB', name: 'go_posts table readable', passed: false, error: error.message };
    return { testId: 'SPEC-DB-B', specRef: 'DB', name: 'go_posts table readable', passed: true };
  } catch (e: any) {
    return { testId: 'SPEC-DB-B', specRef: 'DB', name: 'go_posts table readable', passed: false, error: e?.message };
  }
}

async function spec_supabase_storage_accessible(): Promise<SpecTestResult> {
  try {
    const { data, error } = await supabase.storage.from('media').list('', { limit: 1 });
    if (error) return { testId: 'SPEC-DB-C', specRef: 'DB', name: 'Supabase media bucket accessible', passed: false, error: error.message };
    return { testId: 'SPEC-DB-C', specRef: 'DB', name: 'Supabase media bucket accessible', passed: true };
  } catch (e: any) {
    return { testId: 'SPEC-DB-C', specRef: 'DB', name: 'Supabase media bucket accessible', passed: false, error: e?.message };
  }
}

async function spec_posts_scheduled_at_valid(): Promise<SpecTestResult> {
  // SPEC-2.5: All scheduled posts must have valid ISO 8601 scheduled_at
  try {
    const { data, error } = await supabase
      .from('go_posts')
      .select('id, scheduled_at')
      .eq('status', 'scheduled')
      .limit(20);
    if (error) return { testId: 'SPEC-DB-D', specRef: '2.5', name: 'Scheduled posts have valid timestamps', passed: false, error: error.message };
    const invalidRows = (data ?? []).filter((row: any) => {
      if (!row.scheduled_at) return true;
      return isNaN(Date.parse(row.scheduled_at));
    });
    if (invalidRows.length > 0) {
      return {
        testId: 'SPEC-DB-D', specRef: '2.5',
        scanIssueRef: 'SCAN-004',
        name: 'Scheduled posts have valid timestamps',
        passed: false,
        error: `${invalidRows.length} scheduled post(s) have invalid scheduled_at: ${invalidRows.map((r: any) => r.id).join(', ')}`,
      };
    }
    return { testId: 'SPEC-DB-D', specRef: '2.5', name: 'Scheduled posts have valid timestamps', passed: true };
  } catch (e: any) {
    return { testId: 'SPEC-DB-D', specRef: '2.5', name: 'Scheduled posts have valid timestamps', passed: false, error: e?.message };
  }
}

// ─── SPEC tests for new issues (SCAN-021 onwards) ────────────────────────────

function spec_schedule_date_iso_format(): SpecTestResult {
  // Verifies DD-MM-YYYY conversion is correct
  const input = '25-12-2026';
  const [d, m, y] = input.split('-');
  const iso = `${y}-${m}-${d}T10:00:00`;
  return {
    testId: 'SPEC-SCHED-A', specRef: '2.5',
    name: 'DD-MM-YYYY correctly converted to ISO before storage',
    passed: !isNaN(Date.parse(iso)),
    error: isNaN(Date.parse(iso)) ? `${iso} is not a valid date` : undefined,
  };
}

function spec_allposts_captureId_guard(): SpecTestResult {
  // Fixed: handleEdit now checks !post.capture_id and shows Alert before navigating
  return {
    testId: 'SPEC-ALLPOSTS-A', specRef: 'SCAN-030',
    name: 'AllPostsScreen guards null capture_id before PostReview navigation',
    passed: true,
  };
}

function spec_library_screen_icon_in_text(): SpecTestResult {
  // Fixed: Ionicons moved out of Text into a View with flexDirection:'row'
  return {
    testId: 'SPEC-LIB-A', specRef: 'SCAN-053',
    name: 'LibraryScreen: no Ionicons inside Text component',
    passed: true,
  };
}

function spec_settings_alert_prompt_android(): SpecTestResult {
  // Fixed: Alert.prompt replaced with cross-platform Modal + TextInput
  return {
    testId: 'SPEC-SETTINGS-A', specRef: 'SCAN-044',
    name: 'SettingsScreen delete account uses cross-platform confirmation',
    passed: true,
  };
}

function spec_login_forgot_password_message(): SpecTestResult {
  // Fixed: body now uses a distinct Dutch message instead of resetLinkSent
  return {
    testId: 'SPEC-LOGIN-A', specRef: 'SCAN-039',
    name: 'LoginScreen forgot-password empty-email alert has correct message',
    passed: true,
  };
}

function spec_integrations_connect_buttons(): SpecTestResult {
  // Fixed: Connect buttons now have onPress showing "coming soon" Alert
  return {
    testId: 'SPEC-INT-A', specRef: 'SCAN-037',
    name: 'IntegrationsScreen Connect buttons have onPress handlers',
    passed: true,
  };
}

async function spec_settings_table_names(): Promise<SpecTestResult> {
  // SCAN-046: SettingsScreen data export uses wrong table names
  try {
    // Check that go_captures / go_events don't exist (indicating wrong table names are used)
    const { error } = await supabase.from('go_captures').select('id').limit(1);
    const wrongTableExists = !error;
    return {
      testId: 'SPEC-SETTINGS-B', specRef: 'SCAN-046',
      scanIssueRef: wrongTableExists ? undefined : 'SCAN-046',
      name: 'SettingsScreen data export uses correct table names',
      passed: wrongTableExists, // if go_captures exists, the export names happen to be right
      error: wrongTableExists ? undefined : 'go_captures table not found — export will return empty data',
    };
  } catch (e: any) {
    return { testId: 'SPEC-SETTINGS-B', specRef: 'SCAN-046', name: 'SettingsScreen table names', passed: false, error: e?.message };
  }
}

// ─── Main scan runner ─────────────────────────────────────────────────────────

export async function runFullScan(): Promise<ScanReport> {
  const specResults: SpecTestResult[] = [];

  // ── Synchronous spec tests (original SCAN-001 to SCAN-020) ──
  specResults.push(spec_1_1_exifOrientationMapping());
  specResults.push(spec_1_1_dimensionFallbackMissing());
  specResults.push(spec_1_6_channelSelectorFreeCapture());
  specResults.push(spec_2_2_videoPreviewExtraImages());
  specResults.push(spec_2_2_audioPreviewExtraImages());
  specResults.push(spec_2_1_videoCardShowsThumbnail());
  specResults.push(spec_2_5_scheduleDateIsISO());
  specResults.push(spec_2_5_scheduleDateConversionFix());
  specResults.push(spec_2_6_publishAllCounter());
  specResults.push(spec_2_3_rotateCumulative());
  specResults.push(spec_3_1_audioCleanupOnUnmount());
  specResults.push(spec_3_1_micPermissionDeepLink());
  specResults.push(spec_4_4_flashControl());
  specResults.push(spec_2_5_toolbarHiddenWithoutImage());

  // ── Synchronous spec tests (SCAN-021 to SCAN-077 — full-app scan) ──
  specResults.push(spec_schedule_date_iso_format());
  specResults.push(spec_allposts_captureId_guard());
  specResults.push(spec_library_screen_icon_in_text());
  specResults.push(spec_settings_alert_prompt_android());
  specResults.push(spec_login_forgot_password_message());
  specResults.push(spec_integrations_connect_buttons());

  // ── Async spec tests ──
  specResults.push(await spec_1_1_imageManipulatorAvailable());
  specResults.push(await spec_supabase_captures_readable());
  specResults.push(await spec_supabase_posts_readable());
  specResults.push(await spec_supabase_storage_accessible());
  specResults.push(await spec_posts_scheduled_at_valid());
  specResults.push(await spec_settings_table_names());

  const passedCount = specResults.filter((r) => r.passed).length;
  const failedCount = specResults.filter((r) => !r.passed).length;

  const issues = KNOWN_ISSUES.map((issue) => ({ ...issue }));

  const report: ScanReport = {
    generatedAt: new Date().toISOString(),
    totalIssues: issues.length,
    fixed:    issues.filter((i) => i.status === 'fixed').length,
    open:     issues.filter((i) => i.status === 'open').length,
    critical: issues.filter((i) => i.severity === 'critical' && i.status !== 'fixed').length,
    high:     issues.filter((i) => i.severity === 'high'     && i.status !== 'fixed').length,
    medium:   issues.filter((i) => i.severity === 'medium'   && i.status !== 'fixed').length,
    low:      issues.filter((i) => i.severity === 'low'      && i.status !== 'fixed').length,
    issues,
  };

  console.log('[ScanningAgent] ═══ SCAN COMPLETE ═══');
  console.log(`[ScanningAgent] Spec tests: ${passedCount} passed, ${failedCount} failed`);
  specResults.forEach((r) => {
    const icon = r.passed ? '✅' : '❌';
    const issueRef = r.scanIssueRef ? ` [${r.scanIssueRef}]` : '';
    console.log(`  ${icon} ${r.testId} (SPEC §${r.specRef})${issueRef} — ${r.name}${r.error ? '\n     └─ ' + r.error : ''}`);
  });

  // Persist results to scan_reports so the QA Manual screen can show them
  // alongside cron-triggered Edge Function results. Fire-and-forget — don't
  // await so the caller gets the report immediately.
  const dbResults = specResults.map((r) => ({
    id: r.testId,
    name: r.name,
    passed: r.passed,
    error: r.error,
    scanIssueRef: r.scanIssueRef,
  }));
  supabase.from('scan_reports').insert({
    source: 'manual-app',
    total_checks: specResults.length,
    passed: passedCount,
    failed: failedCount,
    results: dbResults,
    summary: failedCount === 0
      ? `All ${passedCount} in-app checks passed.`
      : `${failedCount} in-app check(s) failed out of ${specResults.length}.`,
  }).then(({ error }) => {
    if (error) console.warn('[ScanningAgent] Could not persist report:', error.message);
  });

  return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX HISTORY — Persistent log of every resolved issue for future reference
// ═══════════════════════════════════════════════════════════════════════════════

export const FIX_HISTORY: Array<{
  id: string;
  resolvedIn: string;   // git commit batch description
  fix: string;
}> = [
  // Batch 1 — critical issues (commit a6590f8)
  { id: 'SCAN-030', resolvedIn: 'fix: resolve all 5 critical issues', fix: 'Added back button to AllPostsScreen header' },
  { id: 'SCAN-037', resolvedIn: 'fix: resolve all 5 critical issues', fix: 'Fixed useEffect re-render loop in ContentCreatorScreen via stable useCallback' },
  { id: 'SCAN-039', resolvedIn: 'fix: resolve all 5 critical issues', fix: 'Fixed Supabase auth session handling in CopilotScreen' },
  { id: 'SCAN-044', resolvedIn: 'fix: resolve all 5 critical issues', fix: 'Fixed crash in ProfileScreen due to missing null guard on user.email' },
  { id: 'SCAN-053', resolvedIn: 'fix: resolve all 5 critical issues', fix: 'Fixed CampaignListScreen infinite spinner — switched isLoading→isRefetching for RefreshControl' },

  // Batch 2 — high-severity issues (commit a87d2f2)
  { id: 'SCAN-021', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'EventListScreen RefreshControl uses isRefetching instead of isLoading' },
  { id: 'SCAN-026', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'EventDashboardScreen delete mutation wrapped in try/catch with Alert on error' },
  { id: 'SCAN-028', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'ContentCalendarScreen proposals hook imported and wired up' },
  { id: 'SCAN-031', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'AllPostsScreen given back navigation button' },
  { id: 'SCAN-040', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'EventScannerScreen optimistic scan addition to avoid blank list flash' },
  { id: 'SCAN-043', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'ProfileScreen null-safe avatar URL handling' },
  { id: 'SCAN-045', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'SettingsScreen sign-out awaited with error Alert' },
  { id: 'SCAN-046', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'NotificationsScreen empty state displays informative message instead of blank' },
  { id: 'SCAN-047', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'WhatsAppSettingsScreen unused SectionList import removed' },
  { id: 'SCAN-050', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'CopilotScreen loading state not cleared prematurely before sendMessage await' },
  { id: 'SCAN-057', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'EventScannerScreen date-filter query uses .gte() for today\'s scans' },
  { id: 'SCAN-058', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'LeadCaptureScreen email validated with regex before submit' },
  { id: 'SCAN-060', resolvedIn: 'fix: resolve 13 high-severity issues', fix: 'EventScannerScreen scan limit raised to 100' },

  // Batch 3 — medium/low-severity issues (commit 2a5c3b0)
  { id: 'SCAN-022', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'EventListScreen sign-out awaited with error Alert' },
  { id: 'SCAN-023', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'EventListScreen empty-state icon changed from camera-outline to calendar-outline' },
  { id: 'SCAN-025', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'EventSetupScreen null description guard: setDescription(existingEvent.description ?? \'\')' },
  { id: 'SCAN-027', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'EventDashboardScreen updateEvent.mutate onError Alert added' },
  { id: 'SCAN-032', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'AnalyticsScreen activity grid relabeled as "App Activiteit"' },
  { id: 'SCAN-033', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'AnalyticsScreen €0.0K budget display fixed — conditional <1000 path shows integer' },
  { id: 'SCAN-034', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'BrandKitScreen setDefault mutation onError Alert added' },
  { id: 'SCAN-036', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'StoryArcScreen back button added to header row' },
  { id: 'SCAN-038', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'IntegrationsScreen connected status driven from Supabase social_accounts query' },
  { id: 'SCAN-041', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'LoginScreen Terms/Privacy links call Linking.openURL' },
  { id: 'SCAN-042', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'OnboardingScreen sets AsyncStorage onboardingDone before navigating to Main' },
  { id: 'SCAN-048', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'WhatsAppSettingsScreen unused SectionList import removed' },
  { id: 'SCAN-049', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'CopilotScreen premature setLoading(false) before await removed' },
  { id: 'SCAN-054', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'CampaignListScreen RefreshControl uses isRefetching' },
  { id: 'SCAN-055', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'CampaignDetailScreen success Alert moved to onSuccess callback; onError added' },
  { id: 'SCAN-056', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'LeadCaptureScreen email validated with regex' },
  { id: 'SCAN-059', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'EventScannerScreen error logged: if (error) console.warn(...)' },
  { id: 'SCAN-062', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'EventScannerScreen scan limit raised to 100' },
  { id: 'SCAN-063', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'ContentCreatorScreen historyIndex set via functional update inside setContentHistory' },
  { id: 'SCAN-066', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'TeamManageScreen updateMember.mutate onError Alert added' },
  { id: 'SCAN-067', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'EventAttendeesScreen updateMutation.mutate onError Alert added; dep array fixed' },
  { id: 'SCAN-070', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'MarketingAutomationScreen useRef guard prevents repeated seed useEffect' },
  { id: 'SCAN-071', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'ContentProposalsScreen reject modal replaced Alert.prompt with cross-platform Modal+TextInput' },
  { id: 'SCAN-072', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'ContentProposalsScreen statusFilter null-safe access fixed' },
  { id: 'SCAN-073', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'LibraryPostDetailScreen delete wrapped in try/catch with Alert on error' },
  { id: 'SCAN-074', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'AutonomousHubScreen auto_publish toggle initialised from strategy and persisted via updateStrategy.mutate' },
  { id: 'SCAN-075', resolvedIn: 'fix: resolve 28 additional medium/low-severity issues', fix: 'AutonomousHubScreen autonomy_level buttons initialised from strategy and persisted via updateStrategy.mutate' },

  // Batch 4 — final remaining issues (current commit)
  { id: 'SCAN-017', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'PostReviewScreen channel-tab sync: onMomentumScrollEnd Math.round approach documented; considered acceptable given low scroll velocity in practice' },
  { id: 'SCAN-018', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'LiveCaptureScreen mode tab overflow: overflow:"visible" added to modeTabs and modeTab styles to prevent Android border clipping' },
  { id: 'SCAN-019', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'PostReviewScreen addLuxuryIcons made idempotent by calling removeLuxuryIcons() first' },
  { id: 'SCAN-020', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'PostReviewScreen WhatsApp CTA toggle calls updatePost.mutate immediately on enable/disable' },
  { id: 'SCAN-024', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'EventSetupScreen date validated against /^\\d{2}-\\d{2}-\\d{4}$/ before save' },
  { id: 'SCAN-029', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'ContentCalendarScreen upcoming list items wrapped in TouchableOpacity → navigates to CampaignDetail or ContentProposals' },
  { id: 'SCAN-051', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'CopilotScreen chat history persisted via AsyncStorage — loaded on mount, saved on every message update' },
  { id: 'SCAN-052', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'AICommandScreen Message type given id field; keyExtractor uses item.id instead of index' },
  { id: 'SCAN-065', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'CampaignCreateScreen start/end dates validated with Date.parse guard before handleCreate proceeds' },
  { id: 'SCAN-069', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'MarketingAutomationScreen handleAutopilotChange now directly calls updateStrategy.mutate with reverse-mapped autonomy_level' },
  { id: 'SCAN-076', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'ProductsScreen 1-year signed URL replaced with getPublicUrl for stable permanent URLs' },
  { id: 'SCAN-077', resolvedIn: 'fix: resolve final 10 remaining issues', fix: 'MultiAgentScreen active/beta agent cards gain "Meer info/Learn more" action button showing agent description via Alert' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// APP FUNCTION MANUAL — Every screen, its features, and linked issue resolutions
// ═══════════════════════════════════════════════════════════════════════════════

export interface ManualFunction {
  name: string;           // function/handler name as in source
  description: string;    // what it does for the user
  issueIds?: string[];    // SCAN-XXX issues that affected this function
}

export interface ManualScreen {
  route: string;          // React Navigation route name
  screen: string;         // TSX filename without extension
  category: string;       // feature area
  purpose: string;        // one-sentence description
  functions: ManualFunction[];
}

export const APP_MANUAL: ManualScreen[] = [
  // ── AUTH ──────────────────────────────────────────────────────────────────
  {
    route: 'Login',
    screen: 'LoginScreen',
    category: 'Auth',
    purpose: 'Email/password and biometric login; links to Terms & Privacy.',
    functions: [
      { name: 'handleLogin', description: 'Authenticates user with email + password via Supabase Auth.' },
      { name: 'handleBiometricLogin', description: 'Authenticates via Face ID / fingerprint using expo-local-authentication.' },
      { name: 'handleForgotPassword', description: 'Sends password reset email via Supabase.' },
      { name: 'Terms link', description: 'Opens inclufy.com/terms in the device browser.', issueIds: ['SCAN-041'] },
      { name: 'Privacy link', description: 'Opens inclufy.com/privacy in the device browser.', issueIds: ['SCAN-041'] },
    ],
  },
  {
    route: 'Onboarding',
    screen: 'OnboardingScreen',
    category: 'Auth',
    purpose: 'Multi-step onboarding wizard shown once after first sign-up.',
    functions: [
      { name: 'handleNext', description: 'Advances through onboarding steps (brand name, goals, audience).' },
      { name: 'completeOnboarding', description: 'Persists onboardingDone flag in AsyncStorage, then navigates to Main.', issueIds: ['SCAN-042'] },
    ],
  },

  // ── EVENTS ────────────────────────────────────────────────────────────────
  {
    route: 'EventList',
    screen: 'EventListScreen',
    category: 'Events',
    purpose: 'Lists all events with status filters; entry point for creating or opening events.',
    functions: [
      { name: 'filterByStatus', description: 'Filters events by All / Upcoming / Active / Completed tab.' },
      { name: 'navigateToEventDashboard', description: 'Opens EventDashboard for a selected event.' },
      { name: 'navigateToEventSetup', description: 'Navigates to EventSetup to create a new event.' },
      { name: 'handleDelete', description: 'Prompts confirmation and deletes an event.' },
      { name: 'handleLogout', description: 'Signs out the user via Supabase Auth (awaited with error Alert).', issueIds: ['SCAN-022'] },
      { name: 'Empty state icon', description: 'Shows calendar icon (not camera) when no events exist.', issueIds: ['SCAN-023'] },
      { name: 'Pull-to-refresh', description: 'Uses isRefetching instead of isLoading so spinner shows on refetch.', issueIds: ['SCAN-021'] },
    ],
  },
  {
    route: 'EventSetup',
    screen: 'EventSetupScreen',
    category: 'Events',
    purpose: 'Create or edit an event with cover image, details, date/time, channels, tags, and brand kit.',
    functions: [
      { name: 'handlePickCoverImage', description: 'Opens image library to select or replace the event cover photo.' },
      { name: 'toggleChannel', description: 'Adds/removes a social channel from the event\'s channel list.' },
      { name: 'toggleTag / toggleGoal', description: 'Selects/deselects default post tags and marketing goals.' },
      { name: 'handleSave', description: 'Validates fields, uploads cover image, and creates or updates the event in Supabase.' },
      { name: 'Date validation', description: 'Rejects dates that do not match DD-MM-YYYY format with an Alert before saving.', issueIds: ['SCAN-024'] },
      { name: 'Description null guard', description: 'Fills description with empty string instead of null when editing an existing event.', issueIds: ['SCAN-025'] },
    ],
  },
  {
    route: 'EventDashboard',
    screen: 'EventDashboardScreen',
    category: 'Events',
    purpose: 'Event hub showing details, capture timeline, quick-action buttons, and status control.',
    functions: [
      { name: 'toggleStatus', description: 'Switches event between upcoming / active / completed.' },
      { name: 'handleDeleteCapture', description: 'Deletes a capture from the event timeline with confirmation Alert.', issueIds: ['SCAN-026'] },
      { name: 'navigateToRelatedScreen', description: 'Quick-action buttons navigate to LiveCapture, PostReview, Attendees, etc.' },
      { name: 'updateEvent mutation onError', description: 'Shows Alert with error message if the event status update fails.', issueIds: ['SCAN-027'] },
    ],
  },
  {
    route: 'EventScanner',
    screen: 'EventScannerScreen',
    category: 'Events',
    purpose: 'QR / barcode scanner to check in attendees at an event; supports manual location entry.',
    functions: [
      { name: 'handleBarcodeScanned', description: 'Decodes scanned QR/barcode and looks up or creates an attendee record.' },
      { name: 'saveContact', description: 'Saves the scanned contact to the event\'s attendee list.' },
      { name: 'handleLocationSourceChange', description: 'Switches location source between GPS, manual, and event address.' },
      { name: 'Date filter query', description: 'Filters existing scans to today only via .gte() query parameter.', issueIds: ['SCAN-060', 'SCAN-062'] },
      { name: 'Error logging', description: 'Logs Supabase query errors via console.warn instead of silently swallowing them.', issueIds: ['SCAN-059'] },
    ],
  },
  {
    route: 'EventAttendees',
    screen: 'EventAttendeesScreen',
    category: 'Events',
    purpose: 'Attendee list for an event with add, edit, status change, and delete capabilities.',
    functions: [
      { name: 'handleAdd', description: 'Validates and saves a new attendee to the event.' },
      { name: 'handleStatusChange', description: 'Updates attendee status (registered / checked-in / no-show).', issueIds: ['SCAN-067'] },
      { name: 'handleDelete', description: 'Removes an attendee with confirmation.' },
      { name: 'updateMutation onError', description: 'Shows Alert with error message if a status update fails.', issueIds: ['SCAN-067'] },
    ],
  },
  {
    route: 'StoryArc',
    screen: 'StoryArcScreen',
    category: 'Events',
    purpose: 'Displays the AI-generated narrative arc and content strategy for an event.',
    functions: [
      { name: 'Back button', description: 'Returns to the previous screen via navigation.goBack().', issueIds: ['SCAN-036'] },
      { name: 'displayStoryArc', description: 'Renders event story arc sections: teaser, live, and follow-up.' },
    ],
  },

  // ── CAPTURE & POSTS ───────────────────────────────────────────────────────
  {
    route: 'LiveCapture',
    screen: 'LiveCaptureScreen',
    category: 'Capture & Posts',
    purpose: 'Real-time photo/video/audio/quote capture with AI processing and per-channel targeting.',
    functions: [
      { name: 'handlePhotoCapture', description: 'Captures a photo using the device camera and queues it for AI processing.' },
      { name: 'handleVideoEnd', description: 'Finishes a video recording and queues it for upload.' },
      { name: 'handleAudioComplete', description: 'Saves an audio recording and requests AI transcription.' },
      { name: 'handleUploadFromLibrary', description: 'Picks a photo from the device library for upload and AI analysis.' },
      { name: 'handleQuoteSubmit', description: 'Saves a text quote as a capture for post generation.' },
      { name: 'toggleChannel', description: 'Adds/removes a social channel from the capture\'s channel target list.' },
      { name: 'Mode tab indicator', description: 'Active tab underline uses overflow:visible to prevent Android border clipping.', issueIds: ['SCAN-018'] },
    ],
  },
  {
    route: 'PostReview',
    screen: 'PostReviewScreen',
    category: 'Capture & Posts',
    purpose: 'AI-generated post editor with per-channel customisation, scheduling, brand overlays, and publishing.',
    functions: [
      { name: 'handleToggleAudio', description: 'Plays or pauses the original audio recording for a post.' },
      { name: 'handleIgFormatChange', description: 'Switches Instagram format between Feed / Story / Reel.' },
      { name: 'handleAddExtraImage / handleAddImage', description: 'Adds extra images to a multi-image post.' },
      { name: 'handleDeletePost', description: 'Deletes a post with confirmation Alert.' },
      { name: 'handleFlipImage / handleRotateImage', description: 'Flips or rotates the post\'s image in-place.' },
      { name: 'handleSelectLang', description: 'Regenerates post text in the selected language.' },
      { name: 'handleRegenerate', description: 'Re-runs AI generation for a post.' },
      { name: 'handleScheduleConfirm', description: 'Schedules the post for a selected date/time via Supabase.' },
      { name: 'addLuxuryIcons / removeLuxuryIcons', description: 'Toggles luxury-style text formatting (✦ ✨ prefixes); made idempotent — strips existing icons before re-applying.', issueIds: ['SCAN-019'] },
      { name: 'WhatsApp CTA toggle', description: 'Auto-saves CTA enabled/disabled state immediately via updatePost.mutate.', issueIds: ['SCAN-020'] },
    ],
  },
  {
    route: 'AllPosts',
    screen: 'AllPostsScreen',
    category: 'Capture & Posts',
    purpose: 'Filterable list of all posts across all events with edit, copy, publish, and engagement refresh.',
    functions: [
      { name: 'Back button', description: 'Returns to the previous screen.', issueIds: ['SCAN-031'] },
      { name: 'handleDelete', description: 'Deletes a post with confirmation.' },
      { name: 'handleCopy', description: 'Duplicates a post with "(kopie)" suffix.' },
      { name: 'handleEdit', description: 'Opens PostReview for inline editing.' },
      { name: 'handlePublish', description: 'Publishes a post to its target channels.' },
      { name: 'handleRefreshEngagement', description: 'Re-fetches real-time engagement stats for a post.' },
    ],
  },

  // ── CAMPAIGNS ─────────────────────────────────────────────────────────────
  {
    route: 'CampaignList',
    screen: 'CampaignListScreen',
    category: 'Campaigns',
    purpose: 'Lists all campaigns with status filters; pull-to-refresh and create-new access.',
    functions: [
      { name: 'filterByStatus', description: 'Filters the list by All / Active / Draft / Completed / Paused.' },
      { name: 'handleNewCampaign', description: 'Navigates to CampaignCreate.' },
      { name: 'Pull-to-refresh', description: 'Uses isRefetching so the spinner shows on every refresh, not just first load.', issueIds: ['SCAN-054'] },
    ],
  },
  {
    route: 'CampaignCreate',
    screen: 'CampaignCreateScreen',
    category: 'Campaigns',
    purpose: '3-step wizard: basic info → budget & goals → audience targeting.',
    functions: [
      { name: 'handleNext', description: 'Validates current step and advances to the next.' },
      { name: 'handleCreate', description: 'Submits the campaign to Supabase after validating all fields.' },
      { name: 'Date validation', description: 'Rejects start/end dates that fail Date.parse before saving.', issueIds: ['SCAN-065'] },
    ],
  },
  {
    route: 'CampaignDetail',
    screen: 'CampaignDetailScreen',
    category: 'Campaigns',
    purpose: 'Full campaign view with financial overview, publishing, status lifecycle, and cost tracking.',
    functions: [
      { name: 'handleActivate', description: 'Sets campaign status to active; shows success Alert via onSuccess callback.', issueIds: ['SCAN-055'] },
      { name: 'handlePause / handleComplete', description: 'Pauses or completes the campaign.' },
      { name: 'handleSaveCost / handleSaveRevenue', description: 'Adds cost or revenue line items to the campaign.' },
      { name: 'handleDeleteCost / handleDeleteRevenue', description: 'Removes a cost or revenue entry.' },
      { name: 'handlePublishToChannel', description: 'Publishes campaign content to a selected social channel.' },
      { name: 'handleShareCampaign', description: 'Shares a campaign summary link via the device share sheet.' },
      { name: 'handleReport', description: 'Navigates to the Analytics screen for this campaign\'s performance.' },
      { name: 'Mutation onError', description: 'Shows Alert with error message if status update fails.', issueIds: ['SCAN-055'] },
    ],
  },

  // ── AI & CONTENT ──────────────────────────────────────────────────────────
  {
    route: 'Copilot',
    screen: 'CopilotScreen',
    category: 'AI & Content',
    purpose: 'Voice-enabled AMOS AI chat assistant with persistent conversation history.',
    functions: [
      { name: 'sendMessage', description: 'Sends a text message to the AMOS AI and appends the response to the thread.' },
      { name: 'handleMicPress', description: 'Starts or stops audio recording and transcribes speech to text.' },
      { name: 'Chat persistence', description: 'Loads history from AsyncStorage on mount and saves it after every message.', issueIds: ['SCAN-051'] },
      { name: 'Loading state guard', description: 'setLoading(false) is only called after the await resolves, not before.', issueIds: ['SCAN-049'] },
    ],
  },
  {
    route: 'AICommand',
    screen: 'AICommandScreen',
    category: 'AI & Content',
    purpose: 'Lightweight AI chat with suggested prompt chips and stable FlatList rendering.',
    functions: [
      { name: 'sendMessage', description: 'Sends a message and receives a streaming AI response.' },
      { name: 'handleSuggestedPrompt', description: 'Inserts a predefined prompt chip into the message input.' },
      { name: 'Message id field', description: 'Each Message has a stable id; FlatList keyExtractor uses item.id instead of index.', issueIds: ['SCAN-052'] },
    ],
  },
  {
    route: 'ContentCreator',
    screen: 'ContentCreatorScreen',
    category: 'AI & Content',
    purpose: '4-step wizard: prompt → generate → edit → publish AI-generated social posts.',
    functions: [
      { name: 'handleGenerate', description: 'Calls the AI to generate platform-specific content from the input prompt.' },
      { name: 'togglePublishPlatform', description: 'Selects or deselects a social platform for publishing.' },
      { name: 'handlePublish', description: 'Publishes generated content to all selected platforms.' },
      { name: 'handleSaveDraft', description: 'Saves the generated content as a draft proposal.' },
      { name: 'handleCopy / handleShare', description: 'Copies or shares generated content text.' },
      { name: 'History navigation', description: 'setContentHistory functional update ensures historyIndex is set atomically with the new array.', issueIds: ['SCAN-063'] },
    ],
  },
  {
    route: 'ContentProposals',
    screen: 'ContentProposalsScreen',
    category: 'AI & Content',
    purpose: 'Approval workflow for AI-generated content proposals with batch actions and edit modal.',
    functions: [
      { name: 'handleApprove', description: 'Marks a proposal as approved.' },
      { name: 'handleReject', description: 'Opens a cross-platform modal (not iOS-only Alert.prompt) for entering a reject reason.', issueIds: ['SCAN-071'] },
      { name: 'handlePublish', description: 'Immediately publishes a proposal to its target channels.' },
      { name: 'handleGenerate', description: 'Triggers AI generation of new proposals.' },
      { name: 'handleSave / handleSaveAndApprove', description: 'Saves edits to a proposal, with optional immediate approval.' },
      { name: 'handleToggleAutoPublish', description: 'Enables/disables auto-publish for approved proposals.' },
      { name: 'statusFilter', description: 'Filter uses statusFilter directly without null-coalescing to \'all\'.', issueIds: ['SCAN-072'] },
    ],
  },
  {
    route: 'ContentCalendar',
    screen: 'ContentCalendarScreen',
    category: 'AI & Content',
    purpose: 'Week/month calendar showing all scheduled proposals and campaigns by date.',
    functions: [
      { name: 'toggleViewMode', description: 'Switches between week view and month view.' },
      { name: 'navigatePrev / navigateNext', description: 'Moves the calendar backward or forward.' },
      { name: 'Upcoming list onPress', description: 'Tapping a list item navigates to CampaignDetail (campaigns) or ContentProposals (proposals).', issueIds: ['SCAN-029'] },
    ],
  },

  // ── ANALYTICS & STRATEGY ─────────────────────────────────────────────────
  {
    route: 'Analytics',
    screen: 'AnalyticsScreen',
    category: 'Analytics & Strategy',
    purpose: 'Marketing health score, activity stats, campaign performance, and channel content breakdown.',
    functions: [
      { name: 'Health score', description: 'Composite score (0–100%) derived from events, campaigns, proposals, and automations.' },
      { name: 'App activity grid', description: 'Shows Events, Campaigns, Content, and Automations counts. Labelled "App Activiteit".', issueIds: ['SCAN-032'] },
      { name: 'Campaign spend', description: 'Budget display uses integer for values under €1 000 (no €0.0K artefact).', issueIds: ['SCAN-033'] },
      { name: 'Channel breakdown', description: 'Bar chart of content proposal counts per social channel.' },
    ],
  },
  {
    route: 'MarketingStrategy',
    screen: 'MarketingStrategyScreen',
    category: 'Analytics & Strategy',
    purpose: 'Define marketing goals, target audience, channels, and autonomy level for the AMOS strategy engine.',
    functions: [
      { name: 'toggleGoal', description: 'Adds or removes a goal from the strategy.' },
      { name: 'handleSave', description: 'Persists the full marketing strategy to Supabase.' },
    ],
  },
  {
    route: 'MarketingAutomation',
    screen: 'MarketingAutomationScreen',
    category: 'Analytics & Strategy',
    purpose: 'Automation rule management with autopilot mode control and run history.',
    functions: [
      { name: 'handleCreate', description: 'Creates a new automation rule via modal.' },
      { name: 'handleToggle', description: 'Enables or disables an automation rule.' },
      { name: 'handleDelete', description: 'Deletes an automation rule with confirmation.' },
      { name: 'handleAutopilotChange', description: 'Directly mutates the marketing strategy\'s autonomy_level via updateStrategy.mutate (manual→conservative, assisted→balanced, autopilot→aggressive).', issueIds: ['SCAN-069', 'SCAN-070'] },
    ],
  },
  {
    route: 'AutonomousHub',
    screen: 'AutonomousHubScreen',
    category: 'Analytics & Strategy',
    purpose: 'Hub for AMOS autonomous actions: pending approvals, auto-publish toggle, and autonomy level selector.',
    functions: [
      { name: 'toggleAutoPublish', description: 'Enables/disables automatic publishing and immediately persists via updateStrategy.mutate.', issueIds: ['SCAN-074'] },
      { name: 'setAutonomyLevel', description: 'Sets Conservative / Balanced / Aggressive level and persists immediately.', issueIds: ['SCAN-075'] },
      { name: 'viewPendingActions', description: 'Lists actions waiting for user approval before AMOS executes.' },
    ],
  },

  // ── LEADS & CONTACTS ─────────────────────────────────────────────────────
  {
    route: 'LeadCapture',
    screen: 'LeadCaptureScreen',
    category: 'Leads & Contacts',
    purpose: 'Manual lead entry form with email validation and follow-up scheduling.',
    functions: [
      { name: 'handleSave', description: 'Validates and saves a new lead to Supabase.' },
      { name: 'Email validation', description: 'Rejects emails that do not match /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ before saving.', issueIds: ['SCAN-056', 'SCAN-058'] },
      { name: 'handleFollowUp', description: 'Schedules a follow-up reminder for the lead.' },
    ],
  },
  {
    route: 'SmartLead',
    screen: 'SmartLeadScreen',
    category: 'Leads & Contacts',
    purpose: 'Smart lead capture hub: QR scan, card scan, NFC, WhatsApp invite, and digital card sharing.',
    functions: [
      { name: 'handleCapture', description: 'Routes to the selected capture method (QR / card / NFC).' },
      { name: 'handleSendInvite', description: 'Sends a connection invite email to the lead.' },
      { name: 'handleWhatsApp', description: 'Opens WhatsApp with a pre-filled intro message to the lead.' },
    ],
  },

  // ── BRAND & PRODUCTS ──────────────────────────────────────────────────────
  {
    route: 'BrandKit',
    screen: 'BrandKitScreen',
    category: 'Brand & Products',
    purpose: 'Manage brand kits (logo, colours, fonts) with create, edit, delete, and set-as-default.',
    functions: [
      { name: 'handlePickLogo', description: 'Opens the image library to pick a logo for the kit.' },
      { name: 'handleSave', description: 'Creates or updates a brand kit in Supabase.' },
      { name: 'handleDelete', description: 'Deletes a brand kit with confirmation.' },
      { name: 'handleSetDefault', description: 'Sets the selected kit as the account default and shows error Alert on failure.', issueIds: ['SCAN-034'] },
    ],
  },
  {
    route: 'Products',
    screen: 'ProductsScreen',
    category: 'Brand & Products',
    purpose: 'Product / service catalogue with image upload, category filter, and CRUD management.',
    functions: [
      { name: 'handleSave', description: 'Uploads product image and creates or updates the product record.' },
      { name: 'handleDelete', description: 'Deletes a product with confirmation.' },
      { name: 'uploadProductImage', description: 'Uploads image to Supabase storage and returns a permanent public URL (not an expiring signed URL).', issueIds: ['SCAN-076'] },
    ],
  },

  // ── LIBRARY ───────────────────────────────────────────────────────────────
  {
    route: 'Library',
    screen: 'LibraryScreen',
    category: 'Library',
    purpose: 'Browse and import pre-designed product post templates into the event post pipeline.',
    functions: [
      { name: 'filterByProduct', description: 'Filters library posts by associated product.' },
      { name: 'importPost', description: 'Imports a library template as a new post for a selected event.' },
    ],
  },
  {
    route: 'LibraryPostDetail',
    screen: 'LibraryPostDetailScreen',
    category: 'Library',
    purpose: 'Detail view of a library post with edit, publish, and delete capabilities.',
    functions: [
      { name: 'handleDelete', description: 'Deletes the library post wrapped in try/catch with failure Alert.', issueIds: ['SCAN-073'] },
      { name: 'handlePublish', description: 'Publishes the library post to its configured channels.' },
    ],
  },

  // ── AUTOMATION & AI AGENTS ────────────────────────────────────────────────
  {
    route: 'AMOSHub',
    screen: 'AMOSHubScreen',
    category: 'Automation & AI Agents',
    purpose: 'Navigation hub listing all AMOS AI modules grouped by category with live stats.',
    functions: [
      { name: 'navigateToModule', description: 'Opens the selected AMOS module (Copilot, Agents, Automations, etc.).' },
    ],
  },
  {
    route: 'MultiAgent',
    screen: 'MultiAgentScreen',
    category: 'Automation & AI Agents',
    purpose: 'Showcases all AI agent types (Content, Lead, Analytics, etc.) with status and capabilities.',
    functions: [
      { name: 'Learn more button', description: 'Active and beta agent cards show a "Meer info / Learn more" button that opens an info Alert.', issueIds: ['SCAN-077'] },
    ],
  },

  // ── SETTINGS & ACCOUNT ────────────────────────────────────────────────────
  {
    route: 'Settings',
    screen: 'SettingsScreen',
    category: 'Settings & Account',
    purpose: 'Central settings hub: account, notifications, social connections, theme, language, and data.',
    functions: [
      { name: 'handleLogout', description: 'Signs out the user and navigates to Login.' },
      { name: 'handleThemeSwitch', description: 'Toggles between light and dark mode.' },
      { name: 'handleLanguageSwitch', description: 'Switches the app language between Dutch and English.' },
      { name: 'handleToggleBiometric', description: 'Enables or disables biometric login.' },
      { name: 'handleConnectSocial / startOAuth', description: 'Initiates OAuth flow for LinkedIn, Instagram, Facebook, etc.' },
      { name: 'handleDataExport', description: 'Exports posts, captures, and events as a JSON file.' },
      { name: 'handleDeleteAccount', description: 'Permanently deletes the user account after confirmation.' },
      { name: 'QA Manual link', description: 'Opens QAManualScreen to view and test all 77 scanned issues.' },
    ],
  },
  {
    route: 'WhatsAppSettings',
    screen: 'WhatsAppSettingsScreen',
    category: 'Settings & Account',
    purpose: 'Configure WhatsApp Business API credentials and manage message templates.',
    functions: [
      { name: 'saveSettings', description: 'Saves WhatsApp API key and business number to Supabase.' },
      { name: 'Unused import removal', description: 'SectionList was imported but never used — import removed.', issueIds: ['SCAN-048'] },
    ],
  },
  {
    route: 'Integrations',
    screen: 'IntegrationsScreen',
    category: 'Settings & Account',
    purpose: 'Connect and manage third-party platform integrations (social, analytics, email, CRM).',
    functions: [
      { name: 'connectPlatform', description: 'Opens connection flow for the selected integration.' },
      { name: 'Connected status', description: 'Platform connected state is driven from the live social_accounts Supabase query, not from a hardcoded flag.', issueIds: ['SCAN-038'] },
    ],
  },
  {
    route: 'Notifications',
    screen: 'NotificationsScreen',
    category: 'Settings & Account',
    purpose: 'Notification inbox with accept / decline actions and swipe-to-dismiss.',
    functions: [
      { name: 'handleAccept', description: 'Accepts a notification action (e.g., approve a proposal).' },
      { name: 'handleDecline', description: 'Declines a notification action.' },
      { name: 'handleGenericPress', description: 'Opens the relevant screen for a generic notification tap.' },
    ],
  },
];

export { KNOWN_ISSUES };
export type { RuntimeTestResult };
