# aiplus-office: hibaelhárítás · troubleshooting

Egy bejegyzés egy hiba. A **Tünet** pontosan az, amit látsz: a program kiírását szó szerint idézzük, angolul, mert a
program így írja ki. Az **Ellenőrzés** csak olvas, semmit nem változtat. A **Javítás** a legkisebb lépéssel kezdődik.
A parancsokat a Claude futtatja helyetted a Claude Code-ban vagy egy „This computer” munkamenetben; elég, ha megkéred.

One entry per fault. The **Symptom** is exactly what you see, the program's output quoted verbatim. The **Check** only
reads and changes nothing. The **Fix** starts with the smallest step. Claude runs the commands for you in Claude Code
or a “This computer” session; just ask it.

## Magyarul

### Kilépési kódok

| Kód | Jelentés |
|---|---|
| 0 | rendben |
| 1 | hibás használat, vagy a feladat nem sikerült (az `verify`-nál: egy ellenőrzés elbukott, vagy nincs meg a fájl) |
| 2 | `verify` és `doc prepare`: hibás használat |
| 3 | `verify`: hiányzik a vizsgálóprogram (`MISSING tool: …`) |
| 69 | egy program letöltése vagy telepítése nem sikerült |
| 130, 143 | a futást megszakították (Ctrl+C, leállítás) |

### Nincs Node.js, vagy túl régi

- **Tünet:** `node: command not found`, vagy a `status` első sora: `node: v18.19.0 (too old: needs 20 or newer)`.
- **Hol:** Claude Code, „This computer” munkamenet.
- **Ok:** a modul a Node.js-re épül; a 20-asnál régebbi változattal nem indul.
- **Ellenőrzés:** `node --version` (v20 vagy újabb kell).
- **Javítás:** töltsd le a https://nodejs.org oldalról az „LTS” változatot, telepítsd, és indítsd újra a Claude-ot.
- **Ki:** a gép előtt ülő ember.

### Excel- vagy PowerPoint-fájlt kérsz a sima Chatben

- **Tünet:** a Claude azt mondja, hogy itt, a sima Chatben nem tud programot futtatni, és Excel- és PowerPoint-fájlhoz
  olyan munkamenet kell, amelyben a saját gépeden fut.
- **Hol:** Claude Desktop, sima Chat.
- **Ok:** a GridCraft és a DeckCraft nem korlátozható a munkamappára, ezért nem kötöttük be őket kapcsolatként; a Claude
  csak programként tudja futtatni őket, a sima Chat pedig erre nem képes.
- **Ellenőrzés:** nincs mit futtatni; a Chatben nincs parancsfuttatás.
- **Javítás:** nyiss Claude Code-ot, vagy a Claude Desktopban egy „This computer” környezetű munkamenetet, és ott kérd
  újra.
- **Ki:** a gép előtt ülő ember.

### Felhőben futó munkamenetben nem töltődnek le a programok

- **Tünet:** a Claude jelzi, hogy a program letöltése a GitHubról nem sikerült, és nem készül fájl (kipróbálva:
  felhőben futó Cowork, Windows 11, 2026. október 24.).
- **Hol:** felhőben futó munkamenet (Cowork a felhőben).
- **Ok:** a felhőben futó munkamenet nem a te gépeden fut, és onnan a programokat nem tudja letölteni.
- **Ellenőrzés:** `aiplus-office status` ugyanabban a munkamenetben: a programok sora `not installed`.
- **Javítás:** nyiss egy munkamenetet a saját gépeden (Claude Code, vagy „This computer” környezet), és ott kérd újra.
- **Ki:** a gép előtt ülő ember.
- **Mióta:** 0.1.0; a 0.1.3 óta a leírás is ezt mondja.

### A letöltés nem éri el a GitHubot

- **Tünet:** `GitHub API request failed: …`, majd `No WordCraft version is installed; set GITHUB_TOKEN (rate limit),
  AIPLUS_OFFICE_WORDCRAFT_VERSION to pin a release, or AIPLUS_OFFICE_WORDCRAFT_BIN to an existing wordcraft-cli`,
  kilépési kód 69 (a program neve a kért program).
