Below is the workflow I’d use to fix the animation layer without breaking the current
contracts.

```yaml
animation_layer_goal:
  primary_goal: replace placeholder/vector animation with production sprite-sheet driven gameplay
  keep_stable:
    - data/sprites.json animation ids
    - sheet ids used by Renderer and SpriteRenderer
    - item pickup ids and world coordinates in stage layouts
    - frame dimensions unless explicitly migrated
    - max 4x4 prompt grids for generated art tasks
  current_runtime_sources:
    manifest: data/sprites.json
    animation_plan: animation.yml
    sprite_docs: docs/SPRITES.md
    prompt_root: llm-sprite-generation/
    runtime_renderer:
      - apps/runner/src/renderer/SpriteRenderer.ts
      - apps/runner/src/renderer/AnimationState.ts
      - apps/runner/src/renderer/Renderer.ts
    pickup_runtime:
      - apps/runner/src/systems/ItemSystem.ts
      - apps/runner/src/world/lowerSprawlLayout.ts
      - apps/runner/src/world/stageLayoutRegistry.ts
```

## 1. Big decisions

### Grid/atlas frames vs individual PNGs

Use **grids/atlases** for animation frames.

```yaml
recommendation:
  animated_entities: use sprite sheets / grids
  one_off_art: individual png ok
  tilemaps: atlases
  VFX: atlases
  pickups: atlas rows or compact grids

why_grids_are_better:
  - fewer image loads
  - fewer texture uploads
  - easier preloading
  - stable frame dimensions
  - easier contract validation
  - easier drawImage source rectangle math
  - easier replacement of placeholder art without code changes

when_individual_pngs_are_ok:
  - title cards
  - large parallax backgrounds
  - one-off illustrations
  - non-animated UI panels
```

For this project, keep animation frames in grids because `data/sprites.json` already assumes sheet ids, frame sizes, animation names, frame counts, fps, anchors, events, hitboxes, and hurtboxes.

---

## 2. How item pickup should work

Do **not** annotate every player movement frame with item x/y positions.

The correct model is:

```yaml
pickup_model:
  world_entity:
    owns:
      - pickup id
      - item id
      - x/y world coordinate
      - radius/hitbox
      - persistence
      - visual state
      - animation name
  player_animation:
    owns:
      - locomotion pose
      - interact/pickup reaction pose
      - hand/torso readability
  item_animation:
    owns:
      - idle sparkle
      - magnetized/nearby hint
      - collecting burst
      - collected/hidden state
```

Current example from Lower Sprawl:

```yaml
pickup_examples:
  rocket_backpack:
    x: 270
    y: 382
    kind: rocket
    animation: rocket_backpack_pickup
    persistence: saved_once

  railgun:
    x: 500
    y: 326
    kind: railgun
    animation: railgun_pickup
    persistence: saved_once

  wafer_key_payload:
    x: 1688
    y: 330
    kind: story_payload
    animation: wafer_key_pickup
    persistence: story_payload
```

So the animation layer needs item sprites in the atlas, but the **layout files** own where items appear.

---

## 3. Required pickup states

Add/standardize these visual states:

```yaml
pickup_visual_states:
  available:
    meaning: item exists and can be collected
    animation: item idle loop
    render: bobbing/sparkle
    collision: enabled

  magnetized:
    meaning: player is near item but not collected yet
    animation: stronger glow or slight pull
    render: scale 1.05-1.15, brighter outline
    collision: enabled

  collecting:
    meaning: collection triggered, short burst playing
    animation: pickup burst or item shrink/flash
    render: scale up, glow, optional VFX
    collision: disabled after trigger

  collected:
    meaning: item is gone
    animation: none
    render: hidden
    collision: disabled

  respawn_pending:
    meaning: optional future state for ephemeral pickups
    animation: ghosted cooldown
    render: low opacity
    collision: disabled
```

The current runtime already has:

```ts
export type PickupVisualState =
  | 'available'
  | 'magnetized'
  | 'collecting'
  | 'collected'
  | 'respawn_pending';
```

So the sprite work should match that model.

---

## 4. Coordinates and anchors

### Player frame anchors

For Moss, keep the anchor near the feet so animation changes do not make the character slide.

```yaml
moss_badger:
  frame_size: [48, 48]
  default_anchor: [24, 44]
  meaning:
    x: horizontal foot center
    y: ground contact point
  rule:
    - every locomotion frame should keep feet aligned to anchor
    - squash/stretch may move body, not anchor
    - weapon smears may extend outside body but stay inside frame unless hitbox explicitly exceeds frame
```

