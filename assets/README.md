<!--
✒ Metadata
    - Title: Assets Guide (MONOLITH Edition - v1.0)
    - File Name: README.md
    - Relative Path: assets/README.md
    - Artifact Type: docs
    - Version: 1.1.0
    - Date: 11/07/2026
    - Update: Saturday, November 7, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (11/07/2026) [dendogg + Anthropic - Claude Opus 5.5] — Rows
      for the tall concept set Dennis is drawing for Inkscape and Blender:
      his castle-concept.svg, and the bishop, queen and king drawn at his
      request in its grammar, with the generator that seeded them. A
      convention says where those three stop being generated files.
    - 1.0.3 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      rows and commands name the brand files renamed at Dennis's request;
      the app bar draws the emblem as the wordmark's M; no logo is read.
    - 1.0.2 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      saved his own design ideas over loading-01-rising-columns.svg and
      works in it: the mock-ups' row names his file and the generated
      screen's new name beside it.
    - 1.0.1 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      page's app bar carries the logo now, as Dennis asked, so the logo's
      row and the build note name it; the game's sounds have their row,
      and the generators are checked on Python 3.10.
    - 1.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      version, written when Dennis landed on the Conical M, made its 4 x 4
      tiling the official logo and emblem, and had the assets folder
      cleaned up into a system: what lives where, what Dennis draws and
      what the generators write, and the one command that rebuilds it all.

✒ Description:
    The map of MONOLITH's assets folder: every file and folder, whether it
    is a hand-drawn source or a generated output, what reads it, and how to
    rebuild and check the generated ones.

✒ Key Features:
    - The layout of the folder, one row per file or folder
    - Sources and outputs kept apart: the sources are drawn by hand in
      Inkscape, the generators write everything else
    - The paths the app reads, which stay where they are
    - The build, relabel, render and audit commands
    - The tall concept set: which pieces are Dennis's drawings and which
      were seeded by a generator and then handed over

✒ Other Important Information:
    - Dependencies: Python 3.10+ with shapely, numpy, lxml, svgpathtools,
      and skia-pathops for build_piece_concepts.py; Pillow and playwright
      with Chromium to render the review images
    - The app's own code (index.html, js/, tools/) lives outside this
      folder and is not described here
---------
-->

# MONOLITH assets

Everything the project draws, models and renders lives here. The sources are
drawn by hand; the generators in `generator/` write everything else from
them, and nothing they write is edited by hand.

## Layout

| Path | Kind | What it is |
|---|---|---|
| `monolith-logo.svg` | generated | **The official logo**: the MONOLITH M tiled 4 × 4, slate tiles, black mortar, no pieces. The page does not read it: since 2.18.0 the app bar draws the emblem, below, as the M of its wordmark, and `tools/build-emblem.mjs` ignores a logo path given to it. |
| `monolith-emblem.svg` | generated | **The official emblem**: the same mark with the quartet of twelve pieces. The page's loading screen and the M of the app bar's wordmark are drawn from this file (`tools/build-emblem.mjs` writes it into `index.html` once, as a hidden drawing both use), so its path and id scheme stay put. |
| `chess-pieces.svg` | source | The house piece set on a full board. Every piece in every mark and mock-up is stamped from it verbatim; `tools/build-piece-set.mjs` builds the board diagrams' pieces from it. Shared with ChessWorkstation, whose copy holds the same drawing. |
| `castle-concept.svg` | source | Dennis's castle for the tall concept set, the stone-and-gold set drawn in Inkscape and carried into Blender: every face a gradient cell, one 10 px black outline compound running between them, a two-tier plinth with a glowing door. The other concept pieces are measured against it. |
| `bishop-concept.svg` | source | The tall set's bishop: a pen-nib mitre with a see-through slot over a gold-belted orb, a staff down a tapered body, on the castle's plinth at its scale and baseline. Seeded by `generator/build_piece_concepts.py` (see Conventions). |
| `queen-concept.svg` | source | The tall set's queen: a crowned head in a rayed halo over a wrapped robe whose pleats are fluted like the knight's pillar, on the castle's plinth. Seeded by `generator/build_piece_concepts.py`. |
| `king-concept.svg` | source | The tall set's king: a crenellated crown and spire in a barred halo over an art-deco block holding a ringed orb and a glowing channel down into the plinth's door. Seeded by `generator/build_piece_concepts.py`. |
| `graphics-meter-design-v1.2.svg` | source | The graphics-quality gauge for the Settings panel. |
| `brand/` | | The brand system. |
| `brand/MONOLITH_M_SYSTEM.md` | doc | The system: the letter's parameters and equations, the tiling, the skins, the layouts, the official marks. |
| `brand/monolith-brand-kit.svg` | source | The hand-built kit, the reference the system was measured from. |
| `brand/monolith-brand-kit-generated.svg` | generated | The kit rebuilt by the system, panel for panel. |
| `brand/variants/` | generated | The MONOLITH M at other densities and layouts, as `monolith-m-<n>-<layout>-<skin>.svg`: construction grids at 4, 8 and 16; bare at 8, 16 and 24; the ranks at 8; the scatter at 16. |
| `brand/review/` | rendered | PNGs of the marks, the variants and both kits. |
| `mockups/` | generated | Loading screens, hero, splash, the gauge widget and palette studies, all on the official marks; see `mockups/README.md`. One file there is a hand-made design file: `loading-01-rising-columns.svg`, which the build never writes; its generated screen is `loading-01-rising-columns-generated.svg`. |
| `mockups/review/` | rendered | PNGs of every mock-up and GIFs of the four loading screens. |
| `generator/` | code | Every generator, in one place (below). |
| `models/` | models | The pillar, monolith and piece models as .blend with their .glb exports; the page fetches the .glb files from here. See `models/MANIFEST.md`. |
| `audio/in-game-sounds/` | audio | The game's sound effects as .mp3: `knight-trumpet-victory-sound.mp3`, `notification-sound.mp3`, `squeky-signal-sound.mp3`. |
| `screenshots/` | images | Screenshots of the app. |

