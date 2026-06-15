CREATE TABLE "admin_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(40) NOT NULL,
	"target_type" varchar(50),
	"target_id" uuid,
	"target_label" text,
	"metadata" jsonb,
	"ip" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_activity_logs_created_idx" ON "admin_activity_logs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Deny anon" ON "admin_activity_logs" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);