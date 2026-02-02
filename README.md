# SalonIQ

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
- [Development](#development)
- [Deployment](#deployment)

---

## Overview

SalonIQ is a full-stack monorepo application that helps beauty salons manage their operations with AI assistance. Key features include:

- **AI-Powered Follow-ups**: Automated client communication suggestions
- **Document Management**: Upload, organize, and search through documents
- **RAG System**: Semantic search using OpenAI embeddings and pgvector
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
│  │    Auth │ Files │ Knowledge │ Ingestion │ Dashboard          │   │
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
saloniq/
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

- **Node.js** 20+
- **pnpm** 8.15+
- **Docker** & **Docker Compose**

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd saloniq
   ```

2. **Copy environment files**

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

3. **Configure environment variables** (see [Environment Variables](#environment-variables))

4. **Start with Docker Compose**

   ```bash
   docker-compose up
   ```

   This starts:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - MinIO (ports 9000, 9001)
   - API server (port 3001)
   - Web app (port 3000)

5. **Run database migrations**

   ```bash
   docker-compose exec api pnpm --filter saloniq-api migration:run
   ```

6. **Seed the database** (optional)

   ```bash
   docker-compose exec api pnpm --filter saloniq-api seed
   ```

7. **Access the application**
   - Web App: http://localhost:3000
   - API: http://localhost:3001/api
   - MinIO Console: http://localhost:9001

### Local Development (without Docker)

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start external services**

   ```bash
   docker-compose up db redis minio -d
   ```

3. **Run migrations**

   ```bash
   pnpm --filter saloniq-api migration:run
   ```

4. **Start development servers**

   ```bash
   # Terminal 1 - API
   pnpm dev:api

   # Terminal 2 - Web
   pnpm dev:web
   ```

---

## Environment Variables

### API (`apps/api/.env`)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=saloniq
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
MINIO_BUCKET=saloniq-files

# Redis (Job Queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small

# Chunking Configuration
CHUNK_SIZE=500
CHUNK_OVERLAP=150

# Seeding (optional)
SEED_EMAIL=owner@saloniq.ai
SEED_PASSWORD=ChangeMe123!
SEED_FIRST_NAME=Salon
SEED_LAST_NAME=Owner
SEED_ORG_NAME=SalonIQ Studio
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

| Table             | Description                         |
| ----------------- | ----------------------------------- |
| `orgs`            | Organizations/workspaces            |
| `users`           | User accounts                       |
| `roles`           | Organization-scoped roles           |
| `permissions`     | Granular permission keys            |
| `memberships`     | User-Org associations               |
| `files`           | Uploaded file metadata              |
| `folders`         | Hierarchical folder structure       |
| `knowledge_bases` | RAG document collections            |
| `documents`       | Ingested documents                  |
| `chunks`          | Text segments with token counts     |
| `embeddings`      | Vector embeddings (1536 dimensions) |
| `refresh_tokens`  | Token revocation tracking           |

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
pnpm --filter saloniq-api migration:generate src/database/migrations/MigrationName

# Run migrations
pnpm --filter saloniq-api migration:run

# Revert last migration
pnpm --filter saloniq-api migration:revert
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
docker build -f docker/Dockerfile --target prod -t saloniq-api .

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
