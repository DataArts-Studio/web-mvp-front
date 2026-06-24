# qaground

QA 엔지니어를 위한 **자동화 테스트 연습 플레이그라운드**이자, 기업이 **QA 채용 과제전형(평가)**을 돌리는 서브 제품. 배포 대상은 `qaground.gettestea.com` (web·back-office와 분리 배포).

## 왜 만드나

기존 QA 연습 사이트(qalearningweb.com, demoqa, the-internet 등)는 연습용 페이지만 제공한다. 작성한 테스트를 실행해 주지도, 채점하지도, 피드백을 주지도 않는다. qaground는 Testea가 이미 가진 격리 실행 러너(`apps/runner`)와 LLM 코드 생성 자산을 재사용해 **"제출 → 실행 → 자동 채점 → 피드백"** 폐루프를 제공한다. 무료 연습으로 유입을 만들고, 본 제품(Testea 테스트 관리)과 기업 과제전형으로 전환·수익화한다.

## 기능 4기둥

1. **플레이그라운드**: 로그인, 폼 검증, 동적 테이블, 드래그앤드롭, 파일 업로드, 가짜 REST API 등 자동화 연습 대상 페이지. 공개(인증 없음) = SEO 입구.
2. **자동 실행·채점**: 제출한 Playwright/Cypress 스펙을 격리 러너에서 실행하고 숨김 검증 스펙으로 통과/실패 채점.
3. **학습 경로·인증**: 난도별 과제 카탈로그, 진행률 추적, 수료 배지.
4. **과제전형(B2B)**: 기업이 과제를 출제하고 후보 제출을 자동 채점한 리포트를 받는 채용 평가.

전체 구상과 단계 로드맵, 열린 결정사항은 `docs/issues/qaground/qaground-기능정리.md` 참조.

## 상태

스캐폴딩 단계. 현재는 디자인 시스템이 연결된 플레이스홀더 랜딩만 있다. 다음 마일스톤은 MVP 1개 시나리오(스펙 제출 → 러너 실행 → 결과 표시) end-to-end.

## 구조

FSD(Feature-Sliced Design). 다른 앱(`apps/web`, `apps/back-office`)과 동일한 컨벤션을 따른다.

```
apps/qaground
├── app/                 # Next.js App Router 진입점 (layout, page)
├── src/
│   ├── app-shell/       # globals.css 등 앱 셸
│   └── shared/          # 공용 유틸·테스트 셋업 (상위 레이어 참조 금지)
├── next.config.ts       # 모노레포 루트 고정 + @testea/* transpile
└── vitest.config.ts
```

- 디자인 시스템은 `@testea/ui`를 쓴다. Tailwind v4 content scan에서 누락되지 않도록 `src/app-shell/globals.css`에 `@source`로 `packages/ui/src`를 등록해 둔다(신규 클래스 미적용 함정 방지).
- 클라이언트 훅(`useState`·`useEffect` 등) 사용 파일은 최상단 `'use client'` 선언 필수.

## 개발

```bash
pnpm --filter qaground dev     # http://localhost:3200
pnpm --filter qaground build
pnpm --filter qaground lint
pnpm --filter qaground test
```

포트는 web(3000), back-office(3100)와 겹치지 않게 **3200**을 쓴다.

## 관련

- 실행 인프라: `apps/runner` (Fly.io 격리 Playwright 러너) 재사용
- 결과 적재·인증 패턴: FDD-TR09 auto-results API, `project_automation_tokens`
- 본 제품: Testea (테스트 관리, `apps/web`)
