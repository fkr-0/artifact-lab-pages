// artifact-motion.js
// Dependency-free native-feel interaction layer for artifacts.
// The library owns feel; the app owns rules.

const noop = () => {};
const defaultPoint = event => ({ x: event.clientX, y: event.clientY });

export function createArtifactMotion(userConfig) {
  const cfg = {
    root: document,
    draggable: '[data-am-draggable]',
    dropTarget: '[data-am-drop-target]',
    threshold: 10,
    stiffness: 0.24,
    friction: 0.70,
    stackOffset: 18,
    edgeScroll: true,
    edgeMargin: 78,
    edgeSpeed: 16,
    sound: true,
    haptics: true,
    hideSource: true,
    magneticTargets: true,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    getItems: ({ sourceEl }) => [sourceEl],
    canDrop: () => true,
    onDrop: noop,
    onCancel: noop,
    onDragStart: noop,
    onDragMove: noop,
    onDragEnd: noop,
    getSnapPoint: ({ targetEl, event }) => targetEl ? rectCenter(targetEl.getBoundingClientRect()) : defaultPoint(event),
    getOriginPoint: ({ sourceEl }) => rectCenter(sourceEl.getBoundingClientRect()),
    renderGhostItem: ({ item }) => item instanceof Element ? item.cloneNode(true) : null,
    ...userConfig,
  };

  if (!cfg.root) throw new Error('createArtifactMotion requires a root element');

  const state = { drag: null, targetEl: null, destroyed: false };
  let audioCtx = null;

  function ping(type = 'tap', velocity = 0) {
    if (cfg.sound) {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = type === 'snap'
          ? 420 + Math.random() * 12
          : type === 'bad'
            ? 150 + Math.random() * 10
            : 260 + Math.random() * 8;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        gain.gain.exponentialRampToValueAtTime(type === 'snap' ? 0.034 : 0.018, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'snap' ? 0.08 : 0.12));
        osc.start(now);
        osc.stop(now + 0.14);
      } catch {}
    }

    if (cfg.haptics && navigator.vibrate) {
      const vib = Math.round(Math.min(30, 8 + velocity / 25));
      navigator.vibrate(type === 'snap' ? vib : type === 'bad' ? [18, 24, 18] : 8);
    }
  }

  function onPointerDown(event) {
    if (state.destroyed || event.button > 0) return;
    const sourceEl = event.target.closest?.(cfg.draggable);
    if (!sourceEl || !cfg.root.contains(sourceEl)) return;
    state.drag = {
      sourceEl,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      tx: event.clientX,
      ty: event.clientY,
      vx: 0,
      vy: 0,
      active: false,
      items: [],
      layer: null,
      raf: 0,
      origin: cfg.getOriginPoint({ sourceEl, event }),
    };
  }

  function onPointerMove(event) {
    const drag = state.drag;
    if (!drag) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.active && Math.hypot(dx, dy) >= cfg.threshold) {
      startDrag(event, drag);
    }

    if (!drag.active) return;
    event.preventDefault();

    drag.tx = event.clientX;
    drag.ty = event.clientY;
    if (cfg.edgeScroll) edgeScroll(event.clientX, event.clientY);

    const targetEl = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(cfg.dropTarget) || null;
    updateTarget(targetEl, event);
    cfg.onDragMove({ event, sourceEl: drag.sourceEl, items: drag.items, targetEl: state.targetEl, velocity: velocity(drag) });
  }

  function onPointerUp(event) {
    const drag = state.drag;
    if (!drag) return;

    if (!drag.active) {
      state.drag = null;
      return;
    }

    const targetEl = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(cfg.dropTarget) || null;
    const ok = targetEl && cfg.canDrop({ event, sourceEl: drag.sourceEl, items: drag.items, targetEl, velocity: velocity(drag) });
    clearTarget();

    if (ok) {
      const point = cfg.getSnapPoint({ event, sourceEl: drag.sourceEl, items: drag.items, targetEl, velocity: velocity(drag) });
      snapTo(drag, point, 'snap', () => {
        revealSources(drag);
        cfg.onDrop({ event, sourceEl: drag.sourceEl, items: drag.items, targetEl, velocity: velocity(drag) });
        cfg.onDragEnd({ event, sourceEl: drag.sourceEl, items: drag.items, targetEl, dropped: true });
      });
    } else {
      snapTo(drag, drag.origin, 'snap-back', () => {
        revealSources(drag);
        cfg.onCancel({ event, sourceEl: drag.sourceEl, items: drag.items });
        cfg.onDragEnd({ event, sourceEl: drag.sourceEl, items: drag.items, targetEl: null, dropped: false });
      });
    }

    state.drag = null;
  }

  function onPointerCancel(event) {
    const drag = state.drag;
    if (!drag) return;
    clearTarget();
    if (drag.active) {
      snapTo(drag, drag.origin, 'snap-back', () => {
        revealSources(drag);
        cfg.onCancel({ event, sourceEl: drag.sourceEl, items: drag.items });
      });
    }
    state.drag = null;
  }

  function startDrag(event, drag) {
    drag.active = true;
    drag.items = normalizeItems(cfg.getItems({ event, sourceEl: drag.sourceEl }));
    drag.layer = makeGhostLayer(drag);
    if (cfg.hideSource) hideSources(drag);
    startSpring(drag);
    ping('tap', 0);
    cfg.onDragStart({ event, sourceEl: drag.sourceEl, items: drag.items });
  }

  function makeGhostLayer(drag) {
    const sourceRect = drag.sourceEl.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'am-ghost-layer';
    layer.style.width = `${sourceRect.width}px`;
    layer.style.height = `${sourceRect.height + Math.max(0, drag.items.length - 1) * cfg.stackOffset}px`;

    drag.items.forEach((item, index) => {
      const ghost = cfg.renderGhostItem({ item, index, sourceEl: drag.sourceEl, items: drag.items }) || drag.sourceEl.cloneNode(true);
      ghost.classList.add('am-ghost-item');
      ghost.style.width = `${sourceRect.width}px`;
      ghost.style.height = `${sourceRect.height}px`;
      ghost.style.left = '0px';
      ghost.style.top = `${index * cfg.stackOffset}px`;
      ghost.style.transform = `rotate(${(index - (drag.items.length - 1) / 2) * 0.65}deg)`;
      layer.appendChild(ghost);
    });

    document.body.appendChild(layer);
    return layer;
  }

  function startSpring(drag) {
    if (cfg.reducedMotion) {
      drag.raf = requestAnimationFrame(() => renderGhost(drag));
      return;
    }
    const step = () => {
      drag.vx = (drag.vx + (drag.tx - drag.x) * cfg.stiffness) * cfg.friction;
      drag.vy = (drag.vy + (drag.ty - drag.y) * cfg.stiffness) * cfg.friction;
      drag.x += drag.vx;
      drag.y += drag.vy;
      renderGhost(drag);
      drag.raf = requestAnimationFrame(step);
    };
    drag.raf = requestAnimationFrame(step);
  }

  function renderGhost(drag) {
    if (!drag.layer) return;
    const speed = velocity(drag);
    const rot = clamp(drag.vx * 0.08, -8, 8);
    const skew = clamp(drag.vx * 0.035, -5, 5);
    const lift = 1.035 + Math.min(0.035, speed / 900);
    drag.layer.style.transform = `translate3d(${drag.x - drag.layer.offsetWidth / 2}px,${drag.y - 28}px,0) rotate(${rot}deg) skewX(${skew}deg) scale(${lift})`;
    drag.layer.querySelectorAll('.am-ghost-item').forEach((node, index) => {
      node.style.setProperty('--am-light-x', `${clamp(50 + drag.vx * 0.35, 18, 82)}%`);
      node.style.setProperty('--am-light-y', `${clamp(30 + drag.vy * 0.18 + index * 3, 12, 70)}%`);
      node.style.setProperty('--am-light-opacity', String(clamp(0.28 + speed / 700, 0.22, 0.62)));
    });
  }

  function snapTo(drag, point, kind, done) {
    if (drag.raf) cancelAnimationFrame(drag.raf);
    const speed = velocity(drag);
    const duration = cfg.reducedMotion ? 0 : kind === 'snap-back'
      ? clamp(340 - speed * 0.08, 220, 390)
      : clamp(230 - speed * 0.07, 120, 260);

    drag.layer.classList.add(kind === 'snap' ? 'am-snap' : 'am-snap-back');
    drag.layer.style.transition = duration
      ? `transform ${duration}ms ${kind === 'snap-back' ? 'cubic-bezier(.22,1.35,.36,1)' : 'cubic-bezier(.2,.9,.25,1.18)'}, opacity .18s ease`
      : 'none';
    drag.layer.style.transform = `translate3d(${point.x - drag.layer.offsetWidth / 2}px,${point.y - 28}px,0) rotate(0deg) skewX(0deg) scale(${kind === 'snap-back' ? 0.98 : 1})`;
    if (kind === 'snap-back') drag.layer.style.opacity = '0.72';
    ping(kind === 'snap-back' ? 'bad' : 'snap', speed);
    setTimeout(() => {
      drag.layer?.remove();
      done?.();
    }, duration + 35);
  }

  function updateTarget(targetEl, event) {
    if (targetEl && !cfg.root.contains(targetEl)) targetEl = null;
    const drag = state.drag;
    const ok = targetEl && drag && cfg.canDrop({ event, sourceEl: drag.sourceEl, items: drag.items, targetEl, velocity: velocity(drag) });
    clearTarget();
    if (ok) {
      state.targetEl = targetEl;
      targetEl.classList.add('am-drop-ok');
      if (cfg.magneticTargets) targetEl.classList.add('am-target-magnet');
    }
  }

  function clearTarget() {
    if (!state.targetEl) return;
    state.targetEl.classList.remove('am-drop-ok', 'am-target-magnet');
    state.targetEl = null;
  }

  function hideSources(drag) {
    drag.items.forEach(item => {
      if (item instanceof Element) item.classList.add('am-drag-source-hidden');
    });
  }

  function revealSources(drag) {
    drag.items.forEach(item => {
      if (item instanceof Element) item.classList.remove('am-drag-source-hidden');
    });
  }

  function edgeScroll(x, y) {
    const m = cfg.edgeMargin;
    const s = cfg.edgeSpeed;
    if (y < m) window.scrollBy(0, -s);
    else if (y > window.innerHeight - m) window.scrollBy(0, s);
    if (x < m) window.scrollBy(-s, 0);
    else if (x > window.innerWidth - m) window.scrollBy(s, 0);
  }

  function destroy() {
    state.destroyed = true;
    cfg.root.removeEventListener('pointerdown', onPointerDown);
    cfg.root.removeEventListener('pointermove', onPointerMove);
    cfg.root.removeEventListener('pointerup', onPointerUp);
    cfg.root.removeEventListener('pointercancel', onPointerCancel);
    clearTarget();
    if (state.drag?.raf) cancelAnimationFrame(state.drag.raf);
    state.drag?.layer?.remove();
    state.drag = null;
  }

  cfg.root.addEventListener('pointerdown', onPointerDown);
  cfg.root.addEventListener('pointermove', onPointerMove, { passive: false });
  cfg.root.addEventListener('pointerup', onPointerUp);
  cfg.root.addEventListener('pointercancel', onPointerCancel);

  return { destroy, config: cfg };
}

export function rectCenter(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function normalizeItems(items) {
  if (items == null) return [];
  return Array.isArray(items) ? items : [items];
}

function velocity(drag) {
  return Math.hypot(drag?.vx || 0, drag?.vy || 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
