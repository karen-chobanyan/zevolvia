SHELL := /bin/sh

DC := docker compose
OBS_ENV := $(if $(wildcard .env.observability),--env-file .env.observability,)

.PHONY: dev dev-down dev-logs dev-ps dev-obs dev-obs-down dev-obs-logs prod prod-down prod-logs prod-ps obs obs-down obs-logs obs-ps prod-obs prod-obs-down build down logs ps

dev:
	$(DC) --profile dev up --build

dev-down:
	$(DC) --profile dev down

dev-logs:
	$(DC) --profile dev logs -f

dev-ps:
	$(DC) --profile dev ps

prod:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod pull
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod up -d --no-build

prod-migrate:
	docker compose -f docker-compose.yml -f compose.prod.images.yml --profile prod run --rm api-prod node -e "const { AppDataSource } = require('./apps/api/dist/database/data-source'); AppDataSource.initialize().then(() => AppDataSource.runMigrations()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });"

prod-down:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod down

prod-logs:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod logs -f

prod-ps:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod ps

dev-obs:
	$(DC) $(OBS_ENV) --profile dev --profile observability up --build

dev-obs-down:
	$(DC) $(OBS_ENV) --profile dev --profile observability down

dev-obs-logs:
	$(DC) $(OBS_ENV) --profile dev --profile observability logs -f

obs:
	$(DC) $(OBS_ENV) --profile observability up -d

obs-down:
	$(DC) $(OBS_ENV) --profile observability down

obs-logs:
	$(DC) $(OBS_ENV) --profile observability logs -f

obs-ps:
	$(DC) $(OBS_ENV) --profile observability ps

prod-obs:
	$(DC) $(OBS_ENV) -f docker-compose.yml -f compose.prod.images.yml --profile prod --profile observability pull
	$(DC) $(OBS_ENV) -f docker-compose.yml -f compose.prod.images.yml --profile prod --profile observability up -d --no-build

prod-obs-down:
	$(DC) $(OBS_ENV) -f docker-compose.yml -f compose.prod.images.yml --profile prod --profile observability down

build:
	$(DC) --profile prod build

down:
	$(DC) down

logs:
	$(DC) logs -f

ps:
	$(DC) ps
