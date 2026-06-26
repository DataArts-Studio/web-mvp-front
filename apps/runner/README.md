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

`spec` 은 **임의 코드 실행**이다. 러너의 보안은 전적으로 격리에 의존하므로,
아래 운영 요건을 배포에서 **반드시** 충족해야 한다. 코드만으로는 강제되지 않는다.

### 코드/이미지에서 강제되는 것 (구현됨)

- spec 은 컨테이너 내 **비root 사용자(`pwuser`)** 로 실행된다 (Dockerfile `USER`).
- 자식 프로세스 env 는 **allowlist** 만 통과한다. `RUNNER_SHARED_SECRET` 등 시크릿은 차단된다.
- 요청별 작업 디렉터리는 **0700**, `storageState` 파일은 **0600** 으로 기록되고 실행 후 삭제된다.
- spec 의 `HOME`/`TMPDIR` 는 요청별 디렉터리로 고정된다(공유 임시 경로 사용 표면 축소).

### 배포에서 반드시 충족해야 하는 것 (ops 책임, **P0**)

- **아웃바운드 egress 차단**: spec 은 SSRF 가드(`url-guard.ts`)를 우회해 자체적으로
  내부망/메타데이터/외부로 통신할 수 있다. 입력 가드는 보조 수단일 뿐, **본 방어는
  컨테이너 egress 제한**(대상 사이트 대역만 허용)이다.
- **요청별 일회용 격리**: 동시 run 은 같은 파일시스템(`/app/.runs`)을 공유하므로,
  민감한 `storageState` 가 오가는 경로에서는 **run 당 새 머신/컨테이너**로 띄워
  교차 노출을 차단한다. 영구 재사용 머신에서 비신뢰 코드를 받지 않는다.
- **qaground ↔ Testea 러너 분리**: qaground 채점은 **인증 없는 공개 입력**으로
  임의 코드를 보낸다. 고객 `storageState` 가 흐르는 Testea 러너와 **절대 같은
  배포를 공유하지 않는다**(별도 app, 별도 시크릿).

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
