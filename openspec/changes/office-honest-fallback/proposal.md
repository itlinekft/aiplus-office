## Why

A Windows 11 test PC measured 0.1.12/0.1.13 on 2026-10-25/26 (Claude Desktop 3.6556, driven with desktape):

1. **A silent substitute.** In a Claude-mode chat that ran in the cloud, and later in a local session whose connectors
   had not started (no Node.js yet), Claude made the requested price list with a generic spreadsheet library instead of
   GridCraft. It said so, but the user asked for the module and got something else under its name.
2. **An office PC has no Python.** A correct GridCraft run was marked „Failed” because Claude closed it with a
   `python -c` check; Windows answered with the Store stub (exit 49).
3. **An earlier result overwritten.** „Vedd ki belőle az utolsó oldalt, és tegyél rá jelszót” replaced the merged
   three-page PDF made a minute before; the router's copy rule covers only the user's own originals.
4. **A cached connector failure.** After Node.js was installed and Claude restarted, the connectors still showed
   „Reconnect”: Claude Desktop keeps a failed connector for 15 minutes („recent failure cached”). The Reconnect button
   fixes it at once; nothing in the plugin says so.
5. **Node.js installed but not seen.** Claude started before Node.js was installed keeps the old PATH; `node --version`
   fails although Node.js is on the disk.

## What Changes

- `office-router` gets a section „When the module cannot run”: if the command line or an app fails because Node.js
  or the app is missing, the connector is not running, or the session runs in the cloud, the skill stops, says why in
  plain words (Hungarian first, then English) and goes to `office-start`; it never makes the file with another tool
  under the module's name. Only when the user then asks for it plainly may another tool make the file, said to be not
  AI+ Iroda.
- The four app skills point to that section next to the command line.
- Checks use the module's own tools (`aiplus-office verify`, `<app> exec eval`/`check`); never `python` or another
  interpreter an office PC may lack.
- The router's copy rule covers every file already in the folder, an earlier result included: a change writes a new
  file unless the user asks to replace it.
- `office-start`: when `node --version` fails it looks for Node.js at its usual places and, if found, says to quit
  Claude fully and start it again; after a restart, connectors that still show „Reconnect” are reconnected by hand
  (Claude remembers a failure for 15 minutes).
- Version 0.1.14.

## Capabilities

office-skills, office-onboarding