### Item anchors

For pickups, use center anchors.

```yaml
items_core:
  frame_size: [32, 32]
  default_anchor: [16, 16]
  world_position_means: visual center / pickup center
  current_renderer_offset:
    draw_position: x - 16, y - 16
```

### Boss anchors

```yaml
bosses:
  frame_size: [96, 96]
  default_anchor: [48, 88]
  meaning:
    x: foot/base center
    y: ground contact
```

### Enemy anchors

```yaml
enemies:
  frame_size: [48, 48]
  default_anchor: [24, 44]
```

### VFX anchors

```yaml
vfx_combat:
  frame_size: [32, 32]
  default_anchor: [16, 16]
  special_cases:
    rail_trail:
      anchor: [0, 16]
      reason: starts at muzzle and extends forward
    claw_arc:
      anchor: [8, 16]
      reason: originates near Moss hand
    landing_dust:
      anchor: [16, 28]
      reason: rests on floor
```

---

## 5. Necessary sprites and sprite stuff

### Player: Moss Badger

```yaml
moss_badger:
  sheet_id: moss_badger
  file: assets/sprites/moss_badger.png
  frame_size: [48, 48]
  required_animations:
    idle:
      frames: 6
      fps: 8
      anchor: [24, 44]
    run:
      frames: 8
      fps: 14
      anchor: [24, 44]
      events:
        - frame: 1
          kind: footstep
        - frame: 5
          kind: footstep
    skid:
      frames: 3
      fps: 12
    jump_up:
      frames: 3
      fps: 10
    fall:
      frames: 3
      fps: 10
    land:
      frames: 2
      fps: 14
    melee_claws:
      frames: 5
      fps: 22
      needs:
        - claw smear readability
        - active hit frame
        - recovery frame
    melee_katana:
      frames: 7
      fps: 18
      needs:
        - draw pose
        - slash smear
        - recovery pose
    shoot_railgun:
      frames: 5
      fps: 16
      needs:
        - aim
        - muzzle recoil
        - recovery
    rocket_boost:
      frames: 6
      fps: 16
      needs:
        - flame visibility
        - backpack read
    hit:
      frames: 3
      fps: 12
    hack:
      frames: 4
      fps: 8
    parry:
      frames: 4
      fps: 18
    pickup_react:
      frames: 3
      fps: 12
    interact:
      frames: 4
      fps: 10
    victory:
      frames: 8
      fps: 10
```

### Core pickups

```yaml
items_core:
  sheet_id: items_core
  file: assets/sprites/items_core.png
  frame_size: [32, 32]
  anchor: [16, 16]
  each_animation:
    frames: 4
    fps: 8
    states:
      - available shimmer
      - brighter shimmer
      - bob up
      - bob down

  required_pickup_animations:
    - rocket_backpack_pickup
    - railgun_pickup
    - stim_pack_pickup
    - katana_pickup
    - signal_jammer_pickup
    - dub_shield_pickup
    - wafer_key_pickup
    - elevator_seed_pickup
    - mirror_pass_pickup
    - bass_reactor_core_pickup
    - debt_ledger_shard_pickup
    - cargo_reversal_key_pickup
    - asteroid_transmitter_root_pickup
```

### Pickup VFX

```yaml
pickup_vfx:
  sheet_id: vfx_combat
  frame_size: [32, 32]
  required:
    pickup_burst:
      frames: 6
      fps: 18
      anchor: [16, 16]
    story_payload_reveal:
      frames: 8
      fps: 12
      anchor: [16, 16]
```

### Combat VFX

```yaml
vfx_combat:
  frame_size: [32, 32]
  required:
    claw_arc:
      frames: 4
    katana_smear:
      frames: 6
    rail_muzzle:
      frames: 4
    rail_trail:
      frames: 3
    emp_spark:
      frames: 6
    rocket_flame:
      frames: 6
    landing_dust:
      frames: 5
    parry_flash:
      frames: 3
    code_gate_unlock:
      frames: 8
```

### Enemies

```yaml
enemy_baseline:
  frame_size: [48, 48]
  anchor: [24, 44]
  required_animations:
    idle: 4
    patrol_or_move: 6
    windup: 3
    attack: 5
    hurt: 2
    stun_or_parried: 3
    death: 6

enemy_priority_batch:
  chapter_1:
    - rent_cop_piker
    - turnstile_mite
  chapter_2:
    - knife_drone_fledgling
    - clinic_repo_thug
  chapter_3:
    - chrome_bellhop
    - mirror_sentinel
  chapter_6:
    - error_mite
    - debt_wraith
```

