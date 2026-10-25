/**
 * `aiplus-office <app> mcp` — provision the binary, then run
 * `<app>-cli mcp` forwarding `tools/call` requests one at a time. Apps whose MCP
 * server supports path confinement run confined to one directory (`--root`);
 * the others refuse to start unless `--allow-unconfined` is given.
 *
 * The upstream server handles requests concurrently, so a pipelined
 * `doc_open` + `command_run` races ("no document open"). The wrapper reads
 * newline-delimited JSON-RPC from the client, queues `tools/call`, and releases
 * the next one only when the server has answered the previous id. Every other
 * message passes straight through; non-JSON server stdout goes to stderr so it
 * cannot corrupt the MCP channel.
 *
 * An app with `confinement: "gateway"` (GridCraft) runs its server with no file option and the proxy confines it:
 * every `tools/call` goes through `src/mcp-gateway.ts` first (allowlisted tools, paths resolved inside the root,
 * refused commands), a refusal is answered here and never reaches the server, and `tools/list` / `initialize`
 * results are filtered / annotated on the way back.
 *
 * Ported from the upstream package's CLI (see UPSTREAM.md); added: a `--root` that still holds an unexpanded `${…}` is
 * refused; the gateway. See change: office-plugin-v1 (office-mcp), office-mcp-grid-deck.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import type { Readable, Writable } from "node:stream";
import { type ChildProcess, spawn as sharedSpawn } from "./exec.js";
import { createGateway, type Gateway, methodPolicy } from "./mcp-gateway.js";
import { provision as defaultProvision, type ProvisionReport } from "./provision.js";
import type { CraftApp } from "./registry.js";

/** Options the proxy owns: forwarding them would bypass confinement or attach to a live app. */
const REJECTED_OPTIONS = ["--bridge", "--connect", "--control-token", "--automation-read-root", "--automation-write-root"];

