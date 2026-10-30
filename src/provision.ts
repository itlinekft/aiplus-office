/**
 * Provision the headless CLI (`<app>-cli`) of an ArtCraft office app for the host.
 *
 * Resolve the release (override → pin → latest), map host → asset from the registry, verify the asset against
 * `SHA256SUMS.txt` (fail closed), list-then-extract into a staging dir, and move the tree to
 * `<cache root>/<app>/<version>/`. Every external effect (fetch, clock, env, platform, exec, C-library probe) is an
 * injectable seam.
 *
 * Ported from the upstream package's CLI (see UPSTREAM.md): the launcher source and the web-build installer are dropped;
 * env names follow the AI+ naming contract (`AIPLUS_OFFICE_*`).
 *
 * See change: office-plugin-v1 (design D3, D4).
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFileAsync } from "./exec.js";
import { binName, type CraftApp, type CraftAppId, desktopName, envPrefix, getApp, hostKey, repoFor } from "./registry.js";

export const API_BASE = "https://api.github.com";
const LATEST_TTL_MS = 24 * 60 * 60 * 1000;
const STALE_STAGING_MS = 60 * 60 * 1000;
const SUMS_NAME = "SHA256SUMS.txt";

export type ProvisionSource = "override" | "pin" | "latest" | "latest-cached" | "fallback-installed";

export interface ProvisionReport {
  app: CraftAppId;
  version: string | null;
  source: ProvisionSource;
  asset: string | null;
  cacheHit: boolean;
  binary: string;
  durationMs: number;
  /** macOS install only: result of `spctl --assess --type install` (advisory). */
  gatekeeper?: "accepted" | "rejected";
}

/** Provisioning failure; the CLI maps it to exit code 69. */
export class ProvisionError extends Error {
  override name = "ProvisionError";
}

export type ExecFn = (
  file: string,
  args: string[],
  opts?: { timeout?: number; maxBuffer?: number },
) => Promise<{ stdout: string | Buffer; stderr: string | Buffer }>;

export interface ProvisionDeps {
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  arch: string;
  fetch: typeof fetch;
  now: () => number;
  homedir: () => string;
  exec: ExecFn;
  /** glibc version string, or undefined when the libc is not glibc (musl). */
  glibcVersion: () => string | undefined;
  /** Diagnostics: always stderr in the CLI (stdout may be an MCP channel). */
  log: (message: string) => void;
  apiBase: string;
  /** Override only: run `<bin> --version` to fill `report.version`. */
  probeVersion: boolean;
  randomId: () => string;
  /**
   * Serve an already installed version at once instead of downloading a newer release first (the MCP connectors:
   * a client waits for their start). The next command outside a connector updates the cache.
   */
  preferInstalled: boolean;
  /** Asset downloads: abort a stream that delivers nothing for `stallMs`, then resume after each delay in turn. */
  download: DownloadPolicy;
}

export interface DownloadPolicy {
  stallMs: number;
  retryDelaysMs: number[];
}

export const DEFAULT_DOWNLOAD: DownloadPolicy = { stallMs: 45_000, retryDelaysMs: [2_000, 5_000, 10_000] };

export function defaultDeps(): ProvisionDeps {
  return {
    env: process.env,
    platform: process.platform,
    arch: process.arch,
    fetch: (...a) => fetch(...a),
    now: () => Date.now(),
    homedir: () => os.homedir(),
    exec: (file, args, opts) => execFileAsync(file, args, { maxBuffer: 64 * 1024 * 1024, ...opts }),
    glibcVersion: () => {
      const report = process.report?.getReport() as { header?: { glibcVersionRuntime?: string } } | undefined;
      return report?.header?.glibcVersionRuntime;
    },
    log: (m) => process.stderr.write(`${m}\n`),
    apiBase: API_BASE,
    probeVersion: false,
    randomId: () => Math.random().toString(36).slice(2, 10),
    preferInstalled: false,
    download: DEFAULT_DOWNLOAD,
  };
}

// ── Host → asset ────────────────────────────────────────────────────────────

