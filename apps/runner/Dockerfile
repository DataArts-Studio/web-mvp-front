# Base image bundles the Playwright browsers matching @playwright/test@1.60.0.
# Keep this tag in lockstep with the resolved @playwright/test version in the lockfile.
# package.json과 러너 전용 lockfile의 버전을 이미지 내장 브라우저와 맞춘다.
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

WORKDIR /app

# Build context is this directory (apps/runner). Cloud Run(`gcloud run deploy
# --source .`) 과 fly.toml 모두 이 폴더를 컨텍스트로 잡아, 러너가 모노레포와
# 독립적으로 빌드/배포된다 (@testea/* 의존 없음).

# Corepack ships with the Node bundled in the Playwright image; pin pnpm to the
# repo's packageManager version.
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# PID 1 로 tini 를 둔다. spec 이 setsid 로 빠져나간 뒤 종료된 고아 프로세스를 node 는
# 거두지(reap) 않아 좀비로 쌓이므로, init 역할을 tini 가 맡는다.
# iptables 는 spec uid 의 나가는 연결(메타데이터 서버·내부망)을 막는 데 쓴다 (src/egress-filter.ts).
RUN apt-get update && apt-get install -y --no-install-recommends tini iptables && rm -rf /var/lib/apt/lists/*

# --- Dependency layer -------------------------------------------------------
# Copy only the manifest first so this layer caches across spec/code changes.
COPY package.json pnpm-lock.yaml ./

# Browsers are already in the base image, so skip the post-install download.
# 루트 overrides/lockfile은 이 독립 빌드에 적용되지 않는다.
# 러너 전용 lockfile과 manifest가 어긋나면 재해석하지 않고 빌드를 실패시킨다.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --prod=false --ignore-workspace --frozen-lockfile

# --- Build ------------------------------------------------------------------
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# 서버는 root 로 뜨고, 비신뢰 spec 자식만 비특권 사용자 pwuser(uid 1000)로 강등해 실행한다
# (src/sandbox.ts). uid 를 나눠야 spec 이 서버의 /proc environ(시크릿)을 읽지 못하고,
# 앱 파일(/app/dist, node_modules)은 root 소유로 남아 spec 이 변조할 수 없다.
# 그래서 여기서는 USER 를 바꾸지 않고 /app 소유권도 넘기지 않는다. spec uid 는
# 요청마다 서버가 넘겨주는 run 디렉터리에만 쓸 수 있다.
RUN mkdir -p /app/.runs && chmod 711 /app/.runs

# spec uid 가 run 사이에 남길 수 있는 쓰기 경로를 이미지에서 없앤다. 베이스 이미지는 브라우저
# 디렉터리(/ms-playwright)를 누구나 쓸 수 있게 두므로, 그대로면 spec 이 Chromium 을 바꿔치기해
# 다음 run 이나 서버가 그 바이너리를 실행하게 된다. 남는 공유 경로(/tmp, /var/tmp, /dev/shm)는
# run 이 끝날 때마다 서버가 spec uid 소유 파일을 지운다 (src/sandbox.ts cleanupSandbox).
# 마지막 줄은 빠진 경로가 있으면 빌드를 실패시킨다.
RUN set -eu; \
  chown -R root:root /ms-playwright /home/pwuser; \
  chmod -R go-w /ms-playwright /home/pwuser; \
  find / -xdev \( -path /proc -o -path /sys -o -path /dev -o -path /tmp -o -path /var/tmp \) -prune \
    -o \( -uid 1000 -o -perm -0002 \) ! -type l -print0 \
    | xargs -0 -r sh -c 'chown root:root "$@" && chmod o-w "$@"' _; \
  leftover="$(find / -xdev \( -path /proc -o -path /sys -o -path /dev -o -path /tmp -o -path /var/tmp \) -prune \
    -o \( -uid 1000 -o -perm -0002 \) ! -type l -print)"; \
  if [ -n "$leftover" ]; then echo "sandbox-writable paths remain: $leftover" >&2; exit 1; fi

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]
