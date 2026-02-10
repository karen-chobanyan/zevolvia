FROM node:20-bookworm-slim AS base

RUN corepack enable

WORKDIR /app

ENV HUSKY=0

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --filter zevolvia-web

COPY apps/web apps/web

FROM base AS dev

WORKDIR /app
EXPOSE 3000
CMD ["pnpm", "--filter", "zevolvia-web", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

FROM base AS build

RUN pnpm --filter zevolvia-web build

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
CMD ["pnpm", "--filter", "zevolvia-web", "start"]
