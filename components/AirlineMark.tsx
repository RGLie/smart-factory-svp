import { getAirline } from "../lib/airlines";

type AirlineMarkProps = {
  code: string;
  name: string;
  color: string;
  compact?: boolean;
};

export function AirlineMark({ code, name, color, compact = false }: AirlineMarkProps) {
  const airline = getAirline(code);

  return (
    <div className={`airline-mark${compact ? " airline-mark--compact" : ""}`}>
      {airline ? (
        <span className="airline-mark__logo" aria-hidden="true">
          <img src={airline.logo} alt="" />
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

export function AirlineHero({ code, name, color }: Omit<AirlineMarkProps, "compact">) {
  const airline = getAirline(code);

  if (airline) {
    return <img className="airline-hero__image" src={airline.logo} alt={`${name} 로고`} />;
  }

  return (
    <div className="airline-hero__custom" style={{ color }}>
      <strong>{code.slice(0, 4)}</strong>
      <span>{name}</span>
    </div>
  );
}
