# Case Study: Canvas as Audio Playlist / Media Graph

## Story

A host application receives a list of songs from a backend and wants to represent them as items on the canvas. The user can arrange songs spatially, group them, connect relations, inspect metadata, and trigger playback one after another.

## Desired user flow

1. Backend returns a playlist or graph of tracks.
2. Host maps tracks to `audio` canvas items with metadata: title, artist, duration, source URL, waveform/cover references.
3. Canvas renders audio cards or waveform blocks through an `audio` item plugin.
4. User arranges tracks, creates sequence relations, or selects a cluster.
5. Host provides an `AudioController` capability for play/pause/seek/preload.
6. Canvas emits playback commands such as `play-item`, `play-selection`, `play-sequence`.
7. Host executes audio playback and reports progress/presence state back to overlays.

## Requirements

- Plugin item type: `audio`.
- `CanvasDocumentItem.data` must support media metadata without core changes.
- Asset resolver for cover art, waveform data and audio source URLs.
- Host-owned `AudioController` capability.
- Command API for playback actions.
- Optional relations for playlist sequence and graph traversal.
- Stats API for total duration, missing files, duplicate sources, selected duration.
- Presence/progress overlays that are not persisted as document content.

## Critical notes

Canvas Studio should not become an audio engine. Browser autoplay policy, streaming, preloading, decoding and audio focus belong to the host. The canvas should render and manipulate media graph items and emit intentful commands.

## Example document item

```json
{
  "id": "track-001",
  "type": "audio",
  "frame": { "x": 120, "y": 80, "width": 320, "height": 88, "zIndex": 1 },
  "label": "Intro Track",
  "data": {
    "title": "Intro Track",
    "artist": "Example Artist",
    "durationMs": 182000,
    "sourceRef": "asset://tracks/intro.mp3",
    "coverRef": "asset://covers/intro.jpg"
  }
}
```

## Feasibility checklist

- [x] Initial document item schema with generic `data`.
- [x] Item plugin registry.
- [ ] Audio item renderer/editor plugin.
- [x] Host audio capability interface.
- [ ] Playback command/event API.
- [x] Initial relation helpers for graph traversal.
- [x] Playlist sequence traversal over `sequence-next` / `plays-after` relations.
- [x] Media-specific stats helpers.


## Current implementation notes

- Audio-like `CanvasDocumentItem` data can now be loaded into the runtime as a lossless unsupported placeholder.
- This is not a playable audio UI yet; it is the preservation boundary needed before adding an `audio` plugin and host-owned `AudioController`.
- The next feasible implementation step is an `audio` item plugin that can replace the fallback renderer for `originalType: "audio"` with an audio card renderer while keeping playback side effects outside the canvas core.
- `mediaStats(document)` now summarizes media item count, total duration, missing source refs and duplicated source refs.
- `playlistSequence(document, startId?)` now derives ordered playback candidates from `sequence-next` and `plays-after` relations.