/** Candidate asset names for the host, most preferred first (CLI-only before portable). */
export function assetCandidates(app: CraftApp, platform: string, arch: string, version: string): string[] {
  const key = hostKey(platform, arch);
  const patterns = key ? app.assets[key] : undefined;
  if (!patterns?.length) {
    throw new ProvisionError(
      `unsupported platform: ${platform}/${arch} has no ${app.name} CLI release asset; set ${envPrefix(app)}_BIN to a self-built ${app.cli}`,
    );
  }
  return patterns.map((p) => p.replaceAll("{v}", version));
}

/** Default (most preferred) asset name for the host. */
export function assetFor(app: CraftApp, platform: string, arch: string, version: string): string {
  return assetCandidates(app, platform, arch, version)[0];
}

/** Linux only: the app links glibc symbols at its floor version; musl cannot run it. */
function assertLibc(app: CraftApp, deps: ProvisionDeps): void {
  if (deps.platform !== "linux") return;
  const [fMaj, fMin] = app.glibcMin;
  const floor = `${fMaj}.${fMin}`;
  const hint = `Set ${envPrefix(app)}_BIN to a compatible ${app.cli}`;
  const v = deps.glibcVersion();
  if (v === undefined) {
    throw new ProvisionError(`unsupported C library: musl (not glibc); the ${app.name} CLI needs glibc ≥ ${floor}. ${hint}`);
  }
  const [maj, min] = v.split(".").map((n) => Number.parseInt(n, 10));
  if (maj < fMaj || (maj === fMaj && (min ?? 0) < fMin)) {
    throw new ProvisionError(`unsupported C library: glibc ${v}; the ${app.name} CLI needs glibc ≥ ${floor}. ${hint}`);
  }
}

// ── Paths, versions ─────────────────────────────────────────────────────────

/**
 * Cache root shared by all apps: `AIPLUS_OFFICE_HOME`, else the per-user cache directory
 * (`$XDG_CACHE_HOME/aiplus-office`, `~/.cache/aiplus-office`, `~/Library/Caches/aiplus-office`,
 * `%LOCALAPPDATA%\aiplus-office`).
 */
export function craftRoot(deps: Pick<ProvisionDeps, "env" | "homedir"> & { platform?: NodeJS.Platform }): string {
  if (deps.env.AIPLUS_OFFICE_HOME) return path.resolve(deps.env.AIPLUS_OFFICE_HOME);
  const platform = deps.platform ?? process.platform;
  if (platform === "win32") return path.join(deps.env.LOCALAPPDATA || path.join(deps.homedir(), "AppData", "Local"), "aiplus-office");
  if (platform === "darwin") return path.join(deps.homedir(), "Library", "Caches", "aiplus-office");
  const xdg = deps.env.XDG_CACHE_HOME;
  return path.join(xdg && path.isAbsolute(xdg) ? xdg : path.join(deps.homedir(), ".cache"), "aiplus-office");
}

/** Per-app cache directory `<root>/<app>`. */
export function cacheRoot(app: CraftApp, deps: Pick<ProvisionDeps, "env" | "homedir"> & { platform?: NodeJS.Platform }): string {
  return path.join(craftRoot(deps), app.id);
}

/** Strip one leading `v`; reject anything that cannot be a safe single path segment. */
export function normaliseVersion(raw: string, appName = "craft app"): string {
  const v = raw.trim().replace(/^v/, "");
  if (!/^[0-9A-Za-z][0-9A-Za-z._+-]*$/.test(v) || v.includes("..")) {
    throw new ProvisionError(`invalid ${appName} version "${raw}"`);
  }
  return v;
}

function semverParts(v: string): number[] {
  return v.split(/[.+-]/).slice(0, 3).map((n) => Number.parseInt(n, 10) || 0);
}

