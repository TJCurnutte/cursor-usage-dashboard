# Security

## Hosted deployment

- Fetches **public** `cursor.com/@handle` pages only
- Does **not** store Cursor session tokens
- Does **not** expose a token paste form
- Rate limits profile API routes

## Billing data

Billing requires Cursor's private API (`api2.cursor.sh`), authenticated with your session token.

**Safe options:**

1. **Local CLI** — token read from Cursor desktop app on your machine
2. **Self-hosted** — set `CURSOR_ACCESS_TOKEN` in your own Vercel/env

**Never:**

- Paste your Cursor token into a third-party website
- Commit tokens to git

## Token storage locations (local CLI only)

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` |
| Linux | `~/.config/Cursor/User/globalStorage/state.vscdb` |
| Windows | `%APPDATA%\Cursor\User\globalStorage\state.vscdb` |

The CLI reads `cursorAuth/accessToken` via Python sqlite3. You can audit `packages/core/src/token.ts`.

## Reporting issues

Open a GitHub issue — do not include tokens or private profile data.
