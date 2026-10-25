# aiplus-office

A Claude plugin of the ITLine AI+ line, shown to users as „Ingyenes irodai AI+ modul” (id `aiplus-office`, block code
`office`). It lets Claude create and edit **DOCX, XLSX, PPTX and PDF** files with the free, open-source ArtCraft apps: 
**WordCraft, GridCraft, DeckCraft and PdfCraft**: driven headless through their command-line tools, with a mechanical
check of every file it produces and worked Hungarian office workflows (árajánlat, árlista, prezentáció).

Derived from an MIT-licensed package; see [UPSTREAM.md](UPSTREAM.md) and
[NOTICE](NOTICE).

## Read this first: the apps are early alpha

The ArtCraft office apps appeared in October 2026 and are released almost daily. They open and save real Office
formats, but not everything in a Microsoft Office file survives: there are no VBA macros, formatting the apps do not
support may change on save, and a PowerPoint file with comments saved back by DeckCraft was reported to be rejected by
PowerPoint. So:

- work on a copy of an existing file, never on the original;
- every file meant for a customer is checked before it leaves the office (`aiplus-office verify`, plus one rendered page
  looked at): the skills make Claude do this;
- do not promise that the result is identical to what Microsoft Office would produce.

## What works where: said plainly

| Where the user works | Word (DOCX) | PDF | Excel (XLSX) | PowerPoint (PPTX) |
|---|---|---|---|---|
| Claude Desktop, plain Chat (no shell) | yes, MCP | yes, MCP | no | no |
| Claude Desktop, a “This computer” session | yes | yes | yes | yes |
| Claude Code | yes | yes | yes | yes |
| a session running in the cloud (Cowork measured) | not measured | not measured | no | no |

Only WordCraft and PdfCraft are registered MCP servers (the Desktop install dialog lists exactly
`aiplus-office-wordcraft` and `aiplus-office-pdfcraft`, measured 2026-10-24 on Windows 11). GridCraft and DeckCraft run
through the shell, so **Excel and PowerPoint files need Claude running on the user's own computer** (Claude Code, or a
Claude Desktop session whose environment is “This computer”); a plain Chat cannot make them, and a session in the cloud
cannot download the apps (measured 2026-10-24: a Cowork session in the cloud made no file). The table
is the design; what has actually been tried is kept in one block of `skills/office-start/SKILL.md`
(`office-start:tested`), with details in `docs/MEASURED.md`.

## What is inside

| Part | What it does |
|---|---|
| `skills/office-start` | first run: Node.js + `status`, where the apps come from, `install --all` on a yes, what works where, the desktop apps' download pages (Hungarian and English) |
| `skills/office-router` | picks the app, the plan → discover → execute → save → verify loop, the alpha caveat |
| `skills/office-wordcraft`, `office-gridcraft`, `office-deckcraft`, `office-pdfcraft` | one skill per app: its CLI dialect, traps and tested recipes |
| `skills/office-doc-publish` | Markdown + the company's DOCX template → filled DOCX + PDF (example: árajánlat) |
| `skills/office-deck` | outline → slides → PDF handout (example: a Hungarian quarterly deck) |
| `skills/office-data-visual` | numbers → workbook with formulas and a read-back → chart → slide (example: árlista with 27% ÁFA) |
| `dist/aiplus-office.mjs` | the `aiplus-office` command (one self-contained Node.js file) |
| `.mcp.json` | MCP servers for clients without a shell: WordCraft and PdfCraft only, confined to the project folder |

## Install

Requirements: **Node.js 20 or newer** on the machine. The four apps are downloaded on first use (20–100 MB each) from
their official GitHub releases (`github.com/storytold/<app>`), each archive checked against the release's
`SHA256SUMS.txt`, into a per-user cache (`~/.cache/aiplus-office` on Linux, `~/Library/Caches/aiplus-office` on macOS,
`%LOCALAPPDATA%\aiplus-office` on Windows). Nothing is installed system-wide; no administrator rights are needed.
Linux needs glibc 2.35 or newer.

Users install it from the public marketplace `itlinekft/aiplus-plugins` (see `release/README.md`, shipped as the plugin's
README). For users: the [user guide](docs/user-guide.md) and the [troubleshooting guide](TROUBLESHOOTING.md), both
Hungarian first, then English. Claude Code, from a local checkout of this repository:

```bash
claude plugin marketplace add /path/to/aiplus-office      # the repo carries a local dev marketplace
claude plugin install aiplus-office@aiplus-office-dev
```

Optional pre-download and a check:

```bash
node /path/to/aiplus-office/dist/aiplus-office.mjs install --all
node /path/to/aiplus-office/dist/aiplus-office.mjs status
```

**Cowork / Claude Desktop:** the plugin installs in Claude Desktop on Windows 11 (0.1.0, 2026-10-24). A Cowork session
that ran in the cloud could not download the apps from GitHub; a local Claude Code session on the same PC made and read
back an XLSX (2026-10-24, `docs/MEASURED.md`; the current status lives in `office-start`). The plugin deliberately has
no `bin/` directory (a plugin with one is not installed there). On Windows the apps are unpacked with the system's own
`%SystemRoot%\System32\tar.exe`, never a `tar` from PATH (Git for Windows ships a GNU tar that breaks on `C:` paths).

## The command

```text
aiplus-office apps | status | install <app…>|--all
aiplus-office <app> ensure | path | exec <args…> | mcp [--root <dir>] [--register]
aiplus-office verify <file> [--pages N] [--text-contains S] [--size WxH] …
aiplus-office doc prepare <in.md> --out <dir> [--template NAME] [--templates-dir DIR] [--var k=v]…
```

Apps: `wordcraft`, `gridcraft`, `deckcraft`, `pdfcraft`. Environment: `AIPLUS_OFFICE_HOME` (cache root),
`AIPLUS_OFFICE_<APP>_VERSION` (pin a release), `AIPLUS_OFFICE_<APP>_BIN` (use your own binary),
`AIPLUS_OFFICE_TEMPLATES_DIR` (company templates for `doc prepare`), `GITHUB_TOKEN` (GitHub API rate limit).
Exit codes: 0 ok, 1 usage/failure, 69 provisioning failure; `verify` 0/1/2/3 (3 = probe tool missing).

## MCP and confinement

WordCraft and PdfCraft MCP servers support path confinement; the plugin registers them confined to the project folder
(`${CLAUDE_PROJECT_DIR}`; a root that arrives unexpanded is refused). GridCraft's and DeckCraft's servers advertise no
confinement: they could read and write any file the user can, so they are **not** registered; Claude uses them
through the shell, in the project folder. `aiplus-office <app> mcp --allow-unconfined` exists as an explicit opt-in.

## Development

```bash
npm install
npm test                    # unit + lint tests (offline)
AIPLUS_OFFICE_E2E=1 AIPLUS_OFFICE_E2E_HOME=~/.cache/aiplus-office npm test   # + real binaries, every skill recipe
npm run build               # rebuild dist/aiplus-office.mjs after any change under src/ (a test checks it)
claude plugin validate .
```

Changes go through OpenSpec (`openspec/`). Measurements on real binaries are in `docs/MEASURED.md`.

## Licence

MIT: see [LICENSE](LICENSE) (ITLine Kft. and the upstream copyright). The ArtCraft apps are separate projects
(MIT OR Apache-2.0) and are not redistributed here.
