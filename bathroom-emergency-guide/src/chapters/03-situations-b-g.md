---
title: "Situations B–G — Emotional & Situational Entry Points"
chapter: 3
revision: "3.2.0"
last_updated: "2026-05-03"
dependencies:
  - build/diagrams/anxiety_severity_spectrum.png
  - build/diagrams/pain_nrs_correlates.png
---

# Situation B — "I Feel Anxious"

Anxiety is your brain's way of running worst-case simulations without your consent. It's a feature that got stuck in debug mode. Let's triage.

**Step 1. Determine the temporal flavor.**

```
◆ Is this acute (happening right now) or general (ongoing background hum)?

    ├─ Acute → Heart racing, thoughts spiraling, chest tight?
    │          → 📍 Calm Guide (Ch.4) — immediately.
    │            The bathroom is fine. Stay. Breathe. Ch.4 has you.
    │
    └─ General → Low-grade dread, persistent worry, can't quite
                 put your finger on it but something is definitely
                 off and has been for a while?
                 → 📍 Professional Support Directory (Ch.7, §14.2)
                   This isn't a one-bathroom-session fix. Get backup.
```

**Step 2. If anxious *about* something specific, identify the target.**

Anxiety loves an object. Give it one — then decide whether that object actually needs your attention right now.

| Worried about… | What's happening | Where to go |
|---|---|---|
| **Friends** | Someone you care about is struggling, and you're absorbing it | 📍 Prof. Support (Ch.7, §14.2) — learn to hold space without drowning |
| **Yourself** | Existential dread, self-doubt, the works | 📍 Calm Guide (Ch.4) — start here, stabilize, then decide |
| **The past** | Replaying things you can't change | 📍 Calm Guide (Ch.4) — reframing exercises. The past is a sunk cost. |
| **The future** | All of it. Everything. The heat death of the universe. | 📍 Calm Guide (Ch.4) + talk to host + curated study sources |

### GAD-7 Severity Spectrum

If you want to quantify where you are (and sometimes seeing a number helps), the Generalized Anxiety Disorder 7-item scale (GAD-7) is a validated self-report instrument used clinically worldwide:[^gad7]

$$GAD\text{-}7 \in [0, 21]$$

| Score | Severity | What it means for you right now |
|-------|----------|-------------------------------|
| 0–4 | Minimal | You're basically fine. The bathroom visit was precautionary. |
| 5–9 | Mild | Annoying but manageable. Calm Guide breathing will help. → 📍 Ch.4 |
| 10–14 | Moderate | This is significant. Breathing first, then professional support. → 📍 Ch.4 + 📍 Ch.7 |
| 15–21 | Severe | You need more than this guide can provide. → 📍 Professional Support (Ch.7) immediately |

You don't need a clinical diagnosis to use this scale — it's a self-assessment tool. A score ≥ 10 has a sensitivity of 89% and specificity of 82% for detecting generalized anxiety disorder.[^gad7_sensitivity] That said, a bathroom guide is not a clinician. Use the number to inform your next step, not to self-diagnose.

![Anxiety Severity Spectrum — GAD-7 scoring with recommended routing](build/diagrams/anxiety_severity_spectrum.png)

**Step 3. Optional: Name it to tame it.**

There's genuine psychological research behind this: verbally labeling an emotion reduces its intensity through a process called "affect labeling," which engages the right ventrolateral prefrontal cortex and dampens amygdala activation.[^affect_labeling] So say it out loud. You're in a bathroom. No one's listening. "I am anxious because [___________]." There. Slightly smaller now, wasn't it?

---

# Situation C — "I Feel Pain"

The body (and mind) have a straightforward communication style: pain = "something needs attention." Let's figure out what kind of attention.

```
◆ Physical or Psychological?

    ├─ Physical ──→ 📍 Self Ambulance Guide (Ch.5)
    │                 Assess severity. If life-threatening: 112 first,
    │                 guide second. Otherwise, follow Ch.5.
    │
    └─ Psychological ──→ 📍 Calm Guide (Ch.4)
                         Psychological pain is real pain. It just
                         responds to different first aid. Start with
                         the breathing, then assess whether you need
                         → 📍 Professional Support Directory (Ch.7)
```

### NRS Pain Scale with Physiological Correlates

The Numeric Rating Scale (NRS) is the most widely used pain assessment tool in clinical settings. It maps your subjective experience to a number, which then determines urgency:[^nrs]

$$NRS \in [0, 10]$$

