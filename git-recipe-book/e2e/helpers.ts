import type { Page } from '@playwright/test'

export async function openCleanLearningApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('git-recipe-book-onboarding-done', 'permanent')
    // Clear persisted learning state once per Playwright page, not on every reload.
    // Some learner journeys intentionally seed prerequisite progress and reload.
    if (!sessionStorage.getItem('git-recipe-book-e2e-cleaned')) {
      localStorage.removeItem('git-recipe-book-lesson-progress')
      localStorage.removeItem('git-recipe-book-checkpoint-results')
      localStorage.removeItem('git-recipe-book-learning-evidence-v2')
      sessionStorage.setItem('git-recipe-book-e2e-cleaned', '1')
    }
  })
  await page.goto('/')
}

export async function runTerminalCommand(page: Page, command: string): Promise<void> {
  const input = page.locator('input[placeholder*="Type a git command"]')
  await input.fill(command)
  await input.press('Enter')
}
