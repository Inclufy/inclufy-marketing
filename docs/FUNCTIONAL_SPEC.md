# Inclufy AMOS App — Functional Specification

> This document defines the **expected behaviour** of every major function and user flow.
> The scanning agent in `src/services/scanning-agent.service.ts` tests each point automatically.

---

## 1. LiveCapture Screen

### 1.1 `normalizeImageOrientation(uri, exif?)`
| Property | Value |
|---|---|
| **File** | `src/screens/LiveCaptureScreen.tsx:54` |
| **Input** | Local file URI + optional EXIF metadata object |
| **Output** | Corrected local URI (always upright) |
| **Rules** |
| ✅ EXIF Orientation=1 → no rotation |
| ✅ EXIF Orientation=3 → rotate 180° |
| ✅ EXIF Orientation=6 → rotate +90° (landscape-right → portrait) |
| ✅ EXIF Orientation=8 → rotate −90° (landscape-left → portrait) |
| ✅ If EXIF missing → use dimension-based heuristic (width > height in a portrait shot = rotate -90°) |
| ✅ Always resize to max 1920px wide |
| ✅ Always return a valid local file URI |
| ✅ If manipulation fails → return original uri (no crash) |

**Known failure:** Dimension-based fallback is not implemented (SCAN-001).

---

### 1.2 `processFreeCapture(mediaUri, mediaType, exif?, transcript?)`
| Property | Value |
|---|---|
| **File** | `src/screens/LiveCaptureScreen.tsx:164` |
| **Triggered when** | Category is product/inspiration/behind_scenes/quick (no event) |
| **Expected sequence** |
| 1. Check AI consent — if missing, show modal and retry on accept |
| 2. Normalise photo orientation (photo only) |
| 3. Save to phone library if `saveToLibrary` is true |
| 4. Upload media to Supabase Storage `media` bucket |
| 5. Create `go_captures` row |
| 6. Generate AI posts for all `selectedChannels` (default: linkedin + instagram) |
| 7. Create `go_posts` rows (one per channel) |
| 8. Navigate to PostReview with `captureId` + `localMediaUri` |
| **Post-conditions** |
| ✅ `go_captures.media_url` contains the Supabase public URL (not empty) |
| ✅ `go_captures.ai_status` eventually = 'completed' |
| ✅ `go_posts` rows exist for every channel in selectedChannels |
| ✅ `branded_image_url` = Supabase URL for photo captures |
| ✅ `video_url` = Supabase URL for video captures |
| ✅ `branded_image_url` = null for video captures |
| ✅ Navigation happens even if AI generation fails (placeholder posts) |
| ✅ Channel selector visible to user (not gated by event) ← **SCAN-006 blocks this** |

---

### 1.3 `processCapture(mediaUri, mediaType, transcript?, exif?)`
| Property | Value |
|---|---|
| **File** | `src/screens/LiveCaptureScreen.tsx:328` |
| **Triggered when** | eventId is present |
| **Expected sequence** | Same as processFreeCapture but includes eventId in all DB rows |
| **Additional rules** |
| ✅ Audio upload failure is non-fatal (transcript used as fallback) |
| ✅ Photo upload failure IS fatal (Alert shown) |
| ✅ AI auto-tagging runs in background (non-blocking) |
| ✅ Extra images from multi-select attached to all posts of capture |

---

### 1.4 `handleAudioComplete(uri)`
| Property | Value |
|---|---|
| **File** | `src/screens/LiveCaptureScreen.tsx:550` |
| **Input** | Local m4a file URI |
| **Expected** |
| ✅ Transcribes audio via `aiService.transcribeAudio()` |
| ✅ Transcript used as AI context for post generation |
| ✅ Transcription failure is non-fatal (falls back to note text) |
| ✅ AI posts use transcript as main content if available |

---

### 1.5 `handleUploadFromLibrary()`
| Property | Value |
|---|---|
| **File** | `src/screens/LiveCaptureScreen.tsx:575` |
| **Rules** |
| ✅ Requests MediaLibrary permission before opening picker |
| ✅ Single photo: normalise orientation then process |
| ✅ Multi-photo: first image = primary, rest = extra_images |
| ✅ Each extra image normalised independently |
| ✅ Extra images uploaded before primary processed |
| ✅ Picker opens with `exif: true` so EXIF data available |

