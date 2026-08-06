# v4-alt Modular Visual Expansion — Design Spec

**Date:** 2026-07-22
**Status:** Draft
**Scope:** Visual identity system, hub+subguide architecture, diagram expansion, three new subguides

---

## 1. Problem Statement

The v4-alt restored the guide's voice. But structurally it's still a single long document — too much to read in one sitting, visually monotone, and closed to expansion. Three problems to solve:

1. **Visual under-communication.** Most information is delivered as prose. Decision points, procedures, and data claims that would land faster as diagrams are buried in paragraphs.
2. **Monolithic structure.** A reader looking for first-aid advice has to navigate past anxiety management, zombie survival, and legal support. There's no way to hand someone "just the part they need."
3. **Closed topology.** Adding a new topic (body maintenance, social situations, natural disasters) means appending another chapter to an already-long document. There's no hub to connect new material to.

## 2. Architecture: Hub + Booklets

### 2.1 Hub Triptych

The hub is the only required entry point — three pages, heavily visual:

**Page 1 — Where You Are**
- Emergency gate (red bar, always first, unmissable)
- The four bathroom axioms: door, water, shelter, choice
- Opening line: "You're in a bathroom. That's already a good start."
- No subguide content — just orientation and the red-flag invariant

**Page 2 — The Map**
- Full-page illustrated master flowchart
- Eight entry points flowing to subguide destinations
- Color-coded by subguide identity with pattern fills for monochrome
- This is the visual centerpiece of the entire system

**Page 3 — The Guides**
- Subguide directory cards arranged as a visual grid
- Each card: color swatch, pattern sample, pixel-art mascot, title, one-line description, "start here if…" prompt
- Visual wayfinding, not a table of contents

### 2.2 Subguide Structure

Each subguide is a self-contained document with this structure:

1. **Cover page** — mascot, pattern band, title, one-line description
2. **Emergency gate** — the red-flag invariant holds everywhere; no subguide may skip it
3. **Content chapters** — subguide-colored diagrams and visual aids throughout
4. **Quick reference card** — pocket-printable summary specific to this guide
5. **Sources** — only sources referenced within this subguide
6. **Version info** — subguide-specific revision history

### 2.3 Source Splitting

The monolithic `10-sources.md` splits into per-subguide source files. Each source entry carries a tag indicating which subguide(s) reference it. The build collects the relevant sources for each output target. Sources referenced by multiple subguides appear in each.

### 2.4 The Ten Subguides

| # | Name | Color | Pattern | Mascot | Content Origin | Status |
|---|------|-------|---------|--------|----------------|--------|
| 1 | The Teal Book — Calm Guide | `#2E8B7A` | wave `≈≈≈` | brain sprite (relaxed) | ch.4 + Situations B/E | existing |
| 2 | The Red Book — Self Ambulance | `#C23D2E` | cross `+++` | first-aid kit sprite | ch.5 + Situation C | existing |
| 3 | The Amber Book — Responsibility | `#D4880A` | diamond `◆◆◆` | heart sprite | ch.2 (Situation A) | existing |
| 4 | The Blue Book — Safety & No Place | `#2563EB` | shield `■■■` | shield sprite | Situations D/G/H + 03g/03h | existing |
| 5 | The Olive Book — Zombie Guide | `#4A6741` | crosshatch `╳╳╳` | zombie-hand sprite | ch.6 | existing |
| 6 | The Indigo Book — Professional Support | `#6366F1` | dots `●●●` | book sprite | ch.7 | existing |
| 7 | The Appendix — Reference | `#B5763B` (copper) | solid `━━━` | compass sprite | ch.8 | existing |
| 8 | The Green Book — Body Owner's Manual | `#16A34A` | pulse `∿∿∿` | body sprite | new content | **new** |
| 9 | The Purple Book — Social Field Guide | `#9333EA` | speech `◤◤◤` | speech-bubble sprite | new content | **new** |
| 10 | The Orange Book — Natural Disasters | `#EA580C` | zigzag `⚡⚡⚡` | flame sprite (alert) | new content | **new** |

## 3. Visual Identity System

### 3.1 Per-Subguide Treatment

Every subguide gets five identity elements:

