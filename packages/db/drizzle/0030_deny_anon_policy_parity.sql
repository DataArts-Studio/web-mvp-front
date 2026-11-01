-- RLS 정합: ENABLE+FORCE 만 걸려 있고 명시 정책이 없던 테이블에 다른 테이블과 같은 deny-anon 정책을 붙인다.
-- 정책이 없어도 RLS 기본 거부로 막히지만, 허용 정책이 실수로 하나 생기면 바로 열린다. 명시 정책으로 의도를 고정한다.
-- 서버는 postgres 롤(BYPASSRLS)로 접근하므로 앱 동작에는 영향이 없다. 재실행해도 안전하도록 DROP ... IF EXISTS 후 재생성한다.
DROP POLICY IF EXISTS "Deny anon" ON "public"."announcements";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."notification_reads";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."project_automation_tokens";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."ai_requirement_analyses";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."test_scenarios";--> statement-breakpoint
DROP POLICY IF EXISTS "Deny anon" ON "public"."target_sites";--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."announcements" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."notification_reads" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."project_automation_tokens" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."ai_requirement_analyses" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."test_scenarios" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "Deny anon" ON "public"."target_sites" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
