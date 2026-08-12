ALTER TABLE "airline_pool" ADD COLUMN "logo_data_url" text;--> statement-breakpoint
ALTER TABLE "airline_pool" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "airline_pool" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "baseline_airline_id" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "airline_id" integer;--> statement-breakpoint
UPDATE "teams"
SET "airline_id" = "airline_pool"."id"
FROM "airline_pool"
WHERE "teams"."airline_code" = "airline_pool"."code"
  AND "teams"."airline_id" IS NULL;--> statement-breakpoint
UPDATE "event_settings"
SET "baseline_airline_id" = "airline_pool"."id"
FROM "airline_pool"
WHERE "event_settings"."baseline_airline_code" = "airline_pool"."code"
  AND "event_settings"."baseline_airline_id" IS NULL;
