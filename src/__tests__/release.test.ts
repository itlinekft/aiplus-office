/**
 * scripts/release.mjs (spec plugin-release): build from a commit through the allow-list, one version source, staging
 * into a marketplace clone that keeps its other entries, and the leak-scan gate (stub scanners). Offline: the repos
 * are temporary git repositories built from this checkout's files. See change: office-release-marketplace.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
// @ts-expect-error -- plain ESM script without types
import { build, PLUGIN, stage, updateReadme } from "../../scripts/release.mjs";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";
import { REPO_ROOT } from "./helpers/paths.js";

afterAll(cleanupTmp);

const SOURCES = [
  "package.json", "CHANGELOG.md", "src/bin/aiplus-office.ts", ".claude-plugin/plugin.json", ".claude-plugin/marketplace.json",
  "release/mcp.json", "dist/aiplus-office.mjs", "LICENSE", "NOTICE", "release/README.md", "release/NOTICE", "README.md", "src/registry.ts", "docs/x.md", "TROUBLESHOOTING.md", "docs/user-guide.md", "hooks/hooks.json", "hooks/session-context.md",
  ...fs.readdirSync(path.join(REPO_ROOT, "skills")).map((s) => `skills/${s}/SKILL.md`),
];

function sh(cwd: string, cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.invalid", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.invalid" } });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
}

/** A temp repo holding this checkout's release inputs (plus a doc and a source that must not ship), committed. */
function sourceRepo(): string {
  const d = tmpDir("office-rel-src-");
  for (const f of SOURCES) {
    const dest = path.join(d, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (f === "docs/x.md") fs.writeFileSync(dest, "internal doc\n");
    else fs.copyFileSync(path.join(REPO_ROOT, f), dest);
  }
  sh(d, "git", ["init", "-q", "-b", "main"]);
  sh(d, "git", ["add", "-A"]);
  sh(d, "git", ["commit", "-q", "-m", "x"]);
  return d;
}

function marketplace(): string {
  const d = tmpDir("office-rel-mp-");
  fs.mkdirSync(path.join(d, ".claude-plugin"));
  const mp = { name: "m", owner: { name: "o" }, plugins: [{ name: "aiplus", source: "./plugins/aiplus", version: "9.9.9", description: "Meglévő." }] };
  fs.writeFileSync(path.join(d, ".claude-plugin", "marketplace.json"), `${JSON.stringify(mp, null, 2)}\n`);
  fs.writeFileSync(path.join(d, "README.md"), "# M\n\n| Plugin | Product | What |\n|---|---|---|\n| `aiplus` | A | B |\n\nText.\n");
  sh(d, "git", ["init", "-q", "-b", "main"]);
  sh(d, "git", ["add", "-A"]);
  sh(d, "git", ["commit", "-q", "-m", "base"]);
  return d;
}

function scanner(exit: number): string {
  const f = path.join(tmpDir("office-rel-scan-"), "scan");
  fs.writeFileSync(f, `#!/bin/sh\necho "stub scan $*"\nexit ${exit}\n`, { mode: 0o755 });
  return f;
}

describe("build from a commit", () => {
  it("ships exactly the allow-list, README from release/README.md, from the commit and not the working tree", () => {
    const repo = sourceRepo();
    fs.appendFileSync(path.join(repo, "skills", "office-router", "SKILL.md"), "\nUNCOMMITTED\n");
    const out = path.join(tmpDir("office-rel-out-"), PLUGIN);
    const b = build({ repo, out });
    expect(b.sha).toMatch(/^[0-9a-f]{40}$/);
    const files = (b.files as string[]).slice().sort();
    expect(files).toEqual([".claude-plugin/plugin.json", ".mcp.json", "LICENSE", "NOTICE", "README.md", "TROUBLESHOOTING.md", "USER-GUIDE.md", "dist/aiplus-office.mjs", "hooks/hooks.json", "hooks/session-context.md", ...fs.readdirSync(path.join(REPO_ROOT, "skills")).map((s) => `skills/${s}/SKILL.md`)].sort());
    expect(fs.readFileSync(path.join(out, "README.md"), "utf8")).toBe(fs.readFileSync(path.join(REPO_ROOT, "release", "README.md"), "utf8"));
    expect(fs.readFileSync(path.join(out, "skills", "office-router", "SKILL.md"), "utf8")).not.toContain("UNCOMMITTED");
    expect(fs.readFileSync(path.join(out, "NOTICE"), "utf8")).toBe(fs.readFileSync(path.join(REPO_ROOT, "release", "NOTICE"), "utf8"));
    expect(fs.readFileSync(path.join(out, "NOTICE"), "utf8")).toContain("Copyright (c) 2026 Robert Csakany");
    expect(fs.readFileSync(path.join(out, "USER-GUIDE.md"), "utf8")).toBe(fs.readFileSync(path.join(REPO_ROOT, "docs", "user-guide.md"), "utf8")); // the user guide ships at the root (C19 R7)
    for (const bad of ["src", "docs", "release", "package.json", "CHANGELOG.md"]) expect(fs.existsSync(path.join(out, bad)), bad).toBe(false);
  });

  it("refuses on version drift, naming the drifting source", () => {
    const repo = sourceRepo();
    const p = path.join(repo, ".claude-plugin", "plugin.json");
    fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/"version": "[^"]+"/, '"version": "9.9.9"'));
    sh(repo, "git", ["commit", "-q", "-am", "drift"]);
    expect(() => build({ repo, out: path.join(tmpDir(), "o") })).toThrow(/version drift.*plugin\.json = 9\.9\.9/);
  });
});

