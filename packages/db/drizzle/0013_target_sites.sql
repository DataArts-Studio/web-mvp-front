CREATE TABLE "target_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"base_url" text NOT NULL,
	"auth_secret_encrypted" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "target_sites" ADD CONSTRAINT "target_sites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- RLS deny-all: 정책을 만들지 않아 anon/authenticated 는 모든 접근이 거부된다.
-- 서버(service_role)만 이 테이블에 접근한다. auth_secret_encrypted(시크릿)을 담으므로 필수.
ALTER TABLE "target_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "target_sites" FORCE ROW LEVEL SECURITY;