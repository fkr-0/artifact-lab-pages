import { expect, test } from '@playwright/test';

test('workflow tabs and config modal provide keyboard-safe accessible navigation', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');

  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  const importTab = page.locator('.wf-tab[data-wf="import"]');
  const cleanupTab = page.locator('.wf-tab[data-wf="cleanup"]');
  const exportTab = page.locator('.wf-tab[data-wf="export"]');

  await expect(importTab).toHaveAttribute('aria-selected', 'true');
  await expect(importTab).toHaveAttribute('tabindex', '0');
  await expect(cleanupTab).toHaveAttribute('aria-selected', 'false');

  await cleanupTab.click();
  await expect(cleanupTab).toHaveAttribute('aria-selected', 'true');
  await expect(cleanupTab).toHaveAttribute('tabindex', '0');
  await expect(importTab).toHaveAttribute('aria-selected', 'false');
  await expect(importTab).toHaveAttribute('tabindex', '-1');

  await cleanupTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(exportTab).toBeFocused();
  await expect(cleanupTab).toHaveAttribute('aria-selected', 'true');

  const configButton = page.getByRole('button', { name: 'Open configuration manager' });
  await configButton.click();
  const overlay = page.locator('#config-modal');
  const dialog = page.getByRole('dialog', { name: 'Config Manager' });
  await expect(overlay).toHaveAttribute('aria-hidden', 'false');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#cfg-editor')).toBeFocused();

  await page.locator('#btn-cfg-apply').focus();
  await page.keyboard.press('Tab');
  const focusRemainsInDialog = await page.evaluate(() => {
    const dialogElement = document.querySelector('#config-modal [role="dialog"]');
    return dialogElement?.contains(document.activeElement) ?? false;
  });
  expect(focusRemainsInDialog).toBe(true);

  await page.keyboard.press('Escape');
  await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  await expect(configButton).toBeFocused();

  await expect(page.locator('#status-msg')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#toast-container')).toHaveAttribute('aria-live', 'polite');
});
