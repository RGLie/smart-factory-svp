import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (database) return database;

  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error(
      "Neon 연결 정보가 없습니다. Vercel 환경변수 DATABASE_URL을 설정해 주세요.",
    );
  }

  database = drizzle(neon(databaseUrl), { schema });
  return database;
}
