---
name: office-data-visual
description: Turn numbers into a finished office visual with free ArtCraft apps - a GridCraft workbook with formulas and a formula-error read-back, a chart, an A4 PDF and a DeckCraft slide; verified and resumable. Use for "make a price list with VAT and a chart", "chart this spreadsheet", "put the revenue chart on a slide", and Hungarian jobs - árlista ÁFA-val, táblázat grafikonnal, kimutatás, költségvetés diagrammal, adat egy prezentáció diájára.
---

# office-data-visual: data → workbook + read-back → chart PDF → slide

GridCraft computes and charts, PdfCraft renders the exported page, DeckCraft puts it on a slide. **GridCraft prints
formula errors as values with exit 0**, so the chart's source range is read back before anything is exported. Read
`office-gridcraft` and `office-deckcraft` first. Resumable-job rules: **Office jobs** in `office-router`.

Every shell call starts with the command line from `office-router`:

```bash
command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }
```

## Step table

| # | Step | Tool | Input → Output | Gate |
|---|---|---|---|---|
| 0 | Preflight + job | agent | request → `job.json` | `check: job` |
| 1 | Workbook + read-back | GridCraft | data → `01-data/arlista.xlsx`, `readback.out` | `check: readback`, `verify --hu-numbers` |
| 2 | PDF (+ page image) | GridCraft + PdfCraft, or WordCraft (ő/ű) | workbook → `02-chart/arlista.pdf` (`oldal.png`) | `aiplus-office verify --pages --hu-glyphs --text-contains` |
| 3 | Slide | DeckCraft | page image or DeckCraft chart → `03-slide/dia.pptx`, `dia.pdf` | `aiplus-office verify --pages --text-contains` |

Hand-off formats: `xlsx` between 1 and 2 (the editable deliverable), `pdf` for print, `png` for the slide. GridCraft has
no chart-image command: the chart reaches the slide through the workbook's **PDF** export, rendered by PdfCraft. The
rendered image is the whole page (table + chart + white margin); there is no automatic trim in this plugin.

