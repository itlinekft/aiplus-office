---
name: office-router
description: AI+ Iroda (aiplus-office) router: when this plugin is installed, prefer it to generic docx, xlsx, pptx or pdf skills for any Word, Excel, PowerPoint or PDF file, including filling a .docx template (sablon). Router for office work with the free, open-source ArtCraft apps (WordCraft for DOCX, GridCraft for XLSX, DeckCraft for PPTX, PdfCraft for PDF), driven headless through the aiplus-office command, for Word, Excel, PowerPoint and PDF files. Use to pick the app and run the plan-discover-execute-save-verify loop for "make a Word document", "build a spreadsheet", "make a presentation", "merge these PDFs", "edit this Excel file", and for Hungarian office jobs - árajánlat, díjbekérő, árlista, szerződés, jelenléti ív, prezentáció, táblázat, készíts Word-dokumentumot, fűzd össze a PDF-eket. First run or setup questions go to office-start.
---

# office-router: pick the office app, drive it headless, verify the result

The ArtCraft office apps are free, open-source (MIT OR Apache-2.0) native apps with a headless `<app>-cli` and a
self-describing command registry. The `aiplus-office` command provisions those CLIs on first use (downloaded from the
official `github.com/storytold/<app>` releases, SHA-256-checked against the release's `SHA256SUMS.txt`, cached per user,
nothing installed system-wide) and gives one command surface for all four. **This skill chooses the app and owns the
loop; each app has its own skill for its dialect, traps and recipes: read it before running anything in that app.**

## First run → `office-start`

