## Why

The AI+ family's Claude-surface contract (C10) v2, 2026-11-08, makes the MCP wire exact. Its checker ran against
`aiplus-office mcp` with no network the same night: five frames failed and `serverInfo` had no `contractVersion`.

- A request without `"jsonrpc": "2.0"` and one with `id: null` were answered as valid.
- An invalid frame without an `id` (`{"jsonrpc":"2.0","method":1}`) got no reply.
- An unknown method was echoed in the error message (`method not found: <method>`).
- An unknown tool was answered as a tool error that echoed its name, not as −32602.

The checker could not try the tool-input frames: every tool starts an app, so there was no tool to probe with. The same
survey found two more defects. `process.exit` runs right after the server ends, which can cut off a large answer still
in the stdout buffer (D12). The refusal sentences are bilingual literals scattered through the code, with no catalogue
(D13).

## What Changes

- **A closed envelope.** A request is an object with `"jsonrpc": "2.0"`, a string `method`, an `id` that is a string or
  an integer, and `params`, when present, an object. Anything else gets −32600, with the request's `id` when it has a
  valid one and `null` otherwise. A valid frame without an `id` is a notification and gets no reply. Unknown members of
  `params` (`_meta`) are accepted.
- **No echo.** Every JSON-RPC error message is a fixed sentence. An unknown tool gets −32602 "No such tool.", and
  `arguments` that is not an object gets −32602 too.
- **Tool input is checked before an app sees it.** The tool's `inputSchema` decides: an unknown argument, a missing
  required one or a wrong top-level type is refused as a tool error. The error is a fixed sentence with a catalogue key
  and starts no app. `tools/list` says `additionalProperties: false` for every tool.
- **A line cap the server outlives.** An inbound line over 4 MiB gets −32600 with `id: null`, and the server reads on.
  CRLF ends a line, and a blank line is ignored.
- **`office_status`.** A read-only tool that answers without starting an app: the folder the apps work in, and per app
  whether it is installed and whether it runs. The checker probes with it.
- **`serverInfo.contractVersion`: 1.** It is bumped when a tool's name, a required argument or an answer field of this
  server's own changes. A test pins it.
- **The exit drains stdout** (D12). `process.exit` runs after everything written has been flushed.
- **A message catalogue for the server's own refusals** (D13, the part in this server). The per-app proxy's copy is
  left to a later change.

Out of scope: the per-app proxy (`aiplus-office <app> mcp`) as a server of its own. Since 0.1.23 the plugin registers
only `aiplus-office mcp`.

## Adversarial review

A separate reviewer agent read the diff, the manifest schemas and the exit path (2026-11-08). It found no high-severity
regression. Findings and what was done:

- **Medium, folded in:** `readLines` ended only on `"end"`, so a destroyed or failed stdin left the server and its apps
  running. It now ends once on `"end"`, `"close"` or `"error"`, and a test destroys stdin.
- **Medium, folded in:** `exitAfterDrain` could wait forever on a reader that stopped reading, and an EPIPE would have
  been an uncaught error. It now has a 2-second fallback and exits with the intended code on a stdout error. `status`
  and a pipe into `head` still exit 0.
- **Medium, partly folded in:** the hub now closes every schema that names its properties, including WordCraft's,
  which did not say `additionalProperties`. `null` for an optional argument now passes, because clients send it for an
  unset field. **Accepted risk:** an undeclared argument that an app used to take silently is now refused. The contract
  asks for a closed whitelist, and the refusal names the fix ("only those in its input schema").
- **Low, folded in:** an exception inside a frame now answers −32603 with a fixed sentence instead of ending the
  server.
- **Low, accepted:** the cap counts the CR of a CRLF line (documented). Blank lines are ignored, as the contract says.
- **Low, out of scope:** the per-app proxy passes an app's stderr lines and error messages through. That proxy is not
  the plugin's server since 0.1.23, so it is left to a later change, together with its copy catalogue (D13's rest).
- **Low, noted:** `docs/MEASURED.md` says the checker is a private family tool. It names no repository or path.
