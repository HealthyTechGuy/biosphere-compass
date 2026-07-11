import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StepIndicator } from "./StepIndicator";
import { StepSector } from "./StepSector";
import { StepQuestionnaire } from "./StepQuestionnaire";
import { StepAnalysis } from "./StepAnalysis";
import { StepResults } from "./StepResults";
import type { CriterionAnswer, ScoreResult, ScoringConfig } from "./types";

async function fetchConfig(): Promise<ScoringConfig> {
  const r = await fetch("/api/config");
  if (!r.ok) throw new Error(`GET /api/config → ${r.status}`);
  return (await r.json()) as ScoringConfig;
}

export function BiosphereAssessment({ businessName }: { businessName: string }) {
  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["scoring-config"],
    queryFn: fetchConfig,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [sector, setSector] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, CriterionAnswer>>({});
  const [result, setResult] = useState<ScoreResult | null>(null);

  const restart = useCallback(() => {
    setStep(1);
    setSector("");
    setAnswers({});
    setResult(null);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Loading Biosphere Compass config…
      </div>
    );
  }
  if (error || !config) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-semibold text-destructive">Backend unavailable</p>
        <p className="mt-1 text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <p className="mt-2 text-muted-foreground">
          The scoring engine should be running on{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            http://localhost:3001
          </code>
          . From <code className="rounded bg-muted px-1.5 py-0.5 text-xs">app/</code>{" "}
          run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">make run</code>{" "}
          to start both services.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {step === 1 && (
        <StepSector
          config={config}
          sector={sector}
          setSector={setSector}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepQuestionnaire
          config={config}
          answers={answers}
          setAnswers={setAnswers}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <StepAnalysis
          businessName={businessName}
          questionnaire={{ sector, answers }}
          onDone={(r) => {
            setResult(r);
            setStep(4);
          }}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && result && (
        <StepResults
          config={config}
          sector={sector}
          businessName={businessName}
          result={result}
          onRestart={restart}
        />
      )}
    </div>
  );
}
