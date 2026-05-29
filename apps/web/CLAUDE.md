# CLAUDE.md (apps/web)

저장소 공통 컨벤션은 루트 `../../CLAUDE.md`. 이 파일은 web 앱 특화.

## 구조

App Router + FSD 혼합.

- `app/`: Next.js 라우트. `app/api/**` 가 서버 라우트.
- `src/app-shell`: 전역 레이아웃·프로바이더
- `src/view`: 라우트 단위 view 컴포넌트
- `src/widgets`: 합성 위젯
- `src/features`: 기능 단위
- `src/entities`: 도메인 엔티티
- `src/shared`: 공용 컴포넌트·훅·유틸 (앱 내부 한정)
- `src/access`: 프로젝트 비밀번호 진입 화면
- `src/stories`: Storybook
- `tests/`: Playwright (`pages/`·`fixtures/`·`scenarios/`)

새 코드 위치를 정할 때: 라우트 한 곳에서만 쓰이면 `view`, 여러 라우트가 쓰면 `widgets`/`features`, 두 앱이 같이 쓸 가능성이 있으면 패키지 승격 검토.

## 컴포넌트

- `@testea/ui` 에 같은 컴포넌트가 있으면 그것을 쓴다. 새로 만들기 전 확인.
- `DsInput`·`DsCheckbox` 등 cva 기반 컴포넌트의 인스턴스별 클래스 오버라이드는 후행 important (`px-3!`). 루트 CLAUDE.md "Tailwind v4 + cva" 참조.
- 행 내부 absolute 드롭다운(케이스 상태 등)은 `createPortal` + `fixed` + 양쪽 ref outside-click. 그렇지 않으면 행 `overflow-hidden` 과 스크롤 컨테이너에 잘린다 (#134 회귀).

## 서버 라우트 (`app/api/**`)

- 외부 입력·웹훅·LLM 응답 신뢰 금지. zod 등으로 입력 검증.
- 프로젝트 접근이 필요한 라우트는 `requireProjectAccess` 통과 후 핸들러 실행.
- 분석·추적·디버그 코드는 `VERCEL_ENV` 가드 필수.
- DB 쓰기는 Drizzle. `returning()` 없이 결과에 의존하지 말 것.

## E2E (POM)

- POM 작성·리뷰 기준은 루트 `../../AGENTS.md` "테스트 아키텍처" 절.
- 스캐폴딩 요청이 **"필드만 정의"** 이면 필드 + 생성자 로케이터만. 메서드 작성 금지.
- 작성자 라인이 있으면 보존. 명백한 복붙 오타만 정정하고 한 줄로 알린다.

## 성능 측정

- production 모드로 측정: `pnpm build` + `pnpm start`. dev 모드 LCP/CLS 신뢰 금지.
- chrome-devtools MCP: navigate → trace → lighthouse → network 순서. Lighthouse MCP 는 Performance 카테고리 제외 한계.
- Turnstile 가 자동화 차단하므로 측정 환경에서는 always-pass 테스트 키(`1x00000000000000000000AA`) 사용.
