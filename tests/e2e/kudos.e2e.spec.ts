import { test, expect } from "@playwright/test";
import { KudosWallPage } from "../pages/KudosWallPage";
import { API_BASE_URL, getAuthToken, authHeaders } from "../helpers/api";

const USERS_URL = `${API_BASE_URL}/auth/users`;
const KUDOS_URL = `${API_BASE_URL}/kudos`;

test.describe("Kudos wall", () => {
  let wall: KudosWallPage;

  test.beforeEach(async ({ page }) => {
    wall = new KudosWallPage(page);
    await wall.goto();
  });

  test("wall loads with heading and Give Kudos button visible", async () => {
    await expect(wall.heading).toBeVisible();
    await expect(wall.createBtn).toBeVisible();
  });

  test("wall shows existing kudos from seed data", async () => {
    await expect(wall.kudosItems.first()).toBeVisible();
    const count = await wall.kudosItems.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test("each kudo item shows author and receiver usernames", async ({ request }) => {
    const token = await getAuthToken();

    const usersRes = await request.get(USERS_URL, { headers: authHeaders(token) });
    const users: Array<{ id: number; username: string }> = await usersRes.json();
    const bob = users.find((u) => u.username === "bob")!;

    await test.step("create a known kudo via API", async () => {
      await request.post(KUDOS_URL, {
        headers: authHeaders(token),
        data: { message: "E2E author-receiver check", receiverId: bob.id },
      });
    });

    await test.step("reload and assert the kudo is displayed with alice → bob", async () => {
      await wall.goto();
      const firstItem = wall.kudosItems.first();
      await expect(firstItem).toContainText("alice");
      await expect(firstItem).toContainText("bob");
    });
  });

  test("clicking Give Kudos opens the modal", async () => {
    await wall.openModal();
    await expect(wall.modal).toBeVisible();
  });

  test("receiver dropdown excludes the logged-in user (alice)", async () => {
    await wall.openModal();
    const options = await wall.receiverSelect.locator("option").allTextContents();
    expect(options).not.toContain("alice");
    expect(options.length).toBeGreaterThan(0);
  });

  test("submitting valid kudos adds the kudo to the top of the wall", { tag: "@smoke" }, async () => {
    // Wait for the feed to finish loading before snapshotting the count
    await wall.kudosItems.first().waitFor({ state: "visible" });
    const initialCount = await wall.kudosItems.count();

    await test.step("open modal and submit a kudo to bob", async () => {
      await wall.openModal();
      await wall.messageInput.fill("Fantastic work this sprint!");
      await wall.receiverSelect.selectOption({ label: "bob" });
      await wall.submitBtn.click();
    });

    await test.step("assert new item appears at the top with correct content", async () => {
      await expect(wall.kudosItems).toHaveCount(initialCount + 1);
      const firstItem = wall.kudosItems.first();
      await expect(firstItem).toContainText("Fantastic work this sprint!");
      await expect(firstItem).toContainText("alice");
      await expect(firstItem).toContainText("bob");
    });
  });

  test("modal closes after successful submission", async () => {
    await test.step("open modal and submit", async () => {
      await wall.openModal();
      await wall.messageInput.fill("Great job on the deploy!");
      await wall.receiverSelect.selectOption({ label: "bob" });
      await wall.submitBtn.click();
    });

    await test.step("assert modal is no longer visible", async () => {
      await expect(wall.modal).not.toBeVisible();
    });
  });

  test("cancel button closes the modal without submitting", async ({ page }) => {
    await wall.openModal();
    await wall.messageInput.fill("This should not be submitted");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(wall.modal).not.toBeVisible();
  });

  test("clicking the backdrop closes the modal", async ({ page }) => {
    await wall.openModal();
    // Click the backdrop (the fixed overlay behind the modal panel)
    await page.mouse.click(10, 10);
    await expect(wall.modal).not.toBeVisible();
  });

  test("sign out navigates back to login", async ({ page }) => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("Unauthenticated access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("visiting /kudos without a session redirects to login", async ({ page }) => {
    await page.goto("/kudos");
    await expect(page).toHaveURL("/");
  });
});
