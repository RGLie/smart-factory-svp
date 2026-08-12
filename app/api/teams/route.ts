import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { airlinePool, eventSettings, teams } from "../../../db/schema";
import { getAirlineLogoUrl } from "../../../lib/airline-logo";

type TeamPayload = {
  id?: number;
  name?: string;
  airlineId?: number;
  score?: number;
  delta?: number;
  setActive?: boolean;
  action?: "resetScores" | "setActive";
};

function databaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? databaseErrorCode(error.cause) : undefined;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
  if (databaseErrorCode(error) === "23505" || message.includes("idx_teams_name_unique")) {
    return Response.json({ error: "이미 등록된 팀 이름입니다." }, { status: 409 });
  }
  return Response.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TeamPayload;
    const name = payload.name?.trim() ?? "";
    const airlineId = Number(payload.airlineId);

    if (!name || !Number.isInteger(airlineId) || airlineId <= 0) {
      return Response.json({ error: "팀 이름과 항공사를 모두 입력해 주세요." }, { status: 400 });
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
    const [team] = await db
      .insert(teams)
      .values({
        name,
        airlineId: airline.id,
        airlineCode: airline.code,
        airlineName: airline.name,
        airlineColor: airline.color,
      })
      .returning();
    if (payload.setActive) {
      await db
        .update(eventSettings)
        .set({ currentTeamId: team.id, updatedAt: new Date().toISOString() })
        .where(eq(eventSettings.id, 1));
    }
    return Response.json(
      { team: { ...team, logoUrl: getAirlineLogoUrl(airline) } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as TeamPayload;
    const db = getDb();

    if (payload.action === "resetScores") {
      await db
        .update(teams)
        .set({ score: 0, updatedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "올바른 팀을 선택해 주세요." }, { status: 400 });
    }

    if (payload.action === "setActive") {
      const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
      if (!team) {
        return Response.json({ error: "선택한 팀을 찾을 수 없습니다." }, { status: 404 });
      }
      await db
        .update(eventSettings)
        .set({ currentTeamId: id, updatedAt: new Date().toISOString() })
        .where(eq(eventSettings.id, 1));
      return Response.json({ team });
    }

    const updatedAt = new Date().toISOString();
    if (typeof payload.delta === "number" && Number.isInteger(payload.delta)) {
      const [team] = await db
        .update(teams)
        .set({
          score: sql<number>`GREATEST(0, ${teams.score} + ${payload.delta})`,
          updatedAt,
        })
        .where(eq(teams.id, id))
        .returning();
      if (!team) {
        return Response.json({ error: "선택한 팀을 찾을 수 없습니다." }, { status: 404 });
      }
      return Response.json({ team });
    }

    if (typeof payload.score === "number" && Number.isFinite(payload.score)) {
      const [team] = await db
        .update(teams)
        .set({ score: Math.max(0, Math.floor(payload.score)), updatedAt })
        .where(eq(teams.id, id))
        .returning();
      if (!team) {
        return Response.json({ error: "선택한 팀을 찾을 수 없습니다." }, { status: 404 });
      }
      return Response.json({ team });
    }

    return Response.json({ error: "변경할 점수를 입력해 주세요." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as TeamPayload;
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "올바른 팀을 선택해 주세요." }, { status: 400 });
    }
    const db = getDb();
    await db
      .update(eventSettings)
      .set({ currentTeamId: null, updatedAt: new Date().toISOString() })
      .where(eq(eventSettings.currentTeamId, id));
    await db.delete(teams).where(eq(teams.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
