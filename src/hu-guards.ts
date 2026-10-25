/**
 * Hungarian guards for `aiplus-office verify` (ITLine's tests T5 and T7):
 *
 * - `huWordsFrom(file)` collects every word holding ő/ű/Ő/Ű from a source (XLSX, DOCX, PPTX or a text file), and
 *   `missingWords(words, pdfText)` says which of them a PDF's extracted text lacks. GridCraft's PDF export writes those
 *   four letters through a non-embedded CJK font: their text is lost and a viewer draws boxes or nothing.
 * - `scanHuNumbers(xlsx)` finds text cells that look like Hungarian-format numbers or dates („1 330,50", „2026.10.31.")
 *   where a formula reads them or a column holds numbers: GridCraft keeps them as text, so a SUM silently skips them.
 *
 * Pure functions over bytes; no tool is run here. See change: office-hungarian-guards.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { unzipSync } from "fflate";

const HU_LONG = /[őűŐŰ]/;
const MONTHS = "január|február|március|április|május|június|július|augusztus|szeptember|október|november|december";
const SIGN = "[-+−]?";
const SPACE = "[   ]";

const NUMBER_PATTERNS = [
  new RegExp(`^${SIGN}\\d{1,3}(?:${SPACE}\\d{3})+(?:,\\d+)?$`), // 1 330,50 · 12 000
  new RegExp(`^${SIGN}\\d+,\\d+$`), // 1330,50
  new RegExp(`^${SIGN}\\d{1,3}(?:\\.\\d{3})+,\\d+$`), // 1.330,50
  new RegExp(`^${SIGN}\\d{1,3}(?:\\.\\d{3}){2,}$`), // 1.330.000
  new RegExp(`^${SIGN}\\d+,\\d+${SPACE}?%$`), // 27,5 %
];
const DATE_PATTERNS = [
  /^\d{4}\.\s?\d{1,2}\.\s?\d{1,2}\.?$/, // 2026.10.31. · 2026. 10. 31.
  /^\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\.?$/, // 31.10.2026
  new RegExp(`^\\d{4}\\.\\s?(?:${MONTHS})\\s?\\d{1,2}\\.?$`, "i"), // 2026. október 31.
];
const CURRENCY = new RegExp(`${SPACE}?(?:Ft|HUF|forint)\\.?$`, "i");

/** How a text cell looks: a Hungarian-format number or date, plain digits, or nothing numeric. */
export type HuKind = "number" | "date" | "digits" | null;

export function huKind(raw: string): HuKind {
  const t = raw.trim();
  if (t === "") return null;
  if (DATE_PATTERNS.some((p) => p.test(t))) return "date";
  const hadCurrency = CURRENCY.test(t);
  const s = t.replace(CURRENCY, "").trim();
  if (NUMBER_PATTERNS.some((p) => p.test(s))) return "number";
  if (new RegExp(`^${SIGN}\\d+(?:\\.\\d+)?$`).test(s)) return hadCurrency ? "number" : "digits";
  return null;
}

// ── XML helpers ───────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? Number.parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()],
  );
}

/** Concatenated `<t>`/`<x:t>` texts inside an XML fragment (shared-string items and inline strings may hold runs). */
function texts(xml: string): string[] {
  return [...xml.matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([^<]*)<\/(?:\w+:)?t>/g)].map((m) => decode(m[1]));
}

function unzip(buf: Uint8Array): Record<string, Uint8Array> | undefined {
  if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) return undefined;
  try {
    return unzipSync(buf);
  } catch {
    return undefined;
  }
}

const utf8 = (b: Uint8Array | undefined): string => (b ? new TextDecoder().decode(b) : "");

// ── ő/ű words ────────────────────────────────────────────────────────────────

/** All text of a source file: the `<t>` texts of an Office (zip) file's XML parts, or the file as UTF-8 (HTML tags stripped). */
export function sourceText(file: string, buf: Uint8Array = fs.readFileSync(file)): string {
  const zip = unzip(buf);
  if (zip) {
    const parts = Object.keys(zip)
      .filter((n) => n.endsWith(".xml") && /^(xl\/(sharedStrings|worksheets\/|charts\/)|word\/|ppt\/(slides|charts|notesSlides)\/)/.test(n))
      .sort();
    return parts.map((n) => texts(utf8(zip[n])).join(" ")).join("\n");
  }
  const raw = utf8(buf);
  return /\.html?$/i.test(path.extname(file)) ? decode(raw.replace(/<[^>]*>/g, " ")) : raw;
}

/** Distinct words holding ő/ű/Ő/Ű, in first-seen order. */
export function huWords(text: string): string[] {
  const seen = new Set<string>();
  for (const w of text.normalize("NFC").split(/[^\p{L}\p{N}]+/u)) if (w && HU_LONG.test(w)) seen.add(w);
  return [...seen];
}

export function huWordsFrom(file: string): string[] {
  return huWords(sourceText(file));
}

/** The words a PDF's extracted text lacks (compared as whole tokens after NFC normalisation). */
export function missingWords(words: string[], pdfText: string): string[] {
  const have = new Set(pdfText.normalize("NFC").split(/[^\p{L}\p{N}]+/u));
  return words.filter((w) => !have.has(w));
}

// ── Hungarian numbers stored as text (XLSX) ──────────────────────────────────

export interface HuTextCell {
  sheet: string;
  cell: string;
  text: string;
  kind: Exclude<HuKind, null>;
  /** Why it counts: a formula reads it, its column holds a number, or its column holds several such cells. */
  reason: "formula range" | "number column" | "column of such cells";
}

const colNum = (letters: string): number => [...letters.toUpperCase()].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);

interface Range {
  sheet: string;
  c1: number;
  r1: number;
  c2: number;
  r2: number;
}

