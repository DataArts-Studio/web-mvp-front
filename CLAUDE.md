# CLAUDE.md (web-mvp-front)

Claude Code 가 이 저장소에서 **코드를 작성**할 때 따르는 컨벤션이다.

- 자동 PR 리뷰 기준: `AGENTS.md` (이 파일과 역할 분리)
- 작업 시작 절차·보안 리뷰 기준: `AGENTS.md`, 재사용 작업 프롬프트: `AGENT.md`
- 개인 출력 규약(언어, em dash, 이모지, 커밋 메시지 등): `~/.claude/CLAUDE.md`
- 앱별 특화 컨벤션: `apps/web/CLAUDE.md`, `apps/back-office/AGENTS.md`·`CLAUDE.md`, `apps/qaground/AGENTS.md`·`CLAUDE.md`

## 저장소 구조

- pnpm workspace + Turborepo
- `apps/web`: 사용자 대상 Testea, Next.js App Router + FSD 혼합, 기본 포트 3000.
- `apps/back-office`: 운영 대시보드·공지·활동 로그, 기본 포트 3100. Next.js와 OpenNext/Cloudflare 배포 설정이 있으며 공지 변경은 관리자 액션 가드를 사용한다.
- `apps/qaground`: QA 실습·챌린지·샌드박스·제출/채점, 기본 포트 3200. 가짜 연습 API와 실제 저장/LLM/러너 연동을 구분한다.
- `apps/runner`: Hono + Playwright 서버, 기본 포트 8080. `/health`, `/capture`, `/run`. Cloud Run/Fly 설정이 있으며 DB에 직접 접근하지 않는다.
- `packages/db`, `packages/ui`, `packages/util`, `packages/lib`, `packages/fetch-kit`
- web 배포: prod `gettestea.com`, dev `dev.gettestea.com`. DB 연결은 `SUPABASE_DB_URL`로 주입된다. 코드가 자동으로 운영/개발 DB를 분리하지 않으므로 배포 환경별 설정을 확인한다.
- 제품명 Testea (테스티아). UI 한국어. 핵심 도메인: 프로젝트, 케이스, 스위트, 마일스톤, 테스트 런.

## 패키지 경계

새 코드를 패키지에 넣기 전: 사용처가 한 앱뿐이면 `apps/*/src/shared/` 에 둔다. 두 앱이 같이 쓰거나 외부 노출 가능성이 있을 때만 패키지로 승격.

- `packages/db`: Drizzle 스키마·쿼리·마이그레이션. 신규 테이블은 **RLS deny anon 정책 동반 필수** (서버/service_role 경유만 허용).
- `packages/ui`: 디자인 시스템 컴포넌트. workspace React 타입을 의존하면 `@types/react` 를 devDep 으로 박아야 한다 (안 그러면 소비 앱에서 타입 해석 깨짐).
- `packages/util`: 순수 유틸. React/Next 의존 금지. barrel export 충돌 주의.
- `packages/lib`: 현재 선택·토글·디바운스 등 공용 React 훅. 서버 도메인 로직 패키지로 가정하지 않는다.
- `packages/fetch-kit`: 클라이언트/서버 fetch 래퍼.

워크스페이스 패키지 추가/이동 후 타입이 안 잡히면 `tsbuildinfo` stale 의심 (해당 패키지에서 클린 빌드).

## 인증·보안 기본 전제

- 사용자 계정 없음. 프로젝트별 비밀번호(bcrypt 해시)로 진입. 봇 차단은 Cloudflare Turnstile (프로젝트 생성 Step 3 + 접근 폼).
- 위 인증 모델은 web 기준이다. back-office는 `BACKOFFICE_ADMIN_SECRET` 기반 임시 게이트, qaground는 익명 실습 흐름, runner는 공유 시크릿과 배포 설정에 따른 IAM 인증을 사용한다.
- 레이트 리밋: 현재 인메모리 Map (5회/15분 락아웃). 운영 스케일 시 Redis 로 교체 예정.
- API 라우트와 `'use server'` 액션 모두 외부 입력·웹훅·LLM 응답을 신뢰하지 않는다. 입력 검증 + 권한 가드 필수. 프로젝트 접근 가드는 `requireProjectAccess` 패턴이며 조회/변경 모두 적용한다. 기존 모든 액션이 보호되어 있다고 가정하지 않는다.
- `projectId`만 확인하지 말고 모든 연결 ID의 소유 프로젝트를 DB에서 확인한다. 무인증·다른 프로젝트 입력은 DB 쓰기·파일 업로드·외부 호출 전에 거부한다.
- 비밀 복호화·내부 기록 함수는 `server-only` 모듈에 두고, 클라이언트 호출이 필요한 최소 함수만 서버 액션으로 노출한다. 응답·Sentry·로그에 비밀값을 포함하지 않는다.
- `src/shared/lib/cache/prefetch.ts`의 공유 캐시를 변경할 때 인가는 캐시 바깥에서 매 요청 수행한다. 쿠키 기반 가드를 `unstable_cache` 콜백 안에 넣지 않는다.
- 비밀번호 변경/삭제 시 이전 세션의 서버 측 폐기, 공개 공유 링크의 범위·만료를 확인한다. 쿠키 만료 설정만으로 서버 재사용이 방지되지는 않는다.
- RLS 신규 테이블 deny-all 정책 누락은 보안 회귀. 마이그레이션 PR 에 정책 같이 들어가야 한다.
- Drizzle 서버 연결의 권한과 브라우저 anon/authenticated의 RLS는 별개다. 서버의 프로젝트 인가를 RLS로 대체하지 않는다. 마이그레이션 파일 존재와 운영 적용 완료도 구분한다.
- runner는 비신뢰 코드가 실행되는 경계다. 현재 자식 프로세스·임시 디렉터리·env allowlist만으로 작업 간 격리가 보장되지 않는다. 공유 시크릿/IAM 인증은 제출 코드 자체의 안전성을 보증하지 않는다.

