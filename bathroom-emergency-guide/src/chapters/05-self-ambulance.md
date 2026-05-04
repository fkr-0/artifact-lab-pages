---
title: "Self Ambulance Guide"
chapter: 5
revision: "3.2.0"
last_updated: "2026-05-03"
dependencies:
  - build/diagrams/triage_flow.png
  - build/diagrams/triage_priority_heatmap.png
  - build/diagrams/pain_nrs_correlates.png
---

# 🏥 Self Ambulance Guide — You Are the First Responder (Because You're the Only One Here)

The premise of this guide is simple: professional help is not yet present, and something needs doing. "Self ambulance" doesn't mean you replace doctors — it means you stabilize the patient (you) until doctors can take over. Think of yourself as the adhesive bandage of the medical world: temporary, essential, and way better than nothing.

![Self Ambulance Triage Flow](build/diagrams/triage_flow.png)

## Assess: Life-Threatening?

Before anything else, run this triage. It takes 10 seconds.

```
◆ Is this immediately life-threatening?

    Signs that say YES:
    ─ Uncontrolled bleeding (sputing / soaking through fabric)
    ─ Difficulty breathing or no breathing
    ─ Loss of consciousness, unresponsive
    ─ Chest pain + jaw/arm pain + sweating + nausea
    ─ Seizure in progress
    ─ Severe head injury with confusion or vomiting
    ─ Suspected spinal injury (numbness, can't move limbs)

    ├─ YES → Call 112 immediately (or 110 if police needed).
    │         Do not finish reading this guide first.
    │         Speakerphone is your friend — dial, then follow
    │         dispatcher instructions while keeping hands free.
    │
    └─ NO → Continue to Basic First Aid.
```

**The 10-second rule:** If you're unsure whether it's life-threatening, treat it as if it is. Call 112. Dispatchers would rather talk you through a false alarm than not get the call for a real one. You are not wasting their time. That's literally what they're there for.

### Triage Priority Heatmap

