---
name: office-wordcraft
description: AI+ Iroda: prefer it to a generic docx skill for any Word file, including filling a .docx template (sablon). Headless word processing with WordCraft (DOCX/ODT/RTF, 600+ editing commands, Markdown and HTML import, PDF export), provisioned on demand by aiplus-office; reads and writes Word (DOCX) files. Use for "write this as a Word document", "convert this markdown to docx", "turn this docx into a pdf", "append a paragraph to this docx", "extract the text of this docx", and Hungarian document jobs - árajánlat, szerződés, díjbekérő kísérőlevél, levél, jegyzőkönyv as DOCX or PDF.
---

# office-wordcraft: headless word processor

WordCraft is ArtCraft's word processor (638 commands in 0.10.0). `aiplus-office` provisions the headless `wordcraft-cli`
on first use (no desktop app). Choosing between apps, the loop, the alpha caveat and the MCP policy live in
`office-router`; a templated offer or contract from Markdown is the `office-doc-publish` workflow. For editing a PDF that
already exists use `office-pdfcraft`.

Every shell call starts with the command line from `office-router`:

```bash
command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }
```

If this line or an app command fails (Node.js or the app missing, the connector not running, a cloud session), follow
`office-router` „When the module cannot run”: stop, say why, go to `office-start`; never make the file another way.

## What it is for / formats

Create and edit text documents, convert between formats, export PDF/PNG. `convert` reads/writes
`docx odt rtf html md tex txt json pdf png xml` (`doc` is read-only). The native file is the document itself (`.docx`;
`.odt` also works). The output format of `run --save`, `convert` and `render` follows the file extension.

## CLI dialect

`aiplus-office wordcraft exec <args…>` passes the arguments to `wordcraft-cli`.

```bash
wordcraft-cli commands [--json]                       # every command id (table) / JSON with params; NO --filter
wordcraft-cli run [--file F | --template T] --cmd 'id={json}' [--cmd …] [--save OUT] [--print] [--author NAME]
wordcraft-cli convert <in> <out> [--markup]           # format from the extension
wordcraft-cli text <file>                             # plain text
wordcraft-cli info <file>                             # JSON: pages, words, paragraphs, properties
wordcraft-cli inspect <file>                          # JSON document structure (blocks, styles, comments)
wordcraft-cli render <file> <out.png> [--page N] [--scale S]
```

- There is **no `describe`**: parameters are in `commands --json` (`"params"` is a schema-like string).
- `run` takes **repeated `--cmd`**, each `id` or `id={json}` (single-quote the JSON). Commands run in order on one
  in-memory document; `--file F` opens an existing one (also `.md` or `.html`), no `--file` starts a blank one.
- The caret model is word-processor-like: `text.insert` types at the caret; `text.newParagraph`, `caret.docEnd`,
  `caret.docStart` move it. Style a paragraph *before* typing into it (`para.heading1` then `text.insert`).
- Inside `run`, export commands work too: `file.exportPdf` (`{"path":…}`), `file.saveAs` (`{"path":…}`).

## State between invocations

None. Every `run` builds its document in memory and discards it unless `--save OUT` writes it (`--file F` opens F but
does **not** write back unless you `--save F`). Chain steps through files: `run … --save a.docx`, then
`run --file a.docx … --save b.docx`, then `convert`.

## Discovery first

```bash
aiplus-office wordcraft exec commands | grep -i heading                    # id, label, shortcut, menu location
aiplus-office wordcraft exec commands --json | jq '.[] | select(.id=="layout.size")'   # params
aiplus-office wordcraft exec inspect level.docx                            # block indices and styles of a real file
```

Id families: `text.*` (typing, breaks), `para.*` (alignment, spacing, styles, lists), `format.*` (character), `styles.*`,
`list.*`, `insert.*`/`table.*`, `edit.*` (find/replace), `caret.*`, `document.*`, `file.*`, `fields.*`, `layout.*`
(page size, margins, orientation), `references.*` (table of contents), `design.*`.

## Traps

