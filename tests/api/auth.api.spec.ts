import { test, expect } from "@playwright/test";
import { API_BASE_URL, getAuthToken, authHeaders } from "../helpers/api";

const SIGN_IN_URL = `${API_BASE_URL}/auth/sign-in`;
const ME_URL = `${API_BASE_URL}/auth/me`;
const USERS_URL = `${API_BASE_URL}/auth/users`;

test.describe("POST /auth/sign-in", () => {
  test("valid credentials return 200 and an accessToken string", async ({ request }) => {
    let response: Awaited<ReturnType<typeof request.post>>;

    await test.step("send valid credentials", async () => {
      response = await request.post(SIGN_IN_URL, {
        data: { username: "alice", password: "Qk$Dev#Seed9!" },
      });
    });

    await test.step("assert 200 and token shape", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(typeof body.accessToken).toBe("string");
      expect(body.accessToken.length).toBeGreaterThan(0);
    });

    await test.step("assert token is a valid JWT (three dot-separated parts)", async () => {
      const body = await response.json();
      const parts = body.accessToken.split(".");
      expect(parts).toHaveLength(3);
    });
  });

  test("wrong password returns 403", async ({ request }) => {
    const response = await request.post(SIGN_IN_URL, {
      data: { username: "alice", password: "wrongpassword" },
    });
    expect(response.status()).toBe(403);
  });

  test("unknown username returns 403", async ({ request }) => {
    const response = await request.post(SIGN_IN_URL, {
      data: { username: "nobody", password: "Qk$Dev#Seed9!" },
    });
    expect(response.status()).toBe(403);
  });

  test("missing username returns 400", async ({ request }) => {
    const response = await request.post(SIGN_IN_URL, {
      data: { password: "Qk$Dev#Seed9!" },
    });
    expect(response.status()).toBe(400);
  });

  test("missing password returns 400", async ({ request }) => {
    const response = await request.post(SIGN_IN_URL, {
      data: { username: "alice" },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("GET /auth/me", () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test("valid token returns 200 with id and username, no password field", async ({ request }) => {
    let response: Awaited<ReturnType<typeof request.get>>;

    await test.step("send request with valid token", async () => {
      response = await request.get(ME_URL, { headers: authHeaders(token) });
    });

    await test.step("assert shape and no password leak", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(typeof body.id).toBe("number");
      expect(typeof body.username).toBe("string");
      expect(body).not.toHaveProperty("password");
    });
  });

  test("no token returns 401", async ({ request }) => {
    const response = await request.get(ME_URL);
    expect(response.status()).toBe(401);
  });
});

test.describe("GET /auth/users", () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test("no token returns 401", async ({ request }) => {
    const response = await request.get(USERS_URL);
    expect(response.status()).toBe(401);
  });

  test("returns an array of users with id and username, no password", async ({ request }) => {
    let response: Awaited<ReturnType<typeof request.get>>;

    await test.step("fetch users list", async () => {
      response = await request.get(USERS_URL, { headers: authHeaders(token) });
    });

    await test.step("assert shape and no password leak on any user", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      for (const user of body) {
        expect(typeof user.id).toBe("number");
        expect(typeof user.username).toBe("string");
        expect(user).not.toHaveProperty("password");
      }
    });
  });

  test("all five seed users are present", async ({ request }) => {
    const response = await request.get(USERS_URL, { headers: authHeaders(token) });
    const body: Array<{ username: string }> = await response.json();
    const usernames = body.map((u) => u.username);
    for (const name of ["alice", "bob", "carol", "dave", "eve"]) {
      expect(usernames).toContain(name);
    }
  });
});
