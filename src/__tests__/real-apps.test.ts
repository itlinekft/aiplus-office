/**
 * Real ArtCraft release binaries. Opt-in (downloads up to ~230 MB, spawns the apps):
 *
 *   AIPLUS_OFFICE_E2E=1 [AIPLUS_OFFICE_E2E_HOME=/path/to/warm/cache] vitest run real-apps
 *
 * Without AIPLUS_OFFICE_E2E_HOME the cache lives in a tmp dir and every app is downloaded fresh.
 * Ported from upstream; PhotoCraft replaced by WordCraft as the confined app. See change: office-plugin-v1 (6.4).
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GRID_TOOLS } from "../mcp-gateway.js";
import { provision } from "../provision.js";
import { getApp } from "../registry.js";
import { runVerify } from "../verify.js";
import { partText, readDocx, realisticDocx } from "./helpers/docx.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";
import { mcpSession, text } from "./helpers/mcp-client.js";
import { encodePng, scene } from "./helpers/png.js";
import { OFFICE_CLI as CRAFT_CLI, REPO_ROOT, TSX } from "./helpers/paths.js";

const enabled = !!process.env.AIPLUS_OFFICE_E2E;
const workflowEnabled = enabled;
afterEach(cleanupTmp);

let sharedHome: string | undefined;
const home = () => (sharedHome ??= process.env.AIPLUS_OFFICE_E2E_HOME ?? tmpDir("office-real-"));

/** Drive `aiplus-office <app> mcp …` over stdio: initialize + tools/list; resolves the tool names. */
function mcpToolList(args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<{ tools: string[]; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", TSX, CRAFT_CLI, ...args], { cwd, env: { ...process.env, NODE_OPTIONS: "", ...env }, stdio: ["pipe", "pipe", "pipe"] });
    let buf = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`mcp tools/list timed out; stderr: ${stderr}`));
    }, 60_000);
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    child.stdout.on("data", (d) => {
      buf += d;
      for (const line of buf.split("\n")) {
        try {
          const m = JSON.parse(line);
          if (m.id === 2) {
            clearTimeout(timer);
            child.kill();
            resolve({ tools: m.result.tools.map((t: { name: string }) => t.name), stderr });
          }
        } catch {
          /* partial line / non-JSON */
        }
      }
    });
    const send = (o: unknown) => child.stdin.write(`${JSON.stringify(o)}\n`);
    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  });
}

