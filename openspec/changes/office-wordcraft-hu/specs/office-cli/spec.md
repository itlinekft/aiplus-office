## ADDED Requirements

### Requirement: Repository per host

The registry SHALL name the GitHub repository an app is fetched from per host, defaulting to `storytold/<app>`.
WordCraft on `win32/x64` SHALL come from `tatargabor/wordcraft`; every other host and app SHALL stay on storytold.
The latest-release lookup and the release-download URL pin SHALL use the host's repository.

#### Scenario: WordCraft on Windows x64

- **WHEN** WordCraft is provisioned on `win32/x64`
- **THEN** the latest release is looked up at `repos/tatargabor/wordcraft/releases/latest` and the asset URL must
  start with `https://github.com/tatargabor/wordcraft/releases/download/`

#### Scenario: Other hosts unchanged

- **WHEN** WordCraft is provisioned on `darwin/arm64` or `linux/x64`, or GridCraft on `win32/x64`
- **THEN** the repository is `storytold/<app>`

### Requirement: Latest-release cache keyed by repository

The cached latest release (`latest.json`) SHALL record the repository it was read from; a record from another
repository, or without one, SHALL be ignored.

#### Scenario: Cached storytold tag after the switch

- **WHEN** `latest.json` holds `v0.12.0` without a repository and WordCraft on `win32/x64` is provisioned
- **THEN** the cache is ignored and the fork's latest release is looked up

### Requirement: Hungarian dictionary on request

`aiplus-office dict hu` SHALL download `hu_HU.aff`, `hu_HU.dic` and `README_hu_HU.txt` from
`raw.githubusercontent.com/LibreOffice/dictionaries` at a pinned commit, SHALL refuse any file whose SHA-256 differs
from the one written in the code, and SHALL install the three files into `<cache root>/dictionaries` by an atomic
rename. An installed dictionary SHALL NOT be downloaded again. No other command SHALL download it.

#### Scenario: Changed file refused

- **WHEN** a downloaded file's SHA-256 differs from the pinned one
- **THEN** the command fails with exit 69 naming the file, and nothing is installed

### Requirement: WordCraft finds the dictionary

When the dictionary is installed and `WORDCRAFT_DICTIONARIES` is unset, `aiplus-office wordcraft <sub>` SHALL set it
to `<cache root>/dictionaries` for the processes it starts. A value already set SHALL be kept.

#### Scenario: Installed dictionary

- **WHEN** the dictionary is installed and `aiplus-office wordcraft exec …` runs with `WORDCRAFT_DICTIONARIES` unset
- **THEN** WordCraft runs with `WORDCRAFT_DICTIONARIES=<cache root>/dictionaries`

### Requirement: Status names the dictionary

`status` (text) SHALL print `dictionary: hu_HU in <folder>` when it is installed, else
`dictionary: hu_HU not installed (aiplus-office dict hu)`; `status --json` keeps its shape.