export function compareSemver(a: string, b: string): number {
  const pa = semverParts(a);
  const pb = semverParts(b);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

// ── Binary validation / lookup ──────────────────────────────────────────────

/** Regular, non-empty, executable file (execute bit is not meaningful on Windows). */
function validBinary(file: string, platform: string): boolean {
  try {
    const st = fs.statSync(file);
    if (!st.isFile() || st.size === 0) return false;
    return platform === "win32" || (st.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

function subdirs(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== "__MACOSX")
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/** Walk for files named `name`, skipping `__MACOSX`. */
function findByBasename(dir: string, name: string, out: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "__MACOSX") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) findByBasename(p, name, out);
    else if (e.isFile() && e.name === name) out.push(p);
  }
  return out;
}

/**
 * Locate the CLI binary in an extracted tree: the platform's known relative
 * location (at the root, or under the archive's single top-level directory),
 * else the single file with that basename. Returns undefined for zero matches
 * and throws for more than one.
 */
export function locateBinary(app: CraftApp, tree: string, platform: string, assetName: string): string | undefined {
  const name = binName(app, platform);
  // Known location: tarballs (linux/freebsd) ship `<root>/bin/<cli>`; the macOS and Windows zips `<root>/<cli>`.
  const rel = platform === "linux" || platform === "freebsd" ? path.join("bin", name) : name;
  // `<root>` is the extraction dir itself or the archive's single top-level directory.
  for (const base of [tree, ...subdirs(tree).map((d) => path.join(tree, d))]) {
    const p = path.join(base, rel);
    try {
      if (fs.statSync(p).isFile()) return p;
    } catch {
      /* next candidate */
    }
  }
  const found = findByBasename(tree, name);
  if (found.length > 1) {
    throw new ProvisionError(`ambiguous archive: ${found.length} files named ${name} in ${assetName}`);
  }
  return found[0];
}

// ── Checksums ───────────────────────────────────────────────────────────────

/** Exactly one `<64-hex> [*]name` entry for `assetName`; returns the lower-cased digest. */
export function parseSums(text: string, assetName: string): string {
  const digests: string[] = [];
  for (const raw of text.split("\n")) {
    const m = /^([0-9a-fA-F]{64})\s+\*?(?:\.\/)?(.+?)\s*$/.exec(raw.replace(/\r$/, ""));
    if (m && m[2] === assetName) digests.push(m[1].toLowerCase());
  }
  if (digests.length === 0) throw new ProvisionError(`${SUMS_NAME} has no entry for ${assetName}`);
  if (digests.length > 1) throw new ProvisionError(`${SUMS_NAME} has ${digests.length} entries for ${assetName}`);
  return digests[0];
}

// ── Archive listing guard ───────────────────────────────────────────────────

const MODE_RE = /^[-dlhcbps][-rwxsStTl+@.]{9}/;

/** Reject absolute, `..`, and non-file/non-directory entries before anything is extracted. */
export function assertSafeListing(names: string[], verbose: string[]): void {
  if (names.length !== verbose.length) {
    throw new ProvisionError(
      `archive listing mismatch (${names.length} names vs ${verbose.length} detailed entries); refusing to extract`,
    );
  }
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const line = verbose[i];
    if (!MODE_RE.test(line)) throw new ProvisionError("archive listing not understood; refusing to extract");
    const type = line[0];
    if (type !== "-" && type !== "d") {
      throw new ProvisionError(`archive entry "${name}" is not a regular file or directory (type "${type}"); refusing to extract`);
    }
    const segments = name.split(/[\\/]/);
    if (name.startsWith("/") || name.startsWith("\\") || /^[A-Za-z]:/.test(name) || segments.includes("..")) {
      throw new ProvisionError(`archive entry "${name}" escapes the install directory; refusing to extract`);
    }
  }
}

function lines(out: string | Buffer): string[] {
  const text = out.toString();
  const l = text.split("\n").map((s) => s.replace(/\r$/, ""));
  while (l.length && l[l.length - 1] === "") l.pop();
  return l;
}

/**
 * System tool name for `platform`. On Windows the `.exe` suffix keeps the shared `platform/exec` wrapper from
 * routing the call through `cmd.exe /c` (which would interpret `&`, `|`, `^`, `%VAR%` in file arguments).
 */
export function exe(name: string, platform: string = process.platform): string {
  return platform === "win32" ? `${name}.exe` : name;
}

/** Reject anything in an extracted tree that is not a regular file or directory (defence in depth after the listing guard). */
export function assertTreeSafe(tree: string): void {
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const st = fs.lstatSync(p);
      if (st.isDirectory()) walk(p);
      else if (!st.isFile()) {
        throw new ProvisionError(`extracted entry "${path.relative(tree, p)}" is not a regular file or directory; refusing to install`);
      }
    }
  };
  walk(tree);
}

