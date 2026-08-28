# Git Recipe Book — Educational Architecture Roadmap

## Purpose

Git Recipe Book should become more than an interactive command reference. Its target is a beginner-safe learning environment that teaches a compact, durable model of Git well enough that a learner can predict what a command will do, inspect what actually happened, recover from mistakes, and transfer the model to a real repository.

The product should optimize for **understanding before speed** and **transfer before command coverage**.

The core learning cycle remains the strongest existing idea:

> **model → predict → act → inspect → explain → retrieve → transfer**

The next releases should make that cycle real in the runtime, not merely visible in the interface.

---

## 1. Current-state review

### What is already strong

The current implementation has a unusually good foundation for a beginner Git tutor:

- a deterministic browser-side Git simulator with a broad command set;
- a five-layer state model: working tree, staging area, commit history, refs/HEAD, and remote state;
- command classification by intent and risk;
- a graph, file view, refs view, terminal, command evidence panel, and course map;
- explicit prediction before command execution in the instructional design;
- command before/after evidence and reflection checkpoints;
- lesson prerequisites, persisted progress, review recommendations, and challenge-mode concepts;
- a responsive course/evidence layout and accessible names for major controls;
- 173 passing unit/integration tests at review time, a clean source lint, and a successful production build.

This is already substantially better than a recipe list. The project now needs **pedagogical strictness, simulation fidelity, content architecture, and progressive UX**.

### Structural and educational gaps found in the review

#### 1. The advertised learning loop is not yet enforced

The UI says “predict → run → inspect → explain”, but the runtime does not fully require it:

- the terminal can execute a lesson command without a prediction;
- lesson step validation is evaluated after command execution without first requiring `result.success`;
- therefore a command whose text matches the lesson regex can potentially satisfy a step even if Git rejected the operation;
- the learner can advance many knowledge-only checkpoints by clicking “I can explain it”, without producing observable retrieval evidence.

**Roadmap consequence:** progression must be evidence-based, not button-based.

#### 2. The state-delta abstraction is too count-oriented

The learning model compares summarized counts for several layers. Counts are useful for orientation, but important Git changes can preserve counts:

- a branch pointer can move while branch count stays constant;
- the contents of the index can change while staged file count stays constant;
- working-tree content can change while changed-file count stays constant;
- a remote-tracking ref can advance while remote count stays constant.

The current code already acknowledges this limitation in its fallback explanation.

**Roadmap consequence:** introduce semantic state events and typed deltas, not only summary-count deltas.

#### 3. Lesson content and lesson runtime are too tightly coupled

`lesson-provider.ts` currently carries a very large amount of curriculum text, setup data, validation rules, hints, and UX metadata in one TypeScript module.

This makes it difficult to:

- review the curriculum independently of code;
- validate concept coverage mechanically;
- reuse scenarios across lessons;
- add translations or alternate explanations;
- distinguish learning objectives from command syntax;
- evolve the runtime schema without touching all content.

**Roadmap consequence:** move toward declarative lessons and reusable scenario fixtures.

#### 4. Some lesson statements need correctness repair before expansion

The review found several places where the teaching abstraction is too absolute or currently mismatched with the simulator:

- the merge lesson says a merge creates a two-parent merge commit, but fast-forward merges do not;
- the remote lesson teaches `git checkout origin/main` as creating a local tracking branch, which is not the safe general explanation of that command;
- the push lesson implies `git push origin main` establishes upstream tracking automatically; teaching upstream configuration should be explicit (`-u` / `--set-upstream`) instead;
- “pull = fetch + merge” should be taught as a common/default conceptual model while acknowledging configured rebase/fast-forward behavior;
- the guided tag lesson includes `git show v1.0`, but the simulator dispatcher reviewed here does not expose a `show` command;
- the orientation text sometimes says `git add` “moves” changes to the staging area, while the more accurate beginner model is that it **copies/selects content into the index** while the working file remains in place.

**Roadmap consequence:** correctness gates must become part of the lesson build/test pipeline.

#### 5. The course map is organized mainly by Git feature categories, not by conceptual dependency

The categories are understandable, but beginners benefit more from a concept progression than from Git’s command taxonomy.

For example:

