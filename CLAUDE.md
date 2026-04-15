# CLAUDE.md

## Project overview

**Kudos** — a team recognition app used as a vehicle for demonstrating Playwright API and E2E test automation. Authenticated users give kudos to colleagues. The wall shows all kudos newest-first.

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React + Vite + Zustand | `http://localhost:3000` |
| Backend API | Express + routing-controllers + class-validator | `http://localhost:3022` |
| Database | SQLite via Prisma | — |
| Auth | JWT stored in `localStorage` as `accessToken` + `authUser` | — |

## Project-wide standards

- All test selectors live in `tests/helpers/selectors.ts` — never hardcode a `data-testid` string in a spec or POM
- API tests must import `test`, `expect` from `../fixtures` — never from `@playwright/test` directly
- `bobId` fixture resolves dynamically from `GET /auth/users` — never hardcode a database id
- Every test that returns a user object must assert `not.toHaveProperty('password')`
- `waitForTimeout()` is banned in all specs — use `waitFor({ state: 'visible' })`, `waitForURL()`, or `waitForResponse()` instead
- Happy path and key contract tests get `{ tag: '@smoke' }` — edge cases and negatives get no tag
- Count assertions must snapshot before an action and assert after — never assume the seed count is stable

## Hard constraints

- **Never modify the database schema** (`prisma/schema.prisma`) — the schema is fixed for this portfolio project
- **Never modify seed data** (`prisma/seed.ts`) — tests are written against the existing 5 users and 7 seed kudos
- **Never hardcode user IDs** — always resolve dynamically via the `bobId` fixture or `GET /auth/users`
- **Never skip pre-commit hooks** (`--no-verify`) — if a hook fails, fix the underlying issue
- **Never commit `.env` files or credentials** — secrets stay out of git history

## Framework preferences and coding style

### Tests
- One `test.describe` block per feature area
- Multi-action sequences wrapped in `test.step()` for readable CI output
- `beforeEach` only for navigation — no assertions inside it
- Prefer `.filter({ hasText: '...' })` over `.first()` when targeting a specific item in a list
- POM locators are `readonly` properties defined in the constructor only — no assertions inside POM methods
- Modal and dialog locators must be scoped to the modal element
- Use factories from `tests/helpers/factories.ts` for payload construction — never hardcode message strings inline

### Test naming
Pick one of three patterns and apply it consistently within a describe block:
1. `"should [expected behaviour] when [condition]"` — e.g. `"should return 401 when token is missing"`
2. `"[action] [expected result]"` — e.g. `"POST /kudos with no token returns 401"`
3. `"given [context], when [action], then [result]"` — e.g. `"given alice is logged in, when she deletes her kudo, then it disappears from the wall"`

### Tagging
- `{ tag: '@smoke' }` — happy path + key API contract, run on every deploy
- No tag — edge cases, boundary values, negative flows, regression
- `{ tag: '@flaky' }` — tests known to be intermittent; must be investigated, never silently skipped. Run in a separate quarantine job to detect intermittency before it poisons the main suite

### Locator priority (E2E)
1. `getByTestId(selectors.xxx)` — whenever a `data-testid` exists
2. `getByRole('button', { name: '...' })` — for elements without a testid
3. `getByText()` — reading content only, not for interactions
4. CSS selectors, XPath, positional `.nth()` — never

### API (backend)
- Use `@OnUndefined(204)` for void handlers that return 204 — not `@HttpCode(204)`
- Validate request bodies with `class-validator` DTOs
- Auth middleware (`authMiddleware`) must protect every route that requires authentication

### Commits
- Single-line commit messages only
- No `Co-Authored-By: Claude` or any AI attribution in commit messages

## Reference docs

Detailed references live in `prompts/references/` — load only the files relevant to the current task:

| Reference | Load when |
|-----------|-----------|
| `references/app-overview.md` | stack, tech, ports |
| `references/auth.md` | auth flows, protected routes |
| `references/api-contracts.md` | API tests, endpoint shapes |
| `references/frontend-behaviour.md` | E2E tests, UI state |
| `references/seed-data.md` | users, passwords, seed count |
| `references/project-structure.md` | file layout, Playwright projects |
| `references/pom-reference.md` | selectors, POMs, imports |
| `references/conventions.md` | waits, assertions, tagging |
| `references/coverage-checklist.md` | coverage checklist, patterns |
