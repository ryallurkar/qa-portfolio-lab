---
name: new-feature
description: Takes a feature description and generates everything needed to test it — test plan, API spec, E2E spec, and POM if required. All output respects project conventions and passes the quality bar. Use when starting to test a new feature.
argument-hint: <feature description>
---

Read these files before generating anything:
1. `prompts/references/app-overview.md` — stack and tech
2. `prompts/references/api-contracts.md` — existing endpoints and shapes
3. `prompts/references/auth.md` — auth patterns and test structure
4. `prompts/references/frontend-behaviour.md` — UI state and component behaviour
5. `prompts/references/seed-data.md` — available users and baseline data
6. `prompts/references/project-structure.md` — where files go, Playwright projects
7. `prompts/references/pom-reference.md` — existing POMs, selector rules, import patterns
8. `prompts/references/conventions.md` — waits, assertions, tagging, locator priority, POM rules
9. `prompts/references/coverage-checklist.md` — coverage checklist and reusable patterns
10. All existing specs in `tests/e2e/` and `tests/api/` — to match patterns and avoid duplicating coverage

The feature to implement tests for is: $ARGUMENTS

---

Work through the following steps in order. Complete every step — do not stop after the plan.

---

## Step 1 — Analyse

Before writing anything, state:
- What this feature does (2 sentences max)
- Which existing tests already cover any part of it (file + test name)
- Which API endpoints are involved
- Whether a new POM is needed (yes/no + reason)

---

## Step 2 — Write the API spec

Create `tests/api/<resource>.api.spec.ts`.

Requirements:
- Import `test`, `expect` from `../fixtures`
- Import `API_BASE_URL`, `authHeaders`, `getAuthToken` from `../helpers/api`
- Import `kudoPayload`, `SEED_USERS`, `uniqueMessage` from `../helpers/factories` as needed
- One `test.describe` block for the feature
- Use `bobId` fixture (never hardcode a DB id)
- Use `kudoPayload(bobId)` for POST /kudos request bodies — never hardcode message strings inline
- Use `SEED_USERS.bob` when signing in as bob — never hardcode credentials inline
- Cover every row in this checklist:

| Scenario | Tag |
|----------|-----|
| Happy path — valid request, assert status + full response shape including `authorId`, `receiverId`, null safety on `author`/`receiver` | `@smoke` |
| No token → 401 + `body.toHaveProperty("message")` | none |
| Invalid token → 401 + `body.toHaveProperty("message")` | none |
| Each required field missing → 400 + `body.toHaveProperty("message")` | none |
| Whitespace-only string fields → 400 + `body.toHaveProperty("message")` | none |
| Message too short (min-1 chars) → 400 + `body.toHaveProperty("message")` | none |
| Message at min valid length → 200 + assert body shape | none |
| Message too long (max+1 chars) → 400 + `body.toHaveProperty("message")` | none |
| Message at max valid length → 200 + assert body shape | none |
| Invalid receiverId types (float, string, 0, negative) → 400 + `body.toHaveProperty("message")` | none |
| Non-existent receiverId → 404 + `body.toHaveProperty("message")` | none |
| Author cannot be spoofed via body field → assert authorId equals token user | none |
| No `password` field on any user object in response | none |
| SQL injection in string fields — stored as literal text, not executed | none |
| Emoji and non-ASCII characters in string fields — preserved round-trip | none |
| POST response fields match GET response for the same resource | none |
| Two sequential POSTs appear newest-first in GET feed | none |

Security assertion pattern for collections:
```ts
for (const item of body) {
  expect(item.author).not.toHaveProperty('password');
  expect(item.receiver).not.toHaveProperty('password');
}
```

Response shape assertion pattern (include in happy path step):
```ts
expect(typeof body.authorId).toBe("number");
expect(typeof body.receiverId).toBe("number");
expect(body.author).not.toBeNull();
expect(body.receiver).not.toBeNull();
```

---

## Step 3 — Write the E2E spec

