---
title: "Start Here"
chapter: 1
revision: "4.0.0"
last_updated: "2026-07-17"
dependencies:
  - build/diagrams/emergency_flowgraph.png
---

# Start Here — One Question at a Time

## The override

**Could someone die, lose consciousness, stop breathing normally, bleed heavily,
suffer lasting harm, or be in immediate danger?**

- **Yes / maybe / cannot tell:** call **112**. Unlock the door if safe, use
  speakerphone, and follow the dispatcher.
- **No:** choose the closest route below.
- **Active violence or a crime requiring police:** get to safety, then call
  **110**. Use **112** when medical rescue is also needed.

You do not have to diagnose the situation before asking for help. “I am not
sure, but this looks serious” is a complete reason to call.

![Red-flag-first emergency decision flowgraph](build/diagrams/emergency_flowgraph.png)

## Four routes

<div class="route-grid">
  <section class="route-card" data-route="112">
    <h3>Red flag</h3>
    <p>Call 112. Then do only what the dispatcher asks and what is safe.</p>
  </section>
  <section class="route-card" data-route="medical">
    <h3>Body / pain</h3>
    <p>Go to Ch.5. Start with red flags, then simple first aid.</p>
  </section>
  <section class="route-card" data-route="calm">
    <h3>Panic / overload</h3>
    <p>Go to Ch.4. Orient outward, slow down, choose one action.</p>
  </section>
  <section class="route-card" data-route="support">
    <h3>Threat / responsibility</h3>
    <p>Go to Ch.2 or Ch.7. Safety first; repair comes after stabilization.</p>
  </section>
  <section class="route-card" data-route="survival">
    <h3>Outage / collapse</h3>
    <p>Go to Ch.6. Verify the hazard, conserve resources, coordinate.</p>
  </section>
</div>

## The seven doors into the guide

| Door | What is happening | First destination |
|---|---|---|
| A | I caused trouble or someone depends on me | Ch.2 Responsibility |
| B | I feel anxious, panicky, or unreal | Ch.4 Calm |
| C | I feel pain or physically unwell | Ch.5 First aid |
| D | I feel endangered | Ch.7 Safety and support |
| E | Everything is congesting | Ch.4 Calm, then one task |
| F | There is a bad or unknown smell | Ch.3F Safety check |
| G | I have no place to go | Ch.7 Practical support |

Several doors may be open. Red flags outrank all of them.

## Basic theorem 1 — red-flag dominance

Let each red flag be a Boolean value $r_i \in \{0,1\}$:

$$R = r_1 \lor r_2 \lor \cdots \lor r_n$$

If $R=1$, the route is **112**. No anxiety score, pain score, formula, or
bathroom philosophy may cancel that result. This is a routing rule, not a
medical model.

## Basic theorem 2 — the one-next-action rule

Acute stress reduces the amount of information people can reliably hold and
use. The guide therefore keeps a tiny queue:

$$Q = [\text{one action},\; \text{one backup},\; \text{one escalation rule}]$$

Example: **sit down → call a friend → if chest pain or fainting appears, call
112**. A plan with twelve beautiful steps is decorative. A plan with one
executable step is equipment.[^who-stress]

## Reassessment loop

1. **Act:** do the smallest safe action.
2. **Check:** better, same, or worse?
3. **Escalate:** if worse, new red flags appear, or uncertainty remains.
4. **Repeat:** only while the situation remains non-emergent.

This is the guide’s only intentional loop. It prevents both frozen inaction
and heroic improvisation.

[^who-stress]: World Health Organization, *Doing What Matters in Times of Stress* (2020), an evidence-informed and field-tested guide to grounding, unhooking from difficult thoughts, and values-based small actions: https://www.who.int/publications/i/item/9789240003927
