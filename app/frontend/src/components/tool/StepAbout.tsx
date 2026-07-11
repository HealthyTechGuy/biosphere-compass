import { useState } from "react";
import type { ScoringConfig } from "../../types";
import type { BusinessInfo } from "./Tool";

export function StepAbout({
  config,
  business,
  setBusiness,
  onNext,
}: {
  config: ScoringConfig;
  business: BusinessInfo;
  setBusiness: (b: BusinessInfo) => void;
  onNext: () => void;
}) {
  const [touched, setTouched] = useState(false);

  const err = {
    name: !business.name.trim(),
    size: !business.size,
    sector: !business.sector,
    email: !business.email.trim() || !business.email.includes("@"),
  };
  const invalid = err.name || err.size || err.sector || err.email;

  const set = <K extends keyof BusinessInfo>(k: K, v: BusinessInfo[K]) =>
    setBusiness({ ...business, [k]: v });

  const submit = () => {
    setTouched(true);
    if (!invalid) onNext();
  };

  return (
    <div className="card">
      <div className="field-group">
        <label>Business name</label>
        <input
          type="text"
          value={business.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Manx Coastal Adventures Ltd"
        />
        {touched && err.name && (
          <div className="error-msg">Please enter your business name</div>
        )}
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Business size</label>
          <select value={business.size} onChange={(e) => set("size", e.target.value)}>
            <option value="">— Select —</option>
            <option value="small">Small (1–49 employees)</option>
            <option value="medium">Medium (50–249 employees)</option>
            <option value="large">Large (250+ employees)</option>
          </select>
          {touched && err.size && (
            <div className="error-msg">Please select a size</div>
          )}
        </div>

        <div className="field-group">
          <label>Sector</label>
          <select
            value={business.sector}
            onChange={(e) => set("sector", e.target.value)}
          >
            <option value="">— Select —</option>
            {Object.entries(config.sectors).map(([id, s]) => (
              <option key={id} value={id}>
                {s.name}
              </option>
            ))}
          </select>
          {touched && err.sector && (
            <div className="error-msg">Please select a sector</div>
          )}
        </div>
      </div>

      <div className="field-group">
        <label>
          Primary contact email <span>(for your report)</span>
        </label>
        <input
          type="email"
          value={business.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@yourbusiness.im"
        />
        {touched && err.email && (
          <div className="error-msg">Please enter a valid email</div>
        )}
      </div>

      <button type="button" className="analyse-btn" onClick={submit}>
        Continue <span className="btn-arrow">→</span>
      </button>
    </div>
  );
}
