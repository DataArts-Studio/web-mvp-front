<div align="center">

# Testea (테스티아)

**소규모 팀을 위한 가볍고 빠른 테스트 케이스 관리 플랫폼**

테스트 케이스를 작성 → 관리 → 실행 → 자동화까지 하나의 워크플로우로 묶어주는 웹 서비스

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

<br />

[**운영**](https://gettestea.com) · [**개발**](https://dev.gettestea.com) · **백오피스** admin.gettestea.com

</div>

---

## 목차

- [소개](#소개)
- [모노레포 구조](#모노레포-구조)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처-feature-sliced-design-fsd)
- [주요 도메인](#주요-도메인)
- [데이터 흐름](#데이터-흐름)
- [보안 기본 전제](#보안-기본-전제)
- [시작하기](#시작하기)
- [배포](#배포)

## 소개

테스트 케이스를 Google Docs나 Excel로 관리하면 버전 증가, 수동 수정, 누락으로 비효율이 쌓입니다. 특히 1~3인 규모 팀에서는 그 유지 비용이 더 크게 체감됩니다. Testea는 이 비효율을 부담 없이 해소하는 것을 목표로, 테스트 케이스의 작성부터 실행 리포트까지를 하나의 UI로 묶어줍니다.

## 모노레포 구조

pnpm workspace + Turborepo 기반 모노레포입니다.

```text
.
├── apps/
│   ├── web/          # 사용자 대상 서비스 (gettestea.com)
│   ├── back-office/  # 운영 백오피스 (admin.gettestea.com, 별도 배포)
│   └── runner/       # Playwright 자동 실행 러너 (Fly.io, 순수 실행기)
└── packages/
    ├── db/           # Drizzle 스키마·쿼리·마이그레이션 (RLS deny-anon 정책 동반)
    ├── ui/           # 디자인 시스템 컴포넌트
    ├── lib/          # 도메인 로직
    ├── util/         # 순수 유틸 (React/Next 의존 없음)
    └── fetch-kit/    # 클라이언트/서버 fetch 래퍼
```

> **패키지 경계 원칙**
> 새 코드는 한 앱에서만 쓰이면 `apps/*/src/shared/`에 두고, 두 앱이 함께 쓰거나 외부 노출 가능성이 있을 때만 패키지로 승격합니다.

## 기술 스택

| 구분        | 기술                                                         |
| ----------- | ------------------------------------------------------------ |
| 프레임워크  | Next.js 16 (App Router) + React 19                           |
| 언어        | TypeScript 5 (strict)                                        |
| 모노레포    | pnpm workspace + Turborepo                                   |
| 상태 관리   | Zustand 5 (클라이언트) + TanStack Query 5 (서버)             |
| 폼·검증     | React Hook Form 7 + Zod 4                                    |
| DB / ORM    | PostgreSQL (Supabase) + Drizzle ORM                          |
| 스타일링    | Tailwind CSS 4 + Framer Motion                               |
| 국제화      | next-intl (ko / en)                                          |
| 자동화 러너 | Hono + Playwright (Fly.io 격리 컨테이너)                     |
| 봇 방지     | Cloudflare Turnstile                                         |
| 관측        | Sentry                                                       |
| 테스트      | Vitest + Testing Library + MSW (단위·통합), Playwright (E2E) |
| 개발 도구   | Storybook 10, ESLint 9, Prettier, Husky, lint-staged         |

## 아키텍처: Feature-Sliced Design (FSD)

`apps/web`는 App Router와 FSD를 혼합해 구성합니다.

```text
apps/web/
├── app/              # Next.js 라우트 (app/api/** = 서버 라우트)
└── src/
    ├── app-shell/    # 전역 프로바이더·레이아웃·스타일
    ├── shared/       # 공유 유틸·훅·UI (앱 내부 한정)
    ├── entities/     # 비즈니스 엔티티 (project, test-suite, test-case 등)
    ├── features/     # 사용자 기능 (projects-create, suites-create 등)
    ├── widgets/      # 합성 위젯 (header, aside, footer)
    └── view/         # 라우트 단위 페이지 뷰
```

새 코드 위치는 라우트 한 곳에서만 쓰면 `view`, 여러 라우트가 쓰면 `widgets`/`features`, 두 앱이 함께 쓸 가능성이 있으면 패키지 승격을 검토합니다.

## 주요 도메인

| 엔티티    | 설명                               |
| --------- | ---------------------------------- |
| Project   | 프로젝트 관리 (비밀번호 단위 진입) |
| TestSuite | 테스트 스위트                      |
| TestCase  | 테스트 케이스                      |
| TestRun   | 테스트 실행 (수동·자동 결과 기록)  |
| Milestone | 마일스톤                           |

## 데이터 흐름

```text
클라이언트 → Server Action / API Route → Zod 검증 → Drizzle ORM → PostgreSQL (Supabase)
```

자동화 실행 경로는 Testea 서버가 회귀 자산을 Playwright spec으로 변환해 `runner`에 HTTP로 전달하고, 러너가 격리 컨테이너에서 실행한 결과를 다시 Test Run에 기록합니다.

## 보안 기본 전제

- 사용자 계정 없음. 프로젝트별 비밀번호(bcrypt 해시)로 진입하고, 봇 차단은 Cloudflare Turnstile로 처리합니다.
- 신규 API 라우트는 외부 입력·웹훅·LLM 응답을 신뢰하지 않습니다. 입력 검증 + 권한 가드(`requireProjectAccess`)가 필수입니다.
- 신규 DB 테이블은 RLS deny-anon 정책을 마이그레이션에 함께 포함합니다 (서버·service_role 경유만 허용).
- 분석·추적 코드는 운영 환경에서만 동작하도록 환경 가드(`VERCEL_ENV === 'production'`)를 둡니다.

## 시작하기

### 요구 사항

- Node.js 20 이상
- pnpm 10 이상 (`corepack enable`)

### 설치 및 실행

```bash
pnpm install

# 전체 앱 개발 서버 (Turborepo)
pnpm dev

# 특정 앱만 실행
pnpm --filter web dev
pnpm --filter back-office dev
pnpm --filter @testea/runner dev
```

### 자주 쓰는 스크립트

루트에서 Turborepo로 워크스페이스 전체를 실행합니다.

```bash
pnpm build          # 전체 빌드
pnpm lint           # 전체 린트
pnpm test           # Vitest
pnpm format:check   # Prettier 검사 (CI 동일)
pnpm format         # Prettier 적용
```

`apps/web` 전용 스크립트:

```bash
pnpm --filter web e2e          # Playwright E2E
pnpm --filter web e2e:ui       # Playwright UI 모드
pnpm --filter web storybook    # Storybook (포트 6006)
pnpm --filter web test:coverage
```

### 검증 (PR 전 필수)

PR 생성·추가 커밋 push 전, cherry-pick/rebase 직후 아래를 로컬에서 통과시킵니다.

```bash
pnpm format:check
pnpm turbo run lint test   # 변경 패키지 기준
```

UI 변경은 타입체크·테스트 통과만으로 충분하지 않으며, dev 서버에서 실제 동작을 확인합니다.

## 배포

| 대상              | 플랫폼 | 비고                                              |
| ----------------- | ------ | ------------------------------------------------- |
| web / back-office | Vercel | 운영 DB와 preview/dev DB는 Vercel env 분기로 분리 |
| runner            | Fly.io | 격리 컨테이너에서 Playwright spec 실행            |

러너의 HTTP 계약·환경변수·배포 절차는 [`apps/runner/README.md`](apps/runner/README.md)를 참조하세요.
