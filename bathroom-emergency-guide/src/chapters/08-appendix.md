---
title: "Appendix — The Loose Ends"
chapter: 8
revision: "3.2.0"
last_updated: "2026-05-03"
dependencies:
  - build/diagrams/decision_flow_graph.png
---

# Appendix — The Loose Ends

This section collects the things that don't fit neatly into the flow but are essential nonetheless: the master cross-reference, fillable fields, the symbol legend, formula index, and a notes page. Think of it as the bathroom drawer where the important miscellaneous stuff lives.

## Master Cross-Reference: Where Everything Points

Every path in this guide converges on one (or more) of four destinations. This table shows every section and where it routes.

| Source section | Routes to | Diagram references (v3.2) |
|---------------|-----------|--------------------------|
| A1 (Not yet geschlüpft) | 📍 Calm Guide · 📍 Prof. Support (§14.4) | — |
| A2 (Geschlüpft, minutes ago) | 📍 Zombie Guide · 📍 Self Ambulance · 📍 Calm Guide | — |
| A3 (Geschlüpft, days ago) | 📍 Prof. Support (§14.4, §14.2) · 📍 Calm Guide | — |
| A4 (< 10 years ago) | 📍 Prof. Support (§14.5) · 📍 Calm Guide | — |
| A5 (> 20 years ago) | 📍 Calm Guide | — |
| A6 (Ambiguous) | 📍 Calm Guide · 📍 Prof. Support (§14.4, §14.5) | — |
| A7 (Harmed/ended life) | 📍 Prof. Support (§14.3, §14.2) · 📍 Self Ambulance · 📍 Calm Guide | — |
| A8 (Managing responsibility) | 📍 Calm Guide · 📍 Prof. Support (§14.3, §14.2) | — |
| B1 (Acute anxiety) | 📍 Calm Guide | `anxiety_severity_spectrum.png` |
| B2 (General anxiety) | 📍 Prof. Support (§14.2) | `anxiety_severity_spectrum.png` |
| B3 (Worried about…) | 📍 Prof. Support (§14.2) · 📍 Calm Guide | — |
| C1 (Physical pain) | 📍 Self Ambulance | `pain_nrs_correlates.png` |
| C2 (Psych pain) | 📍 Calm Guide · 📍 Prof. Support (§14.2) | — |
| D (Endangered) | 📍 Prof. Support (§14.3, §14.2) · 📍 Calm Guide | — |
| E (Congesting) | 📍 Self Ambulance · 📍 Calm Guide · 📍 Prof. Support (§14.2) | — |
| F (Bad smell) | 📍 Calm Guide (minor) | — |
| G (No place to go) | 📍 Prof. Support (§14.2, §14.5) · 📍 Calm Guide | — |
| Ch.1 (How to Use) | All destinations | `decision_flow_graph.png` |
| Ch.4 (Calm Guide) | 📍 Prof. Support (Ch.7) | `stress_decay_curve.png` |
| Ch.5 (Self Ambulance) | 📍 Calm Guide · 112 | `triage_priority_heatmap.png`, `pain_nrs_correlates.png` |
| Ch.6 (Zombie Guide) | 📍 Self Ambulance · 📍 Calm Guide | `survival_probability_function.png`, `group_complexity_scaling.png`, `water_requirements_scaling.png` |

**Most-referenced destinations (by frequency):**

1. 📍 Calm Guide — 13 references (heart of the document)
2. 📍 Professional Support Directory — 11 references
3. 📍 Self Ambulance Guide — 4 references
4. 📍 Zombie Guide — 1 reference (but what a reference)

## Diagram Index (v3.2)

All diagrams referenced in the guide, organized by chapter:

