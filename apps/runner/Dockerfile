# Base image bundles the Playwright browsers matching @playwright/test@1.60.0.
# Keep this tag in lockstep with the resolved @playwright/test version in the lockfile.
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

WORKDIR /app

# Build context is this directory (apps/runner). fly.toml sets build.dockerfile
# accordingly so the runner ships independently of the rest of the monorepo
# (it has no @testea/* dependencies).

# Corepack ships with the Node bundled in the Playwright image; pin pnpm to the
# repo's packageManager version.
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# --- Dependency layer -------------------------------------------------------
# Copy only the manifest first so this layer caches across spec/code changes.
COPY package.json ./package.json

# Browsers are already in the base image, so skip the post-install download.
# --ignore-workspace keeps this install scoped to the runner (no root lockfile).
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --prod=false --ignore-workspace

# --- Build ------------------------------------------------------------------
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# 비신뢰 spec 은 root 로 실행하지 않는다(권한 상승·컨테이너 탈출 표면 축소).
# Playwright 베이스 이미지가 제공하는 비특권 사용자 pwuser(uid 1000)로 떨어뜨린다.
# 런타임 실행 디렉터리(.runs)를 미리 만들어 소유권을 넘겨, 비root 프로세스가
# 요청별 임시 디렉터리를 생성·정리할 수 있게 한다.
RUN mkdir -p /app/.runs && chown -R pwuser:pwuser /app
USER pwuser

CMD ["node", "dist/server.js"]
