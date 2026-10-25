/**
 * Per-file HOME isolation: every test file runs with a fresh temporary HOME and no AIPLUS_OFFICE_* variables,
 * so nothing reads or writes the real user's cache. Opt-in real-binary tests set their own cache explicitly.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const realHome = os.homedir();
const home = fs.mkdtempSync(path.join(os.tmpdir(), "aiplus-office-home-"));
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.XDG_CACHE_HOME = path.join(home, ".cache");
process.env.AIPLUS_OFFICE_REAL_HOME = realHome;
for (const k of Object.keys(process.env)) {
  if (k.startsWith("AIPLUS_OFFICE_") && k !== "AIPLUS_OFFICE_REAL_HOME" && !k.startsWith("AIPLUS_OFFICE_E2E")) delete process.env[k];
}