**Hungarian guards** (measured 2026-10-24, GridCraft 0.11.1; details in `office-gridcraft`, section „Hungarian numbers,
dates and the letters ő/ű"):

- **Numbers as numbers, dates as ISO dates**, the Hungarian look only through number formats. A Hungarian amount
  written as text („1 330,50") is skipped by `SUM` without an error. Step 1's gate `--hu-numbers` catches it.
- **GridCraft's own PDF loses ő, ű, Ő, Ű** (and so does the page image made from it). **Route A** (no such letter in
  the workbook or the chart title): GridCraft PDF + page image, as below. **Route B** (any of them present): the table
  PDF through WordCraft, and the chart on the slide drawn by DeckCraft's `insert.chart` from the read-back values;
  both keep the letters (measured). Step 2's gate `--hu-glyphs` fails on a PDF that lost them, whichever route.

### Step 0: Preflight and job

**Output:** `office-jobs/<slug>/job.json` (created or loaded).
**Gate:** `check: job`.

Ask for the data (a file or numbers), the VAT rule (27% is the general Hungarian rate; 18% and 5% exist for some goods: 
ask, do not assume for every line), rounding (per line or on the total), the chart type and the title. Set up the job
(**Office jobs** in `office-router`) and run **Resume**.

```bash check: job
# run from the directory that contains office-jobs/ (SLUG set as in step 0)
jq -e '.name and .workflow and (.steps | type == "object")' "office-jobs/$SLUG/job.json"
```

### Step 1: Workbook and read-back

**Output:** `01-data/arlista.xlsx` (data, formulas, formats and the chart object) and `01-data/readback.out`.
**Gate:** `check: readback`: the source range holds none of `#NAME?` `#DIV/0!` `#REF!` `#VALUE!` `#N/A` `#NUM!`
`#NULL!`. A hit stops the step: fix the formula (`cat --formulas` shows the source); **no chart is exported**. Then
`aiplus-office verify arlista.xlsx --hu-numbers` must exit 0, and every total is read back with `eval '=D5' --json`
and compared with the value you computed yourself from the input.

`range.setValues` types data and formulas (strings starting `=` are formulas: English names, dot decimals, comma
separators: `=B2*0.27`, `=SUM(B2:B4)`; amounts as JSON numbers, `1330.5`, never the text „1 330,50"; dates as
`"2026-10-31"`), `home.numberFormat` shows forints (`# ##0 "Ft"`), `insert.chart` adds the chart
(`range`, `type` column|bar|line|pie|…, `title`, `at` the anchor cell, `width`/`height` px), `pageLayout.size` and
`pageLayout.orientation` make the printout A4 landscape.

```bash check: readback
# run inside the step directory: cd "$JOB/01-data"; SRC_RANGE is the range the totals and the chart read (default A1:D5)
aiplus-office gridcraft exec cat arlista.xlsx --range "${SRC_RANGE:-A1:D5}" > readback.out
test -s readback.out && ! grep -qE '#(NAME\?|DIV/0!|REF!|VALUE!|N/A|NUM!|NULL!)' readback.out
aiplus-office verify arlista.xlsx --hu-numbers
```

Also run `aiplus-office gridcraft exec check arlista.xlsx`: it recalculates every formula and round-trips the file (exit 1
on any difference).

### Step 2: PDF (and the page image)

**Output:** `02-chart/arlista.pdf` (route A also `02-chart/oldal.png`).
**Gate:** `aiplus-office verify arlista.pdf --pages 1 --hu-glyphs <workbook> --text-contains "<gross total>"` (route A
also `--text-contains "<chart title>"`).

Pick the route: route B when the workbook's text or the chart title holds ő, ű, Ő or Ű.

```bash
# exit 0 → route A; exit 1 → route B (CHART_TITLE is the title the user asked for)
! { aiplus-office gridcraft exec cat "$JOB/01-data/arlista.xlsx"; printf '%s\n' "$CHART_TITLE"; } | grep -q '[őűŐŰ]'
```

**Route A**: GridCraft's PDF with the chart, rendered to an image for the slide:

```bash
aiplus-office gridcraft exec run --in "$JOB/01-data/arlista.xlsx" --out "$JOB/02-chart/arlista.pdf"
aiplus-office verify "$JOB/02-chart/arlista.pdf" --pages 1 --hu-glyphs "$JOB/01-data/arlista.xlsx" --text-contains "Nettó árbevétel tételenként" --text-contains "730 885"
aiplus-office pdfcraft exec render "$JOB/02-chart/arlista.pdf" --page 1 --dpi 100 --out "$PWD/$JOB/02-chart/oldal.png"
```

Read `oldal.png` before the slide step: the gate cannot see a cut-off column or an empty chart.

**Route B**: the table through WordCraft (embedded font; a plain table, no chart), then read back the chart data:

```bash
aiplus-office gridcraft exec convert "$JOB/01-data/arlista.xlsx" "$JOB/02-chart/arlista.html"
aiplus-office wordcraft exec run --file "$JOB/02-chart/arlista.html" --cmd 'layout.size={"name":"A4"}' --cmd "file.exportPdf={\"path\":\"$PWD/$JOB/02-chart/arlista.pdf\"}"
aiplus-office verify "$JOB/02-chart/arlista.pdf" --pages 1 --hu-glyphs "$JOB/01-data/arlista.xlsx" --text-contains "4 445 Ft"
aiplus-office gridcraft exec eval '=TEXTJOIN("|",TRUE,A2:A4)' --in "$JOB/01-data/arlista.xlsx" --json   # categories (item rows, not the total)
aiplus-office gridcraft exec eval '=TEXTJOIN(",",TRUE,B2:B4)' --in "$JOB/01-data/arlista.xlsx" --json   # values
```

Tell the user in route B that the PDF is a table without the chart, and the chart is on the slide (GridCraft's own
printout would lose ő and ű).

### Step 3: Slide

**Output:** `03-slide/dia.pptx` and `03-slide/dia.pdf`.
**Gate:** `aiplus-office verify dia.pdf --pages 1 --text-contains "<slide title>"` (the pptx is verified through its pdf),
and look at a rendered slide: chart labels are drawn, not extracted as text.

**Route A**: a blank deck, one `titleOnly` slide, the page image with `insert.picture` and a `rect` below the title (an
A4 landscape page is 1.41:1; `[197,120,566,400]` fills the lower part of a 960×540 slide). For a slide in an existing
deck use `office-deck`.

```bash
aiplus-office deckcraft exec run --cmd 'file.new={"blank":true}' --cmd 'slide.new={"layout":"titleOnly","title":"Árlista 2026"}' \
  --cmd "insert.picture={\"path\":\"$PWD/$JOB/02-chart/oldal.png\",\"rect\":[197,120,566,400]}" --save "$JOB/03-slide/dia.pptx"
aiplus-office deckcraft exec convert "$JOB/03-slide/dia.pptx" "$JOB/03-slide/dia.pdf"
aiplus-office verify "$JOB/03-slide/dia.pdf" --pages 1 --text-contains "Árlista 2026"
```

**Route B**: DeckCraft draws the chart from the step 2 read-back (categories and values as JSON; DeckCraft embeds its
font, so ő and ű stay):

```bash
aiplus-office deckcraft exec run --cmd 'file.new={"blank":true}' --cmd 'slide.new={"layout":"titleOnly","title":"Árlista 2026"}' \
  --cmd 'insert.chart={"type":"column","rect":[100,120,760,380],"categories":["Toner","Tűzőgép"],"series":[{"name":"Nettó (Ft)","values":[12000,3500]}]}' \
  --cmd 'chart.options={"title":"Nettó árbevétel tételenként"}' --save "$JOB/03-slide/dia.pptx"
aiplus-office deckcraft exec convert "$JOB/03-slide/dia.pptx" "$JOB/03-slide/dia.pdf"
aiplus-office verify "$JOB/03-slide/dia.pdf" --pages 1 --text-contains "Árlista 2026"
aiplus-office pdfcraft exec render "$JOB/03-slide/dia.pdf" --page 1 --dpi 60 --out "$PWD/$JOB/03-slide/dia.png"
```

## Resume

Follow **Office jobs** in `office-router`: start at the first step with no passing report or whose recorded inputs
changed (new prices, an edited workbook); re-run every step downstream of it.

## When a gate fails

Stop at the failed gate; never continue past it. Re-discover (`aiplus-office gridcraft exec commands --search <word>`,
`aiplus-office deckcraft exec describe <id>`), repeat the step and re-run the gate. At most 2 retries per step; then stop
and report. A read-back failure is **not** retried by re-exporting: fix the source cells first. `verify` exit `3` means
PdfCraft could not be provisioned: report it: never treat it as a pass.

## Worked example (Hungarian): árlista with 27% ÁFA, gross total, chart and slide

Invented products and prices; net 575 500 Ft + 27% ÁFA 155 385 Ft = gross 730 885 Ft. No ő or ű in it, so route A;
a list with „Tűzőgép" takes route B (step 2 and 3 above).

```bash recipe: arlista-afa
mkdir -p 01-data 02-chart 03-slide
aiplus-office gridcraft exec run --quiet \
  --cmd 'range.setValues={"range":"A1","values":[["Termék","Nettó (Ft)","ÁFA 27% (Ft)","Bruttó (Ft)"],["Irodai szék",180000,"=B2*0.27","=B2+C2"],["Íróasztal",178000,"=B3*0.27","=B3+C3"],["Monitor",217500,"=B4*0.27","=B4+C4"],["Összesen","=SUM(B2:B4)","=SUM(C2:C4)","=SUM(D2:D4)"]]}' \
  --cmd 'home.numberFormat={"range":"B2:D5","code":"# ##0 \"Ft\""}' --cmd 'home.bold={"range":"A5:D5","on":true}' \
  --cmd 'home.autofitColumnWidth={"cols":"A:D"}' \
  --cmd 'insert.chart={"range":"A1:B4","type":"column","title":"Nettó árbevétel tételenként","at":"F1","width":480,"height":300}' \
  --cmd 'pageLayout.size={"paper":"A4"}' --cmd 'pageLayout.orientation={"orientation":"landscape"}' --out 01-data/arlista.xlsx
aiplus-office gridcraft exec cat 01-data/arlista.xlsx --range A1:D5 > 01-data/readback.out
test -s 01-data/readback.out && ! grep -qE '#(NAME\?|DIV/0!|REF!|VALUE!|N/A|NUM!|NULL!)' 01-data/readback.out
aiplus-office gridcraft exec check 01-data/arlista.xlsx
test "$(aiplus-office gridcraft exec eval '=D5' --in 01-data/arlista.xlsx --json)" = "730885.0"
aiplus-office verify 01-data/arlista.xlsx --hu-numbers
! { aiplus-office gridcraft exec cat 01-data/arlista.xlsx; echo "Nettó árbevétel tételenként"; } | grep -q '[őűŐŰ]'   # route A
aiplus-office gridcraft exec run --in 01-data/arlista.xlsx --out 02-chart/arlista.pdf
aiplus-office verify 02-chart/arlista.pdf --pages 1 --hu-glyphs 01-data/arlista.xlsx --text-contains "Nettó árbevétel tételenként" --text-contains "730 885"
aiplus-office pdfcraft exec render 02-chart/arlista.pdf --page 1 --dpi 100 --out "$PWD/02-chart/oldal.png"
aiplus-office deckcraft exec run --cmd 'file.new={"blank":true}' --cmd 'slide.new={"layout":"titleOnly","title":"Árlista 2026"}' \
  --cmd "insert.picture={\"path\":\"$PWD/02-chart/oldal.png\",\"rect\":[197,120,566,400]}" --save 03-slide/dia.pptx
aiplus-office deckcraft exec convert 03-slide/dia.pptx 03-slide/dia.pdf
aiplus-office verify 03-slide/dia.pdf --pages 1 --text-contains "Árlista 2026"
```
