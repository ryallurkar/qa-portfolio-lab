---
name: new-feature
description: Takes a feature description and generates everything needed to test it — test plan, API spec, E2E spec, and POM if required. All output respects project conventions and passes the quality bar. Use when starting to test a new feature.
argument-hint: <feature description>
---

Read these three files before generating anything:
1. `prompts/project-context.md` — app architecture, API contracts, POMs, seed data, selectors, coding conventions.
2. `prompts/test-review.md` — the 10 rules and coverage checklist every spec must satisfy.
3. All existing specs in `tests/e2e/` and `tests/api/` — to match patterns already in use and avoid duplicating coverage.

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
- One `test.describe` block for the feature
- Use `bobId` fixture (never hardcode a DB id)
- Cover every row in this checklist:

| Scenario | Tag |
|----------|-----|
| Happy path — valid request, assert status + full response shape | `@smoke` |
| No token → 401 | none |
| Invalid token → 401 | none |
| Each required field missing → 400 | none |
| Whitespace-only string fields → 400 | none |
| Message too short (min-1 chars) → 400 | none |
| Message at min valid length → 201/200 | none |
| Message too long (max+1 chars) → 400 | none |
| Message at max valid length → 201/200 | none |
| Invalid receiverId types (float, string, 0, negative) → 400 | none |
| Non-existent receiverId → 404 | none |
| Author cannot be spoofed via body field → assert authorId equals token user | none |
| No `password` field on any user object in response | none |

Security assertion pattern for collections:
```ts
for (const item of body) {
  expect(item.author).not.toHaveProperty('password');
  expect(item.receiver).not.toHaveProperty('password');
}
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
  // ... other locators

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

Before finishing, check every generated file against `prompts/test-review.md`.
For each of the 10 rules, state: ✅ passes or ❌ fails (and fix it before outputting).

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
