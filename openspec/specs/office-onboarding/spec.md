# office-onboarding Specification

## Purpose
The first-run guidance of the plugin: before the first office job, the user learns what the plugin needs, where the
apps come from, which Claude surface can do what, and where the optional desktop apps are downloaded.

## Requirements

### Requirement: First-run skill

The plugin SHALL ship a skill `office-start` whose description carries the Hungarian first-run phrases „első indítás",
„telepítés", „hogyan kezdjem" and „mi kell hozzá", and `office-router` SHALL send a first-time user, or a run that failed
because Node.js or an app is missing, to it.

#### Scenario: Hungarian first-run question

- **WHEN** the skill descriptions are searched for „hogyan kezdjem"
- **THEN** `office-start` matches

#### Scenario: Router hand-off

- **WHEN** the router skill is read
- **THEN** it names `office-start` for a first run

### Requirement: Readiness check

Where a shell is available, `office-start` SHALL check Node.js (`node --version`) and run `aiplus-office status`
through the plugin's one command line, explain the result in plain Hungarian, and offer `aiplus-office install --all`;
it SHALL NOT download anything before the user agrees. Without a shell it SHALL say that the check needs Cowork or
Claude Code and continue with the surface explanation.

#### Scenario: Apps not yet downloaded

- **WHEN** `status` shows an app as `not installed`
- **THEN** the skill tells the user it will be downloaded on first use or now with `install --all`, and asks before
  running it

### Requirement: Provenance stated

`office-start` SHALL state where the apps come from: the official `github.com/storytold/<app>` releases, each download
checked against the release's `SHA256SUMS.txt`, kept in a per-user cache (`%LOCALAPPDATA%\aiplus-office`,
`~/Library/Caches/aiplus-office`, `~/.cache/aiplus-office`), no installer and no administrator rights.

#### Scenario: Where from

- **WHEN** the user asks where the programs come from
- **THEN** the answer names the GitHub releases, the SHA-256 check and the cache folder `status` printed

### Requirement: Surfaces said plainly

The plugin description, the public README, the repository README and `office-start` SHALL say plainly that a plain Chat in
Claude Desktop can work only with Word and PDF files (the two registered MCP servers), and that Excel and PowerPoint
files need Cowork or Claude Code.

#### Scenario: Excel request in Chat

- **WHEN** a Chat user without a shell asks for a táblázat in XLSX
- **THEN** the skill says this needs Cowork or Claude Code instead of trying

### Requirement: Tested status in one place

`office-start` SHALL keep what has and has not been tried (Chat MCP on Windows, Cowork) in exactly one marked block;
until a measurement arrives, Cowork is stated as not tested yet.

#### Scenario: Update after the Cowork test

- **WHEN** the Cowork test result arrives
- **THEN** one block of `office-start` changes and no other sentence of the skill contradicts it

### Requirement: Desktop apps pointed to

`office-start` SHALL say that the plugin installs only the command-line tools, not the window apps, and SHALL point to
each app's official download page (`https://github.com/storytold/<app>/releases/latest`), naming the Windows installer
and portable files and the macOS disk image, as verified on a dated reading recorded in `docs/MEASURED.md`.

#### Scenario: The user wants to open the XLSX in a window

- **WHEN** the user asks how to open the made file in GridCraft
- **THEN** the skill gives `https://github.com/storytold/gridcraft/releases/latest` and the file to pick for their system

### Requirement: Bilingual user-facing text

The plugin's user-facing text SHALL be Hungarian and English (ITLine's decision, 2026-10-24): the `plugin.json` description (and so the marketplace entry, which the release takes from it) SHALL hold
the Hungarian text first and then the English one with the same facts, including the Chat vs Cowork / Claude Code line;
every skill description SHALL carry English trigger phrases and Hungarian trigger words; `office-start` SHALL answer in
the user's language and hold both wordings of every user-facing block; the public README SHALL stay English with a
short Hungarian section „Magyarul" at the top (install and what it does). The public-copy rules apply to both
languages, and the trademark footer SHALL appear in both.

#### Scenario: English-speaking user

- **WHEN** a user writes "how do I start?"
- **THEN** `office-start` triggers and answers with its English wording

#### Scenario: Marketplace entry

- **WHEN** the release stages the plugin
- **THEN** the marketplace entry's description equals `plugin.json`'s, Hungarian first, then English

### Requirement: Hungarian limits named at first run

`office-start` SHALL hold a short „good to know" block naming, in one line each and in Hungarian and English: GridCraft's
own PDF and print lose ő/ű (the module routes around it and checks), Hungarian-format numbers typed as text are not
counted (the module writes real numbers and checks), and WordCraft has no Hungarian spell check (Claude proofreads).

#### Scenario: First run

- **WHEN** a user runs the first-run check
- **THEN** the three limits are named once, in the user's language
