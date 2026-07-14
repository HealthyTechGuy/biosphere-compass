import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import config from "@/lib/scoring/config.json" with { type: "json" };

export const Route = createFileRoute("/api/config")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(config), {
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
    },
  },
});
