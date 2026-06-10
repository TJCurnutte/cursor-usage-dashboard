# Cursor Usage Dashboard

Open-source dashboard for **Cursor public profile stats** (tokens, activity, agents, models) with optional **billing pools** via local sync or self-host.

Not affiliated with Cursor.

## Live demo

**https://cursor-usage-dashboard-silk.vercel.app**

Enter any public handle, e.g. [/u/trump](https://cursor-usage-dashboard-silk.vercel.app/u/trump).

## Quick start

```bash
git clone https://github.com/TJCurnutte/cursor-usage-dashboard.git
cd cursor-usage-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a `@handle`.

## Sync CLI (billing + full snapshot)

Reads your **local Cursor login token** — never uploads the token to this repo's hosted site.

```bash
npm run sync -- yourhandle
# or with output path
npm run sync -- yourhandle -o ./snapshot.json
```

Requirements:

- Cursor desktop app logged in (macOS / Linux / Windows)
- `python3` available (reads local `state.vscdb`)
- Or set `CURSOR_ACCESS_TOKEN` env var

## Self-host on Vercel (billing on your infra)

1. Fork this repo
2. Import to Vercel
3. Add env var: `CURSOR_ACCESS_TOKEN` (your token — stays in **your** Vercel project)
4. Optional: `CURSOR_PROFILE_HANDLE` for default handle in CLI

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TJCurnutte/cursor-usage-dashboard)

## Security model

| Mode | Profile stats | Billing |
|------|---------------|---------|
| Hosted (cursor-usage.vercel.app) | ✅ Public profiles | ❌ Use CLI or self-host |
| Local dev | ✅ | ✅ if logged into Cursor locally |
| Self-hosted Vercel | ✅ | ✅ with your `CURSOR_ACCESS_TOKEN` |

We **never** ask users to paste a Cursor session token into a web form on the hosted deployment.

See [docs/security](https://github.com/TJCurnutte/cursor-usage-dashboard/blob/main/docs/security.md).

## Monorepo layout

```
packages/core/       Shared sync, types, formatters
packages/sync-cli/   cursor-usage-sync CLI
src/                 Next.js web app
```

## API

- `GET /api/profile/:handle` — fetch snapshot (profile; billing if server has token)
- `POST /api/profile/:handle` — refresh snapshot

Rate limited (20 GET / 10 POST per handle per minute).

## License

MIT
