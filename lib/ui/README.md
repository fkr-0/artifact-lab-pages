# Spaceship UI Library

A comprehensive UI library featuring cyberpunk themes, floating menus, and interactive components.

## Features

- **8 Cyberpunk Themes**: default, synthwave, cyberpunk, retro8bit, midnight, vaporwave, neon-rust, matrix
- **Settings Panel**: Theme switching, sound controls, custom sections
- **Sound System**: Three sound themes with Web Audio API
- **Floating Menus**: Context menus and draggable components
- **Artifact Launcher**: Launch in tab/fullscreen/new window
- **Modals**: Custom modal dialogs
- **Toast Notifications**: Timed notifications
- **Draggable**: Make any element draggable

## Usage

```javascript
import { SpaceshipUI } from './lib/ui/spaceship-ui.js';

const ui = new SpaceshipUI({
  container: document.body,
  defaultTheme: 'synthwave',
  soundEnabled: true,
  soundVolume: 0.3,
  debug: false,
  onThemeChange: (theme) => console.log('Theme changed:', theme),
  onSoundChange: (settings) => console.log('Sound settings changed:', settings)
});

// Theme management
ui.setTheme('cyberpunk');
const currentTheme = ui.getCurrentTheme();

// Sound
ui.playSound('success');
ui.setSoundVolume(0.5);
ui.setSoundTheme('soft');

// Settings panel
const settings = ui.createSettingsPanel({
  extraSections: `
    <div>
      <div class="settings-sect-title">CUSTOM</div>
      <div class="setting-row">
        <span>Custom setting</span>
        <input type="checkbox">
      </div>
    </div>
  `,
  onSettingsReady: (panel) => {
    // Customize panel
  }
});
settings.open();

// Context menu
const menu = ui.createContextMenu({
  items: [
    { action: 'open', label: 'Open', callback: () => console.log('Open') },
    { action: 'delete', label: 'Delete', callback: () => console.log('Delete') }
  ]
});
menu.showAt(100, 100);

// Artifact launcher
ui.launchArtifact('/game.html', { mode: 'fullscreen' });
ui.launchArtifact('/editor.html', { mode: 'window', width: 1200, height: 800 });

// Modal
const modal = ui.createModal({
  title: 'Confirm Action',
  content: 'Are you sure you want to proceed?',
  onConfirm: () => console.log('Confirmed'),
  onCancel: () => console.log('Cancelled')
});
modal.open();

// Toast
ui.showToast('Operation completed', { type: 'success', duration: 3000 });

// Draggable
const cleanup = ui.makeDraggable(element, { handle: element.querySelector('.header') });
// Later: cleanup()
```

## CSS

The library includes its own CSS. Just include the JS file and the styles will be injected automatically.

## Themes

Available themes with their color schemes:

| Theme | Primary | Secondary | Accent |
|-------|---------|-----------|--------|
| default | #00ffff | #0088ff | #ff0066 |
| synthwave | #ff00ff | #ffaa00 | #ff6ec7 |
| cyberpunk | #f0e68c | #ff0080 | #00ff41 |
| retro8bit | #33ff00 | #ffb000 | #00ff88 |
| midnight | #87ceeb | #c0c0c0 | #4169e1 |
| vaporwave | #ff71ce | #01cdfe | #b967ff |
| neon-rust | #ff8c00 | #ff4500 | #ffd700 |
| matrix | #00ff41 | #008f11 | #00ff41 |

## Sound Themes

- **retro**: 8-bit style with square and sawtooth waves
- **soft**: Gentle sine and triangle waves
- **glitch**: Harsh digital sounds

## API

### SpaceshipUI

**Constructor Options:**
- `container`: DOM element (default: document.body)
- `defaultTheme`: Initial theme (default: 'default')
- `soundEnabled`: Enable sounds (default: true)
- `soundVolume`: Initial volume 0-1 (default: 0.3)
- `soundTheme`: Sound theme (default: 'retro')
- `debug`: Enable debug logging (default: false)
- `onThemeChange`: Callback when theme changes
- `onSoundChange`: Callback when sound settings change

**Methods:**

**Theme:**
- `getThemes()`: Get all available themes
- `setTheme(themeId, save)`: Set current theme
- `getCurrentTheme()`: Get current theme info

**Sound:**
- `getSoundThemes()`: Get available sound themes
- `playSound(type, force)`: Play a sound effect
- `setSoundEnabled(enabled)`: Toggle sounds
- `setSoundVolume(volume)`: Set volume 0-1
- `setSoundTheme(theme)`: Set sound theme

**Components:**
- `createSettingsPanel(opts)`: Create settings panel
- `createContextMenu(opts)`: Create context menu
- `createModal(opts)`: Create modal dialog
- `showToast(message, opts)`: Show toast notification
- `launchArtifact(url, opts)`: Launch artifact
- `makeDraggable(element, opts)`: Make element draggable

## Sound Types

Available sound types:
- `click`: Button clicks
- `success`: Success actions
- `join`: Peer joined
- `leave`: Peer left
- `chat`: Chat messages
- `ping`: Notifications
- `error`: Error states
- `notification`: General notifications
