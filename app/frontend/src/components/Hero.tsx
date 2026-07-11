function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  return (
    <section className="hero">
      <div className="compass-ring" />
      <div className="compass-ring-2" />
      <div className="hero-eyebrow">
        <span /> Isle of Man Pilot <span />
      </div>
      <h1>
        Measure your<span>Biosphere alignment.</span>
      </h1>
      <p className="hero-sub">
        Understand how your business supports the Isle of Man's UNESCO Biosphere
        values — and where you can do more.
      </p>
      <div className="hero-cta">
        <button type="button" className="btn-primary" onClick={() => scrollTo("tool")}>
          Assess My Business →
        </button>
        <button type="button" className="btn-ghost" onClick={() => scrollTo("how")}>
          How it works
        </button>
      </div>
      <div className="hero-stats">
        <div className="stat-item">
          <span className="stat-num">21</span>
          <span className="stat-label">Criteria</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">6</span>
          <span className="stat-label">Sectors</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">IoM</span>
          <span className="stat-label">Pilot Region</span>
        </div>
      </div>
    </section>
  );
}
