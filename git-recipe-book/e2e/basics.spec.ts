import { expect, test } from '@playwright/test'
import { openCleanLearningApp } from './helpers'

test.describe('Basics', () => {
  test.beforeEach(async ({ page }) => {
    await openCleanLearningApp(page)
  })

  test('app loads with welcome message', async ({ page }) => {
    // Check the app header is visible
    await expect(page.getByRole('heading', { name: 'Git Recipe Book', exact: true })).toBeVisible({ timeout: 10000 })
  })

  test('user can type git init and see success', async ({ page }) => {
    // Click on the terminal input
    const terminalInput = page.locator('input[placeholder*="Type a git command"]')
    await terminalInput.click()
    await terminalInput.fill('git init')
    await terminalInput.press('Enter')

    // Should see success output
    await expect(page.locator('text=Initialized empty Git repository')).toBeVisible({ timeout: 5000 })
  })

  test('user can add and commit files', async ({ page }) => {
    const terminalInput = page.locator('input[placeholder*="Type a git command"]')

    // Init
    await terminalInput.click()
    await terminalInput.fill('git init')
    await terminalInput.press('Enter')
    await expect(page.locator('text=Initialized empty Git repository')).toBeVisible({ timeout: 5000 })

    await terminalInput.fill('edit README.md First version')
    await terminalInput.press('Enter')

    // Add
    await terminalInput.fill('git add .')
    await terminalInput.press('Enter')
    await expect(page.getByText(/^Staged \d+ file\(s\)/)).toBeVisible({ timeout: 5000 })

    // Commit
    await terminalInput.fill('git commit -m "Initial commit"')
    await terminalInput.press('Enter')
    await expect(page.getByText(/^\[main [0-9a-f]+\] Initial commit/)).toBeVisible({ timeout: 5000 })
  })

  test('user can check status', async ({ page }) => {
    const terminalInput = page.locator('input[placeholder*="Type a git command"]')

    // Init first
    await terminalInput.click()
    await terminalInput.fill('git init')
    await terminalInput.press('Enter')
    await expect(page.locator('text=Initialized empty Git repository')).toBeVisible({ timeout: 5000 })

    // Status
    await terminalInput.fill('git status')
    await terminalInput.press('Enter')
    await expect(page.getByText(/^On branch main/)).toBeVisible({ timeout: 5000 })
  })

  test('user can view log after commit', async ({ page }) => {
    const terminalInput = page.locator('input[placeholder*="Type a git command"]')

    // Setup: init, add, commit
    await terminalInput.click()
    await terminalInput.fill('git init')
    await terminalInput.press('Enter')

    await terminalInput.fill('edit README.md First version')
    await terminalInput.press('Enter')

    await terminalInput.fill('git add .')
    await terminalInput.press('Enter')

    await terminalInput.fill('git commit -m "First commit"')
    await terminalInput.press('Enter')

    // Log
    await terminalInput.fill('git log')
    await terminalInput.press('Enter')
    await expect(page.getByText(/^commit [0-9a-f]+ \(main\)/)).toBeVisible({ timeout: 5000 })
  })
})
