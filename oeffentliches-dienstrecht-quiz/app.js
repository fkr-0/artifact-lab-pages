(() => {
  'use strict';

  const data = window.QUIZ_DATA;
  if (!data || !Array.isArray(data.stages)) {
    document.body.textContent = 'Quizdaten konnten nicht geladen werden.';
    return;
  }

  const STORAGE_KEY = 'oeffentliches-dienstrecht-quiz/state/v1';
  const difficultyNames = ['Einstieg', 'Aufbau', 'Vertiefung', 'Prüfungsmodus'];
  const successLines = [
    'Aktenlage glasklar.',
    'Sauber subsumiert!',
    'Der Dienstweg applaudiert leise.',
    '§§ glühen vor Zustimmung.',
    'Formell und materiell stabil.'
  ];
  const failureLines = [
    'FORMFEHLER!',
    'WIDERSPRUCH!',
    'Die Akte sagt: nein.',
    'Zurück an die Rechtsbehelfsbelehrung!',
    'Drei Treffer daneben – Vorgang retour.'
  ];

  const els = Object.fromEntries([
    'audio-toggle', 'reset-progress', 'structure-note', 'stat-stages', 'stat-accuracy',
    'stat-answers', 'stat-streak', 'storage-warning', 'stage-map', 'stage-list',
    'quiz-panel', 'back-to-map', 'mistake-label', 'quiz-part', 'quiz-stage-title',
    'quiz-stage-summary', 'question-progress', 'question-counter', 'difficulty-label',
    'score-label', 'question-text', 'answer-list', 'feedback', 'feedback-title',
    'feedback-explanation', 'feedback-sources', 'next-question', 'question-card',
    'result-panel', 'result-stamp', 'result-kicker', 'result-title', 'result-copy',
    'result-correct', 'result-wrong', 'result-attempts', 'result-primary', 'result-map',
    'legal-as-of', 'core-sources', 'effect-layer', 'live-status'
  ].map((id) => [id, document.getElementById(id)]));

  const mistakeDots = [1, 2, 3].map((n) => document.getElementById(`mistake-${n}`));

  function defaultState() {
    return {
      version: 1,
      completed: {},
      stageStats: {},
      global: {
        answered: 0,
        correct: 0,
        wrong: 0,
        currentStreak: 0,
        bestStreak: 0
      },
      audio: true
    };
  }

  let storageAvailable = true;

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || typeof parsed.completed !== 'object' || typeof parsed.stageStats !== 'object') {
        throw new Error('unsupported state');
      }
      const fresh = defaultState();
      return {
        ...fresh,
        ...parsed,
        completed: parsed.completed || {},
        stageStats: parsed.stageStats || {},
        global: { ...fresh.global, ...(parsed.global || {}) },
        audio: parsed.audio !== false
      };
    } catch (_error) {
      storageAvailable = false;
      return defaultState();
    }
  }

  let state = readState();
  let activeStageIndex = null;
  let questionIndex = 0;
  let stageCorrect = 0;
  let stageWrong = 0;
  let currentAnswered = false;
  let audioContext = null;

  function persistState() {
    if (!storageAvailable) {
      els['storage-warning'].hidden = false;
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (_error) {
      storageAvailable = false;
      els['storage-warning'].hidden = false;
      return false;
    }
  }

  function stageStats(stageId) {
    if (!state.stageStats[stageId]) {
      state.stageStats[stageId] = { attempts: 0, failures: 0, bestCorrect: 0 };
    }
    return state.stageStats[stageId];
  }

  function isUnlocked(index) {
    if (index === 0) return true;
    return Boolean(state.completed[data.stages[index - 1].id]);
  }

  function announce(message) {
    els['live-status'].textContent = '';
    requestAnimationFrame(() => { els['live-status'].textContent = message; });
  }

  function renderStats() {
    const completedCount = Object.keys(state.completed).filter((id) => data.stages.some((s) => s.id === id)).length;
    els['stat-stages'].textContent = `${completedCount}/${data.stages.length}`;
    els['stat-answers'].textContent = String(state.global.answered || 0);
    els['stat-streak'].textContent = String(state.global.bestStreak || 0);
    els['stat-accuracy'].textContent = state.global.answered
      ? `${Math.round((state.global.correct / state.global.answered) * 100)} %`
      : '—';
  }

  function renderAudioToggle() {
    const enabled = state.audio !== false;
    els['audio-toggle'].setAttribute('aria-pressed', String(enabled));
    els['audio-toggle'].querySelector('[aria-hidden="true"]').textContent = enabled ? '🔊' : '🔇';
    els['audio-toggle'].querySelector('.sr-only').textContent = enabled ? 'Töne an' : 'Töne aus';
  }

  function renderStageMap() {
    els['stage-list'].replaceChildren();
    let previousPart = '';

    data.stages.forEach((stage, index) => {
      if (stage.part !== previousPart) {
        const heading = document.createElement('h3');
        heading.className = 'part-divider';
        heading.textContent = stage.part;
        els['stage-list'].append(heading);
        previousPart = stage.part;
      }

      const completed = Boolean(state.completed[stage.id]);
      const unlocked = isUnlocked(index);
      const stats = state.stageStats[stage.id];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `stage-row${completed ? ' completed' : ''}${unlocked ? '' : ' locked'}`;
      button.disabled = !unlocked;
      button.dataset.stageIndex = String(index);
      button.setAttribute('aria-label', `${index + 1}. ${stage.title}: ${completed ? 'bestanden' : unlocked ? 'offen' : 'gesperrt'}`);

      const number = document.createElement('span');
      number.className = 'stage-number';
      number.textContent = completed ? '✓' : String(index + 1).padStart(2, '0');

      const copy = document.createElement('span');
      copy.className = 'stage-copy';
      const title = document.createElement('strong');
      title.textContent = stage.title;
      const meta = document.createElement('small');
      const attemptText = stats?.attempts ? ` · ${stats.attempts} Versuch${stats.attempts === 1 ? '' : 'e'}` : '';
      meta.textContent = `${stage.questions.length} Fragen · Schwierigkeit 1→4${attemptText}`;
      copy.append(title, meta);

      const status = document.createElement('span');
      status.className = 'stage-status';
      status.textContent = completed ? 'BESTANDEN' : unlocked ? 'STARTEN →' : '🔒 GESPERRT';

      button.append(number, copy, status);
      if (unlocked) button.addEventListener('click', () => startStage(index));
      els['stage-list'].append(button);
    });
  }

  function showMap({ focus = true } = {}) {
    activeStageIndex = null;
    els['quiz-panel'].hidden = true;
    els['result-panel'].hidden = true;
    els['stage-map'].hidden = false;
    renderStageMap();
    renderStats();
    if (focus) document.getElementById('stages-title').focus?.();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function startStage(index) {
    if (!isUnlocked(index)) return;
    activeStageIndex = index;
    questionIndex = 0;
    stageCorrect = 0;
    stageWrong = 0;
    currentAnswered = false;

    const stage = data.stages[index];
    const stats = stageStats(stage.id);
    stats.attempts += 1;
    persistState();

    els['stage-map'].hidden = true;
    els['result-panel'].hidden = true;
    els['quiz-panel'].hidden = false;
    els['quiz-part'].textContent = stage.part;
    els['quiz-stage-title'].textContent = `${index + 1}. ${stage.title}`;
    els['quiz-stage-summary'].textContent = stage.summary;
    renderQuestion();
    els['quiz-stage-title'].focus?.();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderQuestion() {
    const stage = data.stages[activeStageIndex];
    const question = stage.questions[questionIndex];
    currentAnswered = false;

    els['feedback'].hidden = true;
    els['feedback'].className = 'feedback';
    els['feedback-title'].textContent = '';
    els['feedback-explanation'].textContent = '';
    els['feedback-sources'].replaceChildren();
    els['next-question'].hidden = true;
    els['answer-list'].replaceChildren();

    els['question-counter'].textContent = `Frage ${questionIndex + 1} von ${stage.questions.length}`;
    els['question-progress'].style.width = `${((questionIndex + 1) / stage.questions.length) * 100}%`;
    const difficulty = Math.min(4, Math.max(1, question.difficulty || questionIndex + 1));
    els['difficulty-label'].textContent = `Stufe ${difficulty} · ${difficultyNames[difficulty - 1]}`;
    els['score-label'].textContent = `${stageCorrect} richtig`;
    els['question-text'].textContent = question.prompt;

    question.options.forEach((option, optionIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-button';
      button.dataset.option = String(optionIndex);

      const letter = document.createElement('span');
      letter.className = 'answer-letter';
      letter.textContent = `${String.fromCharCode(65 + optionIndex)}.`;
      const text = document.createElement('span');
      text.textContent = option;
      button.append(letter, text);
      button.addEventListener('click', () => answerQuestion(optionIndex));
      els['answer-list'].append(button);
    });

    updateMistakes();
    const firstAnswer = els['answer-list'].querySelector('button');
    if (firstAnswer) firstAnswer.focus({ preventScroll: true });
  }

  function answerQuestion(optionIndex) {
    if (currentAnswered || activeStageIndex === null) return;
    currentAnswered = true;
    const stage = data.stages[activeStageIndex];
    const question = stage.questions[questionIndex];
    const correct = optionIndex === question.correct;

    state.global.answered += 1;
    if (correct) {
      stageCorrect += 1;
      state.global.correct += 1;
      state.global.currentStreak += 1;
      state.global.bestStreak = Math.max(state.global.bestStreak, state.global.currentStreak);
    } else {
      stageWrong += 1;
      state.global.wrong += 1;
      state.global.currentStreak = 0;
    }
    persistState();
    renderStats();
    updateMistakes();

    const buttons = [...els['answer-list'].querySelectorAll('.answer-button')];
    buttons.forEach((button, idx) => {
      button.disabled = true;
      if (idx === question.correct) button.classList.add('correct');
      else if (idx === optionIndex && !correct) button.classList.add('wrong');
      else button.classList.add('dimmed');
    });

    els['feedback'].hidden = false;
    els['feedback'].classList.add(correct ? 'good' : 'bad');
    els['feedback-title'].textContent = correct ? pick(successLines, questionIndex) : pick(failureLines, stageWrong + questionIndex);
    els['feedback-explanation'].textContent = question.explanation;
    renderQuestionSources(question.sources);
    els['score-label'].textContent = `${stageCorrect} richtig`;

    if (correct) {
      playSound('correct');
      stamp('good', 'BESTANDEN? FAST.');
    } else {
      playSound('wrong');
      stamp('bad', stageWrong >= 3 ? '3. FEHLER!' : 'EINSPRUCH!');
      shakeQuestion();
    }

    if (stageWrong >= 3) {
      const stats = stageStats(stage.id);
      stats.failures += 1;
      stats.bestCorrect = Math.max(stats.bestCorrect, stageCorrect);
      persistState();
      window.setTimeout(() => finishStage(false), prefersReducedMotion() ? 0 : 650);
      return;
    }

    els['next-question'].hidden = false;
    els['next-question'].textContent = questionIndex === stage.questions.length - 1 ? 'Stage abschließen →' : 'Nächste Frage →';
    els['next-question'].focus({ preventScroll: true });
    announce(correct ? 'Richtig. Erläuterung eingeblendet.' : `Falsch. ${stageWrong} von 3 Fehlern.`);
  }

  function nextQuestion() {
    if (!currentAnswered || activeStageIndex === null || stageWrong >= 3) return;
    const stage = data.stages[activeStageIndex];
    if (questionIndex >= stage.questions.length - 1) {
      finishStage(true);
      return;
    }
    questionIndex += 1;
    renderQuestion();
  }

  function finishStage(passed) {
    if (activeStageIndex === null) return;
    const stage = data.stages[activeStageIndex];
    const stats = stageStats(stage.id);
    stats.bestCorrect = Math.max(stats.bestCorrect, stageCorrect);

    if (passed) {
      const existing = state.completed[stage.id];
      state.completed[stage.id] = {
        completedAt: existing?.completedAt || new Date().toISOString(),
        lastCompletedAt: new Date().toISOString(),
        bestCorrect: Math.max(existing?.bestCorrect || 0, stageCorrect),
        total: stage.questions.length
      };
    }
    persistState();
    renderStats();

    els['quiz-panel'].hidden = true;
    els['stage-map'].hidden = true;
    els['result-panel'].hidden = false;
    els['result-panel'].className = `result-panel ${passed ? 'pass' : 'fail'}`;
    els['result-stamp'].textContent = passed ? 'AKTE GENEHMIGT' : 'VORGANG RETOUR';
    els['result-kicker'].textContent = passed ? 'Stage bestanden' : 'Stage nicht bestanden';
    els['result-title'].textContent = passed ? pick(successLines, activeStageIndex + stageCorrect) : 'Drei Fehler – diese Akte braucht eine neue Runde.';
    els['result-copy'].textContent = passed
      ? `${stage.title} ist dauerhaft im Browser als erledigt markiert. ${activeStageIndex < data.stages.length - 1 ? 'Die nächste Stage ist jetzt freigeschaltet.' : 'Alle Kapitel sind damit zugänglich – Respekt, Dienstrechtsmaschine.'}`
      : 'Kein Drama: Der Lernstand bleibt erhalten, der Versuch wird gezählt und du kannst die Stage sofort neu starten.';
    els['result-correct'].textContent = String(stageCorrect);
    els['result-wrong'].textContent = String(stageWrong);
    els['result-attempts'].textContent = String(stats.attempts);

    if (passed) {
      playSound('success');
      confettiBurst();
      els['result-primary'].textContent = activeStageIndex < data.stages.length - 1 ? 'Nächste Stage →' : 'Zur Übersicht';
      els['result-primary'].onclick = () => {
        if (activeStageIndex < data.stages.length - 1) startStage(activeStageIndex + 1);
        else showMap();
      };
    } else {
      playSound('fail');
      els['result-primary'].textContent = 'Stage wiederholen ↻';
      els['result-primary'].onclick = () => startStage(activeStageIndex);
    }

    els['result-title'].focus?.();
    window.scrollTo({ top: 0, behavior: 'auto' });
    announce(passed ? `Stage ${stage.title} bestanden.` : `Stage ${stage.title} nach drei Fehlern nicht bestanden.`);
  }

  function updateMistakes() {
    mistakeDots.forEach((dot, index) => dot.classList.toggle('used', index < stageWrong));
    els['mistake-label'].textContent = `${stageWrong} von 3 Fehlern`;
  }

  function renderQuestionSources(sourceKeys = []) {
    els['feedback-sources'].replaceChildren();
    sourceKeys.forEach((key) => {
      const source = data.sources[key];
      if (!source) return;
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.label;
      els['feedback-sources'].append(link);
    });
  }

  function renderCoreSources() {
    const keys = ['toc', 'kohlhammer', 'gg33', 'beamtstg', 'bbg', 'bdg', 'tvg', 'bpersvg'];
    keys.forEach((key) => {
      const source = data.sources[key];
      if (!source) return;
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.label;
      els['core-sources'].append(link);
    });
  }

  function pick(lines, seed) {
    return lines[Math.abs(Number(seed) || 0) % lines.length];
  }

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  }

  function stamp(kind, text) {
    if (prefersReducedMotion()) return;
    const node = document.createElement('div');
    node.className = `feedback-stamp ${kind}`;
    node.textContent = text;
    els['effect-layer'].append(node);
    node.addEventListener('animationend', () => node.remove(), { once: true });
    window.setTimeout(() => node.remove(), 1200);
  }

  function shakeQuestion() {
    if (prefersReducedMotion()) return;
    els['question-card'].classList.remove('shake');
    void els['question-card'].offsetWidth;
    els['question-card'].classList.add('shake');
    window.setTimeout(() => els['question-card'].classList.remove('shake'), 500);
  }

  function confettiBurst() {
    if (prefersReducedMotion()) return;
    const colors = ['#e5b94b', '#246548', '#28597a', '#a7352f', '#17212a'];
    for (let i = 0; i < 34; i += 1) {
      const piece = document.createElement('i');
      piece.className = 'confetti';
      piece.style.setProperty('--x', `${4 + Math.random() * 92}%`);
      piece.style.setProperty('--c', colors[i % colors.length]);
      piece.style.setProperty('--r', `${Math.random() * 140 - 70}deg`);
      piece.style.setProperty('--d', `${1.3 + Math.random() * 1.1}s`);
      piece.style.setProperty('--drift', `${Math.random() * 180 - 90}px`);
      els['effect-layer'].append(piece);
      piece.addEventListener('animationend', () => piece.remove(), { once: true });
      window.setTimeout(() => piece.remove(), 3000);
    }
  }

  function ensureAudio() {
    if (state.audio === false) return null;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      return audioContext;
    } catch (_error) {
      return null;
    }
  }

  function tone(ctx, at, frequency, duration, gain, type = 'sine') {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, at);
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  function playSound(kind) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + 0.015;
    if (kind === 'correct') {
      tone(ctx, now, 440, .09, .06, 'triangle');
      tone(ctx, now + .08, 660, .13, .055, 'triangle');
    } else if (kind === 'wrong') {
      tone(ctx, now, 220, .12, .055, 'sawtooth');
      tone(ctx, now + .09, 150, .18, .045, 'square');
    } else if (kind === 'success') {
      [392, 523.25, 659.25, 783.99].forEach((freq, i) => tone(ctx, now + i * .085, freq, .22, .05, 'triangle'));
    } else if (kind === 'fail') {
      [220, 196, 174.61, 130.81].forEach((freq, i) => tone(ctx, now + i * .13, freq, .24, .045, 'sawtooth'));
    }
  }

  function closeAudio() {
    if (!audioContext) return;
    const ctx = audioContext;
    audioContext = null;
    ctx.close?.().catch?.(() => {});
  }

  function toggleAudio() {
    state.audio = !state.audio;
    persistState();
    renderAudioToggle();
    if (!state.audio) closeAudio();
    announce(state.audio ? 'Töne eingeschaltet.' : 'Töne ausgeschaltet.');
  }

  function resetProgress() {
    const confirmed = window.confirm('Wirklich alle bestandenen Stages und Statistiken in diesem Browser löschen?');
    if (!confirmed) return;
    state = defaultState();
    persistState();
    renderAudioToggle();
    showMap({ focus: false });
    announce('Quizfortschritt gelöscht.');
  }

  els['audio-toggle'].addEventListener('click', toggleAudio);
  els['reset-progress'].addEventListener('click', resetProgress);
  els['back-to-map'].addEventListener('click', () => showMap());
  els['next-question'].addEventListener('click', nextQuestion);
  els['result-map'].addEventListener('click', () => showMap());
  window.addEventListener('pagehide', closeAudio, { once: true });

  els['structure-note'].textContent = data.structureNote;
  els['legal-as-of'].textContent = data.legalAsOf;
  els['storage-warning'].hidden = storageAvailable;
  renderCoreSources();
  renderAudioToggle();
  renderStats();
  renderStageMap();
})();
