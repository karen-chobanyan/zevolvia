SHELL := /bin/sh

DC := docker compose

.PHONY: dev dev-down dev-logs dev-ps prod prod-down prod-logs prod-ps build down logs ps

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

build:
	$(DC) --profile prod build

down:
	$(DC) down

logs:
	$(DC) logs -f

ps:
	$(DC) ps