---

### 1.6 Channel selector bar
| Property | Value |
|---|---|
| **Expected** | Visible for ALL capture categories (event AND free) |
| **Actual** | Only shown when `event` is truthy ← **SCAN-006** |
| ✅ At least one channel always selected (prevents empty toggle) |
| ✅ Default: LinkedIn + Instagram |

---

## 2. PostReview Screen

### 2.1 Image resolution order for post cards
```
Priority (highest first):
1. localMediaUri  (passed from LiveCapture, still on device)
2. post.branded_image_url  (processed/branded version stored in Supabase)
3. captureImageUrl  (signed URL from capture.storage_path)
4. null → show placeholder
```
| Rule | Status |
|---|---|
| ✅ For video captures: postImages = [] (show video placeholder) | Works, but thumbnail is never shown — **SCAN-003** |
| ✅ For audio captures: postImages = [] (show audio placeholder) | Same issue |
| ✅ extra_images appended after primary image for photo captures | ✅ works |
| ❌ extra_images NOT shown for video/audio even after thumbnail added | **SCAN-003** |

---

### 2.2 Preview modal image resolution
```
Same priority as post cards, but independent failed-URL tracking.
```
| Rule | Status |
|---|---|
| ✅ Photo captures: show all imageCandidates including localMediaUri | ✅ |
| ❌ Video/audio captures: imageCandidates = [] even with thumbnail | **SCAN-002** |
| ✅ Carousel with swipe for multi-image | ✅ |
| ✅ Failed URL removed from candidates automatically | ✅ |

---

### 2.3 `handleRotateImage(post, imageUrl)`
| Property | Value |
|---|---|
| **File** | `src/screens/PostReviewScreen.tsx:705` |
| **Input** | Active post + current image URL |
| **Expected** |
| ✅ Rotate source image +90° using ImageManipulator |
| ✅ Upload rotated image to Supabase |
| ✅ Update `go_captures.media_url` + `storage_path` + `thumbnail_url` |
| ✅ Clear `branded_image_url` on all posts of this capture |
| ✅ Clear `localMediaUri` to force refetch from Supabase |
| ✅ Invalidate queries to trigger UI refresh |
| ✅ Cumulative: 2nd rotate builds on 1st ← **SCAN-009** broken |

---

### 2.4 `handleFlipImage(post, imageUrl)`
| Property | Value |
|---|---|
| **File** | `src/screens/PostReviewScreen.tsx:672` |
| **Expected** | Same as rotate but FlipType.Horizontal |
| ✅ Source = captureImageUrl (raw, not branded) to avoid flipping baked-in text |

---

### 2.5 `handleScheduleConfirm()`
| Property | Value |
|---|---|
| **File** | `src/screens/PostReviewScreen.tsx:802` |
| **Input** | scheduleDate (DD-MM-YYYY), scheduleTime (HH:MM) |
| **Expected** |
| ✅ Convert DD-MM-YYYY → YYYY-MM-DD before building ISO string |
| ✅ `scheduled_at` stored as valid ISO 8601: "YYYY-MM-DDTHH:MM:00" |
| ✅ Post status updated to "scheduled" |
| ✅ User sees success Alert with correct date/time |
| ❌ Currently stores "DD-MM-YYYYTHH:MM:00" — invalid | **SCAN-004** |

---

### 2.6 `handlePublishAll()`
| Property | Value |
|---|---|
| **File** | `src/screens/PostReviewScreen.tsx:1305` |
| **Input** | All posts with status "draft" or "approved" |
| **Expected** |
| ✅ Iterates every draft + approved post independently |
| ✅ One failure does not abort others |
| ✅ Partial success shows X/N success message |
| ✅ Button counter = draft + approved count | ❌ only counts draft — **SCAN-007** |
| ✅ Bakes overlay before each publish |
| ✅ Saves pending text edits before publishing |

---

