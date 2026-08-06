#!/usr/bin/env node
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , inputArg, outputArg, version = '4.0.0-alt.2', layoutArg = 'a4'] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: chrome_pdf.mjs INPUT.html OUTPUT.pdf [VERSION] [LAYOUT]');
  process.exit(2);
}

const layout = layoutArg.toLowerCase();
const formats = {
  a4:         { width: '210mm',  height: '297mm' },
  a4half:     { width: '105mm',  height: '297mm' },
  largeprint: { width: '210mm',  height: '297mm' },
};
const fmt = formats[layout] || formats.a4;

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
  await page.pdf({
    path: output,
    width: fmt.width,
    height: fmt.height,
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
    displayHeaderFooter: false,
  });
  console.log(`  [PDF] ${layout} → ${output}`);
} finally {
  await browser.close();
}
