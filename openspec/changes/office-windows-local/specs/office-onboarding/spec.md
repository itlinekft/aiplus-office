## MODIFIED Requirements

### Requirement: Readiness check

Where a shell is available, `office-start` SHALL check Node.js (`node --version`) and run `aiplus-office status`
through the plugin's one command line, explain the result in plain Hungarian, and offer `aiplus-office install --all`;
it SHALL NOT download anything before the user agrees. Without a shell it SHALL say that the check needs Claude running
on the user's own computer (Claude Code, or a Claude Desktop session whose environment is „This computer”) and continue
with the surface explanation.

#### Scenario: Apps not yet downloaded

- **WHEN** `status` shows an app as `not installed`
- **THEN** the skill tells the user it will be downloaded on first use or now with `install --all`, and asks before
  running it

### Requirement: Surfaces said plainly

The plugin description, the public README, the repository README and `office-start` SHALL say plainly that a plain Chat in
Claude Desktop can work only with Word and PDF files (the two registered MCP servers), and that Excel and PowerPoint
files need Claude running on the user's own computer: Claude Code, or in Claude Desktop a session whose environment is
„This computer”. They SHALL say that a session running in the cloud cannot download the apps (measured 2026-10-24), and
SHALL NOT promise Excel or PowerPoint in Cowork.

#### Scenario: Excel request in Chat

- **WHEN** a Chat user without a shell asks for a táblázat in XLSX
- **THEN** the skill says this needs Claude Code or a „This computer” session instead of trying

#### Scenario: Cloud session

- **WHEN** a download fails in a session that runs in the cloud
- **THEN** the skill says the cloud session cannot download the programs and points to a session on the user's own
  computer

### Requirement: Tested status in one place

`office-start` SHALL keep what has and has not been tried in exactly one marked block, dated, in both languages:
Claude Code on Linux (works), Claude Desktop on Windows (installs; Chat connections not measured), Cowork in the cloud
(does not download the apps, measured), a local Claude Code session on Windows (works, measured), macOS (programs
measured on the command line; Claude Desktop not tested). No other sentence of the skill restates it.

#### Scenario: Update after the Cowork test

- **WHEN** the Cowork test result arrives (a cloud session measured 2026-10-24; Cowork on the user's own computer later)
- **THEN** one block of `office-start` changes and no other sentence of the skill contradicts it

### Requirement: Bilingual user-facing text

The plugin's user-facing text SHALL be Hungarian and English (ITLine's decision, 2026-10-24): the `plugin.json` description (and so the marketplace entry, which the release takes from it) SHALL hold
the Hungarian text first and then the English one with the same facts, including the Chat vs own-computer line;
every skill description SHALL carry English trigger phrases and Hungarian trigger words, with no em dash; `office-start`
SHALL answer in the user's language and hold both wordings of every user-facing block; the public README SHALL stay
English with a short Hungarian section „Magyarul" at the top (install and what it does). The public-copy rules apply to
both languages, and the trademark footer SHALL appear in both.

#### Scenario: English-speaking user

- **WHEN** a user writes "how do I start?"
- **THEN** `office-start` triggers and answers with its English wording

#### Scenario: Marketplace entry

- **WHEN** the release stages the plugin
- **THEN** the marketplace entry's description equals `plugin.json`'s, Hungarian first, then English

## ADDED Requirements

### Requirement: An installed app reused

`office-start` SHALL say plainly that a program already installed on the computer can be used instead of a download,
by setting `AIPLUS_OFFICE_<APP>_BIN` to its command-line tool, with the GridCraft desktop app's
`C:\Program Files\GridCraft\gridcraft-cli.exe` as the example, and that `status` then shows it as set by hand.

#### Scenario: Download blocked, desktop app present

- **WHEN** the download fails and the user has the GridCraft desktop app installed
- **THEN** the skill offers `AIPLUS_OFFICE_GRIDCRAFT_BIN` with the path of its `gridcraft-cli.exe`
