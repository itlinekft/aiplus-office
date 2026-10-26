import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { main } from "../bin/aiplus-office.js";
import { ensureJq, JQ_ASSETS, JQ_VERSION, jqPath, jqUrl } from "../jq.js";
import { defaultDeps, ProvisionError, type ProvisionDeps } from "../provision.js";
import { cleanupTmp, tmpDir } from "./helpers/fixtures.js";

afterEach(cleanupTmp);

const BYTES = Buffer.from("#!/bin/sh\necho jq-fake\n");
const SHA = createHash("sha256").update(BYTES).digest("hex");

function deps(home: string, over: Partial<ProvisionDeps> = {}): { d: ProvisionDeps; urls: string[] } {
  const urls: string[] = [];
  const d: ProvisionDeps = {
    ...defaultDeps(),
    env: { AIPLUS_OFFICE_HOME: home },
    platform: "linux",
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

describe("jq for the workflow gates (change office-install-complete)", () => {
  it("pins one jq release for the six desktop hosts, each with a SHA-256, from jqlang/jq's release path", () => {
    expect(Object.keys(JQ_ASSETS).sort()).toEqual(["darwin/arm64", "darwin/x64", "linux/arm64", "linux/x64", "win32/arm64", "win32/x64"]);
    for (const { asset, sha256 } of Object.values(JQ_ASSETS)) {
      expect(sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(jqUrl(asset)).toBe(`https://github.com/jqlang/jq/releases/download/jq-${JQ_VERSION}/${asset}`);
    }
    expect(JQ_ASSETS["win32/x64"].asset).toBe("jq-windows-amd64.exe");
  });

  it("downloads once, checks the digest, installs an executable under <cache>/jq/<version>, then serves it offline", async () => {
    const home = tmpDir();
    const { d, urls } = deps(home);
    const table = { "linux/x64": { asset: "jq-linux-amd64", sha256: SHA } };
    const bin = await ensureJq(d, table);
    expect(bin).toBe(path.join(home, "jq", JQ_VERSION, "jq"));
    expect(bin).toBe(jqPath(d));
    expect(fs.readFileSync(bin)).toEqual(BYTES);
    expect(fs.statSync(bin).mode & 0o111).not.toBe(0);
    expect(urls).toEqual([jqUrl("jq-linux-amd64")]);
    expect(await ensureJq(d, table)).toBe(bin);
    expect(urls).toHaveLength(1);
    expect(fs.readdirSync(path.join(home, "jq")).filter((n) => n.startsWith(".staging"))).toEqual([]);
  });

  it("refuses a file whose digest differs and leaves nothing installed", async () => {
    const home = tmpDir();
    const { d } = deps(home);
    await expect(ensureJq(d, { "linux/x64": { asset: "jq-linux-amd64", sha256: "0".repeat(64) } })).rejects.toThrow(/checksum mismatch for jq-linux-amd64/);
    expect(fs.existsSync(jqPath(d))).toBe(false);
    expect(fs.readdirSync(path.join(home, "jq"))).toEqual([]);
  });

  it("an empty or damaged jq folder is replaced, a zero-byte jq is not trusted, stale staging is swept", async () => {
    const home = tmpDir();
    const { d, urls } = deps(home);
    const table = { "linux/x64": { asset: "jq-linux-amd64", sha256: SHA } };
    fs.mkdirSync(path.dirname(jqPath(d)), { recursive: true });
    fs.writeFileSync(jqPath(d), "");
    const stale = path.join(home, "jq", ".staging-1-old");
    fs.mkdirSync(stale);
    fs.utimesSync(stale, new Date(0), new Date(0));
    const bin = await ensureJq(d, table);
    expect(fs.readFileSync(bin)).toEqual(BYTES);
    expect(urls).toHaveLength(1);
    expect(fs.existsSync(stale)).toBe(false);
  });

  it("an unpinned host fails before any download", async () => {
    const { d, urls } = deps(tmpDir(), { platform: "freebsd" });
    await expect(ensureJq(d)).rejects.toBeInstanceOf(ProvisionError);
    expect(urls).toEqual([]);
  });

  it("names jq.exe on Windows", () => {
    const { d } = deps(tmpDir(), { platform: "win32" });
    expect(path.basename(jqPath(d))).toBe("jq.exe");
  });

  it("`aiplus-office jq <args>` passes the arguments through; status says where jq comes from", async () => {
    const seen: string[][] = [];
    expect(await main(["jq", "-n", "1+1"], { runJq: async (a) => (seen.push(a), 0) })).toBe(0);
    expect(seen).toEqual([["-n", "1+1"]]);
    const out: string[] = [];
    await main(["status"], { stdout: (t) => out.push(t), stderr: () => {}, env: { AIPLUS_OFFICE_HOME: tmpDir() } });
    expect(out.join("")).toContain(`jq: not in the cache (the skills use a jq on PATH, else aiplus-office jq downloads ${JQ_VERSION}`);
  });
});
