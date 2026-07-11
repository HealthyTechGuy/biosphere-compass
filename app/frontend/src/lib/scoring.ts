// Modular Biosphere Compass scoring engine.
// Dimensions, questions and weights all live in the database, so the
// framework can evolve without changing this code.

export interface EngineDimension {
  id: string;
  weight: number;
}

export interface EngineQuestion {
  id: string;
  dimension_id: string;
  max_points: number;
}

export interface EngineResponse {
  question_id: string;
  points: number;
}

/**
 * Per-dimension score (0–100) = earned points / available points within that
 * dimension. Dimensions with no answered questions score 0.
 */
export function computeDimensionScores(
  dimensions: EngineDimension[],
  questions: EngineQuestion[],
  responses: EngineResponse[],
): Record<string, number> {
  const byQuestion = new Map(responses.map((r) => [r.question_id, r.points]));
  const result: Record<string, number> = {};
  for (const dim of dimensions) {
    const qs = questions.filter((q) => q.dimension_id === dim.id);
    const max = qs.reduce((sum, q) => sum + q.max_points, 0);
    if (max === 0) {
      result[dim.id] = 0;
      continue;
    }
    const earned = qs.reduce((sum, q) => sum + Math.min(byQuestion.get(q.id) ?? 0, q.max_points), 0);
    result[dim.id] = Math.round((earned / max) * 100);
  }
  return result;
}

/**
 * Overall Biosphere Score (0–100) = weighted average of dimension scores.
 * Weights are configurable per dimension in the admin dashboard.
 */
export function computeOverallScore(
  dimensionScores: Record<string, number>,
  dimensions: EngineDimension[],
): number {
  let total = 0;
  let weightSum = 0;
  for (const dim of dimensions) {
    const s = dimensionScores[dim.id];
    if (typeof s !== "number") continue;
    total += s * dim.weight;
    weightSum += dim.weight;
  }
  if (weightSum === 0) return 0;
  return Math.round(total / weightSum);
}
