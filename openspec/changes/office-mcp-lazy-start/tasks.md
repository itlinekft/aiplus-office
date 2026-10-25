# Tasks

## 1. Code

- [x] 1.1 `src/mcp-proxy.ts`: stdin read at once, provisioning in the background, the server spawned when the binary is there; a 2 s grace after the client's `initialize`, then the proxy's own answers (`initialize`, `ping`, `tools/list` with `<app>_status`, bilingual tool errors); the background handshake with the client's parameters, the switch to pass-through and `notifications/tools/list_changed`; a failed provisioning answers until stdin closes (exit 69) [REQ: Never wait on a download]
- [x] 1.2 The gateway path (GridCraft) through the same switch; the folder note in the proxy's own `initialize` answer [REQ: Never wait on a download]
- [x] 1.3 The plugin version in the proxy's `serverInfo` (`src/app-command.ts`, `src/bin/aiplus-office.ts`); `npm run build` [REQ: Never wait on a download]

## 2. Tests

- [x] 2.1 `src/__tests__/mcp-lazy-start.test.ts`: installed case unchanged; slow provisioning (initialize < 100 ms, status tool, tool error, list_changed, server tools and a call); a server whose initialize takes 1.5 s, also through the gateway; provisioning failure staying up until stdin closes; the client leaving during the download [REQ: Never wait on a download]
- [x] 2.2 X10 updated: a failed provisioning exits 69 once stdin closes [REQ: Never wait on a download]

## 3. Confirm on a real client

- [ ] 3.1 Claude Desktop on the Windows test PC, nothing installed, then installed: the four connectors connect, and the tools appear after `tools/list_changed` in the same session [REQ: Never wait on a download]
