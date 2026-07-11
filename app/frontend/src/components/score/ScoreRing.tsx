import { scoreBand } from "@/lib/score";

interface ScoreRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

/** Large circular Biosphere Score indicator. */
export function ScoreRing({ score, size = 160, strokeWidth = 12, showLabel = true }: ScoreRingProps) {
  const value = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
  const band = scoreBand(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="inline-flex flex-col items-center" role="img" aria-label={`Biosphere Score ${Math.round(value)} out of 100 — ${band.label}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={band.hex}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-semibold" style={{ fontSize: size * 0.28, color: band.hex }}>
            {score == null ? "–" : Math.round(value)}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      {showLabel && (
        <span
          className="mt-2 rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: band.hex }}
        >
          {band.label}
        </span>
      )}
    </div>
  );
}

/** Compact score chip for cards and lists. */
export function ScoreChip({ score }: { score: number | null | undefined }) {
  const band = scoreBand(score);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm"
      style={{ backgroundColor: band.hex }}
      aria-label={`Biosphere Score ${score == null ? "not yet assessed" : Math.round(score)}`}
    >
      {score == null ? "–" : Math.round(score)}
      <span className="font-medium opacity-90">{band.label}</span>
    </span>
  );
}
