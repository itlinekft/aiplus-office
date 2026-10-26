## ADDED Requirements

### Requirement: Missing Node.js routed to the offer

The session note and the router SHALL say that when Node.js is missing `office-start` offers to install it, only after
the user's yes.

#### Scenario: Node.js missing at a session's start

- **WHEN** a session starts on a computer without Node.js and the user asks for an office file
- **THEN** the router stops and hands over to `office-start`, which offers the install
