ARG NODE_VERSION=25.8.2
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install git (needed to resolve build version) and pnpm
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@11.1.2

# Install node modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .


ARG APP_VERSION=""
RUN APP_VERSION="${APP_VERSION:-$(git describe --tags --exact-match 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo dev)}" && echo "APP_VERSION=${APP_VERSION}" > /tmp/app_version.env

# Build application (APP_VERSION is read by vite.config.ts at build time)
RUN set -a && . /tmp/app_version.env && set +a && pnpm run build

FROM base

WORKDIR /app

COPY --from=build --chown=node:node /app/.output ./

ENV PORT="3000"
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server/index.mjs"]
