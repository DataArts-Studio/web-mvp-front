# Testea
테스트 관리 플랫폼 - Next.js 16 기반의 풀스택 웹 애플리케이션

## Overview
테스트 케이스를 Google Docs나 Excel로 관리할 때 버전 증가, 수동 수정, 누락 등으로 인해 비효율이 크게 발생합니다. 특히 1~3인 규모의 팀에서는 이 유지 비용이 더 크게 체감됩니다.

본 프론트엔드 프로젝트는 이러한 비효율을 해결하기 위한 **웹 기반 테스트 케이스 관리 도구의 UI·UX·기능 레이어를 구현하는 것**을 목표로 합니다.

## Frontend Perspective
- 테스트 케이스를 **작성 → 관리 → 실행**까지 하나의 UI에서 처리
- 문서 복사 없이 반복 테스트가 가능한 구조 제공
- 직관적인 UX로 누구나 온보딩 없이 바로 사용 가능
- 소규모 팀에서도 과하지 않은, 가볍고 빠른 워크플로우 제공
- 애니메이션·인터랙션까지 고려한 매끄러운 사용 경험 제공

## 개발 철학 (Frontend)
본 프로젝트에서는 **기술, 패턴을 엄격하게 강제하지 않습니다.** 대신 `프로젝트 품질을 해치지 않는 선`에서  새로운 시도를 자유롭게 해보는 **실험형 사이드 프로젝트**로 운영합니다.

## 기술 스택
  | 구분       | 기술                                             |
  |------------|--------------------------------------------------|
  | 프레임워크 | Next.js 16.0.10 (App Router) + React 19          |
  | 언어       | TypeScript 5 (strict mode)                       |
  | 상태 관리  | Zustand 5 (클라이언트) + TanStack Query 5 (서버) |
  | 폼 관리    | React Hook Form 7 + Zod 4                        |
  | DB/ORM     | PostgreSQL + Drizzle ORM + Supabase              |
  | 스타일링   | Tailwind CSS 4 + Framer Motion                   |
  | 테스트     | Vitest + Testing Library + MSW                   |
  | 개발 도구  | Storybook 10, ESLint 9, Prettier, Husky          |

##  아키텍처: Feature-Sliced Design (FSD)
```text
  src/
  ├── app-shell/     # 전역 프로바이더, 스타일
  ├── shared/        # 공유 유틸, 훅, UI 컴포넌트, DB 설정
  ├── entities/      # 비즈니스 엔티티 (project, test-suite, test-case 등)
  ├── features/      # 사용자 기능 (projects-create, suites-create 등)
  ├── widgets/       # 조합 UI (header, aside, footer)
  └── view/          # 페이지 뷰
```

##  주요 기능 모듈
  | 엔티티    | 설명          |
  |-----------|---------------|
  | Project   | 프로젝트 관리 |
  | TestSuite | 테스트 스위트 |
  | TestCase  | 테스트 케이스 |
  | TestRun   | 테스트 실행   |
  | Milestone | 마일스톤      |

## 데이터 흐름
  클라이언트 → Server Action → Zod 검증 → Drizzle ORM → PostgreSQL (Supabase)