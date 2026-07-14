// Biosphere Score presentation utilities.
// Thresholds/bands per the Biosphere Beacons spec.

export interface ScoreBand {
  label: "Outstanding" | "Excellent" | "Good" | "Developing" | "Beginning";
  /** CSS custom property name defined in styles.css */
  token: string;
  /** Raw colour for SVG / map pins (matches the token value) */
  hex: string;
  min: number;
}

const BANDS: ScoreBand[] = [
  { label: "Outstanding", token: "--score-outstanding", hex: "#14532d", min: 90 },
  { label: "Excellent", token: "--score-excellent", hex: "#16a34a", min: 75 },
  { label: "Good", token: "--score-good", hex: "#d97706", min: 60 },
  { label: "Developing", token: "--score-developing", hex: "#ea580c", min: 40 },
  { label: "Beginning", token: "--score-beginning", hex: "#dc2626", min: 0 },
];

export function scoreBand(score: number | null | undefined): ScoreBand {
  const s = typeof score === "number" ? score : 0;
  return BANDS.find((b) => s >= b.min) ?? BANDS[BANDS.length - 1];
}

export function scoreColor(score: number | null | undefined): string {
  return scoreBand(score).hex;
}
