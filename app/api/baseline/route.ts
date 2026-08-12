import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { airlinePool, eventSettings } from "../../../db/schema";

type BaselinePayload = {
  score?: number;
  airlineId?: number;
};

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as BaselinePayload;
    const score = Math.floor(Number(payload.score));
    const airlineId = Number(payload.airlineId);

    if (!Number.isFinite(score) || score < 0) {
      return Response.json({ error: "기준 기록은 0 이상의 숫자로 입력해 주세요." }, { status: 400 });
    }
    if (!Number.isInteger(airlineId) || airlineId <= 0) {
      return Response.json({ error: "기준 기록의 항공사를 선택해 주세요." }, { status: 400 });
    }

    const db = getDb();
    const [airline] = await db
      .select()
      .from(airlinePool)
      .where(and(eq(airlinePool.id, airlineId), eq(airlinePool.active, true)))
      .limit(1);
    if (!airline) {
      return Response.json({ error: "선택한 항공사를 찾을 수 없습니다." }, { status: 404 });
    }
    await db
      .update(eventSettings)
      .set({
        baselineScore: score,
        baselineAirlineId: airline.id,
        baselineAirlineCode: airline.code,
        baselineAirlineName: airline.name,
        baselineAirlineColor: airline.color,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(eventSettings.id, 1));

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "기준 기록을 저장하지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
