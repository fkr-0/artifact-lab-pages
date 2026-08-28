# Accessibility release audit

Date: 2026-08-13

This audit is the accessibility hardening record for the Git Recipe Book 2.0 candidate. It is intentionally narrower than an accessibility certification: automated checks and manual browser accessibility-tree/keyboard review are complete, while a literal screen-reader application session remains pending because no screen-reader executable is installed on the current workstation.

## Automated gate

The Playwright release suite includes `e2e/accessibility.spec.ts` using `@axe-core/playwright` 4.13.0.

Audited stable states:

- initial learning workspace;
- course map and active Orientation lesson;
- populated command/evidence workspace with a commit and textual graph;
- mobile course and evidence overlays at 390 × 844;
- primary keyboard focus order.

Release assertion: no axe violations with `critical` or `serious` impact in those audited stable states.

Current result:

```text
Accessibility release gate: 5/5 passed
Full Chromium suite:         34/34 passed
```

The axe scan waits for motion to settle before analysis so transient Framer Motion opacity frames are not mistaken for stable low-contrast content. Reduced-motion behavior is separately implemented through `prefers-reduced-motion` CSS.

## Findings corrected during the audit

1. Decorative course progress bars carried `aria-label` without an applicable semantic role. The visual bars are now `aria-hidden`; equivalent progress remains available as adjacent text (`completed / total`).
2. Locked lesson copy and terminal chrome did not consistently meet AA text contrast in the dark theme. Locked-card opacity and terminal colors were raised.
3. Command-risk badges used fixed semantic colors that were too weak against the dark evidence panel. Their foreground now mixes the semantic hue with the active theme foreground.
4. The horizontally scrollable five-layer state rail was not keyboard-focusable. It is now a named focusable scroll region.
5. The vertically scrollable terminal transcript had the same problem. It is now a named focusable scroll region.

Biome's `noNoninteractiveTabindex` rule is suppressed only at those two scroll containers because keyboard scrolling is the intended WCAG 2.1.1 behavior and is independently enforced by axe's `scrollable-region-focusable` rule.

## Manual keyboard review

Using the managed Chromium session through `abc`, sequential Tab navigation reached, in order, the main header controls, workspace navigation controls, lesson entry point, `Git state layers`, graph legend, and `Terminal transcript` before the command input.

At 390 × 844 the state rail reported horizontal overflow (`clientWidth 325`, `scrollWidth 822`) and retained focus while ArrowRight moved `scrollLeft`, confirming that the overflow is keyboard-operable rather than merely focusable.

## Browser accessibility-tree review

The semantic tree exposes named landmarks/regions for the learning workspace and, after a commit, a textual alternative to the visual graph. The populated graph included a list item of the form:

```text
<short hash>: Accessibility tree review. 0 parents. HEAD. Branches: main.
```

The terminal transcript is exposed by name, as are the state layers, evidence sections, navigation controls, retrieval answers, and command input.

## Remaining 2.0 gate

A literal desktop screen-reader session is still required before the roadmap calls the accessibility gate fully complete. No Orca/screen-reader executable is installed on the current workstation, and this audit does not substitute the browser accessibility tree for an actual assistive-technology interaction test.

Until that pass is completed, package-version, tag, and publication steps remain intentionally deferred.
