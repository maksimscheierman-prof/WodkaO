# Testing & QA

## Automated checks

Run from `jahw3-app/`:

| Command | When | Status |
|---------|------|--------|
| `npm run lint` | After JS/TS changes | Available |
| `npx expo-doctor` | After dep/config changes | Available |
| `npx tsc --noEmit` | Type changes | Available (no `typecheck` script yet) |
| `npm test` | Unit tests | Not configured |

### Pre-commit gate

Before **every** git commit, run all available checks. **Do not commit** if `npm run lint` reports errors.

```bash
npm run lint
npx expo-doctor
```

## Known lint issues (TODO)

| File | Issue |
|------|-------|
| `app/game.js` | `handleCloseVoteResult` missing in `gameActions.js` |
| `app/settings/timers.js` | `formValues` undefined — should be `values` |

Fix these before treating the codebase as release-ready.

## Manual smoke test

Use a device or emulator with valid `.env`:

1. App starts; Firestore connection indicator on home screen
2. Enter player name
3. Create lobby → share/join code
4. All players ready → host starts
5. Game board loads for all clients
6. Active player draws magic card
7. Card modal, timers, voting, reactions work
8. Card gallery loads and displays cards

## Release QA

Before store/EAS upload:

- Repeat smoke test on a **release** build
- No dev-only debug UI in production
- Correct Firebase project for the target environment
- Version bumped in `app.json` / `package.json`

See [release-workflow.md](release-workflow.md).
