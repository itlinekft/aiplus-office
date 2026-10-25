import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { main, VERSION } from "../bin/aiplus-office.js";
import type { ProvisionReport } from "../provision.js";
import { APP_IDS } from "../registry.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";
import { OFFICE_CLI, TSX } from "./helpers/paths.js";
import { ECHO_ARGV, nodeStub } from "./helpers/stubs.js";

afterEach(cleanupTmp);

const report = (app: string, binary: string): ProvisionReport => ({ app: app as ProvisionReport["app"], version: "0.7.0", source: "latest", asset: "a", cacheHit: false, binary, durationMs: 1 });

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, deps: { stdout: (t: string) => out.push(t), stderr: (t: string) => err.push(t) } };
}

function runCli(args: string[], env: NodeJS.ProcessEnv = {}, cwd?: string) {
  const base = { ...process.env, NODE_OPTIONS: "" } as NodeJS.ProcessEnv;
  for (const k of Object.keys(base)) if (k.startsWith("AIPLUS_OFFICE_")) delete base[k];
  return spawnSync(process.execPath, ["--import", TSX, OFFICE_CLI, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, cwd, env: { ...base, ...env }, timeout: 30_000 });
}

describe("dispatch", () => {
  it("no args, unknown subcommand and unknown app print usage listing subcommands and the 4 app ids, exit 1", async () => {
    for (const argv of [[], ["frobnicate"], ["paintcraft", "path"], ["photocraft", "path"]]) {
      const c = capture();
      expect(await main(argv, c.deps)).toBe(1);
      const text = c.err.join("");
      for (const name of ["apps", "status", "install", "verify", "doc prepare", "ensure", "exec", "mcp"]) expect(text).toContain(name);
      expect(text).not.toContain("launcher");
      for (const id of APP_IDS) expect(text).toContain(id);
    }
  });

  it("--help exits 0", async () => {
    const c = capture();
    expect(await main(["--help"], c.deps)).toBe(0);
    expect(c.err.join("")).toContain("aiplus-office <command>");
  });

  it("--version prints the package version", async () => {
    const c = capture();
    expect(await main(["--version"], c.deps)).toBe(0);
    expect(c.out.join("")).toBe(`aiplus-office ${VERSION}\n`);
  });

  it("<app> with an unknown subcommand is a usage error", async () => {
    const c = capture();
    expect(await main(["gridcraft", "dance"], c.deps)).toBe(1);
  });

  it("<app> path prints exactly one line with the binary path", async () => {
    const c = capture();
    expect(await main(["wordcraft", "path"], { ...c.deps, provision: async (id) => report(id, "/abs/wordcraft-cli") })).toBe(0);
    expect(c.out.join("")).toBe("/abs/wordcraft-cli\n");
  });

  it("<app> ensure prints the report as one JSON object", async () => {
    const c = capture();
    expect(await main(["deckcraft", "ensure"], { ...c.deps, provision: async (id) => report(id, "/abs/x") })).toBe(0);
    const text = c.out.join("");
    expect(text.trim().split("\n")).toHaveLength(1);
    expect(JSON.parse(text)).toMatchObject({ app: "deckcraft", binary: "/abs/x" });
  });

  it("provisioning failure prints the error and exits 69", async () => {
    const c = capture();
    const provision = async () => {
      throw new Error("checksum mismatch");
    };
    for (const sub of [["ensure"], ["path"], ["exec", "--version"]]) {
      expect(await main(["gridcraft", ...sub], { ...c.deps, provision })).toBe(69);
    }
    expect(c.err.join("")).toContain("aiplus-office: checksum mismatch");
  });
});

describe("doc dispatch", () => {
  it("E25 --help lists doc prepare; doc --help 0; doc / doc bogus 1; doc prepare without --out 2", async () => {
    const help = capture();
    expect(await main(["--help"], help.deps)).toBe(0);
    expect(help.err.join("")).toContain("doc prepare");
    const docHelp = capture();
    expect(await main(["doc", "--help"], docHelp.deps)).toBe(0);
    expect(docHelp.err.join("")).toContain("aiplus-office doc prepare");
    for (const argv of [["doc"], ["doc", "bogus"]]) {
      const c = capture();
      expect(await main(argv, c.deps)).toBe(1);
      expect(c.err.join("")).toContain("doc prepare");
    }
    const noOut = capture();
    expect(await main(["doc", "prepare", "in.md"], noOut.deps)).toBe(2);
    expect(noOut.err.join("")).toContain("--out");
  });

  it("doc prepare runs through the real entry", () => {
    const r = runCli(["doc", "prepare", "--help"]);
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("--allow-missing");
  });
});

