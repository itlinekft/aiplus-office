import { describe, expect, it } from "vitest";
import { APP_IDS, binName, CRAFT_APPS, desktopName, envPrefix, getApp, hostKey, isAppId, UnknownAppError } from "../registry.js";

/**
 * Upstream probe 0.4 (latest releases): which MCP servers advertise path confinement.
 * PdfCraft confines through a single `--root`; GridCraft and DeckCraft advertise none.
 */
const CONFINED = ["wordcraft", "pdfcraft"];
const LARGE = ["pdfcraft"];

describe("registry", () => {
  it("lists exactly the four office apps with unique ids", () => {
    expect(CRAFT_APPS).toHaveLength(4);
    expect(CRAFT_APPS.map((a) => a.id)).toEqual(["wordcraft", "gridcraft", "deckcraft", "pdfcraft"]);
    expect(CRAFT_APPS.map((a) => a.id)).toEqual([...APP_IDS]);
  });

  it("maps every app to storytold/<id> and <id>-cli", () => {
    for (const a of CRAFT_APPS) {
      expect(a.repo).toBe(`storytold/${a.id}`);
      expect(a.cli).toBe(`${a.id}-cli`);
      expect(binName(a, "win32")).toBe(`${a.id}-cli.exe`);
      expect(binName(a, "linux")).toBe(a.cli);
      expect(desktopName(a, "darwin")).toBe(a.id);
      expect(envPrefix(a)).toBe(`AIPLUS_OFFICE_${a.id.toUpperCase()}`);
    }
  });

  it("has release assets for every supported host", () => {
    for (const a of CRAFT_APPS) {
      for (const host of ["darwin/x64", "darwin/arm64", "linux/x64", "linux/arm64", "win32/x64", "freebsd/x64"] as const) {
        expect(a.assets[host]?.length, `${a.id} ${host}`).toBeGreaterThan(0);
      }
      for (const patterns of Object.values(a.assets)) for (const p of patterns ?? []) expect(p).toContain("{v}");
    }
  });

  it("uses the CLI zip on macOS and prefers a CLI-only tarball on Linux", () => {
    const pdf = getApp("pdfcraft");
    expect(pdf.assets["darwin/arm64"]).toEqual(["pdfcraft-cli-{v}-macos-universal.zip"]);
    expect(pdf.assets["linux/x64"]).toEqual(["pdfcraft-cli-{v}-linux-x86_64.tar.gz", "pdfcraft-{v}-linux-x86_64.tar.gz"]);
    expect(getApp("gridcraft").assets["win32/x64"]).toEqual(["gridcraft-{v}-windows-x64-portable.zip"]);
  });

  it("flags confinement and tool class exactly as probed", () => {
    for (const a of CRAFT_APPS) {
      expect(a.mcp.confinement !== false, a.id).toBe(CONFINED.includes(a.id));
      expect(a.mcp.toolClass, a.id).toBe(LARGE.includes(a.id) ? "large" : "small");
      expect(a.mcp.tools).toBeGreaterThan(a.mcp.toolClass === "large" ? 100 : 0);
    }
    expect(getApp("pdfcraft").mcp.bridgeFlag).toBeUndefined();
    expect(getApp("pdfcraft").mcp.confinement).toBe("root");
    expect(getApp("wordcraft").mcp.confinement).toBe("automation-roots");
    expect(getApp("gridcraft").mcp.confinement).toBe(false);
    expect(getApp("deckcraft").mcp.confinement).toBe(false);
  });

  it("the large app offers --compact; no small app does", () => {
    for (const a of CRAFT_APPS) expect(a.mcp.compactFlag === "--compact", a.id).toBe(a.mcp.toolClass === "large");
  });

  it("every app has a discovery dialect and a glibc floor", () => {
    for (const a of CRAFT_APPS) {
      expect(a.dialect.list.length).toBeGreaterThan(0);
      expect(a.glibcMin[0]).toBeGreaterThanOrEqual(2);
    }
    expect(getApp("pdfcraft").dialect.list).toEqual(["tools"]);
  });

  it("rejects an unknown app id listing the supported ids", () => {
    expect(isAppId("paintcraft")).toBe(false);
    expect(isAppId("photocraft")).toBe(false); // a real ArtCraft app, but not an office app
    expect(() => getApp("paintcraft")).toThrow(UnknownAppError);
    try {
      getApp("paintcraft");
    } catch (e) {
      for (const id of APP_IDS) expect((e as Error).message).toContain(id);
    }
  });

  it("hostKey maps only known hosts", () => {
    expect(hostKey("linux", "arm64")).toBe("linux/arm64");
    expect(hostKey("sunos", "x64")).toBeUndefined();
  });
});
