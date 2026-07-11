import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  scoreQuestionnaire,
  type Questionnaire,
  type ScoringConfig,
} from "./scoring-engine.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  readFileSync(join(__dirname, "scoring-config.json"), "utf-8"),
) as ScoringConfig;

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", configVersion: config.version });
});

app.get("/config", (_req, res) => {
  res.json(config);
});

app.post("/score", (req, res) => {
  const body = req.body as Partial<Questionnaire>;
  if (!body || typeof body.sector !== "string" || typeof body.answers !== "object") {
    res.status(400).json({ error: "Body must be { sector: string, answers: object }" });
    return;
  }
  res.json(scoreQuestionnaire(body as Questionnaire, config));
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Biosphere Compass backend on http://localhost:${port}`);
});