| Diagram | Chapter | Description |
|---------|---------|-------------|
| `master_flowchart.png` | Ch.1 | Master flowchart — all 7 entry points → 4 destinations |
| `situation_a_tree.png` | Ch.2 | Situation A decision tree |
| `breathing_techniques.png` | Ch.4 | Box Breathing, 4-7-8, Physiological Sigh |
| `survival_pyramid.png` | Ch.6 | Survival priority pyramid |
| `scaling_chart.png` | Ch.6 | Scaling requirements 1→100 |
| `triage_flow.png` | Ch.5 | Self Ambulance triage flow |
| `decision_flow_graph.png` | Ch.1 | Guide topology as directed graph |
| `stress_decay_curve.png` | Ch.4 | Cortisol decay with/without active calming |
| `anxiety_severity_spectrum.png` | Ch.3 | GAD-7 scoring with recommended routing |
| `triage_priority_heatmap.png` | Ch.5 | Severity × urgency triage matrix |
| `survival_probability_function.png` | Ch.6 | Exponential decay with risk reduction factors |
| `group_complexity_scaling.png` | Ch.6 | Communication channels and governance layers |
| `pain_nrs_correlates.png` | Ch.3, Ch.5 | NRS pain scale with physiological markers |
| `water_requirements_scaling.png` | Ch.6 | Daily water needs by group size |

## Formula Index

All mathematical formulas used in the guide, with location and plain-language summary:

| Formula | Location | What it means |
|---------|----------|---------------|
| $G = (V, E)$ | Ch.1 | The guide is a directed graph with vertices and edges |
| $GAD\text{-}7 \in [0, 21]$ | Ch.3 | Anxiety severity score ranges from 0 to 21 |
| $NRS \in [0, 10]$ | Ch.3, Ch.5 | Pain scale ranges from 0 to 10 |
| $S(t) = S_0 + A(1 - e^{-\alpha t})$ | Ch.3 | Stress response activation curve |
| $t_{reset} \approx 10\text{min}$ | Ch.4 | Sympathetic-parasympathetic transition time |
| $C(t) = C_0 \cdot e^{-\lambda t}$ | Ch.4 | Cortisol decay function |
| $\lambda = \frac{\ln 2}{t_{1/2}}$ | Ch.4 | Decay constant from half-life |
| $HRV = \frac{SD_{RR}}{\overline{RR}}$ | Ch.4 | Heart rate variability coefficient of variation |
| $\text{CO}_2\text{ offload} \propto \frac{A \cdot \Delta P}{d}$ | Ch.4 | Physiological sigh CO₂ clearance rate |
| $\text{Cognitive Load} = I + E + G$ | Ch.3 | Working memory: intrinsic + extraneous + germane |
| $HR \in [60, 100]$ bpm | Ch.5 | Normal heart rate range |
| $RR \in [12, 20]$/min | Ch.5 | Normal respiratory rate range |
| $SpO_2 \in [95, 100]$% | Ch.5 | Normal oxygen saturation range |
| $BP < 120/80$ mmHg | Ch.5 | Normal blood pressure threshold |
| $t_{treatment} < 4.5$h | Ch.5 | Stroke thrombolysis treatment window |
| $P(\text{survive}, t) = e^{-\lambda t}$ | Ch.6 | Survival probability function |
| $W = n \cdot 3\text{L/day}$ | Ch.6 | Water requirements by group size |
| $C(n) = \frac{n(n-1)}{2}$ | Ch.6 | Group communication channels |
| $D_n = 5 \cdot 3^{n-1}$ | Ch.6 | Dunbar number layers |
| $E_{basal} \approx 1500$ kcal/day | Ch.6 | Basal metabolic caloric requirement |
| $E_{survival} \approx 2500\text{–}3000$ kcal/day | Ch.6 | Active survival caloric requirement |

## Fillable Fields

These are the fields left blank throughout the guide for you to personalize. Fill them in once, photograph the page, and you'll always have the information.

