# @testea/runner

FDD-TR10 자동 실행 러너 서비스. **순수 Playwright 실행기**다.

Testea 서버가 HTTP 로 이 러너를 호출하면, 러너는 받은 spec 코드를 격리 실행하고
결과만 돌려준다. 러너는 DB 에 접근하지 않으며 (`@testea/*` 의존 없음), 결과 회수와
Test Run 기록(TR09 auto-results)은 Testea 쪽이 담당한다.

## 실행 방식 (PoC 에서 확정)

- 요청마다 격리된 임시 디렉터리 + 자체 Playwright config 생성 (기존 앱 config 미사용).
- `@playwright/test` CLI 를 `child_process` 로 실행하되 `--workers=1`, `stdio: 'ignore'`,
  하드 타임아웃 적용.
- 결과는 stdout 이 아니라 JSON reporter `outputFile` 에서 파싱 (버퍼 hang 회피).
- 파싱 기준: `stats.expected`/`stats.unexpected` + 첫 test result 의 `status`/`duration`/`error.message`.

## HTTP 계약

### `GET /health`

인증 예외. 200 `{ "ok": true }`.

### `POST /run`

인증 필요. 요청:

```jsonc
{
  "spec": "import { test, expect } from '@playwright/test'; ...", // 필수, 단일 spec 소스
  "baseUrl": "https://target.example.com", // 선택, config use.baseURL
  "storageState": { "cookies": [], "origins": [] }, // 선택, config use.storageState
  "timeoutMs": 60000, // 선택, 전체 하드 타임아웃 (기본 60s)
}
```

응답:

```jsonc
{
  "ok": true, // expected > 0 && unexpected === 0
  "status": "passed", // passed | failed | timedOut | skipped | ...
  "durationMs": 1234, // 첫 test result 의 duration
  "errorMessage": "...", // 실패/타임아웃 시에만
}
```

`spec` 누락/빈 문자열, 잘못된 `baseUrl`/`timeoutMs` 타입은 400.

### 인증

`/health` 를 제외한 모든 요청은 헤더 `X-Runner-Secret` 가 `RUNNER_SHARED_SECRET`
환경변수와 일치해야 한다. 불일치는 401, 시크릿 미설정은 503.

## 환경변수

| 이름                   | 용도                                                |
| ---------------------- | --------------------------------------------------- |
| `PORT`                 | 리슨 포트 (기본 8080)                               |
| `RUNNER_SHARED_SECRET` | Testea ↔ 러너 공유 시크릿. **Fly secret 으로 주입** |

평문으로 코드/레포에 두지 않는다. 운영 주입:

```bash
fly secrets set RUNNER_SHARED_SECRET=... --app testea-runner
```

## 보안 전제

`spec` 은 **임의 코드 실행**이다. 러너는 격리된 Fly 컨테이너에서만 돌고,
공유 시크릿으로 인증된 Testea 호출만 받는다. 이 두 전제 밖에서는 절대 노출하지 않는다.

대상 사이트 인증은 러너가 다루지 않는다. Testea 가 target_sites 시크릿을 복호화해
`storageState`(쿠키/오리진 인증 상태)로 구성한 뒤 요청에 실어 보낸다.

## 로컬 실행

```bash
pnpm --filter @testea/runner dev      # tsx watch
# 또는
pnpm --filter @testea/runner build && pnpm --filter @testea/runner start
```

```bash
curl localhost:8080/health
curl -X POST localhost:8080/run \
  -H "X-Runner-Secret: $RUNNER_SHARED_SECRET" \
  -H "content-type: application/json" \
  -d '{"spec":"import {test,expect} from \"@playwright/test\"; test(\"t\", async()=>{expect(1).toBe(1);});"}'
```

## 배포 (Fly.io)

```bash
cd apps/runner
fly apps create testea-runner          # 최초 1회
fly secrets set RUNNER_SHARED_SECRET=...
fly deploy --config fly.toml
```

베이스 이미지 `mcr.microsoft.com/playwright:v1.60.0-jammy` 는 `@playwright/test` 버전과
같이 올려야 한다 (lockfile 의 resolved 버전과 Dockerfile 태그를 일치시킬 것).
