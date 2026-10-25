# aiplus-office: felhasználói útmutató · user guide

## Magyarul

### Mi ez?

Az aiplus-office ingyenes AI+ modul a Claude-hoz. A Claude vele Word, Excel, PowerPoint és PDF formátumú fájlokat
készít és szerkeszt, négy ingyenes, nyílt forrású programmal: WordCraft (Word), GridCraft (Excel), DeckCraft
(PowerPoint) és PdfCraft (PDF). Magyar irodai mintákat is kap: árajánlat, árlista, prezentáció. Minden kész fájlt
gépi ellenőrzés néz át, mielőtt a Claude odaadja.

### Mi kell hozzá?

- **Claude Desktop vagy Claude Code**, a saját Claude-fiókoddal.
- **Node.js 20 vagy újabb.** Ingyenes segédprogram: https://nodejs.org, az „LTS” jelű változat. Telepítés után indítsd
  újra a Claude-ot.
- **Internet az első használatkor.** A négy programot a modul maga tölti le a hivatalos GitHub-oldalukról
  (`github.com/storytold/<program>`), programonként 20–100 MB-ot. Minden letöltött fájlt összevet a kiadás
  ellenőrzőlistájával (`SHA256SUMS.txt`); ha eltér, nem telepíti. Telepítő nem fut, rendszergazdai jog nem kell.

### Telepítés

**Claude Desktop:** Customize → Plugins → Add marketplace → írd be: `itlinekft/aiplus-plugins`, majd telepítsd az
`aiplus-office` modult.

**Claude Code:**

    claude plugin marketplace add itlinekft/aiplus-plugins
    claude plugin install aiplus-office@aiplus-plugins

### Az első lépés

Kérdezd meg a Claude-tól: **„hogyan kezdjem?”** Megnézi, megvan-e a Node.js és a négy program, elmondja, honnan jönnek
a programok, és csak akkor tölt le, ha igent mondasz. Azt is elmondja, eddig mit próbáltunk ki melyik gépen.

### Mi hol működik?

| Ahol dolgozol | Word | PDF | Excel | PowerPoint |
|---|---|---|---|---|
| Claude Desktop, sima Chat | igen | igen | nem | nem |
| Claude Desktop, „This computer” munkamenet | igen | igen | igen | igen |
| Claude Code | igen | igen | igen | igen |
| Felhőben futó munkamenet | nem mértük | nem mértük | nem | nem |

A sima Chatben a Word és a PDF két beépített kapcsolaton megy, és ezek csak a munkamappádhoz férnek hozzá. **Excel- és
PowerPoint-fájlhoz a Claude-nak a saját gépeden kell futnia:** a Claude Code-ban, vagy a Claude Desktopban egy „This
computer” környezetű munkamenetben. A felhőben futó munkamenet nem tudja letölteni a programokat: a felhőben futó
Coworkben kipróbáltuk, és nem készült fájl.

### Kész kérések, kipróbálásra

- „Írj árajánlatot Word-formátumban a Minta Kft. részére három irodabútorról, nettó árral, 27% ÁFÁ-val és bruttó
  végösszeggel, és mentsd el PDF-ben is.”
- „Készíts árlistát táblázatban öt termékkel: cikkszám, megnevezés, nettó ár, 27% ÁFA képlettel, bruttó ár és
  összesen.” (Claude Code vagy „This computer” munkamenet)
- „Készíts négydiás prezentációt a negyedéves eredményekről a Minta Kft. számára, és adj mellé PDF-et is.” (Claude Code
  vagy „This computer” munkamenet)
- „Fűzd össze ezt a két PDF-et egybe, és vedd ki belőle a harmadik oldalt.”
- „Itt a cégünk Word-sablonja: ebből készíts árajánlatot, a fejléc és a lábléc maradjon.”

### Amit neked is érdemes átnézni

- **Az összegeket.** A modul ellenőrzi a képleteket és az összegeket, de az ügyfélnek szánt számot te is nézd meg.
- **Az ő és ű betűt.** A GridCraft saját PDF-je elhagyja ezt a két betűt, ezért az ilyen táblázat PDF-jét a modul a
  WordCraft-tal készíti, és ellenőrzi. Ha mégis hiányzik, szólj a Claude-nak.
- **A helyesírást.** A WordCraft nem ellenőrzi a magyar helyesírást, ezért a szöveget a Claude nézi át.
- **A formázást.** A programok korai változatok: ami egy Microsoft Office-fájlban van, nem mind marad meg mentés után.
  Mindig másolaton dolgozz, az eredetit tedd el.

### Hová kerülnek a fájlok?

A kész fájlok a munkamappádba kerülnek: a Claude Code-ban abba a mappába, amelyet megnyitottál, a Claude Desktopban
abba, amelyet a munkamenethez választottál. A négy program a saját felhasználói mappádba kerül: Windowson
`%LOCALAPPDATA%\aiplus-office`, macOS-en `~/Library/Caches/aiplus-office`, Linuxon `~/.cache/aiplus-office`.

### Frissítés

A négy programból a modul magától a legújabb kiadást használja. A modult magát így frissíted:

- **Claude Desktop:** a modult a Customize → Plugins oldalon találod; a frissítést a Claude Desktopban még nem
  próbáltuk ki.
- **Claude Code:**

      claude plugin marketplace update aiplus-plugins
      claude plugin update aiplus-office@aiplus-plugins

### Eltávolítás

