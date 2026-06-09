# Security & Secrets

## Policy

Never commit, log, or paste into chat:

- `.env` (real values)
- Firebase service account JSON
- Keystores (`*.jks`, `*.keystore`), `key.properties`
- `google-services.json`, `GoogleService-Info.plist` (when project-specific)
- EAS credentials, `sentry.properties` with tokens
- OAuth / service account JSON files

## Environment files

| File | Committed? | Purpose |
|------|------------|---------|
| `.env` | No (gitignored) | Local secrets and `EXPO_PUBLIC_*` config |
| `.env.example` | Yes | Template with placeholder values |

### `EXPO_PUBLIC_*` variables

Expo embeds `EXPO_PUBLIC_*` values in the **client bundle**. They are not server-only secrets.

Current categories:

- Firebase config (`EXPO_PUBLIC_FIREBASE_*`)
- Google Sheets IDs for card data (`EXPO_PUBLIC_GOOGLE_*`)

Only put values in `.env` that are safe to ship in a mobile client. Server-only keys belong in a backend — not in this app.

## Ignore files

- `.gitignore` — prevents accidental git commits
- `.cursorignore` — prevents Cursor from indexing sensitive paths

## Before `git add`

Verify `git status` does not stage:

- `.env`
- `*.jks`, `*.keystore`, `key.properties`
- `google-services.json`, `GoogleService-Info.plist`

## If secrets were committed

1. Do **not** push
2. Rotate compromised Firebase/Google keys
3. Remove secrets from git history per team policy

## Store / alcohol content

This is a drinking-game app. Plan age ratings, disclaimers, and store policy review before public release.
