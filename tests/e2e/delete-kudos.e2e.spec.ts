import { test, expect } from "@playwright/test";
import { KudosWallPage } from "../pages/KudosWallPage";
import { API_BASE_URL, getAuthToken, authHeaders } from "../helpers/api";

const KUDOS_URL = `${API_BASE_URL}/kudos`;
const USERS_URL = `${API_BASE_URL}/auth/users`;
const SIGN_IN_URL = `${API_BASE_URL}/auth/sign-in`;

test.describe("Delete kudos", () => {
  let wall: KudosWallPage;

  test.beforeEach(async ({ page }) => {
    wall = new KudosWallPage(page);
    await wall.goto();
  });

  test("delete button is visible on a kudo authored by the logged-in user", async ({ request }) => {
    const token = await getAuthToken();
    const usersRes = await request.get(USERS_URL, { headers: authHeaders(token) });
    const users: Array<{ id: number; username: string }> = await usersRes.json();
    const bob = users.find((u) => u.username === "bob")!;

    await test.step("seed a known kudo as alice via API", async () => {
      await request.post(KUDOS_URL, {
        headers: authHeaders(token),
        data: { message: "Alice's kudo — delete button should be visible", receiverId: bob.id },
      });
    });

    await test.step("reload wall and assert delete button is visible on alice's kudo", async () => {
      await wall.goto();
      const firstItem = wall.kudosItems.first();
      await expect(firstItem).toContainText("alice");
      await expect(wall.getDeleteBtnFor(firstItem)).toBeVisible();
    });
  });

  test("delete button is not visible on kudos authored by another user", async ({ request }) => {
    const aliceToken = await getAuthToken();

    await test.step("resolve user ids and seed a kudo as bob via API", async () => {
      const usersRes = await request.get(USERS_URL, { headers: authHeaders(aliceToken) });
      const users: Array<{ id: number; username: string }> = await usersRes.json();
      const alice = users.find((u) => u.username === "alice")!;

      const signInRes = await request.post(SIGN_IN_URL, {
        data: { username: "bob", password: "Qk$Dev#Seed9!" },
      });
      const { accessToken: bobToken } = await signInRes.json();

      await request.post(KUDOS_URL, {
        headers: authHeaders(bobToken),
        data: { message: "Bob's kudo — no delete button for alice", receiverId: alice.id },
      });
    });

    await test.step("reload wall and assert delete button is absent on bob's kudo", async () => {
      await wall.goto();
      const firstItem = wall.kudosItems.first();
      await expect(firstItem).toContainText("bob");
      await expect(wall.getDeleteBtnFor(firstItem)).not.toBeVisible();
    });
  });

  test(
    "owner deletes their own kudo — card disappears and count decrements",
    { tag: "@smoke" },
    async ({ request }) => {
      const token = await getAuthToken();
      const usersRes = await request.get(USERS_URL, { headers: authHeaders(token) });
      const users: Array<{ id: number; username: string }> = await usersRes.json();
      const bob = users.find((u) => u.username === "bob")!;

      await test.step("seed a known kudo via API and reload wall", async () => {
        await request.post(KUDOS_URL, {
          headers: authHeaders(token),
          data: { message: "Kudo to be deleted from wall", receiverId: bob.id },
        });
        await wall.goto();
      });

      let before: number;

      await test.step("snapshot count and click delete on alice's kudo", async () => {
        await wall.kudosItems.first().waitFor({ state: "visible" });
        before = await wall.kudosItems.count();
        await wall.getDeleteBtnFor(wall.kudosItems.first()).click();
      });

      await test.step("assert count decremented and deleted card is gone", async () => {
        await expect(wall.kudosItems).toHaveCount(before - 1);
        await expect(wall.kudosItems.first()).not.toContainText("Kudo to be deleted from wall");
      });
    }
  );
});

test.describe("Delete kudos — unauthenticated access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("visiting /kudos without a session redirects to login", async ({ page }) => {
    await page.goto("/kudos");
    await expect(page).toHaveURL("/");
  });
});
