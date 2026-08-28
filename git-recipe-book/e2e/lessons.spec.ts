import { expect, test, type Page } from '@playwright/test'
import { openCleanLearningApp, runTerminalCommand } from './helpers'

async function answerRetrieval(page: Page): Promise<void> {
  const group = page.getByRole('group', { name: 'Retrieval check answers' })
  await expect(group).toBeVisible()
  const answer = group.getByRole('button').first()
  await answer.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await answer.click()
}

async function completeOrientation(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Recommended next.*Git Orientation/i }).click()
  for (let index = 0; index < 5; index += 1) await answerRetrieval(page)
  await expect(page.getByRole('button', { name: /Practice again/i }).first()).toBeVisible()
}

async function startLocalSnapshots(page: Page): Promise<void> {
  const basicsCard = page.locator('.course-lesson-card', { hasText: 'Local Snapshots' })
  await basicsCard.getByRole('button', { name: /Start lesson/i }).click()
  await expect(page.getByRole('heading', { name: 'Initialize a Repository' })).toBeVisible()
}

async function runLessonExperiment(page: Page, command: string, prediction: string): Promise<void> {
  const predictionButton = page.getByRole('button', { name: prediction, exact: true })
  await predictionButton.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await predictionButton.click()
  await runTerminalCommand(page, command)
  await expect(page.getByText('Secure the mechanism')).toBeVisible()
  await answerRetrieval(page)
}

async function completeLocalSnapshots(page: Page): Promise<void> {
  await startLocalSnapshots(page)
  await runLessonExperiment(page, 'git init', 'Branches & HEAD')
  await runLessonExperiment(page, 'git status', 'No state change')
  await runLessonExperiment(page, 'git add README.md', 'Staging area')
  await runLessonExperiment(page, 'git diff --staged', 'No state change')
  await runLessonExperiment(page, 'git commit -m "Record README"', 'Commit history')
  await runLessonExperiment(page, 'edit README.md Second-version', 'Working tree')
  await runLessonExperiment(page, 'git diff', 'No state change')
  await runLessonExperiment(page, 'git add README.md', 'Staging area')
  await runLessonExperiment(page, 'git commit -m "Update README"', 'Commit history')
  await runLessonExperiment(page, 'git log', 'No state change')
  await runLessonExperiment(page, 'git show HEAD', 'No state change')
}

async function seedCompletedLesson(page: Page, lessonId: string, steps: number): Promise<void> {
  await page.evaluate(
    ({ id, count }) => {
      const key = 'git-recipe-book-lesson-progress'
      const current = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, number>
      current[id] = count
      localStorage.setItem(key, JSON.stringify(current))
    },
    { id: lessonId, count: steps },
  )
  await page.reload()
}

async function seedCompletedLessons(page: Page, progress: Record<string, number>): Promise<void> {
  await page.evaluate((entries) => {
    const key = 'git-recipe-book-lesson-progress'
    const current = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, number>
    localStorage.setItem(key, JSON.stringify({ ...current, ...entries }))
  }, progress)
  await page.reload()
}

async function openFullCourse(page: Page): Promise<void> {
  const showFull = page.getByRole('button', { name: /show full course/i })
  if (await showFull.isVisible()) await showFull.click()
}