describe.skipIf(!enabled)("real release binaries", () => {
  it("provisions a genuine archive (GridCraft, smallest), runs --version, then hits the cache", async () => {
    const h = home();
    const env = { AIPLUS_OFFICE_HOME: h } as NodeJS.ProcessEnv;
    const first = await provision("gridcraft", { env });
    expect(first.app).toBe("gridcraft");
    const v = spawnSync(first.binary, ["--version"], { encoding: "utf8" });
    expect(v.status).toBe(0);
    expect(v.stdout).toMatch(/gridcraft-cli \d+\.\d+\.\d+/);
    const again = await provision("gridcraft", { env });
    expect(again.cacheHit).toBe(true);
    expect(fs.readdirSync(path.join(h, "gridcraft")).filter((n) => n.startsWith(".staging-"))).toEqual([]);
  }, 300_000);

  it("MCP through the proxy: a confined app (WordCraft) lists its tools, rooted at the cwd", async () => {
    const cwd = tmpDir("craft-mcp-");
    await provision("wordcraft", { env: { AIPLUS_OFFICE_HOME: home() } });
    const r = await mcpToolList(["wordcraft", "mcp"], cwd, { AIPLUS_OFFICE_HOME: home() });
    expect(r.tools.length).toBeGreaterThan(10);
    expect(r.stderr).toContain(`mcp root: ${cwd}`);
    expect(r.stderr).toMatch(/files confined/);
  }, 300_000);

  it("MCP: GridCraft through the gateway lists the 20 allowlisted tools, runs each once, saves in the root, refuses outside", async () => {
    const root = fs.realpathSync(tmpDir("craft-grid-mcp-"));
    const outside = fs.realpathSync(tmpDir("craft-grid-out-"));
    await provision("gridcraft", { env: { AIPLUS_OFFICE_HOME: home() } });
    const s = await mcpSession(["gridcraft", "mcp", "--root", root], outside, { AIPLUS_OFFICE_HOME: home() });
    try {
      expect(s.stderr()).toContain(`files confined by aiplus-office to ${root}`);
      expect(s.init.instructions).toContain(`Files: only inside ${root}`);
      expect(await s.listTools()).toEqual([...GRID_TOOLS]);
      const ok = async (name: string, args: Record<string, unknown> = {}) => {
        const r = await s.call(name, args);
        expect(r.isError, `${name}: ${text(r)}`).toBeFalsy();
        return text(r);
      };
      await ok("new_workbook");
      await ok("write_range", { range: "A1", values: [["Termék", "Nettó (Ft)"], ["Tűzőgép", 12000], ["Hőpapír tekercs", 3500]] });
      await ok("set_cell", { cell: "B4", input: "=SUM(B2:B3)" });
      expect(await ok("get_cell", { cell: "B4" })).toContain("15500");
      expect(await ok("evaluate_formula", { formula: "=B4*0.27" })).toContain("4185");
      expect(await ok("read_range", { range: "A1:B4" })).toContain("Tűzőgép");
      await ok("select", { range: "A1" });
      await ok("format_range", { range: "A1:B1", bold: true });
      await ok("insert_chart", { range: "A1:B3", type: "column", title: "Nettó" });
      await ok("create_table", { range: "A1:B3" });
      await ok("sort_range", { range: "A1:B3", keys: [{ column: "B", order: "desc" }], header: true });
      await ok("filter", { range: "A1:B3", column: "A", values: ["Tűzőgép", "Hőpapír tekercs"] });
      await ok("undo");
      await ok("redo");
      expect(await ok("list_commands", { search: "bold" })).toContain("home.bold");
      expect(await ok("list_functions", { search: "SUM" })).toContain("SUM");
      expect(await ok("inspect_workbook")).toContain("Sheet1");
      await ok("save_workbook", { path: "arlista.xlsx" });
      expect(fs.existsSync(path.join(root, "arlista.xlsx"))).toBe(true);
      await ok("execute_command", { command: "file.exportPdf", params: { path: "arlista.pdf" } });
      expect(fs.existsSync(path.join(root, "arlista.pdf"))).toBe(true);
      await ok("open_workbook", { path: "arlista.xlsx" });
      // refusals: none of these reach GridCraft, nothing appears outside the root
      for (const [name, args] of [
        ["save_workbook", { path: path.join(outside, "x.xlsx") }],
        ["save_workbook", { path: "../x.xlsx" }],
        ["execute_command", { command: "file.saveAs", params: { path: path.join(outside, "y.xlsx") } }],
        ["execute_command", { command: "link.open", params: { url: "https://example.com" } }],
        ["screenshot", { path: "x.png" }],
      ] as const) {
        const r = await s.call(name, args as Record<string, unknown>);
        expect(r.isError, name).toBe(true);
        expect(text(r)).toContain(" English: ");
      }
      expect(fs.readdirSync(outside)).toEqual([]);
    } finally {
      await s.close();
    }
  }, 300_000);

  it("MCP: DeckCraft confined by its own roots lists 25 tools, every tool answers once, saves in the root, refuses outside", async () => {
    const root = fs.realpathSync(tmpDir("craft-deck-mcp-"));
    const outside = fs.realpathSync(tmpDir("craft-deck-out-"));
    fs.writeFileSync(path.join(root, "logo.png"), encodePng(scene(32, 32, [200, 30, 30])));
    await provision("deckcraft", { env: { AIPLUS_OFFICE_HOME: home() } });
    const s = await mcpSession(["deckcraft", "mcp", "--root", root], outside, { AIPLUS_OFFICE_HOME: home() });
    try {
      expect(s.stderr()).toMatch(/files confined/);
      const tools = await s.listTools();
      expect(tools).toHaveLength(getApp("deckcraft").mcp.tools);
      const called = new Set<string>();
      const call = async (name: string, args: Record<string, unknown> = {}) => {
        called.add(name);
        return s.call(name, args);
      };
      const ok = async (name: string, args: Record<string, unknown> = {}) => {
        const r = await call(name, args);
        expect(r.isError, `${name}: ${text(r)}`).toBeFalsy();
        return text(r);
      };
      await ok("new_presentation", { theme: "Paper" });
      await ok("add_slide", { layout: "titleAndContent", title: "Negyedéves áttekintés", body: "Árbevétel: +12%\nÚj ügyfelek: 18" });
      await ok("go_to_slide", { index: 1 });
      const box = JSON.parse(await ok("add_text_box", { x: 60, y: 440, w: 400, text: "Minta Kereskedelmi Kft." })) as { id: number };
      await ok("set_text", { id: box.id, text: "Minta Kereskedelmi Kft. · 2026" });
      await ok("select", { ids: [box.id] });
      await ok("add_shape", { preset: "roundRect", x: 600, y: 60, w: 200, h: 80, text: "Tűzőgép" });
      await ok("insert_table", { rows: 2, cols: 2, data: [["Termék", "Ár"], ["Hőpapír", "3 500 Ft"]] });
      await ok("insert_chart", { type: "column", categories: ["Tűzőgép", "Hőpapír"], series: [{ name: "Nettó", values: [12000, 3500] }], title: "Fizetendő" });
      await ok("insert_picture", { path: path.join(root, "logo.png"), x: 860, y: 460, w: 60, h: 60 });
      await ok("run_command", { command: "slide.new", params: { layout: "title", title: "Köszönöm" } });
      await ok("batch", { commands: [{ command: "slide.new", params: { layout: "titleOnly", title: "Kérdések" } }] });
      expect(await ok("inspect_document")).toContain("Negyedéves áttekintés");
      await ok("inspect_slide", { index: 1 });
      await ok("render_slide", { slide: 1, scale: 0.25 });
      expect(await ok("list_commands", { filter: "slide.new" })).toContain("slide.new");
      await ok("save_presentation", { path: path.join(root, "prezentacio.pptx") });
      await ok("export", { format: "pdf", path: path.join(root, "prezentacio.pdf") });
      await ok("open_presentation", { path: path.join(root, "prezentacio.pptx") });
      expect(fs.existsSync(path.join(root, "prezentacio.pptx"))).toBe(true);
      expect(fs.existsSync(path.join(root, "prezentacio.pdf"))).toBe(true);
      // interactive and window-only tools: each answers (an error is fine for the window-only ones), none hangs
      for (const [name, args] of [
        ["select_tool", { tool: "select" }],
        ["pointer", { events: [{ type: "move", x: 10, y: 10 }] }],
        ["key", { key: "Escape" }],
        ["type_text", { text: "x" }],
        ["screenshot", {}],
        ["call_app", { method: "ui.inspect" }],
      ] as const) {
        const r = await call(name, args as Record<string, unknown>);
        expect(r, name).toBeDefined();
      }
      expect([...called].sort()).toEqual([...tools].sort());
      // confinement by DeckCraft itself
      for (const [name, args] of [
        ["save_presentation", { path: path.join(outside, "x.pptx") }],
        ["export", { format: "pdf", path: path.join(outside, "x.pdf") }],
        ["run_command", { command: "file.saveAs", params: { path: path.join(outside, "y.pptx") } }],
      ] as const) {
        const r = await s.call(name, args as Record<string, unknown>);
        expect(r.isError, name).toBe(true);
        expect(text(r)).toMatch(/outside the write root/);
      }
      expect(fs.readdirSync(outside)).toEqual([]);
    } finally {
      await s.close();
    }
  }, 300_000);

  it("MCP through the proxy: PdfCraft --compact lists far fewer tools than its 175 and is root-confined", async () => {
    const cwd = tmpDir("craft-mcp-");
    await provision("pdfcraft", { env: { AIPLUS_OFFICE_HOME: home() } });
    const compact = await mcpToolList(["pdfcraft", "mcp", "--compact"], cwd, { AIPLUS_OFFICE_HOME: home() });
    expect(compact.tools.length).toBeLessThan(40);
    expect(compact.tools).toContain("tool_call");
  }, 300_000);

  it("verify --pages against a real PdfCraft", async () => {
    const dir = tmpDir("craft-pdf-");
    const f = path.join(dir, "two.pdf");
    fs.writeFileSync(f, TWO_PAGE_PDF());
    const out: string[] = [];
    const prev = process.env.AIPLUS_OFFICE_HOME;
    process.env.AIPLUS_OFFICE_HOME = home();
    try {
      const provisionPdfcraft = () => provision("pdfcraft", { env: { AIPLUS_OFFICE_HOME: home() } });
      const code = await runVerify([f, "--pages", "2", "--text-contains", "Second page", "--json"], { stdout: (t) => out.push(t), stderr: () => {}, provisionPdfcraft });
      expect(code, out.join("")).toBe(0);
      expect(await runVerify([f, "--pages", "3"], { stdout: () => {}, stderr: () => {}, provisionPdfcraft })).toBe(1);
    } finally {
      if (prev === undefined) delete process.env.AIPLUS_OFFICE_HOME;
      else process.env.AIPLUS_OFFICE_HOME = prev;
    }
  }, 300_000);
});

