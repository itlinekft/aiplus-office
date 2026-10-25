/**
 * Drift check against REAL binaries: every command id quoted in an app skill's code fences must exist in the app's
 * live command list (the version `aiplus-office` provisions — latest unless AIPLUS_OFFICE_<APP>_VERSION pins one).
 * Workflow skills are checked against the union of the live lists of the apps they drive. The offline variant
 * (recorded fixtures) lives in skills.test.ts.
 *
 *   AIPLUS_OFFICE_E2E=1 [AIPLUS_OFFICE_E2E_HOME=~/.cache/aiplus-office] vitest run skills-drift
 *
 * Ported from upstream skills-drift.test.ts. See change: office-plugin-v1 (4.4).
 */
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { extractCommandIds } from "../command-ids.js";
import { CRAFT_APPS } from "../registry.js";
import { OFFICE_CLI, TSX } from "./helpers/paths.js";
import { fences, loadSkill, quotedIds, unknownIdsAgainst, WORKFLOW_APPS, WORKFLOW_SKILL_NAMES } from "./helpers/skills.js";

const enabled = !!process.env.AIPLUS_OFFICE_E2E;
const cacheEnv = process.env.AIPLUS_OFFICE_E2E_HOME ? { AIPLUS_OFFICE_HOME: process.env.AIPLUS_OFFICE_E2E_HOME } : {};
const run = (args: string[]) =>
  spawnSync(process.execPath, ["--import", TSX, OFFICE_CLI, ...args], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, env: { ...process.env, NODE_OPTIONS: "", ...cacheEnv }, timeout: 300_000 });

describe("extractCommandIds", () => {
  it("reads JSON rows (id, name, aliases) and text tables", () => {
    expect(extractCommandIds('[{"id":"a.b","aliases":["ab"]},{"name":"tool_x"}]')).toEqual(["a.b", "ab", "tool_x"]);
    expect(extractCommandIds("file.new   New\n  params: {}\nedit.undo*  Undo\n")).toEqual(["edit.undo", "file.new"]);
    expect(extractCommandIds("")).toEqual([]);
  });
});

describe.skipIf(!enabled)("skills vs live command lists (real binaries)", () => {
  for (const app of CRAFT_APPS) {
    it(`${app.id}: every quoted id exists in the live command list`, () => {
      const list = run([app.id, "exec", ...app.dialect.list]);
      expect(list.status, list.stderr).toBe(0);
      const live = new Set(extractCommandIds(list.stdout));
      expect(live.size, `${app.id} listed no commands`).toBeGreaterThan(10);
      const namespaces = new Set([...live].map((i) => i.split(".")[0]));
      const version = /(\d+\.\d+\.\d+)/.exec(run([app.id, "exec", "--version"]).stdout)?.[1] ?? "unknown";
      for (const f of fences(loadSkill(`office-${app.id}`).body)) {
        for (const id of quotedIds(f.code, namespaces)) expect(live.has(id), `${app.id} skill quotes "${id}", unknown to ${app.id} ${version}`).toBe(true);
      }
    }, 320_000);
  }
});

describe.skipIf(!enabled)("workflow skills vs live command lists (real binaries)", () => {
  const liveCache = new Map<string, Set<string>>();
  const live = (appId: string): Set<string> => {
    let ids = liveCache.get(appId);
    if (!ids) {
      const app = CRAFT_APPS.find((a) => a.id === appId);
      if (!app) throw new Error(`unknown app ${appId}`);
      const list = run([app.id, "exec", ...app.dialect.list]);
      expect(list.status, list.stderr).toBe(0);
      ids = new Set(extractCommandIds(list.stdout));
      liveCache.set(appId, ids);
    }
    return ids;
  };
  for (const name of WORKFLOW_SKILL_NAMES) {
    it(`${name}: every quoted id exists in the union of ${WORKFLOW_APPS[name].join("+")}`, () => {
      const known = new Set<string>();
      for (const appId of WORKFLOW_APPS[name]) for (const id of live(appId)) known.add(id);
      const namespaces = new Set([...known].map((i) => i.split(".")[0]));
      const unknown = unknownIdsAgainst(loadSkill(name).body, known, namespaces);
      expect(unknown, `${name} quotes ids unknown to ${WORKFLOW_APPS[name].join("+")}`).toEqual([]);
    }, 320_000);
  }
});