export function mcpUsage(app: CraftApp, prog = "aiplus-office"): string {
  const cmd = `${prog} ${app.id} mcp`;
  const compact = app.mcp.compactFlag ? " [--compact]" : "";
  return app.mcp.confinement
    ? `usage: ${cmd} [--root <dir>]${compact}
       ${cmd} --register

Runs the ${app.name} stdio MCP server confined to <dir> (default: the current
directory) for both reads and writes${app.mcp.confinement === "gateway" ? ` (checked by ${prog}: ${app.name}'s own server has no confinement)` : ""}. Register it in the project's
.mcp.json with --register (opt-in).${app.mcp.compactFlag ? `\n--compact lists only the helper tools (${app.mcp.tools} tools otherwise); every command stays reachable.` : ""}`
    : `usage: ${cmd} --allow-unconfined${compact}
       ${cmd} --register --allow-unconfined${compact}

${app.name}'s MCP server has no path confinement: it can read and write any
path the user can. Start or register it only with --allow-unconfined.`;
}

/**
 * How long a cancelled in-flight `tools/call` may keep the queue blocked. MCP lets a
 * server drop the response to a cancelled request; without a bound, every later call
 * would wait forever. The server may still be finishing the old command, so the slot
 * is released late, not at once.
 */
export const CANCEL_GRACE_MS = 5000;

export interface McpDeps {
  /** Command prefix in diagnostics. */
  prog: string;
  provision: (opts?: { probeVersion?: boolean; preferInstalled?: boolean }) => Promise<ProvisionReport>;
  spawn: (command: string, args: string[], options: { stdio: ["pipe", "pipe", "inherit"] }) => ChildProcess;
  stdin: Readable;
  stdout: Writable;
  stderr: (text: string) => void;
  cwd: () => string;
  onSignal: (signal: "SIGINT" | "SIGTERM", handler: () => void) => void;
  cancelGraceMs: number;
}

export function defaultMcpDeps(app: CraftApp): McpDeps {
  return {
    prog: "aiplus-office",
    provision: (opts) => defaultProvision(app, opts),
    spawn: (command, args, options) => sharedSpawn(command, args, options),
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: (t) => process.stderr.write(t),
    cwd: () => process.cwd(),
    onSignal: (signal, handler) => {
      process.on(signal, handler);
    },
    cancelGraceMs: CANCEL_GRACE_MS,
  };
}

type ParsedArgs = { kind: "run"; root?: string; allowUnconfined: boolean; compact: boolean } | { kind: "help" } | { kind: "error"; message: string };

export function parseMcpArgs(argv: string[]): ParsedArgs {
  let root: string | undefined;
  let allowUnconfined = false;
  let compact = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { kind: "help" };
    if (a === "--allow-unconfined") {
      allowUnconfined = true;
    } else if (a === "--compact") {
      compact = true;
    } else if (a === "--root" || a.startsWith("--root=")) {
      const v = a === "--root" ? argv[++i] : a.slice("--root=".length);
      if (!v || v.startsWith("--")) return { kind: "error", message: "--root needs a directory" };
      // A client that did not substitute `${CLAUDE_PROJECT_DIR}` would otherwise confine the server to a literal path.
      const unexpanded = /\$\{[^}]*\}?/.exec(v);
      if (unexpanded) return { kind: "error", message: `--root holds an unexpanded variable (${unexpanded[0]}): the client did not substitute it; refusing to start` };
      root = v;
    } else if (REJECTED_OPTIONS.includes(a.split("=")[0])) {
      return { kind: "error", message: `option ${a.split("=")[0]} is not supported: the proxy owns confinement and never attaches to a running desktop app` };
    } else {
      return { kind: "error", message: `unknown option for mcp: ${a}` };
    }
  }
  return { kind: "run", root, allowUnconfined, compact };
}

function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function sameId(a: unknown, b: unknown): boolean {
  return a === b;
}

export async function runMcp(app: CraftApp, argv: string[], partial: Partial<McpDeps> = {}): Promise<number> {
  const deps: McpDeps = { ...defaultMcpDeps(app), ...partial };
  const usage = mcpUsage(app, deps.prog);
  const parsed = parseMcpArgs(argv);
  if (parsed.kind === "help") {
    deps.stderr(`${usage}\n`);
    return 0;
  }
  if (parsed.kind === "error") {
    deps.stderr(`${parsed.message}\n${usage}\n`);
    return 1;
  }
  if (parsed.compact && !app.mcp.compactFlag) {
    deps.stderr(`${deps.prog}: --compact is not supported by ${app.name}'s MCP server\n${usage}\n`);
    return 1;
  }
  const confined = app.mcp.confinement !== false;
  if (!confined && !parsed.allowUnconfined) {
    deps.stderr(
      `${deps.prog}: ${app.name}'s MCP server has no path confinement and can read and write any path the user can; refusing to start. Pass --allow-unconfined to accept that, or use the bash route (${deps.prog} ${app.id} exec …).\n${usage}\n`,
    );
    return 1;
  }
  if (!confined && parsed.root !== undefined) {
    deps.stderr(`${deps.prog}: --root has no effect: ${app.name}'s MCP server cannot confine paths\n${usage}\n`);
    return 1;
  }

  let bin: string;
  try {
    bin = (await deps.provision({ preferInstalled: true })).binary;
  } catch (e) {
    deps.stderr(`${deps.prog}: ${(e as Error).message}\n`);
    return 69;
  }

  let spawnArgs: string[];
  let gateway: Gateway | undefined;
  if (confined) {
    const root = path.resolve(deps.cwd(), parsed.root ?? ".");
    deps.stderr(`[${deps.prog}] mcp root: ${root}\n`);
    if (app.mcp.confinement === "gateway") {
      if (!isDirectory(root)) {
        deps.stderr(`${deps.prog}: the mcp root ${root} is not an existing folder; refusing to start\n`);
        return 1;
      }
      gateway = createGateway(app.name, root);
      deps.stderr(`[${deps.prog}] ${app.name}: files confined by ${deps.prog} to ${root}\n`);
      spawnArgs = ["mcp"];
    } else spawnArgs = app.mcp.confinement === "root" ? ["mcp", "--root", root] : ["mcp", "--automation-read-root", root, "--automation-write-root", root];
  } else {
    deps.stderr(`[${deps.prog}] warning: ${app.name}'s MCP server is unconfined — it can read and write any path the user can\n`);
    spawnArgs = ["mcp"];
  }
  if (parsed.compact && app.mcp.compactFlag) spawnArgs.push(app.mcp.compactFlag);
  const child = deps.spawn(bin, spawnArgs, { stdio: ["pipe", "pipe", "inherit"] });

  return new Promise<number>((resolve) => {
    let inflight: unknown;
    let hasInflight = false;
    let eof = false;
    let exitOverride: number | undefined;
    const queue: { raw: string; id: unknown }[] = [];
    /** Gateway only: client request id → method, for the responses the gateway rewrites. */
    const rewrite = new Map<unknown, "initialize" | "tools/list">();
    const toClient = (o: unknown) => deps.stdout.write(`${JSON.stringify(o)}\n`);
    const toChild = (line: string) => {
      if (child.stdin && !child.stdin.destroyed) child.stdin.write(`${line}\n`);
    };

    const maybeClose = () => {
      if (eof && !hasInflight && queue.length === 0 && child.stdin && !child.stdin.destroyed) child.stdin.end();
    };
    const pump = () => {
      if (hasInflight) return;
      const next = queue.shift();
      if (!next) return maybeClose();
      hasInflight = true;
      inflight = next.id;
      toChild(next.raw);
    };

    child.stdin?.on("error", () => {
      /* child gone; its exit handler reports */
    });

    let cancelTimer: NodeJS.Timeout | undefined;
    /** `notifications/cancelled`: drop a queued call; bound the wait on an in-flight one. */
    const onCancelled = (requestId: unknown, line: string) => {
      const queued = queue.findIndex((q) => sameId(q.id, requestId));
      if (queued >= 0) {
        queue.splice(queued, 1); // never reached the server: nothing to cancel there
        return;
      }
      toChild(line);
      if (hasInflight && sameId(inflight, requestId)) {
        clearTimeout(cancelTimer);
        cancelTimer = setTimeout(() => {
          if (!hasInflight || !sameId(inflight, requestId)) return;
          hasInflight = false;
          inflight = undefined;
          pump();
        }, deps.cancelGraceMs);
        cancelTimer.unref();
      }
    };

    const clientRl = readline.createInterface({ input: deps.stdin });
    clientRl.on("line", (line) => {
      if (line.trim() === "") return;
      let msg: { jsonrpc?: unknown; method?: unknown; id?: unknown; params?: { requestId?: unknown } } | undefined;
      try {
        msg = JSON.parse(line);
      } catch {
        return toChild(line);
      }
      const single = msg && !Array.isArray(msg) ? msg : undefined;
      if (gateway && Array.isArray(msg)) {
        // A JSON-RPC batch would carry tool calls past the gateway; MCP clients do not send them since 2025-06-18.
        toClient({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "batch requests are not supported by this server" } });
        return;
      }
      if (gateway && single) {
        const policy = methodPolicy(single.method, single.id, single.params);
        if (policy === "drop") return;
        if (policy === "reject") {
          toClient({ jsonrpc: "2.0", id: single.id, error: { code: -32601, message: `method not available through ${deps.prog}: ${String(single.method)}` } });
          return;
        }
        if (single.id !== undefined && (single.method === "initialize" || single.method === "tools/list")) rewrite.set(single.id, single.method);
      }
      if (single?.method === "tools/call" && single.id !== undefined) {
        let raw = line;
        if (gateway) {
          const params = (single as { params?: { name?: unknown; arguments?: unknown } }).params ?? {};
          const decision = gateway.check(params.name, params.arguments);
          if (!decision.ok) {
            toClient({ jsonrpc: "2.0", id: single.id, result: { content: [{ type: "text", text: decision.message }], isError: true } });
            return;
          }
          raw = JSON.stringify({ ...single, params: { ...params, arguments: decision.arguments } });
        }
        queue.push({ raw, id: single.id });
        pump();
      } else if (
        single?.method === "notifications/cancelled" &&
        single.jsonrpc === "2.0" &&
        single.id === undefined && // a notification carries no id; anything else passes through untouched
        single.params?.requestId !== undefined
      ) {
        onCancelled(single.params.requestId, line);
      } else toChild(line);
    });
    clientRl.on("close", () => {
      eof = true;
      maybeClose();
    });

    const serverRl = readline.createInterface({ input: child.stdout as Readable });
    serverRl.on("line", (line) => {
      let msg: { id?: unknown } | undefined;
      try {
        msg = JSON.parse(line);
      } catch {
        deps.stderr(`${line}\n`);
        return;
      }
      const pending = gateway && msg && !Array.isArray(msg) && msg.id !== undefined ? rewrite.get(msg.id) : undefined;
      if (gateway && pending && msg && (msg as { method?: unknown }).method === undefined) {
        rewrite.delete(msg.id);
        const result = (msg as { result?: unknown }).result;
        if (result !== undefined) toClient({ ...msg, result: pending === "tools/list" ? gateway.filterToolList(result) : gateway.annotateInitialize(result) });
        else deps.stdout.write(`${line}\n`);
      } else deps.stdout.write(`${line}\n`);
      if (hasInflight && msg && !Array.isArray(msg) && msg.id !== undefined && sameId(msg.id, inflight)) {
        hasInflight = false;
        inflight = undefined;
        pump();
      }
    });

    const onSignal = (code: number) => () => {
      exitOverride = code;
      child.kill();
    };
    deps.onSignal("SIGINT", onSignal(130));
    deps.onSignal("SIGTERM", onSignal(143));

    child.on("error", (e) => {
      deps.stderr(`${deps.prog}: failed to start ${app.cli}: ${e.message}\n`);
      resolve(1);
    });
    child.on("exit", (code, signal) => {
      clearTimeout(cancelTimer);
      clientRl.close();
      // Let buffered server lines flush before reporting.
      setImmediate(() => resolve(exitOverride ?? (signal ? 1 : (code ?? 1))));
    });
  });
}
