## ADDED Requirements

### Requirement: Never wait on a download

The proxy SHALL read the client's messages from its start and provision the app in the background. When the app's
server has not answered the client's `initialize` within 2 s of its arrival (the app is downloading, or the server
starts slowly), the proxy SHALL answer `initialize` itself with the client's protocol version when supported and
`capabilities.tools.listChanged: true`, answer `ping`, list one `<app>_status` tool, and answer every other
`tools/call` with a tool error, Hungarian first, then English. When the server is ready the proxy SHALL initialize it
with the client's own `initialize` parameters, switch to pass-through and send `notifications/tools/list_changed`. A
server that answers within the 2 s SHALL answer the client itself, as before. A failed provisioning SHALL NOT end the
proxy: every `tools/call` returns the error, Hungarian first, then English, until the client closes its input, then
the proxy exits 69. Diagnostics SHALL go to stderr only. The GridCraft gateway SHALL apply unchanged after the switch.

#### Scenario: First use, nothing installed

- **WHEN** a client sends `initialize` while the app is still downloading
- **THEN** the proxy answers it within 2 s, `tools/list` holds only `<app>_status`, a `tools/call` returns „A(z) <App>
  letöltése folyamatban, pár perc múlva próbáld újra.” followed by the English text, and once the server runs the
  client gets `notifications/tools/list_changed` and the server's tools

#### Scenario: Slow first start of an installed server

- **WHEN** the server answers its `initialize` only after the 2 s
- **THEN** the client was already answered by the proxy, the server's late answer is not passed on, and the client
  gets `notifications/tools/list_changed`

#### Scenario: Installed app, quick start

- **WHEN** the server answers `initialize` within the 2 s
- **THEN** the client receives the server's own answer and no `notifications/tools/list_changed`

#### Scenario: Download fails

- **WHEN** provisioning fails after the client connected
- **THEN** `initialize` is still answered, every `tools/call` returns the error, and the proxy runs until its input
  closes, then exits 69