## 환경 게이팅

- 분석·추적은 운영에서만 동작해야 한다. GA/GTM 은 `NEXT_PUBLIC_GTM_ID` 미주입으로 dev/preview 차단, 추가 가드는 `VERCEL_ENV === 'production'`.
- Sentry, Cloudflare 비콘은 dev 에서도 활성 (관측 목적).
- 분석/추적/디버그/실험 코드를 새로 추가할 때 환경 가드 누락 여부 확인.
- Turnstile 테스트 키·우회는 통제된 로컬/CI 환경에서만 사용한다. 운영 측정이나 자동화를 이유로 운영 봇 검증을 해제하지 않는다.

## 작성 시 자주 밟는 함정

- **Tailwind v4 + cva 오버라이드**: cva 는 `tw-merge` 를 하지 않으므로, 변형 클래스 인스턴스 오버라이드는 v4 후행 important (`px-3!`) 가 필요하다. 선행 `!class` 아님.
- **Dialog Primitive `style` 전달**: `Overlay`/`Content` 에 `style` 을 넘기면 기본 레이아웃 클래스가 무효화된다. position/top/left/transform 등 기본값을 직접 명시.
- **자체 absolute 드롭다운**: 행 `overflow-hidden` + 스크롤 컨테이너 두 경계에 잘린다. `createPortal` + `fixed` + 양쪽 ref outside-click 패턴 사용.
- **클라 훅**: `useState`/`useEffect`/`useRouter` 등 사용 전 파일 최상단 `'use client'` 선언 확인.
- **Tailwind v4 content scan**: 새 패키지 추가 시 `apps/*/src/app/globals.css` 의 `@source` 등록 누락하면 클래스가 안 적용된다.

## 검증 명령

루트 `.nvmrc`와 `packageManager`를 확인한다. 명령은 저장소 루트 기준이며 대상 앱·파일로 범위를 좁힌다. PR/push 및 cherry-pick/rebase 후에는 영향받는 검증을 수행한다. 미실행·실패를 성공으로 보고하지 않는다.

| 목적                  | 명령                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------- |
| 개발                  | `pnpm --filter web dev` / `pnpm --filter back-office dev` / `pnpm --filter qaground dev` |
| 앱 lint               | `pnpm --filter <앱 이름> lint`                                                           |
| 단위 테스트 일회 실행 | `pnpm --filter <앱 이름> exec vitest run <대상 파일>`                                    |
| DB 패키지 테스트      | `pnpm --filter @testea/db exec vitest run`                                               |
| runner 타입 검사      | `pnpm --filter @testea/runner typecheck`                                                 |
| 영향 앱 빌드          | `pnpm --filter <앱 이름> build`                                                          |
| web E2E               | `pnpm --filter web e2e:smoke` / `pnpm --filter web e2e`                                  |
| 변경 문서/코드 포맷   | `pnpm exec prettier --check <변경 파일들>`                                               |
| 저장소 전체 포맷      | `pnpm format:check`                                                                      |
| 의존성 감사           | `pnpm audit --json` (취약점 발견 시 비정상 종료 코드도 결과로 기록)                      |

- `test` 스크립트는 `vitest`이므로 자동 작업에서는 `vitest run`을 사용해 watch 대기를 피한다. runner에는 현재 test 스크립트가 없다.
- `.github/workflows/ci.yml`은 PR 변경 파일 포맷 + smoke, dev/main push 전체 E2E로 구성된다. lint·타입·Vitest가 이 CI에서 모두 실행된다고 가정하지 않는다.
- UI 변경은 dev 서버에서 실제 동작 확인 후 보고. 문서만 바꾼 작업에 운영 DB를 사용하는 E2E를 실행하지 않는다.
- 로컬 테스트 도구가 없거나 실행이 차단되면 원인과 실제 실행 결과를 명시한다. 오류를 숨기기 위해 테스트를 제외하거나 보안 검사를 우회하지 않는다.

## 테스트

- 단위/통합: Vitest (`apps/*/vitest.config.ts`).
- E2E: Playwright, 위치 `apps/web/tests/`, 확장자 `*.spec.ts`. `src/` 아래에 두지 않는다.
- POM·시나리오 규약은 `AGENTS.md` "테스트 아키텍처" 절 참조.
- web의 실제 시나리오 디렉터리는 `tests/scenario/`다. fixture는 `tests/fixtures/test.ts`, Page Object는 `tests/pages/`에 있다.
- web의 전역 setup은 `requireProjectAccess`를 기본 허용 mock으로 바꾼다. 보안 변경 시 개별 테스트에서 거부·타 프로젝트 경로를 명시적으로 검증한다. 가드 유틸 테스트 통과만으로 액션 인가를 보증하지 않는다.

## 문서·기획

- 기능 명세(FDD)는 Notion. 신규 기능 구현 전 FDD 페이지 있는지 확인.
- 회고/개발 노트는 `docs/노트에 적을거/` (디에듀 톤, 메타박스 금지, 1인칭 흐름).
- 이슈 문서: `docs/issues/<feature>/` 하위 feature 단위 폴더.
- 보안 점검 스냅샷: 로컬 `docs/security/`. 공개 저장소이므로 미수정 항목이 담긴 점검 보고서는 커밋하지 않는다. 최신 상태는 다시 검증하고, 보고서의 권고를 이미 구현된 규칙으로 서술하지 않는다. 보완 작업은 [작업 프롬프트](./AGENT.md)를 참고한다.
