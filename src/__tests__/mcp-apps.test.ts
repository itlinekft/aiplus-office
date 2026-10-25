import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as path from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { runMcp } from "../mcp-proxy.js";
import { defaultLauncherPath, registerMcp, serverName } from "../mcp-register.js";
import type { ProvisionReport } from "../provision.js";
import { CRAFT_APPS, getApp } from "../registry.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";

afterEach(cleanupTmp);

const report = (app: string, binary: string): ProvisionReport => ({ app: app as ProvisionReport["app"], version: null, source: "override", asset: null, cacheHit: false, binary, durationMs: 0 });

function fakeSpawn() {
  const calls: { command: string; args: string[] }[] = [];
  const spawn = (command: string, args: string[]) => {
    calls.push({ command, args });
    const child = Object.assign(new EventEmitter(), { stdin: new PassThrough(), stdout: new PassThrough(), kill: () => true });
    setImmediate(() => child.emit("exit", 0, null));
    return child as unknown as ChildProcess;
  };
  return { calls, spawn };
}

async function proxy(appId: string, argv: string[]) {
  const f = fakeSpawn();
  const stdin = new PassThrough();
  const err: string[] = [];
  stdin.end();
  const code = await runMcp(getApp(appId), argv, {
    provision: async () => report(appId, `/bin/${appId}-cli`),
    spawn: f.spawn as never,
    stdin,
    stdout: new PassThrough(),
    stderr: (t) => err.push(t),
    cwd: () => "/work/proj",
    onSignal: () => {},
  });
  return { code, calls: f.calls, err: err.join("") };
}

describe("per-app MCP proxy", () => {
  it("confined app defaults to the cwd as read and write root", async () => {
    const r = await proxy("wordcraft", []);
    expect(r.code).toBe(0);
    expect(r.calls).toEqual([
      { command: "/bin/wordcraft-cli", args: ["mcp", "--automation-read-root", "/work/proj", "--automation-write-root", "/work/proj"] },
    ]);
    expect(r.err).toContain("/work/proj");
  });

  it("every confined app maps --root to both automation roots", async () => {
    for (const a of CRAFT_APPS.filter((x) => x.mcp.confinement === "automation-roots")) {
      const r = await proxy(a.id, ["--root", "/r"]);
      expect(r.calls[0].args, a.id).toEqual(["mcp", "--automation-read-root", "/r", "--automation-write-root", "/r"]);
    }
  });

  it("PdfCraft confines through its single --root; --compact is passed through only where supported", async () => {
    expect((await proxy("pdfcraft", ["--root", "/r"])).calls[0].args).toEqual(["mcp", "--root", "/r"]);
    expect((await proxy("pdfcraft", [])).calls[0].args).toEqual(["mcp", "--root", "/work/proj"]);
    expect((await proxy("pdfcraft", ["--compact"])).calls[0].args).toEqual(["mcp", "--root", "/work/proj", "--compact"]);
    const bad = await proxy("wordcraft", ["--compact"]);
    expect(bad.code).toBe(1);
    expect(bad.calls).toHaveLength(0);
    expect(bad.err).toMatch(/--compact is not supported/);
  });

  it("every unconfined app refuses without --allow-unconfined, naming the flag and the app", async () => {
    for (const a of CRAFT_APPS.filter((x) => x.mcp.confinement === false)) {
      const r = await proxy(a.id, []);
      expect(r.code, a.id).toBe(1);
      expect(r.calls, a.id).toHaveLength(0);
      expect(r.err).toContain("--allow-unconfined");
      expect(r.err).toContain(a.name);
      expect(r.err).toMatch(/no path confinement/);
    }
  });

  it("with --allow-unconfined the server starts without roots and stderr warns", async () => {
    const r = await proxy("gridcraft", ["--allow-unconfined"]);
    expect(r.code).toBe(0);
    expect(r.calls).toEqual([{ command: "/bin/gridcraft-cli", args: ["mcp"] }]);
    expect(r.err).toMatch(/unconfined.*read and write any path/);
  });

  it("--root on an unconfined app is rejected (it would imply confinement that does not exist)", async () => {
    const r = await proxy("deckcraft", ["--allow-unconfined", "--root", "/x"]);
    expect(r.code).toBe(1);
    expect(r.calls).toHaveLength(0);
    expect(r.err).toMatch(/--root has no effect/);
  });

  it("bridge, connect, control-token and automation-root options are rejected for every app", async () => {
    for (const bad of [["--bridge", "7979"], ["--connect=7979"], ["--control-token", "t"], ["--automation-write-root", "/"]]) {
      for (const id of ["wordcraft", "gridcraft", "deckcraft", "pdfcraft"]) {
        const r = await proxy(id, ["--allow-unconfined", ...bad]);
        expect(r.code).toBe(1);
        expect(r.calls).toHaveLength(0);
        expect(r.err).toMatch(/not supported/);
      }
    }
  });

  it("provisioning failure leaves stdout empty and exits 69", async () => {
    const stdout = new PassThrough();
    const chunks: string[] = [];
    stdout.on("data", (d) => chunks.push(d.toString()));
    const err: string[] = [];
    const stdin = new PassThrough();
    stdin.end();
    const code = await runMcp(getApp("wordcraft"), [], {
      provision: async () => {
        throw new Error("no network");
      },
      stdin,
      stdout,
      stderr: (t) => err.push(t),
      onSignal: () => {},
    });
    expect(code).toBe(69);
    expect(chunks.join("")).toBe("");
    expect(err.join("")).toContain("aiplus-office: no network");
  });
});

