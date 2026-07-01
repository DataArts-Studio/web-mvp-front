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

### 인증 (이중 방어)

운영 배포는 두 층으로 보호한다. 두 층은 독립적이라 한쪽이 뚫려도 다른 쪽이 막는다.

1. **Cloud Run IAM** (`--no-allow-unauthenticated`): 엔드포인트가 공개되지 않는다.
   호출자는 Google 서명 ID 토큰을 들고 와야 하고, 그 신원에 이 서비스의
   `run.invoker` 권한이 있어야 한다. IAM 은 `/health` 포함 모든 경로에 적용된다.
2. **앱 레벨 공유 시크릿**: IAM 을 통과해도 헤더 `X-Runner-Secret` 가
   `RUNNER_SHARED_SECRET` 와 일치해야 `/run`·`/capture` 가 동작. 불일치 401, 미설정 503.

호출자(Testea/qaground, Vercel)는 GCP 밖이라 메타데이터 서버가 없으므로, 전용
invoker SA 자격증명으로 audience 고정 ID 토큰을 발급한다 (`runner-identity.ts`).

## 환경변수

### 러너 (Cloud Run)

| 이름                   | 용도                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `PORT`                 | 리슨 포트. Cloud Run 이 자동 주입(8080)                           |
| `RUNNER_SHARED_SECRET` | Testea ↔ 러너 공유 시크릿. **Secret Manager 로 주입** (Cloud Run) |

### 호출자 (Vercel: apps/web, apps/qaground)

| 이름                                                       | 용도                                                                                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `RUNNER_URL` / `QAGROUND_RUNNER_URL`                       | 러너 베이스 URL. ID 토큰 audience 와 동일                                                                      |
| `RUNNER_SHARED_SECRET` / `QAGROUND_RUNNER_SECRET`          | 공유 시크릿(2차 방어)                                                                                          |
| `RUNNER_INVOKER_SA_KEY` / `QAGROUND_RUNNER_INVOKER_SA_KEY` | invoker SA 자격증명(JSON/base64/WIF). IAM 토큰 발급용. **미설정이면 Authorization 생략**(로컬 비IAM 러너 호환) |

평문으로 코드/레포에 두지 않는다. 러너 시크릿은 Secret Manager(`deploy-cloudrun.sh`
자동 처리), 호출자 자격증명은 Vercel 암호화 env 에만 둔다.

## 보안 전제

`spec` 은 **임의 코드 실행**이다. 러너는 격리된 Cloud Run 컨테이너에서만 돌고,
IAM + 공유 시크릿으로 이중 인증된 호출만 받는다. 이 전제 밖에서는 절대 노출하지 않는다.

최소 권한으로 운영한다:

- 컨테이너는 **전용 런타임 SA**(`testea-runner-rt`)로 실행된다. 프로젝트 롤이 0개고,
  마운트하는 시크릿에 대한 접근만 갖는다 (광범위 권한의 기본 compute SA 미사용).
- 호출자는 **전용 invoker SA**(`testea-runner-invoker`)를 쓴다. 이 서비스의
  `run.invoker` 권한만 있고 그 외 권한은 0개다.

대상 사이트 인증은 러너가 다루지 않는다. Testea 가 target_sites 시크릿을 복호화해
`storageState`(쿠키/오리진 인증 상태)로 구성한 뒤 요청에 실어 보낸다.
외부 입력 URL 은 `url-guard.ts` 가 사설/내부 주소를 막아 SSRF 를 차단한다.

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

## 배포 (Google Cloud Run)

서울 리전(`asia-northeast3`)에 배포한다. IAM 비공개 + 전용 최소권한 SA 로 보안을
잠그고, 무료 티어 안에서 돌도록 보수적으로 설정하며, 월 $1 예산 알림을 안전망으로 건다.

