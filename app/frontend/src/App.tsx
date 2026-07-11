import { useEffect, useState } from "react";
import type { ScoringConfig } from "./types";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { DimensionsExplainer } from "./components/DimensionsExplainer";
import { Footer } from "./components/Footer";
import { Tool } from "./components/tool/Tool";

export function App() {
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => {
        if (!r.ok) throw new Error(`GET /config → ${r.status}`);
        return r.json() as Promise<ScoringConfig>;
      })
      .then(setConfig)
      .catch((e) => setConfigError(String(e)));
  }, []);

  return (
    <>
      <Nav />
      <Hero />
      <HowItWorks />
      <DimensionsExplainer />
      {config ? (
        <Tool config={config} />
      ) : (
        <section id="tool" style={{ background: "var(--mist)", padding: "5rem 1.5rem" }}>
          {configError ? (
            <div className="backend-error">
              <h2>Backend unavailable</h2>
              <p>
                Could not load the scoring config: <code>{configError}</code>
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                Is the backend running on <code>http://localhost:3001</code>? From
                the <code>app/</code> directory, run <code>make run</code> to start
                both services.
              </p>
            </div>
          ) : (
            <div className="tool-container tool-header">
              <p>Loading config…</p>
            </div>
          )}
        </section>
      )}
      <Footer configVersion={config?.version} />
    </>
  );
}
