-- 비밀번호 시도 제한과 공개 액션 레이트리밋 카운터 (#471). 인스턴스 메모리 대신 DB 에서 센다.
-- 서버(postgres 롤)만 쓰므로 anon/authenticated 는 막는다.
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_buckets_reset_at_idx" ON "rate_limit_buckets" USING btree ("reset_at");--> statement-breakpoint
ALTER TABLE "rate_limit_buckets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rate_limit_buckets" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Deny anon" ON "rate_limit_buckets" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
