#!/usr/bin/env bash
#
# invoker SA 키 발급 (Testea/qaground → IAM 보호 러너 호출용).
#
# 호출자는 Vercel(GCP 밖)이라 메타데이터 서버로 ID 토큰을 못 받는다. 전용 invoker
# SA 키로 google-auth-library 가 audience 고정 ID 토큰을 발급해 Authorization 헤더에 싣는다.
#
# 보안 주의:
#   - 이 키는 "이 러너 서비스 호출" 권한만 가진다 (run.invoker only). 그 이상 못 한다.
#   - 키 JSON 은 절대 레포/이미지/로그에 두지 말 것. Vercel 암호화 env 에만 넣는다.
#   - 발급 후 로컬 파일은 즉시 삭제(이 스크립트가 stdout 으로만 출력, 파일 미저장 옵션 제공).
#   - 더 강한 보안을 원하면 키 대신 Workload Identity Federation 권장 (맨 아래 참고).
#
# 사용:
#   GCP_PROJECT_ID=my-proj bash setup-invoker-key.sh           # 키를 stdout 으로 출력
#   GCP_PROJECT_ID=my-proj KEY_OUT=invoker.json bash setup-invoker-key.sh  # 파일로 저장

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID 를 설정하세요}"
INVOKER_SA_NAME="${RUNNER_INVOKER_SA:-testea-runner-invoker}"
INVOKER_SA="${INVOKER_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_OUT="${KEY_OUT:-}" # 비우면 stdout (권장)

if ! gcloud iam service-accounts describe "${INVOKER_SA}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "invoker SA(${INVOKER_SA}) 가 없습니다. 먼저 deploy-cloudrun.sh 를 실행하세요." >&2
  exit 1
fi

TMP_KEY="$(mktemp)"
trap 'rm -f "${TMP_KEY}"' EXIT

gcloud iam service-accounts keys create "${TMP_KEY}" \
  --project "${PROJECT_ID}" \
  --iam-account "${INVOKER_SA}"

if [[ -n "${KEY_OUT}" ]]; then
  cp "${TMP_KEY}" "${KEY_OUT}"
  echo "키를 ${KEY_OUT} 에 저장했습니다. Vercel env 주입 후 즉시 삭제하세요." >&2
fi

echo >&2
echo "=== Vercel 환경변수 주입 ===" >&2
echo "아래 JSON 한 덩어리를 그대로 env 값으로 넣습니다 (개행 포함 가능):" >&2
echo "  - apps/web      : RUNNER_INVOKER_SA_KEY" >&2
echo "  - apps/qaground : QAGROUND_RUNNER_INVOKER_SA_KEY" >&2
echo "함께 설정할 값:" >&2
echo "  - RUNNER_URL / QAGROUND_RUNNER_URL          = 배포된 Cloud Run URL (audience)" >&2
echo "  - RUNNER_SHARED_SECRET / QAGROUND_RUNNER_SECRET = 공유 시크릿(2차 방어)" >&2
echo "Vercel CLI 예:  vercel env add RUNNER_INVOKER_SA_KEY production < key.json" >&2
echo >&2
echo "----- BEGIN KEY JSON (stdout) -----" >&2
cat "${TMP_KEY}"
echo >&2
echo "----- END KEY JSON -----" >&2
echo >&2
echo "[Workload Identity Federation 대안 - 키리스, 더 강함]" >&2
echo "  Vercel OIDC ↔ GCP WIF 풀을 구성하면 장수 키 없이 호출 가능하다." >&2
echo "  헬퍼 코드는 external_account 자격증명도 그대로 받으므로, 같은 env 에" >&2
echo "  WIF 자격증명 JSON 을 넣기만 하면 코드 변경 없이 전환된다." >&2
