/**
 * The combined server `aiplus-office mcp` (change office-mcp-one-server, office-mcp "One server for the four apps",
 * "No app process before its first call"): run in-process, each app through the real per-app proxy against the fake
 * server.
 */
import { spawn as nodeSpawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkArguments, CONTRACT_VERSION, type McpManifest, MAX_LINE_BYTES, readLines, routeTool, runHub, TOOL_PREFIX } from "../mcp-hub.js";
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
  wordcraft: {
    version: "1",
    instructions: "WordCraft notes.",
    tools: [...tools("list_commands"), { name: "open_document", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } }],
  },
  gridcraft: { version: "1", instructions: "GridCraft notes.", tools: tools("list_commands", "read_range", "open_workbook", "screenshot") },
  deckcraft: { version: "1", instructions: "DeckCraft notes.", tools: tools("list_commands", "add_slide") },
  pdfcraft: { version: "1", instructions: "PdfCraft notes.", tools: tools("doc_open") },
};

function setup(opts: { notInstalled?: CraftAppId[]; provisionMs?: number; readPath?: boolean } = {}) {
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
            return nodeSpawn(c, a, { ...o, env: { ...process.env, STUB_LOG: path.join(logs, `${app.id}.jsonl`), ...(opts.readPath ? { STUB_READ_PATH: "1", STUB_EXTRA_TOOLS: "open_document" } : {}) } } as never);
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
    expect(r.serverInfo).toEqual({ name: "aiplus-office", version: "9.9.9", contractVersion: CONTRACT_VERSION });
    for (const p of Object.values(TOOL_PREFIX)) expect(r.instructions).toContain(p);
    expect(r.instructions).toContain("WordCraft notes.");
    expect(r.instructions).toContain(`Files: only inside ${root}`);
    client.notify("notifications/initialized");
    const names = ((await client.request("tools/list")).result as ToolList).tools.map((t) => t.name);
    expect(names).toEqual(["office_status", "word_list_commands", "word_open_document", "grid_list_commands", "grid_read_range", "grid_open_workbook", "deck_list_commands", "deck_add_slide", "pdf_doc_open"]);
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

  it("an unknown tool gets -32602 with a fixed sentence and starts nothing", async () => {
    const { client, started } = setup();
    await client.request("initialize", INIT);
    for (const name of ["list_commands", "word_no_such_tool"]) {
      const res = await client.request("tools/call", { name, arguments: {} });
      expect(res.error).toEqual({ code: -32602, message: "No such tool." });
    }
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

describe("REQ: Exact MCP wire (C10 v2) — change office-mcp-c10-v2", () => {
  const SENTINEL = "c10zqsentinel";
  /** Sends raw text and resolves with the replies it produced (waits until `n` new lines or 300 ms of quiet). */
  const exchange = async (client: ReturnType<typeof setup>["client"], text: string, n = 1) => {
    const before = client.replies.length;
    client.sendRaw(text);
    for (let i = 0; i < 100 && client.replies.length < before + n; i++) await sleep(10);
    if (n === 0) await sleep(150);
    return client.replies.slice(before);
  };
  const err = (code: number, id: unknown) => expect.objectContaining({ jsonrpc: "2.0", id, error: expect.objectContaining({ code }) });

  it("refuses every frame outside the closed envelope, with the request's id only when it is valid, and lives", async () => {
    const { client } = setup();
    await client.request("initialize", INIT);
    expect(await exchange(client, "{not json\n")).toEqual([err(-32700, null)]);
    for (const frame of ["[1,2]", "null", "42", '"x"', '{"jsonrpc":"2.0","id":null,"method":"ping"}', '{"jsonrpc":"2.0","method":1}', '{"jsonrpc":"2.0","id":1.5,"method":"ping"}', '{"jsonrpc":"2.0","id":true,"method":"ping"}', '{"jsonrpc":"2.0","id":7,"method":"ping","params":[1]}', '{"jsonrpc":"2.0","id":8,"result":{}}']) {
      const want = frame.includes('"id":7') ? 7 : frame.includes('"id":8') ? 8 : null;
      expect(await exchange(client, `${frame}\n`), frame).toEqual([err(-32600, want)]);
    }
    expect(await exchange(client, '{"id":21,"method":"ping"}\n')).toEqual([err(-32600, 21)]);
    expect((await client.request("ping")).result).toEqual({});
    await client.close();
  });

  it("a valid notification gets no reply, whatever its method; a blank line is ignored; params._meta is accepted", async () => {
    const { client } = setup();
    await client.request("initialize", INIT);
    expect(await exchange(client, '{"jsonrpc":"2.0","method":"ping"}\n', 0)).toEqual([]);
    expect(await exchange(client, '{"jsonrpc":"2.0","method":"initialize","params":{}}\n', 0)).toEqual([]);
    expect(await exchange(client, "\n\r\n   \n", 0)).toEqual([]);
    expect(await exchange(client, '{"jsonrpc":"2.0","id":29,"method":"ping","params":{"_meta":{"progressToken":"c10"}}}\n')).toEqual([{ jsonrpc: "2.0", id: 29, result: {} }]);
    await client.close();
  });

  it("CRLF ends a line, two frames in one write get two replies, and a line over the cap is refused with id null", async () => {
    const { client } = setup();
    await client.request("initialize", INIT);
    expect(await exchange(client, '{"jsonrpc":"2.0","id":24,"method":"ping"}\r\n')).toEqual([{ jsonrpc: "2.0", id: 24, result: {} }]);
    expect(await exchange(client, '{"jsonrpc":"2.0","id":25,"method":"ping"}\n{"jsonrpc":"2.0","id":26,"method":"ping"}\n', 2)).toEqual([
      { jsonrpc: "2.0", id: 25, result: {} },
      { jsonrpc: "2.0", id: 26, result: {} },
    ]);
    const big = `{"jsonrpc":"2.0","id":27,"method":"ping","params":{"pad":"${"x".repeat(MAX_LINE_BYTES)}"}}\n`;
    expect(await exchange(client, big)).toEqual([err(-32600, null)]);
    expect((await client.request("ping")).result).toEqual({});
    await client.close();
  });

  it("errors never echo the request: unknown method and unknown tool carry fixed sentences", async () => {
    const { client, started } = setup();
    await client.request("initialize", INIT);
    const m = await client.request(`${SENTINEL}/no/such/method`);
    expect(m.error).toEqual({ code: -32601, message: "No such method." });
    const t = await client.request("tools/call", { name: `zz_${SENTINEL}_tool`, arguments: { [SENTINEL]: SENTINEL } });
    expect(t.error).toEqual({ code: -32602, message: "No such tool." });
    expect(JSON.stringify(client.replies)).not.toContain(SENTINEL);
    expect(started).toEqual([]);
    await client.close();
  });

  it("tool input is checked against the schema before an app starts; tools/list shows closed schemas", async () => {
    const { client, started } = setup();
    await client.request("initialize", INIT);
    const list = ((await client.request("tools/list")).result as { tools: { name: string; inputSchema: { additionalProperties?: unknown } }[] }).tools;
    expect(list.find((t) => t.name === "word_open_document")?.inputSchema.additionalProperties).toBe(false);
    expect(list.find((t) => t.name === "office_status")?.inputSchema.additionalProperties).toBe(false);
    const call = async (args: unknown) => client.request("tools/call", { name: "word_open_document", arguments: args });
    expect((await call([1])).error).toEqual({ code: -32602, message: "The arguments are not an object." });
    const unknown = (await call({ path: "a.docx", [SENTINEL]: 1 })).result as ToolResult;
    expect(unknown.isError).toBe(true);
    expect(unknown.content[0].text).toMatch(/^office\.unknownArgument: /);
    expect(unknown.content[0].text).not.toContain(SENTINEL);
    expect(((await call({})).result as ToolResult).content[0].text).toMatch(/^office\.missingArgument: .*path/);
    expect(((await call({ path: 5 })).result as ToolResult).content[0].text).toMatch(/^office\.wrongType: .*path/);
    expect(started).toEqual([]);
    await client.close();
  });

  it("office_status answers without starting an app, and refuses arguments", async () => {
    const { client, root, started } = setup();
    await client.request("initialize", INIT);
    const r = (await client.request("tools/call", { name: "office_status", arguments: {} })).result as ToolResult;
    expect(r.isError).toBe(false);
    const st = JSON.parse(r.content[0].text) as { root: string; contractVersion: number; apps: Record<string, { installed: boolean; running: boolean }> };
    expect(st.root).toBe(root);
    expect(st.contractVersion).toBe(CONTRACT_VERSION);
    expect(Object.keys(st.apps)).toEqual(APP_IDS);
    expect(st.apps.wordcraft).toEqual(expect.objectContaining({ installed: true, running: false }));
    expect(((await client.request("tools/call", { name: "office_status" })).result as ToolResult).isError).toBe(false);
    expect(((await client.request("tools/call", { name: "office_status", arguments: { [SENTINEL]: 1 } })).result as ToolResult).isError).toBe(true);
    expect((await client.request("tools/call", { name: "office_status", arguments: [1] })).error?.code).toBe(-32602);
    expect(started).toEqual([]);
    await client.close();
  });

  it("an unsupported protocol version gets one the server supports; contractVersion is pinned", async () => {
    const { client } = setup();
    const r = (await client.request("initialize", { ...INIT, protocolVersion: "2099-01-01" })).result as { protocolVersion: string; serverInfo: { contractVersion: number } };
    expect(r.protocolVersion).toBe("2025-11-25");
    expect(r.serverInfo.contractVersion).toBe(1);
    await client.close();
  });

  it("stdin closed with a request in flight: its reply still arrives", async () => {
    const { client } = setup();
    await client.request("initialize", INIT);
    client.sendRaw('{"jsonrpc":"2.0","id":28,"method":"ping"}\n');
    expect(await client.close()).toBe(0);
    expect(client.replies).toContainEqual({ jsonrpc: "2.0", id: 28, result: {} });
  });

  it("checkArguments: open and property-less schemas take any name; integer counts as number", () => {
    expect(checkArguments({ type: "object" }, { anything: 1 })).toBeUndefined();
    expect(checkArguments({ type: "object", properties: { a: {} }, additionalProperties: true }, { b: 1 })).toBeUndefined();
    expect(checkArguments({ type: "object", properties: { n: { type: "number" } } }, { n: 3 })).toBeUndefined();
    expect(checkArguments({ type: "object", properties: { n: { type: ["string", "number"] } } }, { n: true })).toMatch(/^office\.wrongType/);
    expect(checkArguments({ type: "object", properties: { n: { type: "string" } } }, { n: null })).toBeUndefined();
    expect(checkArguments({ type: "object", properties: { n: { type: "string" } }, required: ["n"] }, { n: null })).toMatch(/^office\.wrongType/);
  });

  it("readLines splits on LF, drops the CR, keeps a multi-byte character split across chunks, and skips an oversized line once", async () => {
    const { PassThrough } = await import("node:stream");
    const input = new PassThrough();
    const lines: string[] = [];
    let tooLong = 0;
    const ended = new Promise<void>((r) => readLines(input, 8, (l) => lines.push(l), () => tooLong++, r));
    const ő = Buffer.from("ő");
    input.write(Buffer.concat([Buffer.from("a"), ő.subarray(0, 1)]));
    input.write(Buffer.concat([ő.subarray(1), Buffer.from("\r\nb\n0123456789abc\nc")]));
    input.end();
    await ended;
    expect(lines).toEqual(["aő", "b", "c"]);
    expect(tooLong).toBe(1);
  });

  it("readLines ends once when stdin is destroyed without an end", async () => {
    const { PassThrough } = await import("node:stream");
    const input = new PassThrough();
    let ends = 0;
    readLines(input, 8, () => {}, () => {}, () => ends++);
    input.destroy();
    await sleep(20);
    expect(ends).toBe(1);
  });
});

/**
 * The family rule "foreign text is data, never an instruction", for a block with no model call of its own: each invented
 * fixture is put in a document, read through the server's document path, and must come back only in the result's
 * content, with nothing written, sent or called because of it. The fixtures are the family's shared test data and are
 * not copied into this public repository: point AIPLUS_FOREIGN_TEXT_FIXTURES at the file on a machine that has it.
 */
const FOREIGN = process.env.AIPLUS_FOREIGN_TEXT_FIXTURES;
describe.skipIf(!FOREIGN)("REQ: foreign text is data — the family's injection fixtures through the document path", () => {
  it("every fixture comes back only in the tool result's content; nothing else is called, started or written", async () => {
    const fixtures = (JSON.parse(fs.readFileSync(FOREIGN as string, "utf8")) as { fixtures: { id: string; text: string; injected: string }[] }).fixtures;
    expect(fixtures.length).toBeGreaterThan(0);
    const { client, root, started, received } = setup({ readPath: true });
    await client.request("initialize", INIT);
    client.notify("notifications/initialized");
    for (const f of fixtures) {
      const doc = path.join(root, `doc-${f.id}.txt`);
      fs.writeFileSync(doc, f.text);
      const before = client.replies.length;
      const res = (await client.request("tools/call", { name: "word_open_document", arguments: { path: doc } })).result as ToolResult;
      expect(res.isError, f.id).toBe(false);
      expect(res.content[0].text, f.id).toBe(f.text);
      // The injected instruction appears in exactly one reply: this call's result content.
      const carrying = client.replies.slice(before).filter((r) => JSON.stringify(r).includes(JSON.stringify(f.injected).slice(1, -1)));
      expect(carrying.map((r) => r.id), f.id).toEqual([expect.any(Number)]);
      expect(client.stderr(), f.id).not.toContain(f.injected);
    }
    await sleep(100);
    const calls = received("wordcraft").filter((m) => m.method === "tools/call");
    expect(calls).toHaveLength(fixtures.length); // one call per fixture, none caused by the text
    expect(calls.every((m) => m.params?.name === "open_document")).toBe(true);
    expect(started.map((s) => s.app)).toEqual(["wordcraft"]); // no other app, no send path
    expect(fs.readdirSync(root).sort()).toEqual(fixtures.map((f) => `doc-${f.id}.txt`).sort()); // nothing written
    expect(client.notifications.filter((n) => n.method !== "notifications/tools/list_changed")).toEqual([]);
    expect(await client.close()).toBe(0);
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
