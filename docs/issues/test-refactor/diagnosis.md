# 테스트 진단 요약

- 기준: [`methodology.md`](./methodology.md) `[M1]`~`[M9]`, 절차는 `.claude/skills/diagnose-test/SKILL.md`
- 대상: 저장소 tracked 테스트 113개 파일 (apps/web 91, back-office 8, qaground 4, runner 4, packages 6)
- 기준 커밋: `dev` @ `4201f66`
- 상세 처분표:
  - [`diagnosis/web-entities-features.md`](./diagnosis/web-entities-features.md) (apps/web entities, features 56개)
  - [`diagnosis/web-access-shared-e2e.md`](./diagnosis/web-access-shared-e2e.md) (apps/web access, shared, view 유닛 + Playwright 35개)
  - [`diagnosis/other-apps-packages.md`](./diagnosis/other-apps-packages.md) (back-office, qaground, runner, db, fetch-kit, util 22개)
- 진단은 정적 판독이다. 헛검증은 "의심"으로 표기했고, 아래 "확인됨" 표시 항목만 실제로 재현했다.

## 1. 실측 기준선 (apps/web vitest, 2026-11-01)

| 항목       | 값                          |
| ---------- | --------------------------- |
| 테스트     | 530 통과, 18 skip (78 파일) |
| Statements | 18.75%                      |
| Branches   | 13.56%                      |
| Functions  | 11.49%                      |
| Lines      | 18.83%                      |

