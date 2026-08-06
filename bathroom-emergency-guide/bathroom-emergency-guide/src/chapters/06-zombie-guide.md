---
title: "The Olive Book — Zombie Guide"
chapter: 6
revision: "4.14.0-alt.2"
last_updated: "2026-08-06"
dependencies:
  - build/diagrams/dependency_continuity_map.png
  - build/diagrams/survival_pyramid.png
  - build/diagrams/scaling_chart.png
  - build/diagrams/vega_household_water_stock.png
  - build/diagrams/vega_communication_channels.png
  - build/diagrams/vega_continuity_dependencies.png
  - build/diagrams/household_continuity_board.png
  - build/diagrams/first_meeting_roles.png
---

# The Olive Book — Zombie Guide

No confirmed zombie outbreak is known. Power cuts, floods, heat, cold,
contaminated water, smoke, communication failures, and groups improvising a
constitution before locating the first-aid kit are real enough.

Infrastructure is mostly invisible while it works. Failure turns background
assumptions—water, temperature, medication, charging, sewage, transport, and
trustworthy information—into a queue. Survival is less about wilderness theatre
than maintaining those dependencies in the right order.

## Verify before optimizing

Before rationing toothpaste or founding a perimeter committee, verify that the
crisis exists and identify what kind of failure is actually occurring.

1. Check official warnings: **NINA**, Cell Broadcast, local radio, municipality,
   police, fire service, or BBK.[^bbk-warning]
2. Identify the hazard: fire, flood, chemical release, outage, heat, cold,
   violence, or ordinary rumour wearing tactical trousers.
3. Decide whether authorities say **shelter** or **evacuate**.
4. Tell one other person what you know and where you are.
5. Recheck the source before forwarding it.

Do not leave a safe building merely because a group chat has cinematic energy.

## Survival probability — valid mathematics, unusable prophecy

A standard survival function can be written as

$$S(t)=\exp\left(-\int_0^t h(u)\,du\right)$$

where $h(u)$ is a hazard rate. Without measured hazards this predicts nothing
about your personal future. Its practical lesson is simpler: reduce known
hazards—smoke, unsafe water, cold, heat, isolation, untreated illness—instead of
inventing a percentage for survival.

![Priority pyramid for disrupted infrastructure](build/diagrams/survival_pyramid.png)

## Mini survival guide — in nature or infrastructure failure

### Priority order

The exact order depends on the hazard, but a useful default is:

1. immediate safety and breathable air;
2. urgent medical needs;
3. protection from heat, cold, wind, and rain;
4. reliable water;
5. communication and location;
6. food and medication continuity;
7. hygiene and longer-term organization.

Food is important. It is rarely the first ten-minute problem unless someone has
a condition requiring immediate intake.

### Household continuity board

![Household continuity systems and ownership fields](build/diagrams/household_continuity_board.png)

{{visualization:vega-continuity-dependencies}}

The second figure is an architecture audit, not a danger score. **Depends on**
counts the prerequisites named by one system; **supports** counts how many other
systems name it. A high count means “expect handoffs and cascading effects,” not
“this will fail first.”

A disrupted household is easier to reason about as eight functions rather than a
pile of objects:

| Function | Status question | Record now |
|---|---|---|
| information | what is confirmed and when is the next update? | source, owner, next check |
| air and hazard | is the place safe to occupy? | safe area, re-entry authority |
| care and power | what treatment, device, medicine, or caregiver cannot pause? | runtime, approved backup, destination |
| water | what is safe and how much remains? | stock, rate of use, refill route |
| temperature and shelter | can everyone stay dry, ventilated, warm or cool enough? | vulnerable people, room status, move trigger |
| food and cooking | what can be prepared safely with current water and power? | refrigeration, allergies, next meal |
| sanitation | how are hands, toilets, waste, and clean zones separated? | toilet status, waste route, supplies |
| access and transport | who cannot receive a warning, leave, enter, or travel without help? | person, helper, route, keys, communication |

