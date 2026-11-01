/**
 * The combined server `aiplus-office mcp` (change office-mcp-one-server, office-mcp "One server for the four apps",
 * "No app process before its first call"): run in-process, each app through the real per-app proxy against the fake
 * server.
 */
import { spawn as nodeSpawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type McpManifest, routeTool, runHub, TOOL_PREFIX } from "../mcp-hub.js";
import { MCP_MANIFEST } from "../mcp-manifest.js";
import { runMcp } from "../mcp-proxy.js";
import type { ProvisionReport } from "../provision.js";
import { APP_IDS, type CraftAppId } from "../registry.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";
import { inProcessMcp } from "./helpers/mcp-client.js";
import { GRID_MCP_STUB, nodeStub } from "./helpers/stubs.js";

afterEach(cleanupTmp);

const INIT = { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "hub-test", version: "1" } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type ToolList = { tools: { name: string }[] };
type ToolResult = { content: { text: string }[]; isError: boolean };

const tools = (...names: string[]) => names.map((name) => ({ name, inputSchema: { type: "object" } }));
const MANIFEST: McpManifest = {
  wordcraft: { version: "1", instructions: "WordCraft notes.", tools: tools("list_commands", "open_document") },
  gridcraft: { version: "1", instructions: "GridCraft notes.", tools: tools("list_commands", "read_range", "screenshot") },
  deckcraft: { version: "1", instructions: "DeckCraft notes.", tools: tools("list_commands", "add_slide") },
  pdfcraft: { version: "1", instructions: "PdfCraft notes.", tools: tools("doc_open") },
};

function setup(opts: { notInstalled?: CraftAppId[]; provisionMs?: number } = {}) {
  const root = fs.realpathSync(tmpDir("hub-root-"));
  const logs = tmpDir("hub-log-");
  const started: { app: string; argv: string[] }[] = [];
  const spawned: string[] = [];
  const client = inProcessMcp(({ stdin, stdout, stderr }) =>
    runHub(["--root", root], {
      prog: "aiplus-office",
      stdin,
      stdout,
      stderr,
      cwd: () => root,
      chatRoot: () => root,
      onSignal: () => {},
      serverVersion: "9.9.9",
      manifest: MANIFEST,
      installed: (app) => !(opts.notInstalled ?? []).includes(app.id),
      runBackend: (app, argv, io) => {
        started.push({ app: app.id, argv });
        const bin = nodeStub(GRID_MCP_STUB, `${app.id}-cli`);
        return runMcp(app, argv, {
          provision: async () => {
            await sleep(opts.provisionMs ?? 0);
            return { app: app.id, version: "1.0.0", source: "latest-cached", asset: null, cacheHit: true, binary: bin, durationMs: 0 } as ProvisionReport;
          },
          spawn: ((c: string, a: string[], o: object) => {
            spawned.push(app.id);
            return nodeSpawn(c, a, { ...o, env: { ...process.env, STUB_LOG: path.join(logs, `${app.id}.jsonl`) } } as never);
          }) as never,
          stdin: io.stdin,
          stdout: io.stdout,
          stderr: io.stderr,
          cwd: () => root,
          onSignal: () => {},
        });
      },
    }),
  );
  const received = (app: string) => {
    const f = path.join(logs, `${app}.jsonl`);
    return fs.existsSync(f)
      ? fs
          .readFileSync(f, "utf8")
          .trim()
          .split("\n")
          .map((l) => JSON.parse(l) as { method?: string; params?: { name?: string; arguments?: unknown } })
      : [];
  };
  return { client, root, started, spawned, received };
}

