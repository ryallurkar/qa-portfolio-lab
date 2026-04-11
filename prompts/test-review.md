# Test Review Quality Bar

This file defines the quality criteria for every spec in this project.
Load it alongside `prompts/project-context.md` before reviewing any test file.

---

## Pass / Fail Criteria

A spec **fails review** if it violates any rule below. Every violation must be
reported with the file path, line number, the rule it breaks, and a corrected
code snippet.

---

## Rule 1 — Imports

**E2E specs** must import from `@playwright/test`:
```ts
import { test, expect } from '@playwright/test';
```

**API specs** must import from `../fixtures` (never from `@playwright/test` directly):
```ts
import { test, expect } from '../fixtures';
```

**POMs and helpers** must be imported by path, not re-exported through a barrel index.

**Violation:** any `import { test } from '@playwright/test'` inside `tests/api/`.

---

## Rule 2 — Selectors

All `data-testid` strings must come from `tests/helpers/selectors.ts`.
Never hardcode a testid string in a spec or POM.

```ts
// ✅
page.getByTestId(selectors.createKudosBtn)

// ❌ — hardcoded string
page.getByTestId('create-kudos-btn')
```

**Violation:** any literal string passed to `getByTestId()` that is not a `selectors.*` reference.

---

## Rule 3 — Waits

`waitForTimeout()` is banned. It is never the correct fix.

Use instead:
- `locator.waitFor({ state: 'visible' })` — element visibility
- `page.waitForURL()` — navigation
- `page.waitForResponse()` — API-driven state changes

**Violation:** any call to `waitForTimeout` anywhere in a spec or POM.

---

## Rule 4 — Auth — Unauthenticated E2E Tests

When testing unauthenticated access in E2E, override the injected storage state.
Never sign in manually (or not sign in by omission) — the `chromium` project always
injects alice's session unless you explicitly clear it.

```ts
// ✅
test.describe('Unauthenticated access', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('visiting /kudos without session redirects to login', async ({ page }) => {
    await page.goto('/kudos');
    await expect(page).toHaveURL('/');
  });
});

// ❌ — no storageState override; alice's session is still injected
test('unauthenticated visit redirects', async ({ page }) => { ... });
```

**Violation:** any unauthenticated E2E test that does not set `test.use({ storageState: { cookies: [], origins: [] } })`.

---

## Rule 5 — Assertions: Behaviour, Not Just Status

**API tests:** every test must assert both the HTTP status code AND the response body shape.
A test that only checks `expect(response.status()).toBe(200)` is incomplete.

**E2E tests:** every test must assert both a URL change (where navigation happens) AND
a visible UI element change. A test that only performs actions and checks nothing is incomplete.

```ts
// ✅ API test
expect(response.status()).toBe(201);
const body = await response.json();
expect(body).toHaveProperty('id');
expect(body.message).toBe('Great work!');
expect(body.author).not.toHaveProperty('password');

// ❌ — status only, no body assertion
expect(response.status()).toBe(201);
```

**Violation:** API test with no body assertion; E2E test with no `expect()` on a locator or URL.

---

## Rule 6 — Security Assertions

Any endpoint that returns a user object (directly or nested) must assert that no `password`
field is present, on every user object in the response.

```ts
// Single object
expect(body).not.toHaveProperty('password');

// Nested
expect(body.author).not.toHaveProperty('password');
expect(body.receiver).not.toHaveProperty('password');

// Collection
for (const item of body) {
  expect(item.author).not.toHaveProperty('password');
  expect(item.receiver).not.toHaveProperty('password');
}
```

**Violation:** any test for `GET /auth/me`, `GET /auth/users`, `POST /kudos`, or `GET /kudos`
that does not assert `not.toHaveProperty('password')` on every returned user object.

---

## Rule 7 — Smoke Tag

Happy path tests must be tagged `{ tag: '@smoke' }`.
Edge cases, boundary values, and negative flows must NOT be tagged.

```ts
// ✅
test('happy path — submit valid kudos', { tag: '@smoke' }, async ({ page }) => { ... });

// ❌ — missing tag on happy path
test('happy path — submit valid kudos', async ({ page }) => { ... });
```

**Violation:** happy path test without `{ tag: '@smoke' }`; OR any non-happy-path test that
carries `{ tag: '@smoke' }`.

