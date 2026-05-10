export const themes = [
  { id: 'nexus', title: 'NEXUS', mood: 'clean cyan control room', tokens: { accent: '#00ffff', background: '#060713', surface: 'rgba(5,16,28,.74)', panel: 'rgba(0,0,0,.34)', text: '#e8fbff', muted: 'rgba(232,251,255,.68)', glow: 'rgba(0,255,255,.22)' } },
  { id: 'synthwave', title: 'Synthwave', mood: 'hot magenta arcade dusk', tokens: { accent: '#ff4fd8', background: '#15051f', surface: 'rgba(40,5,56,.78)', panel: 'rgba(17,2,28,.62)', text: '#fff0fb', muted: 'rgba(255,240,251,.68)', glow: 'rgba(255,79,216,.26)' } },
  { id: 'cyberpunk', title: 'Cyberpunk', mood: 'yellow hazard terminal', tokens: { accent: '#ffee00', background: '#120f00', surface: 'rgba(36,30,0,.78)', panel: 'rgba(0,0,0,.48)', text: '#fffbd0', muted: 'rgba(255,251,208,.66)', glow: 'rgba(255,238,0,.22)' } },
  { id: 'retro8bit', title: 'Retro 8-Bit', mood: 'green phosphor pixel board', tokens: { accent: '#7cff00', background: '#080b05', surface: 'rgba(10,27,8,.78)', panel: 'rgba(0,0,0,.42)', text: '#efffe8', muted: 'rgba(239,255,232,.64)', glow: 'rgba(124,255,0,.20)' } },
  { id: 'midnight', title: 'Midnight', mood: 'blue low-light cockpit', tokens: { accent: '#8bbcff', background: '#050817', surface: 'rgba(8,16,42,.78)', panel: 'rgba(0,0,0,.42)', text: '#eef5ff', muted: 'rgba(238,245,255,.68)', glow: 'rgba(139,188,255,.24)' } },
  { id: 'vaporwave', title: 'Vaporwave', mood: 'violet glass sunset', tokens: { accent: '#80f7ff', background: '#1b0730', surface: 'rgba(46,15,72,.78)', panel: 'rgba(14,2,26,.52)', text: '#f8ecff', muted: 'rgba(248,236,255,.68)', glow: 'rgba(128,247,255,.23)' } },
  { id: 'neon-rust', title: 'Neon Rust', mood: 'orange industrial console', tokens: { accent: '#ff7a3d', background: '#170806', surface: 'rgba(47,16,10,.80)', panel: 'rgba(0,0,0,.48)', text: '#fff1eb', muted: 'rgba(255,241,235,.66)', glow: 'rgba(255,122,61,.24)' } },
  { id: 'matrix', title: 'Matrix', mood: 'green rain operator', tokens: { accent: '#00ff88', background: '#020805', surface: 'rgba(2,28,14,.80)', panel: 'rgba(0,0,0,.50)', text: '#e9fff4', muted: 'rgba(233,255,244,.64)', glow: 'rgba(0,255,136,.24)' } },
];

export function themeById(id) {
  return themes.find((theme) => theme.id === id) || themes[0];
}

export function cssVarsForTheme(theme) {
  const tokens = theme.tokens || {};
  return {
    '--hub-accent': tokens.accent || theme.accent || '#00ffff',
    '--hub-background': tokens.background || theme.background || '#060713',
    '--hub-surface': tokens.surface || 'rgba(5,16,28,.74)',
    '--hub-panel': tokens.panel || 'rgba(0,0,0,.34)',
    '--hub-text': tokens.text || '#e8fbff',
    '--hub-muted': tokens.muted || 'rgba(232,251,255,.68)',
    '--hub-glow': tokens.glow || 'rgba(0,255,255,.22)',
  };
}

export function applyThemeTokens(id, root = globalThis.document?.documentElement) {
  const theme = themeById(id);
  const vars = cssVarsForTheme(theme);
  for (const [key, value] of Object.entries(vars)) root?.style?.setProperty(key, value);
  root?.setAttribute?.('data-theme', theme.id);
  root?.setAttribute?.('data-theme-mood', theme.mood || theme.title);
  return theme;
}

export const applyTheme = applyThemeTokens;

export function buildThemeStyleText(themeList = themes) {
  return themeList.map((theme) => {
    const vars = cssVarsForTheme(theme);
    const declarations = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`).join('\n');
    return `[data-theme="${theme.id}"] {\n${declarations}\n}`;
  }).join('\n\n');
}
