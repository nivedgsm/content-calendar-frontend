type GsmMarkProps = {
  size?: number;
  className?: string;
};

export function GsmMark({ size = 42, className = '' }: GsmMarkProps) {
  return <svg
    aria-hidden="true"
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="2.5"/>
    <ellipse cx="50" cy="50" rx="24" ry="44" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="50" cy="50" rx="38" ry="44" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M12 32C32 43 68 43 88 32M7 50H93M12 68C32 57 68 57 88 68" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="12" y="39" width="76" height="22" rx="2" fill="var(--gsm-logo-cutout, #fffafa)"/>
    <text x="50" y="57" textAnchor="middle" fill="currentColor" fontFamily="'Red Hat Display', sans-serif" fontSize="23" fontWeight="800" letterSpacing="-1.4">GSM</text>
  </svg>;
}

type GsmBrandProps = GsmMarkProps & {
  portal?: boolean;
  inverse?: boolean;
};

export default function GsmBrand({ size = 42, className = '', portal = false, inverse = false }: GsmBrandProps) {
  return <div className={`gsm-brand ${inverse ? 'gsm-brand-inverse' : ''} ${className}`} aria-label="Global Studio Media">
    <GsmMark size={size} className="gsm-mark"/>
    <div className="gsm-brand-copy">
      <div className="gsm-wordmark"><span className="gsm-wordmark-global">Global</span><span>Studio Media<span className="gsm-wordmark-period">.</span></span></div>
      {portal && <div className="gsm-portal-name">GSM Client Management Portal</div>}
    </div>
  </div>;
}