- **Claude Desktop:** a Customize → Plugins oldalon (ezt a lépést a Claude Desktopban még nem próbáltuk ki).
- **Claude Code:** `claude plugin uninstall aiplus-office@aiplus-plugins`
- A letöltött programok helyét úgy szabadítod fel, hogy törlöd a fenti `aiplus-office` mappát.

### Amit nem tud

- Makrót (VBA) nem futtat és nem ment.
- A kész fájl nem pont olyan, mint amit a Microsoft Office készítene; a ritkább formázás mentéskor elveszhet.
- A négy program korai változat, szinte naponta jön új kiadás.
- A sima Chatben Excel- és PowerPoint-fájlt nem készít.

Ha valami nem működik, nézd meg a [hibaelhárítási leírást](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md), vagy kérdezd meg a Claude-tól:
„hogyan kezdjem?”

## English

### What it is

aiplus-office is a free AI+ module for Claude. With it, Claude creates and edits files in Word, Excel, PowerPoint and
PDF formats, using four free, open-source programs: WordCraft (Word), GridCraft (Excel), DeckCraft (PowerPoint) and
PdfCraft (PDF). It also gets Hungarian office examples: an offer, a price list, a presentation. Every finished file is
checked mechanically before Claude hands it over.

### What you need

- **Claude Desktop or Claude Code**, with your own Claude account.
- **Node.js 20 or newer.** A free helper program: https://nodejs.org, the “LTS” version. Restart Claude after
  installing it.
- **Internet on first use.** The module downloads the four programs itself from their official GitHub pages
  (`github.com/storytold/<program>`), 20–100 MB each. It checks every downloaded file against the release's checklist
  (`SHA256SUMS.txt`); a file that differs is not installed. No installer runs, no administrator rights are needed.

### Install

**Claude Desktop:** Customize → Plugins → Add marketplace → enter `itlinekft/aiplus-plugins`, then install the
`aiplus-office` module.

**Claude Code:**

    claude plugin marketplace add itlinekft/aiplus-plugins
    claude plugin install aiplus-office@aiplus-plugins

### The first step

Ask Claude: **“how do I start?”** It checks Node.js and the four programs, says where the programs come from, and
downloads only after you say yes. It also says what has been tried so far on which computer.

### What works where

| Where you work | Word | PDF | Excel | PowerPoint |
|---|---|---|---|---|
| Claude Desktop, plain Chat | yes | yes | no | no |
| Claude Desktop, a “This computer” session | yes | yes | yes | yes |
| Claude Code | yes | yes | yes | yes |
| A session running in the cloud | not measured | not measured | no | no |

In a plain Chat, Word and PDF go through two built-in connections, which reach only your working folder. **Excel and
PowerPoint files need Claude running on your own computer:** in Claude Code, or in Claude Desktop in a session whose
environment is “This computer”. A session running in the cloud cannot download the programs: we tried it in Cowork
running in the cloud, and no file was made.

### Ready requests to try

- “Write an offer in Word format for Minta Kft. for three pieces of office furniture, with net prices, 27% VAT and a
  gross total, and save it as a PDF too.”
- “Make a price list spreadsheet with five products: item number, name, net price, 27% VAT as a formula, gross price and
  a total.” (Claude Code or a “This computer” session)
- “Make a four-slide presentation on the quarterly results for Minta Kft., with a PDF next to it.” (Claude Code or a
  “This computer” session)
- “Merge these two PDFs into one and take out the third page.”
- “Here is our company's Word template: make an offer from it, keeping the header and the footer.”

### What to check yourself

- **The totals.** The module checks the formulas and the totals, but look at any number meant for a customer yourself.
- **The letters ő and ű.** GridCraft's own PDF drops these two letters, so the module makes the PDF of such a sheet with
  WordCraft and checks it. If one is still missing, tell Claude.
- **The spelling.** WordCraft does not check Hungarian spelling, so Claude proofreads the text.
- **The formatting.** The programs are early versions: not everything in a Microsoft Office file survives a save.
  Always work on a copy and keep the original.

### Where the files go

Finished files go into your working folder: in Claude Code the folder you opened, in Claude Desktop the one you chose
for the session. The four programs go into your own user folder: `%LOCALAPPDATA%\aiplus-office` on Windows,
`~/Library/Caches/aiplus-office` on macOS, `~/.cache/aiplus-office` on Linux.

### Updating

The module uses the newest release of the four programs by itself. To update the module:

- **Claude Desktop:** the module is on the Customize → Plugins page; updating it in Claude Desktop has not been tried
  yet.
- **Claude Code:**

      claude plugin marketplace update aiplus-plugins
      claude plugin update aiplus-office@aiplus-plugins

### Removing

- **Claude Desktop:** on the Customize → Plugins page (this step has not been tried in Claude Desktop yet).
- **Claude Code:** `claude plugin uninstall aiplus-office@aiplus-plugins`
- To free the space the programs take, delete the `aiplus-office` folder named above.

### What it does not do

- It does not run or save macros (VBA).
- A finished file is not exactly what Microsoft Office would make; less common formatting can be lost on save.
- The four programs are early versions, with a new release almost every day.
- A plain Chat does not make Excel or PowerPoint files.

If something does not work, see the [troubleshooting guide](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md), or ask Claude: “how do I start?”

---

A Word, az Excel és a PowerPoint a Microsoft védjegyei; az ArtCraft programjai nem a Microsoft termékei, és ez a modul
nem kapcsolódik hozzájuk. Word, Excel and PowerPoint are trademarks of Microsoft; the ArtCraft programs are not
Microsoft products, and this module is not affiliated with them.
