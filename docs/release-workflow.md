# Release Workflow

Expo/React Native release guide for **WodkaO** (`jahw3-app`).

## Placeholders

| Placeholder | Current / target |
|-------------|------------------|
| `APP_NAME` | WodkaO (display: Vod-ka-Oh!) |
| `PACKAGE_NAME` | Set before Play Store upload |
| `BUNDLE_ID` | Set before App Store upload |

## Pre-release checklist

### Code quality

- [ ] `npm run lint` — no errors
- [ ] `npx expo-doctor` — no critical issues
- [ ] Known lint bugs fixed (see [testing.md](testing.md))
- [ ] Manual smoke test on release build

### Environment

- [ ] Correct `.env` or EAS environment for target track
- [ ] Firebase project matches release environment
- [ ] Google Sheets IDs point to production card data (if used)
- [ ] No secrets in commits or public docs

### Versioning

- [ ] `app.json` → `expo.version` updated
- [ ] `package.json` → `version` in sync
- [ ] Android `versionCode` / iOS `buildNumber` incremented for store uploads

### Store / compliance

- [ ] Age rating and alcohol disclaimer reviewed
- [ ] Store listing text complies with Google Play / App Store policies

## Release order

1. Update `project.md` if status changes
2. `npm run lint`
3. `npx expo-doctor`
4. Version bump
5. Build (EAS or local prebuild)
6. Device smoke test
7. Upload to store / TestFlight
8. Git commit only when user requests

## Build commands

Development:

```bash
npm start
npm run android
npm run ios
```

Production (when EAS configured):

```bash
npx eas build --platform android
npx eas build --platform ios
```

## Notes

- No `eas.json` yet — add when setting up EAS Build
- Native `android/` and `ios/` folders are gitignored (Expo managed workflow)
- Firebase is the current backend — not Supabase
