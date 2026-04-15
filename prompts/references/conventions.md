# Coding Conventions

## Structure

- One `test.describe` block per feature area
- Use `test.step()` for multi-action sequences — makes CI failure output readable
- `beforeEach` only for navigation setup — keep it minimal, no assertions inside

## Test naming

Pick one pattern and apply it consistently within a describe block:

1. `"should [expected behaviour] when [condition]"` — `"should return 401 when token is missing"`
2. `"[action] [expected result]"` — `"POST /kudos with no token returns 401"`
3. `"given [context], when [action], then [result]"` — `"given alice is logged in, when she deletes her kudo, then it disappears from the wall"`

## Tagging

- `{ tag: '@smoke' }` — happy path + key API contract per feature, run on every deploy
- No tag — edge cases, boundary values, negative flows, regression
- `{ tag: '@flaky' }` — known intermittent tests; always investigate root cause, never silently skip. Run in a dedicated quarantine job.

## Assertions

- Always assert behaviour, not just status codes
- API tests: assert status + response shape in the same test
- E2E tests: assert URL change + visible UI state after action
- Security: always assert `not.toHaveProperty('password')` on every user object returned
- Count assertions: snapshot count before action, assert after — never assume seed count is stable

## Waits — strict rules

- `waitForTimeout()` is **banned** — causes flakiness and is never the right fix
- Use `waitFor({ state: 'visible' })` for elements
- Use `waitForURL()` for navigation
- Use `waitForResponse()` for API-driven state changes

## Locator priority (E2E)

1. `getByTestId(selectors.xxx)` — use whenever a `data-testid` exists
2. `getByRole('button', { name: '...' })` — for elements without testid
3. `getByText()` — only for reading content, not for interactions
4. CSS selectors, XPath, positional `.nth()` without reason — **never**
5. `.first()` without a reason — **avoid**; prefer `.filter({ hasText: '...' })` for specificity

## POM rules

- Locators are `readonly` properties defined in constructor only
- Methods perform actions — **no assertions inside POM methods**
- Modal/dialog locators must be scoped to the modal element
- If a page needs more than 8 locators, consider splitting the class
