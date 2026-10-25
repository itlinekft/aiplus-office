/**
 * The proxy's lazy start (change office-mcp-lazy-start, office-mcp "Never wait on a download"): the client's
 * `initialize` is answered at once even while the app downloads or its server starts slowly, the tools appear with
 * `notifications/tools/list_changed`, a failed download keeps answering. Run in-process against the fake server.
 */
import { spawn as nodeSpawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GRID_TOOLS } from "../mcp-gateway.js";
import { INIT_GRACE_MS, PROTOCOL_VERSIONS, runMcp } from "../mcp-proxy.js";
import type { ProvisionReport } from "../provision.js";
import { getApp } from "../registry.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";
import { inProcessMcp } from "./helpers/mcp-client.js";
import { GRID_MCP_STUB, nodeStub } from "./helpers/stubs.js";

afterEach(cleanupTmp);

const report = (app: string, binary: string): ProvisionReport => ({ app: app as ProvisionReport["app"], version: "1.0.0", source: "latest-cached", asset: null, cacheHit: true, binary, durationMs: 0 });
const INIT = { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "lazy-test", version: "1" } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type ToolList = { tools: { name: string }[] };
type ToolResult = { content: { text: string }[]; isError: boolean };

/** The proxy for `appId` against the fake server; `provisionMs` delays the binary, `initDelayMs` the server's own initialize. */
function setup(appId: string, opts: { provisionMs?: number; initDelayMs?: number; fail?: string; initGraceMs?: number } = {}) {
  const root = fs.realpathSync(tmpDir("lazy-root-"));
  const logFile = path.join(tmpDir("lazy-log-"), "recv.jsonl");
  const bin = nodeStub(GRID_MCP_STUB, `${appId}-cli`);
  const spawned: string[][] = [];
  const client = inProcessMcp(({ stdin, stdout, stderr }) =>
    runMcp(getApp(appId), ["--root", root], {
      provision: async () => {
        await sleep(opts.provisionMs ?? 0);
        if (opts.fail) throw new Error(opts.fail);
        return report(appId, bin);
      },
      spawn: ((c: string, a: string[], o: object) => {
        spawned.push(a);
        return nodeSpawn(c, a, { ...o, env: { ...process.env, STUB_LOG: logFile, STUB_INIT_DELAY: String(opts.initDelayMs ?? 0) } } as never);
      }) as never,
      stdin,
      stdout,
      stderr,
      cwd: () => root,
      onSignal: () => {},
      serverVersion: "9.9.9",
      ...(opts.initGraceMs === undefined ? {} : { initGraceMs: opts.initGraceMs }),
    }),
  );
  const received = () =>
    fs.existsSync(logFile)
      ? fs
          .readFileSync(logFile, "utf8")
          .trim()
          .split("\n")
          .map((l) => JSON.parse(l) as { id?: unknown; method?: string; params?: { clientInfo?: { name?: string }; name?: string; arguments?: unknown } })
      : [];
  return { client, root, received, spawned };
}

describe("installed app: unchanged", () => {
  it("the server answers initialize itself (default grace), no list_changed, its tools and calls pass through", async () => {
    const { client, received } = setup("wordcraft");
    const init = await client.request("initialize", INIT);
    expect((init.result as { serverInfo: { name: string } }).serverInfo.name).toBe("gridcraft"); // the fake server's own answer
    client.notify("notifications/initialized");
    const list = (await client.request("tools/list")).result as ToolList;
    expect(list.tools).toHaveLength(21);
    const call = (await client.request("tools/call", { name: "read_range", arguments: { range: "A1" } })).result as ToolResult;
    expect(call.isError).toBe(false);
    expect(await client.close()).toBe(0);
    expect(client.notifications).toEqual([]);
    expect(client.stderr()).not.toMatch(/answering from/);
    expect(received().filter((m) => m.method === "initialize")).toHaveLength(1);
  });

  it("a slow server start inside the grace: the server still answers initialize itself", async () => {
    const { client } = setup("wordcraft", { initDelayMs: 300 });
    const init = await client.request("initialize", INIT);
    expect(init.ms).toBeGreaterThanOrEqual(250);
    expect(init.ms).toBeLessThan(INIT_GRACE_MS);
    expect((init.result as { serverInfo: { name: string } }).serverInfo.name).toBe("gridcraft");
    expect(await client.close()).toBe(0);
    expect(client.notifications).toEqual([]);
  });
});

