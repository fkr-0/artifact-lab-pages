# GROOVE / Scratch Studio 1.3

An offline, **strictly client-side** turntable scratch simulator. No backend, cloud service, npm dependencies, CDNs, analytics, or third-party network requests are used.

## Launch

**Single-file option:** open `index.html` in a recent Firefox or Chromium browser.

**Recommended, especially when your browser restricts `file://` AudioWorklet or IndexedDB:** open a terminal in this folder and run:

    python3 -m http.server 8080 --bind 127.0.0.1

Then open `http://127.0.0.1:8080/` in your browser. This is **only a local static file server**: the app still performs all audio decoding, storage, DSP, UI and exports client-side. No external network connection is needed.

Use headphones or low volume when first scratching because fast movements can create loud transients.

## Workflow

1. **01 / Samples:** Upload MP3, WAV or FLAC (or choose **Generate Demo**), click the sample from the persistent library, drag its waveform to select an interval, and click **Preview**. Tick **Loop Preview** to repeat it. Drag the yellow edge handles to trim.
2. **Load Interval to Deck:** The chosen interval becomes the looping source on the turntable. It is never destructively cut from the stored file.
3. **02 / Turntable:** Play accelerates toward simulated 33⅓ rpm (1× speed); Pause brakes quickly; Motor Off coasts down with more inertia. Flip Reverse to change motor direction. Change horizontal/vertical orientation in the deck toolbar. **Click and drag** the yellow playhead on the waveform, or drag directly on the **vinyl platter**: up advances and down reverses the source. The platter sensitivity slider changes vinyl travel per mouse pixel (1× = one full 33⅓ RPM revolution per 360 vertical pixels). The circular waveform ring and position needle wrap across the clip boundary. Release it to resume the chosen motor mode.
4. **Record Movement:** Click Record, manipulate the playhead, and click Stop Recording. The app captures playback position over time, then simplifies the recorded trajectory into editable control points.
5. **03 / Motion Editor:** Inspect the bar-versus-source-position curve with a faint waveform texture on the source-position axis. Drag points, double-click to create points, Alt+click to delete. Use global Snap, select the beat and vertical grid subdivisions, or press Quantize Grid to quantize existing timestamps. Press Play Motion to reproduce the motion using the audio processing clock; enable Loop to repeat it.
6. **Crossfader lane:** The compact, aligned lane immediately below the motion graph sets audio gain from 100% (top) to 0% (bottom). Drag it to paint gain automation; **Reset 100%** and **Cut 0%** quickly set a flat envelope. The AudioWorklet uses this at audio-sample rate whenever **Play Motion** is running. It is not a two-deck left/right mixer, but a single-deck gate/volume control.
7. **Pattern drawing:** In the editor, choose **Tool → Baby, Forward, Chirp, Stab, 1-click Flare, 1-click Orbit, 2-click Flare, or 2-click Orbit**. Choose **Repeats** (1, 2, 4, 8), then drag a rectangle in the upper grid. Horizontal span specifies timing; vertical span specifies lowest/highest sample position. A live preview shows the gesture, then releasing the mouse inserts both motion and matching fader gates. Existing curves outside the rectangle remain in place. Revert to **Edit Nodes** to adjust the generated points individually.
**Live speed-aware pattern editing (browser patch):** When a scratch pattern tool is selected, the panel above the graph reports the estimated maximum **source playback-rate multiplier** (1.00× = unpitched normal speed), updated live while dragging its rectangle. The original requested peak and final peak after fitting are both displayed; red means the limit is exceeded, amber/cyan shows the fitted source travel, and a cyan dashed line marks the shortened Y travel inside the original rectangle. **AUTO FIT TRAVEL** is enabled by default at **MAX RATE 1.00×** and reduces sample travel (Y extent) to hold the desired stroke speed rather than time-stretching the audio. If an existing neighboring motion requires a too-fast transition outside the rectangle, insertion is blocked rather than silently adding a pitch spike; move the rectangle's Y start to meet the neighboring automation or extend the region. Disable Auto Fit to deliberately create fast/pitch-shifted scratch gestures. The existing v1 JSON project format is unchanged; baked curves always reproduce the chosen shape.

