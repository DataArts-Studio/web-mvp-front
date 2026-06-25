CREATE TABLE "qaground_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_slug" text NOT NULL,
	"track" varchar(20) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"content" jsonb NOT NULL,
	"result" jsonb,
	"anon_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "qaground_submissions_challenge_idx" ON "qaground_submissions" USING btree ("challenge_slug");--> statement-breakpoint
CREATE INDEX "qaground_submissions_created_idx" ON "qaground_submissions" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "qaground_submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "qaground_submissions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Deny anon" ON "qaground_submissions" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);