/**
 * The archive tool. On Windows it is the system's own bsdtar, `<SystemRoot>\System32\tar.exe`, never a `tar` from
 * PATH: Git for Windows puts a GNU tar there that mishandles `C:` paths (measured 2026-10-24, the first download from
 * Git Bash hung). The full path keeps the `.exe` suffix, so the call still never goes through `cmd.exe`.
 */
export function systemTar(platform: string, env: NodeJS.ProcessEnv): string {
  if (platform !== "win32") return exe("tar", platform);
  return path.win32.join(env.SystemRoot || env.SYSTEMROOT || "C:\\Windows", "System32", exe("tar", platform));
}

/** CLI list guard: `tar -tf` + `tar -tvf` must agree and show only regular files/directories under the install dir. */
async function listArchive(deps: ProvisionDeps, archive: string): Promise<void> {
  const tar = systemTar(deps.platform, deps.env);
  const names = lines((await deps.exec(tar, ["-tf", archive])).stdout);
  const verbose = lines((await deps.exec(tar, ["-tvf", archive])).stdout);
  assertSafeListing(names, verbose);
}

async function extractArchive(deps: ProvisionDeps, archive: string, dest: string): Promise<void> {
  if (deps.platform === "darwin") await deps.exec("ditto", ["-x", "-k", archive, dest]);
  else await deps.exec(systemTar(deps.platform, deps.env), ["-xf", archive, "-C", dest]);
}

// ── GitHub ──────────────────────────────────────────────────────────────────

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size?: number;
}
export interface Release {
  tag_name: string;
  assets: ReleaseAsset[];
}

const UA = "aiplus-office";

