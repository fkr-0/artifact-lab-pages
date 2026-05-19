// Game configuration constants
export const GAME_CONFIG = {
  // Network settings
  NETWORK_UPDATE_INTERVAL: 50, // 20 updates per second
  PLAYER_TIMEOUT: 5000, // 5 seconds

  // Canvas settings
  MIN_CANVAS_WIDTH: 640,
  MIN_CANVAS_HEIGHT: 400,

  // Player settings
  PLAYER_INITIAL_X: 50,
  PLAYER_MIN_Y: 20,
  PLAYER_FRICTION: 0.9,
  BASE_THRUST: 0.8,
  THRUST_PER_BOOST_LEVEL: 0.18,

  // Combat settings
  BASE_FIRE_COOLDOWN: 100, // ms
  MAX_BULLET_AGE: 100, // ms
  BULLET_SPREAD_MAX: 3,
  BULLET_SPREAD_GAP: 8,

  // Enemy settings
  ENEMY_SHOOT_COOLDOWN_BOSS: 750, // ms
  ENEMY_SHOOT_COOLDOWN_NORMAL: 2200, // ms
  ENEMY_PROJECTILE_SPEED: 3.5,
  ENEMY_COLLISION_DISTANCE: 25,
  PROJECTILE_COLLISION_DISTANCE: 18,

  // Visual settings
  PARTICLE_COUNT: 8,
  PARTICLE_LIFE: 30,
  PARTICLE_SPEED: 6,
  SHADOW_BLUR_PLAYER: 15,
  SHADOW_BLUR_BOSS: 20,
  SHADOW_BLUR_ENEMY: 8,
  SHADOW_BLUR_BULLET: 10,

  // UI settings
  NOTIFICATION_DURATION: 2000, // ms
  STORY_MESSAGE_DURATION: 5200, // ms
  MULTIPLAYER_START_DELAY: 500, // ms

  // Performance
  MAX_DELTA_MS: 50,
  TURRET_LIFE_MS: 12000,
};

// Stage themes with enhanced visual and audio feedback
export const STAGE_THEMES = [
  {
    name: 'Neon Drift',
    bg: '#080012',
    nebula: '#0cf',
    star: 'rgba(255,255,255,0.3)',
    lane: 'rgba(0,255,255,0.08)',
    story: 'The neon lights of the drift sector flicker as you begin your patrol. Reports of rogue ships have been increasing.',
    music: 'ambient',
    difficulty: 1.0
  },
  {
    name: 'Ember Belt',
    bg: '#140700',
    nebula: '#f60',
    star: 'rgba(255,180,90,0.45)',
    lane: 'rgba(255,96,0,0.11)',
    story: 'The heat of the Ember Belt warps your sensors. Something is drawing ships to this sector...',
    music: 'intense',
    difficulty: 1.2
  },
  {
    name: 'Verdant Ion Reef',
    bg: '#00120a',
    nebula: '#0f8',
    star: 'rgba(120,255,190,0.38)',
    lane: 'rgba(0,255,128,0.09)',
    story: 'Strange energy readings from the ancient reef. Could this be the source of the attacks?',
    music: 'mysterious',
    difficulty: 1.4
  },
  {
    name: 'Violet Singularity',
    bg: '#100018',
    nebula: '#b0f',
    star: 'rgba(220,160,255,0.42)',
    lane: 'rgba(180,0,255,0.10)',
    story: 'Your instruments scream as you approach the singularity. The enemy flagship must be nearby.',
    music: 'dramatic',
    difficulty: 1.6
  },
  {
    name: 'Frozen Relay',
    bg: '#001018',
    nebula: '#7df',
    star: 'rgba(170,235,255,0.5)',
    lane: 'rgba(120,220,255,0.08)',
    story: 'The old relay station holds answers. But first, you must defeat their final guardian.',
    music: 'epic',
    difficulty: 1.8
  }
];

// Story characters for dialogue
export const STORY_CHARACTERS = {
  PLAYER: { name: 'You', color: '#0cf' },
  COMMAND: { name: 'Command', color: '#ff0', role: 'Mission Control' },
  ENGINEER: { name: 'Doc', color: '#0f0', role: 'Engineer' },
  MYSTERIOUS: { name: 'Unknown', color: '#f0f', role: '???', mysterious: true },
  BOSS: { name: 'Viper', color: '#f00', role: 'Enemy Commander' }
};

