## ADDED Requirements

### Requirement: Session routing context

The plugin SHALL add, at the start of every Claude Code session (also a Claude Desktop Code session), a short context
that sends any Word, Excel, PowerPoint or PDF job to `aiplus-office:office-router` (or the app skill it names) first,
names the generic routes not to start with (Python, openpyxl, python-docx, Office automation, LibreOffice, a hand-built
ZIP or XML file), points to the router's „When the module cannot run” section when the module cannot run, and sends
setup questions to `office-start`.

#### Scenario: Connectors not up

- **WHEN** a new session gets an Excel job while the module's connectors have failed
- **THEN** Claude loads an AI+ Iroda skill before trying any generic route
