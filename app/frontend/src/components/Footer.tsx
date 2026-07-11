export function Footer({ configVersion }: { configVersion?: string }) {
  return (
    <footer>
      <div className="footer-left">
        <div className="footer-logo-mark">🧭</div>
        <div className="footer-text">
          <strong>Biosphere Compass</strong> — Isle of Man Pilot
        </div>
      </div>
      <div className="footer-right">
        UNESCO Biosphere Isle of Man · Built for Earthscope
        {configVersion ? ` · Config v${configVersion}` : ""}
      </div>
    </footer>
  );
}
