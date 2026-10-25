import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cacheRoot, craftRoot, provision } from "../provision.js";
import { getApp } from "../registry.js";
import { cleanupTmp, type Fixture, makeTarGz, STUB_BINARY, startFixture, tmpDir } from "./helpers/fixtures.js";

const fixtures: Fixture[] = [];
afterEach(async () => {
  for (const f of fixtures.splice(0)) await f.close();
  cleanupTmp();
});

const logs: string[] = [];
const base = (home: string, extra: Record<string, unknown> = {}) => ({
  env: { AIPLUS_OFFICE_HOME: home } as NodeJS.ProcessEnv,
  platform: "linux" as const,
  arch: "x64",
  glibcVersion: () => "2.99",
  log: (m: string) => logs.push(m),
  ...extra,
});
const asset = (id: string, cliOnly = false) => `${id}${cliOnly ? "-cli" : ""}-0.7.0-linux-x86_64.tar.gz`;
const archive = (id: string, top: string) => makeTarGz({ [`${top}/bin/${id}-cli`]: STUB_BINARY, [`${top}/bin/${id}`]: STUB_BINARY });

async function fixture(id: string, assets: Record<string, Buffer>) {
  const fx = await startFixture({ repo: `storytold/${id}`, assets });
  fixtures.push(fx);
  return fx;
}

describe("cross-app behaviour", () => {
  it("unknown app id (also a non-office ArtCraft app) fails without any network request and lists the 4 ids", async () => {
    const fx = await fixture("photocraft", {});
    for (const bad of ["paintcraft", "photocraft"]) {
      const e = await provision(bad, base(tmpDir(), { apiBase: fx.url })).catch((x: Error) => x);
      expect((e as Error).message).toContain(bad);
      for (const id of ["wordcraft", "gridcraft", "deckcraft", "pdfcraft"]) expect((e as Error).message).toContain(id);
    }
    expect(fx.requests).toHaveLength(0);
  });

  it("pins are per app: another app's pin is not applied", async () => {
    const fx = await fixture("gridcraft", { [asset("gridcraft")]: archive("gridcraft", "gridcraft-0.7.0-linux-x86_64") });
    const home = tmpDir();
    const r = await provision("gridcraft", base(home, { apiBase: fx.url, env: { AIPLUS_OFFICE_HOME: home, AIPLUS_OFFICE_DECKCRAFT_VERSION: "9.9.9" } }));
    expect(r).toMatchObject({ app: "gridcraft", version: "0.7.0", source: "latest" });
  });

  it("AIPLUS_OFFICE_HOME is the root; the default is the per-user cache directory of the platform", () => {
    const deps = (env: NodeJS.ProcessEnv, platform: NodeJS.Platform = "linux") => ({ env, homedir: () => "/h", platform });
    expect(craftRoot(deps({}))).toBe(path.join("/h", ".cache", "aiplus-office"));
    expect(craftRoot(deps({ XDG_CACHE_HOME: "/x" }))).toBe(path.join("/x", "aiplus-office"));
    expect(craftRoot(deps({ XDG_CACHE_HOME: "relative" }))).toBe(path.join("/h", ".cache", "aiplus-office"));
    expect(craftRoot(deps({}, "darwin"))).toBe(path.join("/h", "Library", "Caches", "aiplus-office"));
    expect(craftRoot(deps({ LOCALAPPDATA: "/l" }, "win32"))).toBe(path.join("/l", "aiplus-office"));
    expect(craftRoot(deps({ AIPLUS_OFFICE_HOME: "/c", XDG_CACHE_HOME: "/x" }))).toBe("/c");
    expect(cacheRoot(getApp("gridcraft"), deps({ AIPLUS_OFFICE_HOME: "/c" }))).toBe(path.join("/c", "gridcraft"));
  });

  it("Linux prefers a CLI-only tarball when the release has one, else falls back to the portable one", async () => {
    const withCli = await fixture("pdfcraft", {
      [asset("pdfcraft", true)]: archive("pdfcraft", "pdfcraft-cli-0.7.0-linux-x86_64"),
      [asset("pdfcraft")]: archive("pdfcraft", "pdfcraft-0.7.0-linux-x86_64"),
    });
    const r = await provision("pdfcraft", base(tmpDir(), { apiBase: withCli.url }));
    expect(r.asset).toBe(asset("pdfcraft", true));
    const portableOnly = await fixture("gridcraft", { [asset("gridcraft")]: archive("gridcraft", "gridcraft-0.7.0-linux-x86_64") });
    const r2 = await provision("gridcraft", base(tmpDir(), { apiBase: portableOnly.url }));
    expect(r2.asset).toBe(asset("gridcraft"));
  });

  it("a cache hit reports the asset that produced the install", async () => {
    const fx = await fixture("pdfcraft", { [asset("pdfcraft", true)]: archive("pdfcraft", "pdfcraft-cli-0.7.0-linux-x86_64") });
    const home = tmpDir();
    await provision("pdfcraft", base(home, { apiBase: fx.url }));
    const again = await provision("pdfcraft", base(home, { apiBase: fx.url, env: { AIPLUS_OFFICE_HOME: home, AIPLUS_OFFICE_PDFCRAFT_VERSION: "0.7.0" } }));
    expect(again).toMatchObject({ cacheHit: true, asset: asset("pdfcraft", true) });
  });

  it("different apps provisioned concurrently each get their own <root>/<app>/<version>/", async () => {
    const w = await fixture("wordcraft", { [asset("wordcraft")]: archive("wordcraft", "t1") });
    const d = await fixture("deckcraft", { [asset("deckcraft")]: archive("deckcraft", "t2") });
    const home = tmpDir();
    const [a, b] = await Promise.all([
      provision("wordcraft", base(home, { apiBase: w.url })),
      provision("deckcraft", base(home, { apiBase: d.url })),
    ]);
    expect(a.binary).toBe(path.join(home, "wordcraft", "0.7.0", "t1", "bin", "wordcraft-cli"));
    expect(b.binary).toBe(path.join(home, "deckcraft", "0.7.0", "t2", "bin", "deckcraft-cli"));
    expect(fs.existsSync(a.binary) && fs.existsSync(b.binary)).toBe(true);
  });

  it("fresh install report carries app, source, asset, cacheHit, binary and duration", async () => {
    const fx = await fixture("deckcraft", { [asset("deckcraft")]: archive("deckcraft", "t") });
    const r = await provision("deckcraft", base(tmpDir(), { apiBase: fx.url }));
    expect(r).toMatchObject({ app: "deckcraft", version: "0.7.0", source: "latest", asset: asset("deckcraft"), cacheHit: false });
    expect(path.isAbsolute(r.binary)).toBe(true);
    expect(typeof r.durationMs).toBe("number");
  });
});

