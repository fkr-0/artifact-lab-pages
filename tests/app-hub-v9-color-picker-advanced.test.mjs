import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('app-hub/v9-portal.html', 'utf8');

assert.ok(html.includes('type="file"') && html.includes('accept="image/'), 'color picker should accept an image upload');
assert.match(html, /cp-image-input/, 'color picker should expose an image input hook');
assert.match(html, /cp-derived-palette/, 'color picker should render an image-derived palette area');
assert.match(html, /derivePaletteFromImage/, 'color picker should derive palettes from uploaded images');
assert.match(html, /pickTastefulRoles/, 'color picker should assign semantic palette roles');
assert.match(html, /primary/, 'color picker should expose a primary role');
assert.match(html, /secondary/, 'color picker should expose a secondary role');
assert.match(html, /accent/, 'color picker should expose an accent role');
assert.match(html, /dark-font/, 'color picker should expose a dark-font role');
assert.match(html, /light-font/, 'color picker should expose a light-font role');
assert.match(html, /copyRolePaletteCss/, 'color picker should copy role palettes as CSS variables');
assert.match(html, /applyRolePaletteToTheme/, 'color picker should preview\/apply role palette as theme variables');

console.log('advanced color picker contract OK');
