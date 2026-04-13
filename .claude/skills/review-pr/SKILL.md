---
name: review-pr
description: Reviews a pull request for test quality, convention compliance, coverage completeness, and correctness. Fetches the PR diff via gh CLI and produces a structured review with a clear approve / request-changes recommendation. Use when reviewing a PR before merge.
argument-hint: <PR number or URL>
---

Read these files before reviewing anything:
1. `prompts/references/conventions.md` — waits, assertions, tagging, locator priority, POM rules
2. `prompts/references/pom-reference.md` — existing POMs, selector rules, import patterns
3. `prompts/references/api-contracts.md` — endpoint shapes and expected status codes
4. `prompts/references/auth.md` — auth patterns, unauthenticated test structure
5. `prompts/references/coverage-checklist.md` — coverage checklist and reusable patterns
6. `prompts/references/seed-data.md` — seed users and baseline kudo count

Then fetch the PR:

```bash
gh pr view $ARGUMENTS --json number,title,body,author,baseRefName,headRefName,files
gh pr diff $ARGUMENTS
```

If `$ARGUMENTS` is empty, run `gh pr list` and ask the user which PR to review.

---

Produce the following review. Be direct and specific — reference file names and line numbers from the diff throughout.

---

## PR Review: #`<number>` — `<title>`

**Author:** `<author>`  
**Branch:** `<head>` → `<base>`

---

### 1. PR Description

- Does the description explain **why** the change is being made (not just what)?
- Is there a test plan or reproduction steps for bug fixes?
- Flag if the description is missing or too vague.

---

### 2. Changed Files

List every changed file and categorise it:

| File | Type | Summary of change |
|------|------|-------------------|
| `tests/api/...` | API spec | ... |
| `tests/e2e/...` | E2E spec | ... |
| `tests/pages/...` | POM | ... |
| `src/...` | App code | ... |

---

### 3. Spec Quality (per changed spec file)

For each `*.spec.ts` in the diff, check every item below and report ✅ / ❌:

**Imports**
- API specs import `test`, `expect` from `../fixtures` (not `@playwright/test`)
- E2E specs import `test`, `expect` from `@playwright/test`
- Selectors imported from `../helpers/selectors` — no hardcoded testid strings

**Waits**
- No `waitForTimeout()` — banned
- Element waits use `waitFor({ state: 'visible' })`
- Navigation waits use `waitForURL()`
- API-driven state changes use `waitForResponse()`

**Assertions**
- API tests assert status code AND response body shape in same test
- E2E tests assert URL change AND visible UI state after action
- Any test returning user objects asserts `not.toHaveProperty('password')`
- Count assertions snapshot before action and assert after — never assume seed count

**Locators**
- `getByTestId(selectors.xxx)` used wherever a `data-testid` exists
- `.first()` only used with an explanatory comment — otherwise `.filter({ hasText: '...' })`
- No CSS selectors, XPath, or positional `.nth()` without documented reason

**Structure**
- One `test.describe` per feature area
- Multi-action sequences wrapped in `test.step()`
- `beforeEach` used only for navigation — no assertions inside it

**Tagging**
- Happy path + key API contract tests tagged `{ tag: '@smoke' }`
- Edge cases, negatives, boundary values have no tag

**Auth**
- Unauthenticated E2E tests use `test.use({ storageState: { cookies: [], origins: [] } })`
- No manual sign-in inside tests unless the test is specifically testing the login flow

**POM usage**
- All interactions go through POM methods — no inlined locators in specs
- POM methods contain no assertions

For each ❌, provide:
- **Where:** file path and line in diff
- **Why:** why it violates the convention
- **Fix:** corrected code snippet

---

### 4. Coverage Assessment

Based on the feature being added or changed, check which scenarios from the coverage checklist are present and which are missing:

| Scenario | Present | Notes |
|----------|---------|-------|
| Happy path (API) | ✅/❌ | |
| Happy path (E2E) | ✅/❌ | |
| Unauthenticated → 401/redirect | ✅/❌ | |
| Invalid token → 401 | ✅/❌ | |
| Missing required fields → 400 | ✅/❌ | |
| Boundary values (min/max) | ✅/❌ | |
| Forbidden (wrong user) → 403 | ✅/❌ | |
| Non-existent resource → 404 | ✅/❌ | |
| Password not exposed in response | ✅/❌ | |
| UI empty state | ✅/❌ | |
| UI count updates after action | ✅/❌ | |
| Client-side validation error shown | ✅/❌ | |

---

### 5. App Code Review (non-test files)

For any `src/` changes:

- Do new/changed endpoints match the shapes in `prompts/references/api-contracts.md`?
- Are HTTP status codes correct (`@OnUndefined(204)` for void returns, not `@HttpCode(204)`)?
- Does the auth middleware protect every new route that requires authentication?
- Are there any obvious security issues (missing auth check, missing ownership check, unvalidated input passed to the database)?

---

### 6. Verdict

**APPROVE** / **REQUEST CHANGES** / **COMMENT**

Summarise in 2–3 sentences: what the PR does well, and what must be fixed before merge (if anything).

If requesting changes, list the blocking issues as a numbered checklist so the author knows exactly what to address:

1. [ ] ...
2. [ ] ...

---

Be direct and specific. Do not be vague. If something is correct, say so. If something is wrong, show the fix.