describe("override", () => {
  it("a per-app override beats every other source and needs no network", async () => {
    const home = tmpDir();
    const bin = path.join(home, "wc");
    fs.writeFileSync(bin, "#!/bin/sh\n", { mode: 0o755 });
    const r = await provision("wordcraft", base(home, { apiBase: "http://127.0.0.1:9", env: { AIPLUS_OFFICE_HOME: home, AIPLUS_OFFICE_WORDCRAFT_BIN: bin, AIPLUS_OFFICE_WORDCRAFT_VERSION: "0.1.0" } }));
    expect(r).toMatchObject({ app: "wordcraft", source: "override", binary: bin });
  });
});

describe("review round 1 follow-ups", () => {
  it("prerelease cache directories count as installed (offline fallback + status)", async () => {
    const fx = await startFixture({ repo: "storytold/deckcraft", assets: {}, latestStatus: 403 });
    fixtures.push(fx);
    const home = tmpDir();
    const dir = path.join(home, "deckcraft", "0.10.0-beta.1", "top", "bin");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "deckcraft-cli"), STUB_BINARY, { mode: 0o755 });
    const r = await provision("deckcraft", base(home, { apiBase: fx.url }));
    expect(r).toMatchObject({ version: "0.10.0-beta.1", source: "fallback-installed", cacheHit: true });
  });
});
