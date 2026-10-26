## ADDED Requirements

### Requirement: jq for the workflow gates

`aiplus-office jq <args…>` SHALL run a pinned jq release with the arguments passed through and stdio inherited,
downloading it first when it is not in `<cache root>/jq/<version>/`. The download SHALL come from the
`github.com/jqlang/jq` release path, SHALL be checked against a SHA-256 written in the source for that host, and SHALL
be refused, leaving nothing installed, when the digest differs. A host with no pinned build SHALL fail before any
download. `aiplus-office status` (text) SHALL print one `jq:` line saying whether the pinned jq is in the cache.

#### Scenario: First use

- **WHEN** `aiplus-office jq -n 1+1` runs and the pinned jq is not in the cache
- **THEN** it is downloaded once, checked, installed, and prints `2`; a second run downloads nothing

#### Scenario: A changed file

- **WHEN** the downloaded file's SHA-256 differs from the pinned one
- **THEN** the command fails with `checksum mismatch` and no jq is installed
