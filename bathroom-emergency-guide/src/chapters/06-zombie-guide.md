---
title: "Zombie Guide"
chapter: 6
revision: "3.2.0"
last_updated: "2026-05-03"
dependencies:
  - build/diagrams/survival_pyramid.png
  - build/diagrams/scaling_chart.png
  - build/diagrams/survival_probability_function.png
  - build/diagrams/group_complexity_scaling.png
  - build/diagrams/water_requirements_scaling.png
---

# 🧟 Zombie Guide — When "Calm" Isn't the Problem, "Alive" Is

You arrived here from one of two paths: either you created something that hatched during a post-apocalypse, or you followed a biological-entity path that led to zombification. Either way, the social contract you've been operating under has been revoked. The rules are different now. Let's learn the new ones.

> **Important framing:** This guide is half genuine survival knowledge and half thought experiment — because the skills for surviving a zombie apocalypse overlap with the skills for surviving *any* catastrophe: earthquake, flood, economic collapse, prolonged infrastructure failure. If you prepare for zombies, you're prepared for reality. That's the joke that isn't entirely a joke.

![Survival Priority Pyramid](build/diagrams/survival_pyramid.png)

## Survival Probability Function

Before we dive into the practical stuff, let's establish the mathematical framework. Your survival probability over time follows an exponential decay model — not because you're doomed, but because risk accumulates:

$$P(\text{survive}, t) = e^{-\lambda t}$$

Where $\lambda$ is the hazard rate (probability of a fatal event per unit time). The good news: $\lambda$ is not fixed. Every skill you acquire, every resource you secure, every ally you find *reduces* $\lambda$. The survival function becomes:

$$P(\text{survive}, t) = e^{-(\lambda_0 - \sum_{i} r_i) t}$$

Where $\lambda_0$ is the baseline hazard and each $r_i$ is a risk reduction factor: water secured, shelter established, group formed, perimeter defended. The math says: every preparation matters. Every skill moves the curve. You are not helpless — you're a variable in your own survival equation.[^survival_model]

![Survival Probability Function — exponential decay with risk reduction factors](build/diagrams/survival_probability_function.png)

## Mini Survival Guide ("In Nature")

The infrastructure you've depended on is gone. The grid is down. You are, for the first time in your life, an animal in an ecosystem. Act like one — a smart one.

### Water — Priority Zero

You die in 3 days without water. Everything else is secondary.

**Water requirement formula:**

$$W = n \cdot 3\text{L/day}$$

Where $n$ is the number of people in your group and 3L/day covers drinking + basic cooking. This scales linearly but the logistics don't:

| Group size | Daily water need | Weekly water need | Collection effort |
|-----------|-----------------|-------------------|-------------------|
| 1 | 3L | 21L | One person can carry |
| 5 | 15L | 105L | Multiple trips or coordinated |
| 10 | 30L | 210L | Dedicated water duty |
| 30 | 90L | 630L | Well or large water source required |
| 100 | 300L | 2100L | Infrastructure (well, pump, pipeline) needed |

![Water Requirements Scaling — daily water needs by group size](build/diagrams/water_requirements_scaling.png)

1. **Find it.** Flowing water (streams, rivers) is better than standing water (ponds, puddles). Rainwater is generally safe to collect. Dew can be gathered with cloth wrung into a container.
2. **Purify it.** Always assume water is contaminated. Methods, ranked by reliability:
   - **Boil** for 1 minute (3 minutes above 2000m elevation). Gold standard. Kill everything.
   - **Filter** through cloth + sand + charcoal layers (improvised). Removes particulates and some pathogens.
   - **Chemical treatment:** 2 drops of unscented household bleach per liter, wait 30 minutes. Or water purification tablets.
   - **UV exposure:** Clear plastic bottle, leave in direct sunlight for 6+ hours. UV kills pathogens. Slow but works.
3. **Store it.** Every container you find is now a water container. Fill everything. You will never have too much water.

### Food

You can survive ~3 weeks without food. That's generous compared to water, but your cognitive function degrades fast without calories.

**Caloric requirements:**

$$E_{basal} \approx 1500 \text{ kcal/day} \quad \text{(resting metabolic rate)}$$
$$E_{survival} \approx 2500\text{–}3000 \text{ kcal/day} \quad \text{(active survival activity)}$$

The gap between basal and active survival requirements ($\Delta E \approx 1000\text{–}1500$ kcal) is the energy you spend on foraging, building, defending, and moving. Every unnecessary activity burns calories you can't afford to waste.

