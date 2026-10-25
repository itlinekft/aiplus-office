---
name: office-doc-publish
description: Publish Markdown with frontmatter as a DOCX and PDF on the company's own Word template, with free ArtCraft apps - fill the template's placeholders (customer name, offer number, date), append the body with tables, optional table of contents, optional PdfCraft package and password; verified and resumable. Use for "make a DOCX from this markdown with our template", "publish this as a PDF", "markdown to Word", and Hungarian jobs - árajánlat, szerződés, díjbekérő kísérőlevél, ajánlat PDF-ben, céges sablon kitöltése.
---

# office-doc-publish: Markdown + company template → DOCX + PDF (→ packaged PDF)

`aiplus-office doc prepare` fills the template's `{{ name }}` placeholders (frontmatter, `--var`, template defaults,
system variables such as `{{ $date }}`): also in text boxes, headers and footers that WordCraft's CLI cannot reach, and
prepares the body; WordCraft then appends the body and exports; PdfCraft packages the result. No pandoc, no Docker, no
Word. Read `office-wordcraft` (and `office-pdfcraft` for step 3) first. Resumable-job rules: **Office jobs** in
`office-router`.

Every shell call starts with the command line from `office-router`:

```bash
command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }
```

## Step table

| # | Step | Tool | Input → Output | Gate |
|---|---|---|---|---|
| 0 | Preflight + job | agent | request → `job.json` | `check: job` |
| 1 | Prepare | `aiplus-office doc prepare` | `ajanlat.md` + template → `01-prepare/` (`template.filled.docx`, `body.md`, `prepare.json`) | `check: prepare` (+ the user confirms defaults) |
| 2 | Render | WordCraft | filled template + body → `02-render/out.docx`, `out.pdf` | `aiplus-office verify --pages --text-contains` |
| 3 | Package (optional) | PdfCraft | pdf (+ appendix pdfs) → `03-package/final.pdf` | `aiplus-office verify` (before protecting) |