describe("per-app MCP registration", () => {
  const project = () => {
    const d = tmpDir();
    fs.mkdirSync(path.join(d, ".git"));
    return d;
  };
  const reg = (appId: string, cwd: string, allowUnconfined = false) => {
    const err: string[] = [];
    const code = registerMcp(getApp(appId), { cwd, allowUnconfined, stderr: (t) => err.push(t) });
    return { code, err: err.join("") };
  };
  const cfg = (cwd: string) => JSON.parse(fs.readFileSync(path.join(cwd, ".mcp.json"), "utf8"));

  it("names entries aiplus-office-<app>", () => {
    for (const a of CRAFT_APPS) expect(serverName(a)).toBe(`aiplus-office-${a.id}`);
  });

  it("registers a confined app next to an existing server, with absolute node + launcher, [app, mcp] and --root <project>", () => {
    const cwd = project();
    fs.writeFileSync(path.join(cwd, ".mcp.json"), JSON.stringify({ mcpServers: { filesystem: { command: "fs" } } }));
    expect(reg("wordcraft", cwd).code).toBe(0);
    const c = cfg(cwd);
    expect(c.mcpServers.filesystem).toEqual({ command: "fs" });
    const entry = c.mcpServers["aiplus-office-wordcraft"];
    expect(entry.command).toBe(process.execPath);
    expect(entry.args[0]).toBe(defaultLauncherPath());
    expect(entry.args[0]).toMatch(/cli[\\/]aiplus-office$/);
    expect(fs.existsSync(entry.args[0])).toBe(true);
    expect(entry.args.slice(1)).toEqual(["wordcraft", "mcp", "--root", cwd]);
  });

  it("refuses an unconfined app without --allow-unconfined and writes nothing", () => {
    const cwd = project();
    const r = reg("gridcraft", cwd);
    expect(r.code).toBe(1);
    expect(r.err).toContain("--allow-unconfined");
    expect(fs.existsSync(path.join(cwd, ".mcp.json"))).toBe(false);
  });

  it("persists --allow-unconfined in the entry so the decision is visible", () => {
    const cwd = project();
    const r = reg("deckcraft", cwd, true);
    expect(r.code).toBe(0);
    expect(cfg(cwd).mcpServers["aiplus-office-deckcraft"].args.slice(1)).toEqual(["deckcraft", "mcp", "--allow-unconfined"]);
    expect(r.err).toMatch(/unconfined/);
  });

  it("a large app warns with the tool count and recommends the bash route", () => {
    const cwd = project();
    const r = reg("pdfcraft", cwd);
    expect(r.code).toBe(0);
    expect(r.err).toMatch(/over 100 tools \(175\)/);
    expect(r.err).toMatch(/bash route/);
    expect(r.err).toMatch(/--compact/);
    const small = reg("wordcraft", project());
    expect(small.err).not.toMatch(/tools \(/);
  });

  it("--compact is persisted for apps that have it, rejected elsewhere, and silences the tool-count warning", () => {
    const cwd = project();
    const err: string[] = [];
    expect(registerMcp(getApp("pdfcraft"), { cwd, compact: true, stderr: (t) => err.push(t) })).toBe(0);
    expect(cfg(cwd).mcpServers["aiplus-office-pdfcraft"].args.slice(1)).toEqual(["pdfcraft", "mcp", "--root", cwd, "--compact"]);
    expect(err.join("")).not.toMatch(/floods the model context/);
    const err2: string[] = [];
    expect(registerMcp(getApp("wordcraft"), { cwd: project(), compact: true, stderr: (t) => err2.push(t) })).toBe(1);
  });

  it("a malformed existing file is left byte-identical, exit 1", () => {
    const cwd = project();
    fs.writeFileSync(path.join(cwd, ".mcp.json"), "{ nope");
    expect(reg("wordcraft", cwd).code).toBe(1);
    expect(fs.readFileSync(path.join(cwd, ".mcp.json"), "utf8")).toBe("{ nope");
  });
});