- tags and cherry-pick have both dedicated guided lessons and a later generic “Advanced” lesson, creating duplication;
- recovery concepts are separated from the first moments in which recovery is useful;
- merge and rebase are grouped together even though the cognitive model and safety profile differ significantly;
- all future advanced material is visible as locked course-map content, which can make the curriculum look larger and more intimidating than the learner’s current task.

**Roadmap consequence:** retain categories for browsing, but drive progression from a concept graph and reveal the course progressively.

#### 6. The test UI proves operations, but not yet learning

The existing browser tests prove that core commands work and that the layout behaves, but the next test environment should also prove:

- the learner cannot skip required prediction/evidence phases;
- incorrect commands produce instructional feedback without accidental progression;
- misconceptions trigger targeted remediation;
- scenarios are deterministic and resettable;
- branch/ref/index/worktree deltas are semantically correct;
- conflict and recovery workflows are teachable, not merely executable;
- lessons remain possible from their declared initial state;
- every command used in lesson content is supported by the active teaching backend.

---

## 2. Target beginner mental model

The product should deliberately teach Git in **three abstraction depths**. A beginner should never need the deepest layer to complete the first course, but the deeper model should explain why the visible behavior makes sense.

### Depth A — Everyday state model

Teach first:

```text
project files
    │
    │ git add
    ▼
staging area / index
    │
    │ git commit
    ▼
commit history
    │
    ├── branch names move through history
    └── HEAD tells you where you are
```

Plus a second repository copy:

```text
local repository                    remote repository
----------------                    -----------------
local branch                        remote branch
remote-tracking ref  <--- fetch --- remote branch
local branch         --- push ----> remote branch
```

### Depth B — Pointer and snapshot model

Once the first commit/branch lessons are secure:

```text
HEAD → current branch → commit → parent commit → ...
                       │
                       └→ project snapshot
```

Teach explicitly:

- a branch is a movable name, not a copy of the project;
- a tag is normally a stable name, not a moving branch;
- a commit has identity and parent relationships;
- checkout/switch changes where HEAD is attached and may update visible files;
- merge and rebase transform history differently.

### Depth C — Abstracted object model

Reveal only after learners can reason with Depth A/B:

```text
commit
  ├─ metadata + parent(s)
  └─ tree ──> tree(s) ──> blob content

refs/heads/main ──> commit id
HEAD ──> refs/heads/main
index ──> candidate tree for the next commit
```

This is enough “inner workings” to explain Git without turning the course into plumbing-command training.

### Conceptual invariants to teach repeatedly

1. **Working tree is not history.**
2. **Staging is a deliberate selection for the next snapshot.**
3. **A commit is immutable; names/pointers move.**
4. **HEAD is location, not a mysterious extra copy.**
5. **Branches are cheap movable pointers.**
6. **Fetch updates knowledge of another repository without integrating it into the current branch.**
7. **Merge preserves ancestry; rebase recreates commits on another base.**
8. **Most recovery is pointer/state manipulation; panic is usually unnecessary if objects still exist.**
9. **Observation commands are part of expert operation, not beginner scaffolding to discard later.**
10. **The safest Git workflow is orient → change one thing → inspect → verify.**

---

## 3. Curriculum architecture v2

### Replace “lesson completed” with an evidence ladder

Every concept should move through these states:

```text
unseen
  ↓
introduced
  ↓
guided-success
  ↓
retrieved
  ↓
transferred
  ↓
review-due / secure
```

A lesson being finished is **not** the same thing as mastery.

### Standard lesson anatomy

Every executable lesson should follow the same contract:

1. **Goal** — a human development situation.
2. **Model** — one new mechanism, no command syntax yet when possible.
3. **Worked example** — show a small state transition.
4. **Prediction** — learner predicts affected entities/layers.
5. **Action** — learner chooses or enters a command.
6. **Inspection** — before/after state and event delta.
7. **Explanation** — learner selects or constructs the causal explanation.
8. **Counterexample** — show a nearby command that does something different.
9. **Retrieval** — repeat later with reduced hints.
10. **Transfer** — solve a goal in a changed scenario.
11. **Exit evidence** — record why the concept is considered secure.

### Hint fading

Hints should fade deliberately:

```text
Level 0: goal only
Level 1: name the Git concept
Level 2: name the command family
Level 3: show argument structure
Level 4: reveal exact command
```

