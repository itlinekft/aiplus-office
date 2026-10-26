<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/itlinekft/aiplus-office/main/brand/aiplus-office-dark-256.png">
    <img src="https://raw.githubusercontent.com/itlinekft/aiplus-office/main/brand/aiplus-office-256.png" width="160" height="160" alt="AI+ Iroda · AI+ Office">
  </picture>
</p>

# AI+ Iroda · AI+ Office

**AI+ Iroda** (English: **AI+ Office**) · ITLine AI+ · ingyenes · MIT

## Magyarul

Az AI+ Iroda ingyenes AI+ modul a Claude-hoz: a Claude **Word, Excel, PowerPoint és PDF formátumú** fájlokat készít és szerkeszt az
ingyenes, nyílt forrású ArtCraft programokkal (WordCraft, GridCraft, DeckCraft, PdfCraft), magyar irodai mintákkal
(árajánlat, árlista, prezentáció), és minden kész fájlt gépi ellenőrzés néz át. Az ArtCraft programok korai változatok:
dolgozz másolaton, és az ügyfélnek szánt fájlt küldés előtt nézd át.

- **Telepítés.** Claude Desktop: Customize → Plugins → Add marketplace → `itlinekft/aiplus-plugins`, majd az
  `aiplus-office` telepítése. Claude Code: `/plugin install aiplus-office --marketplace itlinekft/aiplus-plugins`.
