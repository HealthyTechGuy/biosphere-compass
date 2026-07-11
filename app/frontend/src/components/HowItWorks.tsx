export function HowItWorks() {
  return (
    <section id="how">
      <div className="how-container">
        <div className="section-eyebrow">The Process</div>
        <h2 className="section-title">How the Compass works</h2>
        <p className="section-sub">
          A methodology adapted from the Isle of Man Government Climate Impact
          Assessment, scored against 21 criteria with sector-specific weights.
        </p>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <h3>Tell us about your business</h3>
            <p>Business name, size, sector and a contact so we can send your report.</p>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <h3>Complete the assessment</h3>
            <p>
              Answer 21 criteria across environmental and social pillars. Each takes
              an impact rating, plus permanence and reach if the impact isn't neutral.
            </p>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <h3>Receive your Compass report</h3>
            <p>
              A sector-weighted 0–100 headline score, per-criterion wheel, and
              priority actions taken straight from your negatives — worst first.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
