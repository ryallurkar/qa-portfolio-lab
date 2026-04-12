# Auth — How It Actually Works

## Frontend (Zustand store `src/store/index.ts`)

- On load, auth state is rehydrated from `localStorage.getItem('accessToken')` and `localStorage.getItem('authUser')`
- `setAuth(token, user)` writes both to localStorage and Zustand
- `clearAuth()` removes both — used by Sign out button
- `/kudos` page guards itself: `if (!token) navigate('/')` — redirect is client-side, not a server 401

## Backend (`src/api/middleware/auth.middleware.ts`)

- Expects `Authorization: Bearer <token>` header
- Verifies with `jwt.verify(token, ACCESS_TOKEN_SECRET)`
- Returns `401` if header is missing, malformed, or token is invalid/expired
- Attaches `{ id, username }` to `req.user` on success — `authorId` in the request body is always ignored

## E2E Auth Setup (`tests/global-setup.ts`)

- Signs in as `alice`, calls `GET /auth/me` to get the user object
- Writes `{ accessToken, authUser }` to `.auth/user.json` as Playwright localStorage state
- The `chromium` project injects this state before every E2E test — alice is always logged in
- **Both** values must be in the state file — missing `authUser` causes the receiver dropdown to silently fail (the filter `data.filter(u => u.id !== currentUser?.id)` returns nothing if `currentUser` is null)

## Test patterns

**Unauthenticated E2E test (required for any auth-gated route):**
```ts
test.describe('Unauthenticated access', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('visiting /feature without session redirects to login', async ({ page }) => {
    await page.goto('/feature');
    await expect(page).toHaveURL('/');
  });
});
```

**Never sign in manually inside an E2E test** unless the test is specifically testing the login flow.