For every active function, write **status, remaining safe window or stock, named
owner, backup, next action, review time, and failure escalation**. “Someone is
handling water” is not continuity. “Mara checks the sealed-water count at 18:00;
Deniz is backup; below twelve litres we call the distribution point” is.

### Water — priority zero after air and immediate safety

For household emergency storage, current BBK guidance recommends ideally
**2 litres per person per day**, including about 0.5 L for cooking. For $n$
people over $d$ days:

$$W = 2nd\;\text{litres}$$

{{visualization:vega-household-water-stock}}

The BBK’s current staged advice is pleasantly non-apocalyptic: aim to manage for
**ten days**, but a stock for **at least three days already helps** and can be
built gradually. At the two-litre planning value, one person needs 6 L for three
days or 20 L for ten; a four-person household needs 24 L or 80 L. Containers,
weight, storage space, and rotation are part of the equation even when algebra
would prefer not to carry bottles upstairs.[^bbk]

Add pet needs. Heat, illness, pregnancy, breastfeeding, medication, and physical
work can increase requirements.

- Store potable water in clean food-safe containers.
- Rotate stock according to product and container guidance.
- Follow local boil-water or do-not-use notices exactly.
- Filtering cloudy water through cloth removes particles, not dissolved
  chemicals or all microorganisms.
- Boiling does not remove fuel, solvents, pesticides, salt, or radioactive
  contamination.
- Do not use generic bleach-drop recipes: products and concentrations differ.
- Separate drinking-water containers from washing and waste containers.

### Finding and evaluating water

In a genuine emergency, official distribution points and sealed household
supplies are preferable to improvised natural sources. Surface water can contain
microorganisms, sewage, agricultural runoff, or chemicals even when clear.

If no safe source exists, contact authorities or emergency services for current
local instructions. A four-line universal purification recipe would be
comforting, compact, and dishonest.

### Shelter

Exposure can become urgent long before hunger.

Use the available building or location only if it is safer than the hazard.
Consider:

- **flood:** move away from flowing water and follow evacuation orders;
- **fire/smoke:** leave immediately; never shelter in smoke;
- **chemical release:** follow official indoor-shelter or evacuation guidance;
- **cold/wind/rain:** stay dry, block wind, insulate from ground, add layers;
- **heat:** shade, ventilation, hydration, reduced exertion, check vulnerable
  people;
- **storm:** avoid windows, loose objects, trees, and exposed structures.

For outdoor temporary shelter, insulation below the body matters as much as
material above it. Use dry clothing, mats, cardboard, blankets, or vegetation
only when safe and permitted. Do not choose flood channels, unstable slopes,
rockfall zones, dead trees, or a charming patch directly beneath lightning.

### Thermoregulation — heat balance without survival cosplay

Body temperature reflects heat production and heat loss. A conceptual balance
is:

$$\Delta H = M - (C + K + R + E)$$

where $M$ is metabolic heat and the remaining terms represent convection,
conduction, radiation, and evaporation. This is explanatory, not a home
calculation.

Cold prevention:

- get out of wind and wet;
- remove wet clothing when dry replacement and shelter are available;
- insulate from the ground;
- cover head and body;
- avoid alcohol;
- call **112** for confusion, drowsiness, loss of coordination, reduced
  shivering, or suspected significant hypothermia.

Do not rub cold limbs or apply intense direct heat. Current DRK guidance favors
slow warming, protection from further cold, and emergency assessment.[^drk-cold]

Heat prevention:

- move to shade or a cooler place;
- reduce exertion and excess clothing;
- drink normally when safe;
- cool skin with water and airflow;
- check infants, older adults, chronically ill people, and anyone unable to
  communicate or move independently;
- call **112** for confusion, collapse, seizure, hot altered person, or severe
  symptoms.

### Air, fire, and carbon monoxide

