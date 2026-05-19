import { STORY_EVENTS, STORY_CHARACTERS, STAGE_THEMES, ACHIEVEMENTS } from './config.js';

export class StoryManager {
  constructor() {
    this.storyState = {
      completedEvents: new Set(),
      currentDialogue: [],
      dialogueHistory: [],
      playerChoices: [],
      reputation: 0,
      discoveredSecrets: new Set()
    };
  }

  initialize(performanceNow) {
    return {
      activeEvents: new Set(),
      lastEventCheck: performanceNow,
      eventQueue: [],
      currentEvent: null,
      dialogueActive: false
    };
  }

  checkEventTriggers(gameState) {
    const { story, now, enemyCount, enemyAmount, stage, bossActive, stageKills } = gameState;
    const triggeredEvents = [];

    for (const [eventId, eventData] of Object.entries(STORY_EVENTS)) {
      // Skip if already completed and it's a one-time event
      if (eventData.once && this.storyState.completedEvents.has(eventId)) {
        continue;
      }

      // Check if conditions are met
      let shouldTrigger = false;

      if (eventData.stage !== undefined && stage !== eventData.stage) {
        continue;
      }

      if (eventData.kills !== undefined && stageKills < eventData.kills) {
        continue;
      }

      if (eventData.bossDefeated && !bossActive) {
        continue;
      }

      if (eventData.enemyCount !== undefined && enemyCount < eventData.enemyCount) {
        continue;
      }

      // Check cooldowns for repeatable events
      if (eventData.cooldown && story.lastEventTrigger?.[eventId]) {
        const timeSinceTrigger = now - story.lastEventTrigger[eventId];
        if (timeSinceTrigger < eventData.cooldown) {
          continue;
        }
      }

      shouldTrigger = true;

      if (shouldTrigger && !story.activeEvents.has(eventId)) {
        triggeredEvents.push({ eventId, ...eventData });
        story.activeEvents.add(eventId);
        story.lastEventTrigger = story.lastEventTrigger || {};
        story.lastEventTrigger[eventId] = now;

        if (eventData.once) {
          this.storyState.completedEvents.add(eventId);
        }
      }
    }

    return triggeredEvents;
  }

  formatMessage(message) {
    const speaker = STORY_CHARACTERS[message.speaker];
    if (!speaker) {
      return { ...message, speakerName: message.speaker };
    }

    const speakerName = speaker.mysterious ? '???' : speaker.name;
    const speakerColor = speaker.color;

    return {
      ...message,
      speakerName,
      speakerColor,
      role: speaker.role
    };
  }

  processEventQueue(story, now) {
    const messages = [];

    while (story.eventQueue.length > 0 && !story.dialogueActive) {
      const event = story.eventQueue.shift();
      event.messages.forEach(msg => {
        const formattedMsg = this.formatMessage(msg);
        messages.push(formattedMsg);
        this.storyState.dialogueHistory.push(formattedMsg);
      });

      if (event.effects) {
        this.applyEventEffects(event.effects);
      }
    }

    return messages;
  }

  applyEventEffects(effects) {
    if (effects.reputation) {
      this.storyState.reputation += effects.reputation;
    }

    if (effects.secret) {
      this.storyState.discoveredSecrets.add(effects.secret);
    }

    if (effects.achievement) {
      this.unlockAchievement(effects.achievement);
    }
  }

  unlockAchievement(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (achievement && !this.storyState.discoveredSecrets.has(`achievement_${achievementId}`)) {
      this.storyState.discoveredSecrets.add(`achievement_${achievementId}`);
      // Return achievement for display
      return {
        type: 'achievement',
        id: achievementId,
        name: achievement.name,
        description: achievement.description,
        xp: achievement.xp
      };
    }
    return null;
  }

  checkAchievements(gameState) {
    const achievements = [];
    const { stage, stageKills, score, story } = gameState;

    // Check various achievements
    if (stageKills >= 1 && !this.storyState.completedEvents.has('first_blood')) {
      const achievement = this.unlockAchievement('FIRST_BLOOD');
      if (achievement) achievements.push(achievement);
    }

    if (stage >= 2 && !this.storyState.completedEvents.has('survivor')) {
      const achievement = this.unlockAchievement('SURVIVOR');
      if (achievement) achievements.push(achievement);
    }

    if (stage >= 4 && !this.storyState.completedEvents.has('veteran')) {
      const achievement = this.unlockAchievement('VETERAN');
      if (achievement) achievements.push(achievement);
    }

    if (stage >= 5 && story.bossDefeated >= 1 && !this.storyState.completedEvents.has('hero')) {
      const achievement = this.unlockAchievement('HERO');
      if (achievement) achievements.push(achievement);
    }

    if (score >= 1000 && !this.storyState.completedEvents.has('ace')) {
      const achievement = this.unlockAchievement('ACE');
      if (achievement) achievements.push(achievement);
    }

    if (score >= 5000 && !this.storyState.completedEvents.has('master')) {
      const achievement = this.unlockAchievement('MASTER');
      if (achievement) achievements.push(achievement);
    }

    if (score >= 10000 && !this.storyState.completedEvents.has('legend')) {
      const achievement = this.unlockAchievement('LEGEND');
      if (achievement) achievements.push(achievement);
    }

    return achievements;
  }

  getThemeStory(stage) {
    const themeIndex = (stage - 1) % STAGE_THEMES.length;
    return STAGE_THEMES[themeIndex]?.story || '';
  }

  getDialogueHistory() {
    return this.storyState.dialogueHistory;
  }

  getStoryState() {
    return {
      completedEvents: Array.from(this.storyState.completedEvents),
      dialogueHistoryCount: this.storyState.dialogueHistory.length,
      reputation: this.storyState.reputation,
      discoveredSecrets: Array.from(this.storyState.discoveredSecrets)
    };
  }

  reset() {
    this.storyState = {
      completedEvents: new Set(),
      currentDialogue: [],
      dialogueHistory: [],
      playerChoices: [],
      reputation: 0,
      discoveredSecrets: new Set()
    };
  }
}

export function createInitialStoryState(now) {
  return {
    activeEvents: new Set(),
    lastEventTrigger: {},
    lastEventCheck: now,
    eventQueue: [],
    currentEvent: null,
    dialogueActive: false,
    bossDefeated: 0
  };
}

export function updateStoryMode(params) {
  const { story, now, enemyCount, enemyAmount, stage, bossActive, stageKills } = params;
  const storyManager = new StoryManager();

  const messages = [];
  const achievements = [];

  // Check for new events
  const triggeredEvents = storyManager.checkEventTriggers({
    story,
    now,
    enemyCount,
    enemyAmount,
    stage,
    bossActive,
    stageKills,
    score: params.score || 0
  });

  // Add triggered events to queue
  story.eventQueue.push(...triggeredEvents);

  // Process event queue
  const eventMessages = storyManager.processEventQueue(story, now);
  messages.push(...eventMessages);

  // Check achievements
  const unlockedAchievements = storyManager.checkAchievements({
    story,
    stage,
    stageKills,
    score: params.score || 0
  });
  achievements.push(...unlockedAchievements);

  return {
    story: { ...story, lastEventCheck: now },
    messages,
    achievements
  };
}
