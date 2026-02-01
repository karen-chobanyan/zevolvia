FROM node:20-bookworm-slim AS base

RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --filter saloniq-api

COPY apps/api apps/api

FROM base AS dev

WORKDIR /app
EXPOSE 3001
CMD ["pnpm", "--filter", "saloniq-api", "start:dev"]

FROM base AS build

RUN pnpm --filter saloniq-api build

FROM node:20-bookworm-slim AS prod

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