Never run generators, charcoal grills, camping stoves, or combustion heaters
inside a home, garage, cellar, tent, or bathroom. Carbon monoxide is colourless
and odourless. Move to fresh air and call **112** if poisoning is suspected.

Unknown gas or chemical smell means no matches and no electrical switches.
Leave if safe and call from outside.

### Food

- Use refrigerated perishables first while they remain safe.
- Keep fridge and freezer doors closed during outages.
- Follow official discard guidance after prolonged outages or flooding.
- Smell and appearance cannot detect every pathogen or toxin.
- Store familiar foods that household members can actually eat and prepare with
  available water and energy.
- Include infant, allergy, disability, cultural, and pet needs.
- Do not forage from a bathroom guide. Plant identification by vibes has a poor
  safety record.

### Medication

- Keep an up-to-date medication and allergy list.
- Maintain a reasonable reserve agreed with prescriber or pharmacy.
- Plan refrigeration, power, administration equipment, and replacement routes.
- Keep medicines dry, labelled, and away from children.
- Do not ration or substitute prescription medicines without professional
  advice unless an emergency plan specifically instructs it.

### Essential medication and powered-device failure

![Essential treatment and powered-device continuity map](build/diagrams/dependency_continuity_map.png)

An outage becomes a medical route when a treatment, device, storage condition,
caregiver, or accessible transport cannot be safely bridged. Do not wait for the
last battery bar to become emotionally persuasive.

Use this queue:

1. **Action — identify the function.** What treatment or device is essential?
   What failed? How much approved battery runtime, medication, oxygen, cooling,
   or caregiver coverage remains?
2. **Backup — use the personal plan.** Switch only to an approved battery,
   reserve, alternate administration method, backup caregiver, or powered
   destination already specified by the care team or manufacturer.
3. **Escalation — call early.** Contact the supplier, pharmacy, prescriber, care
   service, or **116 117** while a safe bridge still exists. Call **112** when a
   life-supporting function is interrupted, breathing or consciousness changes,
   or transfer cannot be completed before the safe reserve ends.
4. **Destination — move before exhaustion.** Go to a known staffed, powered,
   accessible place. Tell them the device, treatment, remaining runtime, power
   need, mobility/communication needs, and transport constraints.

Do not improvise voltage, connectors, oxygen flow, refrigeration temperature,
medication dose, or fuel use. A technically creative adapter is not improved by
being attached to someone’s breathing.

Record these before an outage:

| Field | Household value |
|---|---|
| essential device or treatment | |
| power draw / battery runtime / storage range | |
| approved backup and where it is | |
| supplier, pharmacy, prescriber, care service | |
| accessible powered destination | |
| transport and who can help | |
| 112 escalation condition | |

### Reading traces and observing the environment

“Reading traces” means situational awareness, not wilderness detective theatre:

- note water level, smoke direction, wind, damaged power lines, unstable walls,
  blocked exits, animal behaviour, traffic, and official markings;
- compare changes over time;
- photograph conditions when safe;
- mark hazards for others;
- never enter a dangerous area merely to obtain better evidence.

Observation serves decisions. It does not make the observer invulnerable.

### Energy

Use energy in this order:

1. life-supporting medical devices and emergency communication;
2. lighting and information;
3. refrigeration where medically or food-safety critical;
4. cooking and thermal comfort;
5. everything else.

- Charge devices while power exists.
- Use power banks and batteries safely.
- Keep flame-based lighting away from gas, oxygen, children, and combustibles;
  battery lights are preferable.
- Never back-feed household wiring with improvised generator connections.
- Ventilate and follow manufacturer guidance for any appliance.

### Pareto principle — useful attention, not a literal law

The 80/20 rule is a heuristic: a few actions often produce most immediate
benefit. Here those are usually:

- leave the active hazard;
- call for help;
- protect air and temperature;
- secure water and medication;
- establish reliable information and roles.

Do not spend the first hour color-coding canned beans while smoke enters the
stairwell.

### Hygiene

