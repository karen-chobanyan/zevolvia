# Playwright E2E Testing

This project uses Playwright for deterministic, API-mocked E2E coverage of critical user flows in the Next.js app.

## Structure

```text
/e2e
  /fixtures
  /pages
  /tests
  /utils
/playwright.config.ts
```

- `e2e/fixtures`: shared test fixtures and deterministic mock data.
- `e2e/pages`: Page Object Model classes.
- `e2e/tests`: feature-focused E2E specs.
- `e2e/utils`: route discovery, API interception, waits, and test data helpers.

## Environment

Playwright reads `.env.test.local` first, then `.env.test`.

Required variables:

```bash
BASE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_API_URL=http://127.0.0.1:4010/api
```

`NEXT_PUBLIC_API_URL` is intentionally pointed to a mock API origin so Playwright can intercept all API traffic.

## Run Locally

```bash
npm install
npm run test:e2e:install
npm run test:e2e
```

Useful commands:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:debug
npm run test:e2e:report
```

## Debug Failing Tests

- Re-run with `npm run test:e2e:debug` for step-by-step debugging.
- Open HTML report with `npm run test:e2e:report`.
- Use trace artifacts in `test-results/artifacts` for failed/retried tests.

## Add New Tests

1. Add or extend a POM under `e2e/pages`.
2. Reuse fixtures from `e2e/fixtures/test.ts` and `e2e/fixtures/auth.ts`.
3. Extend `e2e/utils/api-mock.ts` with any new API endpoints.
4. Add feature specs in `e2e/tests`.

## Conventions

- Prefer semantic selectors: `getByRole`, `getByLabel`, then `getByTestId` only when needed.
- Avoid arbitrary sleeps; use Playwright auto-waiting and explicit expectations.
- Keep tests isolated and parallel-safe.
- Keep test data deterministic.
- Keep mocked responses tenant-safe: every seeded entity is scoped by `orgId` to prevent cross-tenant leakage.
- Retry only in CI (configured in `playwright.config.ts`).

## CI Notes (GitLab)

The config is CI-ready with:

- headless execution
- retries only in CI
- HTML + JUnit reporting
- trace/video/screenshot artifacts on failures

Pipeline config is provided in `apps/web/.gitlab-ci.e2e.yml`.

If your root `.gitlab-ci.yml` is in the monorepo root, include it with:

```yaml
include:
  - local: "apps/web/.gitlab-ci.e2e.yml"
```