// Story events that trigger dialogue
export const STORY_EVENTS = {
  GAME_START: {
    stage: 1,
    kills: 0,
    once: true,
    messages: [
      { speaker: 'COMMAND', text: 'Pilot, we need you in the Neon Drift sector immediately.' },
      { speaker: 'COMMAND', text: 'Multiple distress calls. Something big is happening.' },
      { speaker: 'PLAYER', text: 'On my way. What am I looking for?' },
      { speaker: 'COMMAND', text: 'Unknown. But our sensors show increased enemy activity.' }
    ]
  },
  FIRST_KILLS: {
    stage: 1,
    kills: 3,
    once: true,
    messages: [
      { speaker: 'ENGINEER', text: 'Nice flying out there! Weapons systems working well?' },
      { speaker: 'PLAYER', text: 'Ship handles perfectly. These enemies seem organized though.' },
      { speaker: 'ENGINEER', text: 'That\'s what worries me. Keep your eyes open.' }
    ]
  },
  STAGE_2_START: {
    stage: 2,
    kills: 0,
    once: true,
    messages: [
      { speaker: 'COMMAND', text: 'Entering the Ember Belt. Temperatures are extreme.' },
      { speaker: 'ENGINEER', text: 'Your shields should handle the heat. Watch for ambushes.' },
      { speaker: 'MYSTERIOUS', text: 'You shouldn\'t have come this far, pilot...' },
      { speaker: 'PLAYER', text: 'Who is that? Command, did you copy that?' },
      { speaker: 'COMMAND', text: 'Negative, pilot. You\'re picking up something strange.' }
    ]
  },
  STAGE_3_START: {
    stage: 3,
    kills: 0,
    once: true,
    messages: [
      { speaker: 'ENGINEER', text: 'The Verdant Ion Reef... this place is ancient.' },
      { speaker: 'COMMAND', text: 'Our scans show an energy signature matching the enemy ships.' },
      { speaker: 'MYSTERIOUS', text: 'You\'re getting closer to the truth. Turn back now.' },
      { speaker: 'PLAYER', text: 'Not a chance. Who are you working for?' }
    ]
  },
  STAGE_4_START: {
    stage: 4,
    kills: 0,
    once: true,
    messages: [
      { speaker: 'COMMAND', text: 'The Violet Singularity. This is it, pilot.' },
      { speaker: 'ENGINEER', text: 'Gravitational forces are intense. Your ship can handle it?' },
      { speaker: 'MYSTERIOUS', text: 'I tried to warn you. Viper doesn\'t take prisoners.' },
      { speaker: 'COMMAND', text: 'Viper? The rogue commander? We thought he was dead!' },
      { speaker: 'PLAYER', text: 'Well, he\'s about to wish he was.' }
    ]
  },
  FINAL_STAGE: {
    stage: 5,
    kills: 0,
    once: true,
    messages: [
      { speaker: 'BOSS', text: 'So, the lone wolf has made it this far.' },
      { speaker: 'PLAYER', text: 'Viper! This ends now.' },
      { speaker: 'BOSS', text: 'You have no idea what you\'ve stumbled into.' },
      { speaker: 'COMMAND', text: 'All units, support our pilot! This is the final push!' },
      { speaker: 'PLAYER', text: 'Time to finish what you started.' }
    ]
  },
  BOSS_DEFEATED: {
    stage: 5,
    bossDefeated: true,
    once: true,
    messages: [
      { speaker: 'BOSS', text: 'Impossible... my forces... were... unstoppable...' },
      { speaker: 'PLAYER', text: 'Nothing is unstoppable. Justice always wins.' },
      { speaker: 'COMMAND', text: 'Outstanding work, pilot! The sector is secure!' },
      { speaker: 'ENGINEER', text: 'I\'ll buy you a drink when you get back. Hero!' },
      { speaker: 'MYSTERIOUS', text: 'Interesting... perhaps Viper was wrong about you.' }
    ]
  }
};

// Multiplayer room types
export const ROOM_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  RANKED: 'ranked',
  COOP: 'coop'
};

// Player stats and progression
export const PLAYER_LEVELS = [
  { level: 1, name: 'Cadet', xpRequired: 0, bonus: 1.0 },
  { level: 2, name: 'Ensign', xpRequired: 1000, bonus: 1.1 },
  { level: 3, name: 'Lieutenant', xpRequired: 3000, bonus: 1.2 },
  { level: 4, name: 'Captain', xpRequired: 6000, bonus: 1.3 },
  { level: 5, name: 'Commander', xpRequired: 10000, bonus: 1.4 },
  { level: 6, name: 'Admiral', xpRequired: 15000, bonus: 1.5 }
];

// Achievement system
export const ACHIEVEMENTS = {
  FIRST_BLOOD: { id: 'first_blood', name: 'First Blood', description: 'Destroy your first enemy', xp: 100 },
  SURVIVOR: { id: 'survivor', name: 'Survivor', description: 'Complete stage 1', xp: 200 },
  VETERAN: { id: 'veteran', name: 'Veteran', description: 'Complete stage 3', xp: 500 },
  HERO: { id: 'hero', name: 'Hero', description: 'Complete stage 5', xp: 1000 },
  ACE: { id: 'ace', name: 'Ace', description: 'Reach 1000 total score', xp: 300 },
  MASTER: { id: 'master', name: 'Master', description: 'Reach 5000 total score', xp: 750 },
  LEGEND: { id: 'legend', name: 'Legend', description: 'Reach 10000 total score', xp: 1500 }
};