- **Hol:** Claude Code, „This computer” munkamenet.
- **Ok:** nincs internet, vagy tűzfal, proxy tiltja a `github.com` és az `api.github.com` címet.
- **Ellenőrzés:** `aiplus-office status` (a program `not installed`), és nyisd meg böngészőben:
  https://github.com/storytold/wordcraft/releases/latest
- **Javítás:** ha a böngésző sem éri el, a hálózatot kell rendbe tenni (rendszergazda). Ha a program ablakos változata
  már fent van a gépen, a modul azt is tudja használni (lásd „A gépen lévő programot használná”).
- **Ki:** a gép előtt ülő ember; tűzfalnál a rendszergazda.

### A GitHub óránkénti kerete betelt

- **Tünet:** `GitHub API returned HTTP 403 for https://api.github.com/repos/storytold/…` (vagy `HTTP 429`), kilépési
  kód 69.
- **Hol:** Claude Code, „This computer” munkamenet.
- **Ok:** a GitHub óránként korlátozza a bejelentkezés nélküli lekérdezéseket egy címről, például egy közös irodai
  internetkapcsolatról.
- **Ellenőrzés:** `aiplus-office status`.
- **Javítás:** várj egy órát, és próbáld újra. Ha már van letöltött változat, a modul azt használja tovább, és csak
  figyelmeztet (`latest-release lookup failed … using installed …`).
- **Ki:** a gép előtt ülő ember.

### Az ellenőrzőösszeg nem egyezik

- **Tünet:** `checksum mismatch for <fájl>: expected …, got …`, kilépési kód 69.
- **Hol:** Claude Code, „This computer” munkamenet.
- **Ok:** a letöltött fájl nem az, amit a kiadás ellenőrzőlistája (`SHA256SUMS.txt`) leír: megszakadt a letöltés, vagy
  valami a hálózaton megváltoztatta.
- **Ellenőrzés:** `aiplus-office status` (a program nincs telepítve; a modul a hibás fájlt nem teszi fel).
- **Javítás:** próbáld újra egyszer. Ha másodszor is ezt írja, ne kerüld meg: írd meg nekünk a teljes sort.
- **Ki:** a gép előtt ülő ember, utána az ITLine.

### A kiadásnak nincs ellenőrzőlistája

- **Tünet:** `release <változat> has no SHA256SUMS.txt; refusing to install an unverified binary`, kilépési kód 69.
- **Hol:** Claude Code, „This computer” munkamenet.
- **Ok:** a program legújabb kiadásához még nem tették fel az ellenőrzőlistát; ellenőrizetlen programot a modul nem
  telepít.
- **Ellenőrzés:** a kiadás oldala a GitHubon (`github.com/storytold/<program>/releases`).
- **Javítás:** várj, amíg a lista felkerül, vagy rögzítsd az előző változatot: `AIPLUS_OFFICE_<PROGRAM>_VERSION=<változat>`.
- **Ki:** a gép előtt ülő ember.

### A csomag gyanús, a modul nem bontja ki

- **Tünet:** egy ilyen sor: `archive entry "…" escapes the install directory; refusing to extract`, vagy
  `… is not a regular file or directory …; refusing to extract`, vagy `archive listing mismatch …; refusing to extract`.
- **Hol:** Claude Code, „This computer” munkamenet.
- **Ok:** a letöltött csomagban olyan bejegyzés van, amely a programok mappáján kívülre írna, vagy nem közönséges fájl.
- **Ellenőrzés:** `aiplus-office status`.
- **Javítás:** ne kerüld meg. Írd meg nekünk a teljes sort és a program nevét.
- **Ki:** az ITLine.

### Windows, Git Bash: az első letöltés elakad

- **Tünet:** Windowson, a Git Bashből indított első letöltés nem fejeződik be (kipróbálva 2026. október 24-én).
- **Hol:** Claude Code Windowson.
- **Ok:** a Git for Windows saját `tar` programja rosszul kezeli a `C:` kezdetű útvonalat.
- **Ellenőrzés:** `aiplus-office --version` (0.1.3 vagy újabb kell).
- **Javítás:** frissítsd a modult. A 0.1.3 óta a modul mindig a Windows saját `tar.exe` programját használja
  (`%SystemRoot%\System32\tar.exe`).
- **Ki:** a gép előtt ülő ember.
- **Javítva:** 0.1.3.

### A gépen lévő programot használná, de nem találja

