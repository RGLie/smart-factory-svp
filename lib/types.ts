export type Team = {
  id: number;
  name: string;
  airlineCode: string;
  airlineName: string;
  airlineColor: string;
  airlineId: number | null;
  logoUrl: string | null;
  score: number;
  createdAt: string;
  updatedAt: string;
};

export type AirlinePoolItem = {
  id: number;
  code: string;
  name: string;
  color: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BaselineRecord = {
  score: number;
  airlineCode: string;
  airlineName: string;
  airlineColor: string;
  airlineId: number | null;
  logoUrl: string | null;
};

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export type TimerState = {
  durationSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  startedAt: number | null;
  updatedAt: string;
};

export type BoothState = {
  teams: Team[];
  currentTeam: Team | null;
  baseline: BaselineRecord;
  timer: TimerState;
  serverTime: number;
};
