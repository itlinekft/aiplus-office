# Tasks

## 1. Move

- [x] 1.1 `git mv .mcp.json release/mcp.json`; the release allow-list maps it to `.mcp.json`; release test and packaging test updated (the packaging test refuses a root `.mcp.json`); README names the new place [REQ: Allow-list only] [REQ: No project server list at the repo root]

## 2. Check

- [x] 2.1 `npm test`, `npm run typecheck`; `node scripts/release.mjs --out <tmp>` gives a `.mcp.json` equal to the one the marketplace ships now; `claude mcp list` in the repo shows no `aiplus-office-*` entry; a session with `--plugin-dir <tmp>` lists the four servers [REQ: Allow-list only] [REQ: No project server list at the repo root]