Reserve clean water for drinking and essential food preparation. Keep hands
clean after toilet use and before food handling. Separate clean and dirty zones.
If toilets fail, follow municipal sanitation guidance and contain waste away
from food, living areas, and water sources.

Useful supplies include soap, sanitizer where appropriate, toilet paper,
menstrual products, nappies, waste bags, gloves, disinfectant used according to
label, and personal care supplies.

## Mini collapsing-society guide

The phrase is deliberately dramatic. Most real events are temporary service
failures, local disasters, evacuations, or strained institutions. Behave in a
way that remains sensible when the power returns and everyone remembers your
name.

### Gathering remaining resources

1. inventory before acquiring more;
2. record owners and shared stock;
3. prioritize water, medication, food safety, warmth/cooling, communication,
   care supplies, and sanitation;
4. avoid dangerous or illegal entry;
5. distribute by need and agreed rules;
6. keep a visible reserve rather than hiding every uncertainty in one cupboard.

A simple stock table:

| Resource | Quantity | Daily use | Owner/shared | Reorder/escalation |
|---|---:|---:|---|---|
| water | | | | |
| medication | | | | |
| food | | | | |
| batteries | | | | |
| hygiene | | | | |

### Capability inventory

Supplies are only one kind of capacity. Record useful human and infrastructural
capabilities too:

| Capability | Person / place | Available until | Backup |
|---|---|---|---|
| first aid or clinical knowledge | | | |
| medication, device, or care knowledge | | | |
| translation or communication access | | | |
| repair, electrical, plumbing, or building knowledge | | | |
| transport, lifting, or accessible transfer | | | |
| cooking, sanitation, childcare, or animal care | | | |
| radio, printing, mapping, or record keeping | | | |

Do not turn a skilled person into an inexhaustible public utility. Name relief,
backup, and a handoff route for them as well.

### Securing friends and people in need

Check people who may have difficulty receiving warnings, evacuating, obtaining
supplies, regulating temperature, or communicating:

- children;
- older adults;
- disabled and chronically ill people;
- pregnant and postpartum people;
- isolated neighbours;
- people dependent on electricity, refrigeration, oxygen, medication, or care;
- people exposed to violence or homelessness;
- animals.

Ask what support is wanted. Do not convert vulnerability into permission to
remove autonomy.

### Group communication channels

A fully connected group of $n$ people has

$$C(n)=\frac{n(n-1)}{2}$$

possible pairwise channels:

{{visualization:vega-communication-channels}}

The chart uses logarithmic axes so groups from two to one hundred fit in one
view; the labels and table give the exact integer values. The curve describes
possible connections, not message volume, trust, or competence.

| Group size | Pairwise channels | Practical implication |
|---:|---:|---|
| 3 | 3 | direct conversation works |
| 5 | 10 | write decisions down |
| 10 | 45 | assign roles and one briefing channel |
| 20 | 190 | representatives or teams become useful |
| 50 | 1,225 | formal updates and records are necessary |
| 100 | 4,950 | institution-like coordination is unavoidable |

The exact formula explains why “everyone tells everyone” fails. Use a bulletin,
radio channel, shared log, scheduled briefing, and clearly named coordinators.

### Dunbar numbers — descriptive research, not a crisis zoning code

Research on social network layers suggests people maintain relationships in
roughly nested circles, often discussed around values such as 5, 15, 50, and
150. The values vary and should not be treated as hard limits.

Practical use:

- small teams build trust and execute work;
- larger groups need representatives, written records, and explicit handoffs;
- nobody can maintain every relationship equally;
- a community is not failing merely because it contains subgroups.

### Prisoner’s dilemma — why cooperation often wins

Repeated cooperation can outperform one-time selfish extraction when people
expect to meet again, can recognize behaviour, and have ways to repair conflict.

Useful rules:

- begin cooperatively when reasonably safe;
- make expectations visible;
- respond to exploitation proportionately;
- allow repair after a breach;
- record shared-resource decisions;
- avoid humiliating punishment, which creates future conflict inventory.