| Element | Implementation | Where It Appears |
|---------|---------------|-----------------|
| **Accent color** | CSS custom property + matplotlib palette entry | Header bands, table headers, diagram borders, callout borders, links, hub card |
| **Pattern fill** | Repeating tile (SVG rendered to PNG) | Headers, chapter dividers, diagram backgrounds, hub card, cover page |
| **Pixel-art mascot** | 32×32 sprite in subguide palette | Cover page, hub directory card, page headers |
| **Header style** | Accent color + pattern as top border or background band on H1 | All H1 elements within the subguide |
| **Diagram palette** | Accent as primary, harmonious secondary derived from accent | All matplotlib/PIL diagrams within the subguide |

### 3.2 Pattern System

Patterns must work in both color and monochrome (grayscale print, colorblind accessibility). Each pattern is structurally distinct — not just a color swap. The patterns:

- **wave** `≈` — horizontal sine curves (Calm)
- **cross** `+` — medical crosses on grid (Ambulance)
- **diamond** `◆` — rotated squares / argyle (Responsibility)
- **shield** `■` — solid blocks / brickwork (Safety)
- **crosshatch** `╳` — diagonal crossing lines (Zombie)
- **dots** `●` — regular dot grid (Professional Support)
- **solid** `━` — horizontal rules / dashes (Appendix)
- **pulse** `∿` — heartbeat/EKG line (Body Manual)
- **zigzag** `⚡` — sharp peaks / seismograph (Natural Disasters)
- **speech** `◤` — overlapping rounded rectangles / bubbles (Social)

### 3.3 Accessibility

- All patterns maintain ≥4.5:1 contrast ratio against their background in both themes
- Pattern + color identity means no information is conveyed by color alone
- All mascot sprites have alt text
- Diagram text meets WCAG AA contrast requirements
- Print stylesheet renders patterns in grayscale without information loss

## 4. Diagram Plan

### 4.1 Diagram Types

| Type | Description | Generator | Existing? |
|------|-------------|-----------|-----------|
| **Flowchart** | Decision routing, triage, escalation | matplotlib FancyBboxPatch | yes — extend |
| **Infographic card** | Key facts with visual hierarchy — numbers, icons, relationships | matplotlib + PIL composite | new |
| **Timeline / sequence** | Step-by-step procedures, "first minute" protocols | matplotlib horizontal flow | new |
| **Comparison chart** | Side-by-side panels (panic vs cardiac, cold vs heat) | matplotlib dual-panel | new |
| **Anatomy sketch** | Body regions, positions, observation zones | PIL pixel art at larger scale | new |
| **Icon grid** | Checklists, inventories, kit contents | PIL sprite grid | extend existing |
| **Data figure** | Evidence claims with denominators, CIs | matplotlib | yes — extend |
| **Map / routing** | Safe-place routing, service finder, disaster zones | matplotlib graph | yes — extend |

### 4.2 Per-Subguide Diagram Inventory

#### Hub (The Map)

| Diagram | Type | Status | Notes |
|---------|------|--------|-------|
| Master flowchart v2 | Flowchart | redesign | Full-page, color-coded by subguide, pattern fills for mono |
| Subguide directory cards | Infographic | new | Visual card per subguide: mascot, color, pattern, description |
| Emergency gate banner | Infographic | new | High-contrast visual emergency routing strip |
| Bathroom axioms | Icon grid | new | Door, water, shelter, choice as illustrated icons |

#### Calm Guide (Teal Book)

| Diagram | Type | Status | Notes |
|---------|------|--------|-------|
| Breathing techniques | Infographic | exists | Box breathing, 4-7-8, physiological sigh |
| Grounding 5-4-3-2-1 | Infographic | new | 5 see, 4 touch, 3 hear, 2 smell, 1 next |
| Panic vs. steady timeline | Timeline | new | Panic arc (rises fast, peaks, subsides) vs steady-state |
| Comfort inventory icons | Icon grid | new | Phone, water, blanket, book, person, candle, music, pen |
| Exit strategy flowchart | Flowchart | new | Deflect / redirect / honest-lite / boundary / leave |
| When calm isn't enough | Flowchart | new | "Can this wait?" routing to 112 / crisis / appointment |

