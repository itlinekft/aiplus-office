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
 * Lazy start: the client is never kept waiting on a download or on a slow first start of the server (a large unsigned
 * binary scanned on first launch). stdin is read from the first moment and provisioning runs in the background, the
 * server is spawned as soon as the binary is there. When the server answers the client's `initialize` within
 * `initGraceMs` of its arrival, everything is as above. Otherwise the proxy answers `initialize` itself (tools
 * `listChanged`), lists one `<app>_status` tool, answers every other `tools/call` with a bilingual "being downloaded"
 * tool error, finishes the server's handshake in the background (with the client's own `initialize` parameters),
 * then switches to pass-through and sends `notifications/tools/list_changed`. A failed provisioning keeps answering, every
 * call returns the error, until the client closes stdin (exit 69). Diagnostics go to stderr only.
 *
 * Ported from the upstream package's CLI (see UPSTREAM.md); added: a `--root` that still holds an unexpanded `${…}` is
 * refused; the gateway; the lazy start. See change: office-plugin-v1 (office-mcp), office-mcp-grid-deck,
 * office-mcp-lazy-start.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline";
import type { Readable, Writable } from "node:stream";
import { type ChildProcess, spawn as sharedSpawn } from "./exec.js";
import { createGateway, type Gateway, methodPolicy, refusalText } from "./mcp-gateway.js";
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

/**
 * How long the client's `initialize` may wait for the server's own answer (provisioning, spawn, the server's start)
 * before the proxy answers it itself. Far below the ~30 s after which Claude Desktop gives up on a server (measured
 * 2026-10-25: a download, and on Windows the first start of an installed 70 to 80 MB binary, both exceeded it).
 */
export const INIT_GRACE_MS = 2000;

export interface McpDeps {
  /** Command prefix in diagnostics. */
  prog: string;
  provision: (opts?: { probeVersion?: boolean; preferInstalled?: boolean }) => Promise<ProvisionReport>;
  spawn: (command: string, args: string[], options: { stdio: ["pipe", "pipe", "inherit"] }) => ChildProcess;
  stdin: Readable;
  stdout: Writable;
  stderr: (text: string) => void;
  cwd: () => string;
  /** The folder a client without a project folder (Claude Desktop's plain Chat) is confined to; created on use. */
  chatRoot: () => string;
  onSignal: (signal: "SIGINT" | "SIGTERM", handler: () => void) => void;
  cancelGraceMs: number;
  /** See `INIT_GRACE_MS`. */
  initGraceMs: number;
  /** The plugin version, in the proxy's own `initialize` answer. */
  serverVersion: string;
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
    chatRoot: defaultChatRoot,
    onSignal: (signal, handler) => {
      process.on(signal, handler);
    },
    cancelGraceMs: CANCEL_GRACE_MS,
    initGraceMs: INIT_GRACE_MS,
    serverVersion: "0.0.0",
  };
}

type ParsedArgs = { kind: "run"; root?: string; noProject?: boolean; allowUnconfined: boolean; compact: boolean } | { kind: "help" } | { kind: "error"; message: string };

export function parseMcpArgs(argv: string[]): ParsedArgs {
  let root: string | undefined;
  let noProject = false;
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
      // Claude Desktop's plain Chat has no project folder and passes `${CLAUDE_PROJECT_DIR}` as it is (measured on
      // Windows 2026-10-26): the server is then confined to the dedicated chat folder (`chatRoot`). Any other
      // unsubstituted variable would confine the server to a literal path: refused.
      if (v === "${CLAUDE_PROJECT_DIR}") {
        noProject = true;
        continue;
      }
      const unexpanded = /\$\{[^}]*\}?/.exec(v);
      if (unexpanded) return { kind: "error", message: `--root holds an unexpanded variable (${unexpanded[0]}): the client did not substitute it; refusing to start` };
      root = v;
    } else if (REJECTED_OPTIONS.includes(a.split("=")[0])) {
      return { kind: "error", message: `option ${a.split("=")[0]} is not supported: the proxy owns confinement and never attaches to a running desktop app` };
    } else {
      return { kind: "error", message: `unknown option for mcp: ${a}` };
    }
  }
  return { kind: "run", root, ...(noProject ? { noProject } : {}), allowUnconfined, compact };
}

