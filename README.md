# Kudos App — Playwright Test Automation

[![PR Check](https://github.com/ryallurkar/qa-portfolio-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/ryallurkar/qa-portfolio-lab/actions/workflows/ci.yml)
[![Nightly](https://github.com/ryallurkar/qa-portfolio-lab/actions/workflows/nightly.yml/badge.svg)](https://github.com/ryallurkar/qa-portfolio-lab/actions/workflows/nightly.yml)

A portfolio project built to demonstrate production-level test automation skills using Playwright. The app — a simple kudos board — is the vehicle. The test infrastructure is the point.

---

## What this covers

### API testing
- Full endpoint coverage: auth, kudos CRUD, input validation
- Boundary value testing on message length (3-char lower, 500-char upper) — status + body shape asserted on every boundary
- Negative cases: missing fields, wrong types, whitespace-only strings, non-existent foreign keys
- Security: no `password` field ever leaks in any response (asserted on every user object in every endpoint)
- Auth guard verification: no-token and invalid-token paths tested on every protected endpoint
- Ownership enforcement: non-authors cannot delete someone else's kudo (403)
- SQL injection: stored as literal text, not executed
- Encoding: emoji and non-ASCII characters preserved round-trip
- Cross-endpoint integrity: `POST` response fields match the same resource returned by `GET`
- Ordering: two sequential writes appear newest-first in the feed

### E2E testing (Playwright + Chromium)
- Login flow: valid credentials, wrong password, empty submit, unauthenticated redirect
- Kudos wall: seed data visible, author → receiver display, modal open/close, empty state
- Form interaction: receiver dropdown self-exclusion, optimistic feed update, count assertion
- Delete flow: button visible only to author, card removed, count decrements, 403 guard
- Network failure handling: API 500 on sign-in, feed load, POST, DELETE — all surface stable UI

### Visual regression
- Element-level screenshots of stable UI chrome only — login card, nav bar, modal form
- Full-page screenshot with dynamic feed masked (`mask: [kudosItems]`)
- OS-aware baselines: `-darwin.png` locally, `-linux.png` in CI — both committed to the repo
- Tolerance settings absorb sub-pixel antialiasing differences between macOS and Linux
- Dedicated `visual` Playwright project — completely isolated from the E2E suite

### Test infrastructure
- `globalSetup` seeds the database and caches a signed-in session — E2E tests start authenticated without touching the login flow
- Page Object Models (`LoginPage`, `KudosWallPage`) keep specs readable and resilient to UI change
- All selectors live in `tests/helpers/selectors.ts` — no hardcoded `data-testid` strings anywhere in specs or POMs
- Test data factories (`tests/helpers/factories.ts`): `uniqueMessage()`, `kudoPayload()`, `SEED_USERS` — prevent test pollution in parallel runs, no hardcoded credential strings
- Risk-based coverage tiers: Critical (auth/ownership) 95%, API contracts 85%, UI flows key journeys only

### AI-assisted workflow (Claude Code skills + agents)
- `/new-feature <description>` — generates test plan, API spec, E2E spec, POM, and selector list in one shot
- `/review-spec <file>` — reviews any spec against the 10-rule quality bar: imports, selectors, waits, auth patterns, assertions, POM usage, security, tagging, naming, factories
- `/fill-gaps <feature>` — delegates to the spec-explorer agent to find coverage gaps, then appends missing tests to existing files without rewriting them
- `/review-pr <number>` — reviews a PR's spec quality, coverage, and app code against project conventions
- `spec-explorer` agent (Haiku, read-only) — maps existing tests to features and returns a gap list; used by fill-gaps internally
- Spec quality guard hook — fires on every Write/Edit to a `*.spec.ts` file, catches banned patterns (`waitForTimeout`, hardcoded testids, hardcoded credentials) before they reach a commit

---

## Running tests

Both servers must be running (`npm run dev`).

```bash
npm test                      # full suite
npm run test:api              # API tests only
npm run test:e2e              # E2E tests only
npm run test:smoke            # @smoke tagged tests only
npm run test:visual           # visual regression (macOS baselines)
npm run test:visual:update    # regenerate macOS baselines after UI change
npm run test:visual:linux     # visual regression in Linux container (matches CI)
npm run test:visual:linux:update  # regenerate Linux baselines locally via Docker
```

Global setup runs automatically before the first test: seeds the DB and caches an auth session.

---

## Test breakdown

| Spec | What it covers |
|---|---|
| `auth.api.spec.ts` | Sign-in (valid, wrong password, unknown user, missing fields, JWT format), `/me` (valid token, no token), `/users` (no token, shape, no password leak, all 5 seed users) |
| `kudos.api.spec.ts` | POST happy path (full shape + authorId/receiverId + null safety), auth guards (no token, invalid token), author spoof prevention, no password leak, message validation (missing, whitespace, <3, =3, =500, >500), receiverId validation (missing, string, 0, negative, float, non-existent → 404), SQL injection, emoji/non-ASCII encoding, GET shape + ordering, DELETE (204 owner, 401 no token, 401 invalid token, 403 non-owner, 404 not found, 404 double-delete), cross-endpoint integrity, newest-first ordering |
| `auth.e2e.spec.ts` | Page loads, valid login redirects to `/kudos`, wrong password shows error, empty submit stays on login |
| `kudos.e2e.spec.ts` | Wall loads, seed data visible, author → receiver shown, modal opens, dropdown excludes self, submit prepends kudo, modal closes on success, unauthenticated redirect |
| `delete-kudos.e2e.spec.ts` | Delete button visible on own kudos, absent on others', owner deletes — card gone + count decrements, unauthenticated redirect |
| `network.e2e.spec.ts` | Sign-in 500 shows error, sign-in timeout shows error, feed 500 — wall stays stable, POST 500 — error shown in modal, DELETE 500 — card removed, wall remains stable |
| `visual-regression.visual.spec.ts` | Login card baseline, kudos wall nav bar baseline, full page with feed masked, Give Kudos modal open state |

---

## CI

| Workflow | Trigger | What runs |
|---|---|---|
| `ci.yml` — PR Check | Pull request → `main` | E2E + API tests (parallel), Visual regression (separate job) |
| `nightly.yml` — Nightly | Daily 00:00 UTC + manual | Full suite, 30-day artifact retention |
| `update-snapshots.yml` — Update Visual Snapshots | Manual dispatch | Generates Linux baselines on a given branch, commits back, posts PR comment |
| `run-tests.yml` | Called by ci.yml + nightly.yml | Shared reusable job: install → browser → migrate + seed → start servers → wait-on → run → upload report |
| `visual-regression.yml` | Called by ci.yml | Visual regression job: run tests → post failure comment with direct link → fail job → upload diff artifact |

### Visual regression workflow

On every PR, visual regression runs as a dedicated job isolated from functional tests.

**If it fails:**
1. The bot posts a PR comment explaining why, with a direct link to the Update Visual Snapshots workflow
2. If the UI change is intentional, open the link → Run workflow → enter your branch → run
3. The workflow generates Linux baselines, commits them to your branch, and posts a "✅ updated" comment
4. Re-run the Visual regression job → passes

**Local parity with CI:**
```bash
npm run test:visual:linux         # run in Docker (Linux, matches CI)
npm run test:visual:linux:update  # regenerate Linux baselines locally
```

### Required secret

| Secret | Purpose |
|---|---|
| `ACCESS_TOKEN_SECRET` | JWT signing key — must be a long random string |

---

## Conventions enforced

- `waitForTimeout()` banned — use `waitFor({ state: 'visible' })`, `waitForURL()`, or `waitForResponse()`
- Selectors via `selectors.xxx` only — never hardcode a `data-testid` string
- User IDs resolved dynamically via `bobId` fixture or `GET /auth/users` — never hardcoded
- Every user object in API responses asserted `not.toHaveProperty('password')`
- Count assertions snapshot before action, assert after — never assume seed count is stable
- Happy path and key contract tests tagged `@smoke` — edge cases and negatives untagged — intermittent tests tagged `@flaky`
- POM locators are `readonly`, constructor-only, no assertions inside methods
- Factories for payload construction — `kudoPayload(bobId)`, `uniqueMessage()`, `SEED_USERS.bob`
- Visual regression: screenshot stable chrome only, mask dynamic content, element-level over full-page

---

## Local setup

```bash
git clone https://github.com/ryallurkar/qa-portfolio-lab.git
cd qa-portfolio-lab
npm install
cp .env.example .env        # set ACCESS_TOKEN_SECRET to any long random string
npm run db:deploy
npm run db:seed
npm run dev                  # API on :3022, frontend on :3000
```

No Postgres. No Redis. Just Node and npm.

---

## The app

A minimal kudos board where engineers can recognise each other's work publicly.

**Backend:** Node.js + Express + TypeScript, Prisma ORM, SQLite, JWT auth, `class-validator` DTOs

**Frontend:** React 18, Vite, Tailwind CSS, Zustand, Axios, React Router

**Features:** Give kudos (authenticated), delete your own kudos, public wall sorted newest-first

**Seed users:** `alice`, `bob`, `carol`, `dave`, `eve` — password `!password123` for all
