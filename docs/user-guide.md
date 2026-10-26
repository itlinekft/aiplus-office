# AI+ Iroda: felhasználói útmutató · AI+ Office: user guide

## Magyarul

### Mi ez?

Az AI+ Iroda (aiplus-office) ingyenes AI+ modul a Claude-hoz. A Claude vele Word, Excel, PowerPoint és PDF formátumú fájlokat
készít és szerkeszt, négy ingyenes, nyílt forrású programmal: WordCraft (Word), GridCraft (Excel), DeckCraft
(PowerPoint) és PdfCraft (PDF). Magyar irodai mintákat is kap: árajánlat, árlista, prezentáció. Minden kész fájlt
gépi ellenőrzés néz át, mielőtt a Claude odaadja.

### Mi kell hozzá?

- **Claude Desktop vagy Claude Code**, a saját Claude-fiókoddal.
- **Node.js 20 vagy újabb.** Ingyenes segédprogram: https://nodejs.org, az „LTS” jelű változat (Windowson az `.msi`
  telepítő, az alapbeállításokkal).
- **Internet az első használatkor.** A négy programot a modul maga tölti le a hivatalos GitHub-oldalukról
  (`github.com/storytold/<program>`), programonként 20–100 MB-ot, és minden fájlt összevet a kiadás ellenőrzőlistájával
  (`SHA256SUMS.txt`); ha eltér, nem telepíti. Telepítő nem fut, rendszergazdai jog nem kell.
- **Claude Code Windowson:** a Git for Windows (ez a Claude Code saját feltétele). A modul néhány ellenőrzéséhez kell a
  `jq` nevű kis program; ha nincs a gépen, a modul magától letölti (kb. 1 MB, ellenőrzőösszeggel).

### Telepítés a Claude Desktopban, lépésről lépésre

Kipróbálva Windows 11-en, 2026. október 26-án.

1. **Node.js.** Telepítsd a https://nodejs.org oldalról az „LTS” változatot. Ha a Claude Desktop közben futott, lépj ki
   belőle teljesen (a tálca jobb oldali ikonjáról is), és indítsd újra: csak így látja a Node.js-t. Hogy fent van-e,
   egy parancssorban a `node --version` mutatja (v20 vagy újabb kell).
2. **A modulgyűjtemény.** A Claude Desktopban válts **Claude** módra (a Code mód beállításaiban nincs „Manage
   marketplaces”), majd: **Customize** › **Plugins** › **Add plugin** › **Add marketplace** › **Add from a
   repository**. Írd be vagy válaszd ki: `itlinekft/aiplus-plugins`, majd **Sync**. Ha megjelenik az „Auto-sync requires
   the Claude GitHub App” értesítés „Grant access” gombbal, nem kell: zárd be az X-szel.
3. **A modul.** Az **AI+ Iroda** kártyán: **Add** › „This plugin includes local MCP servers” › **Continue**. A Claude
   kiírja: „AI+ Iroda is installed and ready to use.”
4. **A négy program** a következő indításkor vagy amikor munkamenetet nyitsz, magától letöltődik a háttérben (nálunk kb.
   10 másodperc alatt). Kérdezni nem fog. **Ha a munkamenet jobb oldali „Connectors” részében** az „Aiplus office …”
   kapcsolatok mellett **Reconnect** áll (a Claude a Node.js előtt indult), kattints rá mind a négynél: magától csak 15
   perc múlva próbálná újra.
5. **Az első kérdés:** „Hogyan kezdjem az AI+ Iroda modult?” Megnézi a Node.js-t és a négy programot, elmondja, honnan
   jöttek, és hogy mi hol működik. A modul nevét érdemes kimondani: egy puszta „hogyan kezdjem?” mellé más modul is
   jelentkezhet.

### Telepítés a Claude Code-ban

    claude plugin marketplace add itlinekft/aiplus-plugins
    claude plugin install aiplus-office@aiplus-plugins

A Claude Code az első feladatnál tölti le a programokat; a „hogyan kezdjem?” kérdésre előre is letölti, ha igent mondasz.

### Mi hol működik?

| Ahol dolgozol | Word | PDF | Excel | PowerPoint | A fájlok helye |
|---|---|---|---|---|---|
| Claude Desktop, sima Chat | igen | igen | igen | igen | Dokumentumok › „AI+ Iroda” |
| Claude Desktop, Code, „This computer” munkamenet | igen | igen | igen | igen | a megnyitott mappa |
| Claude Code | igen | igen | igen | igen | a megnyitott mappa |
| Felhőben futó munkamenet | nem mértük | nem mértük | nem | nem | |

