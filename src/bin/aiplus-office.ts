/**
 * aiplus-office — the ArtCraft office apps (WordCraft, GridCraft, DeckCraft, PdfCraft), headless, for Claude.
 *
 *   aiplus-office apps [--json]                    list the 4 apps (offline)
 *   aiplus-office status [--json]                  Node.js version, host, installed versions, cache size (never downloads)
 *   aiplus-office install <app…>|--all             provision CLIs, one JSON report per app
 *   aiplus-office verify <file> [assertions…]      mechanical output checks (`aiplus-office verify --help`)
 *   aiplus-office doc prepare <in.md> --out <dir>  fill a docx template + prepare the body for WordCraft
 *   aiplus-office <app> ensure|path|exec|mcp       per-app provisioning, bash route, stdio MCP server
 *
 * Exit codes: 0 ok · 1 usage error / failed operation · 69 provisioning failure
 * (`exec` propagates the binary's own exit code; `verify` and `doc prepare` have their own: 2 = usage).
 *
 * Ported from the upstream package's CLI (see UPSTREAM.md). See change: office-plugin-v1.
 */
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { runAppCommand } from "../app-command.js";
import { DOC_USAGE, prepareDoc } from "../doc-prepare.js";
import { defaultLauncherPath } from "../mcp-register.js";
import { defaultDeps, type ProvisionReport, provision } from "../provision.js";
import { APP_IDS, CRAFT_APPS, getApp, isAppId } from "../registry.js";
import { appStatus, statusRoot } from "../status.js";
import { runVerify } from "../verify.js";

export const VERSION = "0.1.11";

/** Minimum Node.js major version (package.json `engines`); `status` says when the running one is older. */
export const NODE_MIN_MAJOR = 20;

/** `status` header line for the running Node.js: the version and whether it is new enough. */
export function nodeLine(version: string): string {
  const major = Number(/^v?(\d+)/.exec(version)?.[1]);
  const ok = Number.isFinite(major) && major >= NODE_MIN_MAJOR;
  return `node: ${version} (${ok ? "ok" : "too old"}: needs ${NODE_MIN_MAJOR} or newer)`;
}

export function usage(): string {
  return `usage: aiplus-office <command> [args]

commands:
  apps [--json]                list the office apps (offline)
  status [--json]              Node.js version, host, installed versions, cache size (never downloads)
  install <app…>|--all         provision <app>-cli for each app, print one JSON report per app
  verify <file> [assertions…]  mechanical output checks (aiplus-office verify --help)
  doc prepare <in.md> --out <dir>  fill a docx template, inline images/diagrams (aiplus-office doc --help)
  <app> ensure                 provision <app>-cli and print a JSON report
  <app> path                   provision <app>-cli and print its absolute path
  <app> exec <args…>           run <app>-cli with <args…> verbatim (bash route)
  <app> mcp [--root <dir>]     stdio MCP server (confined apps), --allow-unconfined otherwise
  <app> mcp --register         add an aiplus-office-<app> entry to ./.mcp.json (opt-in)
  --version                    print the aiplus-office version

apps: ${APP_IDS.join(", ")}

env: AIPLUS_OFFICE_HOME (cache root) · AIPLUS_OFFICE_<APP>_VERSION (pin) · AIPLUS_OFFICE_<APP>_BIN (skip provisioning)
     AIPLUS_OFFICE_TEMPLATES_DIR (doc prepare) · GITHUB_TOKEN (API rate limit)
exit: 0 ok · 1 usage/failed · 69 provisioning failure`;
}

export interface CliDeps {
  provision: (appId: string, opts?: { probeVersion?: boolean; preferInstalled?: boolean }) => Promise<ProvisionReport>;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  /** `process.arch`, for the `status` host line. */
  arch: string;
  /** `process.version`, for the `status` node line. */
  nodeVersion: string;
  homedir: () => string;
  now: () => number;
  runVerify: (argv: string[]) => Promise<number>;
  runDocPrepare: (argv: string[], io: { stdout: (t: string) => void; stderr: (t: string) => void }) => Promise<number>;
}

function defaultCliDeps(): CliDeps {
  const d = defaultDeps();
  return {
    provision: (appId, opts) => provision(appId, opts),
    stdout: (t) => process.stdout.write(t),
    stderr: (t) => process.stderr.write(t),
    env: process.env,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    homedir: d.homedir,
    now: d.now,
    runVerify: (argv) => runVerify(argv, {}),
    runDocPrepare: (argv, io) => prepareDoc(argv, io),
  };
}

