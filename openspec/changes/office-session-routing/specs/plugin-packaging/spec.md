## ADDED Requirements

### Requirement: Session hook needs no Node.js

The plugin's `hooks/hooks.json` SHALL hold exactly one SessionStart hook whose command only prints
`${CLAUDE_PLUGIN_ROOT}/hooks/session-context.md` with `cat`, so it works where Node.js is missing; the context SHALL stay
under 1,200 characters.

#### Scenario: The hook file

- **WHEN** the packaging test reads `hooks/hooks.json`
- **THEN** it finds one SessionStart command, `cat "${CLAUDE_PLUGIN_ROOT}/hooks/session-context.md"`