/** A1 references and ranges a formula reads (string literals and function names excluded). */
export function formulaRanges(formula: string, ownSheet: string): Range[] {
  const f = formula.replace(/"(?:[^"]|"")*"/g, '""');
  const out: Range[] = [];
  const sheetPart = "(?:(?:'((?:[^']|'')+)'|([A-Za-z_\\u00C0-\\u024F][\\w.\\u00C0-\\u024F]*))!)?";
  const cellRe = new RegExp(`(?<![\\w.$])${sheetPart}\\$?([A-Z]{1,3})\\$?(\\d+)(?::\\$?([A-Z]{1,3})\\$?(\\d+))?(?![\\w(])`, "g");
  for (const m of f.matchAll(cellRe)) {
    const sheet = (m[1]?.replace(/''/g, "'") ?? m[2]) || ownSheet;
    const [c1, r1] = [colNum(m[3]), Number(m[4])];
    const [c2, r2] = m[5] ? [colNum(m[5]), Number(m[6])] : [c1, r1];
    out.push({ sheet, c1: Math.min(c1, c2), r1: Math.min(r1, r2), c2: Math.max(c1, c2), r2: Math.max(r1, r2) });
  }
  const colRe = new RegExp(`(?<![\\w.$])${sheetPart}\\$?([A-Z]{1,3}):\\$?([A-Z]{1,3})(?![\\w(])`, "g");
  for (const m of f.matchAll(colRe)) {
    const sheet = (m[1]?.replace(/''/g, "'") ?? m[2]) || ownSheet;
    const [a, b] = [colNum(m[3]), colNum(m[4])];
    out.push({ sheet, c1: Math.min(a, b), r1: 1, c2: Math.max(a, b), r2: 1_048_576 });
  }
  return out;
}

interface Cell {
  col: number;
  row: number;
  ref: string;
  type: "text" | "number" | "other";
  text?: string;
}

/** Sheet name → worksheet part path, from workbook.xml and its relationships. */
function sheetParts(zip: Record<string, Uint8Array>): { name: string; part: string }[] {
  const wb = utf8(zip["xl/workbook.xml"]);
  const rels = utf8(zip["xl/_rels/workbook.xml.rels"]);
  const target = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /\bId="([^"]+)"/.exec(m[0])?.[1];
    const t = /\bTarget="([^"]+)"/.exec(m[0])?.[1];
    if (id && t) target.set(id, t.startsWith("/") ? t.slice(1) : path.posix.join("xl", t));
  }
  const out: { name: string; part: string }[] = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = decode(/\bname="([^"]*)"/.exec(m[0])?.[1] ?? "");
    const rid = /\br:id="([^"]+)"/.exec(m[0])?.[1] ?? /\bid="([^"]+)"/.exec(m[0])?.[1];
    const part = rid ? target.get(rid) : undefined;
    if (part && zip[part]) out.push({ name, part });
  }
  return out;
}

/** Text cells that look like Hungarian-format numbers or dates where they break arithmetic. Throws on a non-XLSX. */
export function scanHuNumbers(buf: Uint8Array): HuTextCell[] {
  const zip = unzip(buf);
  if (!zip || !zip["xl/workbook.xml"]) throw new Error("not an XLSX workbook");
  const sst = [...utf8(zip["xl/sharedStrings.xml"]).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]).join(""));
  const sheets = sheetParts(zip);
  const cells = new Map<string, Cell[]>();
  const ranges: Range[] = [];
  for (const { name, part } of sheets) {
    const list: Cell[] = [];
    for (const m of utf8(zip[part]).matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = m[1];
      const body = m[2] ?? "";
      const ref = /\br="([A-Z]{1,3})(\d+)"/.exec(attrs);
      if (!ref) continue;
      const t = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? "n";
      const f = /<f\b[^>]*>([^<]*)<\/f>/.exec(body)?.[1];
      if (f) ranges.push(...formulaRanges(decode(f), name));
      const v = /<v>([^<]*)<\/v>/.exec(body)?.[1];
      const cell: Cell = { col: colNum(ref[1]), row: Number(ref[2]), ref: `${ref[1]}${ref[2]}`, type: "other" };
      if (t === "s" && v !== undefined) Object.assign(cell, { type: "text", text: sst[Number(v)] ?? "" });
      else if (t === "inlineStr") Object.assign(cell, { type: "text", text: texts(body).join("") });
      else if (t === "n" && (v !== undefined || f)) cell.type = "number";
      list.push(cell);
    }
    cells.set(name, list);
  }
  const out: HuTextCell[] = [];
  for (const [sheet, list] of cells) {
    const numberCols = new Set(list.filter((c) => c.type === "number").map((c) => c.col));
    const kinds = list.map((c) => (c.type === "text" ? huKind(c.text ?? "") : null));
    const perCol = new Map<number, number>();
    list.forEach((c, i) => {
      if (kinds[i] === "number" || kinds[i] === "date") perCol.set(c.col, (perCol.get(c.col) ?? 0) + 1);
    });
    list.forEach((c, i) => {
      const kind = kinds[i];
      if (!kind) return;
      const read = ranges.some((r) => r.sheet === sheet && c.col >= r.c1 && c.col <= r.c2 && c.row >= r.r1 && c.row <= r.r2);
      let reason: HuTextCell["reason"] | undefined;
      if (read) reason = "formula range";
      else if (kind !== "digits" && numberCols.has(c.col)) reason = "number column";
      else if (kind !== "digits" && (perCol.get(c.col) ?? 0) >= 2) reason = "column of such cells";
      if (reason) out.push({ sheet, cell: c.ref, text: c.text ?? "", kind, reason });
    });
  }
  return out;
}