- `apps/web/vitest.config.ts` 의 threshold 는 전 항목 80% 이지만, CI 는 `pnpm -w turbo run test` 로 커버리지 없이 실행한다. threshold 는 강제되지 않는 죽은 설정이고, `pnpm test:coverage` 를 로컬에서 돌리면 실패한다.
- 비교적 높은 곳: `access/policy` 96%, `entities/project` 82%, `access/lib` 77%, `entities/ai-config` 74%.
- 0% 인 큰 덩어리: `view/project`(2698 lines 중 7%), `widgets/*`, `features/ai-generate*`, `features/runs-share`, `features/trash`, `entities/test-scenario`, `entities/checklist`.
- 커버리지 정책([methodology 커버리지 정책](./methodology.md#커버리지-정책))에 따라 전역 수치를 올리는 것은 목표가 아니다. 낮은 커버리지보다 "덮인 곳이 실제로 검증되는가" 가 더 큰 문제로 나왔다 (아래 2절).

## 2. 처분 집계

| 그룹                  | 단위       | 유지 | 재작성 | 레이어 이동 | 삭제 |
| --------------------- | ---------- | ---: | -----: | ----------: | ---: |
| web entities/features | 154행      |   66 |     28 |          20 |   40 |
| web access/shared/E2E | 73행       |   30 |     15 |          13 |   15 |
| 기타 앱/패키지        | 134 테스트 |  103 |     13 |           4 |   14 |

- 행 단위가 그룹마다 다르다(파일/처분 묶음 vs 테스트 선언). 비율로만 비교한다.
- web 의 "레이어 이동" 다수는 DB 통합 테스트로의 이동이다. 통합 하네스가 생기기 전까지 현 테스트는 지우지 않는다.
- web 삭제 40행 중 24행은 C 분류(`catch` 고정 메시지 반환 테스트)다.

## 3. 공통 원인 (반복 패턴)

### P1. 우리 DB 와 내부 모듈을 mock 해서 핵심 로직이 실행되지 않는다 `[M3][M8]`

세 그룹 모두 1위로 나왔다. 근본 원인은 저장소에 **DB 통합 테스트 기반이 없다**는 것이다.

- 공용 `apps/web/src/shared/test/__mocks__/db.ts` 가 Drizzle 체인을 흉내 내며, 모든 select 가 값 하나를 공유한다. 다중 쿼리 시나리오를 표현할 수 없어 stub 행을 그대로 돌려받는 테스트가 양산됐다.
- 전역 `setup-tests.ts` 가 `requireProjectAccess` 와 용량 검사를 항상 통과로 고정한다. 권한 거부 경로가 대부분의 테스트에서 비어 있다.
- 레이트 리밋 잠금 규칙은 SQL(`apps/web/src/shared/lib/rate-limit/index.ts:48-63`)에 있는데, 어떤 테스트도 그 SQL 을 실행하지 않는다. 잠금 테스트들은 `__mocks__/rate-limit.ts` 의 JS 재구현을 검증한다.
- `packages/db` 쿼리 테스트는 `drizzle-orm` 의 `sql` 까지 mock 해 SQL 이 실행되지 않는다.

### P2. 구현에 결합된 단언 `[M2]`

호출 순서(`invocationCallOrder`), 조회 순서 큐, `eq` 호출 횟수, SQL 문자열, CSS 클래스, 설정 리터럴을 단언한다. 쿼리 순서만 바꿔도 깨지고, 반대로 큐가 어긋나 예외가 나도 "거부" 테스트가 통과할 수 있다.

### P3. 보안 경계 모듈이 mock 대상이 되고 자체 테스트는 없다 `[M3][M5]`

- `assertRunResources`(소유 검사)는 다른 테스트에서 mock 되어 호출 인자만 단언되고, 자체 테스트가 없다.
- 자동화 토큰 검증 `features/automation-token/lib/verify.test.ts:83-102` 는 mock 이 `token_hash: 'whatever'` 를 돌려줘도 성공을 단언한다. 해시 계산·비교가 틀려도 통과한다. (확인됨)
- `access/lib/access-token.test.ts:121-148` 은 가짜 서명 때문에 서명 비교에서 먼저 거부되어, 이름이 말하는 타입 검증 분기가 실행되지 않는다.

### P4. E2E 헛검증과 수집 문제 `[M9][M8]` (AGENTS.md 블로킹)

- `apps/web/tests/pages/project/project-dashboard.page.ts:82-86` 의 `expectProjectName`, `expectProjectUrlCopy`, `expectNavigationTo` 본문이 비어 있다. `scenario/access/project-access.spec.ts:21` 이 호출하므로 아무것도 검증하지 않고 통과한다. (확인됨)
- `apps/web/tests/project-search/departure.spec.ts` 가 0바이트인데 러너에 수집된다. (확인됨)
- `scenario/testcase/create-testsuite.spec.ts` 가 testcase 폴더에 있고, scenario.md 가 전제하는 `scenario/testsuite` 패턴이 `playwright.config.ts` 에 없다.
- scenario.md Then 미검증 3곳: testcase 폼 닫힘, project Step1 인라인 에러, project-search 대시보드 도달.

### P5. 중복·C 분류·방치된 skip `[M4][M6]`

- 레거시 `tests/create-project/*` 와 `scenario/project`, `scenario/access` 와 `smoke` 가 겹친다.
- 미사용 API(`getTokenRemainingTime`, password-hash sync API), 타입 리터럴, `example.test.tsx` 를 테스트한다.
- `describe.skip`/`it.skip` 9곳. `storage-limit-integration.test.ts` 는 전부 skip 이고 mock 대상도 틀렸다.
- "존재하지 않으면 에러" 이름의 테스트 5건은 실제로는 경합 경로를 검증한다 (이름 오도).

### P6. 설정 문제

- `apps/web/vitest.config.ts` threshold 80% 가 CI 에서 강제되지 않는다 (1절).
- qaground: `passWithNoTests` 가 켜져 있어 include 가 깨져도 초록. `server-only` alias 가 없어 `*.server.ts` 를 테스트할 수 없다.
- runner: tsconfig 가 `src` 만 포함해 테스트 파일이 타입체크되지 않는다.

## 4. 테스트 공백에서 발견된 제품 결함

테스트 정비 범위 밖이지만 진단 중 나왔다. 수정은 별도 이슈로 다룬다.

| 심각도      | 위치                                                                 | 내용                                                                                                                                                                                                  | 상태   |
| ----------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 높음 (보안) | `apps/back-office/src/features/auth-gate/lib/safe-redirect.ts:28-29` | `safeRedirect('/..//evil.com')` 가 `URL` 정규화 후 pathname `//evil.com` 을 돌려준다. `app/notices/gate/page.tsx:17` 이 이 값으로 redirect 하므로 프로토콜 상대 URL 로 외부 이동한다 (open redirect). | 확인됨 |
| 중간        | `apps/qaground/src/shared/challenges` 채점기                         | 문자열 리터럴, `getByRole` 한 번으로 셀렉터 검사를 우회할 수 있다. 픽스처가 빈 클래스로 정규식만 맞춰 약점을 굳힌다.                                                                                  | 의심   |
| 낮음        | `packages/util/src/case-converter.ts:27`                             | `keysToSnakeCase` 가 `toCamelCase` 를 호출한다. 현재 사용처 없음.                                                                                                                                     | 확인됨 |
| 낮음        | `packages/fetch-kit`                                                 | baseUrl 에 경로가 있으면 버린다 (`https://api.example.com/v1/` + `/users` → `/users`). 현재 사용처 없음.                                                                                              | 의심   |
| 확인 필요   | `apps/web/middleware.ts:141-184`                                     | 테스트 없음. `%` 단독 경로에서 decode 오류 가능성.                                                                                                                                                    | 의심   |

## 5. 정비 우선순위 제안

순서는 "보안 영향 × 고치는 비용" 기준이다.

1. **E2E 블로킹 정리 (비용 작음)**: 빈 POM 메서드 구현, 0바이트 spec 삭제, testsuite spec 위치와 `playwright.config.ts` 패턴 정합, scenario.md Then 3곳 단언 추가. `[M9]`
2. **보안 경계 유닛 테스트 신설/재작성 (mock 없이 가능)**: `assertRunResources`, 자동화 토큰 해시 검증, access-token 타입 검증 분기, `safeRedirect`(back-office)·`safeInternalPath`(web) 의 dot-segment·인코딩 경계값, `verifyTurnstileToken` 결정 테이블. `[M5][M3]`
3. **DB 통합 하네스 도입**: 로컬/CI 용 Postgres(테스트 스키마)에서 Drizzle 쿼리를 실제 실행하는 vitest 프로젝트를 분리한다. 1순위 대상은 레이트 리밋 SQL, 이어서 소유 검사·run-scope·용량 제한. 하네스가 생기면 "레이어 이동" 행을 옮기고 해당 mock 테스트를 삭제한다. `[M3][M4]`
4. **공용 mock 축소**: 전역 `setup-tests.ts` 의 권한·용량 통과 고정을 제거하고 필요한 테스트에서만 명시한다. `__mocks__/db.ts` 는 3번 완료 후 퇴역. `[M3]`
5. **삭제·정리**: C 분류 catch 테스트, 중복 E2E, 미사용 API 테스트, 방치된 skip(사유 없으면 삭제, 있으면 `fixme` 화). `[M4][M6]`
6. **커버리지 설정 정비**: 전역 threshold 를 실측 바닥의 ratchet 으로 낮추고, A 분류 경로(`access/**`, `shared/lib/rate-limit/**`, `shared/lib/crypto/**` 등)에만 경로별 높은 threshold. CI 에 커버리지 실행과 PR diff 커버리지 추가 여부 결정. `[커버리지 정책]`
