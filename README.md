# Kudos App — Playwright Test Automation

[![CI](https://github.com/ryallurkar/qa-portfolio-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/ryallurkar/qa-portfolio-lab/actions/workflows/ci.yml)
[![Nightly](https://github.com/ryallurkar/qa-portfolio-lab/actions/workflows/nightly.yml/badge.svg)](https://github.com/ryallurkar/qa-portfolio-lab/actions/workflows/nightly.yml)

**41 tests — 30 API, 11 E2E — all passing.**

A portfolio project built to demonstrate production-level test automation skills using Playwright. The app (a simple kudos board) is the vehicle; the test infrastructure is the point.

---

## What this covers

**API testing**
- Full endpoint coverage: auth, kudos CRUD, input validation, HTML sanitization
- Boundary value testing on message length (3-char lower, 500-char upper)
- Negative cases: wrong credentials, missing fields, invalid types, non-existent foreign keys
- Security assertions: no password field ever leaks in any response
- Auth guard verification on every protected endpoint

**E2E testing (Playwright + Chromium)**
- Login flow: valid credentials, wrong password, empty submit
- Kudos wall: seed data visible on load, author → receiver display, modal open/close
- Form interaction: receiver dropdown self-exclusion, optimistic feed update after submit
- All selectors flow through a single `selectors.ts` — no hardcoded `data-testid` strings in test files

**Test infrastructure**
- `globalSetup` seeds the database and caches a signed-in session before any test runs — E2E tests never touch the login flow to set up state
- Page Object Models (`LoginPage`, `KudosWallPage`) keep specs readable and resilient to UI change
- Reusable GitHub Actions workflow parameterised for both PR checks (E2E only, fast) and nightly runs (full suite, 30-day artifact retention)

---

## Why these tool choices

| Tool | Why |
|---|---|
| **Playwright** | Handles both API and browser tests in one framework — no Jest/Supertest split, one config, one runner |
| **SQLite** | Zero infrastructure — anyone cloning the repo can run the full suite with just `npm install` |
| **Reusable workflow** | One workflow definition, two callers — avoids duplicating job steps across PR and nightly pipelines |
| **Global setup auth cache** | Signs in once, writes to `.auth/user.json` — E2E tests start authenticated without repeating the login flow |

---

## Local setup

```bash
git clone https://github.com/ryallurkar/qa-portfolio-lab.git
cd qa-portfolio-lab
npm install
cp .env.example .env        # fill in ACCESS_TOKEN_SECRET
npm run db:deploy
npm run db:seed
npm run dev                  # API on :3022, frontend on :3000
```

No Docker. No Postgres. Just Node and npm.

---

## Running tests

Both servers must be running before executing tests (`npm run dev`).

```bash
npm test              # full suite — 41 tests
npm run test:api      # API tests only — 30 tests
npm run test:e2e      # E2E tests only — 11 tests
```

Global setup runs automatically: seeds the DB and caches an auth token before the first test.

---

## Test breakdown

| Suite | Coverage |
|---|---|
| `auth.api.spec.ts` | sign-in (valid, wrong password, unknown user, missing username, missing password, JWT format), `/me` (valid token, no token), `/users` (no token, shape + no password, all 5 seed users present) |
| `kudos.api.spec.ts` | happy path (shape, createdAt, author/receiver fields), authorId override ignored, no password leak, auth guard, message validation (missing, <3 chars, =3 chars, =500 chars, >500 chars), receiverId validation (missing, string, 0, negative, float, non-existent → 404), HTML sanitization, GET shape + ordering |
| `auth.e2e.spec.ts` | page loads with form visible, valid login redirects to `/kudos`, wrong password shows error message, empty submit stays on login page |
| `kudos.e2e.spec.ts` | wall loads with heading and button, seed data visible, author → receiver shown on each item, modal opens on button click, dropdown excludes logged-in user, submit prepends kudo to feed, modal closes on success |

---

## CI

| Workflow | Trigger | Tests run | Artifact kept |
|---|---|---|---|
| `ci.yml` | Pull request → `main` | E2E only | 7 days |
| `nightly.yml` | Daily 00:00 UTC + manual dispatch | Full suite | 30 days |

Both call the shared `run-tests.yml` reusable workflow. Steps: install → Playwright browser → migrate + seed → start API → start frontend → wait-on ports → run tests → upload report.

### Required secret

| Secret | Purpose |
|---|---|
| `ACCESS_TOKEN_SECRET` | JWT signing key — must be a long random string |

---

## The app

A minimal kudos board where engineers can recognise each other's work publicly.

**Backend:** Node.js + Express + TypeScript, Prisma ORM, SQLite, JWT auth, `class-validator` DTOs, `sanitize-html`

**Frontend:** React 18, Vite, Tailwind CSS, Zustand, Axios, React Router

**Seed users:** `alice`, `bob`, `carol`, `dave`, `eve` — password `Qk$Dev#Seed9!` for all
