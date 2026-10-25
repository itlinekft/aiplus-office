# Tasks

## 1. Provisioning

- [x] 1.1 `src/provision.ts`: on win32 the listing and the extraction call `<SystemRoot>\System32\tar.exe` (env, default `C:\Windows`); unit tests for both scenarios; `npm run build` [REQ: Windows archives with the system tar]

## 2. Copy

- [x] 2.1 `plugin.json` description (Hungarian, then English), public README (`release/README.md`), repository README: Excel and PowerPoint need Claude on the user's own computer; a cloud session cannot download the apps [REQ: Surfaces said plainly] [REQ: Bilingual user-facing text]
- [x] 2.2 `office-start`: no-shell fallback, surfaces block and table, the one tested block (dated 2026-10-25), the close, the installed-app paragraph; `office-router` surface line [REQ: Readiness check] [REQ: Surfaces said plainly] [REQ: Tested status in one place] [REQ: An installed app reused]
- [x] 2.3 No em dash in any skill description; ITLine's copy check on every changed user-facing text [REQ: Bilingual user-facing text]

## 3. Release

- [x] 3.1 Version 0.1.3, CHANGELOG, `docs/MEASURED.md`; tests updated and green, typecheck, `claude plugin validate` [REQ: Surfaces said plainly]
- [x] 3.2 Stage into the local marketplace clone (push disabled), leak scan, validate, commit there; never push [REQ: Surfaces said plainly]
