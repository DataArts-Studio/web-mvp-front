CREATE TABLE "test_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"requirement_analysis_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"type" varchar(20) DEFAULT 'positive' NOT NULL,
	"related_requirement_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"lifecycle_status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_scenarios_type_check" CHECK ("test_scenarios"."type" in ('positive', 'negative', 'edge_case')),
	CONSTRAINT "test_scenarios_status_check" CHECK ("test_scenarios"."status" in ('DRAFT', 'REVIEW', 'CONFIRMED'))
);
--> statement-breakpoint
ALTER TABLE "test_suites" ADD COLUMN "test_scenario_id" uuid;--> statement-breakpoint
ALTER TABLE "test_scenarios" ADD CONSTRAINT "test_scenarios_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_scenarios" ADD CONSTRAINT "test_scenarios_requirement_analysis_id_ai_requirement_analyses_id_fk" FOREIGN KEY ("requirement_analysis_id") REFERENCES "public"."ai_requirement_analyses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_test_scenario_id_test_scenarios_id_fk" FOREIGN KEY ("test_scenario_id") REFERENCES "public"."test_scenarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_scenarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "test_scenarios" FORCE ROW LEVEL SECURITY;