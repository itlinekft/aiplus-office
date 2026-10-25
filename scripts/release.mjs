#!/usr/bin/env node
/**
 * Build the distributable aiplus-office plugin from a COMMIT through an allow-list, and optionally stage it into a local
 * clone of the AI+ marketplace.
 *
 *   node scripts/release.mjs [--ref <commit>] [--out <dir>] [--stage <marketplace-clone>] [--no-leakscan] [--no-validate]
 *
 * - Every file is read with `git show <sha>:<path>` (binary-safe): the working tree is never shipped.
 * - Allow-list: .claude-plugin/plugin.json, .mcp.json, dist/aiplus-office.mjs, skills/**, LICENSE, and the public
 *   release/README.md → README.md and release/NOTICE → NOTICE (the repo NOTICE names the upstream repository; the
 *   public one carries the MIT attribution in a shorter form). Nothing else (no src/, tests, openspec/, docs/).
 * - One version source: package.json; plugin.json, the dev marketplace.json entry, the CLI's VERSION and the first
 *   `## <version>` of CHANGELOG.md must equal it (all read at the commit).
 * - `--stage <dir>` replaces <dir>/plugins/aiplus-office/, adds or updates only the `aiplus-office` entry of
 *   <dir>/.claude-plugin/marketplace.json (description = plugin.json's, read at the commit) and its README row, adds those paths to the clone's index, runs
 *   `set-leakscan --staged` and `--tree` (refuses on any finding and un-stages), then `claude plugin validate <dir>`.
 *   It never commits and never pushes.
 *
 * Pure Node + git: runs on Linux, macOS and Windows. Exit: 0 ok · 1 refused (drift, leak, validation) · 2 usage.
 * See change: office-release-marketplace.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const PLUGIN = "aiplus-office";
const README_ROW = `| \`${PLUGIN}\` | Ingyenes irodai AI+ modul · free office AI+ module | irodai skillek és az \`aiplus-office\` parancs, a WordCraft, GridCraft, DeckCraft és PdfCraft programokat első használatkor maga tölti le; Excel- és PowerPoint-fájlhoz a Claude-nak a saját gépeden kell futnia (Claude Code vagy „This computer” munkamenet) · office skills and the \`aiplus-office\` command, downloads the four apps itself on first use; Excel and PowerPoint files need Claude on your own computer (Claude Code or a “This computer” session) |`;

const ALLOW = [
  { from: ".claude-plugin/plugin.json" },
  { from: ".mcp.json" },
  { from: "dist/aiplus-office.mjs" },
  { from: "LICENSE" },
  { from: "release/NOTICE", to: "NOTICE" },
  { from: "release/README.md", to: "README.md" },
  { prefix: "skills/" },
];

class Refuse extends Error {}

function git(repo, args, opts = {}) {
  const r = spawnSync("git", ["-C", repo, ...args], { encoding: opts.buffer ? "buffer" : "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Refuse(`git ${args.join(" ")} failed: ${String(r.stderr).trim()}`);
  return r.stdout;
}

/** Files the allow-list selects at `sha`: [{ from, to }]. */
export function selectFiles(tracked) {
  const out = [];
  for (const rule of ALLOW) {
    if (rule.prefix) for (const f of tracked) if (f.startsWith(rule.prefix)) out.push({ from: f, to: f });
    if (rule.from) {
      if (!tracked.includes(rule.from)) throw new Refuse(`allow-listed file missing at the commit: ${rule.from}`);
      out.push({ from: rule.from, to: rule.to ?? rule.from });
    }
  }
  return out;
}