A learner should be able to request help without the system immediately turning practice into copy-typing.

### Assessment types

Replace self-report-only checkpoints with multiple lightweight evidence forms:

- **predict the layer/entity** that changes;
- **predict the direction** of change (e.g. branch pointer advances, index receives content);
- **choose the correct graph outcome** from 2–4 small diagrams;
- **order the states** before running a command;
- **identify why a command failed** from state evidence;
- **choose a recovery action** for a safe sandbox situation;
- **goal-to-command transfer** with no exact syntax hint;
- optional free-text explanation for reflection, never requiring LLM grading for core completion.

### Concept graph instead of only category prerequisites

Each lesson should declare concepts it:

```yaml
introduces:
  - staging-area
  - snapshot-selection
requires:
  - working-tree
practices:
  - status-orientation
assesses:
  - staging-area
  - snapshot-selection
```

The recommendation engine should reason from this graph instead of maintaining concept mappings keyed to specific step IDs.

---

## 4. Proposed beginner course sequence

### Stage 0 — Orientation: “What problem does Git solve?”

No terminal prerequisite.

Teach:

- versions vs copied folders;
- repository vs project files;
- observation as a habit;
- working tree, staging/index, history;
- branch pointer and HEAD at a purely visual level.

Exit evidence:

- learner can place working tree, index, commit, branch, and HEAD on a diagram;
- learner can distinguish “file content” from “Git metadata”.

### Stage 1 — The local snapshot loop

Core operations:

- `git init`
- `git status`
- edit/create a file in the sandbox
- `git diff`
- `git add <path>`
- `git diff --staged`
- `git commit -m ...`
- `git log`
- `git show`

Teach:

- untracked vs tracked;
- unstaged vs staged;
- index as selected content, not a waiting room containing moved files;
- commit as immutable history plus parent link;
- observation commands as normal workflow.

Transfer challenge:

> “Three files changed; record only the documentation fix in the next commit.”

This is more educational than `git add .` as the primary staging example.

### Stage 2 — Names, pointers, and parallel work

Core operations:

- `git branch`
- `git switch -c <name>`
- `git switch <name>`
- `git log --graph` as an abstracted visual equivalent
- detached HEAD as an optional concept after normal branch switching

Teach:

- creating a branch does not copy commits/files;
- committing moves the current branch pointer;
- switching changes HEAD and may update the working tree;
- branch names and commit IDs are different kinds of references.

Transfer challenge:

> “Start feature work without moving `main`; make two commits; return to `main` and prove it did not move.”

### Stage 3 — Combining histories

Split merge and rebase into separate modules.

#### Merge

Teach three cases independently:

1. already up to date;
2. fast-forward;
3. true merge commit with two parents.

Then introduce conflict resolution as a first-class scenario.

Core operations:

- `git merge`
- conflict inspection
- edit resolution
- `git add`
- merge completion
- optional `git merge --abort`

#### Rebase

Only after merge is secure.

Teach:

- old commits are not “moved”; equivalent changes are replayed into **new commits**;
- new commit IDs are expected;
- why rebasing shared history is a collaboration risk;
- conflict pause/continue/abort.

Core operations:

- `git rebase <base>`
- `git rebase --continue`
- `git rebase --abort`

### Stage 4 — Undo and recovery before “advanced tricks”

Recovery should be a major curriculum stage, not a warning page plus a destructive command.

Teach from safest to most invasive:

- discard an unstaged edit with `git restore <path>`;
- unstage with `git restore --staged <path>`;
- create a new inverse commit with `git revert`;
- move refs/index/worktree with `git reset --soft|--mixed|--hard`;
- temporary shelving with `git stash`;
- recover “lost” commits conceptually through reflog.

Later operations:

- `git reflog`
- restore a branch/ref from a reflog-selected commit.

The recovery lab should make destructive operations safe enough to explore repeatedly.

### Stage 5 — Remotes as two repositories, not “the cloud”

Teach local and remote state as two separately moving graphs.

Core operations:

- `git remote -v`
- `git fetch`
- inspect `origin/main`
- create a tracking branch explicitly
- `git push -u origin <branch>`
- `git pull` only after fetch + integration are understood

Teach:

