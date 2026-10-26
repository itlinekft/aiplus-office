/**
 * `aiplus-office jq <args…>` — the workflow skills' gates use jq, and Git for Windows does not ship it (measured on a
 * Windows 11 test PC, 2026-10-26: `C:\Program Files\Git\usr\bin` has no `jq.exe`). The skills fall back to this command
 * when `jq` is not on PATH.
 *
 * One pinned jq release; its SHA-256 per host is written here, copied from the release's `sha256sum.txt`, so the
 * download needs no API call and a changed file is refused. Kept in `<cache root>/jq/<version>/`, installed by an atomic
 * rename of a staging directory like the apps.
 *
 * See change: office-install-complete (office-cli "jq for the workflow gates").
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { craftRoot, downloadFile, exe, type ProvisionDeps, ProvisionError, singleFlight, sweepStaleStaging } from "./provision.js";

export const JQ_VERSION = "1.8.2";

export interface JqAsset {
  asset: string;
  sha256: string;
}

/** `<platform>/<arch>` → the release asset and its SHA-256 (from `jq-1.8.2/sha256sum.txt`). */
export const JQ_ASSETS: Readonly<Record<string, JqAsset>> = {
  "linux/x64": { asset: "jq-linux-amd64", sha256: "b1c22172dd303f3be49e935aa56aa48a8b7a46e0bc838b4997d3bb451495870f" },
  "linux/arm64": { asset: "jq-linux-arm64", sha256: "8b85c817833814ddca00a144c33705546355afccf0cf39b188f3cdb48b852309" },
  "darwin/x64": { asset: "jq-macos-amd64", sha256: "e94b266e3c26690550006abe63152b782280f4e14374accdf04cbde844f00bc0" },
  "darwin/arm64": { asset: "jq-macos-arm64", sha256: "2d75340ba57a4b4b4c8708a21c2dc8e958a48aaa8bba13b27f77f6e4c0eca07e" },
  "win32/x64": { asset: "jq-windows-amd64.exe", sha256: "a6fc67fedaf9128a3309a1e2ebb8b986aeccf70122ee46d2cb4849e423f0c627" },
  "win32/arm64": { asset: "jq-windows-arm64.exe", sha256: "083b5377392bc57cf27052b6d20a2d927770683bca844632901ff38b4b7b0ac7" },
};

/** jq's binaries are 1–3 MB; anything larger is not one of them. */
const MAX_JQ_BYTES = 16 * 1024 * 1024;

export function jqUrl(asset: string): string {
  return `https://github.com/jqlang/jq/releases/download/jq-${JQ_VERSION}/${asset}`;
}

type JqDeps = Pick<ProvisionDeps, "env" | "homedir" | "platform" | "arch">;

/** Where the pinned jq lives once installed: `<cache root>/jq/<version>/jq[.exe]`. */
export function jqPath(deps: JqDeps): string {
  return path.join(craftRoot(deps), "jq", JQ_VERSION, exe("jq", deps.platform));
}

/** The installed pinned jq (a non-empty file, executable off Windows), or undefined. Never downloads; for `status`. */
export function installedJq(deps: JqDeps): string | undefined {
  const p = jqPath(deps);
  try {
    const st = fs.statSync(p);
    if (!st.isFile() || st.size === 0) return undefined;
    return deps.platform === "win32" || (st.mode & 0o111) !== 0 ? p : undefined;
  } catch {
    return undefined;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Move the checked `tree` to `finalDir`. A `finalDir` without a usable jq (an interrupted or damaged install) is
 * removed first, or it would block every later install; a rename that fails while a scanner holds the new file (EPERM,
 * EBUSY on Windows) is retried a few times. Another process that installed first wins.
 */
async function commitJq(tree: string, finalDir: string, deps: JqDeps): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    if (installedJq(deps)) return;
    fs.rmSync(finalDir, { recursive: true, force: true });
    try {
      fs.renameSync(tree, finalDir);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (installedJq(deps)) return;
      if (attempt >= 4 || !["EPERM", "EBUSY", "EACCES", "ENOTEMPTY", "EEXIST"].includes(code ?? "")) throw e;
      await sleep(250 * (attempt + 1));
    }
  }
}

/** Return the pinned jq's path, downloading and checking it first when it is not installed. */
export async function ensureJq(deps: ProvisionDeps, assets: Readonly<Record<string, JqAsset>> = JQ_ASSETS): Promise<string> {
  const host = `${deps.platform}/${deps.arch}`;
  const entry = assets[host];
  if (!entry) throw new ProvisionError(`unsupported platform: ${host} has no jq ${JQ_VERSION} build here; install jq yourself`);
  const binary = jqPath(deps);
  if (installedJq(deps)) return binary;
  const finalDir = path.dirname(binary);
  const parent = path.dirname(finalDir);
  return singleFlight(`install:${finalDir}`, async () => {
    if (installedJq(deps)) return binary;
    fs.mkdirSync(parent, { recursive: true });
    sweepStaleStaging(parent, deps.now());
    const staging = path.join(parent, `.staging-${process.pid}-${deps.randomId()}`);
    try {
      const tree = path.join(staging, "tree");
      fs.mkdirSync(tree, { recursive: true });
      const dest = path.join(tree, path.basename(binary));
      deps.log(`[aiplus-office] downloading jq ${JQ_VERSION} ${entry.asset} from github.com/jqlang/jq`);
      const actual = await downloadFile(deps, jqUrl(entry.asset), dest, MAX_JQ_BYTES);
      if (actual !== entry.sha256) throw new ProvisionError(`checksum mismatch for ${entry.asset}: expected ${entry.sha256}, got ${actual}`);
      if (deps.platform !== "win32") fs.chmodSync(dest, 0o755);
      await commitJq(tree, finalDir, deps);
      return binary;
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });
}
