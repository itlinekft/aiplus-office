## ADDED Requirements

### Requirement: One server for the four apps

`aiplus-office mcp [--root <dir>]` SHALL run one stdio MCP server for WordCraft, GridCraft, DeckCraft and PdfCraft. It
SHALL list each app's tools with the prefix `word_`, `grid_`, `deck_` or `pdf_`, route a `tools/call` to that app with
the tool's own name, and return the app's answer under the client's request id. Each app SHALL run through the
per-app proxy with the same confinement as `aiplus-office <app> mcp --root <dir>` (PdfCraft with `--compact`). A
`notifications/cancelled` SHALL reach the app that holds the request. `--root ${CLAUDE_PROJECT_DIR}` left unsubstituted
SHALL confine every app to the plain Chat folder. A tool name with no known prefix SHALL get a tool error.

#### Scenario: Shared tool names

- **WHEN** the client lists the tools
- **THEN** `word_list_commands`, `grid_list_commands` and `deck_list_commands` are separate tools, and a call to
  `deck_list_commands` reaches DeckCraft's server as `list_commands`

#### Scenario: Confinement unchanged

- **WHEN** a GridCraft call names a path outside the root
- **THEN** the gateway refuses it as before and the server never sees it

### Requirement: No app process before its first call

The combined server SHALL answer `initialize`, `ping` and `tools/list` without starting any app, from a tool manifest
bundled with the plugin. An installed app's server SHALL start at the first `tools/call` to that app and stay until the
client closes its input. An app with no installed version SHALL start (and download) when the combined server starts.
When an app's server runs, its own tool list SHALL replace the manifest's for that app, and the client SHALL get
`notifications/tools/list_changed` when the list differs. While an app downloads, its calls SHALL get the per-app
proxy's bilingual answer.

#### Scenario: A session that never calls a tool

- **WHEN** a client connects, lists the tools and calls none, with all four apps installed
- **THEN** exactly one process runs for the plugin and no `*craft-cli` is started

#### Scenario: The first call

- **WHEN** the client calls `word_open_document`
- **THEN** only WordCraft's server starts, and the call is answered by it