describe("stage into a marketplace clone", () => {
  it("adds the plugin, keeps the existing entry, adds the README row once, stages the index, never commits", () => {
    const repo = sourceRepo();
    const out = path.join(tmpDir(), PLUGIN);
    const built = build({ repo, out });
    const mp = marketplace();
    const before = sh(mp, "git", ["rev-parse", "HEAD"]);
    for (let i = 0; i < 2; i++) stage({ built, staging: out, dir: mp, leakscan: scanner(0), validate: false, log: () => {} });
    const m = JSON.parse(fs.readFileSync(path.join(mp, ".claude-plugin", "marketplace.json"), "utf8"));
    expect(m.plugins[0]).toEqual({ name: "aiplus", source: "./plugins/aiplus", version: "9.9.9", description: "Meglévő." });
    expect(m.plugins[1]).toMatchObject({ name: PLUGIN, source: `./plugins/${PLUGIN}`, version: built.version });
    // One description source: the marketplace entry is plugin.json's text at the commit (change office-first-run).
    expect(m.plugins[1].description).toBe(JSON.parse(fs.readFileSync(path.join(REPO_ROOT, ".claude-plugin", "plugin.json"), "utf8")).description);
    expect(m.plugins).toHaveLength(2);
    const readme = fs.readFileSync(path.join(mp, "README.md"), "utf8");
    expect(readme.split(`| \`${PLUGIN}\` |`).length - 1).toBe(1);
    expect(readme).toMatch(/AI\+ Iroda · AI\+ Office \(ingyenes · free\) .*in a plain Chat it works in Documents › „AI\+ Iroda”, in a folder of your choice in Claude Code/); // bilingual row (office-first-run)
    expect(readme.indexOf("`aiplus`")).toBeLessThan(readme.indexOf(`\`${PLUGIN}\``));
    expect(fs.existsSync(path.join(mp, "plugins", PLUGIN, "dist", "aiplus-office.mjs"))).toBe(true);
    expect(sh(mp, "git", ["rev-parse", "HEAD"])).toBe(before);
    expect(sh(mp, "git", ["diff", "--cached", "--name-only"])).toContain(`plugins/${PLUGIN}/.claude-plugin/plugin.json`);
  });

  it("a leak-scan finding refuses and leaves nothing in the index; a missing scanner refuses too", () => {
    const repo = sourceRepo();
    const out = path.join(tmpDir(), PLUGIN);
    const built = build({ repo, out });
    const mp = marketplace();
    expect(() => stage({ built, staging: out, dir: mp, leakscan: scanner(1), validate: false, log: () => {} })).toThrow(/refused the staged tree/);
    expect(sh(mp, "git", ["diff", "--cached", "--name-only"]).trim()).toBe("");
    expect(() => stage({ built, staging: out, dir: mp, leakscan: "/nonexistent/set-leakscan", validate: false, log: () => {} })).toThrow(/not installed/);
  });

  it("the marketplace README sentence about engines is rewritten so it is true for both plugins", () => {
    const before = "| Plugin | P | W |\n|---|---|---|\n| `aiplus` | A | B |\n\nA plugin here is only the Claude-side half. It works with its product's engine, which its own installer puts on the\ncomputer.\n";
    const after = updateReadme(before);
    expect(after).not.toContain("only the Claude-side half");
    expect(after).toContain("`aiplus-office` needs no installer: it downloads the ArtCraft apps itself on first use.");
    expect(updateReadme(after)).toBe(after);
  });

  it("updateReadme leaves a README without a plugin table unchanged", () => {
    expect(updateReadme("# x\n\nno table\n")).toBe("# x\n\nno table\n");
  });
});
