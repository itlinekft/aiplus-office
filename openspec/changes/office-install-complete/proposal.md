## Why

The owner, 2026-10-26: „csináld meg a fixeket, hogy az install jó legyen annak, aki használja, minden infó benne
legyen”. A review of the user-facing install text against the night's measurements on a Windows 11 test PC found:

- The user guide still said a plain Chat makes no Excel or PowerPoint file (untrue since 0.1.15), that the apps are
  downloaded „only after you say yes” (Claude Desktop downloads them by itself), and that removing the plugin in Claude
  Desktop was never tried (it was, the exact clicks are known).
- The shipped README gave a Claude Code command that does not exist (`/plugin install … --marketplace …`) and the same
  „only with your yes”.
- The troubleshooting guide had no entry for the commonest Claude Desktop fault measured (connectors cached as failed
  for 15 minutes, „Reconnect”), none for „not installed” right after the install, and two entries that no longer apply.
- The workflow skills' gates run `jq`, and Git for Windows has none (measured: no `jq.exe` in
  `C:\Program Files\Git\usr\bin`), so on Windows those gates fail.

## What Changes

- `aiplus-office jq <args…>`: a pinned jq 1.8.2 for the six desktop hosts, its SHA-256 per host written in `src/jq.ts`
  (from the release's `sha256sum.txt`), downloaded once into `<cache root>/jq/1.8.2/`, refused on a digest mismatch;
  `status` prints a `jq:` line.
- Every skill whose code runs `jq` carries, right under the command line,
  `command -v jq >/dev/null || jq() { aiplus-office jq "$@"; }`.
- The user guide, the shipped README, the README and the troubleshooting guide: the exact Claude Desktop install,
  remove and update steps as measured, Node.js followed by a full quit of Claude, „Reconnect”, where files go per
  session kind, the optional ArtCraft Launcher, and the stale entries corrected.
- Version 0.1.19.

## Capabilities

office-cli, office-skills, office-onboarding
