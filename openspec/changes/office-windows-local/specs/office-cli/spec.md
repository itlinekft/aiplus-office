## ADDED Requirements

### Requirement: Windows archives with the system tar

On Windows the command SHALL list and extract a release archive with the system's own bsdtar,
`<SystemRoot>\System32\tar.exe`, where `<SystemRoot>` is the `SystemRoot` environment variable or `C:\Windows` when it is
unset; it SHALL NOT resolve `tar` through PATH, because Git for Windows puts a GNU tar there that mishandles drive paths
(measured 2026-10-24 on the test PC).

#### Scenario: Git Bash on PATH

- **WHEN** provisioning runs on Windows with `SystemRoot=C:\Windows` and Git's `usr\bin` first on PATH
- **THEN** the listing and the extraction call `C:\Windows\System32\tar.exe`

#### Scenario: SystemRoot unset

- **WHEN** provisioning runs on Windows and `SystemRoot` is not set
- **THEN** the call is `C:\Windows\System32\tar.exe`
