## ADDED Requirements

### Requirement: Node.js installed on a yes

When Node.js is missing and not merely unseen, `office-start` SHALL ask with answer buttons whether to install it and
SHALL install it only after a yes, only from its official source: on Windows with `winget install --id
OpenJS.NodeJS.LTS -e --source winget`, on macOS with `brew install node` when Homebrew is present. Without either, or in
a session that runs no commands, it SHALL give the nodejs.org link and install nothing. After an install it SHALL tell
the user to quit Claude fully, start it again and reconnect the AI+ Iroda connectors.

#### Scenario: Windows, no Node.js, a Code session

- **WHEN** `node` is not found, `uname -s` is MINGW…, and `winget` is on PATH
- **THEN** Claude asks „Igen, telepítsd” / „Inkább magam telepítem” and runs the winget line only after „Igen”

#### Scenario: No package manager

- **WHEN** neither winget nor brew is found, or the session runs no commands
- **THEN** Claude gives the nodejs.org link and installs nothing
