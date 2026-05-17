export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createResizablePanels({ root, handles = [], runtime = globalThis, storage = runtime.localStorage } = {}) {
  if (!root) throw new Error('createResizablePanels requires a root element');
  const apply = ({ variable, value, unit = 'px', storageKey }) => {
    const cssValue = `${value}${unit}`;
    root.style.setProperty(variable, cssValue);
    if (storageKey && storage?.setItem) storage.setItem(storageKey, cssValue);
  };
  const restore = ({ variable, storageKey, unit = 'px', min = 0, max = 9999 }) => {
    const saved = storageKey && storage?.getItem?.(storageKey);
    if (!saved) return;
    const pattern = new RegExp(`^(-?\\d+(?:\\.\\d+)?)${unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const match = String(saved).trim().match(pattern);
    if (!match) return;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return;
    const clamped = Number(clamp(value, min, max).toFixed(3)).toString();
    root.style.setProperty(variable, `${clamped}${unit}`);
  };

  for (const cfg of handles) {
    const { handle, axis = 'x', variable, min = 0, max = 9999, unit = 'px', toValue, storageKey } = cfg;
    if (!handle || !variable) continue;
    restore(cfg);
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault?.();
      handle.setPointerCapture?.(event.pointerId);
      const move = (moveEvent) => {
        const raw = toValue ? toValue(moveEvent) : (axis === 'x' ? moveEvent.clientX : moveEvent.clientY);
        const value = Number(clamp(raw, min, max).toFixed(3)).toString();
        apply({ variable, value, unit, storageKey });
      };
      const up = () => {
        runtime.removeEventListener?.('pointermove', move);
        runtime.removeEventListener?.('pointerup', up);
      };
      runtime.addEventListener?.('pointermove', move);
      runtime.addEventListener?.('pointerup', up);
      move(event);
    });
  }
}
