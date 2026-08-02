import { expect, test } from '@playwright/test';

async function syntheticPaste(page, text, selector = 'body') {
  return page.locator(selector).evaluate((target, value) => {
    const data = new DataTransfer();
    data.setData('text/plain', value);
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }, text);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/file-diff-studio/');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
});

test('DWIM paste fills both sources and merge decisions produce a third document', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await expect(page).toHaveTitle('File Diff Studio');
  await expect(page.getByRole('heading', { name: 'File Diff Studio' })).toBeVisible();

  expect(await syntheticPaste(page, 'alpha\nbeta\ngamma\n')).toBe(true);
  await expect(page.locator('#source-a')).toHaveValue('alpha\nbeta\ngamma\n');
  await expect(page.locator('#paste-target')).toHaveText('Changed');

  expect(await syntheticPaste(page, 'alpha\nBETA\ngamma\ndelta\n')).toBe(true);
  await expect(page.locator('#source-b')).toHaveValue('alpha\nBETA\ngamma\ndelta\n');
  await expect(page.locator('.hunk')).toHaveCount(2);
  await expect(page.locator('#result')).toHaveValue('alpha\nBETA\ngamma\ndelta\n');
  await expect(page.locator('#resolution-status')).toHaveText('2 unresolved');

  await page.locator('.hunk').first().getByRole('button', { name: /Original/ }).click();
  await expect(page.locator('#result')).toHaveValue('alpha\nbeta\ngamma\ndelta\n');
  await expect(page.locator('#resolution-status')).toHaveText('1 unresolved');

  await page.keyboard.press(']');
  await expect(page.locator('.hunk.current')).toHaveAttribute('data-hunk-index', '1');
  await page.keyboard.press('2');
  await expect(page.locator('#resolution-status')).toHaveText('All resolved');

  await page.locator('#result').fill('alpha\nbeta\ngamma\ndelta\nreviewed\n');
  await page.waitForTimeout(500);
  await expect(page.locator('#result-state')).toHaveText('Manually edited');
  await page.keyboard.press('Control+z');
  await expect(page.locator('#result')).toHaveValue('alpha\nbeta\ngamma\ndelta\n');
  await page.keyboard.press('Control+Shift+z');
  await expect(page.locator('#result')).toHaveValue('alpha\nbeta\ngamma\ndelta\nreviewed\n');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-journal').click();
  const download = await downloadPromise;
  const journal = JSON.parse(await (await download.createReadStream()).toArray().then(chunks => Buffer.concat(chunks).toString('utf8')));
  expect(journal.schema).toBe('file-diff-studio/journal-v1');
  expect(journal.operations.length).toBeGreaterThanOrEqual(5);
  expect(journal.current.sources.a.content).toBe('alpha\nbeta\ngamma\n');
  expect(journal.current.sources.b.content).toBe('alpha\nBETA\ngamma\ndelta\n');
  expect(errors).toEqual([]);
});

test('diff core reconstructs both inputs and exported journals round-trip exactly', async ({ page }) => {
  const cases = [
    ['', ''],
    ['same', 'same'],
    ['a\nb\nc', 'a\nB\nc\nd'],
    ['removed\nkept\n', 'kept\n'],
    ['one\ntwo\nthree\nfour', 'zero\none\nthree\nFOUR']
  ];
  const reconstruction = await page.evaluate(samples => samples.map(([left, right]) => {
    const api = window.__FILE_DIFF_STUDIO__;
    const ops = api.myersDiff(left.split('\n'), right.split('\n'));
    return {
      left: ops.filter(op => op.type !== 'insert').map(op => op.value).join('\n'),
      right: ops.filter(op => op.type !== 'delete').map(op => op.value).join('\n')
    };
  }), cases);
  expect(reconstruction).toEqual(cases.map(([left, right]) => ({ left, right })));

  await page.locator('#source-a').fill('north\neast\nsouth\n');
  await page.locator('#source-b').fill('north\nEAST\nsouth\nwest\n');
  await page.waitForTimeout(500);
  await page.locator('.hunk').first().getByRole('button', { name: /Original/ }).click();
  const journal = await page.evaluate(() => window.__FILE_DIFF_STUDIO__.journalDocument());

  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.locator('#import-journal-file').setInputFiles({
    name: 'roundtrip.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(journal))
  });
  await expect(page.locator('#source-a')).toHaveValue('north\neast\nsouth\n');
  await expect(page.locator('#source-b')).toHaveValue('north\nEAST\nsouth\nwest\n');
  await expect(page.locator('#result')).toHaveValue('north\neast\nsouth\nwest\n');
  await expect(page.locator('#journal-status')).toContainText('/');
});

test('native editor paste is not captured by DWIM and file uploads update live diff', async ({ page }) => {
  const prevented = await syntheticPaste(page, 'native paste', '#source-a');
  expect(prevented).toBe(false);

  await page.locator('#file-a').setInputFiles({ name: 'old.conf', mimeType: 'text/plain', buffer: Buffer.from('port=80\nmode=dev\n') });
  await page.locator('#file-b').setInputFiles({ name: 'new.conf', mimeType: 'text/plain', buffer: Buffer.from('port=443\nmode=prod\n') });

  await expect(page.locator('#name-a')).toHaveValue('old.conf');
  await expect(page.locator('#name-b')).toHaveValue('new.conf');
  await expect(page.locator('.hunk')).toHaveCount(1);
  await expect(page.locator('#engine-status')).toHaveText('Exact Myers line diff');
  await expect(page.locator('#result')).toHaveValue('port=443\nmode=prod\n');

  const resultDownload = page.waitForEvent('download');
  await page.locator('#download-result').click();
  const download = await resultDownload;
  expect(download.suggestedFilename()).toBe('new.merged.conf');
});
