# 백오피스 Cloudflare 배포 (OpenNext + Workers)

백오피스(`apps/back-office`)를 Cloudflare Workers 에 배포하기 위한 스캐폴딩이다.
web 앱(Vercel)과 달리 백오피스는 Cloudflare 로 따로 배포한다.

## 구성

- `@opennextjs/cloudflare` 어댑터로 Next.js(App Router·서버 액션)를 Workers 로 변환
- `open-next.config.ts` / `wrangler.jsonc` 설정 동반 (`nodejs_compat` 플래그 필수)
- DB: Workers 는 외부 Postgres 로 직접 TCP 를 못 열어 postgres-js 직결이 안 된다.
  **Cloudflare Hyperdrive** 로 Supabase 앞단을 두고, `src/shared/db/cloudflare-db.ts` 의
  `initCloudflareDb()` 가 Hyperdrive 커넥션으로 drizzle 을 만들어 `@testea/db` 에 주입한다.
  (Workers 가 아니면 no-op → 기본 postgres-js 경로 사용. 그래서 로컬·Vercel 에도 안전)

## 사전 준비 (Cloudflare 계정 필요 — 코드로는 못 함)

1. **Hyperdrive 생성** (Supabase Postgres 연결)

   ```
   wrangler hyperdrive create testea-bo-dev --connection-string="<Supabase dev SUPABASE_DB_URL>"
   ```

   출력된 id 를 `wrangler.jsonc` 의 `hyperdrive[].id` 에 채운다.
   (dev/prod 환경별로 Hyperdrive 를 각각 만들고, 환경별 wrangler 설정/시크릿으로 분기)

2. **시크릿 주입**

   ```
   wrangler secret put BACKOFFICE_ADMIN_SECRET
   ```

3. **커스텀 도메인** 연결: Workers 설정에서 `dev.back.gettestea.com`(dev) 등 라우트 추가.
   DNS 가 Cloudflare 라 바로 붙는다.

## 빌드 / 배포

```
pnpm --filter back-office cf:build      # .open-next 생성
pnpm --filter back-office cf:preview    # 로컬 미리보기(wrangler dev, Hyperdrive localConnectionString 사용)
pnpm --filter back-office cf:deploy     # 빌드 + 배포
pnpm --filter back-office cf:typegen    # 바인딩 타입 생성(선택)
```

## 주의

- **DB drift**: prod Supabase 에는 announcements 등 일부 테이블이 아직 없다(별도 마이그레이션 필요).
  dev 는 모두 있어 `dev.back.gettestea.com` 은 바로 동작한다.
- **인증**: 현재 백오피스는 공유키 게이트뿐이다. 공개 도메인 노출 전 강한 시크릿 + 정식 인증 검토.
- Next 버전은 OpenNext peer(>=16.2.6) 충족을 위해 16.2.x 를 쓴다(web 과 별도).
- `vercel.json` 은 더 이상 사용하지 않지만 보존해 둠(필요 시 Vercel 로 되돌릴 수 있게).
