/**
 * Build the self-contained CLI bundle `dist/aiplus-office.mjs` with esbuild (`yaml` and `fflate` inlined).
 *
 * The bundle is committed: a Claude plugin installed from a marketplace is a git checkout with no `node_modules`,
 * so skills and `.mcp.json` run `node ${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs`. The packaging test rebuilds
 * into a temp file and fails when the committed bundle differs. Run `npm run build` after any change under `src/`.
 *
 * Ported from upstream `scripts/build.mjs`. See change: office-plugin-v1 (design D5).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = process.argv[2] ?? join(root, "dist", "aiplus-office.mjs");

await build({
  entryPoints: [join(root, "src", "bin", "aiplus-office.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  external: [],
  outfile,
  // `yaml` is CommonJS: its bundled `require("process")` etc. need a real require in an ESM bundle.
  banner: { js: '#!/usr/bin/env node\nimport { createRequire as __officeRequire } from "node:module";\nconst require = __officeRequire(import.meta.url);' },
  legalComments: "none",
  logLevel: process.argv[2] ? "warning" : "info",
});
