## MODIFIED Requirements

### Requirement: Allow-list only

The built plugin SHALL contain only `.claude-plugin/plugin.json`, `.mcp.json`, `dist/aiplus-office.mjs`, the files under
`skills/` and `hooks/`, `LICENSE`, `TROUBLESHOOTING.md`, the user guide as `USER-GUIDE.md`, and the public `README.md` and
`NOTICE` (from `release/`); no tests, sources, OpenSpec, other docs or scratch files.

#### Scenario: No test or doc file

- **WHEN** the staged tree is listed
- **THEN** it holds no `src/`, `openspec/`, `docs/`, `node_modules/` or `*.test.ts`

#### Scenario: The session hook ships

- **WHEN** the staged tree is listed
- **THEN** it holds `hooks/hooks.json` and `hooks/session-context.md`
