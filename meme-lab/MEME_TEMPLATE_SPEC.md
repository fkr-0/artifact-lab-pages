# Meme Lab experimental template spec

This document describes the experimental `meme-template` JSON contract consumed by `meme-lab.html`.

The goal is to let a launcher, URL, or saved JSON file predefine:

- canvas dimensions and export framing
- one or more image layers
- each image layer position, size, and crop transform
- one or more editable text fields
- an optional watermark policy

## Loading

Meme Lab supports three template loading paths:

1. Use the **Template** button and choose a JSON file.
2. Add a query parameter: `meme-lab.html?template=./data/meme-template.example.json`.
3. Embed JSON in the page with `<script type="application/json" id="meme-template">...</script>`.

## Root shape

```json
{
  "kind": "meme-template",
  "version": 1,
  "title": "Example",
  "canvas": {},
  "final": {},
  "watermark": {},
  "layers": []
}
```

## Canvas

```json
{
  "canvas": {
    "width": 1080,
    "height": 1080,
    "background": "#f8fafc",
    "transparent": false,
    "autoExpand": true,
    "allowNegative": true
  }
}
```

The loader also accepts `w`, `h`, `bg`, and `backgroundColor` aliases.

## Final export frame

```json
{
  "final": {
    "mode": "content-pad",
    "padding": 48,
    "border": 0,
    "borderColor": "#020617"
  }
}
```

Supported `mode` values:

- `canvas`: export the current canvas.
- `content`: crop export to layer bounds.
- `content-pad`: crop to layer bounds plus padding.

## Image layer

```json
{
  "type": "image",
  "id": "background",
  "name": "Background",
  "src": "./assets/background.png",
  "frame": { "x": 0, "y": 0, "width": 1080, "height": 1080 },
  "crop": { "x": 0, "y": 0, "zoom": 1 },
  "opacity": 1,
  "radius": 18,
  "shadow": true
}
```

Image `src` may be a same-origin path, a data URL, or a blob URL. Cross-origin images may render in the browser but can taint PNG export unless the remote server sends compatible CORS headers.

The loader also accepts `image`, `url`, or `href` as aliases for `src`; and `location`, `rect`, or `box` as aliases for `frame`.

## Text layer

```json
{
  "type": "text",
  "id": "caption",
  "text": "DOUBLE TAP TO EDIT",
  "frame": { "x": 96, "y": 80, "width": 888, "height": 180 },
  "fontSize": 72,
  "fontWeight": 900,
  "color": "#ffffff",
  "stroke": "#111827",
  "strokeWidth": 6,
  "textShadow": true,
  "align": "center",
  "background": "transparent",
  "opacity": 1,
  "radius": 12,
  "shadow": false
}
```

The loader also accepts `content` and `placeholder` as text aliases.

## Watermark

```json
{
  "watermark": {
    "enabled": true,
    "text": "window.location",
    "useLocation": true
  }
}
```

When `useLocation` is true and no explicit text is provided, Meme Lab uses `window.location.href`.

## Exporting a template

Use the **Save spec** button in Meme Lab to export the current composition as a reusable `meme-template` JSON file.
