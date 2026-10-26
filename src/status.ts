/**
 * `aiplus-office status` — per-app installed versions, cache size, the version that would be used and any override.
 * Reads the local cache only: it never touches the network and never downloads.
 *
 * See change: office-plugin-v1 (office-cli "Status never downloads").
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  cacheRoot,
  craftRoot,
  installedVersions,
  normaliseVersion,
  type ProvisionDeps,
  type ProvisionSource,
  readLatestCache,
} from "./provision.js";
import { type CraftApp, envPrefix } from "./registry.js";

export interface AppStatus {
  app: CraftApp["id"];
  name: string;
  installed: string[];
  cacheBytes: number;
  /** What a run would resolve right now without asking GitHub; `version: null` = would download the latest release. */
  wouldUse: { version: string | null; source: ProvisionSource | "download" };
  /** The cache directory of this app. */
  cache: string;
  override?: string;
}

type StatusDeps = Pick<ProvisionDeps, "env" | "platform" | "homedir" | "now">;

function dirBytes(dir: string): number {
  let total = 0;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    try {
      if (e.isDirectory()) total += dirBytes(p);
      else if (e.isFile()) total += fs.statSync(p).size;
    } catch {
      /* raced with a removal */
    }
  }
  return total;
}

export function appStatus(app: CraftApp, deps: StatusDeps): AppStatus {
  const root = cacheRoot(app, deps);
  const installed = installedVersions(app, root, deps.platform);
  const prefix = envPrefix(app);
  const override = deps.env[`${prefix}_BIN`];
  const pin = deps.env[`${prefix}_VERSION`]?.trim();
  let wouldUse: AppStatus["wouldUse"];
  if (override) wouldUse = { version: null, source: "override" };
  else if (pin) wouldUse = { version: normaliseVersion(pin, app.name), source: "pin" };
  else {
    const cached = readLatestCache(root, deps.now());
    if (cached) wouldUse = { version: normaliseVersion(cached, app.name), source: "latest-cached" };
    else wouldUse = { version: null, source: "download" };
  }
  return { app: app.id, name: app.name, installed, cacheBytes: dirBytes(root), wouldUse, cache: root, ...(override ? { override } : {}) };
}

/** The shared cache root (for the status header). */
export function statusRoot(deps: StatusDeps): string {
  return craftRoot(deps);
}

/**
 * Claude Desktop on Windows is a packaged app: whatever it, and every process it starts, writes under `%LOCALAPPDATA%`
 * really lands in `%LOCALAPPDATA%\Packages\Claude_<id>\LocalCache\Local`, so Explorer shows nothing at the usual cache
 * path. Returns the copies of the cache root found there, so `status` names a folder the user can open. Read-only.
 *
 * See change: office-desktop-truth (office-cli "Status names Claude Desktop's own copy").
 */
export function desktopCacheRoots(deps: StatusDeps): string[] {
  if (deps.env.AIPLUS_OFFICE_HOME || deps.platform !== "win32") return [];
  const packages = path.join(deps.env.LOCALAPPDATA || path.join(deps.homedir(), "AppData", "Local"), "Packages");
  let names: string[];
  try {
    names = fs.readdirSync(packages);
  } catch {
    return [];
  }
  return names
    .filter((n) => /^Claude_/i.test(n))
    .sort()
    .map((n) => path.join(packages, n, "LocalCache", "Local", "aiplus-office"))
    .filter((p) => {
      try {
        return fs.statSync(p).isDirectory();
      } catch {
        return false;
      }
    });
}
