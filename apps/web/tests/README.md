# E2E — 권장 POM 구조 (중앙집중 + 도메인 하위폴더)

`pages/` · `fixtures/` · `data/` · `tests/` 를 최상위로 두고, 그 안을 **도메인별
하위폴더**로 나눈 실무 권장 레이아웃. Page Object 만 클래스다.

> 범위: 이 문서는 신규 권장 구조(아래 트리)만 다룬다. 레거시 기능 폴더
> (`create-project/`, `project-search/`, `support/`, `share/`)는 구 패턴이며
> 이번 작업에서 건드리지 않았다. 점진 이관 대상.

## 폴더 구조

```
e2e/
  pages/                              # Page Object (클래스만), 도메인별 분리
    base.page.ts                      #   추상 베이스 (page 보관, 공통 nav)
    access/
      project-access.page.ts          #   도메인: 인증 게이트
    project/
      project-dashboard.page.ts       #   도메인: 프로젝트 화면(대시보드)
    index.ts                          #   배럴
  fixtures/
    test.ts                           # base test 확장 → POM 주입 + 공지 dismiss
  data/
    test-data.ts                      # 테스트 데이터 상수
  tests/                              # 스펙, 도메인별 분리
    access/
      project-access.e2e.ts
```

도메인이 늘면 `pages/<domain>/`, `tests/<domain>/` 를 같은 축으로 추가한다.
공유 베이스(`base.page.ts`)와 fixture/data 는 중앙에서 한 번만 둔다.

## 설계 원칙

- **Page Object 만 클래스.** locator 는 생성자에서 `readonly Locator` 로 선언
  (Playwright 공식 권장). 셀렉터 팩토리 파일 분리 안 함.
- **도메인 분리.** access(인증 게이트)와 project(대시보드)는 다른 도메인 →
  `pages/access`, `pages/project` 로 나눔. 배럴(`pages/index.ts`)로 한 곳에서 import.
- **fixture 주입.** 스펙은 `new` 대신 `accessPage`/`dashboardPage` fixture 사용.
  공지 dialog 무력화는 `page` 오버라이드 fixture 담당.
- **네비게이션은 스펙이 명시적으로.** 전역 `goto('/')` 강제 없음 — 각 테스트가
  자기 사전조건(히스토리 포함)을 직접 구성한다.
- **단언은 의도 드러내는 메서드로.** POM 이 `expectAtGate` 등 시맨틱 단언 제공,
  셀렉터가 스펙으로 새지 않게 한다.
- **확장자 `.e2e.ts` 유지.** `playwright.config.ts` 의 `testMatch` 는 vitest/IDE
  러너 충돌 회피용 전역 설정 제약이라 구조와 별개로 그대로 둔다.

## 사전조건

- 식별번호 8~16자로 발급된 `sample-project` 시드 필요.
- localhost: Turnstile siteKey 빈 문자열 → 위젯 미렌더(봇 검증 자동 통과).
- rate-limit 카운터는 dev 서버 인메모리 Map. 완전 락아웃(6회) 검증은 `test.fixme`.

## 명세 ↔ 구현 불일치 (작성 전 대조 결과)

스펙/POM 은 **실제 구현 기준**으로 작성했다. 명세 측 정합성은 별도 확인 필요.

- 식별번호 입력란은 `<input type="password">` → `textbox` role 없음 → `getByLabel`.
- 에러/만료 알림에 `role="alert"` 없음 → 표시 텍스트로 단언.
- "차단 화면 / 메인페이지 이동 버튼" 은 구현에 없음. 차단 = 에러 박스 메시지.
- 락아웃은 **15분**(`LOCKOUT_DURATION`). 초안 30분 / FDD-PJT03 범위외 5분과 다름.
- 차단은 5회째가 아니라 **6회째 제출**에서 발생.
- 빈 입력이어도 제출 버튼은 비활성이 아니다(localhost). 빈/짧은 입력은 제출 시 zod 메시지로 차단.
- 대시보드 H1 은 프로젝트명이 아니라 고정 텍스트 `대시보드`. 프로젝트명은
  "내 프로젝트 정보" 카드 텍스트로만 노출 → 도착 검증은 URL + `대시보드` 헤딩 기준.

## 시나리오 커버리지

| describe      | 케이스                                                                  | 상태         |
| ------------- | ----------------------------------------------------------------------- | ------------ |
| Golden path   | 직접 접근→인증→대시보드 / 보호라우트 리다이렉트→복귀 / 세션 재접근 스킵 | active       |
| validation    | 빈 값 / 8자 미만 / 틀린 값(잔여 횟수·입력 유지)                         | active       |
| redirect 쿼리 | 지정 경로 이동 / open-redirect 우회                                     | active       |
| cancel        | 뒤로가기 후 입력값 미보존                                               | active       |
| 차단          | 6회 rate-limit / Turnstile always-fail                                  | `test.fixme` |

## 실행

```bash
pnpm --filter web exec playwright test e2e/scenario/access
```

dev 서버 + `sample-project`(식별번호 `123123123`) 시드 필요. fixme 2건은 skip.
