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

## 7. Open Issue Summary

| ID | Severity | Title |
|---|---|---|
| SCAN-001 | Critical | Photos rotated 90° in PostReview |
| SCAN-002 | Critical | Instagram preview shows "Geen afbeelding" for video |
| SCAN-003 | Critical | Video/Audio card never shows added thumbnail |
| SCAN-004 | Critical | Schedule stores invalid ISO date (DD-MM-YYYY used raw) |
| SCAN-005 | High | Image toolbar shown for video/audio with no image |
| SCAN-006 | High | Channel selector hidden for free captures |
| SCAN-007 | High | Publish All counter wrong (draft only, not draft+approved) |
| SCAN-008 | High | Audio recording not stopped on back navigation |
| SCAN-009 | High | Rotate uses stale URL on rapid double-tap |
| SCAN-010 | Medium | Mic permission denied → no Settings deep-link |
| SCAN-011 | Medium | Flash button not implemented (zoom reset instead) |
| SCAN-012 | Medium | Fullscreen zoom has no close button |
| SCAN-013 | Medium | NL translation re-translates instead of restoring original |
| SCAN-014 | Medium | Audio playback not available in PostReview |
| SCAN-015 | Medium | Overlay save has no confirmation feedback |
| SCAN-016 | Medium | Multi-photo extra images may appear rotated |
| SCAN-017 | Low | Channel tab highlight lags on fast swipe |
| SCAN-018 | Low | Active tab underline clipped on Android |
| SCAN-019 | Low | Luxury icon toggle can double-apply markers |
| SCAN-020 | Low | WhatsApp CTA enable toggle requires manual save |
