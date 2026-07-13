import { test, expect } from '@playwright/test';

test.describe('Help', () => {
  test('help panel opens via button', async ({ page }) => {
    await page.goto('/');

    // Find and click the help button (has HelpCircle icon)
    const helpButton = page.locator('header button[title="Help"], header button').filter({ hasText: '' }).nth(3);
    // The help button should be clickable
    await page.locator('header').locator('button').nth(3).click();

    // Help panel should open
    await expect(page.locator('text=Git Help & Reference')).toBeVisible({ timeout: 5000 });
  });

  test('search functionality works', async ({ page }) => {
    await page.goto('/');

    // Open help panel
    await page.locator('header').locator('button').nth(3).click();
    await expect(page.locator('text=Git Help & Reference')).toBeVisible({ timeout: 5000 });

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search commands"]');
    await searchInput.fill('init');

    // Should filter results
    await expect(page.locator('text=git init')).toBeVisible({ timeout: 5000 });
  });

  test('glossary tab shows terms', async ({ page }) => {
    await page.goto('/');

    // Open help panel
    await page.locator('header').locator('button').nth(3).click();
    await expect(page.locator('text=Git Help & Reference')).toBeVisible({ timeout: 5000 });

    // Click Glossary tab
    await page.locator('button:has-text("Glossary")').click();

    // Should show glossary entries
    await expect(page.locator('text=Repository')).toBeVisible({ timeout: 5000 });
  });

  test('concepts tab shows explanations', async ({ page }) => {
    await page.goto('/');

    // Open help panel
    await page.locator('header').locator('button').nth(3).click();
    await expect(page.locator('text=Git Help & Reference')).toBeVisible({ timeout: 5000 });

    // Click Concepts tab
    await page.locator('button:has-text("Concepts")').click();

    // Should show concept entries
    await expect(page.locator('text=The Three States')).toBeVisible({ timeout: 5000 });
  });
});
