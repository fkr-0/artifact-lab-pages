import { expect, test } from '@playwright/test'
import { openCleanLearningApp, runTerminalCommand } from './helpers'

async function completeOrientation(page: Parameters<typeof openCleanLearningApp>[0]): Promise<void> {
  await page.getByRole('button', { name: /Recommended next.*Git Orientation/i }).click()
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('button', { name: 'I can explain it' }).click()
  }
  await expect(page.getByRole('button', { name: /Practice again/i }).first()).toBeVisible()
}

async function startGitBasics(page: Parameters<typeof openCleanLearningApp>[0]): Promise<void> {
  const basicsCard = page.locator('.course-lesson-card', { hasText: 'Git Basics' })
  await basicsCard.getByRole('button', { name: /Start lesson/i }).click()
  await expect(page.getByRole('heading', { name: 'Initialize a Repository' })).toBeVisible()
}

async function runLessonExperiment(
  page: Parameters<typeof openCleanLearningApp>[0],
  command: string,
  prediction: string,
): Promise<void> {
  await page.getByRole('button', { name: prediction, exact: true }).click()
  await runTerminalCommand(page, command)
  await expect(page.getByText('Secure the mechanism')).toBeVisible()
  await page.getByRole('button', { name: 'I can explain it' }).click()
}

test.describe('Learning-centered lessons', () => {
  test.beforeEach(async ({ page }) => {
    await openCleanLearningApp(page)
  })

  test('presents a mental model and a sequential course map', async ({ page }) => {
    await expect(page.getByText('Build a mental model, not a command collection')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Follow content and pointers through Git' })).toBeVisible()
    await expect(page.getByText('Course mastery')).toBeVisible()

    const locked = page.getByRole('button', { name: /Prerequisite locked/i })
    expect(await locked.count()).toBeGreaterThan(0)
    await expect(locked.first()).toBeDisabled()
  })

  test('masters orientation through retrieval and unlocks later practice', async ({ page }) => {
    await completeOrientation(page)

    await expect(page.getByText('1/16')).toBeVisible()
    const glossaryCard = page.locator('.course-lesson-card', { hasText: 'Git Glossary' })
    await expect(glossaryCard.getByRole('button', { name: /Start lesson/i })).toBeEnabled()
  })

  test('requires prediction, command evidence, and reflection before advancing', async ({ page }) => {
    await completeOrientation(page)
    await startGitBasics(page)

    await page.getByRole('button', { name: 'Branches & HEAD', exact: true }).click()
    await runTerminalCommand(page, 'git init')

    await expect(page.getByText('Create the repository memory')).toBeVisible()
    await expect(page.getByText(/Predicted: branches & HEAD/i)).toBeVisible()
    await expect(page.getByText('Secure the mechanism')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Initialize a Repository' })).toBeVisible()

    await page.getByRole('button', { name: 'I can explain it' }).click()
    await expect(page.getByRole('heading', { name: 'Check Status' })).toBeVisible()

    await page.getByRole('button', { name: 'No state change', exact: true }).click()
    await runTerminalCommand(page, 'git status')
    await expect(page.getByText('Your prediction matched the evidence.')).toBeVisible()
  })

  test('completes the Git basics mastery loop', async ({ page }) => {
    await completeOrientation(page)
    await startGitBasics(page)

    await runLessonExperiment(page, 'git init', 'Branches & HEAD')
    await runLessonExperiment(page, 'git status', 'No state change')
    await runLessonExperiment(page, 'git add .', 'Staging area')

    await page.getByRole('button', { name: 'Staging area', exact: true }).click()
    await page.getByRole('button', { name: 'Commit history', exact: true }).click()
    await page.getByRole('button', { name: 'Branches & HEAD', exact: true }).click()
    await runTerminalCommand(page, 'git commit -m "Initial snapshot"')
    await page.getByRole('button', { name: 'I can explain it' }).click()

    await runLessonExperiment(page, 'git log', 'No state change')
    await expect(
      page.locator('.course-lesson-card', { hasText: 'Git Basics' }).getByRole('button', { name: /Practice again/i }),
    ).toBeVisible()
  })

  test('keeps the learning layout contained on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      missionTop: document.querySelector('.learning-mission')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      railClient: document.querySelector('.git-state-flow__rail')?.clientWidth ?? 0,
      railScroll: document.querySelector('.git-state-flow__rail')?.scrollWidth ?? 0,
    }))

    expect(dimensions.document).toBe(dimensions.viewport)
    expect(dimensions.missionTop).toBeLessThan(220)
    expect(dimensions.railScroll).toBeGreaterThanOrEqual(dimensions.railClient)
    await expect(page.locator('.curriculum-rail')).toHaveCount(0)

    const heightBeforePanel = await page.evaluate(() => document.body.scrollHeight)
    await page.getByRole('button', { name: 'Course map', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Close course map' })).toBeVisible()
    await expect(page.locator('.mobile-panel-scrim')).toBeVisible()
    expect(await page.evaluate(() => document.body.scrollHeight)).toBe(heightBeforePanel)
    await page.getByRole('button', { name: 'Close course map' }).click()

    await page.getByRole('button', { name: 'Evidence drawer', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Close evidence drawer' })).toBeVisible()
    expect(await page.evaluate(() => document.body.scrollHeight)).toBe(heightBeforePanel)
    await expect(page.getByText('Build a mental model, not a command collection')).toBeVisible()
  })

  test('uses progressive disclosure to widen the desktop learning canvas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.reload()

    const initial = await page.evaluate(() => ({
      workspaceWidth: document.querySelector('.learning-workspace')?.getBoundingClientRect().width ?? 0,
      evidenceCount: document.querySelectorAll('.evidence-drawer').length,
    }))

    expect(initial.workspaceWidth).toBeGreaterThan(1000)
    expect(initial.evidenceCount).toBe(0)

    await page.getByRole('button', { name: 'Evidence drawer', exact: true }).click()
    await expect(page.locator('.evidence-drawer')).toBeVisible()
    await page.getByRole('button', { name: 'Focus canvas', exact: true }).click()
    await expect(page.locator('.curriculum-rail')).toHaveCount(0)
    await expect(page.locator('.evidence-drawer')).toHaveCount(0)
  })
})
