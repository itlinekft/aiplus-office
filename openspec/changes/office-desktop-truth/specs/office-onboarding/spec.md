## MODIFIED Requirements

### Requirement: Readiness check

Where a shell is available, `office-start` SHALL check Node.js (`node --version`) and run `aiplus-office status`
through the plugin's one command line, explain the result in plain Hungarian, and offer `aiplus-office install --all`
when an app is missing; it SHALL NOT start a download itself before the user agrees. It SHALL say that Claude Desktop
downloads the apps by itself, in the background, when it starts the module, and SHALL NOT claim that the module asks
before every download. Without a shell it SHALL say that the check needs Cowork or Claude Code and continue with the
surface explanation.

#### Scenario: Apps not yet downloaded

- **WHEN** `status` shows an app as `not installed`
- **THEN** the skill tells the user it will be downloaded on first use or now with `install --all`, and asks before
  running it

#### Scenario: Claude Desktop already downloaded them

- **WHEN** all four apps are installed and the user never asked for a download
- **THEN** the skill says Claude Desktop fetched them in the background when it first started the module, names where
  they came from and the folder they are in, and does not offer `install`

### Requirement: Provenance stated

`office-start` SHALL state where the apps come from: the official `github.com/storytold/<app>` releases, each download
checked against the release's `SHA256SUMS.txt`, kept in a per-user cache (`%LOCALAPPDATA%\aiplus-office`, for Claude
Desktop on Windows `%LOCALAPPDATA%\Packages\Claude_…\LocalCache\Local\aiplus-office`,
`~/Library/Caches/aiplus-office`, `~/.cache/aiplus-office`), no installer and no administrator rights. When `status`
prints a `desktop cache:` line, the folder given to the user SHALL be that one.

#### Scenario: Where from

- **WHEN** the user asks where the programs come from
- **THEN** the answer names the GitHub releases, the SHA-256 check and the cache folder `status` printed (the
  `desktop cache:` folder when there is one)
