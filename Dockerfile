ARG NODE_VERSION=25.8.2
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install pnpm
RUN npm install -g pnpm

# Install node modules
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Copy .git so we can resolve the build version
COPY .git ./.git

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