export async function apiJson(deps: ProvisionDeps, url: string): Promise<Release> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": UA };
  if (deps.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${deps.env.GITHUB_TOKEN}`;
  let res: Response;
  try {
    res = await deps.fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    throw new ProvisionError(`GitHub API request failed: ${(e as Error).message}`);
  }
  if (!res.ok) throw new ProvisionError(`GitHub API returned HTTP ${res.status} for ${url}`);
  return (await res.json()) as Release;
}

const MAX_SUMS_BYTES = 1024 * 1024;
const MAX_ASSET_BYTES = 2 * 1024 * 1024 * 1024;

export async function downloadText(deps: ProvisionDeps, url: string): Promise<string> {
  const res = await deps.fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new ProvisionError(`download of ${SUMS_NAME} failed: HTTP ${res.status}`);
  const text = await res.text();
  if (text.length > MAX_SUMS_BYTES) throw new ProvisionError(`${SUMS_NAME} is larger than ${MAX_SUMS_BYTES} bytes; refusing`);
  return text;
}

function fileSize(file: string): number {
  try {
    return fs.statSync(file).size;
  } catch {
    return 0;
  }
}

async function sha256File(file: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

/**
 * One request for `url` from byte `offset` on (a `Range` request when `offset > 0`), appended to `dest`. A
 * ProvisionError is final (a 4xx, the size cap); any other error (a stall, a dropped connection, a 5xx) may be
 * resumed. A server that ignores the range answers 200, and the file then starts over.
 */
async function fetchOnce(deps: ProvisionDeps, url: string, dest: string, offset: number, maxBytes: number, stallMs: number): Promise<void> {
  const ctrl = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => ctrl.abort(new Error(`no data for ${Math.round(stallMs / 1000)} s`)), stallMs);
  };
  arm();
  try {
    const headers: Record<string, string> = { "User-Agent": UA };
    if (offset > 0) headers.Range = `bytes=${offset}-`;
    const res = await deps.fetch(url, { headers, signal: ctrl.signal });
    if (res.status === 416 && offset > 0) {
      fs.rmSync(dest, { force: true });
      throw new Error("HTTP 416 for the resumed range; starting over");
    }
    if (!res.ok || !res.body) {
      const msg = `asset download failed: HTTP ${res.status} for ${url}`;
      if (res.status >= 500 || res.status === 429) throw new Error(msg);
      throw new ProvisionError(msg);
    }
    const append = offset > 0 && res.status === 206;
    let received = append ? offset : 0;
    await pipeline(
      Readable.fromWeb(res.body as never),
      async function* (src: AsyncIterable<Buffer>) {
        for await (const chunk of src) {
          arm();
          received += chunk.length;
          if (received > maxBytes) throw new ProvisionError(`download exceeds ${maxBytes} bytes; aborting (${url})`);
          yield chunk;
        }
      },
      fs.createWriteStream(dest, { flags: append ? "a" : "w" }),
    );
  } catch (e) {
    if (ctrl.signal.aborted && !(e instanceof ProvisionError)) throw ctrl.signal.reason as Error;
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Stream `url` to `dest` and return the file's SHA-256 hex digest. A stalled or dropped transfer is resumed where it
 * stopped (`deps.download`); the digest is taken over the finished file, so a resumed file is checked like any other.
 */
export async function downloadFile(deps: ProvisionDeps, url: string, dest: string, maxBytes: number = MAX_ASSET_BYTES): Promise<string> {
  const policy = deps.download ?? DEFAULT_DOWNLOAD;
  fs.rmSync(dest, { force: true });
  for (let attempt = 0; ; attempt++) {
    try {
      await fetchOnce(deps, url, dest, fileSize(dest), maxBytes, policy.stallMs);
      break;
    } catch (e) {
      if (e instanceof ProvisionError) throw e;
      const reason = (e as Error).message;
      if (attempt >= policy.retryDelaysMs.length) {
        throw new ProvisionError(`asset download failed after ${attempt + 1} attempts (${reason}): ${url}`);
      }
      const delay = policy.retryDelaysMs[attempt];
      deps.log(
        `[aiplus-office] download interrupted at ${(fileSize(dest) / 1048576).toFixed(1)} MB (${reason}); resuming in ${Math.round(delay / 1000)} s`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return sha256File(dest);
}

/**
 * Download `assetName` and `SHA256SUMS.txt` from `release` into `dest`, failing
 * closed: no sums file, no entry, or a digest mismatch aborts (the caller deletes
 * its staging dir). Shared by app provisioning and future installers.
 */
export async function downloadVerified(deps: ProvisionDeps, release: Release, assetName: string, dest: string, repo?: string): Promise<void> {
  const tag = release.tag_name;
  const assetInfo = release.assets.find((a) => a.name === assetName);
  if (!assetInfo) throw new ProvisionError(`release ${tag} has no asset named ${assetName}`);
  const sumsInfo = release.assets.find((a) => a.name === SUMS_NAME);
  if (!sumsInfo) throw new ProvisionError(`release ${tag} has no ${SUMS_NAME}; refusing to install an unverified binary`);
  // Against the real GitHub API both URLs must stay on the repo's release-download path (tests use a loopback fixture).
  if (repo && deps.apiBase === API_BASE) {
    const prefix = `https://github.com/${repo}/releases/download/`;
    for (const info of [assetInfo, sumsInfo]) {
      if (!info.browser_download_url.startsWith(prefix)) {
        throw new ProvisionError(`release ${tag}: ${info.name} points outside ${prefix}; refusing`);
      }
    }
  }
  const expected = parseSums(await downloadText(deps, sumsInfo.browser_download_url), assetName);
  const size = assetInfo.size ? ` (${(assetInfo.size / 1048576).toFixed(0)} MB)` : "";
  deps.log(`[aiplus-office] downloading ${tag} ${assetName}${size}`);
  // The advertised size bounds the stream (small slack); without it the 2 GiB cap applies.
  const cap = assetInfo.size ? assetInfo.size + 1024 * 1024 : MAX_ASSET_BYTES;
  const actual = await downloadFile(deps, assetInfo.browser_download_url, dest, cap);
  if (actual !== expected) {
    fs.rmSync(dest, { force: true });
    throw new ProvisionError(`checksum mismatch for ${assetName}: expected ${expected}, got ${actual}`);
  }
}

// ── Version resolution ──────────────────────────────────────────────────────

interface Resolved {
  version: string;
  source: ProvisionSource;
  release?: Release;
}

/**
 * The cached latest tag of `repo`, while fresh. A record from another repository, or one without a repository (written
 * before the repository could differ per host), is ignored. See change: office-wordcraft-hu.
 */