**Sima Chat:** a programokat a modul kapcsolatain éri el, és ezek csak a Dokumentumok mappán belüli **„AI+ Iroda”**
mappához férnek hozzá (az első használatkor létrejön). Amin a Claude dolgozzon, azt is oda tedd.

**Saját mappa:** a Claude Desktopban válts **Code** módra, a kérdésmező alatt: **Environment: This computer**, **Folder**
› **Open folder…**, válaszd ki a mappát, és a „Trust this workspace?” kérdésre: **Trust workspace**.

**Felhő:** a felhőben futó munkamenet nem tudja letölteni a programokat (felhőben futó Coworkben kipróbáltuk: nem
készült fájl).

### Kész kérések, kipróbálásra

- „Írj árajánlatot Word-formátumban a Minta Kft. részére három irodabútorról, nettó árral, 27% ÁFÁ-val és bruttó
  végösszeggel, és mentsd el PDF-ben is.”
- „Készíts árlistát táblázatban öt termékkel: cikkszám, megnevezés, nettó ár, 27% ÁFA képlettel, bruttó ár és
  összesen.”
- „Készíts négydiás prezentációt a negyedéves eredményekről a Minta Kft. számára, és adj mellé PDF-et is.”
- „Fűzd össze ezt a két PDF-et egybe, és vedd ki belőle a harmadik oldalt.”
- „Tegyél jelszót erre a PDF-re.” (Új fájlba menti, az eredeti megmarad.)
- „Itt a cégünk Word-sablonja: ebből készíts árajánlatot, a fejléc és a lábléc maradjon.”

Ha a Claude gombokkal kérdez vissza, a gombbal válaszolj.

### Amit neked is érdemes átnézni

- **Az összegeket.** A modul ellenőrzi a képleteket és az összegeket, de az ügyfélnek szánt számot te is nézd meg.
- **Az ő és ű betűt.** A GridCraft saját PDF-je elhagyja ezt a két betűt, ezért az ilyen táblázat PDF-jét a modul a
  WordCraft-tal készíti, és ellenőrzi. Ha mégis hiányzik, szólj a Claude-nak.
- **A helyesírást.** A WordCraft nem ellenőrzi a magyar helyesírást, ezért a szöveget a Claude nézi át.
- **A formázást.** A programok korai változatok: ami egy Microsoft Office-fájlban van, nem mind marad meg mentés után.
  Mindig másolaton dolgozz, az eredetit tedd el.

### Hová kerülnek a programok?

A négy program a saját felhasználói mappádba kerül: Windowson `%LOCALAPPDATA%\aiplus-office`, macOS-en
`~/Library/Caches/aiplus-office`, Linuxon `~/.cache/aiplus-office`. **A Claude Desktop Windowson a saját mappájába teszi
őket:** `%LOCALAPPDATA%\Packages\Claude_…\LocalCache\Local\aiplus-office`. A Fájlkezelőben ott találod; a Claude-tól
megkérdezheted, ő kiírja (`aiplus-office status`, a `desktop cache:` sor).

### Ablakos programok (nem kötelező)

A modulhoz nem kell egyik program ablaka sem: a Claude a háttérben futtatja őket. Ha egy kész fájlt ablakban is meg akarsz
nyitni (például a táblázatot a GridCraftban), telepítsd az ArtCraft Launchert: `github.com/storytold/craft-launcher/releases/latest`
› **Assets** › `artcraft-launcher-<változat>-windows-x64.msi`. Az Edge figyelmeztethet, hogy a fájlt ritkán töltik le: a
letöltések oldalán (Ctrl+J) válaszd a **Megtartás** gombot. A telepítő: **Next**, **Next**, **Install**, **Finish**; a
Launcherben a négy programnál **Telepítés**, majd a felugró „Telepítési mappa” ablakban is **Telepítés**. A programok nem társítják magukhoz a fájltípusokat: a fájlt a programból
nyisd meg (File › Open), ne dupla kattintással. A GridCraftban a számokat normál tempóban gépeld: a cella első
billentyűje utáni nagyon gyors leütések elveszhetnek.

### Frissítés

A négy programból a modul magától a legújabb kiadást használja. A modult magát így frissíted:

- **Claude Desktop:** távolítsd el, és add hozzá újra (lent): így a legújabb változat kerül fel (kipróbálva).
- **Claude Code:**

      claude plugin marketplace update aiplus-plugins
      claude plugin update aiplus-office@aiplus-plugins

