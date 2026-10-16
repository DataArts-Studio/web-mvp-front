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

| 이름                               | 용도                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `PORT`                             | 리슨 포트. Cloud Run 이 자동 주입(8080)                                                    |
| `RUNNER_SHARED_SECRET`             | Testea ↔ 러너 공유 시크릿. 원본은 Secret Manager, 배포 시 운영자 권한으로 읽어 env 로 주입 |
| `RUNNER_ALLOW_UNRESTRICTED_EGRESS` | `1` 이면 spec uid 방화벽 없이 `/run` 허용. Cloud Run 에서만, 아래 보완 통제와 함께 쓴다    |
| `RUNNER_EGRESS_PROXY_PORT`         | egress 프록시 포트(기본 3128)                                                              |

### 호출자 (Vercel: apps/web, apps/qaground)

| 이름                                                       | 용도                                                                                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `RUNNER_URL` / `QAGROUND_RUNNER_URL`                       | 러너 베이스 URL. ID 토큰 audience 와 동일                                                                      |
| `RUNNER_SHARED_SECRET` / `QAGROUND_RUNNER_SECRET`          | 공유 시크릿(2차 방어)                                                                                          |
| `RUNNER_INVOKER_SA_KEY` / `QAGROUND_RUNNER_INVOKER_SA_KEY` | invoker SA 자격증명(JSON/base64/WIF). IAM 토큰 발급용. **미설정이면 Authorization 생략**(로컬 비IAM 러너 호환) |

평문으로 코드/레포에 두지 않는다. 러너 시크릿 원본은 Secret Manager 에 두고
`deploy-cloudrun.sh` 가 배포할 때 운영자 권한으로 읽어 넣는다. 런타임 SA 는 시크릿을 읽지
못한다(아래 "Cloud Run 보완 통제"). 호출자 자격증명은 Vercel 암호화 env 에만 둔다.

## 보안 전제

`spec` 은 **임의 코드 실행**이다. 러너는 격리된 Cloud Run 컨테이너에서만 돌고,
IAM + 공유 시크릿으로 이중 인증된 호출만 받는다. 이 전제 밖에서는 절대 노출하지 않는다.

최소 권한으로 운영한다:

- 컨테이너는 **전용 런타임 SA**(`testea-runner-rt`)로 실행된다. 프로젝트 롤도, 시크릿
  접근도 없는 권한 0개 계정이다 (광범위 권한의 기본 compute SA 미사용).
- 호출자는 **전용 invoker SA**(`testea-runner-invoker`)를 쓴다. 이 서비스의
  `run.invoker` 권한만 있고 그 외 권한은 0개다.

아래 운영 요건을 배포에서 **반드시** 충족해야 한다. 코드만으로는 강제되지 않는다.

### 코드/이미지에서 강제되는 것 (구현됨)

- **uid 분리**: 서버는 root 로 뜨고, spec 자식만 비특권 사용자 **`pwuser`(uid 1000)** 로
  강등해 실행한다(`src/sandbox.ts`). uid 가 다르므로 spec 은 서버의
  `/proc/<pid>/environ` 에서 `RUNNER_SHARED_SECRET` 을 읽을 수 없다. 자식 env 도
  allowlist 만 통과시켜 시크릿을 넘기지 않는다.
- **앱 파일 읽기 전용**: `/app/dist`·`node_modules` 는 root 소유로 남는다. spec uid 는
  요청마다 넘겨받는 run 디렉터리에만 쓸 수 있어, 서버 코드나 의존성을 변조할 수 없다.
- **단일 실행**: 서버는 한 번에 하나의 `/run` 만 처리하고 겹치는 요청은 503(Retry-After)
  으로 거부한다. 같은 spec uid 끼리는 파일 권한으로 서로를 막을 수 없으므로, 동시 실행을
  없애는 것이 run 간 격리의 본 수단이다.
- **잔여 프로세스 회수**: run 이 끝나면 spec uid 로 강등한 헬퍼가 `kill(-1, SIGKILL)` 을
  호출해 그 uid 의 프로세스를 커널이 한 번에 종료한다. `/proc` 을 한 번 훑는 방식과 달리
  훑은 직후 fork 된 프로세스도 놓치지 않는다. 그래도 남으면 인스턴스를 오염 상태로 표시해
  `/run` 을 거부하고 `/health` 를 503 으로 돌려 플랫폼이 인스턴스를 교체하게 한다.
- **fail-closed**: uid 분리를 쓸 수 없는 환경(root 가 아니거나 Linux 가 아님, 또는
  `RUNNER_SANDBOX_UID`/`GID` 가 0·음수·숫자 아님)에서는 `/run` 을 503 으로 거부한다.