describe("REQ-OFFICE-MCP: one server for the four apps (change office-mcp-one-server)", () => {
  it("answers initialize and tools/list from the manifest without starting any app; tools carry the app prefix", async () => {
    const { client, root, started, spawned } = setup();
    const init = await client.request("initialize", INIT);
    expect(init.ms).toBeLessThan(1000);
    const r = init.result as { protocolVersion: string; capabilities: { tools: { listChanged: boolean } }; serverInfo: { name: string; version: string }; instructions: string };
    expect(r.protocolVersion).toBe("2025-06-18");
    expect(r.capabilities.tools.listChanged).toBe(true);
    expect(r.serverInfo).toEqual({ name: "aiplus-office", version: "9.9.9" });
    for (const p of Object.values(TOOL_PREFIX)) expect(r.instructions).toContain(p);
    expect(r.instructions).toContain("WordCraft notes.");
    expect(r.instructions).toContain(`Files: only inside ${root}`);
    client.notify("notifications/initialized");
    const names = ((await client.request("tools/list")).result as ToolList).tools.map((t) => t.name);
    expect(names).toEqual(["word_list_commands", "word_open_document", "grid_list_commands", "grid_read_range", "deck_list_commands", "deck_add_slide", "pdf_doc_open"]);
    expect((await client.request("ping")).result).toEqual({});
    await sleep(100);
    expect(started).toEqual([]);
    expect(spawned).toEqual([]);
    expect(await client.close()).toBe(0);
  });

  it("starts only the called app, routes the call under the tool's own name, and answers under the client's id", async () => {
    const { client, root, started, received } = setup();
    await client.request("initialize", INIT);
    client.notify("notifications/initialized");
    const res = (await client.request("tools/call", { name: "deck_list_commands", arguments: { q: 1 } })).result as ToolResult;
    expect(res.isError).toBe(false);
    expect(JSON.parse(res.content[0].text)).toEqual({ name: "list_commands", arguments: { q: 1 } });
    expect(started).toEqual([{ app: "deckcraft", argv: ["--root", root] }]);
    expect(received("deckcraft").filter((m) => m.method === "tools/call").map((m) => m.params?.name)).toEqual(["list_commands"]);
    expect(received("wordcraft")).toEqual([]);
    // A second call reuses the running app.
    await client.request("tools/call", { name: "deck_add_slide", arguments: {} });
    expect(started).toHaveLength(1);
    expect(await client.close()).toBe(0);
  });

  it("PdfCraft runs compact; the app's own tool list replaces the manifest's with tools/list_changed", async () => {
    const { client, root, started } = setup();
    await client.request("initialize", INIT);
    client.notify("notifications/initialized");
    await client.request("tools/call", { name: "pdf_doc_open", arguments: {} });
    expect(started[0]).toEqual({ app: "pdfcraft", argv: ["--root", root, "--compact"] });
    await client.waitFor("notifications/tools/list_changed");
    const names = ((await client.request("tools/list")).result as ToolList).tools.map((t) => t.name);
    expect(names).toContain("pdf_execute_command"); // the fake server's list
    expect(names).not.toContain("pdf_doc_open");
    expect(names).toContain("word_open_document"); // the others stay on the manifest
    await client.close();
  });

  it("an app that is not installed starts at once, so its download runs while the session opens", async () => {
    const { client, started, received } = setup({ notInstalled: ["gridcraft"] });
    await sleep(50);
    expect(started.map((s) => s.app)).toEqual(["gridcraft"]);
    await client.request("initialize", INIT);
    client.notify("notifications/initialized");
    for (let i = 0; i < 50 && !received("gridcraft").some((m) => m.method === "initialize"); i++) await sleep(50);
    expect(received("gridcraft").some((m) => m.method === "initialize")).toBe(true);
    await client.close();
  });

  it("GridCraft stays confined by the gateway: a path outside the root never reaches its server", async () => {
    const { client, received } = setup();
    await client.request("initialize", INIT);
    client.notify("notifications/initialized");
    const res = (await client.request("tools/call", { name: "grid_open_workbook", arguments: { path: "/etc/passwd" } })).result as ToolResult;
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/kívül van.*English: path refused/);
    expect(received("gridcraft").filter((m) => m.method === "tools/call")).toEqual([]);
    await client.close();
  });

  it("an unknown tool gets a tool error and starts nothing", async () => {
    const { client, started } = setup();
    await client.request("initialize", INIT);
    const res = (await client.request("tools/call", { name: "list_commands", arguments: {} })).result as ToolResult;
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("unknown tool: list_commands");
    expect(started).toEqual([]);
    await client.close();
  });

  it("a call cancelled while its app is still starting never reaches the app", async () => {
    const { client, received } = setup({ provisionMs: 300 });
    await client.request("initialize", INIT);
    client.notify("notifications/initialized");
    const pending = client.request("tools/call", { name: "word_open_document", arguments: {} }).catch(() => undefined);
    // The client's ids count up from 1: initialize = 1, this call = 2.
    client.notify("notifications/cancelled", { requestId: 2 });
    const after = (await client.request("tools/call", { name: "word_list_commands", arguments: {} })).result as ToolResult;
    expect(JSON.parse(after.content[0].text).name).toBe("list_commands");
    expect(received("wordcraft").filter((m) => m.method === "tools/call").map((m) => m.params?.name)).toEqual(["list_commands"]);
    void pending;
    await client.close();
  });

  it("refuses --compact and --allow-unconfined, and a root that is not a folder", async () => {
    const io = { stdin: process.stdin, stdout: process.stdout };
    let err = "";
    const deps = { ...io, prog: "aiplus-office", stderr: (t: string) => (err += t), cwd: () => "/", chatRoot: () => "/", onSignal: () => {}, serverVersion: "0", manifest: MANIFEST, installed: () => true, runBackend: async () => 0 };
    expect(await runHub(["--compact"], deps)).toBe(1);
    expect(await runHub(["--allow-unconfined"], deps)).toBe(1);
    expect(await runHub(["--root", "/nonexistent-aiplus-office-root"], deps)).toBe(1);
    expect(err).toContain("is not an existing folder");
  });
});

describe("the bundled manifest (scripts/mcp-manifest.mjs)", () => {
  it("holds every app with tools and instructions, and no local path", () => {
    for (const id of APP_IDS) {
      expect(MCP_MANIFEST[id].tools.length, id).toBeGreaterThan(0);
      expect(MCP_MANIFEST[id].instructions, id).not.toBe("");
    }
    const text = JSON.stringify(MCP_MANIFEST);
    expect(text).not.toMatch(/\/home\/|\/Users\/|[A-Z]:\\\\Users|aiplus-office-manifest-/);
  });

  it("prefixed names are unique across the four apps and route back to their app", () => {
    const names = APP_IDS.flatMap((id) => MCP_MANIFEST[id].tools.map((t) => `${TOOL_PREFIX[id]}${t.name}`));
    expect(new Set(names).size).toBe(names.length);
    for (const id of APP_IDS) for (const t of MCP_MANIFEST[id].tools) expect(routeTool(`${TOOL_PREFIX[id]}${t.name}`)).toMatchObject({ app: { id }, tool: t.name });
  });
});
