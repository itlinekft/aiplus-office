# Measured

Real runs on real binaries. Each entry: date, machine, versions, the exact commands, the result. A claim about the apps
that is not here is not measured.

## 2026-10-26 (night, later) — Windows 11, Claude Desktop 3.6556, aiplus-office 0.1.17: routing without connectors (change office-session-routing)

Node.js hidden (`C:\Program Files\nodejs` renamed), the plugin and the marketplace re-added, the cache emptied; then
Node.js restored while the connectors stayed cached as failed. The same request in new Code sessions, „Készíts árlistát
táblázatban három termékkel, 27% ÁFÁ-val, a fájl neve legyen <name>.xlsx” (tool calls read from the session logs):

| name | Node.js | first call | then | result |
|---|---|---|---|---|
| `arlista-nonode` | missing | `python -c "import openpyxl"` | PowerShell, a hand-built XLSX („a fájlnév alapján Node nélkül kell”) | a file, not with AI+ Iroda |
| `arlista-m9` | missing | `Skill office-gridcraft` | `node: command not found`, `office-start` | honest stop, no file, the to-do named |
| `arlista-m10` | back | `python -c "import openpyxl"` | Excel automation checked, PowerShell, a hand-built XLSX | a file, not with AI+ Iroda; no skill loaded |
| `arlista-m11` | back | `python -c "import openpyxl"` | `node -v; which aiplus-office`, `Skill office-gridcraft`, the CLI | the file with AI+ Iroda |

A SessionStart hook in a Desktop Code session runs in Git Bash (`/usr/bin/bash` 5.3.15) and its standard output reaches
the context (a project hook that printed a test word: the session quoted it).

## 2026-10-26 (night) — Windows 11, Claude Desktop 3.6556, aiplus-office 0.1.15 fresh install (change office-desktop-truth)

The plugin and the marketplace removed and added again; Claude quit; the app cache emptied; Claude started.

- **The download happens at Claude's start, unasked.** The four app folders appeared at 01:30:58 and their versions by
  01:31:05 (GridCraft 0.12.1, DeckCraft 0.11.1, WordCraft 0.11.0, PdfCraft 0.14.0), about 20 s after Claude started and
  before any prompt. „Hogyan kezdjem az AI+ Iroda modult?” in a Code session then ran `office-start`, which checked
  Node.js 22.11.0 and said all four were already downloaded.
- **Claude Desktop's cache is redirected.** It is a packaged app: the apps were in
  `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Local\aiplus-office`; `%LOCALAPPDATA%\aiplus-office`, the
  folder `office-start` named, did not exist outside Claude. (Deleting the unredirected path had emptied nothing.)
- **0.1.16, plugin and marketplace removed and added again, cache emptied:** 60 s after „Add” no connector of the
  module ran; opening a new Code session started them, and the four apps were in place about 10 s later (01:54:23–24).
  Claude Desktop also started the removed plugin's connectors once more at its next start (interrupted downloads left
  as `.staging-*`, swept by a later run after an hour). `office-start` then said two apps were there and two were
  downloading by themselves, and named the `Packages\Claude_…\LocalCache` folder.
- **„hogyan kezdjem?” without the module's name**, in a folder that another plugin also serves, got a general menu from
  Claude, not `office-start`; with the name it ran `office-start`.
- **Code session:** „Készíts árlistát táblázatban három termékkel, 27% ÁFÁ-val” → `office-gridcraft`, `arlista-m7.xlsx`
  in the session folder in under 30 s; 2 490 Ft net → 672 Ft VAT (672.30 rounded per line), totals 17 990 / 4 857 /
  22 847 Ft; all 9 formulas recalculated by the app and matched.
- **Plain Chat:** a short Word letter → WordCraft, `Documents › AI+ Iroda › level-m8.docx`; four missing details left as
  marked placeholders and named.

## 2026-10-26 — Windows 11, Claude Desktop 3.6556: plain Chat, Code sessions, the ArtCraft Launcher (changes office-honest-fallback, office-chat-folder)

A Windows 11 test PC (Hungarian, administrator user), driven with desktape; screens read by three models.

- **Plain Chat, before:** Claude Desktop starts the plugin's servers itself (`LocalMcpServerManager`), but passes
  `${CLAUDE_PROJECT_DIR}` unsubstituted; all four refused it and Claude said no AI+ Iroda connector was available.
- **Plain Chat, after (`--root ${CLAUDE_PROJECT_DIR}` → Documents › „AI+ Iroda”):** the four servers announced 16
  (WordCraft), 25 (DeckCraft), 20 (GridCraft) and 17 (PdfCraft) tools; one Chat made `arlista.xlsx`, then
  `arajanlat_Minta_Kft.docx`, `.pdf` and a two-slide `.pptx` in that folder (about 4 minutes for the three).
- **Code session, „This computer”:** a price list (GridCraft, VAT by formula, totals 26 012 / 7 023 / 33 035 Ft), an offer
  from a DOCX template (WordCraft, about 2 minutes), three slides from it (DeckCraft, about 2.5 minutes), the offer and
  a terms PDF merged, the last page removed and a password set (PdfCraft), the total read back from the PDF.
