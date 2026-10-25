/**
 * Child-process wrappers with `windowsHide: true` as the default (no console window flashes on Windows).
 *
 * Replaces the two functions the upstream package imported from a sibling workspace package; nothing else
 * of that package is used. Callers pass argv arrays only — no function here goes through a shell.
 *
 * See change: office-plugin-v1 (design D2).
 */
import { type ChildProcess, type ExecFileOptions, execFile, type SpawnOptions, spawn as nodeSpawn } from "node:child_process";

/** `spawn` with `windowsHide: true` unless the caller overrides it. */
export function spawn(command: string, args: readonly string[] = [], options: SpawnOptions = {}): ChildProcess {
  return nodeSpawn(command, args, { windowsHide: true, ...options });
}

/**
 * Promise-returning `execFile`: resolves `{ stdout, stderr }`, rejects with the error carrying both (the shape of
 * Node's own promisified `execFile`). Text output unless `encoding: "buffer"` is passed.
 */
export function execFileAsync(
  file: string,
  args: readonly string[] = [],
  options: ExecFileOptions & { encoding?: BufferEncoding | "buffer" | null } = {},
): Promise<{ stdout: string | Buffer; stderr: string | Buffer }> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { encoding: "utf8", windowsHide: true, ...options } as ExecFileOptions, (err, stdout, stderr) => {
      if (err) reject(Object.assign(err, { stdout, stderr }));
      else resolve({ stdout, stderr });
    });
  });
}

export type { ChildProcess };
