import { test, expect } from "@playwright/test";
import { KudosWallPage } from "../pages/KudosWallPage";
import { LoginPage } from "../pages/LoginPage";
import { selectors } from "../helpers/selectors";

/**
 * Tolerance settings chosen to survive OS font-rendering differences between
 * macOS (local) and Linux (CI). The kudos wall has no timestamps — all visible
 * content comes from stable seed data — so only sub-pixel antialiasing and
 * compositing can differ across environments.
 *
 * threshold:          per-pixel colour delta tolerance (0–1; 0.2 = ~20% per channel)
 * maxDiffPixelRatio:  maximum fraction of pixels allowed to differ (5%)
 * animations:         "disabled" freezes CSS transitions so they don't mid-frame
 */
const SCREENSHOT_OPTIONS = {
  threshold: 0.2,
  maxDiffPixelRatio: 0.05,
  animations: "disabled" as const,
};

test.describe("Visual regression — Login page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page matches baseline", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.container.waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot("login-page.png", SCREENSHOT_OPTIONS);
  });
});

test.describe("Visual regression — Kudos wall", () => {
  let wall: KudosWallPage;

  test.beforeEach(async ({ page }) => {
    wall = new KudosWallPage(page);
    await wall.goto();
    await wall.kudosItems.first().waitFor({ state: "visible" }); // any item — we just need the feed to finish loading
  });

  test("kudos wall matches baseline", async ({ page }) => {
    await expect(page).toHaveScreenshot("kudos-wall.png", SCREENSHOT_OPTIONS);
  });

  test("Give Kudos modal open state matches baseline", async ({ page }) => {
    await test.step("open the modal and wait for user list to load", async () => {
      await wall.createBtn.click();
      await page.getByTestId(selectors.kudosModal).waitFor({ state: "visible" });
      // Wait for the receiver select to be populated (fetches /auth/users)
      await page
        .getByTestId(selectors.kudosReceiverSelect)
        .waitFor({ state: "visible" });
    });
    await expect(page).toHaveScreenshot("kudos-modal.png", SCREENSHOT_OPTIONS);
  });
});
