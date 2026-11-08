## MODIFIED Requirements

### Requirement: No Hungarian spell check said plainly

`office-wordcraft` SHALL use WordCraft's spell check on Hungarian text only where `aiplus-office status` names, after
`next:` on the `wordcraft` line, a version carrying `-hu`, and shows the line `dictionary: hu_HU in …`, and then only with `review.language` `hu-HU` and
as a first pass. Everywhere else it SHALL state that WordCraft does not check Hungarian spelling (on `en-US` it flags
every Hungarian word, on `hu-HU` without a dictionary nothing) and SHALL NOT use its spell-check results on Hungarian
text. In both cases Claude SHALL proofread Hungarian text itself and tell the user what checked the text.

#### Scenario: Hungarian letter

- **WHEN** Claude writes a Hungarian DOCX and `status` shows no `-hu` version after `next:` or `dictionary: hu_HU not installed`
- **THEN** it proofreads the text itself and tells the user that WordCraft does not check Hungarian spelling

#### Scenario: Hungarian letter with the Hungarian build and dictionary

- **WHEN** Claude writes a Hungarian DOCX and `status` shows a `-hu` version after `next:` and `dictionary: hu_HU in …`
- **THEN** it runs `review.issues` with `review.language` `hu-HU`, weighs each mark against its own proofreading, and
  tells the user that WordCraft's Hungarian check and its own reading both ran