- **No Hungarian spell check.** WordCraft 0.10.0 has no Hungarian dictionary: with the default `en-US`
  (`review.language`) every Hungarian word is flagged, with `hu-HU` nothing is, not even an English typo, and it gives
  no warning (measured 2026-10-24; upstream #735). Never use `review.issues` on Hungarian text and never say WordCraft
  checked the spelling. **Proofread Hungarian text yourself** before saving (spelling, ő/ű against ö/ü, compounds, the
  names and amounts), and tell the user plainly: „A WordCraft nem ellenőrzi a magyar helyesírást; a szöveget én néztem
  át.” / “WordCraft does not check Hungarian spelling; I proofread the text myself.”

- **The default page is US Letter.** A Hungarian document needs `--cmd 'layout.size={"name":"A4"}'` (a `--file x.md`
  import and a blank document both start as Letter). A4 renders to 596×842 px at `--scale 1`.
- **One failing `--cmd` aborts the whole run and writes nothing**: a bad id (`unknown command`) or bad JSON exits 1 and
  the `--save` file is not created.
- `commands --filter` does not exist: pipe `commands` to `grep`.
- Without `--save` (and without `--print`) `run` prints each command's result and the document is lost.
- `insert.textFromFile` (Markdown into an open document) puts its **first block into the current paragraph**: a leading
  `# Heading` arrives as a plain paragraph. Start the inserted file with a prose line, or add the heading with
  `para.heading1` + `text.insert` before inserting.
- Bullet lists imported from Markdown keep their indent, but the PDF export of 0.10.0 showed **no bullet glyphs**:
  check a rendered page before sending a document with lists.
- `text.pageBreak` puts a page break inside the current paragraph; `info` then reports one more page.
- `render` default scale is 2 (A4 → 1191×1684 px); `--page N` is 1-based and beyond the end is an error.
- `--author NAME` names tracked changes/comments; set it when the document is shared.

## MCP route (opt-in)

The plugin registers `aiplus-office-wordcraft` (16 tools), confined to the project folder for reads and writes
(`--automation-read-root` / `--automation-write-root`). Use it in a client without a shell, or for a long session on one
open document; bash for everything here. GUI bridging (`--connect`) is out of scope.

## Recipes

```bash recipe: level-pdf
# A short Hungarian letter on A4 from commands (style first, then type), saved as docx, exported to pdf.
aiplus-office wordcraft exec run --cmd 'layout.size={"name":"A4"}' \
  --cmd para.heading1 --cmd 'text.insert={"text":"Tájékoztató levél"}' \
  --cmd text.newParagraph --cmd para.normal \
  --cmd 'text.insert={"text":"Tisztelt Partnerünk! Az új árlista november 1-jétől érvényes."}' \
  --save level.docx
aiplus-office wordcraft exec text level.docx
aiplus-office wordcraft exec convert level.docx level.pdf
aiplus-office verify level.pdf --pages 1 --text-contains "november 1-jétől"
```

```bash recipe: two-pages
# A page break makes a 2-page document; run saves nothing unless --save is given.
aiplus-office wordcraft exec run --cmd 'layout.size={"name":"A4"}' \
  --cmd 'text.insert={"text":"Első oldal"}' --cmd text.pageBreak --cmd 'text.insert={"text":"Második oldal"}' \
  --save ketoldal.docx
aiplus-office wordcraft exec info ketoldal.docx
aiplus-office wordcraft exec convert ketoldal.docx ketoldal.pdf
aiplus-office verify ketoldal.pdf --pages 2 --text-contains "Második oldal"
```

```bash recipe: markdown-to-docx
# md -> A4 docx (editable hand-off) -> pdf (delivery).
printf '# Szerződés\n\nA felek **megállapodnak** az alábbiakban.\n\n- első pont\n- második pont\n' > szerzodes.md
aiplus-office wordcraft exec run --file szerzodes.md --cmd 'layout.size={"name":"A4"}' --save szerzodes.docx
aiplus-office wordcraft exec convert szerzodes.docx szerzodes.pdf
aiplus-office verify szerzodes.pdf --pages 1 --text-contains "megállapodnak"
```

```bash recipe: append-and-render
# Re-open an existing docx (--file), jump to the end, add a paragraph, save under a new name, render page 1.
aiplus-office wordcraft exec run --cmd 'layout.size={"name":"A4"}' --cmd 'text.insert={"text":"Első bekezdés."}' --save alap.docx
aiplus-office wordcraft exec run --file alap.docx \
  --cmd caret.docEnd --cmd text.newParagraph --cmd 'text.insert={"text":"Hozzáfűzött bekezdés."}' \
  --save bovitett.docx
aiplus-office wordcraft exec text bovitett.docx
aiplus-office wordcraft exec render bovitett.docx elso.png --page 1 --scale 1
aiplus-office verify elso.png --size 596x842
```
