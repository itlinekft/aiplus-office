## ADDED Requirements

### Requirement: Hungarian spell checking said plainly

`office-start` SHALL say, in Hungarian and English, that on Windows WordCraft comes from a build with Hungarian spell
checking (`github.com/tatargabor/wordcraft`) until the official release has it; SHALL offer the dictionary download
and run `aiplus-office dict hu` only on a yes; and SHALL tell the desktop-app user where to download that build, to set
File › Options › Proofing › Dictionaries folder to the folder `status` names, and to click Later on the update offer.

#### Scenario: Dictionary not installed

- **WHEN** `status` says `dictionary: hu_HU not installed`
- **THEN** the skill says what the dictionary is and where it comes from, and asks before downloading it
