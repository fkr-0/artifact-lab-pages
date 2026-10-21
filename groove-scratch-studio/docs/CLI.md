# GROOVE offline CLI — agent contract

Requires Python 3.10+ and `numpy`. Standard PCM WAV files use Python’s built-in `wave` module. FLAC, MP3 and exotic WAV types additionally require either optional `soundfile` (`pip install -e .[codecs]`) or an installed `ffmpeg` binary. All processing and output remain local; no network, browser, server, telemetry or model API is involved.

Install from this directory: `python -m pip install -e .` — alternatively run `PYTHONPATH=. python -m groove_scratch ...`.

Commands always emit **one JSON object on stdout** for success (`ok:true`); failures use **one JSON object on stderr** (`ok:false`) with nonzero exit status 2. The `schema` command prints the complete JSON Schema rather than a wrapped response. `--help` is available for the top-level CLI and each command.

    groove-scratch patterns
    groove-scratch new --source ./samples/ah.wav --start 0.15 --end 0.95 --bpm 100 --bars 2 --title "Orbit practice" --output ./session.json
    groove-scratch apply --input ./session.json --kind orbit2 --time-start 0 --time-end 2.4 --sample-start 0.08 --sample-end 0.94 --repeats 4 --snap --output ./session-orbit.json
    groove-scratch validate --input ./session-orbit.json --check-audio
    groove-scratch inspect --input ./session-orbit.json
    groove-scratch render --input ./session-orbit.json --output ./scratch.wav --sample-rate 48000 --interpolation sinc --loops 2

**Speed and source-travel safety:** The X width specifies gesture duration; the Y height specifies how many seconds of the source are traversed. A tall rectangle repeated at 158 BPM can create 4–6× speed, and a 2 ms join can create a much larger short spike. A normal-speed baby scratch satisfies approximately `(sampleEnd-sampleStart) × selectedAudioSeconds / (gestureSeconds / repeats / 2) ≈ 1`. Use `apply --target-speed 1.0` to fit the source-position height downward to a desired maximum **stroke** speed. Every `apply`, `validate`, and `render` result now reports `maxPlaybackRate` (absolute multiplier) and `secondsAboveThreshold` (time >2×). Run `validate --max-speed 1.5` then `render --max-speed 1.5` to reject accidental pitch-ups including joins. Temporary overshoots may exist during a multi-pattern composition, so enforce the total limit **after** inserting the final adjacent pattern. The renderer will never silently time-stretch or pitch-correct the recorded scratch. Existing v1 JSON remains unchanged.

    groove-scratch apply --input step1.json --output step2.json --kind baby --repeats 8 --time-start 0 --time-end 3 --sample-start 0.10 --sample-end 0.90 --target-speed 1.0
    groove-scratch validate --input step2.json --max-speed 1.5 --check-audio
    groove-scratch render --input step2.json --output safe.wav --max-speed 1.5

**Optional shape parameters (CLI / live-browser parity):** `apply --flank 2.0 --stroke-bias 0.65 --click-width 1.8` shapes the exact same eight pattern types in either frontend. `--flank 1..3.5` concentrates each motion flank inside its time span, introducing short position holds and increasing the peak traversal speed. `--stroke-bias 0.25..0.75` allocates gesture time between forward and backward movement; `--click-width 0.5..2.5` controls the duration of fader closures. Values default to 1.0, 0.5, 1.0 (backward-compatible). Combine `--flank` with `--target-speed` to fit source travel safely. These settings are **generation inputs**, not extra JSON v1 keys: the generated position/gain nodes remain authoritative and all existing JSON projects stay valid.

Example:

    groove-scratch apply --input step1.json --output step2.json --kind orbit2 --time-start 0 --time-end 2 --sample-start 0.08 --sample-end 0.95 --repeats 4 --flank 2.0 --stroke-bias 0.65 --click-width 1.8 --target-speed 1.0

If `--bars` is omitted, `new` uses the selection duration as its timeline. Specify `--duration SECONDS` to set explicit performance length. `apply` **does not mutate its input**: a new JSON file is required, letting agents build a versioned chain of transformations with no hidden state. Repeated apply operations overwrite only the selected rectangles, preserving the remaining motion/fader trajectories. Use one input/output pair per operation. `--snap` quantizes time bounds, not the sample Y bounds.

For existing v1.3 files:

    groove-scratch import-legacy --input old-motion.json --source ./samples/ah.wav --output migrated-project.json

Structured agent workflow: (1) `patterns` discovery, (2) `new` from known source and interval, (3) one or more `apply` calls, (4) `validate --check-audio`, (5) `render`, (6) inspect the returned JSON's output path, duration, channels and sample peak. Fail closed on any nonzero exit status. Use unique output filenames. If no pattern exists yet, `new` creates a simple uniform forward ramp so even its first render is valid.

Unlike the browser, the CLI runs on the local host (it is **not** deployed as part of the website); the browser remains strictly client side. Filesystem paths appear only in local CLI output.