- remote names are configuration;
- remote-tracking refs are local knowledge;
- fetch does not update the local branch/working tree;
- push updates a remote branch if allowed;
- upstream configuration and remote-tracking refs are related but not identical concepts;
- pull is a convenience operation whose integration strategy should be visible.

Transfer challenge:

> “A collaborator moved the remote branch. Inspect first, integrate safely, then publish your local work.”

### Stage 6 — Selective history tools

Only after the pointer/history model is solid:

- tags;
- cherry-pick;
- annotated tag concept;
- compare branch vs tag behavior;
- selective change transfer.

Remove duplicate generic advanced steps once dedicated lessons exist.

### Stage 7 — Capstones

Capstones should be scenario goals, not named command drills.

Examples:

- ship one small feature on a branch;
- fix a mistaken staging selection;
- recover an accidentally discarded branch pointer;
- resolve a merge conflict;
- integrate remote collaborator work;
- prepare a release tag;
- diagnose “why does Git say nothing to commit?”;
- diagnose “why was my push rejected?”.

---

## 5. Test/practice environment v2

The simulator should become a **scenario laboratory**.

### Learner-facing modes

#### Guided lesson

- strict phase progression;
- one concept at a time;
- required prediction before state-changing actions when the lesson calls for it;
- evidence drawer opens automatically only when useful;
- progressive hints;
- deterministic reset.

#### Practice lab

- goal given, command not given;
- learner can inspect any state view;
- mistakes are allowed;
- optional hint ladder;
- checkpoint when goal predicates are satisfied.

#### Free sandbox

- unrestricted simulator exploration;
- “explain last command” always available;
- undo/reset scenario control is clearly separated from Git commands so learners do not confuse simulator reset with Git recovery.

#### Recovery lab

- deliberately broken repositories;
- one-click restore to scenario start;
- destructive Git commands encouraged safely;
- before/after timeline preserved for comparison.

### Scenario fixture schema

Create reusable, declarative scenarios independent of lesson prose:

```yaml
id: diverged-feature-fast-forward-impossible
initial:
  files: ...
  commits: ...
  branches: ...
  head: main
  remotes: ...
goal:
  predicates:
    - branch: main
      containsCommitMessage: feature-complete
allowedCapabilities:
  - inspect
  - stage
  - commit
  - branch
  - merge
teachingEvents:
  - first-conflict
  - first-two-parent-commit
```

Lessons reference scenarios instead of embedding setup logic directly.

### Semantic repository event model

Every command should produce events such as:

```text
WorkingFileChanged(path, beforeHash, afterHash)
IndexEntryUpdated(path, beforeHash, afterHash)
CommitCreated(commitId, parents, treeId)
RefCreated(ref, target)
RefMoved(ref, before, after)
HeadAttached(ref)
HeadDetached(commitId)
RemoteTrackingRefMoved(ref, before, after)
RemoteBranchMoved(remote, branch, before, after)
ConflictStarted(paths)
ConflictResolved(path)
OperationAborted(kind)
```

The educational explanation layer should consume these events. This avoids trying to infer every mechanism from counts after the fact.

### Dual representation

Keep both:

- a **beginner layer view** (“working tree changed”);
- an **advanced entity view** (“refs/heads/main moved from A to B”).

A “show internals” control can progressively reveal the second representation without forcing it on first-time learners.

### Backend conformance

Use the existing backend abstraction to introduce a conformance harness:

```text
lesson/scenario command sequence
        │
        ├─ deterministic teaching simulator
        └─ reference backend where supported
                 │
                 ▼
         normalized semantic state
                 │
                 ▼
             compare
```

The goal is not to reproduce every Git edge case. The goal is to ensure every behavior the course **teaches** is truthful.

---

## 6. Lesson schema v2

Split curriculum data from execution code.

Suggested structure:

```text
src/
  curriculum/
    concepts/
      working-tree.yml
      staging-area.yml
      commit.yml
      refs-head.yml
      remote-tracking.yml
    courses/
      beginner.yml
    lessons/
      00-orientation/
      10-local-snapshots/
      20-branches/
      30-merge/
      40-recovery/
      50-remotes/
      60-selective-history/
    scenarios/
      local/
      branching/
      conflicts/
      recovery/
      remotes/
  learning-runtime/
    lesson-engine.ts
    assessment-engine.ts
    progression-engine.ts
    review-scheduler.ts
  git-model/
    state.ts
    events.ts
    delta.ts
    invariants.ts
  backends/
    teaching-simulator/
    isomorphic-git/
  components/
    learning/
    repository/
    terminal/
```