```bash
cd apps/runner

# 1) 배포 (빌드 + 전용 SA + Secret Manager + IAM 비공개까지 한 번에)
export GCP_PROJECT_ID=<your-gcp-project>
export RUNNER_SHARED_SECRET=$(openssl rand -hex 32)   # 최초 1회만. 이후엔 생략하면 기존 버전 재사용
bash deploy-cloudrun.sh

# 2) invoker SA 키 발급 → Vercel env(RUNNER_INVOKER_SA_KEY 등) 주입
bash setup-invoker-key.sh

# 3) 월 $1 예산 알림
bash budget-setup.sh

# 4) 보안·한도 검증 (실제 떠 있는 설정을 읽어 PASS/FAIL 판정)
bash verify-cloudrun.sh
```

`deploy-cloudrun.sh` 가 거는 보안 잠금:

- `--no-allow-unauthenticated` : IAM 비공개. ID 토큰 + `run.invoker` 권한 필수.
- `--service-account testea-runner-rt` : 무권한 전용 런타임 SA(시크릿 접근만).
- invoker SA 에 이 서비스의 `run.invoker` 만 부여 (서비스 단위 바인딩, 최소 권한).
- `--ingress all` : 호출자가 GCP 밖(Vercel)이라 외부 ingress 필요. IAM 으로 보호.

스크립트가 켜는 비용 노브:

- `--min-instances 0` : scale-to-zero. 유휴 시 인스턴스가 0개라 idle 과금 없음.
- `--max-instances 1` : 동시 컨테이너 1개로 순간 최대 소진율을 묶음 (필요 시 환경변수 `RUNNER_MAX_INSTANCES` 로 상향).
- `--concurrency 1` : Playwright 단일 워커, 컨테이너당 요청 1개.
- CPU throttling 기본값 유지 : 요청 처리 중에만 CPU 과금(request-based billing) → 무료 티어 적용.
- `--timeout 300` : 단일 요청 최대 5분으로 제한.
- `--execution-environment gen2` : 러너가 detached 프로세스 그룹 종료(`process.kill(-pid)`)에
  의존하므로 전체 Linux 커널이 필요하다. gen1 에서는 손자 Chromium 회수가 깨질 수 있다.

### 비용 (서울, Tier 1)

요청 단위 과금이라 **유휴 시 $0**이다. 무료 티어(월): vCPU 360,000초 · 메모리 180,000 GiB초 ·
요청 200만 건. 1 vCPU + 1Gi 기준 메모리가 먼저 묶여 **월 약 50시간**의 활성 실행이 무료다.
이를 넘겨도 1초당 약 $0.0000265 (1 vCPU + 1Gi)라, $1 로는 추가 약 10시간을 더 살 수 있다.
일반적인 QA 실행량이면 무료 티어를 벗어나기 어렵다.

> Cloud Run 에는 하드 $1 컷오프 기능이 없다. 예산은 **알림**일 뿐 과금을 끊지 않는다.
> 위 scale-to-zero + max-instances 설정이 실질적 상한 역할을 하고, `budget-setup.sh` 가
> 50/90/100% 도달 시 메일 알림을 건다.

### 이미지 버전

베이스 이미지 `mcr.microsoft.com/playwright:v1.60.0-jammy` 는 `@playwright/test` 버전과
같이 올려야 한다 (lockfile 의 resolved 버전과 Dockerfile 태그를 일치시킬 것).

### 메모리 부족(OOM) 시

`.runs` 임시 디렉터리가 컨테이너 인메모리 FS 에 쓰이므로 1Gi 가 빠듯하면
`RUNNER_MEMORY=2Gi bash deploy-cloudrun.sh` 로 올린다 (단, 무료 메모리초가 절반으로 줄어듦).

## 배포 (Fly.io, 대안)

```bash
cd apps/runner
fly apps create testea-runner          # 최초 1회
fly secrets set RUNNER_SHARED_SECRET=...
fly deploy --config fly.toml
```
