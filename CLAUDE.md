# CLAUDE.md (web-mvp-front)

Claude Code 가 이 저장소에서 **코드를 작성**할 때 따르는 컨벤션이다.

- 자동 PR 리뷰 기준: `AGENTS.md` (이 파일과 역할 분리)
- 개인 출력 규약(언어, em dash, 이모지, 커밋 메시지 등): `~/.claude/CLAUDE.md`
- 앱별 특화 컨벤션: `apps/web/CLAUDE.md`, `apps/back-office/CLAUDE.md`

## 저장소 구조

- pnpm workspace + Turborepo
- `apps/web` (사용자 대상), `apps/back-office` (운영 백오피스, `admin.gettestea.com` 별도 배포)
- `packages/db`, `packages/ui`, `packages/util`, `packages/lib`, `packages/fetch-kit`
- 배포: prod `gettestea.com`, dev `dev.gettestea.com` (DB 는 Vercel env 분기로 prod 와 preview/dev 분리)
- 제품명 Testea (테스티아). UI 한국어. 핵심 도메인: 프로젝트, 케이스, 스위트, 마일스톤, 테스트 런.

## 패키지 경계

새 코드를 패키지에 넣기 전: 사용처가 한 앱뿐이면 `apps/*/src/shared/` 에 둔다. 두 앱이 같이 쓰거나 외부 노출 가능성이 있을 때만 패키지로 승격.

- `packages/db`: Drizzle 스키마·쿼리·마이그레이션. 신규 테이블은 **RLS deny anon 정책 동반 필수** (서버/service_role 경유만 허용).
- `packages/ui`: 디자인 시스템 컴포넌트. workspace React 타입을 의존하면 `@types/react` 를 devDep 으로 박아야 한다 (안 그러면 소비 앱에서 타입 해석 깨짐).
- `packages/util`: 순수 유틸. React/Next 의존 금지. barrel export 충돌 주의.
- `packages/lib`: 도메인 로직.
- `packages/fetch-kit`: 클라이언트/서버 fetch 래퍼.

워크스페이스 패키지 추가/이동 후 타입이 안 잡히면 `tsbuildinfo` stale 의심 (해당 패키지에서 클린 빌드).

## 인증·보안 기본 전제

- 사용자 계정 없음. 프로젝트별 비밀번호(bcrypt 해시)로 진입. 봇 차단은 Cloudflare Turnstile (프로젝트 생성 Step 3 + 접근 폼).
- 레이트 리밋: 현재 인메모리 Map (5회/15분 락아웃). 운영 스케일 시 Redis 로 교체 예정.
- 새 API 라우트 (`apps/web/app/api/**`) 는 외부 입력·웹훅·LLM 응답을 신뢰하지 않는다. 입력 검증 + 권한 가드 필수. 프로젝트 접근 가드는 `requireProjectAccess` 패턴.
- RLS 신규 테이블 deny-all 정책 누락은 보안 회귀. 마이그레이션 PR 에 정책 같이 들어가야 한다.

## 환경 게이팅

- 분석·추적은 운영에서만 동작해야 한다. GA/GTM 은 `NEXT_PUBLIC_GTM_ID` 미주입으로 dev/preview 차단, 추가 가드는 `VERCEL_ENV === 'production'`.
- Sentry, Cloudflare 비콘은 dev 에서도 활성 (관측 목적).
- 분석/추적/디버그/실험 코드를 새로 추가할 때 환경 가드 누락 여부 확인.

## 작성 시 자주 밟는 함정

- **Tailwind v4 + cva 오버라이드**: cva 는 `tw-merge` 를 하지 않으므로, 변형 클래스 인스턴스 오버라이드는 v4 후행 important (`px-3!`) 가 필요하다. 선행 `!class` 아님.
- **Dialog Primitive `style` 전달**: `Overlay`/`Content` 에 `style` 을 넘기면 기본 레이아웃 클래스가 무효화된다. position/top/left/transform 등 기본값을 직접 명시.
- **자체 absolute 드롭다운**: 행 `overflow-hidden` + 스크롤 컨테이너 두 경계에 잘린다. `createPortal` + `fixed` + 양쪽 ref outside-click 패턴 사용.
- **클라 훅**: `useState`/`useEffect`/`useRouter` 등 사용 전 파일 최상단 `'use client'` 선언 확인.
- **Tailwind v4 content scan**: 새 패키지 추가 시 `apps/*/src/app/globals.css` 의 `@source` 등록 누락하면 클래스가 안 적용된다.

## 검증 명령

PR 생성·추가 커밋 push 전, cherry-pick/rebase 직후 모두 아래를 로컬에서 통과시킨다.

- `pnpm format:check` (= `prettier --check`)
- 변경 패키지에 해당하는 `pnpm -w turbo run lint test`
- UI 변경은 dev 서버에서 실제 동작 확인 후 보고. 타입체크·테스트 통과 ≠ 기능 정상.

## 테스트

- 단위/통합: Vitest (`apps/*/vitest.config.ts`).
- E2E: Playwright, 위치 `apps/web/tests/`, 확장자 `*.spec.ts`. `src/` 아래에 두지 않는다.
- POM·시나리오 규약은 `AGENTS.md` "테스트 아키텍처" 절 참조.

## 문서·기획

- 기능 명세(FDD)는 Notion. 신규 기능 구현 전 FDD 페이지 있는지 확인.
- 회고/개발 노트는 `docs/노트에 적을거/` (디에듀 톤, 메타박스 금지, 1인칭 흐름).
- 이슈 문서: `docs/issues/<feature>/` 하위 feature 단위 폴더.
