## MODIFIED Requirements

### Requirement: Build from a commit

The release SHALL be built by the family kit's `aiplus-release`, run without installing it, from the committed
`.aiplus-release.json`; it SHALL read every file from a named commit (default `HEAD`) through git, never from the
working tree, and SHALL record the commit sha in its output.

#### Scenario: Uncommitted edit is not shipped

- **WHEN** a skill is edited but not committed and the release runs on `HEAD`
- **THEN** the staged plugin holds the committed version of that skill

### Requirement: Allow-list only

The built plugin SHALL contain only `.claude-plugin/plugin.json`, `.mcp.json` (from `release/mcp.json`),
`dist/aiplus-office.mjs`, the files under `skills/` and `hooks/`, `LICENSE`, `TROUBLESHOOTING.md`, `USER-GUIDE.md`
(from `docs/user-guide.md`), and the public `README.md` and `NOTICE` (from `release/`), as `.aiplus-release.json`
lists them; no tests, sources, OpenSpec, other docs or scratch files.

#### Scenario: No test or doc file

- **WHEN** the staged tree is listed
- **THEN** it holds no `src/`, `openspec/`, `docs/`, `node_modules/` or `*.test.ts`

#### Scenario: The server list is shipped under its plugin name

- **WHEN** the release builds from a commit that has `release/mcp.json`
- **THEN** the built plugin has `.mcp.json` with the same bytes

### Requirement: Leak scan gate

The release SHALL run `set-leakscan` over the built files before anything is staged and SHALL refuse (non-zero exit,
nothing staged) on any finding; when `set-leakscan` is not installed it SHALL refuse. There is no flag that skips the
scan.

#### Scenario: Finding

- **WHEN** the leak scan exits 1
- **THEN** the release exits non-zero and prints the scan's masked findings
