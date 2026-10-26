## ADDED Requirements

### Requirement: Status names Claude Desktop's own copy

On Windows, unless `AIPLUS_OFFICE_HOME` is set, `aiplus-office status` (text) SHALL print, right after the `cache:`
line, one `desktop cache: <folder> (Claude Desktop's own copy; open this folder)` line for every existing
`%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Local\aiplus-office` directory, reading only the file system. `status
--json` SHALL keep its shape.

#### Scenario: Claude Desktop downloaded the apps

- **WHEN** `status` runs on Windows and `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Local\aiplus-office`
  exists
- **THEN** the line after `cache:` is `desktop cache:` with that folder

#### Scenario: No packaged copy

- **WHEN** no such folder exists, or the platform is not Windows, or `AIPLUS_OFFICE_HOME` is set
- **THEN** no `desktop cache:` line is printed
