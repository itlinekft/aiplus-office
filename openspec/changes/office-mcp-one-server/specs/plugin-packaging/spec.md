## MODIFIED Requirements

### Requirement: MCP servers of confined apps only

The plugin's `.mcp.json` SHALL register one server, `aiplus-office`, running `aiplus-office mcp` confined to the
project directory, and SHALL NOT pass `--allow-unconfined`. No registered app's row SHALL say `confinement: false`.

#### Scenario: No unconfined server

- **WHEN** the packaging test reads `.mcp.json`
- **THEN** there is one entry, `aiplus-office`, with `mcp --root ${CLAUDE_PROJECT_DIR}`, none with
  `--allow-unconfined`, and no registered app's row says `confinement: false`
