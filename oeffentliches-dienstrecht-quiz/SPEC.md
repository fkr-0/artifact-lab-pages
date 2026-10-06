# Dienstrecht: Aktenlauf — v0.1 specification

## Product contract

A dependency-free, client-side German multiple-choice quiz for learning public-service law. The app works without accounts or backend services. Progress and aggregate statistics are stored only in browser `localStorage` under `oeffentliches-dienstrecht-quiz/state/v1`.

### Stage rules

- 19 sequential stages.
- Stage order follows the publicly visible section order of Wichmann/Langer, *Öffentliches Dienstrecht*, 8th ed. (2017), not copied prose.
- Each stage contains four newly written questions at difficulty levels 1, 2, 3, and 4.
- A stage fails immediately on the third wrong answer.
- A stage completes after all questions are answered with at most two errors.
- Completion is persisted and unlocks the next stage.
- Failed attempts and aggregate answer statistics are persisted too.

## Content map

1. Einführung
2. Rechtsquellen des Beamtenrechts
3. Grundbegriffe des Beamtenrechts
4. Das Beamtenverhältnis
5. Die Ernennung
6. Laufbahnrecht
7. Änderungen des funktionellen Amts sowie Behörden-/Körperschaftsumbildung
8. Rechtsstellung des Beamten
9. Folgen von Pflichtverletzungen
10. Beendigung des Beamtenverhältnisses
11. Beschwerdeweg und Rechtsschutz
12. Grundzüge des Besoldungsrechts
13. Grundlagen der Beamtenversorgung
14. Grundzüge des Disziplinarrechts
15. Einführung in das Arbeitsrecht
16. Rechtsquellen des Arbeitsrechts
17. Kollektives Arbeitsrecht (Tarifrecht)
18. Individualarbeitsrecht
19. Personalvertretungs- und Betriebsverfassungsrecht

## Question contract

Every question has exactly four options, one correct answer, a short explanation, at least one source link, and a difficulty level. Primary legal sources are preferred. The initial bank contains 76 questions.

The book provides the learning sequence and subject boundaries. Current law is taken from official federal sources where applicable. Examples intentionally include post-book developments such as the modern Bundesdisziplinargesetz procedure applying to proceedings initiated since 1 April 2024 and the whistleblower exception from the federal beamtenrechtlicher Dienstweg.

The app explicitly warns that state law and individual cases can differ and that it is not legal advice.

## Interaction contract

- Correct answer: positive visual stamp plus short ascending Web Audio cue.
- Wrong answer: shake/stamp plus descending Web Audio cue.
- Stage success: confetti plus compact fanfare.
- Stage failure: comic descending cue and retry path.
- Audio is user-toggleable and the setting is persisted.
- `prefers-reduced-motion` disables decorative motion.
- All answer choices and navigation controls are native keyboard-operable buttons.
- Feedback uses live regions; source links open with `noopener noreferrer`.

## Persistence schema

```text
{
  version: 1,
  completed: {
    <stage-id>: { completedAt, lastCompletedAt, bestCorrect, total }
  },
  stageStats: {
    <stage-id>: { attempts, failures, bestCorrect }
  },
  global: { answered, correct, wrong, currentStreak, bestStreak },
  audio: boolean
}
```

Storage failures fail soft: the quiz remains usable in-memory and visibly warns that persistence is unavailable.

## Source anchors

- Wichmann/Langer public table of contents: https://api.pageplace.de/preview/DT0400.9783555019116_A29666092/preview-9783555019116_A29666092.pdf
- Publisher record: https://shop.kohlhammer.de/offentliches-dienstrecht-1910.html
- Art. 33 GG: https://www.gesetze-im-internet.de/gg/art_33.html
- BeamtStG: https://www.gesetze-im-internet.de/beamtstg/
- BBG: https://www.gesetze-im-internet.de/bbg_2009/
- BBesG: https://www.gesetze-im-internet.de/bbesg/
- BeamtVG: https://www.gesetze-im-internet.de/beamtvg/
- BDG: https://www.gesetze-im-internet.de/bdg/
- TVG: https://www.gesetze-im-internet.de/tvg/
- TzBfG: https://www.gesetze-im-internet.de/tzbfg/
- BPersVG: https://www.gesetze-im-internet.de/bpersvg_2021/
