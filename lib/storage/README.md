# Local Storage Manager

A modular local-storage management system for the Artifacts project.

## Features

- **Gamestate Storage**: Save/load/query game states with metadata
- **App State Management**: Settings, theme, sound preferences
- **Profile Storage**: User profile data and preferences
- **Session Tracking**: Session data and event logging
- **Save Slots**: Project save slot facility
- **Query API**: Search and filter stored data
- **Export/Import**: Backup and restore functionality

## Usage

```javascript
import { LocalStorageManager } from './lib/storage/local-storage-manager.js';

const storage = new LocalStorageManager({
  namespace: 'my-app',
  version: '1.0.0',
  debug: true
});

// Save gamestate
storage.gamestate.save('level1', { player: { x: 100, y: 200 } }, {
  version: '1.0.0',
  level: 1,
  score: 1000
});

// Load gamestate
const state = storage.gamestate.load('level1');

// App settings
storage.appState.set('theme', 'synthwave');
const theme = storage.appState.get('theme');

// Profile
storage.profile.setUsername('Player1');
const username = storage.profile.getUsername();

// Sessions
const sessionId = storage.sessions.start({ app: 'game', level: 1 });
storage.sessions.logEvent(sessionId, 'completed', { time: 45 });

// Save slots
storage.slots.save(1, { progress: 0.5 }, { name: 'Slot 1' });
const slot = storage.slots.load(1);

// Query
const allGamestates = storage.query.byType('gamestate');
const searchResults = storage.query.search({ 'meta.level': 1 });

// Stats
const stats = storage.getStats();
console.log(stats);

// Export/Import
const exportData = storage.export();
storage.import(exportData);
```

## API

### LocalStorageManager

Main storage manager that coordinates all sub-managers.

**Options:**
- `namespace`: Storage namespace prefix (default: 'artifacts')
- `version`: Version string for exports (default: '1.0.0')
- `debug`: Enable debug logging (default: false)

**Methods:**
- `getStats()`: Get storage usage statistics
- `clear()`: Clear all storage in namespace
- `export()`: Export all data as JSON
- `import(jsonString)`: Import data from JSON

### GamestateStorage

**Methods:**
- `save(gameId, state, meta)`: Save a gamestate
- `load(gameId)`: Load a gamestate
- `delete(gameId)`: Delete a gamestate
- `list()`: List all gamestates

### AppStateStorage

**Methods:**
- `get(key, defaultValue)`: Get app setting
- `set(key, value)`: Set app setting
- `getAll()`: Get all settings
- `clear()`: Clear all app state

### ProfileStorage

**Methods:**
- `get(key)`: Get profile data
- `set(key, value)`: Set profile data
- `getUsername()`: Get username
- `setUsername(username)`: Set username
- `getAll()`: Get all profile data

### SessionStorage

**Methods:**
- `start(meta)`: Start a new session
- `end(sessionId)`: End a session
- `logEvent(sessionId, event, data)`: Log an event
- `get(sessionId)`: Get session data
- `list()`: List all sessions
- `clean()`: Clean old sessions

### SaveSlotStorage

**Methods:**
- `save(slotId, data, meta)`: Save to a slot
- `load(slotId)`: Load from a slot
- `getAll()`: Get all slots
- `clear(slotId)`: Clear a slot
- `clearAll()`: Clear all slots

### StorageQuery

**Methods:**
- `byType(type)`: Query storage by type
- `search(query)`: Search storage by metadata
- `sizeBreakdown()`: Get storage size breakdown
- `deleteMatching(query)`: Delete entries matching query
