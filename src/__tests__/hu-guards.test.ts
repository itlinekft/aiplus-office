/**
 * Hungarian guards (change office-hungarian-guards): the number/date recogniser, formula ranges, the XLSX scan (on real
 * GridCraft files from ITLine's test T7 and on synthetic workbooks), ő/ű word collection and the PDF comparison.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { formulaRanges, huKind, huWords, huWordsFrom, missingWords, scanHuNumbers, sourceText } from "../hu-guards.js";
import { tmpDir } from "./helpers/fixtures.js";
import { REPO_ROOT } from "./helpers/paths.js";

const FIX = path.join(REPO_ROOT, "src", "__tests__", "fixtures", "hu");
const enc = (s: string) => new TextEncoder().encode(s);

/** A minimal XLSX: one sheet "Lap1" whose cells are given as raw `<c>` XML. */
function xlsx(cellsXml: string, sst: string[] = []): Uint8Array {
  return zipSync({
    "[Content_Types].xml": enc("<Types/>"),
    "xl/workbook.xml": enc('<workbook xmlns:r="r"><sheets><sheet name="Lap1" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    "xl/_rels/workbook.xml.rels": enc('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
    "xl/worksheets/sheet1.xml": enc(`<worksheet><sheetData><row r="1">${cellsXml}</row></sheetData></worksheet>`),
    "xl/sharedStrings.xml": enc(`<sst>${sst.map((t) => `<si><t>${t}</t></si>`).join("")}</sst>`),
  });
}

describe("huKind", () => {
  it("recognises Hungarian-format numbers, dates, forint text and plain digits", () => {
    const cases: [string, ReturnType<typeof huKind>][] = [
      ["1 330,50", "number"], ["12 000", "number"], ["1 330,50", "number"], ["1330,5", "number"], ["1.330,50", "number"],
      ["1.330.000", "number"], ["-2 500", "number"], ["12 000 Ft", "number"], ["45000 Ft", "number"], ["27,5 %", "number"],
      ["2026.10.31.", "date"], ["2026. 10. 31.", "date"], ["31.10.2026", "date"], ["2026. október 31.", "date"],
      ["45000", "digits"], ["1051", "digits"],
      ["Tűzőgép", null], ["", null], ["A-12", null], ["1.5", "digits"], ["12 db", null], ["Ft", null],
    ];
    for (const [s, k] of cases) expect(huKind(s), s).toBe(k);
  });
});

describe("formulaRanges", () => {
  it("reads ranges, single cells, sheet-qualified and whole-column references; skips strings and function names", () => {
    const r = formulaRanges('SUM(C2:C4)+B7+\'Tör zs\'!$A$1:$B$3+LOG10(2)+Lap2!D:D&"X9"', "Lap1");
    expect(r).toEqual([
      { sheet: "Lap1", c1: 3, r1: 2, c2: 3, r2: 4 },
      { sheet: "Lap1", c1: 2, r1: 7, c2: 2, r2: 7 },
      { sheet: "Tör zs", c1: 1, r1: 1, c2: 2, r2: 3 },
      { sheet: "Lap2", c1: 4, r1: 1, c2: 4, r2: 1_048_576 },
    ]);
  });
});

describe("scanHuNumbers", () => {
  it("T7 (real GridCraft file from a Hungarian CSV + SUM): lists the text numbers and dates", () => {
    const cells = scanHuNumbers(fs.readFileSync(path.join(FIX, "t7-hu-csv.xlsx")));
    expect(cells.map((c) => `${c.cell} ${c.text} ${c.reason}`).sort()).toEqual([
      "B2 2026.10.31. number column",
      "B4 31.10.2026 number column",
      "C3 1 330,50 formula range",
      "C4 1.330,50 formula range",
    ]);
  });

  it("the same data written as numbers and ISO dates with a number format: nothing", () => {
    expect(scanHuNumbers(fs.readFileSync(path.join(FIX, "t7-numbers.xlsx")))).toEqual([]);
  });

  it("inline strings, digits only inside a formula range, a column of such cells, and IDs left alone", () => {
    const book = xlsx(
      '<c r="A1" t="inlineStr"><is><t>45000</t></is></c><c r="A2" t="s"><v>0</v></c><c r="A3"><f>SUM(A1:A2)</f><v>0</v></c>' +
        '<c r="B1" t="s"><v>1</v></c><c r="B2" t="s"><v>2</v></c>' +
        '<c r="D1" t="s"><v>3</v></c><c r="D2" t="s"><v>4</v></c>' +
        '<c r="E1" t="s"><v>5</v></c>',
      ["1 330,50", "1 200 Ft", "2026.10.31.", "1051", "1052", "Tűzőgép"],
    );
    const got = scanHuNumbers(book).map((c) => `${c.cell} ${c.kind} ${c.reason}`).sort();
    expect(got).toEqual(["A1 digits formula range", "A2 number formula range", "B1 number column of such cells", "B2 date column of such cells"]);
  });

  it("throws on a file that is not a workbook", () => {
    expect(() => scanHuNumbers(enc("%PDF-1.4"))).toThrow(/not an XLSX/);
  });
});

describe("ő/ű words", () => {
  it("collects distinct words with ő/ű/Ő/Ű only", () => {
    expect(huWords("Tűzőgép, tűzőgép és ÁRVÍZTŰRŐ; Fizetendő összesen 1 200 Ft Tűzőgép")).toEqual(["Tűzőgép", "tűzőgép", "ÁRVÍZTŰRŐ", "Fizetendő"]);
  });

  it("reads them from a real GridCraft workbook, a DOCX, a PPTX and an HTML file", () => {
    expect(huWordsFrom(path.join(FIX, "arlista-tuzogep.xlsx"))).toEqual(["Tűzőgép", "Fizetendő"]);
    const d = tmpDir("hu-src-");
    const docx = path.join(d, "a.docx");
    fs.writeFileSync(docx, zipSync({ "word/document.xml": enc("<w:document><w:p><w:r><w:t>Előleg és díjbekérő</w:t></w:r><w:r><w:t xml:space=\"preserve\"> Győr</w:t></w:r></w:p></w:document>") }));
    expect(huWordsFrom(docx)).toEqual(["Előleg", "díjbekérő", "Győr"]);
    const pptx = path.join(d, "a.pptx");
    fs.writeFileSync(pptx, zipSync({ "ppt/slides/slide1.xml": enc("<p:sld><a:t>Negyedéves eredmény &amp; kitűzött cél</a:t></p:sld>") }));
    expect(huWordsFrom(pptx)).toEqual(["kitűzött"]);
    const html = path.join(d, "a.html");
    fs.writeFileSync(html, "<td>Tűzőgép</td><td>12&nbsp;000</td>");
    expect(sourceText(html)).toContain("Tűzőgép");
  });

  it("a PDF text with the letters lost (GridCraft, T5) misses them; a whole one has them", () => {
    const words = ["Tűzőgép", "Fizetendő"];
    expect(missingWords(words, "Termék\nT  z  gép 12 000 Ft\nFizetend  összesen")).toEqual(["Tűzőgép", "Fizetendő"]);
    expect(missingWords(words, "Termék\nTűzőgép\n12 000 Ft\nFizetendő \nösszesen")).toEqual([]);
  });
});