test.describe('Learning-centered lessons', () => {
  test.beforeEach(async ({ page }) => {
    await openCleanLearningApp(page)
  })

  test('presents a mental model with progressive course disclosure', async ({ page }) => {
    await expect(page.getByText('Build a mental model, not a command collection')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Follow content and pointers through Git' })).toBeVisible()
    await expect(page.getByText('Course progress')).toBeVisible()
    await expect(page.getByText('Current learning path')).toBeVisible()
    await expect(page.getByRole('button', { name: /show full course/i })).toBeVisible()
    await expect(page.getByText('Selective History & Mastery')).toHaveCount(0)

    await openFullCourse(page)
    await expect(page.getByRole('heading', { name: 'Recovery', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Selective History & Mastery', exact: true })).toBeVisible()
    const locked = page.getByRole('button', { name: /Prerequisite locked/i })
    expect(await locked.count()).toBeGreaterThan(0)
    await expect(locked.first()).toBeDisabled()
  })

  test('masters orientation through objective retrieval and unlocks later practice', async ({ page }) => {
    await completeOrientation(page)

    await expect(page.getByText(/^1\/\d+$/)).toBeVisible()
    const glossaryCard = page.locator('.course-lesson-card', { hasText: 'Git Glossary' })
    await expect(glossaryCard.getByRole('button', { name: /Start lesson/i })).toBeEnabled()
  })

  test('requires prediction, command evidence, and objective reflection before advancing', async ({ page }) => {
    await completeOrientation(page)
    await startLocalSnapshots(page)

    await page.getByRole('button', { name: 'Branches & HEAD', exact: true }).click()
    await runTerminalCommand(page, 'git init')

    await expect(page.getByText('Create the repository memory')).toBeVisible()
    await expect(page.getByText(/Predicted: branches & HEAD/i)).toBeVisible()
    await expect(page.getByText('What actually moved')).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: /Ref main created at/ })).toBeVisible()
    await expect(page.getByText('Secure the mechanism')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Initialize a Repository' })).toBeVisible()

    await answerRetrieval(page)
    await expect(page.getByRole('heading', { name: 'Orient Before Recording' })).toBeVisible()

    await page.getByRole('button', { name: 'No state change', exact: true }).click()
    await runTerminalCommand(page, 'git status')
    await expect(page.getByText('Your prediction matched the evidence.')).toBeVisible()
  })

  test('blocks assessed execution before prediction without mutating or advancing', async ({ page }) => {
    await completeOrientation(page)
    await startLocalSnapshots(page)

    await runTerminalCommand(page, 'git init')
    await expect(page.getByText('Prediction required before this assessed lesson action.')).toBeVisible()
    await expect(page.getByText(/Commit a prediction in the mission panel/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Initialize a Repository' })).toBeVisible()
    await expect(page.getByText('Initialized empty Git repository')).toHaveCount(0)
    await expect(page.getByText('Secure the mechanism')).toHaveCount(0)

    await page.getByRole('button', { name: 'Branches & HEAD', exact: true }).click()
    await runTerminalCommand(page, 'git init')
    await expect(page.getByText('Initialized empty Git repository')).toBeVisible()
    await expect(page.getByText('Secure the mechanism')).toBeVisible()
  })

  test('records a failed matching command as evidence without advancing', async ({ page }) => {
    await completeOrientation(page)
    await startLocalSnapshots(page)
    await runLessonExperiment(page, 'git init', 'Branches & HEAD')
    await runLessonExperiment(page, 'git status', 'No state change')

    await expect(page.getByRole('heading', { name: 'Select One File' })).toBeVisible()
    await page.getByRole('button', { name: 'Staging area', exact: true }).click()
    await runTerminalCommand(page, 'git add missing.md')

    await expect(page.getByText(/pathspec 'missing.md' did not match any files/)).toBeVisible()
    await expect(page.getByText(/Attempt recorded as evidence.*lesson did not advance/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Select One File' })).toBeVisible()
    await expect(page.getByText('Secure the mechanism')).toHaveCount(0)

    await page.getByRole('button', { name: 'Staging area', exact: true }).click()
    await runTerminalCommand(page, 'git add README.md')
    await expect(page.getByText('Secure the mechanism')).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: /Index entry README.md changed/ })).toBeVisible()
  })

  test('completes the full local snapshot loop including staged and working diffs', async ({ page }) => {
    await completeOrientation(page)
    await completeLocalSnapshots(page)

    await expect(
      page.locator('.course-lesson-card', { hasText: 'Local Snapshots' }).getByRole('button', { name: /Practice again/i }),
    ).toBeVisible()
    await expect(page.getByText(/This was an observation command/).last()).toBeVisible()
  })

  test('supports goal-based selective staging practice with a resettable lab and hint ladder', async ({ page }) => {
    await seedCompletedLesson(page, 'basics', 11)
    await openFullCourse(page)
    const card = page.locator('.course-lesson-card', { hasText: 'Focused Snapshot Practice' })
    await card.getByRole('button', { name: /Start lesson/i }).click()

    await expect(page.getByText(/Practice Lab · Focused Snapshot Practice/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Reset lab/i })).toBeVisible()
    await expect(page.getByText('Hint ladder')).toBeVisible()
    await page.getByRole('button', { name: /Reveal next hint/i }).click()
    await expect(page.getByText('1/3')).toBeVisible()

    await runLessonExperiment(page, 'git add README.md', 'Staging area')
    await expect(page.getByRole('heading', { name: 'Prove the Selection' })).toBeVisible()
  })

  test('treats a merge conflict as an expected, recoverable learning state', async ({ page }) => {
    await seedCompletedLesson(page, 'merge-commit-lab', 1)
    await openFullCourse(page)
    const card = page.locator('.course-lesson-card', { hasText: 'Merge Case 3: Conflict & Recovery' })
    await card.getByRole('button', { name: /Start lesson/i }).click()

    await page.getByRole('button', { name: 'Working tree', exact: true }).click()
    await runTerminalCommand(page, 'git merge feature')
    await expect(page.getByText(/CONFLICT \(content\): Merge conflict in README.md/)).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: /Merge paused with conflicts in README.md/ })).toBeVisible()
    await expect(page.getByText('Secure the mechanism')).toBeVisible()
    await answerRetrieval(page)

    await runLessonExperiment(page, 'git merge --abort', 'Working tree')
    await expect(page.getByRole('heading', { name: 'Reproduce the Conflict' })).toBeVisible()
  })

  test('treats a non-fast-forward push rejection as safety evidence and guides recovery', async ({ page }) => {
    await seedCompletedLesson(page, 'remotes-workflow', 1)
    await openFullCourse(page)
    const card = page.locator('.course-lesson-card', { hasText: 'Collaboration Lab: Rejected Push' })
    await card.getByRole('button', { name: /Start lesson/i }).click()

    await page.getByRole('button', { name: 'Remote', exact: true }).click()
    await runTerminalCommand(page, 'git push origin main')
    await expect(page.getByText(/! \[rejected\] main -> main \(non-fast-forward\)/)).toBeVisible()
    await expect(page.getByText('Secure the mechanism')).toBeVisible()
    await answerRetrieval(page)

    await runLessonExperiment(page, 'git fetch origin', 'Remote')
    await expect(page.getByRole('heading', { name: 'Join Local and Collaborator Work' })).toBeVisible()
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

  for (const mobileStage of [
    {
      name: 'snapshot practice',
      card: 'Focused Snapshot Practice',
      progress: { basics: 11 },
      mission: 'Stage Only Documentation',
    },
    {
      name: 'merge recovery',
      card: 'Merge Case 3: Conflict & Recovery',
      progress: { 'merge-commit-lab': 1 },
      mission: 'Let Git Stop Safely',
    },
    {
      name: 'recovery',
      card: 'Recovery Lab: Reset Modes',
      progress: { 'recovery-revert': 1 },
      mission: 'Predict the Three Modes',
    },
    {
      name: 'remote collaboration',
      card: 'Collaboration Lab: Rejected Push',
      progress: { 'remotes-workflow': 1 },
      mission: 'Observe the Safety Rejection',
    },
    {
      name: 'collaboration capstone',
      card: 'Capstone: Preserve Both Sides of Collaboration',
      progress: { 'remote-rejection-lab': 4 },
      mission: 'Align Local and Remote Without Losing Work',
    },
  ]) {
    test(`keeps ${mobileStage.name} usable on a phone viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await seedCompletedLessons(page, mobileStage.progress)
      await page.getByRole('button', { name: 'Course map', exact: true }).click()
      await openFullCourse(page)
      const card = page.locator('.course-lesson-card', { hasText: mobileStage.card })
      await card.getByRole('button', { name: /Start lesson/i }).click()

      await expect(page.getByRole('heading', { name: mobileStage.mission })).toBeVisible()
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        missionTop: document.querySelector('.learning-mission')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      }))
      expect(dimensions.document).toBe(dimensions.viewport)
      expect(dimensions.missionTop).toBeLessThan(260)
      await expect(page.getByRole('button', { name: 'Evidence drawer', exact: true })).toBeVisible()
    })
  }

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
