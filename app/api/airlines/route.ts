import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { airlinePool } from "../../../db/schema";
import { getAirlineLogoUrl, isValidLogoDataUrl } from "../../../lib/airline-logo";

type AirlinePayload = {
  id?: number;
  code?: string;
  name?: string;
  color?: string;
  logoDataUrl?: string;
};

type AirlineRow = typeof airlinePool.$inferSelect;

function publicAirline(airline: AirlineRow) {
  return {
    id: airline.id,
    code: airline.code,
    name: airline.name,
    color: airline.color,
    logoUrl: getAirlineLogoUrl(airline),
    createdAt: airline.createdAt,
    updatedAt: airline.updatedAt,
  };
}

function databaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? databaseErrorCode(error.cause) : undefined;
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const isDraw = new URL(request.url).searchParams.get("draw") === "1";

    if (isDraw) {
      const [airline] = await db
        .select()
        .from(airlinePool)
        .where(eq(airlinePool.active, true))
        .orderBy(sql`random()`)
        .limit(1);
      if (!airline) {
        return Response.json(
          { error: "추첨 가능한 항공사가 없습니다. 운영 화면에서 항공사를 추가해 주세요." },
          { status: 404 },
        );
      }
      return Response.json(
        { airline: publicAirline(airline) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const rows = await db
      .select()
      .from(airlinePool)
      .where(eq(airlinePool.active, true))
      .orderBy(asc(airlinePool.id));
    return Response.json(
      { airlines: rows.map(publicAirline) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "항공사 목록을 불러오지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AirlinePayload;
    const code = payload.code?.trim().slice(0, 4).toUpperCase() ?? "";
    const name = payload.name?.trim() ?? "";
    const color = /^#[0-9a-f]{6}$/i.test(payload.color ?? "")
      ? payload.color!
      : "#4A63D8";

    if (!code || !name) {
      return Response.json({ error: "항공사명과 코드를 모두 입력해 주세요." }, { status: 400 });
    }
    if (!isValidLogoDataUrl(payload.logoDataUrl)) {
      return Response.json(
        { error: "PNG, JPG 또는 WebP 로고 이미지를 등록해 주세요." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [airline] = await db
      .insert(airlinePool)
      .values({ code, name, color, logoDataUrl: payload.logoDataUrl })
      .returning();
    return Response.json({ airline: publicAirline(airline) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "항공사를 추가하지 못했습니다.";
    if (databaseErrorCode(error) === "23505" || message.includes("idx_airline_pool_code_unique")) {
      return Response.json({ error: "이미 등록된 항공사 코드입니다." }, { status: 409 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as AirlinePayload;
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "로고를 변경할 항공사를 선택해 주세요." }, { status: 400 });
    }
    if (!isValidLogoDataUrl(payload.logoDataUrl)) {
      return Response.json(
        { error: "PNG, JPG 또는 WebP 로고 이미지를 등록해 주세요." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [airline] = await db
      .update(airlinePool)
      .set({ logoDataUrl: payload.logoDataUrl, updatedAt: new Date().toISOString() })
      .where(eq(airlinePool.id, id))
      .returning();
    if (!airline) {
      return Response.json({ error: "선택한 항공사를 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json({ airline: publicAirline(airline) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "항공사 로고를 저장하지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as AirlinePayload;
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "삭제할 항공사를 선택해 주세요." }, { status: 400 });
    }

    const db = getDb();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(airlinePool)
      .where(eq(airlinePool.active, true));
    if (count <= 1) {
      return Response.json({ error: "추첨 항공사는 최소 1개가 필요합니다." }, { status: 400 });
    }

    const [airline] = await db
      .update(airlinePool)
      .set({ active: false, updatedAt: new Date().toISOString() })
      .where(eq(airlinePool.id, id))
      .returning();
    if (!airline) {
      return Response.json({ error: "선택한 항공사를 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "항공사를 삭제하지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
