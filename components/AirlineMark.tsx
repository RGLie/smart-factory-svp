type AirlineMarkProps = {
  code: string;
  name: string;
  color: string;
  logoUrl?: string | null;
  compact?: boolean;
};

export function AirlineMark({ code, name, color, logoUrl, compact = false }: AirlineMarkProps) {
  return (
    <div className={`airline-mark${compact ? " airline-mark--compact" : ""}`}>
      {logoUrl ? (
        <span className="airline-mark__logo" aria-hidden="true">
          <img src={logoUrl} alt="" />
        </span>
      ) : (
        <span
          className="airline-mark__code"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {code.slice(0, 3)}
        </span>
      )}
      <span className="airline-mark__name">{name}</span>
    </div>
  );
}

export function AirlineHero({ code, name, color, logoUrl }: Omit<AirlineMarkProps, "compact">) {
  if (logoUrl) {
    return <img className="airline-hero__image" src={logoUrl} alt={`${name} 로고`} />;
  }

  return (
    <div className="airline-hero__custom" style={{ color }}>
      <strong>{code.slice(0, 4)}</strong>
      <span>{name}</span>
    </div>
  );
}