| Field | Your value |
|-------|-----------|
| WiFi password | `_______________________________` |
| Your doctor (Hausarzt) | `_______________________________` |
| Your doctor's phone | `_______________________________` |
| Local hospital | `_______________________________` |
| Local hospital address | `_______________________________` |
| Therapist (if applicable) | `_______________________________` |
| Therapist's phone | `_______________________________` |
| Emergency contact #1 | `_______________________________` |
| Emergency contact #1 phone | `_______________________________` |
| Emergency contact #2 | `_______________________________` |
| Emergency contact #2 phone | `_______________________________` |
| Nearest pharmacy (Apotheke) | `_______________________________` |
| Pharmacy night service | `_______________________________` |
| Preferred comfort item location | `_______________________________` |
| Scent candle location | `_______________________________` |
| Seneca / Tao Te Ching location | `_______________________________` |
| Local-server access | `_______________________________` |
| Bike lock combination | `_______________________________` |
| Spare key location | `_______________________________` |

## Flowchart Symbol Legend (Extended)

| Symbol | Name | Meaning |
|--------|------|---------|
| → | Arrow / flow | Follow this path in the indicated direction |
| ◆ | Decision diamond | A question with two or more possible answers — choose one to proceed |
| 📍 | Destination marker | A shared guide chapter — go there for detailed instructions |
| § | Terminus | This path ends. No useful guidance beyond this point. Reconsider. |
| 🔁 | Loop | Return to an earlier point in the flowchart and re-enter from a different path |
| ✓ | Checkpoint | Verify a condition before proceeding |
| ⚠ | Warning | Critical safety note — do not skip |
| 💡 | Tip | Optional but helpful advice |
| `$...$` | Inline math | A formula within text — skip if not needed, plain explanation follows |
| `$$...$$` | Display math | A standalone formula — same rule, skip-friendly |
| `[^n]` | Footnote | Additional source or context — read if curious, skip if not |

### Color Coding

| Color | Represents | Used for |
|-------|-----------|---------|
| Math blue | Primary paths, main headings | Default reading flow |
| Pure white | Background, breathing room | Pages, decision spaces |
| Green | Safe / calm destinations | Calm Guide references |
| Red | Urgent / danger routes | Emergency calls, life-threat alerts |
| Orange | Caution / decision points | ◆ Decision diamonds |
| Purple | Zombie / speculative paths | Zombie Guide references |
| Gray | Supplementary / optional | Tips, notes, fillable fields |
| Cyan | Scientific / mathematical | Formulas, data tables, research citations |

## The Complete Decision Tree (Text Version)

For when you can't read the visual flowchart (low light, visual impairment, or the diagram got coffee on it), here's the entire guide compressed into a single navigable text tree:

