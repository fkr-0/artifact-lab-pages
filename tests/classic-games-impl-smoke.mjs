import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const minesweeper = await readFile('minesweeper/index.html', 'utf8');
assert.match(minesweeper, /data-preset="beginner"/, 'Minesweeper should expose Beginner preset');
assert.match(minesweeper, /data-preset="intermediate"/, 'Minesweeper should expose Intermediate preset');
assert.match(minesweeper, /data-preset="expert"/, 'Minesweeper should expose Expert preset');
assert.match(minesweeper, /id="customDialog"/, 'Minesweeper should expose custom board dialog');
assert.match(minesweeper, /function chord\(/, 'Minesweeper should support chord reveal');
assert.match(minesweeper, /classic-minesweeper\.best-times\.v1/, 'Minesweeper should persist best times');
assert.match(minesweeper, /safeStartToggle/, 'Minesweeper should support first-click safe start');

const solitaire = await readFile('solitaire/index.html', 'utf8');
assert.match(solitaire, /<select id="drawMode">/, 'Solitaire should expose draw mode selector');
assert.match(solitaire, /<button id="undoBtn">Undo<\/button>/, 'Solitaire should expose undo');
assert.match(solitaire, /<button id="autoBtn">Auto to foundation<\/button>/, 'Solitaire should expose auto foundation');
assert.match(solitaire, /function undo\(/, 'Solitaire should implement undo');
assert.match(solitaire, /function autoAll\(/, 'Solitaire should implement auto-foundation helper');
assert.match(solitaire, /classic-solitaire\.best\.v1/, 'Solitaire should persist best score');
assert.match(solitaire, /function checkWin\(/, 'Solitaire should implement win detection');

console.log('classic games implementation smoke checks passed');
