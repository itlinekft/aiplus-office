---
name: office-pdfcraft
description: Headless PDF work with PdfCraft, provisioned on demand by aiplus-office: combine, split, extract, rotate, delete and reorder pages, read text, render a page to PNG, set metadata, password-protect, audit faux redactions, script its 175 tools. Use for "merge these PDFs", "extract pages 1 and 3", "rotate page 1 and drop page 2", "what text is in this PDF", "protect this PDF with a password", and Hungarian jobs - PDF összefűzése, oldalak kivágása, szerződés PDF jelszóval, díjbekérő és árajánlat egy PDF-ben.
---

# office-pdfcraft: headless PDF editing

PdfCraft is ArtCraft's PDF app (175 automation tools in 0.13.0). `aiplus-office` provisions the headless `pdfcraft-cli`
on first use (no desktop app). App choice, the loop, the alpha caveat and the MCP policy live in `office-router`.
`aiplus-office verify --pages/--text-contains` itself uses `pdfcraft-cli`, so every PDF is checked by this engine.

Every shell call starts with the command line from `office-router`:

```bash
command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }
```

## What it is for / formats

PDF in, PDF / PNG (`.png .jpg .tif .pam`) / text out: page operations (combine, split, extract, rotate, delete, move,
blank pages), metadata, text extraction, page rendering, forms, bookmarks, stamps, redaction, protection, OCR batches.
There is no project file: a PDF is the document. A new document is written in WordCraft (`office-wordcraft`) and
exported; PdfCraft edits PDFs that already exist.

## CLI dialect

`aiplus-office pdfcraft exec <args…>` passes the arguments to `pdfcraft-cli`. PdfCraft has **no `commands` /
`describe` / `--cmd`**: it has direct subcommands plus a JSON tool registry.

```bash
pdfcraft-cli tools                                    # JSON list of the automation tools + input schemas
pdfcraft-cli info <f.pdf>                             # JSON summary (pages, bookmarks, encrypted, …)
pdfcraft-cli text <f.pdf> [--page N]                  # extracted text, pages separated by form feeds
pdfcraft-cli render <f.pdf> --page N [--dpi 96] --out x.png
pdfcraft-cli edit <in.pdf> --out <out.pdf> [--rotate 1,3:90] [--delete 2,4] [--move 5:1] [--insert-blank 1] [--title T] [--author A]
pdfcraft-cli combine a.pdf b.pdf … --out c.pdf
pdfcraft-cli extract <in.pdf> --pages 1,3,5-8 --out o.pdf
pdfcraft-cli split <in.pdf> (--every N | --before 3,7) [--out-dir DIR]
pdfcraft-cli audit <f.pdf>                            # faux-redaction finder (JSON; fails when found)
pdfcraft-cli run <tool> [key=value …] [--root DIR]    # one tool
pdfcraft-cli run --script steps.json [--root DIR]     # several tools in one process
```

- `edit` options **run in order**; later page numbers refer to the document *after* the earlier options.
- `--script steps.json` is a JSON array `[{"tool":"doc_open","args":{"path":"a.pdf"}}, …]`.
- `--root DIR` (on `run`, `mcp`; **not** on `info`/`edit`/…) confines file access to DIR and resolves relative paths
  *against DIR*.

## State between invocations

Direct subcommands read a file and write a **new** file (`--out`); the input is never modified. The automation tools
work on *open documents* (`doc_open` → `doc` id, usually `1`) and **a single `run` process forgets its documents**: put
`doc_open`, the edits and `doc_save` in one `--script` (or one MCP session).

## Discovery first

```bash
aiplus-office pdfcraft exec tools | jq -r '.[] | "\(.name)\t\(.read_only)\t\(.description[0:80])"'   # all names
aiplus-office pdfcraft exec tools | jq '.[] | select(.name=="page_add_text") | .input_schema'       # parameters
aiplus-office pdfcraft exec info szerzodes.pdf                     # page count before choosing page numbers
```

Families: `doc_*` (open/save/combine/split/info/set_info/protect), `page_*`, `text_*`, `form_*`, `bookmark_*`,
`redact_*`, `stamp_*`, `link_*`. Prefer a direct subcommand when one exists.

## Traps

