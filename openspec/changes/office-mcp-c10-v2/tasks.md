# Tasks

## 1. Server

- [x] 1.1 `src/mcp-hub.ts`: closed envelope, notification rule, fixed error sentences, unknown tool and non-object `arguments` −32602 [REQ: Exact MCP wire (C10 v2)]
- [x] 1.2 `src/mcp-hub.ts`: own line reader (4 MiB cap, CRLF, blank lines) [REQ: Exact MCP wire (C10 v2)]
- [x] 1.3 `src/mcp-hub.ts`: `serverInfo.contractVersion` 1, pinned by a test [REQ: Exact MCP wire (C10 v2)]
- [x] 1.4 `src/mcp-hub.ts`: input check against `inputSchema`, catalogue keys, `additionalProperties: false` in `tools/list` [REQ: Tool input checked before an app runs]
- [x] 1.5 `src/mcp-hub.ts`: `office_status` [REQ: Status without an app]
- [x] 1.6 `src/bin/aiplus-office.ts`: exit after stdout drains [REQ: Replies survive the end of input]
- [x] 1.7 Unit tests for each frame; `npm run build`; tests and typecheck green [REQ: Exact MCP wire (C10 v2)]

## 2. Measure

- [x] 2.1 The family C10 checker against `dist/aiplus-office.mjs mcp` with `--probe-tool office_status`, no network: every frame passes (`docs/MEASURED.md`, with no private path or repo name) [REQ: Exact MCP wire (C10 v2)]
- [x] 2.3 Review findings folded in: stdin "close"/"error" end the server; the exit has a 2 s fallback and survives EPIPE; null for an optional argument passes; a fault inside a frame answers -32603; the checker re-run gives 23/23 [REQ: Exact MCP wire (C10 v2)]
- [x] 2.2 0.1.24: At the next version bump, a `CHANGELOG.md` line [REQ: Exact MCP wire (C10 v2)]
