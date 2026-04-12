# Coverage Checklist & Patterns

## Every new feature needs tests covering

1. **Happy path** — authenticated user, valid data, assert UI + API response shape
2. **Unauthenticated access** — E2E redirect to `/`, API returns `401`
3. **Validation** — empty, whitespace-only, too short, too long, wrong type
4. **Boundary values** — min valid, max valid, min-1 invalid, max+1 invalid
5. **Security** — author cannot be spoofed, no password fields in responses
6. **UI state** — modal closes, error displays and clears, empty state renders
7. **Data integrity** — new item appears in correct position, count updates correctly

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

**Unauthenticated E2E redirect:**
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

**Target a specific list item by text (avoid .first() in parallel-safe tests):**
```ts
const item = wall.kudosItems.filter({ hasText: 'Known message' });
await item.waitFor({ state: 'visible' });
```