- **Tünet:** `AIPLUS_OFFICE_GRIDCRAFT_BIN=<útvonal>: not found` (vagy `not a file`, `not executable`).
- **Hol:** Claude Code, „This computer” munkamenet.
- **Ok:** a megadott útvonalon nincs ott a program háttérben futó része (`<program>-cli`).
- **Ellenőrzés:** nézd meg, létezik-e a fájl; Windowson a GridCraftnál általában `C:\Program Files\GridCraft\gridcraft-cli.exe`.
- **Javítás:** add meg a helyes útvonalat, vagy hagyd el a beállítást, és a modul maga tölti le a programot.
- **Ki:** a gép előtt ülő ember.

### A gép nem támogatott

- **Tünet:** `unsupported platform: <rendszer>/<processzor> has no <program> CLI release asset; …`, vagy Linuxon
  `unsupported C library: glibc 2.31; the <program> CLI needs glibc ≥ 2.35. …`.
- **Hol:** Claude Code.
- **Ok:** a programnak nincs kiadása erre a gépre, vagy a Linux túl régi (glibc 2.35 kell).
- **Ellenőrzés:** `aiplus-office status` (a `host:` sor), Linuxon `ldd --version`.
- **Javítás:** újabb rendszer, vagy egy saját fordítású program megadása (`AIPLUS_OFFICE_<PROGRAM>_BIN`).
- **Ki:** a rendszergazda.

### A Windows vagy a macOS nem engedi elindítani a programot

- **Tünet:** a Windows SmartScreen vagy a macOS figyelmeztet, hogy a programot nem lehet ellenőrizni, és nem indítja el.
- **Hol:** Windows, macOS.
- **Ok:** a programok nem aláírtak, vagy a rendszer biztonsági beállítása szigorú.
- **Ellenőrzés:** `aiplus-office status` (a program fent van), majd egy próbafeladat.
- **Javítás:** írd meg nekünk, pontosan mit ír ki a rendszer. A tiltást ne kapcsold ki a gépen.
- **Ki:** a gép előtt ülő ember, utána a rendszergazda.
- **Mióta:** eddig nem jelent meg: macOS 26.4-en nem volt tiltás, és Windows 11-en a „This computer” munkamenetben a
  GridCraft elindult (2026. október 24–25.).

### A Word- vagy a PDF-kapcsolat nem indul el a Chatben

- **Tünet:** a kapcsolat naplójában: `--root holds an unexpanded variable (${CLAUDE_PROJECT_DIR}): the client did not
  substitute it; refusing to start`.
- **Hol:** Claude Desktop, sima Chat.
- **Ok:** a munkamappa helye nem került be a kapcsolat beállításába; munkamappa nélkül a modul biztonsági okból nem indítja el a
  kapcsolatot.
- **Ellenőrzés:** a Claude Desktop beállításaiban a kapcsolatok listája (`aiplus-office-wordcraft`,
  `aiplus-office-pdfcraft`).
- **Javítás:** addig dolgozz Claude Code-ban vagy „This computer” munkamenetben, és írd meg nekünk a Claude Desktop
  változatát.
- **Ki:** a gép előtt ülő ember, utána az ITLine.

### A táblázat vagy a prezentáció kapcsolatként nem indul

- **Tünet:** `aiplus-office: GridCraft's MCP server has no path confinement and can read and write any path the user
  can; refusing to start. Pass --allow-unconfined to accept that, or use the bash route (aiplus-office gridcraft exec …).`
- **Hol:** ha valaki kézzel kötötte be a GridCraftot vagy a DeckCraftot kapcsolatként.
- **Ok:** ez a két program nem korlátozható a munkamappára; kapcsolatként a gép bármely fájlját olvashatná és írhatná.
- **Ellenőrzés:** a projekt `.mcp.json` fájlja.
- **Javítás:** vedd ki a kézzel felvett bejegyzést; a Claude ezeket programként futtatja a Claude Code-ban vagy egy
  „This computer” munkamenetben.
- **Ki:** a gép előtt ülő ember.

### A táblázat PDF-jéből hiányzik az ő és az ű

- **Tünet:** a PDF-ben az ő és az ű helyén üres hely van, az ellenőrzés pedig ezt írja: `FAIL --hu-glyphs … actual
  missing 2: Gyűrűs, Hőpapír (the letters were lost in the PDF; GridCraft's export does this)`.
