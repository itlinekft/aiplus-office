/**
 * `aiplus-office mcp` — one stdio MCP server for the four office apps.
 *
 * Measured 2026-11-01: every MCP server of the plugin is one node process per Claude session (a fresh idle proxy holds
 * 87 MB RSS), so four servers × 18 sessions came to 72 node processes. This server replaces the four: one node process
 * per session, and no app process until the app is used.
 *
 * - Tools are listed with a prefix per app (`TOOL_PREFIX`): the apps share names such as `list_commands`, `batch`,
 *   `select`, `insert_chart`. A `tools/call` goes to that app with the tool's own name, under an id of this server's;
 *   the answer returns under the client's id. `notifications/cancelled` is mapped the same way.
 * - `initialize`, `ping` and `tools/list` are answered here, from the bundled manifest (`src/mcp-manifest.ts`), without
 *   starting an app. An installed app starts at its first `tools/call`; an app with no installed version starts at
 *   once, so its download runs while the session opens (as with the four servers before). When an app runs, its own
 *   tool list replaces the manifest's, and the client gets `notifications/tools/list_changed` if it differs.
 * - Each app runs through the per-app proxy (`runMcp`, in this process, over in-memory streams): confinement, the
 *   GridCraft gateway, serialised calls and the lazy start are the same as for `aiplus-office <app> mcp`.
 * - An app's server is never stopped for being idle: that would drop the open document. One that ends by itself is
 *   started again by the next call to it.
 *
 * See change: office-mcp-one-server.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { PassThrough, type Readable, type Writable } from "node:stream";
import { createGateway, GRID_TOOLS, refusalText } from "./mcp-gateway.js";
import { MCP_MANIFEST } from "./mcp-manifest.js";
import { defaultChatRoot, parseMcpArgs, PROTOCOL_VERSIONS, runMcp } from "./mcp-proxy.js";
import { cacheRoot, installedVersions, type ProvisionReport } from "./provision.js";
import { CRAFT_APPS, type CraftApp, type CraftAppId, envPrefix } from "./registry.js";

export interface McpTool {
  name: string;
  [key: string]: unknown;
}

/** Per app: the server version the manifest was taken from, its `instructions` and its `tools/list` (unfiltered). */
export type McpManifest = Record<CraftAppId, { version: string; instructions: string; tools: McpTool[] }>;

/** Tool-name prefix per app. Short, so `mcp__plugin_aiplus-office_aiplus-office__<prefix><tool>` stays readable. */
export const TOOL_PREFIX: Readonly<Record<CraftAppId, string>> = { wordcraft: "word_", gridcraft: "grid_", deckcraft: "deck_", pdfcraft: "pdf_" };

/** Format each app saves, for the instructions. */
const FORMAT: Readonly<Record<CraftAppId, string>> = { wordcraft: "DOCX", gridcraft: "XLSX", deckcraft: "PPTX", pdfcraft: "PDF" };

export interface HubIo {
  stdin: Readable;
  stdout: Writable;
  stderr: (text: string) => void;
}

export interface HubDeps {
  prog: string;
  stdin: Readable;
  stdout: Writable;
  stderr: (text: string) => void;
  cwd: () => string;
  chatRoot: () => string;
  onSignal: (signal: "SIGINT" | "SIGTERM", handler: () => void) => void;
  serverVersion: string;
  manifest: McpManifest;
  /** True when the app needs no download (an installed version, or `AIPLUS_OFFICE_<APP>_BIN`). Reads the disk only. */
  installed: (app: CraftApp) => boolean;
  /** Run the per-app proxy for `app` with `argv` over `io`; resolves with its exit code. */
  runBackend: (app: CraftApp, argv: string[], io: HubIo) => Promise<number>;
}

export function hubUsage(prog = "aiplus-office"): string {
  return `usage: ${prog} mcp [--root <dir>]

One stdio MCP server for the four office apps, each confined to <dir> (default: the current directory). Tools carry a
prefix: ${CRAFT_APPS.map((a) => `${TOOL_PREFIX[a.id]}* = ${a.name}`).join(", ")}. An app starts at its first tool call.
For one app alone: ${prog} <app> mcp.`;
}

type Json = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown; result?: unknown; error?: unknown };

interface Backend {
  app: CraftApp;
  /** Resolves when the app's server answered `initialize`; rejects when it ended before. */
  ready: Promise<void>;
  done: Promise<number>;
  ended: boolean;
  write: (o: unknown) => void;
  end: () => void;
  /** This server's request id → the client's, for the calls in flight. */
  calls: Map<number, unknown>;
  nextId: () => number;
}

