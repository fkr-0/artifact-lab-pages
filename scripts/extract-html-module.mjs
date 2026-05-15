import { readFile, writeFile } from 'node:fs/promises';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('usage: node scripts/extract-html-module.mjs <input.html> <output.mjs>');
  process.exit(2);
}

const html = await readFile(inputPath, 'utf8');
const openTag = '<script type="module">';
const start = html.indexOf(openTag);
if (start < 0) throw new Error(`missing module script in ${inputPath}`);
const bodyStart = start + openTag.length;
const end = html.indexOf('</script>', bodyStart);
if (end < 0) throw new Error(`missing module script close tag in ${inputPath}`);
await writeFile(outputPath, html.slice(bodyStart, end));
