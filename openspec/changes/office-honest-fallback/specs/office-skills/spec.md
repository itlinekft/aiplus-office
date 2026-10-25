## ADDED Requirements

### Requirement: No silent substitute

When the plugin's command line or an app command fails because Node.js is missing, the app is missing or cannot be
downloaded, the connector is not running, or the session runs in the cloud, the skills SHALL stop, say why in plain
words, Hungarian first, then English, and continue with `office-start`. They SHALL NOT make the requested file with
another tool or library in the module's name. If the user then plainly asks for another tool, the file MAY be made,
and the answer SHALL say it was not made with AI+ Iroda.

#### Scenario: Connectors not running

- **WHEN** `aiplus-office` or an app command fails with Node.js not found
- **THEN** the skill says the module cannot run yet and why, points to `office-start`, and makes no file another way

#### Scenario: A cloud session

- **WHEN** the app download fails in a session that runs in the cloud
- **THEN** the skill says the module needs a session on the user's own computer (Claude Desktop: Code, environment
  „This computer”) and makes no file another way

### Requirement: Checks with the module's own tools

The skills SHALL verify with `aiplus-office verify` and the apps' own `exec eval`/`check`, and SHALL NOT run
`python` or another interpreter that an office computer may not have.

#### Scenario: A sheet's totals checked

- **WHEN** a skill checks a workbook's totals
- **THEN** it uses `aiplus-office gridcraft exec eval` or `verify`, not `python -c`

### Requirement: Earlier results kept

A change to a file already in the folder, the user's own or an earlier result of the session, SHALL write a new file
with a telling name, unless the user asks to replace it.

#### Scenario: A password on the merged PDF

- **WHEN** the user asks to remove a page from the merged PDF and set a password
- **THEN** the result is a new file (for example „… – jelszóval.pdf”) and the merged PDF stays as it was
