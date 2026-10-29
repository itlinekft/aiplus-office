# plugin-packaging Specification

## Purpose
How the repository installs and runs as a Claude plugin from a plain git checkout: manifests, version parity, MCP
registration of the confined apps only, and the licence and attribution that travel with it.

## Requirements

### Requirement: Manifests

The repository SHALL carry `.claude-plugin/plugin.json` (name `aiplus-office`, version, description, author,
licence) and `.claude-plugin/marketplace.json` listing the plugin with source `./` and the same version as
`plugin.json` and `package.json`.

#### Scenario: Version parity

- **WHEN** the packaging test reads the three files
- **THEN** the three versions are equal

### Requirement: Runs without npm install

The command SHALL run from a checkout with only Node.js ≥ 20 installed: a committed bundle
`dist/aiplus-office.mjs` contains every runtime dependency, and it SHALL equal a fresh build of the sources.

#### Scenario: Bundle drift

- **WHEN** a source file changed and the bundle was not rebuilt
- **THEN** the packaging test fails and names `npm run build`

### Requirement: MCP servers of confined apps only

The plugin's `.mcp.json` SHALL register only WordCraft and PdfCraft (PdfCraft with `--compact`), confined to the
project directory, and SHALL NOT register GridCraft or DeckCraft.

#### Scenario: No unconfined server

- **WHEN** the packaging test reads `.mcp.json`
- **THEN** no entry's arguments contain `gridcraft`, `deckcraft` or `--allow-unconfined`

### Requirement: Installable in Cowork

The plugin SHALL NOT contain a top-level `bin/` directory (claude.ai and Cowork refuse to install a plugin that has one).

#### Scenario: No bin directory

- **WHEN** the packaging test lists the repository root
- **THEN** there is no `bin/` directory

### Requirement: Licence and attribution

The repository SHALL carry the MIT licence with both the ITLine Kft. copyright and the upstream copyright notice, a
NOTICE naming the upstream package, and `UPSTREAM.md` with the exact upstream commit sha, what was taken and what
was changed.

#### Scenario: Upstream notice kept

- **WHEN** LICENSE is read
- **THEN** it contains `Copyright (c) 2026 Robert Csakany` and the MIT permission notice

### Requirement: No project server list at the repo root

The repo SHALL NOT have a `.mcp.json` at its root: Claude Code reads that file as the project's own server list, and the
plugin's entries, which need `${CLAUDE_PLUGIN_ROOT}`, cannot start there. The plugin's server list SHALL live at
`release/mcp.json`.

#### Scenario: A root .mcp.json comes back

- **WHEN** the packaging test runs and the repo root holds `.mcp.json`
- **THEN** the test fails and names `release/mcp.json`
