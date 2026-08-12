ALTER TABLE "event_settings" ALTER COLUMN "baseline_airline_name" SET DEFAULT 'F팀 항공사';--> statement-breakpoint
UPDATE "event_settings"
SET "baseline_airline_name" = 'F팀 항공사',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 1;
