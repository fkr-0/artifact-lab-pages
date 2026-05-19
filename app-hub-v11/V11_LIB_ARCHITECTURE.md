# v11 Hub/Lib Architecture Analysis

## Summary
This document analyzes the components in `app-hub-v11/lib/` and determines which should remain v11-hub-only versus which could be refactored to the global `lib/` directory.

## Basedir Structure Completion ✅
The following standalone apps have been moved to proper basedir structures:
- `brickbreaker/` - BrickBreaker Coop game with brickbreaker-*.mjs modules
- `markdown-viewer/` - Markdown viewer with markdown-renderer.mjs
- `palette-studio/` - Standalone palette generator (self-contained)
- `font-lab-browser/` - Font lab tool (uses external CDN imports only)

## v11 Lib Components Analysis

### v11-Hub-Only Components (Keep in app-hub-v11/lib/)

1. **launcher.js** (12,637 bytes)
   - **Reason**: Core v11 app runtime management specific to v11's artifact system
   - **Dependencies**: References v11-specific configuration and artifact loading

2. **menu.js** (7,773 bytes)
   - **Reason**: v11-specific tag filtering and menu logic tied to v11's artifact catalog
   - **Dependencies**: Uses v11 artifact schema and layout system

3. **storage.js** (2,422 bytes)
   - **Reason**: Hardcoded `app-hub-v11:` prefix makes it v11-specific
   - **Alternatives**: Could be refactored to accept prefix parameter, but current design is v11-specific

4. **themes.js** (3,743 bytes)
   - **Reason**: Uses v11-specific CSS variable names (`--hub-accent`, `--hub-background`, etc.)
   - **Scope**: Tightly coupled to v11's design system and color scheme

5. **legacy-tools.mjs** (4,070 bytes)
   - **Reason**: Specifically designed to host legacy tools for v11 compatibility
   - **Scope**: v11-specific feature for backward compatibility

6. **artifact-observer-bridge.js** (5,487 bytes)
   - **Reason**: v11-specific artifact observation system
   - **Scope**: Tied to v11's artifact catalog and loading mechanism

7. **event-log.js** (967 bytes)
   - **Reason**: v11-specific logging system
   - **Scope**: Used by v11 launcher for event tracking

8. **sound.js** (1,093 bytes)
   - **Reason**: v11-specific audio system for hub interactions
   - **Scope**: Tied to v11's sound event system

9. **profile.js** (1,270 bytes)
   - **Reason**: v11-specific user profile management
   - **Scope**: Integrated with v11's storage and settings system

10. **v9-shell.css** (3,080 bytes)
    - **Reason**: V9-specific styling for legacy compatibility
    - **Scope**: V9 design system, not v11

11. **network.js** (2,236 bytes)
    - **Reason**: References `peernetjs/` which is already global
    - **Scope**: Thin wrapper around global peernet for v11 compatibility

### Global Lib Candidates (Could move to global lib/)

1. **resizable-panels.js** (2,036 bytes) ✅ **CANDIDATE**
   - **Functionality**: Generic resizable split-pane layout system
   - **Dependencies**: None (completely generic)
   - **Reason**: Provides unique functionality not in global lib/ui/
   - **Difference from global lib**: Global lib has floating-panels.js and spaceship-ui.js, but no resizable split-pane component
   - **Action**: Move to `global lib/ui/resizable-panels.js`

## Architecture Decisions

### Keep in v11-hub-only
- **Core hub functionality**: launcher, menu, artifact loading
- **v11-specific systems**: storage (with prefix), themes (with specific CSS vars), sound, profile
- **Legacy compatibility**: legacy-tools, v9-shell, network wrapper
- **Hub utilities**: event-log, artifact-observer-bridge

### Move to global lib/
- **resizable-panels.js**: Generic UI component for split-pane layouts

## Import Path Updates Required

After moving resizable-panels.js to global lib/, the following imports need to be updated:

1. **app-hub-v11/index.html**
   ```javascript
   // Current:
   import { createResizablePanels } from './lib/resizable-panels.js';
   
   // Update to:
   import { createResizablePanels } from '../lib/ui/resizable-panels.js';
   ```

## Benefits of This Architecture

1. **Clear separation**: v11-specific functionality remains in v11 hub, reusable components go global
2. **Reduced duplication**: Generic components like resizable-panels can be reused across all hubs
3. **Better maintainability**: Each hub owns its specific logic while sharing common UI components
4. **Proper artifact structure**: Apps are now proper artifacts with their own basedirs
5. **Git-based ordering**: Automatic artifact ordering based on last modification time

## Next Steps

1. ✅ Move resizable-panels.js to global lib/ui/
2. ✅ Update import paths in v11 hub
3. ✅ Test v11 functionality with new structure
4. ✅ Consider whether other components could be generalized for global use
