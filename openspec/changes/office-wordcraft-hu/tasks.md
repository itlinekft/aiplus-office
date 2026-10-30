# Tasks

## 1. Code

- [x] 1.1 `src/registry.ts`: per-host repository (`hostRepos`, `repoFor`); WordCraft `win32/x64` → `tatargabor/wordcraft`; unit tests [REQ: Repository per host]
- [x] 1.2 `src/provision.ts`: lookup and URL pin through `repoFor`; `latest.json` records `repo`, a mismatch is ignored (also in `status`); unit tests [REQ: Repository per host] [REQ: Latest-release cache keyed by repository]
- [x] 1.3 `src/dictionary.ts` + `aiplus-office dict hu`: pinned LibreOffice commit, SHA-256 per file, atomic install; unit tests with a fixture server [REQ: Hungarian dictionary on request]
- [x] 1.4 `aiplus-office wordcraft …` sets `WORDCRAFT_DICTIONARIES` when installed and unset; `status` dictionary line; unit tests [REQ: WordCraft finds the dictionary] [REQ: Status names the dictionary]
- [x] 1.5 `npm run build`; tests and typecheck green [REQ: Repository per host]
- [x] 1.6 `status` and `dict hu` name Claude Desktop's own package copy of the dictionary when it has one (`huDesktopDir`); unit test [REQ: Status names the dictionary]
- [x] 1.7 Each install records its repository (`.aiplus-office-repo`); a connector's prefer-installed path skips installs from another repository (`installedRepo`); regression test [REQ: A connector serves an installed build only from the current repository]

## 2. Copy

- [x] 2.1 `office-start` (HU/EN): where WordCraft comes from on Windows, the dictionary on a yes, the desktop app (download, Dictionaries folder, Later); README "where the apps come from" [REQ: Hungarian spell checking said plainly]

## 3. Release

- [x] 3.1 Version 0.1.21, CHANGELOG, `docs/MEASURED.md` [REQ: Repository per host]
- [x] 3.2 Measured on the Windows test PC: `dict hu`, `install wordcraft`, `wordcraft exec run … review.issues` marks the planted typos [REQ: WordCraft finds the dictionary]
