# aiplus-office: ingyenes irodai AI+ modul

## Magyarul

Ingyenes AI+ modul a Claude-hoz: a Claude **Word, Excel, PowerPoint és PDF formátumú** fájlokat készít és szerkeszt az
ingyenes, nyílt forrású ArtCraft programokkal (WordCraft, GridCraft, DeckCraft, PdfCraft), magyar irodai mintákkal
(árajánlat, árlista, prezentáció), és minden kész fájlt gépi ellenőrzés néz át. Az ArtCraft programok korai változatok:
dolgozz másolaton, és az ügyfélnek szánt fájlt küldés előtt nézd át.

- **Telepítés.** Claude Desktop: Customize → Plugins → Add marketplace → `itlinekft/aiplus-plugins`, majd az
  `aiplus-office` telepítése. Claude Code: `/plugin install aiplus-office --marketplace itlinekft/aiplus-plugins`.
- **Mi kell hozzá?** Node.js 20 vagy újabb (https://nodejs.org, „LTS”). A négy programot a modul első használatkor maga
  tölti le a hivatalos GitHub-oldalukról, ellenőrzőlistával egyeztetve, a saját felhasználói mappádba; telepítő és
  rendszergazdai jog nem kell.
- **Mi hol működik?** A sima Chatben csak Word és PDF megy. **Excel- és PowerPoint-fájlhoz a Claude-nak a saját
  gépeden kell futnia:** Claude Code, vagy a Claude Desktopban „This computer” környezetű munkamenet. A felhőben futó
  munkamenet nem tudja letölteni a programokat.
- **Első lépés:** kérdezd meg a Claude-tól: „hogyan kezdjem?” Megnézi a gépet, elmondja, honnan jönnek a programok,
  és csak a beleegyezéseddel tölt le.

## In English

A free AI+ module for Claude. Claude creates and edits files in **Word, Excel, PowerPoint and PDF** formats (DOCX, XLSX,
PPTX, PDF) with the free, open-source ArtCraft programs (**WordCraft, GridCraft, DeckCraft, PdfCraft**) through their
command-line tools, checks every finished file mechanically, and follows worked Hungarian office examples (árajánlat,
árlista, prezentáció).

**First step:** ask Claude “how do I start?” (or „hogyan kezdjem?”). The `office-start` skill checks Node.js and the
programs, says where they come from, offers to download them (only with your yes), and says what works where.

## What works where

| Where you work | Word (DOCX) | PDF | Excel (XLSX) | PowerPoint (PPTX) |
|---|---|---|---|---|
| Claude Desktop, plain Chat | yes | yes | no | no |
| Claude Desktop, a “This computer” session | yes | yes | yes | yes |
| Claude Code | yes | yes | yes | yes |
| a session running in the cloud | not measured | not measured | no | no |

A plain Chat cannot run programs, so it reaches only the two programs connected to Claude directly (WordCraft and
PdfCraft, limited to the working folder). GridCraft and DeckCraft cannot be limited to a folder, so they are not
connected that way; Claude runs them as programs, which needs **Claude running on your own computer**. A session in the
cloud cannot download the programs (a Cowork session in the cloud was tried on Windows: no file was made). This table is
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
- Internet access on first use of each program: the module downloads the program's official release from
  `github.com/storytold/<program>` (20–100 MB), checks it against the release's `SHA256SUMS.txt`, and keeps it in a
  per-user folder (`%LOCALAPPDATA%\aiplus-office` on Windows, `~/Library/Caches/aiplus-office` on macOS,
  `~/.cache/aiplus-office` on Linux). No installer, no administrator rights; nothing is installed system-wide.
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
