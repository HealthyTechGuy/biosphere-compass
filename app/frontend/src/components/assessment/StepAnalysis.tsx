import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Questionnaire, ScoreResult } from "./types";

const STEPS = [
  { id: "ls1", label: "Reading your business context" },
  { id: "ls2", label: "Applying sector-specific weights" },
  { id: "ls3", label: "Scoring 21 Biosphere criteria" },
  { id: "ls4", label: "Building your Compass report" },
];

export function StepAnalysis({
  businessName,
  questionnaire,
  onDone,
  onBack,
}: {
  businessName: string;
  questionnaire: Questionnaire;
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
        timers.push(window.setTimeout(tick, 900));
      }
    };
    timers.push(window.setTimeout(tick, 900));

    const started = performance.now();
    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionnaire),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`POST /score → ${r.status}`);
        return r.json() as Promise<ScoreResult>;
      })
      .then((r) => {
        // Keep the anim visible for a beat even if the request is fast.
        const wait = Math.max(0, 2500 - (performance.now() - started));
        window.setTimeout(() => onDone(r), wait);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [questionnaire, onDone]);

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <Compass className="h-8 w-8 text-primary" aria-hidden />
      </div>
      <div>
        <h3 className="font-display text-xl font-semibold">
          {error ? "Something went wrong" : "Analysing your business"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error ? error : businessName ? `Analysing ${businessName}…` : "Analysing…"}
        </p>
      </div>
      {!error && (
        <ul className="w-full max-w-xs space-y-1 text-left text-sm">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-2 border-b border-border py-1.5",
                i < activeIdx && "text-primary",
                i === activeIdx && "font-semibold text-primary",
                i > activeIdx && "text-muted-foreground",
              )}
            >
              {i < activeIdx ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <span className="inline-block h-3.5 w-3.5 rounded-full border border-current" />
              )}
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to assessment
        </Button>
      )}
    </div>
  );
}
