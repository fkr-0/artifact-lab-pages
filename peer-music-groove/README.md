# GROOVE STATION

**P2P Collaborative Music Studio** - A browser-based, peer-to-peer music production environment.

## Features

- **P2P Distributed** - No server required, all communication via PeerJS WebRTC
- **Collaborative** - Multiple users can create/join lobbies and make music together
- **Client-Side Only** - Everything runs in the browser, no backend needed
- **Local Storage Persistence** - Sessions are saved automatically and can be exported/imported
- **Space UI Theme** - Cyberpunk/futuristic aesthetic with neon glows and scanlines

## Components

### Transport
- BPM control (60-200)
- Play/Stop transport
- Metronome with volume fader
- Configurable bars (1-16)

### Sound Generators
Each user can add modules with their own color indicator:

1. **Sampler** - Load a single audio file, trigger via piano roll
2. **Rack** - 8-pad sampler, each pad can hold a different sample
3. **Basic Synth** - Oscillator with ADSR envelope and filter

### Piano Roll Sequencer
- 16th note grid
- Click to add/remove notes
- Color-coded by module owner
- Visual playhead during playback

### Mixer
- One channel per sound generator
- Volume faders with VU meters
- Mute/Solo buttons
- Master output with limiter

### Effects Rack
- **Delay** - Time, feedback, mix
- **Reverb** - Room size, decay, mix
- **Flanger** - Rate, depth, mix
- **SuperDubFX** - Combined dub effects with filter modulation
- **Looper** - Record and overdub loops

## Usage

### Quick Start
1. Open `index.html` in a modern browser
2. Click "CREATE LOBBY" to start a session
3. Add modules using the "+ ADD" button
4. Click notes in the piano roll to create patterns
5. Press Play to hear your creation

### Join a Session
1. Get the host's Peer ID (shown in their lobby info)
2. Click "JOIN LOBBY"
3. Enter the host's Peer ID and your name
4. You'll sync with the session automatically

### Save/Load
- Sessions auto-save to browser localStorage
- Use "EXPORT JSON" to download a portable session file
- Use "LOAD SESSION" to import a saved JSON file

## File Structure

```
peer-music-groove/
├── index.html      # Main application (HTML + CSS)
├── app.js          # Application logic (audio engine, UI, P2P)
├── peernet.js      # PeerNet library (optional advanced features)
└── README.md       # This file
```

## Technical Details

### Audio Engine
- Built on Web Audio API
- Real-time scheduling for tight timing
- Dynamics compression (limiter) on master output
- Analyser node for VU meters

### P2P Communication
- PeerJS for WebRTC peer connections
- Automatic state synchronization
- Broadcast note/module changes to all peers
- Host-based lobby model (first user becomes host)

### State Management
- All state stored in browser
- Automatic localStorage persistence
- JSON export for portable sessions

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Requires Web Audio API and WebRTC support.

## Dependencies

- **PeerJS** (CDN) - WebRTC abstraction for P2P
- **Google Fonts** (CDN) - Orbitron, Share Tech Mono, Press Start 2P

## License

MIT - Use freely for any purpose.

---

**GROOVE STATION** - Make music together, anywhere, no server required.
