# Base image bundles the Playwright browsers matching @playwright/test@1.60.0.
# Keep this tag in lockstep with the resolved @playwright/test version in the lockfile.
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

CMD ["node", "dist/server.js"]
