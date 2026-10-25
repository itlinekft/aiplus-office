/**
 * The GridCraft gateway (change office-mcp-grid-deck, office-mcp "GridCraft confined by the proxy"): the policy
 * functions, then the whole proxy against a fake `gridcraft-cli mcp` (handshake, tools/list, one tools/call per tool,
 * every refusal answered without reaching the server).
 */
import { spawn as nodeSpawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { commandRefusal, confinePath, createGateway, GatewayRefusal, GRID_TOOLS, methodPolicy } from "../mcp-gateway.js";
import { runMcp } from "../mcp-proxy.js";
import type { ProvisionReport } from "../provision.js";
import { getApp } from "../registry.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";
import { GRID_MCP_STUB, nodeStub } from "./helpers/stubs.js";

afterEach(cleanupTmp);

const refused = (f: () => unknown) => {
  try {
    f();
  } catch (e) {
    expect(e).toBeInstanceOf(GatewayRefusal);
    return (e as Error).message;
  }
  throw new Error("expected a refusal");
};

describe("confinePath", () => {
  it("resolves relative and absolute paths inside the root to absolute real paths, also for files not yet there", () => {
    const root = fs.realpathSync(tmpDir("gw-root-"));
    fs.mkdirSync(path.join(root, "sub"));
    expect(confinePath(root, "a.xlsx")).toBe(path.join(root, "a.xlsx"));
    expect(confinePath(root, path.join(root, "sub", "b.xlsx"))).toBe(path.join(root, "sub", "b.xlsx"));
    expect(confinePath(root, "new/dir/c.xlsx")).toBe(path.join(root, "new", "dir", "c.xlsx"));
    expect(confinePath(root, "sub/../d.xlsx")).toBe(path.join(root, "d.xlsx"));
    expect(confinePath(root, ".")).toBe(root);
  });

  it("refuses a path outside the root, by .., by an absolute path, a symlinked folder or a dangling symlink, in Hungarian then English", () => {
    const root = fs.realpathSync(tmpDir("gw-root-"));
    const outside = fs.realpathSync(tmpDir("gw-out-"));
    fs.symlinkSync(outside, path.join(root, "link"));
    fs.symlinkSync(path.join(outside, "not-there.xlsx"), path.join(root, "dangling.xlsx"));
    fs.writeFileSync(path.join(outside, "x.xlsx"), "x");
    fs.symlinkSync(path.join(outside, "x.xlsx"), path.join(root, "file-link.xlsx"));
    for (const p of ["../x.xlsx", path.join(outside, "x.xlsx"), "link/y.xlsx", "dangling.xlsx", "file-link.xlsx", `${root}-sibling/z.xlsx`]) {
      const m = refused(() => confinePath(root, p));
      expect(m, p).toMatch(/^Ez a fájl a megengedett mappán kívül van/);
      expect(m, p).toContain(" English: path refused, it is outside the allowed folder");
    }
    expect(refused(() => confinePath(root, ""))).toMatch(/Hiányzik.*English: the file path is missing/);
    expect(refused(() => confinePath(root, 42))).toMatch(/English: the file path is missing/);
    expect(refused(() => confinePath(root, "a\0b"))).toMatch(/English: invalid path/);
  });

  it("a symlink that stays inside the root is followed and allowed", () => {
    const root = fs.realpathSync(tmpDir("gw-root-"));
    fs.mkdirSync(path.join(root, "real"));
    fs.symlinkSync(path.join(root, "real"), path.join(root, "alias"));
    expect(confinePath(root, "alias/a.xlsx")).toBe(path.join(root, "real", "a.xlsx"));
  });
});

describe("command and method policy", () => {
  it("execute_command runs in-workbook commands and the listed file commands only", () => {
    for (const ok of ["home.bold", "range.setValues", "cell.set", "data.sort", "insert.chart", "file.saveAs", "file.exportPdf", "file.new"]) expect(commandRefusal(ok), ok).toBeUndefined();
    for (const bad of ["link.open", "automate.runScript", "app.quit", "window.new", "view.newWindow", "file.print", "file.somethingNew", "newspace.cmd", "nodot", "", 7, "a.b c"]) {
      const m = commandRefusal(bad);
      expect(m, String(bad)).toBeDefined();
      expect(m).toContain(" English: ");
    }
  });

  it("requests outside the MCP basics are rejected, notifications other than notifications/* dropped, resources/read only gridcraft://", () => {
    expect(methodPolicy("initialize", 1, {})).toBe("forward");
    expect(methodPolicy("tools/call", 2, {})).toBe("forward");
    expect(methodPolicy("notifications/initialized", undefined, {})).toBe("forward");
    expect(methodPolicy("tools/call", undefined, {})).toBe("drop");
    expect(methodPolicy("sampling/whatever", 3, {})).toBe("reject");
    expect(methodPolicy("resources/read", 4, { uri: "gridcraft://workbook" })).toBe("forward");
    expect(methodPolicy("resources/read", 5, { uri: "file:///etc/passwd" })).toBe("reject");
    expect(methodPolicy(undefined, 6, {})).toBe("forward");
  });

  it("check() confines nested paths, refuses a foreign file/URL key and an unlisted tool; range keys stay allowed", () => {
    const root = fs.realpathSync(tmpDir("gw-root-"));
    const g = createGateway("GridCraft", root);
    expect(g.check("execute_command", { command: "data.getData", params: { path: "in.csv" } })).toEqual({ ok: true, arguments: { command: "data.getData", params: { path: path.join(root, "in.csv") } } });
    expect(g.check("execute_command", { command: "insert.pivotTable", params: { source: "A1:C9", destination: "E1" } })).toMatchObject({ ok: true });
    expect(g.check("execute_command", { command: "insert.link", params: { cell: "A1", target: "https://example.com" } })).toMatchObject({ ok: true });
    for (const key of ["url", "file", "folder", "URI"]) {
      const d = g.check("execute_command", { command: "home.bold", params: { [key]: "/etc/passwd" } });
      expect(d.ok, key).toBe(false);
    }
    expect(g.check("screenshot", { path: "x.png" })).toMatchObject({ ok: false, message: expect.stringContaining("English: tool screenshot is not offered") });
    expect(g.check("save_workbook", { path: "/etc/x.xlsx" })).toMatchObject({ ok: false });
    expect(g.check("save_workbook", {})).toEqual({ ok: true, arguments: {} });
  });

  it("tools/list keeps the allowlist only; initialize gets the folder note", () => {
    const g = createGateway("GridCraft", "/r");
    const listed = g.filterToolList({ tools: [...GRID_TOOLS, "screenshot", "future_tool"].map((name) => ({ name })) }) as { tools: { name: string }[] };
    expect(listed.tools.map((t) => t.name)).toEqual([...GRID_TOOLS]);
    expect(GRID_TOOLS).toHaveLength(getApp("gridcraft").mcp.tools);
    const init = g.annotateInitialize({ instructions: "GridCraft is a spreadsheet app." }) as { instructions: string };
    expect(init.instructions).toMatch(/^GridCraft is a spreadsheet app\.\n\nFiles: only inside \/r/);
  });
});

/** One tool call per allowlisted tool, with the arguments a client would send. */
const SAMPLE_CALLS: Record<(typeof GRID_TOOLS)[number], Record<string, unknown>> = {
  execute_command: { command: "file.saveAs", params: { path: "via-command.xlsx" } },
  list_commands: { search: "sort" },
  inspect_workbook: {},
  read_range: { range: "A1:B2" },
  write_range: { range: "A1", values: [["Termék", 12000]] },
  set_cell: { cell: "B2", input: "=B1*0.27" },
  get_cell: { cell: "B2" },
  evaluate_formula: { formula: "=SUM(B1:B2)" },
  select: { range: "A1" },
  format_range: { range: "A1:B1", bold: true },
  insert_chart: { range: "A1:B2", type: "column" },
  create_table: { range: "A1:B2" },
  sort_range: { keys: ["A"] },
  filter: { column: "A", values: ["Termék"] },
  open_workbook: { path: "in.xlsx" },
  save_workbook: { path: "sub/arlista.xlsx" },
  new_workbook: {},
  undo: {},
  redo: {},
  list_functions: { search: "SUM" },
};

describe("the gateway through the proxy, against a fake gridcraft-cli mcp", () => {
  it("handshake, a filtered tools/list, one forwarded call per tool with confined paths, and refusals the server never sees", async () => {
    const root = fs.realpathSync(tmpDir("gw-proj-"));
    const logFile = path.join(tmpDir("gw-log-"), "recv.jsonl");
    const argvLog = path.join(tmpDir("gw-log-"), "argv.json");
    const bin = nodeStub(GRID_MCP_STUB, "gridcraft-cli");
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const out: string[] = [];
    stdout.on("data", (d) => out.push(d.toString()));
    const err: string[] = [];

    let id = 0;
    const send = (o: object) => stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...o })}\n`);
    send({ id: ++id, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
    send({ method: "notifications/initialized" });
    send({ id: ++id, method: "tools/list" });
    const callIds: Record<string, number> = {};
    for (const [name, args] of Object.entries(SAMPLE_CALLS)) {
      callIds[name] = ++id;
      send({ id, method: "tools/call", params: { name, arguments: args } });
    }
    const refusals: Record<string, [string, object]> = {
      screenshot: ["screenshot", { path: "x.png" }],
      outside: ["save_workbook", { path: "../outside.xlsx" }],
      absolute: ["open_workbook", { path: "/etc/hostname" }],
      link: ["execute_command", { command: "link.open", params: { url: "https://example.com" } }],
      script: ["execute_command", { command: "automate.runScript", params: { name: "x" } }],
      nestedOutside: ["execute_command", { command: "data.getData", params: { path: "/etc/passwd" } }],
    };
    const refusalIds: Record<string, number> = {};
    for (const [key, [name, args]] of Object.entries(refusals)) {
      refusalIds[key] = ++id;
      send({ id, method: "tools/call", params: { name, arguments: args } });
    }
    send({ method: "tools/call", params: { name: "save_workbook", arguments: { path: "/tmp/notification.xlsx" } } });
    const readId = ++id;
    send({ id: readId, method: "resources/read", params: { uri: "file:///etc/passwd" } });
    stdin.end();

    const report: ProvisionReport = { app: "gridcraft", version: null, source: "override", asset: null, cacheHit: false, binary: bin, durationMs: 0 };
    const code = await runMcp(getApp("gridcraft"), ["--root", root], {
      provision: async () => report,
      spawn: ((c: string, a: string[], o: object) => nodeSpawn(c, a, { ...o, env: { ...process.env, STUB_LOG: logFile, STUB_ARGV_LOG: argvLog } } as never)) as never,
      stdin,
      stdout,
      stderr: (t) => err.push(t),
      cwd: () => "/nowhere",
      onSignal: () => {},
    });
    expect(code, err.join("")).toBe(0);
    expect(JSON.parse(fs.readFileSync(argvLog, "utf8"))).toEqual(["mcp"]);

    const byId = new Map<unknown, { result?: { tools?: { name: string }[]; content?: { text: string }[]; isError?: boolean; instructions?: string }; error?: { code: number } }>();
    for (const line of out.join("").trim().split("\n")) {
      const m = JSON.parse(line);
      byId.set(m.id, m);
    }
    // handshake + list
    expect(byId.get(1)?.result?.instructions).toContain(`Files: only inside ${root}`);
    expect(byId.get(2)?.result?.tools?.map((t) => t.name)).toEqual([...GRID_TOOLS]);
    // one call per tool, forwarded with its arguments; paths absolute inside the root
    for (const [name, args] of Object.entries(SAMPLE_CALLS)) {
      const r = byId.get(callIds[name])?.result;
      expect(r?.isError, name).toBe(false);
      const echoed = JSON.parse(r?.content?.[0].text ?? "{}");
      expect(echoed.name, name).toBe(name);
      if (name === "open_workbook") expect(echoed.arguments).toEqual({ path: path.join(root, "in.xlsx") });
      else if (name === "save_workbook") expect(echoed.arguments).toEqual({ path: path.join(root, "sub", "arlista.xlsx") });
      else if (name === "execute_command") expect(echoed.arguments).toEqual({ command: "file.saveAs", params: { path: path.join(root, "via-command.xlsx") } });
      else expect(echoed.arguments, name).toEqual(args);
    }
    // refusals answered by the proxy, in Hungarian then English
    for (const [key, rid] of Object.entries(refusalIds)) {
      const r = byId.get(rid)?.result;
      expect(r?.isError, key).toBe(true);
      expect(r?.content?.[0].text, key).toContain(" English: ");
    }
    expect(byId.get(readId)?.error?.code).toBe(-32601);

    // what the server actually received: never a refused call, the notification or the resources/read
    const received = fs.readFileSync(logFile, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    const receivedIds = new Set(received.map((m) => m.id));
    for (const rid of [...Object.values(refusalIds), readId]) expect(receivedIds.has(rid)).toBe(false);
    expect(received.filter((m) => m.method === "tools/call")).toHaveLength(GRID_TOOLS.length);
    expect(JSON.stringify(received)).not.toMatch(/notification\.xlsx|\/etc\/|outside\.xlsx|x\.png/);
    expect(err.join("")).toContain(`files confined by aiplus-office to ${root}`);
  }, 30_000);
});
