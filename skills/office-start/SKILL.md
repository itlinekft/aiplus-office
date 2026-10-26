---
name: office-start
description: First run of the aiplus-office plugin - checks Node.js and the four free ArtCraft office apps (aiplus-office status), says where the apps come from, offers to download them (install --all), says plainly what works where (a plain Chat in Claude Desktop: Word and PDF only; Claude on the user's own computer, Claude Code or a Claude Desktop session on This computer: also Excel and PowerPoint files; a session in the cloud cannot download the apps) and where the desktop window apps are officially downloaded. Use on first use, after installing the plugin, when a command fails because Node.js or an app is missing, or for "how do I start", "what does it need", "setup", "install the apps", "where do the programs come from", "why can't you make the spreadsheet", and Hungarian - első indítás, telepítés, beállítás, hogyan kezdjem, mi kell hozzá, honnan jönnek a programok, miért nem készül el a táblázat vagy a prezentáció.
---

# office-start: first run, what it needs, where it comes from, what works where

Run this the first time the user works with the plugin, when they ask how to start or what it needs, and when an office
command failed because Node.js or an app is missing. It checks the machine, explains the result in plain words, and
asks before downloading anything. Office jobs themselves belong to `office-router`.

**Answer in the user's language.** Every user-facing block below has a Hungarian (**HU**) and an English (**EN**)
wording with the same facts: use the one that matches the user (Hungarian when unsure), in these words or close to them.
No jargon beyond „Chat", „Cowork", „Claude Code" and „This computer" (the environment name Claude Desktop shows for a
session on the user's own computer): do not say MCP, shell, CLI or cache to the user.

## 1. Can you run commands here?

If you have **no tool that runs commands** (a plain Chat in Claude Desktop), skip to **5. What works where** and say:

> **HU:** Itt, a sima Chatben nem tudok programot futtatni a gépeden, ezért a gépet most nem tudom ellenőrizni. Word-,
> Excel-, PowerPoint- és PDF-fájlokkal itt is tudok dolgozni, de csak egy mappában: a Dokumentumok mappán belül az
> „AI+ Iroda” mappában (az első használatkor létrejön). Oda tedd azt is, amin dolgozzak. Ha a saját mappádban
> dolgoznál, nyiss Claude Code-ot, vagy a Claude Desktopban egy „This computer” környezetű munkamenetet, és ott kérdezd
> újra: „hogyan kezdjem?”
>
> **EN:** In a plain Chat I cannot run programs on your computer, so I cannot check it from here. I can work with Word,
> Excel, PowerPoint and PDF files here too, but in one folder only: the „AI+ Iroda” folder in your Documents (created on
> first use). Put there what I should work on. To work in a folder of your choice, open Claude Code, or in Claude
> Desktop a session whose environment is “This computer”, and ask again there: “how do I start?”

## 2. Node.js

```bash
node --version
```

- `v20` or newer: fine; say „a Node.js rendben van” / “Node.js is fine”.
- Command not found, or older than `v20`:

> **HU:** A modulnak kell egy ingyenes segédprogram, a **Node.js** (20-as vagy újabb változat). Töltsd le a hivatalos
> oldalról: https://nodejs.org, az „LTS” jelű változatot. Telepítés után indítsd újra a Claude-ot, és kérdezd újra:
> „hogyan kezdjem?”
>
> **EN:** The module needs a free helper program, **Node.js** (version 20 or newer). Download it from the official site,
> https://nodejs.org, the “LTS” version. After installing it, restart Claude and ask again: “how do I start?”

**Installed, but Claude does not see it.** When `node --version` fails, look at Node.js's usual places first:

```bash
ls "/c/Program Files/nodejs/node.exe" /opt/homebrew/bin/node /usr/local/bin/node 2>/dev/null
```

If one is there, Node.js is installed and Claude started before it, so it still runs with the old settings:

> **HU:** A Node.js már telepítve van, de a Claude még előtte indult, ezért nem látja. Lépj ki teljesen a Claude-ból (a
> tálcán vagy a menüsoron lévő ikonjánál is), indítsd újra, és kérdezd újra: „hogyan kezdjem?”
>
> **EN:** Node.js is installed, but Claude started before it, so it does not see it. Quit Claude fully (also from its
> icon in the tray or the menu bar), start it again and ask again: “how do I start?”

**After the restart the connectors still say „Reconnect”.** Claude remembers a connector that failed for 15 minutes,
even across a restart. Do not wait:

> **HU:** A Claude 15 percig megjegyzi, ha egy kapcsoló nem indult el. Kattints a „Reconnect” gombra mindegyik AI+ Iroda
> kapcsolónál (a munkamenet jobb oldali „Connectors” részében, vagy a Customize alatt), és már mehet is.
>
> **EN:** Claude remembers a connector that failed to start for 15 minutes. Click “Reconnect” on each AI+ Iroda
> connector (in the session's “Connectors” panel on the right, or under Customize), and you can go on.

Stop here until Node.js is there: nothing else of the plugin runs without it.

## 3. What is installed: `status`

Every shell call starts with the command line from `office-router`:

```bash
command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }
aiplus-office status
```

`status` only reads the local folder; it never downloads. Its lines and what to tell the user:

| `status` says | HU | EN |
|---|---|---|
| `node: v… (ok: …)` / `(too old: …)` | a Node.js rendben van / túl régi (2. lépés) | Node.js is fine / too old (step 2) |
| `host: win32/x64` (`darwin/arm64`, `linux/x64`) | Windows / macOS / Linux gép (only if it matters) | Windows / macOS / Linux computer |
| `cache: <folder>` | ide kerülnek a programok (give this exact folder) | the programs are kept here |
| `<app> 0.11.1 (20.0 MB)` | a program már le van töltve, ez a változata | downloaded, this version |
| `<app> not installed · next: download` | még nincs letöltve; első használatkor magától letölti | not downloaded yet; it is fetched on first use |
| `next: <version> (latest-cached)` | legközelebb ezt a változatot használja | this version is used next |
| `override: <path>` / `(pin)` | kézzel beállított program / rögzített változat (leave it alone) | set by hand (leave it alone) |

Name the apps by what they do: WordCraft = Word format (DOCX), GridCraft = Excel format (XLSX), DeckCraft = PowerPoint
format (PPTX), PdfCraft = PDF.

## 4. Where the apps come from, then offer the download (ask first)

If any app is `not installed`, explain where they come from and **ask**; never run `install` without a yes.

> **HU:** **Honnan jönnek a programok?** A négy program (WordCraft, GridCraft, DeckCraft, PdfCraft) ingyenes, nyílt
> forrású. A modul a programok hivatalos GitHub-oldaláról tölti le őket (`github.com/storytold/<program>`,
> „Releases”), és minden letöltött fájlt összevet a kiadás `SHA256SUMS.txt` ellenőrzőlistájával: ha a fájl eltér, nem
> telepíti. A programok a saját felhasználói mappádba kerülnek (Windowson `%LOCALAPPDATA%\aiplus-office`, macOS-en
> `~/Library/Caches/aiplus-office`, Linuxon `~/.cache/aiplus-office`); telepítő nem fut, rendszergazdai jog nem
> kell, és a gép más részéhez nem nyúl. Programonként 20–100 MB; ha új változat jelenik meg, azt is magától tölti le.
>
> Letöltsem most mind a négyet? (Ha nem, az első feladatnál tölti le azt, amelyik kell.)
>
> **EN:** **Where do the programs come from?** The four programs (WordCraft, GridCraft, DeckCraft, PdfCraft) are free
> and open source. The module downloads them from their official GitHub pages (`github.com/storytold/<program>`,
> “Releases”) and checks every downloaded file against the release's `SHA256SUMS.txt` checklist: if a file differs, it
> is not installed. The programs go into your own user folder (`%LOCALAPPDATA%\aiplus-office` on Windows,
> `~/Library/Caches/aiplus-office` on macOS, `~/.cache/aiplus-office` on Linux); no installer runs, no administrator
> rights are needed, and nothing else on the computer is touched. 20–100 MB per program; a newer version is fetched by
> itself when one comes out.
>
> Shall I download all four now? (If not, each one is downloaded at the first job that needs it.)

On a yes:

```bash
command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }
aiplus-office install --all
aiplus-office status
```

`install` prints one JSON line per app (`version`, `cacheHit`); exit `0` = all four are there. Exit `69` = a download
failed: say which program, and the likely cause in plain words: no internet, a firewall or proxy blocking GitHub,
GitHub's download limit for the hour (then try again later), or a session that runs in the cloud, which cannot download
the programs (measured 2026-10-24; then the user opens a session on their own computer). Do not retry more than once
without the user.

**A program already installed on the computer.** If the download does not work but the user has the program's desktop
app installed, the module can use that copy: point `AIPLUS_OFFICE_<APP>_BIN` at the app's background part (its
`<app>-cli` file) in the command, e.g. on Windows
`AIPLUS_OFFICE_GRIDCRAFT_BIN="C:\Program Files\GridCraft\gridcraft-cli.exe" aiplus-office gridcraft …`; `status` then
shows it as `override:`. Ask first, and say it like this:

> **HU:** Ha a letöltés nem megy, de a program ablakos változata már fent van a gépeden, a modul azt is tudja használni.
> A GridCraftnál Windowson ez általában a `C:\Program Files\GridCraft\gridcraft-cli.exe` fájl, a program háttérben futó
> része. Használjam ezt?
>
> **EN:** If the download does not work but the program's window app is already on your computer, the module can use
> that one. For GridCraft on Windows this is usually `C:\Program Files\GridCraft\gridcraft-cli.exe`, the part of the
> program that runs in the background. Shall I use it?

## 5. What works where

Say it plainly, once:

> **HU:** **A sima Chatben is megy mind a négy** (Word, Excel, PowerPoint, PDF): a modul négy beépített kapcsolatot ad a
> Claude-nak, és ezek csak egy mappához férnek hozzá, a Dokumentumok mappán belüli **„AI+ Iroda”** mappához. **A saját
> mappádban** a Claude Code-ban, vagy a Claude Desktopban egy „This computer” környezetű munkamenetben dolgozhatsz: ott
> az a mappa számít, amelyiket kiválasztod. A felhőben futó munkamenet nem tudja letölteni a programokat.
>
> **EN:** **All four work in a plain Chat too** (Word, Excel, PowerPoint, PDF): the module gives Claude four built-in
> connections, and they reach one folder only, the **„AI+ Iroda”** folder in your Documents. **To work in a folder of
> your choice**, use Claude Code, or in Claude Desktop a session whose environment is “This computer”: there the folder
> you pick counts. A session running in the cloud cannot download the programs.

| HU: Ahol dolgozol · EN: Where you work | Word (DOCX) | PDF | Excel (XLSX) | PowerPoint (PPTX) |
|---|---|---|---|---|
| Claude Desktop, Chat (Dokumentumok › „AI+ Iroda”) | igen · yes | igen · yes | igen · yes | igen · yes |
| Claude Desktop, „This computer” munkamenet · session | igen · yes | igen · yes | igen · yes | igen · yes |
| Claude Code | igen · yes | igen · yes | igen · yes | igen · yes |
| Felhőben futó munkamenet · a session in the cloud | nem mértük · not measured | nem mértük · not measured | nem · no | nem · no |

This is what the plugin is built for; what has actually been tried is the next block. Say both.

## 6. Tried so far: the one place to update

<!-- office-start:tested: the ONLY place that says what has been tried. Update this block (both languages) when a
     measurement arrives (details and dates: docs/MEASURED.md of the repository); no other sentence restates it. -->

> **HU: Amit eddig kipróbáltunk (2026. október 26.):**
> - Claude Code, Linux: mind a négy program letöltve; árlista, árajánlat és prezentáció elkészült és ellenőrizve.
> - Claude Desktop, Windows 11, sima Chat: mind a négy kapcsolat elindult; egy árlista Excelben, egy árajánlat Wordben
>   és PDF-ben, és két dia elkészült a Dokumentumok › „AI+ Iroda” mappában.
> - Claude Desktop, Windows 11, „This computer” munkamenet: árlista Excelben, árajánlat a sablonból Wordben, három dia,
>   PDF-ek összefűzése és jelszóval védése elkészült és ellenőrizve; egy-egy lépés fél perc és két és fél perc között.
> - **Cowork a felhőben: nem működik.** A felhőben futó munkamenet nem tudta letölteni a programokat, így fájl sem
>   készült. A saját gépen futó Cowork-ot még nem próbáltuk.
> - macOS (Apple-processzoros Mac mini): mind a négy program letöltve és lefuttatva, az ellenőrzések rendben. A Claude
>   Desktopot macOS-en még nem próbáltuk.
>
> Ha valahol valami nem indul, írd meg nekünk, mit látsz.
>
> **EN: What we have tried so far (26 October 2026):**
> - Claude Code, Linux: all four programs downloaded; a price list, an offer and a presentation made and checked.
> - Claude Desktop, Windows 11, a plain Chat: all four connections started; a price list in Excel, an offer in Word and
>   PDF, and two slides made in Documents › „AI+ Iroda”.
> - Claude Desktop, Windows 11, a “This computer” session: a price list in Excel, an offer from the template in Word,
>   three slides, PDFs merged and password-protected, made and checked; each step took half a minute to two and a half
>   minutes.
> - **Cowork in the cloud: does not work.** The session running in the cloud could not download the programs, so no
>   file was made. Cowork running on your own computer has not been tried yet.
> - macOS (a Mac mini with an Apple processor): all four programs downloaded and run, the checks pass. Claude Desktop on
>   macOS has not been tried yet.
>
> If something does not start somewhere, tell us what you see.

## 7. Good to know: three Hungarian limits

Say this once, after the two blocks above (measured 2026-10-24; the skills route around each one and check it):

> **HU:** **Jó tudni:**
> - A GridCraft saját PDF-je és nyomtatása elhagyja az ő és ű betűt, ezért az ilyen táblázat PDF-jét a modul a
>   WordCraft-tal készíti, és ellenőrzi.
> - A szövegként beírt magyar számot („1 330,50”) a GridCraft nem adja össze, ezért a modul valódi számot ír be, és
>   ellenőrzi az összegeket.
> - A WordCraft nem ellenőrzi a magyar helyesírást: a szöveget a Claude nézi át, és ezt meg is mondja.
>
> **EN:** **Good to know:**
> - GridCraft's own PDF and printout drop the letters ő and ű, so the module makes the PDF of such a sheet with
>   WordCraft, and checks it.
> - GridCraft does not add up a Hungarian number typed as text („1 330,50”), so the module writes real numbers and
>   checks the totals.
> - WordCraft does not check Hungarian spelling: Claude proofreads the text itself and says so.

## 8. The desktop (window) apps (optional)

The plugin installs **only the command-line tools** of the four apps; it does not install their desktop (window) apps.
If the user wants to open a made file in a window, or asks for the GridCraft program itself, point to the official
download page (checked 2026-10-24, see the repository's `docs/MEASURED.md`):

| Program | Official download / Hivatalos letöltés |
|---|---|
| WordCraft | https://github.com/storytold/wordcraft/releases/latest |
| GridCraft | https://github.com/storytold/gridcraft/releases/latest |
| DeckCraft | https://github.com/storytold/deckcraft/releases/latest |
| PdfCraft | https://github.com/storytold/pdfcraft/releases/latest |

> **HU:** A modul a programoknak csak a háttérben futó részét tölti le, az ablakos programot nem. Ha a kész fájlt
> ablakban is meg akarod nyitni vagy kézzel szerkesztenéd, az ablakos programot a fenti hivatalos GitHub-oldalról
> töltheted le. Melyik fájlt válaszd (a `<verzió>` helyén a szám áll):
> - **Windows:** `<program>-<verzió>-windows-x64.msi` (telepítő), vagy `<program>-<verzió>-windows-x64-portable.zip`
>   (telepítés nélkül: kicsomagolod, és a mappában elindítod a `<program>.exe`-t). ARM-os géphez (pl. Snapdragon) az
>   `arm64` jelűt. A PdfCraft telepítője minden felhasználónak telepít, és rendszergazdai jogot kér; ha ez nincs, a
>   portable zip-et válaszd.
> - **macOS:** `<program>-<verzió>-macos-universal.dmg`.
>
> A programok weboldala `https://getartcraft.com/apps/<program>`; a legújabb változat a GitHub-oldalon van. Ezek is
> korai változatok: a fontos fájlról mindig legyen másolatod.
>
> **EN:** The module downloads only the part of the programs that runs in the background, not the window app. To open a
> finished file in a window or edit it by hand, download the window app from the official GitHub page above. Which file
> to pick (`<version>` is the number):
> - **Windows:** `<program>-<version>-windows-x64.msi` (installer), or `<program>-<version>-windows-x64-portable.zip`
>   (no installation: unzip it and start `<program>.exe` in the folder). For an ARM computer (e.g. Snapdragon) the
>   `arm64` one. The PdfCraft installer installs for all users and asks for administrator rights; without them, pick
>   the portable zip.
> - **macOS:** `<program>-<version>-macos-universal.dmg`.
>
> The programs' web page is `https://getartcraft.com/apps/<program>`; the newest version is on the GitHub page. These are
> early versions too: always keep a copy of an important file.

## 8a. Guide and troubleshooting

When the user asks for a guide or something fails that this skill does not cover, point to the two pages:

> **HU:** Részletes leírás: [felhasználói útmutató](https://github.com/itlinekft/aiplus-office/blob/main/docs/user-guide.md) és [hibaelhárítás](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md).
>
> **EN:** More detail: the [user guide](https://github.com/itlinekft/aiplus-office/blob/main/docs/user-guide.md) and the [troubleshooting guide](https://github.com/itlinekft/aiplus-office/blob/main/TROUBLESHOOTING.md).

## 9. Close

End with one concrete next step in the user's language, e.g. HU „Próbáld ki: »Készíts árlistát táblázatban három
termékkel, 27% ÁFÁ-val«” (Claude Code vagy „This computer” munkamenet) or „»Írj árajánlatot Word-formátumban a Minta Kft. részére«” (Chat is
enough); EN “Try: »Make a price list spreadsheet with three products and 27% VAT«” or “»Write an offer in Word format
for Minta Kft.«”. From here on the job belongs to `office-router` and its skills.
