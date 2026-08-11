import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { eventSettings } from "../../../db/schema";

type BaselinePayload = {
  score?: number;
  airlineCode?: string;
  airlineName?: string;
  airlineColor?: string;
};

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as BaselinePayload;
    const score = Math.floor(Number(payload.score));
    const airlineCode = payload.airlineCode?.trim().slice(0, 4).toUpperCase() ?? "";
    const airlineName = payload.airlineName?.trim() ?? "";
    const airlineColor = /^#[0-9a-f]{6}$/i.test(payload.airlineColor ?? "")
      ? payload.airlineColor!
      : "#4A63D8";

    if (!Number.isFinite(score) || score < 0) {
      return Response.json({ error: "기준 기록은 0 이상의 숫자로 입력해 주세요." }, { status: 400 });
    }
    if (!airlineCode || !airlineName) {
      return Response.json({ error: "기준 기록의 항공사를 선택해 주세요." }, { status: 400 });
    }

    const db = getDb();
    await db
      .update(eventSettings)
      .set({
        baselineScore: score,
        baselineAirlineCode: airlineCode,
        baselineAirlineName: airlineName,
        baselineAirlineColor: airlineColor,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(eventSettings.id, 1));

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "기준 기록을 저장하지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