### Bosses

```yaml
boss_baseline:
  frame_size: [96, 96]
  anchor: [48, 88]
  required_animations:
    idle: 4
    phase_intro: 8
    patrol_or_move: 6
    windup: 4
    attack: 8
    signature_attack: 8
    hurt: 3
    phase_transition: 8
    defeat: 10

bosses:
  - tollbooth_captain_grin
  - knife_drone_nest
  - madame_vitrine
  - reflection_judge
  - king_feedback
  - black_ice_fox
  - elevator_angel
  - director_vane
```

### Companions and NPCs

```yaml
companions:
  frame_size: [48, 48]
  anchor: [24, 44]
  required:
    naya_root:
      animations:
        idle: 4
        shield_assist: 6
        react: 4
        talk: 6
    rook_null:
      animations:
        idle: 4
        overlay_scan: 6
        talk: 6
        react: 4
    auntie_subharmonic:
      animations:
        idle_radio: 4
        hint_broadcast: 6
        talk: 6
    murr_murrby:
      animations:
        idle: 4
        merchant_offer: 6
        vanish: 4
```

### World textures

```yaml
world_tiles:
  frame_size: [32, 32]
  needed_per_world:
    collision_tiles:
      - floor
      - thin_platform
      - slope_or_pipe
      - wall
    hazards:
      - spark_puddle
      - steam_vent
      - security_laser
      - fan_blast
    decor:
      - pipe
      - cable
      - poster
      - sign
      - broken_machine
    animated_props:
      - neon_sign
      - fan
      - terminal
      - antenna
    parallax:
      - background_far
      - background_mid
      - foreground_overlay
```

---

## 6. Prompting strategy for an LLM/image model

Use one prompt per **small grid**, never one mega prompt for the entire game.

```yaml
prompt_grid_constraints:
  max_grid: 4x4
  preferred:
    character_animation: 4 columns x 2 rows or 4 columns x 4 rows
    item_pickups: 4 columns x 4 rows
    vfx: 4 columns x 4 rows
    bosses: one animation per prompt, max 4x4
  require:
    - transparent background
    - exact frame size
    - no text
    - no shadows outside frame unless requested
    - consistent character size
    - frame-separated grid
    - no merged frames
    - no camera angle changes
```

### Prompt template: player animation

```text
Create a transparent PNG pixel-art sprite sheet for a cyberpunk badger platformer character named Moss Badger.

Sheet: moss_badger_run
Grid: 4 columns x 2 rows
Frame size: 48x48 pixels
Total frames: 8
Background: transparent
Style: chunky readable pixel art, high contrast silhouette, cyberpunk grime, pirate-radio details, no text, no UI, no background scene.

Animation: run cycle.
Frame order: left to right, top row first, then bottom row.
Anchor: feet centered at x=24, y=44 in every frame.
Keep the body size consistent. Do not crop ears, tail, coat, or boots.
Pose notes:
1. contact left foot forward
2. down compression
3. passing pose
4. push off
5. contact right foot forward
6. down compression
7. passing pose
8. push off
Readable details: small antenna whiskers, short coat flap, badger tail bob, boots, determined expression.
```

### Prompt template: pickup item

```text
Create a transparent PNG pixel-art sprite sheet for item pickup animation.

Sheet: wafer_key_pickup
Grid: 4 columns x 1 row
Frame size: 32x32 pixels
Total frames: 4
Background: transparent
Style: cyberpunk platformer pickup icon, chunky readable pixel art, no text, no UI.

Object: wafer key, small glowing access wafer, yellow-green circuitry, rebel sticker, readable silhouette.
Animation frames:
1. neutral floating item
2. glow pulse stronger
3. slight upward bob with sparkle
4. slight downward bob with rim light

Anchor: center of item at x=16, y=16 in every frame.
Do not move the object more than 3 pixels from center.
Keep all pixels inside the 32x32 frame.
```

### Prompt template: pickup burst VFX

