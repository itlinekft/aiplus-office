## ADDED Requirements

### Requirement: Install steps as measured

The user guide and the shipped README SHALL give the Claude Desktop install, remove and update steps as measured on
Windows 11 (Claude mode, Customize › Plugins › Add plugin › Add marketplace › Add from a repository, „Grant access” not
needed; remove under Yours; update by remove and add), SHALL say to quit Claude fully after installing Node.js, SHALL
say where files go in each kind of session, and SHALL give only Claude Code commands that exist. The troubleshooting
guide SHALL have an entry for connectors cached as failed („Reconnect”) and for apps not yet downloaded right after the
install, and SHALL NOT describe a fault the current version no longer has as current.

#### Scenario: A first-time Windows user

- **WHEN** a user follows the user guide on Windows 11 from a computer without Node.js
- **THEN** every click named exists, and the guide covers the „Reconnect” state a Claude started before Node.js shows
