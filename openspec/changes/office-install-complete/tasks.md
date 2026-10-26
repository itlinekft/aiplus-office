# Tasks

## 1. jq

- [x] 1.1 `src/jq.ts` (pinned 1.8.2, six hosts, SHA-256 from `sha256sum.txt`), `aiplus-office jq`, the `status` line; `src/__tests__/jq.test.ts` [REQ: jq for the workflow gates]
- [x] 1.2 The fallback line under the command line in every skill that runs jq; a skills test [REQ: jq fallback in the skills]
- [x] 1.3 Real runs: Linux x64 (`aiplus-office jq -n '{a:1}|.a+1'` → 2) and Windows 11 Git Bash with no jq (the fallback function, a `jq -e` gate, a subshell; `docs/MEASURED.md`) [REQ: jq for the workflow gates] [REQ: jq fallback in the skills]

## 2. Install text

- [x] 2.1 User guide (HU, EN): measured Desktop steps, remove, update, files per session kind, Launcher; stale lines out [REQ: Install steps as measured]
- [x] 2.2 Shipped README: the real Claude Code commands, the Desktop steps, Reconnect, no „only with your yes” [REQ: Install steps as measured]
- [x] 2.3 Troubleshooting (HU, EN): Reconnect, „not installed” after install, plain-Chat folder, `jq`; the 0.1.15-fixed entry marked fixed, the obsolete connector entry removed [REQ: Install steps as measured]

## 3. Release

- [x] 3.1 Version 0.1.19, CHANGELOG; build, typecheck, tests; release to the marketplace [REQ: jq for the workflow gates]
