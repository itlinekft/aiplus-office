/**
 * The GridCraft gateway: confinement enforced by the proxy for an app whose MCP server has none.
 *
 * `gridcraft-cli mcp` (0.12.1, measured 2026-10-25) has no root option: `open_workbook`, `save_workbook`, `screenshot`
 * and `execute_command` (353 commands, `file.*`, `insert.picture`, `data.getData`, `link.open`, `automate.runScript` …)
 * reach any path the user can. The proxy therefore:
 *
 * - lists and accepts only the upstream tools in `GRID_TOOLS` (the window-only `screenshot` is left out); nothing is
 *   invented, every tool is the upstream server's own;
 * - resolves every `path` argument, also one nested in `execute_command`'s `params`, against the root and forwards the
 *   absolute real path; a path that leaves the root (`..`, a symlink, a dangling symlink, another drive) is refused;
 * - runs `execute_command` only for commands in `EXEC_NAMESPACES`, never one in `DENIED_COMMANDS`, and never one whose
 *   parameters carry a file, folder or URL key other than `path` (`FOREIGN_PATH_KEYS`);
 * - answers every refusal itself as a tool error, Hungarian first, then English; the server never sees the call.
 *
 * See change: office-mcp-grid-deck (office-mcp "GridCraft confined by the proxy").
 */
import * as fs from "node:fs";
import * as path from "node:path";

/** Upstream GridCraft MCP tools the gateway lists and forwards (21 upstream, `screenshot` dropped). */
export const GRID_TOOLS = [
  "execute_command",
  "list_commands",
  "inspect_workbook",
  "read_range",
  "write_range",
  "set_cell",
  "get_cell",
  "evaluate_formula",
  "select",
  "format_range",
  "insert_chart",
  "create_table",
  "sort_range",
  "filter",
  "open_workbook",
  "save_workbook",
  "new_workbook",
  "undo",
  "redo",
  "list_functions",
] as const;

/** Command namespaces `execute_command` may run: everything that edits the workbook in memory. */
export const EXEC_NAMESPACES = [
  "arrange",
  "cell",
  "chart",
  "data",
  "document",
  "draw",
  "edit",
  "file",
  "formulas",
  "history",
  "home",
  "insert",
  "object",
  "pageLayout",
  "pivot",
  "range",
  "review",
  "selection",
  "shape",
  "sheet",
  "slicer",
  "table",
  "view",
] as const;

/** `file.*` commands allowed (their `path`, when given, is confined). Any other `file.*` is refused. */
export const FILE_COMMANDS = [
  "file.new",
  "file.open",
  "file.save",
  "file.saveAs",
  "file.saveBytes",
  "file.close",
  "file.exportCsv",
  "file.exportHtml",
  "file.exportPdf",
  "file.properties",
  "file.options",
  "file.printPreview",
] as const;

/** Commands refused although their namespace is allowed: a second window, the system print path. */
export const DENIED_COMMANDS = ["view.newWindow", "file.print"] as const;

/** Parameter keys that would name a file, folder or URL outside the `path` check. Range keys (`source`, `target`,
 * `destination`, `output`) are cell references in GridCraft and stay allowed. */
export const FOREIGN_PATH_KEYS = ["file", "files", "filename", "filepath", "dir", "directory", "folder", "url", "uri", "href"] as const;

/** JSON-RPC request methods the gateway forwards; any other request is answered "method not found" by the proxy. */
export const GATEWAY_METHODS = [
  "initialize",
  "ping",
  "tools/list",
  "tools/call",
  "resources/list",
  "resources/templates/list",
  "resources/read",
  "prompts/list",
  "prompts/get",
] as const;

/**
 * What the proxy does with one client message other than a checked `tools/call`: `forward`, `drop` (a notification
 * outside `notifications/*`, e.g. a `tools/call` without an id) or `reject` (an unknown request, or a
 * `resources/read` of anything but the server's own `gridcraft://` resources).
 */
export function methodPolicy(method: unknown, id: unknown, params: unknown): "forward" | "drop" | "reject" {
  if (typeof method !== "string") return "forward"; // a response to a server request
  if (id === undefined) return method.startsWith("notifications/") ? "forward" : "drop";
  if (!(GATEWAY_METHODS as readonly string[]).includes(method)) return "reject";
  if (method === "resources/read") {
    const uri = (params as { uri?: unknown } | undefined)?.uri;
    return typeof uri === "string" && uri.startsWith("gridcraft://") ? "forward" : "reject";
  }
  return "forward";
}

export class GatewayRefusal extends Error {
  override name = "GatewayRefusal";
}

/** The bilingual tool error: Hungarian first, then English. */
export function refusalText(hu: string, en: string): string {
  return `${hu} English: ${en}`;
}

function samePathPrefix(root: string, candidate: string, platform: NodeJS.Platform): boolean {
  const norm = (p: string) => (platform === "win32" ? p.toLowerCase() : p);
  const r = norm(root);
  const c = norm(candidate);
  if (c === r) return true;
  const withSep = r.endsWith(path.sep) ? r : r + path.sep;
  return c.startsWith(withSep);
}

/**
 * Resolve `p` against `root` and return the absolute real path, or throw a `GatewayRefusal` when it leaves the root.
 * The deepest existing component is resolved with `realpath` (symlinks, junctions, `..`); a component that exists
 * only as a dangling symlink is refused, because a write would follow it.
 */
