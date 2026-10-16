#!/usr/bin/env bash
#
# Cloud Run 배포 스크립트 (Testea Playwright 러너) - IAM 인증 + 보안 하드닝판.
#
# === 인증 모델 (이중 방어) ==================================================
#   1) Cloud Run IAM (--no-allow-unauthenticated)
#      - 엔드포인트는 공개되지 않는다. 호출자는 Google 서명 ID 토큰을 들고 와야 하고,
#        그 신원에 이 서비스의 run.invoker 권한이 있어야 한다.
#      - 호출자(Testea/qaground, Vercel)는 전용 invoker SA 키로 ID 토큰을 발급한다.
#   2) 앱 레벨 공유 시크릿 (X-Runner-Secret)
#      - IAM 을 통과해도 RUNNER_SHARED_SECRET 이 맞아야 /run·/capture 가 동작.
#   두 층은 독립적이다. 한 층이 뚫려도(시크릿 유출 / 토큰 유출) 다른 층이 막는다.
#
# === 최소 권한 ==============================================================
#   - 런타임 SA(testea-runner-rt): 컨테이너가 이 신원으로 실행. 프로젝트 롤 0개,
#     시크릿 접근도 없다 (기본 compute SA 미사용).
#   - invoker SA(testea-runner-invoker): 이 서비스에 run.invoker 만. 그 외 권한 0개.
#
# === spec egress (Cloud Run 보완 통제) ======================================
#   Cloud Run 은 NET_ADMIN 을 줄 수 없어 spec uid 방화벽을 못 건다. 그래서
#   RUNNER_ALLOW_UNRESTRICTED_EGRESS=1 로 끄고 아래로 대신한다 (README "Cloud Run 보완 통제").
#   - 런타임 SA 권한 0개: spec 이 메타데이터 서버에서 토큰을 받아도 시크릿을 못 읽는다.
#     공유 시크릿은 배포 시 운영자 권한으로 읽어 env 로 넣는다.
#   - VPC 미연결: 사설망 경로가 없다.
#   브라우저 트래픽은 계속 egress 프록시를 거친다.
#
# === 비용 ($1 안전망) =======================================================
#   - min-instances=0 (scale-to-zero, idle 과금 0)
#   - max-instances=1 (순간 최대 소진율 제한)
#   - concurrency=1, CPU throttling 기본(요청 중에만 과금) → 무료 티어
#   - timeout=300 (단일 요청 최대 5분)
#   Cloud Run 엔 하드 $1 컷오프가 없다. budget-setup.sh 가 알림을 건다.
#
# 사용:
#   GCP_PROJECT_ID=my-proj RUNNER_SHARED_SECRET=$(openssl rand -hex 32) bash deploy-cloudrun.sh
# 이 디렉터리(apps/runner)에서 실행.

set -euo pipefail

# --- 설정 (환경변수로 덮어쓰기 가능) ---------------------------------------
PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID 를 설정하세요 (예: export GCP_PROJECT_ID=my-proj)}"
REGION="${GCP_REGION:-asia-northeast3}" # 서울
SERVICE="${RUNNER_SERVICE_NAME:-testea-runner}"
SECRET_NAME="${RUNNER_SECRET_NAME:-runner-shared-secret}"

# 전용 서비스 계정 (최소 권한)
RUNTIME_SA_NAME="${RUNNER_RUNTIME_SA:-testea-runner-rt}"
INVOKER_SA_NAME="${RUNNER_INVOKER_SA:-testea-runner-invoker}"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
INVOKER_SA="${INVOKER_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# 리소스 / 비용 노브
RUNNER_CPU="${RUNNER_CPU:-1}"
RUNNER_MEMORY="${RUNNER_MEMORY:-1Gi}" # Playwright/Chromium 실용 하한. OOM 시 2Gi.
RUNNER_MAX_INSTANCES="${RUNNER_MAX_INSTANCES:-1}"
RUNNER_CONCURRENCY="${RUNNER_CONCURRENCY:-1}"
RUNNER_TIMEOUT="${RUNNER_TIMEOUT:-300}" # 초

echo "프로젝트   : ${PROJECT_ID}"
echo "리전       : ${REGION}"
echo "서비스     : ${SERVICE}"
echo "런타임 SA  : ${RUNTIME_SA} (권한 0개)"
echo "invoker SA : ${INVOKER_SA} (run.invoker 만)"
echo "리소스     : cpu=${RUNNER_CPU} mem=${RUNNER_MEMORY} max=${RUNNER_MAX_INSTANCES} conc=${RUNNER_CONCURRENCY} timeout=${RUNNER_TIMEOUT}s"
echo "인증       : IAM (--no-allow-unauthenticated) + 공유 시크릿"
echo

# --- 1. API 활성화 ----------------------------------------------------------
echo "[1/6] API 활성화..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  --project "${PROJECT_ID}"

# --- 2. 전용 서비스 계정 생성 (멱등) ----------------------------------------
echo "[2/6] 전용 서비스 계정 준비..."
if ! gcloud iam service-accounts describe "${RUNTIME_SA}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${RUNTIME_SA_NAME}" \
    --project "${PROJECT_ID}" \
    --display-name "Testea runner runtime (no roles)"
fi
if ! gcloud iam service-accounts describe "${INVOKER_SA}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${INVOKER_SA_NAME}" \
    --project "${PROJECT_ID}" \
    --display-name "Testea runner invoker (run.invoker only)"
