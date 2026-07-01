#!/usr/bin/env bash
#
# 배포된 러너의 보안·비용 한도를 실제로 읽어와 검증한다.
# "설정했다"가 아니라 "실제 그렇게 떠 있다"를 확인하는 것이 목적이다.
#
# 검증 항목:
#   [비용]  min/max instances, concurrency, timeout, CPU throttling, gen2
#   [보안]  ingress, 전용 런타임 SA, 미공개(allUsers 없음), invoker SA = run.invoker
#   [예산]  월 $1 예산 알림 존재
#   [라이브] 미인증 요청 403, (가능하면) invoker 토큰으로 인증 요청 200
#
# 사용:
#   GCP_PROJECT_ID=my-proj bash verify-cloudrun.sh

set -uo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID 를 설정하세요}"
REGION="${GCP_REGION:-asia-northeast3}"
SERVICE="${RUNNER_SERVICE_NAME:-testea-runner}"
RUNTIME_SA_NAME="${RUNNER_RUNTIME_SA:-testea-runner-rt}"
INVOKER_SA_NAME="${RUNNER_INVOKER_SA:-testea-runner-invoker}"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
INVOKER_SA="${INVOKER_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
EXPECT_MAX="${RUNNER_MAX_INSTANCES:-1}"
EXPECT_CONC="${RUNNER_CONCURRENCY:-1}"
EXPECT_TIMEOUT="${RUNNER_TIMEOUT:-300}"
BUDGET_NAME="${RUNNER_BUDGET_NAME:-testea-runner-1usd}"

PASS=0
FAIL=0
ok() {
  echo "  PASS  $1"
  PASS=$((PASS + 1))
}
bad() {
  echo "  FAIL  $1"
  FAIL=$((FAIL + 1))
}
warn() { echo "  WARN  $1"; }

# expect 헬퍼: actual == expected 면 PASS, 아니면 FAIL
expect() { # $1 라벨  $2 expected  $3 actual
  if [[ "$2" == "$3" ]]; then ok "$1 ($3)"; else bad "$1 (기대=$2 실제=$3)"; fi
}

D() { # 서비스 describe 필드 추출
  gcloud run services describe "${SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format="value($1)" 2>/dev/null
}

echo "== ${SERVICE} @ ${REGION} (${PROJECT_ID}) 검증 =="

URL="$(D 'status.url')"
if [[ -z "${URL}" ]]; then
  echo "서비스를 찾을 수 없습니다. 먼저 deploy-cloudrun.sh 를 실행하세요." >&2
  exit 1
fi
echo "URL: ${URL}"
echo

echo "[비용 한도]"
expect "min instances=0" "0" "$(D "spec.template.metadata.annotations['autoscaling.knative.dev/minScale']")"
expect "max instances=${EXPECT_MAX}" "${EXPECT_MAX}" "$(D "spec.template.metadata.annotations['autoscaling.knative.dev/maxScale']")"
expect "concurrency=${EXPECT_CONC}" "${EXPECT_CONC}" "$(D 'spec.template.spec.containerConcurrency')"
expect "timeout=${EXPECT_TIMEOUT}s" "${EXPECT_TIMEOUT}" "$(D 'spec.template.spec.timeoutSeconds')"
# CPU throttling = true → 요청 처리 중에만 과금(무료 티어 조건). false 면 always-on 과금.
expect "CPU throttling(요청 중에만 과금)" "true" "$(D "spec.template.metadata.annotations['run.googleapis.com/cpu-throttling']")"
expect "execution-environment=gen2" "gen2" "$(D "spec.template.metadata.annotations['run.googleapis.com/execution-environment']")"

echo
echo "[보안]"
expect "ingress=all" "all" "$(D "metadata.annotations['run.googleapis.com/ingress']")"
expect "전용 런타임 SA" "${RUNTIME_SA}" "$(D 'spec.template.spec.serviceAccountName')"

# IAM 정책: run.invoker 멤버 목록
INVOKER_MEMBERS="$(gcloud run services get-iam-policy "${SERVICE}" \
  --project "${PROJECT_ID}" --region "${REGION}" \
  --flatten='bindings[].members' \
  --filter='bindings.role=roles/run.invoker' \
  --format='value(bindings.members)' 2>/dev/null)"

if echo "${INVOKER_MEMBERS}" | grep -qE 'allUsers|allAuthenticatedUsers'; then
  bad "공개 노출 없음 (allUsers/allAuthenticatedUsers 가 invoker 에 있음!)"
else
  ok "공개 노출 없음 (allUsers/allAuthenticatedUsers 미부여)"
fi
if echo "${INVOKER_MEMBERS}" | grep -qx "serviceAccount:${INVOKER_SA}"; then
  ok "invoker SA 에 run.invoker 부여됨"
else
  bad "invoker SA(${INVOKER_SA}) 에 run.invoker 없음"
fi
# 런타임 SA 가 광범위 롤(editor/owner)을 갖고 있지 않은지 (최소 권한)
RT_ROLES="$(gcloud projects get-iam-policy "${PROJECT_ID}" \
  --flatten='bindings[].members' \
  --filter="bindings.members:serviceAccount:${RUNTIME_SA}" \
  --format='value(bindings.role)' 2>/dev/null)"
if [[ -z "${RT_ROLES}" ]]; then
  ok "런타임 SA 프로젝트 롤 0개 (시크릿 접근만)"
else
  warn "런타임 SA 에 프로젝트 롤이 있음: ${RT_ROLES} (의도한 것인지 확인)"
fi

echo
echo "[예산 알림]"
BA="$(gcloud billing projects describe "${PROJECT_ID}" --format='value(billingAccountName)' 2>/dev/null)"
BA="${BA#billingAccounts/}"
if [[ -n "${BA}" ]] && gcloud billing budgets list --billing-account "${BA}" \
  --format='value(displayName)' 2>/dev/null | grep -qx "${BUDGET_NAME}"; then
  ok "예산 '${BUDGET_NAME}' 존재"
else
  bad "예산 '${BUDGET_NAME}' 없음 (budget-setup.sh 실행 필요)"
fi

echo
echo "[라이브 인증]"
UNAUTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "${URL}/health" 2>/dev/null)"
if [[ "${UNAUTH_CODE}" == "403" || "${UNAUTH_CODE}" == "401" ]]; then
  ok "미인증 요청 차단됨 (HTTP ${UNAUTH_CODE})"
else
  bad "미인증 요청이 차단되지 않음 (HTTP ${UNAUTH_CODE}, 기대 403/401)"
fi

# invoker SA 임퍼소네이션으로 인증 요청 (운영자에게 Token Creator 권한 필요 → best-effort)
AUTH_TOKEN="$(gcloud auth print-identity-token \
  --impersonate-service-account="${INVOKER_SA}" \
  --audiences="${URL}" 2>/dev/null)"
if [[ -n "${AUTH_TOKEN}" ]]; then
  AUTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 \
    -H "Authorization: Bearer ${AUTH_TOKEN}" "${URL}/health" 2>/dev/null)"
  if [[ "${AUTH_CODE}" == "200" ]]; then
    ok "invoker 토큰 인증 요청 성공 (HTTP 200)"
  else
    bad "invoker 토큰 인증 요청 실패 (HTTP ${AUTH_CODE}, 기대 200)"
  fi
else
  warn "invoker 임퍼소네이션 토큰 발급 불가 (운영자에 iam.serviceAccountTokenCreator 없음). 인증 경로는 수동 확인 필요."
fi

echo
echo "=== 결과: PASS=${PASS} FAIL=${FAIL} ==="
[[ "${FAIL}" -eq 0 ]]
