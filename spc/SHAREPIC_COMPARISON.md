# Sharepic Studio - Feature Comparison & Merge Plan

**Created:** 2026-05-04

## File Analysis

| File | Location | Lines | Status |
|------|----------|-------|--------|
| sharepic_studio.html | spc/ | 1,532 | Duplicate of procedural_sharepic_studio.html |
| procedural_sharepic_studio.html | spc/ | 3,548 | **SPC Pro Version** |
| procedural-sharepic-studio.html | root/ | ~2,800 | **Root Version** |

## Feature Comparison

### Themes

| Theme | Root | SPC Pro | Notes |
|-------|------|---------|-------|
| Neon Alley | ✅ | ✅ | Core theme |
| Arcade Cabinet | ✅ | ✅ | Phosphor green |
| Spray Can | ✅ | ✅ | Bold primaries |
| Pixel Sunset | ✅ | ✅ | Warm gradients |
| Vapor Trail | ✅ | ✅ | Pastels |
| Silver Screen | ✅ | ✅ | B&W |
| Moonlight | ✅ | ✅ | Cool greys |
| **Charcoal Sketch** | ✅ | ❌ | **Missing from SPC** |
| **Newsprint** | ✅ | ❌ | **Missing from SPC** |

**Winner:** Root (9 themes vs 7)

### Generators

Both have 14 generators:
- kaleidoscope, hardRects, flowField, pixelCity, sprayField, glitchArt, retroGrid, geometricTiles, goldLeaf, gritNoise, rawGrids, halftone, dotMatrix, circuitBoard

**Tie:** Same generators

### Parameters

| Parameter | Root | SPC Pro | Notes |
|-----------|------|---------|-------|
| complexity | ✅ | ✅ | Detail level (0-20) |
| density | ✅ | ✅ | Amount (0-20) |
| scale | ✅ | ✅ | Size (1-20) |
| **opacity** | ✅ | ❌ | **Missing from SPC** |
| **disruptFactor** | ✅ | ❌ | **Missing from SPC** |
| grain | ✅ | ✅ | Post-processing noise |
| **bgBrightness** | ✅ | ❌ | **Missing from SPC** |
| **contrast** | ✅ | ❌ | **Missing from SPC** |
| **saturation** | ✅ | ❌ | **Missing from SPC** |

**Winner:** Root (has 4 extra parameters)

### Content/Text Features

| Feature | Root | SPC Pro | Notes |
|---------|------|---------|-------|
| Text overlay | ✅ | ✅ | Both support text |
| Layout options | Limited | **Rich** | SPC has Markdown/LaTeX |
| Text positions | X/Y sliders | **Smart layouts** | SPC wins on UI |
| Rich text engine | ❌ | ✅ | Markdown + LaTeX math |

**Winner:** SPC Pro (superior text rendering)

### Frame Options

| Feature | Root | SPC Pro | Notes |
|---------|------|---------|-------|
| vignette | ✅ | ✅ | Darken edges |
| borderWidth | ✅ | ✅ | Border size |
| borderOpacity | ✅ | ✅ | Border transparency |
| **gradientBorder** | ✅ | ❌ | **Missing from SPC** |
| **innerGlow** | ✅ | ❌ | **Missing from SPC** |
| **darkOverlay** | ✅ | ❌ | **Missing from SPC** |
| borderColor2 | ✅ | ❌ | Gradient border color |

**Winner:** Root (more frame effects)

### Export Options

| Feature | Root | SPC Pro | Notes |
|---------|------|---------|-------|
| PNG export | ✅ | ✅ | Both support |
| **Export presets** | ✅ | ❌ | **Root has 6 platform presets** |
| Custom dimensions | ✅ | ✅ | Both support |

**Winner:** Root (convenience presets)

## Missing Sliders Analysis

### Root Version - Missing from UI (but in code):
- `opacity` - Global opacity multiplier (0-100)
- `disruptFactor` - Glitch displacement amount
- `bgBrightness` - Background brightness adjustment
- `contrast` - Contrast enhancement
- `saturation` - Saturation boost

### SPC Pro - Missing entirely:
- All 5 of the above parameters
- Extra themes (charcoalSketch, newsprint)
- Gradient border options
- Inner glow effect
- Dark overlay

## Merge Strategy

### Create: `sharepic-studio-ultimate.html`

**From Root:**
- 9 themes (add charcoalSketch, newsprint)
- 5 extra parameters (opacity, disruptFactor, bgBrightness, contrast, saturation)
- Enhanced frame options (gradientBorder, innerGlow, darkOverlay)
- Export presets for social platforms

**From SPC Pro:**
- Rich text engine with Markdown/LaTeX support
- Smart layout system (center-card, left-panel, right-panel, bottom-bar)
- Better UI organization with tabs
- Slider descriptions and tooltips

**New Features:**
- Parameter visibility toggles (hide advanced)
- Generator-specific parameter panels
- Undo/redo seed history
- Preset saving system
- Batch export

## Next Steps

1. ✅ Create comparison document
2. ✅ Create merged version (sharepic-studio-ultimate.html)
3. ✅ Add missing sliders to UI
4. ✅ Test all generators with new parameters
5. ✅ Enhanced frame options (gradientBorder, innerGlow, darkOverlay)
6. ✅ Export presets for social platforms (6 presets)

## Merge Complete - sharepic-studio-ultimate.html

**Status:** ✅ COMPLETE (2026-05-04)

**Features Verified:**
- 9 themes (added charcoalSketch, newsprint from root version)
- 14 generators with full opacity parameter support
- 6 new sliders in Adjust tab: Opacity, Disruption, Grain, BG Brightness, Contrast, Saturation
- Enhanced frame options: gradientBorder, innerGlow, darkOverlay
- 6 export presets: Instagram Post/Story, Twitter/X Post/Header, Facebook Post, Square 2048
- Rich text engine with Markdown/LaTeX support from SPC Pro
- Smart layout system (center-card, left-panel, right-panel, bottom-bar)
- Post-processing effects properly implemented

## LaTeX Math Support (Enhanced 2026-05-04)

**MathJax Integration:**
- Full LaTeX syntax support via MathJax 3
- Canvas-ready rendering for export
- Custom fallback renderer for offline use

**Supported LaTeX Features:**
- Fractions: `\frac{a}{b}`
- Superscripts: `x^{2}`
- Subscripts: `x_{i}`
- Square roots: `\sqrt{x}`
- Sums and integrals: `\sum_{i=0}^{n}`, `\int_{a}^{b}`
- Greek letters: `\alpha`, `\beta`, `\pi`, `\theta`, etc.
- Relations: `\leq`, `\geq`, `\neq`, `\approx`
- Binomial coefficients: `\binom{n}{k}`
- Limits: `\lim_{x \to \infty}`
- Logical symbols: `\forall`, `\exists`
- Matrices: `\begin{pmatrix} a & b \\ c & d \end{pmatrix}`
- And much more via MathJax

**Math Toolbar:**
- 20 quick-insert buttons for common symbols
- One-click insertion of templates
- Works with inline math (`$...$`) syntax

**Usage:**
```
Inline math: $E = mc^2$
Display math: $$\sum_{i=1}^{\infty} \frac{1}{i^2} = \frac{\pi^2}{6}$$
```