---

## Rule 8 — POM Usage

Locators in specs must come from POMs. Never inline a locator in a spec.

```ts
// ✅ — locator from POM
await kudosWall.createBtn.click();

// ❌ — locator inlined in spec
await page.getByTestId(selectors.createKudosBtn).click();
```

POM rules:
- Locators are `readonly` properties initialised in the constructor only.
- Methods perform actions — no assertions inside POM methods.
- Modal/dialog locators must be scoped to the modal element.

**Violation:** `page.getByTestId()`, `page.locator()`, or `page.getByRole()` called directly
in a spec file instead of delegating to a POM method.

---

## Rule 9 — Count Assertions

When asserting that a count changes, snapshot the count before the action and assert after.
Never hardcode a number that assumes a fixed seed state.

```ts
// ✅
const before = await kudosWall.kudosItems.count();
// ... perform action ...
await expect(kudosWall.kudosItems).toHaveCount(before + 1);

// ❌ — hardcoded count
await expect(kudosWall.kudosItems).toHaveCount(8);
```

**Violation:** any `toHaveCount(N)` where N is a literal not derived from a `before` snapshot.

---

## Rule 10 — `test.step()` for Multi-Action Tests

Any test with more than 3 sequential actions must wrap logical groups in `test.step()`.
This is not optional for E2E happy paths — it makes CI failure output readable.

```ts
// ✅
test('submit kudos', { tag: '@smoke' }, async ({ page }) => {
  await test.step('open modal', async () => {
    await kudosWall.goto();
    await kudosWall.openModal();
  });

  await test.step('fill and submit form', async () => {
    await kudosWall.messageInput.fill('Great work!');
    await kudosWall.submitBtn.click();
  });

  await test.step('verify kudo appears at top', async () => {
    await expect(kudosWall.kudosItems.first()).toContainText('Great work!');
  });
});
```

**Violation:** E2E happy path with more than 3 sequential actions and no `test.step()`.

---

## Coverage Checklist

Every feature spec must cover these scenarios before it passes review:

| # | Scenario | Required |
|---|----------|----------|
| 1 | Happy path — authenticated user, valid data | Yes |
| 2 | Unauthenticated E2E — redirects to `/` | Yes |
| 3 | API auth guard — no token → 401, invalid token → 401 | Yes |
| 4 | Validation — empty, whitespace-only, too short, too long, wrong type | Yes |
| 5 | Boundary values — min valid, min-1, max valid, max+1 | Yes |
| 6 | Security — no `password` field on any user object | Yes |
| 7 | UI state — modal closes, error shown, empty state renders | Yes |
| 8 | Data integrity — new item appears in correct position, count updates | Yes |

A spec that covers fewer than scenarios 1, 2, 3, and 6 is **not shippable**.
Scenarios 4, 5, 7, and 8 are required for a feature to be considered fully covered.

---

## Severity Levels

| Level | Label | Meaning |
|-------|-------|---------|
| 🔴 | Must fix | Violates a rule above — spec cannot merge |
| 🟡 | Should fix | Not a rule violation, but weakens the suite |
| 🟢 | Nice to have | Minor improvement, optional |

Examples of 🟡 (should fix):
- Assertion could be more specific (`toContainText` vs `toHaveText`)
- Missing boundary value for a field that has one
- Missing `test.step()` on a moderately long test (3–4 actions)
- Test name does not describe the expected outcome

Examples of 🟢 (nice to have):
- Adding a helper comment explaining why a specific wait strategy is used
- Grouping related tests into a nested `test.describe`

---

## What Good Looks Like

A spec passes review when:

1. All imports are correct for the test type.
2. No hardcoded testid strings — all from `selectors`.
3. No `waitForTimeout` calls.
4. Unauthenticated E2E tests use `test.use({ storageState: ... })`.
5. Every test asserts behaviour (body shape, URL, visible element) not just an HTTP status.
6. Every user object in every response is checked for no `password` field.
7. Happy path tests carry `{ tag: '@smoke' }`.
8. Locators come from POMs, not inlined in specs.
9. Count assertions snapshot before and compare after.
10. Multi-action tests use `test.step()` for readability.
11. Coverage checklist rows 1–6 are all present.
