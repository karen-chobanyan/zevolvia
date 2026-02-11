# Zevolvia

An AI-powered SaaS platform for beauty salons, featuring intelligent client follow-ups, document management with RAG (Retrieval-Augmented Generation), and multi-tenant organization management.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts & Commands](#scripts--commands)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [File Ingestion Pipeline](#file-ingestion-pipeline)
- [Authentication & Authorization](#authentication--authorization)
- [Observability](#observability)
- [Development](#development)
- [Deployment](#deployment)

---

## Overview

Zevolvia is a full-stack monorepo application that helps beauty salons manage their operations with AI assistance. Key features include:

- **AI-Powered Follow-ups**: Automated client communication suggestions
- **Document Management**: Upload, organize, and search through documents
- **RAG System**: Semantic search using OpenAI embeddings and pgvector
- **SMS Intake**: Capture inbound client texts via Twilio webhooks
- **Multi-Tenant Architecture**: Organization-based data isolation
- **Role-Based Access Control**: Granular permissions system
- **Real-time Processing**: Async job queue for heavy operations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Web App (3000)                    │   │
│  │         React 18 + Tailwind CSS + Framer Motion             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API Layer                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    NestJS API (3001)                         │   │
│  │    Auth │ Files │ Knowledge │ Ingestion │ Dashboard │ SMS    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
┌──────────────────────┐ ┌──────────────┐ ┌──────────────┐
│   PostgreSQL + pgvector  │ │    Redis     │ │    MinIO     │
│   (Primary Database)  │ │  (Job Queue) │ │(File Storage)│
└──────────────────────┘ └──────────────┘ └──────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │      OpenAI API          │
                    │  (Embeddings Generation) │
                    └──────────────────────────┘
```

### Data Flow: File Upload & RAG Ingestion

```
User Upload → MinIO Storage → Queue Job → Worker Process:
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                         Extract Text    Chunk Text    Generate Embeddings
                         (PDF/DOCX)    (500 tokens)     (OpenAI API)
                              │               │               │
                              └───────────────┼───────────────┘
                                              ▼
                                    Persist to Database
                                   (Document + Chunks +
                                      Embeddings)
```

---

## Tech Stack

### Backend (API)

| Technology    | Purpose                    |
| ------------- | -------------------------- |
| NestJS 10     | Backend framework          |
| TypeORM 0.3   | Database ORM               |
| PostgreSQL 16 | Primary database           |
| pgvector      | Vector similarity search   |
| BullMQ 5      | Job queue                  |
| Redis 7       | Queue backend & caching    |
| MinIO         | S3-compatible file storage |
| Passport.js   | Authentication             |
| OpenAI API    | Embeddings generation      |

### Frontend (Web)

| Technology     | Purpose                      |
| -------------- | ---------------------------- |
| Next.js 14     | React framework (App Router) |
| React 18       | UI library                   |
| Tailwind CSS 4 | Styling                      |
| Framer Motion  | Animations                   |
| Axios          | HTTP client                  |
| Lucide React   | Icons                        |

### DevOps

| Technology     | Purpose           |
| -------------- | ----------------- |
| Docker         | Containerization  |
| Docker Compose | Local development |
| pnpm 8.15      | Package manager   |
| TypeScript 5.3 | Type safety       |

---

## Project Structure

```
zevolvia/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── common/               # Shared utilities & enums
│   │   │   │   ├── base-model.entity.ts
│   │   │   │   └── enums.ts
│   │   │   ├── config/               # Configuration
│   │   │   │   └── typeorm.config.ts
│   │   │   ├── database/             # Database setup
│   │   │   │   ├── migrations/       # TypeORM migrations
│   │   │   │   ├── data-source.ts
│   │   │   │   └── seed.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # Authentication & authorization
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/   # Passport strategies
│   │   │   │   │   └── guards/       # Permission guards
│   │   │   │   ├── identity/         # Users, Orgs, Roles, Permissions
│   │   │   │   │   └── entities/
│   │   │   │   ├── files/            # File management
│   │   │   │   │   ├── entities/
│   │   │   │   │   └── services/
│   │   │   │   ├── file-manager/     # Folder organization
│   │   │   │   ├── knowledge/        # Knowledge bases & documents
│   │   │   │   │   └── entities/
│   │   │   │   ├── ingestion/        # RAG pipeline
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── text-extractor.service.ts
│   │   │   │   │   │   ├── chunker.service.ts
│   │   │   │   │   │   └── embedding.service.ts
│   │   │   │   │   ├── ingestion.service.ts
│   │   │   │   │   └── ingestion.processor.ts
│   │   │   │   └── dashboard/        # Dashboard statistics
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # Next.js Frontend
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── (auth)/           # Auth pages (login, signup)
│       │   │   ├── dashboard/        # Protected dashboard pages
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/           # React components
│       │   │   ├── ui/               # Base UI components
│       │   │   ├── auth/             # Auth forms
│       │   │   ├── dashboard/        # Dashboard components
│       │   │   ├── file-manager/     # File management UI
│       │   │   └── chats/            # Chat interface
│       │   ├── lib/                  # Utilities & API clients
│       │   ├── hooks/                # Custom React hooks
│       │   └── context/              # React context providers
│       ├── package.json
│       └── tailwind.config.ts
│
├── packages/                         # Shared packages (future)
├── docker/
│   └── Dockerfile
├── docker-compose.yml
├── package.json                      # Root package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (v2)
- **Node.js** 20+ and **pnpm** 8.15+ (for local-only dev)

### Quickstart (Docker)

1. **Clone and configure**

   ```bash
   git clone git@gitlab.com:ateroproducts/zevolvia.git
   cd zevolvia
   cp apps/api/.env.example apps/api/.env.docker
   cp apps/web/.env.example apps/web/.env
   ```

2. **Dev (hot reload)**

   ```bash
   make dev
   ```

3. **Prod-like (built images)**

   ```bash
   make prod
   ```

4. **Stop services**

   ```bash
   make dev-down
   make prod-down
   ```

5. **Logs / status**

   ```bash
   make dev-logs
   make dev-ps
   ```

   This starts:
   - PostgreSQL + pgvector (port 5432)
   - Redis (port 6379)
   - MinIO (ports 9000, 9001)
   - API server (port 3001)
   - Web app (port 3000)

6. **Run database migrations**

   ```bash
   docker compose --profile dev exec api pnpm --filter zevolvia-api migration:run
   ```

7. **Seed the database** (optional)

   ```bash
   docker compose --profile dev exec api pnpm --filter zevolvia-api seed
   ```

8. **Access the application**
   - Web App: http://localhost:3000
   - API: http://localhost:3001/api
   - MinIO Console: http://localhost:9001

You can run the same flows without `make`:

```bash
docker compose --profile dev up --build
```

If Docker dev services complain about missing Node deps after changing the Dockerfile or lockfile, reset the shared volume:

```bash
make dev-down
docker volume rm evolvia_node_modules
make dev
```

### Local Development (without Docker)

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start infrastructure services**

   ```bash
   docker compose --profile dev up db redis minio -d
   ```

3. **Run migrations**

   ```bash
   pnpm --filter zevolvia-api migration:run
   ```

4. **Start development servers**

   ```bash
   # Terminal 1 - API
   pnpm dev:api

   # Terminal 2 - Web
   pnpm dev:web
   ```

### CI/CD

Docker images are built and pushed to the GitLab Container Registry on every push to the default branch. See `.gitlab-ci.yml` for the pipeline configuration.

| Image | Registry Path                                           |
| ----- | ------------------------------------------------------- |
| API   | `registry.gitlab.com/ateroproducts/zevolvia/api:latest` |
| Web   | `registry.gitlab.com/ateroproducts/zevolvia/web:latest` |

---

## Environment Variables

### API (`apps/api/.env`)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=zevolvia
DB_CONNECT_TIMEOUT_MS=5000

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=1d

# CORS
WEB_ORIGIN=http://localhost:3000

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=zevolvia-files

# Redis (Job Queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small

# Public URL (used for webhook signature validation)
# Do not include /api at the end (e.g. https://your-domain.com)
PUBLIC_API_URL=https://your-public-domain

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***
STRIPE_PRICE_MONTHLY=price_***
STRIPE_PRICE_YEARLY=price_***
# Optional overrides
FRONTEND_URL=http://localhost:3000
STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=
STRIPE_PORTAL_RETURN_URL=

# Twilio (Inbound SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
# Optional: outbound replies via Messaging Service
TWILIO_MESSAGING_SERVICE_SID=
# Optional: set when behind a proxy / ngrok
TWILIO_WEBHOOK_URL=https://your-public-url/api/sms/twilio
TWILIO_STATUS_CALLBACK_URL=https://your-public-url/api/sms/twilio/status
TWILIO_VALIDATE_SIGNATURE=true

# Phone normalization
DEFAULT_PHONE_COUNTRY=US

# Chunking Configuration
CHUNK_SIZE=500
CHUNK_OVERLAP=150

# Seeding (optional)
SEED_EMAIL=owner@zevolvia.ai
SEED_PASSWORD=ChangeMe123!
SEED_FIRST_NAME=Salon
SEED_LAST_NAME=Owner
SEED_ORG_NAME=Zevolvia Studio
```

### Web (`apps/web/.env`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Scripts & Commands

### Root Commands

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `pnpm dev:api`   | Start API in development mode     |
| `pnpm dev:web`   | Start Web app in development mode |
| `pnpm build:api` | Build API for production          |
| `pnpm build:web` | Build Web app for production      |
| `pnpm lint`      | Run linting across all packages   |
| `pnpm format`    | Format code with Prettier         |

### API Commands (`apps/api/`)

| Command                          | Description                              |
| -------------------------------- | ---------------------------------------- |
| `pnpm start`                     | Start production server                  |
| `pnpm start:dev`                 | Start development server with hot reload |
| `pnpm build`                     | Compile TypeScript                       |
| `pnpm lint`                      | Run ESLint                               |
| `pnpm migration:generate <path>` | Generate a new migration                 |
| `pnpm migration:run`             | Run pending migrations                   |
| `pnpm migration:revert`          | Revert last migration                    |
| `pnpm migration:show`            | Show migration status                    |
| `pnpm seed`                      | Seed the database                        |

### Docker Commands

| Command                      | Description              |
| ---------------------------- | ------------------------ |
| `docker-compose up`          | Start all services       |
| `docker-compose up -d`       | Start in detached mode   |
| `docker-compose down`        | Stop all services        |
| `docker-compose down -v`     | Stop and remove volumes  |
| `docker-compose logs -f api` | Follow API logs          |
| `docker-compose exec api sh` | Shell into API container |

### Make Targets

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `make obs`           | Start Loki + Grafana + Vector                |
| `make obs-down`      | Stop observability stack                     |
| `make obs-logs`      | Follow observability stack logs              |
| `make obs-ps`        | Show observability services status           |
| `make prod-obs`      | Start production app + observability profile |
| `make prod-obs-down` | Stop production app + observability profile  |

---

## API Reference

### Authentication

| Method | Endpoint             | Description                      |
| ------ | -------------------- | -------------------------------- |
| `POST` | `/api/auth/register` | Register new user & organization |
| `POST` | `/api/auth/login`    | Login and receive tokens         |
| `POST` | `/api/auth/logout`   | Logout and revoke tokens         |
| `POST` | `/api/auth/refresh`  | Refresh access token             |
| `GET`  | `/api/auth/me`       | Get current user info            |

### Profile

| Method  | Endpoint           | Description                  |
| ------- | ------------------ | ---------------------------- |
| `GET`   | `/api/profile`     | Get user/org profile data    |
| `PATCH` | `/api/profile`     | Update user profile fields   |
| `PATCH` | `/api/profile/org` | Update organization settings |

Update payloads:

- `PATCH /api/profile`: `firstName`, `lastName`, `phone`, `avatarUrl`, `locale`, `timeZone`
- `PATCH /api/profile/org`: `name`, `phone`

### Billing (Stripe)

| Method | Endpoint                         | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| `GET`  | `/api/billing/status`            | Get billing status for org     |
| `POST` | `/api/billing/checkout`          | Create Stripe checkout session |
| `POST` | `/api/billing/checkout/complete` | Finalize checkout session      |
| `POST` | `/api/billing/portal`            | Create Stripe billing portal   |
| `POST` | `/api/billing/webhook`           | Stripe webhook endpoint        |

### SMS (Twilio)

| Method | Endpoint                 | Description                         |
| ------ | ------------------------ | ----------------------------------- |
| `POST` | `/api/sms/twilio`        | Twilio inbound SMS webhook (TwiML)  |
| `POST` | `/api/sms/twilio/status` | Twilio SMS delivery status callback |

Notes:

- Twilio sends `application/x-www-form-urlencoded` parameters and expects a TwiML response.
- Signature validation uses `X-Twilio-Signature` and the full webhook URL.
- Org matching is based on `orgs.phone` (recommended to store the Twilio number in E.164).
- Inbound SMS auto-creates a client record for unknown phone numbers, stores the payload in `sms_messages`, appends a `USER` message to an SMS-scoped chat session in `chat_messages`, generates an AI reply, and sends it via Twilio API.
- Outbound reply records are also stored in `sms_messages` with `direction = 'outbound'`.
- Twilio delivery updates are applied through `/api/sms/twilio/status`.

Setup checklist:

- Set the organization phone in Settings (or via `PATCH /api/profile/org`) to the Twilio number.
- Configure the Twilio Messaging webhook to `POST` to `/api/sms/twilio`.
- For local dev or proxies, set `TWILIO_WEBHOOK_URL` so signature validation can compute the exact webhook URL.

### Files

| Method   | Endpoint                             | Description                |
| -------- | ------------------------------------ | -------------------------- |
| `POST`   | `/api/files/upload`                  | Upload file (max 50MB)     |
| `GET`    | `/api/files`                         | List files with pagination |
| `GET`    | `/api/files/:id`                     | Get file metadata          |
| `GET`    | `/api/files/:id/download`            | Get presigned download URL |
| `DELETE` | `/api/files/:id`                     | Delete file                |
| `POST`   | `/api/files/:id/link-knowledge-base` | Link to knowledge base     |

### File Manager

| Method   | Endpoint                        | Description   |
| -------- | ------------------------------- | ------------- |
| `GET`    | `/api/file-manager/folders`     | List folders  |
| `POST`   | `/api/file-manager/folders`     | Create folder |
| `PATCH`  | `/api/file-manager/folders/:id` | Rename folder |
| `DELETE` | `/api/file-manager/folders/:id` | Delete folder |
| `GET`    | `/api/file-manager/files`       | List files    |
| `POST`   | `/api/file-manager/upload`      | Upload files  |
| `PATCH`  | `/api/file-manager/files/:id`   | Move file     |
| `DELETE` | `/api/file-manager/files/:id`   | Delete file   |

### Dashboard

| Method | Endpoint                 | Description              |
| ------ | ------------------------ | ------------------------ |
| `GET`  | `/api/dashboard/summary` | Get dashboard statistics |

### Booking

| Method   | Endpoint                           | Description         |
| -------- | ---------------------------------- | ------------------- |
| `GET`    | `/api/services`                    | List services       |
| `POST`   | `/api/services`                    | Create service      |
| `PATCH`  | `/api/services/:id`                | Update service      |
| `DELETE` | `/api/services/:id`                | Delete service      |
| `GET`    | `/api/clients`                     | List clients        |
| `POST`   | `/api/clients`                     | Create client       |
| `PATCH`  | `/api/clients/:id`                 | Update client       |
| `DELETE` | `/api/clients/:id`                 | Delete client       |
| `GET`    | `/api/bookings`                    | List bookings       |
| `POST`   | `/api/bookings`                    | Create booking      |
| `PATCH`  | `/api/bookings/:id`                | Update booking      |
| `POST`   | `/api/bookings/:id/cancel`         | Cancel booking      |
| `GET`    | `/api/bookings/calendar`           | Calendar events     |
| `GET`    | `/api/bookings/check-availability` | Availability check  |
| `GET`    | `/api/staff-availability`          | List availability   |
| `POST`   | `/api/staff-availability`          | Create availability |
| `PATCH`  | `/api/staff-availability/:id`      | Update availability |
| `DELETE` | `/api/staff-availability/:id`      | Delete availability |

### Organization

| Method   | Endpoint                      | Description               |
| -------- | ----------------------------- | ------------------------- |
| `GET`    | `/api/org/members`            | List organization members |
| `PATCH`  | `/api/org/members/:id`        | Update member role        |
| `DELETE` | `/api/org/members/:id`        | Remove member             |
| `GET`    | `/api/org/invites`            | List pending invites      |
| `POST`   | `/api/org/invites`            | Create invite             |
| `POST`   | `/api/org/invites/:id/cancel` | Cancel invite             |
| `GET`    | `/api/org/roles`              | List available roles      |

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    orgs     │───┬───│    users    │       │ permissions │
└─────────────┘   │   └─────────────┘       └─────────────┘
       │          │          │                     │
       │          │          │                     │
       ▼          │          ▼                     ▼
┌─────────────┐   │   ┌─────────────┐       ┌─────────────┐
│    roles    │───┴───│ memberships │       │role_perms   │
└─────────────┘       └─────────────┘       └─────────────┘
       │
       ├──────────────────────────────┐
       ▼                              ▼
┌─────────────┐                ┌─────────────┐
│   folders   │                │    files    │
└─────────────┘                └─────────────┘
       │                              │
       └──────────────┬───────────────┘
                      ▼
               ┌─────────────┐
               │knowledge_   │
               │   bases     │
               └─────────────┘
                      │
                      ▼
               ┌─────────────┐
               │  documents  │
               └─────────────┘
                      │
                      ▼
               ┌─────────────┐
               │   chunks    │
               └─────────────┘
                      │
                      ▼
               ┌─────────────┐
               │ embeddings  │
               │ (pgvector)  │
               └─────────────┘
```

### Key Tables

| Table                   | Description                         |
| ----------------------- | ----------------------------------- |
| `orgs`                  | Organizations/workspaces            |
| `users`                 | User accounts                       |
| `roles`                 | Organization-scoped roles           |
| `permissions`           | Granular permission keys            |
| `memberships`           | User-Org associations               |
| `files`                 | Uploaded file metadata              |
| `folders`               | Hierarchical folder structure       |
| `knowledge_bases`       | RAG document collections            |
| `documents`             | Ingested documents                  |
| `chunks`                | Text segments with token counts     |
| `embeddings`            | Vector embeddings (1536 dimensions) |
| `refresh_tokens`        | Token revocation tracking           |
| `user_profiles`         | User profile details                |
| `billing_customers`     | Stripe customer mapping             |
| `billing_subscriptions` | Stripe subscription state           |
| `sms_messages`          | Inbound SMS from Twilio             |

---

## File Ingestion Pipeline

### Supported File Types

| MIME Type                                                                 | Extension | Extractor    |
| ------------------------------------------------------------------------- | --------- | ------------ |
| `application/pdf`                                                         | .pdf      | pdf-parse    |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .docx     | mammoth      |
| `text/plain`                                                              | .txt      | UTF-8 decode |
| `text/markdown`                                                           | .md       | UTF-8 decode |

### Pipeline Configuration

| Parameter         | Default                | Description              |
| ----------------- | ---------------------- | ------------------------ |
| `CHUNK_SIZE`      | 500                    | Tokens per chunk         |
| `CHUNK_OVERLAP`   | 150                    | Overlap between chunks   |
| `EMBEDDING_MODEL` | text-embedding-3-small | OpenAI model (1536 dims) |
| Batch Size        | 2048                   | Max texts per API call   |
| Retries           | 3                      | Job retry attempts       |
| Backoff           | Exponential            | 1s base delay            |

### RAG Status Flow

```
pending → queued → ingesting → indexed
                 ↘ failed (with error message)
                 ↘ skipped (unsupported type)
```

---

## Authentication & Authorization

### Token Strategy

- **Access Token**: JWT, 15-minute expiry, stored in httpOnly cookie
- **Refresh Token**: SHA-256 hashed, 1-day expiry, stored in httpOnly cookie
- **Token Rotation**: Refresh tokens are rotated on each refresh

### Permission System

| Permission     | Description         |
| -------------- | ------------------- |
| `files:read`   | View files          |
| `files:write`  | Create/modify files |
| `files:delete` | Delete files        |
| `files:upload` | Upload new files    |

### Default Roles

| Role  | Permissions     |
| ----- | --------------- |
| Owner | All permissions |

---

## Logging

The API uses [Pino](https://github.com/pinojs/pino) for high-performance structured logging via `nestjs-pino`.

### Log Levels

| Level   | Description            |
| ------- | ---------------------- |
| `fatal` | System is unusable     |
| `error` | Error conditions       |
| `warn`  | Warning conditions     |
| `info`  | Informational messages |
| `debug` | Debug-level messages   |
| `trace` | Trace-level messages   |

Configure via `LOG_LEVEL` environment variable (defaults to `debug` in development, `info` in production).

### Features

- **Structured JSON logging** in production for easy parsing
- **Pretty printing** in development with colors and timestamps
- **Request correlation IDs** via `x-request-id` header
- **Automatic request/response logging** with duration metrics
- **Sensitive data redaction** (passwords, tokens, API keys)
- **User context** (userId, orgId) attached to logs when authenticated

### Log Output Examples

**Development (pretty printed):**

```
[2024-01-15 10:30:45.123] INFO: POST /api/auth/login completed with 200
    requestId: "abc-123"
    userId: "user-456"
    duration: 45
```

**Production (JSON):**

```json
{
  "level": 30,
  "time": 1705312245123,
  "requestId": "abc-123",
  "userId": "user-456",
  "msg": "POST /api/auth/login completed with 200",
  "duration": 45
}
```

### Using Logger in Services

```typescript
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";

@Injectable()
export class MyService {
  constructor(
    @InjectPinoLogger(MyService.name)
    private readonly logger: PinoLogger,
  ) {}

  async doSomething() {
    this.logger.info({ userId, action: "create" }, "Creating resource");
    // ... business logic
    this.logger.debug({ resourceId, duration }, "Resource created");
  }
}
```

---

## Observability

The repository includes a production-oriented log pipeline:

- **API (Pino JSON logs)** -> **Vector** -> **Loki** -> **Grafana**
- `orgId`, `userId`, and `requestId` remain queryable fields for incident triage
- Low-cardinality labels (`service`, `env`, `level`) are used for Loki indexing

### Configuration Files

- `docker/observability/loki-config.yml`
- `docker/observability/vector.yaml`
- `docker/observability/grafana/provisioning/datasources/loki.yml`
- `docker/observability/grafana/provisioning/dashboards/dashboards.yml`
- `docker/observability/grafana/provisioning/alerting/rules.yml`
- `docker/observability/grafana/dashboards/api-logs-overview.json`

### Start Observability Stack

```bash
# Observability only
make obs

# Production app + observability
make prod-obs
```

`make obs`/`make prod-obs` automatically load `.env.observability` when the file exists.

### Access

- Grafana: `http://localhost:${GRAFANA_PORT:-3030}` (default `admin` / `admin`)
- Loki HTTP API: `http://localhost:${LOKI_PORT:-3100}`
- Vector API: `http://localhost:${VECTOR_API_PORT:-8686}`

### Nginx Reverse Proxy (Grafana on `/api/live`)

If you expose Grafana through your main domain, use the provided snippet:

- `docker/observability/nginx/grafana-api-live.conf`
- `docker/observability/nginx/zevolvia.com.conf` (full server config template)

Important:

- Place `location ^~ /api/live/` **before** generic `/api/` locations.
- Set Grafana subpath settings in `.env.observability`:
  - `GF_SERVER_ROOT_URL=https://zevolvia.com/api/live`
  - `GF_SERVER_SERVE_FROM_SUB_PATH=true`

Deploy example:

```bash
sudo cp docker/observability/nginx/zevolvia.com.conf /etc/nginx/sites-available/zevolvia.com
sudo ln -s /etc/nginx/sites-available/zevolvia.com /etc/nginx/sites-enabled/zevolvia.com
sudo nginx -t && sudo systemctl reload nginx
```

### Query Examples (Grafana Explore -> Loki)

```logql
{service="api", env="prod"} | json
```

```logql
{service="api", env="prod", level=~"error|fatal"} | json
```

```logql
{service="api", env="prod"} | json | orgId="YOUR_ORG_ID"
```

```logql
{service="api", env="prod"} | json | requestId="YOUR_REQUEST_ID"
```

### Provisioned Alerts

Alert rules are auto-provisioned on Grafana startup from `docker/observability/grafana/provisioning/alerting/rules.yml`.

- API Error Burst (5m)
- Auth Login Failures Burst (10m)
- Webhook Failures Burst (10m)
- Ingestion Pipeline Failures (10m)
- Token Refresh Failures Burst (10m)

Configure notification channels in Grafana (`Alerting -> Contact points`) to deliver these alerts to Slack/PagerDuty/email.

---

## Development

### Code Style

- **TypeScript** for type safety
- **ESLint** for linting
- **Prettier** for formatting
- **Husky** for git hooks

### Testing

```bash
# Run tests (when implemented)
pnpm test
```

### Database Migrations

```bash
# Generate migration from entity changes
pnpm --filter zevolvia-api migration:generate src/database/migrations/MigrationName

# Run migrations
pnpm --filter zevolvia-api migration:run

# Revert last migration
pnpm --filter zevolvia-api migration:revert
```

---

## Deployment

### Production Build

```bash
# Build all packages
pnpm build:api
pnpm build:web
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `LOG_LEVEL=info` (or `warn` for less verbose)
- [ ] Set strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure S3/MinIO with proper credentials
- [ ] Set valid `OPENAI_API_KEY`
- [ ] Configure `WEB_ORIGIN` for CORS
- [ ] Enable SSL for all services

### Docker Production

```bash
# Build production images
docker build -f docker/Dockerfile --target prod -t zevolvia-api .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## Technical Decisions

### Why pnpm Workspaces?

- Efficient disk space usage with hard links
- Strict dependency resolution
- Native monorepo support
- Fast installation times

### Why pgvector?

- Native PostgreSQL integration
- No external vector database needed
- IVFFlat indexing for fast similarity search
- Supports 1536-dimension vectors (OpenAI compatible)

### Why BullMQ?

- Robust job queue with Redis backend
- Built-in retry mechanism with exponential backoff
- Job prioritization and rate limiting
- Real-time job monitoring

### Why MinIO?

- S3-compatible API
- Self-hosted option
- Easy local development
- Seamless migration to AWS S3

### Why cl100k_base Tokenizer?

- Same tokenizer used by OpenAI models
- Accurate token counting for chunk sizing
- Prevents mid-word splits

### Why Pino for Logging?

- Fastest Node.js logger (~5x faster than alternatives)
- Structured JSON output for production
- Request correlation IDs out of the box
- Automatic sensitive data redaction
- Pretty printing for development
- Low overhead in high-throughput scenarios

---

## License

Proprietary - All Rights Reserved

---

## Support

For support, please contact the development team or open an issue in the repository.
