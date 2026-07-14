// Mirrors the backend's public shape from app/backend/scoring-engine.ts.

export type Pillar = "environmental" | "social";

export interface CriterionOption {
  value: number;
  label: string;
}

export interface CriterionConfig {
  id: string;
  pillar: Pillar;
  name: string;
  question: string;
  options: CriterionOption[];
}

export interface BandConfig {
  id: string;
  min: number;
  max: number;
  colour: string;
  action: string;
}

export interface SectorConfig {
  name: string;
  weights: Record<Pillar, Record<string, number>>;
}

export interface ScoringConfig {
  version: string;
  headline: { envWeight: number; socialWeight: number; scale: number };
  cohort: { minSizeForPercentile: number };
  impactScale: CriterionOption[];
  permanenceQuestion: { id: string; text: string; options: CriterionOption[] };
  reachQuestion: { id: string; text: string; options: CriterionOption[] };
  bands: BandConfig[];
  criteria: CriterionConfig[];
  sectors: Record<string, SectorConfig>;
}

export interface CriterionAnswer {
  impact: number;
  permanent?: boolean;
  beyondPremises?: boolean;
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
  raw: number;
  normalised: number;
  band: BandConfig;
}

export type BusinessSize = "" | "small" | "medium" | "large";

export interface BusinessDetails {
  name: string;
  website: string;
  linkedin: string;
  size: BusinessSize;
}

export type ScoreResult =
  | { status: "incomplete"; missing: string[]; errors: string[] }
  | {
      status: "complete";
      headline: number;
      envIndex: number;
      socialIndex: number;
      wheel: CriterionResult[];
      recommendations: { id: string; name: string; band: string; action: string }[];
      configVersion: string;
    };
