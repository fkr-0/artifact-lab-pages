---
title: "The Copper Book — Reference"
chapter: 8
revision: "4.14.0-alt.2"
last_updated: "2026-08-06"
dependencies:
  - build/diagrams/two_pass_route_map.png
  - build/diagrams/evidence_classes.png
  - build/diagrams/hazard_override_matrix.png
  - build/diagrams/dependency_continuity_map.png
  - build/diagrams/safe_place_route_map.png
  - build/diagrams/communication_access_card.png
---

# The Copper Book — Reference and Useful Loose Ends

Use **R — Reference** when you need an address, map, formula, figure, form,
service, field, source, or complete text route. R should shorten retrieval, not
become a compulsory corridor before action. In an emergency, use the owning
route or service first; return here when you need to locate, compare, cite, or
verify something.

## Stable references — addresses that survive editing

Canonical references use the form **`[BEG:<guide>:<kind>:<sequence>]`**. For
example, `[BEG:C:S:004]` names a Body and First Aid section,
`[BEG:T:F:003]` names a detachable Grey Book template, and `[BEG:T:G:006]`
names the deployer-completed Location and access figure. The corresponding HTML
anchors are `#beg-c-s-004`, `#beg-t-f-003`, and `#beg-t-g-006`.

Page numbers and labels such as “calm 1.1.3” remain useful navigation aids, but
they are not canonical addresses: inserting a section would silently rename
everything after it. Stable IDs stay attached to the resource; retired IDs are
kept in the registry rather than recycled for a different thing.

| Kind | Resource |
|---|---|
| S | section |
| F | template: reusable writable page |
| G | figure: read-only depiction or deployer-completed local reference |
| C | professional contact or service |
| D | deployment field |
| W | glossary word or term |

The source of truth is `src/data/reference_ids.json`; the generated complete
view is `src/data/content_index.json`.

{{route-identity-index}}

{{writable-template-index}}

{{deployment-field-index}}

{{professional-contact-index}}

{{diagram-index-generated}}

{{glossary-index}}

{{global-content-index}}

{{coverage-matrix}}

## Master cross-reference — where problems, routes, forms, and support meet

| Starting problem | Owning book | Useful Grey Book resource | Professional handoff |
|---|---|---|---|
| red flag / life danger | **C — Body and First Aid** | emergency call; location and access | 112 / dispatcher |
| caused harm / responsibility | **A — Responsibility and Care** | five-minute values; remarks and handoff | P medical/legal/social route as needed |
| anxiety / panic / overload | **B — Alarm and Calm** | comfort inventory; observation log; nice-place map | 116 123 / 116 117 / local service |
| pain / illness | **C — Body and First Aid** | observation log; emergency call | practice / 116 117 / 112 |
| danger / coercion / nowhere safe | **D — Threat and Safe Place** | safe-place map; location and access; local contacts | 110 / 112 / specialist service |
| unknown smell or environmental danger | **H — Air, Smell, and Environment** | emergency call; essential-care continuity | 112 / gas service / poison centre |
| outage / disaster / failing household function | **Z — Outage and Continuity** | essential-care card; household board | BBK / local authority / 112 |
| need a number, appointment, bed, document, or handoff | **P — Professional Support** | local contacts; emergency call; location and access | named service plus backup |
| need a writable packet | **T — Templates** | choose by use mode and privacy class | receiving service named on the resource |
| need a stable address, figure, formula, or source | **R — Reference** | feedback or review form when correcting | owning route remains primary |


## Mathematical notation legend

| Mark | Meaning | Use here |
|---|---|---|
| $\lor$ | logical OR | one true danger condition can change the route |
| $\Rightarrow$ | implies | a stated condition leads to an action inside the model |
| $\Delta$ | change between observations | sensation after minus sensation before |
| $n$ | number of people or items | group size, supplies, contacts |
| $t$ | time | minutes, hours, or days as stated |
| **Protocol** | authoritative action rule | first aid or public warning instruction |
| **Study result** | observation from a named design and population | anxiety and time-perception experiment |
| **Model** | calculation or thinking aid | communication channels in a group |
| **Mnemonic** | memorable compression | observe, change, compare |

## Eight situation doors inside ten route identities

| Door | Loudest problem | Owning route | Canonical names retained |
|---|---|---|---|
| A | responsibility or harm | **A — Responsibility and Care** | Situation A, Ch.2 |
| B | anxiety, panic, or unreality | **B — Alarm and Calm** | Situation B, Calm Guide, Ch.4 |
| C | pain or physical illness | **C — Body and First Aid** | Situation C, First Aid, Ch.5 |
| D | danger, coercion, or violence | **D — Threat and Safe Place** | Situation D |
| E | overload and task congestion | **B — Alarm and Calm** | Situation E, Calm Guide |
| F | bad or unknown smell | **H — Air, Smell, and Environment** | Situation F after the environmental gate |
| G | no safe or workable place | **D — Threat and Safe Place** | Situation G |
| H | smoke, gas, chemicals, electricity, or unsafe air | **H — Air, Smell, and Environment** | Situation H |

