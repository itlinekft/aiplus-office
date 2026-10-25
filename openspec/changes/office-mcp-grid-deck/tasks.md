# Tasks

## 1. Measure

- [x] 1.1 Upstream latest releases and their `mcp` options (GridCraft 0.12.1, DeckCraft 0.11.1, both 2026-10-25); DeckCraft's confinement probed on 0.10.0 and 0.11.1; GridCraft's tools and path-bearing commands listed; `docs/MEASURED.md` [REQ: Confined servers only by default] [REQ: GridCraft confined by the proxy]

## 2. Code

- [x] 2.1 `src/registry.ts`: DeckCraft `automation-roots`, 25 tools; GridCraft `gateway`, 20 tools [REQ: Confined servers only by default]
- [x] 2.2 `src/mcp-gateway.ts` (allowlist, path confinement, command policy, bilingual refusals) and its hook in `src/mcp-proxy.ts`; `npm run build` [REQ: GridCraft confined by the proxy]
- [x] 2.3 `.mcp.json`: the four apps, rooted at `${CLAUDE_PROJECT_DIR}` [REQ: MCP servers of confined apps only]

## 3. Tests and docs

- [x] 3.1 Unit tests: gateway policy, a stub GridCraft server driven through the proxy (handshake, `tools/list`, one `tools/call` per tool, refusals), the packaging and proxy tests for four entries [REQ: GridCraft confined by the proxy] [REQ: MCP servers of confined apps only]
- [x] 3.2 Real-app tests (`AIPLUS_OFFICE_E2E=1`): GridCraft and DeckCraft through `aiplus-office <app> mcp`, every listed tool called once, confinement refusals [REQ: GridCraft confined by the proxy] [REQ: Confined servers only by default]
- [x] 3.3 Repository README, `office-router`, `office-gridcraft`, `office-deckcraft`: the MCP route [REQ: Confined servers only by default]
