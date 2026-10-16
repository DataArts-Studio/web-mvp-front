#!/usr/bin/env bash
#
# 러너 egress 경계 로컬 검증 (합성 데이터 + Docker). 운영 비밀값·운영 인프라를 쓰지 않는다.
#
# 세 구성으로 러너 이미지를 띄워 /run 에 탐침 spec(egress-probe.spec.ts)을 보낸다.
#   1) enforced    : --cap-add NET_ADMIN. spec uid 방화벽 적용. 공개 대상(프록시 경유)만 도달해야 한다.
#   2) no-cap      : NET_ADMIN 없음. 방화벽을 못 걸었으니 /run 이 503 으로 거부돼야 한다.
#   3) unrestricted: NET_ADMIN 없음 + RUNNER_ALLOW_UNRESTRICTED_EGRESS=1. 탐침이 직접 통신을
#                    잡아낼 수 있는지 보는 대조군이다(직접 경로가 REACHED 로 나와야 정상).
# /capture 는 enforced 구성에서 공개 페이지 허용, 내부로 리다이렉트되는 페이지 차단을 확인한다.
#
# 공개 대상으로 example.com, 리다이렉트 시험에 httpbin.org 를 쓰므로 인터넷 연결이 필요하다.
# 사용: apps/runner 에서  bash scripts/verify-egress.sh

set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE="${RUNNER_EGRESS_IMAGE:-testea-runner-egress-check}"
SECRET="synthetic-runner-secret"
HOST_PORT="${RUNNER_EGRESS_HOST_PORT:-18080}"
INTERNAL_SERVER="require('http').createServer((q,s)=>s.end('SYNTHETIC-INTERNAL-SECRET')).listen(9999,'127.0.0.1')"
FAILED=0
CONTAINER=""

cleanup() { [[ -n "${CONTAINER}" ]] && docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true; }
trap cleanup EXIT

SPEC_JSON="$(node -e "process.stdout.write(JSON.stringify({spec: require('fs').readFileSync(process.argv[1],'utf8'), timeoutMs: 90000}))" scripts/egress-probe.spec.ts)"

start() {
  cleanup
  CONTAINER="$(docker run -d -p "${HOST_PORT}:8080" -e RUNNER_SHARED_SECRET="${SECRET}" "$@" "${IMAGE}")"
  for _ in $(seq 1 60); do
    curl -fs "http://localhost:${HOST_PORT}/health" >/dev/null 2>&1 && break
    sleep 1
  done
  docker exec -d "${CONTAINER}" node -e "${INTERNAL_SERVER}"
  sleep 1
}

post() {
  curl -s -o /tmp/egress-body.json -w '%{http_code}' -X POST "http://localhost:${HOST_PORT}$1" \
    -H 'Content-Type: application/json' -H "X-Runner-Secret: ${SECRET}" --data-binary "$2"
}

results() {
  node -e "
    const body = JSON.parse(require('fs').readFileSync('/tmp/egress-body.json', 'utf8'));
    const match = /EGRESS_RESULTS (\{.*\})/.exec(body.errorMessage ?? '');
    if (!match) { console.log(JSON.stringify(body)); process.exit(2); }
    process.stdout.write(match[1]);
  "
}

expect() {
  local label="$1" ok="$2"
  if [[ "${ok}" == "true" ]]; then echo "  PASS  ${label}"; else echo "  FAIL  ${label}"; FAILED=1; fi
}

echo "[build] ${IMAGE}"
docker build -q -t "${IMAGE}" . >/dev/null

echo "[1/3] enforced (NET_ADMIN)"
start --cap-add NET_ADMIN
docker logs "${CONTAINER}" 2>&1 | grep -q 'egress firewall unavailable' && expect "firewall applied at boot" false || expect "firewall applied at boot" true
status="$(post /run "${SPEC_JSON}")"
expect "/run accepted (${status})" "$([[ ${status} == 200 ]] && echo true || echo false)"
json="$(results)"
echo "${json}" | node -e "
  const r = JSON.parse(require('fs').readFileSync(0, 'utf8'));
  for (const [k, v] of Object.entries(r)) console.log('        ' + k.padEnd(32) + v);
  const allowed = ['page public via proxy', 'raw chromium with proxy'];
  const bad = Object.entries(r).filter(([k, v]) => allowed.includes(k) ? v !== 'REACHED' : v === 'REACHED');
  process.exit(bad.length ? 1 : 0);
" && expect "only proxied public target reached" true || expect "only proxied public target reached" false
status="$(post /capture '{"url":"https://example.com/"}')"
expect "/capture public page" "$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('/tmp/egress-body.json','utf8')).ok === true))")"
status="$(post /capture '{"url":"https://httpbin.org/redirect-to?url=http%3A%2F%2F127.0.0.1%3A9999%2F","timeoutMs":15000}')"
expect "/capture redirect to internal blocked" "$(node -e "const b=JSON.parse(require('fs').readFileSync('/tmp/egress-body.json','utf8')); process.stdout.write(String(!JSON.stringify(b).includes('SYNTHETIC')))")"

echo "[2/3] no-cap (fail-closed)"
start
status="$(post /run "${SPEC_JSON}")"
expect "/run rejected without firewall (${status})" "$([[ ${status} == 503 ]] && echo true || echo false)"

echo "[3/3] unrestricted (control)"
start -e RUNNER_ALLOW_UNRESTRICTED_EGRESS=1
status="$(post /run "${SPEC_JSON}")"
json="$(results)"
echo "${json}" | node -e "
  const r = JSON.parse(require('fs').readFileSync(0, 'utf8'));
  for (const [k, v] of Object.entries(r)) console.log('        ' + k.padEnd(32) + v);
  process.exit(r['direct fetch loopback'] === 'REACHED' ? 0 : 1);
" && expect "probe detects direct access when unrestricted" true || expect "probe detects direct access when unrestricted" false

echo
if [[ "${FAILED}" == 0 ]]; then echo "egress verification passed"; else echo "egress verification FAILED"; fi
exit "${FAILED}"
