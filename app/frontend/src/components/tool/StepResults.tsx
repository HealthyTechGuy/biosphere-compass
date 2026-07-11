import { useEffect, useState } from "react";
import type { ScoreResult, ScoringConfig } from "../../types";
import type { BusinessInfo } from "./Tool";

const BAND_TO_CSS: Record<string, string> = {
  green: "var(--band-green)",
  light_green: "var(--band-light-green)",
  grey: "var(--band-grey)",
  amber: "var(--band-amber)",
  red: "var(--band-red)",
};

function tierFor(headline: number): { name: string; colour: string } {
  if (headline >= 80) return { name: "Exemplary", colour: "var(--teal)" };
  if (headline >= 60) return { name: "Advanced", colour: "var(--band-green)" };
  if (headline >= 40) return { name: "Progressing", colour: "#f1c40f" };
  if (headline >= 20) return { name: "Developing", colour: "var(--band-amber)" };
  return { name: "Early Stage", colour: "var(--band-red)" };
}

export function StepResults({
  config,
  business,
  result,
  onRestart,
}: {
  config: ScoringConfig;
  business: BusinessInfo;
  result: ScoreResult;
  onRestart: () => void;
}) {
  if (result.status === "incomplete") {
    return (
      <div className="card">
        <div className="results-header">
          <div>
            <div className="result-company">Compass Report</div>
            <div className="result-title">Assessment incomplete</div>
            <div className="result-url">
              {result.errors.length > 0
                ? "Errors were reported by the scoring engine."
                : `${result.missing.length} answers still required.`}
            </div>
          </div>
        </div>
        {result.errors.length > 0 && (
          <div className="insight-card improve" style={{ marginBottom: "1rem" }}>
            <div className="insight-card-title">Errors</div>
            {result.errors.map((e, i) => (
              <div key={i} className="insight-item">
                <span className="insight-bullet">→</span>
                {e}
              </div>
            ))}
          </div>
        )}
        {result.missing.length > 0 && (
          <div className="insight-card improve">
            <div className="insight-card-title">Missing answers</div>
            {result.missing.map((m) => (
              <div key={m} className="insight-item">
                <span className="insight-bullet">→</span>
                {m}
              </div>
            ))}
          </div>
        )}
        <div className="results-cta">
          <button type="button" className="btn-restart" onClick={onRestart}>
            ← New assessment
          </button>
        </div>
      </div>
    );
  }

  return <CompleteResults config={config} business={business} result={result} onRestart={onRestart} />;
}

function CompleteResults({
  config,
  business,
  result,
  onRestart,
}: {
  config: ScoringConfig;
  business: BusinessInfo;
  result: Extract<ScoreResult, { status: "complete" }>;
  onRestart: () => void;
}) {
  const tier = tierFor(result.headline);
  const [displayScore, setDisplayScore] = useState(0);
  const [pillarWidths, setPillarWidths] = useState({ env: 0, social: 0 });

  useEffect(() => {
    const target = Math.round(result.headline);
    let n = 0;
    const id = window.setInterval(() => {
      n = Math.min(n + 2, target);
      setDisplayScore(n);
      if (n >= target) window.clearInterval(id);
    }, 25);
    const barTimer = window.setTimeout(() => {
      setPillarWidths({ env: result.envIndex, social: result.socialIndex });
    }, 300);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(barTimer);
    };
  }, [result.headline, result.envIndex, result.socialIndex]);

  const strengths = [...result.wheel]
    .filter((w) => w.raw > 0)
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 3);

  const priorities = result.recommendations.slice(0, 3);

  const sectorName = config.sectors[business.sector]?.name ?? business.sector;

  return (
    <div className="card">
      <div className="results-header">
        <div>
          <div className="result-company">{business.name || "Compass Report"}</div>
          <div className="result-title">Biosphere Compass Report</div>
          <div className="result-url">
            {sectorName}
            {business.url ? ` · ${business.url}` : ""}
          </div>
        </div>
        <div className="score-circle-wrap">
          <div
            className="score-circle"
            style={{ ["--pct" as string]: String(displayScore) }}
          >
            <div className="score-circle-inner">
              <span className="score-num">{displayScore}</span>
              <span className="score-denom">/100</span>
            </div>
          </div>
          <div
            className="score-tier"
            style={{
              color: tier.colour,
              background: `color-mix(in srgb, ${tier.colour} 15%, transparent)`,
            }}
          >
            {tier.name}
          </div>
        </div>
      </div>

      <div className="dimensions">
        <div className="dim-header">
          <span>Pillar Scores</span>
          <span>0 – 100</span>
        </div>
        {[
          { name: "Environmental pillar", value: result.envIndex, width: pillarWidths.env },
          { name: "Social pillar", value: result.socialIndex, width: pillarWidths.social },
        ].map((d) => (
          <div className="dim-item" key={d.name}>
            <div className="dim-label-row">
              <span className="dim-name">{d.name}</span>
              <span className="dim-score-text">{d.value.toFixed(1)}</span>
            </div>
            <div className="dim-bar-track">
              <div className="dim-bar-fill" style={{ width: `${d.width}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="wheel-section">
        <div className="wheel-title">21-criterion wheel</div>
        <div className="wheel-grid">
          {result.wheel.map((w) => (
            <div className="wheel-cell" key={w.id} title={w.band.action}>
              <span
                className="wheel-dot"
                style={{ background: BAND_TO_CSS[w.band.colour] ?? "#000" }}
              />
              <span className="wheel-name">{w.name}</span>
              <span className="wheel-raw">{w.raw > 0 ? `+${w.raw}` : w.raw}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="insights">
        <div className="insight-card strengths">
          <div className="insight-card-title">✅ Top strengths</div>
          {strengths.length === 0 ? (
            <div className="insight-item">
              <span className="insight-bullet">·</span>
              No positive-band criteria yet.
            </div>
          ) : (
            strengths.map((s) => (
              <div key={s.id} className="insight-item">
                <span className="insight-bullet">🌿</span>
                <span>
                  <strong>{s.name}</strong> — raw {s.raw > 0 ? `+${s.raw}` : s.raw},{" "}
                  {s.band.id.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="insight-card improve">
          <div className="insight-card-title">🎯 Priority actions</div>
          {priorities.length === 0 ? (
            <div className="insight-item">
              <span className="insight-bullet">·</span>
              No negative-band criteria — nothing to prioritise.
            </div>
          ) : (
            priorities.map((r) => (
              <div key={r.id} className="insight-item">
                <span className="insight-bullet">→</span>
                <span>
                  <strong>{r.name}</strong> — {r.action}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="results-cta">
        <button
          type="button"
          className="btn-download"
          onClick={() =>
            alert(
              "In v1 this will export a PDF with your 21-criterion breakdown and improvement plan.",
            )
          }
        >
          📥 Download report
        </button>
        <button
          type="button"
          className="btn-partner"
          onClick={() =>
            alert(
              "The Biosphere Partnership registration will open here — coming soon.",
            )
          }
        >
          🤝 Become a partner
        </button>
        <button type="button" className="btn-restart" onClick={onRestart}>
          ← New assessment
        </button>
      </div>
    </div>
  );
}
