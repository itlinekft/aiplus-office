## ADDED Requirements

### Requirement: Exact MCP wire (C10 v2)

`aiplus-office mcp` SHALL accept as a request only an object with `"jsonrpc": "2.0"`, a string `method`, an `id` that
is a string or an integer, and `params` that is an object when present, and SHALL answer anything else with −32600,
carrying the request's `id` when it is valid and `null` otherwise. It SHALL NOT reply to a valid frame without an `id`.
Its JSON-RPC error messages SHALL be fixed sentences that repeat nothing from the request. An unknown tool and
`arguments` that is not an object SHALL get −32602. A line over 4 MiB SHALL get −32600 with `id: null`, and the server
SHALL go on reading. `serverInfo` SHALL carry `contractVersion`.

#### Scenario: Invalid envelope

- **WHEN** the client sends `{"id": 21, "method": "ping"}` or `{"jsonrpc": "2.0", "id": null, "method": "ping"}`
- **THEN** the server answers −32600 (with `id` 21 for the first and `null` for the second) and still answers a later
  `ping`

#### Scenario: Unknown method and tool are not echoed

- **WHEN** the client calls an unknown method or an unknown tool whose name holds a marker string
- **THEN** the reply is −32601 or −32602 and its text does not contain the marker

### Requirement: Tool input checked before an app runs

The server SHALL check a tool call's `arguments` against the tool's `inputSchema` before any app sees the call, and
SHALL refuse an unknown argument, a missing required argument or a wrong top-level type as a tool error
(`isError: true`). The refusal SHALL be a fixed sentence with a catalogue key, SHALL repeat no value from the request,
and SHALL start no app. `tools/list` SHALL show `additionalProperties: false` for every tool.

#### Scenario: Unknown argument

- **WHEN** a tool is called with an argument its schema does not name
- **THEN** the reply is a tool error with a fixed sentence, the argument's name is not in it, and no app starts

### Requirement: Status without an app

The server SHALL offer `office_status`, a read-only tool that takes no arguments and answers without starting an app.
It SHALL report the folder the apps work in and, per app, whether it is installed and whether it runs.

#### Scenario: Probe in a fresh folder

- **WHEN** `office_status` is called with `{}` and no app is installed
- **THEN** it answers without `isError`, and no app process starts

### Requirement: Replies survive the end of input

When stdin closes, the server SHALL finish the calls in flight and SHALL leave the process only after everything it has
written to stdout has been flushed.

#### Scenario: Close with a request in flight

- **WHEN** the client sends `ping` and closes stdin in the same write
- **THEN** the `ping` reply arrives before the process exits