- **Hol:** a GridCraft saját PDF-je és nyomtatása.
- **Ok:** a GridCraft ezt a két betűt be nem ágyazott betűtípussal írja (kipróbálva Linuxon és macOS-en, GridCraft 0.11.1).
- **Ellenőrzés:** `aiplus-office verify <fájl>.pdf --hu-glyphs <fájl>.xlsx`.
- **Javítás:** a modul az ilyen táblázat PDF-jét a WordCraft-tal készíti, és ellenőrzi. Ha kézzel kértél GridCraft-PDF-et,
  kérd a Claude-tól: „készítsd el a PDF-et a WordCraft-tal”.
- **Ki:** a Claude, a te kérésedre.
- **Mióta:** GridCraft 0.11.1; a modul 0.1.2 óta kerüli ki és ellenőrzi.

### A szövegként beírt szám kimarad az összegből

- **Tünet:** az összesen kisebb a vártnál, az ellenőrzés pedig ezt írja: `FAIL --hu-numbers  expected numbers and dates
  stored as numbers  actual 2 text cell(s) that look like Hungarian numbers/dates: Sheet1!B2 "1 330,50" (formula range)`.
- **Hol:** GridCraft.
- **Ok:** a magyar formában beírt szám („1 330,50”) a táblázatban szöveg lesz, és a SUM figyelmeztetés nélkül kihagyja.
- **Ellenőrzés:** `aiplus-office verify <fájl>.xlsx --hu-numbers`.
- **Javítás:** a modul valódi számot ír be, és számformátumot ad neki. Régi táblázatnál kérd a Claude-tól, hogy írja át
  számmá a megnevezett cellákat.
- **Ki:** a Claude, a te kérésedre.
- **Mióta:** GridCraft 0.11.1; a modul 0.1.2 óta ellenőrzi.

### A táblázat PDF-jében levágott név vagy `#####`

- **Tünet:** a PDF-ben egy hosszú név le van vágva, egy dátum helyén `#####` áll.
- **Hol:** a GridCraft PDF-je.
- **Ok:** az oszlopok az alapszélességen maradtak.
- **Ellenőrzés:** nézd meg a PDF első oldalát.
- **Javítás:** kérd a Claude-tól, hogy állítsa be az oszlopszélességet a tartalomhoz (`home.autofitColumnWidth`), és
  készítse el újra a PDF-et.
- **Ki:** a Claude, a te kérésedre.

### A felsorolásnak nincs pöttye a Word-PDF-ben

- **Tünet:** a PDF-ben a felsorolás sorai behúzva vannak, de pötty nincs előttük.
- **Hol:** a WordCraft PDF-je (WordCraft 0.10.0).
- **Ok:** a WordCraft 0.10.0 PDF-exportja nem rajzolja ki a felsorolásjelet.
- **Ellenőrzés:** nézd meg a PDF oldalát képként.
- **Javítás:** küldés előtt nézd át a felsorolásos oldalt; ha fontos, kérd számozott listával.
- **Ki:** a gép előtt ülő ember.
- **Mióta:** WordCraft 0.10.0.

### Az ellenőrzés nem találja a szöveget, pedig ott van

- **Tünet:** `FAIL --text-contains …`, de a PDF-ben látod a szöveget.
- **Hol:** `aiplus-office verify`.
- **Ok:** a keresés egy soron belül néz; ha az érték a sor végén megtörik („730 885” / „Ft”), nem találja meg.
- **Ellenőrzés:** nézd meg az oldalt képként.
- **Javítás:** a Claude rövidebb szövegre ellenőriz, és ránéz a kirajzolt oldalra.
- **Ki:** a Claude.

### Az ellenőrzés vizsgálóprogramot hiányol

- **Tünet:** `MISSING tool: ffprobe` (vagy `ffmpeg`, `pdfcraft`), kilépési kód 3.
- **Hol:** `aiplus-office verify`.
- **Ok:** a kért ellenőrzéshez (például videó méretéhez) kell az `ffprobe`, vagy a PdfCraft nem töltődött le.
- **Ellenőrzés:** `aiplus-office status`; videóellenőrzésnél `ffprobe -version`.
- **Javítás:** a dokumentumellenőrzéshez csak a PdfCraft kell; töltsd le (`aiplus-office install pdfcraft`). Az
  `ffprobe` az ffmpeg része, csak videóhoz és hanghoz kell.
