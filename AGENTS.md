# AGENTS.md

이 파일은 자동 코드 리뷰 에이전트(Codex 등)와 이 저장소에서 작업하는 에이전트가 읽는 **상시 지침**이다.
특정 PR 에 종속되지 않으며, 모든 PR 에 공통 적용한다. 아래 예시는 특정 사건 기록이 아니라
반복되는 패턴을 보여주기 위한 것이다.

현재 범위는 **테스트 코드 리뷰**다. 제품 코드 아키텍처/구조 지적은 여기서 다루지 않는다
(그쪽은 `.coderabbit.yaml` 의 path_instructions 가 담당). 리뷰 대상 경로는
`apps/web/tests/**`, `apps/web/playwright.config.ts`, `apps/web/vitest.config.ts`,
`apps/back-office/tests/**` 등 테스트 코드뿐이다.

## 테스트 아키텍처 (POM)
이 저장소의 E2E 는 Page Object Model(POM) 을 표준 기법으로 쓴다. 리뷰·작성 시 다음 구조를 전제한다.
- Page Object 만 클래스다. 로케이터는 생성자에서 `readonly Locator` 로 선언하고
  `apps/web/tests/pages/<도메인>/` 에 두며 `BasePage` 를 상속한다.
- 스펙은 POM 을 `new` 하지 않는다. `apps/web/tests/fixtures/test.ts` 의 확장 `test` 가 주입하는
  fixture(`accessPage`/`dashboardPage`/`testCasePage`/`testSuitePage` 등)로 받고, `test`·`expect` 도
  이 파일에서 import 한다.
- 단언은 의도를 드러내는 POM 메서드(`expect...`)로 캡슐화한다. 로케이터 문자열·원시 단언이
  스펙으로 새지 않게 한다.
- scenario.md(설계 문서)가 먼저이고 spec/POM 은 그 Given/When/Then 을 그대로 반영한다.

## 테스트 리뷰 — 블로킹 (반드시 지적)
- **설정으로 테스트 전체가 깨지는 변경.** `vitest.config.ts` 의 `setupFiles`/`include`/`exclude`,
  `playwright.config.ts` 의 `testDir`/`testMatch`/프로젝트 매칭이 실제 존재하지 않는 경로·파일을
  가리키거나, 인증 필요 스펙이 인증 프로젝트가 아닌 곳에 매칭되는 경우. 설정 변경 PR 은 항상
  "이 경로/파일이 실제로 존재하는가"를 대조한다.
- **scenario.md 의 Then 미검증.** 스펙이 자기 시나리오 문서의 Then 을 실제로 단언하지 않는 경우.
  특히 "새로고침 후에도 남아 있다(optimistic 아닌 실제 영속)" 류는 reload 후 재단언이 없으면
  optimistic UI 만으로 통과하는 헛검증이다.
- **빈/죽은 spec 파일**이 러너에 수집되는 경우, rename 으로 파일명과 내용이 어긋난 경우.
- 단언 없는 헬퍼/빈 test 본문이 통과로 잡혀 false green 을 만드는 경우. 미완 시나리오는
  `test.fixme` 로 표기.
- 테스트가 보안 검증을 우회(예: 운영 환경 봇 차단 무력화)하거나, 실패 후 브라우저
  컨텍스트가 복구 불능 상태로 남는 경우.

## 테스트 리뷰 — 주요 (지적 권장)
- **페이지네이션 취약 단언.** 목록 존재/부재 단언을 검색·필터로 좁히지 않으면, 신규 항목이
  첫 페이지 밖으로 밀릴 때 flaky 하다. 부재 단언은 `not.toBeVisible()` 보다 `toHaveCount(0)` 가
  견고하다.
- **검증 메시지 가정 오류.** 폼 resolver 가 `zodResolver(...)` 이면 react-hook-form 의
  `register(..., { required/minLength/pattern })` 네이티브 룰은 무시된다. 스펙은 RHF 룰 메시지가
  아니라 실제 검증 계층(zod 스키마 등)이 노출하는 메시지를 단언해야 한다.
- **고정 딜레이/누락된 대기.** `waitForTimeout(고정값)` 대신 조건 기반 대기. 불필요한 sleep.
- **POM 누수.** 로케이터 문자열·원시 단언이 스펙으로 새는 경우. 단언은 의도를 드러내는 POM
  메서드로 캡슐화한다. 스캐폴딩은 "필드만 정의" 규약(필드+생성자 로케이터, 메서드 금지)을
  요청받았을 때 그대로 따른다.
- 테스트 환경 전제의 누락. 예: 시드 데이터에 의존하는 식별자가 스키마 제약(엄격한 UUID 등)을
  만족하지 않으면 폼 전체가 무반응이 되는 식의, 환경 전제가 깨질 때 침묵 실패하는 경우.

## 테스트 리뷰 — 마이너 (정리 권장, 과하지 않게)
- 한국어 테스트 제목은 평서문 + 마침표. `describe`/`test.step` 설명이 실제 동작과 일치.
- scenario.md 의 경로·식별자 토큰이 실제 디렉토리/구조와 일치하고, 문서의 실행 명령 경로가
  현재 구조와 일치.
- 매 실행 고유 식별자는 `Date.now()` 단독보다 충돌에 강한 suffix 권장(병렬 워커 고려).

## 테스트 리뷰 — 스킵 (지적하지 말 것)
- CodeRabbit 과 겹치는 단순 포매팅/스타일 선호.
- 타입/린트 에러(별도 CI 가 잡음).
- 의도적으로 `test.fixme`/주석으로 결함을 문서화한 항목(사유가 적혀 있으면 그대로 둔다).
- 내부 전용 테스트 데이터 팩토리의 사소한 형태.

## 자동 리뷰 출력 규약
- 한국어, 인라인 코멘트, 파일·라인 명시. 실제 문제만. AI 생성 푸터·서명 금지.
- 블로킹/주요/마이너를 구분해 우선순위가 드러나게 한다.
