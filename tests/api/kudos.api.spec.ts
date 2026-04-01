import { test, expect } from "../fixtures";
import { API_BASE_URL, authHeaders } from "../helpers/api";

const KUDOS_URL = `${API_BASE_URL}/kudos`;

test.describe("POST /kudos", () => {
  test("valid payload returns 200 with full kudos shape",
    { tag: "@smoke" },
    async ({ request, authToken, bobId }) => {
      let response: Awaited<ReturnType<typeof request.post>>;

      await test.step("post valid kudo", async () => {
        response = await request.post(KUDOS_URL, {
          headers: authHeaders(authToken),
          data: { message: "Great work on the release!", receiverId: bobId },
        });
      });

      await test.step("assert 200 and top-level shape", async () => {
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(typeof body.id).toBe("number");
        expect(typeof body.message).toBe("string");
        expect(typeof body.createdAt).toBe("string");
        expect(body).toHaveProperty("author");
        expect(body).toHaveProperty("receiver");
      });

      await test.step("assert author and receiver have id and username", async () => {
        const body = await response.json();
        expect(typeof body.author.id).toBe("number");
        expect(typeof body.author.username).toBe("string");
        expect(typeof body.receiver.id).toBe("number");
        expect(typeof body.receiver.username).toBe("string");
      });
    }
  );

  test("authorId in body is ignored — author always comes from token",
    async ({ request, authToken, bobId }) => {
      let response: Awaited<ReturnType<typeof request.post>>;

      await test.step("post kudo with a spoofed authorId", async () => {
        response = await request.post(KUDOS_URL, {
          headers: authHeaders(authToken),
          data: { message: "Trying to spoof author", receiverId: bobId, authorId: 9999 },
        });
      });

      await test.step("assert author is alice not 9999", async () => {
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.author.username).toBe("alice");
      });
    }
  );

  test("author and receiver do not expose the password field",
    async ({ request, authToken, bobId }) => {
      let response: Awaited<ReturnType<typeof request.post>>;

      await test.step("create a kudo", async () => {
        response = await request.post(KUDOS_URL, {
          headers: authHeaders(authToken),
          data: { message: "Checking for password leaks", receiverId: bobId },
        });
      });

      await test.step("assert no password on author or receiver", async () => {
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.author).not.toHaveProperty("password");
        expect(body.receiver).not.toHaveProperty("password");
      });
    }
  );

  // Auth guard
  test("no token returns 401", async ({ request, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      data: { message: "No auth", receiverId: bobId },
    });
    expect(response.status()).toBe(401);
  });

  // Message validation
  test("missing message returns 400", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { receiverId: bobId },
    });
    expect(response.status()).toBe(400);
  });

  test("message shorter than 3 chars returns 400", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "ab", receiverId: bobId },
    });
    expect(response.status()).toBe(400);
  });

  test("message at exactly 3 chars returns 200 (lower boundary)", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "abc", receiverId: bobId },
    });
    expect(response.status()).toBe(200);
  });

  test("message at exactly 500 chars returns 200 (upper boundary)", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "a".repeat(500), receiverId: bobId },
    });
    expect(response.status()).toBe(200);
  });

  test("message longer than 500 chars returns 400", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "a".repeat(501), receiverId: bobId },
    });
    expect(response.status()).toBe(400);
  });

  // receiverId validation
  test("missing receiverId returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "No receiver" },
    });
    expect(response.status()).toBe(400);
  });

  test("string receiverId returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "String receiver", receiverId: "bob" },
    });
    expect(response.status()).toBe(400);
  });

  test("receiverId of 0 returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Zero receiver", receiverId: 0 },
    });
    expect(response.status()).toBe(400);
  });

  test("negative receiverId returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Negative receiver", receiverId: -1 },
    });
    expect(response.status()).toBe(400);
  });

  test("float receiverId returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Float receiver", receiverId: 1.5 },
    });
    expect(response.status()).toBe(400);
  });

  test("non-existent receiverId returns 404", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Ghost receiver", receiverId: 99999 },
    });
    expect(response.status()).toBe(404);
  });

  // Sanitization
  test("script tag in message is stripped, surrounding text preserved",
    async ({ request, authToken, bobId }) => {
      let response: Awaited<ReturnType<typeof request.post>>;

      await test.step("post message with embedded script tag", async () => {
        response = await request.post(KUDOS_URL, {
          headers: authHeaders(authToken),
          data: { message: "Hello <script>alert(1)</script> World", receiverId: bobId },
        });
      });

      await test.step("assert script stripped and text preserved", async () => {
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.message).not.toContain("<script>");
        expect(body.message).toContain("Hello");
        expect(body.message).toContain("World");
      });
    }
  );
});

test.describe("GET /kudos", () => {
  test("returns an array",
    { tag: "@smoke" },
    async ({ request }) => {
      const response = await request.get(KUDOS_URL);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    }
  );

  test("each item has id, message, createdAt, author, and receiver", async ({ request }) => {
    const response = await request.get(KUDOS_URL);
    const body = await response.json();
    expect(body.length).toBeGreaterThan(0);
    for (const kudo of body) {
      expect(typeof kudo.id).toBe("number");
      expect(typeof kudo.message).toBe("string");
      expect(typeof kudo.createdAt).toBe("string");
      expect(typeof kudo.author.id).toBe("number");
      expect(typeof kudo.author.username).toBe("string");
      expect(typeof kudo.receiver.id).toBe("number");
      expect(typeof kudo.receiver.username).toBe("string");
    }
  });

  test("author and receiver do not expose password field", async ({ request }) => {
    const response = await request.get(KUDOS_URL);
    const body = await response.json();
    for (const kudo of body) {
      expect(kudo.author).not.toHaveProperty("password");
      expect(kudo.receiver).not.toHaveProperty("password");
    }
  });

  test("results are returned newest first", async ({ request }) => {
    const response = await request.get(KUDOS_URL);
    const body: Array<{ createdAt: string }> = await response.json();
    if (body.length < 2) return;
    for (let i = 0; i < body.length - 1; i++) {
      const current = new Date(body[i].createdAt).getTime();
      const next = new Date(body[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});
