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

## Adversarial review

A separate reviewer agent read the change against `docs/MEASURED.md`, `src/registry.ts`, `src/bin/aiplus-office.ts`
and `skills/office-start/SKILL.md` (2026-11-08). Findings and what was done:

- **Medium, folded in:** `status` lists every cached WordCraft version, so "the WordCraft version carries `-hu`" was
  ambiguous when the cache holds a stock and a `-hu` build. The rule now reads the version after `next:`, the one that
  runs.
- **Medium, folded in:** stock WordCraft 0.15.2 with storytold's `hu` pack does check Hungarian (9 false alarms on five
  office sentences). The skill now says so and treats that case as not checking, because the module does not set the
  pack up; the old sentence ("with `hu-HU` nothing is") is limited to builds without a dictionary.
- **Low, accepted:** `dictionary: hu_HU in …` can name Claude Desktop's copy, and `WORDCRAFT_DICTIONARIES` is set only
  when unset, so the line alone does not prove the process reads it. Together with the `-hu` build it matches every
  measured case, and Claude proofreads in both branches.
- **Low, folded in:** `office-start` (HU/EN) still said "only on Windows"; it now says Windows and macOS.
- No internal name: `itlinekft/wordcraft` is already public in this repo.