```text
Create a transparent PNG pixel-art VFX sprite sheet.

Sheet: pickup_burst
Grid: 4 columns x 2 rows
Frame size: 32x32 pixels
Total frames: 6, leave final two cells empty transparent
Background: transparent
Style: cyberpunk sparkle burst, readable at small size, no text.

Animation:
1. tiny center flash
2. ring expands
3. four sparks shoot diagonally
4. ring fades, sparks extend
5. small afterglow
6. transparent fade

Anchor: burst center at x=16, y=16.
Keep the effect inside frame bounds.
```

### Prompt template: boss animation

```text
Create a transparent PNG pixel-art boss sprite sheet.

Boss: Tollbooth Captain Grin
Animation: polite_collection_attack
Grid: 4 columns x 2 rows
Frame size: 96x96 pixels
Total frames: 8
Background: transparent
Style: cyberpunk platformer boss, grotesque tollbooth officer, readable silhouette, no text, no UI.

Anchor: feet/base center at x=48, y=88 in every frame.
Keep boss scale consistent.
Animation:
1. idle threat pose, receipt baton lowered
2. windup, arm pulls receipt baton back
3. grin widens, coin sparks appear
4. active swing begins
5. full swing smear, bright toll-stamp arc
6. follow-through
7. recovery, shoulders forward
8. reset to guarded stance
```

---

## 7. Editor workflow

### Best tools

```yaml
pixel_editors:
  aseprite:
    best_for:
      - animation timelines
      - onion skin
      - per-frame cleanup
      - exports to sprite sheets
    use_for:
      - Moss
      - bosses
      - enemies
      - companions
      - VFX

  libresprite:
    best_for:
      - free Aseprite-like editing
    use_for:
      - simple cleanup and frame alignment

  krita:
    best_for:
      - painted backgrounds
      - parallax plates
      - larger illustrations
    use_for:
      - world backgrounds
      - title card art

  tiled:
    best_for:
      - tilemap editing
      - collision layers
    use_for:
      - bespoke stage layouts later

  texturepacker:
    best_for:
      - atlas packing
    warning:
      - only use if metadata is exported and converted back into data/sprites.json
```

### Editing steps in Aseprite

```yaml
aseprite_workflow:
  1_import:
    - import generated PNG grid
    - set grid to exact frame size
    - slice by grid
  2_align:
    - turn on onion skin
    - draw anchor guide:
        player: [24, 44]
        item: [16, 16]
        boss: [48, 88]
    - make feet/object center stable across frames
  3_cleanup:
    - remove stray pixels outside silhouette
    - fix jitter
    - ensure transparent background
    - normalize outline thickness
  4_export:
    - export sprite sheet as PNG
    - keep row/column order matching manifest
    - no padding unless manifest supports padding
  5_manifest:
    - update data/sprites.json only if frame counts/fps/events changed
    - do not rename animation ids unless code changes too
  6_validate:
    - run sprite contract tests
    - run game smoke/e2e
```

---

## 8. Concrete TODO for fixing the animation layer

```yaml
animation_layer_todo:
  phase_0_lock_contracts:
    - [ ] Freeze data/sprites.json sheet ids and animation ids for current runtime.
    - [ ] Add explicit grid columns/rows for every sheet.
    - [ ] Add anchor metadata for every animation.
    - [ ] Add loop metadata for every animation.
    - [ ] Add event markers for footsteps, hit active frames, muzzle flashes, pickup burst, and landing dust.
    - [ ] Add validation that no prompt manifest grid exceeds 4x4.

  phase_1_pickups:
    - [ ] Finalize items_core.png with all pickup animations.
    - [ ] Add pickup_burst and story_payload_reveal VFX.
    - [ ] Verify pickup world coordinates in lowerSprawlLayout and stageLayoutRegistry.
    - [ ] Add visual-state mapping:
        available: item idle loop
        magnetized: brighter item loop
        collecting: pickup_burst
        collected: hidden
    - [ ] Add e2e or runtime test that collecting wafer_key emits pickup VFX and persists story_payload.

  phase_2_player:
    - [ ] Replace moss_badger placeholder atlas with production sprite sheet.
    - [ ] Confirm anchor [24,44] across all locomotion frames.
    - [ ] Confirm attack hitboxes line up with melee_claws and melee_katana active frames.
    - [ ] Confirm railgun muzzle event aligns with shoot_railgun frame.
    - [ ] Add visual regression snapshot for idle/run/jump/attack frames.

  phase_3_vfx:
    - [ ] Replace vfx_combat placeholder atlas.
    - [ ] Align claw_arc and katana_smear with player attack frames.
    - [ ] Align rocket_flame with rocket_boost.
    - [ ] Align landing_dust with land event.
    - [ ] Add tests that animation events request existing VFX names.

  phase_4_enemies:
    - [ ] Create baseline enemy animation sheet template.
    - [ ] Produce chapter 1 enemy sprites first:
        - rent_cop_piker
        - turnstile_mite
        - tollbooth_captain_grin
    - [ ] Add enemy animation names to data/sprites.json.
    - [ ] Extend Renderer to draw enemy sheets by enemy family/id.
    - [ ] Keep vector fallback until all enemies have sprites.

  phase_5_bosses:
    - [ ] Produce boss atlases one boss at a time.
    - [ ] Start with tollbooth_captain_grin.
    - [ ] Add phase_intro, attack, signature_attack, hurt, phase_transition, defeat.
    - [ ] Connect BossPhaseSystem phase labels to boss animation transitions.

  phase_6_world_textures:
    - [ ] Replace lower_sprawl_tiles with production tile atlas.
    - [ ] Add material/collision tags for tiles.
    - [ ] Add parallax background plates.
    - [ ] Add animated prop loops for signs/fans/terminals.

  phase_7_tooling:
    - [ ] Add docs/animation-production-workflow.md.
    - [ ] Add script to compare PNG dimensions against data/sprites.json.
    - [ ] Add script to generate contact-sheet previews from sprite sheets.
    - [ ] Add visual regression snapshots for title, dialogue, StageRun HUD, pickups.
```

