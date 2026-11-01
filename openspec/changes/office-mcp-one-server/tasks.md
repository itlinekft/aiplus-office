# Tasks

## 1. Code

- [x] 1.1 `scripts/mcp-manifest.mjs` → `src/mcp-manifest.ts`: each app's `instructions` and `tools/list` from its real server (no root path in the file) [REQ: No app process before its first call]
- [x] 1.2 `src/mcp-hub.ts`: the combined server; prefixes, routing, id mapping, cancellation, the manifest answers, an app started at its first call (or at once when not installed), the live list replacing the manifest with `tools/list_changed` [REQ: One server for the four apps] [REQ: No app process before its first call]
- [x] 1.3 `aiplus-office mcp` in `src/bin/aiplus-office.ts`; `release/mcp.json` with one entry; version 0.1.23; `npm run build` [REQ: MCP servers of confined apps only]

## 2. Tests

- [x] 2.1 `src/__tests__/mcp-hub.test.ts`: no spawn on initialize/list; prefixed names; a call starts only its app and is routed unprefixed; the live list and `list_changed`; a not-installed app starts at once; cancellation; GridCraft refusal; close exits [REQ: One server for the four apps] [REQ: No app process before its first call]
- [x] 2.2 Packaging test: one entry [REQ: MCP servers of confined apps only]

## 3. Docs and measurement

- [x] 3.1 Skills (router, app skills, start) and README name the one server and the prefixed tools [REQ: One server for the four apps]
- [x] 3.2 `docs/MEASURED.md`: processes and RSS of an idle session before and after, with the commands [REQ: No app process before its first call]

## 4. Confirm on a real client

- [ ] 4.1 Claude Desktop on the Windows test PC: one „Aiplus office” connector, a plain Chat makes all four file types, a first run with nothing installed downloads while the session opens [REQ: One server for the four apps] [REQ: No app process before its first call]
