# Android Card Modal — Debug & Crash Investigation

*Stand: 2026-06-18*

## Symptom

Tapping a monster on the game board should open `CardDetailModal`. On Android preview/release APK the app crashes.

## Sentry

**Not configured** in this repo (`sentry.properties` is gitignored only). Use logcat + in-app debug overlay.

---

## 1. Local dev (Metro + USB)

```bash
cd "Sauf Viel-Oh"
npx expo start --clear
```

Connect Android device, authorize USB debugging (`adb devices` must show `device`, not `unauthorized`).

### Logcat (Windows)

```powershell
.\scripts\adb_card_modal_logs.ps1
```

Or manually:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" logcat -c
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" logcat | Select-String -Pattern "fatal|exception|ReactNativeJS|MONSTER|CARD MODAL|AndroidRuntime"
```

### In-app debug overlay

Set in `.env` or EAS `preview` environment:

```env
EXPO_PUBLIC_CARD_MODAL_DEBUG=1
```

Rebuild APK. On the **game screen** a green debug box shows:

- last tapped card name / type
- resolved image URL
- modal open state
- last error / phase

Console tags (also in logcat `ReactNativeJS`):

| Tag | When |
|-----|------|
| `[MONSTER PRESS]` | Board tap |
| `[CARD MODAL DEBUG]` | Each pipeline phase |
| `[CARD MODAL OPEN]` | Modal open payload |
| `[CARD MODAL ERROR]` | Caught JS errors |
| `[CARD IMAGE ERROR]` | Image load failure (full Card renderer) |

---

## 2. Pipeline phases

1. `board_press` — `PlayerSeat.openSeatCard`
2. `game_select_card` — `game.handleSelectCard`
3. `game_set_selected_card` — `setSelectedCard`
4. `modal_open_request` — `CardDetailModal` effect
5. `modal_render_commit` — Modal render
6. `modal_body_render_start` — inner content
7. `android_safe_render` OR full `Card` component
8. `modal_native_on_show` — native Modal shown

If logcat shows phases 1–6 then **native crash** without JS error → native image/modal issue.

---

## 3. Isolation: Android safe renderer

**Default on Android:** `CardDetailModal` uses `AndroidSafeCardDetail` (single `expo-image`, no `ImageBackground`).

Force explicitly:

```env
EXPO_PUBLIC_CARD_MODAL_SAFE_ANDROID=1
```

To test **full** `Card` template on Android (reproduce crash):

```env
EXPO_PUBLIC_CARD_MODAL_SAFE_ANDROID=0
```

Edit `shouldUseAndroidSafeCardModal()` in `src/utils/cardModalDebug.js` if needed for A/B.

### Working hypothesis (pending logcat confirm)

| Observation | Inference |
|-------------|-----------|
| Small board thumbnail (`Image`) works | Tap + image URL OK |
| Modal with full `Card` (`ImageBackground` + nested `expo-image` + stars) crashes | Native view stack issue on Android release |
| Fix | `AndroidSafeCardDetail` in modal on Android |

---

## 4. Preview APK build

```bash
eas build --platform android --profile preview
```

Set `EXPO_PUBLIC_CARD_MODAL_DEBUG=1` in EAS environment `preview` before build for overlay in test APK.

---

## 5. Test checklist after fix

- [ ] Own monster tap → modal opens
- [ ] Other player's monster tap → modal opens
- [ ] Monster without / with broken image → fallback, no crash
- [ ] Open/close modal 10× rapidly
- [ ] Logcat: no `FATAL EXCEPTION` after `[MONSTER PRESS]`

---

## Files

| File | Role |
|------|------|
| `src/components/PlayerSeat.js` | Board tap |
| `app/game.js` | `selectedCard` state |
| `src/components/CardModal.js` | Wrapper |
| `src/components/CardDetailModal.js` | Modal |
| `src/components/AndroidSafeCardDetail.js` | Android-safe body |
| `src/components/Card.js` | Full template (iOS/Web) |
| `src/utils/cardModalDebug.js` | Debug ring buffer |
| `scripts/adb_card_modal_logs.ps1` | Logcat helper |