Game theory is not permission to call your neighbour “Player B” while taking
his batteries.

### Self-defence — last resort and narrow scope

Priority order:

1. avoid and leave;
2. create barriers, distance, light, witnesses, and communication;
3. contact police or emergency services;
4. protect vulnerable people;
5. use only necessary defensive action in immediate danger;
6. obtain medical and legal help afterward.

This guide does not teach weapons, traps, combat, vigilantism, or property
violence. Legal assessment depends on facts and jurisdiction; Ch.7 explains how
to obtain advice.

### Water, energy, and hygiene at scale

At group scale, assign named roles and logs:

| System | Minimum controls |
|---|---|
| water | source, treatment status, storage, allocation, contamination report |
| food | inventory, allergies, refrigeration status, cooking fuel |
| energy | priority loads, charging schedule, fuel safety, shutdown authority |
| sanitation | toilet plan, handwashing, waste route, cleaning responsibility |
| health | medication, first aid, vulnerable-person checks, referral route |
| information | official source, update time, rumour correction, meeting point |

## Mini building-society guide

### The first meeting

Keep it short:

1. What happened and what is confirmed?
2. Is anyone missing, injured, unsafe, or without essential care?
3. Which continuity systems are okay, limited, failed, or unknown?
4. What must happen in the next 2 hours?
5. Who owns each task, and who is backup?
6. When is the next briefing?
7. How can a person raise an urgent concern or disagreement?

Minutes should record decisions, owners, backups, and review times—not every
sentence spoken while the biscuits were still available.

### Five functions for the first meeting

![Five operational functions for a short crisis meeting](build/diagrams/first_meeting_roles.png)

| Function | Owns |
|---|---|
| coordination | task board, owners, deadlines, next briefing |
| care | injury, medication, devices, children, dependants, animals |
| supplies | water, food, batteries, hygiene, stock and use rate |
| information | official sources, confirmed facts, uncertainty, update time |
| access and logistics | exits, transport, entry, mobility, communication, destination |

One person may hold two functions in a small household. No function may exist
only in somebody’s memory. Every role needs a visible log or handoff that another
person can understand.

### Ostrom’s eight commons principles, adapted

Long-lived self-governed commons often include:[^ostrom]

1. clear boundaries around resource and users;
2. rules fitted to local conditions;
3. participation by affected users in changing rules;
4. monitoring accountable to the group;
5. graduated responses to rule violations;
6. accessible conflict resolution;
7. recognition of the group’s right to organize;
8. nested layers for larger systems.

These are design principles, not emergency scripture. Their bathroom
translation is: define the water, define the users, write the rule, record use,
resolve conflict before somebody declares themselves Hydration Chancellor.

### Forms of self-administration

| Model | Strength | Risk | Good use |
|---|---|---|---|
| coordinator | fast | dependency or unchecked power | immediate short crisis |
| majority vote | clear decision | minority needs ignored | bounded choices |
| consensus | broad support | slow or blocked | small trusted group |
| consent | proceed unless reasoned objection | requires facilitation | operational teams |
| delegated teams | expertise and speed | silos | larger groups |
| rotating roles | distributes power and fatigue | continuity loss | ongoing work |

Use different models for different decisions. Nobody needs consensus on calling
112. Everyone affected should have a voice in long-term rationing rules.

### Psychology of masses and social identity

Groups under threat may show:

- rumour acceleration;
- in-group/out-group thinking;
- conformity pressure;
- scapegoating;
- authority dependence;
- heroic helping and rapid mutual aid;
- exhaustion-driven conflict.

Countermeasures:

- publish confirmed facts and uncertainty separately;
- correct rumours without humiliating the person;
- rotate visible authority;
- create complaint and appeal routes;
- include affected minorities and vulnerable groups;
- schedule rest;
- preserve ordinary rituals such as meals and check-ins.

### The assignment invariant

A task is not assigned until it has:

