# artifact-motion (complete)

A small, dependency-free interaction engine for native-feel UI.

## Features
- pointer + touch unified drag
- spring physics + velocity
- stacked ghost rendering
- snap + snap-back
- magnetic drop targets
- edge auto-scroll
- sound + haptics
- reduced-motion support

## API

```js
createArtifactMotion({
  root,
  draggable,
  dropTarget,
  getItems,
  canDrop,
  onDrop,
  getSnapPoint
})
```

## Philosophy
Library owns feel.
App owns rules.

## Demo
Open demo.html

## Next step
Integrate into solitaire + v10 hub