describe("slow provisioning: answered at once, tools appear later", () => {
  it("initialize < 100 ms, the status tool only, a bilingual tool error, then list_changed and the server's tools", async () => {
    const { client, received, spawned } = setup("wordcraft", { provisionMs: 500, initGraceMs: 20 });
    const init = await client.request("initialize", { ...INIT, protocolVersion: "2025-03-26" });
    expect(init.ms).toBeLessThan(100);
    const r = init.result as { protocolVersion: string; capabilities: unknown; serverInfo: unknown; instructions: string };
    expect(r.protocolVersion).toBe("2025-03-26");
    expect(r.capabilities).toEqual({ tools: { listChanged: true } });
    expect(r.serverInfo).toEqual({ name: "aiplus-office-wordcraft", version: "9.9.9" });
    expect(r.instructions).toMatch(/^A\(z\) WordCraft program letöltése .* English: WordCraft is being downloaded/);
    client.notify("notifications/initialized");
    expect((await client.request("ping")).result).toEqual({});
    expect(((await client.request("tools/list")).result as ToolList).tools.map((t) => t.name)).toEqual(["wordcraft_status"]);
    const early = (await client.request("tools/call", { name: "read_range", arguments: {} })).result as ToolResult;
    expect(early.isError).toBe(true);
    expect(early.content[0].text).toBe("A(z) WordCraft letöltése folyamatban, pár perc múlva próbáld újra. English: WordCraft is being downloaded; try again in a few minutes.");
    const status = (await client.request("tools/call", { name: "wordcraft_status", arguments: {} })).result as ToolResult;
    expect(status.content[0].text).toMatch(/letöltése folyamatban .* English: /);
    expect(spawned).toEqual([]);

    await client.waitFor("notifications/tools/list_changed");
    expect(((await client.request("tools/list")).result as ToolList).tools).toHaveLength(21);
    const call = (await client.request("tools/call", { name: "read_range", arguments: { range: "B2" } })).result as ToolResult;
    expect(call.isError).toBe(false);
    expect(JSON.parse(call.content[0].text)).toEqual({ name: "read_range", arguments: { range: "B2" } });
    expect(await client.close()).toBe(0);

    // the server got the client's own initialize params and one notifications/initialized, never the early call
    const got = received();
    const inits = got.filter((m) => m.method === "initialize");
    expect(inits).toHaveLength(1);
    expect(inits[0].params?.clientInfo?.name).toBe("lazy-test");
    expect(got.filter((m) => m.method === "notifications/initialized")).toHaveLength(1);
    expect(got.filter((m) => m.method === "tools/call")).toHaveLength(1);
    expect(client.notifications.map((n) => n.method)).toEqual(["notifications/tools/list_changed"]);
    expect(client.stderr()).toMatch(/answering from aiplus-office/);
  });

  it("an unknown protocol version gets the newest supported", async () => {
    const { client } = setup("pdfcraft", { provisionMs: 300, initGraceMs: 0 });
    const init = await client.request("initialize", { ...INIT, protocolVersion: "1999-01-01" });
    expect((init.result as { protocolVersion: string }).protocolVersion).toBe(PROTOCOL_VERSIONS[PROTOCOL_VERSIONS.length - 1]);
    await client.waitFor("notifications/tools/list_changed");
    expect(await client.close()).toBe(0);
  });
});

