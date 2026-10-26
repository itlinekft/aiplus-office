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

- **Telepítés a Claude Desktopban** (Claude módban): Customize › Plugins › Add plugin › Add marketplace › Add from a
  repository › `itlinekft/aiplus-plugins` › Sync, majd az **AI+ Iroda** kártyán Add › Continue. A „Grant access”
  értesítés nem kell, zárd be. **Claude Code:** `claude plugin marketplace add itlinekft/aiplus-plugins`, majd
  `claude plugin install aiplus-office@aiplus-plugins`. Lépésről lépésre: a felhasználói útmutatóban.
- **Mi kell hozzá?** Node.js 20 vagy újabb (https://nodejs.org, „LTS”); telepítése után a Claude-ból lépj ki teljesen,
  és indítsd újra. A Claude Code Windowson a Git for Windowst is kéri; a modul ellenőrzéseihez kellő `jq`-t, ha nincs
  a gépen, a modul maga tölti le (kb. 1 MB, ellenőrzőösszeggel). A négy programot a modul maga tölti le a hivatalos
  GitHub-oldalukról, ellenőrzőlistával egyeztetve, a saját felhasználói mappádba; telepítő és rendszergazdai jog nem
  kell. A Claude Desktop ezt magától, a háttérben elvégzi, amikor elindul vagy munkamenetet nyitsz, a Claude Code az első feladatnál.
- **Mi hol működik?** A sima Chatben is megy mind a négy: ott a fájlok a Dokumentumok mappán belül az **„AI+ Iroda”**
  mappába kerülnek, oda tedd azt is, amin a Claude dolgozzon. **A saját mappádban** Claude Code-ban vagy a Claude
  Desktopban „This computer” környezetű munkamenetben dolgozhatsz. A felhőben futó munkamenet nem tudja letölteni a
  programokat.
- **Első lépés:** kérdezd meg a Claude-tól: „Hogyan kezdjem az AI+ Iroda modult?” Megnézi a gépet, elmondja, honnan
  jöttek a programok, és hogy mi hol működik.
- **Ha a Claude Desktopban a kapcsolatok mellett „Reconnect” áll:** a Node.js telepítése után kattints rá mind a
  négynél (különben a Claude 15 percig nem próbálja újra).
- **Weboldal:** https://www.itline.hu/ai-plus/iroda/
- **Útmutató és hibaelhárítás:** [felhasználói útmutató](https://github.com/itlinekft/aiplus-office/blob/main/docs/user-guide.md), [hibaelhárítás](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md).

## In English

AI+ Office (Hungarian name: AI+ Iroda) is a free AI+ module for Claude. Claude creates and edits files in **Word, Excel, PowerPoint and PDF** formats (DOCX, XLSX,
PPTX, PDF) with the free, open-source ArtCraft programs (**WordCraft, GridCraft, DeckCraft, PdfCraft**) through their
command-line tools, checks every finished file mechanically, and follows worked Hungarian office examples (árajánlat,
árlista, prezentáció).

**First step:** ask Claude “How do I start with the AI+ Iroda module?” (or „Hogyan kezdjem az AI+ Iroda modult?”). The
`office-start` skill checks Node.js and the programs, says where they came from (Claude Desktop downloads them by
itself in the background; Claude Code at the first job), and says what works where.

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

**Claude Desktop** (tried on Windows 11, 26 October 2026):

1. Install Node.js (below). If Claude Desktop was running, quit it fully (from the taskbar icon too) and start it again.
2. In **Claude** mode (Code mode's Customize page has no “Manage marketplaces”): **Customize** › **Plugins** › **Add
   plugin** › **Add marketplace** › **Add from a repository** › `itlinekft/aiplus-plugins` › **Sync**. A notice “Auto-sync
   requires the Claude GitHub App” with “Grant access” is not needed: close it.
3. On the **AI+ Iroda** card: **Add** › “This plugin includes local MCP servers” › **Continue** › “AI+ Iroda is installed
   and ready to use.”
4. The four programs download by themselves the next time Claude starts or a session opens (about 10 s for us).
5. If the session's **Connectors** show **Reconnect** next to the four “Aiplus office …” entries (Claude was started
   before Node.js was there), click **Reconnect** on each: Claude Desktop otherwise waits 15 minutes before it retries.

To remove it: Customize › Plugins › Yours › “More actions for AI+ Iroda” › Remove; the marketplace under Add plugin ›
Manage marketplaces. To update it in Claude Desktop, remove it and add it again.

**Claude Code:**

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
- For the workflow skills' checks: a Bash shell and `jq` (Claude Code on Windows uses Git Bash, which has no `jq`; the
  skills then use `aiplus-office jq`, which downloads a pinned jq 1.8.2 once, about 1 MB, its SHA-256 checked).

The module uses only the programs' command-line tools; it does not install their desktop (window) apps. To open a file
in a window, install the ArtCraft Launcher (`https://github.com/storytold/craft-launcher/releases/latest`, on Windows
`artcraft-launcher-<version>-windows-x64.msi`, per user, no administrator rights) and install the four apps from it; or
download one app from its own release page, e.g. `https://github.com/storytold/gridcraft/releases/latest`. The apps
register no file types: open a file from the app (File › Open).

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
