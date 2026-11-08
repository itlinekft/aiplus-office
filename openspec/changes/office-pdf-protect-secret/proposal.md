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
