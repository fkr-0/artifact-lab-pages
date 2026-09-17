import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const base = new URL('../oeffentliches-dienstrecht-quiz/', import.meta.url);
const [html, css, app, questionSource, artifactRaw, catalogRaw] = await Promise.all([
  readFile(new URL('index.html', base), 'utf8'),
  readFile(new URL('styles.css', base), 'utf8'),
  readFile(new URL('app.js', base), 'utf8'),
  readFile(new URL('questions.js', base), 'utf8'),
  readFile(new URL('artifact.json', base), 'utf8'),
  readFile(new URL('../app-hub-v11/artifacts.source.json', import.meta.url), 'utf8')
]);

const sandbox = { window: {} };
vm.runInNewContext(questionSource, sandbox, { filename: 'questions.js' });
const quiz = sandbox.window.QUIZ_DATA;
const artifact = JSON.parse(artifactRaw);
const catalog = JSON.parse(catalogRaw);

const expectedStageTitles = [
  'Einführung',
  'Rechtsquellen des Beamtenrechts',
  'Grundbegriffe des Beamtenrechts',
  'Das Beamtenverhältnis',
  'Die Ernennung',
  'Laufbahnrecht',
  'Änderungen des funktionellen Amts und Behördenumbildung',
  'Rechtsstellung des Beamten',
  'Folgen von Pflichtverletzungen',
  'Beendigung des Beamtenverhältnisses',
  'Beschwerdeweg und Rechtsschutz',
  'Grundzüge des Besoldungsrechts',
  'Grundlagen der Beamtenversorgung',
  'Grundzüge des Disziplinarrechts',
  'Einführung in das Arbeitsrecht',
  'Rechtsquellen des Arbeitsrechts',
  'Kollektives Arbeitsrecht (Tarifrecht)',
  'Individualarbeitsrecht',
  'Personalvertretungs- und Betriebsverfassungsrecht'
];

test('quiz follows the 19-section Wichmann/Langer public table-of-contents order', () => {
  assert.equal(quiz.stages.length, 19);
  assert.deepEqual(Array.from(quiz.stages, (stage) => stage.title), expectedStageTitles);
  assert.match(quiz.structureNote, /Wichmann\/Langer/);
  assert.match(quiz.legalAsOf, /September 2026/);
});

test('every stage has four progressively harder, fully sourced multiple-choice questions', () => {
  let total = 0;
  for (const stage of quiz.stages) {
    assert.equal(stage.questions.length, 4, stage.title);
    assert.deepEqual(Array.from(stage.questions, (question) => question.difficulty), [1, 2, 3, 4], stage.title);
    for (const question of stage.questions) {
      total += 1;
      assert.equal(question.options.length, 4, question.prompt);
      assert.ok(Number.isInteger(question.correct) && question.correct >= 0 && question.correct < 4, question.prompt);
      assert.ok(question.explanation.length >= 40, question.prompt);
      assert.ok(question.sources.length >= 1, question.prompt);
      for (const key of question.sources) {
        assert.ok(quiz.sources[key], `${question.prompt}: unknown source ${key}`);
        assert.match(quiz.sources[key].url, /^https:\/\//);
      }
    }
  }
  assert.equal(total, 76);
});

test('client implements local persistence, three-strikes failure, unlock progression, sound and cleanup', () => {
  assert.match(app, /oeffentliches-dienstrecht-quiz\/state\/v1/);
  assert.match(app, /stageWrong >= 3/);
  assert.match(app, /state\.completed\[stage\.id\]/);
  assert.match(app, /isUnlocked\(index\)/);
  assert.match(app, /AudioContext/);
  assert.match(app, /playSound\('success'\)/);
  assert.match(app, /playSound\('fail'\)/);
  assert.match(app, /pagehide/);
  assert.match(app, /localStorage\.setItem/);
});

test('document exposes accessible feedback, semantic main and reduced-motion behavior', () => {
  assert.match(html, /<html lang="de">/);
  assert.match(html, /<main id="main"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-live="assertive"/);
  assert.doesNotMatch(html, /onclick=/i);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /:focus-visible/);
});

test('native manifest and compatibility catalog publish the same artifact', () => {
  assert.equal(artifact.id, 'oeffentliches-dienstrecht-quiz');
  assert.equal(artifact.version, '0.1.0');
  assert.equal(artifact.release.offline, true);
  assert.ok(catalog.deploy.includeDirs.includes('oeffentliches-dienstrecht-quiz'));
  const matches = catalog.items.filter((item) => item.id === 'oeffentliches-dienstrecht-quiz');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].href, '../oeffentliches-dienstrecht-quiz/index.html');
});
