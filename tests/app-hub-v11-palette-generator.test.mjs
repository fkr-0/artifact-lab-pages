import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('app-hub-v11/index.html', 'utf8');

assert.match(html, /id="paletteGenerator"/, 'v11 should include a Palette Generator panel');
assert.match(html, /id="paletteImageInput"/, 'v11 palette generator should accept image uploads');
assert.match(html, /accept="image\//, 'v11 palette image input should accept images');
assert.match(html, /id="derivedPalette"/, 'v11 palette generator should render derived image swatches');
assert.match(html, /id="rolePalette"/, 'v11 palette generator should render semantic role swatches');
assert.match(html, /derivePaletteFromImage/, 'v11 should derive palettes from uploaded images');
assert.match(html, /pickTastefulRoles/, 'v11 should select tasteful semantic roles');
assert.match(html, /copyRolePaletteCss/, 'v11 should copy role palettes as CSS variables');
assert.match(html, /applyRolePaletteToTheme/, 'v11 should preview/apply generated palettes');
assert.match(html, /primary/, 'semantic roles should include primary');
assert.match(html, /secondary/, 'semantic roles should include secondary');
assert.match(html, /accent/, 'semantic roles should include accent');
assert.match(html, /dark-font/, 'semantic roles should include dark-font');
assert.match(html, /light-font/, 'semantic roles should include light-font');
assert.match(html, /--generated-primary/, 'v11 should expose generated palette CSS variables');

console.log('app-hub v11 palette generator contract OK');
