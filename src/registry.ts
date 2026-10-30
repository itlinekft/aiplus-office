/**
 * Registry of the four ArtCraft office apps (github.com/storytold, MIT OR Apache-2.0): WordCraft, GridCraft,
 * DeckCraft, PdfCraft.
 *
 * One readonly table drives provisioning (repo, host → asset names, glibc floor), the MCP proxy (confinement,
 * tool-count class, bridge flag) and the skills (CLI dialect, discovery commands). Rows are taken from upstream
 * the upstream MIT package's `src/registry.ts` (see UPSTREAM.md); the nine non-office apps and the
 * web-build fields are dropped.
 *
 * See change: office-plugin-v1 (design D1).
 */

export const APP_IDS = ["wordcraft", "gridcraft", "deckcraft", "pdfcraft"] as const;

export type CraftAppId = (typeof APP_IDS)[number];

/** `<platform>/<arch>` as reported by Node (`process.platform` / `process.arch`). */
export type HostKey =
  | "darwin/x64"
  | "darwin/arm64"
  | "linux/x64"
  | "linux/arm64"
  | "linux/riscv64"
  | "win32/x64"
  | "win32/arm64"
  | "win32/ia32"
  | "freebsd/x64";

/** Asset name templates for one host; `{v}` is the normalised version. First existing candidate wins. */
export type AssetPatterns = Partial<Record<HostKey, readonly string[]>>;

/**
 * How the app's CLI spells discovery and execution. Informational: skills and the
 * drift check read it; the provisioner and proxy never branch on it.
 */
export interface CliDialect {
  /** Arguments that print the command list. */
  list: readonly string[];
  /** Arguments that describe one command (`<id>` placeholder), when the CLI has them. */
  describe?: readonly string[];
  /** One-line shape of the batch/run entry point. */
  run: string;
}

/**
 * How file access is confined: `automation-roots` = the server's `--automation-read-root` +
 * `--automation-write-root` (WordCraft, DeckCraft); `root` = the server's single `--root` (PdfCraft); `gateway` = the
 * server has none and the proxy confines it (`src/mcp-gateway.ts`, GridCraft); `false` = none at all.
 */
export type Confinement = false | "automation-roots" | "root" | "gateway";

export interface McpPolicy {
  /** Confinement mechanism (measured on the latest releases, 2026-10-25), or `false`. */
  confinement: Confinement;
  /** `--compact` lists only helper tools (every command stays reachable via a `run`/`tool_call` tool). */
  compactFlag?: "--compact";
  /** `large` = hundreds of tools; registering floods the model context. */
  toolClass: "small" | "large";
  /** Number of MCP tools the server advertises (spike, `tools/list`). */
  tools: number;
  /** Flag that attaches the server to a live desktop app (always rejected by the proxy). */
  bridgeFlag?: "--bridge" | "--connect";
}

export interface CraftApp {
  id: CraftAppId;
  /** Display name, also the desktop app bundle name. */
  name: string;
  /** One-line purpose for `aiplus-office apps`. */
  purpose: string;
  repo: `storytold/${string}`;
  /**
   * Hosts fetched from another repository than `repo`, with the same release layout (see `repoFor`).
   * See change: office-wordcraft-hu.
   */
  hostRepos?: Partial<Record<HostKey, `${string}/${string}`>>;
  /** CLI binary basename, without `.exe`. */
  cli: string;
  assets: AssetPatterns;
  dialect: CliDialect;
  mcp: McpPolicy;
  /** Minimum glibc on Linux, `[major, minor]`. */
  glibcMin: readonly [number, number];
}

const HOSTS_MACOS: HostKey[] = ["darwin/x64", "darwin/arm64"];
const LINUX: Record<string, string> = { "linux/x64": "x86_64", "linux/arm64": "aarch64", "linux/riscv64": "riscv64" };
const WINDOWS: Record<string, string> = { "win32/x64": "x64", "win32/arm64": "arm64", "win32/ia32": "x86" };

/** Every app publishes the same release layout (spike: 13/13 identical). */
function standardAssets(id: string): AssetPatterns {
  const out: Record<string, readonly string[]> = {};
  for (const h of HOSTS_MACOS) out[h] = [`${id}-cli-{v}-macos-universal.zip`];
  for (const [h, arch] of Object.entries(LINUX)) out[h] = [`${id}-cli-{v}-linux-${arch}.tar.gz`, `${id}-{v}-linux-${arch}.tar.gz`];
  for (const [h, arch] of Object.entries(WINDOWS)) out[h] = [`${id}-{v}-windows-${arch}-portable.zip`];
  out["freebsd/x64"] = [`${id}-{v}-freebsd-x86_64.tar.gz`];
  return out;
}