/** The app a prefixed tool name belongs to, and the app's own tool name. */
export function routeTool(name: unknown): { app: CraftApp; tool: string } | undefined {
  if (typeof name !== "string") return undefined;
  const app = CRAFT_APPS.find((a) => name.startsWith(TOOL_PREFIX[a.id]) && name.length > TOOL_PREFIX[a.id].length);
  return app ? { app, tool: name.slice(TOOL_PREFIX[app.id].length) } : undefined;
}

export async function runHub(argv: string[], deps: HubDeps): Promise<number> {
  const usage = hubUsage(deps.prog);
  const parsed = parseMcpArgs(argv);
  if (parsed.kind === "help") {
    deps.stderr(`${usage}\n`);
    return 0;
  }
  if (parsed.kind === "error" || parsed.allowUnconfined || parsed.compact) {
    const message = parsed.kind === "error" ? parsed.message : `option ${parsed.allowUnconfined ? "--allow-unconfined" : "--compact"} is not taken here: every app is confined, PdfCraft is always compact`;
    deps.stderr(`${message}\n${usage}\n`);
    return 1;
  }
  let root: string;
  if (parsed.noProject) {
    root = deps.chatRoot();
    try {
      fs.mkdirSync(root, { recursive: true });
    } catch (e) {
      deps.stderr(`${deps.prog}: cannot create the chat folder ${root}: ${(e as Error).message}\n`);
      return 1;
    }
    deps.stderr(`[${deps.prog}] no project folder from the client (plain Chat): files go to ${root}\n`);
  } else root = path.resolve(deps.cwd(), parsed.root ?? ".");
  try {
    if (!fs.statSync(root).isDirectory()) throw new Error("not a folder");
  } catch {
    deps.stderr(`${deps.prog}: the mcp root ${root} is not an existing folder; refusing to start\n`);
    return 1;
  }

  const log = (text: string) => deps.stderr(`[${deps.prog}] mcp: ${text}\n`);
  const toClient = (o: unknown) => deps.stdout.write(`${JSON.stringify(o)}\n`);
  const backendArgv = (app: CraftApp) => ["--root", root, ...(app.mcp.compactFlag ? [app.mcp.compactFlag] : [])];

  /** The app servers' own tool lists, once they run; the manifest's until then. */
  const live = new Map<CraftAppId, McpTool[]>();
  const manifestTools = (app: CraftApp): McpTool[] => {
    const tools = deps.manifest[app.id]?.tools ?? [];
    return app.mcp.confinement === "gateway" ? tools.filter((t) => (GRID_TOOLS as readonly string[]).includes(t.name)) : tools;
  };
  const toolsOf = (app: CraftApp) => live.get(app.id) ?? manifestTools(app);
  const listAll = () => CRAFT_APPS.flatMap((a) => toolsOf(a).map((t) => ({ ...t, name: `${TOOL_PREFIX[a.id]}${t.name}` })));

  const instructions = (): string => {
    const head = refusalText(
      `AI+ Iroda: a négy ArtCraft irodai program egy kapcsolatban. Eszköz-előtagok: ${CRAFT_APPS.map((a) => `${TOOL_PREFIX[a.id]} = ${a.name} (${FORMAT[a.id]})`).join(", ")}.`,
      `AI+ Office: the four ArtCraft office apps in one connection. Tool prefixes: ${CRAFT_APPS.map((a) => `${TOOL_PREFIX[a.id]} = ${a.name} (${FORMAT[a.id]})`).join(", ")}. An app starts at its first call; while it downloads, its tools say so. Files: only inside ${root}; a relative path is resolved against it. The app notes below name the tools without the prefix.`,
    );
    const notes = CRAFT_APPS.map((a) => {
      let text = deps.manifest[a.id]?.instructions ?? "";
      if (a.mcp.confinement === "gateway") text = (createGateway(a.name, root).annotateInitialize({ instructions: text }) as { instructions: string }).instructions;
      return `${TOOL_PREFIX[a.id]} — ${a.name}: ${text}`;
    });
    return [head, ...notes].join("\n\n");
  };

  let clientInitialized = false;
  let resolveClientInit: (params: unknown) => void = () => {};
  const clientInit = new Promise<unknown>((r) => {
    resolveClientInit = r;
  });

  const backends = new Map<CraftAppId, Backend>();
  /** Every backend promise ever started, for the exit. */
  const running = new Set<Promise<number>>();
  /** The client's id of a call → where it went (`bid` undefined while it waits for the app to be ready). */
  const sent = new Map<unknown, { b: Backend; bid?: number; cancelled?: boolean }>();

  const startBackend = (app: CraftApp, why: string): Backend => {
    log(`starting ${app.name} (${why})`);
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const done = deps.runBackend(app, backendArgv(app), { stdin, stdout, stderr: deps.stderr });
    running.add(done);
    let id = 0;
    const waiting = new Map<number, (m: Json) => void>();
    const b: Backend = {
      app,
      ready: Promise.resolve(),
      done,
      ended: false,
      write: (o) => {
        if (!stdin.writableEnded) stdin.write(`${JSON.stringify(o)}\n`);
      },
      end: () => {
        if (!stdin.writableEnded) stdin.end();
      },
      calls: new Map(),
      nextId: () => ++id,
    };
    const request = (method: string, params?: unknown) =>
      new Promise<Json>((resolve) => {
        const i = b.nextId();
        waiting.set(i, resolve);
        b.write({ jsonrpc: "2.0", id: i, method, ...(params === undefined ? {} : { params }) });
      });

    /** Take the app's own tool list, unless it is the per-app proxy's stand-in while the app downloads. */
    const refreshList = async () => {
      const r = await request("tools/list");
      const tools = (r.result as { tools?: unknown } | undefined)?.tools;
      if (!Array.isArray(tools) || tools.length === 0) return;
      if (tools.length === 1 && (tools[0] as McpTool)?.name === `${app.id}_status`) return;
      const before = JSON.stringify(toolsOf(app));
      live.set(app.id, tools as McpTool[]);
      if (JSON.stringify(tools) !== before && clientInitialized) {
        log(`${app.name}'s own tool list differs from the manifest; tools/list_changed sent`);
        toClient({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });
      }
    };

    readline.createInterface({ input: stdout }).on("line", (line) => {
      let m: Json;
      try {
        m = JSON.parse(line);
      } catch {
        deps.stderr(`${line}\n`);
        return;
      }
      if (m === null || typeof m !== "object" || Array.isArray(m)) return;
      if (m.method === undefined && typeof m.id === "number") {
        const w = waiting.get(m.id);
        if (w) {
          waiting.delete(m.id);
          return w(m);
        }
        if (b.calls.has(m.id)) {
          const clientId = b.calls.get(m.id);
          b.calls.delete(m.id);
          sent.delete(clientId);
          toClient({ ...m, id: clientId });
        }
        return;
      }
      if (typeof m.method !== "string") return;
      if (m.id !== undefined) {
        // A request from the app's server (roots, sampling …): this server offers none.
        b.write({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `${deps.prog} does not answer ${m.method}` } });
        return;
      }
      if (m.method === "notifications/tools/list_changed") {
        refreshList().catch(() => {});
        return;
      }
      if (clientInitialized) toClient(m); // progress, logging
    });

    const ended = done.then((code) => {
      b.ended = true;
      if (backends.get(app.id) === b) backends.delete(app.id);
      log(`${app.name} ended (exit ${code})`);
      for (const [bid, clientId] of b.calls) {
        sent.delete(clientId);
        toClient({ jsonrpc: "2.0", id: clientId, result: errorResult(endedText(app, code)) });
        b.calls.delete(bid);
      }
      for (const w of waiting.values()) w({ error: { code: -32603, message: "ended" } });
      waiting.clear();
      return code;
    });
    b.ready = Promise.race([
      (async () => {
        const params = await clientInit;
        const r = await request("initialize", params);
        if (b.ended) throw new Error(endedText(app, await done));
        if (r.error) log(`${app.name} refused initialize (${JSON.stringify(r.error)}); going on`);
        b.write({ jsonrpc: "2.0", method: "notifications/initialized" });
        refreshList().catch(() => {});
      })(),
      ended.then((code) => {
        throw new Error(endedText(app, code));
      }),
    ]);
    b.ready.catch(() => {});
    backends.set(app.id, b);
    return b;
  };

  const endedText = (app: CraftApp, code: number) =>
    refusalText(
      `A(z) ${app.name} leállt (kilépési kód ${code}). Próbáld újra: a következő hívás újraindítja.`,
      `${app.name} stopped (exit code ${code}). Try again: the next call starts it again.`,
    );
  const errorResult = (text: string) => ({ content: [{ type: "text", text }], isError: true });

  const call = (clientId: unknown, params: { name?: unknown; [k: string]: unknown } | undefined) => {
    const route = routeTool(params?.name);
    if (!route) {
      toClient({
        jsonrpc: "2.0",
        id: clientId,
        result: errorResult(refusalText(`Ismeretlen eszköz: ${String(params?.name)}.`, `unknown tool: ${String(params?.name)}.`)),
      });
      return;
    }
    const b = backends.get(route.app.id) ?? startBackend(route.app, "first call");
    const entry: { b: Backend; bid?: number; cancelled?: boolean } = { b };
    if (clientId !== undefined) sent.set(clientId, entry);
    b.ready.then(
      () => {
        if (entry.cancelled) return void sent.delete(clientId);
        if (b.ended) {
          sent.delete(clientId);
          return toClient({ jsonrpc: "2.0", id: clientId, result: errorResult(endedText(route.app, -1)) });
        }
        const bid = b.nextId();
        entry.bid = bid;
        if (clientId !== undefined) b.calls.set(bid, clientId);
        b.write({ jsonrpc: "2.0", id: bid, method: "tools/call", params: { ...params, name: route.tool } });
      },
      (e: unknown) => {
        sent.delete(clientId);
        if (clientId !== undefined) toClient({ jsonrpc: "2.0", id: clientId, result: errorResult((e as Error).message) });
      },
    );
  };

  const onLine = (line: string) => {
    let msg: unknown;
    try {
      msg = JSON.parse(line);
    } catch {
      return toClient({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } });
    }
    if (Array.isArray(msg) || msg === null || typeof msg !== "object") {
      return toClient({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "batch requests are not supported by this server" } });
    }
    const { method, id, params } = msg as Json;
    if (typeof method !== "string") return; // a response: this server sends the client no requests
    if (id === undefined) {
      if (method === "notifications/initialized") clientInitialized = true;
      else if (method === "notifications/cancelled") {
        const requestId = (params as { requestId?: unknown } | undefined)?.requestId;
        const entry = sent.get(requestId);
        if (!entry) return;
        if (entry.bid === undefined) entry.cancelled = true;
        else entry.b.write({ jsonrpc: "2.0", method, params: { ...(params as object), requestId: entry.bid } });
      }
      return;
    }
    const reply = (result: unknown) => toClient({ jsonrpc: "2.0", id, result });
    switch (method) {
      case "initialize": {
        const requested = (params as { protocolVersion?: unknown } | undefined)?.protocolVersion;
        const protocolVersion = typeof requested === "string" && (PROTOCOL_VERSIONS as readonly string[]).includes(requested) ? requested : PROTOCOL_VERSIONS[PROTOCOL_VERSIONS.length - 1];
        reply({ protocolVersion, capabilities: { tools: { listChanged: true } }, serverInfo: { name: deps.prog, version: deps.serverVersion }, instructions: instructions() });
        resolveClientInit(params);
        clientInitialized = true; // a client that skips notifications/initialized still gets list_changed
        return;
      }
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: listAll() });
      case "tools/call":
        return call(id, params as { name?: unknown } | undefined);
      case "resources/list":
        return reply({ resources: [] });
      case "resources/templates/list":
        return reply({ resourceTemplates: [] });
      case "prompts/list":
        return reply({ prompts: [] });
      default:
        toClient({ jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } });
    }
  };

  return new Promise<number>((resolveRun) => {
    let finishing = false;
    let exitOverride: number | undefined;
    const finish = async () => {
      if (finishing) return;
      finishing = true;
      for (const b of backends.values()) b.end();
      const codes = await Promise.all(running);
      resolveRun(exitOverride ?? codes.find((c) => c !== 0) ?? 0);
    };
    const rl = readline.createInterface({ input: deps.stdin });
    rl.on("line", (line) => {
      if (line.trim() !== "") onLine(line);
    });
    rl.on("close", () => void finish());
    deps.onSignal("SIGINT", () => {
      exitOverride = 130;
      void finish();
    });
    deps.onSignal("SIGTERM", () => {
      exitOverride = 143;
      void finish();
    });

    const atOnce = CRAFT_APPS.filter((a) => !deps.installed(a));
    log(`root ${root}; ${atOnce.length === 0 ? "every app installed, none started" : `downloading now: ${atOnce.map((a) => a.name).join(", ")}`}`);
    for (const app of atOnce) startBackend(app, "not installed yet");
  });
}

/** The real dependencies: the bundled manifest, the per-app proxy in this process, the disk-only install check. */
export function defaultHubDeps(o: {
  provision: (appId: string, opts?: { probeVersion?: boolean; preferInstalled?: boolean }) => Promise<ProvisionReport>;
  stderr: (text: string) => void;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  homedir: () => string;
  version: string;
}): HubDeps {
  return {
    prog: "aiplus-office",
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: o.stderr,
    cwd: () => process.cwd(),
    chatRoot: () => defaultChatRoot(o.env, o.homedir()),
    onSignal: (signal, handler) => {
      process.on(signal, handler);
    },
    serverVersion: o.version,
    manifest: MCP_MANIFEST,
    installed: (app) => {
      if (o.env[`${envPrefix(app)}_BIN`]) return true;
      try {
        return installedVersions(app, cacheRoot(app, { env: o.env, homedir: o.homedir, platform: o.platform }), o.platform).length > 0;
      } catch {
        return false;
      }
    },
    runBackend: (app, argv, io) =>
      runMcp(app, argv, { prog: "aiplus-office", provision: (opts) => o.provision(app.id, opts), stdin: io.stdin, stdout: io.stdout, stderr: io.stderr, serverVersion: o.version }),
  };
}
