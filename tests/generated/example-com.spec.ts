import { test, expect } from '@playwright/test';

test.describe('Page load', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('https://example.com/');
    await expect(page).toHaveTitle('Example Domain');
  });

  test('has correct URL', async ({ page }) => {
    await page.goto('https://example.com/');
    await expect(page).toHaveURL('https://example.com/');
  });

  test('displays main heading', async ({ page }) => {
    await page.goto('https://example.com/');
    const heading = page.getByRole('heading', { name: 'Example Domain' });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Example Domain');
  });
});