export function readLatestCache(root: string, now: number, repo: string): string | undefined {
  try {
    const rec = JSON.parse(fs.readFileSync(path.join(root, "latest.json"), "utf8")) as { tag?: unknown; checkedAt?: unknown; repo?: unknown };
    if (typeof rec.tag !== "string" || typeof rec.checkedAt !== "number" || rec.repo !== repo) return undefined;
    if (rec.checkedAt > now || now - rec.checkedAt >= LATEST_TTL_MS) return undefined;
    return rec.tag;
  } catch {
    return undefined;
  }
}

export function installedVersions(app: CraftApp, root: string, platform: string): string[] {
  return subdirs(root)
    .filter((d) => /^\d+\.\d+\.\d+[0-9A-Za-z._+-]*$/.test(d) && !d.includes(".."))
    .filter((d) => cachedBinary(app, path.join(root, d), platform) !== undefined)
    .sort((a, b) => compareSemver(b, a));
}

async function resolveVersion(app: CraftApp, deps: ProvisionDeps, root: string): Promise<Resolved> {
  const prefix = envPrefix(app);
  const pin = deps.env[`${prefix}_VERSION`]?.trim();
  if (pin) return { version: normaliseVersion(pin, app.name), source: "pin" };

  const repo = repoFor(app, deps.platform, deps.arch);
  const cached = readLatestCache(root, deps.now(), repo);
  if (cached) return { version: normaliseVersion(cached, app.name), source: "latest-cached" };

  try {
    const release = await apiJson(deps, `${deps.apiBase}/repos/${repo}/releases/latest`);
    const version = normaliseVersion(release.tag_name, app.name);
    try {
      fs.mkdirSync(root, { recursive: true });
      fs.writeFileSync(path.join(root, "latest.json"), JSON.stringify({ tag: release.tag_name, checkedAt: deps.now(), repo }));
    } catch {
      /* cache is best-effort */
    }
    return { version, source: "latest", release };
  } catch (e) {
    const reason = (e as Error).message;
    const installed = installedVersions(app, root, deps.platform);
    if (installed.length > 0) {
      deps.log(`[aiplus-office] warning: ${app.id}: latest-release lookup failed (${reason}); using installed ${installed[0]}`);
      return { version: installed[0], source: "fallback-installed" };
    }
    throw new ProvisionError(
      `${reason}. No ${app.name} version is installed; set GITHUB_TOKEN (rate limit), ${prefix}_VERSION to pin a release, or ${prefix}_BIN to an existing ${app.cli}`,
    );
  }
}

// ── Override ────────────────────────────────────────────────────────────────

/** Run `<bin> --version` and pull the first `x.y.z` out of it. */
async function probeBinaryVersion(deps: ProvisionDeps, bin: string): Promise<string | null> {
  try {
    const out = (await deps.exec(bin, ["--version"], { timeout: 10_000 })).stdout.toString();
    return /\b(\d+\.\d+\.\d+[^\s]*)/.exec(out)?.[1] ?? null;
  } catch {
    return null;
  }
}

async function overrideReport(app: CraftApp, deps: ProvisionDeps, started: number): Promise<ProvisionReport> {
  const varName = `${envPrefix(app)}_BIN`;
  const bin = deps.env[varName] as string;
  let reason: string | undefined;
  try {
    const st = fs.statSync(bin);
    if (!st.isFile()) reason = "not a file";
    else if (deps.platform !== "win32" && (st.mode & 0o111) === 0) reason = "not executable";
  } catch {
    reason = "not found";
  }
  if (reason) throw new ProvisionError(`${varName}=${bin}: ${reason}`);
  const version = deps.probeVersion ? await probeBinaryVersion(deps, bin) : null;
  return { app: app.id, version, source: "override", asset: null, cacheHit: false, binary: path.resolve(bin), durationMs: deps.now() - started };
}

// ── Shared install core ─────────────────────────────────────────────────────

const inflight = new Map<string, Promise<unknown>>();

/** In-process single-flight: concurrent callers with the same `key` share one run (and its result). */
export function singleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  if (inflight.has(key)) return inflight.get(key) as Promise<T>;
  const p = run().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/**
 * Atomically move a finished staging `tree` to `finalDir`. `EEXIST`/`ENOTEMPTY`/`EPERM` means another
 * process won the race: when `verifyExisting` accepts the winner's tree, reuse it (`true`), else rethrow.
 */
