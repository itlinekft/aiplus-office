/** Absolute paths shared by the subprocess-driving tests. */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

/** Absolute tsx loader: subprocess tests may change cwd and must still resolve it. */
export const TSX = createRequire(import.meta.url).resolve("tsx");

/** The `aiplus-office` entry run through tsx in a subprocess. */
export const OFFICE_CLI = fileURLToPath(new URL("../../bin/aiplus-office.ts", import.meta.url));

/** Repository root. */
export const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
