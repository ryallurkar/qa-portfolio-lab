# QA Portfolio Lab — Master Test Context

Load this file before generating, reviewing, or extending any test in this project.
Everything here is derived from the actual source code — not assumptions.

---

## What this app is

**Kudos** — a team recognition app. Authenticated users give kudos to colleagues.
A kudos has a message and a receiver. The wall shows all kudos newest-first.

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React + Vite + Zustand | `http://localhost:3000` |
| Backend API | Express + routing-controllers + class-validator | `http://localhost:3022` |
| Database | PostgreSQL via Prisma | — |
| Auth | JWT — stored in `localStorage` as `accessToken` + `authUser` | — |

---

## Auth — how it actually works

**Frontend (Zustand store `src/store/index.ts`):**
- On load, auth state is rehydrated from `localStorage.getItem('accessToken')` and `localStorage.getItem('authUser')`
- `setAuth(token, user)` writes both to localStorage and Zustand
- `clearAuth()` removes both — used by Sign out button
- `/kudos` page guards itself: `if (!token) navigate('/')` — redirect is client-side, not a server 401

**Backend (`src/api/middleware/auth.middleware.ts`):**
- Expects `Authorization: Bearer <token>` header
- Verifies with `jwt.verify(token, ACCESS_TOKEN_SECRET)`
- Returns `401` if header is missing, malformed, or token is invalid/expired
- Attaches `{ id, username }` to `req.user` on success — `authorId` in the request body is always ignored

**E2E auth setup (`tests/global-setup.ts`):**
- Signs in as `alice`, calls `GET /auth/me` to get the user object
- Writes `{ accessToken, authUser }` to `.auth/user.json` as Playwright localStorage state
- The `chromium` project injects this state before every E2E test — alice is always logged in
- **Both** values must be in the state file — missing `authUser` causes the receiver dropdown to silently fail (the filter `data.filter(u => u.id !== currentUser?.id)` returns nothing if `currentUser` is null)

---

## API contracts

### `POST /auth/sign-in`
- No auth required
- Body: `{ username: string, password: string }`
- Returns: `{ accessToken: string }` — JWT, three dot-separated parts
- Errors: `400` missing fields, `403` wrong credentials

### `GET /auth/me`
- Auth required
- Returns: `{ id: number, username: string }` — **no password field**
- Errors: `401` missing/invalid/expired token

### `GET /auth/users`
- Auth required
- Returns: `Array<{ id: number, username: string }>` — **no password field on any item**
- Errors: `401` no token

### `POST /kudos`
- Auth required
- Body: `{ message: string, receiverId: number }`
- Validation (from `CreateKudosDto`):
  - `message`: string, not empty, not whitespace-only, min 3 chars, max 500 chars
  - `receiverId`: integer, min value 1 (floats, strings, 0, negatives all return `400`)
- `authorId` in the body is silently ignored — author always comes from the JWT
- Message is sanitized with `sanitize-html({ allowedTags: [] })` — HTML tags stripped, surrounding text preserved
- Returns: `{ id, message, authorId, receiverId, createdAt, author: { id, username }, receiver: { id, username } }`
- Errors: `400` validation failure, `401` no auth, `404` receiverId does not exist in DB

### `GET /kudos`
- No auth required
- Returns: array of kudos, ordered `createdAt DESC` (newest first)
- Each item: `{ id, message, authorId, receiverId, createdAt, author: { id, username }, receiver: { id, username } }`
- **No password field on author or receiver**

---

## Frontend behaviour — what the tests should reflect

**KudosWallPage (`src/pages/KudosWallPage.tsx`):**
- Fetches `GET /kudos` on mount via `apiClient.get('/kudos')`
- Stores result in Zustand `useKudosStore` — UI reads from store, not directly from API
- New kudos are **prepended** to the store with `prependKudo()` — they appear at the top immediately without a page reload
- Loading state renders "Loading…" text
- Empty state renders "No kudos yet — be the first to give one!"

**KudosModal (`src/components/KudosModal.tsx`):**
- Fetches `GET /auth/users` on mount, filters out current user (`u.id !== currentUser?.id`)
- Receiver dropdown is pre-selected to the first user in the filtered list
- Client-side validation: empty message shows "Message is required." error before API call
- On successful submit: calls `prependKudo(kudo)` then `onClose()` — modal closes, kudo appears at top
- On API error: shows error from `response.data.message` or fallback "Failed to submit kudo. Please try again."
- Backdrop click closes modal (click handler on the overlay div)
- Inner panel has `e.stopPropagation()` — clicking inside does not close

---

## Seed data

Every run starts from a clean seeded state. `npm run db:seed` is called in `global-setup.ts`.

| Username | Password | Notes |
|----------|----------|-------|
| alice | !password123 | Default authenticated user in all tests |
| bob | !password123 | Common receiver — use `bobId` fixture, never hardcode id |
| carol | !password123 | Available |
| dave | !password123 | Available |
| eve | !password123 | Available |

- Seed inserts **7 kudos** — tests asserting count must account for this baseline
- `bobId` fixture resolves dynamically from `GET /auth/users` — never hardcode a DB id

---

## Project file structure

```
tests/
  api/              # API contract tests        → *.api.spec.ts
  e2e/              # Browser E2E tests         → *.e2e.spec.ts
  pages/            # Page Object classes       → FeatureNamePage.ts
  helpers/
    api.ts          # getAuthToken(), authHeaders(), API_BASE_URL
    selectors.ts    # ALL data-testid values — single source of truth
  fixtures.ts       # Extended test fixtures — import test from here for API tests
  global-setup.ts   # Seeds DB + caches alice auth before suite
  generated/        # AI draft specs — review only, not run in CI
```