describe.skipIf(!enabled)("Hungarian guards on real PDFs (ITLine's test T5, change office-hungarian-guards)", () => {
  it("--hu-glyphs fails on GridCraft's PDF of a sheet with Tűzőgép and passes on the WordCraft route's PDF", async () => {
    const fix = (n: string) => path.join(REPO_ROOT, "src", "__tests__", "fixtures", "hu", n);
    const provisionPdfcraft = () => provision("pdfcraft", { env: { AIPLUS_OFFICE_HOME: home() } });
    const out: string[] = [];
    const io = { stdout: (t: string) => out.push(t), stderr: () => {}, provisionPdfcraft };
    expect(await runVerify([fix("arlista-tuzogep.gridcraft.pdf"), "--hu-glyphs", fix("arlista-tuzogep.xlsx")], io)).toBe(1);
    expect(out.join("")).toMatch(/missing 2: Tűzőgép, Fizetendő/);
    expect(await runVerify([fix("arlista-tuzogep.wordcraft.pdf"), "--hu-glyphs", fix("arlista-tuzogep.xlsx"), "--text-contains", "15 240 Ft"], io)).toBe(0);
  }, 300_000);
});

/** `aiplus-office <args>` through tsx with the shared cache; returns the spawn result. */
function craft(args: string[], cwd: string, env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, ["--import", TSX, CRAFT_CLI, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 240_000,
    env: { ...process.env, NODE_OPTIONS: "", AIPLUS_OFFICE_HOME: home(), ...env },
  });
}

