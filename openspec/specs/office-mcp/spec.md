# office-mcp Specification

## Purpose
The per-app stdio MCP servers of the office apps, run through a proxy that enforces path confinement, refuses
desktop bridging and serialises tool calls, so a chat client without a shell can still use WordCraft and PdfCraft.

## Requirements

### Requirement: Confined servers only by default

`aiplus-office <app> mcp` SHALL start the app's MCP server confined to one directory (`--root`, default the current
directory) for WordCraft and PdfCraft. For GridCraft and DeckCraft, whose servers advertise no confinement, it SHALL
refuse to start unless `--allow-unconfined` is given, and SHALL then print a warning on stderr.

#### Scenario: GridCraft without opt-in

- **WHEN** the user runs `aiplus-office gridcraft mcp`
- **THEN** it exits 1 and says the server can read and write any path the user can

#### Scenario: WordCraft confined

- **WHEN** the user runs `aiplus-office wordcraft mcp --root /proj`
- **THEN** the server is started with `--automation-read-root /proj --automation-write-root /proj`

### Requirement: Unexpanded root refused

The proxy SHALL refuse a `--root` value that still contains `${`, so a client that did not expand a variable never
starts a server confined to a literal, unintended path.

#### Scenario: Literal variable

- **WHEN** the proxy receives `--root '${CLAUDE_PROJECT_DIR}'`
- **THEN** it exits 1 with a message naming the unexpanded variable

### Requirement: Bridging options rejected

The proxy SHALL reject `--bridge`, `--connect`, `--control-token`, `--automation-read-root` and
`--automation-write-root` from the user: confinement belongs to the proxy, and it never attaches to a desktop app.

#### Scenario: Bridge flag

- **WHEN** the user passes `--connect`
- **THEN** the proxy exits 1 without starting the server

### Requirement: Serialised tool calls

The proxy SHALL forward `tools/call` requests to the server one at a time, releasing the next only after the previous
id was answered (or a cancelled call's grace period ran out), and SHALL send non-JSON server output to stderr so it
never corrupts the MCP channel.

#### Scenario: Pipelined calls

- **WHEN** a client sends two `tools/call` requests without waiting
- **THEN** the server receives the second only after it answered the first

### Requirement: Opt-in project registration

`aiplus-office <app> mcp --register` SHALL add an `aiplus-office-<app>` entry to the project's `.mcp.json`, merging
with existing entries, refusing to write through a symlink, leaving a malformed file untouched, and refusing an
unconfined app without `--allow-unconfined`. Nothing SHALL be registered implicitly.

#### Scenario: Merge with an existing file

- **WHEN** `.mcp.json` already has another server
- **THEN** after `--register` both entries are present and the file is valid JSON
