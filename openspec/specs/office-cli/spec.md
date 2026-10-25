# office-cli Specification

## Purpose
The `aiplus-office` command: it provisions the headless CLIs of the free ArtCraft office apps on demand, runs them,
checks their output mechanically and fills DOCX templates, so an agent can produce office files without Microsoft Office.

## Requirements

### Requirement: Office app registry

The command SHALL know exactly four apps — `wordcraft`, `gridcraft`, `deckcraft`, `pdfcraft` — each with its
`storytold/<id>` release repository, CLI name, release asset pattern per host and MCP confinement facts. Any other app
id SHALL be rejected before any network or disk access, with a message that lists the four supported ids.

#### Scenario: List the apps offline

- **WHEN** the user runs `aiplus-office apps --json` with no network
- **THEN** it prints the four apps with id, purpose, repository and MCP confinement, and exits 0

#### Scenario: Unknown app id

- **WHEN** the user runs `aiplus-office photocraft path`
- **THEN** it prints the usage and exits 1 without contacting GitHub

### Requirement: Checksum-verified provisioning

On first use of an app the command SHALL download the host's release asset from `github.com/storytold/<app>` and
install it only when its SHA-256 digest equals the release's `SHA256SUMS.txt` entry. A missing sums file, a missing
entry, a mismatch or an archive entry that is not a regular file or directory or that escapes the install directory
SHALL abort the install and leave no partial install behind.

#### Scenario: Digest mismatch

- **WHEN** the downloaded asset's SHA-256 differs from `SHA256SUMS.txt`
- **THEN** provisioning fails with exit code 69, names both digests, and the cache holds no version directory for it

#### Scenario: Hostile archive

- **WHEN** the archive lists a `../` path, an absolute path, a symlink or a hard link
- **THEN** nothing is extracted into the cache and the command exits 69

### Requirement: Version resolution and cache

The command SHALL resolve the version in this order: `AIPLUS_OFFICE_<APP>_BIN` (use that binary), then
`AIPLUS_OFFICE_<APP>_VERSION` (pin), then the latest release (looked up at most once per 24 hours), and fall back to
the newest installed version when the lookup fails. Installs SHALL live under `AIPLUS_OFFICE_HOME` when set, else a
per-user cache directory; nothing SHALL be installed system-wide.

#### Scenario: Pinned version

- **WHEN** `AIPLUS_OFFICE_GRIDCRAFT_VERSION=0.11.1` is set
- **THEN** `aiplus-office gridcraft ensure` installs or reuses `<cache>/gridcraft/0.11.1/` and reports `source: "pin"`

#### Scenario: Cache hit

- **WHEN** the resolved version is already installed and valid
- **THEN** no asset is downloaded and the report says `cacheHit: true`

### Requirement: Status never downloads

`aiplus-office status` SHALL report, per app, the installed versions, cache size, the version a run would use and
any override, reading only the local cache.

#### Scenario: Offline status

- **WHEN** the user runs `aiplus-office status --json` with no network
- **THEN** it prints one row per app and exits 0 without any request

### Requirement: Bash route

`aiplus-office <app> exec <args…>` SHALL provision the app and run its CLI with the arguments verbatim, inherited
stdio and the CLI's own exit code; `path` SHALL print the binary's absolute path; `ensure` SHALL print the provisioning
report as JSON; `install <app…>|--all` SHALL provision several apps and exit 69 if any failed.

#### Scenario: Exit code passes through

- **WHEN** the app CLI exits 3
- **THEN** `aiplus-office <app> exec …` exits 3

### Requirement: Mechanical output checks

`aiplus-office verify <file> <assertions…>` SHALL check a produced file and print expected vs actual per assertion:
for PDFs `--pages N` and `--text-contains S` (through PdfCraft), for images and media `--size`, `--duration` and
related probes (through `ffprobe`/`ffmpeg`). Exit codes SHALL be 0 all pass, 1 a failure or missing file, 2 usage,
3 a probe tool missing.

#### Scenario: PDF text check fails

- **WHEN** `verify offer.pdf --text-contains "Végösszeg"` runs on a PDF without that text
- **THEN** it prints `FAIL --text-contains` with expected and actual, and exits 1

### Requirement: DOCX template filling

`aiplus-office doc prepare <in.md> --out <dir>` SHALL fill `{{ name }}` placeholders of a DOCX template (also in text
boxes, headers, footers and runs split by Word) from frontmatter, `--var`, template defaults and system variables
(`$date`, `$year`, …), write `template.filled.docx`, `body.md` and `prepare.json`, and report unresolved and
template-defaulted variables. It SHALL exit 1 on unresolved placeholders unless `--allow-missing` is given.

#### Scenario: Hungarian date

- **WHEN** the frontmatter sets `language: hu` and the template contains `{{ $date }}`
- **THEN** the filled document shows the date as `2026. október 24.` (accented month name)

#### Scenario: Template outside the input's folder

- **WHEN** the frontmatter's `templates_dir` resolves outside the Markdown file's folder and no `--allow-path` covers it
- **THEN** the command refuses with exit 1 and writes nothing

### Requirement: Status reports the runtime

`aiplus-office status` (text) SHALL print the Node.js version running it with a verdict against the minimum major
version 20, and the host as `<platform>/<arch>`, before the per-app rows; `status --json` SHALL keep its shape (one row
per app).

#### Scenario: Old Node.js

- **WHEN** `status` runs on Node.js 18
- **THEN** the first line names the version and says it is too old (needs 20 or newer), and the exit code is still 0

#### Scenario: JSON unchanged

- **WHEN** `status --json` runs
- **THEN** it prints an array of four app rows, as before

### Requirement: Hungarian letters survive in a PDF

`aiplus-office verify <file.pdf> --hu-glyphs <source>` SHALL collect every word that holds ő, ű, Ő or Ű from the source
(the text of an XLSX, DOCX or PPTX, or a plain text, Markdown, CSV or HTML file) and SHALL fail, naming the missing
words, when any of them is absent from the PDF's extracted text. A source with no such word SHALL pass and say so.

#### Scenario: GridCraft PDF with Tűzőgép (T5)

- **WHEN** a GridCraft-exported PDF of a sheet holding „Tűzőgép" is verified with `--hu-glyphs` against the sheet
- **THEN** verify exits 1 and names „Tűzőgép" as missing

#### Scenario: The WordCraft route

- **WHEN** the same sheet goes GridCraft HTML → WordCraft PDF and is verified with `--hu-glyphs` against the sheet
- **THEN** verify exits 0

### Requirement: No Hungarian-format numbers stored as text

`aiplus-office verify <file.xlsx> --hu-numbers` SHALL fail, listing the cells (sheet, cell, text), when a text cell
looks like a Hungarian-format number („1 330,50", „1.330,50", „12 000 Ft", „1330,5") or date („2026.10.31.",
„31.10.2026", „2026. október 31.") and lies inside a range a formula of the workbook reads, or in a column that also
holds a number, or in a column with at least two such cells; a text cell of digits only SHALL count when a formula
reads it. A workbook without such cells SHALL pass.

#### Scenario: Hungarian CSV converted by GridCraft (T7)

- **WHEN** a workbook converted from a CSV with `1 330,50`, `1.330,50` and `2026.10.31.` under `=SUM(C2:C4)` is verified
  with `--hu-numbers`
- **THEN** verify exits 1 and lists the text cells, among them C3 „1 330,50" and C4 „1.330,50"

#### Scenario: Numbers written as numbers

- **WHEN** the same data is written as numbers and ISO dates with a Hungarian number format
- **THEN** `--hu-numbers` passes and the `SUM` is 47 661
