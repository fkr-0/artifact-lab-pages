#!/usr/bin/env node
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , inputArg, outputArg, version = '4.0.0'] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: chrome_pdf.mjs INPUT.html OUTPUT.pdf [VERSION]');
  process.exit(2);
}

const input = resolve(inputArg);
const output = resolve(outputArg);
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(input).href, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  await page.evaluate(() => document.documentElement.classList.add('pdf-output'));
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  const columns = await page.locator('main').evaluate((node) => getComputedStyle(node).columnCount);
  if (columns !== '1' && columns !== 'auto') {
    throw new Error('print invariant failed: main content is not one column');
  }
  await page.pdf({
    path: output,
    format: 'A4',
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
    displayHeaderFooter: false,
  });
  console.log('  print invariant: one column');
  console.log('  version: ' + version);
} finally {
  await browser.close();
}