A lesson declaration should contain pedagogic intent rather than arbitrary functions:

```yaml
id: stage-one-file
concepts:
  requires: [working-tree, status]
  introduces: [staging-area, selective-snapshot]
scenario: local/three-files-changed
objective: Select only the documentation change for the next commit.
phases:
  - model
  - predict
  - act
  - inspect
  - explain
assessment:
  goalPredicates:
    - indexContains: README.md
    - indexExcludes: src/app.ts
  transferScenario: local/different-three-files-changed
```

Avoid regex-only validation whenever the learning goal is a repository state. Accept multiple correct command sequences when the goal permits them.

---

## 7. Modern beginner UX direction

### A. One primary decision per viewport

The learner should usually see one dominant next action:

- learn this mechanism;
- make this prediction;
- run an experiment;
- inspect this delta;
- answer this checkpoint.

Do not ask the beginner to continuously choose among course map, graph, terminal, files, refs, help, evidence, and lesson progression.

### B. Progressive course reveal

Default course map:

```text
Now
  Git Orientation
Next
  Local snapshots
Later
  Branches
```

Allow “show full course” for learners who want the complete map.

Locked advanced lessons should not dominate the initial visual hierarchy.

### C. Contextual views instead of permanently visible tooling

Examples:

- show the index/working comparison prominently during `add` lessons;
- emphasize refs/HEAD during branch lessons;
- show local + remote graphs side by side during fetch/push lessons;
- emphasize conflict files during merge/rebase conflict lessons.

The interface can remain spatially stable while **visual emphasis changes with the concept**.

### D. Command entry should support intent, not only syntax

Before typing, show:

```text
Goal: select README.md for the next snapshot

What kind of action do you need?
[ Inspect ] [ Stage ] [ Record ] [ Move pointer ] [ Synchronize ]
```

Then allow terminal entry. This teaches command families and intention mapping.

### E. Errors become teaching evidence

When a command fails, do not merely display an error. Add:

- what prerequisite was missing;
- which state did **not** change;
- what the learner can inspect next;
- a retry without losing the prediction record.

A failed command should never accidentally count as lesson completion.

### F. Keep command line authenticity

Do not replace the terminal with buttons. Buttons and diagrams should teach the model; the terminal should remain the authentic action surface.

For true beginners, add optional syntax assistance:

- token coloring (`git`, subcommand, flag, ref/path);
- argument placeholders;
- history/autocomplete;
- inline explanation of a command before execution;
- copy is allowed, but the lesson should mark when the learner used an exact-command reveal.

### G. Accessibility and reduced cognitive load

Maintain and extend:

- keyboard-first operation;
- semantic headings/regions;
- non-color-only state distinctions;
- reduced-motion behavior for graph transitions;
- mobile overlays rather than width-crushing sidebars;
- readable graph alternatives for screen readers;
- focus restoration when drawers/dialogs close.

---

## 8. Testing strategy

### Layer 1 — Git model unit tests

Test state transitions and invariants independently of UI:

- index content, not only count;
- ref target movement;
- HEAD attach/detach;
- commit parent relationships;
- fast-forward vs merge commit;
- rebase creates replacement commit IDs;
- remote-tracking refs vs local branches;
- upstream configuration;
- reset mode semantics;
- conflict lifecycle;
- restore/revert/reflog semantics when added.

### Layer 2 — Lesson contract tests

Every bundled lesson must prove:

- all referenced concepts exist;
- all prerequisites form an acyclic graph;
- all scenarios exist;
- all commands exposed as exact examples are supported by the selected backend;
- every dangerous command has safety framing;
- the declared goal is reachable from the initial state;
- at least one valid solution completes the lesson;
- a known wrong solution does not complete it;
- a failed command cannot advance progression;
- transfer assessment differs materially from the worked example.

### Layer 3 — Simulator/reference differential tests

For the supported teaching subset, compare normalized behavior between the teaching simulator and the reference backend.

Maintain an explicit list of intentional abstractions/differences.

