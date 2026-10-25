# aiplus-office — notes for agents

- **Language:** English for docs, code comments and commits. Skill trigger phrases may carry Hungarian office words
  (árajánlat, díjbekérő, árlista, szerződés, jelenléti ív, prezentáció, táblázat), unsuffixed.
- **Commit with a pathspec:** `git commit -q -F - -- <paths>`; never `git add -A` or `git add .`.
- **OpenSpec first:** a behaviour change is a change under `openspec/changes/` (proposal, spec, tasks tagged
  `[REQ: …]`) before code.
- **Rebuild the bundle:** after any change under `src/`, `npm run build`; the packaging test fails on a stale
  `dist/aiplus-office.mjs`.
- **No `bin/` directory** at the root (Cowork and claude.ai refuse such a plugin). The command lives in `dist/` and
  `cli/`.
- **Upstream:** the only code source is the MIT package named in `UPSTREAM.md`; record what you take there.
  Keep the MIT notice.
- **Public repository:** nothing internal goes in (no client or partner names, no prices, no machine names or home
  paths); run `set-leakscan` before a push. No client names; examples use invented
  "Minta …" companies. Banned claims: „anonimizált", „100%", „GDPR-tanúsított/-megfelelő", „nem megy ki adat".
- **Measure, don't assume:** a claim about the apps goes into `docs/MEASURED.md` with the date, versions and commands.