- 보조 방어: `.runs` 는 0711(목록 조회 불가), 요청별 run 디렉터리는 0700,
  `storageState` 는 0600 으로 기록되고 실행 후 삭제된다. spec 의 `HOME`/`TMPDIR` 는
  요청별 디렉터리로 고정된다.

### 배포에서 반드시 충족해야 하는 것 (ops 책임, **P0**)

- **spec egress 통제**: spec uid 방화벽(아래 "네트워크 경계")은 iptables 규칙을 걸어야
  하므로 컨테이너에 `NET_ADMIN` 이 필요하다. 없으면 `/run` 은 503 으로 거부된다.
  - `NET_ADMIN` 을 줄 수 있는 플랫폼(Fly, 자체 Docker 호스트)은 반드시 부여한다.
  - Cloud Run 은 컨테이너에 커널 권한을 추가할 수 없어 방화벽을 쓸 수 없다. 이때만
    `RUNNER_ALLOW_UNRESTRICTED_EGRESS=1` 로 끄고, 아래 "Cloud Run 보완 통제"를 **모두**
    충족한다. 보완 통제 없이 opt-out 하면 spec 이 메타데이터 서버의 SA 토큰으로 시크릿을
    가져가거나 사설망에 닿을 수 있다.
  - 적용 상태는 배포 후 부팅 로그, `/run` 응답, `verify-cloudrun.sh` 로 확인한다.
- **인스턴스당 동시 요청 1**: Cloud Run `--concurrency 1`, Fly `hard_limit = 1` 을 유지한다.
  코드도 단일 실행을 강제하지만, 플랫폼이 한 인스턴스에 요청을 몰아 503 이 나지 않게 한다.
- **요청별 일회용 격리(권장)**: 인스턴스가 재사용되면 커널·네트워크 네임스페이스는 run 간에
  공유된다. 민감한 `storageState` 가 오가는 Testea 러너는 가능하면 run 당 새
  인스턴스로 띄운다.
- **qaground ↔ Testea 러너 분리**: qaground 채점은 **인증 없는 공개 입력**으로
  임의 코드를 보낸다. 고객 `storageState` 가 흐르는 Testea 러너와 **절대 같은
  배포를 공유하지 않는다**(별도 app, 별도 시크릿).

대상 사이트 인증은 러너가 다루지 않는다. Testea 가 target_sites 시크릿을 복호화해
`storageState`(쿠키/오리진 인증 상태)로 구성한 뒤 요청에 실어 보낸다.

### 네트워크 경계

러너의 외부 통신은 두 겹으로 막는다.

- **egress 프록시** (`egress-proxy.ts`): 서버(root)가 `127.0.0.1:3128`
  (`RUNNER_EGRESS_PROXY_PORT`)에 띄우는 HTTP forward proxy. 대상 호스트를 한 번만 해석해
  모든 주소가 허용될 때 그 IP 로 직접 접속한다. 재해석하지 않으므로 DNS rebinding 이 통하지
  않고, 리다이렉트는 브라우저가 새 요청으로 다시 프록시를 거치므로 hop 마다 검사된다.
  `/capture` 의 Chromium 과 `/run` 의 page·request 픽스처가 이 프록시로만 나간다.
  loopback 예외를 없애고(`<-loopback>`) 프록시를 우회하는 WebRTC UDP 도 막는다.
- **spec uid 방화벽** (`egress-firewall.ts`): spec 은 임의 코드라 프록시 설정을 무시하고
  소켓을 직접 열 수 있다. 서버가 시작할 때 iptables 로 spec uid 의 아웃바운드를 전부 거부하고
  프록시 포트만 허용한다. 직접 fetch·TCP·DNS 질의, 프록시 없이 띄운 브라우저, 메타데이터
  서버, 러너 서버 포트가 모두 막힌다. 적용하지 못하면 `/run` 은 기본 거부된다.

주소 정책(`url-guard.ts`)은 사설·공유·loopback·링크로컬·멀티캐스트·예약 IPv4 와, `2000::/3`
에서 특수 대역을 뺀 나머지 IPv6 를 거부한다. 같은 정책을 `/run` 의 `baseUrl` 과 `/capture`
의 최초 `url` 입력 검사에도 쓴다(입력 단계에서 빨리 거부하는 보조 방어).

검증은 합성 데이터로 로컬 Docker 에서 한다(인터넷 연결 필요).

```bash
bash scripts/verify-egress.sh
```

