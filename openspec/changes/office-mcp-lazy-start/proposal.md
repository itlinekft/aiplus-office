## Why

Two measurements on the Windows test PC (Claude Desktop 3.6556, plugin 0.1.11, 2026-10-25):

1. **21:22, no app installed yet.** A new session starts the four connectors; each proxy began the download before it
   answered `initialize`. Claude Desktop gave up after about 30 s (21:22:44 to 21:23:15), killed them, and Claude said
   the Word, PowerPoint and PDF connections had not started because the wait ran out. Partial downloads stayed behind
   as `.staging-*` folders.
2. **21:35, all apps installed.** Only the GridCraft connector (a 15 MB binary) connected; WordCraft, DeckCraft and
   PdfCraft (70 to 80 MB binaries) did not. The slow part is also the server's first start on that machine (likely the
   first scan of a large unsigned binary), not only the download.

The owner's goal: a connector never makes the MCP client wait on a download or a slow start, on every platform.

## What Changes

- The proxy reads stdin from the first moment and provisions in the background; the server is spawned as soon as the
  binary is there.
- If the server answers the client's `initialize` within 2 s of its arrival, nothing changes for the client.
- Otherwise the proxy answers `initialize` itself (the client's protocol version echoed, `tools.listChanged`), lists
  one `<app>_status` tool, answers `ping`, and answers every other `tools/call` with a tool error, Hungarian first, then
  English. When the server is ready it initializes it with the client's own parameters, switches to pass-through and
  sends `notifications/tools/list_changed`.
- A failed provisioning no longer exits at once: every call returns the error until the client closes stdin (exit 69).
- The GridCraft gateway works the same way; its folder note is also in the proxy's own `initialize` answer.
- Logs stay on stderr.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `office-mcp`: the proxy never keeps the client waiting on provisioning or on the server's start.

## Impact

`src/mcp-proxy.ts`, `src/app-command.ts` and `src/bin/aiplus-office.ts` (the plugin version reaches the proxy), the
bundle, a new test file and two test helpers. No version bump, no release in this change.
