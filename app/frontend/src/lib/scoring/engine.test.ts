import { describe, expect, it } from "vitest";
import rawConfig from "./config.json" with { type: "json" };
import {
  bandFor,
  cohortPercentile,
  scoreCriterion,
  scoreQuestionnaire,
  type CriterionAnswer,
  type CriterionConfig,
  type Questionnaire,
  type ScoringConfig,
} from "./engine";

const config = rawConfig as ScoringConfig;

const allNa = (): Record<string, CriterionAnswer> =>
  Object.fromEntries(config.criteria.map((c) => [c.id, { impact: 0 }]));

const allImpact = (
  impact: number,
  permanent = true,
  beyondPremises = true,
): Record<string, CriterionAnswer> =>
  Object.fromEntries(
    config.criteria.map((c) => [c.id, { impact, permanent, beyondPremises }]),
  );

const findCriterion = (id: string): CriterionConfig => {
  const c = config.criteria.find((x) => x.id === id);
  if (!c) throw new Error(`test fixture missing criterion ${id}`);
  return c;
};

describe("bandFor", () => {
  it("maps raw 0 to neutral/grey", () => {
    const b = bandFor(0, config);
    expect(b.id).toBe("neutral");
    expect(b.colour).toBe("grey");
  });

  it("maps raw 4 to significant_positive/green", () => {
    expect(bandFor(4, config).id).toBe("significant_positive");
    expect(bandFor(8, config).colour).toBe("green");
  });

  it("maps raw -4 to significant_negative/red", () => {
    expect(bandFor(-4, config).id).toBe("significant_negative");
    expect(bandFor(-8, config).colour).toBe("red");
  });

  it("maps the light green and amber slices", () => {
    expect(bandFor(1, config).id).toBe("slight_positive");
    expect(bandFor(3, config).id).toBe("slight_positive");
    expect(bandFor(-1, config).id).toBe("slight_negative");
    expect(bandFor(-3, config).id).toBe("slight_negative");
  });
});

describe("scoreCriterion", () => {
  const ghg = findCriterion("ghg");

  it("computes impact × permanence × reach", () => {
    const r = scoreCriterion(
      { impact: 2, permanent: true, beyondPremises: true },
      ghg,
      config,
    );
    expect(r.raw).toBe(8);
    expect(r.normalised).toBe(1);
    expect(r.band.id).toBe("significant_positive");
  });

  it("forces permanence and reach to 1 when impact is 0 (even if answered)", () => {
    const r = scoreCriterion(
      { impact: 0, permanent: true, beyondPremises: true },
      ghg,
      config,
    );
    expect(r.raw).toBe(0);
    expect(r.band.id).toBe("neutral");
  });

  it("applies negative impact with full multipliers", () => {
    const r = scoreCriterion(
      { impact: -2, permanent: true, beyondPremises: true },
      ghg,
      config,
    );
    expect(r.raw).toBe(-8);
    expect(r.normalised).toBe(0);
    expect(r.band.id).toBe("significant_negative");
  });
});

