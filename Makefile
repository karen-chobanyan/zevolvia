SHELL := /bin/sh

DC := docker compose

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

prod-down:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod down

prod-logs:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod logs -f

prod-ps:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod ps

dev-obs:
	$(DC) --profile dev --profile observability up --build

dev-obs-down:
	$(DC) --profile dev --profile observability down

dev-obs-logs:
	$(DC) --profile dev --profile observability logs -f

obs:
	$(DC) --profile observability up -d

obs-down:
	$(DC) --profile observability down

obs-logs:
	$(DC) --profile observability logs -f

obs-ps:
	$(DC) --profile observability ps

prod-obs:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod --profile observability pull
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod --profile observability up -d --no-build

prod-obs-down:
	$(DC) -f docker-compose.yml -f compose.prod.images.yml --profile prod --profile observability down

build:
	$(DC) --profile prod build

down:
	$(DC) down

logs:
	$(DC) logs -f

ps:
	$(DC) ps
