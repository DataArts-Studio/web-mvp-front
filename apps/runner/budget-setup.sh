#!/usr/bin/env bash
#
# 월 $1 예산 알림 설정 (Cloud Billing Budget).
#
# 주의: 이것은 "알림"이지 하드 컷오프가 아니다. 50% / 90% / 100% 도달 시
# 결제 계정 관리자에게 메일이 갈 뿐, 과금을 자동으로 끊지 않는다.
# (러너는 deploy-cloudrun.sh 의 scale-to-zero + max-instances=1 로 사실상
#  무료 티어 안에 머무르므로, 이 알림은 만일을 위한 안전망이다.)
#
# 사용:
#   GCP_PROJECT_ID=my-proj bash budget-setup.sh

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID 를 설정하세요}"
BUDGET_NAME="${RUNNER_BUDGET_NAME:-testea-runner-1usd}"
BUDGET_AMOUNT="${RUNNER_BUDGET_AMOUNT:-1}" # USD

# 예산 API 활성화
gcloud services enable billingbudgets.googleapis.com --project "${PROJECT_ID}"

# 프로젝트에 연결된 결제 계정 ID 조회 (billingAccounts/XXXXXX-...)
BILLING_ACCOUNT_FULL="$(gcloud billing projects describe "${PROJECT_ID}" --format='value(billingAccountName)')"
if [[ -z "${BILLING_ACCOUNT_FULL}" ]]; then
  echo "프로젝트 ${PROJECT_ID} 에 결제 계정이 연결돼 있지 않습니다." >&2
  exit 1
fi
BILLING_ACCOUNT="${BILLING_ACCOUNT_FULL#billingAccounts/}"

echo "결제 계정 : ${BILLING_ACCOUNT}"
echo "예산      : ${BUDGET_NAME} = \$${BUDGET_AMOUNT}/월"
echo

# 동일 이름 예산이 있으면 건너뛴다 (중복 생성 방지)
if gcloud billing budgets list --billing-account "${BILLING_ACCOUNT}" \
  --format='value(displayName)' 2>/dev/null | grep -qx "${BUDGET_NAME}"; then
  echo "이미 '${BUDGET_NAME}' 예산이 존재합니다. 건너뜀."
  exit 0
fi

gcloud billing budgets create \
  --billing-account "${BILLING_ACCOUNT}" \
  --display-name "${BUDGET_NAME}" \
  --budget-amount "${BUDGET_AMOUNT}USD" \
  --filter-projects "projects/${PROJECT_ID}" \
  --threshold-rule percent=0.5 \
  --threshold-rule percent=0.9 \
  --threshold-rule percent=1.0

echo
echo "예산 알림 생성 완료. 50% / 90% / 100% 도달 시 결제 관리자에게 메일이 갑니다."
echo "참고: 알림은 과금을 자동 중단하지 않습니다 (하드 컷오프가 필요하면 별도 kill-switch 필요)."