**Gesture parameters during rectangle drag:** Ordinary **mouse wheel = flank sharpness** (1.00× linear movement up to 3.50× sharply concentrated movement with short held positions); **Alt+wheel = forward/reverse balance** (25–75% of gesture time assigned to forward motion); **Shift+wheel = crossfader click/cut width** (0.50–2.50×, useful for chirps and flares, no effect on baby scratches); **Ctrl+wheel continues waveform zoom**. Each pattern type remembers its own shaping values in the browser's local workspace settings. The BPM grid still determines the rectangle's X coordinates, and the pattern's overall Y bounds are still defined by the drag. Editing sharpness raises instantaneous audio speed for a fixed Y span, so Auto Fit recomputes a safe Y span live.

8. **Tempo:** Set BPM (30–300) in the header. Optional Metronome is mixed into playback. A sixteenth-note grid overlays source and deck waveforms and the editor timeline; all follow BPM. The editor displays its length in bars, including fractional values for a source interval. Choose **1 / 2 / 4 bars**, or **Reset to Sample Length**. Recorded movements longer than the chosen length get a recorded-length view instead of truncating the take.
9. **Waveform zoom:** Hold **Ctrl** and scroll over the Samples waveform, Deck waveform, or Motion Editor to zoom (up to 32×). Hold **Shift** and scroll in Samples or Editor to pan the zoomed view. The Deck zoom follows the playhead.
10. **Share motion:** Use Export JSON / Import JSON for automation curves. Audio itself is kept in your browser and is not embedded into the JSON.

## Storage and privacy

- Imported audio `File` objects are stored in IndexedDB in the browser at the current origin, along with the last selection and per-track motion curves.
- If the browser is in private mode or configured to deny storage, permanent library storage will not work.
- Browser origin matters: opening `file://`, `http://localhost:8080` and `http://127.0.0.1:8080` can create separate stores. Stick to one origin when using the library.
- Browsers can evict IndexedDB data under storage pressure; retain original audio files and export motion JSON for backups.
- Imported files are limited to 500 MB each in the UI, but large decoded files still require substantial RAM. The app only decodes the selected library file in memory.
- No network APIs are used by the app. There are no service workers or background sync.

## Browser audio considerations

- Uses `decodeAudioData` to decode MP3, WAV and FLAC. **Codec availability depends on the browser**; modern Firefox/Chromium typically support these formats, but unusual FLAC variants may fail. Failures are reported in the UI.
- Uses `AudioWorklet` with sample-by-sample bidirectional PCM playback, rate-dependent windowed-sinc interpolation, acceleration/braking envelopes and DC suppression during stationary scratching.
- Simulated 33⅓-rpm behavior is an **approximation**, not a calibrated model of a particular brand/model of turntable, cartridge, motor or analog vinyl chain. Audio fidelity and maximum scratch speed depend on the browser CPU and output latency.
- Graph automation is interpolated piecewise linearly between position knots with loop-edge declick fades; it does not simulate needle skips or physical record flex. The crossfader lane and pattern tool do implement amplitude cuts at audio-sample rate.
- Recorded gestures are captured at UI/AudioWorklet message update frequency, then simplified; they are not sampled directly at the 48 kHz pointer/input hardware level. Automated replay is evaluated at audio sample rate.

## Controls reference

| Action | Control |
|---|---|
| Import music | Drag/drop a `.mp3`, `.wav` or `.flac` onto the Samples pane |
| Preview selected loop | Preview button + Loop Preview checkbox |
| Change trim | Drag selection or drag yellow endpoint |
| Scratch | Drag yellow playhead along deck waveform |
| Reverse | Reverse toggle |
| Record | Record Movement → manipulate waveform → Stop Recording |
| Edit curve | Drag point / double-click add / Alt+click remove |
| Snap | Header Snap 1/16 + graph subdivision controls |
| Quantize | Quantize Grid button |
| Play edited scratch | Play Motion, optionally Loop |
| Save/share a motion curve | Export JSON or Import JSON |
| Fast keyboard playback | Space on Deck to play/pause when not focused on a button/input |

## Tests

Audio processor DSP smoke test, requiring only Node.js:

    node tests/dsp-smoke-test.js

The test does not need an audio output device or a browser. It validates motor acceleration/braking, pointer scratching and sample-clock automation on synthetic PCM buffers.

