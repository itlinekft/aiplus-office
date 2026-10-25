# Tasks

## 1. Skills

- [x] 1.1 `office-router`: section „When the module cannot run” (stop, say why HU then EN, go to office-start, no file made another way, a plainly asked other tool said to be not AI+ Iroda) [REQ: No silent substitute]
- [x] 1.2 The four app skills: one line next to the command line pointing to that section [REQ: No silent substitute]
- [x] 1.3 `office-router` verify section: the module's own checks only, never `python` [REQ: Checks with the module's own tools]
- [x] 1.4 `office-router` copy rule: every file already in the folder, an earlier result included; new file unless asked to replace; `office-pdfcraft` protect recipe writes a new name [REQ: Earlier results kept]
- [x] 1.5 `office-start` step 2: Node.js at its usual places → quit Claude fully; after restart „Reconnect” on each connector (15-minute memory) [REQ: Node.js installed but not seen] [REQ: Cached connector failure explained]

## 2. Tests

- [x] 2.1 `skills.test.ts`: the router section and its four pointers, no `python` in any skill, the copy rule, office-start's two paragraphs in both languages [REQ: No silent substitute] [REQ: Checks with the module's own tools] [REQ: Earlier results kept] [REQ: Node.js installed but not seen] [REQ: Cached connector failure explained]

## 3. Release and measure

- [x] 3.1 Version 0.1.14, CHANGELOG; tests, typecheck, build, `claude plugin validate`; release to the marketplace [REQ: No silent substitute]
- [ ] 3.2 box2: fresh install (old plugin and marketplace removed), then a cloud chat and a local session without Node.js (no file made, office-start's text), then with Node.js (E1, W1, D1, P1–P2 with a new file) [REQ: No silent substitute] [REQ: Earlier results kept]
