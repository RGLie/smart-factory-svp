import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { airlinePool } from "../../../../../db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      return new Response("Not found", { status: 404 });
    }

    const db = getDb();
    const [airline] = await db
      .select({ logoDataUrl: airlinePool.logoDataUrl })
      .from(airlinePool)
      .where(eq(airlinePool.id, id))
      .limit(1);
    if (!airline?.logoDataUrl) {
      return new Response("Not found", { status: 404 });
    }

    const match = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i.exec(airline.logoDataUrl);
    if (!match) {
      return new Response("Invalid logo", { status: 500 });
    }

    return new Response(new Uint8Array(Buffer.from(match[2], "base64")), {
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Logo unavailable", { status: 500 });
  }
}