/** Version sources read at the commit; throws on any mismatch. */
export function checkVersions(show) {
  const v = JSON.parse(show("package.json")).version;
  const found = {
    "package.json": v,
    ".claude-plugin/plugin.json": JSON.parse(show(".claude-plugin/plugin.json")).version,
    ".claude-plugin/marketplace.json": JSON.parse(show(".claude-plugin/marketplace.json")).plugins?.find((p) => p.name === PLUGIN)?.version,
    "src/bin/aiplus-office.ts VERSION": /export const VERSION = "([^"]+)"/.exec(show("src/bin/aiplus-office.ts"))?.[1],
    "CHANGELOG.md head": /^## (\S+)/m.exec(show("CHANGELOG.md"))?.[1],
  };
  const bad = Object.entries(found).filter(([, x]) => x !== v);
  if (bad.length) throw new Refuse(`version drift (package.json ${v}): ${bad.map(([k, x]) => `${k} = ${x ?? "missing"}`).join(", ")}`);
  return v;
}

export function build({ repo, ref = "HEAD", out }) {
  const sha = git(repo, ["rev-parse", "--verify", `${ref}^{commit}`]).trim();
  const tracked = git(repo, ["ls-tree", "-r", "--name-only", sha]).split("\n").filter(Boolean);
  const show = (p) => git(repo, ["show", `${sha}:${p}`]);
  const version = checkVersions(show);
  // The marketplace entry carries plugin.json's own (Hungarian + English) description: one source, no copy here.
  const description = JSON.parse(show(".claude-plugin/plugin.json")).description;
  if (typeof description !== "string" || !description.trim()) throw new Refuse("plugin.json has no description");
  const files = selectFiles(tracked);
  fs.rmSync(out, { recursive: true, force: true });
  const sums = [];
  for (const f of files) {
    const data = git(repo, ["show", `${sha}:${f.from}`], { buffer: true });
    const dest = path.join(out, ...f.to.split("/"));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, data);
    sums.push(`${createHash("sha256").update(data).digest("hex")}  ${f.to}`);
  }
  // The shipped bundle must report the same version (the packaging test also checks it equals a fresh build).
  const r = spawnSync(process.execPath, [path.join(out, "dist", "aiplus-office.mjs"), "--version"], { encoding: "utf8" });
  if (r.stdout.trim() !== `aiplus-office ${version}`) throw new Refuse(`bundle reports "${r.stdout.trim()}", expected aiplus-office ${version}`);
  return { sha, version, description, files: files.map((f) => f.to), sums };
}

/** Add or update the plugin's entry; every other entry keeps its content and position. */
export function updateMarketplace(text, version, description) {
  const m = JSON.parse(text);
  if (!Array.isArray(m.plugins)) throw new Refuse("marketplace.json has no plugins array");
  const entry = { name: PLUGIN, source: `./plugins/${PLUGIN}`, version, description };
  const i = m.plugins.findIndex((p) => p.name === PLUGIN);
  if (i >= 0) m.plugins[i] = entry;
  else m.plugins.push(entry);
  return `${JSON.stringify(m, null, 2)}\n`;
}

/** The marketplace README sentence that has to stay true for both plugins (the engine-backed `aiplus` and this one). */
export const ENGINE_SENTENCE_OLD = /A plugin here is only the Claude-side half\. It works with its product's engine, which its own installer puts on the\s+computer\./;
export const ENGINE_SENTENCE_NEW =
  "The `aiplus` plugin is the Claude-side half of its product: it works with the product's engine, which its own installer\nputs on the computer. `aiplus-office` needs no installer: it downloads the ArtCraft apps itself on first use.";

/** Add the plugin's README row once, right after the last row of the first plugin table. */
export function updateReadme(input) {
  const text = input.replace(ENGINE_SENTENCE_OLD, ENGINE_SENTENCE_NEW);
  const lines = text.split("\n");
  const existing = lines.findIndex((l) => l.startsWith(`| \`${PLUGIN}\` |`));
  if (existing >= 0) {
    lines[existing] = README_ROW;
    return lines.join("\n");
  }
  const header = lines.findIndex((l) => /^\|\s*Plugin\s*\|/.test(l));
  if (header < 0) return text;
  let last = header + 1;
  while (last + 1 < lines.length && lines[last + 1].startsWith("|")) last++;
  lines.splice(last + 1, 0, README_ROW);
  return lines.join("\n");
}

