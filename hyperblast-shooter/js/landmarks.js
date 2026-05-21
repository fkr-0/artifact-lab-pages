const WORLD_PALETTES = Object.freeze({
  'neon-drift': { primary: '#00ccff', secondary: '#ff00ff', accent: '#ffff66', dark: '#051024' },
  'ember-belt': { primary: '#ff8a2a', secondary: '#ff3355', accent: '#ffd166', dark: '#1b0b08' },
  'verdant-ion-reef': { primary: '#3dff9a', secondary: '#00e5ff', accent: '#d6ff7f', dark: '#06180f' },
  'violet-singularity': { primary: '#b46cff', secondary: '#ff55dd', accent: '#99ccff', dark: '#10071f' },
  'frozen-relay': { primary: '#9de7ff', secondary: '#6f9bff', accent: '#ffffff', dark: '#061322' },
});

const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[char]));

function baseSvg(worldId, title, body) {
  const palette = WORLD_PALETTES[worldId] || WORLD_PALETTES['neon-drift'];
  return `
    <svg class="dock-landmark-svg" data-landmark-world="${esc(worldId)}" viewBox="0 0 360 150" role="img" aria-label="${esc(title)} procedural dock landmark" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow-${esc(worldId)}" cx="50%" cy="48%" r="65%">
          <stop offset="0" stop-color="${palette.primary}" stop-opacity="0.34"/>
          <stop offset="1" stop-color="${palette.dark}" stop-opacity="0.06"/>
        </radialGradient>
        <filter id="soft-${esc(worldId)}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect x="0" y="0" width="360" height="150" rx="16" fill="${palette.dark}"/>
      <rect x="8" y="8" width="344" height="134" rx="14" fill="url(#glow-${esc(worldId)})" stroke="${palette.primary}" stroke-opacity="0.28"/>
      <g filter="url(#soft-${esc(worldId)})">
        ${body(palette)}
      </g>
      <text x="18" y="132" fill="${palette.accent}" font-family="monospace" font-size="11" opacity="0.9">${esc(title)}</text>
    </svg>
  `;
}

const LANDMARK_RENDERERS = Object.freeze({
  'neon-drift': () => baseSvg('neon-drift', 'Caldera Mile Toll Arch', (p) => `
    <path d="M50 112 C78 42 124 42 152 112" fill="none" stroke="${p.primary}" stroke-width="6" stroke-linecap="round" opacity="0.88"/>
    <path d="M208 112 C236 42 282 42 310 112" fill="none" stroke="${p.secondary}" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
    <line x1="66" y1="94" x2="296" y2="94" stroke="${p.primary}" stroke-width="2" stroke-dasharray="9 8" opacity="0.78"/>
    <circle cx="180" cy="80" r="18" fill="none" stroke="${p.accent}" stroke-width="3" opacity="0.9"/>
    <path d="M25 118 L335 118" stroke="${p.primary}" stroke-width="2" opacity="0.35"/>
    <path d="M90 118 L130 58 L170 118 M210 118 L250 58 L290 118" stroke="${p.secondary}" stroke-width="2" fill="none" opacity="0.45"/>
  `),
  'ember-belt': () => baseSvg('ember-belt', 'Thermal Gate Dock', (p) => `
    <path d="M38 116 L92 42 L146 116 Z" fill="${p.primary}" opacity="0.20" stroke="${p.primary}" stroke-width="3"/>
    <path d="M214 116 L268 42 L322 116 Z" fill="${p.secondary}" opacity="0.18" stroke="${p.secondary}" stroke-width="3"/>
    <path d="M130 112 C150 74 210 74 230 112" fill="none" stroke="${p.accent}" stroke-width="6" stroke-linecap="round" opacity="0.86"/>
    <path d="M74 118 C100 95 122 95 148 118 M212 118 C238 95 260 95 286 118" stroke="${p.primary}" stroke-width="2" fill="none" opacity="0.58"/>
    <circle cx="180" cy="80" r="10" fill="${p.accent}" opacity="0.78"/>
    <path d="M55 126 H305" stroke="${p.accent}" stroke-width="2" stroke-dasharray="4 6" opacity="0.5"/>
  `),
  'verdant-ion-reef': () => baseSvg('verdant-ion-reef', 'Ion Coral Relay', (p) => `
    <path d="M78 118 C88 86 78 62 102 38 C106 70 126 78 124 118" fill="none" stroke="${p.primary}" stroke-width="6" stroke-linecap="round" opacity="0.78"/>
    <path d="M166 118 C168 84 150 58 178 32 C184 70 208 80 204 118" fill="none" stroke="${p.secondary}" stroke-width="6" stroke-linecap="round" opacity="0.76"/>
    <path d="M248 118 C266 90 254 62 286 44 C282 78 304 88 300 118" fill="none" stroke="${p.primary}" stroke-width="6" stroke-linecap="round" opacity="0.72"/>
    <circle cx="180" cy="78" r="28" fill="none" stroke="${p.accent}" stroke-width="2" stroke-dasharray="8 6" opacity="0.86"/>
    <circle cx="180" cy="78" r="8" fill="${p.accent}" opacity="0.8"/>
    <path d="M42 122 C98 110 132 128 178 118 C226 108 266 124 322 116" stroke="${p.secondary}" stroke-width="2" fill="none" opacity="0.5"/>
  `),
  'violet-singularity': () => baseSvg('violet-singularity', 'Gravity Lens Array', (p) => `
    <ellipse cx="180" cy="78" rx="74" ry="30" fill="none" stroke="${p.primary}" stroke-width="4" opacity="0.78"/>
    <ellipse cx="180" cy="78" rx="44" ry="82" fill="none" stroke="${p.secondary}" stroke-width="3" opacity="0.56" transform="rotate(64 180 78)"/>
    <ellipse cx="180" cy="78" rx="44" ry="82" fill="none" stroke="${p.accent}" stroke-width="2" opacity="0.44" transform="rotate(-64 180 78)"/>
    <circle cx="180" cy="78" r="18" fill="${p.dark}" stroke="${p.primary}" stroke-width="4"/>
    <circle cx="180" cy="78" r="6" fill="${p.accent}" opacity="0.9"/>
    <path d="M48 120 C112 100 248 100 312 120" stroke="${p.primary}" stroke-width="2" fill="none" stroke-dasharray="7 8" opacity="0.55"/>
  `),
  'frozen-relay': () => baseSvg('frozen-relay', 'Relay Antenna Cathedral', (p) => `
    <path d="M180 30 L204 118 H156 Z" fill="${p.primary}" opacity="0.18" stroke="${p.primary}" stroke-width="3"/>
    <path d="M86 118 L130 58 L174 118 M186 118 L230 58 L274 118" fill="none" stroke="${p.secondary}" stroke-width="3" opacity="0.72"/>
    <line x1="180" y1="30" x2="180" y2="116" stroke="${p.accent}" stroke-width="2" opacity="0.9"/>
    <path d="M128 50 C156 30 204 30 232 50 M108 70 C148 42 212 42 252 70" fill="none" stroke="${p.accent}" stroke-width="2" opacity="0.48"/>
    <path d="M40 122 C94 114 122 130 178 118 C238 106 270 126 320 116" stroke="${p.primary}" stroke-width="2" fill="none" opacity="0.5"/>
    <circle cx="180" cy="62" r="9" fill="${p.accent}" opacity="0.85"/>
  `),
});

export function renderDockLandmark(worldId) {
  return (LANDMARK_RENDERERS[worldId] || LANDMARK_RENDERERS['neon-drift'])();
}

export function landmarkIds() {
  return Object.keys(LANDMARK_RENDERERS);
}
