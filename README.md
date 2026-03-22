# Kudos App — Playwright Test Automation Portfolio

A portfolio project demonstrating production-grade test automation with Playwright. The app itself is a simple kudos board; the real showcase is the testing infrastructure built on top of it.

---

## What this repo demonstrates

- **Playwright API tests** — full coverage of REST endpoints (auth, kudos CRUD, validation, sanitization)
- **Playwright E2E tests** — browser-level flows using the Page Object Model pattern
- **Global setup with auth caching** — signs in once before the suite, writes the token to `.auth/user.json`, reused across all E2E tests
- **Page Object Models** — `LoginPage` and `KudosWallPage` encapsulate all selectors and navigation
- **Centralised selectors** — every `data-testid` lives in one `selectors.ts` file; no hardcoded strings in test files
- **Reusable CI workflow** — a single parameterised GitHub Actions workflow called by both the PR check and the nightly run

---

## Prerequisites

- Node.js 20+
- npm 9+

No Docker required. The database is SQLite — it lives in a local file.

---

## Local setup

```bash
git clone <repo-url>
cd qa-portfolio-lab
npm install
cp .env.example .env        # set ACCESS_TOKEN_SECRET to a strong random value
npm run db:deploy           # apply migrations
npm run db:seed             # seed users and sample kudos
npm run dev                 # start API (port 3022) + frontend (port 3000)
```

---

## Running tests

```bash
# All tests (API + E2E)
npm test

# API tests only
npm run test:api

# E2E tests only
npm run test:e2e
```

The global setup step seeds the database and caches an auth token automatically before any test runs.

---

## Test coverage

| Suite | File | Tests |
|---|---|---|
| API — auth | `tests/api/auth.api.spec.ts` | sign-in (valid, wrong password, unknown user, missing fields), /me (valid token, no token) |
| API — kudos | `tests/api/kudos.api.spec.ts` | happy path, authorId override ignored, no password leak, auth guard, message validation (missing/short/boundary/long), receiverId validation (missing/string/zero/negative/float/nonexistent), HTML sanitization, GET shape |
| E2E — auth | `tests/e2e/auth.e2e.spec.ts` | page loads, valid login redirects, wrong password shows error, empty submit stays on page |
| E2E — kudos wall | `tests/e2e/kudos.e2e.spec.ts` | wall loads, seed data visible, author/receiver shown, modal opens, dropdown excludes self, submit adds kudo to feed, modal closes |

---

## Must have / Should have / Nice to have

### Must have
- [x] API tests covering all validation rules and error codes
- [x] E2E tests for login and kudos submission flows
- [x] Global setup with token caching (no repeated sign-ins)
- [x] Page Object Models for all pages
- [x] Centralised `data-testid` selectors
- [x] Idempotent seed (safe to re-run before each suite)
- [x] Reusable GitHub Actions CI workflow

### Should have
- [ ] Visual regression snapshots for the kudos wall
- [ ] Accessibility checks with `axe-playwright`
- [ ] Test tagging (`@smoke`, `@regression`) for selective runs

### Nice to have
- [ ] Allure reporter integration
- [ ] Slack notification on nightly failure
- [ ] Parallel API test sharding

---

## CI setup

Two workflows call the shared `run-tests.yml` reusable workflow:

| Workflow | Trigger | Command | Artifact retention |
|---|---|---|---|
| `ci.yml` | Pull request → `main` | `npm run test:e2e` | 7 days |
| `nightly.yml` | Daily at 00:00 UTC + manual | `npm test` | 30 days |

### Required repository secrets

| Secret | Description |
|---|---|
| `NODE_ENV` | Set to `production` in CI |
| `SERVICE_PORT` | API port (3022) |
| `ACCESS_TOKEN_SECRET` | Long random string for JWT signing |
| `VITE_API_BASE_URL` | Full URL of the API (`http://localhost:3022` in CI) |

---

## The app

A minimal kudos board so engineers can publicly recognise each other's work.

**Stack:** Node.js + Express + TypeScript, Prisma + SQLite, React 18 + Vite + Tailwind CSS, Zustand, Axios, JWT auth.

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/sign-in` | — | Returns a JWT access token |
| GET | `/auth/me` | Required | Returns `{ id, username }` for the token owner |
| GET | `/auth/users` | Required | All users (for the receiver dropdown) |
| GET | `/kudos` | Required | All kudos, newest first, with author and receiver |
| POST | `/kudos` | Required | Create a kudo `{ message, receiverId }` |

**Pages:** `/` (login) and `/kudos` (kudos wall with Give Kudos modal).
