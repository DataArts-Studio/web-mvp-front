CREATE TABLE "ai_requirement_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"source_input" text NOT NULL,
	"analysis" jsonb NOT NULL,
	"language" varchar(2) DEFAULT 'ko' NOT NULL,
	"attached_file_type" varchar(20),
	"attached_file_char_count" integer,
	"lifecycle_status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_requirement_analyses_attached_file_type_check" CHECK ("ai_requirement_analyses"."attached_file_type" in ('pdf', 'markdown'))
);
--> statement-breakpoint
ALTER TABLE "test_suites" ADD COLUMN "requirement_analysis_id" uuid;--> statement-breakpoint
ALTER TABLE "ai_requirement_analyses" ADD CONSTRAINT "ai_requirement_analyses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_requirement_analysis_id_ai_requirement_analyses_id_fk" FOREIGN KEY ("requirement_analysis_id") REFERENCES "public"."ai_requirement_analyses"("id") ON DELETE set null ON UPDATE no action;