describe.skipIf(!workflowEnabled)("office-doc-publish with real binaries", () => {
  /** doc prepare → WordCraft run --file (body appended after a page break) → pdf; returns the work dir. */
  function publish(): string {
    const work = tmpDir("craft-publish-");
    const tpl = path.join(work, "templates", "default");
    fs.mkdirSync(tpl, { recursive: true });
    fs.writeFileSync(path.join(tpl, "template.docx"), realisticDocx());
    fs.writeFileSync(
      path.join(work, "report.md"),
      "---\ndocument_title: Offer 2026\nclient_name: ACME Kft.\ndocument_id: DOC-7\nproject_name: Probe\n---\n# Offer 2026\n\nBody text here.\n",
    );
    const prep = craft(["doc", "prepare", "report.md", "--out", "01-prepare", "--templates-dir", "templates"], work);
    expect(prep.status, prep.stderr).toBe(0);
    fs.mkdirSync(path.join(work, "02-render"));
    const d = path.join(work, "01-prepare");
    const run = craft(
      ["wordcraft", "exec", "run", "--file", path.join(d, "template.filled.docx"), "--cmd", "caret.docEnd={}", "--cmd", "text.pageBreak={}", "--cmd", `insert.textFromFile=${JSON.stringify({ path: path.join(d, "body.md") })}`, "--cmd", 'file.properties={"title":"Offer 2026"}', "--save", "02-render/out.docx"],
      work,
    );
    expect(run.status, run.stderr).toBe(0);
    const pdf = craft(["wordcraft", "exec", "convert", "02-render/out.docx", "02-render/out.pdf"], work);
    expect(pdf.status, pdf.stderr).toBe(0);
    return work;
  }

  it("X1 a templated pdf carries the filled cover, first-page header and body; the docx keeps its header/footer parts", () => {
    const work = publish();
    const v = craft(["verify", "02-render/out.pdf", "--pages", "2", "--text-contains", "Offer 2026", "--text-contains", "ACME Kft.", "--text-contains", "DOC-7"], work);
    expect(v.status, v.stdout + v.stderr).toBe(0);
    const parts = Object.keys(readDocx(fs.readFileSync(path.join(work, "02-render", "out.docx"))));
    expect(parts.filter((n) => /^word\/(header|footer)\d*\.xml$/.test(n)).length).toBeGreaterThanOrEqual(3);
    expect(partText(fs.readFileSync(path.join(work, "01-prepare", "template.filled.docx")), "word/header2.xml")).not.toContain("{{");
      }, 300_000);

  it("X2 the page-count gate fails when one page too many is expected", () => {
    const work = publish();
    const v = craft(["verify", "02-render/out.pdf", "--pages", "3"], work);
    expect(v.status).toBe(1);
    expect(v.stdout + v.stderr).toMatch(/expected 3\s+actual 2/);
  }, 300_000);
});

/** Minimal two-page PDF ("Hello office" / "Second page"). */
function TWO_PAGE_PDF(): Buffer {
  const objs: Buffer[] = [];
  const stream = (t: string) => Buffer.from(`<< /Length ${t.length} >>\nstream\n${t}\nendstream`);
  objs.push(Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"));
  objs.push(Buffer.from("<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>"));
  objs.push(Buffer.from("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >>"));
  objs.push(stream("BT /F1 24 Tf 20 100 Td (Hello office) Tj ET"));
  objs.push(Buffer.from("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>"));
  objs.push(stream("BT /F1 24 Tf 20 100 Td (Second page) Tj ET"));
  objs.push(Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));
  let out = Buffer.from("%PDF-1.4\n");
  const offs: number[] = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out = Buffer.concat([out, Buffer.from(`${i + 1} 0 obj\n`), o, Buffer.from("\nendobj\n")]);
  });
  const x = out.length;
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offs) xref += `${String(o).padStart(10, "0")} 00000 n \n`;
  return Buffer.concat([out, Buffer.from(`${xref}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`)]);
}
