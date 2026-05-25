# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 우선 읽기

- `AGENTS.md` (루트) — 코드 리뷰 상시 지침. **테스트 코드는 전면 리뷰, 제품 코드는 로직·보안·버그·회귀만**. 아키텍처/네이밍/스타일은 지적 금지 (CodeRabbit `.coderabbit.yaml` 담당).
- `apps/back-office/AGENTS.md` — **back-office는 다른 Next.js 빌드.** 작업 전 `node_modules/next/dist/docs/`의 관련 가이드를 먼저 읽으라는 경고. 학습 데이터의 Next.js 관례를 그대로 적용하지 말 것.
- `apps/web/tests/README.md` — E2E POM 권장 구조와 명세 ↔ 구현 불일치 정리.

## 모노레포 구조

pnpm workspace + Turborepo. `pnpm-workspace.yaml` 기준 `apps/*`, `packages/*`.

```
apps/
  web/          # 메인 사용자 앱 (gettestea.com)
  back-office/  # 관리자 앱 (admin.gettestea.com, 별도 배포)
packages/
  db/           # Drizzle ORM 스키마·클라이언트·마이그레이션 (drizzle-kit)
  ui/           # 공용 디자인 시스템 (@testea/ui), subpath export per-folder
  fetch-kit/    # 네트워크 헬퍼
  lib/          # 도메인 가능성 있는 공용 로직
  util/         # 순수 유틸
```

워크스페이스 의존성은 `workspace:*`로 참조. **TS-source 패키지**라 빌드 산출물 없이 `src/index.ts`를 직접 export. 새 패키지 추가 시 React 사용한다면 `@types/react` devDep 필수 (memory: workspace_react_types).

## 자주 쓰는 명령

루트 (Turbo가 워크스페이스 fan-out):

- `pnpm dev` — 모든 앱 dev 동시 실행
- `pnpm build` / `pnpm lint`
- `pnpm format` / `pnpm format:check` — Prettier (CI는 PR 변경 파일만 검사)

`apps/web`:

- `pnpm --filter web dev` / `build` / `start`
- `pnpm --filter web test` — Vitest (단위, `src/**/*.test.*`만 수집)
- `pnpm --filter web test:watch` / `test:coverage`
- `pnpm --filter web e2e` — Playwright (`tests/**/*.spec.*`)
- `pnpm --filter web e2e:ui` / `e2e:headed` / `e2e:report`
- `pnpm --filter web storybook`
- 단일 테스트: `pnpm --filter web exec vitest run path/to/file.test.ts` / `pnpm --filter web exec playwright test tests/scenario/access`

`packages/db`:

- `pnpm --filter @testea/db db:generate` / `db:migrate` / `db:studio`

## 테스트 분리 규약 (중요)

같은 디렉토리 안에 두 러너가 공존하므로 경로/확장자가 곧 라우팅이다.

- **Vitest**: `apps/web/src/**/*.test.{ts,tsx}`만 수집, `tests/**` exclude (`apps/web/vitest.config.ts:12-13`).
- **Playwright**: `apps/web/tests/**/*.spec.{ts,tsx}`만 매칭 (`apps/web/playwright.config.ts:11`).
- 위치를 바꾸거나 `setupFiles`/`testMatch`/`include`/`exclude` 손댈 때는 실제 파일 존재 여부를 반드시 대조 (AGENTS.md 블로킹 항목).

Playwright project:

- `chromium` — 미인증 시나리오 (`scenario/access`, `create-project`, `project-search`)
- `chromium-auth` — `playwright/.auth/project.json` storageState 필요. `setup` 프로젝트가 선행 (`scenario/dashboard`, `scenario/testcase`)
- localhost는 Turnstile siteKey 빈 문자열 → 위젯 미렌더로 자동 통과. CI는 Cloudflare 공식 always-pass 키 사용 (`.github/workflows/ci.yml:67`).
- `sample-project`(식별번호 `123123123`) 시드 필요. 락아웃은 15분/6회째.

## 아키텍처 — apps/web (FSD)

`src/` 하위:

```
app-shell/   # 프로바이더, 전역 스타일
shared/      # ui, utils, lib, layout, logging
entities/    # project, test-suite, test-case, test-run, milestone
features/    # 사용자 액션 단위 모듈
widgets/     # 조합 UI
view/        # 페이지 뷰 컴포넌트
```

라우팅은 Next.js App Router (`apps/web/app/`). 페이지는 가능한 한 얇게 두고 view/widgets/features를 조립.

데이터 흐름: **클라이언트 → Server Action → Zod → Drizzle → Postgres(Supabase)**. 폼 검증은 `zodResolver` 기준이라 RHF native rule(`register(..., { required })`)은 무시됨 — 스펙은 zod 메시지를 단언해야 함 (AGENTS.md 주요).

인증: 프로젝트 단위 식별번호(bcrypt) — 사용자 계정 없음. Rate limit은 in-memory Map (prod에선 Redis 전환 예정).

봇 방지: 프로젝트 생성 Step 3 + 접근 폼에 Cloudflare Turnstile.

DB 접근: **public 전 테이블 deny-anon RLS** 전제. 서버(Drizzle/service_role) 경유만 허용 — 신규 테이블 추가 시 동일 정책 필수.

분석/추적: GA·GTM은 prod만 (`VERCEL_ENV==='production'` 가드, env 미주입). Sentry·Cloudflare beacon은 dev/preview에서도 동작.

## 환경 분기

DB는 **Vercel env 분기로 prod ↔ preview/dev 서로 다른 DB**. 로컬/CI e2e 타겟은 `.env.local` 값에 의존. CI는 `SUPABASE_DB_URL`을 GitHub secret으로 주입해 시드된 dev DB 사용.

## CI

`.github/workflows/ci.yml`:

1. **prettier (changed files)** — PR에서 base 대비 diff된 ts/tsx/js/jsx/json/md만 `prettier --check`. 게이팅.
2. **e2e (전체)** — Playwright 전체 시나리오. webServer는 `playwright.config.ts`가 자동 기동. 실패 시 trace/screenshot/video 아티팩트 업로드.

PR/추가 푸시 전 로컬에서 `pnpm format:check` 동등 명령 실행 권장 (cherry-pick·rebase 직후 포함).

## 코드 리뷰 도구 분담

- **CodeRabbit** (`.coderabbit.yaml`) — 아키텍처/스타일/POM 레이어 위반(locators에 단언 금지 등). path_instructions로 디렉토리별 다른 규칙 적용.
- **AGENTS.md** (자동 리뷰 에이전트) — 테스트 전면 + 제품 로직·보안·버그·회귀. 한국어 출력 강제.
- 둘이 의도적으로 분리돼 있으므로 한쪽이 보는 영역은 다른 쪽이 보지 않음.

## 컨벤션

- 커밋 메시지: `Type(#이슈번호): 제목` 한 줄. 본문 단락 금지 (배경은 PR 본문에).
- PR "변경 사항" 섹션: 한국어 자연 서술 + 기능 단위 불릿. 파일 경로/심볼/백틱 인용 금지.
- 한국어 테스트 제목은 평서문 + 마침표.
- E2E 신규 작성: scenario.md 먼저 → spec/POM이 Given/When/Then 그대로 반영. POM 메서드만 클래스, 로케이터는 생성자에서 `readonly Locator`.
- 미완 E2E는 `test.fixme` (빈 본문 false-green 금지).
