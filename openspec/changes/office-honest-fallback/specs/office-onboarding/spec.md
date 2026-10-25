## ADDED Requirements

### Requirement: Node.js installed but not seen

When `node --version` fails, `office-start` SHALL look for Node.js at its usual places (Windows: `C:\Program
Files\nodejs\node.exe`; macOS: `/opt/homebrew/bin/node`, `/usr/local/bin/node`). If one is there, it SHALL say that
Node.js is installed but Claude started before it, and that Claude must be quit fully (also from the tray or the menu
bar) and started again; otherwise it SHALL give the install text as before.

#### Scenario: Installed while Claude was running

- **WHEN** `node --version` fails and `C:\Program Files\nodejs\node.exe` exists
- **THEN** the user is told to quit Claude fully and start it again, not to install Node.js

### Requirement: Cached connector failure explained

`office-start` SHALL say that after Node.js is installed and Claude restarted, AI+ Iroda connectors that still show
„Reconnect” (Customize, or the session's Connectors panel) are reconnected by clicking „Reconnect” on each, because
Claude remembers a failed connector for 15 minutes.

#### Scenario: Restarted, still „Reconnect”

- **WHEN** the user reports that the connectors still say „Reconnect” after the restart
- **THEN** the skill tells them to click „Reconnect” on each AI+ Iroda connector, and not to wait
