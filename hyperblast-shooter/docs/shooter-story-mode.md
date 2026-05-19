# Space Shooter Story Mode

## Design intent

Story mode is always enabled, but it should remain unobtrusive. It does not pause the arcade loop, does not open cutscenes, and does not force exposition. It communicates through small monospace internal messages, subtle event comments, and occasional environmental hints.

The player should feel like they discovered a larger war by trying to survive a normal escape.

## UI language

Story messages are written as short internal vessel/pilot lines:

    internal> ok, lets get out of here..
    internal> man whats that?

Rules:

- Keep lines short.
- Use lowercase and informal phrasing for early pilot thoughts.
- Prefer implication over explanation.
- Never block controls.
- Prefer rare messages over constant chatter.
- Let gameplay reveal the stakes before lore explains them.

## Current patch: escape from the first breach

### Opening beat

A few seconds after game start, the controlled vessel emits:

    ok, lets get out of here..

Meaning:

- The pilot is already fleeing.
- The first scene starts in motion.
- The player does not yet know the full situation.
- The vessel is still small, under-equipped, and improvising.

### First irregularity

When enemy pressure rises beyond normal patrol density, the vessel emits:

    man whats that?

Meaning:

- The attack pattern is not normal piracy or patrol conflict.
- Something larger is entering local space.
- The player receives a soft gameplay hint: more enemies are not just difficulty, they are part of the invasion.

### First boss clue

When the first boss appears, the current story event says:

    that is not patrol hardware.

Meaning:

- The enemy technology is organized and militarized.
- The player is no longer dealing with isolated raiders.
- The invasion fleet has command units.

## Act I: Flight from the invasion

The early game follows one vessel escaping from a collapsing local system. The player begins as a civilian/worker pilot, courier, dock runner, or maintenance craft operator pressed into combat by necessity.

The alien invasion should initially appear as confusion:

- too many enemy contacts
- strange ship silhouettes
- automated blockade behavior
- civilian channels going silent
- bosses that look like industrial occupation machinery

The player is not a chosen hero. They are someone with a ship, a route out, and no safe place to land.

### Early message tone

Examples for future events:

    internal> no station beacon.
    internal> they are cutting the lanes.
    internal> thats a refinery tug, why is it armed?
    internal> dont look back.
    internal> signal is full of screaming.

## Act II / v2: Rebel sources and underground routes

After the escape layer is stable, v2 should introduce rebel sources. These are not yet a full faction UI. They begin as scraps, contacts, and rumors gathered during play.

### Rebel source types

- Dockworker relays
- Smuggler beacons
- Mining union caches
- Defector coordinates
- Encrypted worker songs used as navigation keys
- Sabotaged alien logistics manifests
- Shipyard bartenders who know too much

### Gameplay hooks

Possible v2 systems:

- Rebel intel pickups from destroyed elites
- Bar contacts in the shipyard
- Temporary ally discounts after rescue events
- Stage modifiers unlocked through intelligence
- Hidden routes that reduce boss pressure
- Convoy rescue side events
- Blueprints for shields, allies, and industrial weapons

### Story direction

The pilot discovers the invasion is not merely extermination. The aliens are occupying industrial worlds and forcing humans into extraction labor. The first rebel cells are not military institutions; they are workers, mechanics, miners, haulers, and station crews communicating through hacked logistics systems.

The player slowly changes role:

    fleeing survivor
      -> courier for scattered cells
        -> armed escort for rebel logistics
          -> visible symbol of resistance

### v2 message tone

    bar> miners left you coordinates.
    relay> dont answer official channels.
    internal> they made the docks into cages.
    contact> bring tools, not flags.
    bar> rebellion starts with spare parts.

## Act III / v3: Freeing the enslaved human worlds

The long arc moves toward an epic campaign of liberation. Human worlds are enslaved under alien occupation, and the resistance becomes a historical revolution led by workers who understand the infrastructure of empire.

This should not become a simple royal war or hero prophecy. The liberation is collective:

- shipyard crews refit civilian vessels
- miners sabotage extraction lines
- dockworkers redirect supply fleets
- factory workers corrupt alien production queues
- pilots protect evacuation and strike routes
- rebel councils replace occupation administrators

The player's ship remains important, but the story emphasizes that no single pilot frees a world alone.

### v3 gameplay ambitions

- Liberated-world map layer
- Occupation strength per system
- Rebel supply lines
- Worker council support meters
- Mass uprising events
- Fleet actions unlocked by local organization
- Bosses as occupation governors, factory minds, and orbital prison engines
- Final campaign against the alien logistics core

### v3 narrative arc

The player begins by escaping. They survive long enough to carry messages. They carry enough messages to form routes. The routes become supply lines. The supply lines become councils. The councils become fleets.

The revolution is historical because it is material: the people who built the occupied worlds know where every dock, furnace, pressure valve, transit tunnel, and power relay is. The invaders control the command towers, but the workers control the machinery that makes the towers possible.

### v3 message tone

    council> the refinery voted at dawn.
    relay> three worlds are striking.
    internal> they cant occupy every wrench.
    fleet> prison moon shields are down.
    council> today we stop running.

## Story pipeline roadmap

### Implemented now

- Always-on story state
- Once-only event emission
- Intro escape line
- Enemy-pressure irregularity line
- First boss line
- Unobtrusive monospace message panel

### Recommended next patches

1. Add more event predicates:
   - first ally hired
   - first shield deployed
   - first boss defeated
   - first stage 3 arrival
   - low health escape moment

2. Add story tags to gameplay objects:
   - alien
   - patrol
   - occupation
   - rebel
   - worker-made

3. Add a shipyard bar narrator:
   - bartender comments
   - rebel contact hints
   - ally backstory snippets

4. Add persistent story log:
   - discovered messages
   - rebel intel notes
   - system rumors

5. Add v2 rebel sources:
   - intel pickups
   - route unlocks
   - shipyard contacts

6. Add v3 liberation map:
   - occupied worlds
   - worker councils
   - revolt phases
   - fleet support

## Tone constraints

The story should remain anti-grandiose early. Start with fear, exhaustion, and improvisation. Let the epic scale emerge from repeated small acts of survival and solidarity.

The first line is not a manifesto. It is someone trying to leave alive:

    ok, lets get out of here..

The revolution comes later.