fi
# 런타임 SA 에는 어떤 권한도 부여하지 않는다 (의도적).

# --- 3. 공유 시크릿 등록 + 런타임 SA 접근 회수 ------------------------------
echo "[3/6] 시크릿 ${SECRET_NAME} 준비..."
if ! gcloud secrets describe "${SECRET_NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud secrets create "${SECRET_NAME}" \
    --project "${PROJECT_ID}" \
    --replication-policy automatic
fi
if [[ -n "${RUNNER_SHARED_SECRET:-}" ]]; then
  printf '%s' "${RUNNER_SHARED_SECRET}" |
    gcloud secrets versions add "${SECRET_NAME}" --project "${PROJECT_ID}" --data-file=-
  echo "  시크릿 새 버전 추가 완료."
else
  echo "  RUNNER_SHARED_SECRET 미지정 → 기존 버전 사용 (없으면 아래 단계에서 중단)."
fi
# 런타임 SA 는 시크릿을 읽지 못해야 한다. spec 이 메타데이터 서버 토큰으로 가져갈 수 있다.
# 예전 배포가 남긴 바인딩이 있으면 회수한다 (없으면 gcloud 가 실패하므로 무시).
gcloud secrets remove-iam-policy-binding "${SECRET_NAME}" \
  --project "${PROJECT_ID}" \
  --member "serviceAccount:${RUNTIME_SA}" \
  --role roles/secretmanager.secretAccessor \
  >/dev/null 2>&1 || true
echo "  ${RUNTIME_SA} 의 secretAccessor 회수 확인."

# 배포용 env 파일. 시크릿 값이 들어가므로 0600 임시 파일로 만들고 종료 시 지운다.
ENV_FILE="$(mktemp)"
chmod 600 "${ENV_FILE}"
trap 'rm -f "${ENV_FILE}"' EXIT
SHARED_SECRET_VALUE="$(gcloud secrets versions access latest --secret "${SECRET_NAME}" --project "${PROJECT_ID}")"
# YAML 에 그대로 넣으므로 openssl rand -hex 형태(영숫자·_·-)만 허용한다.
if [[ ! "${SHARED_SECRET_VALUE}" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "  시크릿 값 형식이 올바르지 않습니다 (영숫자·_·- 만 허용). 새 값으로 다시 등록하세요." >&2
  exit 1
fi
{
  echo 'NODE_ENV: "production"'
  echo 'RUNNER_ALLOW_UNRESTRICTED_EGRESS: "1"'
  printf 'RUNNER_SHARED_SECRET: "%s"\n' "${SHARED_SECRET_VALUE}"
} >"${ENV_FILE}"
unset SHARED_SECRET_VALUE

# --- 4. 빌드 + 배포 (IAM 비공개 + 전용 런타임 SA) ---------------------------
# --no-allow-unauthenticated : 공개 차단, IAM 토큰 필수.
# --service-account          : 기본 compute SA 대신 무권한 런타임 SA 로 실행.
# --ingress all              : 호출자가 GCP 밖(Vercel)이라 외부 ingress 필요.
#                              (internal-only 는 Vercel 에서 못 닿음. IAM 으로 보호.)
# --clear-secrets            : 예전 Secret Manager 참조 제거 (런타임 SA 가 못 읽으므로).
# --clear-vpc-connector      : 사설망 경로 제거 (Cloud Run 보완 통제).
# --env-vars-file            : 공유 시크릿 + 방화벽 opt-out. 기존 env 를 이 파일로 교체한다.
# PORT 는 Cloud Run 이 자동 주입(8080).
echo "[4/6] 빌드 + 배포..."
gcloud run deploy "${SERVICE}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --execution-environment gen2 \
  --service-account "${RUNTIME_SA}" \
  --no-allow-unauthenticated \
  --ingress all \
  --cpu "${RUNNER_CPU}" \
  --memory "${RUNNER_MEMORY}" \
  --concurrency "${RUNNER_CONCURRENCY}" \
  --min-instances 0 \
  --max-instances "${RUNNER_MAX_INSTANCES}" \
  --timeout "${RUNNER_TIMEOUT}" \
  --port 8080 \
  --clear-secrets \
  --clear-vpc-connector \
  --env-vars-file "${ENV_FILE}"

# --- 5. invoker SA 에 이 서비스 호출 권한만 부여 ----------------------------
# 서비스 단위 바인딩이라 다른 Cloud Run 서비스에는 권한이 없다 (최소 권한).
echo "[5/6] invoker 권한 부여..."
gcloud run services add-iam-policy-binding "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --member "serviceAccount:${INVOKER_SA}" \
  --role roles/run.invoker \
  >/dev/null
echo "  ${INVOKER_SA} 에 run.invoker 부여 완료."

# --- 6. 결과 ----------------------------------------------------------------
URL="$(gcloud run services describe "${SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"
echo
echo "[6/6] 배포 완료."
echo "  URL        : ${URL}"
echo "  (이 URL 이 호출자 RUNNER_URL 이자 ID 토큰 audience 다.)"
echo
echo "다음 단계:"
echo "  1) bash setup-invoker-key.sh   # invoker SA 키 발급 → Vercel env 주입"
echo "  2) bash budget-setup.sh        # 월 \$1 예산 알림"
echo "  3) bash verify-cloudrun.sh     # 보안·한도 검증"
