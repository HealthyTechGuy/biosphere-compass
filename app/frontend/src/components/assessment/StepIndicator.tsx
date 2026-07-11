import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

const LABELS = ["Sector", "Assessment", "Analysis", "Results"] as const;

export function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {LABELS.map((label, i) => {
        const n = i + 1;
        const isDone = n < step;
        const isActive = n === step;
        return (
          <Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  !isDone && !isActive && "border-border bg-card text-muted-foreground",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? <Check className="h-4 w-4" aria-hidden /> : n}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap",
                  (isActive || isDone) ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {n < 4 && (
              <div
                className={cn(
                  "mx-1 mb-6 h-0.5 min-w-8 flex-1 transition-colors",
                  isDone ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
