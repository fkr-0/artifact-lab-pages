import { expect, test } from '@playwright/test'
import { openCleanLearningApp } from './helpers'

test.describe('Help', () => {
  test.beforeEach(async ({ page }) => {
    await openCleanLearningApp(page)
  })

  test('help panel opens via button', async ({ page }) => {
    // Find and click the help button (has HelpCircle icon)
    // The help button should be clickable
    await page.getByTitle('Help').click()

    // Help panel should open
    await expect(page.getByRole('heading', { name: 'Git Help & Reference' })).toBeVisible({ timeout: 5000 })
  })

  test('search functionality works', async ({ page }) => {
    // Open help panel
    await page.getByTitle('Help').click()
    await expect(page.getByRole('heading', { name: 'Git Help & Reference' })).toBeVisible({ timeout: 5000 })

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search commands"]')
    await searchInput.fill('init')

    // Should filter results
    await expect(
      page
        .getByRole('dialog')
        .locator('code')
        .filter({ hasText: /^git init$/ })
        .first(),
    ).toBeVisible({ timeout: 5000 })
  })

  test('glossary tab shows terms', async ({ page }) => {
    // Open help panel
    await page.getByTitle('Help').click()
    await expect(page.getByRole('heading', { name: 'Git Help & Reference' })).toBeVisible({ timeout: 5000 })

    // Click Glossary tab
    await page.locator('button:has-text("Glossary")').click()

    // Should show glossary entries
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Repository', exact: true })).toBeVisible({
      timeout: 5000,
    })
  })

  test('concepts tab shows explanations', async ({ page }) => {
    // Open help panel
    await page.getByTitle('Help').click()
    await expect(page.getByRole('heading', { name: 'Git Help & Reference' })).toBeVisible({ timeout: 5000 })

    // Click Concepts tab
    await page.locator('button:has-text("Concepts")').click()

    // Should show concept entries
    await expect(page.locator('text=The Three States')).toBeVisible({ timeout: 5000 })
  })
})
