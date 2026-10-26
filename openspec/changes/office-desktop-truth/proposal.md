## Why

Measured on a Windows 11 test PC on 2026-10-26 (Claude Desktop 3.6556, aiplus-office 0.1.15, app cache emptied first):

- Claude Desktop starts the plugin's four MCP servers as soon as it starts, and each lazily provisions its app in the
  background: the four apps landed 18–25 s after Claude's start, before any question was typed. `office-start` then
  said „nem kell semmit telepítened … a négy program már le van töltve”, while the skill, the router and the spec said
  the module „asks before downloading anything”. That promise did not hold on Claude Desktop.
- Claude Desktop on Windows is a packaged (MSIX) app: its writes under `%LOCALAPPDATA%` land in
  `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Local`. The apps were there; `%LOCALAPPDATA%\aiplus-office`,
  the folder `status` and `office-start` named, did not exist in File Explorer.
- The `office-start` description still said „a plain Chat in Claude Desktop: Word and PDF only”, which 0.1.15 made untrue.

## What Changes

- `aiplus-office status` (text) on Windows adds a `desktop cache: <folder>` line for every
  `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Local\aiplus-office` that exists; `status --json` keeps its shape.
- The copy says what happens: Claude Desktop fetches the apps by itself, in the background, when it starts the module;
  `office-start` never starts a download itself without a yes; when all four are there and the user never asked, it
  says how they got there and where they are (the desktop folder first). `office-start` (description, intro, status
  table, the already-downloaded block, provenance text), `office-router`, the public and repository README, the user
  guide.
- Version 0.1.16.

## Capabilities

office-cli, office-onboarding
