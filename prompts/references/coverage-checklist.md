# Coverage Checklist & Patterns

## Coverage tiers by business risk

Not all code requires the same coverage depth. Prioritise by risk:

| Tier | Examples | Coverage target |
|------|----------|----------------|
| **Critical** | Auth flows, ownership checks, token validation | 95% — every error path tested |
| **API contracts** | All endpoints, request/response shapes | 85% — all status codes + body shapes |
| **UI flows** | E2E happy path, error states, empty states | Key journeys only |
| **Utilities** | Helpers, formatters | Test where logic is non-trivial |

Apply this when deciding which gaps to fill first — auth and ownership gaps are always blocking.

## Every new feature needs tests covering

1. **Happy path** — authenticated user, valid data, assert UI + API response shape including `authorId`, `receiverId`, and null safety on nested objects
2. **Unauthenticated access** — E2E redirect to `/`, API returns `401` (both no token and invalid token)
3. **Validation** — empty, whitespace-only, too short, too long, wrong type — assert status + `body.toHaveProperty("message")` on every error
4. **Boundary values** — min valid, max valid, min-1 invalid, max+1 invalid — assert body shape on 200s not just status
5. **Security** — author cannot be spoofed, no password fields in responses, SQL injection stored as literal text
6. **Encoding** — emoji, accented characters, non-ASCII round-trip correctly
7. **UI state** — modal closes, error displays and clears, empty state renders, network error path (500) leaves UI stable
8. **Data integrity** — new item appears at correct position, count updates, POST response fields match GET response for same resource
9. **Ordering** — two sequential writes appear newest-first in the feed

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

**Use factories for payload construction (import from `tests/helpers/factories.ts`):**
```ts
import { kudoPayload, SEED_USERS } from "../helpers/factories";

// generates unique message automatically
data: kudoPayload(bobId)

// override specific fields
data: kudoPayload(bobId, { message: "Known text for assertion" })

// sign in as a seed user without hardcoding credentials
data: SEED_USERS.bob
```

**SQL injection — assert stored as literal text:**
```ts
const sqlPayload = "'; DROP TABLE kudos; --";
const response = await request.post(KUDOS_URL, {
  headers: authHeaders(authToken),
  data: { message: sqlPayload, receiverId: bobId },
});
expect(response.status()).toBe(200);
const body = await response.json();
expect(body.message).toBe(sqlPayload);
```

**Encoding — emoji and non-ASCII round-trip:**
```ts
const response = await request.post(KUDOS_URL, {
  headers: authHeaders(authToken),
  data: { message: "Great work 🎉", receiverId: bobId },
});
expect(response.status()).toBe(200);
expect((await response.json()).message).toBe("Great work 🎉");
```

**Cross-endpoint integration — POST fields match GET for same resource:**
```ts
const postBody = await (await request.post(KUDOS_URL, { ... })).json();
const feed = await (await request.get(KUDOS_URL)).json();
const fromFeed = feed.find((k) => k.id === postBody.id);
expect(fromFeed.message).toBe(postBody.message);
expect(fromFeed.authorId).toBe(postBody.authorId);
expect(fromFeed.receiverId).toBe(postBody.receiverId);
```

**Ordering — two sequential POSTs appear newest-first:**
```ts
const firstId = (await postKudo("First")).id;
const secondId = (await postKudo("Second")).id;
const feed = await getKudos();
expect(feed.findIndex(k => k.id === secondId)).toBeLessThan(
  feed.findIndex(k => k.id === firstId)
);
```

**Response shape — assert top-level scalar IDs and null safety:**
```ts
expect(typeof body.authorId).toBe("number");
expect(typeof body.receiverId).toBe("number");
expect(body.author).not.toBeNull();
expect(body.receiver).not.toBeNull();
```
