# plugin-release Specification

## Purpose
Build the distributable aiplus-office plugin from a git commit through an allow-list and stage it into a local clone of
the public AI+ marketplace, refusing on version drift or a leak-scan finding.

## Requirements

### Requirement: Build from a commit

The release step SHALL read every file from a named commit (default `HEAD`) through git, never from the working tree,
and SHALL record the commit sha in its output.

#### Scenario: Uncommitted edit is not shipped

- **WHEN** a skill is edited but not committed and the release runs on `HEAD`
- **THEN** the staged plugin holds the committed version of that skill

### Requirement: Allow-list only

The built plugin SHALL contain only `.claude-plugin/plugin.json`, `.mcp.json` (from `release/mcp.json`),
`dist/aiplus-office.mjs`, the files under `skills/`, `LICENSE`, and the public `README.md` and `NOTICE` (from
`release/`); no tests, sources, OpenSpec, docs or scratch files.

#### Scenario: No test or doc file

- **WHEN** the staged tree is listed
- **THEN** it holds no `src/`, `openspec/`, `docs/`, `node_modules/` or `*.test.ts`

#### Scenario: The server list is shipped under its plugin name

- **WHEN** the release builds from a commit that has `release/mcp.json`
- **THEN** the built plugin has `.mcp.json` with the same bytes

### Requirement: One version source

The release SHALL refuse when `package.json`'s version differs from `plugin.json`, the dev `marketplace.json` entry, the
CLI's `VERSION`, or the first `## <version>` heading of `CHANGELOG.md`, all read at the commit.

#### Scenario: Drift

- **WHEN** `plugin.json` says 0.1.1 and `package.json` 0.1.0
- **THEN** the release exits non-zero naming both and stages nothing

### Requirement: Stage into the marketplace clone

With `--stage <dir>` the release SHALL replace `<dir>/plugins/aiplus-office/` with the built plugin, add or update only
the `aiplus-office` entry of `<dir>/.claude-plugin/marketplace.json` (other entries byte-for-byte unchanged in content),
and add its row to the marketplace README once. It SHALL NOT commit or push.

#### Scenario: Existing entry kept

- **WHEN** the marketplace already lists `aiplus`
- **THEN** after staging the `aiplus` entry is unchanged and `aiplus-office` is listed with source `./plugins/aiplus-office`

### Requirement: Leak scan gate

After staging the release SHALL run `set-leakscan` over the staged files and SHALL refuse (non-zero exit, staged paths
removed from the index) on any finding; when `set-leakscan` is not installed it SHALL refuse unless `--no-leakscan` is
given, and say so.

#### Scenario: Finding

- **WHEN** the leak scan exits 1
- **THEN** the release exits non-zero and prints the scan's masked findings
