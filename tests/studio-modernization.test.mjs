import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sharepicPath = new URL('../procedural-sharepic-studio.html', import.meta.url);
const storyboardPath = new URL('../storyboard-studio/index.html', import.meta.url);

test('procedural sharepic studio exposes a reversible, portable production workflow', async () => {
  const html = await readFile(sharepicPath, 'utf8');

  for (const marker of [
    'procedural-sharepic-studio-state-v5',
    'LEGACY_STORAGE_KEY',
    'function undo()',
    'function redo()',
    'studioRecipes',
    'paletteAdapters',
    'typographyPresets',
    'proceduralProfiles',
    'function activeTheme(',
    'function generateContourMap(',
    'function generateVoronoiShards(',
    'function generateLissajousRibbons(',
    'function generateCellularAutomata(',
    'function generateGuilloche(',
    'id="palette-adapter"',
    'id="procedural-profile"',
    'id="content-heading-font"',
    'id="content-body-font"',
    'id="btn-safe-area"',
    'id="preview-zoom"',
    'id="export-format"',
    'function exportToImage(',
    'function downloadRecipe()',
    'function importRecipeFile(',
    'prefers-reduced-motion',
  ]) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('storyboard studio exposes narrative authoring, history, focus, and accessible export controls', async () => {
  const html = await readFile(storyboardPath, 'utf8');

  for (const marker of [
    'Visual narrative',
    'Character dossier',
    'storyboard-studio-state-v3',
    'LEGACY_STORAGE_KEYS',
    'designPresets',
    'colorSystems',
    'id="designPresetSelect"',
    'id="typeSystemSelect"',
    'id="imageTreatmentSelect"',
    'function applyDesignPreset()',
    "'add-scene'",
    "'add-character'",
    'function undo()',
    'function redo()',
    'function reorderBlock(',
    'function toggleFocusMode(',
    'function storyboardMarkdown(',
    'id="blockAltInput"',
    'id="blockSearchInput"',
    'role="dialog"',
    'prefers-reduced-motion',
  ]) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