The user interface was separately smoke-tested with a browser mock harness. This test environment prevented full browser navigation and therefore **live end-to-end output through a real AudioWorklet to physical audio hardware has not been verified here**.

## Artifact layout

    turntable-scratch-studio/
    ├── index.html                  # Entire standalone client-side webapp
    ├── README.md                   # Workflow, compatibility and limitations
    └── tests/
        └── dsp-smoke-test.js       # Offline engine regression test

## Scratch mapping and cyclic boundary

- Motion maps vertical mouse travel to turntable rotation: 360 px = 1 revolution at 1× sensitivity; one revolution at 33⅓ rpm is 1.8 seconds of sample time. Upward travel moves forwards, downward moves backwards.
- Sample position is modulo the clip length, so the ring playhead wraps seamlessly. The AudioWorklet uses the shortest wrapped position error while following drag coordinates; unusually large pointer jumps in one event may follow that shorter path.
- The waveform ring is a circular overview of the entire selected interval; its ring does not zoom, but the three waveform timelines do.

## Testing

The Artifact Lab registration includes `tests/groove-scratch-studio.test.mjs` with offline engine tests. Run `node --test tests/groove-scratch-studio.test.mjs` from the root of Artifact Lab. Browser UI exercised separately with a mocked browser-storage/audio harness where the sandbox disallows localhost browser navigation.

## Rectangle-to-pattern mapping (v1.3)

- The **X bounds** are the start and end of the gesture in the selected BPM grid, with optional snapping.
- The **Y bounds** are the sample-position range, not volume. Low = earlier in the selected sample; high = later.
- Pattern grammar fills these bounds with source-position vertices and separately synchronised **volume gates**. One-click flares have one brief gate closure in an audible stroke; two-click flares have two. An *orbit* mirrors the cuts on both forward and backward strokes.
- **Baby:** audible forward/back, open fader. **Forward:** audible forward, silent reverse. **Chirp:** cut across the turning point. **Stab:** accented short forward only.
- **1-click and 2-click Flare:** forward stroke with 1 or 2 quick crossfader cuts, return muted. **1-click and 2-click Orbit:** the same number of cuts on both directions. These are parameterised interpretations; physical hand motions and turntablist naming conventions vary.
- The rectangle is sufficient for basic *parameterised* variants. It does not encode acceleration, groove/swing, peak velocity or asymmetrical click placements. Future controls can add those without changing the drag interaction.
- A generated segment replaces only the selected time range in both tracks. Short ramps return to the previously drawn curves outside the insertion interval. Undo/redo history is not yet provided: **Export JSON** before heavy edits.

## Validation

`node --test groove-scratch-studio.test.mjs` runs standalone no-network syntax, waveform controls, scratch-direction, pattern-shape and fader-audio regression tests. Browser-based interaction was exercised with a local isolated UI harness; browser security policy in the evaluation environment blocked loading the local host directly, so real in-browser AudioWorklet E2E must still be confirmed on the target device.

## v1.4 — stable JSON project format & offline WAV CLI

The editor exports and imports **GROOVE Scratch Project v1** JSON (not the old `groove-motion-v2` structure). Existing legacy v1/v2 motion files can still be imported and re-exported. Audio remains in the local browser library; JSON references it by filename.

The optional **Python CLI**, which runs on your own machine without any web service, supports:

- `new`: create a parameter-driven project JSON from a local sample and interval.
- `apply`: use one of the eight pattern types to bake motion plus crossfader trajectories into a rectangle; optional BPM grid snapping. Chain multiple calls without rewriting inputs.
- `validate`, `inspect`, `schema`, `patterns`: structured, machine-readable agent operations.
- `render`: deterministic offline WAV from JSON automation at a chosen sample rate and repeat count (linear or windowed-sinc interpolation).
- `import-legacy`: convert old browser `groove-motion-v1/v2` exports to versioned project JSON.

See [Stable JSON format](docs/PROJECT_FORMAT.md), [CLI usage and agent contract](docs/CLI.md), and the bundled [JSON Schema](docs/groove-scratch-project-v1.schema.json). CLI WAV playback is a DSP approximation of the browser worklet, not a motor/analog simulation or bit-exact copy.