Create `tests/e2e/<feature>.e2e.spec.ts`.

Requirements:
- Import `test`, `expect` from `@playwright/test`
- Import POMs from `../pages/`
- Import `selectors` from `../helpers/selectors`
- Never inline locators in the spec — all interactions go through POM methods
- Never call `waitForTimeout()`
- Prefer `.filter({ hasText: '...' })` over `.first()` when targeting a specific list item
- Cover every row in this checklist:

| Scenario | Tag |
|----------|-----|
| Correct elements visible on initial render | none |
| Happy path — full user journey, assert URL + visible UI state | `@smoke` |
| Unauthenticated access — redirects to `/` | none |
| Client-side validation — empty message shows error before API call | none |
| Server-side error displayed in UI | none |
| Modal/drawer opens and closes correctly | none |
| Empty state renders when no data | none |
| New item appears at correct position after submit | none |
| Count updates correctly after action | none |

Unauthenticated test pattern (required — do not omit):
```ts
test.describe('Unauthenticated access', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('visiting the route without session redirects to login', async ({ page }) => {
    await page.goto('/kudos');
    await expect(page).toHaveURL('/');
  });
});
```

Count assertion pattern:
```ts
await kudosWall.kudosItems.first().waitFor({ state: 'visible' });
const before = await kudosWall.kudosItems.count();
// ... perform action ...
await expect(kudosWall.kudosItems).toHaveCount(before + 1);
```

Seed via API before E2E assertion pattern:
```ts
await test.step('seed a known kudo via API', async () => {
  const token = await getAuthToken();
  await request.post(`${API_BASE_URL}/kudos`, {
    headers: authHeaders(token),
    data: { message: 'Known message', receiverId: bob.id },
  });
});
```

Wrap every logical group of 3+ actions in `test.step()`.

---

## Step 4 — Write the POM (if needed)

If Step 1 determined a new POM is needed, create `tests/pages/<FeatureName>Page.ts`.

Requirements:
- Class name matches filename: `export class FeatureNamePage`
- Constructor takes `page: Page`
- All locators are `readonly` properties using `selectors.xxx` — never hardcode a testid string
- Modal/dialog locators scoped to the modal element
- Methods perform actions only — no assertions inside methods
- `goto()` method navigates to the feature route
- Maximum 8 locators — split the class if more are needed

Template:
```ts
import { Page } from '@playwright/test';
import { selectors } from '../helpers/selectors';

export class FeatureNamePage {
  readonly heading;
  readonly createBtn;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Feature Name' });
    this.createBtn = page.getByTestId(selectors.createFeatureBtn);
  }

  async goto() {
    await this.page.goto('/feature-route');
  }
}
```

---

## Step 5 — List new selectors needed

List every new `data-testid` value the dev team must add to the frontend.
Format:

| Selector key | Value | Component |
|-------------|-------|-----------|
| `selectors.featureInput` | `feature-input` | `FeatureForm.tsx` |

If no new selectors are needed, state that explicitly.

---

## Step 6 — Self-review

Before finishing, check every generated file against `prompts/references/conventions.md` and `prompts/references/coverage-checklist.md`.
For each convention category, state: ✅ passes or ❌ fails (and fix it before outputting).

Do not output files that fail any rule.

---

## Output format

Do not output files as chat text. Write each file to disk using the Write tool:
- API spec → `tests/api/<resource>.api.spec.ts`
- E2E spec → `tests/e2e/<feature>.e2e.spec.ts`
- POM (if needed) → `tests/pages/<FeatureName>Page.ts`

After writing all files, output a short summary in chat:

### Files written
- `tests/api/<resource>.api.spec.ts` (X tests)
- `tests/e2e/<feature>.e2e.spec.ts` (X tests)
- `tests/pages/<FeatureName>Page.ts` (if created)

### Dev team action required
List the `data-testid` values from Step 5 that must be added before the E2E tests can run.

### Estimated test count
API: X tests
E2E: X tests
Total: X tests
