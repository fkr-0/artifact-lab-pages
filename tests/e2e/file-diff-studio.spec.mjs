import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const url = pathToFileURL(resolve('file-diff-studio/index.html')).href;

test('DWIM paste, live diff, merge choice, undo and redo', async ({ page }) => {
  await page.goto(url);
  await page.evaluate(() => {
    window.__fileDiffStudio.pasteText('alpha\nbeta\ngamma');
    window.__fileDiffStudio.pasteText('alpha\nBETA\ngamma\ndelta');
  });

  await expect(page.locator('#sourceA')).toHaveValue('alpha\nbeta\ngamma');
  await expect(page.locator('#sourceB')).toHaveValue('alpha\nBETA\ngamma\ndelta');
  await expect(page.locator('#changeCount')).not.toHaveText('0');
  await expect(page.locator('#result')).toHaveValue('alpha\nBETA\ngamma\ndelta');

  await page.locator('[data-choose="a"]').first().click();
  await expect(page.locator('#result')).toHaveValue(/beta/);
  await page.locator('#undoBtn').click();
  await expect(page.locator('#result')).toHaveValue(/BETA/);
  await page.locator('#redoBtn').click();
  await expect(page.locator('#result')).toHaveValue(/beta/);
});

test('keyboard navigation and manual result edits are journaled', async ({ page }) => {
  await page.goto(url);
  await page.locator('#sourceA').fill('one\ntwo\nthree');
  await page.locator('#sourceA').blur();
  await page.locator('#sourceB').fill('ONE\ntwo\nTHREE');
  await page.locator('#sourceB').blur();
  await page.keyboard.press('j');
  await expect(page.locator('.hunk.active')).toBeVisible();
  await page.keyboard.press('1');
  await page.locator('#result').fill('manual result');
  await page.locator('#result').blur();
  await expect(page.locator('#resultMeta')).toContainText('Manual');
  await expect(page.locator('#opCount')).not.toHaveText('0');
});
