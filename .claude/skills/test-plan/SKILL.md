---
name: test-plan
description: Generates a complete test plan for a new feature before any code is written — API tests, E2E tests, POM requirements, new selectors, risk areas, and estimated test count. Use when starting to test a new feature.
argument-hint: <feature description>
---

Read the file at `prompts/project-context.md` first. That is the source of truth for this project's conventions, existing page objects, API contracts, and seed data.

The feature to plan is: $ARGUMENTS

Also read the existing specs in `tests/e2e/` and `tests/api/` to understand patterns already in use and avoid duplicating existing coverage.

Structure your output exactly as follows:

---

## Test Plan: $ARGUMENTS

### Feature summary
In 2–3 sentences, describe what the feature does. Call out any assumptions you are making.

### What already exists (don't duplicate)
List any existing tests that partially cover this feature. Reference file and test name.

### New Page Object needed?
State yes or no. If yes, name the class (`XxxPage.ts`), list the locators it needs and the methods it should expose. If no, state which existing POM covers it.

### New selectors needed?
List any new `data-testid` values the dev team needs to add to the frontend. Reference which component they go in.

---

### API tests — `tests/api/<resource>.api.spec.ts`

**Happy path**
- [ ] scenario — what to assert (status + response shape)

**Auth guard**
- [ ] no token → expected status
- [ ] invalid token → expected status

**Validation**
- [ ] each invalid input → expected status and why

**Boundary values**
- [ ] min valid → 200
- [ ] min-1 → 400
- [ ] max valid → 200
- [ ] max+1 → 400

**Security**
- [ ] spoofing scenarios
- [ ] no password fields in any response

**Edge cases**
- [ ] domain-specific edge cases

---

### E2E tests — `tests/e2e/<feature>.e2e.spec.ts`

**Page load / UI state**
- [ ] visible elements on initial render

**Happy path** `{ tag: '@smoke' }`
- [ ] full user journey — actions and expected UI state

**Unauthenticated access**
- [ ] visiting the route without a session → redirects to `/`

**Validation / error states**
- [ ] each client-side validation error
- [ ] each server-side error shown in UI

**UI behaviour**
- [ ] modal/drawer opens and closes correctly
- [ ] empty state renders
- [ ] loading state if applicable

---

### Fixtures or helpers needed
List any new fixtures or helper functions needed in `tests/fixtures.ts` or `tests/helpers/`.

### Risk areas
Anything that could make tests flaky — async state, race conditions, external dependencies, seed data requirements.

### Estimated test count
API: X tests
E2E: X tests
Total: X tests

---

Be specific. Use actual field names, endpoints, validation rules, and seed users from the project context. No generic placeholders.
