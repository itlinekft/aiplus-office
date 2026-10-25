# Security

## What this plugin does on your machine

- **Downloads** the ArtCraft office app CLIs from `https://github.com/storytold/<app>/releases` (GitHub API at
  `api.github.com`), only when an app is first used or `install` is run. No other network access.
- **Verifies** every archive against the release's `SHA256SUMS.txt` before extracting it (fail closed: no sums file, no
  entry or a mismatch aborts). The download URLs must stay on the repository's own release path. The checksum proves
  the file is the one the release published; it does not prove who built it (macOS Gatekeeper is consulted and
  reported, advisory only).
- **Extracts** into a staging folder after listing the archive; absolute paths, `..`, symlinks, hard links and devices
  are refused, and the extracted tree is checked again before an atomic move into the cache.
- **Runs** the CLIs with argument arrays, never through a shell.
- **MCP**: only WordCraft and PdfCraft are registered, confined to the project folder for reads and writes. GridCraft
  and DeckCraft MCP servers have no confinement and are not registered; starting them needs `--allow-unconfined`.
  Options that would attach to a running desktop app (`--bridge`, `--connect`, `--control-token`) are refused.
- **`doc prepare`** treats Markdown and frontmatter as untrusted: template names are a strict token, `templates_dir` and
  image paths are confined to the Markdown's folder (or `--allow-path`), DOCX parts are edited in memory with
  re-escaped values, `mmdc` is spawned without a shell.
- **Passwords** for protected PDFs go through a `0600` temp file outside the project that is deleted at once; the skills
  never write them to job files or reports.

## What it does not protect against

The ArtCraft apps themselves run with your user's rights. A malicious document could exploit a bug in an app; the apps
are early alpha. Process untrusted files in a folder that holds nothing else.

## Reporting

Report a security problem privately to ITLine Kft. (not in a public issue). Problems in the apps themselves belong to the
storytold projects; problems in the upstream package to its maintainers (see UPSTREAM.md).