### Layer 4 — Learning-runtime tests

Prove the actual pedagogy:

- prediction required where declared;
- hints fade and exact-command reveals are recorded;
- inspection precedes completion;
- explanation/retrieval evidence is recorded;
- recommendation engine uses concept evidence;
- completed lessons can be replayed without corrupting mastery history;
- review scheduling uses timestamped attempts rather than only an evidence count.

### Layer 5 — Component tests

Test each instructional state:

- model;
- prediction;
- command failure;
- success/evidence;
- reflection;
- misconception remediation;
- transfer challenge;
- review due.

### Layer 6 — Browser learner journeys

Replace some command-only E2E tests with learner stories:

1. complete first snapshot with required prediction/evidence;
2. make a wrong prediction, learn from it, and continue;
3. run a syntactically correct but state-invalid command and verify no progression;
4. create a branch and prove `main` did not move;
5. encounter fast-forward and true merge separately;
6. resolve a conflict;
7. recover an edit/commit using the least destructive appropriate tool;
8. fetch collaborator work without changing local working files;
9. push with explicit upstream setup;
10. complete a capstone with hints disabled.

Keep responsive/layout smoke coverage, but treat it as UX infrastructure rather than educational evidence.

---

## 9. Implementation milestones

### Phase 0 — Correctness and progression integrity

**Status: implemented in the 2026-08-12 working slice.** Strict prediction gating, success-only progression, failed-attempt evidence, capability checks, `show`, staged diff, corrected tracking/upstream semantics, and learner E2E are in place.

**Target:** patch release before curriculum expansion.

Work:

- require successful execution before command-step completion;
- enforce required prediction before executing assessed lesson actions;
- keep failed attempts as evidence without advancing;
- implement or remove every lesson command not supported by the simulator (`git show` is the first known mismatch);
- correct merge, remote tracking, push upstream, pull-strategy, and staging wording;
- add E2E tests for failed-command/no-progression and no-prediction/no-progression;
- add lesson-support matrix test.

Exit criteria:

- lesson text, simulator capability, and progression engine cannot disagree silently.

Suggested release: **1.1.1**.

### Phase 1 — Curriculum/data extraction

**Status: implemented and expanded across the active curriculum on 2026-08-12.** Concept/scenario registries, goal predicates, objective retrieval, reference solutions, and lesson schema v2 now drive every active course stage through the compatibility adapter; schema, scenario construction, command support, reference reachability, and prerequisite cycles are contract-tested.

Work:

- introduce concept registry;
- introduce declarative scenario registry;
- introduce lesson schema v2;
- migrate Orientation + Local Snapshot Loop first;
- retain an adapter for old lessons during migration;
- add schema validation and prerequisite-cycle checks.

Exit criteria:

- a lesson author can change prose, objective, scenario, or assessment without editing the lesson engine.

Suggested release: **1.2.0**.

### Phase 2 — Semantic event/delta engine

**Status: implemented on 2026-08-12.** Teaching-backend commands emit typed derived repository events, the learning model consumes semantic deltas, and the evidence notebook exposes the entity-level event timeline. Same-count index and ref movement are regression-tested.

Work:

- define repository semantic events;
- emit events from simulator operations;
- build beginner and advanced delta projections;
- replace count-only learning explanations with event-backed explanations;
- add event timeline to the evidence notebook.

Exit criteria:

- moving a ref, changing staged content, or changing a file is observable even when object counts remain unchanged.

Suggested release: **1.3.0**.

### Phase 3 — Beginner Snapshot Course v2

**Status: implemented on 2026-08-12.** Orientation uses objective retrieval; Local Snapshots teaches path-specific staging, working vs staged diff, two linked commits, `log`, and `show`; Focused Snapshot Practice is an outcome-graded transfer lab with progressive hint fading.

Work:

- rebuild Stage 0–1 lessons with strict lesson anatomy;
- add `diff --staged` and `show` support as needed;
- teach selective staging before `git add .` convenience;
- add retrieval and transfer variants;
- replace self-report mastery with lightweight assessment evidence.

Exit criteria:

- a zero-Git learner can create a repository, explain working/index/history, make a focused commit, and prove what changed without copying every command.

Suggested release: **1.4.0**.

### Phase 4 — Branching + merge laboratory

