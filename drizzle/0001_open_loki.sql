CREATE TABLE "airline_pool" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#4A63D8' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "baseline_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "baseline_airline_code" text DEFAULT 'KE' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "baseline_airline_name" text DEFAULT '대한항공' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "baseline_airline_color" text DEFAULT '#5D9CEC' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_airline_pool_code_unique" ON "airline_pool" USING btree ("code");--> statement-breakpoint
ALTER TABLE "event_settings" ADD CONSTRAINT "event_settings_baseline_nonnegative" CHECK ("event_settings"."baseline_score" >= 0);--> statement-breakpoint
INSERT INTO "airline_pool" ("code", "name", "color") VALUES
	('KE', '대한항공', '#5D9CEC'),
	('OZ', '아시아나항공', '#8E2331'),
	('7C', '제주항공', '#F58220'),
	('LJ', '진에어', '#8CC63F'),
	('TW', '티웨이항공', '#D91F3D'),
	('BX', '에어부산', '#18A999'),
	('RS', '에어서울', '#16B99A'),
	('ZE', '이스타항공', '#E94B35')
ON CONFLICT ("code") DO NOTHING;