export function stage({ built, staging, dir, leakscan = "set-leakscan", runLeakscan = true, validate = true, log = console.log }) {
  const mpFile = path.join(dir, ".claude-plugin", "marketplace.json");
  if (!fs.existsSync(mpFile)) throw new Refuse(`${mpFile} not found: --stage needs a clone of the marketplace`);
  const target = path.join(dir, "plugins", PLUGIN);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(staging, target, { recursive: true });
  fs.writeFileSync(mpFile, updateMarketplace(fs.readFileSync(mpFile, "utf8"), built.version, built.description));
  const readme = path.join(dir, "README.md");
  if (fs.existsSync(readme)) fs.writeFileSync(readme, updateReadme(fs.readFileSync(readme, "utf8")));
  const paths = [`plugins/${PLUGIN}`, ".claude-plugin/marketplace.json", "README.md"];
  git(dir, ["add", "--", ...paths]);
  const unstage = () => spawnSync("git", ["-C", dir, "reset", "-q", "--", ...paths]);

  if (runLeakscan) {
    for (const mode of [["--staged"], ["--tree"]]) {
      const r = spawnSync(leakscan, mode, { cwd: dir, encoding: "utf8" });
      if (r.error && r.error.code === "ENOENT") {
        unstage();
        throw new Refuse(`${leakscan} is not installed: cannot scan the staged tree (pass --no-leakscan to skip, knowingly)`);
      }
      log(`[release] ${leakscan} ${mode.join(" ")} → exit ${r.status}\n${(r.stdout + r.stderr).trim()}`);
      if (r.status !== 0) {
        unstage();
        throw new Refuse(`${leakscan} ${mode.join(" ")} refused the staged tree (exit ${r.status}); staged paths removed from the index`);
      }
    }
  } else log("[release] leak scan skipped (--no-leakscan)");

  if (validate) {
    const v = spawnSync("claude", ["plugin", "validate", dir], { encoding: "utf8" });
    if (v.error && v.error.code === "ENOENT") log("[release] `claude` not found: plugin validate skipped");
    else {
      log(`[release] claude plugin validate → exit ${v.status}\n${(v.stdout + v.stderr).trim()}`);
      if (v.status !== 0) {
        unstage();
        throw new Refuse("claude plugin validate failed");
      }
    }
  }
  return paths;
}

function parse(argv) {
  const o = { ref: "HEAD", out: undefined, stage: undefined, leakscan: true, validate: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--ref") o.ref = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--stage") o.stage = argv[++i];
    else if (a === "--no-leakscan") o.leakscan = false;
    else if (a === "--no-validate") o.validate = false;
    else throw Object.assign(new Error(`unknown argument ${a}`), { usage: true });
    if (argv[i] === undefined) throw Object.assign(new Error(`${a} needs a value`), { usage: true });
  }
  return o;
}

function main() {
  const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  let o;
  try {
    o = parse(process.argv.slice(2));
  } catch (e) {
    console.error(`release: ${e.message}\nusage: node scripts/release.mjs [--ref <commit>] [--out <dir>] [--stage <marketplace-clone>] [--no-leakscan] [--no-validate]`);
    return 2;
  }
  const out = path.resolve(o.out ?? path.join(repo, ".release", PLUGIN));
  try {
    const built = build({ repo, ref: o.ref, out });
    console.log(`[release] ${PLUGIN} ${built.version} from ${built.sha} → ${out}`);
    for (const s of built.sums) console.log(`  ${s}`);
    if (o.stage) {
      const paths = stage({ built, staging: out, dir: path.resolve(o.stage), runLeakscan: o.leakscan, validate: o.validate });
      console.log(`[release] staged into ${path.resolve(o.stage)} (index: ${paths.join(", ")}); not committed, not pushed`);
    }
    return 0;
  } catch (e) {
    if (e instanceof Refuse) {
      console.error(`release: refused: ${e.message}`);
      return 1;
    }
    throw e;
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) process.exit(main());
