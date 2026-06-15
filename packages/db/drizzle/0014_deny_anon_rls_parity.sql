-- RLS 정합(dev↔prod): dev 에 남아있던 permissive "Allow all"({public} USING true) 정책을
-- prod 과 동일한 deny-anon (USING false / WITH CHECK false) 으로 교체한다.
-- 서버는 service_role(BYPASSRLS)로 접근하므로 앱 동작에는 영향이 없다.
-- 양 환경에서 재실행해도 안전하도록 기존 정책을 DROP ... IF EXISTS 후 재생성한다.
DROP POLICY IF EXISTS "Allow all access to checklist_items" ON "public"."checklist_items";--> statement-breakpoint
DROP POLICY IF EXISTS "Allow all access to checklists" ON "public"."checklists";--> statement-breakpoint
DROP POLICY IF EXISTS "Allow all for github_connections" ON "public"."github_connections";--> statement-breakpoint
DROP POLICY IF EXISTS "Allow all for project_ai_configs" ON "public"."project_ai_configs";--> statement-breakpoint
DROP POLICY IF EXISTS "Allow all for test_case_external_links" ON "public"."test_case_external_links";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."checklist_items";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."checklists";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."github_connections";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."project_ai_configs";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."test_case_external_links";--> statement-breakpoint
ALTER TABLE "public"."checklist_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."checklist_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."checklists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."checklists" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."github_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."github_connections" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."project_ai_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."project_ai_configs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."test_case_external_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."test_case_external_links" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."checklist_items" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."checklists" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."github_connections" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."project_ai_configs" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."test_case_external_links" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
