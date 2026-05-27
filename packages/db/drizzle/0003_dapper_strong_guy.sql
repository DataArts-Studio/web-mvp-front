--
-- NT01 공지사항 (announcements + notification_reads)
--
-- 참고: drizzle-kit generate 가 함께 출력한 test_run_milestones CREATE TABLE 은
-- 스냅샷 드리프트로 발생한 가짜 diff 였습니다 (prod 에는 이미 존재). 본 SQL
-- 에는 NT01 신규 테이블만 남기고, test_run_milestones 관련 statement 는
-- 의도적으로 제거했습니다. 스냅샷에는 정상적으로 반영되어 있어 이후
-- generate 에서 다시 노출되지 않습니다.
--
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" varchar(20) NOT NULL,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"announcement_id" uuid,
	"notification_id" uuid,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_active_idx" ON "announcements" USING btree ("published_at","pinned");--> statement-breakpoint
CREATE INDEX "announcements_category_idx" ON "announcements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "notification_reads_user_idx" ON "notification_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_reads_announcement_idx" ON "notification_reads" USING btree ("announcement_id");--> statement-breakpoint
--
-- RLS: deny-all (anon). 서버(service_role) 라우트만 접근 허용.
-- 프로젝트 전반의 deny-all 전략 (`project_rls_strategy` 메모리) 와 동일.
--
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "announcements" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_reads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_reads" FORCE ROW LEVEL SECURITY;
