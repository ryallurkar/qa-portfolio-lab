import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { KudosWallPage } from "../pages/KudosWallPage";

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
      await loginPage.login("alice", "Qk$Dev#Seed9!");

      await expect(loginPage.errorMessage).toBeVisible();
      await expect(page).toHaveURL("/");
    });

    test("sign-in API network timeout shows error message", async ({ page }) => {
      await page.route(`${API}/auth/sign-in`, (route) => route.abort("timedout"));

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login("alice", "Qk$Dev#Seed9!");

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

      await expect(page.getByTestId("kudos-create-error")).toBeVisible();
      // Modal should stay open so the user can retry
      await expect(wall.modal).toBeVisible();
    });
  });
});