1. a named owner;
2. a visible next physical action;
3. a deadline or review time;
4. a named backup or failure route.

“Someone check the batteries” is a wish. “Sam counts charged batteries by 19:00;
Lee records the result; no lighting reserve means we move the charging schedule
forward” is an assignment.

Confidence is not a credential. Build a route for dissent: a second check,
written uncertainty, or a person who can stop a plan when they see a hazard.

Crowds are not automatically irrational. People often cooperate strongly in
real disasters. Governance should support that capacity rather than begin by
assuming everyone is a looter from a disappointing film.

### Scaling requirements: 1 → 10 → 100

![Coordination scaling from one person to a community](build/diagrams/scaling_chart.png)

| Scale | Main challenge | What breaks | Add next |
|---:|---|---|---|
| 1 | isolation and skill gaps | no backup | contacts, written plan |
| 2–5 | assumptions | “I thought you did it” | explicit roles and check-ins |
| 6–10 | coordination | missed tasks | task board, briefings, backups |
| 11–25 | decision speed | endless whole-group debate | teams, consent/vote rules |
| 26–50 | information silos | contradictory updates | representatives, shared log |
| 51–100 | power and accountability | informal authority hardens | rotation, review, complaints |
| 100+ | institutional memory | repeated mistakes | records, onboarding, nested teams |

Every time the group grows, communication and accountability must grow too.
Adding people without adding structure is not community scaling; it is a larger
argument.

## Evacuation pocket list

- phone and power bank;
- medication and medication list;
- ID, keys, payment method, essential documents;
- water and simple food;
- weather layer and sturdy shoes;
- small first-aid kit;
- glasses, hearing aids, mobility and communication supplies;
- infant, disability, menstrual, and pet supplies;
- radio or warning access;
- written destination, meeting point, and contact.

Leave weapons, looting fantasies, and twelve kilograms of philosophical
literature unless authorities specifically request an ethics seminar.

## Preparedness checklist before anything happens

| Area | Ready? | Next action |
|---|---|---|
| official warning apps / radio | ☐ | |
| water and familiar food | ☐ | |
| medication and care supplies | ☐ | |
| lights, batteries, charging | ☐ | |
| documents and contacts | ☐ | |
| household evacuation plan | ☐ | |
| support plan for dependants | ☐ | |
| fire/CO safety | ☐ | |
| hygiene and toilet failure plan | ☐ | |
| neighbour / mutual-aid contact | ☐ | |

Preparedness is not a personality or bunker aesthetic. It is the quiet removal
of tomorrow’s stupidest problems.

[^bbk]: Bundesamt für Bevölkerungsschutz und Katastrophenhilfe, *Vorsorgen für Krisen und Katastrophen*, current preparedness guide and checklists: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Ratgeber-Checkliste/ratgeber-checkliste_node.html

[^bbk-warning]: Bundesamt für Bevölkerungsschutz und Katastrophenhilfe, “Warn-App NINA” and “Cell Broadcast.” NINA provides official civil-protection warnings and integrates weather and flood information; Cell Broadcast sends short official warnings directly to compatible mobile devices and should be supplemented with a fuller warning channel when possible. https://www.bbk.bund.de/DE/Warnung-Vorsorge/Warn-App-NINA/warn-app-nina_node.html and https://www.bbk.bund.de/DE/Warnung-Vorsorge/Warnung-in-Deutschland/So-werden-Sie-gewarnt/Cell-Broadcast/cell-broadcast_node.html

[^drk-cold]: German Red Cross, “Erfrierungen und Unterkühlungen”: https://www.drk.de/hilfe-in-deutschland/erste-hilfe/erfrierungen-und-unterkuehlungen/

[^ostrom]: Elinor Ostrom, “Beyond Markets and States: Polycentric Governance of Complex Economic Systems,” Nobel Prize Lecture (2009): https://www.nobelprize.org/prizes/economic-sciences/2009/ostrom/lecture/
