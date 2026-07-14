/**
 * Biosphere Compass — reference scoring engine
 *
 * Consumes scoring-config.json and a completed questionnaire; produces
 * per-criterion wheel results and a sector-weighted 0–100 headline score.
 *
 * Methodology derived from the Isle of Man Government Climate Impact
 * Assessment (CIA) Tool (15 April 2025), adapted for ongoing businesses.
 *
 * Rules implemented:
 *  - Per-criterion raw score = impact (−2..+2) × permanence (1|2) × reach (1|2),
 *    range −8..+8, banded exactly as the CIA wheel (green/light green/grey/amber/red).
 *  - Impact of 0 (n/a) forces permanence/reach to 1 — they are not asked.
 *  - Any missing answer blocks scoring entirely (CIA "sentinel" behaviour):
 *    an incomplete assessment returns status "incomplete", never a partial score.
 *  - Headline = 100 × (envWeight × envIndex + socialWeight × socialIndex),
 *    where each pillar index is the sector-weighted mean of normalised
 *    criterion scores ((raw + 8) / 16).
 *  - Percentile ranking only when the cohort has >= minSizeForPercentile scores.
 */

// ---------- Types ----------

export type Pillar = "environmental" | "social";

export interface CriterionConfig {
  id: string;
  pillar: Pillar;
  name: string;
  question: string;
  options: { value: number; label: string }[];
}

export interface BandConfig {
  id: string;
  min: number;
  max: number;
  colour: string;
  action: string;
}

export interface ScoringConfig {
  version: string;
  headline: { envWeight: number; socialWeight: number; scale: number };
  cohort: { minSizeForPercentile: number };
  bands: BandConfig[];
  criteria: CriterionConfig[];
  sectors: Record<
    string,
    { name: string; weights: Record<Pillar, Record<string, number>> }
  >;
}

export interface CriterionAnswer {
  /** −2..+2, from the criterion's options */
  impact: number;
  /** true = embedded in ongoing operations, false = one-off/occasional. Ignored when impact === 0. */
  permanent?: boolean;
  /** true = extends beyond premises, false = premises only. Ignored when impact === 0. */
  beyondPremises?: boolean;
  /** free-text justification / evidence */
  justification?: string;
}

export interface Questionnaire {
  sector: string;
  answers: Record<string, CriterionAnswer>;
}

export interface CriterionResult {
  id: string;
  name: string;
  pillar: Pillar;
  raw: number; // −8..+8
  normalised: number; // 0..1
  band: BandConfig;
}

export type ScoreResult =
  | {
      status: "incomplete";
      missing: string[];
      errors: string[];
    }
  | {
      status: "complete";
      headline: number; // 0..100, 1 d.p.
      envIndex: number; // 0..100, 1 d.p.
      socialIndex: number; // 0..100, 1 d.p.
      wheel: CriterionResult[];
      recommendations: { id: string; name: string; band: string; action: string }[];
      configVersion: string;
    };

// ---------- Engine ----------

const VALID_IMPACTS = new Set([-2, -1, 0, 1, 2]);

export function bandFor(raw: number, config: ScoringConfig): BandConfig {
  const band = config.bands.find((b) => raw >= b.min && raw <= b.max);
  if (!band) throw new Error(`No band covers raw score ${raw}`);
  return band;
}

export function scoreCriterion(
  answer: CriterionAnswer,
  criterion: CriterionConfig,
  config: ScoringConfig
): CriterionResult {
  const impact = answer.impact;
  // n/a zeroes the criterion regardless of permanence/reach (CIA behaviour: b/c not asked)
  const permanence = impact === 0 ? 1 : answer.permanent ? 2 : 1;
  const reach = impact === 0 ? 1 : answer.beyondPremises ? 2 : 1;
  const raw = impact * permanence * reach;
  return {
    id: criterion.id,
    name: criterion.name,
    pillar: criterion.pillar,
    raw,
    normalised: (raw + 8) / 16,
    band: bandFor(raw, config),
  };
}

export function scoreQuestionnaire(
  q: Questionnaire,
  config: ScoringConfig
): ScoreResult {
  const errors: string[] = [];
  const missing: string[] = [];

  const sector = config.sectors[q.sector];
  if (!sector) {
    return {
      status: "incomplete",
      missing: [],
      errors: [`Unknown sector "${q.sector}". Valid: ${Object.keys(config.sectors).join(", ")}`],
    };
  }

  // Validate completeness — CIA rule: no partial scores.
  for (const criterion of config.criteria) {
    const a = q.answers[criterion.id];
    if (!a || a.impact === undefined || a.impact === null) {
      missing.push(criterion.id);
      continue;
    }
    if (!VALID_IMPACTS.has(a.impact)) {
      errors.push(`${criterion.id}: impact must be one of -2,-1,0,1,2 (got ${a.impact})`);
      continue;
    }
    if (a.impact !== 0 && (a.permanent === undefined || a.beyondPremises === undefined)) {
      missing.push(`${criterion.id} (permanence/reach)`);
    }
  }
  if (missing.length || errors.length) {
    return { status: "incomplete", missing, errors };
  }

  // Score each criterion
  const wheel = config.criteria.map((c) =>
    scoreCriterion(q.answers[c.id], c, config)
  );

  // Sector-weighted pillar indices
  const pillarIndex = (pillar: Pillar): number => {
    const weights = sector.weights[pillar];
    let sum = 0;
    let weightTotal = 0;
    for (const r of wheel.filter((w) => w.pillar === pillar)) {
      const w = weights[r.id];
      if (w === undefined) throw new Error(`Sector "${q.sector}" missing weight for ${r.id}`);
      sum += r.normalised * w;
      weightTotal += w;
    }
    // Weights ship summing to 1 per pillar; renormalise defensively.
    return weightTotal > 0 ? sum / weightTotal : 0;
  };

  const env = pillarIndex("environmental");
  const social = pillarIndex("social");
  const headline =
    config.headline.scale *
    (config.headline.envWeight * env + config.headline.socialWeight * social);

  const recommendations = wheel
    .filter((r) => r.raw < 0)
    .sort((a, b) => a.raw - b.raw) // worst first
    .map((r) => ({ id: r.id, name: r.name, band: r.band.id, action: r.band.action }));

  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    status: "complete",
    headline: round1(headline),
    envIndex: round1(env * 100),
    socialIndex: round1(social * 100),
    wheel,
    recommendations,
    configVersion: config.version,
  };
}

/**
 * Percentile of `score` within a cohort of headline scores (same sector +
 * biosphere). Returns null below the minimum cohort size — do not display
 * a ranking in that case.
 */
export function cohortPercentile(
  score: number,
  cohortScores: number[],
  config: ScoringConfig
): number | null {
  if (cohortScores.length < config.cohort.minSizeForPercentile) return null;
  const below = cohortScores.filter((s) => s < score).length;
  const equal = cohortScores.filter((s) => s === score).length;
  // midpoint definition — stable for ties
  return Math.round(((below + equal / 2) / cohortScores.length) * 100);
}
