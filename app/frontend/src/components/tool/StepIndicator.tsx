import { Fragment } from "react";

const LABELS = ["About you", "Assessment", "Analysis", "Results"] as const;

export function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="steps">
      {LABELS.map((label, i) => {
        const n = i + 1;
        const cls = n < step ? "step done" : n === step ? "step active" : "step";
        return (
          <Fragment key={label}>
            <div className={cls}>
              <div className="step-num">{n < step ? "✓" : n}</div>
              <div className="step-label">{label}</div>
            </div>
            {n < 4 && <div className={n < step ? "step-line done" : "step-line"} />}
          </Fragment>
        );
      })}
    </div>
  );
}
