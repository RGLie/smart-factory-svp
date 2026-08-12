type LogoRecord = {
  id: number;
  logoDataUrl?: string | null;
  hasLogo?: boolean;
  updatedAt: string;
};

export function getAirlineLogoUrl(airline: LogoRecord | undefined | null) {
  if (!airline || (!airline.logoDataUrl && !airline.hasLogo)) return null;
  return `/api/airlines/${airline.id}/logo?v=${encodeURIComponent(airline.updatedAt)}`;
}

export function isValidLogoDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(value) &&
    value.length <= 450_000
  );
}
