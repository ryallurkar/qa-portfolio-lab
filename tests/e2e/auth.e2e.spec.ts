import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

// These tests run unauthenticated — override the project storageState so the
// cached alice session is not injected before each test.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login page", () => {
  test("login page loads with form visible", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.container).toBeVisible();
    await expect(loginPage.form).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitBtn).toBeVisible();
  });

  test("valid credentials redirect to /kudos", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await test.step("submit valid credentials", async () => {
      await loginPage.login("alice", "Qk$Dev#Seed9!");
    });

    await test.step("assert redirect to kudos wall", async () => {
      await expect(page).toHaveURL("/kudos");
    });
  });

  test("wrong password shows error message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await test.step("submit wrong password", async () => {
      await loginPage.login("alice", "wrongpassword");
    });

    await test.step("assert error is displayed and URL stays at /", async () => {
      await expect(loginPage.errorMessage).toBeVisible();
      await expect(loginPage.errorMessage).toContainText("Invalid");
      await expect(page).toHaveURL("/");
    });
  });

  test("empty form submit keeps user on login page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submitBtn.click();

    await expect(page).toHaveURL("/");
  });
});