**Status: implemented on 2026-08-12.** The course now separates branch/ref movement, fast-forward merge, true two-parent merge, conflict/abort/resolution, and rebase replay into distinct deterministic scenarios. Rebase and cherry-pick replay commit deltas rather than whole snapshots.

Work:

- branch pointer visualizations;
- explicit `switch -c` beginner path;
- detached HEAD as optional expansion;
- fast-forward, merge-commit, conflict, abort scenarios;
- goal-based branch challenges.

Exit criteria:

- learner can predict which pointer moves and distinguish fast-forward from two-parent merge.

Suggested release: **1.5.0**.

### Phase 5 — Recovery laboratory

**Status: implemented on 2026-08-12.** Restore/unstage, revert, soft/mixed/hard reset, stash, reflog, resettable failure scenarios, destructive-operation previews, and least-destructive recovery retrieval checks are in place.

Work:

- `restore`, `restore --staged`, `revert`, reset modes, stash, reflog;
- resettable failure scenarios;
- destructive-operation preview showing which entities will change;
- “least destructive appropriate recovery” assessments.

Exit criteria:

- recovery is taught as normal state reasoning rather than fear-based command warnings.

Suggested release: **1.6.0**.

### Phase 6 — Remote collaboration laboratory

**Status: implemented on 2026-08-12.** Remote lessons use an explicit local-vs-remote visualization, teach `origin/main` as local remote-tracking knowledge, create an explicit local tracking branch with `switch -c ... --track`, teach fetch before integration/pull, require explicit `push -u`, and include non-fast-forward rejection/integration/retry practice.

Work:

- explicit two-repository visualization;
- remote-tracking refs separated from remote branches;
- explicit tracking-branch setup;
- fetch before pull;
- push upstream semantics;
- rejected push and diverged remote scenarios;
- configurable pull strategy explanation.

Exit criteria:

- learner can explain where `origin/main` exists and what fetch changes before using pull/push recipes.

Suggested release: **1.7.0**.

### Phase 7 — Adaptive review and transfer

**Status: implemented on 2026-08-12.** Learning evidence is timestamped per concept and distinguishes guided success, retrieval, transfer, misses, and hint use; review intervals are concept-specific; review interleaves snapshot/pointer/recovery/remote reasoning; two outcome-graded capstones use different local and collaboration repository shapes.

Work:

- timestamped concept attempts;
- retrieval success/failure history;
- hint-use evidence;
- spaced review per concept;
- interleaved scenarios across prior concepts;
- multiple capstones with different repository shapes.

Exit criteria:

- recommendation is based on demonstrated concept evidence, not only lesson order/completion.

Suggested release: **1.8.0**.

### Phase 8 — Course UX consolidation

**Status: implemented on 2026-08-12 for the planned consolidation scope.** Course navigation defaults to now → next → later disclosure; mission modes distinguish guided/practice/recovery/challenge work; relevant state layers receive contextual emphasis; remote lessons show both repository copies; reduced-motion CSS is present; the commit graph has a screen-reader textual representation; representative snapshot, merge, recovery, remote, and capstone stages are browser-tested at 390 px.

Work:

- progressive course reveal;
- mission-centric first viewport;
- contextual state emphasis;
- learner mode / sandbox mode / recovery lab mode;
- reduced-motion graph transitions;
- accessible textual graph representation;
- mobile learner journeys for every major course stage.

Exit criteria:

- first-time learners can always answer: “What am I learning now?”, “What should I do next?”, and “What changed because I did it?”.

Suggested release: **1.9.0**.

### Phase 9 — 2.0 graduation

**Status: release-hardening candidate, deliberately not marked complete.** Curriculum correctness/reachability, active schema-v2 coverage, simulator support checks, desktop/mobile learner journeys, abstract Git internals, and reduced-motion handling are in place. Native-Git differential coverage now spans every assessed Git command family declared by the curriculum, and a contract test fails if a future assessed family lacks a native-reference bucket. The formal accessibility pass now includes axe-core scans of initial/course/active/populated/mobile states, real keyboard focus-order checks, keyboard-scrollable state/terminal regions, and manual browser accessibility-tree review; the evidence is recorded in `A11Y-AUDIT.md`. This workstation has no screen-reader executable installed, so a literal assistive-technology session remains the final accessibility gate before a 2.0 version/tag.