function app(
  id: CraftAppId,
  name: string,
  purpose: string,
  dialect: CliDialect,
  mcp: McpPolicy,
  glibcMin: readonly [number, number] = [2, 35],
): CraftApp {
  return { id, name, purpose, repo: `storytold/${id}`, cli: `${id}-cli`, assets: standardAssets(id), dialect, mcp, glibcMin };
}

const COMMANDS_JSON: CliDialect["list"] = ["commands", "--json"];

/**
 * WordCraft with Hungarian spell checking (storytold/wordcraft #4575, #2070, #2385 plus two fixes proposed there),
 * published for Windows x64 only until an official release has it; then this goes. See change: office-wordcraft-hu.
 */
const WORDCRAFT_HU_REPOS: CraftApp["hostRepos"] = { "win32/x64": "tatargabor/wordcraft" };

export const CRAFT_APPS: readonly CraftApp[] = [
  {
    ...app(
      "wordcraft",
      "WordCraft",
      "word processing: DOCX/ODT/RTF documents, conversion, PDF export",
      { list: COMMANDS_JSON, run: "run [--file F] --cmd 'id={json}'… [--save OUT] | convert | render | text" },
      { confinement: "automation-roots", toolClass: "small", tools: 16, bridgeFlag: "--connect" },
    ),
    hostRepos: WORDCRAFT_HU_REPOS,
  },
  app(
    "gridcraft",
    "GridCraft",
    "spreadsheets: formulas, evaluation, conversion",
    { list: COMMANDS_JSON, run: "run [--in FILE] --cmd 'id={json}'… [--out FILE] | eval | check | convert" },
    // gridcraft-cli mcp (0.12.1) has no root option: the proxy confines it and lists 20 of its 21 tools (no `screenshot`).
    { confinement: "gateway", toolClass: "small", tools: 20, bridgeFlag: "--connect" },
  ),
  app(
    "deckcraft",
    "DeckCraft",
    "presentation slides and export",
    { list: ["commands"], describe: ["describe", "<id>"], run: "run [--in FILE] [--cmd ID[=JSON]…] [--save OUT] [--export OUT] | render | convert" },
    // --automation-read-root/--automation-write-root measured on 0.10.0 and 0.11.1 (2026-10-25).
    { confinement: "automation-roots", toolClass: "small", tools: 25, bridgeFlag: "--connect" },
  ),
  app(
    "pdfcraft",
    "PdfCraft",
    "PDF combine, split, extract, edit, render and audit",
    { list: ["tools"], run: "<combine|split|extract|edit|render|text|audit> … | run" },
    { confinement: "root", compactFlag: "--compact", toolClass: "large", tools: 175 }, // 175 measured on 0.13.0 (upstream: 163)
  ),
];

const BY_ID: ReadonlyMap<string, CraftApp> = new Map(CRAFT_APPS.map((a) => [a.id, a]));

export function isAppId(id: string): id is CraftAppId {
  return BY_ID.has(id);
}

/** Registry row for `id`; unknown ids throw an error that lists the supported ids (no I/O). */
export function getApp(id: string): CraftApp {
  const found = BY_ID.get(id);
  if (!found) throw new UnknownAppError(id);
  return found;
}

export class UnknownAppError extends Error {
  override name = "UnknownAppError";
  constructor(id: string) {
    super(`unknown craft app "${id}"; supported apps: ${APP_IDS.join(", ")}`);
  }
}

/** Env-var prefix of one app, e.g. `AIPLUS_OFFICE_GRIDCRAFT` for `AIPLUS_OFFICE_GRIDCRAFT_BIN`. */
export function envPrefix(app: CraftApp): string {
  return `AIPLUS_OFFICE_${app.id.toUpperCase()}`;
}

/** Binary file name for the host (`<cli>.exe` on Windows). */
export function binName(app: CraftApp, platform: string): string {
  return platform === "win32" ? `${app.cli}.exe` : app.cli;
}

/** Desktop executable shipped beside the CLI in portable archives (deleted after extraction). */
export function desktopName(app: CraftApp, platform: string): string {
  return platform === "win32" ? `${app.id}.exe` : app.id;
}

/** The GitHub repository the app is fetched from on this host: a `hostRepos` entry, else `repo`. */
export function repoFor(app: CraftApp, platform: string, arch: string): string {
  const key = hostKey(platform, arch);
  return (key && app.hostRepos?.[key]) || app.repo;
}

export function hostKey(platform: string, arch: string): HostKey | undefined {
  const key = `${platform}/${arch}`;
  return key in standardAssets("x") ? (key as HostKey) : undefined;
}
