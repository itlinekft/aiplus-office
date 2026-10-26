## Why

The owner, 2026-10-26 (meeting): „Sokkal jobb az, ha van egy leírás, és az ő Claude-juk installálja, vagy mi mutatunk
olyan oldalakra, ahonnan letöltheti”; „amikor installál, akkor majd a Claude úgyis segít neki, hogy mit kell
feltelepíteni”; no installer of our own for the free module („letölthető exe-t … azt nem szeretik az emberek”); then
„mehet a node install a modulba”.

Node.js is the module's one prerequisite, and until now the user had to install it before anything else. The plugin
itself installs without it, and the session note and the skills are text, so a session on a computer without Node.js
can already find out it is missing. Measured on the second Windows 11 test PC: `winget` 1.29 is on PATH and offers
`OpenJS.NodeJS.LTS` 24.22.1 from `https://nodejs.org/dist/…-x64.msi` with its SHA-256.

## What Changes

- `office-start`: when Node.js is missing (and not merely unseen), offer to install it with answer buttons; on a yes,
  on Windows with `winget install --id OpenJS.NodeJS.LTS -e --source winget …`, on macOS with `brew install node`;
  otherwise, or in a plain Chat, the nodejs.org link. Afterwards: quit Claude fully, restart, Reconnect.
- The session note and the router point a missing Node.js to that offer.
- The user guide says Claude offers it. Version 0.1.20; also ships the „on some computers” cache-folder correction.

## Capabilities

office-onboarding, office-skills