- **Ki:** a gép előtt ülő ember.

Ha a hibád nincs itt, kérdezd meg a Claude-tól: „hogyan kezdjem?”, és írd meg nekünk, mit látsz.

## English

### Exit codes

| Code | Meaning |
|---|---|
| 0 | ok |
| 1 | wrong usage, or the job failed (for `verify`: a check failed, or the file is missing) |
| 2 | `verify` and `doc prepare`: wrong usage |
| 3 | `verify`: the probe program is missing (`MISSING tool: …`) |
| 69 | downloading or installing a program failed |
| 130, 143 | the run was interrupted (Ctrl+C, stopped) |

### Node.js is missing or too old

- **Symptom:** `node: command not found`, or the first line of `status`: `node: v18.19.0 (too old: needs 20 or newer)`.
- **Where:** Claude Code, a “This computer” session.
- **Cause:** the module runs on Node.js; it does not start with a version older than 20.
- **Check:** `node --version` (v20 or newer is needed).
- **Fix:** download the “LTS” version from https://nodejs.org and install it. Then restart Claude.
- **Who:** the person at the computer.

### Excel or PowerPoint asked for in a plain Chat

- **Symptom:** Claude says that in a plain Chat it cannot run programs, and Excel and PowerPoint files need a session
  where it runs on your own computer.
- **Where:** Claude Desktop, plain Chat.
- **Cause:** GridCraft and DeckCraft cannot be limited to the working folder, so they are not connected that way;
  Claude can only run them as programs, which a plain Chat cannot do.
- **Check:** nothing to run; a Chat runs no commands.
- **Fix:** open Claude Code, or in Claude Desktop a session whose environment is “This computer”, and ask again there.
- **Who:** the person at the computer.

### The programs do not download in a session running in the cloud

- **Symptom:** Claude reports that downloading the program from GitHub failed, and no file is made (tried: Cowork
  running in the cloud, Windows 11, 24 October 2026).
- **Where:** a session running in the cloud (Cowork in the cloud).
- **Cause:** a session running in the cloud does not run on your computer, and from there it cannot download the
  programs.
- **Check:** `aiplus-office status` in the same session: the programs show `not installed`.
- **Fix:** open a session on your own computer (Claude Code, or the “This computer” environment) and ask again there.
- **Who:** the person at the computer.
- **Since:** 0.1.0; since 0.1.3 the copy says so too.

### The download cannot reach GitHub

- **Symptom:** `GitHub API request failed: …`, then `No WordCraft version is installed; set GITHUB_TOKEN (rate limit),
  AIPLUS_OFFICE_WORDCRAFT_VERSION to pin a release, or AIPLUS_OFFICE_WORDCRAFT_BIN to an existing wordcraft-cli`, exit
  code 69 (the program named is the one asked for).
- **Where:** Claude Code, a “This computer” session.
- **Cause:** no internet, or a firewall or proxy blocks `github.com` and `api.github.com`.
- **Check:** `aiplus-office status` (the program is `not installed`), and open
  https://github.com/storytold/wordcraft/releases/latest in a browser.
- **Fix:** if the browser cannot reach it either, the network needs fixing (an administrator). If the program's window
  app is already on the computer, the module can use it (see “It should use the program on the computer”).
- **Who:** the person at the computer; for a firewall, the administrator.

### GitHub's hourly limit is used up

- **Symptom:** `GitHub API returned HTTP 403 for https://api.github.com/repos/storytold/…` (or `HTTP 429`), exit code 69.
- **Where:** Claude Code, a “This computer” session.
- **Cause:** GitHub limits unauthenticated requests per hour from one address, for example a shared office connection.
- **Check:** `aiplus-office status`.
- **Fix:** wait an hour and try again. If a version is already downloaded, the module keeps using it and only warns
  (`latest-release lookup failed … using installed …`).
- **Who:** the person at the computer.

### The checksum does not match

- **Symptom:** `checksum mismatch for <file>: expected …, got …`, exit code 69.
- **Where:** Claude Code, a “This computer” session.
- **Cause:** the downloaded file is not the one the release's checklist (`SHA256SUMS.txt`) describes: the download
  broke off, or something on the network changed it.