| NRS | Severity | Physiological correlates | Action |
|-----|----------|-------------------------|--------|
| 0 | No pain | Baseline HR, normal RR | You're fine. Why are you reading this section? |
| 1–3 | Mild | Slight HR elevation ($\Delta HR < 10$ bpm), normal RR | Self-care, OTC pain relief if appropriate |
| 4–6 | Moderate | Noticeable HR elevation ($\Delta HR 10–20$ bpm), RR 16–22/min | Assess cause. 📍 Self Ambulance (Ch.5). Consider professional help. |
| 7–9 | Severe | Significant tachycardia ($HR > 100$ bpm), RR 22–30/min, diaphoresis | 📍 Self Ambulance (Ch.5) immediately. Call 112 if acute onset. |
| 10 | Worst imaginable | Sympathetic storm: $HR > 120$, $RR > 30$, possible shock signs | **Call 112. Now.** |

The NRS isn't perfectly objective — pain is subjective by definition — but it correlates reliably with physiological markers at the moderate-to-severe end. At the mild end, your body is telling you something but isn't in crisis. At the severe end, your autonomic nervous system is in open revolt. Listen to it.

![Pain NRS Correlates — pain scale with physiological markers](build/diagrams/pain_nrs_correlates.png)

**The overlap zone.** Physical and psychological pain frequently co-occur (headaches from tension, nausea from anxiety, chest tightness that's muscular *or* cardiac — when in doubt, treat it as physical first and get checked out). The Self Ambulance Guide covers this in its triage section.

> **⚠ Important:** If pain is severe, sudden, or in the chest/jaw/left arm region, do not pass Go, do not consult flowcharts — **call 112**.

---

# Situation D — "I Feel Endangered"

Something or someone is threatening your safety. This is the section where we get practical fast.

**Step 1. Immediate assessment.**

```
◆ Are you in immediate physical danger right now?

    ├─ Yes → Exit strategy first. Then:
    │        Call 110 (police) or 112 (emergency services).
    │        Do not stay in the bathroom if it's not safe.
    │        The bathroom has one door — that's a chokepoint.
    │        Consider whether leaving is safer than staying.
    │
    └─ No (or not right this second) → Continue below.
```

### The Stress Response: What Your Body Is Doing

When you feel endangered, your sympathetic nervous system activates the fight-or-flight response. This isn't a malfunction — it's an ancient survival system. Understanding it helps you ride the wave instead of drowning in it:

$$S(t) = S_0 + A \cdot (1 - e^{-\alpha t})$$

Where $S(t)$ is your sympathetic activation level at time $t$, $S_0$ is baseline, $A$ is the amplitude of the threat response, and $\alpha$ is the activation rate. The key insight: this curve rises fast but decays slowly. Your adrenaline spikes in seconds, but cortisol — the stress hormone that keeps you on high alert — has a half-life of 60–90 minutes.[^cortisol_stress] Social-evaluative threats and uncontrollable stressors produce the largest cortisol responses,[^cortisol_response] which is unfortunately exactly what being trapped in a bathroom with no exit strategy feels like. This is why you'll feel shaky and hypervigilant long after the danger passes. That's not weakness; that's biochemistry.

**Step 2. Resource scan.**

1. **Talk to the host.** If you're in someone else's space, the host is your ally. They know the environment, the exits, and the social dynamics. Ask for help — it's not weakness, it's tactical intelligence gathering.
2. **Self-defense: know the law before you need it.** In Germany, §32 StGB (Notwehr) covers self-defense: you may defend yourself against an unlawful attack, using force proportionate to the threat. The four legal elements are: (1) present attack, (2) unlawfulness, (3) defensive action, (4) proportionality.[^stgb32_bg] Know this *before* you need it → 📍 Professional Support Directory (Ch.7, §14.3).
3. **Local items scan.** Take 30 seconds to look around. What's available? Keys (pointy), phone (communication + flashlight), aerosol cans (improvised deterrent), heavy objects (strategic, not recreational). You're not MacGyver — you're just aware.

**Step 3. Once safe.**

→ 📍 Calm Guide (Ch.4) — adrenaline takes time to metabolize. Let the shaking happen. It's normal.
→ 📍 Professional Support Directory (Ch.7) — for legal, psychological, and practical follow-up.

---

# Situation E — "Things Are Congesting"

Everything at once. Too many inputs, too many demands, too many tabs open in your brain. The mental browser has crashed.

1. **Close some tabs.** Not literally (unless your phone has 47 browser tabs, in which case — yes, literally). Identify the top 3 things that actually need your attention in the next hour. Write them down. Everything else goes on a "later" list that you'll forget about and that's fine.
2. **Physical first.** Congestion often manifests physically — shallow breathing, tight shoulders, jaw clenched like you're biting through steel. → 📍 Self Ambulance Guide (Ch.5) for body-first triage.
3. **Mental next.** Once the body is somewhat regulated → 📍 Calm Guide (Ch.4) for the full decompression sequence.
4. **If congestion is chronic** (this keeps happening), that's not a bathroom-fix — that's a life-structure problem → 📍 Professional Support Directory (Ch.7). Therapists and coaches exist for exactly this.

### Cognitive Load Theory — Why Your Brain Is Crashing

George Miller's famous 1956 paper proposed that working memory can hold approximately $7 \pm 2$ items simultaneously.[^miller] More recent research by Cowan (2001) refines this to approximately $4 \pm 1$ chunks of information.[^cowan] When you're "congesting," you're exceeding this capacity — your cognitive buffer is overflowing.

$$\text{Cognitive Load} = \text{Intrinsic} + \text{Extraneous} + \text{Germane}$$

Where intrinsic load comes from the task itself, extraneous load comes from poor presentation or unnecessary information, and germane load is the productive effort of learning/processing. Congestion happens when the total exceeds your working memory capacity. The fix: reduce extraneous load (turn off notifications, close tabs, delegate) and process intrinsic load one chunk at a time. This is literally what the "top 3 things" exercise does — it moves items from working memory to external storage (paper/phone), freeing up cognitive bandwidth.

---

# Situation F — "Bad Smell"

The most bathroom-native emergency. Respect its simplicity.

1. **Step 1.** Strike a match (Streichhölzer). The sulfur dioxide actually neutralizes odor molecules. Science! (If no matches: skip to Step 2.)
2. **Step 2.** Ventilate. Window? Open it. Fan? Turn it on. No ventilation? Time is your friend. Wait.
3. **Step 3.** Deploy scent. Candle, spray, essential oil, strategically placed coffee grounds — whatever's available. Masking > suffering.
4. **Step 4.** If the smell is YOU → that's what showers are for. You're literally in the right room.
5. **Step 5.** If the smell is EMOTIONAL → 📍 Calm Guide (Ch.4). (Metaphorical bad smells respond to the same treatment: ventilate, mask with something nicer, give it time.)

### The Chemistry of Match-Based Odor Neutralization

The SO₂ mechanism is real and surprisingly elegant. When a match is struck, the combustion of sulfur in the match head produces sulfur dioxide ($SO_2$), which is a strong electrophile. Many malodorous compounds — particularly volatile organic compounds (VOCs) and hydrogen sulfide ($H_2S$) — are nucleophilic. The $SO_2$ reacts with these molecules, altering their molecular structure and thereby changing (or eliminating) their odor profile.[^so2] The effect is chemical neutralization, not mere masking — which is why matches work better than perfume for bathroom odors. The concentration of $SO_2$ from a single match is tiny and safe in ventilated spaces, though we don't recommend huffing match heads. Everything in moderation, including chemistry.

This is the only entry point where the solution might genuinely be "light a match and move on." Enjoy it. The other sections are heavier.

---

# Situation G — "No Place to Go"

Not just physically — existentially. You feel like you don't belong anywhere, or that there's nowhere that's truly yours. The bathroom is temporary. You need something more structural.

**Step 1. Immediate: You're here. That's somewhere.**

This is not flip. Being in a space, even a borrowed one, is a starting point. You haven't evaporated. You exist in coordinates. That's data.

**Step 2. Support hotlines — they work at 3am when nothing else does.**

→ 📍 Professional Support Directory (Ch.7, §14.5) for the full list. Key numbers: Telefonseelsorge (0800/111 0 111 or 0800/111 0 222 — free, 24/7, anonymous), and local crisis lines.

**Step 3. Local initiatives.**

Every city has communities, shelters, co-ops, meetups, and weird little groups that would love another person. Finding them is the hard part → 📍 Professional Support Directory (Ch.7, §14.5) includes starting points for local search.

**Step 4. Emotional processing.**

→ 📍 Calm Guide (Ch.4) — the "Eventually: Leaving the Bathroom" subsection is specifically designed for moments when you have to re-enter a world that doesn't feel like it has a place for you. It does. You just might not see it from in here.

---

## Situations B–G — Consolidated Routing Map

```
  B: Anxious ────────◆ Acute? ──→ 📍Calm
                      ◆ General? ─→ 📍Prof. Support
                      ◆ GAD-7 ≥10? → 📍Prof. Support + 📍Calm
                      ◆ About X? ─→ (see table)

  C: Pain ───────────◆ Physical? ─→ 📍Self Ambulance
                      ◆ NRS ≥7? ──→ 112 + 📍Self Ambulance
                      ◆ Psych? ───→ 📍Calm (+ 📍Prof. Support)

  D: Endangered ─────◆ Imminent? ─→ 110/112 FIRST
                      ◆ Stabilized? → 📍Calm + 📍Prof. Support
                      ◆ Cortisol falling? → Processing allowed

  E: Congesting ─────→ 📍Self Ambulance → 📍Calm → (maybe 📍Prof. Support)
                      Cognitive load > 7±2? → Externalize now.

  F: Bad Smell ──────→ SO₂ (matches) → Scent → Ventilate → (maybe 📍Calm)

  G: No Place ───────→ Hotlines → Local initiatives → 📍Calm
```

[^gad7]: Spitzer, R.L., Kroenke, K., Williams, J.B.W., & Löwe, B. "A brief measure for assessing generalized anxiety disorder: the GAD-7." *Archives of Internal Medicine* 166(10), 1092–1097 (2006). The GAD-7 is freely available and widely validated across languages and populations.

[^gad7_sensitivity]: Kroenke, K., Spitzer, R.L., Williams, J.B.W., Monahan, P.O., & Löwe, B. "Anxiety disorders in primary care: prevalence, impairment, comorbidity, and detection." *Annals of Internal Medicine* 146(5), 317–325 (2007). At threshold ≥10, sensitivity 89%, specificity 82%.

[^affect_labeling]: Lieberman, M.D., et al. "Putting feelings into words: affect labeling disrupts amygdala activity in response to affective stimuli." *Psychological Science* 18(5), 421–428 (2007). The mechanism: verbal labeling activates right ventrolateral PFC, which inhibits amygdala activation. It literally cools the emotional brain by engaging the linguistic one.

[^nrs]: Williamson, A. & Hoggart, B. "Pain: a review of three commonly used pain rating scales." *Journal of Clinical Nursing* 14(7), 798–804 (2005). The NRS has good test-retest reliability (r = 0.83–0.95) and correlates with VAS and categorical scales.

[^cortisol_stress]: Taves MD, et al. "Cortisol half-life and clearance: clinical implications." *Journal of Clinical Endocrinology & Metabolism* (2011). Cortisol plasma half-life: ~60–90 minutes. Active metabolites persist longer. This is why the "shakes" after a threat can last 1–2 hours — your biochemistry hasn't caught up to your reality.

[^stgb32_bg]: Strafgesetzbuch (StGB) §32 Notwehr. The four-element framework is derived from the legislative text and consistent German Federal Court (BGH) jurisprudence. See also §33 (Excessive self-defence) for cases where the proportionality threshold was exceeded under conditions of confusion, fear, or terror.

[^miller]: Miller, G.A. "The magical number seven, plus or minus two: some limits on our capacity for processing information." *Psychological Review* 63(2), 81–97 (1956). One of the most cited papers in psychology. Miller himself thought the "7±2" framing was slightly tongue-in-cheek — it became iconic anyway.

[^cowan]: Cowan, N. "The magical number 4 in short-term memory: a reconsideration of mental storage capacity." *Behavioral and Brain Sciences* 24(1), 87–114 (2001). The refined estimate accounts for chunking strategies — trained individuals can hold more by grouping items into larger chunks.

[^so2]: The SO₂ odor neutralization mechanism is widely documented in chemistry education but poorly studied in controlled settings (perhaps because funding agencies don't prioritize "bathroom match" research). The electrophilic-nucleophilic interaction is basic organic chemistry; the effect on volatile sulfur compounds (VSCs) like H₂S and CH₃SH is documented in atmospheric chemistry literature. See: Atkinson, R. "Gas-phase tropospheric chemistry of organic compounds." *Journal of Physical and Chemical Reference Data* (1994).

[^cortisol_response]: Dickerson, S.S. & Kemeny, M.E. "Acute stressors and cortisol responses: a meta-analytic integration." *Psychological Bulletin* 130(5), 733–756 (2004). Social-evaluative threats produce the largest cortisol responses; uncontrollable stressors produce larger responses than controllable ones. Being trapped in a bathroom with no exit strategy is, tragically, both.