The template is a folder `<templates-dir>/<name>/template.docx` (optionally with `variables.xml` defaults and
`manifest.xml`). The templates folder is, in order: `--templates-dir`, frontmatter `templates_dir` (must sit under the
Markdown's folder or an `--allow-path`), `$AIPLUS_OFFICE_TEMPLATES_DIR`, `./templates`, `~/Documents/templates`.
Passwords never go into `job.json`, gate reports or step files.

### Step 0: Preflight and job

**Output:** `office-jobs/<slug>/job.json` (created or loaded).
**Gate:** `check: job`.

Ask which template to use and **echo its path to the user** after step 1 (it is in `prepare.json`): `./templates` is
searched before `~/Documents/templates`, so a repo-local template can win without being asked for. Mermaid diagrams
render only when `mmdc` (`@mermaid-js/mermaid-cli`) is on PATH; otherwise they stay code blocks (step 1's gate asks).
Set up the job (**Office jobs** in `office-router`) and run **Resume**.

```bash check: job
# run from the directory that contains office-jobs/ (SLUG set as in step 0)
jq -e '.name and .workflow and (.steps | type == "object")' "office-jobs/$SLUG/job.json"
```

### Step 1: Prepare

**Output:** `01-prepare/template.filled.docx`, `01-prepare/body.md`, `01-prepare/prepare.json`.
**Gate:** `check: prepare`: no unresolved placeholder, unrendered diagram, skipped or remote image, and every
template-defaulted variable confirmed by the user.

```bash
aiplus-office doc prepare ajanlat.md --out "$JOB/01-prepare" [--template arajanlat] [--templates-dir <dir>] [--var ugyfel_nev="Minta Kft."]…
```

Frontmatter keys: `template`, `templates_dir`, `language` (`hu` gives `2026. október 24.` for `{{ $date }}`),
`document_title`, `document_name`, `enable_toc`, `toc_heading`; every other scalar key is a template variable
(`--var` wins over frontmatter, which wins over the template's `variables.xml` default). Read `prepare.json`:

- `defaulted`: variables that still carry the **template's default** (a real template may still hold the last
  customer's name or offer number). **Show each default and ask the user to confirm or supply a value**; only then run
  the gate with `DEFAULTS_CONFIRMED=1`.
- `unresolved`: placeholders with no value: supply the variable or, with the user's consent, `--allow-missing`.
- `mermaid.unrendered`: diagrams left as code (no `mmdc`): ask the user to install it or accept code blocks.
- `images.skipped` / `images.remote`: images outside the Markdown's folder (pass `--allow-path`), missing, or remote.
- `pictures`: present when the template owns images: `body.md` then carries `CRAFTIMG0001`-style markers and step 2 puts
  the pictures in.

```bash check: prepare
# run inside the step directory: cd "$JOB/01-prepare" (DEFAULTS_CONFIRMED=1 once the user confirmed every defaulted variable)
jq -e --arg ok "${DEFAULTS_CONFIRMED:-0}" '
  (.unresolved | length == 0) and (.mermaid.unrendered == 0) and (.images.skipped | length == 0) and (.images.remote | length == 0)
  and ((.defaulted | length == 0) or $ok == "1")' prepare.json
```

### Step 2: Render

**Output:** `02-render/out.docx` and `02-render/out.pdf` (the docx is verified through its pdf).
**Gate:** `aiplus-office verify out.pdf --pages N --text-contains "<title>" --text-contains "<a value you supplied>"`: 
`N` is WordCraft's own page count of the docx.

One WordCraft run opens the **filled** template with `run --file` (never `run --template`: it drops the template's
header/footer parts), moves to the end, appends the body with `insert.textFromFile`, puts in any pictures, sets the
document title, then `convert` exports the pdf. A long document gets a page break and a table of contents
(`references.toc`; it leaves the caret above the table, so `caret.docEnd` again before the body).

```bash
D="$PWD/$JOB/01-prepare"; TOC=$(jq -r .toc.enabled "$D/prepare.json")
ARGS=(--cmd 'caret.docEnd={}' --cmd 'text.newParagraph={}')
if [ "$TOC" = true ]; then
  ARGS+=(--cmd 'text.pageBreak={}' --cmd "references.toc=$(jq -c '{levels:.toc.levels,title:.toc.heading}' "$D/prepare.json")" --cmd 'caret.docEnd={}' --cmd 'text.pageBreak={}')
fi
ARGS+=(--cmd "insert.textFromFile=$(jq -nc --arg p "$D/body.md" '{path:$p}')")
while IFS= read -r pic; do
  m=$(jq -r .marker <<<"$pic"); f=$(jq -r .file <<<"$pic")
  ARGS+=(--cmd "edit.find=$(jq -nc --arg t "$m" '{text:$t}')" --cmd "insert.picture=$(jq -nc --arg p "$D/$f" '{path:$p}')" --cmd "edit.replaceAll=$(jq -nc --arg t "$m" '{text:$t,with:""}')")
done < <(jq -c '.pictures[]?' "$D/prepare.json")
ARGS+=(--cmd "file.properties=$(jq -c '{title:.title}' "$D/prepare.json")")
aiplus-office wordcraft exec run --file "$D/template.filled.docx" "${ARGS[@]}" --save "$JOB/02-render/out.docx"
aiplus-office wordcraft exec convert "$JOB/02-render/out.docx" "$JOB/02-render/out.pdf"
N=$(aiplus-office wordcraft exec info "$JOB/02-render/out.docx" | jq -r .pages)
aiplus-office verify "$JOB/02-render/out.pdf" --pages "$N" --text-contains "$(jq -r .title "$D/prepare.json")" --text-contains "$CLIENT"
```

`--text-contains` matches within one line of the PDF's text: a value that wraps at the line end (`730 885` / `Ft`) is
not found, so check short values that sit on their own line. The body's **first block joins the current paragraph** (a leading `# Heading` arrives unstyled): let the template carry
the title and start `body.md` with a prose line. Then **look at page 1** (`aiplus-office pdfcraft exec render out.pdf
--page 1 --dpi 80 --out <abs>.png`, read the image): the gate cannot see a broken cover, a missing bullet or a wrong table.

### Step 3: Package (optional)

**Output:** `03-package/final.pdf` (combined with appendices, audited, optionally protected).
**Gate:** `aiplus-office verify` on the **unprotected** pdf (`--pages` = sum of the parts). A protected pdf cannot be
probed; the protection is checked by opening it without the password, which must fail.

```bash
aiplus-office pdfcraft exec combine "$JOB/02-render/out.pdf" aszf.pdf --out "$JOB/03-package/final.pdf"
aiplus-office pdfcraft exec audit "$JOB/03-package/final.pdf"
aiplus-office verify "$JOB/03-package/final.pdf" --pages 3 --text-contains "$(jq -r .title "$JOB/01-prepare/prepare.json")"
```

Protect only when asked, with the `0600` temp-file recipe `protect` of `office-pdfcraft`; the password comes from the
user at run time and is never recorded.

## Resume

Follow **Office jobs** in `office-router`: read `office-jobs/<slug>/job.json` as data, confirm the job name, start at the
first step with no passing report or whose recorded inputs changed (an edited `ajanlat.md`, a new template). Re-run every
step downstream of it. Never record a password.

## When a gate fails

Stop at the failed gate; never continue past it. Re-discover the commands you used (`aiplus-office wordcraft exec
commands --json | jq …`), repeat the step and re-run the gate. At most 2 retries per step; then stop and report the verify
output and what was tried. `verify` exit `3` means PdfCraft could not be provisioned: report it: never treat it as a pass.

## Worked example (Hungarian): árajánlat from Markdown

The company template is built on the spot here so the example needs nothing installed; in real use the template is the
office's own DOCX with `{{ ugyfel_nev }}`-style placeholders. Company names are invented.

```bash recipe: arajanlat-core
mkdir -p templates/arajanlat 01-prepare 02-render
aiplus-office wordcraft exec run --cmd 'layout.size={"name":"A4"}' \
  --cmd para.heading1 --cmd 'text.insert={"text":"Árajánlat"}' \
  --cmd text.newParagraph --cmd para.normal --cmd 'text.insert={"text":"Ajánlatszám: {{ ajanlat_szam }}"}' \
  --cmd text.newParagraph --cmd 'text.insert={"text":"Címzett: {{ ugyfel_nev }}"}' \
  --cmd text.newParagraph --cmd 'text.insert={"text":"Kelt: {{ $date }} · Érvényes: {{ ervenyes_napig }} napig"}' \
  --save templates/arajanlat/template.docx
cat > ajanlat.md <<'EOF'
---
template: arajanlat
language: hu
document_title: Árajánlat, irodabútor
ugyfel_nev: Minta Kereskedelmi Kft.
ajanlat_szam: AJ-2026-014
ervenyes_napig: 30
---
Tisztelt {{ ugyfel_nev }}! Köszönjük érdeklődését, az alábbi tételekre adunk ajánlatot.

| Tétel | Mennyiség | Nettó egységár | Nettó |
|---|---:|---:|---:|
| Irodai szék | 4 db | 45 000 Ft | 180 000 Ft |
| Íróasztal | 2 db | 89 000 Ft | 178 000 Ft |
| Monitor 27" | 3 db | 72 500 Ft | 217 500 Ft |

Nettó összesen: 575 500 Ft

ÁFA (27%): 155 385 Ft

**Bruttó végösszeg: 730 885 Ft**

## Feltételek

Szállítás a megrendeléstől számított 10 munkanapon belül; fizetés díjbekérő alapján, átutalással, 8 napon belül.
EOF
aiplus-office doc prepare ajanlat.md --out 01-prepare --templates-dir templates
jq -e '(.unresolved|length==0) and (.defaulted|length==0) and (.mermaid.unrendered==0)' 01-prepare/prepare.json
D="$PWD/01-prepare"
aiplus-office wordcraft exec run --file "$D/template.filled.docx" \
  --cmd 'caret.docEnd={}' --cmd 'text.newParagraph={}' \
  --cmd "insert.textFromFile=$(jq -nc --arg p "$D/body.md" '{path:$p}')" \
  --cmd "file.properties=$(jq -c '{title:.title}' "$D/prepare.json")" \
  --save 02-render/arajanlat.docx
aiplus-office wordcraft exec convert 02-render/arajanlat.docx 02-render/arajanlat.pdf
N=$(aiplus-office wordcraft exec info 02-render/arajanlat.docx | jq -r .pages)
aiplus-office verify 02-render/arajanlat.pdf --pages "$N" --text-contains "Árajánlat" --text-contains "Minta Kereskedelmi Kft." --text-contains "AJ-2026-014" --text-contains "730 885 Ft"
```