export function commitTree(tree: string, finalDir: string, verifyExisting: (dir: string) => boolean): boolean {
  try {
    fs.renameSync(tree, finalDir);
    return false;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EEXIST" || code === "ENOTEMPTY" || code === "EPERM") {
      if (!verifyExisting(finalDir)) throw e;
      return true;
    }
    throw e;
  }
}

export interface InstallVerifiedOptions<T> {
  deps: ProvisionDeps;
  /** The host's repository (`repoFor`); pins the download URLs to its release path. */
  repo: string;
  asset: string;
  release: Release;
  /** Directory that holds the staging dirs (the target's parent). */
  cacheDir: string;
  /** Final target; created by an atomic rename of the validated staging tree. */
  finalDir: string;
  /** List guard: inspect the archive and throw before anything is extracted. */
  list: (archive: string) => void | Promise<void>;
  extract: (archive: string, dest: string) => void | Promise<void>;
  /** Runs on the extracted, `assertTreeSafe`-checked tree; may finalize it in place. Its result is returned as `value`. */
  validate: (tree: string) => T | Promise<T>;
  /** Race branch: is the tree another process put at `finalDir` usable? */
  verifyExisting: (dir: string) => boolean;
}

export interface InstallResult<T> {
  /** `true`: another process installed `finalDir` first and `verifyExisting` accepted it; `value` is then undefined. */
  raced: boolean;
  value: T | undefined;
}

/**
 * Download-verified → list guard → extract into staging → `assertTreeSafe` → validate → atomic rename.
 * Staging is always removed. Single-flight per `finalDir` within the process. Shared by the CLI install
 * (tar listing, `locateBinary` validation).
 */