```
BATHROOM EMERGENCY GUIDE — MASTER TREE (v3.2)
═══════════════════════════════════════════════

1. WHAT BROUGHT YOU HERE?
   ├── A: CAUSED TROUBLE (involving a life/entity)
   │   ├── Step 1: Biological or Silicon?
   │   │   ├── Silicon → Escaped? → BSI / talk to host / → see Bio
   │   │   └── Biological → Step 2
   │   ├── A1: Not geschlüpft → medical support + → Prof. Support §14.4
   │   │   └── Gestation milestones: 4w/8w/12w/20w/24w/28w/32w/37w+
   │   ├── A2: Geschlüpft, minutes ago
   │   │   ├── Post-apocalypse → → Zombie Guide
   │   │   └── Pre-apocalypse → 110 / find humans / → Self Ambulance
   │   ├── A3: Geschlüpft, days ago → medical + ethical → Prof. Support §14.4, §14.2
   │   ├── A4: <10 years → state support + development guide → Prof. Support §14.5 + → Calm
   │   │   └── WHO milestones: sit ~6mo, walk ~12mo, vocab ~200w@24mo
   │   ├── A5: >20 years → grow up pls / → Calm
   │   ├── A6: Ambiguous
   │   │   ├── (a) Don't want to but will → → Calm + → Prof. Support
   │   │   └── (b) Want to but can't → money/medical/reproduction → Prof. Support §14.4, §14.5
   │   ├── A7: Harmed/ended life
   │   │   ├── Self-defense → §32 StGB (4 elements) + → Prof. Support §14.3 + → Calm
   │   │   ├── Accident → → Self Ambulance + find humans + → Calm
   │   │   └── For fun/profit → §
   │   └── A8: Managing responsibility → → Calm + → Prof. Support §14.3, §14.2
   │
   ├── B: FEEL ANXIOUS
   │   ├── B1: Acute → → Calm
   │   ├── B2: General → → Prof. Support §14.2
   │   ├── B3: Worried about… → friends/self/past/future → → Calm + → Prof. Support §14.2
   │   └── GAD-7: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe
   │
   ├── C: FEEL PAIN
   │   ├── C1: Physical → → Self Ambulance
   │   ├── C2: Psychological → → Calm (+ → Prof. Support §14.2)
   │   └── NRS: 0-3 mild, 4-6 moderate, 7-9 severe, 10 emergency
   │
   ├── D: FEEL ENDANGERED
   │   ├── Imminent → 110/112 FIRST
   │   ├── Stabilized → → Prof. Support §14.3, §14.2 + → Calm
   │   └── Stress response: C(t) = C₀·e^(-λt), t½ ≈ 75 min
   │
   ├── E: THINGS CONGESTING → → Self Ambulance → → Calm → (→ Prof. Support §14.2)
   │   └── Cognitive load: 7±2 items (Miller), 4±1 chunks (Cowan)
   │
   ├── F: BAD SMELL → SO₂ (matches) → scent → ventilate → (→ Calm minor)
   │
   └── G: NO PLACE TO GO → hotlines → local initiatives → → Prof. Support §14.2, §14.5 + → Calm


DESTINATION GUIDES
═══════════════════

📍 CALM GUIDE (Ch.4)
   ├── 4.1: You're allowed to be here (10-min Me Time; t_reset ≈ 10min)
   ├── 4.2: Breathing (Box / 4-7-8 / Physiological Sigh)
   │         Stress decay: C(t) = C₀·e^(-λt)
   │         HRV = SD_RR / RR_mean
   ├── 4.3: Comfort inventory (dopamine + oxytocin mechanisms)
   ├── 4.4: Eventually: leaving the bathroom
   └── 4.5: Seek help now or afterwards

📍 SELF AMBULANCE GUIDE (Ch.5)
   ├── 5.1: Life-threatening? → 112
   │         Bayes' triage: P(critical|signs)
   ├── 5.2: First aid quick ref (wounds/burns/fractures/vitals)
   │         Vitals: HR∈[60,100], RR∈[12,20], SpO₂∈[95,100], BP<120/80
   │         FAST stroke: t_treatment < 4.5h
   │         Burns: Lund-Browder chart for TBSA%
   ├── 5.3: When to call for help
   ├── 5.4: Self-care while waiting
   └── 5.5: Non-physical emergencies (5-4-3-2-1 grounding)

📍 ZOMBIE GUIDE (Ch.6)
   ├── 6.1: Survival (water/food/shelter/traces/energy/hygiene)
   │         P(survive,t) = e^(-λt), W = n·3L/day
   │         E_basal ≈ 1500 kcal, E_survival ≈ 2500-3000 kcal
   ├── 6.2: Collapsing society (resources/friends/defense/scaling WASH)
   │         C(n) = n(n-1)/2 communication channels
   │         Dunbar: D_n = 5·3^(n-1) → 5/15/50/150/500
   └── 6.3: Building society (organizing/governance/psychology/scaling 1→100)
             Ostrom's 8 principles for common-pool resource governance

📍 PROFESSIONAL SUPPORT DIRECTORY (Ch.7)
   ├── 7.1: Emergency numbers
   ├── 7.2: Psychological support
   │         CBT ~60% response, EMDR ~70% PTSD reduction
   │         IASC 4-layer intervention pyramid
   ├── 7.3: Legal support (§32 StGB: 4 elements)
   ├── 7.4: Medical support
   └── 7.5: Social support
```

## Notes Page

Your space. Use it for whatever the flowcharts don't cover — local information, personal reminders, the name of that therapist your friend recommended, or just processing by writing.

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________
