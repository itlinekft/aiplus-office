/**
 * Executes every skill recipe once against real binaries (opt-in; downloads the apps on first use, needs jq):
 *
 *   AIPLUS_OFFICE_E2E=1 [AIPLUS_OFFICE_E2E_HOME=~/.cache/aiplus-office] vitest run skills-recipes
 *   AIPLUS_OFFICE_E2E=1 AIPLUS_OFFICE_E2E_SKILLS=office-gridcraft,office-deck vitest run skills-recipes   # subset
 *
 * A recipe is a code fence tagged `recipe: <id>`; it runs under `bash -e -o pipefail` in a fresh tmp dir with
 * `aiplus-office` on PATH (the repo's `cli/aiplus-office` launcher), so it passes only if every command exits 0 including
 * its closing `aiplus-office verify`. Ported from upstream skills-recipes.test.ts. See change: office-plugin-v1 (6.4).
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";
import { ALL_SKILL_NAMES, fences, loadSkill, PKG_DIR } from "./helpers/skills.js";

const enabled = !!process.env.AIPLUS_OFFICE_E2E;
const only = process.env.AIPLUS_OFFICE_E2E_SKILLS?.split(",").filter(Boolean);
afterAll(cleanupTmp);

const binDir = tmpDir("office-recipe-bin-");
fs.symlinkSync(path.join(PKG_DIR, "cli", "aiplus-office"), path.join(binDir, "aiplus-office"));
const cache = process.env.AIPLUS_OFFICE_E2E_HOME ?? tmpDir("office-recipe-cache-");

for (const name of ALL_SKILL_NAMES) {
  if (only && !only.includes(name)) continue;
  const recipes = fences(loadSkill(name).body).filter((f) => f.recipe);
  if (recipes.length === 0) continue; // office-start has no recipe (it never makes a file)
  describe.skipIf(!enabled)(`${name} recipes (real binaries)`, () => {
    for (const r of recipes) {
      it(`recipe ${r.recipe} runs and verifies`, () => {
        const cwd = tmpDir("office-recipe-");
        const res = spawnSync("bash", ["-e", "-o", "pipefail", "-c", r.code], {
          cwd,
          encoding: "utf8",
          env: { ...process.env, PATH: `${binDir}:${process.env.PATH}`, NODE_OPTIONS: "", AIPLUS_OFFICE_HOME: cache },
          timeout: 400_000,
          maxBuffer: 64 * 1024 * 1024,
        });
        expect(res.status, `stdout:\n${res.stdout}\nstderr:\n${res.stderr}`).toBe(0);
      }, 420_000);
    }
  });
}
