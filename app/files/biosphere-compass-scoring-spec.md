# Biosphere Compass — Scoring Specification v1.0.0

Methodology adapted from the Isle of Man Government Climate Impact Assessment (CIA) Tool, version 15 April 2025. The CIA scores *proposals* made by public bodies; Biosphere Compass rewords the same 21 criteria to score an *ongoing business*. The per-criterion mechanics (5-point impact scale, permanence and reach multipliers, −8..+8 banding, impact wheel) are preserved so results remain traceable to the official tool. The headline score is a new layer, because the CIA deliberately has no aggregate.

The machine-readable source of truth is `scoring-config.json`. This document explains the rules; the JSON carries the exact question and option wording. `scoring-engine.ts` is the reference implementation.

## 1. Assessment structure

There are 21 criteria: 10 environmental (Greenhouse Gases, Air Quality, Sustainable Transport, Land Use Change, Biodiversity, Soil/Watercourse & Marine Health, Climate Change Adaptation, Energy Use, Sustainable Materials, Waste) and 11 social (Food, Health & Wellbeing, Housing, Education & Skills, Built Community, Cultural Community, Accessibility, Local Economy & Jobs, Safety, Equity, Community Voice — the CIA's "Democratic Voice" reworded for a business context).

Each criterion asks up to four things:

**a. Impact** — a 5-point criterion-specific scale scored +2 (significant positive), +1 (slight positive), 0 (not applicable / no impact), −1 (slight negative), −2 (significant negative). Wording per criterion is in the config and is adapted from the CIA's "Drop downs" tab.

**b. Permanence** — replaces the CIA's "beyond the delivery phase": *Is this embedded in how your business operates year-round, or a one-off/occasional initiative?* Embedded = 2, occasional = 1. Skipped when impact = 0.

**c. Reach** — replaces "beyond the intended location": *Does this effect extend beyond your own premises into the wider biosphere or community?* Yes = 2, No = 1. Skipped when impact = 0.

**d. Justification** — free text. Not scored in v1, but stored; it is the substrate for a later LLM consistency check (flagging answers whose justification doesn't support the selected impact level) and for evidence upload.

## 2. Per-criterion score and wheel

Raw score = a × b × c, range −8 to +8, exactly as the CIA computes it. When a = 0, b and c are treated as 1 (the CIA greys them out; the frontend should hide them).

Bands, identical to the CIA wheel:

| Raw score | Band | Colour | Action shown to the business |
|---|---|---|---|
| 4 to 8 | Significant positive | Green | Strong performance; keep it up, consider sharing your approach |
| 1 to 3 | Slight positive | Light green | Positive; review whether it could be deepened or made permanent |
| 0 | Neutral / n.a. | Grey | No action required |
| −1 to −3 | Slight negative | Amber | Review this area for practical improvements |
| −4 to −8 | Significant negative | Red | Changes needed; prioritise in improvement plan |

The wheel view shows all 21 criteria coloured by band. Recommendations are the amber/red criteria, worst first — this is the improvement-plan output and the product's retention hook.

## 3. Completeness rule

An assessment with any missing answer produces **no score at all** — status `incomplete` with the list of missing items. This mirrors the CIA's sentinel behaviour (blank = 20 flag) and protects score integrity: a business cannot improve its number by skipping its worst criteria. A missing permanence/reach answer on a non-zero impact also blocks scoring.

## 4. Headline score (0–100)

The multiplicative raw scores are kept for the wheel but are not summed — a sum of products ranks poorly. The headline is additive and sector-weighted:

1. Normalise each criterion: n = (raw + 8) / 16, giving 0–1.
2. Compute a pillar index per pillar: the weighted mean of normalised scores using the business's **sector weight matrix** (weights within each pillar sum to 1).
3. Headline = 100 × (0.6 × environmental index + 0.4 × social index).

The 60/40 split is configurable (`headline.envWeight` / `headline.socialWeight`) and defaults climate-forward. A business answering "n/a" everywhere lands at exactly 50 — the neutral midpoint — which is the intended semantics: no harm, no contribution.

## 5. Sector materiality weights

Six launch sectors: Hospitality & Food Service; Agriculture & Land Management; Retail & Consumer Goods; Marine, Tourism & Recreation; Construction & Property; Professional & Digital Services.

Each sector assigns a weight to every criterion (per pillar, summing to 1), reflecting what is material for that kind of business — the same principle as SASB materiality maps. This is what stops a café being flattened by criteria it can only answer "n/a" to (Housing, Land Use) while a property developer is weighted heavily on exactly those. Illustrative extremes from the shipped matrix: Waste is 0.18 for hospitality but 0.05 for agriculture; Housing is 0.22 for construction/property but 0.02 for professional services; Biodiversity and Soil/Water are 0.18 each for agriculture and marine/tourism.

**The v1 weights are my judgement, not calibrated data.** They are plausible and defensible but should be reviewed with a domain advisor (a biosphere officer or sustainability consultant) before public launch, and versioned — a weight change alters every score, so `configVersion` is stamped on every result and historical scores must be either frozen or recomputed transparently.

## 6. Cohort comparison

Percentile ranking ("top 20% of hospitality businesses in this biosphere") is computed against the cohort of headline scores sharing the same sector and biosphere, using the midpoint definition for ties. It is **gated behind a minimum cohort size of 10** (`cohort.minSizeForPercentile`); below that the frontend shows the absolute score only. Never show a percentile against a cohort small enough for the members to identify each other.

## 7. Frontend contract

Input (per submission):

```json
{
  "sector": "hospitality_food_service",
  "answers": {
    "ghg": { "impact": 1, "permanent": true, "beyondPremises": false, "justification": "..." },
    "air_quality": { "impact": 0 }
  }
}
```

Output: either `{ status: "incomplete", missing: [...], errors: [...] }` or:

```json
{
  "status": "complete",
  "headline": 68.6,
  "envIndex": 64.5,
  "socialIndex": 74.8,
  "wheel": [ { "id": "ghg", "name": "Greenhouse Gases", "pillar": "environmental", "raw": 2, "normalised": 0.625, "band": { "id": "slight_positive", "colour": "light_green", "action": "..." } } ],
  "recommendations": [ { "id": "soil_water_marine", "name": "...", "band": "significant_negative", "action": "..." } ],
  "configVersion": "1.0.0"
}
```

Frontend behaviour the config assumes: render the five impact options as a dropdown/radio per criterion; hide permanence and reach when impact = 0; require justification text before submission (recommended even though v1 doesn't score it); disable score generation until all criteria are answered.

## 8. Known limitations and v2 candidates

Self-reporting is unverified — the justification field plus an LLM consistency check is the cheapest first defence, followed by evidence upload and spot review. Weights need domain calibration (section 5). Percentile ranking needs data; the weight matrix carries comparability until cohorts reach size. Biosphere-specific criterion extensions (e.g. marine criteria weighted up for island biospheres) can be added as per-biosphere weight overlays without changing the engine.
