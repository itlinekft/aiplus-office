## Why

A family code survey against the secret-store contract C6 v1 (2026-11-08, survey items D49–D51) found three low
defects in `office-pdfcraft`'s `protect` recipe, which agents run as written:

- **D49:** `PASSWORD=${PASSWORD:-recipe-only-secret}` protects with a known word when `PASSWORD` is unset.
- **D50:** the password goes to `jq --arg pw "$PASSWORD"`, so it sits in jq's argument list (the process list), against
  the skill's own rule that passwords never go on the command line.
- **D51:** the `0600` temp script holding the password is removed with a plain `; rm -f`, so a failing run leaves it.

## What Changes

- The recipe has no default: `: "${PASSWORD:?…}"` stops it, and the rule text says to ask the user for the password.
- jq reads the password from its environment (`env.PASSWORD`, set for jq alone), never from its arguments.
- `trap 'rm -f "$S"' EXIT` right after `mktemp`, beside the immediate `rm -f`.
- A unit test reads the recipe and checks all three; the real-binary recipe run passes `PASSWORD` for the test only.

## Adversarial review

A separate reviewer agent read the recipe, its two tests and the skill's rule (2026-11-08). Findings and what was done:

- **Medium, folded in:** nothing said how the agent sets `PASSWORD`. The recipe now says: ask the user, then
  `read -r PASSWORD <<'PW'` in the same Bash call, never as an argument and never echoed. **Left open:** the agent's own
  Bash call text still carries the password (that is how the user's word reaches the shell at all); keeping it out of
  that text needs the secret-store rules for environment and argv, which the contract's v2 will bring as its own request.
- **Medium, folded in:** `trap … EXIT` in a persistent shell replaced an existing trap and fired only at shell exit.
  The temp-script lines now run in a subshell, so the trap belongs to the step; re-measured on a failing
  `pdfcraft exec run` (exit 3): the temp script is gone.
- **Low, accepted:** the password sits in a 0600 temp file in the system temp folder for the length of one command;
  that is the skill's rule (a temp file outside the project), and it is removed on every exit.
- **Low, folded in:** the test now also refuses `--argjson`, `$ENV` and an `echo` of the password; `env.PASSWORD`
  needs jq 1.5 or newer, below every jq the module uses.
