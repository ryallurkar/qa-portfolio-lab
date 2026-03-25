import { test, expect } from "@playwright/test";
import { API_BASE_URL, getAuthToken, authHeaders } from "../helpers/api";

const SIGN_IN_URL = `${API_BASE_URL}/auth/sign-in`;
const USERS_URL = `${API_BASE_URL}/auth/users`;
const KUDOS_URL = `${API_BASE_URL}/kudos`;

test.describe("POST /kudos", () => {
  let token: string;
  let receiverId: number;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken();

    // Resolve bob's id from the users list so tests don't rely on a hardcoded id
    const response = await request.get(USERS_URL, { headers: authHeaders(token) });
    const users: Array<{ id: number; username: string }> = await response.json();
    const bob = users.find((u) => u.username === "bob");
    if (!bob) throw new Error("seed user 'bob' not found");
    receiverId = bob.id;
  });

  // Happy path
  test("valid payload returns 200 with full kudos shape", async ({ request }) => {
    let response: Awaited<ReturnType<typeof request.post>>;

    await test.step("post valid kudo", async () => {
      response = await request.post(KUDOS_URL, {
        headers: authHeaders(token),
        data: { message: "Great work on the release!", receiverId },
      });
    });

    await test.step("assert 200 and shape", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(typeof body.id).toBe("number");
      expect(typeof body.message).toBe("string");
      expect(body).toHaveProperty("author");
      expect(body).toHaveProperty("receiver");
    });
  });

  test("authorId in body is ignored — author always comes from token", async ({ request }) => {
    let response: Awaited<ReturnType<typeof request.post>>;

    await test.step("post kudo with a spoofed authorId", async () => {
      response = await request.post(KUDOS_URL, {
        headers: authHeaders(token),
        data: { message: "Trying to spoof author", receiverId, authorId: 9999 },
      });
    });

    await test.step("assert author is alice not 9999", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.author.username).toBe("alice");
    });
  });

  test("author and receiver do not expose the password field", async ({ request }) => {
    let response: Awaited<ReturnType<typeof request.post>>;

    await test.step("create a kudo", async () => {
      response = await request.post(KUDOS_URL, {
        headers: authHeaders(token),
        data: { message: "Checking for password leaks", receiverId },
      });
    });

    await test.step("assert no password on author or receiver", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.author).not.toHaveProperty("password");
      expect(body.receiver).not.toHaveProperty("password");
    });
  });

  // Auth guard
  test("no token returns 401", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      data: { message: "No auth", receiverId },
    });
    expect(response.status()).toBe(401);
  });

  // Message validation
  test("missing message returns 400", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { receiverId },
    });
    expect(response.status()).toBe(400);
  });

  test("message shorter than 3 chars returns 400", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "ab", receiverId },
    });
    expect(response.status()).toBe(400);
  });

  test("message at exactly 3 chars returns 200 (boundary)", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "abc", receiverId },
    });
    expect(response.status()).toBe(200);
  });

  test("message longer than 500 chars returns 400", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "a".repeat(501), receiverId },
    });
    expect(response.status()).toBe(400);
  });

  // receiverId validation
  test("missing receiverId returns 400", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "No receiver" },
    });
    expect(response.status()).toBe(400);
  });

  test("string receiverId returns 400", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "String receiver", receiverId: "bob" },
    });
    expect(response.status()).toBe(400);
  });

  test("receiverId of 0 returns 400", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "Zero receiver", receiverId: 0 },
    });
    expect(response.status()).toBe(400);
  });

  test("negative receiverId returns 400", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "Negative receiver", receiverId: -1 },
    });
    expect(response.status()).toBe(400);
  });

  test("float receiverId returns 400", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "Float receiver", receiverId: 1.5 },
    });
    expect(response.status()).toBe(400);
  });

  test("non-existent receiverId returns 404", async ({ request }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(token),
      data: { message: "Ghost receiver", receiverId: 99999 },
    });
    expect(response.status()).toBe(404);
  });

  // Sanitization
  test("script tag in message is stripped, surrounding text preserved", async ({ request }) => {
    let response: Awaited<ReturnType<typeof request.post>>;

    await test.step("post message with embedded script tag", async () => {
      response = await request.post(KUDOS_URL, {
        headers: authHeaders(token),
        data: { message: "Hello <script>alert(1)</script> World", receiverId },
      });
    });

    await test.step("assert script stripped and text preserved", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.message).not.toContain("<script>");
      expect(body.message).toContain("Hello");
      expect(body.message).toContain("World");
    });
  });
});

test.describe("GET /kudos", () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test("returns an array", async ({ request }) => {
    const response = await request.get(KUDOS_URL, { headers: authHeaders(token) });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("each item has id, message, author, and receiver", async ({ request }) => {
    const response = await request.get(KUDOS_URL, { headers: authHeaders(token) });
    const body = await response.json();
    expect(body.length).toBeGreaterThan(0);
    for (const kudo of body) {
      expect(kudo).toHaveProperty("id");
      expect(kudo).toHaveProperty("message");
      expect(kudo).toHaveProperty("author");
      expect(kudo).toHaveProperty("receiver");
    }
  });
});
