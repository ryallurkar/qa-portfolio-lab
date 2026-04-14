---
name: fill-gaps
description: Finds missing test coverage for any feature and writes the missing tests into the existing spec files. Delegates coverage discovery to the spec-explorer agent, then appends only the missing tests — never creates new files unless none exist yet. Use when coverage gaps have been identified and need to be filled.
argument-hint: <feature name, e.g. "delete kudos" or "create kudos">
---

Read these files before writing anything:
1. `prompts/references/conventions.md` — waits, assertions, tagging, locator priority, POM rules
2. `prompts/references/api-contracts.md` — endpoint shapes and status codes
3. `prompts/references/auth.md` — auth patterns, unauthenticated test structure
4. `prompts/references/seed-data.md` — available users and baseline data
5. `prompts/references/pom-reference.md` — existing POMs, selector rules, import patterns
6. `prompts/references/coverage-checklist.md` — coverage checklist and reusable patterns

The feature to fill gaps for is: $ARGUMENTS

---

## Step 1 — Discover gaps

Use the spec-explorer agent to get the current coverage and gap list for `$ARGUMENTS`.

If the conversation already contains a spec-explorer output for `$ARGUMENTS`, use that — do not re-run the agent.

---

## Step 2 — Read existing spec files

Read every spec file the spec-explorer identified as relevant. Understand:
- The exact import statements at the top
- The `test.describe` block names and nesting structure
- How `test.step()` is used in existing tests
- How fixtures (`bobId`, `aliceToken`, etc.) are referenced
- The pattern used for API seeding before E2E assertions

You must match these patterns exactly in every test you write.

---

## Step 3 — Write missing tests

For each gap from Step 1, write the missing test and append it to the correct existing file.

Rules:
- **Append to existing files — never rewrite them**
- Add missing tests inside the correct existing `test.describe` block
- If a gap requires a new `test.describe` (e.g. a network-error group that does not exist yet), append it after the last existing describe block
- Follow the same import style as the file — do not add new imports unless strictly necessary; if new imports are needed, add them at the top
- Never use `waitForTimeout()`
- Never hardcode a `data-testid` string — use `selectors.xxx`
- Never hardcode a database id — use `bobId` fixture or `GET /auth/users`
- Prefer `.filter({ hasText: '...' })` over `.first()`
- Wrap multi-action sequences in `test.step()`
- Tag happy path / key contract tests `{ tag: '@smoke' }` — everything else gets no tag
- Count assertions must snapshot before action and assert after

Network-intercept pattern for E2E error path tests (use `network.e2e.spec.ts` as the reference):
```ts
await page.route('**/kudos/*', route => route.fulfill({ status: 500 }));
```

Unauthenticated E2E pattern:
```ts
test.describe('Unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('...', async ({ page }) => { ... });
});
```

---

## Step 4 — Self-review

Before finishing, check every test you wrote against `prompts/references/conventions.md`:

For each convention category state ✅ passes or ❌ fails — fix any failure before outputting.

Checklist:
- [ ] Imports match the existing file's pattern
- [ ] No `waitForTimeout()`
- [ ] No hardcoded testid strings
- [ ] No hardcoded database ids
- [ ] Assertions check behaviour, not just status codes
- [ ] User objects assert `not.toHaveProperty('password')` where applicable
- [ ] Count assertions snapshot before and after
- [ ] Tags correct (@smoke on happy path only)
- [ ] Multi-action sequences in `test.step()`

---

## Output format

Write each updated file to disk using the Edit tool (append — do not rewrite).

After writing, output a short summary:

### Tests added for `$ARGUMENTS`

| File | Tests added |
|------|-------------|
| `tests/api/...` | X new tests |
| `tests/e2e/...` | X new tests |

### Gaps filled
List each gap that now has a test.

### Gaps skipped
List any gap you did not fill and why (e.g. requires a UI element that does not exist yet, requires frontend behaviour not documented).
