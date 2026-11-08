## Why

Five blocks of the family each carried their own plugin release builder. The family kit 0.3.0 ships one,
`aiplus-release`, configured per block by a committed `.aiplus-release.json`: build from a commit through an
allow-list, one version source checked against its copies, `set-leakscan` and the block's real-data check over the
built files, staging into a clone of the marketplace without committing. Measured 2026-11-08 from `52839f5` (with the
config committed in a scratch worktree): the kit builds the same 19 files, byte for byte, as `scripts/release.mjs`;
the modes are 0644 where the old script followed the umask.

This repository is public and the kit is not, so the kit is never a dependency here and its location is not written
here: the release machine runs it with `npx`, without installing it.

## What Changes

- `.aiplus-release.json` (from the kit's example for this block) is the release configuration; `scripts/release.mjs`
  and its test go.
- The spec's allow-list names what has shipped since 0.1.18 (`hooks/`, `TROUBLESHOOTING.md`, `USER-GUIDE.md`).
- The leak scan runs over the built files before anything is staged, and has no skip flag (`--no-leakscan` and
  `--no-validate` are gone).
- The marketplace README row lives in the config; the copy test reads it there.

## Adversarial review

A separate reviewer agent read the staged change, `.aiplus-release.json`, the README, the copy test and CI
(2026-11-08). Findings and what was done:

- **Medium, folded in:** the README showed a bare `aiplus-release`, which an outside reader cannot run. It now says the
  tool is the maintainers', run with `npx` and not part of this repository, and how to build the folder by hand.
- **Medium, answered:** the spec's leak-scan and "no skip flag" claims rest on the kit, not on code here. Read in the
  kit 0.3.0 source: the built files are leak-scanned in a throwaway repository before anything replaces `--out`, a
  missing scanner refuses, there is no skip option, and `claude plugin validate` runs over the built plugin (so the
  removed `--no-validate` drops no check). The kit is pinned by tag in the release command, so a later kit cannot
  change this silently.
- **Low, accepted:** `^## (\S+)` takes the first CHANGELOG heading, so an "Unreleased" heading is refused; that was
  already the rule (the old release test refused it too), and open changes keep their CHANGELOG line as a task.
- **Low, folded in:** task 1.5 was ticked before the commit; it is ticked only after the post-commit build.
- **Low, noted:** CI runs typecheck, tests and `plugin validate` on the source tree; it never ran the release, before or
  after.
