# GROOVE Scratch Project v1 — stable interchange contract

The authoritative interchange file is JSON, with `format: "groove-scratch-project"` and integer `version: 1`. It is meant to be edited by humans, browsers, bots and CLIs, not just saved by a specific UI build. The normative structural contract is `groove-scratch-project-v1.schema.json`; the CLI also applies stronger cross-field checks (ordering, timeline limits, bounds).

## Semantics

- `source.path` is a path **relative to the JSON file's directory**, or absolute. In the browser, export writes only the current audio filename; place it beside the JSON file when rendering. The browser never reads a filesystem path automatically: import/select the matching file in the local library first.
- `source.sha256` may be `null` or the lowercase hex digest. Non-null values are verified when rendering or with `validate --check-audio`; `--audio` can override the path, but not the digest.
- `selection.startSeconds` / `endSeconds` address the original audio file, not the timeline, in seconds; the selected range is a cyclic virtual record.
- `tempo.bpm` and `subdivisionsPerBeat` define grid subdivisions of a quarter-note beat. Version 1 fixes `beatsPerBar = 4`. One bar = 240/BPM seconds. `--snap` aligns rectangle start/end times to 60/BPM/subdivisionsPerBeat seconds.
- `timeline.durationSeconds` is the time axis for one performance pass. `timeline.loop` configures interactive browser playback; CLI `render --loops N` sets explicit WAV repetitions regardless of this flag.
- `automation.position` is a **piecewise-linear** time series, with `{ "t": seconds, "p": 0..1 }`. `p=0` maps to selection.startSeconds and `p=1` to its last sample. Downward slopes play backward. The sound is silent while the record is stationary, as in the worklet. Every nonempty envelope must cover `t=0` through timeline.durationSeconds.
- `automation.gain` is a **linear-amplitude**, piecewise-linear envelope of `{ "t": seconds, "v": 0..1 }`. `0` means cut, `1` means unattenuated (before optional DSP/output scaling). This is a **single-deck gate**, not a left/right two-deck crossfader.
- `patterns` stores generating rectangles (`kind`, timeStart/End, sampleStart/End, repeats) **for provenance only**. The exact sound is determined by the **baked** `automation` curves, not by replaying `patterns` again. Replacing these metadata entries cannot alter playback.
- `metadata.title` is a user label, not a source identity.
- All times are decimal seconds, independent of sample rate. A renderer chooses its sample rate and interpolation method. `t` values are strictly increasing within each lane. No duplicate or nonfinite coordinates are permitted.

## Compatibility guarantees

Version 1 keys and their meanings remain fixed. Additive or changing semantics require a future `version: 2`; unknown schema versions fail closed. The CLI `import-legacy` migrates browser exports tagged `groove-motion-v1` and `groove-motion-v2`, but the v1.4 browser continues to import those legacy files directly.

Project exports do **not** embed audio bytes. To render a portable project, place the source file adjacent to the JSON with its basename matching `source.path`, or use `render --audio /absolute/path/to/source`.

The Python WAV bounce approximates the browser worklet's 12-tap windowed-sinc resampling, playback-speed mute and loop-edge declick. It is deterministic for a given source, project and renderer, but is **not bit-identical** to live AudioWorklet output: different sample rates, browser decoders and motor-state/high-pass behavior can differ. CLI bounce only uses the explicit automation tracks, not live platter gestures or transport inertia.