/**
 * The plain Chat's folder: `AIPLUS_OFFICE_CHAT_ROOT` when set, else „AI+ Iroda” in the user's Documents folder (on
 * Windows the redirected one, e.g. OneDrive, when the shell reports it), else in the home folder.
 */
export function defaultChatRoot(env: NodeJS.ProcessEnv = process.env, home: string = os.homedir()): string {
  if (env.AIPLUS_OFFICE_CHAT_ROOT) return env.AIPLUS_OFFICE_CHAT_ROOT;
  const candidates = [env.OneDrive ? path.join(env.OneDrive, "Documents") : "", path.join(home, "Documents")].filter(Boolean);
  const docs = candidates.find((d) => isDirectory(d)) ?? home;
  return path.join(docs, "AI+ Iroda");
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

  let spawnArgs: string[];
  let gateway: Gateway | undefined;
  if (confined) {
    let root = path.resolve(deps.cwd(), parsed.root ?? ".");
    if (parsed.noProject) {
      root = deps.chatRoot();
      try {
        fs.mkdirSync(root, { recursive: true });
      } catch (e) {
        deps.stderr(`${deps.prog}: cannot create the chat folder ${root}: ${(e as Error).message}\n`);
        return 1;
      }
      deps.stderr(`[${deps.prog}] no project folder from the client (plain Chat): files go to ${root}\n`);
    }
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

  return new Promise<number>((resolveRun) => {
    let finished = false;
    const finish = (code: number) => {
      if (finished) return;
      finished = true;
      resolveRun(code);
    };
    const toClient = (o: unknown) => deps.stdout.write(`${JSON.stringify(o)}\n`);
    const log = (text: string) => deps.stderr(`[${deps.prog}] ${app.id}: ${text}\n`);

    /*
     * Ready means: the binary is provisioned, the server is spawned AND it answered `initialize`. Until then client
     * lines are held in `buffered` (the client sends nothing but its `initialize` before it is answered). If the server
     * answers that `initialize` within `initGraceMs` of its arrival, the answer goes to the client and nothing differs
     * from a plain pass-through. Otherwise `local` is set: the proxy answers the client itself, finishes the server's
     * handshake in the background, and on its answer switches to pass-through and sends `tools/list_changed`.
     */
    let state: { kind: "pending" } | { kind: "ready" } | { kind: "failed"; message: string } = { kind: "pending" };
    const buffered: string[] = [];
    let eof = false;
    let local = false;
    let wentLocal = false;
    let clientInit: { id: unknown; params: unknown } | undefined;
    let initForwarded = false;
    let initAnswered = false;
    /** The id of the `initialize` sent to the server whose answer is still awaited. */
    let gate: unknown;
    let graceTimer: NodeJS.Timeout | undefined;
    let exitOverride: number | undefined;
    let child: ChildProcess | undefined;
    let server: { line: (line: string) => void; eof: () => void } | undefined;
    const startedAt = Date.now();
    const seconds = () => Math.round((Date.now() - startedAt) / 1000);
    const statusTool = `${app.id}_status`;

    const failedText = (message: string) =>
      refusalText(
        `A(z) ${app.name} letöltése nem sikerült, ezért ez az eszköz most nem fut. Új munkamenetben újra megpróbálom. A hiba: ${message}`,
        `downloading ${app.name} failed, so this tool cannot run now; a new session tries again. The error: ${message}`,
      );
    const statusText = (): string => {
      if (state.kind === "failed") return failedText(state.message);
      if (!local && server) {
        return refusalText(
          `A(z) ${app.name} kész, az eszközei elérhetők. Ha nem látszanak, indíts új munkamenetet.`,
          `${app.name} is ready and its tools are available. If they do not show, start a new session.`,
        );
      }
      if (state.kind === "ready") {
        return refusalText(`A(z) ${app.name} indul (${seconds()} másodperce), pár perc múlva próbáld újra.`, `${app.name} is starting (for ${seconds()} s); try again in a few minutes.`);
      }
      return refusalText(
        `A(z) ${app.name} letöltése folyamatban (${seconds()} másodperce), pár perc múlva próbáld újra.`,
        `${app.name} is being downloaded (for ${seconds()} s); try again in a few minutes.`,
      );
    };
    const notReadyText = () =>
      state.kind === "failed"
        ? failedText(state.message)
        : state.kind === "ready"
          ? refusalText(`A(z) ${app.name} indul, pár perc múlva próbáld újra.`, `${app.name} is starting; try again in a few minutes.`)
          : refusalText(`A(z) ${app.name} letöltése folyamatban, pár perc múlva próbáld újra.`, `${app.name} is being downloaded; try again in a few minutes.`);

    const initializeResult = (params: unknown) => {
      const requested = (params as { protocolVersion?: unknown } | undefined)?.protocolVersion;
      const protocolVersion = typeof requested === "string" && (PROTOCOL_VERSIONS as readonly string[]).includes(requested) ? requested : PROTOCOL_VERSIONS[PROTOCOL_VERSIONS.length - 1];
      const instructions =
        state.kind === "failed"
          ? failedText(state.message)
          : refusalText(
              `A(z) ${app.name} program letöltése vagy első indítása folyamatban. Amíg tart, az eszközei nem futnak; a ${statusTool} eszköz megmutatja az állapotot. Ha kész, az eszközök megjelennek.`,
              `${app.name} is being downloaded or started for the first time. Until it is ready its tools cannot run; ${statusTool} reports the state. When it is ready the tools appear.`,
            );
      const result = { protocolVersion, capabilities: { tools: { listChanged: true } }, serverInfo: { name: `${deps.prog}-${app.id}`, version: deps.serverVersion }, instructions };
      return gateway ? gateway.annotateInitialize(result) : result;
    };
    const statusToolDef = {
      name: statusTool,
      description: refusalText(`A(z) ${app.name} letöltésének és indításának állapota.`, `the state of the ${app.name} download and start.`),
      inputSchema: { type: "object", properties: {} },
    };
    const textResult = (text: string, isError: boolean) => ({ content: [{ type: "text", text }], isError });

    /** Answer one client line from the proxy (`local`): the app is not ready yet, or failed to download. */
    const localLine = (line: string) => {
      let msg: unknown;
      try {
        msg = JSON.parse(line);
      } catch {
        toClient({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } });
        return;
      }
      if (Array.isArray(msg) || msg === null || typeof msg !== "object") {
        toClient({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "batch requests are not supported by this server" } });
        return;
      }
      const { method, id, params } = msg as { method?: unknown; id?: unknown; params?: unknown };
      if (typeof method !== "string" || id === undefined) return; // a response or a notification: nothing to do yet
      const reply = (result: unknown) => toClient({ jsonrpc: "2.0", id, result });
      switch (method) {
        case "initialize":
          if (!clientInit) clientInit = { id, params };
          initAnswered = true;
          return reply(initializeResult(params));
        case "ping":
          return reply({});
        case "tools/list":
          return reply({ tools: [statusToolDef] });
        case "tools/call": {
          const name = (params as { name?: unknown } | undefined)?.name;
          if (name === statusTool) return reply(textResult(statusText(), state.kind === "failed"));
          return reply(textResult(notReadyText(), true));
        }
        case "resources/list":
          return reply({ resources: [] });
        case "resources/templates/list":
          return reply({ resourceTemplates: [] });
        case "prompts/list":
          return reply({ prompts: [] });
        default:
          toClient({ jsonrpc: "2.0", id, error: { code: -32601, message: `method not available while ${app.name} is not ready: ${method}` } });
      }
    };

    /** The client's `initialize` waited too long, or provisioning failed: answer from the proxy from now on. */
    const goLocal = (why: string) => {
      clearTimeout(graceTimer);
      if (local || initAnswered || finished) return;
      local = true;
      wentLocal = true;
      log(`${why}; answering from ${deps.prog} until it is ready`);
      if (clientInit && initForwarded) {
        initAnswered = true;
        toClient({ jsonrpc: "2.0", id: clientInit.id, result: initializeResult(clientInit.params) });
      }
      for (const line of buffered.splice(0)) localLine(line);
    };

    /** Hand held lines to the server while it is not waiting on an `initialize`; then pass on the end of input. */
    let serverEofSent = false;
    const drain = () => {
      while (server && !local && gate === undefined && buffered.length > 0) {
        const line = buffered.shift() as string;
        const init = initRequest(line);
        if (init && !initForwarded) {
          initForwarded = true;
          gate = init.id;
        }
        server.line(line);
      }
      if (eof && server && !local && gate === undefined && buffered.length === 0 && !serverEofSent) {
        serverEofSent = true;
        server.eof();
      }
    };

    /** Spawn the server and its serialising pass-through. `handshake`: the client was answered locally; initialize it ourselves. */
    const startServer = (bin: string, handshake: boolean) => {
      const c = deps.spawn(bin, spawnArgs, { stdio: ["pipe", "pipe", "inherit"] });
      child = c;
      let inflight: unknown;
      let hasInflight = false;
      let passEof = false;
      const queue: { raw: string; id: unknown }[] = [];
      /** Gateway only: client request id → method, for the responses the gateway rewrites. */
      const rewrite = new Map<unknown, "initialize" | "tools/list">();
      const toChild = (line: string) => {
        if (c.stdin && !c.stdin.destroyed) c.stdin.write(`${line}\n`);
      };

      const maybeClose = () => {
        if (passEof && !hasInflight && queue.length === 0 && c.stdin && !c.stdin.destroyed) c.stdin.end();
      };
      const pump = () => {
        if (hasInflight) return;
        const next = queue.shift();
        if (!next) return maybeClose();
        hasInflight = true;
        inflight = next.id;
        toChild(next.raw);
      };

      c.stdin?.on("error", () => {
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

      const passLine = (line: string) => {
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
        if (wentLocal && single?.method === "tools/call" && single.id !== undefined && (single.params as { name?: unknown } | undefined)?.name === statusTool) {
          toClient({ jsonrpc: "2.0", id: single.id, result: textResult(statusText(), false) });
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
      };

      server = {
        line: passLine,
        eof: () => {
          passEof = true;
          maybeClose();
        },
      };

      const serverRl = readline.createInterface({ input: c.stdout as Readable });
      serverRl.on("line", (line) => {
        let msg: { id?: unknown } | undefined;
        try {
          msg = JSON.parse(line);
        } catch {
          deps.stderr(`${line}\n`);
          return;
        }
        const isResponse = !!msg && !Array.isArray(msg) && msg.id !== undefined && (msg as { method?: unknown }).method === undefined;
        const answersGate = gate !== undefined && isResponse && sameId(msg?.id, gate);
        if (answersGate && local) {
          // The server's answer to an initialize the client had answered from the proxy: swallowed.
          gate = undefined;
          rewrite.delete(msg?.id);
          const error = (msg as { error?: { message?: unknown } }).error;
          if (error) log(`the server refused initialize (${String(error.message)}); passing through anyway`);
          toChild(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }));
          local = false;
          toClient({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });
          log(`ready after ${seconds()} s; tools/list_changed sent`);
          drain();
          return;
        }
        if (answersGate) {
          gate = undefined;
          initAnswered = true;
          clearTimeout(graceTimer);
        }
        const pending = gateway && isResponse ? rewrite.get(msg?.id) : undefined;
        if (gateway && pending && msg) {
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
        if (answersGate) drain();
      });

      c.on("error", (e) => {
        deps.stderr(`${deps.prog}: failed to start ${app.cli}: ${e.message}\n`);
        finish(1);
      });
      c.on("exit", (code, signal) => {
        clearTimeout(cancelTimer);
        clearTimeout(graceTimer);
        clientRl.close();
        // Let buffered server lines flush before reporting.
        setImmediate(() => finish(exitOverride ?? (signal ? 1 : (code ?? 1))));
      });

      if (handshake) {
        initForwarded = true;
        gate = HANDSHAKE_ID;
        toChild(JSON.stringify({ jsonrpc: "2.0", id: HANDSHAKE_ID, method: "initialize", params: clientInit?.params ?? DEFAULT_INIT_PARAMS }));
      } else drain();
    };

    const clientRl = readline.createInterface({ input: deps.stdin });
    clientRl.on("line", (line) => {
      if (line.trim() === "") return;
      if (local) return localLine(line);
      const init = initRequest(line);
      if (init && !clientInit) {
        clientInit = init;
        graceTimer = setTimeout(() => goLocal(`not ready ${deps.initGraceMs} ms after the client's initialize`), deps.initGraceMs);
        graceTimer.unref();
      }
      buffered.push(line);
      drain();
    });
    clientRl.on("close", () => {
      eof = true;
      if (local) {
        if (state.kind === "failed") finish(69);
        else if (state.kind === "pending") log("the client closed the connection; finishing the download before exit");
        else if (child && child.stdin && !child.stdin.destroyed) child.stdin.end(); // the server ends with its input
      } else drain();
      // Without a server yet, it is started (or provisioning fails) and then sees the end of input.
    });

    deps.onSignal("SIGINT", () => {
      exitOverride = 130;
      if (child) child.kill();
      else finish(130);
    });
    deps.onSignal("SIGTERM", () => {
      exitOverride = 143;
      if (child) child.kill();
      else finish(143);
    });

    deps.provision({ preferInstalled: true }).then(
      (report) => {
        state = { kind: "ready" };
        if (finished) return;
        if (!local) return startServer(report.binary, false);
        if (eof) {
          log("provisioned; the client is gone, so the server is not started");
          return finish(0);
        }
        log(`provisioned after ${seconds()} s; starting the server`);
        startServer(report.binary, true);
      },
      (e: unknown) => {
        const message = (e as Error)?.message ?? String(e);
        state = { kind: "failed", message };
        deps.stderr(`${deps.prog}: ${message}\n`);
        if (finished) return;
        goLocal("provisioning failed"); // answers whatever the client already sent, e.g. its initialize
        if (eof) finish(69);
      },
    );
  });
}

/** Protocol versions the proxy's own `initialize` answer accepts; the client's is echoed, else the newest. */
export const PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"] as const;

/** The id of the proxy's own `initialize` to the server after a lazy start. No client line reaches the server before it is answered, so no client id can collide with it. */
const HANDSHAKE_ID = "aiplus-office-lazy-start-initialize";

const DEFAULT_INIT_PARAMS = { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "aiplus-office", version: "0" } };

/** The `id` and `params` of a JSON-RPC `initialize` request line, or `undefined`. */
function initRequest(line: string): { id: unknown; params: unknown } | undefined {
  try {
    const m = JSON.parse(line) as { method?: unknown; id?: unknown; params?: unknown } | null;
    return m && !Array.isArray(m) && m.method === "initialize" && m.id !== undefined ? { id: m.id, params: m.params } : undefined;
  } catch {
    return undefined;
  }
}
