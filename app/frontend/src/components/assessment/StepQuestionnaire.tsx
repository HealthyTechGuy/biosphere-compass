import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Leaf, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CriterionAnswer, CriterionConfig, ScoringConfig } from "./types";

type SubStep = "impact" | "permanence" | "reach";
const FADE_MS = 220;

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
  const total = config.criteria.length;

  // Resume where the user left off — on remount, jump to the first
  // criterion that isn't fully answered.
  const [criterionIdx, setCriterionIdx] = useState(() =>
    firstUnansweredIndex(config.criteria, answers),
  );
  const [subStep, setSubStep] = useState<SubStep>(() =>
    initialSubStep(config.criteria[firstUnansweredIndex(config.criteria, answers)], answers),
  );
  const [visible, setVisible] = useState(true);

  const done = criterionIdx >= total;
  const criterion = done ? null : config.criteria[criterionIdx];

  const withFade = useCallback((fn: () => void) => {
    setVisible(false);
    window.setTimeout(() => {
      fn();
      // let the browser paint the new content invisible before we flip it visible
      requestAnimationFrame(() => setVisible(true));
    }, FADE_MS);
  }, []);

  const setAnswerFor = useCallback(
    (id: string, patch: Partial<CriterionAnswer>) => {
      setAnswers({ ...answers, [id]: { ...(answers[id] ?? { impact: 0 }), ...patch } });
    },
    [answers, setAnswers],
  );

  const goForward = useCallback(() => {
    setCriterionIdx((idx) => idx + 1);
    setSubStep("impact");
  }, []);

  const handleImpact = (v: number) => {
    if (!criterion) return;
    setAnswerFor(criterion.id, { impact: v });
    withFade(() => {
      if (v === 0) goForward();
      else setSubStep("permanence");
    });
  };

  const handlePermanence = (v: boolean) => {
    if (!criterion) return;
    setAnswerFor(criterion.id, { permanent: v });
    withFade(() => setSubStep("reach"));
  };

  const handleReach = (v: boolean) => {
    if (!criterion) return;
    setAnswerFor(criterion.id, { beyondPremises: v });
    withFade(goForward);
  };

  const handleBack = () => {
    withFade(() => {
      if (subStep === "reach") return setSubStep("permanence");
      if (subStep === "permanence") return setSubStep("impact");
      // subStep === "impact"
      if (criterionIdx === 0) return onBack();
      const prevIdx = criterionIdx - 1;
      const prev = answers[config.criteria[prevIdx].id];
      setCriterionIdx(prevIdx);
      setSubStep(prev?.impact === 0 ? "impact" : "reach");
    });
  };

  const progress =
    (Math.min(criterionIdx, total) + progressWithin(subStep, done)) / total;

  return (
    <div className="space-y-6">
      <ProgressHeader
        criterionIdx={done ? total : criterionIdx}
        total={total}
        subStep={subStep}
        progress={progress}
        done={done}
      />

      <div
        className={cn(
          "transition-all ease-out",
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        {done ? (
          <ReadyCard onAnalyse={onNext} />
        ) : (
          <QuestionCard
            criterion={criterion!}
            subStep={subStep}
            config={config}
            onImpact={handleImpact}
            onPermanence={handlePermanence}
            onReach={handleReach}
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Button>
        {!done && (
          <button
            type="button"
            onClick={() =>
              withFade(() => {
                if (!criterion) return;
                // Skip this criterion as n/a — records impact=0 and advances.
                setAnswerFor(criterion.id, { impact: 0 });
                goForward();
              })
            }
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Skip (n/a)
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressHeader({
  criterionIdx,
  total,
  subStep,
  progress,
  done,
}: {
  criterionIdx: number;
  total: number;
  subStep: SubStep;
  progress: number;
  done: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <span>
          {done
            ? `Complete — ${total} of ${total}`
            : `Question ${criterionIdx + 1} of ${total}`}
        </span>
        {!done && (
          <span>
            {subStep === "impact"
              ? "Impact"
              : subStep === "permanence"
                ? "Permanence"
                : "Reach"}
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

function QuestionCard({
  criterion,
  subStep,
  config,
  onImpact,
  onPermanence,
  onReach,
}: {
  criterion: CriterionConfig;
  subStep: SubStep;
  config: ScoringConfig;
  onImpact: (v: number) => void;
  onPermanence: (v: boolean) => void;
  onReach: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-[440px] flex-col rounded-3xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
        {criterion.pillar === "environmental" ? (
          <Leaf className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Users className="h-3.5 w-3.5" aria-hidden />
        )}
        {criterion.pillar === "environmental" ? "Environmental" : "Social"} ·{" "}
        {criterion.name}
      </div>

      <div className="flex flex-1 flex-col justify-center">
        {subStep === "impact" && (
          <ImpactBody criterion={criterion} onSelect={onImpact} />
        )}
        {subStep === "permanence" && (
          <PermanenceBody
            criterionName={criterion.name}
            question={config.permanenceQuestion.text}
            onSelect={onPermanence}
          />
        )}
        {subStep === "reach" && (
          <ReachBody
            criterionName={criterion.name}
            question={config.reachQuestion.text}
            onSelect={onReach}
          />
        )}
      </div>
    </div>
  );
}

function ImpactBody({
  criterion,
  onSelect,
}: {
  criterion: CriterionConfig;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="mt-2">
      <h3 className="font-display text-xl font-semibold">{criterion.question}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick the option that best describes your business today.
      </p>
      <div className="mt-3 grid gap-1.5">
        {criterion.options.map((o) => (
          <OptionButton
            key={o.value}
            label={o.label}
            onClick={() => onSelect(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

function PermanenceBody({
  criterionName,
  question,
  onSelect,
}: {
  criterionName: string;
  question: string;
  onSelect: (v: boolean) => void;
}) {
  return (
    <div className="mt-2">
      <h3 className="font-display text-xl font-semibold">
        Is your {criterionName.toLowerCase()} impact embedded?
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{question}</p>
      <div className="mt-3 grid gap-1.5">
        <OptionButton
          label="Embedded in ongoing operations"
          onClick={() => onSelect(true)}
        />
        <OptionButton
          label="One-off or occasional"
          onClick={() => onSelect(false)}
        />
      </div>
    </div>
  );
}

function ReachBody({
  criterionName,
  question,
  onSelect,
}: {
  criterionName: string;
  question: string;
  onSelect: (v: boolean) => void;
}) {
  return (
    <div className="mt-2">
      <h3 className="font-display text-xl font-semibold">
        How far does your {criterionName.toLowerCase()} impact reach?
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{question}</p>
      <div className="mt-3 grid gap-1.5">
        <OptionButton
          label="Extends beyond our premises"
          subtitle="Into the wider biosphere or community"
          onClick={() => onSelect(true)}
        />
        <OptionButton
          label="Limited to our premises"
          subtitle="Effects stay within our operations"
          onClick={() => onSelect(false)}
        />
      </div>
    </div>
  );
}

function OptionButton({
  label,
  subtitle,
  onClick,
}: {
  label: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-left transition-all hover:-translate-y-[1px] hover:border-primary hover:bg-primary/5 hover:shadow-sm"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {subtitle && (
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        )}
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  );
}

function ReadyCard({ onAnalyse }: { onAnalyse: () => void }) {
  return (
    <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center sm:p-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-2xl font-semibold">
        All 21 criteria answered
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Ready to see your sector-weighted Biosphere Beacons score and the
        priority-action list?
      </p>
      <Button size="lg" onClick={onAnalyse} className="mt-6 gap-2">
        Analyse my business <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function firstUnansweredIndex(
  criteria: CriterionConfig[],
  answers: Record<string, CriterionAnswer>,
): number {
  for (let i = 0; i < criteria.length; i++) {
    const a = answers[criteria[i].id];
    if (!a) return i;
    if (a.impact !== 0 && (a.permanent === undefined || a.beyondPremises === undefined)) {
      return i;
    }
  }
  return criteria.length;
}

function initialSubStep(
  criterion: CriterionConfig | undefined,
  answers: Record<string, CriterionAnswer>,
): SubStep {
  if (!criterion) return "impact";
  const a = answers[criterion.id];
  if (!a) return "impact";
  if (a.impact === 0) return "impact";
  if (a.permanent === undefined) return "permanence";
  return "reach";
}

function progressWithin(subStep: SubStep, done: boolean): number {
  if (done) return 0;
  if (subStep === "impact") return 0;
  if (subStep === "permanence") return 1 / 3;
  return 2 / 3;
}

