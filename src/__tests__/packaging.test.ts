/**
 * Plugin packaging (spec plugin-packaging): manifests and version parity, the committed bundle equals a fresh build and
 * runs with no node_modules, `.mcp.json` registers confined apps only, no top-level `bin/`, licence and attribution.
 * Rewritten for the Claude plugin (upstream packaging.test.ts checked an npm tarball). See change: office-plugin-v1 (5.x).
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { VERSION } from "../bin/aiplus-office.js";
import { CRAFT_APPS } from "../registry.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";
import { REPO_ROOT } from "./helpers/paths.js";

afterAll(cleanupTmp);
const read = (rel: string) => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
const json = (rel: string) => JSON.parse(read(rel));
const BUNDLE = path.join(REPO_ROOT, "dist", "aiplus-office.mjs");

describe("manifests", () => {
  it("plugin.json, marketplace.json, package.json, the CLI VERSION and the CHANGELOG head carry one version", () => {
    const v = json("package.json").version;
    expect(json(".claude-plugin/plugin.json").version).toBe(v);
    const entry = json(".claude-plugin/marketplace.json").plugins.find((p: { name: string }) => p.name === "aiplus-office");
    expect(entry).toMatchObject({ source: "./", version: v });
    expect(VERSION).toBe(v);
    expect(read("CHANGELOG.md")).toMatch(new RegExp(`^## ${v.replace(/\./g, "\\.")} `, "m"));
  });

  it("plugin.json names the plugin by its working id, with author and licence", () => {
    expect(json(".claude-plugin/plugin.json")).toMatchObject({ name: "aiplus-office", license: "MIT", author: { name: "ITLine Kft." } });
  });

  it("no top-level bin/ directory (claude.ai and Cowork refuse to install such a plugin)", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "bin"))).toBe(false);
  });
});

describe(".mcp.json", () => {
  const servers = json(".mcp.json").mcpServers as Record<string, { command: string; args: string[] }>;

  it("registers the four apps, all confined (GridCraft by the gateway), PdfCraft compact, rooted at the project (change office-mcp-grid-deck)", () => {
    expect(Object.keys(servers).sort()).toEqual(["aiplus-office-deckcraft", "aiplus-office-gridcraft", "aiplus-office-pdfcraft", "aiplus-office-wordcraft"]);
    for (const [name, s] of Object.entries(servers)) {
      expect(s.command).toBe("node");
      expect(s.args[0]).toBe("${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs");
      expect(s.args.slice(2, 5), name).toEqual(["mcp", "--root", "${CLAUDE_PROJECT_DIR}"]);
      expect(s.args.join(" ")).not.toMatch(/--allow-unconfined/);
      expect(name).toBe(`aiplus-office-${s.args[1]}`);
      const app = CRAFT_APPS.find((a) => a.id === s.args[1]);
      expect(app?.mcp.confinement, name).not.toBe(false);
    }
    expect(servers["aiplus-office-pdfcraft"].args).toContain("--compact");
  });
});

describe("bundle", () => {
  it("the committed dist/aiplus-office.mjs equals a fresh build of the sources (run `npm run build`)", () => {
    const out = path.join(tmpDir("office-build-"), "aiplus-office.mjs");
    const r = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts", "build.mjs"), out], { encoding: "utf8" });
    expect(r.status, r.stderr).toBe(0);
    expect(fs.readFileSync(out, "utf8") === fs.readFileSync(BUNDLE, "utf8"), "dist/aiplus-office.mjs is stale: run `npm run build`").toBe(true);
  });

  it("runs from a copy with no node_modules: --version, apps, doc prepare --help (yaml + fflate bundled)", () => {
    const dir = tmpDir("office-plain-");
    fs.mkdirSync(path.join(dir, "dist"));
    fs.copyFileSync(BUNDLE, path.join(dir, "dist", "aiplus-office.mjs"));
    const run = (...a: string[]) => spawnSync(process.execPath, [path.join(dir, "dist", "aiplus-office.mjs"), ...a], { encoding: "utf8", cwd: dir, env: { PATH: process.env.PATH, HOME: dir } });
    expect(run("--version").stdout).toBe(`aiplus-office ${VERSION}\n`);
    expect(run("apps", "--json").status).toBe(0);
    const doc = run("doc", "prepare", "--help");
    expect(doc.status).toBe(0);
    expect(doc.stderr).toContain("--allow-missing");
  });

  it("the cli/aiplus-office launcher starts", () => {
    const r = spawnSync(process.execPath, [path.join(REPO_ROOT, "cli", "aiplus-office"), "--version"], { encoding: "utf8" });
    expect(r.stdout).toBe(`aiplus-office ${VERSION}\n`);
  });
});

const FOOTER_HU = "A Word, az Excel és a PowerPoint a Microsoft védjegyei; az ArtCraft programjai nem a Microsoft termékei, és ez a modul nem kapcsolódik hozzájuk.";
const FOOTER_EN = "Word, Excel and PowerPoint are trademarks of Microsoft; the ArtCraft programs are not Microsoft products, and this module is not affiliated with them.";

describe("public copy", () => {
  it("shipped files carry no working-name or Office-replacement wording; Microsoft only in the trademark footer", () => {
    const shipped = ["release/README.md", "release/NOTICE", ".claude-plugin/plugin.json", ...fs.readdirSync(path.join(REPO_ROOT, "skills")).map((s) => `skills/${s}/SKILL.md`)];
    for (const f of shipped) {
      const t = read(f);
      // „AI+ Office” is the English name since 0.1.9 (ITLine naming decision); the Office-replacement wording stays banned.
      for (const bad of [/munkanév/i, /Office nélkül/i, /without (Microsoft )?Office/i, /Microsoft Office/]) expect(t, `${f} ${bad}`).not.toMatch(bad);
      const ms = t.split("\n").filter((l) => /Microsoft/.test(l));
      for (const l of ms) expect([FOOTER_HU, FOOTER_EN], `${f}: ${l}`).toContain(l);
    }
    expect(read("release/README.md")).toMatch(/early versions \(alpha\)/);
  });

  it("bilingual (change office-first-run): plugin.json description Hungarian then English, README with Magyarul first, both footers, Chat vs own computer said plainly (office-windows-local)", () => {
    const d = json(".claude-plugin/plugin.json").description as string;
    const [hu, en] = d.split(" English: ");
    expect(en, "plugin.json description: Hungarian first, then ' English: '").toBeDefined();
    expect(hu).toContain("A sima Chatben csak Word és PDF megy. Excel- és PowerPoint-fájlhoz a Claude-nak a saját gépeden kell futnia");
    expect(hu).toContain("a felhőben futó munkamenet nem tudja letölteni a programokat");
    expect(en).toContain("A plain Chat handles Word and PDF only. Excel and PowerPoint files need Claude running on your own computer");
    expect(en).toContain("a session running in the cloud cannot download the apps");
    expect(d).not.toMatch(/need Cowork|Cowork vagy/);
    for (const part of [hu, en]) expect(part).toMatch(/Node\.js 20/);
    const r = read("release/README.md");
    expect(r.indexOf("## Magyarul")).toBeGreaterThan(0);
    expect(r.indexOf("## Magyarul")).toBeLessThan(r.indexOf("## In English"));
    expect(r).toMatch(/Excel- és PowerPoint-fájlhoz a Claude-nak a saját\s+gépeden kell futnia/);
    expect(r).not.toMatch(/Cowork vagy|need(s)? \*\*Cowork/);
    expect(r).toContain("## What works where");
    expect(r).toContain(FOOTER_HU);
    expect(r).toContain(FOOTER_EN);
    expect(read("README.md")).toMatch(/Excel and PowerPoint files need Claude running on the user's own computer/);
  });

  it("no em dash as punctuation in the public user-facing texts (ITLine copy gate H2; ranges like 20–100 stay)", () => {
    const src = read("scripts/release.mjs");
    const row = /const README_ROW = `(.*)`;/.exec(src)?.[1] ?? "";
    const texts: Record<string, string> = {
      "plugin.json description": json(".claude-plugin/plugin.json").description,
      "release/README.md": read("release/README.md"),
      "skills/office-start/SKILL.md": read("skills/office-start/SKILL.md"),
      "marketplace README row": row,
    };
    expect(row.length).toBeGreaterThan(50);
    for (const [name, t] of Object.entries(texts)) {
      expect(t, name).not.toMatch(/—/);
      expect(t, name).not.toMatch(/ –|– /);
    }
  });
});

describe("licence and attribution", () => {
  it("LICENSE keeps the upstream copyright and the MIT permission notice next to ITLine's", () => {
    const l = read("LICENSE");
    expect(l).toContain("Copyright (c) 2026 ITLine Kft.");
    expect(l).toContain("Copyright (c) 2026 Robert Csakany");
    expect(l).toContain("Permission is hereby granted, free of charge");
  });

  it("NOTICE attributes the upstream MIT package; UPSTREAM.md records its licence and what was taken", () => {
    expect(read("NOTICE")).toContain("derived from an\nMIT-licensed package");
    expect(read("UPSTREAM.md")).toContain("Copyright (c) 2026 Robert Csakany");
    expect(read("UPSTREAM.md")).toContain("## Taken and adapted");
  });
});
