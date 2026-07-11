import { useMemo, useState } from "react";
import type {
  CriterionAnswer,
  CriterionConfig,
  ScoringConfig,
} from "../../types";
import type { BusinessInfo } from "./Tool";

export function StepInputs({
  config,
  business,
  setBusiness,
  files,
  setFiles,
  answers,
  setAnswers,
  onBack,
  onNext,
}: {
  config: ScoringConfig;
  business: BusinessInfo;
  setBusiness: (b: BusinessInfo) => void;
  files: File[];
  setFiles: (f: File[]) => void;
  answers: Record<string, CriterionAnswer>;
  setAnswers: (a: Record<string, CriterionAnswer>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [urlTouched, setUrlTouched] = useState(false);
  const [tryNext, setTryNext] = useState(false);

  const urlOk = business.url.trim().length > 0;
  const missingAnswers = useMemo(() => {
    const missing: string[] = [];
    for (const c of config.criteria) {
      const a = answers[c.id];
      if (!a) missing.push(c.id);
    }
    return missing;
  }, [config.criteria, answers]);

  const canContinue = urlOk && missingAnswers.length === 0;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!next.find((x) => x.name === f.name)) next.push(f);
    }
    setFiles(next);
  };

  const setAnswer = (id: string, patch: Partial<CriterionAnswer>) => {
    const prev = answers[id] ?? { impact: 0 };
    const merged: CriterionAnswer = { ...prev, ...patch };
    if (merged.impact !== 0) {
      merged.permanent ??= false;
      merged.beyondPremises ??= false;
    }
    setAnswers({ ...answers, [id]: merged });
  };

  const bulkFill = (fn: (c: CriterionConfig) => CriterionAnswer) => {
    setAnswers(Object.fromEntries(config.criteria.map((c) => [c.id, fn(c)])));
  };

  return (
    <div className="card">
      <div className="field-group">
        <label>
          Website URL <span>(context for your report)</span>
        </label>
        <div className="url-input-wrap">
          <span className="url-prefix">🌐</span>
          <input
            type="url"
            value={business.url}
            onChange={(e) => setBusiness({ ...business, url: e.target.value })}
            onBlur={() => setUrlTouched(true)}
            placeholder="https://www.yourbusiness.im"
          />
        </div>
        {(urlTouched || tryNext) && !urlOk && (
          <div className="error-msg">Please enter a URL</div>
        )}
      </div>

      <div className="field-group">
        <label>
          Supporting documents{" "}
          <span>(optional — sustainability reports, policies)</span>
        </label>
        <UploadZone onAdd={addFiles} />
        {files.length > 0 && (
          <div className="file-list">
            {files.map((f, i) => (
              <div className="file-item" key={f.name}>
                <span className="file-item-icon">
                  {f.name.endsWith(".pdf")
                    ? "📄"
                    : /\.xlsx?$/.test(f.name)
                      ? "📊"
                      : "📝"}
                </span>
                <span className="file-item-name">{f.name}</span>
                <button
                  type="button"
                  className="file-remove"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="questionnaire">
        <div className="q-bulk">
          <button type="button" onClick={() => bulkFill(() => ({ impact: 0 }))}>
            All n/a
          </button>
          <button
            type="button"
            onClick={() =>
              bulkFill(() => ({ impact: 1, permanent: true, beyondPremises: false }))
            }
          >
            All slight positive
          </button>
          <button
            type="button"
            onClick={() =>
              bulkFill(() => ({ impact: 2, permanent: true, beyondPremises: true }))
            }
          >
            All strong positive
          </button>
          <button type="button" onClick={() => setAnswers({})}>
            Clear
          </button>
        </div>

        {(["environmental", "social"] as const).map((pillar) => (
          <div key={pillar}>
            <div className="q-section-title">
              {pillar === "environmental" ? "Environmental" : "Social"}
            </div>
            {config.criteria
              .filter((c) => c.pillar === pillar)
              .map((c) => (
                <CriterionItem
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
      </div>

      {tryNext && missingAnswers.length > 0 && (
        <div className="error-msg" style={{ marginTop: "1rem" }}>
          {missingAnswers.length} criterion
          {missingAnswers.length === 1 ? "" : "a"} still unanswered.
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button type="button" className="btn-restart" onClick={onBack}>
          ← Back
        </button>
        <button
          type="button"
          className="analyse-btn"
          style={{ marginTop: 0, flex: 1 }}
          onClick={() => {
            setTryNext(true);
            setUrlTouched(true);
            if (canContinue) onNext();
          }}
        >
          Analyse my business <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

function UploadZone({ onAdd }: { onAdd: (list: FileList | null) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={drag ? "upload-zone drag" : "upload-zone"}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onAdd(e.dataTransfer.files);
      }}
    >
      <input
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
        onChange={(e) => onAdd(e.target.files)}
      />
      <span className="upload-icon">📎</span>
      <div className="upload-text">
        <strong>Click to upload</strong> or drag and drop
      </div>
      <div className="upload-hint">PDF, DOCX, XLSX up to 20MB each</div>
    </div>
  );
}

function CriterionItem({
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
  const nonZero = impact !== undefined && impact !== 0;
  const impactLabel = (v: number) => (v > 0 ? `+${v}` : String(v));

  return (
    <div className="q-item">
      <div className="q-item-head">
        <strong>{criterion.name}</strong>
        <span className="q-id">{criterion.id}</span>
      </div>
      <p className="q-question">{criterion.question}</p>

      <div className="q-options">
        {criterion.options.map((o) => (
          <button
            type="button"
            key={o.value}
            className={impact === o.value ? "q-opt selected" : "q-opt"}
            onClick={() => onChange({ impact: o.value })}
          >
            {impactLabel(o.value)} · {o.label}
          </button>
        ))}
      </div>

      {nonZero && (
        <>
          <div className="q-sub">
            <span className="q-sub-label" title={permanenceLabel}>
              Permanence
            </span>
            <div className="q-options">
              <button
                type="button"
                className={answer?.permanent === true ? "q-opt selected" : "q-opt"}
                onClick={() => onChange({ permanent: true })}
              >
                Embedded ×2
              </button>
              <button
                type="button"
                className={answer?.permanent === false ? "q-opt selected" : "q-opt"}
                onClick={() => onChange({ permanent: false })}
              >
                One-off ×1
              </button>
            </div>
          </div>

          <div className="q-sub">
            <span className="q-sub-label" title={reachLabel}>
              Reach
            </span>
            <div className="q-options">
              <button
                type="button"
                className={
                  answer?.beyondPremises === true ? "q-opt selected" : "q-opt"
                }
                onClick={() => onChange({ beyondPremises: true })}
              >
                Beyond premises ×2
              </button>
              <button
                type="button"
                className={
                  answer?.beyondPremises === false ? "q-opt selected" : "q-opt"
                }
                onClick={() => onChange({ beyondPremises: false })}
              >
                Premises only ×1
              </button>
            </div>
          </div>
        </>
      )}

      <div className="q-just">
        <textarea
          rows={2}
          placeholder="Justification (optional in v1) — evidence, notes"
          value={answer?.justification ?? ""}
          onChange={(e) => onChange({ justification: e.target.value })}
        />
      </div>
    </div>
  );
}