### 2.7 `bakeOverlayIntoImage(post)`
| Property | Value |
|---|---|
| **File** | `src/screens/PostReviewScreen.tsx:1083` |
| **Expected** |
| ✅ If no overlay configured → return existing branded_image_url (no-op) |
| ✅ Waits up to 1s for ViewShot ref to mount |
| ✅ Captures ViewShot as JPEG |
| ✅ Uploads baked image to Supabase |
| ✅ Updates post.branded_image_url |
| ✅ Throws on failure (caller shows error Alert) |

---

### 2.8 Language translation `handleSelectLang(post, lang)`
| Property | Value |
|---|---|
| **File** | `src/screens/PostReviewScreen.tsx:742` |
| **Expected** |
| ✅ Translates current text to selected language |
| ✅ Auto-saves translated text to DB |
| ✅ Selecting NL should restore original Dutch text | ❌ re-translates from current — **SCAN-013** |
| ✅ Shows loading indicator during translation |
| ✅ Error Alert if translation fails |

---

### 2.9 WhatsApp CTA fields
| Property | Value |
|---|---|
| **Expected** |
| ✅ Phone number validated as E164 format (+XXXXXXXXXXX) |
| ✅ waLink generated and previewed when phone valid |
| ✅ Opslaan saves phone + message + enabled flag to DB |
| ✅ Enable toggle auto-saves | ❌ requires manual Opslaan — **SCAN-020** |

---

## 3. AudioCapture Component

### 3.1 Recording lifecycle
| Property | Value |
|---|---|
| **File** | `src/components/AudioCapture.tsx` |
| **Expected** |
| ✅ Request microphone permission on mount |
| ✅ Permission denied → Alert with "Open Instellingen" button | ❌ no deeplink — **SCAN-010** |
| ✅ `startRecording()` → prepareToRecordAsync + record() |
| ✅ `stopRecording()` → stop() → get uri → call onRecordingComplete |
| ✅ Recording stopped on component unmount | ❌ no cleanup — **SCAN-008** |
| ✅ Duration displayed in MM:SS format |
| ✅ Recording indicator shown while recording |

---

## 4. CameraCapture Component

### 4.1 Photo capture
| Property | Value |
|---|---|
| **File** | `src/components/CameraCapture.tsx` |
| **Expected** |
| ✅ `takePictureAsync({ quality: 0.8, exif: true })` |
| ✅ Pass raw URI + EXIF to parent (no in-component rotation) |
| ✅ Camera permission required; graceful fallback UI shown |

### 4.2 Video recording
| Property | Value |
|---|---|
| ✅ Microphone permission required for video on iOS |
| ✅ `recordAsync({ maxDuration: 60 })` — max 60 seconds |
| ✅ REC indicator shown while recording |
| ✅ Stop recording on button re-tap |

### 4.3 Zoom
| Property | Value |
|---|---|
| ✅ Pinch-to-zoom via PanResponder |
| ✅ Zoom range 0–1 (maps to 1×–10× display) |
| ✅ Zoom indicator shown during gesture, hides after 1.5s |
| ✅ Reset zoom button available |

### 4.4 Flash control
| Property | Value |
|---|---|
| **Expected** | Toggle off/on/auto |
| **Actual** | Button resets zoom instead | ❌ **SCAN-011** |

---

## 5. Navigation Flows

### 5.1 FAB → LiveCapture
| Rule | Status |
|---|---|
| ✅ Category modal shows 4 categories + quick capture | ✅ |
| ✅ Category passed as `captureCategory` route param | ✅ |
| ✅ Event captures require eventId | ✅ |
| ✅ Free captures (product/inspiration/behind_scenes) work without eventId | ✅ |

### 5.2 LiveCapture → PostReview
| Rule | Status |
|---|---|
| ✅ `captureId` always passed | ✅ |
| ✅ `localMediaUri` passed for photo/video | ✅ |
| ✅ `extraImageUrls` passed when multi-photo | ✅ |
| ✅ `eventId` passed for event captures | ✅ |

