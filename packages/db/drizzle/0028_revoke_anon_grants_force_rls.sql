-- DB 권한 심층 방어 (#472). 앱은 postgres 롤(BYPASSRLS)로만 접속하고 PostgREST 를 쓰지 않는다.
-- 지금은 RLS 한 겹만 막고 있어, RLS 가 꺼지거나 허용 정책이 하나라도 생기면 anon 키로 바로 열린다.
-- 1) 비밀번호 해시와 공유 토큰을 가진 테이블은 다른 민감 테이블처럼 FORCE RLS 를 건다.
ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "test_runs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
-- 2) Supabase 기본값으로 anon·authenticated 에 부여된 public 테이블·시퀀스 권한을 거둔다.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;--> statement-breakpoint
-- 3) 앞으로 postgres 가 만드는 테이블·시퀀스에도 기본 권한이 붙지 않게 한다.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