- **Check:** `aiplus-office status` (the program is not installed; the module does not install the bad file).
- **Fix:** try once more. If it says this a second time, do not work around it: send us the whole line.
- **Who:** the person at the computer, then ITLine.

### The release has no checklist

- **Symptom:** `release <version> has no SHA256SUMS.txt; refusing to install an unverified binary`, exit code 69.
- **Where:** Claude Code, a “This computer” session.
- **Cause:** the program's newest release does not have its checklist yet; the module does not install an unverified
  program.
- **Check:** the release page on GitHub (`github.com/storytold/<program>/releases`).
- **Fix:** wait until the list is up, or pin the previous version: `AIPLUS_OFFICE_<PROGRAM>_VERSION=<version>`.
- **Who:** the person at the computer.

### The archive looks unsafe and is not unpacked

- **Symptom:** a line like `archive entry "…" escapes the install directory; refusing to extract`, or
  `… is not a regular file or directory …; refusing to extract`, or `archive listing mismatch …; refusing to extract`.
- **Where:** Claude Code, a “This computer” session.
- **Cause:** the downloaded archive has an entry that would write outside the programs' folder, or is not an ordinary
  file.
- **Check:** `aiplus-office status`.
- **Fix:** do not work around it. Send us the whole line and the program's name.
- **Who:** ITLine.

### Windows, Git Bash: the first download hangs

- **Symptom:** on Windows, the first download started from Git Bash does not finish (tried on 24 October 2026).
- **Where:** Claude Code on Windows.
- **Cause:** Git for Windows' own `tar` program mishandles paths that start with `C:`.
- **Check:** `aiplus-office --version` (0.1.3 or newer is needed).
- **Fix:** update the module. Since 0.1.3 it always uses Windows' own `tar.exe` (`%SystemRoot%\System32\tar.exe`).
- **Who:** the person at the computer.
- **Fixed in:** 0.1.3.

### It should use the program on the computer, but cannot find it

- **Symptom:** `AIPLUS_OFFICE_GRIDCRAFT_BIN=<path>: not found` (or `not a file`, `not executable`).
- **Where:** Claude Code, a “This computer” session.
- **Cause:** the background part of the program (`<program>-cli`) is not at the path given.
- **Check:** see whether the file exists; for GridCraft on Windows it is usually
  `C:\Program Files\GridCraft\gridcraft-cli.exe`.
- **Fix:** give the right path, or leave the setting out and the module downloads the program itself.
- **Who:** the person at the computer.

### The computer is not supported

- **Symptom:** `unsupported platform: <system>/<processor> has no <program> CLI release asset; …`, or on Linux
  `unsupported C library: glibc 2.31; the <program> CLI needs glibc ≥ 2.35. …`.
- **Where:** Claude Code.
- **Cause:** the program has no release for this computer, or the Linux is too old (glibc 2.35 is needed).
- **Check:** `aiplus-office status` (the `host:` line); on Linux `ldd --version`.
- **Fix:** a newer system, or a self-built program set with `AIPLUS_OFFICE_<PROGRAM>_BIN`.
- **Who:** the administrator.

### Windows or macOS does not let the program start

- **Symptom:** Windows SmartScreen or macOS warns that the program cannot be verified, and does not start it.
- **Where:** Windows, macOS.
- **Cause:** the programs are not signed, or the system's security setting is strict.
- **Check:** `aiplus-office status` (the program is there), then a test job.
- **Fix:** tell us exactly what the system shows. Do not switch the protection off on the computer.
- **Who:** the person at the computer, then the administrator.
- **Since:** not seen so far: no block on macOS 26.4, and on Windows 11 GridCraft started in a “This computer” session
  (24–25 October 2026).

### The Word or PDF connection does not start in Chat

