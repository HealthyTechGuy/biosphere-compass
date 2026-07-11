.PHONY: run install test build clean

# Start backend (:3001) and frontend (:5173) together. Ctrl-C stops both.
run:
	@echo "Backend  -> http://localhost:3001"
	@echo "Frontend -> http://localhost:5173"
	@trap 'kill 0' EXIT INT TERM; \
	 (cd backend  && npm run dev) & \
	 (cd frontend && npm run dev) & \
	 wait

install:
	cd backend  && npm install
	cd frontend && npm install

test:
	cd backend && npm test

build:
	cd frontend && npm run build

clean:
	rm -rf backend/node_modules backend/package-lock.json \
	       frontend/node_modules frontend/package-lock.json frontend/dist
