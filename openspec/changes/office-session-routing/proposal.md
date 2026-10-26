## Why

Measured on a Windows 11 test PC on 2026-10-26 (Claude Desktop 3.6556, aiplus-office 0.1.17, Code sessions on „This
computer”), the same request „Készíts árlistát táblázatban három termékkel, 27% ÁFÁ-val …” in four new sessions:

- With the module's connectors up, Claude loaded `office-gridcraft` first (0.1.16 run, „arlista-m7.xlsx”).
- With the connectors failed (Node.js missing, then cached as failed for 15 minutes), every run began with
  `python -c "import openpyxl"`. Then one run loaded `office-gridcraft` and stopped honestly (no Node.js), one loaded it
  and made the file through the CLI, and one never loaded a skill: it checked for Excel automation and wrote the XLSX
  as a hand-built ZIP of XML with PowerShell, saying it was done. A request that named a file „…-nonode.xlsx” was also
  read as „make it without Node” and built by hand.

So which route a session takes depends on whether the connectors' tools happen to be in view, not on the plugin being
installed. A SessionStart hook in a Desktop Code session runs in Git Bash, and its output reaches the context (measured
the same night with a project hook: `/usr/bin/bash` 5.3.15).

Also: the marketplace README row still said Excel and PowerPoint need Claude on the user's own computer, untrue since
0.1.15.

## What Changes

- `hooks/hooks.json`: one SessionStart hook, `cat "${CLAUDE_PLUGIN_ROOT}/hooks/session-context.md"` (no Node.js), and
  `hooks/session-context.md`: office files go to `office-router` first; not Python, openpyxl, python-docx, Office
  automation, LibreOffice or a hand-built file; if the module cannot run, the router's honest stop; setup questions to
  `office-start`.
- The release allow-list ships `hooks/**`; the marketplace README row says what 0.1.15 measured.
- Version 0.1.18.

## Capabilities

plugin-packaging, plugin-release, office-skills
