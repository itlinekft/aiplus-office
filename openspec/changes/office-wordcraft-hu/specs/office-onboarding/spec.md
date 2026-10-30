## ADDED Requirements

### Requirement: Hungarian spell checking said plainly

`office-start` SHALL say, in Hungarian and English, that on Windows and macOS WordCraft comes from a build with
Hungarian spell checking (`github.com/itlinekft/wordcraft`) until the official release has it; SHALL offer the
dictionary download and run `aiplus-office dict hu` only on a yes; and SHALL tell the desktop-app user where to
download that build, what its first start asks where it is not signed, and to set File › Options › Proofing › Dictionaries
folder to the folder `status` names.

#### Scenario: Dictionary not installed

- **WHEN** `status` says `dictionary: hu_HU not installed`
- **THEN** the skill says what the dictionary is and where it comes from, and asks before downloading it
