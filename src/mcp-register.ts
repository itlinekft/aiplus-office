/**
 * `aiplus-office <app> mcp --register` — opt-in write of an `aiplus-office-<app>` entry into the project's
 * `.mcp.json` (Claude Code project scope; merge, never clobber; a malformed file aborts untouched). The entry uses
 * absolute paths and, for a confined app, an explicit `--root <project dir>`, so it does not depend on the working
 * directory the client starts the server in. Nothing is ever registered implicitly.
 *
 * Ported from the upstream package's CLI (which wrote its own agent's MCP file). See change: office-plugin-v1 (design D7).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { CraftApp } from "./registry.js";

export interface RegisterDeps {
  cwd: string;
  execPath: string;
  /** Absolute path of the launcher script the entry runs (`cli/aiplus-office`). */
  launcher: string;
  /** Arguments after the launcher; default `[<app>, "mcp"]`. */
  entryArgs?: string[];
  /** Command prefix in diagnostics. */
  prog: string;
  allowUnconfined: boolean;
  /** Persist `--compact` (apps with a compact MCP mode only). */
  compact?: boolean;
  stderr: (text: string) => void;
}

/** `<package root>/cli/<name>`, valid from `src/` and from the bundled `dist/` (both one level below the root). */
export function defaultLauncherPath(name = "aiplus-office"): string {
  return fileURLToPath(new URL(`../cli/${name}`, import.meta.url));
}

/** Entry name under `mcpServers`: `aiplus-office-<app>`. */
export function serverName(app: CraftApp): string {
  return `aiplus-office-${app.id}`;
}

function isSymlink(p: string): boolean {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

export function registerMcp(app: CraftApp, partial: Partial<RegisterDeps> = {}): number {
  const deps: RegisterDeps = {
    cwd: process.cwd(),
    execPath: process.execPath,
    launcher: defaultLauncherPath(),
    prog: "aiplus-office",
    allowUnconfined: false,
    stderr: (t) => process.stderr.write(t),
    ...partial,
  };
  if (deps.compact && !app.mcp.compactFlag) {
    deps.stderr(`${deps.prog}: --compact is not supported by ${app.name}'s MCP server\n`);
    return 1;
  }
  if (app.mcp.confinement === false && !deps.allowUnconfined) {
    deps.stderr(
      `${deps.prog}: ${app.name}'s MCP server has no path confinement and can read and write any path the user can; refusing to register it. Pass --allow-unconfined to accept that.\n`,
    );
    return 1;
  }
  const file = path.join(deps.cwd, ".mcp.json");
  // A symlinked `.mcp.json` could point the write at a file outside the project (e.g. a global config).
  if (isSymlink(file)) {
    deps.stderr(`${deps.prog}: ${file} is a symbolic link; refusing to write through it\n`);
    return 1;
  }
  const looksLikeRoot = fs.existsSync(path.join(deps.cwd, ".git")) || fs.existsSync(path.join(deps.cwd, ".claude")) || fs.existsSync(file);

  let config: Record<string, unknown> = {};
  if (fs.existsSync(file)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not a JSON object");
      config = parsed as Record<string, unknown>;
    } catch (e) {
      deps.stderr(`${deps.prog}: ${file} is not valid JSON (${(e as Error).message}); left untouched\n`);
      return 1;
    }
  }
  if (config.mcpServers !== undefined && (config.mcpServers === null || typeof config.mcpServers !== "object" || Array.isArray(config.mcpServers))) {
    deps.stderr(`${deps.prog}: "mcpServers" in ${file} is not an object; left untouched\n`);
    return 1;
  }
  const servers = (config.mcpServers ?? {}) as Record<string, unknown>;
  const name = serverName(app);
  const args = [deps.launcher, ...(deps.entryArgs ?? [app.id, "mcp"])];
  if (app.mcp.confinement === false) args.push("--allow-unconfined");
  else args.push("--root", deps.cwd);
  if (deps.compact) args.push("--compact");
  servers[name] = { type: "stdio", command: deps.execPath, args };
  config.mcpServers = servers;

  // Write beside the target and rename: a crash never leaves a truncated mcp.json.
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(config, null, 2)}\n`);
  fs.renameSync(tmp, file);

  deps.stderr(`${deps.prog}: registered "${name}" in ${file}\n`);
  deps.stderr("  note: the entry holds absolute paths and is machine-specific (do not commit it for a team).\n");
  deps.stderr("  note: Claude Code asks you to approve a project-scoped server from .mcp.json before it starts it.\n");
  if (app.mcp.confinement === false) {
    deps.stderr(`  warning: ${app.name}'s server is unconfined — it can read and write any path the user can (registered with --allow-unconfined).\n`);
  }
  if (app.mcp.toolClass === "large" && !deps.compact) {
    const hint = app.mcp.compactFlag ? ` or register with --compact (helper tools only; every command stays reachable)` : "";
    deps.stderr(
      `  warning: ${app.name}'s server exposes over ${Math.floor(app.mcp.tools / 100) * 100} tools (${app.mcp.tools}); that floods the model context — prefer the bash route (${deps.prog} ${app.id} exec …)${hint}.\n`,
    );
  }
  if (!looksLikeRoot) {
    deps.stderr(`  warning: ${deps.cwd} does not look like a project root (no .git, .claude/ or .mcp.json); Claude Code reads .mcp.json from the project root.\n`);
  }
  return 0;
}