describe("apps", () => {
  it("apps --json lists the 4 office apps offline and exits 0", async () => {
    const c = capture();
    expect(await main(["apps", "--json"], { ...c.deps, provision: async () => Promise.reject(new Error("network used")) })).toBe(0);
    const rows = JSON.parse(c.out.join(""));
    expect(rows).toHaveLength(4);
    expect(rows.find((r: { id: string }) => r.id === "pdfcraft")).toMatchObject({ mcp: { confinement: "root", toolClass: "large", tools: 175 }, repo: "storytold/pdfcraft" });
    expect(rows.find((r: { id: string }) => r.id === "gridcraft")).toMatchObject({ mcp: { confinement: "gateway", tools: 20 } });
    expect(rows.find((r: { id: string }) => r.id === "deckcraft")).toMatchObject({ mcp: { confinement: "automation-roots", tools: 25 } });
  });

  it("apps (text) lists every id", async () => {
    const c = capture();
    expect(await main(["apps"], c.deps)).toBe(0);
    for (const id of APP_IDS) expect(c.out.join("")).toContain(id);
  });
});

describe("status", () => {
  it("status on an empty cache reports every app not installed and never provisions", async () => {
    const home = tmpDir();
    const c = capture();
    const code = await main(["status", "--json"], {
      ...c.deps,
      env: { AIPLUS_OFFICE_HOME: home },
      provision: async () => Promise.reject(new Error("download attempted")),
    });
    expect(code).toBe(0);
    const rows = JSON.parse(c.out.join(""));
    expect(rows).toHaveLength(4);
    for (const r of rows) expect(r).toMatchObject({ installed: [], cacheBytes: 0, wouldUse: { version: null, source: "download" }, cache: path.join(home, r.app) });
  });

  it("status shows installed versions, cache size and pin", async () => {
    const home = tmpDir();
    const dir = path.join(home, "gridcraft", "0.8.0", "top", "bin");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "gridcraft-cli"), "x".repeat(1000), { mode: 0o755 });
    const c = capture();
    await main(["status", "--json"], { ...c.deps, env: { AIPLUS_OFFICE_HOME: home, AIPLUS_OFFICE_GRIDCRAFT_VERSION: "0.8.0" } });
    const grid = JSON.parse(c.out.join("")).find((r: { app: string }) => r.app === "gridcraft");
    expect(grid).toMatchObject({ installed: ["0.8.0"], wouldUse: { version: "0.8.0", source: "pin" } });
    expect(grid.cacheBytes).toBeGreaterThanOrEqual(1000);
  });

  it("status (text) names the cache root and an override", async () => {
    const home = tmpDir();
    const c = capture();
    await main(["status"], { ...c.deps, env: { AIPLUS_OFFICE_HOME: home, AIPLUS_OFFICE_WORDCRAFT_BIN: "/opt/wc" } });
    const text = c.out.join("");
    expect(text).toContain(`cache: ${home}`);
    expect(text).toMatch(/wordcraft .*override: \/opt\/wc/);
  });

  it("status (text) starts with the Node.js version and its verdict, then the host (change office-first-run)", async () => {
    const home = tmpDir();
    const c = capture();
    expect(await main(["status"], { ...c.deps, env: { AIPLUS_OFFICE_HOME: home }, nodeVersion: "v22.11.0", platform: "win32", arch: "x64" })).toBe(0);
    const lines = c.out.join("").split("\n");
    expect(lines[0]).toBe("node: v22.11.0 (ok: needs 20 or newer)");
    expect(lines[1]).toBe("host: win32/x64");
    expect(lines[2]).toMatch(/^cache: /);
  });

  it("status (text) says an old Node.js is too old and still exits 0", async () => {
    const c = capture();
    expect(await main(["status"], { ...c.deps, env: { AIPLUS_OFFICE_HOME: tmpDir() }, nodeVersion: "v18.19.0" })).toBe(0);
    expect(c.out.join("")).toMatch(/^node: v18\.19\.0 \(too old: needs 20 or newer\)\n/);
  });

  it("status --json keeps its shape: four app rows, no node or host fields", async () => {
    const c = capture();
    await main(["status", "--json"], { ...c.deps, env: { AIPLUS_OFFICE_HOME: tmpDir() }, nodeVersion: "v18.0.0" });
    const rows = JSON.parse(c.out.join(""));
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(4);
    for (const r of rows) expect(Object.keys(r)).not.toContain("node");
  });
});

