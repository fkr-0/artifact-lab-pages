import { test, expect } from '@playwright/test';

test.describe('Basics', () => {
  test('app loads with welcome message', async ({ page }) => {
    await page.goto('/');
    // Check the app header is visible
    await expect(page.locator('text=Git Recipe Book')).toBeVisible({ timeout: 10000 });
  });

  test('user can type git init and see success', async ({ page }) => {
    await page.goto('/');
    // Click on the terminal input
    const terminalInput = page.locator('input[placeholder*="Type a git command"]');
    await terminalInput.click();
    await terminalInput.fill('git init');
    await terminalInput.press('Enter');

    // Should see success output
    await expect(page.locator('text=Initialized empty Git repository')).toBeVisible({ timeout: 5000 });
  });

  test('user can add and commit files', async ({ page }) => {
    await page.goto('/');

    const terminalInput = page.locator('input[placeholder*="Type a git command"]');

    // Init
    await terminalInput.click();
    await terminalInput.fill('git init');
    await terminalInput.press('Enter');
    await expect(page.locator('text=Initialized empty Git repository')).toBeVisible({ timeout: 5000 });

    // Add
    await terminalInput.fill('git add .');
    await terminalInput.press('Enter');
    await expect(page.locator('text=Staged')).toBeVisible({ timeout: 5000 });

    // Commit
    await terminalInput.fill('git commit -m "Initial commit"');
    await terminalInput.press('Enter');
    await expect(page.locator('text=Initial commit')).toBeVisible({ timeout: 5000 });
  });

  test('user can check status', async ({ page }) => {
    await page.goto('/');

    const terminalInput = page.locator('input[placeholder*="Type a git command"]');

    // Init first
    await terminalInput.click();
    await terminalInput.fill('git init');
    await terminalInput.press('Enter');
    await expect(page.locator('text=Initialized empty Git repository')).toBeVisible({ timeout: 5000 });

    // Status
    await terminalInput.fill('git status');
    await terminalInput.press('Enter');
    await expect(page.locator('text=On branch main')).toBeVisible({ timeout: 5000 });
  });

  test('user can view log after commit', async ({ page }) => {
    await page.goto('/');

    const terminalInput = page.locator('input[placeholder*="Type a git command"]');

    // Setup: init, add, commit
    await terminalInput.click();
    await terminalInput.fill('git init');
    await terminalInput.press('Enter');

    await terminalInput.fill('git add .');
    await terminalInput.press('Enter');

    await terminalInput.fill('git commit -m "First commit"');
    await terminalInput.press('Enter');

    // Log
    await terminalInput.fill('git log');
    await terminalInput.press('Enter');
    await expect(page.locator('text=First commit')).toBeVisible({ timeout: 5000 });
  });
});