## The generators

| File | What it does |
|---|---|
| `generator/monolith_m.py` | The system: the letter, the tiling, the skins, the layouts. Writes the official logo and emblem, the variants and the generated kit. |
| `generator/build_mockups.py` | Writes every mock-up from the official marks, the meter and the piece set. |
| `generator/mono_assets.py` | The loader every generator reads through: the piece set, the meter, and `load_monolith_m()`, `load_logo()`, `load_emblem()` for the tiled M; the palettes. |
| `generator/mono_svg.py` | The SVG emitter: ids, groups, primitives, and the house header, title, namedview and metadata. |
| `generator/relabel_sources.py` | Gives every element of a hand-drawn source a descriptive id without touching a node; run it after an Inkscape pass on the kit or the meter. |
| `generator/render_review.py` | Renders the review PNGs and GIFs with headless Chromium. |
| `generator/audit_assets.py` | Checks every SVG, document and script in this folder: headers, titles, an id on every element, no generator defaults, live internal references, stock namedview, and no `assets/...` path that points at a missing file. |
| `generator/build_piece_concepts.py` | Draws the bishop, queen and king of the tall concept set in the castle's grammar (cells, a 10 px outline compound, the castle's plinth, Dennis's palette) and seeds their SVGs. It refuses to overwrite one that exists unless given `--force`, and it is not a `build_all.py` step. |
| `generator/build_all.py` | Runs the generators in order and then the audit. |

## Commands

```bash
python assets/generator/build_all.py                      # rebuild everything generated, then audit
python assets/generator/build_all.py --relabel --render   # after an Inkscape pass: relabel, rebuild, render, audit
python assets/generator/monolith_m.py --only official     # just the logo and the emblem
python assets/generator/audit_assets.py                   # check the folder
```

After a change to the emblem, run `node tools/build-emblem.mjs` from the
project root: it writes the emblem into `index.html` once, as a hidden
drawing that the loading screen and the app bar's wordmark both draw. The
logo is no longer read, so a change to it alone needs no build.

## Conventions

- Every file carries the house ✒ header; every SVG element carries a
  descriptive id, component-subcomponent-panel, panel suffix last.
- Pieces are named by their faces, as the page reads them: White is the
  boxwood-faced set. `chess-pieces.svg` names its sets the other way round
  (its own open question of which wood is White); the loader reads the
  face's wood, so nothing depends on that file's ids.
- The concept pieces are the one exception to the rule below:
  `build_piece_concepts.py` seeds `bishop-concept.svg`, `queen-concept.svg` and
  `king-concept.svg` once, and from then on they are Dennis's hand-drawn
  sources, worked in Inkscape like `castle-concept.svg`.
- A generated file is never edited by hand: change the generator or its
  parameters and rebuild.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->
