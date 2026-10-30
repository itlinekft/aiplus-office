/**
 * `aiplus-office dict hu` — the Hungarian spelling dictionary for WordCraft, which bundles none (licence, size) and
 * checks Hungarian only with `hu_HU.aff` + `hu_HU.dic` in a folder it reads.
 *
 * The files come from LibreOffice's official repository at one pinned commit; their SHA-256 is written here, so the
 * download needs no API call and a changed file is refused. The licence text (`README_hu_HU.txt`: MPL / LGPL / GPL,
 * Magyar Ispell) travels with them. Kept in `<cache root>/dictionaries/`, installed by an atomic rename of a staging
 * directory like jq. `aiplus-office wordcraft …` points WordCraft at the folder (`WORDCRAFT_DICTIONARIES`).
 *
 * See change: office-wordcraft-hu (office-cli "Hungarian dictionary on request").
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { craftRoot, downloadFile, type ProvisionDeps, ProvisionError, singleFlight, sweepStaleStaging } from "./provision.js";

/** LibreOffice/dictionaries commit of 2025-12-16, the one the Hungarian proofing was measured against. */
export const HU_COMMIT = "74b6ae2a2df22fd9d6e253f0391ac3a67cb7b3f8";

export interface DictFile {
  name: string;
  sha256: string;
  /** The file's size in bytes; a larger download is aborted. */
  bytes: number;
}

export const HU_FILES: readonly DictFile[] = [
  { name: "hu_HU.aff", sha256: "f3a2748dd535cfde2142ab17d0f7f8e4787b03fb25a60829c69ac8d493db4802", bytes: 2_316_267 },
  { name: "hu_HU.dic", sha256: "97293d670ad4a3b8e7eebef7e25c6e8e939b914c64b6b4672b2bf416b768f990", bytes: 1_786_144 },
  { name: "README_hu_HU.txt", sha256: "52b17fc3d53b6935eab747a71894507d702f7f0fde379c819c16cc803005fc84", bytes: 1_190 },
];

export function huUrl(name: string, base = "https://raw.githubusercontent.com"): string {
  return `${base}/LibreOffice/dictionaries/${HU_COMMIT}/hu_HU/${name}`;
}

type DictDeps = Pick<ProvisionDeps, "env" | "homedir" | "platform">;

/** `<cache root>/dictionaries`, the folder WordCraft is pointed at. */
export function dictionaryDir(deps: DictDeps): string {
  return path.join(craftRoot(deps), "dictionaries");
}

/** True when `hu_HU.aff` and `hu_HU.dic` are in the folder (non-empty). Never downloads; for `status` and the env. */
export function huInstalled(deps: DictDeps): boolean {
  const dir = dictionaryDir(deps);
  return ["hu_HU.aff", "hu_HU.dic"].every((n) => {
    try {
      const st = fs.statSync(path.join(dir, n));
      return st.isFile() && st.size > 0;
    } catch {
      return false;
    }
  });
}

/**
 * The environment for a WordCraft process: `WORDCRAFT_DICTIONARIES` set to the dictionary folder when the Hungarian
 * dictionary is installed and the variable is unset. Anything already set is kept.
 */
export function wordcraftEnv(env: NodeJS.ProcessEnv, deps: DictDeps): NodeJS.ProcessEnv {
  if (env.WORDCRAFT_DICTIONARIES || !huInstalled(deps)) return env;
  return { ...env, WORDCRAFT_DICTIONARIES: dictionaryDir(deps) };
}

/**
 * Download and check the Hungarian dictionary into `<cache root>/dictionaries`, unless it is there. Returns the folder.
 * `files` and `base` (the raw-content host) are for tests.
 */
export async function ensureHu(deps: ProvisionDeps, files: readonly DictFile[] = HU_FILES, base?: string): Promise<string> {
  const finalDir = dictionaryDir(deps);
  if (huInstalled(deps)) return finalDir;
  const parent = path.dirname(finalDir);
  return singleFlight(`install:${finalDir}`, async () => {
    if (huInstalled(deps)) return finalDir;
    fs.mkdirSync(parent, { recursive: true });
    sweepStaleStaging(parent, deps.now());
    const staging = path.join(parent, `.staging-${process.pid}-${deps.randomId()}`);
    try {
      const tree = path.join(staging, "tree");
      fs.mkdirSync(tree, { recursive: true });
      deps.log(`[aiplus-office] downloading the Hungarian dictionary (hu_HU, about 4 MB) from github.com/LibreOffice/dictionaries`);
      for (const f of files) {
        const actual = await downloadFile(deps, huUrl(f.name, base), path.join(tree, f.name), f.bytes);
        if (actual !== f.sha256) throw new ProvisionError(`checksum mismatch for ${f.name}: expected ${f.sha256}, got ${actual}`);
      }
      fs.rmSync(finalDir, { recursive: true, force: true });
      fs.renameSync(tree, finalDir);
      return finalDir;
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });
}
