## Why

The owner asked for a connector for spreadsheets and slides too, not only for Word and PDF, and for it to be tested.
Until now the plugin registered only WordCraft and PdfCraft, because the registry said GridCraft's and DeckCraft's MCP
servers advertise no path confinement. Measured again on 2026-10-25 (`docs/MEASURED.md`):

1. **DeckCraft confines.** `deckcraft-cli mcp` takes `--automation-read-root DIR --automation-write-root DIR`, exactly
   like WordCraft, on 0.10.0 (the release the registry row was written against) and on 0.11.1 (latest). With the roots
   set it refuses a save, an export, an open, a picture, a `run_command file.saveAs`, a `batch` step, a `..` escape, a
   symlink escape and a relative path outside the roots. The registry row (`confinement: false`) was stale.
2. **GridCraft does not.** `gridcraft-cli mcp [--connect PORT] [--in FILE | --sample NAME]` (0.12.1, latest) has no
   confinement option; its `open_workbook`, `save_workbook`, `screenshot` and `execute_command` (353 commands, among
   them `file.*`, `insert.picture`, `data.fromTextCsv`, `data.getData`, `pageLayout.background`, `link.open`,
   `automate.runScript`) reach any path the user can.

## What Changes

- DeckCraft's registry row: `confinement: "automation-roots"`, 25 tools. `aiplus-office deckcraft mcp` then runs
  confined to the project folder the same way as WordCraft.
- GridCraft gets a new confinement kind, `gateway`: `aiplus-office gridcraft mcp --root DIR` runs the upstream server
  without roots and confines it in the proxy. It lists and accepts only an allowlist of upstream tools (20; the
  window-only `screenshot` is dropped), resolves every `path` argument against DIR and refuses one that leaves DIR
  (also through `..` or a symlink, or a dangling symlink), and lets `execute_command` run only commands of the
  in-workbook namespaces, never `link.*`, `automate.*`, `app.*`, `window.*`, `view.newWindow` or `file.print`, and
  never a command whose parameters carry a file, folder or URL key other than `path`. A refusal is a tool error in
  Hungarian, then English. Nothing new is invented: every tool is the upstream server's own.
- `.mcp.json` registers all four apps, each rooted at `${CLAUDE_PROJECT_DIR}`.
- `aiplus-office gridcraft|deckcraft mcp` no longer need `--allow-unconfined`; the unconfined route stays in the code for
  an app row with `confinement: false` (none today).
- Repository README, `office-router`, `office-gridcraft`, `office-deckcraft`: the MCP route of each app.

Not in this change: the user-facing promise copy (plugin description, public README, `office-start`) that says a plain
Chat handles Word and PDF only. It changes after the Windows test in Claude Desktop shows the two new connectors
working in a plain Chat; the version bump and the release belong to the same step.

## Capabilities

### Modified Capabilities

- `office-mcp`: DeckCraft is confined by its own server; GridCraft is confined by the proxy (gateway).
- `plugin-packaging`: `.mcp.json` registers the four apps, all confined.

## Impact

`src/registry.ts`, `src/mcp-proxy.ts`, new `src/mcp-gateway.ts`, the bundle, `.mcp.json`, tests (`mcp-apps`,
`mcp-proxy`, new `mcp-gateway`, `real-apps`, `packaging`, `cli`, `skills`), the repository README, three skills,
`docs/MEASURED.md`.
