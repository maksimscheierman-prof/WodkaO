# Testing & QA

## MVP / APK-Checkliste

Vollständige Liste mit Status: [MVP_ROADMAP.md](MVP_ROADMAP.md#technische-mvp-checkliste)

Kurzfassung:

| Check | Status |
|-------|--------|
| Browser (`npm run web`) | ✅ |
| Android Emulator / Expo Go | ⚠️ manuell |
| Mobile Layout / Touch | ⚠️ teilweise (Slot-Layout + Squash-Fix 2026-06-09) |
| Game-Flow (Phasen + Saufstapel) | ✅ Code |
| APK-Config (`eas.json`, package) | ✅ |
| APK gebaut & auf Gerät | ❌ |

APK-Build-Anleitung: [BUILD_ANDROID.md](BUILD_ANDROID.md)

---

## Automated checks

Run from `jahw3-app/`:

| Command | When | Status |
|---------|------|--------|
| `npm run lint` | After JS/TS changes | Available |
| `npx tsc --noEmit` | Type changes | Available (no `typecheck` script yet) |
| `npm run test:lobby-lifecycle` | Lobby expiry / lifecycle | ✅ 7/7 (2026-06-09) |
| `npm run test:table-layout` | Slot layout / collisions | ✅ 6/6 (2026-06-09) |
| `npx expo-doctor` | After dep/config changes | Available |
| `npm test` | Unit tests | Not configured |

### Pre-commit gate

Before **every** git commit, run all available checks. **Do not commit** if `npm run lint` reports errors.

```bash
npm run lint
npx tsc --noEmit
npm run test:lobby-lifecycle
npm run test:table-layout
npx expo-doctor
```

## Known lint issues

| File | Issue | Status |
|------|-------|--------|
| `MagicCardModal.js` | 7× `react-hooks/exhaustive-deps` | Warnings only |
| `useGameFirebase.js` | 2× `react-hooks/exhaustive-deps` | Legacy hook |

0 errors as of 2026-06-09.

## Manual smoke test (Web / Dev)

Use a device or emulator with valid `.env`:

1. App starts; Firestore connection indicator on home screen
2. Enter player name
3. Create lobby → share code → second client joins
4. All players ready → host starts
5. **Setup:** Würfeln → Gleichstand optional → Monster ziehen
6. **Spiel:** Saufstapel ziehen — Magie + Falle
7. Reactions, voting, discard, next turn
8. Card gallery loads (optional)

## APK smoke test (after first build)

See [BUILD_ANDROID.md](BUILD_ANDROID.md#smoke-test-nach-apk-install).

## Release QA

Before **store** upload (not required for MVP APK):

- Repeat smoke test on a **release** build
- Correct Firebase project for the target environment
- Version bumped in `app.json` / `package.json`

See [release-workflow.md](release-workflow.md).
