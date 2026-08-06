#!/usr/bin/env node
/** Verify that boxed, tabular, and preformatted content fits every HTML edition. */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const files = [
  'build/html/guide.html',
  'build/html/guide_mono.html',
  'build/html/guide_a4half.html',
  'build/html/guide_a4half_mono.html',
  'build/html/guide_largeprint.html',
  'build/html/guide_largeprint_mono.html',
];
const selectors = [
  '.route-card',
  '.safety-card',
  '.formula-card',
  '.emergency-gate',
  '.emergency-strip > div',
  'td',
  'th',
  'pre',
  'blockquote',
  'figure',
];

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`Overflow verification failed: missing ${file}`);
    process.exit(1);
  }
}

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const file of files) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    const problems = await page.evaluate((testedSelectors) => {
      const found = [];
      for (const selector of testedSelectors) {
        document.querySelectorAll(selector).forEach((element, index) => {
          const horizontal = element.scrollWidth - element.clientWidth;
          const vertical = element.scrollHeight - element.clientHeight;
          const rect = element.getBoundingClientRect();
          if (horizontal > 1 || vertical > 1 || rect.width < 1 || rect.height < 1) {
            found.push({
              selector,
              index,
              horizontal,
              vertical,
              text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180),
            });
          }
        });
      }
      return found;
    }, selectors);
    for (const problem of problems) failures.push({ file, ...problem });
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('Overflow verification failed:');
  for (const failure of failures.slice(0, 50)) console.error(JSON.stringify(failure));
  process.exit(1);
}
console.log(`Overflow verified: ${files.length} HTML editions, ${selectors.length} boxed/content selectors, no clipped content.`);
