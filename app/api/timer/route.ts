import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { eventSettings } from "../../../db/schema";

type TimerPayload = {
  action?: "start" | "pause" | "reset" | "setDuration";
  durationSeconds?: number;
};

function remainingNow(remainingSeconds: number, startedAt: number | null) {
  if (!startedAt) return remainingSeconds;
  return Math.max(0, remainingSeconds - Math.floor((Date.now() - startedAt) / 1000));
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as TimerPayload;
    const db = getDb();
    const [current] = await db
      .select()
      .from(eventSettings)
      .where(eq(eventSettings.id, 1))
      .limit(1);

    if (!current) {
      throw new Error("Neon 데이터베이스 초기화가 필요합니다. npm run db:migrate를 실행해 주세요.");
    }

    const updatedAt = new Date().toISOString();

    if (payload.action === "setDuration") {
      const durationSeconds = Math.floor(Number(payload.durationSeconds));
      if (!Number.isFinite(durationSeconds) || durationSeconds < 10 || durationSeconds > 3600) {
        return Response.json({ error: "타이머는 10초에서 60분 사이로 설정해 주세요." }, { status: 400 });
      }
      await db
        .update(eventSettings)
        .set({
          durationSeconds,
          remainingSeconds: durationSeconds,
          timerStatus: "idle",
          startedAt: null,
          updatedAt,
        })
        .where(eq(eventSettings.id, 1));
    } else if (payload.action === "start") {
      const remaining =
        current.timerStatus === "finished" || current.remainingSeconds <= 0
          ? current.durationSeconds
          : remainingNow(current.remainingSeconds, current.startedAt);
      await db
        .update(eventSettings)
        .set({
          remainingSeconds: remaining,
          timerStatus: "running",
          startedAt: Date.now(),
          updatedAt,
        })
        .where(eq(eventSettings.id, 1));
    } else if (payload.action === "pause") {
      const remaining = remainingNow(current.remainingSeconds, current.startedAt);
      await db
        .update(eventSettings)
        .set({
          remainingSeconds: remaining,
          timerStatus: remaining > 0 ? "paused" : "finished",
          startedAt: null,
          updatedAt,
        })
        .where(eq(eventSettings.id, 1));
    } else if (payload.action === "reset") {
      await db
        .update(eventSettings)
        .set({
          remainingSeconds: current.durationSeconds,
          timerStatus: "idle",
          startedAt: null,
          updatedAt,
        })
        .where(eq(eventSettings.id, 1));
    } else {
      return Response.json({ error: "올바른 타이머 동작을 선택해 주세요." }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "타이머를 변경하지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
