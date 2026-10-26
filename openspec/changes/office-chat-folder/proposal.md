## Why

Measured on a Windows 11 test PC on 2026-10-26 (Claude Desktop 3.6556, aiplus-office 0.1.12):

- In a plain Chat Claude Desktop starts the plugin's four MCP servers itself (`LocalMcpServerManager`), but a Chat has
  no project folder: `${CLAUDE_PROJECT_DIR}` reaches `--root` unsubstituted, every server refused it („--root holds an
  unexpanded variable … refusing to start”), and Claude said „egyetlen AI+ Iroda kapcsoló sem érhető el”. So a plain
  Chat could make no file with the module, while the copy said it does Word and PDF.
- With the fallback below in place on the same PC: all four servers announced their tools (16, 20, 25, 17) and a plain
  Chat made an XLSX, a DOCX, a PDF and a two-slide PPTX in the user's Documents › „AI+ Iroda”.
- A Node launcher script instead of `node` in `.mcp.json` was tried and dropped: a Code session ran it, the plain
  Chat's starter could not (it resolves an extensionless path to the shell script on Windows).

## What Changes

- `aiplus-office <app> mcp --root ${CLAUDE_PROJECT_DIR}` with the variable unsubstituted confines the server to the
  chat folder: `AIPLUS_OFFICE_CHAT_ROOT`, else „AI+ Iroda” in the user's Documents (OneDrive's Documents when present),
  else in the home folder; created on first use; stderr names it. Any other unsubstituted variable is still refused.
- The copy says what was measured: a plain Chat does all four file types, in the „AI+ Iroda” folder; a folder of the
  user's choice needs Claude Code or a „This computer” session. Plugin description, public and repository README,
  `office-start` (no-shell text, what works where, tested block), `office-router`.
- Version 0.1.15.

## Capabilities

office-mcp, office-onboarding