describe("slow first start of an installed server (measured on Windows, 2026-10-25)", () => {
  it("a server that answers initialize after 1.5 s: answered by the proxy, then list_changed and pass-through", async () => {
    const { client, received } = setup("deckcraft", { initDelayMs: 1500, initGraceMs: 200 });
    const init = await client.request("initialize", INIT);
    expect(init.ms).toBeLessThan(600);
    expect((init.result as { serverInfo: { name: string } }).serverInfo.name).toBe("aiplus-office-deckcraft");
    client.notify("notifications/initialized");
    const early = (await client.request("tools/call", { name: "read_range", arguments: {} })).result as ToolResult;
    expect(early.content[0].text).toMatch(/^A\(z\) DeckCraft indul, pár perc múlva próbáld újra\. English: /);
    await client.waitFor("notifications/tools/list_changed");
    expect(((await client.request("tools/list")).result as ToolList).tools).toHaveLength(21);
    expect(((await client.request("tools/call", { name: "undo", arguments: {} })).result as ToolResult).isError).toBe(false);
    expect(await client.close()).toBe(0);
    const got = received();
    expect(got.filter((m) => m.method === "initialize")).toHaveLength(1); // the client's own, its answer swallowed
    expect(got.filter((m) => m.method === "notifications/initialized")).toHaveLength(1);
    expect(got.filter((m) => m.method === "tools/call").map((m) => m.params?.name)).toEqual(["undo"]);
  });

  it("GridCraft through the gateway: same, the late tools/list filtered and a late call confined to the root", async () => {
    const { client, root, received } = setup("gridcraft", { initDelayMs: 1500, initGraceMs: 200 });
    const init = await client.request("initialize", INIT);
    expect(init.ms).toBeLessThan(600);
    expect((init.result as { instructions: string }).instructions).toContain(`Files: only inside ${root}`);
    client.notify("notifications/initialized");
    await client.waitFor("notifications/tools/list_changed");
    expect(((await client.request("tools/list")).result as ToolList).tools.map((t) => t.name)).toEqual([...GRID_TOOLS]);
    const saved = (await client.request("tools/call", { name: "save_workbook", arguments: { path: "a.xlsx" } })).result as ToolResult;
    expect(JSON.parse(saved.content[0].text).arguments).toEqual({ path: path.join(root, "a.xlsx") });
    const refused = (await client.request("tools/call", { name: "save_workbook", arguments: { path: "../out.xlsx" } })).result as ToolResult;
    expect(refused.isError).toBe(true);
    expect(await client.close()).toBe(0);
    expect(received().filter((m) => m.method === "tools/call")).toHaveLength(1);
  });
});

describe("provisioning failure", () => {
  it("initialize still answered, every call returns the error, the proxy stays up until stdin closes (exit 69)", async () => {
    const { client, spawned } = setup("wordcraft", { provisionMs: 50, fail: "no network", initGraceMs: 2000 });
    const init = await client.request("initialize", INIT);
    expect(init.ms).toBeLessThan(1000); // the failure answers it, not the grace
    expect((init.result as { instructions: string }).instructions).toMatch(/^A\(z\) WordCraft letöltése nem sikerült.*no network.* English: downloading WordCraft failed/);
    client.notify("notifications/initialized");
    const call = (await client.request("tools/call", { name: "read_range", arguments: {} })).result as ToolResult;
    expect(call.isError).toBe(true);
    expect(call.content[0].text).toMatch(/^A\(z\) WordCraft letöltése nem sikerült.*A hiba: no network English: .*The error: no network$/);
    const status = (await client.request("tools/call", { name: "wordcraft_status", arguments: {} })).result as ToolResult;
    expect(status.isError).toBe(true);
    const still = await Promise.race([client.done.then(() => "exited"), sleep(300).then(() => "running")]);
    expect(still).toBe("running");
    expect((await client.request("ping")).result).toEqual({});
    expect(await client.close()).toBe(69);
    expect(spawned).toEqual([]);
    expect(client.stderr()).toContain("aiplus-office: no network");
  });
});

describe("the client leaves during the download", () => {
  it("stdin closed while downloading: the download finishes, no server is started, exit 0", async () => {
    const { client, spawned } = setup("wordcraft", { provisionMs: 300, initGraceMs: 0 });
    await client.request("initialize", INIT);
    expect(await client.close()).toBe(0);
    expect(spawned).toEqual([]);
    expect(client.stderr()).toMatch(/finishing the download before exit/);
  });
});