- **`run` is stateless across processes** (above).
- **`combine` adds one bookmark per input file**.
- **`--root` rewrites relative paths**: with `--root sub`, `path=a.pdf` means `sub/a.pdf`; an absolute path outside the
  root fails with "is outside the allowed directory".
- `text` keeps the text layer only: a scanned PDF returns nothing (OCR is a `batch --steps ocr` job).
- Page numbers are 1-based; a page that does not exist is an error.
- `render` at `--dpi 72` gives one pixel per point (A4 → 596×842 px); the default is 96 dpi.
- `edit --rotate` does not show in `info`; prove it by rendering (width and height swap).
- **Passwords never go on the command line or into a file in the project**: write the script to a `0600` temp file
  outside the project and delete it right after (recipe `protect`).

## MCP route (opt-in)

The plugin registers `aiplus-office-pdfcraft`, confined to the project folder (`--root`) and with `--compact`
(17 tools: a core set plus `tool_search` and `tool_call`; 175 would flood the context). Bash for everything here.

## Recipes

The recipes make their input PDFs with WordCraft (A4), so they need nothing else installed.

```bash recipe: combine-extract
# Two PDFs (2 + 3 pages) -> one 5-page PDF -> pages 1,3,5 only.
aiplus-office wordcraft exec run --cmd 'layout.size={"name":"A4"}' --cmd 'text.insert={"text":"Árajánlat 1"}' --cmd text.pageBreak --cmd 'text.insert={"text":"Árajánlat 2"}' --save a.docx
aiplus-office wordcraft exec run --cmd 'layout.size={"name":"A4"}' --cmd 'text.insert={"text":"Díjbekérő 1"}' --cmd text.pageBreak --cmd 'text.insert={"text":"Díjbekérő 2"}' --cmd text.pageBreak --cmd 'text.insert={"text":"Díjbekérő 3"}' --save b.docx
aiplus-office wordcraft exec convert a.docx a.pdf
aiplus-office wordcraft exec convert b.docx b.pdf
aiplus-office pdfcraft exec combine a.pdf b.pdf --out c.pdf
aiplus-office pdfcraft exec extract c.pdf --pages 1,3,5 --out paratlan.pdf
aiplus-office verify paratlan.pdf --pages 3 --text-contains "Díjbekérő 1" --text-contains "Díjbekérő 3"
```

```bash recipe: rotate-delete
# Rotate page 1 by 90 degrees and drop page 2; rotation is proved by the rendered size (596x842 -> 842x596).
aiplus-office wordcraft exec run --cmd 'layout.size={"name":"A4"}' --cmd 'text.insert={"text":"Megtartjuk"}' --cmd text.pageBreak --cmd 'text.insert={"text":"Töröljük"}' --cmd text.pageBreak --cmd 'text.insert={"text":"Ezt is megtartjuk"}' --save be.docx
aiplus-office wordcraft exec convert be.docx be.pdf
aiplus-office pdfcraft exec edit be.pdf --out ki.pdf --rotate 1:90 --delete 2
aiplus-office pdfcraft exec render ki.pdf --page 1 --dpi 72 --out "$PWD/p1.png"
aiplus-office verify p1.png --size 842x596
aiplus-office verify ki.pdf --pages 2 --text-contains "Ezt is megtartjuk"
```

```bash recipe: protect
# Password-protect from a 0600 temp script outside the project; opening without the password must then fail.
aiplus-office wordcraft exec run --cmd 'text.insert={"text":"Bizalmas szerződés"}' --save src.docx
aiplus-office wordcraft exec convert src.docx vegleges.pdf
PASSWORD=${PASSWORD:-recipe-only-secret}
S=$(mktemp); chmod 600 "$S"
jq -nc --arg pw "$PASSWORD" --arg in "$PWD/vegleges.pdf" --arg out "$PWD/vegleges-vedett.pdf" \
  '[{tool:"doc_open",args:{path:$in}},{tool:"doc_protect",args:{doc:1,open_password:$pw}},{tool:"doc_save",args:{doc:1,path:$out}}]' > "$S"
aiplus-office pdfcraft exec run --script "$S" >/dev/null; rm -f "$S"
test -f vegleges-vedett.pdf
! aiplus-office pdfcraft exec info vegleges-vedett.pdf >/dev/null 2>&1
aiplus-office verify vegleges.pdf --pages 1 --text-contains "Bizalmas"
```
