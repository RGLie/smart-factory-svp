CREATE TABLE "event_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"duration_seconds" integer DEFAULT 300 NOT NULL,
	"remaining_seconds" integer DEFAULT 300 NOT NULL,
	"timer_status" text DEFAULT 'idle' NOT NULL,
	"started_at" bigint,
	"current_team_id" integer,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "event_settings_timer_status_valid" CHECK ("event_settings"."timer_status" IN ('idle', 'running', 'paused', 'finished')),
	CONSTRAINT "event_settings_duration_valid" CHECK ("event_settings"."duration_seconds" BETWEEN 10 AND 3600),
	CONSTRAINT "event_settings_remaining_nonnegative" CHECK ("event_settings"."remaining_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"airline_code" text NOT NULL,
	"airline_name" text NOT NULL,
	"airline_color" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_score_nonnegative" CHECK ("teams"."score" >= 0)
);
--> statement-breakpoint
ALTER TABLE "event_settings" ADD CONSTRAINT "event_settings_current_team_id_teams_id_fk" FOREIGN KEY ("current_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_teams_name_unique" ON "teams" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_teams_score_created" ON "teams" USING btree ("score","created_at");--> statement-breakpoint
INSERT INTO "event_settings" (
	"id",
	"duration_seconds",
	"remaining_seconds",
	"timer_status"
) VALUES (1, 300, 300, 'idle')
ON CONFLICT ("id") DO NOTHING;
