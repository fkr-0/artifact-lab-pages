import { expect, test } from '@playwright/test';

const QUIZ_URL = '/oeffentliches-dienstrecht-quiz/index.html';
const STORAGE_KEY = 'oeffentliches-dienstrecht-quiz/state/v1';

function emptyState() {
  return {
    version: 1,
    completed: {},
    stageStats: {},
    global: {
      answered: 0,
      correct: 0,
      wrong: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
    audio: false,
  };
}

async function unlockAllStages(page) {
  const stageIds = await page.evaluate(() => window.QUIZ_DATA.stages.map((stage) => stage.id));
  const state = emptyState();
  for (const stageId of stageIds) {
    state.completed[stageId] = {
      completedAt: '2026-10-06T00:00:00.000Z',
      lastCompletedAt: '2026-10-06T00:00:00.000Z',
      bestCorrect: 4,
      total: 4,
    };
  }
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  );
  await page.reload();
}

async function correctOptionIndex(page, stageIndex, questionIndex) {
  return page.evaluate(
    ({ stageIndex: s, questionIndex: q }) => window.QUIZ_DATA.stages[s].questions[q].correct,
    { stageIndex, questionIndex },
  );
}

test('all 19 stages are keyboard reachable with visible focus', async ({ page }) => {
  await page.goto(QUIZ_URL);
  await unlockAllStages(page);

  const stageButtons = page.locator('.stage-row');
  await expect(stageButtons).toHaveCount(19);
  for (let index = 0; index < 19; index += 1) {
    await expect(stageButtons.nth(index)).toBeEnabled();
  }

  await page.locator('#reset-progress').focus();
  for (let index = 0; index < 19; index += 1) {
    await page.keyboard.press('Tab');
    await expect(stageButtons.nth(index)).toBeFocused();
    const focusStyle = await stageButtons.nth(index).evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focusStyle.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(3);
  }

  await page.keyboard.press('Enter');
  await expect(page.locator('#quiz-stage-title')).toBeFocused();
  await expect(page.locator('#quiz-stage-title')).toContainText('19.');
  await page.keyboard.press('Tab');
  await expect(page.locator('.answer-button').first()).toBeFocused();
});

test('stage transitions manage focus and expose live score/progress semantics', async ({ page }) => {
  await page.goto(QUIZ_URL);

  await expect(page.locator('#score-label')).toHaveAttribute('role', 'status');
  await expect(page.locator('#score-label')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#question-counter')).toHaveAttribute('role', 'status');
  await expect(page.locator('.hearts')).toHaveAttribute('role', 'status');

  await page.locator('.stage-row').first().press('Enter');
  await expect(page.locator('#quiz-stage-title')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('.answer-button').first()).toBeFocused();

  const correct = await correctOptionIndex(page, 0, 0);
  await page.locator('.answer-button').nth(correct).press('Enter');
  await expect(page.locator('#next-question')).toBeFocused();
  await expect(page.locator('#score-label')).toHaveText('1 richtig');
  await expect(page.locator('#live-status')).toContainText('Punktestand: 1 richtig');

  await page.locator('#next-question').press('Enter');
  await expect(page.locator('.answer-button').first()).toBeFocused();
  await expect(page.locator('#question-progress-track')).toHaveAttribute('aria-valuenow', '2');
  await expect(page.locator('#question-progress-track')).toHaveAttribute('aria-valuetext', 'Frage 2 von 4');

  await page.locator('#back-to-map').click();
  await expect(page.locator('#stages-title')).toBeFocused();
});

test('golden path tracks score and persists completed progress', async ({ page }) => {
  await page.goto(QUIZ_URL);
  await page.locator('.stage-row').first().click();

  for (let questionIndex = 0; questionIndex < 4; questionIndex += 1) {
    const correct = await correctOptionIndex(page, 0, questionIndex);
    await page.locator('.answer-button').nth(correct).click();
    await expect(page.locator('#score-label')).toHaveText(`${questionIndex + 1} richtig`);
    await page.locator('#next-question').click();
  }

  await expect(page.locator('#result-panel')).toBeVisible();
  await expect(page.locator('#result-title')).toBeFocused();
  await expect(page.locator('#result-correct')).toHaveText('4');
  await expect(page.locator('#result-wrong')).toHaveText('0');
  await expect(page.locator('#result-attempts')).toHaveText('1');

  const persisted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  const firstStageId = await page.evaluate(() => window.QUIZ_DATA.stages[0].id);
  expect(persisted.completed[firstStageId]).toMatchObject({ bestCorrect: 4, total: 4 });
  expect(persisted.global).toMatchObject({ answered: 4, correct: 4, wrong: 0, bestStreak: 4 });

  await page.reload();
  await expect(page.locator('#stat-stages')).toHaveText('1/19');
  await expect(page.locator('.stage-row').first()).toHaveAttribute('aria-label', /bestanden/);
  await expect(page.locator('.stage-row').nth(1)).toBeEnabled();
});

test('prefers-reduced-motion suppresses decorative answer effects', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(QUIZ_URL);
  await page.locator('.stage-row').first().click();

  const correct = await correctOptionIndex(page, 0, 0);
  const wrong = (correct + 1) % 4;
  await page.locator('.answer-button').nth(wrong).click();

  await expect(page.locator('#effect-layer')).toBeEmpty();
  await expect(page.locator('#question-card')).not.toHaveClass(/shake/);

  const transitionDuration = await page.locator('#question-progress').evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(transitionDuration).not.toBe('0.25s');
});