describe("install", () => {
  it("a partial failure installs the others, prints both outcomes and exits 69", async () => {
    const c = capture();
    const provision = async (id: string) => {
      if (id === "deckcraft") throw new Error("release has no asset");
      return report(id, `/abs/${id}-cli`);
    };
    const code = await main(["install", "gridcraft", "deckcraft"], { ...c.deps, provision });
    expect(code).toBe(69);
    expect(JSON.parse(c.out.join("").trim())).toMatchObject({ app: "gridcraft" });
    expect(c.err.join("")).toContain("deckcraft: release has no asset");
  });

  it("install --all provisions all 4; mixing --all and names is a usage error; unknown app is a usage error", async () => {
    const seen: string[] = [];
    const c = capture();
    expect(await main(["install", "--all"], { ...c.deps, provision: async (id) => (seen.push(id), report(id, "/b")) })).toBe(0);
    expect(seen).toEqual([...APP_IDS]);
    const c2 = capture();
    expect(await main(["install", "--all", "gridcraft"], c2.deps)).toBe(1);
    expect(await main(["install"], c2.deps)).toBe(1);
    expect(await main(["install", "paintcraft"], c2.deps)).toBe(1);
  });
});

describe("exec (subprocess)", () => {
  it("passes arguments verbatim (no shell interpretation), streams stdout and exits with the binary's code", () => {
    const bin = nodeStub(`${ECHO_ARGV}\nprocess.exit(7);`, "wordcraft-cli");
    const r = runCli(["wordcraft", "exec", "run", "--cmd", 'text.insert={"text":"Árajánlat"}', "$HOME", "a b"], { AIPLUS_OFFICE_WORDCRAFT_BIN: bin });
    expect(r.status).toBe(7);
    expect(JSON.parse(r.stdout)).toEqual(["run", "--cmd", 'text.insert={"text":"Árajánlat"}', "$HOME", "a b"]);
  });

  it("path output is exactly one line", () => {
    const bin = nodeStub(`process.stdout.write("x")`, "gridcraft-cli");
    const r = runCli(["gridcraft", "path"], { AIPLUS_OFFICE_GRIDCRAFT_BIN: bin });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe(`${bin}\n`);
  });

  it("nothing is registered implicitly: ensure/exec/path (without --register) leave .mcp.json alone", () => {
    const cwd = tmpDir();
    const bin = nodeStub(`process.stdout.write("wordcraft-cli 0.10.0\\n")`, "wordcraft-cli");
    for (const args of [["wordcraft", "ensure"], ["wordcraft", "exec", "--version"], ["wordcraft", "path"]]) {
      expect(runCli(args, { AIPLUS_OFFICE_WORDCRAFT_BIN: bin }, cwd).status).toBe(0);
    }
    expect(fs.existsSync(path.join(cwd, ".mcp.json"))).toBe(false);
  });

  it("mcp --register writes aiplus-office-gridcraft confined to the project (gateway); extra options are rejected", () => {
    const cwd = tmpDir();
    fs.mkdirSync(path.join(cwd, ".git"));
    expect(runCli(["gridcraft", "mcp", "--register", "--root", "/x"], {}, cwd).status).toBe(1);
    const ok = runCli(["gridcraft", "mcp", "--register"], {}, cwd);
    expect(ok.status).toBe(0);
    const cfg = JSON.parse(fs.readFileSync(path.join(cwd, ".mcp.json"), "utf8"));
    expect(cfg.mcpServers["aiplus-office-gridcraft"].args.slice(1)).toEqual(["gridcraft", "mcp", "--root", cwd]);
  });

  it("mcp --register on a confined app pins --root to the project directory", () => {
    const cwd = tmpDir();
    fs.mkdirSync(path.join(cwd, ".git"));
    expect(runCli(["wordcraft", "mcp", "--register"], {}, cwd).status).toBe(0);
    const cfg = JSON.parse(fs.readFileSync(path.join(cwd, ".mcp.json"), "utf8"));
    expect(cfg.mcpServers["aiplus-office-wordcraft"]).toMatchObject({ type: "stdio", command: process.execPath });
    expect(cfg.mcpServers["aiplus-office-wordcraft"].args.slice(1)).toEqual(["wordcraft", "mcp", "--root", cwd]);
  });
});

describe("exec signal listeners", () => {
  it("do not accumulate across repeated exec calls in one process", async () => {
    const bin = nodeStub("process.exit(0)", "gridcraft-cli");
    const before = process.listenerCount("SIGTERM");
    const beforeInt = process.listenerCount("SIGINT");
    for (let i = 0; i < 12; i++) {
      const c = capture();
      expect(await main(["gridcraft", "exec", "--version"], { ...c.deps, provision: async (id) => report(id, bin) })).toBe(0);
    }
    expect(process.listenerCount("SIGTERM")).toBe(before);
    expect(process.listenerCount("SIGINT")).toBe(beforeInt);
  });
});