- **Symptom:** in the connection's log: `--root holds an unexpanded variable (${CLAUDE_PROJECT_DIR}): the client did not
  substitute it; refusing to start`.
- **Where:** Claude Desktop, plain Chat.
- **Cause:** Claude Desktop did not fill in the working folder; without one the module does not start the connection,
  for safety.
- **Check:** the connections list in Claude Desktop's settings (`aiplus-office-wordcraft`, `aiplus-office-pdfcraft`).
- **Fix:** work in Claude Code or a “This computer” session meanwhile, and tell us your Claude Desktop version.
- **Who:** the person at the computer, then ITLine.

### The spreadsheet or presentation program does not start as a connection

- **Symptom:** `aiplus-office: GridCraft's MCP server has no path confinement and can read and write any path the user
  can; refusing to start. Pass --allow-unconfined to accept that, or use the bash route (aiplus-office gridcraft exec …).`
- **Where:** when someone connected GridCraft or DeckCraft by hand.
- **Cause:** these two programs cannot be limited to the working folder; as a connection they could read and write any
  file on the computer.
- **Check:** the project's `.mcp.json` file.
- **Fix:** remove the entry added by hand; Claude runs these as programs in Claude Code or a “This computer” session.
- **Who:** the person at the computer.

### ő and ű are missing from the spreadsheet's PDF

- **Symptom:** the PDF has a gap where ő and ű should be, and the check says: `FAIL --hu-glyphs … actual missing 2:
  Gyűrűs, Hőpapír (the letters were lost in the PDF; GridCraft's export does this)`.
- **Where:** GridCraft's own PDF and printout.
- **Cause:** GridCraft writes these two letters with a font it does not embed (tried on Linux and macOS, GridCraft
  0.11.1).
- **Check:** `aiplus-office verify <file>.pdf --hu-glyphs <file>.xlsx`.
- **Fix:** the module makes the PDF of such a sheet with WordCraft and checks it. If you asked for a GridCraft PDF by
  hand, ask Claude: “make the PDF with WordCraft”.
- **Who:** Claude, when you ask.
- **Since:** GridCraft 0.11.1; the module routes around it and checks it since 0.1.2.

### A number typed as text is left out of the total

- **Symptom:** the total is lower than expected, and the check says: `FAIL --hu-numbers  expected numbers and dates
  stored as numbers  actual 2 text cell(s) that look like Hungarian numbers/dates: Sheet1!B2 "1 330,50" (formula range)`.
- **Where:** GridCraft.
- **Cause:** a number typed in Hungarian form („1 330,50”) becomes text in the sheet, and SUM skips it without a warning.
- **Check:** `aiplus-office verify <file>.xlsx --hu-numbers`.
- **Fix:** the module writes real numbers and gives them a number format. For an older sheet, ask Claude to turn the
  named cells into numbers.
- **Who:** Claude, when you ask.
- **Since:** GridCraft 0.11.1; the module checks it since 0.1.2.

### A name cut off, or `#####`, in the spreadsheet's PDF

- **Symptom:** in the PDF a long name is cut off, and a date shows as `#####`.
- **Where:** GridCraft's PDF.
- **Cause:** the columns kept their default width.
- **Check:** look at the PDF's first page.
- **Fix:** ask Claude to fit the column widths to the content (`home.autofitColumnWidth`) and make the PDF again.
- **Who:** Claude, when you ask.

### The bullet list has no bullets in the Word PDF

- **Symptom:** in the PDF the list lines are indented, but there is no bullet in front of them.
- **Where:** WordCraft's PDF (WordCraft 0.10.0).
- **Cause:** WordCraft 0.10.0's PDF export does not draw the bullet glyph.
- **Check:** look at the PDF page as an image.
- **Fix:** look at a page with a list before sending it; if it matters, ask for a numbered list.
- **Who:** the person at the computer.
- **Since:** WordCraft 0.10.0.

### The check does not find text that is there

- **Symptom:** `FAIL --text-contains …`, but you can see the text in the PDF.
- **Where:** `aiplus-office verify`.
- **Cause:** the search looks within one line; a value that wraps at the line end („730 885” / „Ft”) is not found.
- **Check:** look at the page as an image.
- **Fix:** Claude checks a shorter string and looks at the rendered page.
- **Who:** Claude.

### The check says a probe program is missing

- **Symptom:** `MISSING tool: ffprobe` (or `ffmpeg`, `pdfcraft`), exit code 3.
- **Where:** `aiplus-office verify`.
- **Cause:** the check asked for (for example a video's size) needs `ffprobe`, or PdfCraft was not downloaded.
- **Check:** `aiplus-office status`; for a video check `ffprobe -version`.
- **Fix:** document checks need only PdfCraft; download it (`aiplus-office install pdfcraft`). `ffprobe` is part of
  ffmpeg and is needed only for video and audio.
- **Who:** the person at the computer.

If your fault is not here, ask Claude “how do I start?”, and tell us what you see.
