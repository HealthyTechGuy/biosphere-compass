.PHONY: run install test build clean

# TanStack Start + rolldown-based Vite need Node >= 20.19. Prefer a modern Node
# on PATH when make run is invoked; fall back to whatever the user has.
NODE_BIN := $(shell test -x /opt/homebrew/opt/node/bin/node && echo /opt/homebrew/opt/node/bin || echo)
FRONTEND_ENV := $(if $(NODE_BIN),PATH=$(NODE_BIN):$$PATH,)

# Start backend (:3001) and frontend (:8080) together. Ctrl-C stops both.
run:
	@echo "Backend  -> http://localhost:3001"
	@echo "Frontend -> http://localhost:8080"
	@trap 'kill 0' EXIT INT TERM; \
	 (cd backend  && npm run dev) & \
	 (cd frontend && $(FRONTEND_ENV) npm run dev) & \
	 wait

install:
	cd backend  && npm install
	cd frontend && $(FRONTEND_ENV) npm install

test:
	cd backend && npm test

build:
	cd frontend && $(FRONTEND_ENV) npm run build

clean:
	rm -rf backend/node_modules backend/package-lock.json \
	       frontend/node_modules frontend/dist frontend/.nitro
