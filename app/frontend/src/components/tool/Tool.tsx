import { useCallback, useMemo, useState } from "react";
import type {
  CriterionAnswer,
  Questionnaire,
  ScoreResult,
  ScoringConfig,
} from "../../types";
import { StepIndicator } from "./StepIndicator";
import { StepAbout } from "./StepAbout";
import { StepInputs } from "./StepInputs";
import { StepAnalysis } from "./StepAnalysis";
import { StepResults } from "./StepResults";

export interface BusinessInfo {
  name: string;
  size: string;
  sector: string;
  email: string;
  url: string;
}

const emptyBusiness = (defaultSector: string): BusinessInfo => ({
  name: "",
  size: "",
  sector: defaultSector,
  email: "",
  url: "",
});

export function Tool({ config }: { config: ScoringConfig }) {
  const defaultSector = useMemo(() => Object.keys(config.sectors)[0] ?? "", [config]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [business, setBusiness] = useState<BusinessInfo>(() => emptyBusiness(defaultSector));
  const [files, setFiles] = useState<File[]>([]);
  const [answers, setAnswers] = useState<Record<string, CriterionAnswer>>({});
  const [result, setResult] = useState<ScoreResult | null>(null);

  const restart = useCallback(() => {
    setStep(1);
    setBusiness(emptyBusiness(defaultSector));
    setFiles([]);
    setAnswers({});
    setResult(null);
    document.getElementById("tool")?.scrollIntoView({ behavior: "smooth" });
  }, [defaultSector]);

  const analyse = useCallback(
    async (q: Questionnaire): Promise<ScoreResult> => {
      const r = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q),
      });
      if (!r.ok) throw new Error(`POST /score → ${r.status}`);
      return (await r.json()) as ScoreResult;
    },
    [],
  );

  return (
    <section id="tool">
      <div className="tool-container">
        <div className="tool-header">
          <h2>Start your Biosphere assessment</h2>
          <p>
            Takes approximately 5 minutes. Your answers are scored against the
            Isle of Man CIA-derived methodology, weighted for your sector.
          </p>
        </div>

        <StepIndicator step={step} />

        {step === 1 && (
          <StepAbout
            config={config}
            business={business}
            setBusiness={setBusiness}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepInputs
            config={config}
            business={business}
            setBusiness={setBusiness}
            files={files}
            setFiles={setFiles}
            answers={answers}
            setAnswers={setAnswers}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepAnalysis
            businessName={business.name}
            questionnaire={{ sector: business.sector, answers }}
            analyse={analyse}
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
            business={business}
            result={result}
            onRestart={restart}
          />
        )}
      </div>
    </section>
  );
}
