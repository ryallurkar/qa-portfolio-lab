import { test as base } from "@playwright/test";
import { getAuthToken, authHeaders, API_BASE_URL } from "./helpers/api";

/**
 * Extended test fixtures shared across API specs.
 *
 * authToken  — reads the cached token from .auth/user.json once per worker.
 *              No sign-in call is made; the token is reused from global setup.
 *
 * bobId      — resolves bob's user id from the /auth/users endpoint.
 *              Avoids hardcoding a database id that could change between seed runs.
 */
type AppFixtures = {
  authToken: string;
  bobId: number;
};

export const test = base.extend<AppFixtures>({
  authToken: async ({}, use) => {
    const token = await getAuthToken();
    await use(token);
  },

  bobId: async ({ request, authToken }, use) => {
    const response = await request.get(`${API_BASE_URL}/auth/users`, {
      headers: authHeaders(authToken),
    });
    const users: Array<{ id: number; username: string }> = await response.json();
    const bob = users.find((u) => u.username === "bob");
    if (!bob) throw new Error("seed user 'bob' not found — has the database been seeded?");
    await use(bob.id);
  },
});

export { expect } from "@playwright/test";
