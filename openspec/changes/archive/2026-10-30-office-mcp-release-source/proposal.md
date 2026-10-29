# Proposal: office-mcp-release-source

## Why

Claude Code reads a `.mcp.json` at a project's root as that project's own server list. This repo's root `.mcp.json` is
the plugin's server list, written with `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PROJECT_DIR}`, which only a plugin install
fills in. So every Claude Code session opened in this repo offers four `aiplus-office-*` servers that cannot start
(measured 2026-10-30: `claude mcp list` here says "Missing environment variables: CLAUDE_PLUGIN_ROOT,
CLAUDE_PROJECT_DIR" for all four). The same mistake, found first in another AI+ repo, closed its server's connection.

## What Changes

- The repo keeps the plugin's server list at `release/mcp.json`, beside `release/README.md` and `release/NOTICE`.
- The release allow-list maps `release/mcp.json` to `.mcp.json` in the built plugin, as it maps `release/README.md` to
  `README.md`. The shipped plugin is byte for byte what it was: no new version, nothing changes for a user.
- The packaging test reads `release/mcp.json` and fails when a root `.mcp.json` comes back.

## Out of scope

- Moving the servers into `plugin.json` `mcpServers`: that changes what Claude Desktop reads, which is measured on
  Windows with `.mcp.json` only.
- The dev marketplace entry (`source: "./"`) now loads the repo without MCP servers. A plugin test with servers runs on
  the built copy: `node scripts/release.mjs --out <dir>`, then `claude --plugin-dir <dir>`.