### Eltávolítás

- **Claude Desktop** (Claude módban): **Customize** › **Plugins** › **Yours** › „More actions for AI+ Iroda” › **Remove**
  › **Remove**. A modulgyűjteményt: **Add plugin** › **Manage marketplaces** › „More actions for aiplus-plugins” ›
  **Remove** › **Remove**. Kipróbálva Windows 11-en.
- **Claude Code:** `claude plugin uninstall aiplus-office@aiplus-plugins`
- A letöltött programok helyét úgy szabadítod fel, hogy a Claude-ból kilépve törlöd a fenti `aiplus-office` mappát.

### Amit nem tud

- Makrót (VBA) nem futtat és nem ment.
- A kész fájl nem pont olyan, mint amit a Microsoft Office készítene; a ritkább formázás mentéskor elveszhet.
- A négy program korai változat, szinte naponta jön új kiadás.

Ha valami nem működik, nézd meg a [hibaelhárítási leírást](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md), vagy kérdezd meg a Claude-tól:
„Hogyan kezdjem az AI+ Iroda modult?”

## English

### What it is

AI+ Office (aiplus-office, Hungarian name: AI+ Iroda) is a free AI+ module for Claude. With it, Claude creates and edits files in Word, Excel, PowerPoint and
PDF formats, using four free, open-source programs: WordCraft (Word), GridCraft (Excel), DeckCraft (PowerPoint) and
PdfCraft (PDF). It also gets Hungarian office examples: an offer, a price list, a presentation. Every finished file is
checked mechanically before Claude hands it over.

### What you need

- **Claude Desktop or Claude Code**, with your own Claude account.
- **Node.js 20 or newer.** A free helper program: https://nodejs.org, the “LTS” version (on Windows the `.msi`
  installer, default options).
- **Internet on first use.** The module downloads the four programs itself from their official GitHub pages
  (`github.com/storytold/<program>`), 20–100 MB each, and checks every file against the release's checklist
  (`SHA256SUMS.txt`); a file that differs is not installed. No installer runs, no administrator rights are needed.
- **Claude Code on Windows:** Git for Windows (Claude Code's own requirement). Some of the module's checks use a small
  program called `jq`; when the computer has none, the module downloads it (about 1 MB, checksum checked).

### Installing in Claude Desktop, step by step

Tried on Windows 11, 26 October 2026.

1. **Node.js.** Install the “LTS” version from https://nodejs.org. If Claude Desktop was running, quit it fully (from
   the icon at the right of the taskbar too) and start it again: only then does it see Node.js. `node --version` in a
   command prompt shows whether it is there (v20 or newer is needed).
2. **The marketplace.** In Claude Desktop switch to **Claude** mode (Code mode's Customize page has no “Manage
   marketplaces”), then: **Customize** › **Plugins** › **Add plugin** › **Add marketplace** › **Add from a
   repository**. Type or pick `itlinekft/aiplus-plugins`, then **Sync**. If a notice “Auto-sync requires the Claude
   GitHub App” offers “Grant access”, it is not needed: close it with its X.
3. **The module.** On the **AI+ Iroda** card: **Add** › “This plugin includes local MCP servers” › **Continue**. Claude
   says: “AI+ Iroda is installed and ready to use.”
4. **The four programs** download by themselves in the background the next time Claude starts or a session opens
   (about 10 seconds for us). Claude does not ask. **If the session's “Connectors” panel on the right** shows
   **Reconnect** next to the “Aiplus office …” connections (Claude started before Node.js), click it on all four: by
   itself it would retry only after 15 minutes.
5. **The first question:** “How do I start with the AI+ Iroda module?” (or „Hogyan kezdjem az AI+ Iroda modult?”). It
   checks Node.js and the four programs, says where they came from and what works where. Name the module: a bare “how
   do I start?” may be answered by another plugin.

### Installing in Claude Code

    claude plugin marketplace add itlinekft/aiplus-plugins
    claude plugin install aiplus-office@aiplus-plugins

Claude Code downloads the programs at the first job; asked “how do I start?”, it downloads them ahead if you say yes.

### What works where

| Where you work | Word | PDF | Excel | PowerPoint | Where files go |
|---|---|---|---|---|---|
| Claude Desktop, plain Chat | yes | yes | yes | yes | Documents › „AI+ Iroda” |
| Claude Desktop, Code, a “This computer” session | yes | yes | yes | yes | the folder you opened |
| Claude Code | yes | yes | yes | yes | the folder you opened |
| A session running in the cloud | not measured | not measured | no | no | |

