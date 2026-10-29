## MODIFIED Requirements

### Requirement: Allow-list only

The built plugin SHALL contain only `.claude-plugin/plugin.json`, `.mcp.json` (from `release/mcp.json`),
`dist/aiplus-office.mjs`, the files under `skills/`, `LICENSE`, and the public `README.md` and `NOTICE` (from
`release/`); no tests, sources, OpenSpec, docs or scratch files.

#### Scenario: No test or doc file

- **WHEN** the staged tree is listed
- **THEN** it holds no `src/`, `openspec/`, `docs/`, `node_modules/` or `*.test.ts`

#### Scenario: The server list is shipped under its plugin name

- **WHEN** the release builds from a commit that has `release/mcp.json`
- **THEN** the built plugin has `.mcp.json` with the same bytes