describe("scoreQuestionnaire — completeness rule (spec §3)", () => {
  it("all-n/a is complete and lands on the neutral midpoint 50.0", () => {
    const q: Questionnaire = {
      sector: "hospitality_food_service",
      answers: allNa(),
    };
    const r = scoreQuestionnaire(q, config);
    expect(r.status).toBe("complete");
    if (r.status !== "complete") return;
    expect(r.headline).toBe(50);
    expect(r.envIndex).toBe(50);
    expect(r.socialIndex).toBe(50);
    expect(r.recommendations).toEqual([]);
    expect(r.configVersion).toBe(config.version);
  });

  it("blocks scoring when any answer is missing", () => {
    const answers = allNa();
    delete answers.ghg;
    const r = scoreQuestionnaire(
      { sector: "hospitality_food_service", answers },
      config,
    );
    expect(r.status).toBe("incomplete");
    if (r.status !== "incomplete") return;
    expect(r.missing).toContain("ghg");
    expect(r.errors).toEqual([]);
  });

  it("blocks scoring when a non-zero impact lacks permanence or reach", () => {
    const answers = allNa();
    answers.ghg = { impact: 1 };
    const r = scoreQuestionnaire(
      { sector: "hospitality_food_service", answers },
      config,
    );
    expect(r.status).toBe("incomplete");
    if (r.status !== "incomplete") return;
    expect(r.missing.some((m) => m.startsWith("ghg"))).toBe(true);
  });

  it("reports errors for out-of-range impact values", () => {
    const answers = allNa();
    (answers.ghg as CriterionAnswer).impact = 5;
    const r = scoreQuestionnaire(
      { sector: "hospitality_food_service", answers },
      config,
    );
    expect(r.status).toBe("incomplete");
    if (r.status !== "incomplete") return;
    expect(r.errors.some((e) => e.includes("ghg"))).toBe(true);
  });

  it("reports an error for an unknown sector", () => {
    const r = scoreQuestionnaire(
      { sector: "not_a_real_sector", answers: allNa() },
      config,
    );
    expect(r.status).toBe("incomplete");
    if (r.status !== "incomplete") return;
    expect(r.errors[0]).toMatch(/Unknown sector/);
  });
});

describe("scoreQuestionnaire — headline maths (spec §4)", () => {
  it("uniform +1 permanent+beyond scores headline 75.0", () => {
    // raw = 1*2*2 = 4, normalised = 12/16 = 0.75 for every criterion
    // weighted mean = 0.75 per pillar, so headline = 100 * (0.6+0.4)*0.75 = 75
    const q: Questionnaire = {
      sector: "hospitality_food_service",
      answers: allImpact(1),
    };
    const r = scoreQuestionnaire(q, config);
    expect(r.status).toBe("complete");
    if (r.status !== "complete") return;
    expect(r.headline).toBe(75);
    expect(r.envIndex).toBe(75);
    expect(r.socialIndex).toBe(75);
  });

  it("uniform -2 permanent+beyond bottoms out at headline 0.0", () => {
    const q: Questionnaire = {
      sector: "professional_digital",
      answers: allImpact(-2),
    };
    const r = scoreQuestionnaire(q, config);
    expect(r.status).toBe("complete");
    if (r.status !== "complete") return;
    expect(r.headline).toBe(0);
    expect(r.envIndex).toBe(0);
    expect(r.socialIndex).toBe(0);
    // Every criterion is a red-band recommendation.
    expect(r.recommendations).toHaveLength(config.criteria.length);
    expect(r.recommendations[0].band).toBe("significant_negative");
  });
});

describe("scoreQuestionnaire — recommendations", () => {
  it("returns only negative criteria, worst first", () => {
    const answers = allNa();
    answers.ghg = { impact: -2, permanent: true, beyondPremises: true }; // raw -8
    answers.waste = { impact: -1, permanent: false, beyondPremises: false }; // raw -1
    answers.food = { impact: 2, permanent: true, beyondPremises: true }; // raw +8 (not a rec)

    const r = scoreQuestionnaire(
      { sector: "hospitality_food_service", answers },
      config,
    );
    expect(r.status).toBe("complete");
    if (r.status !== "complete") return;

    expect(r.recommendations.map((x) => x.id)).toEqual(["ghg", "waste"]);
    expect(r.recommendations[0].band).toBe("significant_negative");
    expect(r.recommendations[1].band).toBe("slight_negative");
  });
});

describe("cohortPercentile", () => {
  it("returns null below the minimum cohort size", () => {
    const cohort = [40, 50, 60]; // < 10
    expect(cohortPercentile(55, cohort, config)).toBeNull();
  });

  it("uses the midpoint definition and rounds", () => {
    const cohort = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    // score 55: below=5, equal=0 -> 5/10 = 50
    expect(cohortPercentile(55, cohort, config)).toBe(50);
    // score 50 (tie): below=4, equal=1 -> (4 + 0.5)/10 = 0.45 -> 45
    expect(cohortPercentile(50, cohort, config)).toBe(45);
    // score above everyone
    expect(cohortPercentile(101, cohort, config)).toBe(100);
  });
});
