# Upstream

| | |
|---|---|
| Source | an MIT-licensed package, reused with its author's permission; ITLine keeps the exact source and commit on record |
| Licence | MIT, Copyright (c) 2026 Robert Csakany: kept in LICENSE and NOTICE |
| Read | 2026-10-24 |

Only that one package was taken; nothing else of its repository.

## Taken and adapted

| Upstream | Here | Change |
|---|---|---|
| `src/registry.ts` | `src/registry.ts` | 13 apps → 4 (WordCraft, GridCraft, DeckCraft, PdfCraft); web-build fields dropped; env prefix `AIPLUS_OFFICE_<APP>`; PdfCraft tool count 163 → 175 (measured, 0.13.0) |
| `src/provision.ts` | `src/provision.ts` | launcher source (`CRAFT_SOURCE`) and `provisionWeb` dropped; cache root `AIPLUS_OFFICE_HOME` or the per-user cache dir (was the upstream agent's tool folder); marker `.aiplus-office-asset`; user agent `aiplus-office` |
| `src/status.ts` | `src/status.ts` | no source column; reports the cache path |
| `src/app-command.ts`, `src/command-ids.ts` | same | renamed prog only |
| `src/mcp-proxy.ts` | same | refuses a `--root` holding an unexpanded `${…}` (new) |
| `src/mcp-register.ts` | same | writes the project `.mcp.json` (Claude Code) instead of the upstream agent's MCP file; entry `aiplus-office-<app>`, `type: stdio`, explicit `--root <project>` for confined apps |
| `src/verify.ts` | same | renamed prog only |
| `src/doc-prepare.ts` | same | nano-banana diagram route removed (`nano_banana` key → ignored); the templates variable renamed `AIPLUS_OFFICE_TEMPLATES_DIR`; Hungarian month names accented |
| `src/bin/craft.ts` | `src/bin/aiplus-office.ts` | command `aiplus-office`; `launcher` subcommand removed; `--version` added |
| the CLI launcher | `cli/aiplus-office` | launcher renamed, runs `dist/aiplus-office.mjs` |
| `scripts/build.mjs`, `scripts/record-fixtures.mjs` | same | one bundle `dist/aiplus-office.mjs` (committed); four apps |
| a sibling workspace package's `exec` helpers | `src/exec.ts` | **not copied**: two small wrappers re-written on `node:child_process` |
| the `craft-studio` skill | `skills/office-router` | office apps only, the command spelled through `${CLAUDE_PLUGIN_ROOT}`, alpha caveat, "Office jobs" |
| the `wordcraft`, `gridcraft`, `deckcraft`, `pdfcraft` skills | `skills/office-<app>` | Hungarian triggers and recipes; traps re-measured on the current releases |
| the `craft-doc-publish` skill | `skills/office-doc-publish` | no `document-converter`/nano-banana; Hungarian árajánlat example |
| the `craft-deck` skill | `skills/office-deck` | no `deck3d` branch, no transition step; Hungarian deck example |
| the `craft-data-visual` skill | `skills/office-data-visual` | VectorCraft/DesignCraft/PhotoCraft steps removed; GridCraft → PdfCraft render → DeckCraft; árlista with 27% ÁFA |
| tests (`src/__tests__/*`) | same | ported where they apply: provision, provision-apps, cli, mcp-proxy, mcp-apps, mcp-register, security, verify, doc-prepare, registry, real-apps, skills-drift, skills-recipes; `skills.test.ts` and `packaging.test.ts` rewritten |

## Not taken

The nine non-office apps and their skills; the media workflows; `craft-brand-kit` and `craft-photo-pipeline` (they need
VectorCraft/PhotoCraft/DesignCraft/LightCraft); `region-replace.ts` and the PhotoCraft launcher; `launcher.ts` and
`launcher-install.ts`; `zip-guard.ts` (only used by the web builds); the upstream agent's package manifest; tests for the dropped parts.

## Updating

Compare the upstream package at a newer commit against the recorded one, port what applies by hand, and update
this file.