- **Without Node.js** the servers fail at once; after installing it and restarting Claude they still showed
  „Reconnect” for 15 minutes („recent failure cached”), until Reconnect was clicked (GridCraft then up in 0.15 s).
- **A cloud session** (Claude-mode chat with a shared folder before the fix) could not download the apps (GitHub 401)
  and, before 0.1.14's rule, built the file with a generic library, saying so.
- **A closing `python -c` check** hit the Windows Store stub (exit 49) and marked a correct GridCraft run as failed.
- **Node launcher script** in place of `node` in `.mcp.json`: a Code session ran it; the plain Chat's starter did not
  (connection closed): dropped.
- **ArtCraft Launcher 0.8.1** (`windows-x64.msi`, SHA-256 as published): Edge warns that the file is rarely
  downloaded; the wizard installs per user without UAC; WordCraft, GridCraft, DeckCraft, PdfCraft each installed in
  4–12 s into `C:\Program Files\<App>` (no UAC prompt for an administrator); no file types registered. GridCraft drops
  keys typed instantly after the key that starts a cell edit.

## 2026-10-24 — Linux x86_64, first real run (change office-plugin-v1)

**Machine:** Ubuntu 22.04, glibc 2.35, Node.js v25.6.1, x86_64. Cache: the default `~/.cache/aiplus-office`.
**Command:** `node dist/aiplus-office.mjs` (bundle of this repo at the time of the run).

### Provisioning (checksum-verified) — PASS, all four apps

```bash
node dist/aiplus-office.mjs gridcraft ensure   # likewise wordcraft, pdfcraft, deckcraft
```

