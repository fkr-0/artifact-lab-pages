---
title: "How to Use This Guide"
chapter: 1
revision: "3.2.0"
last_updated: "2026-05-03"
dependencies:
  - build/diagrams/master_flowchart.png
  - build/diagrams/decision_flow_graph.png
---

# How to Use This Guide

## Purpose

This document is a decision-support tool designed for deployment in a bathroom environment. It provides structured guidance for situations ranging from acute anxiety and physical pain to — hypothetically — zombie apocalypses. Every path through this guide converges on one of four practical destinations: the **Calm Guide** (→ Ch.4), the **Self Ambulance Guide** (→ Ch.5), the **Zombie Guide** (→ Ch.6), or the **Professional Support Directory** (→ Ch.7). Regardless of where you enter, you will always be routed toward actionable next steps.

The guide's architecture is formally a directed acyclic graph (DAG) — a structure where information flows in one direction and never loops back on itself (except where explicitly marked 🔁). This means you can enter at any point and still reach a destination without getting stuck in circular reasoning, which is more than most anxious brains can claim.

## Target Audience

Anyone currently in a bathroom who needs guidance — emotional, medical, ethical, or existential. No prerequisites beyond physical presence and a willingness to read. The guide assumes no prior training in first aid, psychology, or zombie survival, though it helps if you can operate a door lock.

## Mathematical Notation Legend

This guide uses LaTeX math notation to formalize certain concepts — not because bathrooms require calculus, but because precision reduces ambiguity, and ambiguity is the fuel of anxiety. Here's how to read the notation:

| Notation | Meaning | Example |
|----------|---------|---------|
| `$x$` | Inline math — a variable or formula within text | Heart rate $HR \in [60, 100]$ bpm |
| `$$...$$` | Display math — a standalone formula | $$C(t) = C_0 \cdot e^{-\lambda t}$$ |
| `$\in$` | "is an element of" — value belongs to a set | $NRS \in [0, 10]$ |
| `$\approx$` | Approximately equal | $t_{reset} \approx 10\text{min}$ |
| `$\rightarrow$` | Approaches or leads to | $n \rightarrow \infty$ |

If you see a formula and think "I don't need this right now" — skip it. The plain-language explanation always follows the math. The formulas are for when you want to understand *why* the plain language works.

## Quick-Start Procedure

1. Identify your current situation from the **Master Flowchart** below (or from the list of seven entry points).
2. Follow the numbered steps along your path. Decisions are marked with ◆; destinations are marked with 📍.
3. Every path ends at one or more destination guides. Go there. Read. Act.
4. If multiple paths apply, handle the most urgent one first (prioritize: physical safety > acute distress > everything else).

## Guide Topology — A Graph-Theoretic Model

For the mathematically inclined (or the analytically anxious who need to understand the structure before trusting it), this guide can be formalized as a directed graph:

$$G = (V, E)$$

where $V$ is the set of nodes and $E$ is the set of directed edges. Our guide topology has:

- **Entry nodes** ($|V_{entry}| = 7$): Situations A through G — the seven ways you arrived in this bathroom
- **Decision nodes** ($|V_{decision}| \approx 14$): Internal ◆ points within each situation
- **Destination nodes** ($|V_{dest}| = 4$): The four destination guides (Calm, Self Ambulance, Zombie, Professional Support)

The total graph: $|V| = 25$ nodes, $|E| \approx 38$ directed edges. Every path from an entry node reaches at least one destination node — this is the graph's **reachability invariant**, and it's what guarantees you'll never get stuck in this guide without a next step.[^graph_theory]

![Decision Flow Graph — structural topology of the guide](build/diagrams/decision_flow_graph.png)

## Flowchart Legend

| Symbol | Meaning |
|--------|---------|
| → | Follow this path |
| ◆ | Decision point — answer the question to proceed |
| 📍 | Destination guide — go to the referenced chapter |
| § | Terminus — this path has no useful guidance (reconsider your choices) |
| 🔁 | Loop back — you may re-enter the flowchart from another entry point |

## Your Current Status

You are in a bathroom. By definition:

- ✓ The door likely locks — you have privacy
- ✓ Running water is available — you have hygiene resources
- ✓ You are indoors — you are sheltered
- ✓ You chose to come here — some part of you is already practicing self-care

Let's formalize your resource state. Define $R$ as the set of available resources:

$$R = \{privacy, water, shelter, self\_awareness\}$$

With $|R| = 4$, you have more resources than your anxiety is letting you see. Anxiety narrows the perceived resource set to $|R_{perceived}| \ll |R|$. The purpose of this guide is to restore $R_{perceived} \rightarrow R$. This is not metaphor — it's cognitive restructuring, and it works.

This is a stable starting position. Proceed with whatever brought you here.

## Master Flowchart — "What Brought You Here?"

![Master Flowchart — all 7 entry points converging on 4 destination guides](build/diagrams/master_flowchart.png)

## The Seven Entry Points

| # | Entry Point | One-line summary | Primary destination |
|---|-------------|-----------------|---------------------|
| A | Caused Trouble | Something involving another life/entity | Decision tree → varies |
| B | Feel Anxious | Worry, dread, overthinking | 📍 Calm Guide / 📍 Prof. Support |
| C | Feel Pain | Physical or psychological pain | 📍 Self Ambulance / 📍 Calm Guide |
| D | Feel Endangered | Threat to your safety | 📍 Prof. Support / 📍 Calm Guide |
| E | Things Congesting | Overwhelm, too much at once | 📍 Self Ambulance + 📍 Calm Guide |
| F | Bad Smell | Olfactory emergency | Matches + 📍 Calm Guide (minor) |
| G | No Place to Go | Isolation, homelessness of spirit | 📍 Prof. Support + 📍 Calm Guide |

**Navigation note.** These entry points are not mutually exclusive. If multiple situations apply, start with the one that feels most pressing. The guide is designed so that paths can be combined — for example, if you caused trouble *and* feel anxious, work through Situation A first (it may route you to the Calm Guide anyway), then address Situation B.

[^graph_theory]: The graph-theoretic framing is more than decorative. Decision trees are a well-studied structure in operations research and decision analysis (Raiffa, 1968). The reachability invariant — every path reaches a destination — is a formal property that guarantees no "dead end" states exist in the guide. For readers who want to go deeper, see: Howard, R.A. & Matheson, J.E. "Influence diagrams" (1981), and the broader field of Bayesian decision networks. The graph can also be analyzed as a Markov chain, where transition probabilities depend on the reader's emotional state — but that's a research paper, not a bathroom guide.