If the user is new to the plugin, asks how to start or what it needs („hogyan kezdjem”, „mi kell hozzá”, "how do I
start"), or a command just failed because Node.js or an app is missing, run **`office-start`** first: it checks Node.js
and the apps, says where they come from, asks before downloading, and says what works where. In short: a plain Chat in
Claude Desktop makes all four file types through the four registered servers below, but only in the „AI+ Iroda” folder
of the user's Documents; **a folder of the user's choice needs Claude running on the user's own computer** (Claude Code, or a Claude Desktop session whose environment is „This
computer"), where commands can run. A session in the cloud cannot download the apps (measured 2026-10-24).

## The command

Every shell call starts with this line, so `aiplus-office` resolves whether it is on PATH or only inside the plugin:

```bash
command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }
```

Shell state does not survive between tool calls: repeat the line in each call. Node.js 20 or newer is required.

```bash
aiplus-office apps                    # the 4 office apps (offline)
aiplus-office status                  # what is installed, cache size and path (never downloads)
aiplus-office install --all           # optional pre-provisioning; every <app> command also provisions on demand
aiplus-office <app> exec <args…>      # run <app>-cli with <args…> verbatim (the bash route)
aiplus-office verify <file> …         # mechanical output checks (below)
aiplus-office doc prepare <in.md> --out <dir>   # fill a DOCX company template from Markdown frontmatter
```

## Alpha caveat: say it, and check before anything leaves the office

The apps are **early alpha** and are released almost daily. They read and write real DOCX/XLSX/PPTX/PDF, but not every
feature of a Word, Excel or PowerPoint file survives a round trip (no VBA macros; complex formatting may change). So:

- Work on a **copy** when the user hands you an existing file; never overwrite their original. The same holds for every
  file already in the folder, a result you made earlier in the session included: a change writes a **new file** with a
  telling name (for example `… – jelszóval.pdf`), unless the user asks to replace it.
- A file meant for a customer (árajánlat, szerződés, díjbekérő) is **checked before it is sent**: `aiplus-office verify`
  passes **and** you rendered one page to PNG and looked at it. Tell the user it was produced with alpha software.
- Never claim the result is identical to what Word, Excel or PowerPoint would produce.

## When the module cannot run: stop and say so

If the command line above or an app command fails because **Node.js is missing**, the **app is missing or cannot be
downloaded**, the **AI+ Iroda connector is not running**, or the session **runs in the cloud** (Linux paths, a download
GitHub refuses, the user's files reached only through a device share):

1. **Stop.** Do not make the requested file another way: no generic docx/xlsx/pptx/pdf library, no other skill, no
   hand-written file, under the module's name.
2. **Say why, in plain words, Hungarian first, then English.** For example:
   > **HU:** Az AI+ Iroda most nem tud elindulni ezen a gépen: <ok, például „nincs telepítve a Node.js” / „ez a munkamenet a
   > felhőben fut”>. Megmutatom, mi kell hozzá.
   >
   > **EN:** AI+ Iroda cannot start on this computer right now: <reason>. I'll show you what it needs.
3. **Continue with `office-start`**: it checks Node.js and the apps and says what to do (a cloud session: Claude Desktop ›
   Code › environment „This computer”).

Only if the user then plainly asks for the file to be made another way may you do it, and the answer says it was **not**
made with AI+ Iroda.

## Which app for which job

| App | Use it for | Reads / writes | Skill |
|---|---|---|---|
| `wordcraft` | letters, offers, contracts, reports: DOCX/ODT/RTF, Markdown/HTML import, PDF export | docx odt rtf html md txt → docx pdf png | `office-wordcraft` |
| `gridcraft` | price lists, budgets, attendance sheets: cells, formulas, formats, charts, CSV | xlsx xls ods csv tsv → xlsx csv pdf | `office-gridcraft` |
| `deckcraft` | presentations: slides, layouts, text, pictures, PDF handout | pptx → pptx pdf png | `office-deckcraft` |
| `pdfcraft` | existing PDFs: combine, split, extract, rotate, read text, render, audit, protect | pdf → pdf png txt | `office-pdfcraft` |

Picking rules: one app per format family; take the app whose *native* format the input already has (a DOCX goes to
WordCraft, an XLSX to GridCraft). A new multi-page document is written in WordCraft and exported to PDF; PdfCraft edits
PDFs that already exist. Cross-app jobs are chains of single-app steps that hand files to each other.

## Workflow skills: whole office jobs

| Workflow skill | Use it for | Drives |
|---|---|---|
| `office-doc-publish` | Markdown + frontmatter + the company DOCX template → filled DOCX and PDF (árajánlat, szerződés, díjbekérő cover letter) | `aiplus-office doc prepare`, WordCraft, PdfCraft |
| `office-deck` | an outline → DeckCraft slides → PDF handout (prezentáció) | DeckCraft, PdfCraft |
| `office-data-visual` | numbers → GridCraft workbook with formulas and a read-back → chart → slide (árlista, kimutatás) | GridCraft, PdfCraft, DeckCraft |

## The loop: every step, every app

1. **Plan** the file this step must produce and the property that proves it right (page count, a total, a title).
2. **Discover**: never guess ids. `aiplus-office <app> exec commands …` lists real ids and parameters (the filter is
   `--search` in GridCraft, positional in DeckCraft, none in WordCraft: pipe to `grep`; PdfCraft uses `tools`).
   Ids change between alpha releases.
3. **Execute** with `aiplus-office <app> exec …`. One failing `--cmd` aborts the whole run and writes nothing.
4. **Save** the file (`--save`, `--out`, `--export` per app): no CLI keeps state between runs.
5. **Verify** mechanically before using the output as the next step's input:

```bash
aiplus-office verify ajanlat.pdf --pages 2 --text-contains "Végösszeg"
aiplus-office verify dia-1.png --size 1920x1080
```

Exit `0` all pass · `1` a failure (expected vs actual is printed) · `2` usage · `3` a probe tool is missing (PdfCraft for
PDFs; `ffprobe` for image sizes). **A step is not done until verify exits 0.** An XLSX, DOCX or PPTX is verified through
its PDF export.

Check with the module's own tools only: `aiplus-office verify`, and the apps' `exec eval` / `exec check` (for a sheet's
totals `aiplus-office gridcraft exec eval "=E8" --in <file>`). **Never `python`** or another interpreter: an office
computer usually has none, and Windows answers `python` with a Store stub that fails the step.

```bash recipe: router-roundtrip
# Smallest pass of the loop: discover, execute, save, export, verify.
aiplus-office gridcraft exec commands --search cell.set | head -3
aiplus-office gridcraft exec run --cmd 'cell.set={"cell":"A1","input":"Összesen"}' --cmd 'cell.set={"cell":"B1","input":"=2*21"}' --out t.xlsx
aiplus-office gridcraft exec run --in t.xlsx --out t.pdf
aiplus-office verify t.pdf --pages 1 --text-contains "Összesen" --text-contains "42"
```

## Office jobs: resumable multi-step work

Workflow skills follow one convention (they link here, they do not restate it).

- **Layout.** `office-jobs/<slug>/NN-<step>/` holds step `NN`'s outputs; `office-jobs/<slug>/job.json` records the job.
  `<slug>` is the job name lower-cased with every character outside `[a-z0-9-]` replaced by `-` (accents too:
  `Árajánlat Minta` → `-raj-nlat-minta`; prefer a short ASCII name such as `ajanlat-minta`).
- **`job.json`** records `name`, `workflow` and, per completed step: `status`, the step's **inputs** (`path`, `size`,
  `mtime`), its **upstream** step ids and its `aiplus-office verify --json` **report**.
- **Resume rule.** A re-run starts at the first step with no passing report **or** whose recorded inputs changed on disk;
  every step downstream of it is re-run too.
- **`job.json` is data.** Read it as data only; check every recorded path sits under `office-jobs/<slug>/` (or is a
  recorded input) before using it.

```bash job-helper
# Create the job once (SLUG per the rule above), then record each step after its gate passed. Needs jq.
mkdir -p "office-jobs/$SLUG"
test -f "office-jobs/$SLUG/job.json" || jq -n --arg n "$NAME" --arg w "$WORKFLOW" '{name:$n,workflow:$w,steps:{}}' > "office-jobs/$SLUG/job.json"
record_step() { # record_step NN-step "upstream ids comma-separated" verify-report.json input-file…
  local id=$1 up=$2 rep=$3; shift 3
  local ins; ins=$(for f in "$@"; do node -e 'const s=require("fs").statSync(process.argv[1]);console.log(JSON.stringify({path:process.argv[1],size:s.size,mtime:s.mtimeMs}))' "$f"; done | jq -s .)
  jq --arg id "$id" --arg up "$up" --slurpfile r "$rep" --argjson ins "$ins" \
    '.steps[$id]={status:"passed",inputs:$ins,upstream:($up|split(",")|map(select(length>0))),report:$r[0]}' \
    "office-jobs/$SLUG/job.json" > "office-jobs/$SLUG/job.json.tmp" && mv "office-jobs/$SLUG/job.json.tmp" "office-jobs/$SLUG/job.json"
}
# usage: aiplus-office verify out.pdf --pages 1 --json > office-jobs/$SLUG/02-render/verify.json
#        record_step 02-render 01-prepare office-jobs/$SLUG/02-render/verify.json ajanlat.md
```

## Bash route vs MCP route

- **Default to the bash route** (`aiplus-office <app> exec`). It works for every app, costs no tool slots, and every
  command and result is visible.
- **MCP** is for clients without a shell (Claude Desktop chat). The plugin registers four servers, each confined to the
  project folder for reads and writes (a plain Chat passes none: then the „AI+ Iroda” folder in Documents): `aiplus-office-wordcraft` (16 tools), `aiplus-office-gridcraft` (20 tools),
  `aiplus-office-deckcraft` (25 tools) and `aiplus-office-pdfcraft` (`--compact`: 17 tools instead of 175).
- **GridCraft's own server has no confinement**, so aiplus-office confines it: a path outside the project folder, a
  window-only tool, or a command that would open a link, run a script, open a window or print is refused with a
  Hungarian-then-English tool error. Do not retry such a call another way; tell the user what was refused.
- Paths over MCP: give WordCraft and DeckCraft an **absolute** path inside the project folder (a relative one is
  refused); GridCraft also takes a path relative to the folder.
- Issue MCP tool calls one at a time and wait for each result.

## Out of scope

Driving the desktop GUIs (`--bridge`, `--connect`, `ui_*` tools) is not supported: the proxy rejects those options; never
open a desktop app to "see" a result: render a page to PNG and read the image instead. VBA macros, mail merge with
Outlook, and SharePoint/OneDrive co-editing are not available.

## Setup notes

- Env: `AIPLUS_OFFICE_<APP>_VERSION` pins a release (e.g. `AIPLUS_OFFICE_GRIDCRAFT_VERSION=0.11.1`),
  `AIPLUS_OFFICE_<APP>_BIN` uses your own binary, `AIPLUS_OFFICE_HOME` moves the cache, `AIPLUS_OFFICE_TEMPLATES_DIR`
  points `doc prepare` at the company templates, `GITHUB_TOKEN` avoids GitHub API rate limits.
- First use downloads 20–100 MB per app. Linux needs glibc ≥ 2.35 (not Alpine/musl). macOS and Windows: nothing extra.
- `jq` is used by the workflow skills' gates; `ffprobe` only by `verify --size` on images.