- **Mi kell hozzá?** Node.js 20 vagy újabb (https://nodejs.org, „LTS”). A négy programot a modul maga tölti le a hivatalos
  GitHub-oldalukról, ellenőrzőlistával egyeztetve, a saját felhasználói mappádba; telepítő és rendszergazdai jog nem
  kell. A Claude Desktop ezt magától, a háttérben elvégzi, amikor elindul vagy munkamenetet nyitsz, a Claude Code az első feladatnál.
- **Mi hol működik?** A sima Chatben is megy mind a négy: ott a fájlok a Dokumentumok mappán belül az **„AI+ Iroda”**
  mappába kerülnek, oda tedd azt is, amin a Claude dolgozzon. **A saját mappádban** Claude Code-ban vagy a Claude
  Desktopban „This computer” környezetű munkamenetben dolgozhatsz. A felhőben futó munkamenet nem tudja letölteni a
  programokat.
- **Első lépés:** kérdezd meg a Claude-tól: „hogyan kezdjem?” Megnézi a gépet, elmondja, honnan jönnek a programok,
  és csak a beleegyezéseddel tölt le.
- **Weboldal:** https://www.itline.hu/ai-plus/iroda/
- **Útmutató és hibaelhárítás:** [felhasználói útmutató](https://github.com/itlinekft/aiplus-office/blob/main/docs/user-guide.md), [hibaelhárítás](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md).

## In English

AI+ Office (Hungarian name: AI+ Iroda) is a free AI+ module for Claude. Claude creates and edits files in **Word, Excel, PowerPoint and PDF** formats (DOCX, XLSX,
PPTX, PDF) with the free, open-source ArtCraft programs (**WordCraft, GridCraft, DeckCraft, PdfCraft**) through their
command-line tools, checks every finished file mechanically, and follows worked Hungarian office examples (árajánlat,
árlista, prezentáció).

**First step:** ask Claude “how do I start?” (or „hogyan kezdjem?”). The `office-start` skill checks Node.js and the
programs, says where they come from, offers to download them (only with your yes), and says what works where.

**Web page:** https://www.itline.hu/en/ai-plus/ (Hungarian page: https://www.itline.hu/ai-plus/iroda/)

**Guide and troubleshooting:** the [user guide](https://github.com/itlinekft/aiplus-office/blob/main/docs/user-guide.md) and the [troubleshooting guide](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md), Hungarian first, then
English.

## What works where

| Where you work | Word (DOCX) | PDF | Excel (XLSX) | PowerPoint (PPTX) |
|---|---|---|---|---|
| Claude Desktop, plain Chat (in Documents › „AI+ Iroda”) | yes | yes | yes | yes |
| Claude Desktop, a “This computer” session | yes | yes | yes | yes |
| Claude Code | yes | yes | yes | yes |
| a session running in the cloud | not measured | not measured | no | no |

In a plain Chat Claude reaches the four programs through the module's connections, each limited to one folder: the
„AI+ Iroda” folder in your Documents (created on first use; measured on Windows 11, 26 October 2026: a price list, an
offer in Word and PDF, and two slides made there). To work in a folder of your choice, use Claude Code or a “This
computer” session. A session in the cloud cannot download the programs (a Cowork session in the cloud was tried on
Windows: no file was made). This table is
what the module is built for; what has been tried so far is kept up to date in the `office-start` skill.

## The ArtCraft programs are early versions (alpha)

The ArtCraft programs are new and released almost daily. They open and save real Word, Excel, PowerPoint and PDF files,
but not everything in such a file survives: no VBA macros, and formatting the programs do not support may change on
save. Work on a copy, and look at every file meant for a customer before it is sent; the skills make Claude check it
first.

## Install

**Claude Desktop:** Customize → Plugins → Add marketplace → `itlinekft/aiplus-plugins`, then install `aiplus-office`.

**Claude Code:**

    /plugin install aiplus-office --marketplace itlinekft/aiplus-plugins

or, on older versions:

    claude plugin marketplace add itlinekft/aiplus-plugins
    claude plugin install aiplus-office@aiplus-plugins

## What it needs

- **Node.js 20 or newer** (https://nodejs.org, the “LTS” version).
- Internet access once per program: the module downloads the program's official release from
  `github.com/storytold/<program>` (20–100 MB), checks it against the release's `SHA256SUMS.txt`, and keeps it in a
  per-user folder (`%LOCALAPPDATA%\aiplus-office` on Windows, `~/Library/Caches/aiplus-office` on macOS,
  `~/.cache/aiplus-office` on Linux). No installer, no administrator rights; nothing is installed system-wide. Claude
  Desktop does this by itself, in the background, when it starts or a session opens; Claude Code at the first job. On
  Windows, Claude Desktop's copy is in Claude's own folder:
  `%LOCALAPPDATA%\Packages\Claude_…\LocalCache\Local\aiplus-office` (`aiplus-office status` names it).
- For the workflow skills' checks: a Bash shell and `jq` (Claude Code on Windows uses Git Bash; `jq` is not part of it
  by default).

The module uses only the programs' command-line tools; it does not install their desktop (window) apps. To open a file
in a window, download the app from its official release page, e.g. `https://github.com/storytold/gridcraft/releases/latest`
(Windows: the `.msi` installer or the `-portable.zip`; macOS: the `.dmg`).

## What is inside

| Skill | Use |
|---|---|
| `office-start` | first run: checks Node.js and the programs, where they come from, what works where |
| `office-router` | picks the program; plan → discover → run → save → verify |
| `office-wordcraft`, `office-gridcraft`, `office-deckcraft`, `office-pdfcraft` | one per program: commands, traps, tested recipes |
| `office-doc-publish` | Markdown + the company's Word template → DOCX + PDF (árajánlat) |
| `office-deck` | outline → slides → PDF handout (prezentáció) |
| `office-data-visual` | numbers → spreadsheet with formulas → chart → slide (árlista with 27% ÁFA) |

The `aiplus-office` command is `dist/aiplus-office.mjs`.

## Licence

MIT: see `LICENSE` and `NOTICE`. The ArtCraft programs are separate projects (MIT OR Apache-2.0) and are not part of
this module.

---

A Word, az Excel és a PowerPoint a Microsoft védjegyei; az ArtCraft programjai nem a Microsoft termékei, és ez a modul nem kapcsolódik hozzájuk.

Word, Excel and PowerPoint are trademarks of Microsoft; the ArtCraft programs are not Microsoft products, and this module is not affiliated with them.