| App | Version (latest) | Asset | Size | Time | SHA-256 (matches the release's SHA256SUMS.txt) |
|---|---|---|---|---|---|
| GridCraft | 0.11.1 | `gridcraft-0.11.1-linux-x86_64.tar.gz` | 20 MB | 6.0 s | `f2c83e6c26449a6c45983e903bf32c1d4c302b2042f263ead995271129c70e87` |
| WordCraft | 0.10.0 | `wordcraft-0.10.0-linux-x86_64.tar.gz` | 97 MB | 29.4 s | `ca99ea350ba0aea4103fc8020cad98f051c58d9e9fcf670c119d810108cc45ff` |
| PdfCraft | 0.13.0 | `pdfcraft-cli-0.13.0-linux-x86_64.tar.gz` (CLI-only asset preferred) | 30 MB | 5.8 s | `fd40f80157856cadd4348a464ef0acde8f19894d831d78e9823708ecf70a3352` |
| DeckCraft | 0.10.0 | `deckcraft-0.10.0-linux-x86_64.tar.gz` | 78 MB | 23.2 s | `546616eb2300ce8efb20b44a53e60abfe6b96d71ac606b452a36fd21c6b1ff28` |

`<app>-cli --version` printed `gridcraft-cli 0.11.1`, `wordcraft-cli 0.10.0`, `pdfcraft-cli 0.13.0`,
`deckcraft-cli 0.10.0`. The install only completes when the streamed SHA-256 equals the sums entry (fail-closed paths
are covered by the unit tests: missing sums, missing entry, mismatch, hostile archives).

### Task 1 — árlista XLSX with 27% ÁFA — PASS

```bash
aiplus-office gridcraft exec run \
  --cmd 'range.setValues={"range":"A1","values":[["Termék","Mennyiség","Nettó egységár (Ft)","Nettó (Ft)","ÁFA 27% (Ft)","Bruttó (Ft)"],["Irodai szék",4,45000,"=B2*C2","=D2*0.27","=D2+E2"],["Íróasztal",2,89000,"=B3*C3","=D3*0.27","=D3+E3"],["Monitor 27\"",3,72500,"=B4*C4","=D4*0.27","=D4+E4"],["Összesen",null,null,"=SUM(D2:D4)","=SUM(E2:E4)","=SUM(F2:F4)"]]}' \
  --out arlista.xlsx
aiplus-office gridcraft exec cat arlista.xlsx
aiplus-office gridcraft exec eval '=F5' --in arlista.xlsx --json        # → 730885.0
aiplus-office gridcraft exec check arlista.xlsx                           # 12 formulas: 12 matched, round trip ok, exit 0
aiplus-office gridcraft exec run --in arlista.xlsx --quiet \
  --cmd 'home.numberFormat={"range":"C2:F5","code":"# ##0 \"Ft\""}' --cmd 'home.bold={"range":"A1:F1","on":true}' \
  --cmd 'home.bold={"range":"A5:F5","on":true}' --cmd 'home.autofitColumnWidth={"cols":"A:F"}' --print A1:F5 --out arlista.xlsx
aiplus-office gridcraft exec run --in arlista.xlsx --out arlista.pdf
aiplus-office verify arlista.pdf --pages 1 --text-contains "Összesen" --text-contains "Bruttó" --text-contains "730"   # 4× PASS, exit 0
```

Evaluated and printed: net 575 500 Ft, ÁFA 155 385 Ft (= 575 500 × 0.27), gross 730 885 Ft; per line 180 000 / 48 600 /
228 600, 178 000 / 48 060 / 226 060, 217 500 / 58 725 / 276 225. The rendered PDF page (PdfCraft `render --dpi 80`) was
read as an image: accents correct, bold header and total row, forint format with a space as thousands separator.

### Task 2 — árajánlat DOCX from Markdown → PDF — PASS

Template made with WordCraft (`layout.size A4`, heading „Árajánlat", `{{ ajanlat_szam }}`, `{{ ugyfel_nev }}`,
`{{ $date }}`, `{{ ervenyes_napig }}`), Markdown with frontmatter (`template: arajanlat`, `language: hu`, invented
customer „Minta Kereskedelmi Kft.", offer number AJ-2026-014, a 3-row table, totals, conditions), then:

```bash
aiplus-office doc prepare arajanlat.md --out 01-prepare --templates-dir templates     # exit 0; defaulted [], unresolved []
aiplus-office wordcraft exec run --file 01-prepare/template.filled.docx --cmd 'caret.docEnd={}' --cmd 'text.newParagraph={}' \
  --cmd 'insert.textFromFile={"path":"<abs>/01-prepare/body.md"}' --cmd 'file.properties={"title":"Árajánlat – irodabútor"}' \
  --save 02-render/arajanlat.docx
aiplus-office wordcraft exec convert 02-render/arajanlat.docx 02-render/arajanlat.pdf
aiplus-office wordcraft exec info 02-render/arajanlat.docx        # pages: 1
aiplus-office verify 02-render/arajanlat.pdf --pages 1 --text-contains "Árajánlat" --text-contains "Minta Kereskedelmi Kft." \
  --text-contains "AJ-2026-014" --text-contains "730 885 Ft" --text-contains "október"     # 6× PASS, exit 0
```

`{{ $date }}` rendered as „2026. október 24." (accented month — an intended change from upstream). The rendered page was
looked at: A4, table with borders and right-aligned numbers, heading styles. **Observed faults (WordCraft 0.10.0):**
the body's leading `# Heading` arrived as a plain paragraph (the first inserted block joins the current paragraph), and
Markdown bullet items kept their indent but showed **no bullet glyph** in the PDF. Both are in the skills' traps.

### Task 3 — three-slide Hungarian deck — PASS

```bash
aiplus-office deckcraft exec run --cmd 'file.new={"blank":true}' \
  --cmd 'slide.new={"layout":"title","title":"Negyedéves áttekintés","body":"Minta Kereskedelmi Kft. · 2026. III. negyedév"}' \
  --cmd 'slide.new={"layout":"titleAndContent","title":"Eredmények","body":"Árbevétel: +12%\nÚj ügyfelek: 18\nÁtlagos szállítási idő: 6 nap"}' \
  --cmd 'slide.new={"layout":"titleAndContent","title":"Következő lépések","body":"Árlista frissítése\nÚj szerződés-sablon\nJelenléti ív digitalizálása"}' \
  --save prezentacio.pptx
aiplus-office deckcraft exec convert prezentacio.pptx prezentacio.pdf
aiplus-office verify prezentacio.pdf --pages 3 --text-contains "Negyedéves áttekintés" --text-contains "Következő lépések" --text-contains "Árbevétel"   # PASS
```

`info` listed 3 slides (Title Slide, Title and Content ×2). Rendered slides 1–2 looked at: titles, subtitle, bullets
with glyphs, accents correct.

### MCP through the proxy — PASS

- `aiplus-office wordcraft mcp --root <dir>`: `initialize` + `tools/list` → 16 tools; WordCraft itself reported
  „files confined: read root <dir>, write root <dir>".
- `aiplus-office pdfcraft mcp --root <dir>` → 175 tools; with `--compact` → 17 tools (upstream registry said 163; the
  registry now says 175).
- `aiplus-office gridcraft mcp` → exit 1, refuses (no confinement). `aiplus-office wordcraft mcp --root '${CLAUDE_PROJECT_DIR}'`
  → exit 1, „unexpanded variable".

### Test suites on the real binaries — PASS

```bash
AIPLUS_OFFICE_E2E=1 AIPLUS_OFFICE_E2E_HOME=~/.cache/aiplus-office npx vitest run
```

`real-apps` 7/7 (provision + cache hit, MCP confined/unconfined/compact, verify on PdfCraft, the doc-publish publish
with a realistic template incl. header/footer parts, the N+1 page gate failing), `skills-drift` 8/8 (every command id
quoted in a skill exists in the live command lists), `skills-recipes` 18/18 (every `recipe:` fence of the eight skills
runs under `bash -e` and ends with a passing `aiplus-office verify`). Two recipes failed on the first run and were fixed:
a GridCraft PDF cut a long name and printed a date as `#####` without `home.autofitColumnWidth`; a `--text-contains
"730 885 Ft"` failed because the value wrapped at the line end in WordCraft's PDF.

## 2026-10-25: GridCraft and DeckCraft MCP, measured again (change office-mcp-grid-deck)

**Machine:** the Linux box of the first entry (Ubuntu 22.04, x86_64), Node.js v25.6.1. **Read with:** `gh api
repos/storytold/<app>/releases/latest`, `gh release view -R storytold/<app>`, then the binaries themselves.

| App | Latest release (published) | `mcp` options |
|---|---|---|
| GridCraft | v0.12.1 (2026-10-25 13:27 UTC) | `gridcraft-cli mcp [--connect PORT] [--in FILE \| --sample NAME]`: **no confinement** |
| DeckCraft | v0.11.1 (2026-10-25 13:36 UTC) | `deckcraft-cli mcp [--connect PORT] [--sample] [--automation-read-root DIR] [--automation-write-root DIR]` |
| WordCraft | v0.11.0 (2026-10-25 13:30 UTC) | (unchanged route) |
| PdfCraft | v0.14.0 (2026-10-25 13:56 UTC) | (unchanged route) |

Neither release note mentions MCP. The registry row `deckcraft: confinement false` was **stale**: DeckCraft 0.10.0 (the
version measured on 2026-10-24) already prints the same two root options in `deckcraft-cli mcp --help`.

### DeckCraft confinement, 0.10.0 and 0.11.1: PASS

`deckcraft-cli mcp --automation-read-root R --automation-write-root R`, stderr „files confined: read root R, write root
R”, 25 tools. Driven over stdio with a small client: `save_presentation` and `export` (pdf) inside R succeed;
`save_presentation` / `export` / `run_command file.saveAs` / a `batch` step to a path outside R, `open_presentation
/etc/passwd`, `insert_picture` from `/usr/share/…`, `R/../x.pptx`, `R/link/x.pptx` (link → `/tmp`) and a relative
`rel.pptx` are all refused: „automation path rejected: outside the write root R: …”, `isError: true`, no file made.
A missing R stops the server at start („cannot open the automation read root”).

### GridCraft: 21 tools, 353 commands, no confinement

`tools/list`: `execute_command`, `list_commands`, `inspect_workbook`, `read_range`, `write_range`, `set_cell`, `get_cell`,
`evaluate_formula`, `select`, `format_range`, `insert_chart`, `create_table`, `sort_range`, `filter`, `open_workbook`,
`save_workbook`, `new_workbook`, `undo`, `redo`, `screenshot` (desktop app only), `list_functions`. Resources:
`gridcraft://workbook`, `gridcraft://commands`, `gridcraft://functions`; `resources/read file:///etc/hostname` →
„resource not found”. `commands --json`: 353 commands; those that take a file or URL: `file.open`, `file.save`,
`file.saveAs`, `file.exportCsv`, `file.exportHtml`, `file.exportPdf`, `file.print`, `insert.picture`,
`data.fromTextCsv`, `data.getData`, `pageLayout.background` (`path`), `link.open` (`url`), `automate.runScript`.
`source`, `target`, `destination`, `output` are cell ranges. `=WEBSERVICE(…)` → `#VALUE!` („not available”); an external
reference `='/etc/[passwd]Sheet1'!A1` → `#REF!`.

### The gateway (`aiplus-office gridcraft mcp --root R`, this change): PASS

Through `node dist/aiplus-office.mjs gridcraft mcp --root R` on GridCraft 0.12.1: `new_workbook`, `write_range` with
„Tűzőgép”, `save_workbook arlista.xlsx` → `R/arlista.xlsx` (4157 bytes); `open_workbook arlista.xlsx`, `read_range` back
(„Tűzőgép”, 12000, the SUM 12000); `execute_command file.exportPdf {path: arlista.pdf}` → `R/arlista.pdf`, 1 page.
Refused by the gateway, nothing written outside R: `save_workbook` to an absolute outside path, to `../x`, through
`R/link` (→ `/tmp`); `open_workbook /etc/hostname`; `screenshot`; `execute_command link.open`; `file.saveAs` outside;
`data.getData /etc/passwd`.

### Tests

`AIPLUS_OFFICE_E2E=1 AIPLUS_OFFICE_E2E_HOME=~/.cache/aiplus-office npx vitest run real-apps -t MCP`: 4/4, among them
GridCraft through the gateway (the 20 tools each called once, the file in R, five refusals, R's sibling folder empty)
and DeckCraft (25 tools each called once; `screenshot`, `call_app`, `pointer`, `key`, `type_text`, `select_tool`
answer without hanging; three outside writes refused by DeckCraft).

**Not measured:** Windows, macOS; the two new connectors in Claude Desktop (plain Chat or a „This computer” session).

## 2026-10-25 — 0.1.3: the Windows test PC's results, and what changed (change office-windows-local)

### Measured on Windows by the test PC (driven with desktape, 2026-10-24 21:46–21:53)

Windows 11, Claude Desktop 3.6556 (Store build), aiplus-office **0.1.0** from `itlinekft/aiplus-plugins`.

- **Cowork, a session that ran in the cloud, with a local folder attached** — prompt: make `arlista-teszt.xlsx` with
  GridCraft (3 rows) and read it back. **No file.** Claude's own account: the first-use download from
  `github.com/storytold/gridcraft` failed in the cloud sandbox (it retried with a pinned version, without a GitHub token,
  and checked the outbound proxy); 3 of 6 commands failed. Writing to the local folder also failed because the folder
  access prompt was answered late (the tester's side).
- **Claude Code, local session** (Claude Desktop, Environment: „This computer”, folder `demo-work`): `arlista-teszt.xlsx`
  made in about a minute and read back correctly (3 rows, bold header, autofit, prices stored as numbers). The first
  attempt **from Git Bash hung while downloading GridCraft**: Git's own `tar.exe` mishandles the `C:` path;
  provisioning through PowerShell (Windows' own `tar.exe`) worked.
- Not measured: whether the two Word/PDF connections start in a plain Chat; Cowork running on the user's own computer;
  Claude Desktop on macOS.

### What 0.1.3 changes, and the runs

- `src/provision.ts`: on win32 the listing and the extraction call `systemTar()` = `<SystemRoot>\System32\tar.exe`
  (`SystemRoot`, then `SYSTEMROOT`, else `C:\Windows`). Tests E13 (a full win32 provision of every app with
  `SystemRoot=D:\Win` and Git's `usr\bin` on PATH: every tar call is `D:\Win\System32\tar.exe`; with no `SystemRoot`
  it is `C:\Windows\System32\tar.exe`) and E13b. **Not yet run on the Windows PC.**
- Copy: Excel and PowerPoint need Claude on the user's own computer (Claude Code or a „This computer” session); a cloud
  session cannot download the apps. `office-start` tested block dated 2026-10-25; the installed-app paragraph
  (`AIPLUS_OFFICE_<APP>_BIN`). No em dash in any skill description.
- `npx tsc --noEmit` clean; `npx vitest run` 15 files passed, 2 skipped: **348 passed, 39 skipped**;
  `AIPLUS_OFFICE_E2E=1 AIPLUS_OFFICE_E2E_HOME=~/.cache/aiplus-office npx vitest run` (Linux, real apps): 17 files,
  **381 passed, 6 skipped**. ITLine's copy check (`--profile web`) on 52 user-facing texts (plugin
  description, marketplace README row, the nine skill descriptions, every `office-start` quote block and table row,
  every public README paragraph): **52/52 PASS** (the gate fails a test sentence with an em dash, checked).

### 0.1.3 staged into the local marketplace clone

- The public `itlinekft/aiplus-plugins` main was `f85779b` (0.1.2 plus the `desktape` listing by reference). Built
  from `1b32d3e` with `node scripts/release.mjs --out <scratch>/release-0.1.3/aiplus-office --stage <scratch>/aiplus-plugins-0.1.1`
  (push URL disabled): `set-leakscan --staged` clean (11 files), `--tree` exit 0 with the same 12 advisory prices as
  0.1.2 (invented example amounts); `claude plugin validate` passed. Entries after staging: `aiplus` 0.4.17,
  `aiplus-office` 0.1.3, `desktape` (github source) kept. ITLine's copy check on the staged marketplace description and README row
  PASS; no em dash in any staged skill description; the exact-string sweep (upstream repo name, „100%", „Acrobat",
  „AI+ Office", „Office nélkül", the banned claims) clean; „Cowork" left only in the measured cloud result and the
  office-start jargon line.
- Committed locally as **`810c0b2`** on `f85779b`, **not pushed**.

## 2026-10-25 — macOS arm64 (Apple M4 Mac), first real run

**Machine:** an Apple M4 Mac test machine (macOS 26.4, arm64), Node.js v25.8.2 (Homebrew). Driven from a terminal; no Claude
session was used, so this covers the CLI and the apps, not Claude Desktop or Cowork.

- **Suites on the real binaries — PASS.** Source `8295538` copied with `git archive`, `npm ci`, then
  `AIPLUS_OFFICE_E2E=1 AIPLUS_OFFICE_E2E_HOME=~/Library/Caches/aiplus-office-e2e npx vitest run`: 17 files, 376 passed,
  2 skipped (378), `real-apps` 8/8, `skills-drift` 8/8, `skills-recipes` 18/18. Downloads: the `macos-universal` zips
  (GridCraft 0.11.1 11 MB, WordCraft 0.10.0 85 MB, PdfCraft 0.13.0 60 MB, DeckCraft 0.10.0), extracted with `ditto`;
  no Gatekeeper block on the CLIs started from the cache.
- **The published copy — PASS.** `git clone https://github.com/itlinekft/aiplus-plugins.git`, then
  `node plugins/aiplus-office/dist/aiplus-office.mjs --version` → `aiplus-office 0.1.2`; `status` prints node, host
  `darwin/arm64` and the four cached apps.
- **Hungarian guards on macOS — they catch the same faults as on Linux.** A GridCraft sheet with „Gyűrűs dosszié”,
  „Hőpapír tekercs” exported by GridCraft to PDF: `verify --hu-glyphs lista.xlsx` FAIL, missing 2: Gyűrűs, Hőpapír
  (so GridCraft's PDF drops ő/ű on macOS too). „1 330,50” and „2 000” stored as text under a SUM: `verify --hu-numbers`
  FAIL, 2 cells; the same sheet with real numbers PASS.

## 2026-10-24 — Windows: what is and is not verified (change office-release-marketplace)

**Target:** a Windows 11 office PC with Claude Desktop (Cowork / Code). **No Windows machine was used for this entry.**

### Verified on Linux against the real Windows releases

- **Asset names.** The latest releases of all four apps publish `<app>-<v>-windows-x64-portable.zip` (also `-arm64`,
  `-x86` and `.msi` installers), exactly what the registry maps `win32/x64` to (checked with `gh api` on
  WordCraft 0.10.0, GridCraft 0.11.1, DeckCraft 0.10.0, PdfCraft 0.13.0). The `.msi` is not used: it needs an installer
  run; the portable zip needs none.
- **Archive layout.** `gridcraft-0.11.1-windows-x64-portable.zip`: one top-level folder holding `gridcraft-cli.exe`,
  `gridcraft.exe` (desktop), licences and README. Its SHA-256 `341ba998…a35` equals the release's sums entry.
- **Simulated win32 provisioning** (`provision(app, { platform: "win32", arch: "x64" })` with the real GitHub download
  and checksum, only `tar.exe` emulated by Python's zipfile because GNU tar cannot read zip): GridCraft 0.11.1 (18 MB) and
  PdfCraft 0.13.0 (84 MB) installed; the binary found at `<top>/<app>-cli.exe`; the desktop `.exe` removed; the calls were
  `tar.exe -tf`, `tar.exe -tvf`, `tar.exe -xf … -C …` (the `.exe` suffix keeps the call out of `cmd.exe`).
- **Unit tests** cover the win32 branches: `.exe` names, `%LOCALAPPDATA%\aiplus-office` cache root, `tar.exe`, no
  execute-bit check.

### Not verified on Windows yet (must be measured on the PC)

1. Windows' own `tar.exe` (bsdtar, Windows 10 1803+) listing a zip in the format the listing guard expects.
2. The `<app>-cli.exe` binaries actually run (no SmartScreen / Defender block on an unsigned exe started from
   `%LOCALAPPDATA%`; no missing runtime DLL).
3. The skills' shell lines in Claude Code on Windows (Git Bash): `${CLAUDE_PLUGIN_ROOT}` with backslashes inside
   `node "…"`, and `jq` — **not part of Git for Windows by default**; the workflow gates need it.
4. Cowork: whether its sandbox lets `node` download from GitHub and run the apps at all; whether the plugin installs
   (it has no `bin/` directory on purpose).
5. Claude Desktop MCP: `command: "node"` needs Node.js on PATH; whether `${CLAUDE_PROJECT_DIR}` is expanded for a plugin
   server (if not, the proxy refuses to start — safe, but the MCP route is then unavailable).
6. `aiplus-office verify --size` needs `ffprobe`, usually absent on Windows (exit 3); `--pages`/`--text-contains` use
   PdfCraft and need nothing else.

## 2026-10-24 — release staged into a local marketplace clone (change office-release-marketplace)

```bash
node scripts/release.mjs --out <scratch>/release/aiplus-office --stage <scratch>/aiplus-plugins   # a read-only clone of itlinekft/aiplus-plugins
```

- First run (commit `4b03c824`): **refused** by `set-leakscan --staged` — one blocking deny-term in the shipped `NOTICE`
  (the upstream repository's name). Fixed by shipping `release/NOTICE` (attribution to the author kept, repo name not).
- Final run (commit `71b7c219`): 16 files staged; `set-leakscan --staged` and `--tree` exit 0 with 8 advisory „price"
  findings (the invented forint amounts of the worked examples); `claude plugin validate` on the marketplace passed.
  Committed locally in the clone as `56399b8`, **not pushed**.
- Observed in `set-leakscan`'s output: the `--staged` run printed „remote is private" and the `--tree` run „remote is
  public … Every remote of this repository is private" for the same clone, whose remote is public (`gh api`: public).
  The blocking deny-term did fire on the first run, so the gate held; the visibility wording is inconsistent.
- Re-staged after the public-copy change (commit `e71dde75`): the clone was reset to `origin/main` (dropping the
  unpushed `56399b8`), then the same run: leak scan exit 0 for both modes (8 advisory price findings each), validate
  passed, an exact-string sweep for the working name / „AI+ Office" / „Office nélkül" / the upstream repo name in the
  staged tree found nothing. Committed locally as `44a504d`, **not pushed**.

## 2026-10-24 — the desktop (window) apps' official download sources (change office-first-run)

**Read with:** `gh api repos/storytold/<app>` (homepage), `gh api repos/storytold/<app>/releases/latest` (asset names),
`gh api repos/storytold/<app>/readme` (the "Downloads" section), `curl -sL -o /dev/null -w '%{http_code}'` on the web pages.

| App | Latest release (published) | Official download page | Web page |
|---|---|---|---|
| WordCraft | v0.10.0 (2026-10-22) | https://github.com/storytold/wordcraft/releases/latest | https://getartcraft.com/apps/wordcraft (200) |
| GridCraft | v0.11.1 (2026-10-22) | https://github.com/storytold/gridcraft/releases/latest | https://getartcraft.com/apps/gridcraft (200) |
| DeckCraft | v0.10.0 (2026-10-22) | https://github.com/storytold/deckcraft/releases/latest | https://getartcraft.com/apps/deckcraft (200) |
| PdfCraft | v0.13.0 (2026-10-23) | https://github.com/storytold/pdfcraft/releases/latest | https://getartcraft.com/apps/pdfcraft (200) |

- **Which assets are desktop apps.** Every release has, per app: Windows `<app>-<v>-windows-{x64,arm64,x86}.msi`
  (installer) and `-portable.zip` (the zip holds both `<app>.exe`, the window app, and `<app>-cli.exe`); macOS
  `<app>-<v>-macos-universal.dmg` (window app) and `<app>-cli-<v>-macos-universal.zip` (CLI only); Linux `.AppImage`,
  `.deb`, `.rpm`, `.flatpak`, `.pkg.tar.zst`, `.tar.gz`; FreeBSD `.tar.gz`; `<app>-web-<v>.zip`; `SHA256SUMS.txt`.
  PdfCraft also ships `pdfcraft-cli-<v>-linux-{x86_64,aarch64}.tar.gz`.
- **What the plugin takes:** the Windows portable zip (the window `<app>.exe` is deleted after extraction), the macOS
  CLI zip, the Linux tarball (PdfCraft: the CLI tarball). It never installs a window app.
- **What the READMEs say** (all four): "Download <App> from GitHub: the latest release has every build", "Installers and
  executables are code-signed"; macOS app and CLI "Signed and notarized". PdfCraft's README alone: "The MSI installs for
  all users and requires administrator privileges", and "New to PdfCraft? Download it from the PdfCraft page on
  getartcraft.com". GridCraft's: the MSI offers an optional desktop shortcut. Nothing about admin rights for the other
  three MSIs — so the skill states the admin requirement for PdfCraft only and offers the portable zip.
- **Why GitHub and not the web page:** the getartcraft.com app pages (GridCraft, WordCraft read) link the
  `releases` page but their direct download links pointed to **v0.8.0** on 2026-10-24, two to three versions behind.
  The repo `homepage` fields of DeckCraft (`/apps/slidecraft`) and PdfCraft (`/apps/printcraft`) are stale: slidecraft
  answers 404, printcraft redirects to `/apps/pdfcraft`; the READMEs link `/apps/deckcraft` and `/apps/pdfcraft`, which
  answer 200.

### Measured on Windows by the test PC (2026-10-24)

- Claude Desktop 3.6556 (Store build), Windows 11: 0.1.0 installed from the marketplace; the install dialog lists only
  `aiplus-office-wordcraft` and `aiplus-office-pdfcraft`. Whether these servers start in Chat, and Cowork as a whole:
  not measured yet (the result goes into `office-start`'s `office-start:tested` block and here).

## 2026-10-24 — 0.1.1 staged into a local marketplace clone (change office-first-run)

```bash
node scripts/release.mjs --out <scratch>/release-0.1.1/aiplus-office --stage <scratch>/aiplus-plugins-0.1.1   # fresh clone, push URL disabled
```

- Built from commit `5242538` (16 files incl. the new `skills/office-start/SKILL.md`). `set-leakscan --staged` and
  `--tree` exit 0; the same 8 advisory „price" findings as 0.1.0 (the invented forint amounts of the worked examples);
  the `--tree` run again prints both „remote is public" and „Every remote of this repository is private" (see the
  0.1.0 entry). `claude plugin validate` passed. An exact-string sweep of the staged tree found nothing (working name,
  „AI+ Office", „Office nélkül", the upstream repo name, the banned claims, „Acrobat"); „Microsoft" only in the two
  trademark lines.
- Marketplace entry: version 0.1.1, description = `plugin.json`'s (Hungarian, then English). README row bilingual.
- Committed locally in the clone as `2f97c49` on top of `44a504d` (= origin/main), **not pushed**; superseded by `604cdf1` below.

### Re-staged after the copy-gate review (same day)

- ITLine's copy check (`--profile web`) (it takes the TEXT; given a path it checks only the path
  string) failed the description: `ERROR H2 em/en dash as punctuation` on the " — English:" join. Fixed in `d42dcb9`:
  the languages are joined by " English: ", and every em dash is gone from the public README, `office-start` and the
  description. Run on each text: **44/44 PASS** (description, marketplace README row, the six `office-start` blocks in
  HU and EN, its three tables, 27 public README paragraphs). A packaging test now refuses an em dash or a spaced en dash
  in those texts.
- Clone re-made at the same path, built from `d42dcb9`: leak scan exit 0 in both modes (the same 8 advisory prices),
  validate passed, ITLine's copy check on the staged marketplace description and README row PASS, the exact-string sweep clean.
  Committed locally as **`604cdf1`** on `44a504d` (= origin/main), **not pushed**; the clone's push URL is disabled.

## 2026-10-24 — Hungarian guards (change office-hungarian-guards)

**Machine:** the Linux box of the first entry. GridCraft 0.11.1, WordCraft 0.10.0, DeckCraft 0.10.0, PdfCraft 0.13.0
(warm cache), `aiplus-office` from this repository. Source of the faults: ITLine's own tests
T5–T7. Scratch files stayed in the scratchpad; the small real files below are committed as fixtures under
`src/__tests__/fixtures/hu/`.

### ő/ű in GridCraft's PDF (T5) — the cause, and a route that keeps them

- `gridcraft exec run --in x.xlsx --out x.pdf` with „Tűzőgép" and „Fizetendő ŐSZI ÁRVÍZTŰRŐ": the PDF has
  `Helvetica` (Type 1, WinAnsi, not embedded) and, **for ő ű Ő Ű only**, `STSong-Light` (CID Type 0, UniGB-UTF16-H,
  not embedded); the content stream switches to `/F13 <0171> Tj` for each such letter (`pdffonts`, raw stream).
  `pdfcraft-cli text` returns gaps („T  z  gép", „Fizetend  "), PdfCraft's render draws nothing in their place.
  `home.fontName` `Liberation Sans` / `DejaVu Sans` / `Arial` on the cells changes nothing in the PDF.
- **Route that keeps them:** `gridcraft exec convert x.xlsx x.html` keeps the text and the number formats
  (`12 000 Ft`); `wordcraft exec convert x.html x.pdf` (or `run --file x.html --cmd layout.size A4 --cmd file.exportPdf`)
  embeds Liberation Sans (CID TrueType, Identity-H) and extracts „Tűzőgép", „Fizetendő"; A4 595×842 pt. A plain table:
  no chart, no cell borders, a long label wraps.
- **Chart with ő/ű:** DeckCraft `insert.chart` (`categories`, `series`) + `chart.options` (`title`) embeds Inter; the
  rendered slide shows „Tűzőgép" in the axis and „Fizetendő" in the chart title. The chart's labels are not in the
  PDF's extracted text (only the slide title is), so the slide gate is `--text-contains <title>` plus a look at the
  rendered image. The values come back from GridCraft with `eval '=TEXTJOIN(",",TRUE,B2:B3)' --json` → `"12000,3500"`.
- `verify --hu-glyphs` on the same sheet: GridCraft PDF → **FAIL** „missing 2: Tűzőgép, Fizetendő", exit 1;
  WordCraft-route PDF → **PASS** „all 2 found", exit 0.

### Hungarian numbers and dates as text (T7)

- A semicolon CSV with `45000`, `1 330,50`, `1.330,50` and `2026.10.31.`, `2026-10-31`, `31.10.2026`,
  `gridcraft exec convert hu.csv hu.xlsx` + `=SUM(C2:C4)`: `eval` → `45000.0`; in the XLSX the Hungarian amounts and
  two dates are shared strings (`t="s"`), `2026-10-31` is a date serial (46326).
  `verify --hu-numbers` → **FAIL**, 4 cells: `B2 "2026.10.31."` and `B4 "31.10.2026"` (number column), `C3 "1 330,50"`
  and `C4 "1.330,50"` (formula range).
- The same data through `range.setValues` with JSON numbers (`1330.5`) and `"2026-10-31"`, `home.numberFormat`
  `yyyy.mm.dd.` and `# ##0.00 "Ft"`: `eval '=C5'` → `47661.0`, `ISNUMBER(B2)` → true, displayed `2026.10.31.` and
  `45 000.00 Ft` (GridCraft shows the decimals after a point). `verify --hu-numbers` → **PASS**, exit 0.

### WordCraft spell check (T6)

Not re-run; ITLine's test T6 (same day, WordCraft 0.10.0): `review.language` `en-US` flags every Hungarian word,
`hu-HU` flags nothing, no warning. The skill now says so and has Claude proofread.

### Tests

`npm test`: all green (the count is in the commit messages). With `AIPLUS_OFFICE_E2E=1` and the warm cache:
the `--hu-glyphs` E2E test on the two committed PDFs passes against the real PdfCraft; `skills-recipes` for
`office-gridcraft` (incl. the new `afa-tabla-pdf` with „Tűzőgép" through WordCraft), `office-data-visual`,
`office-wordcraft`, `office-router` 10/10 and `skills-drift` 8/8 pass. Route B of `office-data-visual` (steps 2 and 3)
was run by hand with the skill's commands: every gate passed, the slide shows „Tűzőgép".

### 0.1.2 staged into the local marketplace clone

- The public `itlinekft/aiplus-plugins` main was `604cdf1` (0.1.1, pushed by the reviewer). Clone re-made at the same
  scratch path, push URL disabled; built from `46e53c2`. `set-leakscan --staged` exit 0 (5 advisory prices),
  `--tree` exit 0 (12 advisory prices: the 8 of 0.1.0 plus the new invented example amounts and format examples:
  „4 445 Ft", „1 330,50 Ft", „12 000 Ft", „19 685 Ft"); `claude plugin validate` passed; the exact-string sweep clean;
  no em dash in the plugin description, the public README and `office-start`; ITLine's copy check `--profile web` on the staged
  marketplace description PASS and on every `office-start` block (HU and EN) PASS (46/46 texts).
- Committed locally as **`c2fe039`** on `604cdf1`, **not pushed**.
