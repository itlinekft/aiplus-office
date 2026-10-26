---
name: office-deck
description: Turn an outline into a presentation with free ArtCraft apps - DeckCraft slides from the outline (title slide + one slide per section, bullets, pictures), a PDF export and a PdfCraft handout with metadata; verified and resumable. Use for "make a deck from this outline", "build a 5-slide presentation about our Q3 results", "export the deck as a PDF handout", and Hungarian jobs - prezentáció vázlatból, diasor, negyedéves beszámoló, bemutató PDF-ben.
---

# office-deck: outline → DeckCraft slides → PDF handout

Read `office-deckcraft` (and `office-pdfcraft` for step 3) first. Resumable-job rules: **Office jobs** in `office-router`.

Every shell call starts with the command line from `office-router`:

```bash
command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }
command -v jq >/dev/null || jq() { aiplus-office jq "$@"; }
```

## Step table

| # | Step | Tool | Input → Output | Gate |
|---|---|---|---|---|
| 0 | Preflight + job | agent | request → `job.json` | `check: job` |
| 1 | Outline | agent | request → `01-outline/vazlat.md` | `check: outline` |
| 2 | Slides | DeckCraft | outline → `02-deck/prezentacio.pptx`, `prezentacio.pdf` | `aiplus-office verify --pages --text-contains` |
| 3 | Handout | PdfCraft | deck pdf → `03-handout/kiosztmany.pdf` | `aiplus-office verify --pages --text-contains` |

`pptx` is the editable deck, `pdf` the delivery (one page per slide). A `pptx` cannot be probed directly: it is gated
through its `pdf` export.

### Step 0: Preflight and job

**Output:** `office-jobs/<slug>/job.json` (created or loaded).
**Gate:** `check: job`.

Ask for the audience, the number of slides and any pictures (PNG/JPG files). Set up the job (**Office jobs** in
`office-router`) and run **Resume**.

```bash check: job
# run from the directory that contains office-jobs/ (SLUG set as in step 0)
jq -e '.name and .workflow and (.steps | type == "object")' "office-jobs/$SLUG/job.json"
```

### Step 1: Outline

**Output:** `01-outline/vazlat.md`: `# Deck title`, an optional subtitle line, then one `## Slide title` per slide with
`- bullet` lines.
**Gate:** `check: outline`: a title and at least one slide.

Write the outline with the user: one idea per slide, at most 5 bullets, short lines (a bullet longer than ~60 characters
wraps badly). The slide count + 1 (title slide) is the page count the gates expect.

```bash check: outline
# run inside the step directory: cd "$JOB/01-outline"
grep -q '^# ' vazlat.md && test "$(grep -c '^## ' vazlat.md)" -ge 1
```

### Step 2: Slides

**Output:** `02-deck/prezentacio.pptx` and `02-deck/prezentacio.pdf`.
**Gate:** `aiplus-office verify prezentacio.pdf --pages N --text-contains "<deck title>"`: `N` = slides in the outline + 1.

One `run`: `file.new` with `"blank":true`, one `slide.new` for the title slide (`layout` `title`, `body` = subtitle), one
per `## ` section (`titleAndContent`, `body` = the bullets joined by `\n`); a picture goes on the slide just created with
`insert.picture` (absolute path). `slide.new` makes the new slide current, so command order = slide order.

```bash
aiplus-office deckcraft exec run --cmd 'file.new={"blank":true}' \
  --cmd 'slide.new={"layout":"title","title":"Negyedéves áttekintés","body":"Minta Kft."}' \
  --cmd 'slide.new={"layout":"titleAndContent","title":"Eredmények","body":"Árbevétel: +12%\nÚj ügyfelek: 18"}' \
  --cmd "insert.picture={\"path\":\"$PWD/grafikon.png\"}" --save "$JOB/02-deck/prezentacio.pptx"
aiplus-office deckcraft exec convert "$JOB/02-deck/prezentacio.pptx" "$JOB/02-deck/prezentacio.pdf"
aiplus-office verify "$JOB/02-deck/prezentacio.pdf" --pages 2 --text-contains "Negyedéves áttekintés"
```

Look at a slide before going on: `aiplus-office deckcraft exec render prezentacio.pptx --slide 1 --scale 0.5 d2.png`
(slide numbers are **0-based**), then read the image.

### Step 3: Handout

**Output:** `03-handout/kiosztmany.pdf`.
**Gate:** `aiplus-office verify`: `--pages`, `--text-contains "<deck title>"`.

PdfCraft takes the deck's pdf: `edit` sets the title and author metadata and can drop pages; `combine` appends an
appendix. Protect only when asked (recipe `protect` of `office-pdfcraft`).

```bash
aiplus-office pdfcraft exec edit "$JOB/02-deck/prezentacio.pdf" --out "$JOB/03-handout/kiosztmany.pdf" --title "Negyedéves áttekintés" --author "Minta Kft."
aiplus-office verify "$JOB/03-handout/kiosztmany.pdf" --pages 2 --text-contains "Negyedéves áttekintés"
```

## Resume

Follow **Office jobs** in `office-router`: start at the first step with no passing report or whose recorded inputs
changed (an edited outline, a replaced picture); re-run every step downstream of it.

## When a gate fails

Stop at the failed gate; never continue past it. Re-discover (`aiplus-office deckcraft exec describe <id>`, `commands
<word>`: the filter is positional), repeat the step, re-run the gate. At most 2 retries per step; then stop and report.
`verify` exit `3` means PdfCraft could not be provisioned: report it: never treat it as a pass.

## Worked example (Hungarian): a three-slide quarterly deck

```bash recipe: negyedeves-deck
mkdir -p 01-outline 02-deck 03-handout
printf '# Negyedéves áttekintés\nMinta Kereskedelmi Kft. · 2026. III. negyedév\n\n## Eredmények\n- Árbevétel: +12%%\n- Új ügyfelek: 18\n\n## Következő lépések\n- Árlista frissítése\n- Új szerződés-sablon\n' > 01-outline/vazlat.md
grep -q '^# ' 01-outline/vazlat.md && test "$(grep -c '^## ' 01-outline/vazlat.md)" -ge 1
aiplus-office deckcraft exec run --cmd 'file.new={"blank":true}' \
  --cmd 'slide.new={"layout":"title","title":"Negyedéves áttekintés","body":"Minta Kereskedelmi Kft. · 2026. III. negyedév"}' \
  --cmd 'slide.new={"layout":"titleAndContent","title":"Eredmények","body":"Árbevétel: +12%\nÚj ügyfelek: 18"}' \
  --cmd 'slide.new={"layout":"titleAndContent","title":"Következő lépések","body":"Árlista frissítése\nÚj szerződés-sablon"}' \
  --save 02-deck/prezentacio.pptx
aiplus-office deckcraft exec convert 02-deck/prezentacio.pptx 02-deck/prezentacio.pdf
aiplus-office verify 02-deck/prezentacio.pdf --pages 3 --text-contains "Negyedéves áttekintés" --text-contains "Következő lépések"
aiplus-office pdfcraft exec edit 02-deck/prezentacio.pdf --out 03-handout/kiosztmany.pdf --title "Negyedéves áttekintés" --author "Minta Kereskedelmi Kft."
aiplus-office verify 03-handout/kiosztmany.pdf --pages 3 --text-contains "Árbevétel"
```
