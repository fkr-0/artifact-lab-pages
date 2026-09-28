const ARCADE_TOOLS = Object.freeze([
  {
    id: 'sprite-fan-atlas-studio',
    label: 'Sprite Atlas Studio',
    description: 'Slice, clean, review, assemble, inspect, and export production sprite atlases.',
    capability: 'atlas production',
  },
  {
    id: 'badger-sprawl-runner',
    label: 'Badger runtime',
    description: 'Variable-grid sprite contracts, runtime atlas inspection, reload diagnostics, and animation playback.',
    capability: 'runtime validation',
  },
  {
    id: 'ethic-brawl',
    label: 'Ethic Brawl',
    description: 'Animation-v2 consumer integration and sprite production compatibility surface.',
    capability: 'consumer integration',
  },
  {
    id: 'hyperblast-shooter',
    label: 'Hyperblast',
    description: 'Ship-atlas adapter and Arcade production-train validation target.',
    capability: 'arcade adapter',
  },
]);

export function resolveArcadeTools(items = []) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ARCADE_TOOLS.map((tool) => {
    const artifact = byId.get(tool.id) || null;
    return {
      ...tool,
      artifact,
      available: Boolean(artifact?.url),
      availability: artifact?.availability || 'not-cataloged',
    };
  });
}

export function arcadeCapabilitySummary(items = []) {
  const tools = resolveArcadeTools(items);
  return {
    tools,
    available: tools.filter((tool) => tool.available).length,
    total: tools.length,
  };
}
