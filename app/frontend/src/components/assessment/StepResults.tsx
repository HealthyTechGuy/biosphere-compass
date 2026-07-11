import { useEffect, useState } from "react";
import { ArrowLeft, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/score/ScoreRing";
import { cn } from "@/lib/utils";
import type { ScoreResult, ScoringConfig } from "./types";

const BAND_COLOUR: Record<string, string> = {
  green: "#16a34a",
  light_green: "#84cc16",
  grey: "#94a3b8",
  amber: "#f59e0b",
  red: "#dc2626",
};

export function StepResults({
  config,
  sector,
  businessName,
  result,
  onRestart,
}: {
  config: ScoringConfig;
  sector: string;
  businessName: string;
  result: ScoreResult;
  onRestart: () => void;
}) {
  if (result.status === "incomplete") {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-display text-xl font-semibold">Assessment incomplete</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.errors.length > 0
              ? "The scoring engine returned errors."
              : `${result.missing.length} answers still required.`}
          </p>
        </div>
        {result.errors.length > 0 && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-semibold">Errors</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {result.missing.length > 0 && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">Missing</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              {result.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden /> New assessment
        </Button>
      </div>
    );
  }
  return (
    <CompleteResults
      config={config}
      sector={sector}
      businessName={businessName}
      result={result}
      onRestart={onRestart}
    />
  );
}

function CompleteResults({
  config,
  sector,
  businessName,
  result,
  onRestart,
}: {
  config: ScoringConfig;
  sector: string;
  businessName: string;
  result: Extract<ScoreResult, { status: "complete" }>;
  onRestart: () => void;
}) {
  const [pillarWidths, setPillarWidths] = useState({ env: 0, social: 0 });

  useEffect(() => {
    const t = window.setTimeout(
      () => setPillarWidths({ env: result.envIndex, social: result.socialIndex }),
      250,
    );
    return () => window.clearTimeout(t);
  }, [result.envIndex, result.socialIndex]);

  const strengths = [...result.wheel]
    .filter((w) => w.raw > 0)
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 3);
  const priorities = result.recommendations.slice(0, 3);
  const sectorName = config.sectors[sector]?.name ?? sector;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-8 border-b border-border pb-6">
        <ScoreRing score={result.headline} size={140} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {businessName || "Compass report"}
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold">
            Biosphere Compass score
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {sectorName} · Config v{result.configVersion}
          </p>
        </div>
      </div>

      <section aria-labelledby="pillar-heading">
        <div className="flex items-center justify-between">
          <p id="pillar-heading" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Pillar scores
          </p>
          <p className="text-xs text-muted-foreground">0 – 100</p>
        </div>
        <div className="mt-3 space-y-3">
          {[
            { name: "Environmental pillar", value: result.envIndex, width: pillarWidths.env },
            { name: "Social pillar", value: result.socialIndex, width: pillarWidths.social },
          ].map((d) => (
            <div key={d.name}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-medium">{d.name}</span>
                <span className="text-sm font-semibold text-primary">
                  {d.value.toFixed(1)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-1000 ease-out"
                  style={{ width: `${d.width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="wheel-heading">
        <p id="wheel-heading" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          21-criterion wheel
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {result.wheel.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
              title={w.band.action}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: BAND_COLOUR[w.band.colour] ?? "#000" }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{w.name}</span>
              <span className="tabular-nums font-semibold text-muted-foreground">
                {w.raw > 0 ? `+${w.raw}` : w.raw}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Top strengths
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {strengths.length === 0 ? (
              <p className="text-muted-foreground">No positive-band criteria yet.</p>
            ) : (
              strengths.map((s) => (
                <div key={s.id}>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    raw {s.raw > 0 ? `+${s.raw}` : s.raw} · {s.band.id.replace("_", " ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={cn(
          "rounded-2xl border p-5",
          priorities.length > 0
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-border bg-muted/40",
        )}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
            <Target className="h-3.5 w-3.5" aria-hidden /> Priority actions
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {priorities.length === 0 ? (
              <p className="text-muted-foreground">
                No negative-band criteria — nothing to prioritise.
              </p>
            ) : (
              priorities.map((r) => (
                <div key={r.id}>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.action}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden /> New assessment
        </Button>
      </div>
    </div>
  );
}