1. **Foraging.** Learn 3–5 easily identifiable local wild plants that are edible. Dandelion (entire plant), nettles (cook first), blackberries, wild garlic — widespread across Europe. If you can't identify it with certainty, don't eat it. Starvation is preferable to poisoning.
2. **Hunting/trapping.** Small game (rabbits, birds) is more practical than large game. Snares require wire and knowledge. Fishing requires water and patience. Principle: calories-in > calories-out. Don't spend more energy catching food than the food provides.
3. **Scavenging.** In a collapse scenario, preserved food in abandoned stores is your friend. Canned goods last years. Check seals — bulging cans are bacterial, not food. Prioritize: canned > dried > fresh (perishable).
4. **Insects.** Yes, really. Crickets, grubs, ants — high protein, widely available, no hunting skill required. Cook them if you can. If you can't, they're still more nutritious than your pride.

### Shelter

Exposure kills faster than starvation. Hypothermia: wet + cold + wind.

1. **Location.** High ground (avoid flood zones), away from obvious paths (avoid detection), near water source but not directly beside it.
2. **Insulation.** Layers of dry leaves, pine needles, cardboard, clothing — anything between you and the ground. The ground is a heat sink.
3. **Windbreak.** A wall, hedge, car, or stacked debris blocking the prevailing wind direction. Wind strips heat. Block it.

### Reading Traces & Observing Environments

- **Tracks.** Disturbed dirt, broken twigs, bent grass — direction and recency. Fresh tracks have sharp edges; old ones are rounded by wind and rain.
- **Sound.** Learn the baseline soundscape. Anything that breaks the baseline is information. Birds alarm-calling = predator nearby.
- **Smell.** Smoke = fire = other humans (or uncontrolled wildfire). Rotting = biological hazard. Cooking food = people, potentially friendly.
- **Patterns.** Zombies (canonical model) are attracted to sound and movement. Move quietly, deliberately, in shadow when possible.

### Energy

Conserve it. The survival economy is brutally simple:

```
  Energy in (food) ──→ Energy out (activity)

  Rule: If the activity doesn't contribute to survival,
        don't do it. Panic running is energy waste.
        Strategic walking is energy investment.
```

### Hygiene

The thing that kills most people in disaster scenarios isn't the disaster itself — it's the infection that follows. Cholera, dysentery, and wound sepsis have killed more humans than every zombie movie combined.

- **Defecate** away from water sources and camp. Bury it. Minimum 30m from water, 30m from shelter.
- **Wash hands** with ash and water if soap is unavailable. Ash is alkaline and breaks down oils/bacteria.
- **Wounds** must be cleaned immediately. Even small cuts can become lethal in a low-hygiene environment.
- **Teeth.** If you find a toothbrush, it's more valuable than you think. Improvise: chewed stick (miswak technique), salt water rinse.

## Mini Collapsing Society Guide

