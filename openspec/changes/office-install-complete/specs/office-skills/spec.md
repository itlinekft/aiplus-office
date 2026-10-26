## ADDED Requirements

### Requirement: jq fallback in the skills

Every skill whose code runs `jq` SHALL carry, on the line right under the command line, `command -v jq >/dev/null ||
jq() { aiplus-office jq "$@"; }`, so a shell without jq (Git for Windows) runs the module's pinned jq.

#### Scenario: Windows without jq

- **WHEN** a workflow gate runs `jq` in Git Bash with no `jq` on PATH
- **THEN** the fallback function runs `aiplus-office jq` with the same arguments
