/**
 * A minimal stdio MCP client for the real-app tests: spawns `aiplus-office <app> mcp …` through tsx, does the
 * handshake, and sends one request at a time. See change: office-mcp-grid-deck. Also an in-process client for the
 * proxy's lazy start (change office-mcp-lazy-start).
 */
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import * as readline from "node:readline";
import { PassThrough } from "node:stream";
import { OFFICE_CLI, TSX } from "./paths.js";

export interface McpToolResult {
  content?: { type: string; text?: string }[];
  isError?: boolean;
}

export interface McpSession {
  /** The `initialize` result. */
  init: { instructions?: string };
  stderr: () => string;
  request: (method: string, params?: unknown) => Promise<{ result?: unknown; error?: { code: number; message: string } }>;
  listTools: () => Promise<string[]>;
  call: (name: string, args?: Record<string, unknown>) => Promise<McpToolResult>;
  close: () => Promise<void>;
}

export async function mcpSession(args: string[], cwd: string, env: NodeJS.ProcessEnv, timeoutMs = 120_000): Promise<McpSession> {
  const child: ChildProcessWithoutNullStreams = spawn(process.execPath, ["--import", TSX, OFFICE_CLI, ...args], {
    cwd,
    env: { ...process.env, NODE_OPTIONS: "", ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (d) => {
    stderr += d;
  });
  const waiting = new Map<number, (m: { result?: unknown; error?: { code: number; message: string } }) => void>();
  readline.createInterface({ input: child.stdout }).on("line", (line) => {
    let m: { id?: number };
    try {
      m = JSON.parse(line);
    } catch {
      return;
    }
    if (m.id !== undefined) waiting.get(m.id)?.(m as never);
  });
  let next = 0;
  const request = (method: string, params?: unknown) =>
    new Promise<{ result?: unknown; error?: { code: number; message: string } }>((resolve, reject) => {
      const id = ++next;
      const timer = setTimeout(() => reject(new Error(`${method} timed out; stderr: ${stderr}`)), timeoutMs);
      waiting.set(id, (m) => {
        clearTimeout(timer);
        waiting.delete(id);
        resolve(m);
      });
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) })}\n`);
    });
  const init = await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "aiplus-office-test", version: "0" } });
  if (init.error) throw new Error(`initialize failed: ${init.error.message}; stderr: ${stderr}`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  return {
    init: init.result as { instructions?: string },
    stderr: () => stderr,
    request,
    listTools: async () => ((await request("tools/list")).result as { tools: { name: string }[] }).tools.map((t) => t.name),
    call: async (name, a = {}) => {
      const r = await request("tools/call", { name, arguments: a });
      if (r.error) return { isError: true, content: [{ type: "text", text: r.error.message }] };
      return r.result as McpToolResult;
    },
    close: () =>
      new Promise<void>((resolve) => {
        child.on("close", () => resolve());
        child.stdin.end();
        setTimeout(() => child.kill(), 5_000).unref();
      }),
  };
}

/** The text of a tool result. */
export const text = (r: McpToolResult): string => (r.content ?? []).map((c) => c.text ?? "").join("\n");

export interface InProcessMcp {
  /** Send a request; resolves with the response and the milliseconds it took. */
  request: (method: string, params?: unknown) => Promise<{ result?: unknown; error?: { code: number; message: string }; ms: number }>;
  notify: (method: string, params?: unknown) => void;
  /** Notifications the proxy sent the client, in order. */
  notifications: { method: string; at: number }[];
  /** Resolves when a notification with this method arrives (or has arrived). */
  waitFor: (method: string, timeoutMs?: number) => Promise<void>;
  stderr: () => string;
  /** Close stdin; resolves with the proxy's exit code. */
  close: () => Promise<number>;
  /** The proxy's exit code once it ends. */
  done: Promise<number>;
}

/**
 * An MCP client talking to `runMcp` in this process over two PassThrough streams, with response timing. `start` gets
 * the stdin, stdout and stderr deps and returns `runMcp`'s promise. See change: office-mcp-lazy-start.
 */
export function inProcessMcp(start: (io: { stdin: PassThrough; stdout: PassThrough; stderr: (t: string) => void }) => Promise<number>): InProcessMcp {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  let err = "";
  const waiting = new Map<unknown, (m: { result?: unknown; error?: { code: number; message: string } }) => void>();
  const notifications: { method: string; at: number }[] = [];
  const watchers: { method: string; resolve: () => void }[] = [];
  readline.createInterface({ input: stdout }).on("line", (line) => {
    const m = JSON.parse(line) as { id?: unknown; method?: string };
    if (m.method !== undefined && m.id === undefined) {
      notifications.push({ method: m.method, at: Date.now() });
      for (const w of watchers.filter((x) => x.method === m.method)) w.resolve();
    } else if (m.id !== undefined) waiting.get(m.id)?.(m as never);
  });
  const done = start({ stdin, stdout, stderr: (t) => (err += t) });
  let next = 0;
  return {
    request: (method, params) =>
      new Promise((resolve, reject) => {
        const id = ++next;
        const sent = Date.now();
        const timer = setTimeout(() => reject(new Error(`${method} timed out; stderr: ${err}`)), 10_000);
        waiting.set(id, (m) => {
          clearTimeout(timer);
          waiting.delete(id);
          resolve({ ...m, ms: Date.now() - sent });
        });
        stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) })}\n`);
      }),
    notify: (method, params) => stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, ...(params === undefined ? {} : { params }) })}\n`),
    notifications,
    waitFor: (method, timeoutMs = 10_000) =>
      notifications.some((n) => n.method === method)
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`no ${method} within ${timeoutMs} ms; stderr: ${err}`)), timeoutMs);
            watchers.push({ method, resolve: () => (clearTimeout(timer), resolve()) });
          }),
    stderr: () => err,
    close: () => {
      stdin.end();
      return done;
    },
    done,
  };
}