---

## 9. Constraints to keep the project sane

```yaml
hard_constraints:
  - Do not rename sheet ids without updating data/sprites.json and runtime references.
  - Do not rename animation ids without updating layout/entity references.
  - Do not exceed 4x4 prompt grids for LLM generation tasks.
  - Keep transparent background for characters, items, VFX, enemies, bosses.
  - Keep frame sizes fixed:
      player: 48x48
      items: 32x32
      VFX: 32x32
      enemies: 48x48
      bosses: 96x96
      tiles: 32x32
  - Keep anchors stable across frames.
  - Do not bake item world coordinates into player frames.
  - Do not bake backgrounds into entity sprites.
  - Keep one animation state per entity/item/VFX, not per global sprite sheet.
  - Keep vector fallback until production art coverage is complete.
```

---

## 10. Suggested next implementation slice

I’d do this next because it is small, high-impact, and testable:

```yaml
next_slice:
  name: pickup animation production pass
  why:
    - item coordinates already exist
    - visual states already exist
    - items_core animation names already exist
    - Renderer already draws items_core frames
    - easy to test and visually verify

  implementation_steps:
    - create docs/animation-production-workflow.md
    - add llm-sprite-generation/objects/items-core-production.yml
    - produce/fix items_core.png
    - ensure all required pickup animations exist:
        - rocket_backpack_pickup
        - railgun_pickup
        - stim_pack_pickup
        - katana_pickup
        - wafer_key_pickup
        - elevator_seed_pickup
        - mirror_pass_pickup
        - bass_reactor_core_pickup
        - debt_ledger_shard_pickup
        - cargo_reversal_key_pickup
        - asteroid_transmitter_root_pickup
    - add/verify pickup_burst VFX
    - add contract that every Pickup.animation in layouts exists in data/sprites.json
    - add e2e that launches StageRun and verifies pickup sprite manifest loads
```

---

## 11. Quick answer to your three special questions

```yaml
q1_grid_or_individual_pngs:
  answer: use grids/atlases for animated frames
  reason: better performance, fewer loads, stable frame math, easier validation
  exception: one-off illustrations and large parallax plates can be individual PNGs

q2_item_pickup:
  answer: item positions belong to stage/entity data, not player movement frames
  model:
    - layout owns x/y
    - item entity owns visualState
    - player collision triggers collection
    - renderer chooses animation from visualState and Pickup.animation
  current_project:
    - lowerSprawlLayout already stores pickup x/y
    - ItemSystem already tracks visualState
    - Renderer already renders items_core pickup animations

q3_pose_requirements:
  answer: partially encoded, still a TODO for non-player production coverage
  encoded:
    - Moss draft animations
    - items_core
    - vfx_combat
    - world tiles
    - placeholder enemy/boss/companion contracts
  still_todo:
    - final enemy/boss/companion pose matrices
    - per-frame anchors everywhere
    - hitbox/hurtbox/action-window review for production art
    - visual regression snapshots
```
