# Tasks

## 1. Recipe

- [x] 1.1 `skills/office-pdfcraft/SKILL.md` recipe `protect`: no default (D49), `env.PASSWORD` instead of `--arg` (D50), `trap … EXIT` (D51); the rule text says to ask the user [REQ: The protect recipe treats the password as a secret]
- [x] 1.2 `skills.test.ts` checks the three; `skills-recipes.test.ts` passes `PASSWORD` to the real-binary run [REQ: The protect recipe treats the password as a secret]
- [x] 1.3 Measured 2026-11-08 (Linux x64, WordCraft 0.15.2, PdfCraft 0.18.2 through `_BIN`): the recipe protects and `info` without the password fails; `bash -x` shows no password in jq's arguments; with `PASSWORD` unset it stops at the first line and writes nothing; with `pdfcraft exec run` failing (exit 3) the temp script is gone. The vitest real-binary run could not finish: GitHub API 503/504 on release lookups [REQ: The protect recipe treats the password as a secret]
- [x] 1.5 Review findings folded in: the temp-script lines run in a subshell so the trap is the step's own; the recipe says how to set `PASSWORD` (`read -r PASSWORD <<'PW'`, never an argument or `echo`); the test also refuses `--argjson`/`$ENV` and an `echo` of the password. Re-measured both paths (protects and verifies; failing step leaves no temp script) [REQ: The protect recipe treats the password as a secret]
- [x] 1.4 0.1.24: At the next version bump, a `CHANGELOG.md` line: "The PDF password recipe asks for the password (no default), keeps it off every command line and removes its temp script also on failure." [REQ: The protect recipe treats the password as a secret]
