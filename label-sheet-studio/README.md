# Label Sheet Studio

Local-first browser artifact for producing print-ready DIN A4 label sheets.

## Default stock profile

```text
Sheet:          210 x 297 mm (DIN A4 portrait)
Grid:           3 columns x 5 rows
Top margin:     21 mm
Bottom margin:  21 mm
Left/right:     0 mm
Gaps:           0 mm
Computed label: 70 x 51 mm
```

All margins and row/column gaps remain editable so the sheet can be calibrated against the physical stock.

## Features

- repeat text or one uploaded image across up to 15 labels
- start-position and copy-count controls for partially used sheets
- automatic text fitting whenever label geometry, padding, font, or content changes
- Helvetica, Times, Courier, and session-only custom TTF embedding
- contain, cover, and stretch image fitting with scale, rotation, and focal-position controls
- direct A4 PDF export through a vendored jsPDF build
- exact browser print stylesheet as a system-PDF fallback
- optional preview and PDF cut guides
- local persistence of non-file settings; images and fonts never leave the device

## Printing

Print at 100% / actual size and disable any fit-to-page option. Test the alignment on plain paper before using label stock.

## Third-party code

`vendor/jspdf.umd.min.js` is jsPDF 2.5.2. Its license is included as `vendor/jspdf-LICENSE.txt`.
