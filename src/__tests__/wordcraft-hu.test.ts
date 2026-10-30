import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { main } from "../bin/aiplus-office.js";
import { dictionaryDir, ensureHu, HU_COMMIT, HU_FILES, huDesktopDir, huInstalled, huUrl, wordcraftEnv } from "../dictionary.js";
import { defaultDeps, installedRepo, ProvisionError, type ProvisionDeps, provision, readLatestCache } from "../provision.js";
import { CRAFT_APPS, getApp, repoFor } from "../registry.js";
import { cleanupTmp, makeTarGz, STUB_BINARY, startFixture, tmpDir } from "./helpers/fixtures.js";

afterEach(cleanupTmp);

const BYTES = Buffer.from("SET UTF-8\n");
const SHA = createHash("sha256").update(BYTES).digest("hex");
const FAKE = [
  { name: "hu_HU.aff", sha256: SHA, bytes: BYTES.length },
  { name: "hu_HU.dic", sha256: SHA, bytes: BYTES.length },
  { name: "README_hu_HU.txt", sha256: SHA, bytes: BYTES.length },
];

function deps(home: string, over: Partial<ProvisionDeps> = {}): { d: ProvisionDeps; urls: string[] } {
  const urls: string[] = [];
  const d: ProvisionDeps = {
    ...defaultDeps(),
    env: { AIPLUS_OFFICE_HOME: home },
    platform: "win32",
    arch: "x64",
    log: () => {},
    download: { stallMs: 5_000, retryDelaysMs: [] },
    fetch: (async (url: string) => {
      urls.push(String(url));
      return new Response(BYTES, { status: 200 });
    }) as typeof fetch,
    ...over,
  };
  return { d, urls };
}

function installFake(home: string): string {
  const dir = path.join(home, "dictionaries");
  fs.mkdirSync(dir, { recursive: true });
  for (const f of FAKE) fs.writeFileSync(path.join(dir, f.name), BYTES);
  return dir;
}

