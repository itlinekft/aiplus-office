## ADDED Requirements

### Requirement: Plain Chat folder

When `--root` is exactly the unsubstituted `${CLAUDE_PROJECT_DIR}` (a client without a project folder, such as Claude
Desktop's plain Chat), the proxy SHALL confine the server to the chat folder instead of refusing: `AIPLUS_OFFICE_CHAT_ROOT`
when set, else „AI+ Iroda” inside the user's Documents folder (OneDrive's Documents when that exists), else inside the
home folder. It SHALL create the folder and name it on stderr. Any other unsubstituted variable in `--root` SHALL still be
refused before provisioning.

#### Scenario: A plain Chat starts the connectors

- **WHEN** a server is started with `--root ${CLAUDE_PROJECT_DIR}` unsubstituted
- **THEN** it runs confined to `<Documents>/AI+ Iroda`, which now exists, and stderr says „no project folder from the
  client (plain Chat): files go to …”

#### Scenario: Another unsubstituted variable

- **WHEN** `--root` is `${CLAUDE_PROJECT_DIR}/x` or `${HOME}`
- **THEN** the proxy refuses to start and spawns nothing