O, Z, P, T, and R are route identities rather than additional situation doors:
they orient, preserve continuity, connect professional systems, carry writable
facts, and make the whole graph inspectable.

## Guide topology

The chapters form a directed graph: observations lead to actions, actions lead
to reassessment or another chapter, and every route should end somewhere a
person can actually continue. This is useful mathematics only because dead ends
are bad writing.

![Two-pass guide topology with dependency modifiers](build/diagrams/two_pass_route_map.png)

## Flowchart legend

| Shape or style | Meaning |
|---|---|
| heavy emergency block | immediate action rather than further reading |
| diamond | choose the closest true answer |
| rectangle | do the stated action |
| rounded destination | continue in the named chapter or service |
| dashed line | optional explanation |
| loop | compare better, same, worse, or new information |

## How to read the evidence figures

![Evidence labels used throughout the guide](build/diagrams/evidence_classes.png)

A number is only as useful as its denominator, population, time frame, and
limit. Protocols tell you what to do. Studies tell you what happened under a
particular design. Associations describe variables travelling together. Models
show what follows from assumptions. None of them becomes a personal prophecy by
being printed in a confident font.

## Figure and template grammar

The generated figure catalogue above is canonical. Every figure is presented
as **Figure · Read only** with a stable `[BEG:...:G:...]` address, title, and
short description. A figure may be an authored depiction or a local reference
sheet completed and dated by the deployer before installation. Readers do not
edit the installed figure; it is replaced when the local truth changes.

Grey Book templates use the parallel label **Template · Write** with a stable
`[BEG:...:F:...]` address, title, and short description. Use a fresh copy for
each incident, observation, review, drill, or handoff.

Generated images remain explanatory aids. The adjacent prose remains the
complete route for monochrome print, screen readers, low light, failed images,
and coffee-related diagram loss.


## Evidence labels

The guide distinguishes the role of each statement:

| Label | Meaning | Example |
|---|---|---|
| **Protocol** | Action aligned with an authoritative guideline | call 112 for unresponsive abnormal breathing |
| **Population estimate** | Frequency in a named population and time frame | lifetime infertility prevalence |
| **Diagnostic-accuracy study** | Performance of a screen against a reference standard | GAD-7 sensitivity/specificity |
| **Randomized study** | Comparison created by allocation to interventions | 28-day breathwork trial |
| **Observational association** | Variables travelled together after adjustment; causation remains limited | social isolation and mortality odds |
| **Descriptive equation** | Exact relation once inputs are known | $C(n)=n(n-1)/2$ |
| **Mathematical model** | Calculation from assumptions inside a stated scope | stroke tissue-loss estimate |
| **Conceptual model** | A thinking aid, not a measured prediction | $A_{k+1}=A_k-\delta_k+\varepsilon_k$ |
| **Mnemonic** | Memorable compression | one action, one backup, one escalation |

A metaphor wearing a lab coat still needs identification, a denominator,
and visiting hours.

## Formula and theorem index

### 1. Red-flag dominance — routing protocol

$$R = \bigvee_i r_i, \qquad R=1 \Rightarrow 112$$

A positive red flag overrides scores and self-reassurance.

### 2. Tiny action queue — design theorem

$$Q=[\text{action},\text{backup},\text{escalation}]$$

Acute instructions should fit in a small working-memory budget.

### 3. Accountability tuple — procedural mnemonic

$$A=(\text{stop},\text{stabilize},\text{tell},\text{repair},\text{follow up})$$

Turns guilt into observable repair work.

### 4. Pain change — descriptive communication

$$\Delta P=P_{now}-P_{earlier}$$

Useful for reporting change; not a measure of injury or urgency.

### 5. Cognitive load — conceptual model

$$L=I+E+S$$

Intrinsic difficulty, avoidable clutter, and stress load are separated so at
least one term can be reduced. The equation is not a validated diagnostic
instrument.

### 6. Breath pacing — descriptive equation

$$T=t_i+t_e, \qquad f=\frac{60}{T}$$

Describes a chosen pattern. Comfort and safety set the pattern.

### 7. Stepwise arousal — conceptual model

$$A_{k+1}=A_k-\delta_k+\varepsilon_k$$

Small useful actions can reduce arousal while new events add load. This replaces
the fictional universal cortisol-decay curve.