function formatBytes(n: number): string {
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function appsCommand(rest: string[], deps: CliDeps): number {
  const json = rest.includes("--json");
  if (rest.some((a) => a !== "--json")) {
    deps.stderr(`usage: aiplus-office apps [--json]\n`);
    return 1;
  }
  const rows = CRAFT_APPS.map((a) => ({ id: a.id, name: a.name, purpose: a.purpose, repo: a.repo, mcp: { confinement: a.mcp.confinement, toolClass: a.mcp.toolClass, tools: a.mcp.tools } }));
  if (json) deps.stdout(`${JSON.stringify(rows)}\n`);
  else {
    for (const r of rows) {
      deps.stdout(`${r.id.padEnd(12)} ${r.purpose}\n`);
      deps.stdout(`${"".padEnd(12)} ${r.repo} · mcp: ${r.mcp.confinement ? "confined" : "unconfined"}, ${r.mcp.tools} tools (${r.mcp.toolClass})\n`);
    }
  }
  return 0;
}

function statusCommand(rest: string[], deps: CliDeps): number {
  const json = rest.includes("--json");
  if (rest.some((a) => a !== "--json")) {
    deps.stderr(`usage: aiplus-office status [--json]\n`);
    return 1;
  }
  let rows: ReturnType<typeof appStatus>[];
  try {
    rows = CRAFT_APPS.map((a) => appStatus(a, deps));
  } catch (e) {
    deps.stderr(`aiplus-office: ${(e as Error).message}\n`);
    return 1;
  }
  if (json) {
    deps.stdout(`${JSON.stringify(rows)}\n`);
    return 0;
  }
  deps.stdout(`${nodeLine(deps.nodeVersion)}\n`);
  deps.stdout(`host: ${deps.platform}/${deps.arch}\n`);
  deps.stdout(`cache: ${statusRoot(deps)}\n`);
  for (const r of rows) {
    const inst = r.installed.length ? `${r.installed.join(", ")} (${formatBytes(r.cacheBytes)})` : "not installed";
    const use = r.wouldUse.version ? `${r.wouldUse.version} (${r.wouldUse.source})` : r.wouldUse.source;
    deps.stdout(`${r.app.padEnd(12)} ${inst} · next: ${use}${r.override ? ` · override: ${r.override}` : ""}\n`);
  }
  return 0;
}

async function installCommand(rest: string[], deps: CliDeps): Promise<number> {
  const all = rest.includes("--all");
  const ids = rest.filter((a) => a !== "--all");
  if ((all && ids.length > 0) || (!all && ids.length === 0)) {
    deps.stderr(`usage: aiplus-office install <app…> | aiplus-office install --all\n`);
    return 1;
  }
  const bad = ids.filter((id) => !isAppId(id));
  if (bad.length) {
    deps.stderr(`aiplus-office: unknown craft app "${bad[0]}"; supported apps: ${APP_IDS.join(", ")}\n`);
    return 1;
  }
  let failed = false;
  for (const id of all ? [...APP_IDS] : ids) {
    try {
      deps.stdout(`${JSON.stringify(await deps.provision(id, { probeVersion: true }))}\n`);
    } catch (e) {
      failed = true;
      deps.stderr(`aiplus-office: ${id}: ${(e as Error).message}\n`);
    }
  }
  return failed ? 69 : 0;
}

async function docCommand(rest: string[], deps: CliDeps): Promise<number> {
  const [sub, ...more] = rest;
  if (sub === "--help" || sub === "-h") {
    deps.stderr(`${DOC_USAGE}\n`);
    return 0;
  }
  if (sub === "prepare") return deps.runDocPrepare(more, { stdout: deps.stdout, stderr: deps.stderr });
  deps.stderr(`${DOC_USAGE}\n`);
  return 1;
}

export async function main(argv: string[], partial: Partial<CliDeps> = {}): Promise<number> {
  const deps: CliDeps = { ...defaultCliDeps(), ...partial };
  const [command, ...rest] = argv;

  switch (command) {
    case "apps":
      return appsCommand(rest, deps);
    case "status":
      return statusCommand(rest, deps);
    case "install":
      return installCommand(rest, deps);
    case "verify":
      return deps.runVerify(rest);
    case "doc":
      return docCommand(rest, deps);
    case "--version":
    case "-V":
      deps.stdout(`aiplus-office ${VERSION}\n`);
      return 0;
    case "--help":
    case "-h":
      deps.stderr(`${usage()}\n`);
      return 0;
    default: {
      if (command && isAppId(command)) {
        const app = getApp(command);
        const [sub, ...args] = rest;
        const code = await runAppCommand(app, sub ?? "", args, {
          prog: "aiplus-office",
          provision: (opts) => deps.provision(command, opts),
          stdout: deps.stdout,
          stderr: deps.stderr,
          usage: usage(),
          register: { launcher: defaultLauncherPath(), entryArgs: [app.id, "mcp"] },
        });
        if (code !== undefined) return code;
      }
      deps.stderr(`${usage()}\n`);
      return 1;
    }
  }
}

/** True when this module is the process entry (direct run, bin symlink, or tsx). */
function isEntry(): boolean {
  try {
    const entry = process.argv[1];
    return !!entry && fs.realpathSync(entry) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isEntry()) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      process.stderr.write(`aiplus-office: ${(e as Error).message}\n`);
      process.exit(1);
    },
  );
}