export function confinePath(root: string, p: unknown, platform: NodeJS.Platform = process.platform): string {
  if (typeof p !== "string" || p.trim() === "") {
    throw new GatewayRefusal(refusalText("Hiányzik a fájl elérési útja.", "the file path is missing."));
  }
  if (p.includes("\0")) throw new GatewayRefusal(refusalText("Érvénytelen elérési út.", "invalid path."));
  const realRoot = fs.realpathSync(root);
  const abs = path.resolve(realRoot, p);
  const tail: string[] = [];
  let cur = abs;
  let real: string | undefined;
  for (;;) {
    let st: fs.Stats | undefined;
    try {
      st = fs.lstatSync(cur);
    } catch {
      st = undefined;
    }
    if (st) {
      try {
        real = fs.realpathSync(cur);
      } catch {
        throw outside(realRoot, p);
      }
      break;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    tail.unshift(path.basename(cur));
    cur = parent;
  }
  const candidate = real === undefined ? abs : path.join(real, ...tail);
  if (!samePathPrefix(realRoot, candidate, platform)) throw outside(realRoot, p);
  return candidate;
}

function outside(root: string, p: string): GatewayRefusal {
  return new GatewayRefusal(
    refusalText(
      `Ez a fájl a megengedett mappán kívül van, ezért nem nyúlok hozzá: ${p}. A megengedett mappa: ${root}.`,
      `path refused, it is outside the allowed folder ${root}: ${p}.`,
    ),
  );
}

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** Copy of `value` with every `path` key confined; throws on a foreign file/folder/URL key. */
function confineParams(root: string, value: Json, platform: NodeJS.Platform): Json {
  if (Array.isArray(value)) return value.map((v) => confineParams(root, v, platform));
  if (value === null || typeof value !== "object") return value;
  const out: { [k: string]: Json } = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === "path") out[k] = confinePath(root, v, platform);
    else if ((FOREIGN_PATH_KEYS as readonly string[]).includes(k.toLowerCase()) && v !== null && v !== false) {
      throw new GatewayRefusal(
        refusalText(`A(z) „${k}” paraméter fájlt, mappát vagy webcímet adna meg, ezt nem engedem.`, `parameter "${k}" would name a file, folder or URL; refused.`),
      );
    } else out[k] = confineParams(root, v, platform);
  }
  return out;
}

/** Why `execute_command` may not run `id`, or `undefined` when it may. */
export function commandRefusal(id: unknown): string | undefined {
  if (typeof id !== "string" || !/^[A-Za-z][\w-]*(\.[\w-]+)+$/.test(id)) {
    return refusalText("Ismeretlen parancsazonosító.", "unknown command id.");
  }
  const ns = id.split(".")[0];
  const denied =
    (DENIED_COMMANDS as readonly string[]).includes(id) ||
    !(EXEC_NAMESPACES as readonly string[]).includes(ns) ||
    (ns === "file" && !(FILE_COMMANDS as readonly string[]).includes(id));
  if (!denied) return undefined;
  return refusalText(
    `A(z) ${id} parancsot ez a kapcsolat nem futtatja (weblinket nyitna, szkriptet futtatna, ablakot vagy nyomtatást indítana, vagy nem ismert).`,
    `command ${id} is not run through this connection (it would open a link, run a script, open a window or print, or it is unknown).`,
  );
}

export type GatewayDecision = { ok: true; arguments: Record<string, Json> } | { ok: false; message: string };

export interface Gateway {
  root: string;
  /** Decide one `tools/call`: forward with confined arguments, or refuse with a bilingual message. */
  check(name: unknown, args: unknown): GatewayDecision;
  /** The `tools/list` result with the allowlisted tools only. */
  filterToolList(result: unknown): unknown;
  /** The `initialize` result with a note on the folder appended to the server's instructions. */
  annotateInitialize(result: unknown): unknown;
}

export function createGateway(appName: string, root: string, platform: NodeJS.Platform = process.platform): Gateway {
  const allowed = new Set<string>(GRID_TOOLS);
  return {
    root,
    check(name, args) {
      if (typeof name !== "string" || !allowed.has(name)) {
        return {
          ok: false,
          message: refusalText(
            `A(z) ${String(name)} eszközt ez a kapcsolat nem kínálja (a ${appName} ablakát igényli, vagy nem ismert).`,
            `tool ${String(name)} is not offered through this connection (it needs the ${appName} window, or it is unknown).`,
          ),
        };
      }
      const a = (args && typeof args === "object" && !Array.isArray(args) ? args : {}) as Record<string, Json>;
      try {
        if (name === "execute_command") {
          const why = commandRefusal(a.command);
          if (why) return { ok: false, message: why };
          const params = a.params === undefined ? undefined : confineParams(root, a.params, platform);
          return { ok: true, arguments: params === undefined ? { ...a } : { ...a, params } };
        }
        return { ok: true, arguments: confineParams(root, a, platform) as Record<string, Json> };
      } catch (e) {
        if (e instanceof GatewayRefusal) return { ok: false, message: e.message };
        throw e;
      }
    },
    filterToolList(result) {
      const r = result as { tools?: { name?: unknown }[] } | undefined;
      if (!r || !Array.isArray(r.tools)) return result;
      return { ...r, tools: r.tools.filter((t) => typeof t?.name === "string" && allowed.has(t.name)) };
    },
    annotateInitialize(result) {
      const r = result as { instructions?: unknown } | undefined;
      if (!r || typeof r !== "object") return result;
      const note = `Files: only inside ${root}; a relative path is resolved against it (aiplus-office checks every path). execute_command does not run link.*, automate.*, window or print commands.`;
      const base = typeof r.instructions === "string" ? `${r.instructions}\n\n` : "";
      return { ...r, instructions: `${base}${note}` };
    },
  };
}