### 8. Household emergency water — planning equation

$$W=2nd\;\text{litres}$$

BBK planning value for $n$ people and $d$ days; individual needs vary.

### 9. Communication channels — graph theorem

$$C(n)=\frac{n(n-1)}{2}$$

Explains why groups need roles and broadcast channels.

### 10. Survival function — mathematical model

$$S(t)=\exp\left(-\int_0^t h(u)\,du\right)$$

Valid mathematics, useless as a personal forecast without measured hazard data.

### 11. Heat balance — conceptual physical model

$$\Delta H=M-(C+K+R+E)$$

Represents heat production minus convective, conductive, radiative, and
evaporative losses. The guide uses it to organize prevention, not calculate a
person’s core temperature.

### 12. Listen–reflect–respond — conversation mnemonic

$$\text{listen}\rightarrow\text{reflect}\rightarrow\text{respond}$$

A compact alternative to composing a rebuttal while the other person is still
talking.

### 13. Stroke time model — literature-derived model

For the scope and assumptions used by Saver (2006), cumulative modelled neuronal
loss over $t$ untreated minutes is:

$$N(t)=1.9t\;\text{million neurons}$$

This is an order-of-magnitude urgency model for a typical large-vessel
supratentorial ischemic stroke, not a measurement in one patient. FAST and 112
remain the action.

### 14. Odds ratio — descriptive study statistic

For odds $o_1$ in one group and $o_0$ in a reference group:

$$OR=\frac{o_1}{o_0}$$

An odds ratio is not the same as a probability ratio, absolute risk, or proof of
causation. It requires the study population, adjustment set, and follow-up to
mean anything useful.



## Fillable fields live in T — Templates

R indexes writable resources; it does not maintain a second blank-form system.
Use the generated figure and template catalogues above to choose the canonical
Grey Book page. The resource band identifies its type, stable reference, and
short description; the privacy class controls placement, and related references
show what should travel with it.

The most commonly paired set is:

- **[BEG:T:G:006] Location and access card**;
- **[BEG:T:F:003] Emergency call card**;
- **[BEG:T:G:005] Local professional contacts**;
- **[BEG:T:G:008] Safe-place and exit map**;
- **[BEG:T:G:003] Medication, power, and care continuity card**;
- **[BEG:T:G:004] Household continuity board**.

Complete only relevant fields, store or photograph them safely, and replace
them when the route, local fact, privacy boundary, or review date changes.

### Do not put these on a shared printout

- passwords;
- PINs;
- alarm codes;
- safe combinations;
- private-key material;
- exact hidden spare-key location;
- information that would endanger someone fleeing violence.

A shared bathroom is not a secure credential vault, however trustworthy the
toothbrushes appear.

## Master flowchart — complete text version

