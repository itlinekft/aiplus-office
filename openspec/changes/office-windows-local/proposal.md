## Why

A Windows 11 test PC measured 0.1.0 on 2026-10-24 (Claude Desktop 3.6556, driven with desktape, 21:46–21:53):

1. **A Cowork session that ran in the cloud could not download the apps.** It asked GridCraft for an XLSX; the download
   from `github.com/storytold/gridcraft` failed in the cloud sandbox (3 of 6 commands failed) and no file was made. The
   plugin's copy says „Excel- és PowerPoint-fájlhoz Cowork vagy Claude Code kell”, which is wrong for such a session.
2. **A local Claude Code session works** (Claude Desktop, environment „This computer”): an XLSX made and read back in
   about a minute.
3. **Git Bash's `tar` breaks the Windows download.** The first attempt from Git Bash hung while extracting; Git's GNU
   tar mishandles the `C:` path. Through PowerShell (Windows' own `tar.exe`) it worked. The plugin calls `tar.exe`
   from PATH, so in Git Bash it can pick up Git's.

The macOS CLI and apps were measured on an Apple M4 Mac on 2026-10-25 (`docs/MEASURED.md`); Claude Desktop on
the Mac and Cowork on the user's own computer are not tested.

## What Changes

- Provisioning on Windows calls `%SystemRoot%\System32\tar.exe` (SystemRoot from the environment, `C:\Windows`
  otherwise), never a `tar` found on PATH.
- The copy says what the measurements say: Excel and PowerPoint need Claude running on the user's own computer,
  Claude Code, or in Claude Desktop a session whose environment is „This computer”; a cloud session cannot download
  the apps. Plugin description (= marketplace entry), public and repository README, `office-router`, `office-start`
  (surfaces block and table, the one tested block, the close), CHANGELOG. Hungarian first, then English.
- `office-start` says plainly that an app already installed on the computer can be used instead of a download
  (`AIPLUS_OFFICE_<APP>_BIN`), with the GridCraft desktop app's command-line tool as the example.
- No em dash in any skill description (ITLine copy gate H2).
- Version 0.1.3; the release staged into the local marketplace clone only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `office-cli`: Windows archives are listed and extracted with the system's own `tar.exe`.
- `office-onboarding`: the surface line, the readiness fallback and the tested block follow the measurements; an
  installed app can be reused.

## Impact

`src/provision.ts` and its tests, the bundle, `.claude-plugin/plugin.json`, `package.json`, READMEs, three skills'
text, the tests that pin the old wording, `CHANGELOG.md`, `docs/MEASURED.md`.
