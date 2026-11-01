---
name: write-test
description: 대상 코드에 대한 Vitest 유닛/통합 테스트 또는 Playwright E2E 를 방법론(docs/issues/test-refactor/methodology.md) 기준으로 작성한다. 테스트 추가·재작성 요청 시 사용.
---

# write-test

판단 근거는 `docs/issues/test-refactor/methodology.md` 의 `[M1]`~`[M9]` 다. 작업 시작 전에 반드시 읽는다.
아래 규칙은 방법론에서 파생된 것이고, 규칙에 없는 상황은 방법론으로 판단한 뒤 근거 태그를 보고에 적는다.
목표는 커버리지 숫자가 아니라 "실제 버그에 실패하고 리팩터링에는 깨지지 않는" 테스트다.

## 입력

- 대상 코드: 파일 경로 또는 기능명 (args)
- 관련 FDD / scenario.md: 있으면 경로

## 절차 (1~4 산출물을 먼저 보고하고 작성한다)

1. 코드 분류 `[M4]`: 각 함수/모듈을 A/B/C/D 로 분류하고 근거 한 줄. D 가 있으면 테스트 대신 분리 리팩터링을 먼저 제안한다.
2. 동작 목록 `[M2]`: 호출자/사용자 관점 문장으로 나열, 동작마다 단언 유형(output/state/communication) 표기.
3. 케이스 도출 `[M5]`: `| 동작 | 기법 | 케이스 | 입력 | 기대 결과 |` 표. 표에 없는 케이스는 쓰지 않는다.
4. 레이어·의존성 결정 `[M3][M4]`: 케이스마다 유닛/통합/E2E 중 가장 낮은 하나. 의존성마다 실제/Fake/Stub/Mock 중 하나와 이유.
5. 작성 `[M6][M7][M9]`
6. 검증 `[M8]`

## 규칙

### Test Double `[M3]`

- 내부 모듈 간 호출은 mock 하지 않는다.
- mock 은 unmanaged 의존성(외부 API, Sentry, 웹훅, LLM)에만 쓰고, 사유를 테스트 상단 주석 한 줄로 남긴다.
- stub 한 값이 그대로 반환되는지만 확인하는 테스트(tautology) 금지.

### 개별 테스트 `[M6][M7]`

- AAA, Act 한 줄, 테스트 하나에 동작 하나, 테스트 내 로직 금지, 기대값은 리터럴.
- 이름: 동작 서술형 한국어 평서문 + 마침표.
- 시간은 `vi.useFakeTimers`/`vi.setSystemTime`, 랜덤/ID 는 주입. 각 테스트 후 mock/timer 복원.
- 의미 있는 matcher 사용 (`toBe(true)` 지양).

### Vitest (apps/web)

- 위치: 대상 옆 `src/**/<name>.test.ts(x)`. 환경 jsdom, globals.
- 공용 셋업/목 `src/shared/test/` (`setup-tests.ts`, `mocks/`, `__mocks__/`) 를 먼저 확인하고 재사용.
- 컴포넌트: Testing Library, getByRole > getByLabelText > getByText > getByTestId.

### Playwright (apps/web/tests) `[M9]`

- scenario.md 가 먼저. 없으면 Given/When/Then 을 작성해 보고하고 spec 은 그대로 반영.
- 스펙은 POM 을 `new` 하지 않는다. `tests/fixtures/test.ts` 의 `test`/`expect` 를 import 하고 fixture 로 받는다.
- 로케이터는 `tests/pages/<도메인>/` Page Object(`BasePage` 상속)의 `readonly Locator`. 단언은 POM `expect...` 메서드로 캡슐화.
- web-first assertion 만, `waitForTimeout` 금지.
- 영속성은 reload 후 재단언. 목록 존재/부재는 검색/필터로 좁히고, 부재는 `toHaveCount(0)`.
- 병렬 워커에서 충돌하지 않는 고유 suffix. 미완은 `test.fixme` + 사유. 빈 본문 금지.
- 보안 검증(Turnstile, 레이트 리밋)을 운영 코드에서 무력화하지 않는다. Turnstile 은 always-pass 테스트 키.

## 검증 (완료 보고 전 필수)

1. 전부 통과.
2. `[M8]` 각 테스트의 대상 분기를 일부러 깨뜨려 실패하는지 확인 후 원복. 실패하지 않은 테스트는 재작성하거나 삭제.
3. `[M1]②` "내부 함수명/호출 순서/내부 state 구조를 바꾸면 깨지는가?" 자가점검.
4. `pnpm format:check`, `pnpm -w turbo run lint test --filter=<변경 패키지>` 통과.

## 보고

- 1~4 단계 산출물
- 작성한 테스트: 이름 / 레이어 / 검증 동작 / 근거 태그 / mock 여부와 사유
- 작성하지 않은 것과 이유 (근거 태그 포함)
- 실패 확인 결과 (어떤 변경으로 어떤 테스트가 실패했는지)
- 규칙에 없어 방법론으로 판단한 사항
