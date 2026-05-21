export const SIGNAL_PUZZLES = Object.freeze([
  {
    id: 'neon-drift-beacon-triangulation',
    worldId: 'neon-drift',
    title: 'Beacon Triangulation',
    family: 'signal-routing',
    prompt: 'Tune the drift beacon until the distress carrier forms a clean route.',
    target: { frequency: 117, phase: 42, glyph: 'DRIFT' },
    reward: { money: 80, intel: 'caldera-mile-distress-pattern' },
  },
  {
    id: 'ember-belt-thermal-filter',
    worldId: 'ember-belt',
    title: 'Thermal Noise Filter',
    family: 'sensor-filtering',
    prompt: 'Cool the signal path and isolate the first Unknown burst from the heat haze.',
    target: { frequency: 211, phase: 66, glyph: 'EMBER' },
    reward: { money: 95, intel: 'unknown-heat-haze-burst' },
  },
  {
    id: 'verdant-ion-reef-resonance',
    worldId: 'verdant-ion-reef',
    title: 'Reef Resonance Lock',
    family: 'resonance-matching',
    prompt: 'Match the living gate pulse without waking the reef lattice.',
    target: { frequency: 144, phase: 88, glyph: 'REEF' },
    reward: { money: 110, intel: 'ancient-ion-lattice-map' },
  },
  {
    id: 'violet-singularity-lens',
    worldId: 'violet-singularity',
    title: 'Gravity Lens Alignment',
    family: 'orbit-planning',
    prompt: 'Align the lens and verify whether Viper is broadcasting through time-slip echo.',
    target: { frequency: 303, phase: 27, glyph: 'VIPER' },
    reward: { money: 130, intel: 'viper-time-slip-echo' },
  },
  {
    id: 'frozen-relay-archive',
    worldId: 'frozen-relay',
    title: 'Frozen Relay Archive',
    family: 'archive-reconstruction',
    prompt: 'Restore the relay packet and authenticate the warning hidden below the ice.',
    target: { frequency: 189, phase: 73, glyph: 'RELAY' },
    reward: { money: 150, intel: 'relay-warning-fragment' },
  },
]);

export function getSignalPuzzleForWorld(worldId) {
  return SIGNAL_PUZZLES.find((puzzle) => puzzle.worldId === worldId) || SIGNAL_PUZZLES[0];
}

export function isPuzzleSolved(progress, puzzleId) {
  return Boolean(progress?.completedObjectiveIds?.includes(`puzzle:${puzzleId}`));
}

export function markPuzzleSolved(progress, puzzleId) {
  const completedObjectiveIds = new Set(progress?.completedObjectiveIds || []);
  completedObjectiveIds.add(`puzzle:${puzzleId}`);
  return {
    ...progress,
    completedObjectiveIds: [...completedObjectiveIds],
  };
}

export function evaluateSignalPuzzle(input, puzzle) {
  const target = puzzle.target;
  const frequency = Number(input.frequency);
  const phase = Number(input.phase);
  const glyph = String(input.glyph || '').trim().toUpperCase();
  const frequencyDelta = Math.abs(frequency - target.frequency);
  const phaseDelta = Math.abs(phase - target.phase);
  const glyphSolved = glyph === target.glyph;
  const solved = frequencyDelta <= 1 && phaseDelta <= 1 && glyphSolved;
  const score = Math.max(0, 100 - frequencyDelta * 2 - phaseDelta * 2 - (glyphSolved ? 0 : 35));
  const hint = solved
    ? `LOCKED: ${puzzle.reward.intel}`
    : glyphSolved
      ? 'Glyph accepted. Keep tuning carrier and phase.'
      : 'Glyph mismatch. Try the local world keyword shown in the signal noise.';
  return { solved, score, frequencyDelta, phaseDelta, glyphSolved, hint };
}
