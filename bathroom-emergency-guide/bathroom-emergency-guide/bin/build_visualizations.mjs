#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const catalogPath = path.join(ROOT, 'src/data/visualization_catalog.json');
const requestedOut = process.argv[2] ? path.resolve(process.argv[2]) : null;
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const fontconfigRelative = catalog.renderer?.fontconfig;
if (!fontconfigRelative) throw new Error('visualization catalog lacks renderer.fontconfig');
const fontconfigPath = path.join(ROOT, fontconfigRelative);

// Native text measurement is initialized while Vega's canvas dependencies are
// imported. Set the deterministic project profile first so host desktop
// Fontconfig fragments cannot leak warnings or font substitutions into builds.
process.env.FONTCONFIG_FILE ??= fontconfigPath;

const vega = await import('vega');
const { compile } = await import('vega-lite');

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        if (stderr) process.stderr.write(stderr);
        resolve({ stdout, stderr });
      }
      else reject(new Error(`${command} exited ${code}: ${stderr || stdout}`));
    });
  });
}

function outputPath(relativePath) {
  if (!requestedOut) return path.join(ROOT, relativePath);
  return path.join(requestedOut, path.basename(relativePath));
}

function deepMerge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base;
  if (!base || typeof base !== 'object') return override ?? base;
  if (!override || typeof override !== 'object') return override ?? base;
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = key in result ? deepMerge(result[key], value) : value;
  }
  return result;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function addSvgMetadata(svg, item) {
  const titleId = `${item.id}-title`;
  const descId = `${item.id}-desc`;
  const labelledSvg = svg.replace(
    '<svg ',
    `<svg role="img" aria-labelledby="${titleId} ${descId}" `,
  );
  return labelledSvg.replace(
    '>',
    `><title id="${titleId}">${escapeXml(item.title)}</title>`
      + `<desc id="${descId}">${escapeXml(item.long_description)}</desc>`,
  );
}

const themePath = path.join(ROOT, catalog.renderer.theme);
const theme = await readJson(themePath);
for (const item of catalog.visualizations) {
  const specPath = path.join(ROOT, item.spec);
  const dataPath = path.join(ROOT, item.data);
  const spec = await readJson(specPath);
  const values = await readJson(dataPath);
  spec.data = { values };
  spec.config = deepMerge(theme, spec.config ?? {});

  const compiled = compile(spec).spec;
  const runtime = vega.parse(compiled);
  const view = new vega.View(runtime, { renderer: 'none', logLevel: vega.Warn });
  const svg = addSvgMetadata(await view.toSVG(), item);

  const svgPath = outputPath(item.svg);
  const pngPath = outputPath(item.png);
  await fs.mkdir(path.dirname(svgPath), { recursive: true });
  await fs.mkdir(path.dirname(pngPath), { recursive: true });
  await fs.writeFile(svgPath, svg, 'utf8');
  await run('rsvg-convert', ['--width', '1900', '--keep-aspect-ratio', '--output', pngPath, svgPath]);
  console.log(`  [OK] ${path.relative(ROOT, svgPath)} + ${path.relative(ROOT, pngPath)}`);
}
console.log(`Rendered ${catalog.visualizations.length} offline Vega-Lite figures.`);