NET_ADMIN 을 준 컨테이너에서 탐침 spec 이 직접 통신·내부 주소·리다이렉트·메타데이터·파일
경계를 시도하고, 프록시를 거친 공개 대상만 도달하는지 확인한다. NET_ADMIN 없이 `/run` 이
거부되는지, opt-out 시 탐침이 직접 통신을 잡아내는지(대조군)도 함께 본다. 운영 플랫폼의 실제
적용 여부는 이 스크립트로 확인할 수 없으므로 배포 후 별도로 기록한다.

### Cloud Run 보완 통제

Cloud Run 에서는 spec uid 방화벽 대신 아래 통제로 spec 의 직접 통신이 닿을 수 있는 곳을
줄인다. egress 프록시는 그대로 동작하므로 `/capture` 와 spec 의 page·request 픽스처는 계속
주소 검사를 받는다. `verify-cloudrun.sh` 의 "spec egress" 항목이 아래 세 가지를 검사한다.

- **런타임 SA 권한 0개**: 프로젝트 롤과 시크릿 접근을 모두 뺀다. spec 이 메타데이터 서버에서
  토큰을 받아도 읽을 수 있는 GCP 리소스가 없다. 공유 시크릿은 배포 시 운영자 권한으로 읽어
  env 로 넣고, 서버 env 는 uid 분리로 spec 이 읽지 못한다.
- **VPC 미연결**: Serverless VPC connector 와 Direct VPC egress 를 붙이지 않는다. 사설
  주소로 가는 경로 자체가 없다.
- **opt-out 명시**: `RUNNER_ALLOW_UNRESTRICTED_EGRESS=1` 은 위 두 조건을 갖춘 Cloud Run
  배포에만 넣는다.

남는 위험과 대응:

- spec 이 프록시를 거치지 않고 공개 인터넷에 직접 통신할 수 있다. 실행 중 spec 이 볼 수 있는
  데이터(요청에 실린 `storageState` 포함)를 외부로 보낼 수 있다는 뜻이다. qaground 채점처럼
  민감 데이터가 없는 러너는 감수할 수 있지만, 고객 `storageState` 가 흐르는 Testea 러너는
  `NET_ADMIN` 을 줄 수 있는 플랫폼으로 옮기는 것을 우선한다.
- 메타데이터 서버 자체는 닿는다. 권한 0개 SA 의 토큰과 ID 토큰, 프로젝트 ID 정도가 노출된다.
  이 SA 를 신뢰하는 다른 서비스를 만들지 않는다.
- 공유 시크릿 값이 서비스 리비전 설정(env)에 평문으로 남는다. 프로젝트에서 Cloud Run 설정을
  볼 수 있는 계정은 값을 볼 수 있으므로 그 권한을 운영자로 제한하고, 유출이 의심되면
  시크릿을 새로 만들어 재배포한다.

URL 정책 회귀 테스트는 네트워크 없이 `pnpm --filter @testea/runner test`로 실행한다.

## 로컬 실행

로컬(Windows/macOS 또는 비root)에서는 uid 분리 격리를 쓸 수 없어 `/run` 이 기본 503 이다.
신뢰하는 spec 으로만 개발할 때 `RUNNER_ALLOW_UNISOLATED=1` 로 명시적으로 허용한다.
운영 배포에는 절대 설정하지 않는다.

```bash
RUNNER_ALLOW_UNISOLATED=1 pnpm --filter @testea/runner dev      # tsx watch
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
- `--service-account testea-runner-rt` : 권한 0개 전용 런타임 SA(시크릿 접근도 회수).
- VPC 연결 해제 + 방화벽 opt-out : 위 "Cloud Run 보완 통제" 참조.
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

Docker는 이 디렉터리의 `pnpm-lock.yaml`을 `--frozen-lockfile`로 설치한다.
루트 workspace lockfile과 overrides는 러너 독립 빌드에 적용되지 않는다.
의존성을 변경하면 루트 lockfile과 별도로 다음 명령으로 러너 lockfile도 갱신하고 검증한다.

```bash
cd apps/runner
pnpm install --ignore-workspace --lockfile-only --prod=false
pnpm install --ignore-workspace --frozen-lockfile --prod=false
pnpm run build
pnpm audit --ignore-workspace --audit-level=low
```

CI의 `runner standalone dependencies`는 독립 설치·빌드·전체 npm 의존성 감사를 수행한다.
감사 통과는 알려진 npm 권고 기준이며, 이미지 OS 패키지나 네트워크 격리를 검증하지 않는다.

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
