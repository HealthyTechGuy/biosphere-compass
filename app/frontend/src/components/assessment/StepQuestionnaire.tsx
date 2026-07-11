import { useMemo } from "react";
import { ArrowLeft, ArrowRight, Leaf, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  CriterionAnswer,
  CriterionConfig,
  ScoringConfig,
} from "./types";

export function StepQuestionnaire({
  config,
  answers,
  setAnswers,
  onBack,
  onNext,
}: {
  config: ScoringConfig;
  answers: Record<string, CriterionAnswer>;
  setAnswers: (a: Record<string, CriterionAnswer>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const answeredCount = useMemo(
    () => config.criteria.filter((c) => answers[c.id] !== undefined).length,
    [config.criteria, answers],
  );

  const setAnswer = (id: string, patch: Partial<CriterionAnswer>) => {
    const prev = answers[id] ?? { impact: 0 };
    const merged: CriterionAnswer = { ...prev, ...patch };
    // Non-zero impact needs permanence + reach defined; unchecked = false, not undefined.
    if (merged.impact !== 0) {
      merged.permanent ??= false;
      merged.beyondPremises ??= false;
    }
    setAnswers({ ...answers, [id]: merged });
  };

  const bulkFill = (fn: (c: CriterionConfig) => CriterionAnswer) => {
    setAnswers(Object.fromEntries(config.criteria.map((c) => [c.id, fn(c)])));
  };

  const done = answeredCount === config.criteria.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold">
            Rate your impact on 21 criteria
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick an impact for every criterion. Add permanence and reach only when
            the impact isn't neutral. Justification is optional in v1.
          </p>
        </div>
        <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          {answeredCount} / {config.criteria.length} answered
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => bulkFill(() => ({ impact: 0 }))}>
          All n/a
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            bulkFill(() => ({ impact: 1, permanent: true, beyondPremises: false }))
          }
        >
          All slight positive
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            bulkFill(() => ({ impact: 2, permanent: true, beyondPremises: true }))
          }
        >
          All strong positive
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAnswers({})}>
          Clear
        </Button>
      </div>

      {(["environmental", "social"] as const).map((pillar) => (
        <section key={pillar} className="space-y-4">
          <h4 className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-primary">
            {pillar === "environmental" ? (
              <Leaf className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Users className="h-3.5 w-3.5" aria-hidden />
            )}
            {pillar === "environmental" ? "Environmental" : "Social"}
          </h4>
          <div className="space-y-3">
            {config.criteria
              .filter((c) => c.pillar === pillar)
              .map((c) => (
                <CriterionRow
                  key={c.id}
                  criterion={c}
                  answer={answers[c.id]}
                  onChange={(patch) => setAnswer(c.id, patch)}
                  permanenceLabel={config.permanenceQuestion.text}
                  reachLabel={config.reachQuestion.text}
                />
              ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={!done}
          className="gap-2"
        >
          Analyse my business <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function CriterionRow({
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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <p className="text-sm font-semibold">{criterion.name}</p>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {criterion.id}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{criterion.question}</p>

      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Impact">
        {criterion.options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={impact === o.value}
            onClick={() => onChange({ impact: o.value })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              impact === o.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {impactLabel(o.value)} · {o.label}
          </button>
        ))}
      </div>

      {nonZero && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SubToggle
            label="Permanence"
            title={permanenceLabel}
            value={answer?.permanent}
            options={[
              { value: true, label: "Embedded ×2" },
              { value: false, label: "One-off ×1" },
            ]}
            onChange={(v) => onChange({ permanent: v })}
          />
          <SubToggle
            label="Reach"
            title={reachLabel}
            value={answer?.beyondPremises}
            options={[
              { value: true, label: "Beyond premises ×2" },
              { value: false, label: "Premises only ×1" },
            ]}
            onChange={(v) => onChange({ beyondPremises: v })}
          />
        </div>
      )}

      <Textarea
        rows={2}
        placeholder="Justification — evidence, notes (optional)"
        value={answer?.justification ?? ""}
        onChange={(e) => onChange({ justification: e.target.value })}
        className="mt-3 min-h-16 resize-y"
      />
    </div>
  );
}

function SubToggle({
  label,
  title,
  value,
  options,
  onChange,
}: {
  label: string;
  title: string;
  value: boolean | undefined;
  options: { value: boolean; label: string }[];
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground" title={title}>
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              value === o.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
