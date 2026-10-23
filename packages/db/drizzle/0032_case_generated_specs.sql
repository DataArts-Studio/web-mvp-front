-- 자동 실행(#187) 케이스별 생성 spec 저장. 서버(postgres 롤)만 쓰므로 anon/authenticated 는 막는다.
CREATE TABLE IF NOT EXISTS "case_generated_specs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"test_case_id" uuid NOT NULL,
	"target_site_id" uuid NOT NULL,
	"path" text,
	"spec" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_generated_specs_case_target_uniq" UNIQUE("test_case_id","target_site_id"),
	CONSTRAINT "case_generated_specs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "case_generated_specs_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "case_generated_specs_target_site_id_target_sites_id_fk" FOREIGN KEY ("target_site_id") REFERENCES "public"."target_sites"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
ALTER TABLE "case_generated_specs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "case_generated_specs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "case_generated_specs";--> statement-breakpoint
CREATE POLICY "Deny anon" ON "case_generated_specs" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