```text
BATHROOM EMERGENCY GUIDE — MASTER FLOWCHART
============================================================

0. OVERRIDE
   |
   +-- life danger, abnormal breathing, unresponsive,
   |   severe bleeding, stroke sign, seizure, collapse,
   |   major burn, acute self/other danger?
   |       +-- YES / MAYBE / UNSURE --> 112
   |       |                           unlock if safe
   |       |                           speakerphone
   |       |                           follow dispatcher
   |       +-- NO --> continue
   |
   +-- active crime or immediate violent threat?
   |       +-- YES --> safer place --> 110
   |       |          injury/life danger --> 112
   |       +-- NO --> continue
   |
   +-- fire/smoke/CO/gas/chemical/electrical danger?
           +-- YES / MAYBE --> leave or isolate safely
           |                  Situation H
           |                  112 / poison centre / gas service
           +-- NO --> choose door

A. I CAUSED TROUBLE / SOMEONE DEPENDS ON ME --> Ch.2
   |
   +-- live injury/birth/danger --> 112 / 110 / Ch.5
   +-- pregnancy before birth --> medical + recognized counselling
   +-- birth happening now --> 112, warmth, dispatcher
   +-- hours/days after birth --> parent/baby care + mental-health check
   +-- child/dependant --> safety, essentials, backup caregiver
   +-- adult dependant/child --> requested help + boundaries
   +-- ambiguous duty --> today / legal / long-term / handoff
   +-- harm --> stop, stabilize, tell, repair, follow up
   +-- silicon entity --> isolate, preserve logs, notify owner

B. I FEEL ANXIOUS --> Ch.3B + Ch.4
   |
   +-- medical red flag/new severe symptoms --> 112
   +-- no red flag --> feet, five objects, gentle exhale, one person
   +-- recurring/impairing --> professional assessment
   +-- acute self-harm danger --> 112

C. I FEEL PAIN --> Ch.3C + Ch.5
   |
   +-- severe/sudden/chest/neuro/collapse/pregnancy red flag --> 112
   +-- urgent non-life-threatening --> 116 117 / practice
   +-- stable minor --> simple first aid + monitor
   +-- describe with OPQRST and change over time

D. I FEEL ENDANGERED --> Ch.3D + Ch.7
   |
   +-- present threat --> exit/safer place --> 110 / 112
   +-- expected/digital/coercive threat --> evidence + trusted person
   +-- violence against women support --> 116 016
   +-- after-effects --> Ch.4 + professional support

E. THINGS ARE CONGESTING --> Ch.3E + Ch.4
   |
   +-- write: prevent harm / soon / can be ugly
   +-- choose one physical action under five minutes
   +-- delegate or obtain care when essentials repeatedly fail

F. BAD SMELL --> Situation H gate, then Ch.3F
   |
   +-- fire/smoke/CO/gas/chemical/electrical/symptoms --> Situation H
   +-- sewage/drain after negative hazard gate --> water trap + plumber
   +-- damp/mould after negative hazard gate --> moisture repair
   +-- ordinary smell --> ventilation and cleaning, no combustion

G. NO SAFE PLACE --> Situation G + Ch.7
   |
   +-- person/active threat --> safer place --> 110 / 112
   |                          116 016 / men's helpline / specialist refuge
   +-- no roof tonight --> municipal emergency accommodation
   |                       115 identifies authority during service hours
   +-- place fails access/care --> name barrier + runtime
   |                              local accessible destination / 116 117 / 112
   +-- social/internal crisis --> one safe hour + one ally
                                  116 123 / 116 111 / 116 117 / 112

H. THE ENVIRONMENT MAY BE UNSAFE --> Situation H
   |
   +-- fire/smoke --> smoke-free exit; smoky route means close door + 112
   +-- CO alarm/suspected combustion exposure --> fresh air + 112
   +-- gas --> no flame/switch/bell/phone; knock, leave, call outside
   +-- chemical --> stop exposure, rinse, keep label, poison centre / 112
   +-- electrical --> do not touch live source; isolate only if safe; 112
   +-- official outside warning --> shelter or evacuate exactly as instructed

OUTAGE / DISASTER --> Ch.6
   |
   +-- verify official warning
   +-- shelter or evacuate as instructed
   +-- air, medical needs, temperature, water, communication
   +-- food, medication, hygiene, roles
   +-- group scale --> logs, roles, meetings, accountability

EVERY NON-EMERGENCY ROUTE
   |
   +-- do one action
   +-- check better / same / worse
   +-- use backup
   +-- escalate on worsening, uncertainty, or red flag
```

## Pocket print card

<div class="safety-card">
  <h3>RED FLAG?</h3>
  <p><strong>112 · unlock if safe · speakerphone · follow dispatcher</strong></p>
  <p>Unresponsive · abnormal breathing · severe bleeding · stroke sign · chest
  pressure · severe breathlessness · seizure · major burn · collapse · acute
  self/other danger</p>
</div>

<div class="route-grid">
  <section class="route-card" data-route="medical">
    <h3>BODY</h3><p>Ch.5 · first aid · 116 117 if urgent but non-life-threatening</p>
  </section>
  <section class="route-card" data-route="calm">
    <h3>ALARM</h3><p>Feet · five objects · gentle exhale · one person</p>
  </section>
  <section class="route-card" data-route="support">
    <h3>THREAT</h3><p>Exit / safer place · 110 · 116 016 · do not confront</p>
  </section>
  <section class="route-card" data-route="support">
    <h3>NO SAFE PLACE</h3><p>Situation G · threat / no roof / access-care / internal crisis</p>
  </section>
  <section class="route-card" data-route="survival">
    <h3>ENVIRONMENT</h3><p>Leave source · Situation H · call from safety</p>
  </section>
  <section class="route-card" data-route="survival">
    <h3>OUTAGE</h3><p>Official warning · essential care · water · temperature · roles</p>
  </section>
</div>

## Offline deployment checklist

- Print the monochrome PDF single-sided or duplex.
- Complete the relevant Grey Book resources and keep their resource bands attached.
- Keep the guide near a charged light source.
- Add a simple first-aid poster from an official provider.
- Store current medication and emergency plans nearby but privately.
- Refresh service numbers and medical guidance before relying on an older printout.
- Test that QR codes or links are not the only access path.
- Ensure the print remains readable without colour.
- Replace the guide after water damage. It is not itself waterproof, despite
  strong thematic alignment.


## Navigation invariant

Every non-emergency route must provide:

1. a next action;
2. a backup;
3. a reason to escalate;
4. a named destination.

A dead end in prose is still a dead end.
