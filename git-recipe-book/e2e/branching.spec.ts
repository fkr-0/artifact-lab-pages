import { test, expect } from '@playwright/test';

test.describe('Branching', () => {
  test('user can create a branch', async ({ page }) => {
    await page.goto('/');

    const terminalInput = page.locator('input[placeholder*="Type a git command"]');
    await terminalInput.click();

    // Init and commit first
    await terminalInput.fill('git init');
    await terminalInput.press('Enter');
    await page.waitForTimeout(500);

    await terminalInput.fill('git add .');
    await terminalInput.press('Enter');
    await page.waitForTimeout(500);

    await terminalInput.fill('git commit -m "First commit"');
    await terminalInput.press('Enter');
    await page.waitForTimeout(500);

    // Create branch
    await terminalInput.fill('git branch feature');
    await terminalInput.press('Enter');
    await expect(page.locator('text=Created branch')).toBeVisible({ timeout: 5000 });
  });

  test('user can switch branches', async ({ page }) => {
    await page.goto('/');

    const terminalInput = page.locator('input[placeholder*="Type a git command"]');
    await terminalInput.click();

    await terminalInput.fill('git init');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git add .');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git commit -m "First commit"');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git branch feature');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    // Switch to feature branch
    await terminalInput.fill('git checkout feature');
    await terminalInput.press('Enter');
    await expect(page.locator("text=Switched to branch 'feature'")).toBeVisible({ timeout: 5000 });
  });

  test('user can merge branches', async ({ page }) => {
    await page.goto('/');

    const terminalInput = page.locator('input[placeholder*="Type a git command"]');
    await terminalInput.click();

    await terminalInput.fill('git init');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git add .');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git commit -m "First commit"');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    // Create and switch to feature branch
    await terminalInput.fill('git branch feature');
    await terminalInput.press('Enter');

    await terminalInput.fill('git checkout feature');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    // Make a commit on feature
    await terminalInput.fill('touch feature.txt');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git add .');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git commit -m "Feature work"');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    // Switch back to main and merge
    await terminalInput.fill('git checkout main');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git merge feature');
    await terminalInput.press('Enter');
    await expect(page.locator('text=Fast-forward')).toBeVisible({ timeout: 5000 });
  });

  test('graph updates after operations', async ({ page }) => {
    await page.goto('/');

    const terminalInput = page.locator('input[placeholder*="Type a git command"]');
    await terminalInput.click();

    // Init and make a commit
    await terminalInput.fill('git init');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git add .');
    await terminalInput.press('Enter');
    await page.waitForTimeout(300);

    await terminalInput.fill('git commit -m "First commit"');
    await terminalInput.press('Enter');
    await page.waitForTimeout(1000);

    // Graph should show commit nodes - check that the ReactFlow container exists
    const graphArea = page.locator('.react-flow');
    await expect(graphArea).toBeVisible({ timeout: 5000 });
  });
});
