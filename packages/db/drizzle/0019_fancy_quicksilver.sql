CREATE TABLE "qaground_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"source" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "qaground_waitlist_email_unique" ON "qaground_waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "qaground_waitlist_created_idx" ON "qaground_waitlist" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "qaground_waitlist" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "qaground_waitlist" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Deny anon" ON "qaground_waitlist" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);