The immediate danger has passed (or you've adapted). Now: the infrastructure that kept 8 billion humans alive is degraded or gone. You need to rebuild some of it, locally.

### Gathering Remaining Resources

Priority order — not by what's valuable, but by what's *irreplaceable*:

| Priority | Resource | Why it matters | Notes |
|----------|----------|---------------|-------|
| 1 | **Medical** | Drugs, equipment, and most critically: **medical personnel** | A trained nurse is worth 1000 crates of supplies. Protect them. |
| 2 | **Bicycles** | Transportation that doesn't require fuel. Silent. Maintainable. | Cars need fuel, fuel degrades, fuel is loud. Bikes are the post-apocalypse vehicle. |
| 3 | **Water source** | A well, spring, or clean river access point | Secure it. Defend it. Share it strategically. |
| 4 | **Energy source** | Solar panels, batteries, generators, firewood | Renewable > consumable. Solar panels are permanent; fuel is finite. |
| 5 | **Sustainable materials** | Seeds, soil, tools, fabric, rope, metal, knowledge | The stuff you can't loot — you have to produce. |
| 6 | **Tech** | Radios, phones (offline tools), reference books | A first-aid manual > smartphone with no network. Books don't need charging. |

**Looting etiquette (yes, even now):** If someone else is already there, the resource is theirs by occupancy. Fight only if the cost of fighting is less than the value of the resource. It almost never is. Cooperation > conflict. Always.

### Securing Friends + People in Need

You cannot survive alone long-term. The lone wolf dies. The pack lives.

1. **Find your people.** Start with people you know and trust. Expand outward. Trust is transitive but degrades with distance — one degree of separation is reliable, two is uncertain, three is stranger.
2. **Rescue those who need it.** Children, elderly, injured, isolated — these people cost resources short-term and provide social cohesion and meaning long-term. A community that abandons its vulnerable will collapse from the inside.
3. **Vetting newcomers.** Everyone gets a trial period. Observe behavior under stress. Do they share? Do they lie? Do they pull their weight? Three strikes is generous; two is practical.

### Group Communication Channels

As your group grows, communication complexity explodes. The number of pairwise communication channels in a group of $n$ people is:

$$C(n) = \frac{n(n-1)}{2}$$

| Group size | Channels $C(n)$ | Implication |
|-----------|----------------|-------------|
| 3 | 3 | Everyone talks to everyone. Easy. |
| 5 | 10 | Still manageable, but some conversations get missed. |
| 10 | 45 | You need structured communication. |
| 20 | 190 | Without systems, information is lost constantly. |
| 50 | 1,225 | Formal communication channels are mandatory. |
| 100 | 4,950 | Hierarchy or network structure required. |

This is why small groups feel "tight" and large groups feel "bureaucratic" — the communication channels scale quadratically. You can't fight the math. You can only design systems that acknowledge it.[^communication_channels]

### Dunbar Numbers — The Social Brain Hypothesis

Robin Dunbar's research on primate neocortex size and social group sizes produced a series of concentric circles of human social capacity:[^dunbar]

$$D_n = 5 \cdot 3^{n-1} \quad \text{for } n \in \{1, 2, 3, 4, 5\}$$

| Layer | Size | Relationship quality | In survival context |
|-------|------|---------------------|-------------------|
| $D_1$ | ~5 | Intimate support group | Your inner circle. Trust with your life. |
| $D_2$ | ~15 | Close friends | Reliable allies. Regular contact. |
| $D_3$ | ~50 | Casual friends | Know their names and skills. Occasional contact. |
| $D_4$ | ~150 | Meaningful contacts | Recognize faces. Know reputations. |
| $D_5$ | ~500 | Acquaintances | Names might ring a bell. Expanding network. |

The implication for survival groups: at ~5 people, you have deep mutual knowledge. At ~15, you need explicit coordination. At ~50, you need sub-groups and representatives. At ~150, you need formal governance. The Dunbar numbers aren't just social science — they're the scaling limits of trust, and trust is the currency of survival.

### Self-Defense (Last Resort)

The math of violence is always bad: winner is still injured and spent resources; loser is dead or vengeful; avoider is intact with resources preserved.

1. **Situational awareness.** See threats before they become fights. The best fight is the one that never happens.
2. **Barriers.** Doors, walls, fences, distance. Obstacles buy time, and time buys options.
3. **Improvised weapons.** Reach (sticks, pipes) > edge (knives, glass) > weight (rocks, hammers). Reach keeps them away. That's the whole point.
4. **Numbers.** A group of 3 is harder to attack than a group of 1. This is the fundamental math of defense.

### Water · Energy · Hygiene at Scale

- **Water:** 3 liters per person per day (drinking + cooking). 10 people = 30L/day. A well producing 100L/day supports ~30 people.
- **Energy:** One solar panel (~300W) supports basic lighting + phone charging for a small group. Heating and cooking require significantly more. Prioritize: cooking > light > comfort.
- **Hygiene:** Latrines must scale with population. 1 latrine per 20 people, minimum. A cholera outbreak in a group of 50 with no sanitation will kill more than any zombie ever did.

## Mini Building Society Guide

You've survived. Now you need to *live*. Organizing, making decisions together, building something that outlasts the crisis.

### Organizing: The First Meeting

1. **Agenda for Meeting #1:**
   - Who's here? (Names, skills, needs)
   - What do we have? (Resource inventory)
   - What do we need? (Gap analysis)
   - Who does what? (Role assignment)
   - When do we meet again? (Daily at first, then weekly)

2. **Roles to fill immediately:**
   - **Coordinator** — keeps the schedule, calls meetings, tracks decisions (facilitator, not leader)
   - **Supply manager** — tracks resources in and out
   - **Medic** — whoever has the most medical knowledge
   - **Security** — awareness, not aggression
   - **Cook** — communal meals build trust faster than any meeting

### Ostrom's 8 Principles for Common-Pool Resource Governance

Elinor Ostrom won the Nobel Prize in Economics (2009) for her work on how communities govern shared resources without top-down control. Her 8 design principles are the closest thing to a proven blueprint for self-governance:[^ostrom]

1. **Clearly defined boundaries** — Who can use the resource? Who can't?
2. **Congruence with local conditions** — Rules fit the actual situation, not an abstract ideal
3. **Participatory decision-making** — People affected by the rules help make them
4. **Monitoring** — Someone watches the resource and the rule-followers
5. **Graduated sanctions** — Small violations get small penalties, not exile
6. **Conflict resolution mechanisms** — Fast, cheap, fair dispute resolution
7. **Minimal recognition of rights** — External authorities don't undermine local governance
8. **Nested enterprises** — Large systems are built from smaller, self-governing units

These principles emerged from studying fisheries, irrigation systems, forests, and pastures — real communities managing real scarce resources over centuries. They work because they align incentives with consequences. A community that follows all 8 is remarkably resilient. A community that ignores them is, historically, short-lived.

### Forms of Self-Administration

| Model | How it works | Best for | Weakness |
|-------|-------------|----------|----------|
| Consensus | Everyone must agree. Discussion until unanimous. | Small groups (≤8) | Slow. One holdout blocks everything. |
| Consent | Decisions proceed unless someone objects with reason. | Small-medium (≤25) | Faster. Requires trust. |
| Voting | Majority wins. Simple, familiar. | Medium (≤100) | Minority gets overridden. |
| Delegation | Groups elect representatives who decide. | Large (100+) | Distance between decision-makers and affected people. |
| Rotation | Roles rotate on a fixed schedule. | Any size | Inconsistent leadership. |

**Recommendation:** Start with Consent for day-to-day, Voting for big decisions. Adjust as you scale.

### Psychology of the Masses / Sociology Basics

- **Us vs. Them.** The most powerful social force. It can unite against an external threat — or split from within. If someone is trying to convince you that a subgroup within your community is the enemy, *that person is the actual threat*.
- **Conformity pressure.** Solomon Asch showed people will deny the evidence of their own eyes to agree with a group. If everyone says the water is safe and you think it isn't — speak up. Dissent is a survival skill.
- **Diffusion of responsibility.** "Someone else will handle it." Assign specific tasks to specific people. "Someone check the perimeter" = nobody checks. "Anna, check the perimeter at 2100" = perimeter gets checked.
- **Authority capture.** In crisis, people defer to whoever seems most confident. Confidence ≠ competence. The quiet person with the notebook is probably right.

### Group Complexity Scaling

As groups grow, the internal complexity grows faster than the headcount. We can model this as:

![Group Complexity Scaling — communication channels, governance layers, and management overhead](build/diagrams/group_complexity_scaling.png)

### Scaling Requirements: 1 → 10 → 100

![Scaling Chart](build/diagrams/scaling_chart.png)

| Scale | Key challenge | What breaks | What to add | Dunbar layer |
|-------|--------------|-------------|-------------|-------------|
| 1 person | Loneliness, skill gaps | Nothing — it's just you | Find people. Any people. | $D_1$ (you) |
| 2–5 | Communication, trust | Unspoken expectations | Explicit agreements, shared meals | $D_1$ (intimates) |
| 6–10 | Coordination, role clarity | "I thought you were doing that" | Regular meetings, written task lists | $D_2$ (close friends) |
| 11–25 | Decision speed | Consensus too slow | Switch to Consent or Voting | $D_2$→$D_3$ transition |
| 26–50 | Sub-groups form | Information silos | Communication channels, representatives | $D_3$ (casual friends) |
| 51–100 | Governance complexity | Power concentration | Formal roles, accountability, rotation | $D_4$ (meaningful contacts) |
| 100+ | Institutional memory | Forgetting why decisions were made | Written records, onboarding for newcomers | $D_5$ (acquaintances) |

The pattern: every time you roughly double the group, your coordination systems need to level up. Don't wait for things to break — anticipate the next scale and prepare before you reach it. The Dunbar numbers tell you approximately where the breakpoints are; Ostrom's principles tell you how to build the structures that bridge them.

[^survival_model]: The exponential survival model $P(t) = e^{-\lambda t}$ is the foundation of survival analysis in statistics and reliability engineering. It assumes a constant hazard rate, which is a simplification — real hazard rates change with environment, season, and preparation level. The modified model $P(t) = e^{-(\lambda_0 - \sum r_i)t}$ is a proportional hazards approximation (Cox, 1972). Each risk reduction factor $r_i$ effectively shifts the entire survival curve upward.

[^communication_channels]: The formula $C(n) = n(n-1)/2$ for pairwise communication channels comes from combinatorics — it's the number of edges in a complete graph $K_n$. In organizational theory, this is known as the "communication overhead" problem. For $n > 10$, most organizations introduce hierarchical or network structures to reduce the effective number of channels any one person must maintain. See: March, J.G. & Simon, H.A. *Organizations* (1958).

[^dunbar]: Dunbar, R.I.M. "Neocortex size as a constraint on group size in primates." *Journal of Human Evolution* 22(6), 469–493 (1992). The formula $D_n = 5 \cdot 3^{n-1}$ is an approximation — the actual numbers vary by ±20% across individuals and cultures. The key insight is the concentric structure and approximate scaling factor of 3, not the precise values. These numbers apply to face-to-face relationships; digital communication may extend some layers but doesn't fundamentally change the cognitive constraints.

[^ostrom]: Ostrom, E. *Governing the Commons: The Evolution of Institutions for Collective Action* (1990). Cambridge University Press. Ostrom's 8 principles were derived from meta-analysis of long-enduring common-pool resource institutions worldwide. She demonstrated that communities can self-govern without either privatization or state control — a finding that overturned decades of conventional wisdom (the "tragedy of the commons" narrative). These principles are directly applicable to any post-crisis community managing shared resources.
