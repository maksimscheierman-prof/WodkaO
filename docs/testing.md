# Testing & QA

## MVP / APK-Checkliste

Vollständige Release-Liste inkl. **Late Join**: [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md)

Roadmap & Fortschritt: [MVP_ROADMAP.md](MVP_ROADMAP.md#mvp-fortschritt-geschätzt)

Kurzfassung:

| Check | Status |
|-------|--------|
| Browser (`npm run web`) | ✅ |
| Android Emulator / Expo Go | ⚠️ manuell |
| Mobile Layout / Touch | ⚠️ teilweise (Slot-Layout + Squash-Fix 2026-06-09) |
| Game-Flow (Phasen + Saufstapel) | ✅ Code |
| **Late Join** (Code + Unit-Tests) | ✅ |
| **Late Join** (3+ Geräte manuell) | ❌ ausstehend |
| APK-Config (`eas.json`, package) | ✅ |
| APK gebaut & auf Gerät | ❌ |

APK-Build: [BUILD_ANDROID.md](BUILD_ANDROID.md)  
iPhone Web-MVP: [BUILD_WEB.md](BUILD_WEB.md)

---

## Automated checks

Run from project root (`Sauf Viel-Oh/`):

| Command | When | Status |
|---------|------|--------|
| `npm run lint` | After JS/TS changes | Available |
| `npx tsc --noEmit` | Type changes | Available (no `typecheck` script yet) |
| `npm run test:lobby-lifecycle` | Lobby expiry / lifecycle | ✅ 10/10 |
| `npm run test:late-join` | Late Join logic | ✅ 21/21 |
| `npm run test:table-layout` | Slot layout / collisions | ✅ 22/22 |
| `npx expo-doctor` | After dep/config changes | Available |
| `npm test` | Unit tests | Not configured |

### Pre-commit gate

Before **every** git commit, run all available checks. **Do not commit** if `npm run lint` reports errors.

```bash
npm run lint
npx tsc --noEmit
npm run test:lobby-lifecycle
npm run test:late-join
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

## Late Join smoke test (3+ clients empfohlen)

Siehe [MVP_RELEASE_CHECKLIST.md#manual-test--late-join-3-geräte-empfohlen](MVP_RELEASE_CHECKLIST.md):

1. Host + Gast starten Spiel
2. Dritter Client joined in Würfelphase → sichtbar, Monster, kein Zug-Sprung
3. Vierter Client in `drawingMonsters` → Toast auf anderen Geräten
4. Fünfter Client während fremdem Zug → aktiver Spieler unverändert
5. Late Joiner zieht erst bei eigenem Zug aus Saufstapel
6. Fehlerfälle: volle Lobby, doppelter Name, abgelaufene Lobby

## APK smoke test (after first build)

See [BUILD_ANDROID.md](BUILD_ANDROID.md#smoke-test-nach-apk-install) und [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md).

## Release QA

Before **store** upload (not required for MVP APK):

- Repeat smoke test on a **release** build
- Correct Firebase project for the target environment
- Version bumped in `app.json` / `package.json`

## Bekannte Risiken (vor erstem APK-Test)

Siehe [MVP_RELEASE_CHECKLIST.md#bekannte-risiken](MVP_RELEASE_CHECKLIST.md#bekannte-risiken):

- Firestore Security Rules nicht vollständig geprüft
- Multi-Device-Test auf echten Geräten ausstehend
- Disconnect / Reconnect offen
- Monsterdeck leer — Late Join ohne Monster