**Plain Chat:** Claude reaches the programs through the module's connections, and these reach only the **„AI+ Iroda”**
folder inside your Documents (created on first use). Put the files Claude should work on there too.

**A folder of your choice:** in Claude Desktop switch to **Code**; under the prompt box: **Environment: This computer**,
**Folder** › **Open folder…**, pick the folder, and answer “Trust this workspace?” with **Trust workspace**.

**Cloud:** a session running in the cloud cannot download the programs (tried in Cowork running in the cloud: no file
was made).

### Ready requests to try

- “Write an offer in Word format for Minta Kft. for three pieces of office furniture, with net prices, 27% VAT and a
  gross total, and save it as a PDF too.”
- “Make a price list spreadsheet with five products: item number, name, net price, 27% VAT as a formula, gross price and
  a total.”
- “Make a four-slide presentation on the quarterly results for Minta Kft., with a PDF next to it.”
- “Merge these two PDFs into one and take out the third page.”
- “Put a password on this PDF.” (It saves a new file; the original stays.)
- “Here is our company's Word template: make an offer from it, keeping the header and the footer.”

If Claude asks back with buttons, answer with a button.

### What to check yourself

- **The totals.** The module checks the formulas and the totals, but look at any number meant for a customer yourself.
- **The letters ő and ű.** GridCraft's own PDF drops these two letters, so the module makes the PDF of such a sheet with
  WordCraft and checks it. If one is still missing, tell Claude.
- **The spelling.** WordCraft does not check Hungarian spelling, so Claude proofreads the text.
- **The formatting.** The programs are early versions: not everything in a Microsoft Office file survives a save.
  Always work on a copy and keep the original.

### Where the programs go

The four programs go into your own user folder: `%LOCALAPPDATA%\aiplus-office` on Windows,
`~/Library/Caches/aiplus-office` on macOS, `~/.cache/aiplus-office` on Linux. **On Windows, Claude Desktop puts them in
its own folder:** `%LOCALAPPDATA%\Packages\Claude_…\LocalCache\Local\aiplus-office`. That is where File Explorer shows
them; ask Claude and it names the folder (`aiplus-office status`, the `desktop cache:` line).

### The programs' windows (optional)

The module needs none of the programs' windows: Claude runs them in the background. To open a finished file in a window
(the price list in GridCraft, say), install the ArtCraft Launcher: `github.com/storytold/craft-launcher/releases/latest`
› **Assets** › `artcraft-launcher-<version>-windows-x64.msi`. Edge may warn that the file is rarely downloaded: on the
downloads page (Ctrl+J) choose **Keep**. The setup: **Next**, **Next**, **Install**, **Finish**; in the Launcher,
the install button on the four programs, and again in the install-folder dialog that opens. The programs register no file types: open a file from the program (File › Open), not
by double-click. In GridCraft type numbers at a normal pace: very fast keys right after a cell's first key can be lost.

### Updating

The module uses the newest release of the four programs by itself. To update the module:

- **Claude Desktop:** remove it and add it again (below): that installs the newest version (tried).
- **Claude Code:**

      claude plugin marketplace update aiplus-plugins
      claude plugin update aiplus-office@aiplus-plugins

### Removing

- **Claude Desktop** (in Claude mode): **Customize** › **Plugins** › **Yours** › “More actions for AI+ Iroda” ›
  **Remove** › **Remove**. The marketplace: **Add plugin** › **Manage marketplaces** › “More actions for aiplus-plugins”
  › **Remove** › **Remove**. Tried on Windows 11.
- **Claude Code:** `claude plugin uninstall aiplus-office@aiplus-plugins`
- To free the space the programs take, quit Claude and delete the `aiplus-office` folder named above.

### What it does not do

- It does not run or save macros (VBA).
- A finished file is not exactly what Microsoft Office would make; less common formatting can be lost on save.
- The four programs are early versions, with a new release almost every day.

If something does not work, see the [troubleshooting guide](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md), or ask Claude: “How do I start with the AI+ Iroda module?”

---

A Word, az Excel és a PowerPoint a Microsoft védjegyei; az ArtCraft programjai nem a Microsoft termékei, és ez a modul
nem kapcsolódik hozzájuk. Word, Excel and PowerPoint are trademarks of Microsoft; the ArtCraft programs are not
Microsoft products, and this module is not affiliated with them.