#### Self Ambulance (Red Book)

| Diagram | Type | Status | Notes |
|---------|------|--------|-------|
| Triage flow | Flowchart | exists | Response → breathing → action |
| CPR sequence | Timeline | new | Call → compress → AED. Visual pacing at 100-120/min |
| FAST stroke card | Infographic | new | Face/Arms/Speech/Time as four illustrated panels |
| Wound pressure infographic | Infographic | new | Direct pressure: apply, maintain, don't lift |
| Recovery position | Anatomy sketch | new | Pixel-art body in position with key points labelled |
| Burns cooling protocol | Timeline | new | 20 min cool water → cover → don't: ice/butter/toothpaste |
| First-aid kit contents | Icon grid | new | Practical home kit visual inventory |
| Pain vs. panic comparison | Comparison | new | Cardiac vs panic chest pain — decision support, not diagnosis |

#### Responsibility (Amber Book)

| Diagram | Type | Status | Notes |
|---------|------|--------|-------|
| Entity type decision tree | Flowchart | exists | Biological / animal / social / silicon routing |
| Five-step repair sequence | Timeline | new | Stop → Stabilize → Tell → Repair → Follow up |
| Caregiver dashboard | Infographic | new | Seven domains visual |
| Reproductive health denominators | Data figure | exists | Population estimates with proper denominators |
| Repair worksheet | Infographic | new | Visual fillable card: what → who → what repair |

#### Safety & No Place (Blue Book)

| Diagram | Type | Status | Notes |
|---------|------|--------|-------|
| Safe-place route map | Map | exists | G1-G4 routing |
| Communication access card | Infographic | exists | Six communication adaptations |
| Hazard override matrix | Infographic | exists | Fire/CO/gas/chemical/electrical actions |
| Safety plan card | Infographic | new | One-page fillable safety plan visual card |
| Danger exit flowchart | Flowchart | new | Present threat → memory/message → expected encounter |
| Gas/fire/CO quick-action strip | Timeline | new | 3-step visual strips for each hazard type |

#### Zombie Guide (Olive Book)

| Diagram | Type | Status | Notes |
|---------|------|--------|-------|
| Survival pyramid | Infographic | exists | Air → medical → shelter → water → comms → food |
| Scaling chart | Data figure | exists | 1→100 coordination complexity |
| Dependency continuity map | Map | exists | Medication/device/transport handoff |
| Water storage calculator | Infographic | new | 2L/person/day × people × days with container sizes |
| Evacuation pocket list | Icon grid | new | Visual checklist with icons per category |
| Group roles card | Infographic | new | Coordinator, supply, medic, security, cook |
| Communication channels graph | Data figure | new | C(n)=n(n-1)/2 — why "tell everyone" fails at 10+ |
| Preparedness checklist | Icon grid | new | 10-item illustrated preparedness inventory |

#### Professional Support (Indigo Book)

| Diagram | Type | Status | Notes |
|---------|------|--------|-------|
| IASC pyramid | Infographic | exists | Four-layer support model |
| Support-selection matrix | Flowchart | new | Situation → first route → backup route as visual flow |
| Call script card | Infographic | new | The call template as a visual card for wall/phone |
| Fill-before-deployment card | Infographic | new | Local resources fillable card redesigned as visual |

#### Appendix (Copper)

