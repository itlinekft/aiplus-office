## Why

WordCraft has no Hungarian spell checking in any official release (0.12.0 on 2026-10-30). Hungarian proofing exists in
open upstream pull requests (storytold/wordcraft #4575, #2070, #2385; issue #735), plus two fixes of ours proposed
there. Until it lands, a build of that branch is published on a fork:
`github.com/tatargabor/wordcraft/releases/tag/v0.11.0-hu.1` (Windows x64 portable zip + `SHA256SUMS.txt`, the same
layout as storytold's releases).

Measured on 2026-10-29/30 (same hu_HU dictionary, LibreOffice @ 74b6ae2a2d): 99.99 % word-level agreement with
Hunspell 1.7.5 on 49 660 common words; on a Windows 11 test PC the build marks the planted typos of a sample árajánlat
(`szálítás`, `határídőre`) and leaves `27%-os` and `§-ában` alone. Without the hu_HU dictionary nothing is checked:
WordCraft reads `hu_HU.aff` + `hu_HU.dic` from a folder, and dictionaries are not bundled (licence, size).

The module fetches every app from `github.com/storytold/<app>` only, so it cannot hand the user this build, and it
has no way to fetch the dictionary.

## What Changes

- **WordCraft on Windows x64 comes from the fork** (`tatargabor/wordcraft`); every other host and app stays on
  storytold. The registry names the repository per host; the download URLs stay pinned to that repository's release
  path. The cached "latest release" records its repository, so a tag cached from storytold is not reused for the fork.
- **`aiplus-office dict hu`** downloads the Hungarian dictionary (`hu_HU.aff`, `hu_HU.dic`, `README_hu_HU.txt` with
  its licence) from LibreOffice's official repository at a pinned commit, checks each file against a SHA-256 written
  in the code, and installs it into `<cache root>/dictionaries`. Never run without the user's yes.
- **WordCraft finds it:** `aiplus-office wordcraft …` (exec, mcp) sets `WORDCRAFT_DICTIONARIES` to that folder when
  the dictionary is installed and the variable is not already set.
- **`status`** prints a `dictionary:` line (installed and where, or not installed).
- **Copy** (`office-start`, README): where WordCraft comes from on Windows and why; the dictionary on a yes; the desktop
  app: download from the fork's release, set File › Options › Proofing › Dictionaries folder to the folder `status`
  names, and click Later on the 0.12.0 update offer (the official release drops Hungarian).
- Version 0.1.21.

To revert: once an official storytold release has Hungarian proofing, drop the per-host repository.

## Capabilities

office-cli, office-onboarding
