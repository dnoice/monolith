<!--
✒ Metadata
    - Title: Mock-ups Guide (MONOLITH Edition - v2.0)
    - File Name: README.md
    - Relative Path: assets/mockups/README.md
    - Artifact Type: docs
    - Version: 2.0.1
    - Date: 10/26/2026
    - Update: Monday, October 26, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 2.0.1 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      saved his own design ideas over loading-01-rising-columns.svg and
      works in it now, so it is his design file: the generated screen is
      loading-01-rising-columns-generated.svg, and the build never writes
      his file's name.
    - 2.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Every
      mock-up rebuilt on the official 4 x 4 Conical M Dennis chose, the
      logo and the emblem; the generator moved to assets/generator with
      the rest of the MONOLITH code; the sections on the retired logo
      concepts and the tiled M are gone with them.
    - 1.1.0 (10/25/2026) [dendogg + Anthropic - Claude Fable 5.1] — The
      tiled M rebuilt on exact 30 px squares, on Dennis's direction.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      set: four loading screens, a hero, a splash, the graphics gauge and
      three palette studies.

✒ Description:
    What is in assets/mockups, how each screen is built from the official
    marks and Dennis's hand-drawn sources, and how to rebuild, audit and
    render the set.

✒ Key Features:
    - The screens, one row each, with the mark each is built on
    - The palettes, as roles, and how to add one
    - The commands that rebuild, audit and render them

✒ Other Important Information:
    - Dependencies: Python 3.10+, lxml, svgpathtools, numpy, shapely,
      Pillow, playwright with Chromium (render only)
    - Compatible platforms: any OS with CPython; the SVGs open in Inkscape
      1.4 and animate in Chromium, Firefox and WebKit
    - Every SVG here is generated (edit assets/generator/build_mockups.py,
      never the files) but one: loading-01-rising-columns.svg is Dennis's
      own design file, which the build never writes
---------
-->

# MONOLITH mock-ups

Screen mock-ups built on the official MONOLITH mark, the 4 × 4 Conical M:
the logo (`assets/monolith-logo.svg`, no pieces) and the emblem
(`assets/monolith-emblem.svg`, with its twelve pieces). Every tile is the
system's geometry and every piece is Dennis's path data from
`assets/chess-pieces.svg`, stamped with one composed matrix; nothing here
is redrawn. The generator is the source of truth: edit
`assets/generator/build_mockups.py`, not the SVGs, and port any Inkscape
hand pass back into it.

## The screens

| File | Built on | What it is |
|---|---|---|
| `loading-01-rising-columns-generated.svg` | emblem | The M's four columns rise out of the ground line at its feet like monoliths being raised, 0.16 s apart; the twelve pieces settle onto them; a rank of eight tiles fills as the bar. |
| `loading-02-tile-wave.svg` | logo | The twelve tiles arrive in a diagonal wave from the top-left corner, each scaling up from its centre with a slight overshoot; a hairline bar runs in the accent. |
| `loading-03-chase.svg` | logo | Indeterminate: a shimmer sweeps clockwise around the M's centre every 2.4 s; three dots walk after the status line. For an engine search or a network wait. |
| `loading-04-pieces-drop.svg` | emblem | The M is standing; the twelve pieces drop onto it from above, left to right, each landing with a soft overshoot. |
| `hero-01-mirror-floor.svg` | emblem | 1920 × 1080. The emblem on a mirror floor, its reflection fading into the ground; wordmark, rule, subtitle, two lines of copy, Play and Analyze. |
| `splash-01-emblem.svg` | emblem | 1600 × 1000. The emblem centred over the wordmark, tagline, hairline bar, status line and version chip. |
| `meter-01-graphics-gauge.svg` | the meter | The Settings panel with Dennis's gauge (`assets/graphics-meter-design-v1.2.svg`) drawn up as the widget: sectors filled, HIGH in the accent, his five pieces on the arc, the pawn on the needle hub. |
| `palette-study-01-logo.svg` | logo and emblem | Both marks in five palettes, with a swatch row each. |
| `palette-study-02-splash.svg` | emblem | The splash in the five palettes at 30 %, with a role key. |
| `palette-study-03-meter.svg` | the meter | The gauge widget in the five palettes. |

`loading-01-rising-columns.svg` is Dennis's own design file. On 10/26/2026 he saved his design
ideas over the generated screen and kept working in it, so the build writes loading-01 beside it as
`loading-01-rising-columns-generated.svg` and never touches his. The audit checks his file with the
rest, so it flags work in progress there (an Inkscape default id, a moved piece that animates) until
he settles it.

The loading screens animate with CSS inside a `<style>` in `defs`. The base
attributes of every animated element are its finished state, so Inkscape and
any static renderer show the loaded screen; a browser plays the entrance once
and holds. The mark's matrix sits on its group (`mark`), so every tile,
column and piece inside it is transform-free and its CSS animation never
fights the geometry.

## Palettes

A palette is a dict of roles in `assets/generator/mono_assets.py`
(`PALETTES`): `ground`, `ground-2`, `ink`, `ink-2`, `accent`, `tile-light`,
`tile-dark`, `mortar`, `white-face`, `white-contour`, `black-face`,
`black-contour`. The marks are read into roles, not colours, so a new
palette is one more dict. Sides are named by their faces, as the page reads
them: White is the boxwood-faced set.

The five on the sheets: Slate (as drawn: one slate, black mortar), Obsidian &
Gold (the app's dark chrome), Marble & Verdigris, Oxblood & Parchment,
Glacier (the analyze workspace's blue). Each keeps the system's idiom, one
tile colour with darker mortar, and changes only the colours.

## Commands

```bash
python assets/generator/build_mockups.py                        # every screen and study
python assets/generator/build_mockups.py --palette glacier      # the single screens in one palette
python assets/generator/build_mockups.py --all-palettes         # every single screen in every palette
python assets/generator/render_review.py --set mockups          # PNG stills and GIFs into mockups/review
python assets/generator/audit_assets.py                         # header, ids, references, links
```

`--all-palettes` writes each single screen once per palette, suffixed with
the palette's key (`splash-01-emblem-glacier.svg`). The review folder holds a
PNG of every SVG at its finished state and, for the four loading screens, a
GIF made by scrubbing the page's Web Animations clock frame by frame, so it
shows what the browser plays.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->
