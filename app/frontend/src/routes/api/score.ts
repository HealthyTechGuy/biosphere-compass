import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import config from "@/lib/scoring/config.json" with { type: "json" };
import {
  scoreQuestionnaire,
  type Questionnaire,
  type ScoringConfig,
} from "@/lib/scoring/engine";

const scoringConfig = config as ScoringConfig;

export const Route = createFileRoute("/api/score")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Partial<Questionnaire>;
        try {
          body = (await request.json()) as Partial<Questionnaire>;
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        if (
          !body ||
          typeof body.sector !== "string" ||
          typeof body.answers !== "object"
        ) {
          return json(
            { error: "Body must be { sector: string, answers: object }" },
            400,
          );
        }
        return json(scoreQuestionnaire(body as Questionnaire, scoringConfig));
      },
    },
  },
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
