import { readFile, writeFile } from 'node:fs/promises';

const inputPath = process.argv[2] ?? 'sprite-fan/atlas-studio.html';
const outputPath = process.argv[3] ?? '/tmp/atlas-studio-script.js';
const html = await readFile(inputPath, 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
if (!script) throw new Error(`missing inline script in ${inputPath}`);
await writeFile(outputPath, script);
console.log(`extracted inline script: ${inputPath} -> ${outputPath}`);
