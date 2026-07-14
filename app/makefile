.PHONY: run dev install test build preview deploy clean

# TanStack Start + Rolldown-based Vite 8 need Node >= 24.
# Node 23.2 triggers a known `vite:css-post` bug that breaks builds;
# Node 20 is too old for Rolldown's native bindings. Pin to nvm's Node 24 if
# installed, else fall back to PATH.
NVM_NODE_24 := $(shell test -x $$HOME/.nvm/versions/node/v24.18.0/bin/node && echo $$HOME/.nvm/versions/node/v24.18.0/bin || echo)
FE := $(if $(NVM_NODE_24),PATH=$(NVM_NODE_24):$$PATH,)

# One-command dev: SSR frontend + /api/config, /api/score served locally.
run dev:
	@echo "Frontend + API -> http://localhost:8080"
	cd frontend && $(FE) npm run dev

install:
	cd frontend && $(FE) npm install --legacy-peer-deps

# Vitest suite for the scoring engine (frontend/src/lib/scoring/).
test:
	cd frontend && $(FE) npm test

# Production build for Cloudflare Workers (Nitro cloudflare-module preset).
build:
	cd frontend && $(FE) npm run build

# Local production preview via Wrangler.
preview: build
	cd frontend && $(FE) npx wrangler --cwd .output dev

# Ship it — requires `wrangler login` first, plus SUPABASE_URL /
# SUPABASE_PUBLISHABLE_KEY set as CF secrets. See DEPLOY.md.
deploy: build
	cd frontend && $(FE) npx wrangler --cwd .output deploy

clean:
	rm -rf frontend/node_modules frontend/dist frontend/.nitro frontend/.output frontend/.wrangler
