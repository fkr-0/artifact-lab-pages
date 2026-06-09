export const ACTION_LABELS = Object.freeze({
  moveUp: 'Move Up',
  moveDown: 'Move Down',
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  fire: 'Fire',
  turret: 'Deploy Turret',
  weapon: 'Cycle Weapon',
});

export const ACTION_ORDER = Object.freeze([
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'fire',
  'turret',
  'weapon',
]);

export const DEFAULT_KEY_BINDINGS = Object.freeze({
  moveUp: ['ArrowUp', 'KeyW'],
  moveDown: ['ArrowDown', 'KeyS'],
  moveLeft: ['ArrowLeft', 'KeyA'],
  moveRight: ['ArrowRight', 'KeyD'],
  fire: ['Space'],
  turret: ['KeyT'],
  weapon: ['KeyQ'],
});

export const CONTROL_SCHEME_BINDINGS = Object.freeze({
  wasd: {
    moveUp: ['KeyW'],
    moveDown: ['KeyS'],
    moveLeft: ['KeyA'],
    moveRight: ['KeyD'],
    fire: ['Space'],
    turret: ['KeyT'],
    weapon: ['KeyQ'],
  },
  arrows: {
    moveUp: ['ArrowUp'],
    moveDown: ['ArrowDown'],
    moveLeft: ['ArrowLeft'],
    moveRight: ['ArrowRight'],
    fire: ['Space'],
    turret: ['KeyT'],
    weapon: ['KeyQ'],
  },
  ijkl: {
    moveUp: ['KeyI'],
    moveDown: ['KeyK'],
    moveLeft: ['KeyJ'],
    moveRight: ['KeyL'],
    fire: ['Space'],
    turret: ['KeyT'],
    weapon: ['KeyQ'],
  },
});

export function normalizeKeyBindings(input = DEFAULT_KEY_BINDINGS) {
  const source = input && typeof input === 'object' ? input : DEFAULT_KEY_BINDINGS;
  const normalized = {};

  for (const action of ACTION_ORDER) {
    const raw = source[action];
    const values = Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
    const clean = [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
    normalized[action] = clean.length ? clean : [...DEFAULT_KEY_BINDINGS[action]];
  }

  return normalized;
}

export function bindingsForControlScheme(controlScheme = 'wasd') {
  return normalizeKeyBindings(CONTROL_SCHEME_BINDINGS[controlScheme] || DEFAULT_KEY_BINDINGS);
}

export function rebindKey(bindings, action, code) {
  const normalized = normalizeKeyBindings(bindings);
  if (!ACTION_ORDER.includes(action)) return normalized;
  const cleanCode = String(code || '').trim();
  if (!cleanCode) return normalized;

  for (const key of ACTION_ORDER) {
    normalized[key] = normalized[key].filter((value) => value !== cleanCode);
  }
  normalized[action] = [cleanCode];
  return normalized;
}

export function actionForKeyCode(code, bindings = DEFAULT_KEY_BINDINGS) {
  const cleanCode = String(code || '').trim();
  if (!cleanCode) return null;
  const normalized = normalizeKeyBindings(bindings);
  return ACTION_ORDER.find((action) => normalized[action].includes(cleanCode)) || null;
}

export function keyLabel(code) {
  const value = String(code || '').trim();
  if (!value) return 'Unbound';
  if (value === 'Space') return 'Space';
  if (value === 'Enter') return 'Enter';
  if (value.startsWith('Arrow')) return value.replace('Arrow', 'Arrow ');
  if (value.startsWith('Key')) return value.slice(3);
  if (value.startsWith('Digit')) return value.slice(5);
  return value;
}

export function keyBindingsSummary(bindings = DEFAULT_KEY_BINDINGS) {
  const normalized = normalizeKeyBindings(bindings);
  return Object.fromEntries(ACTION_ORDER.map((action) => [
    action,
    normalized[action].map(keyLabel).join(' / '),
  ]));
}
