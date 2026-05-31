CREATE TABLE "project_automation_tokens" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"token_prefix" text NOT NULL,
	"token_hash" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_case_runs" ADD COLUMN "result_source" varchar(20) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "test_case_runs" ADD COLUMN "automation_meta" jsonb;--> statement-breakpoint
ALTER TABLE "project_automation_tokens" ADD CONSTRAINT "project_automation_tokens_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;