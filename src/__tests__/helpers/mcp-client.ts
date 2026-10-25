/**
 * A minimal stdio MCP client for the real-app tests: spawns `aiplus-office <app> mcp …` through tsx, does the
 * handshake, and sends one request at a time. See change: office-mcp-grid-deck.
 */
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import * as readline from "node:readline";
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
