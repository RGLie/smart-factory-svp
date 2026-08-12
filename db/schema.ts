import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    airlineCode: text("airline_code").notNull(),
    airlineName: text("airline_name").notNull(),
    airlineColor: text("airline_color").notNull(),
    airlineId: integer("airline_id"),
    score: integer("score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_teams_name_unique").on(table.name),
    index("idx_teams_score_created").on(table.score, table.createdAt),
    check("teams_score_nonnegative", sql`${table.score} >= 0`),
  ],
);

export const airlinePool = pgTable(
  "airline_pool",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("#4A63D8"),
    logoDataUrl: text("logo_data_url"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("idx_airline_pool_code_unique").on(table.code)],
);

export const eventSettings = pgTable(
  "event_settings",
  {
    id: integer("id").primaryKey(),
    durationSeconds: integer("duration_seconds").notNull().default(300),
    remainingSeconds: integer("remaining_seconds").notNull().default(300),
    timerStatus: text("timer_status", {
      enum: ["idle", "running", "paused", "finished"],
    })
      .notNull()
      .default("idle"),
    startedAt: bigint("started_at", { mode: "number" }),
    currentTeamId: integer("current_team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    baselineScore: integer("baseline_score").notNull().default(0),
    baselineAirlineCode: text("baseline_airline_code").notNull().default("KE"),
    baselineAirlineName: text("baseline_airline_name").notNull().default("F팀 항공사"),
    baselineAirlineColor: text("baseline_airline_color").notNull().default("#5D9CEC"),
    baselineAirlineId: integer("baseline_airline_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "event_settings_timer_status_valid",
      sql`${table.timerStatus} IN ('idle', 'running', 'paused', 'finished')`,
    ),
    check("event_settings_duration_valid", sql`${table.durationSeconds} BETWEEN 10 AND 3600`),
    check("event_settings_remaining_nonnegative", sql`${table.remainingSeconds} >= 0`),
    check("event_settings_baseline_nonnegative", sql`${table.baselineScore} >= 0`),
  ],
);
