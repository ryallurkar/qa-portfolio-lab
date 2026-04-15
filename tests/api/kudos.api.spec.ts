import { test, expect } from "../fixtures";
import { API_BASE_URL, authHeaders } from "../helpers/api";

const SIGN_IN_URL = `${API_BASE_URL}/auth/sign-in`;

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
        expect(typeof body.authorId).toBe("number");
        expect(typeof body.receiverId).toBe("number");
        expect(body.receiverId).toBe(bobId);
        expect(body).toHaveProperty("author");
        expect(body.author).not.toBeNull();
        expect(body).toHaveProperty("receiver");
        expect(body.receiver).not.toBeNull();
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
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("invalid token returns 401", async ({ request, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: { Authorization: "Bearer thisisnotavalidtoken" },
      data: { message: "Bad token", receiverId: bobId },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  // Message validation
  test("empty request body returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("missing message returns 400", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { receiverId: bobId },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("whitespace-only message returns 400", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "   ", receiverId: bobId },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("message shorter than 3 chars returns 400", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "ab", receiverId: bobId },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("message at exactly 3 chars returns 200 (lower boundary)", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "abc", receiverId: bobId },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.id).toBe("number");
    expect(body.message).toBe("abc");
  });

  test("message at exactly 500 chars returns 200 (upper boundary)", async ({ request, authToken, bobId }) => {
    const longMessage = "a".repeat(500);
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: longMessage, receiverId: bobId },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.id).toBe("number");
    expect(body.message).toBe(longMessage);
  });

  test("message longer than 500 chars returns 400", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "a".repeat(501), receiverId: bobId },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  // receiverId validation
  test("missing receiverId returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "No receiver" },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("string receiverId returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "String receiver", receiverId: "bob" },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("receiverId of 0 returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Zero receiver", receiverId: 0 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("negative receiverId returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Negative receiver", receiverId: -1 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("float receiverId returns 400", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Float receiver", receiverId: 1.5 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  test("non-existent receiverId returns 404", async ({ request, authToken }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Ghost receiver", receiverId: 99999 },
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty("message");
  });

  // Security — injection
  test("SQL injection in message is stored as literal text, not executed", async ({ request, authToken, bobId }) => {
    const sqlPayload = "'; DROP TABLE kudos; --";
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: sqlPayload, receiverId: bobId },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toBe(sqlPayload);
  });

  // Encoding
  test("emoji in message is stored and returned correctly", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Great work 🎉🙌", receiverId: bobId },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("Great work 🎉🙌");
  });

  test("accented and non-ASCII characters in message are preserved", async ({ request, authToken, bobId }) => {
    const response = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Héllo wörld — ñoño", receiverId: bobId },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("Héllo wörld — ñoño");
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
      expect(typeof kudo.authorId).toBe("number");
      expect(typeof kudo.receiverId).toBe("number");
      expect(typeof kudo.author.id).toBe("number");
      expect(typeof kudo.author.username).toBe("string");
      expect(kudo.author).not.toBeNull();
      expect(typeof kudo.receiver.id).toBe("number");
      expect(typeof kudo.receiver.username).toBe("string");
      expect(kudo.receiver).not.toBeNull();
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

test.describe("DELETE /kudos/:id", () => {
  test(
    "owner deletes their own kudo — returns 204 with empty body and kudo is gone from feed",
    { tag: "@smoke" },
    async ({ request, authToken, bobId }) => {
      let kudoId: number;

      await test.step("create a kudo to delete", async () => {
        const res = await request.post(KUDOS_URL, {
          headers: authHeaders(authToken),
          data: { message: "This kudo will be deleted", receiverId: bobId },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        kudoId = body.id;
      });

      await test.step("delete the kudo and assert 204 with empty body", async () => {
        const res = await request.delete(`${KUDOS_URL}/${kudoId}`, {
          headers: authHeaders(authToken),
        });
        expect(res.status()).toBe(204);
        const text = await res.text();
        expect(text).toBe("");
      });

      await test.step("verify kudo no longer appears in GET /kudos", async () => {
        const res = await request.get(KUDOS_URL);
        const body: Array<{ id: number }> = await res.json();
        expect(body.find((k) => k.id === kudoId)).toBeUndefined();
      });
    }
  );

  test("no token returns 401", async ({ request, authToken, bobId }) => {
    const createRes = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Auth guard test kudo", receiverId: bobId },
    });
    const { id } = await createRes.json();

    const res = await request.delete(`${KUDOS_URL}/${id}`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("message");
  });

  test("invalid token returns 401", async ({ request, authToken, bobId }) => {
    const createRes = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Invalid token test kudo", receiverId: bobId },
    });
    const { id } = await createRes.json();

    const res = await request.delete(`${KUDOS_URL}/${id}`, {
      headers: { Authorization: "Bearer thisisnotavalidtoken" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("message");
  });

  test("non-owner deleting another user's kudo returns 403", async ({ request, authToken, bobId }) => {
    let kudoId: number;

    await test.step("create a kudo as alice", async () => {
      const res = await request.post(KUDOS_URL, {
        headers: authHeaders(authToken),
        data: { message: "Alice owns this kudo", receiverId: bobId },
      });
      const body = await res.json();
      kudoId = body.id;
    });

    await test.step("sign in as bob and attempt to delete alice's kudo", async () => {
      const signInRes = await request.post(SIGN_IN_URL, {
        data: { username: "bob", password: "!password123" },
      });
      const { accessToken: bobToken } = await signInRes.json();

      const res = await request.delete(`${KUDOS_URL}/${kudoId}`, {
        headers: authHeaders(bobToken),
      });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body).toHaveProperty("message");
    });
  });

  test("non-existent id returns 404", async ({ request, authToken }) => {
    const res = await request.delete(`${KUDOS_URL}/99999`, {
      headers: authHeaders(authToken),
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty("message");
  });

  test("deleting an already-deleted kudo returns 404", async ({ request, authToken, bobId }) => {
    const createRes = await request.post(KUDOS_URL, {
      headers: authHeaders(authToken),
      data: { message: "Delete me twice", receiverId: bobId },
    });
    const { id } = await createRes.json();

    const firstDelete = await request.delete(`${KUDOS_URL}/${id}`, { headers: authHeaders(authToken) });
    expect(firstDelete.status()).toBe(204);

    const res = await request.delete(`${KUDOS_URL}/${id}`, {
      headers: authHeaders(authToken),
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty("message");
  });

  test("id of 0 returns 404", async ({ request, authToken }) => {
    const res = await request.delete(`${KUDOS_URL}/0`, {
      headers: authHeaders(authToken),
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty("message");
  });

  test("negative id returns 404", async ({ request, authToken }) => {
    const res = await request.delete(`${KUDOS_URL}/-1`, {
      headers: authHeaders(authToken),
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty("message");
  });
});

test.describe("Cross-endpoint integration", () => {
  test("POST response fields match the same kudo returned by GET /kudos", async ({ request, authToken, bobId }) => {
    let postBody: Record<string, unknown>;

    await test.step("create a kudo via POST", async () => {
      const res = await request.post(KUDOS_URL, {
        headers: authHeaders(authToken),
        data: { message: "Integration shape check", receiverId: bobId },
      });
      expect(res.status()).toBe(200);
      postBody = await res.json();
    });

    await test.step("find same kudo in GET /kudos and compare fields", async () => {
      const res = await request.get(KUDOS_URL);
      const feed: Array<Record<string, unknown>> = await res.json();
      const fromFeed = feed.find((k) => k.id === postBody.id);
      expect(fromFeed).toBeDefined();
      expect(fromFeed!.message).toBe(postBody.message);
      expect(fromFeed!.authorId).toBe(postBody.authorId);
      expect(fromFeed!.receiverId).toBe(postBody.receiverId);
      expect(fromFeed!.createdAt).toBe(postBody.createdAt);
    });
  });

  test("two sequential POSTs appear newest-first in GET /kudos", async ({ request, authToken, bobId }) => {
    let firstId: number;
    let secondId: number;

    await test.step("post first kudo", async () => {
      const res = await request.post(KUDOS_URL, {
        headers: authHeaders(authToken),
        data: { message: "First kudo in ordering test", receiverId: bobId },
      });
      expect(res.status()).toBe(200);
      firstId = (await res.json()).id;
    });

    await test.step("post second kudo", async () => {
      const res = await request.post(KUDOS_URL, {
        headers: authHeaders(authToken),
        data: { message: "Second kudo in ordering test", receiverId: bobId },
      });
      expect(res.status()).toBe(200);
      secondId = (await res.json()).id;
    });

    await test.step("assert second kudo appears before first in GET /kudos", async () => {
      const res = await request.get(KUDOS_URL);
      const feed: Array<{ id: number }> = await res.json();
      const firstIdx = feed.findIndex((k) => k.id === firstId);
      const secondIdx = feed.findIndex((k) => k.id === secondId);
      expect(firstIdx).toBeGreaterThan(-1);
      expect(secondIdx).toBeGreaterThan(-1);
      expect(secondIdx).toBeLessThan(firstIdx);
    });
  });
});
