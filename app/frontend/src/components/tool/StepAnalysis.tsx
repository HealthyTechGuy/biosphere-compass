import { useEffect, useRef, useState } from "react";
import type { Questionnaire, ScoreResult } from "../../types";

const STEPS = [
  { id: "ls1", icon: "🌐", label: "Reading your business context" },
  { id: "ls2", icon: "📄", label: "Reviewing uploaded documents" },
  { id: "ls3", icon: "🔍", label: "Scoring 21 Biosphere criteria" },
  { id: "ls4", icon: "⚖️", label: "Applying sector weights" },
  { id: "ls5", icon: "✍️", label: "Generating your Compass report" },
];

export function StepAnalysis({
  businessName,
  questionnaire,
  analyse,
  onDone,
  onBack,
}: {
  businessName: string;
  questionnaire: Questionnaire;
  analyse: (q: Questionnaire) => Promise<ScoreResult>;
  onDone: (r: ScoreResult) => void;
  onBack: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const timers: number[] = [];
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < STEPS.length) {
        setActiveIdx(i);
        timers.push(window.setTimeout(tick, i === 3 ? 1400 : 900));
      }
    };
    timers.push(window.setTimeout(tick, 900));

    const started = performance.now();
    analyse(questionnaire)
      .then((r) => {
        // Ensure the loading animation shows for a beat even if the request is fast.
        const wait = Math.max(0, 3000 - (performance.now() - started));
        window.setTimeout(() => onDone(r), wait);
      })
      .catch((e) => setError(String(e)));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [analyse, questionnaire, onDone]);

  return (
    <div className="card">
      <div className="loading-screen">
        <div className="loading-compass">
          <div className="lc-ring" />
          <div className="lc-ring-2" />
          <div className="lc-dot">🧭</div>
        </div>
        <div className="loading-title">
          {error ? "Something went wrong" : "Analysing your business"}
        </div>
        <div className="loading-sub">
          {error ? error : businessName ? `Analysing ${businessName}…` : "Analysing…"}
        </div>
        {!error && (
          <ul className="loading-steps">
            {STEPS.map((s, i) => (
              <li
                key={s.id}
                className={i < activeIdx ? "done" : i === activeIdx ? "active" : ""}
              >
                <span className="ls-icon">{i < activeIdx ? "✓" : s.icon}</span>
                {s.label}
              </li>
            ))}
          </ul>
        )}
        {error && (
          <button
            type="button"
            className="btn-restart"
            style={{ marginTop: "1.5rem" }}
            onClick={onBack}
          >
            ← Back to assessment
          </button>
        )}
      </div>
    </div>
  );
}
