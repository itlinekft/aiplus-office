/**
 * Skill lint (spec office-skills): the nine skills' frontmatter, Hungarian triggers, required sections, recipes that
 * end with `aiplus-office verify`, workflow step structure, the Hungarian worked examples, no upstream-agent residue,
 * the alpha caveat, and an offline drift check of every quoted command id against the recorded command lists.
 *
 * Structure follows the upstream package's skills.test.ts; rules rewritten for this plugin.
 * See change: office-plugin-v1 (tasks 4.1–4.4).
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_SKILL_NAMES,
  appOf,
  commandLines,
  fences,
  fixtureUnion,
  loadSkill,
  SKILL_NAMES,
  START_SKILL_NAME,
  SKILLS_DIR,
  stepSections,
  unknownIdsAgainst,
  unknownWorkflowIds,
  WORKFLOW_APPS,
  WORKFLOW_SKILL_NAMES,
} from "./helpers/skills.js";

const HU_WORDS = ["árajánlat", "díjbekérő", "árlista", "szerződés", "jelenléti ív", "prezentáció", "táblázat"];
const COMMAND_LINE = 'command -v aiplus-office >/dev/null || aiplus-office() { node "${CLAUDE_PLUGIN_ROOT}/dist/aiplus-office.mjs" "$@"; }';
const BANNED = [/anonimizált/i, /100\s?%/, /GDPR-(tanúsított|megfelelő)/i, /nem megy ki adat/i];

describe("skill set", () => {
  it("ships exactly the nine office skills, each folder with a SKILL.md", () => {
    const dirs = fs.readdirSync(SKILLS_DIR).filter((d) => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory()).sort();
    expect(dirs).toEqual([...ALL_SKILL_NAMES].sort());
    for (const name of ALL_SKILL_NAMES) expect(fs.existsSync(path.join(SKILLS_DIR, name, "SKILL.md")), name).toBe(true);
  });

  for (const name of ALL_SKILL_NAMES) {
    it(`${name}: frontmatter name equals the folder, description ≤ 1024 chars, one line`, () => {
      const s = loadSkill(name);
      expect(s.frontmatter.name).toBe(name);
      expect(s.frontmatter.description?.length ?? 0).toBeGreaterThan(80);
      expect(s.frontmatter.description.length).toBeLessThanOrEqual(1024);
      expect(Object.keys(s.frontmatter).sort()).toEqual(["description", "name"]);
    });
  }
});

describe("Hungarian triggers", () => {
  it("every skill description names at least one Hungarian office word", () => {
    for (const name of ALL_SKILL_NAMES) {
      const d = loadSkill(name).frontmatter.description;
      expect(HU_WORDS.some((w) => d.includes(w)), `${name}: ${d}`).toBe(true);
    }
  });

  it("the router names all seven Hungarian office words", () => {
    const d = loadSkill("office-router").frontmatter.description;
    for (const w of HU_WORDS) expect(d, w).toContain(w);
  });

  it("a price-list request (árlista) reaches office-gridcraft and office-data-visual", () => {
    const hits = ALL_SKILL_NAMES.filter((n) => loadSkill(n).frontmatter.description.includes("árlista"));
    expect(hits).toEqual(expect.arrayContaining(["office-gridcraft", "office-data-visual"]));
  });
});

describe("command spelling", () => {
  it("every skill shows the one command line that resolves aiplus-office through ${CLAUDE_PLUGIN_ROOT}", () => {
    for (const name of ALL_SKILL_NAMES) expect(loadSkill(name).body, name).toContain(COMMAND_LINE);
  });

  it("every skill whose code runs jq falls back to `aiplus-office jq` right under the command line (change office-install-complete)", () => {
    const JQ_LINE = 'command -v jq >/dev/null || jq() { aiplus-office jq "$@"; }';
    const users = ALL_SKILL_NAMES.filter((n) => /(^|[\s|(])jq\s/m.test(fences(loadSkill(n).body).map((f) => f.code).join("\n")));
    expect(users.length).toBeGreaterThan(0);
    for (const name of users) expect(loadSkill(name).body, name).toContain(`${COMMAND_LINE}\n${JQ_LINE}`);
  });
});

describe("router and app skills", () => {
  for (const name of SKILL_NAMES) {
    const s = loadSkill(name);
    const recipes = fences(s.body).filter((f) => f.recipe);

    it(`${name}: recipes end with aiplus-office verify (every recipe is a verified pass)`, () => {
      expect(recipes.length, name).toBeGreaterThanOrEqual(name === "office-router" ? 1 : 3);
      expect(recipes.length).toBeLessThanOrEqual(4);
      for (const r of recipes) {
        const lines = commandLines(r.code);
        expect(lines[lines.length - 1], `${name} recipe ${r.recipe}`).toMatch(/^aiplus-office verify /);
      }
    });

    if (appOf(name)) {
      it(`${name}: has the required sections`, () => {
        for (const h of ["## What it is for / formats", "## CLI dialect", "## State between invocations", "## Discovery first", "## Traps", "## Recipes"]) {
          expect(s.body, `${name} ${h}`).toContain(h);
        }
        expect(s.body).toMatch(/## MCP route/);
      });

      it(`${name}: every command id quoted in its fences exists in the recorded ${appOf(name)} command list`, () => {
        const app = appOf(name) as string;
        const { known, namespaces, versions } = fixtureUnion([app]);
        expect(unknownIdsAgainst(s.body, known, namespaces), `unknown to ${versions}`).toEqual([]);
      });
    }
  }

  it("the drift check itself catches an invented id (self-test)", () => {
    const { known, namespaces } = fixtureUnion(["wordcraft"]);
    const body = "```bash\naiplus-office wordcraft exec run --cmd para.heading1 --cmd 'text.bogusInsert={}' --save x.docx\n```\n";
    expect(unknownIdsAgainst(body, known, namespaces)).toEqual(["text.bogusInsert"]);
  });

  it("the router's quoted ids exist in the recorded lists", () => {
    const { known, namespaces } = fixtureUnion(["wordcraft", "gridcraft", "deckcraft", "pdfcraft"]);
    expect(unknownIdsAgainst(loadSkill("office-router").body, known, namespaces)).toEqual([]);
  });

  it("the router states the alpha caveat and the check-before-sending rule", () => {
    const b = loadSkill("office-router").body;
    expect(b).toMatch(/alpha/);
    expect(b).toMatch(/checked before it is sent/);
  });

  it("the router names the four confined MCP servers and GridCraft's gateway (change office-mcp-grid-deck)", () => {
    const b = loadSkill("office-router").body;
    for (const app of ["wordcraft", "gridcraft", "deckcraft", "pdfcraft"]) expect(b).toContain(`aiplus-office-${app}`);
    expect(b).toMatch(/GridCraft's own server has no confinement/);
    expect(b).not.toMatch(/not registered as MCP servers/);
  });
});

describe("workflow skills", () => {
  for (const name of WORKFLOW_SKILL_NAMES) {
    const s = loadSkill(name);
    const steps = stepSections(s.body);

    it(`${name}: a step table, steps 0..N each with Output and Gate, Resume and failure sections`, () => {
      expect(s.body).toContain("## Step table");
      expect(steps.map((x) => x.n)).toEqual(steps.map((_, i) => i));
      expect(steps.length).toBeGreaterThanOrEqual(3);
      for (const st of steps) {
        expect(st.text, `${name} step ${st.n}`).toMatch(/\*\*Output:\*\*/);
        expect(st.text, `${name} step ${st.n}`).toMatch(/\*\*Gate:\*\*/);
      }
      expect(s.body).toContain("## Resume");
      expect(s.body).toContain("## When a gate fails");
      expect(s.body).toMatch(/At most 2 retries/);
    });

    it(`${name}: every artefact step after the preflight has a verify call or a check: gate`, () => {
      for (const st of steps.filter((x) => x.n > 0)) {
        const code = st.fences.map((f) => f.code).join("\n");
        const info = st.fences.map((f) => f.info).join("\n");
        expect(/aiplus-office verify /.test(code) || /check:/.test(info), `${name} step ${st.n}`).toBe(true);
      }
    });

    it(`${name}: one Hungarian worked example, a recipe that ends with aiplus-office verify`, () => {
      expect(s.body).toMatch(/## Worked example \(Hungarian\)/);
      const recipes = fences(s.body).filter((f) => f.recipe);
      expect(recipes).toHaveLength(1);
      const lines = commandLines(recipes[0].code);
      expect(lines[lines.length - 1]).toMatch(/^aiplus-office verify /);
    });

    it(`${name}: quoted ids exist in the union of ${WORKFLOW_APPS[name].join("+")}`, () => {
      expect(unknownWorkflowIds(s.body, WORKFLOW_APPS[name])).toEqual([]);
    });
  }

  it("office-doc-publish's example is an árajánlat from Markdown with frontmatter", () => {
    const code = fences(loadSkill("office-doc-publish").body).find((f) => f.recipe)?.code ?? "";
    expect(code).toMatch(/^---\ntemplate: arajanlat\nlanguage: hu/m);
    expect(code).toContain("aiplus-office doc prepare");
    expect(code).toContain("Árajánlat");
  });

  it("office-data-visual's example is an árlista with a 27% VAT formula column and SUM totals", () => {
    const code = fences(loadSkill("office-data-visual").body).find((f) => f.recipe)?.code ?? "";
    expect(code).toMatch(/=B\d\*0\.27/);
    expect(code).toMatch(/=SUM\(D2:D\d\)/);
    expect(code).toContain("ÁFA 27%");
    expect(code).toContain("Bruttó");
  });

  it("office-deck's example is a Hungarian deck of three slides", () => {
    const code = fences(loadSkill("office-deck").body).find((f) => f.recipe)?.code ?? "";
    expect((code.match(/slide\.new=/g) ?? []).length).toBe(3);
    expect(code).toContain("--pages 3");
  });

  it("the check: snippets run against good and bad inputs", () => {
    const run = (code: string, cwd: string) => spawnSync("bash", ["-e", "-c", code], { cwd, encoding: "utf8" });
    const tmp = fs.mkdtempSync(path.join(process.env.HOME as string, "chk-"));
    const outline = fences(loadSkill("office-deck").body).find((f) => /check:\s*outline/.test(f.info))?.code ?? "";
    fs.writeFileSync(path.join(tmp, "vazlat.md"), "# Cím\n\n## Első\n- a\n");
    expect(run(outline, tmp).status).toBe(0);
    fs.writeFileSync(path.join(tmp, "vazlat.md"), "nincs cím\n");
    expect(run(outline, tmp).status).not.toBe(0);
    const prepare = fences(loadSkill("office-doc-publish").body).find((f) => /check:\s*prepare/.test(f.info))?.code ?? "";
    const ok = { unresolved: [], mermaid: { unrendered: 0 }, images: { skipped: [], remote: [] }, defaulted: [] };
    fs.writeFileSync(path.join(tmp, "prepare.json"), JSON.stringify(ok));
    expect(run(prepare, tmp).status).toBe(0);
    fs.writeFileSync(path.join(tmp, "prepare.json"), JSON.stringify({ ...ok, defaulted: ["ugyfel_nev"] }));
    expect(run(prepare, tmp).status).not.toBe(0);
    expect(run(`DEFAULTS_CONFIRMED=1\n${prepare.replace("${DEFAULTS_CONFIRMED:-0}", "1")}`, tmp).status).toBe(0);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe("bilingual triggers (change office-first-run)", () => {
  it("every skill description carries English trigger phrases and Hungarian trigger words", () => {
    for (const name of ALL_SKILL_NAMES) {
      const d = loadSkill(name).frontmatter.description;
      expect(d, name).toMatch(/"[A-Za-z][^"]{5,}"/);
      expect(d, name).toMatch(/Hungarian/);
      expect(d, name).toMatch(/[áéíóöőúüű]/);
    }
  });

  it("no skill description claims another product is not needed", () => {
    for (const name of ALL_SKILL_NAMES) expect(loadSkill(name).frontmatter.description, name).not.toMatch(/no \w+( \w+)? needed|nélkül/i);
  });
});

describe("office-start (change office-first-run)", () => {
  const s = loadSkill(START_SKILL_NAME);
  const count = (re: RegExp) => (s.body.match(re) ?? []).length;

  it("triggers on the Hungarian first-run phrases and the English ones", () => {
    for (const w of ["első indítás", "telepítés", "hogyan kezdjem", "mi kell hozzá", "how do I start", "what does it need"]) {
      expect(s.frontmatter.description, w).toContain(w);
    }
  });

  it("checks Node.js and runs status through the command line, and offers install --all only after a yes", () => {
    const code = fences(s.body).map((f) => f.code).join("\n");
    expect(code).toContain("node --version");
    expect(code).toMatch(/^aiplus-office status$/m);
    expect(code).toMatch(/^aiplus-office install --all$/m);
    expect(s.body).toMatch(/never run `install` without a yes/);
    expect(s.body).toMatch(/Without a shell|no tool that runs commands/i);
  });

  it("says where the apps come from, in both languages", () => {
    for (const t of ["github.com/storytold/<program>", "SHA256SUMS.txt", "%LOCALAPPDATA%\\aiplus-office", "~/Library/Caches/aiplus-office", "~/.cache/aiplus-office"]) {
      expect(count(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")), t).toBeGreaterThanOrEqual(2);
    }
    expect(s.body).toContain("rendszergazdai jog nem");
    expect(s.body).toContain("no administrator");
  });

  it("says plainly that a plain Chat does all four in the „AI+ Iroda” folder, in both languages (office-chat-folder)", () => {
    expect(s.body).toMatch(/\*\*A sima Chatben is megy mind a négy\*\*/);
    expect(s.body).toMatch(/\*\*All four work in a plain Chat too\*\*/);
    expect(s.body).toMatch(/Dokumentumok mappán belüli \*\*„AI\+ Iroda”\*\*\s+mappához/);
    expect(s.body).toMatch(/\*\*„AI\+ Iroda”\*\* folder in your Documents/);
    expect(s.body).not.toMatch(/csak Word és PDF|Word and PDF only/);
    expect(s.body).toMatch(/A felhőben futó munkamenet nem tudja letölteni a programokat/);
    expect(s.body).toMatch(/session running in the cloud cannot download the programs/);
    expect(s.body).not.toMatch(/Cowork vagy|Cowork or/);
  });

  it("keeps what has been tried in exactly one marked block, cloud Cowork measured as not working (office-windows-local)", () => {
    expect(count(/office-start:tested/g)).toBe(1);
    expect(count(/Cowork a felhőben: nem működik/g)).toBe(1);
    expect(count(/Cowork in the cloud: does not work/g)).toBe(1);
    const block = s.body.slice(s.body.indexOf("office-start:tested"), s.body.indexOf("## 7."));
    for (const t of ["Cowork a felhőben: nem működik", "Cowork in the cloud: does not work", "„This computer” munkamenet", "“This computer” session", "macOS", "sima Chat", "plain Chat", "2026. október 26.", "26 October 2026"]) expect(block, t).toContain(t);
  });

  it("offers an app already installed on the computer, plainly (office-windows-local)", () => {
    expect(s.body).toContain("AIPLUS_OFFICE_<APP>_BIN");
    expect(s.body).toContain("AIPLUS_OFFICE_GRIDCRAFT_BIN");
    expect(count(/C:\\Program Files\\GridCraft\\gridcraft-cli\.exe/g)).toBeGreaterThanOrEqual(2);
    expect(s.body).toContain("Használjam ezt?");
    expect(s.body).toContain("Shall I use it?");
  });

  it("points to the four desktop apps' official download pages and says the plugin does not install them", () => {
    for (const app of ["wordcraft", "gridcraft", "deckcraft", "pdfcraft"]) expect(s.body).toContain(`https://github.com/storytold/${app}/releases/latest`);
    expect(s.body).toContain("windows-x64.msi");
    expect(s.body).toContain("windows-x64-portable.zip");
    expect(s.body).toContain("macos-universal.dmg");
    expect(s.body).toMatch(/does not install their desktop \(window\) apps/);
  });

  it("every user-facing block has a Hungarian and an English wording", () => {
    expect(count(/^> \*\*HU/gm)).toBeGreaterThanOrEqual(6);
    expect(count(/^> \*\*HU/gm)).toBe(count(/^> \*\*EN/gm));
    expect(s.body).toMatch(/Answer in the user's language/);
  });

  it("names the three Hungarian limits once, in Hungarian and English (change office-hungarian-guards)", () => {
    const block = s.body.slice(s.body.indexOf("## 7. Good to know"), s.body.indexOf("## 8."));
    for (const t of ["ő és ű", "„1 330,50”", "magyar helyesírást", "ő and ű", "Hungarian number typed as text", "Hungarian spelling"]) expect(block, t).toContain(t);
  });

  it("the router sends a first-time user to office-start", () => {
    const r = loadSkill("office-router");
    expect(r.frontmatter.description).toContain("office-start");
    expect(r.body).toMatch(/## First run → `office-start`/);
  });
});

describe("Hungarian guards in the skills (change office-hungarian-guards)", () => {
  it("office-gridcraft: numbers as numbers, ISO dates, no Hungarian CSV straight in, --hu-numbers, the ő/ű route with --hu-glyphs", () => {
    const b = loadSkill("office-gridcraft").body;
    expect(b).toContain("## Hungarian numbers, dates and the letters ő/ű");
    for (const t of ["Write numbers as numbers", "Dates as ISO", "A Hungarian CSV never goes straight in", "--hu-numbers", "--hu-glyphs", "make the PDF through WordCraft"]) expect(b, t).toContain(t);
    const recipe = fences(b).find((f) => f.recipe === "afa-tabla-pdf")?.code ?? "";
    expect(recipe).toContain("Tűzőgép");
    expect(recipe).toMatch(/verify afa\.xlsx --hu-numbers/);
    expect(recipe).toMatch(/--hu-glyphs afa\.xlsx/);
    expect(recipe).not.toMatch(/gridcraft exec run --in afa\.xlsx --out afa\.pdf/);
  });

  it("office-data-visual: --hu-numbers in step 1, route B (WordCraft PDF, DeckCraft chart) on ő/ű, --hu-glyphs on every PDF", () => {
    const b = loadSkill("office-data-visual").body;
    expect(b).toMatch(/\*\*Route B\*\*/);
    expect(b).toContain("insert.chart=");
    expect(b).toContain("wordcraft exec run --file");
    const pdfVerifies = [...b.matchAll(/aiplus-office verify \S*arlista\.pdf[^\n]*/g)].map((m) => m[0]);
    expect(pdfVerifies.length).toBeGreaterThanOrEqual(3);
    for (const v of pdfVerifies) expect(v, v).toContain("--hu-glyphs");
    expect(b).toMatch(/verify \S*arlista\.xlsx --hu-numbers/);
  });

  it("office-wordcraft: says there is no Hungarian spell check and that Claude proofreads", () => {
    const b = loadSkill("office-wordcraft").body;
    expect(b).toContain("No Hungarian spell check");
    expect(b).toContain("Proofread Hungarian text yourself");
    expect(b).toContain("A WordCraft nem ellenőrzi a magyar helyesírást");
  });
});

describe("no residue and no banned claims", () => {
  it("no upstream-agent, dashboard or non-office app references to run", () => {
    for (const name of ALL_SKILL_NAMES) {
      const text = loadSkill(name).text;
      for (const bad of [/\bpi[- ](craft|install)\b/, /\.p[i]\//, /nano-banana/i, /photocraft/i, /vectorcraft/i, /designcraft/i, /filmcraft/i, /soundcraft/i, /pi install/, /dashboard/i]) {
        expect(text, `${name} ${bad}`).not.toMatch(bad);
      }
    }
  });

  it("no banned claims and no real company suffix outside Minta/invented names", () => {
    for (const name of ALL_SKILL_NAMES) {
      const text = loadSkill(name).text;
      for (const b of BANNED) expect(text, `${name} ${b}`).not.toMatch(b);
      for (const m of text.matchAll(/([A-ZÁÉÍÓÖŐÚÜŰ][\wáéíóöőúüű]*(?: [A-ZÁÉÍÓÖŐÚÜŰ][\wáéíóöőúüű]*)*) Kft\./g)) {
        expect(m[1], `${name}: company name must be an invented "Minta …"`).toMatch(/^Minta/);
      }
    }
  });
});

describe("honest fallback (change office-honest-fallback)", () => {
  const router = loadSkill("office-router");
  const APP_SKILLS = ["office-wordcraft", "office-gridcraft", "office-deckcraft", "office-pdfcraft"];

  it("the router says to stop, say why in both languages and go to office-start when the module cannot run", () => {
    expect(router.body).toContain("## When the module cannot run: stop and say so");
    expect(router.body).toMatch(/Do not make the requested file another way/);
    expect(router.body).toMatch(/\*\*HU:\*\* Az AI\+ Iroda most nem tud elindulni/);
    expect(router.body).toMatch(/\*\*EN:\*\* AI\+ Iroda cannot start/);
    expect(router.body).toMatch(/Continue with `office-start`/);
    expect(router.body).toMatch(/\*\*not\*\*\s+made with AI\+ Iroda/);
  });

  for (const name of APP_SKILLS) {
    it(`${name}: points to the router's section right after the command line`, () => {
      const body = loadSkill(name).body;
      const at = body.indexOf(COMMAND_LINE);
      expect(at).toBeGreaterThan(-1);
      expect(body.slice(at, at + 600)).toContain("„When the module cannot run”");
    });
  }

  it("no skill runs python; the router names the module's own checks", () => {
    for (const name of ALL_SKILL_NAMES) {
      const code = fences(loadSkill(name).body).map((f) => f.code).join("\n");
      expect(/\bpython3?\b/.test(code), name).toBe(false);
    }
    expect(router.body).toMatch(/\*\*Never `python`\*\*/);
    expect(router.body).toMatch(/gridcraft exec eval/);
  });

  it("an earlier result is never overwritten: a change writes a new file", () => {
    expect(router.body).toMatch(/a result you made earlier in the session included/);
    expect(router.body).toMatch(/\*\*new file\*\*/);
    expect(loadSkill("office-pdfcraft").body).toMatch(/A changed PDF is a new file/);
  });

  it("office-start finds Node.js installed but not seen, and explains the cached Reconnect, in both languages", () => {
    const s = loadSkill(START_SKILL_NAME).body;
    expect(s).toContain('"/c/Program Files/nodejs/node.exe"');
    expect(s).toMatch(/\*\*HU:\*\* A Node\.js már telepítve van, de a Claude még előtte indult/);
    expect(s).toMatch(/\*\*EN:\*\* Node\.js is installed, but Claude started before it/);
    expect(s).toMatch(/\*\*HU:\*\* A Claude 15 percig megjegyzi/);
    expect(s).toMatch(/\*\*EN:\*\* Claude remembers a connector that failed to start for 15 minutes/);
  });
});

describe("Claude Desktop's own download, said truly (change office-desktop-truth)", () => {
  const start = loadSkill("office-start");
  const router = loadSkill("office-router");

  it("office-start says Claude Desktop downloads the apps by itself and never claims to ask first", () => {
    expect(start.body).toContain("**Claude Desktop downloads the apps by itself.**");
    expect(start.body).toMatch(/never starts a download itself without a yes/);
    expect(start.body).not.toMatch(/asks before downloading anything/);
    expect(router.body).not.toMatch(/asks before downloading/);
  });

  it("office-start explains the already-downloaded case in both languages and names the desktop cache", () => {
    expect(start.body).toMatch(/\*\*HU:\*\* A négy program már le van töltve: a Claude Desktop a modul első indításakor/);
    expect(start.body).toMatch(/\*\*EN:\*\* The four programs are already downloaded: Claude Desktop fetched them/);
    expect(start.body).toContain("| `desktop cache: <folder>` |");
    expect(start.body).toContain("Packages\\Claude_…\\LocalCache\\Local\\aiplus-office");
  });

  it("the office-start description no longer says a plain Chat does Word and PDF only", () => {
    expect(start.frontmatter.description).not.toMatch(/Word and PDF only/);
    expect(start.frontmatter.description).toMatch(/plain Chat in Claude Desktop: all four file types/);
  });
});
