# Tasks

## 1. CLI

- [x] 1.1 `src/status.ts` `desktopCacheRoots`, `status` text prints `desktop cache:`; unit tests (present, absent, off Windows, `AIPLUS_OFFICE_HOME`) [REQ: Status names Claude Desktop's own copy]

## 2. Copy

- [x] 2.1 `office-start`: description (plain Chat: all four), intro (Claude Desktop downloads by itself; never a download without a yes), status table row `desktop cache:`, the already-downloaded block (HU/EN), provenance folder; `office-router`; tests [REQ: Readiness check] [REQ: Provenance stated]
- [x] 2.2 Public and repository README, user guide (HU/EN): when the download happens, Claude Desktop's folder [REQ: Readiness check] [REQ: Provenance stated]

## 3. Release and measure

- [x] 3.1 Version 0.1.16, CHANGELOG, `docs/MEASURED.md`; build, tests, validate; release to the marketplace [REQ: Status names Claude Desktop's own copy] [REQ: Readiness check]
- [x] 3.2 Measured on Windows after the release: fresh install, emptied cache; `status` shows `desktop cache:`; „Hogyan kezdjem az AI+ Iroda modult?” gets the already-downloaded block with that folder [REQ: Provenance stated] [REQ: Readiness check]
- [x] 3.3 The 0.1.16 measurement showed the connectors start with Claude or a session, not on „Add”: copy corrected, an app still downloading in a Desktop session reported as such; version 0.1.17 [REQ: Readiness check]
