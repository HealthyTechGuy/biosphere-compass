# Deploying to Cloudflare Workers

The app is a single Cloudflare Worker: TanStack Start renders SSR + serves the
static assets, and the scoring engine lives inside as two Nitro API routes
(`/api/config`, `/api/score`). There's no separate backend service.

## Prerequisites

- **Node 24.** `nvm use 24` (an `.nvmrc` under `frontend/` pins it). The
  makefile automatically prefers `~/.nvm/versions/node/v24.18.0/bin` if present.
  Node 23.2 hits a `vite:css-post` bug that breaks the build; Node 20 is too
  old for Rolldown's native bindings.
- **Wrangler CLI.** Any recent version works. `npx wrangler --version` to
  check, `npm i -g wrangler` if you want it globally.
- A Cloudflare account with Workers enabled and a `wrangler login` done once.

## First-time setup

1. **Log in to Cloudflare** if you haven't already:
   ```bash
   npx wrangler login
   ```

2. **Set environment variables.** The app reads Supabase config from
   `process.env.SUPABASE_URL` and `process.env.SUPABASE_PUBLISHABLE_KEY` inside
   server functions and SSR routes. On Cloudflare these need to be set as
   Worker vars (they're a public URL + anon key — safe to expose, but keeping
   them as vars/secrets means you can rotate without a code change).

   Set them via wrangler:
   ```bash
   cd app/frontend
   npx wrangler --cwd .output secret put SUPABASE_URL
   npx wrangler --cwd .output secret put SUPABASE_PUBLISHABLE_KEY
   ```
   (Paste the value when prompted; both live in `app/frontend/.env`.)

   Or via the Cloudflare dashboard: **Workers & Pages → your worker → Settings
   → Variables and Secrets → Add**.

   The `VITE_SUPABASE_*` vars are compiled into the client bundle at
   **build time** — they're read from `app/frontend/.env` when `make build`
   runs, so keep that file in sync.

3. **(Optional) Set a nicer worker name.** Nitro auto-generates a name from
   your CF account + workspace slug — currently
   `healthytechguy-biosphere-compass-app-frontend`. Override it at deploy time:
   ```bash
   npx wrangler --cwd .output deploy --name biosphere-compass
   ```
   Or add `--name` to the `deploy` target in `app/makefile`.

## Deploying

From `app/`:

```bash
make build      # rebuild for CF (writes .output/)
make deploy     # calls wrangler deploy on the built artifact
```

Wrangler will print the public URL, something like
`https://biosphere-compass.<your-account>.workers.dev`.

## Local production preview

To exercise the built Worker locally through Wrangler's Miniflare runtime
(closer to prod than `npm run dev`):

```bash
make preview
```

Opens on `http://localhost:8787` (Wrangler default). This is the best way to
smoke-test SSR + API routes against the actual Workers runtime before pushing.

## What gets deployed

`make build` produces `app/frontend/.output/` with:

- `server/index.mjs` — the Worker entry (SSR + `/api/*` handlers).
- `server/wrangler.json` — auto-generated CF config: `nodejs_compat`
  flag on, `ASSETS` binding pointed at `../public`, ESModule rules.
- `public/` — static assets (bundled JS, CSS, images, `_headers`).
- `nitro.json` — build metadata.

## Custom domain

Once deployed:

1. Cloudflare dashboard → **Workers & Pages → your worker → Settings → Triggers
   → Custom Domains → Add**.
2. Point the domain (must already be on Cloudflare DNS) — routing is
   automatic; no DNS record juggling.

## Troubleshooting

- **`css content for "" was not found`** — you're on Node 23.2.x. `nvm use 24`
  (the `.nvmrc` should trigger this automatically if you have `avn` /
  `direnv`), delete `node_modules`, `make install`, rebuild.
- **`peerOptional nitro conflict`** — the `@lovable.dev/vite-tanstack-config`
  package pins nitro to a specific beta. `make install` uses
  `--legacy-peer-deps` to work around this.
- **`Supabase environment variable(s)`** thrown at runtime — the CF secrets
  aren't set. Run the two `wrangler secret put` commands above.
- **Deploy succeeds but `/api/*` 404s** — Nitro didn't pick up new route
  files. Delete `.output/` and rebuild.