export function installVerified<T>(o: InstallVerifiedOptions<T>): Promise<InstallResult<T>> {
  return singleFlight(`install:${o.finalDir}`, async () => {
    const staging = path.join(o.cacheDir, `.staging-${process.pid}-${o.deps.randomId()}`);
    try {
      const tree = path.join(staging, "tree");
      fs.mkdirSync(tree, { recursive: true });
      const archive = path.join(staging, o.asset);
      await downloadVerified(o.deps, o.release, o.asset, archive, o.repo);
      await o.list(archive);
      await o.extract(archive, tree);
      assertTreeSafe(tree);
      const value = await o.validate(tree);
      const raced = commitTree(tree, o.finalDir, o.verifyExisting);
      return { raced, value: raced ? undefined : value };
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });
}

// ── Provision ───────────────────────────────────────────────────────────────

export function sweepStaleStaging(root: string, now: number): void {
  let entries: string[];
  try {
    entries = fs.readdirSync(root);
  } catch {
    return;
  }
  for (const name of entries) {
    if (!name.startsWith(".staging-")) continue;
    const p = path.join(root, name);
    try {
      if (now - fs.statSync(p).mtimeMs > STALE_STAGING_MS) fs.rmSync(p, { recursive: true, force: true });
    } catch {
      /* raced with its owner */
    }
  }
}

function cachedBinary(app: CraftApp, dir: string, platform: string): string | undefined {
  try {
    const bin = locateBinary(app, dir, platform, path.basename(dir));
    return bin && validBinary(bin, platform) ? bin : undefined;
  } catch {
    return undefined;
  }
}

/** Marker written beside an install so a cache hit can report which asset produced it. */
const ASSET_MARKER = ".aiplus-office-asset";

function readAssetMarker(versionDir: string): string | undefined {
  try {
    return fs.readFileSync(path.join(versionDir, ASSET_MARKER), "utf8").trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Provision `app` (a registry row or an app id). Unknown ids fail before any I/O. */
export async function provision(appOrId: CraftApp | string, partial: Partial<ProvisionDeps> = {}): Promise<ProvisionReport> {
  const app = typeof appOrId === "string" ? getApp(appOrId) : appOrId;
  const deps: ProvisionDeps = { ...defaultDeps(), ...partial };
  const started = deps.now();

  if (deps.env[`${envPrefix(app)}_BIN`]) return overrideReport(app, deps, started);
  return provisionManaged(app, deps, started);
}

async function provisionManaged(app: CraftApp, deps: ProvisionDeps, started: number): Promise<ProvisionReport> {
  // Host checks run before any network request.
  assetCandidates(app, deps.platform, deps.arch, "0.0.0");
  assertLibc(app, deps);

  const root = cacheRoot(app, deps);
  fs.mkdirSync(root, { recursive: true });
  sweepStaleStaging(root, deps.now());

  const resolved = await resolveVersion(app, deps, root);
  const { version } = resolved;
  const candidates = assetCandidates(app, deps.platform, deps.arch, version);
  const versionDir = path.join(root, version);

  const report = (binary: string, cacheHit: boolean, asset: string): ProvisionReport => ({
    app: app.id,
    version,
    source: resolved.source,
    asset,
    cacheHit,
    binary,
    durationMs: deps.now() - started,
  });

  if (fs.existsSync(versionDir)) {
    const hit = cachedBinary(app, versionDir, deps.platform);
    if (hit) return report(hit, true, readAssetMarker(versionDir) ?? candidates[candidates.length - 1]);
    deps.log(`[aiplus-office] cache entry ${versionDir} is damaged; re-provisioning`);
    fs.rmSync(versionDir, { recursive: true, force: true });
  }

  // An installed older version, served instead of this download when it is preferred or when the download fails.
  const useInstalled = (why: string): ProvisionReport | undefined => {
    if (resolved.source === "pin") return undefined;
    const older = installedVersions(app, root, deps.platform).filter((v) => v !== version);
    if (older.length === 0) return undefined;
    const dir = path.join(root, older[0]);
    const bin = cachedBinary(app, dir, deps.platform);
    if (!bin) return undefined;
    deps.log(`[aiplus-office] ${app.id}: ${why}; using installed ${older[0]}`);
    return {
      app: app.id,
      version: older[0],
      source: "fallback-installed",
      asset: readAssetMarker(dir) ?? null,
      cacheHit: true,
      binary: bin,
      durationMs: deps.now() - started,
    };
  };
  if (deps.preferInstalled) {
    const now = useInstalled(`${version} is available and is installed by the next command outside a connector`);
    if (now) return now;
  }

  const tag = `v${version}`;
  const release = resolved.release ?? (await apiJson(deps, `${deps.apiBase}/repos/${repoFor(app, deps.platform, deps.arch)}/releases/tags/${tag}`));
  const asset = candidates.find((c) => release.assets.some((a) => a.name === c));
  if (!asset) throw new ProvisionError(`release ${tag} has no asset named ${candidates.join(" or ")}`);

  let installed: InstallResult<string>;
  try {
    installed = await installVerified<string>({
      deps,
      repo: repoFor(app, deps.platform, deps.arch),
      asset,
      release,
      cacheDir: root,
      finalDir: versionDir,
      list: (archive) => listArchive(deps, archive),
      extract: (archive, dest) => extractArchive(deps, archive, dest),
      validate: (tree) => {
        const located = locateBinary(app, tree, deps.platform, asset);
        if (!located) throw new ProvisionError(`no ${binName(app, deps.platform)} found in ${asset}`);
        const rel = path.relative(tree, located);
        fs.chmodSync(located, 0o755);
        fs.rmSync(path.join(path.dirname(located), desktopName(app, deps.platform)), { force: true });
        fs.writeFileSync(path.join(tree, ASSET_MARKER), `${asset}\n`);
        return rel;
      },
      verifyExisting: (dir) => cachedBinary(app, dir, deps.platform) !== undefined,
    });
  } catch (e) {
    const fallback = useInstalled(`installing ${version} failed (${(e as Error).message})`);
    if (fallback) return fallback;
    throw e;
  }
  const binary = installed.raced ? (cachedBinary(app, versionDir, deps.platform) as string) : path.join(versionDir, installed.value as string);
  const out = report(binary, false, asset);
  if (deps.platform === "darwin") {
    try {
      await deps.exec("spctl", ["--assess", "--type", "install", binary]);
      out.gatekeeper = "accepted";
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        out.gatekeeper = "rejected";
        deps.log(`[aiplus-office] warning: Gatekeeper rejected ${binary} (checksum verified; authenticity not claimed)`);
      }
    }
  }
  return out;
}
