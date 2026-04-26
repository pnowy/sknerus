ARG NODE_VERSION=25.8.2
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Enable pnpm via corepack
RUN corepack enable

# Install node modules
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build application
RUN pnpm build

FROM base

WORKDIR /app

COPY --from=build --chown=node:node /app/.output ./

ENV PORT="8080"
EXPOSE 8080
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server/index.mjs"]
