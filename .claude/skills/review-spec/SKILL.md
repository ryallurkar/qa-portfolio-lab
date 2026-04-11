Read the file at `prompts/project-context.md` first. That is the source of truth for all conventions in this project.

Then read the spec file the user has specified (or if no file is specified, ask which file to review).

Review the spec against every rule in the project context. Structure your output exactly as follows:

---

## Spec Review: `<filename>`

### ✅ What's correct
List what the spec does well — correct imports, good use of POMs, proper fixtures, test.step usage, etc. Be specific, reference line numbers.

### ❌ Issues (must fix)
List anything that violates the project conventions. For each issue:
- **What:** describe the problem clearly
- **Where:** file and line number
- **Why:** explain why it's wrong (flakiness, wrong import, missing assertion, etc.)
- **Fix:** show the corrected code snippet

Categories to check:
- Imports: E2E must use `@playwright/test`, API tests must use `../fixtures`
- Selectors: no hardcoded testid strings — must use `selectors.xxx`
- Waits: any `waitForTimeout()` is a violation
- Auth: E2E tests that test auth-gated pages must use `test.use({ storageState: ... })` override if unauthenticated, or rely on injected state if authenticated — never sign in manually inside the test unless testing the login flow
- Assertions: every test must assert behaviour not just HTTP status — check for missing body assertions in API tests, missing URL or visible state assertions in E2E tests
- POM usage: locators must come from POMs or fixtures, never inlined in specs
- Security: any test that returns user objects must assert `not.toHaveProperty('password')`
- Tags: happy path tests should have `{ tag: '@smoke' }`

### ⚠️ Suggestions (should consider)
List improvements that aren't violations but would make the suite stronger:
- Missing negative flows
- Missing boundary value tests
- Missing unauthenticated access test
- Assertions that could be more specific
- Steps that could be wrapped in `test.step()` for readability

### 📊 Coverage summary
List the scenarios this spec covers and what it is still missing based on the coverage checklist in the project context (happy path, unauthenticated, validation, boundary values, security, UI state, data integrity).

---

Be direct and specific. Do not be vague. If something is correct, say so. If something is wrong, show the fix.