No new diagrams. The appendix inherits the redesigned master flowchart from the hub and collects the cross-reference table, pocket print cards, and the fillable deployment checklist. Its role shifts from "everything that didn't fit" to "unified reference material that spans multiple subguides" — formulas, the complete text flowchart, and the combined cross-reference index. Content that belongs to a single subguide (like the friends' support guide or the call script) stays in that subguide.

#### Body Owner's Manual (Green Book) — NEW

| Diagram | Type | Notes |
|---------|------|-------|
| Skin check zones | Anatomy sketch | Mirror check: where and what to look for |
| Dental emergency decision tree | Flowchart | Chipped / knocked out / abscess / bleeding gums |
| Digestive event flowchart | Flowchart | Nausea, diarrhea, constipation, blood routing |
| Period emergency kit | Icon grid | Supplies + improvisation options |
| Allergic reaction severity strip | Comparison | Mild (hives) → Moderate (swelling) → Severe (anaphylaxis) |
| Mole check card (ABCDE) | Infographic | Asymmetry, Border, Color, Diameter, Evolving |
| Temperature reading guide | Infographic | Normal ranges, fever thresholds, when to worry by age |

#### Social Field Guide (Purple Book) — NEW

| Diagram | Type | Notes |
|---------|------|-------|
| Awkward situation flowchart | Flowchart | "Someone heard you" / wrong bathroom / ran into ex |
| Hosting emergency card | Infographic | Toilet clogged, no TP, broken lock, unexpected guest |
| Cultural bathroom norms | Comparison | Shoes, sitting/standing, bidet, noise expectations |
| Small-talk fuel gauge | Infographic | "Nodding silently" → "telling a story" with prompts |
| Social battery indicator | Infographic | Charged → leave now spectrum |

#### Natural Disasters (Orange Book) — NEW

| Diagram | Type | Notes |
|---------|------|-------|
| Disaster type decision tree | Flowchart | Earthquake / flood / storm / wildfire / extreme temp |
| Earthquake protocol strip | Timeline | Drop → Cover → Hold On → After: check → evacuate |
| Flood response flowchart | Flowchart | Rising water → elevation → vertical evacuation |
| Lightning safety zones | Infographic | Safe vs dangerous positions, 30/30 rule |
| Heat/cold severity comparison | Comparison | Heat exhaustion → heatstroke and exposure → hypothermia |
| Warning app icons | Icon grid | NINA, Cell Broadcast, radio, siren meanings |
| Beaufort wind scale | Data figure | Visual wind scale: what each level looks like |

### 4.3 Diagram Totals

| Category | Count |
|----------|-------|
| Existing diagrams (kept/redesigned) | ~17 |
| New diagrams for existing subguides | ~22 |
| Diagrams for new subguides | ~19 |
| New mascot sprites | 10 |
| New pattern tiles | 10 |
| **Total new visual assets** | **~61** |

## 5. New Subguide Content

### 5.1 The Green Book — Body Owner's Manual

**Tagline:** "Your body came without documentation. This is the aftermarket manual."

**Sections:**
- **Skin & surface:** Mole checking (ABCDE rule), rashes, sudden bruising, itching, sun damage. When to photograph, when to see a dermatologist.
- **Teeth & mouth:** Chipped/knocked out tooth (the milk trick), abscess, bleeding gums, canker vs cold sore, jaw pain. Dental emergency vs dentist Monday.
- **Digestive events:** Nausea/vomiting, diarrhea, constipation, blood in stool, food poisoning timeline. "Is this the burrito or appendicitis?"
- **Period emergencies:** Unexpected start, heavy flow management, improvised supplies, cramp relief, when flow changes mean a doctor visit.
- **Allergic reactions:** Mild → moderate → severe spectrum, when to use the EpiPen, food vs contact vs drug reactions.
- **Eyes & ears:** Something in the eye, sudden vision change, ear pain, tinnitus, vertigo. Simple fixes vs emergency signs.
- **Temperature:** Fever ranges by age, when to treat vs when to call, thermometer types and their quirks.
- **"Is this normal?" quick-reference:** Visual decision tree for common bathroom-discoverable body phenomena.

**Voice:** Same v4-alt warmth. Informative, never diagnostic. Every section routes to a professional when appropriate. The guide doesn't diagnose — it helps you describe what you're observing and decide how urgently to seek help.

**Safety invariant:** Any symptom suggesting stroke, anaphylaxis, cardiac event, or severe bleeding routes immediately to 112. The red-flag gate appears at the top.

### 5.2 The Purple Book — Social Field Guide

**Tagline:** "A survival guide for the species that invented small talk and regrets it."

**Sections:**
- **Bathroom-specific awkwardness:** Someone heard you, wrong gendered bathroom, locked stall with no TP, the clog, the unfamiliar flush mechanism, the bidet encounter.
- **Hosting emergencies:** Toilet overflow at a party, no hot water for guests, ran out of towels, the broken lock, "someone's been in there 45 minutes."
- **Social battery management:** Recognizing depletion, graceful exits, recharge strategies, the introvert's party survival protocol.
- **Cross-cultural bathroom etiquette:** Shoes on/off, sitting direction, water vs paper, noise expectations, shared vs private norms. Informative, never judgmental.
- **The encounter protocols:** Running into someone unexpected (ex, boss, person you're avoiding), the "we both pretend this isn't happening" dance.
- **Post-bathroom re-entry:** The "what were we talking about?" recovery, handling the long absence, the group that noticed.
- **Entertainment:** Bathroom reading recommendations, tile-counting games, mirror-based exercises, the definitive ranking of bathroom acoustics for singing.

**Voice:** The lightest and funniest of all subguides. This is where the v2.5 personality gets to really stretch. No safety-critical content — the red-flag gate at the top routes anyone in actual distress to the appropriate subguide.

### 5.3 The Orange Book — Natural Disasters

**Tagline:** "The earth doesn't care that you're in the bathroom. Here's what to do about it."

**Sections:**
- **Earthquake:** Drop-Cover-Hold On, aftershock protocol, building assessment, what to do if trapped. Bathroom-specific risks (mirrors, tiles, water heaters).
- **Flood:** Rising water action, vertical evacuation, never walk/drive through, contaminated water after, insurance documentation.
- **Thunderstorm & lightning:** 30/30 rule, indoor safety (avoid plumbing!), outdoor positioning, warning signs, hail protocol.
- **Extreme heat:** Heat exhaustion vs heatstroke recognition, cooling hierarchy, who to check on, the bathroom as a cooling station.
- **Extreme cold:** Hypothermia stages, frostbite recognition, pipe freezing prevention, indoor heating safety (CO crossover with the Blue Book's Situation H).
- **Wildfire smoke:** Indoor air quality, improvised filtration, when to evacuate vs shelter, the N95 decision.
- **Warning systems:** NINA, Cell Broadcast, sirens, radio — what each sounds/looks like and what to do. Germany-specific + general principles.
- **After the event:** Damage documentation, utility safety checks, emotional processing, where to get help.

**Voice:** Serious but not clinical. The v4-alt warmth applies even here — "Your bathroom is one of the sturdier rooms in your home. Use that." Real information, no false reassurance. Every section sources from BBK, DWD, or equivalent authority.

**Safety invariant:** Immediate life-threatening situations (structural collapse, rising water, fire) route to 112. The red-flag gate sits at the top. Cross-references to Blue Book (environmental hazards) and Red Book (injuries) where relevant.

## 6. Build Pipeline Changes

### 6.1 Per-Subguide Output

New npm scripts:

```
npm run build:hub          # Hub triptych only
npm run build:calm         # Teal Book standalone
npm run build:ambulance    # Red Book standalone
npm run build:responsibility # Amber Book standalone
npm run build:safety       # Blue Book standalone
npm run build:zombie       # Olive Book standalone
npm run build:support      # Indigo Book standalone
npm run build:appendix     # Reference standalone
npm run build:body         # Green Book standalone
npm run build:social       # Purple Book standalone
npm run build:disaster     # Orange Book standalone
npm run build:all          # Combined: hub + all subguides
```

Each standalone build produces: HTML, PDF, and optionally LaTeX/DOCX.

### 6.2 CSS Architecture

```
styles/
  base.css              # Reset, typography, shared components
  tokens.css            # Design tokens (colors, spacing, type scale)
  theme-teal.css        # Calm Guide overrides
  theme-red.css         # Self Ambulance overrides
  theme-amber.css       # Responsibility overrides
  theme-blue.css        # Safety overrides
  theme-olive.css       # Zombie Guide overrides
  theme-indigo.css      # Professional Support overrides
  theme-copper.css      # Appendix overrides
  theme-green.css       # Body Owner's Manual overrides
  theme-purple.css      # Social Field Guide overrides
  theme-orange.css      # Natural Disasters overrides
  hub.css               # Hub triptych specific
  print.css             # Print overrides (A4, A4/2, large-print)
```

Each theme file sets `--sg-accent`, `--sg-accent-dim`, `--sg-accent-glow`, `--sg-pattern-url`, and header style overrides. The base CSS references only the token variables.

### 6.3 New Generator Scripts

| Script | Purpose | Phase |
|--------|---------|-------|
| `generate_patterns.py` | 10 repeating tile patterns as PNG tiles for CSS and diagram backgrounds | 1 |
| `generate_mascots.py` | 10 pixel-art mascot sprites, each in its subguide's palette | 1 |
| `generate_hub.py` | Hub-specific: master flowchart v2, directory cards, emergency banner, axiom icons | 1 |
| `generate_infographics.py` | Card-style infographics with icons, numbers, visual hierarchy | 2 |
| `generate_timelines.py` | Horizontal step-by-step procedure strips | 2 |
| `generate_comparisons.py` | Side-by-side comparison panels | 2 |
| `generate_anatomy.py` | Larger-scale pixel-art body diagrams for Body Owner's Manual | 3 |

All generators import from a shared `palette.py` that defines each subguide's color tokens, ensuring consistency between CSS and diagram output.

### 6.4 Source File Reorganization

```
src/
  hub/
    00-cover.md
    01-map.md               # References master flowchart
    02-directory.md          # Subguide cards
  subguides/
    calm/
      chapters/
        01-anxiety.md        # From current 03-situations-b-g.md (B/E sections)
        02-comfort.md        # From current 04-calm-guide.md
      sources.md
      version.md
    ambulance/
      chapters/
        01-first-response.md # From current 05-self-ambulance.md
        02-pain.md           # From current 03-situations-b-g.md (C section)
      sources.md
      version.md
    responsibility/
      chapters/
        01-situation-a.md    # From current 02-situation-a.md
      sources.md
      version.md
    safety/
      chapters/
        01-danger.md         # From current 03-situations-b-g.md (D/F sections)
        02-no-safe-place.md  # From current 03g-safe-place-routing.md
        03-environmental.md  # From current 03h-environmental-hazards.md
      sources.md
      version.md
    zombie/
      chapters/
        01-zombie-guide.md   # From current 06-zombie-guide.md
      sources.md
      version.md
    support/
      chapters/
        01-professional.md   # From current 07-professional-support.md
      sources.md
      version.md
    appendix/
      chapters/
        01-reference.md      # From current 08-appendix.md
      sources.md
      version.md
    body/
      chapters/
        01-skin.md
        02-teeth.md
        03-digestion.md
        04-periods.md
        05-allergies.md
        06-eyes-ears.md
        07-temperature.md
        08-is-this-normal.md
      sources.md
      version.md
    social/
      chapters/
        01-awkwardness.md
        02-hosting.md
        03-social-battery.md
        04-cultural.md
        05-encounters.md
        06-re-entry.md
        07-entertainment.md
      sources.md
      version.md
    disaster/
      chapters/
        01-earthquake.md
        02-flood.md
        03-thunderstorm.md
        04-extreme-heat.md
        05-extreme-cold.md
        06-wildfire-smoke.md
        07-warning-systems.md
        08-after.md
      sources.md
      version.md
  data/
    evidence_facts.json      # Existing, extended
    route_catalog.json       # Existing, extended
    subguide_manifest.json   # NEW: subguide metadata (color, pattern, mascot, chapters, sources)
  diagrams/
    generate_all.py          # Orchestrator (extended)
    generate_flowgraph.py    # Existing
    generate_pixel_art.py    # Existing (extended)
    generate_scientific.py   # Existing
    generate_routes.py       # Existing
    generate_accessibility.py # Existing
    generate_patterns.py     # NEW
    generate_mascots.py      # NEW
    generate_hub.py          # NEW
    generate_infographics.py # NEW
    generate_timelines.py    # NEW
    generate_comparisons.py  # NEW
    generate_anatomy.py      # NEW
    palette.py               # NEW: shared color tokens
```

### 6.5 subguide_manifest.json

Central metadata file that drives the build system:

```json
{
  "calm": {
    "title": "The Teal Book — Calm Guide",
    "accent": "#2E8B7A",
    "accent_dim": "#1F6B5C",
    "pattern": "wave",
    "mascot": "brain_relaxed",
    "chapters": ["calm/chapters/01-anxiety.md", "calm/chapters/02-comfort.md"],
    "sources": "calm/sources.md",
    "version": "calm/version.md",
    "tagline": "Anxiety, panic, breathing, comfort, and exit strategies"
  }
}
```

The build script reads this manifest to: select chapters, apply the correct CSS theme, generate the cover page, append sources, and produce the standalone output.

## 7. Implementation Phases

### Phase 1 — Foundation

**Goal:** Build the infrastructure that all subsequent work depends on.

- Create `palette.py` with all subguide color tokens
- Build `generate_patterns.py` — 10 structurally distinct tile patterns
- Build `generate_mascots.py` — 10 pixel-art mascot sprites
- Create the CSS architecture: `base.css`, `tokens.css`, 10 theme files
- Build `generate_hub.py` — master flowchart v2, directory cards, emergency banner, axiom icons
- Write `subguide_manifest.json`
- Restructure `src/` directory into hub + subguides layout
- Update `build_guide.py` to support per-subguide and combined output
- Update `build_all.sh` and `package.json` with new build targets
- Split `10-sources.md` into per-subguide source files
- Write hub content: cover, map page, directory page

**Estimated new diagrams:** ~6
**Estimated new files:** ~25

### Phase 2 — Existing Subguide Polish

**Goal:** Bring all 7 existing subguides to full visual treatment.

- Build `generate_infographics.py`, `generate_timelines.py`, `generate_comparisons.py`
- Implement ~22 new diagrams for existing subguides (see §4.2)
- Add per-subguide cover pages using mascot + pattern + accent
- Create quick-reference cards for each existing subguide
- Verify all existing content renders correctly in the new per-subguide CSS
- Update all chapter YAML frontmatter for the new directory structure
- Validate red-flag invariant holds in every subguide's standalone output

**Estimated new diagrams:** ~22

### Phase 3 — New Subguides

**Goal:** Write and illustrate the three new guides.

- Write Body Owner's Manual content (8 chapter files)
- Write Social Field Guide content (7 chapter files)
- Write Natural Disasters content (8 chapter files)
- Build `generate_anatomy.py` for Body Owner's Manual
- Generate all ~19 diagrams for new subguides
- Write per-subguide sources for each new guide
- Create quick-reference cards for each new guide
- Update hub flowchart and directory to include new subguides
- Update `route_catalog.json` with new routing entries
- Cross-link between subguides where relevant (disaster → safety, body → ambulance)

**Estimated new diagrams:** ~19
**Estimated new content files:** ~26

### Phase 4 — Integration & Print

**Goal:** Unified output, print optimization, and accessibility.

- Full combined PDF: hub + all 10 subguides in sequence
- Per-subguide standalone PDFs (10 files)
- A4/2 field-strip variants for each subguide
- Large-print variants
- Accessibility verification (`verify_accessibility.py` extended for subguide structure)
- Cross-subguide link validation (`validate_routes.py` extended)
- Final visual consistency pass across all outputs
- Updated deployment checklist and validation pipeline

## 8. Invariants and Constraints

These hold across all phases and all subguides:

1. **Red-flag dominance:** No score, formula, flowchart, or visual element may cancel emergency routing. The red-flag gate appears at the top of every subguide.
2. **Safety denylists:** No fictional cortisol curves, no generic bleach dosing, no personal survival percentages.
3. **Evidence labels:** Every factual claim carries a source reference. The evidence registry extends to cover new content.
4. **Pattern ≠ color:** Every visual identity element must work in grayscale. No information is conveyed by color alone.
5. **Voice:** v4-alt warmth throughout. Humor where it helps, never near a red flag. Direct address, practical personality, the assumption that the reader deserves both accuracy and company.
6. **Self-containment:** Each subguide must be fully understandable without reading any other subguide. Cross-references point to other guides but never require them.
7. **No CDN dependencies:** All assets inline or local. The existing CSP constraint applies to all new output.
8. **Build reproducibility:** `npm run build:all` from a clean checkout produces all outputs. No manual steps.

## 9. Open Questions

None — all clarification questions resolved during brainstorming. The design is ready for implementation planning.
