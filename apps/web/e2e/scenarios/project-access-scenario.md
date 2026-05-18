## 사전조건
- 접근 검증용 프로젝트가 1개 이상 존재 (예: `sample-project`, 식별번호 미리 발급)
- access 페이지로 URL 직접 진입 — 랜딩·검색 흐름은 거치지 않는다 (project-search 에서 별도 검증)
- localhost: Turnstile siteKey 빈 문자열 → 위젯 미렌더 (봇 검증 자동 통과)
- preview/prod 자동화: always-pass 테스트 키 적용 → 골든패스가 위젯 통과까지 자연 검증
- rate-limit 카운터는 spec 시작 시 cleanup 된 상태여야 한다 (in-memory Map 격리)

## Golden path - URL 직접 접근 → 식별번호 입력 → 대시보드
- `/projects/{slug}/access?redirect=/projects/{slug}` 로 직접 진입한다.
- 식별번호 입력 페이지가 출력된다.
- Turnstile 위젯이 자동 통과 상태가 된다.
- 올바른 식별번호를 입력한다.
  - "접근하기" 버튼이 활성화된다.
- "접근하기" 버튼을 클릭한다.
  - `redirect` 쿼리에 명시된 원래 URL 로 이동한다.
  - 프로젝트 대시보드가 노출되고 프로젝트 이름이 페이지에 출력된다.

## Golden path - 보호 라우트 직접 접근 시 access 페이지로 리다이렉트 → 인증 → 원래 URL 복귀
- 인증되지 않은 상태에서 `/projects/{slug}` 로 직접 진입한다.
- `/projects/{slug}/access?redirect=/projects/{slug}` 로 리다이렉트된다.
- 올바른 식별번호를 입력하고 제출한다.
- 원래 진입하려던 `/projects/{slug}` 로 이동하고 대시보드가 출력된다.

## 인증된 세션 - 재접근 시 access 페이지 스킵
- 1차 접근 성공 후 같은 세션에서 `/projects/{slug}` 에 다시 진입한다.
  - access 화면을 거치지 않고 즉시 대시보드가 출력된다.
- 같은 세션에서 `/projects/{slug}/access` 에 직접 진입한다.
  - 이미 인증된 상태로 판단되어 대시보드로 리다이렉트된다. (정책 확인 후 반영)
- 쿠키 만료 후 재진입 시에는 access 페이지가 다시 출력된다.

## validation - 식별번호 입력
- 빈 식별번호 상태에서는 "접근하기" 버튼이 비활성 상태다.
- 잘못된 식별번호를 입력하고 제출한다.
  - 에러 메시지가 노출되고 입력값이 유지된다.
  - rate-limit 카운터가 1 증가한다.

## rate limit - 5회 실패 → 30분 차단
- 잘못된 식별번호로 4회 연속 제출한다.
  - 매번 에러 메시지가 노출되고 재입력이 가능하다.
- 5회째 실패한다.
  - 차단 안내 화면이 노출된다.
  - "메인페이지 이동" 버튼이 출력된다.
- 차단 상태에서 access 페이지를 다시 새로고침한다.
  - 즉시 차단 안내가 출력된다. (정책 확인 후 반영)
- 30분 경과 후 카운터가 리셋되어 재시도 가능하다. (시간 의존 — spec 에서는 cleanup 헬퍼로 우회)

## cancel - 페이지 이탈 시나리오
- 식별번호 입력 페이지에서 뒤로가기 한다.
  - 이전 페이지로 복귀한다.
- 다시 access 페이지에 진입하면 입력값이 비어있다.
- access 페이지에서 식별번호 입력 도중 다른 라우트로 이동하면 입력값은 유지되지 않는다.

## redirect 쿼리 처리
- `redirect=/projects/{slug}/suites` 로 진입 후 인증을 통과한다.
  - 인증 후 `/projects/{slug}/suites` 로 이동한다.
- `redirect` 쿼리 없이 access 페이지에 진입 후 인증을 통과한다.
  - 기본 경로(`/projects/{slug}`)로 이동한다. (정책 확인 후 반영)
- 잘못된 형식의 `redirect` 값이 들어온다.
  - 기본 경로로 안전하게 이동한다. (open redirect 방지)

## bot check - Cloudflare Turnstile 차단 (fixme, preview 한정)
> 위젯 통과(always-pass)는 사전조건 그대로 골든패스에서 자연 검증됨 — 본 섹션은 차단(negative) 케이스만 다룬다.
> always-fail 키가 적용된 별도 환경 또는 런타임 토글이 필요하므로 현재는 test.fixme 로 placeholder.

### (fixme) 위젯 차단 — always-fail 환경
- access 페이지에서 Turnstile 위젯이 렌더된다.
- 위젯이 fail 상태가 된다.
- 올바른 식별번호를 입력해도 제출이 차단된다 (버튼 disabled 또는 서버 거부).
- 봇 차단 에러 UI 가 노출되고 재시도가 가능하다.