### 5.3 PostReview → publish
| Rule | Status |
|---|---|
| ✅ Single post: account picker if multiple accounts | ✅ |
| ✅ No accounts: show connect modal | ✅ |
| ✅ Manual accounts: show copy-paste instructions | ✅ |
| ✅ WhatsApp: deep-link to WhatsApp app | ✅ |

---

## 6. Issue Severity Legend

| Severity | Meaning |
|---|---|
| **Critical** | Core flow broken; users cannot complete a primary task |
| **High** | Significant feature broken or major UX confusion |
| **Medium** | Feature partially broken or usability degraded |
| **Low** | Minor visual or UX issue with easy workaround |

---

## 7. Issue Summary (Full App Scan)

### Fixed Issues (SCAN-001 to SCAN-016)

| ID | Severity | Title | Status |
|---|---|---|---|
| SCAN-001 | Critical | Photos rotated 90° in PostReview | ✅ Fixed |
| SCAN-002 | Critical | Instagram preview shows "Geen afbeelding" for video | ✅ Fixed |
| SCAN-003 | Critical | Video/Audio card never shows added thumbnail | ✅ Fixed |
| SCAN-004 | Critical | Schedule stores invalid ISO date (DD-MM-YYYY used raw) | ✅ Fixed |
| SCAN-005 | High | Image toolbar shown for video/audio with no image | ✅ Fixed |
| SCAN-006 | High | Channel selector hidden for free captures | ✅ Fixed |
| SCAN-007 | High | Publish All counter wrong (draft only, not draft+approved) | ✅ Fixed |
| SCAN-008 | High | Audio recording not stopped on back navigation | ✅ Fixed |
| SCAN-009 | High | Rotate uses stale URL on rapid double-tap | ✅ Fixed |
| SCAN-010 | Medium | Mic permission denied → no Settings deep-link | ✅ Fixed |
| SCAN-011 | Medium | Flash button not implemented (zoom reset instead) | ✅ Fixed |
| SCAN-012 | Medium | Fullscreen zoom has no close button | ✅ Fixed |
| SCAN-013 | Medium | NL translation re-translates instead of restoring original | ✅ Fixed |
| SCAN-014 | Medium | Audio playback not available in PostReview | ✅ Fixed |
| SCAN-015 | Medium | Overlay save has no confirmation feedback | ✅ Fixed |
| SCAN-016 | Medium | Multi-photo extra images may appear rotated | ✅ Fixed |

### Open Issues

