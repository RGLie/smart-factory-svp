import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "명예의 전당 | 스마트 팩토리를 이겨라",
  description: "스마트 팩토리를 이겨라 최종 생산 기록과 수상팀",
};

export default function HallOfFameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