describe("WordCraft with Hungarian spell checking (change office-wordcraft-hu)", () => {
  it("WordCraft on Windows x64 comes from the fork; every other host and app stays on storytold", () => {
    const wc = getApp("wordcraft");
    expect(repoFor(wc, "win32", "x64")).toBe("tatargabor/wordcraft");
    for (const [p, a] of [["win32", "arm64"], ["darwin", "arm64"], ["linux", "x64"]]) expect(repoFor(wc, p, a)).toBe("storytold/wordcraft");
    for (const app of CRAFT_APPS.filter((x) => x.id !== "wordcraft")) expect(repoFor(app, "win32", "x64")).toBe(`storytold/${app.id}`);
  });

  it("the latest-release lookup on Windows x64 asks the fork", async () => {
    const home = tmpDir();
    const urls: string[] = [];
    const { d } = deps(home, {
      fetch: (async (url: string) => {
        urls.push(String(url));
        return new Response("{}", { status: 404 });
      }) as typeof fetch,
    });
    await expect(provision("wordcraft", d)).rejects.toThrow(ProvisionError);
    expect(urls[0]).toBe("https://api.github.com/repos/tatargabor/wordcraft/releases/latest");
  });

  it("a cached latest tag counts only for the repository it was read from", () => {
    const root = tmpDir();
    const now = 1_000_000;
    const write = (rec: object) => fs.writeFileSync(path.join(root, "latest.json"), JSON.stringify({ tag: "v0.12.0", checkedAt: now - 1, ...rec }));
    write({});
    expect(readLatestCache(root, now, "tatargabor/wordcraft")).toBeUndefined();
    write({ repo: "storytold/wordcraft" });
    expect(readLatestCache(root, now, "tatargabor/wordcraft")).toBeUndefined();
    expect(readLatestCache(root, now, "storytold/wordcraft")).toBe("v0.12.0");
  });

  it("a connector does not keep serving storytold's WordCraft once the host installs from the fork", async () => {
    // The fork's repository for this (Linux) test host stands in for Windows x64.
    const wc = { ...getApp("wordcraft"), hostRepos: { "linux/x64": "tatargabor/wordcraft" as const } };
    const top = "wordcraft-0.7.0-linux-x86_64";
    const fx = await startFixture({
      repo: "tatargabor/wordcraft",
      assets: { [`${top}.tar.gz`]: makeTarGz({ [`${top}/bin/wordcraft-cli`]: STUB_BINARY, [`${top}/bin/wordcraft`]: STUB_BINARY }) },
    });
    try {
      const home = tmpDir();
      const old = path.join(home, "wordcraft", "0.6.0", "x", "bin");
      fs.mkdirSync(old, { recursive: true });
      fs.writeFileSync(path.join(old, "wordcraft-cli"), STUB_BINARY, { mode: 0o755 });
      expect(installedRepo(wc, path.join(home, "wordcraft", "0.6.0"))).toBe("storytold/wordcraft");
      const d: Partial<ProvisionDeps> = {
        env: { AIPLUS_OFFICE_HOME: home }, platform: "linux", arch: "x64", glibcVersion: () => "2.36", apiBase: fx.url,
        log: () => {}, download: { stallMs: 300, retryDelaysMs: [10] }, preferInstalled: true,
      };
      const r = await provision(wc, d);
      expect(r.version).toBe("0.7.0");
      expect(installedRepo(wc, path.join(home, "wordcraft", "0.7.0"))).toBe("tatargabor/wordcraft");
      // An install from the fork is served at once by the next connector, as before.
      fs.writeFileSync(path.join(home, "wordcraft", "latest.json"), JSON.stringify({ tag: "v0.8.0", checkedAt: Date.now(), repo: "tatargabor/wordcraft" }));
      expect((await provision(wc, d)).version).toBe("0.7.0");
    } finally {
      await fx.close();
    }
  });

  it("pins the dictionary to one LibreOffice commit with a SHA-256 and size per file, licence included", () => {
    expect(HU_COMMIT).toMatch(/^[0-9a-f]{40}$/);
    expect(HU_FILES.map((f) => f.name)).toEqual(["hu_HU.aff", "hu_HU.dic", "README_hu_HU.txt"]);
    for (const f of HU_FILES) {
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(f.bytes).toBeGreaterThan(0);
    }
    expect(huUrl("hu_HU.aff")).toBe(`https://raw.githubusercontent.com/LibreOffice/dictionaries/${HU_COMMIT}/hu_HU/hu_HU.aff`);
  });

  it("downloads the three files once, checks them, installs them under <cache>/dictionaries", async () => {
    const home = tmpDir();
    const { d, urls } = deps(home);
    expect(huInstalled(d)).toBe(false);
    const dir = await ensureHu(d, FAKE);
    expect(dir).toBe(path.join(home, "dictionaries"));
    expect(dir).toBe(dictionaryDir(d));
    expect(fs.readdirSync(dir).sort()).toEqual(["README_hu_HU.txt", "hu_HU.aff", "hu_HU.dic"]);
    expect(urls).toEqual(FAKE.map((f) => huUrl(f.name)));
    expect(huInstalled(d)).toBe(true);
    await ensureHu(d, FAKE);
    expect(urls).toHaveLength(3);
    expect(fs.readdirSync(home).filter((n) => n.startsWith(".staging"))).toEqual([]);
  });

  it("refuses a changed file and installs nothing", async () => {
    const home = tmpDir();
    const { d } = deps(home);
    const bad = [...FAKE.slice(0, 1), { ...FAKE[1], sha256: "0".repeat(64) }, FAKE[2]];
    await expect(ensureHu(d, bad)).rejects.toThrow(/checksum mismatch for hu_HU.dic/);
    expect(fs.existsSync(dictionaryDir(d))).toBe(false);
    expect(huInstalled(d)).toBe(false);
  });

  it("points WordCraft at the dictionary only when it is installed and the variable is unset", () => {
    const home = tmpDir();
    const d = { env: { AIPLUS_OFFICE_HOME: home }, homedir: () => home, platform: "win32" as const };
    expect(wordcraftEnv(d.env, d).WORDCRAFT_DICTIONARIES).toBeUndefined();
    const dir = installFake(home);
    expect(wordcraftEnv(d.env, d).WORDCRAFT_DICTIONARIES).toBe(dir);
    expect(wordcraftEnv({ ...d.env, WORDCRAFT_DICTIONARIES: "C:\\own" }, d).WORDCRAFT_DICTIONARIES).toBe("C:\\own");
  });

  it("`aiplus-office wordcraft …` sets WORDCRAFT_DICTIONARIES for what it starts; other apps do not", async () => {
    const home = tmpDir();
    const dir = installFake(home);
    const quiet = { stdout: () => {}, stderr: () => {} };
    const env: NodeJS.ProcessEnv = { AIPLUS_OFFICE_HOME: home };
    await main(["wordcraft", "no-such-sub"], { ...quiet, env, homedir: () => home });
    expect(env.WORDCRAFT_DICTIONARIES).toBe(dir);
    const other: NodeJS.ProcessEnv = { AIPLUS_OFFICE_HOME: home };
    await main(["gridcraft", "no-such-sub"], { ...quiet, env: other, homedir: () => home });
    expect(other.WORDCRAFT_DICTIONARIES).toBeUndefined();
  });

  it("`dict hu` prints the folder, exits 69 on a failed download, 1 on bad usage", async () => {
    const out: string[] = [];
    const err: string[] = [];
    const io = { stdout: (t: string) => void out.push(t), stderr: (t: string) => void err.push(t) };
    expect(await main(["dict", "hu"], { ...io, ensureHu: async () => "/c/dictionaries" })).toBe(0);
    expect(out.join("")).toBe("/c/dictionaries\n");
    expect(
      await main(["dict", "hu"], {
        ...io,
        ensureHu: async () => {
          throw new ProvisionError("checksum mismatch for hu_HU.dic");
        },
      }),
    ).toBe(69);
    expect(err.join("")).toMatch(/dict hu: checksum mismatch/);
    expect(await main(["dict"], io)).toBe(1);
    expect(await main(["dict", "de"], io)).toBe(1);
  });

  it("under Claude Desktop, `status` and `dict hu` name its own package copy, the one the desktop WordCraft can open", async () => {
    const local = tmpDir();
    const pkgRoot = path.join(local, "Packages", "Claude_pzs8sxrjxfjjc", "LocalCache", "Local", "aiplus-office");
    fs.mkdirSync(pkgRoot, { recursive: true });
    expect(huDesktopDir([pkgRoot])).toBeUndefined();
    const pkgDict = installFake(pkgRoot);
    expect(huDesktopDir([pkgRoot])).toBe(pkgDict);
    const out: string[] = [];
    const io = { stdout: (t: string) => void out.push(t), stderr: () => {}, env: { LOCALAPPDATA: local }, homedir: () => local, platform: "win32" as const, arch: "x64" };
    await main(["status"], io);
    expect(out.join("")).toContain(`dictionary: hu_HU in ${pkgDict}\n`);
    out.length = 0;
    expect(await main(["dict", "hu"], { ...io, ensureHu: async () => path.join(local, "aiplus-office", "dictionaries") })).toBe(0);
    expect(out.join("")).toBe(`${pkgDict}\n`);
  });

  it("`status` names the dictionary: installed and where, or how to get it", async () => {
    const home = tmpDir();
    const run = async () => {
      const out: string[] = [];
      await main(["status"], { stdout: (t) => void out.push(t), stderr: () => {}, env: { AIPLUS_OFFICE_HOME: home }, homedir: () => home, platform: "win32", arch: "x64" });
      return out.join("");
    };
    expect(await run()).toContain("dictionary: hu_HU not installed (aiplus-office dict hu)\n");
    const dir = installFake(home);
    expect(await run()).toContain(`dictionary: hu_HU in ${dir}\n`);
  });
});
