import { test, expect } from '@playwright/test';

test.describe('Lessons', () => {
  test('lesson panel is visible', async ({ page }) => {
    await page.goto('/');
    // The lesson panel should be visible in the sidebar
    await expect(page.locator('text=Git Lessons')).toBeVisible({ timeout: 10000 });
  });

  test('user can start a lesson', async ({ page }) => {
    await page.goto('/');

    // Find and click a Start Lesson button
    const startButton = page.locator('button:has-text("Start Lesson")').first();
    await startButton.click();

    // Should show step details
    await expect(page.locator('text=Initialize a Repository')).toBeVisible({ timeout: 5000 });
  });

  test('steps progress when correct command is entered', async ({ page }) => {
    await page.goto('/');

    // Start the basics lesson
    const startButton = page.locator('button:has-text("Start Lesson")').first();
    await startButton.click();
    await expect(page.locator('text=Initialize a Repository')).toBeVisible({ timeout: 5000 });

    // Type the correct command for step 1
    const terminalInput = page.locator('input[placeholder*="Type a git command"]');
    await terminalInput.click();
    await terminalInput.fill('git init');
    await terminalInput.press('Enter');

    // Should show step completion
    await expect(page.locator('text=Step complete')).toBeVisible({ timeout: 5000 });
  });

  test('lesson completion shows celebration message', async ({ page }) => {
    await page.goto('/');

    // Start the basics lesson
    const startButton = page.locator('button:has-text("Start Lesson")').first();
    await startButton.click();

    const terminalInput = page.locator('input[placeholder*="Type a git command"]');
    await terminalInput.click();

    // Complete all steps of the basics lesson
    // Step 1: git init
    await terminalInput.fill('git init');
    await terminalInput.press('Enter');
    await page.waitForTimeout(500);

    // Step 2: git status
    await terminalInput.fill('git status');
    await terminalInput.press('Enter');
    await page.waitForTimeout(500);

    // Step 3: git add .
    await terminalInput.fill('git add .');
    await terminalInput.press('Enter');
    await page.waitForTimeout(500);

    // Step 4: git commit -m "message"
    await terminalInput.fill('git commit -m "Initial commit"');
    await terminalInput.press('Enter');
    await page.waitForTimeout(500);

    // Step 5: git log
    await terminalInput.fill('git log');
    await terminalInput.press('Enter');
    await page.waitForTimeout(500);

    // Should show lesson completed message
    await expect(page.locator('text=completed')).toBeVisible({ timeout: 10000 });
  });
});
