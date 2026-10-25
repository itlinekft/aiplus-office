# office-skills Specification

## Purpose
The plugin's skills: they tell Claude which office app fits a job, how each app's CLI is spelled, how to verify every
output, and how to run whole office workflows (a templated offer, a deck, a price list with a chart) for a Hungarian office.

## Requirements

### Requirement: Skill set

The plugin SHALL ship exactly these skills in the Agent Skills format (`skills/<name>/SKILL.md` with `name` equal to
the folder and a `description`): `office-router`, `office-wordcraft`, `office-gridcraft`, `office-deckcraft`,
`office-pdfcraft`, `office-doc-publish`, `office-deck`, `office-data-visual`, `office-start`.

#### Scenario: Lint

- **WHEN** the skill lint test runs
- **THEN** each of the nine folders has a SKILL.md whose frontmatter `name` equals the folder name and whose
  description is at most 1024 characters

### Requirement: Hungarian triggers

Each skill's description SHALL include the English trigger phrases and the Hungarian office words that fit it
(from: árajánlat, díjbekérő, árlista, szerződés, jelenléti ív, prezentáció, táblázat), unsuffixed.

#### Scenario: Price list request in Hungarian

- **WHEN** the descriptions are searched for `árlista`
- **THEN** `office-gridcraft` and `office-data-visual` match

### Requirement: Verify after every artefact

Every app recipe and every workflow step that produces a file SHALL end with an `aiplus-office verify` call (or an
explicit `check:` gate), and the skills SHALL state that a step is not done until the check passes.

#### Scenario: Recipe ends with verify

- **WHEN** the lint test reads every `recipe:` fence of the app skills
- **THEN** each fence's last command line starts with `aiplus-office verify`

### Requirement: Hungarian worked example per workflow

Each workflow skill SHALL contain one worked Hungarian example: `office-doc-publish` an árajánlat DOCX/PDF from a
Markdown file with frontmatter, `office-data-visual` an árlista XLSX with a 27% ÁFA formula column and a gross total,
`office-deck` a short Hungarian deck. Examples SHALL use invented company names only.

#### Scenario: VAT formula in the price list example

- **WHEN** the `office-data-visual` example is read
- **THEN** it contains a formula multiplying the net price by 0.27 (or 1.27) and a SUM total

### Requirement: No upstream-agent or dashboard residue

The skills SHALL NOT reference the upstream agent's install command, CLI name or MCP file, nano-banana, the dashboard
or apps outside the four office apps as something to run.

#### Scenario: Residue grep

- **WHEN** the lint test greps the skills for the upstream agent's CLI and install names, its config folder,
  `nano-banana` and `photocraft`
- **THEN** there is no match

### Requirement: Alpha caveat stated

The router skill SHALL tell Claude that the apps are early alpha and that a file meant for a customer is checked
(verify, and a rendered page looked at) before it is sent.

#### Scenario: Caveat present

- **WHEN** the router skill is read
- **THEN** it contains the word "alpha" and the instruction to check before sending

### Requirement: Hungarian numbers and dates in GridCraft

`office-gridcraft` and `office-data-visual` SHALL tell Claude to write numbers as numbers and dates as ISO dates
(`2026-10-31`), showing them the Hungarian way with a number format, never to write „1 330,50"-style text or convert a
Hungarian CSV straight into GridCraft, to read back every total against an independently computed value, and to gate the
workbook with `aiplus-office verify <xlsx> --hu-numbers`.

#### Scenario: A Hungarian price arrives as text

- **WHEN** the user's data holds „1 330,50 Ft"
- **THEN** the skill writes 1330.5 with a forint number format and `--hu-numbers` passes

### Requirement: ő and ű kept in PDFs of a sheet

`office-gridcraft` and `office-data-visual` SHALL route a sheet whose text or chart title holds ő, ű, Ő or Ű around
GridCraft's PDF export (the table through GridCraft HTML → WordCraft PDF, the slide chart drawn by DeckCraft from the
read-back values), SHALL gate every PDF made from a workbook with `--hu-glyphs <workbook>`, and SHALL tell the user
plainly when a GridCraft printout would lose those letters.

#### Scenario: Árlista with Tűzőgép

- **WHEN** the árlista holds „Tűzőgép"
- **THEN** the PDF is made through WordCraft, the slide chart by DeckCraft, and `--hu-glyphs` passes on the PDF

### Requirement: No Hungarian spell check said plainly

`office-wordcraft` SHALL state that WordCraft has no Hungarian spell check (on `en-US` it flags every Hungarian word, on
`hu-HU` nothing), SHALL NOT use its spell-check results on Hungarian text, and SHALL have Claude proofread Hungarian
text itself and tell the user so.

#### Scenario: Hungarian letter

- **WHEN** Claude writes a Hungarian DOCX
- **THEN** it proofreads the text itself and tells the user that WordCraft does not check Hungarian spelling
