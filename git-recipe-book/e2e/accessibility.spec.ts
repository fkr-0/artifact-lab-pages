import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { openCleanLearningApp, runTerminalCommand } from './helpers'

async function expectNoSeriousAccessibilityViolations(page: Page, context: string): Promise<void> {
  // Axe should inspect the stable rendered state, not a transient frame where
  // Framer Motion is intentionally compositing text through opacity 0.
  await page.waitForTimeout(500)
  const result = await new AxeBuilder({ page }).analyze()
  const serious = result.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  )
  expect(
    serious,
    `${context}: ${serious
      .map(
        (violation) => `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes.length} node(s)`,
      )
      .join('\n')}`,
  ).toEqual([])
}

async function ensureCourseMapOpen(page: Page): Promise<void> {
  const heading = page.getByRole('heading', { name: 'Git Lessons' })
  if (!(await heading.isVisible())) {
    await page.getByRole('button', { name: 'Course map', exact: true }).click()
  }
  await expect(heading).toBeVisible()
}

async function answerFirstRetrievalOption(page: Page): Promise<void> {
  const group = page.getByRole('group', { name: 'Retrieval check answers' })
  await expect(group).toBeVisible()
  await group.getByRole('button').first().click()
}

test.describe('Accessibility release gate', () => {
  test.describe.configure({ timeout: 60_000 })

  test.beforeEach(async ({ page }) => {
    await openCleanLearningApp(page)
  })

  test('has no serious or critical axe violations on the initial learning workspace', async ({ page }) => {
    await expectNoSeriousAccessibilityViolations(page, 'initial workspace')
  })

  test('has no serious or critical axe violations in the course map and an active lesson', async ({ page }) => {
    await ensureCourseMapOpen(page)
    await expectNoSeriousAccessibilityViolations(page, 'course map')

    await page
      .locator('.course-lesson-card', { hasText: 'Git Orientation' })
      .getByRole('button', { name: /Start lesson/i })
      .click()
    await expect(page.getByRole('heading', { name: 'Why Git Exists' })).toBeVisible()
    await expectNoSeriousAccessibilityViolations(page, 'active orientation lesson')
  })

  test('keeps prediction, terminal, evidence, and textual graph accessible after repository changes', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Start with Git Orientation/i }).click()
    for (let index = 0; index < 5; index += 1) await answerFirstRetrievalOption(page)

    await ensureCourseMapOpen(page)
    await page.getByRole('button', { name: /show full course/i }).click()
    const basics = page.locator('.course-lesson-card', { hasText: 'Local Snapshots' })
    await basics.getByRole('button', { name: /Start lesson/i }).click()

    await page.getByRole('button', { name: 'Branches & HEAD', exact: true }).click()
    await runTerminalCommand(page, 'git init')
    await answerFirstRetrievalOption(page)
    await expectNoSeriousAccessibilityViolations(page, 'active command/evidence workspace')

    await page.getByRole('button', { name: 'No state change', exact: true }).click()
    await runTerminalCommand(page, 'git status')
    await answerFirstRetrievalOption(page)
    await page.getByRole('button', { name: 'Staging area', exact: true }).click()
    await runTerminalCommand(page, 'git add README.md')
    await answerFirstRetrievalOption(page)
    await page.getByRole('button', { name: 'No state change', exact: true }).click()
    await runTerminalCommand(page, 'git diff --staged')
    await answerFirstRetrievalOption(page)
    await page.getByRole('button', { name: 'Commit history', exact: true }).click()
    await page.getByRole('button', { name: 'Branches & HEAD', exact: true }).click()
    await runTerminalCommand(page, 'git commit -m "Accessibility audit"')
    await answerFirstRetrievalOption(page)

    await expect(page.getByRole('region', { name: 'Textual commit graph' })).toContainText('Accessibility audit')
    await expectNoSeriousAccessibilityViolations(page, 'populated graph/evidence workspace')
  })

  test('has no serious or critical axe violations at representative mobile lesson and panel states', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await ensureCourseMapOpen(page)
    await expect(page.getByRole('button', { name: 'Close course map' })).toBeVisible()
    await expectNoSeriousAccessibilityViolations(page, 'mobile course panel')

    await page.getByRole('button', { name: 'Close course map' }).click()
    await page.getByRole('button', { name: 'Evidence drawer', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Close evidence drawer' })).toBeVisible()
    await expectNoSeriousAccessibilityViolations(page, 'mobile evidence panel')
  })

  test('exposes keyboard-reachable primary navigation without a mouse', async ({ page }) => {
    const visitedNames: string[] = []
    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press('Tab')
      const name = await page.evaluate(() => {
        const active = document.activeElement
        if (!(active instanceof HTMLElement)) return ''
        return active.getAttribute('aria-label') || active.textContent?.trim().replace(/\s+/g, ' ') || ''
      })
      if (name) visitedNames.push(name)
    }

    expect(visitedNames.some((name) => /course map/i.test(name))).toBe(true)
    expect(visitedNames.some((name) => /help/i.test(name))).toBe(true)
    expect(visitedNames.some((name) => /mission/i.test(name))).toBe(true)
    expect(visitedNames.some((name) => /state model/i.test(name))).toBe(true)
  })
})
