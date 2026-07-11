import { useEffect, useMemo, useState } from "react";
import type {
  CriterionAnswer,
  CriterionConfig,
  ScoreResult,
  ScoringConfig,
} from "./types";

const BAND_COLOURS: Record<string, string> = {
  green: "#2e7d32",
  light_green: "#8bc34a",
  grey: "#9e9e9e",
  amber: "#ff9800",
  red: "#d32f2f",
};

export function App() {
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [sector, setSector] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, CriterionAnswer>>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => {
        if (!r.ok) throw new Error(`GET /config → ${r.status}`);
        return r.json() as Promise<ScoringConfig>;
      })
      .then((c) => {
        setConfig(c);
        setSector(Object.keys(c.sectors)[0] ?? "");
      })
      .catch((e) => setConfigError(String(e)));
  }, []);

  const sectorEntries = useMemo(
    () => (config ? Object.entries(config.sectors) : []),
    [config],
  );

  if (configError) {
    return (
      <main className="app">
        <h1>Biosphere Compass — test harness</h1>
        <p className="error">
          Could not load config from backend: {configError}
          <br />
          Is the backend running on <code>http://localhost:3001</code>?
        </p>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="app">
        <p>Loading config…</p>
      </main>
    );
  }

  const setAnswer = (id: string, patch: Partial<CriterionAnswer>) => {
    setAnswers((prev) => {
      const merged = { ...(prev[id] ?? { impact: 0 }), ...patch };
      // Non-zero impact needs permanence + reach defined; unchecked = false, not undefined.
      if (merged.impact !== 0) {
        merged.permanent ??= false;
        merged.beyondPremises ??= false;
      }
      return { ...prev, [id]: merged };
    });
  };

  const bulk = (fn: (c: CriterionConfig) => CriterionAnswer) => {
    setAnswers(Object.fromEntries(config.criteria.map((c) => [c.id, fn(c)])));
  };

  const submit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const r = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, answers }),
      });
      setResult((await r.json()) as ScoreResult);
    } catch (e) {
      setResult({ status: "incomplete", missing: [], errors: [String(e)] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app">
      <header>
        <h1>Biosphere Compass — test harness</h1>
        <p className="muted">
          Config v{config.version}. Backend at <code>/api</code> (proxied to
          <code> :3001</code>).
        </p>
      </header>

      <section className="controls">
        <label>
          Sector
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            {sectorEntries.map(([id, s]) => (
              <option key={id} value={id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="bulk">
          <button type="button" onClick={() => bulk(() => ({ impact: 0 }))}>
            All n/a
          </button>
          <button
            type="button"
            onClick={() => bulk(() => ({ impact: 1, permanent: true, beyondPremises: false }))}
          >
            All slight positive
          </button>
          <button
            type="button"
            onClick={() => bulk(() => ({ impact: 2, permanent: true, beyondPremises: true }))}
          >
            All strong positive
          </button>
          <button type="button" onClick={() => setAnswers({})}>
            Clear
          </button>
        </div>
      </section>

      <section className="criteria">
        {(["environmental", "social"] as const).map((pillar) => (
          <div key={pillar} className="pillar">
            <h2>{pillar}</h2>
            {config.criteria
              .filter((c) => c.pillar === pillar)
              .map((c) => (
                <CriterionCard
                  key={c.id}
                  criterion={c}
                  answer={answers[c.id]}
                  onChange={(patch) => setAnswer(c.id, patch)}
                  permanenceLabel={config.permanenceQuestion.text}
                  reachLabel={config.reachQuestion.text}
                />
              ))}
          </div>
        ))}
      </section>

      <section className="submit">
        <button type="button" onClick={submit} disabled={submitting || !sector}>
          {submitting ? "Scoring…" : "Score"}
        </button>
      </section>

      {result && <ResultView result={result} />}
    </main>
  );
}

function CriterionCard({
  criterion,
  answer,
  onChange,
  permanenceLabel,
  reachLabel,
}: {
  criterion: CriterionConfig;
  answer: CriterionAnswer | undefined;
  onChange: (patch: Partial<CriterionAnswer>) => void;
  permanenceLabel: string;
  reachLabel: string;
}) {
  const impact = answer?.impact;
  const hasImpact = impact !== undefined;
  const nonZero = hasImpact && impact !== 0;

  return (
    <article className="criterion">
      <header>
        <strong>{criterion.name}</strong>
        <span className="muted"> ({criterion.id})</span>
      </header>
      <p className="question">{criterion.question}</p>

      <label>
        Impact
        <select
          value={hasImpact ? String(impact) : ""}
          onChange={(e) => {
            const v = e.target.value === "" ? undefined : Number(e.target.value);
            if (v === undefined) return;
            onChange({ impact: v });
          }}
        >
          <option value="" disabled>
            Choose…
          </option>
          {criterion.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value >= 0 ? `+${o.value}` : o.value} — {o.label}
            </option>
          ))}
        </select>
      </label>

      {nonZero && (
        <>
          <label className="toggle">
            <input
              type="checkbox"
              checked={answer?.permanent ?? false}
              onChange={(e) => onChange({ permanent: e.target.checked })}
            />
            <span title={permanenceLabel}>Embedded in ongoing operations (permanence ×2)</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={answer?.beyondPremises ?? false}
              onChange={(e) => onChange({ beyondPremises: e.target.checked })}
            />
            <span title={reachLabel}>Extends beyond our premises (reach ×2)</span>
          </label>
        </>
      )}

      <label>
        Justification (optional in v1)
        <textarea
          rows={2}
          value={answer?.justification ?? ""}
          onChange={(e) => onChange({ justification: e.target.value })}
        />
      </label>
    </article>
  );
}

function ResultView({ result }: { result: ScoreResult }) {
  if (result.status === "incomplete") {
    return (
      <section className="result">
        <h2>Incomplete</h2>
        {result.errors.length > 0 && (
          <div className="error">
            <p>Errors:</p>
            <ul>
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {result.missing.length > 0 && (
          <>
            <p>Missing answers ({result.missing.length}):</p>
            <ul>
              {result.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="result">
      <h2>
        Headline <span className="headline">{result.headline.toFixed(1)}</span> / 100
      </h2>
      <p>
        Environmental <strong>{result.envIndex.toFixed(1)}</strong> · Social{" "}
        <strong>{result.socialIndex.toFixed(1)}</strong> · Config v{result.configVersion}
      </p>

      <h3>Wheel</h3>
      <ul className="wheel">
        {result.wheel.map((w) => (
          <li key={w.id}>
            <span
              className="dot"
              style={{ background: BAND_COLOURS[w.band.colour] ?? "#000" }}
            />
            <strong>{w.name}</strong>
            <span className="muted">
              {" "}
              raw {w.raw}, {w.band.id}
            </span>
          </li>
        ))}
      </ul>

      {result.recommendations.length > 0 && (
        <>
          <h3>Recommendations (worst first)</h3>
          <ol className="recs">
            {result.recommendations.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong> — <em>{r.band}</em>
                <div className="muted">{r.action}</div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
