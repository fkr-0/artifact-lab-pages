#!/usr/bin/env node
/** Browser-level responsive and interaction verification for the Pages package. */
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const SITE = join(ROOT, 'build', 'site');
const QA = join(ROOT, 'build', 'qa', 'site');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = normalize(decoded).replace(/^[/\\]+/, '');
  const candidate = resolve(SITE, relative || 'index.html');
  if (!candidate.startsWith(SITE)) return null;
  return candidate;
}

const server = createServer(async (request, response) => {
  try {
    let file = safePath(request.url || '/');
    if (!file) throw new Error('invalid path');
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    const body = await readFile(join(SITE, '404.html'));
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    response.end(body);
  }
});

await mkdir(QA, { recursive: true });
await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const origin = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true });
const failures = [];

async function inspect(name, path, viewport) {
  const context = await browser.newContext({ viewport, colorScheme: 'light' });
  const page = await context.newPage();
  const consoleErrors = [];
  const externalRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => consoleErrors.push(String(error)));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== origin) externalRequests.push(request.url());
  });
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
  if (!response?.ok()) failures.push(`${name}: HTTP ${response?.status()}`);
  if (!(await page.locator('main').isVisible())) failures.push(`${name}: main content not visible`);
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    root: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  if (Math.max(overflow.body, overflow.root) > overflow.viewport + 1) {
    failures.push(`${name}: horizontal overflow ${JSON.stringify(overflow)}`);
  }
  if (consoleErrors.length) failures.push(`${name}: console errors: ${consoleErrors.join(' | ')}`);
  if (externalRequests.length) failures.push(`${name}: external runtime requests: ${externalRequests.join(', ')}`);
  await page.screenshot({ path: join(QA, `${name}.png`), fullPage: true });
  await context.close();
}

try {
  for (const [name, path] of [['landing', '/'], ['deployment', '/deploy/'], ['downloads', '/downloads/']]) {
    await inspect(`${name}-desktop`, path, { width: 1440, height: 1000 });
    await inspect(`${name}-mobile`, path, { width: 390, height: 844 });
  }

  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${origin}/deploy/`, { waitUntil: 'networkidle' });
  const beforeTheme = await page.locator('html').getAttribute('data-theme');
  await page.locator('[data-theme-toggle]').click();
  const afterTheme = await page.locator('html').getAttribute('data-theme');
  if (beforeTheme === afterTheme) failures.push('theme toggle did not change the document theme');

  const boxes = page.locator('[data-deployment-planner] input[type="checkbox"]');
  const plannerItems = page.locator('.planner-item');
  await plannerItems.nth(0).click({ force: true });
  await plannerItems.nth(1).click({ force: true });
  const progress = await page.locator('[data-progress-number]').textContent();
  if (progress !== '33%') failures.push(`deployment planner expected 33%, found ${progress}`);
  await page.reload({ waitUntil: 'networkidle' });
  if (!(await boxes.nth(0).isChecked()) || !(await boxes.nth(1).isChecked())) {
    failures.push('deployment planner did not persist local checklist state');
  }

  await page.goto(`${origin}/downloads/`, { waitUntil: 'networkidle' });
  await page.locator('[data-download-filter="routes"]').click();
  if (!(await page.locator('section[data-download-group="routes"]').first().isVisible())) {
    failures.push('route download filter did not reveal route section');
  }
  if (await page.locator('section[data-download-group="master"]').isVisible()) {
    failures.push('route download filter did not hide master section');
  }
  await context.close();
} finally {
  await browser.close();
  await new Promise(resolveClosed => server.close(resolveClosed));
}

if (failures.length) {
  console.error(`Site browser verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Site browser verification passed: six responsive screenshots, no overflow or remote runtime requests, and working theme, planner persistence, and download filters.');