When multiple issues are present simultaneously (you're bleeding AND anxious AND the room is spinning), you need a priority framework. The triage heatmap uses a 2D matrix of severity × urgency:[^triage]

![Triage Priority Heatmap — severity vs. urgency matrix](build/diagrams/triage_priority_heatmap.png)

| Priority | Condition | Action |
|----------|-----------|--------|
| **P1 — Immediate** | Life-threatening, airway/breathing/circulation compromised | Call 112. Act now. |
| **P2 — Urgent** | Serious but stable; could deteriorate | Call 112 or 116117. Monitor closely. |
| **P3 — Delayed** | Needs treatment but not time-critical | Self-care → seek medical attention within hours. |
| **P4 — Minor** | Discomfort without danger | Self-care → 📍 Calm Guide (Ch.4) |

The heatmap concept can also be formalized using Bayes' theorem for triage decisions — calculating the posterior probability that a symptom constellation represents a life-threatening condition given the observed signs:[^bayes_triage]

$$P(\text{critical} \mid \text{signs}) = \frac{P(\text{signs} \mid \text{critical}) \cdot P(\text{critical})}{P(\text{signs})}$$

You don't need to calculate this — your brain does an approximate version automatically when it says "this feels really bad." Trust that intuition when it pushes you toward P1. The false-positive cost (an unnecessary 112 call) is vastly lower than the false-negative cost (not calling when you should have).

## Basic First Aid Quick Reference

### Wounds

```
◆ Is the wound bleeding?

    ├─ Heavily (soaking through cloth in < 30 seconds)
    │     1. Apply firm, direct pressure with clean cloth.
    │        Do NOT remove the first cloth if it soaks through —
    │        add more on top. Removing it breaks the clot.
    │     2. Elevate the wound above heart level if possible.
    │     3. If limb: apply a tourniquet ONLY if bleeding is
    │        life-threatening and pressure isn't working.
    │        Note the time you applied it. Tell the paramedics.
    │     4. Call 112 if not already done.
    │
    ├─ Moderately (oozing, slow)
    │     1. Clean under cool running water.
    │     2. Apply pressure for 5–10 minutes without peeking.
    │     3. Cover with a sterile bandage or clean cloth.
    │     4. Monitor for signs of infection over next 48 hours:
    │        redness spreading, warmth, red streaks, fever.
    │        If any appear → see a doctor.
    │
    └─ Minor (scratch, small cut)
          1. Clean it. Soap and water > everything else.
          2. Bandage it. Leave it alone.
          3. Check tetanus status if it's been > 10 years
             since your last booster.
```

### Burns

| Degree | Appearance | Treatment | When to get help |
|--------|-----------|-----------|-----------------|
| 1st | Red, painful, no blisters (sunburn-like) | Cool under running water 10–20 min. Not ice. Not butter. Not toothpaste. WATER. Aloe or moisturizer. | Self-care usually sufficient |
| 2nd | Blisters, very painful, wet-looking | Cool under running water 10–20 min. Do NOT pop blisters. Cover loosely with non-stick material. | Larger than palm or on face/hands/genitals → see doctor |
| 3rd | White/brown/black, dry, may not hurt (nerve damage) | Do NOT apply water to large burns. Cover loosely with clean cloth. | **Call 112. This is not a bathroom fix.** |

**Burn surface area estimation:** For larger burns, estimate the percentage of total body surface area (TBSA) affected using the Lund-Browder chart, which adjusts for age:[^lundbrowder]

| Body region | Adult % TBSA |
|-------------|-------------|
| Head | 7% |
| Each arm | 9% |
| Anterior trunk | 18% |
| Posterior trunk | 18% |
| Each leg | 18% |
| Perineum | 1% |

**Rule of nines (quick estimate):** The patient's palm (including fingers) ≈ 1% TBSA. Count palms to estimate small burns. Burns > 20% TBSA = call 112 immediately (fluid loss, shock risk, infection risk).

### Suspected Fractures

1. **Don't move it.** The body part is in the position it's in for a reason. That reason may include "broken." Moving it adds reasons.
2. **Immobilize.** Use whatever's available — rolled towel, magazine, piece of cardboard — to create a splint that keeps the area from moving. Pad it with cloth. Secure it gently (not tight — you need circulation below the injury site).
3. **Ice.** Wrapped in cloth, applied for 20 minutes on / 20 minutes off. Not directly on skin.
4. **Elevate.** If it doesn't hurt more to do so, raise the injured area above heart level to reduce swelling.
5. **Seek medical attention.** Fractures need imaging. Your bathroom does not have an X-ray machine (and if it does, we have different questions).

### FAST Stroke Assessment — Formalized

The FAST assessment is a rapid screening tool for stroke. Time is brain — every minute of untreated stroke destroys approximately 1.9 million neurons.[^stroke_time]

| Component | Test | Positive sign |
|-----------|------|---------------|
| **F** — Face | Ask the person to smile | One side droops (facial palsy) |
| **A** — Arms | Ask the person to raise both arms | One arm drifts downward |
| **S** — Speech | Ask the person to repeat a simple phrase | Speech slurred or incomprehensible |
| **T** — Time | Note the time symptoms started | Call 112 immediately. Note onset time — it determines treatment eligibility. |

**Key detail:** Thrombolytic therapy (clot-busting medication) is most effective within 4.5 hours of symptom onset. The treatment window is:

$$t_{treatment} < 4.5\text{ hours from onset}$$

If you don't know when symptoms started, the clock starts at the last time you *know* the person was normal. This is why "Time" is in the acronym — it's not just urgency, it's a literal countdown.

### Vital Signs (How to Check If You're Okay-ish)

| Sign | How to check | Normal range | Concerning | Critical |
|------|-------------|-------------|-----------|----------|
| Heart rate (HR) | Two fingers on wrist (radial artery) or neck (carotid). Count beats for 15 seconds × 4. | $HR \in [60, 100]$ bpm | $< 50$ or $> 120$ at rest | $< 40$ or $> 150$ |
| Respiratory rate (RR) | Count breaths for 30 seconds × 2. One inhale + exhale = 1. | $RR \in [12, 20]$/min | $< 10$ or $> 30$/min | $< 8$ or $> 40$/min |
| SpO₂ (oxygen saturation) | Pulse oximeter (if available). | $SpO_2 \in [95, 100]$% | 90–94% | $< 90$% |
| Blood pressure (BP) | BP cuff (if available). | $BP < 120/80$ mmHg | 120–139/80–89 | $\geq 140/90$ or $< 90/60$ |
| Consciousness | Can you answer: who are you, where are you, what day is it? | All 3 correct | Any incorrect or confused | Unresponsive |
| Skin color | Look at your face, lips, nail beds. | Pink/warm | Pale/blue/gray/mottled | Cyanotic (blue lips/nail beds) |

If any vital sign is in the "concerning" column and you're alone → call 112. If in the "critical" column → call 112 immediately, no deliberation. These numbers aren't suggestions — they're thresholds derived from decades of clinical data.

### NRS Pain Scale Quick Reference

For a detailed breakdown of the NRS pain scale with physiological correlates, see Ch.3 (Situation C). Quick version:

$$NRS \in [0, 10]$$

- NRS 0–3: Manage with self-care
- NRS 4–6: Assess cause, consider professional help
- NRS 7–10: Call 112 if acute onset; 📍 Self Ambulance protocols

![Pain NRS Correlates — pain scale with physiological markers](build/diagrams/pain_nrs_correlates.png)

## When to Call for Help

### Call 112 immediately if:

- Uncontrolled bleeding that doesn't slow with 10 minutes of pressure
- Difficulty breathing or chest pain with jaw/arm radiation
- Loss of consciousness (even brief)
- Suspected stroke: face drooping, arm weakness, speech difficulty (remember: **FAST** — Face, Arms, Speech, Time)
- Severe allergic reaction: swelling of throat/tongue, difficulty breathing, widespread hives
- Seizure lasting > 5 minutes or first-time seizure
- Head injury with vomiting, confusion, or loss of consciousness
- Severe abdominal pain with rigidity (stomach hard as a board)
- Any situation where you think "I should probably call" — call

**The golden rule:** If you're debating whether to call, the debate itself is a signal. Call. Dispatcher > regret.

## Self-Care While Waiting

1. **Position yourself safely.** Conscious and breathing fine? Sit or lie in a comfortable position. Semi-recumbent (propped up at 45°) works well. Feeling faint? Lie flat with legs elevated. Nauseous? Lie on your side (recovery position). The bathroom floor is a perfectly acceptable place for this.
2. **Stay conscious.** If you feel yourself fading, fight it — not heroically, just practically: talk to yourself out loud, keep your eyes open and focused on a specific object, move your fingers and toes. Sensory input keeps the brain online.
3. **Breathe.** → 📍 Calm Guide (Ch.4, Breathing Exercises). The same breathing techniques that help anxiety also help pain and shock.
4. **Don't eat or drink.** If you might need surgery, an empty stomach is safer. Small sips of water are usually fine, but ask the dispatcher.
5. **Unlock the door.** If you've called 112, emergency services need to be able to reach you. Unlock the bathroom door now, while you still can.
6. **Phone placement.** Put your phone on speaker or place it within arm's reach. Don't hold it in your hand if you might lose consciousness — it'll fall and become unreachable.

## Self Ambulance for Non-Physical Emergencies

The same framework applies to situations where the "injury" is psychological or situational. The logic is identical: stabilize, assess, get help.

| Physical version | Psychological equivalent |
|---|---|
| Uncontrolled bleeding | Acute panic / emotional flooding |
| Apply pressure | 📍 Calm Guide breathing exercises |
| Elevate the wound | Remove yourself from the triggering situation |
| Call 112 | Call a crisis line (→ Ch.7, §14.2) |
| Stay conscious | Stay present — **5-4-3-2-1 grounding**: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste |
| Unlock the door | Tell someone you need help |
| Monitor vital signs | Monitor your emotional state: "Am I getting worse, stable, or better?" |

The 5-4-3-2-1 technique is worth memorizing because it requires zero equipment and works everywhere. It forces your brain to shift from internal distress to external perception. You can't process a threat response and catalog sensory data simultaneously — one displaces the other. Use that.

[^triage]: FitzGerald, G., et al. "Emergency department triage revisited." *Emergency Medicine Journal* 27(2), 86–92 (2010). Modern triage systems (ESI, Manchester, Australasian) all use some variant of the severity × urgency matrix. The 4-level priority system used here is simplified for self-triage; clinical systems use 5 levels.

[^bayes_triage]: Gill, C.J., et al. "A method for Bayesian triage in resource-limited settings." *PLoS ONE* (various). While clinicians rarely calculate explicit Bayes' theorem, the underlying reasoning — "how likely is this to be serious given what I'm seeing?" — is Bayesian inference. The key insight for self-triage: when in doubt, assume higher severity (prioritize sensitivity over specificity). A false alarm is cheap; a missed emergency is catastrophic.

[^lundbrowder]: Lund, C.C. & Browder, N.C. "The estimation of areas of burns." *Surgery, Gynecology & Obstetrics* 79, 352–358 (1944). The Lund-Browder chart remains the gold standard for burn surface area estimation, adjusting for the proportionally larger head and smaller limbs of children. The simpler "Rule of Nines" (each arm = 9%, each leg = 18%, etc.) is a rough adult approximation.

[^stroke_time]: Saver, J.L. "Time is brain — quantified." *Stroke* 37(1), 263–266 (2006). During acute ischemic stroke, the brain loses approximately 1.9 million neurons, 14 billion synapses, and 12 km of myelinated fibers per minute. This is why the FAST protocol emphasizes "Time" — thrombolytic therapy efficacy declines dramatically with each passing hour.