2.0 should mean the beginner course is coherent end-to-end, not merely feature-rich.

Release gates:

- curriculum correctness audit complete;
- all lessons use schema v2;
- all assessed commands supported and conformance-tested;
- all core concepts have retrieval + transfer evidence;
- no duplicate “advanced” command drill where a dedicated lesson exists;
- full beginner journey passes on desktop and mobile;
- accessibility audit: axe + keyboard + browser accessibility-tree review pass; literal screen-reader application pass remains pending;
- content includes a concise “Git internals, abstracted” final chapter connecting commits, trees, blobs, refs, HEAD, and index to the model used throughout the course.

Suggested release: **2.0.0**.

---

## 10. Priority command/concept coverage matrix

| Priority | Operation / concept | Beginner mechanism to teach | Required scenario evidence |
|---|---|---|---|
| P0 | `status` | observation/orientation | no state change |
| P0 | `diff` | working tree vs index/HEAD | content delta visible |
| P0 | `add <path>` | copy/select content into index | index entry changes |
| P0 | `diff --staged` | index vs HEAD | staged delta visible |
| P0 | `commit` | create immutable commit; move current branch | commit created + ref moved |
| P0 | `log`, `show` | inspect recorded objects/history | no state mutation |
| P0 | branch/switch | branch is movable ref; HEAD attachment | ref creation + HEAD change |
| P0 | merge | FF vs two-parent merge | correct topology |
| P0 | conflict lifecycle | merge can pause for human resolution | conflict start/resolve/finish |
| P1 | `restore` | restore working/index state | selected layer restored |
| P1 | `revert` | undo with new commit | inverse commit created |
| P1 | reset modes | move ref and optionally index/worktree | per-mode entity delta |
| P1 | stash | temporary uncommitted snapshot | stash + worktree transition |
| P1 | reflog | refs have movement history | recover reachable commit |
| P1 | `fetch` | update local knowledge of remote | remote-tracking ref moves only |
| P1 | tracking branch | local branch + upstream relationship | explicit config evidence |
| P1 | `push -u` | publish and configure upstream | remote branch + upstream state |
| P1 | pull | fetch + configured integration strategy | strategy shown explicitly |
| P2 | rebase | replay changes into replacement commits | old/new IDs compared |
| P2 | tag | stable name for commit | tag ref created |
| P2 | cherry-pick | replay one commit’s change | new commit with selected change |
| P3 | commit/tree/blob model | abstract object graph behind snapshots | optional internals projection |

---

## 11. Immediate next implementation slice

The fastest high-value path is not to redesign the entire UI first. Do this in order:

1. ~~**Fix progression integrity and known content/simulator mismatches.**~~ Done.
2. ~~**Introduce semantic event/delta types behind the current UI.**~~ Done.
3. ~~**Create scenario fixtures and lesson schema v2.**~~ Done.
4. ~~**Migrate only Orientation + Local Snapshot Loop.**~~ Done.
5. ~~**Build strict learner E2E tests for that vertical slice.**~~ Done.
6. ~~**Adjust the UI around that validated learning flow.**~~ Done.
7. ~~**Then migrate branching, recovery, remotes, and selective-history lessons.**~~ Done.
8. ~~**Pre-release hardening:** extend native-Git differential coverage across the entire assessed command contract and run automated axe + keyboard + accessibility-tree review.~~ Done.
9. **Final assistive-technology gate:** run one literal screen-reader session on a target desktop environment, then make an explicit 2.0 version/tag/release decision.

That produces an early, testable demonstration of the final educational architecture rather than a long infrastructure migration with no learner-visible proof.

---

## 12. Definition of “actually teaches Git”

The project should consider a beginner unit successful when the learner can do all of the following in a changed scenario:

```text
1. identify current repository state;
2. state a goal in terms of that state;
3. choose an operation family;
4. predict the entities/layers that will change;
5. execute a valid Git command;
6. recognize success or failure from evidence;
7. explain the causal state transition;
8. recover safely when the scenario is intentionally broken;
9. repeat the skill later with fewer hints;
10. transfer it to a repository shape they have not seen before.
```

If the learner can only reproduce the command shown in the lesson, the lesson is incomplete even if every UI step is green.
