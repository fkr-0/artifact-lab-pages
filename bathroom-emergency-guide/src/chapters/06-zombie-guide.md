---
title: "Outage, Disaster, and Zombie Guide"
chapter: 6
revision: "4.0.0"
last_updated: "2026-07-17"
dependencies:
  - build/diagrams/survival_pyramid.png
  - build/diagrams/scaling_chart.png
---

# Zombie Guide — Mostly for Non-Zombie Disasters

No confirmed zombie outbreak is known. Power cuts, floods, heat, contaminated
water, smoke, and communication failures are real enough. The fictional label
stays because a guide is more likely to be read when it contains one zombie.

## Verify before optimizing

1. Check official warnings: **NINA**, Cell Broadcast, local radio, municipality,
   police, fire service, or BBK.
2. Identify the hazard: fire, flood, chemical release, outage, violence, or
   ordinary rumour wearing tactical trousers.
3. Decide whether authorities say **shelter** or **evacuate**.
4. Tell one other person what you know and where you are.

Do not leave a safe building merely because a group chat has cinematic energy.

## Survival mathematics — model, not prophecy

A standard survival function can be written as

$$S(t)=\exp\left(-\int_0^t h(u)\,du\right)$$

where $h(u)$ is a hazard rate. Without measured hazards this formula predicts
nothing. Its practical lesson is simpler: reduce known hazards—smoke exposure,
unsafe water, cold, isolation—rather than inventing a percentage for survival.

![Priority pyramid for disrupted infrastructure](build/diagrams/survival_pyramid.png)

## Water

For household emergency storage, the 2025 BBK guide recommends ideally
**2 litres per person per day**, including about 0.5 L for cooking. For $n$
people over $d$ days:

$$W = 2nd\;\text{litres}$$

Add pet needs. Heat, illness, pregnancy, breastfeeding, and physical work can
increase requirements. Follow local water advisories.

- Store potable water in clean, food-safe containers.
- If authorities issue a boil-water notice, follow its exact instructions.
- Filtering cloudy water through cloth may remove particles; it does not make
  microbiologically or chemically unsafe water safe.
- Do not use a generic “drops of bleach” recipe: products and concentrations
  differ.
- Water contaminated by fuel, solvents, pesticides, or radioactive material
  is not made safe by boiling.[^bbk]

## Air, fire, and carbon monoxide

Never run generators, charcoal grills, camping stoves, or open flames inside a
home, garage, cellar, tent, or bathroom. Carbon monoxide is colourless and
odourless. Move to fresh air and call **112** if poisoning is suspected.

Unknown gas or chemical smell means no matches and no electrical switches.
Leave if safe and call from outside.

## Food and medication

- Use refrigerated food first while it is still safe.
- Keep fridge and freezer doors closed during outages.
- Discard food when official safety guidance or obvious spoilage says so; smell
  alone cannot detect every hazard.
- Keep a medication list and a reasonable reserve agreed with the prescriber or
  pharmacy. Protect medicines requiring refrigeration.
- Do not forage from a four-item list in an emergency guide. Misidentification
  is a terrible side quest.

## Hygiene

Reserve clean water for drinking and essential food preparation. Use separate
containers for drinking and washing. Keep hands clean after toilet use and
before food handling. If toilets fail, follow municipal sanitation guidance;
contain waste away from food and water.

## Power and information

- Charge phones and power banks while power exists.
- Use battery radio and official alerts.
- Keep one paper list of contacts, medications, and meeting points.
- Send concise texts; networks often carry text when voice calls fail.
- Preserve battery by lowering brightness and disabling unnecessary radios.

## Group coordination

A fully connected group of $n$ people has

$$C(n)=\frac{n(n-1)}{2}$$

possible pairwise communication channels. At $n=10$, that is 45 channels; at
$n=30$, 435. The exact formula explains why “everyone tells everyone” collapses
quickly.

Use roles and a short briefing:

- safety and first aid
- water and food
- information and communications
- care for children, disabled people, and animals
- logistics and rest rotation

![Coordination scaling from one person to a community](build/diagrams/scaling_chart.png)

## Commons theorem

Shared resources last longer when the group knows:

1. what the resource is,
2. who may use it,
3. how use is recorded,
4. how rules can be changed,
5. how conflict is resolved.

These echo Elinor Ostrom’s empirically grounded design principles for
self-governed commons. They are not a magic constitution, but they beat “the
loudest person owns the water.”[^ostrom]

## Evacuation pocket list

- phone + power bank
- medication + medication list
- ID, keys, payment method
- water and simple food
- weather layer / sturdy shoes
- small first-aid kit
- glasses, hearing aids, mobility supplies
- infant, disability, and pet supplies
- written destination and contact

Leave weapons, fantasies of looting, and twelve kilograms of philosophical
literature unless authorities specifically request an ethics seminar.

[^bbk]: Bundesamt für Bevölkerungsschutz und Katastrophenhilfe, *Vorsorgen für Krisen und Katastrophen* (2025), especially the water and individual-needs checklists: https://www.bbk.bund.de/SharedDocs/Downloads/DE/Mediathek/Publikationen/Buergerinformationen/Ratgeber/BBK-Vorsorgen-fuer-Krisen-und-Katastrophen.pdf?__blob=publicationFile&v=44

[^ostrom]: Elinor Ostrom, “Beyond Markets and States: Polycentric Governance of Complex Economic Systems,” Nobel Prize Lecture (2009): https://www.nobelprize.org/prizes/economic-sciences/2009/ostrom/lecture/
