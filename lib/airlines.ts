export type Airline = {
  code: string;
  name: string;
  color: string;
  logo: string;
};

export const AIRLINES: Airline[] = [
  { code: "KE", name: "대한항공", color: "#5D9CEC", logo: "/airlines/ke.svg" },
  { code: "OZ", name: "아시아나항공", color: "#8E2331", logo: "/airlines/oz.svg" },
  { code: "7C", name: "제주항공", color: "#F58220", logo: "/airlines/7c.svg" },
  { code: "LJ", name: "진에어", color: "#8CC63F", logo: "/airlines/lj.svg" },
  { code: "TW", name: "티웨이항공", color: "#D91F3D", logo: "/airlines/tw.svg" },
  { code: "BX", name: "에어부산", color: "#18A999", logo: "/airlines/bx.svg" },
  { code: "RS", name: "에어서울", color: "#16B99A", logo: "/airlines/rs.svg" },
  { code: "ZE", name: "이스타항공", color: "#E94B35", logo: "/airlines/ze.svg" },
];

export function getAirline(code: string) {
  return AIRLINES.find((airline) => airline.code === code);
}
