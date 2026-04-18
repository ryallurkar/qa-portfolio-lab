import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { KudosWallPage } from "../pages/KudosWallPage";
import { getAuthToken, authHeaders } from "../helpers/api";
import { selectors } from "../helpers/selectors";

const API = "http://localhost:3022";

test.describe("Network failure handling", () => {
  test.describe("Login page", () => {
    // These tests start unauthenticated
    test.use({ storageState: { cookies: [], origins: [] } });

    test("sign-in API 500 shows error message", async ({ page }) => {
      await page.route(`${API}/auth/sign-in`, (route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" })
      );

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login("alice", "!password123");

      await expect(loginPage.errorMessage).toBeVisible();
      await expect(page).toHaveURL("/");
    });

    test("sign-in API network timeout shows error message", async ({ page }) => {
      await page.route(`${API}/auth/sign-in`, (route) => route.abort("timedout"));

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login("alice", "!password123");

      await expect(loginPage.errorMessage).toBeVisible();
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("Kudos wall", () => {
    test("kudos feed 500 renders the wall without crashing", async ({ page }) => {
      await page.route(`${API}/kudos`, (route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" })
      );

      const wall = new KudosWallPage(page);
      await wall.goto();

      // The page should still render — heading and Give Kudos button must be present
      await expect(wall.heading).toBeVisible();
      await expect(wall.createBtn).toBeVisible();
    });

    test("kudos POST 500 shows error inside the modal", async ({ page }) => {
      const wall = new KudosWallPage(page);
      await wall.goto();
      await wall.openModal();

      await page.route(`${API}/kudos`, (route) =>
        route.fulfill({ status: 500, body: JSON.stringify({ message: "Server error" }) })
      );

      await wall.messageInput.fill("This should fail");
      await wall.receiverSelect.selectOption({ label: "bob" });
      await wall.submitBtn.click();

      await expect(page.getByTestId(selectors.kudosCreateError)).toBeVisible();
      // Modal should stay open so the user can retry
      await expect(wall.modal).toBeVisible();
    });

    test("kudos DELETE 500 — card is removed and wall stays stable", async ({ page, request }) => {
      // The app calls removeKudo(id) in both the success and catch paths — this is
      // intentional (optimistic removal). On 500 the card disappears and no error is shown.
      // This test documents and guards that behaviour.
      const token = await getAuthToken();
      const usersRes = await request.get(`${API}/auth/users`, { headers: authHeaders(token) });
      const users: Array<{ id: number; username: string }> = await usersRes.json();
      const bob = users.find((u) => u.username === "bob")!;

      await test.step("seed a known kudo via API", async () => {
        await request.post(`${API}/kudos`, {
          headers: authHeaders(token),
          data: { message: "Kudo for delete-500 test", receiverId: bob.id },
        });
      });

      const wall = new KudosWallPage(page);
      await wall.goto();

      await test.step("intercept DELETE and return 500, then click delete", async () => {
        await page.route(`${API}/kudos/**`, (route) => {
          if (route.request().method() === "DELETE") {
            route.fulfill({ status: 500, body: JSON.stringify({ message: "Server error" }) });
          } else {
            route.continue();
          }
        });
        const kudoToDelete = wall.kudosItems.filter({ hasText: "Kudo for delete-500 test" });
        await kudoToDelete.waitFor({ state: "visible" });
        await wall.getDeleteBtnFor(kudoToDelete).click();
      });

      await test.step("card is removed — wall remains stable with no crash", async () => {
        await expect(
          wall.kudosItems.filter({ hasText: "Kudo for delete-500 test" })
        ).toBeHidden();
        // Wall chrome still intact — heading and create button must be present
        await expect(wall.heading).toBeVisible();
        await expect(wall.createBtn).toBeVisible();
      });
    });
  });
});