| ID | Severity | Screen | Title |
|---|---|---|---|
| SCAN-017 | Low | PostReviewScreen | Channel tab highlight lags on fast swipe |
| SCAN-018 | Low | LiveCaptureScreen | Active tab underline clipped on Android |
| SCAN-019 | Low | PostReviewScreen | Luxury icon toggle can double-apply markers |
| SCAN-020 | Low | PostReviewScreen | WhatsApp CTA enable toggle requires manual save |
| SCAN-021 | High | EventListScreen | Pull-to-refresh spinner never activates |
| SCAN-022 | Medium | EventListScreen | signOut() not awaited — errors swallowed |
| SCAN-023 | Low | EventListScreen | Wrong empty-state icon (camera instead of calendar) |
| SCAN-024 | High | EventSetupScreen | Event date field has no format validation |
| SCAN-025 | Medium | EventSetupScreen | Null description stored as literal "null" |
| SCAN-026 | High | EventDashboardScreen | Blank white screen on event load failure |
| SCAN-027 | Medium | EventDashboardScreen | toggleStatus mutation has no error handler |
| SCAN-028 | High | ContentCalendarScreen | Calendar renders empty during data load |
| SCAN-029 | Medium | ContentCalendarScreen | Calendar items have no onPress handler |
| SCAN-030 | Critical | AllPostsScreen | Navigate to PostReview with null capture_id — crash |
| SCAN-031 | Low | AllPostsScreen | No back button in header |
| SCAN-032 | Medium | AnalyticsScreen | Shows internal DB counts, not real social metrics |
| SCAN-033 | Low | AnalyticsScreen | Budget shows "€0.0K" for zero values |
| SCAN-034 | Medium | BrandKitScreen | handleSetDefault has no error handler |
| SCAN-035 | High | StoryArcScreen | AI arc regenerated on every screen remount |
| SCAN-036 | Low | StoryArcScreen | No back button in header |
| SCAN-037 | Critical | IntegrationsScreen | All Connect buttons have no onPress — completely non-functional |
| SCAN-038 | Medium | IntegrationsScreen | Connection status hardcoded as disconnected |
| SCAN-039 | Critical | LoginScreen | Forgot password shows "reset link sent" on empty email |
| SCAN-040 | High | LoginScreen | Biometric login silently fails on expired session |
| SCAN-041 | Low | LoginScreen | Terms & Privacy links have no onPress |
| SCAN-042 | Medium | OnboardingScreen | Onboarding completion not persisted |
| SCAN-043 | Low | OnboardingScreen | scrollX Animated.Value dead code |
| SCAN-044 | Critical | SettingsScreen | Alert.prompt (iOS-only) crashes Android on delete account |
| SCAN-045 | High | SettingsScreen | Social accounts query missing user_id filter |
| SCAN-046 | High | SettingsScreen | Data export uses wrong table names — always empty |
| SCAN-047 | Medium | SettingsScreen | brand_kits queried with is_active instead of is_default |
| SCAN-048 | Low | WhatsAppSettingsScreen | SectionList imported but never used |
| SCAN-049 | Medium | CopilotScreen | Loading spinner dismissed before AI response arrives |
| SCAN-050 | High | CopilotScreen | recorder.record() not awaited — errors swallowed |
| SCAN-051 | Medium | CopilotScreen | Chat history lost on navigation |
| SCAN-052 | Low | AICommandScreen | FlatList keyExtractor uses index — unnecessary re-renders |
| SCAN-053 | Critical | LibraryScreen | Ionicons inside &lt;Text&gt; — crashes on all platforms |
| SCAN-054 | Medium | CampaignListScreen | Pull-to-refresh spinner never activates |
| SCAN-055 | Medium | CampaignDetailScreen | Success alert shown before mutation resolves |
| SCAN-056 | Medium | LeadCaptureScreen | No email format validation |
| SCAN-057 | High | NotificationsScreen | Arbitrary route navigated from push notification data |
| SCAN-058 | High | EventRecapScreen | Selected photos not passed to generateEventRecap |
| SCAN-059 | Low | EventRecapScreen | changeTone button active during generation |
| SCAN-060 | Medium | EventScannerScreen | "Scanned Today" shows all recent, ignores date |
| SCAN-061 | High | EventScannerScreen | Contact upsert error not checked after QR scan |
| SCAN-062 | Medium | EventScannerScreen | loadExistingScans has no error handling |
| SCAN-063 | Medium | ContentCreatorScreen | historyIndex off-by-one on concurrent state updates |
| SCAN-064 | High | ContentCreatorScreen | Pexels API key hardcoded client-side |
| SCAN-065 | Medium | CampaignCreateScreen | Campaign date fields have no validation |
| SCAN-066 | Medium | TeamManageScreen | handleChangeRole mutation has no error handler |
| SCAN-067 | Medium | EventAttendeesScreen | handleStatusChange mutation has no error handler |
| SCAN-068 | High | AMOSHubScreen | Icons broken due to auto "-outline" suffix on all names |
| SCAN-069 | Low | MarketingAutomationScreen | Autopilot selection navigates away instead of inline |
| SCAN-070 | Medium | MarketingAutomationScreen | Auto-seed re-fires on every empty-state render |
| SCAN-071 | Medium | ContentProposalsScreen | Alert.prompt (iOS-only) for rejection reason |
| SCAN-072 | Medium | ContentProposalsScreen | "all" literal passed as status filter |
| SCAN-073 | Medium | LibraryPostDetailScreen | Delete navigates back even on failure |
| SCAN-074 | Medium | AutonomousHubScreen | systemActive toggle not persisted |
| SCAN-075 | Medium | AutonomousHubScreen | autonomyLevel controls are decorative — not saved |
| SCAN-076 | Low | ProductsScreen | Product images use 1-year signed URLs |
| SCAN-077 | Low | MultiAgentScreen | Agent cards have no interactive actions |
