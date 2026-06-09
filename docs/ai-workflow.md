# AI Workflow

How Cursor and other AI agents should work in **WodkaO** (`jahw3-app`).

## Stack reminder

- **React Native** 0.81 + **Expo** ~54
- **expo-router** for navigation
- **Firebase Firestore** for multiplayer
- **JavaScript** (TypeScript config present, most code is `.js`)

This is **not** a Flutter project. Do not use `flutter analyze`, `dart test`, or `pubspec.yaml`.

## Agent workflow

### 1. Understand before changing

- Read the screen (`app/`), hook (`src/hooks/`), or util (`src/utils/`) in context.
- Trace Firebase usage (`firebaseConfig.js`, Firestore refs).
- Check if similar logic already exists.

### 2. Implement minimally

- Smallest diff that solves the task.
- Reuse existing components (`Card`, `GameBoard`, modals, hooks).
- No new dependencies unless justified.
- No backend migration (e.g. Supabase) unless explicitly requested.

### 3. Verify

From `jahw3-app/`:

```bash
npm run lint
npx expo-doctor
```

Also run when available: `npm run typecheck`, `npm test`, `npx tsc --noEmit`.

### 4. Document

Update `project.md` and relevant `docs/` when behavior, scripts, or release steps change.

## Pre-commit rule

**Before every git commit**, run all available checks. Do not commit if lint reports errors.

## Cursor rules

| File | Purpose |
|------|---------|
| `.cursor/rules/project-rules.mdc` | Workflow, git, versioning |
| `.cursor/rules/ai-workflow.mdc` | Agent behavior |
| `.cursor/rules/security-secrets.mdc` | Secrets policy |
| `.cursor/rules/testing-qa.mdc` | QA gates |
| `.cursor/rules/release-workflow.mdc` | Release order |

## What agents must not do

- Expose or commit `.env` contents
- Run `flutter` or `dart` commands
- Push without user confirmation
- Large refactors without explicit request
- Mark QA items done without device verification
