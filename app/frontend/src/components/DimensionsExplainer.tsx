const CARDS = [
  { icon: "🌱", label: "P1", name: "Environmental Pillar", pts: "10 criteria — GHG, air, transport, land, biodiversity, water, adaptation, energy, materials, waste" },
  { icon: "🤝", label: "P2", name: "Social Pillar", pts: "11 criteria — food, health, housing, education, community, culture, accessibility, economy, safety, equity, voice" },
  { icon: "🎯", label: "Impact", name: "5-point scale", pts: "Each criterion rated −2 to +2, from significant negative through neutral to significant positive" },
  { icon: "🔁", label: "Permanence", name: "Embedded vs one-off", pts: "Doubles the criterion's contribution when the practice is embedded in ongoing operations" },
  { icon: "🌍", label: "Reach", name: "Beyond your premises", pts: "Doubles again when the effect extends into the wider biosphere or community" },
  { icon: "🏭", label: "Weights", name: "Sector materiality", pts: "Six sector weight matrices decide which criteria matter most for your kind of business" },
];

export function DimensionsExplainer() {
  return (
    <section id="dimensions">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="section-eyebrow" style={{ color: "var(--teal)" }}>
          The Framework
        </div>
        <h2 className="section-title" style={{ color: "var(--charcoal)" }}>
          How your score is calculated
        </h2>
        <p className="section-sub" style={{ color: "#5a6e66" }}>
          Two pillars, twenty-one criteria, sector-weighted. Grounded in the CIA
          methodology and adapted for ongoing businesses.
        </p>
        <div className="dim-explainer-grid">
          {CARDS.map((c) => (
            <div className="dim-exp-card" key={c.label}>
              <span className="dim-exp-icon">{c.icon}</span>
              <div className="dim-exp-label">{c.label}</div>
              <div className="dim-exp-name">{c.name}</div>
              <div className="dim-exp-pts">{c.pts}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
