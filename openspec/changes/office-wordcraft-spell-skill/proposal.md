## Why

`skills/office-wordcraft/SKILL.md` still says WordCraft has no Hungarian spell check and forbids `review.issues` on
Hungarian text. That was true on 2026-10-24 (stock WordCraft 0.10.0). Since 0.1.21 the module fetches WordCraft on
Windows x64 and macOS from a build with Hungarian proofing, and `aiplus-office dict hu` installs the hu_HU dictionary;
`docs/MEASURED.md` (2026-10-30, 2026-10-31) shows `review.issues` marking the planted typos there. The skill now
contradicts the CHANGELOG, and Claude on those computers throws away a working check. Reported by a family peer while
measuring block interfaces (2026-11-08).

## What Changes

- `office-wordcraft` decides from `aiplus-office status`: when the WordCraft version carries `-hu` and the line reads
  `dictionary: hu_HU in …`, Claude may run `review.issues` with `review.language` `hu-HU` as a first pass.
- That pass is not the whole check: it has measured false alarms (grammar on lowercase table cells, endings after a sign
  in the stock pack) and misses (compounds). Claude still proofreads, and tells the user what checked the text.
- Everywhere else (Linux, Windows arm64, no dictionary) the old rule stands: no `review.issues` on Hungarian text,
  Claude proofreads and says WordCraft did not check it.
