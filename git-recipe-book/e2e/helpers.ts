import type { Page } from '@playwright/test'

export async function openCleanLearningApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('git-recipe-book-onboarding-done', 'permanent')
    localStorage.removeItem('git-recipe-book-lesson-progress')
    localStorage.removeItem('git-recipe-book-checkpoint-results')
  })
  await page.goto('/')
}

export async function runTerminalCommand(page: Page, command: string): Promise<void> {
  const input = page.locator('input[placeholder*="Type a git command"]')
  await input.fill(command)
  await input.press('Enter')
}
