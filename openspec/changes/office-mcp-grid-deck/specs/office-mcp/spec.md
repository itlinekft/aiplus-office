## MODIFIED Requirements

### Requirement: Confined servers only by default

`aiplus-office <app> mcp` SHALL start the app's MCP server confined to one directory (`--root`, default the current
directory) for WordCraft, DeckCraft and PdfCraft through the server's own confinement, and for GridCraft through the
proxy (see "GridCraft confined by the proxy"). For an app whose row says `confinement: false` it SHALL refuse to start
unless `--allow-unconfined` is given, and SHALL then print a warning on stderr.

#### Scenario: DeckCraft confined

- **WHEN** the user runs `aiplus-office deckcraft mcp --root /proj`
- **THEN** the server is started with `--automation-read-root /proj --automation-write-root /proj`

#### Scenario: WordCraft confined

- **WHEN** the user runs `aiplus-office wordcraft mcp --root /proj`
- **THEN** the server is started with `--automation-read-root /proj --automation-write-root /proj`

#### Scenario: Unconfined row without opt-in

- **WHEN** an app row says `confinement: false` and the user runs `aiplus-office <app> mcp`
- **THEN** it exits 1 and says the server can read and write any path the user can

## ADDED Requirements

### Requirement: GridCraft confined by the proxy

For GridCraft (`confinement: "gateway"`) the proxy SHALL start `gridcraft-cli mcp` with no file option and SHALL:
list and accept only the allowlisted upstream tools; resolve every `path` argument (of a tool, or in the `params` of
`execute_command`) against the root and forward it as an absolute real path, refusing a path that resolves outside the
root, through `..`, a symlink or a dangling symlink; refuse `execute_command` for a command outside the allowed
namespaces or in the denied list (`link.*`, `automate.*`, `app.*`, `window.*`, `view.newWindow`, `file.print`); refuse
`execute_command` whose `params` hold a file, folder or URL key other than `path`; and answer every refusal itself as a
tool error, Hungarian first, then English, without forwarding the call. The root SHALL exist.

#### Scenario: Save outside the folder

- **WHEN** a client calls `save_workbook` with a path outside the root
- **THEN** the proxy answers a tool error naming the folder and the server never receives the call

#### Scenario: Relative path

- **WHEN** a client calls `save_workbook` with `arlista.xlsx`
- **THEN** the server receives `<root>/arlista.xlsx` as an absolute path

#### Scenario: Window-only tool hidden

- **WHEN** a client lists the tools
- **THEN** `screenshot` is not in the list, and calling it is refused

#### Scenario: Denied command

- **WHEN** a client calls `execute_command` with `link.open` or `automate.runScript`
- **THEN** the proxy refuses it
