import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { defaultLauncherPath, registerMcp } from "../mcp-register.js";
import { getApp } from "../registry.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";

afterEach(cleanupTmp);

function project(markers: string[] = [".git"]): string {
  const d = tmpDir();
  for (const m of markers) fs.mkdirSync(path.join(d, m));
  return d;
}
const run = (cwd: string) => {
  const err: string[] = [];
  const code = registerMcp(getApp("wordcraft"), { cwd, execPath: process.execPath, stderr: (t) => err.push(t) });
  return { code, err: err.join("") };
};
const mcpFile = (cwd: string) => path.join(cwd, ".mcp.json");

describe("mcp --register (project .mcp.json)", () => {
  it("creates the file with only mcpServers.aiplus-office-wordcraft (absolute command + launcher, --root <project>)", () => {
    const cwd = project();
    const { code, err } = run(cwd);
    expect(code).toBe(0);
    const cfg = JSON.parse(fs.readFileSync(mcpFile(cwd), "utf8"));
    expect(Object.keys(cfg)).toEqual(["mcpServers"]);
    expect(Object.keys(cfg.mcpServers)).toEqual(["aiplus-office-wordcraft"]);
    const { type, command, args } = cfg.mcpServers["aiplus-office-wordcraft"];
    expect(type).toBe("stdio");
    expect(command).toBe(process.execPath);
    expect(path.isAbsolute(args[0])).toBe(true);
    expect(args[0]).toBe(defaultLauncherPath());
    expect(fs.existsSync(args[0])).toBe(true);
    expect(args.slice(1)).toEqual(["wordcraft", "mcp", "--root", cwd]);
    expect(err).toMatch(/machine-specific/);
    expect(err).toMatch(/approve/);
  });

  it("preserves other keys and servers and replaces an old entry of the same name", () => {
    const cwd = project();
    fs.writeFileSync(
      mcpFile(cwd),
      JSON.stringify({ extra: 1, mcpServers: { filesystem: { command: "fs" }, docs: { url: "u" }, "aiplus-office-wordcraft": { command: "old" } } }),
    );
    expect(run(cwd).code).toBe(0);
    const cfg = JSON.parse(fs.readFileSync(mcpFile(cwd), "utf8"));
    expect(cfg.extra).toBe(1);
    expect(cfg.mcpServers.filesystem).toEqual({ command: "fs" });
    expect(cfg.mcpServers.docs).toEqual({ url: "u" });
    expect(cfg.mcpServers["aiplus-office-wordcraft"].command).toBe(process.execPath);
  });

  it("a malformed file is left byte-identical and the exit code is 1", () => {
    const cwd = project();
    const bad = "{ not json";
    fs.writeFileSync(mcpFile(cwd), bad);
    const { code, err } = run(cwd);
    expect(code).toBe(1);
    expect(err).toContain(".mcp.json");
    expect(fs.readFileSync(mcpFile(cwd), "utf8")).toBe(bad);
  });

  it("a non-object mcpServers is left untouched, exit 1", () => {
    const cwd = project();
    fs.writeFileSync(mcpFile(cwd), JSON.stringify({ mcpServers: [] }));
    expect(run(cwd).code).toBe(1);
    expect(JSON.parse(fs.readFileSync(mcpFile(cwd), "utf8"))).toEqual({ mcpServers: [] });
  });

  it("a symlinked .mcp.json is never written through", () => {
    const cwd = project();
    const outside = path.join(tmpDir(), "global.json");
    fs.writeFileSync(outside, "{}");
    fs.symlinkSync(outside, mcpFile(cwd));
    const { code, err } = run(cwd);
    expect(code).toBe(1);
    expect(err).toMatch(/symbolic link/);
    expect(fs.readFileSync(outside, "utf8")).toBe("{}");
  });

  it("a cwd with no .git, .claude/ or .mcp.json still registers, with a project-root warning", () => {
    const cwd = project([]);
    const { code, err } = run(cwd);
    expect(code).toBe(0);
    expect(fs.existsSync(mcpFile(cwd))).toBe(true);
    expect(err).toMatch(/does not look like a project root/);
  });

  it("a .git or .claude cwd gets no project-root warning", () => {
    expect(run(project()).err).not.toMatch(/does not look like a project root/);
    expect(run(project([".claude"])).err).not.toMatch(/does not look like a project root/);
  });
});
