import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ScoringConfig } from "./types";

export function StepSector({
  config,
  sector,
  setSector,
  onBack,
  onNext,
}: {
  config: ScoringConfig;
  sector: string;
  setSector: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const entries = Object.entries(config.sectors);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-semibold">
          Which sector best describes your business?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sector weights decide which of the 21 criteria matter most for your kind
          of business — hospitality is weighted heavily on Waste and Food, agriculture
          on Land Use and Biodiversity.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Sector">
        {entries.map(([id, s]) => (
          <button
            key={id}
            role="radio"
            aria-checked={sector === id}
            onClick={() => setSector(id)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              sector === id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            <p className="font-semibold">{s.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{id}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={!sector}
          className="gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
