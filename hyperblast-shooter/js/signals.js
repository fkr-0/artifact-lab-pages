export const LOCAL_SIGNALS = Object.freeze([
  {
    id: 'caldera-mile-dispatch',
    worldId: 'neon-drift',
    speaker: 'COMMAND',
    title: 'Caldera Mile Dispatch',
    questId: 'trace-drift-beacons',
    lines: {
      available: [
        'Pilot, the distress route keeps folding back on itself.',
        'Trace the beacons before the rogues learn we are listening.',
      ],
      active: [
        'Your quest log has the beacon task. Start with the local signal puzzle.',
        'The drift lanes are quiet while you are in Explore mode. Use that time.',
      ],
      complete: [
        'Clean lock received. Those ships were coordinating through the beacons.',
        'Command is updating the map with your Caldera Mile lead.',
      ],
    },
  },
  {
    id: 'doc-thermal-relay',
    worldId: 'ember-belt',
    speaker: 'DOC',
    title: 'Doc on Thermal Relay',
    questId: 'cool-ember-noise',
    lines: {
      available: [
        'That heat noise is not random. It is covering a carrier wave.',
        'Give me a clean filter and I can tell whether Unknown is real.',
      ],
      active: [
        'Adjust frequency first, then phase. The glyph is your local anchor.',
        'Do not rush it. This is why we added Explore mode.',
      ],
      complete: [
        'There it is. Unknown punched through the Ember haze on purpose.',
        'I archived the burst under heat-haze-signal.',
      ],
    },
  },
  {
    id: 'reef-whisper',
    worldId: 'verdant-ion-reef',
    speaker: 'UNKNOWN',
    title: 'Reef Whisper',
    questId: 'map-ion-reef-pulse',
    lines: {
      available: [
        'The reef is a lock, not a landmark.',
        'Map its pulse and you will see why Viper came this way.',
      ],
      active: [
        'Do not fight the rhythm. Match it.',
        'The lattice wakes when pilots mistake curiosity for conquest.',
      ],
      complete: [
        'You heard it. Ancient energy, disciplined and waiting.',
        'Now ask yourself who Viper thought he was containing.',
      ],
    },
  },
  {
    id: 'command-gravity-watch',
    worldId: 'violet-singularity',
    speaker: 'COMMAND',
    title: 'Gravity Watch',
    questId: 'align-violet-lens',
    lines: {
      available: [
        'The singularity is reflecting old broadcasts into present space.',
        'Align the lens and confirm whether that is Viper or an echo wearing his voice.',
      ],
      active: [
        'You have time. The lens is stable as long as enemy pressure stays paused.',
        'Report anything that sounds like a command signature.',
      ],
      complete: [
        'Confirmed. The voice is Viper, but the timestamp is wrong.',
        'Command is marking this as proof, not explanation.',
      ],
    },
  },
  {
    id: 'doc-frozen-archive',
    worldId: 'frozen-relay',
    speaker: 'DOC',
    title: 'Frozen Archive Tap',
    questId: 'restore-frozen-archive',
    lines: {
      available: [
        'The relay archive is iced over, but it still has a heartbeat.',
        'Restore the packet and we may learn why everyone keeps warning you away.',
      ],
      active: [
        'Take it slowly. Frozen systems break when you brute-force them.',
        'If the glyph authenticates, I can separate Viper logs from relay noise.',
      ],
      complete: [
        'Archive restored. The warning is older than Viper.',
        'I do not like what that implies, pilot.',
      ],
    },
  },
]);

export function signalsForWorld(worldId) {
  return LOCAL_SIGNALS.filter((signal) => signal.worldId === worldId);
}

export function signalStatus(signal, questState) {
  const status = questState?.questStatusById?.[signal.questId] || 'available';
  return status === 'complete' ? 'complete' : status === 'active' ? 'active' : 'available';
}

export function signalLinesForState(signal, questState) {
  const status = signalStatus(signal, questState);
  return signal.lines[status] || signal.lines.available || [];
}

export function getSignal(signalId) {
  return LOCAL_SIGNALS.find((signal) => signal.id === signalId) || null;
}
