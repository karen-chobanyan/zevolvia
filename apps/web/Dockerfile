FROM node:20-bookworm-slim AS base

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --filter saloniq-web

COPY apps/web apps/web

FROM base AS dev

WORKDIR /app
EXPOSE 3000
CMD ["pnpm", "--filter", "saloniq-web", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

FROM base AS build

RUN pnpm --filter saloniq-web build

FROM node:20-bookworm-slim AS prod

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/.next /app/apps/web/.next
COPY --from=build /app/apps/web/public /app/apps/web/public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["pnpm", "--filter", "saloniq-web", "start"]
