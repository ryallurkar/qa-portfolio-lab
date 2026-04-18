import { test, expect } from "@playwright/test";
import { KudosWallPage } from "../pages/KudosWallPage";
import { LoginPage } from "../pages/LoginPage";
import { selectors } from "../helpers/selectors";

/**
 * Visual regression tests target stable UI chrome — not dynamic content.
 *
 * Rule: never screenshot a live data feed. Instead:
 *  - Screenshot individual stable elements (locator.toHaveScreenshot)
 *  - Mask dynamic content when a full-page shot is unavoidable
 *
 * threshold:          per-pixel colour delta tolerance (0.2 = ~20% per channel)
 * maxDiffPixelRatio:  fraction of pixels allowed to differ across environments (5%)
 * animations:         "disabled" freezes CSS transitions mid-frame
 */
const SCREENSHOT_OPTIONS = {
  threshold: 0.2,
  maxDiffPixelRatio: 0.05,
  animations: "disabled" as const,
};

test.describe("Visual regression — Login page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login card matches baseline", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.container.waitFor({ state: "visible" });
    // Screenshot the card element only — the surrounding page background is irrelevant
    await expect(login.container).toHaveScreenshot(
      "login-card.png",
      SCREENSHOT_OPTIONS
    );
  });
});

test.describe("Visual regression — Kudos wall", () => {
  let wall: KudosWallPage;

  test.beforeEach(async ({ page }) => {
    wall = new KudosWallPage(page);
    await wall.goto();
    await wall.kudosItems.first().waitFor({ state: "visible" }); // any item — feed finished loading
  });

  test("nav bar chrome matches baseline", async ({ page }) => {
    // The header is purely structural: heading + "Signed in as alice" + two buttons.
    // It never changes regardless of how many kudos exist.
    const header = page.locator("header");
    await expect(header).toHaveScreenshot("kudos-wall-nav.png", SCREENSHOT_OPTIONS);
  });

  test("full page with feed masked matches baseline", async ({ page }) => {
    // Full-page chrome check. The feed area is masked so new kudos never break it.
    await expect(page).toHaveScreenshot("kudos-wall-full.png", {
      ...SCREENSHOT_OPTIONS,
      mask: [wall.kudosItems], // blacks out all kudo cards
    });
  });
});

test.describe("Visual regression — Give Kudos modal", () => {
  test("modal form matches baseline", async ({ page }) => {
    const wall = new KudosWallPage(page);
    await wall.goto();
    await wall.kudosItems.first().waitFor({ state: "visible" }); // any item — feed finished loading

    await test.step("open modal and wait for receiver list to populate", async () => {
      await wall.createBtn.click();
      await page.getByTestId(selectors.kudosModal).waitFor({ state: "visible" });
      // The select is populated via GET /auth/users — wait for it before screenshotting
      await page
        .getByTestId(selectors.kudosReceiverSelect)
        .waitFor({ state: "visible" });
    });

    // Screenshot the modal element only — not the blurred backdrop behind it
    await expect(page.getByTestId(selectors.kudosModal)).toHaveScreenshot(
      "kudos-modal.png",
      SCREENSHOT_OPTIONS
    );
  });
});
