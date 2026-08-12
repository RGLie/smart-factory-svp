import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { airlinePool, eventSettings, teams } from "../../../db/schema";
import { getAirlineLogoUrl } from "../../../lib/airline-logo";

export const dynamic = "force-dynamic";

function calculateRemaining(
  remainingSeconds: number,
  startedAt: number | null,
  status: string,
  now: number,
) {
  if (status !== "running" || !startedAt) return remainingSeconds;
  return Math.max(0, remainingSeconds - Math.floor((now - startedAt) / 1000));
}

export async function GET() {
  try {
    const db = getDb();
    const now = Date.now();
    const [teamRows, settingsRows, airlineRows] = await Promise.all([
      db
        .select()
        .from(teams)
        .orderBy(desc(teams.score), asc(teams.createdAt), asc(teams.id)),
      db.select().from(eventSettings).where(eq(eventSettings.id, 1)).limit(1),
      db
        .select({
          id: airlinePool.id,
          hasLogo: sql<boolean>`${airlinePool.logoDataUrl} IS NOT NULL`,
          updatedAt: airlinePool.updatedAt,
        })
        .from(airlinePool),
    ]);
    const settings = settingsRows[0];

    if (!settings) {
      throw new Error("Neon 데이터베이스 초기화가 필요합니다. npm run db:migrate를 실행해 주세요.");
    }

    const remainingSeconds = calculateRemaining(
      settings.remainingSeconds,
      settings.startedAt,
      settings.timerStatus,
      now,
    );
    const status =
      settings.timerStatus === "running" && remainingSeconds <= 0
        ? "finished"
        : settings.timerStatus;

    if (status === "finished" && settings.timerStatus !== "finished") {
      await db
        .update(eventSettings)
        .set({
          timerStatus: "finished",
          remainingSeconds: 0,
          startedAt: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(eventSettings.id, 1));
    }

    const airlinesById = new Map(airlineRows.map((airline) => [airline.id, airline]));
    const publicTeams = teamRows.map((team) => ({
      ...team,
      logoUrl: getAirlineLogoUrl(
        team.airlineId ? airlinesById.get(team.airlineId) : null,
      ),
    }));

    return Response.json(
      {
        teams: publicTeams,
        currentTeam:
          publicTeams.find((team) => team.id === settings.currentTeamId) ?? null,
        baseline: {
          score: settings.baselineScore,
          airlineId: settings.baselineAirlineId,
          airlineCode: settings.baselineAirlineCode,
          airlineName: settings.baselineAirlineName,
          airlineColor: settings.baselineAirlineColor,
          logoUrl: getAirlineLogoUrl(
            settings.baselineAirlineId
              ? airlinesById.get(settings.baselineAirlineId)
              : null,
          ),
        },
        timer: {
          durationSeconds: settings.durationSeconds,
          remainingSeconds,
          status,
          startedAt: status === "running" ? settings.startedAt : null,
          updatedAt: settings.updatedAt,
        },
        serverTime: now,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "상태를 불러오지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
