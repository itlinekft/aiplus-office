# Tasks

## 1. Release through the kit

- [x] 1.1 `.aiplus-release.json` from the kit's `examples/aiplus-office.json` [REQ: Build from a commit] [REQ: Allow-list only]
- [x] 1.2 Measured: the kit's build from a scratch commit equals `scripts/release.mjs`'s (19 files, byte for byte) [REQ: Allow-list only]
- [x] 1.3 `scripts/release.mjs` and `src/__tests__/release.test.ts` removed; the copy test reads the README row from the config [REQ: Build from a commit]
- [x] 1.4 README: the dev build line runs the kit with npx [REQ: Build from a commit]
- [ ] 1.5 After the commit: `aiplus-release --out <scratch>` builds 0.1.23 from it [REQ: Leak scan gate]
- [x] 1.7 Review findings folded in: the README says the tool is the maintainers' (npx, not in this repo) and how to build by hand without it [REQ: Build from a commit]
- [ ] 1.6 At the next version bump, a `CHANGELOG.md` line: the plugin is built by the family release kit (`.aiplus-release.json`) [REQ: Build from a commit]
