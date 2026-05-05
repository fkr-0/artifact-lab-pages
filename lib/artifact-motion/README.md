# artifact-motion

Prototype library extracted from Solitaire interaction system.

## Goal
Provide native-feeling drag + motion + feedback primitives for artifacts.

## Scope
- pointer + touch unification
- spring physics
- ghost rendering
- sound + haptics

## Not included (yet)
- app-specific rules
- snapping logic
- stacking logic

## Usage

```html
<link rel="stylesheet" href="../lib/artifact-motion/artifact-motion.css">
<script type="module">
import { createArtifactMotion } from '../lib/artifact-motion/artifact-motion.js';

createArtifactMotion({
  root: document.body,
  draggable: '.card'
});
</script>
```

## Next steps
- extract full feature set from solitaire
- add snapping API
- add target detection hooks
- integrate into v9/v10 hub
