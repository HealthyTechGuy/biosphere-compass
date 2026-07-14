import { useState } from "react";
import { ArrowRight, Building2, Globe, Linkedin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BusinessDetails, BusinessSize } from "./types";

const SIZES: { value: Exclude<BusinessSize, "">; label: string; hint: string }[] = [
  { value: "small", label: "Small", hint: "1–49 employees" },
  { value: "medium", label: "Medium", hint: "50–249 employees" },
  { value: "large", label: "Large", hint: "250+ employees" },
];

export function StepBusiness({
  business,
  setBusiness,
  onNext,
}: {
  business: BusinessDetails;
  setBusiness: (b: BusinessDetails) => void;
  onNext: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const nameOk = business.name.trim().length > 0;
  const sizeOk = business.size !== "";
  const canContinue = nameOk && sizeOk;

  const set = <K extends keyof BusinessDetails>(k: K, v: BusinessDetails[K]) =>
    setBusiness({ ...business, [k]: v });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-semibold">
          Tell us about your business
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          A few details so we can tailor and label your Compass report. Website and
          LinkedIn are optional but help us contextualise your evidence.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="biz-name"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            <Building2 className="h-3.5 w-3.5" aria-hidden /> Business name
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="biz-name"
            value={business.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Harbour Lights Café"
            aria-invalid={touched && !nameOk}
          />
          {touched && !nameOk && (
            <p className="text-xs text-destructive">Please enter your business name.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="biz-website"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden /> Website
            </Label>
            <Input
              id="biz-website"
              type="url"
              value={business.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://yourbusiness.im"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="biz-linkedin"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              <Linkedin className="h-3.5 w-3.5" aria-hidden /> LinkedIn profile
            </Label>
            <Input
              id="biz-linkedin"
              type="url"
              value={business.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
              placeholder="https://linkedin.com/company/…"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden /> Business size
            <span className="text-destructive">*</span>
          </Label>
          <div
            className="grid gap-2 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Business size"
          >
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={business.size === s.value}
                onClick={() => set("size", s.value)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-colors",
                  business.size === s.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-accent",
                )}
              >
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>
              </button>
            ))}
          </div>
          {touched && !sizeOk && (
            <p className="text-xs text-destructive">Please pick a size band.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          onClick={() => {
            setTouched(true);
            if (canContinue) onNext();
          }}
          disabled={touched && !canContinue}
          className="gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
