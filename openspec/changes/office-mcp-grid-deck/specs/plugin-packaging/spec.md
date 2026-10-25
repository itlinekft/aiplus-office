## MODIFIED Requirements

### Requirement: MCP servers of confined apps only

The plugin's `.mcp.json` SHALL register WordCraft, GridCraft, DeckCraft and PdfCraft (PdfCraft with `--compact`), each
confined to the project directory, and SHALL NOT pass `--allow-unconfined` to any of them.

#### Scenario: No unconfined server

- **WHEN** the packaging test reads `.mcp.json`
- **THEN** there are four entries, each with `mcp --root ${CLAUDE_PROJECT_DIR}`, none with `--allow-unconfined`, and
  no registered app's row says `confinement: false`
