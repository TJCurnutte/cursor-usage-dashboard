import { execFile } from "node:child_process";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function stateDbPath(): string {
  const home = homedir();
  if (platform() === "darwin") {
    return join(
      home,
      "Library/Application Support/Cursor/User/globalStorage/state.vscdb",
    );
  }
  if (platform() === "win32") {
    const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");
    return join(appData, "Cursor", "User", "globalStorage", "state.vscdb");
  }
  return join(home, ".config", "Cursor", "User", "globalStorage", "state.vscdb");
}

async function readSqliteValue(key: string): Promise<string | null> {
  const dbPath = stateDbPath();
  const script = `import sqlite3; c=sqlite3.connect(${JSON.stringify(dbPath)}); r=c.execute("SELECT value FROM ItemTable WHERE key = ?", (${JSON.stringify(key)},)).fetchone(); print(r[0] if r else ""); c.close()`;

  try {
    const { stdout } = await execFileAsync("python3", ["-c", script]);
    const value = stdout.trim();
    return value || null;
  } catch {
    return null;
  }
}

export async function getCursorAccessToken(): Promise<string | null> {
  if (process.env.CURSOR_ACCESS_TOKEN) {
    return process.env.CURSOR_ACCESS_TOKEN;
  }
  return readSqliteValue("cursorAuth/accessToken");
}

export async function getCursorCachedEmail(): Promise<string | null> {
  return readSqliteValue("cursorAuth/cachedEmail");
}

export function getStateDbPath(): string {
  return stateDbPath();
}
