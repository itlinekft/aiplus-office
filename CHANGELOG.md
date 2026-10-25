# Changelog

## 0.1.10 — 2026-10-25

- The plugin homepage is the AI+ Iroda page on itline.hu (https://www.itline.hu/ai-plus/iroda/), now live; the
  repository link stays on GitHub. Both READMEs link the page.

## 0.1.9 — 2026-10-25

- English name „AI+ Office” (Hungarian stays „AI+ Iroda”): the English half of the description, both READMEs, the
  user guide and the troubleshooting guide, and the marketplace row. The public-copy lint now allows the name and bans
  „Microsoft Office” in shipped files; the trademark footer is unchanged.

## 0.1.8 — 2026-10-25

- Shown name „AI+ Iroda” (ITLine's naming rule: every AI+ modul is „AI+ <name>” with an `aiplus-` id, free or
  licensed; the id stays `aiplus-office`). The description, both READMEs (with the module mark), the user guide and the
  troubleshooting guide say so.

## 0.1.7 — 2026-10-25

- A user guide (`docs/user-guide.md`, shipped as `USER-GUIDE.md`) from install to the first Hungarian office job, and a
  troubleshooting guide (`TROUBLESHOOTING.md`, shipped) with one entry per user-visible refusal and per measured
  fault, both Hungarian first, then English (C19 rules R7 and R9; C16 entry shape).
- Both READMEs and `office-start` link the two pages; the repository README no longer calls the repository private.

## 0.1.6 — 2026-10-25

- The source is public: `homepage` and `repository` point to `itlinekft/aiplus-office`.

## 0.1.5 — 2026-10-25

- No em dash left in the shipped skill texts and the README (C19 rule R11; 0.1.3 had cleaned only the skill
  descriptions). Headings now read „Step N: …”; the skill test accepts both forms.

## 0.1.4 — 2026-10-25

- `plugin.json` carries `homepage` (this plugin's page in the public `itlinekft/aiplus-plugins` marketplace) and
  `repository` (the marketplace), as the plugin repo frame C19 rule R1 asks; the source repository stays private.

## 0.1.3 — 2026-10-25

Windows and the honest surface line (OpenSpec change `office-windows-local`), after the Windows test PC's measurements
of 2026-10-24 (Windows 11, Claude Desktop 3.6556) and the first macOS run on 2026-10-25.

- Windows: the apps are unpacked with the system's own `%SystemRoot%\System32\tar.exe`, never a `tar` found on PATH.
  From Git Bash the first download hung, because Git for Windows ships a GNU tar that mishandles `C:` paths.
- What works where, as measured: Excel and PowerPoint need Claude running on your own computer (Claude Code, or a
  Claude Desktop session whose environment is „This computer”). A Cowork session that ran in the cloud could not
  download the apps and made no file; a local session on the same PC made and read back an XLSX in about a minute. The
  plugin description, both READMEs, the marketplace row, `office-router` and `office-start` no longer promise Excel or
  PowerPoint in Cowork. Hungarian first, then English.
- `office-start`: the tested block is dated 25 October and names the cloud Cowork result, the local Windows session and
  the macOS run (all four apps and the checks on an Apple-processor Mac mini; Claude Desktop on macOS not tried yet). A
  download that fails in a cloud session is explained as such. New: an app already installed on the computer can be
  used instead of a download (`AIPLUS_OFFICE_<APP>_BIN`, e.g. the GridCraft desktop app's `gridcraft-cli.exe`).
- No em dash left in any skill description (ITLine copy gate H2).

## 0.1.2 — 2026-10-24

Hungarian guards (OpenSpec change `office-hungarian-guards`), after three faults measured in ITLine's own tests (T5–T7) of the
project (T5–T7, GridCraft 0.11.1, WordCraft 0.10.0).

- `aiplus-office verify <pdf> --hu-glyphs <source>`: every word with ő/ű/Ő/Ű in the source (XLSX, DOCX, PPTX or text)
  must be in the PDF's text. GridCraft's own PDF writes those letters through a font it does not embed, so they are
  lost; verify now fails and names the words.
- `aiplus-office verify <xlsx> --hu-numbers`: a Hungarian-format number or date stored as text („1 330,50",
  „2026.10.31.") where a formula reads it or its column holds numbers fails, with the cell list. GridCraft keeps such
  values as text and a `SUM` skips them without an error.
- `office-gridcraft`, `office-data-visual`: numbers as numbers, ISO dates, Hungarian display by number format, no
  Hungarian CSV straight in, totals read back; a sheet with ő/ű gets its PDF through WordCraft and its slide chart from
  DeckCraft; both checks are gates. The `afa-tabla-pdf` recipe now carries „Tűzőgép" and takes that route.
- `office-wordcraft`: WordCraft has no Hungarian spell check; Claude proofreads Hungarian text itself and says so.
- `office-start`: a „good to know" block naming the three limits, in Hungarian and English.

## 0.1.1 — 2026-10-24

First-run guidance and plain words on what works where (OpenSpec change `office-first-run`), after the first Windows
install of 0.1.0.

- New skill `office-start` (Hungarian and English): checks Node.js and the apps (`aiplus-office status`), says where the
  apps come from (official `github.com/storytold/<app>` releases, `SHA256SUMS.txt`, per-user folder, no administrator
  rights), offers `install --all` only after a yes, says that a plain Chat does Word and PDF only while Excel and
  PowerPoint need Cowork or Claude Code, and points to the desktop apps' official release pages. What has been tried so
  far is kept in one marked block (Cowork: not tested yet). `office-router` sends a first-time user there.
- `aiplus-office status` (text) starts with the Node.js version and its verdict (needs 20 or newer) and the host;
  `--json` unchanged.
- Bilingual copy (ITLine's decision, 2026-10-24): the plugin description is Hungarian, then English; every skill description carries
  English and Hungarian triggers; the public README opens with a „Magyarul" section and has an English trademark line
  next to the Hungarian one. The PdfCraft skill no longer says another product is not needed.
- The release script takes the marketplace description from `plugin.json` at the commit (no second copy).

## 0.1.0 — 2026-10-24

First version (OpenSpec change `office-plugin-v1`), synthesised from an MIT-licensed upstream package (see UPSTREAM.md; MIT,
pinned in UPSTREAM.md).

- `aiplus-office` command: checksum-verified provisioning of the WordCraft, GridCraft, DeckCraft and PdfCraft CLIs from
  the official storytold releases into a per-user cache; `apps`, `status`, `install`, `<app> ensure|path|exec|mcp`,
  `verify`, `doc prepare`.
- MCP proxy: WordCraft and PdfCraft confined to the project folder; GridCraft and DeckCraft refused without
  `--allow-unconfined`; a `--root` that holds an unexpanded `${…}` is refused; `--register` writes the project `.mcp.json`.
- Eight skills: `office-router`, `office-wordcraft`, `office-gridcraft`, `office-deckcraft`, `office-pdfcraft`,
  `office-doc-publish`, `office-deck`, `office-data-visual`, with Hungarian triggers and worked Hungarian examples.
- Plugin packaging: `plugin.json`, a local dev `marketplace.json`, `.mcp.json` (confined apps only), a committed bundle.
- Measured on Linux x86_64 with WordCraft 0.10.0, GridCraft 0.11.1, DeckCraft 0.10.0, PdfCraft 0.13.0
  (`docs/MEASURED.md`).