---

## Playwright projects

| Project | Pattern | Auth state | Run command |
|---------|---------|-----------|-------------|
| `chromium` | `**/*.e2e.spec.ts` | `.auth/user.json` (alice) | `npm run test:e2e` |
| `api` | `**/*.api.spec.ts` | none | `npm run test:api` |
| `generated` | `tests/generated/**/*.spec.ts` | none | `npm run test:generated` |

---

## Page Objects

### `LoginPage` — `tests/pages/LoginPage.ts`

Locators (all via `selectors`):
- `container` — `data-testid="sign-in-page"`
- `form` — `data-testid="login-form"`
- `usernameInput` — `data-testid="username-input"`
- `passwordInput` — `data-testid="password-input"`
- `submitBtn` — `data-testid="login-submit"`
- `errorMessage` — `data-testid="login-error"`

Methods: `goto()` navigates to `/` — `login(username, password)` fills and submits

### `KudosWallPage` — `tests/pages/KudosWallPage.ts`

Locators:
- `heading` — `getByRole('heading', { name: 'Kudos Wall' })`
- `createBtn` — `data-testid="create-kudos-btn"`
- `kudosItems` — `data-testid="kudos-item"` (list — use `.first()`, `.count()`, `.nth()`)
- `modal` — `data-testid="kudos-modal"`
- `messageInput` — scoped to modal: `data-testid="kudos-message-input"`
- `receiverSelect` — scoped to modal: `data-testid="kudos-receiver-select"`
- `submitBtn` — scoped to modal: `data-testid="kudos-submit-btn"`

Modal locators are scoped to `this.modal` — prevents stale element matches when modal is closed.

Methods: `goto()` navigates to `/kudos` — `openModal()` clicks createBtn and waits for modal visible

---

## Selectors

All `data-testid` values live in `tests/helpers/selectors.ts`.
**Never hardcode a testid string in a spec or POM — always import from `selectors`.**

```ts
import { selectors } from '../helpers/selectors';
page.getByTestId(selectors.createKudosBtn);  // ✓
page.getByTestId('create-kudos-btn');         // ✗
```

---

## Imports — what to use where

```ts
// E2E tests
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { KudosWallPage } from '../pages/KudosWallPage';

// API tests — MUST use fixtures, not @playwright/test directly
import { test, expect } from '../fixtures';
import { API_BASE_URL, authHeaders } from '../helpers/api';

// Unauthenticated E2E (override the injected storageState)
test.use({ storageState: { cookies: [], origins: [] } });
```

---

## Coding conventions

### Structure
- One `test.describe` block per feature area
- Use `test.step()` for multi-action sequences — makes CI failure output readable
- `beforeEach` only for navigation setup — keep it minimal, no assertions inside

### Tagging
- `{ tag: '@smoke' }` — happy path + key API contract per feature, run on every deploy
- No tag — edge cases, boundary values, negative flows, regression

### Assertions
- Always assert behaviour, not just status codes
- API tests: assert status + response shape in the same test
- E2E tests: assert URL change + visible UI state after action
- Security: always assert `not.toHaveProperty('password')` on every user object returned
- Count assertions: snapshot count before action, assert after — never assume seed count is stable

### Waits — strict rules
- `waitForTimeout()` is **banned** — causes flakiness and is never the right fix
- Use `waitFor({ state: 'visible' })` for elements
- Use `waitForURL()` for navigation
- Use `waitForResponse()` for API-driven state changes

### Locator priority (E2E)
1. `getByTestId(selectors.xxx)` — use whenever a `data-testid` exists
2. `getByRole('button', { name: '...' })` — for elements without testid
3. `getByText()` — only for reading content, not for interactions
4. CSS selectors, XPath, positional `.nth()` without reason — **never**

### POM rules
- Locators are `readonly` properties defined in constructor only
- Methods perform actions — **no assertions inside POM methods**
- Modal/dialog locators must be scoped to the modal element
- If a page needs more than 8 locators, consider splitting the class

---

## Coverage checklist for any new feature

Every new feature needs tests covering:

1. **Happy path** — authenticated user, valid data, assert UI + API response shape
2. **Unauthenticated access** — E2E redirect to `/`, API returns `401`
3. **Validation** — empty, whitespace-only, too short, too long, wrong type
4. **Boundary values** — min valid, max valid, min-1 invalid, max+1 invalid
5. **Security** — author cannot be spoofed, no password fields in responses
6. **UI state** — modal closes, error displays and clears, empty state renders
7. **Data integrity** — new item appears in correct position, count updates correctly

---

## Reusable patterns

**Seed data via API before an E2E assertion:**
```ts
await test.step('seed a known kudo via API', async () => {
  const token = await getAuthToken();
  await request.post(`${API_BASE_URL}/kudos`, {
    headers: authHeaders(token),
    data: { message: 'Known message', receiverId: bob.id },
  });
});
```

**Test unauthenticated E2E redirect:**
```ts
test.describe('Unauthenticated access', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('visiting /feature without session redirects to login', async ({ page }) => {
    await page.goto('/feature');
    await expect(page).toHaveURL('/');
  });
});
```

**Assert password never leaks in a collection:**
```ts
for (const item of body) {
  expect(item.author).not.toHaveProperty('password');
  expect(item.receiver).not.toHaveProperty('password');
}
```

**Count-based assertion pattern:**
```ts
await kudosWall.kudosItems.first().waitFor({ state: 'visible' });
const before = await kudosWall.kudosItems.count();
// ... perform action ...
await expect(kudosWall.kudosItems).toHaveCount(before + 1);
```
