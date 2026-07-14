import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StepIndicator } from "./StepIndicator";
import { StepBusiness } from "./StepBusiness";
import { StepSector } from "./StepSector";
import { StepQuestionnaire } from "./StepQuestionnaire";
import { StepAnalysis } from "./StepAnalysis";
import { StepResults } from "./StepResults";
import type {
  BusinessDetails,
  CriterionAnswer,
  ScoreResult,
  ScoringConfig,
} from "./types";

async function fetchConfig(): Promise<ScoringConfig> {
  const r = await fetch("/api/config");
  if (!r.ok) throw new Error(`GET /api/config → ${r.status}`);
  return (await r.json()) as ScoringConfig;
}

const emptyBusiness = (): BusinessDetails => ({
  name: "",
  website: "",
  linkedin: "",
  size: "",
});

export function BiosphereAssessment({
  initialBusiness,
}: {
  initialBusiness?: Partial<BusinessDetails>;
} = {}) {
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

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [business, setBusiness] = useState<BusinessDetails>(() => ({
    ...emptyBusiness(),
    ...initialBusiness,
  }));
  const [sector, setSector] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, CriterionAnswer>>({});
  const [result, setResult] = useState<ScoreResult | null>(null);

  const restart = useCallback(() => {
    setStep(1);
    setBusiness({ ...emptyBusiness(), ...initialBusiness });
    setSector("");
    setAnswers({});
    setResult(null);
  }, [initialBusiness]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Loading Biosphere Beacons config…
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
        <StepBusiness
          business={business}
          setBusiness={setBusiness}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepSector
          config={config}
          sector={sector}
          setSector={setSector}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <StepQuestionnaire
          config={config}
          answers={answers}
          setAnswers={setAnswers}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <StepAnalysis
          businessName={business.name}
          questionnaire={{ sector, answers }}
          onDone={(r) => {
            setResult(r);
            setStep(5);
          }}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && result && (
        <StepResults
          config={config}
          sector={sector}
          business={business}
          result={result}
          onRestart={restart}
        />
      )}
    </div>
  );
}
