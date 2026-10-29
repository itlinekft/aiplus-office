## ADDED Requirements

### Requirement: No project server list at the repo root

The repo SHALL NOT have a `.mcp.json` at its root: Claude Code reads that file as the project's own server list, and the
plugin's entries, which need `${CLAUDE_PLUGIN_ROOT}`, cannot start there. The plugin's server list SHALL live at
`release/mcp.json`.

#### Scenario: A root .mcp.json comes back

- **WHEN** the packaging test runs and the repo root holds `.mcp.json`
- **THEN** the test fails and names `release/mcp.json`
