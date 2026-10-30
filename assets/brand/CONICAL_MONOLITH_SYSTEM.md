<!--
✒ Metadata
    - Title: Conical Monolith System (MONOLITH Edition - v1.2)
    - File Name: CONICAL_MONOLITH_SYSTEM.md
    - Relative Path: assets/brand/CONICAL_MONOLITH_SYSTEM.md
    - Artifact Type: docs
    - Version: 1.2.0
    - Date: 10/26/2026
    - Update: Monday, October 26, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      ruled that a construction grid is a template, not drawing: the
      construction section now draws its lines as invisible guide paths
      over the outline, after his grid-template-invisible-line-elements.svg,
      and says where the filled-rect rule for visible rules stops.
    - 1.1.1 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      page's app bar carries the logo now, as Dennis asked: the section
      on the official marks names it and the group the build reads.
    - 1.1.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      made the 4 x 4 Conical M the official mark: a section on the logo and
      the emblem, the files they live in and the page's emblem build that
      reads the emblem. The layouts are now his placements measured from
      the kit (centre, size, rotation and mirroring per piece; the
      scatter's kings on 3 x 3 plinths) and the placement equation centres
      a piece by its bounding box, as he does. Sides are named by faces.
      The generator moved to assets/generator; paths, commands and the
      verification numbers follow.
    - 1.0.0 (10/26/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      write-up of the system Dennis landed on in
      conical-monolith-brand-kit.svg: the letter measured from his outline
      and written as parameters and equations, the tiling rule, the skins,
      his three piece layouts as tables, and the generator that builds
      every variant from them.

✒ Description:
    The MONOLITH brand mark as a system rather than a pile of files: one
    letter (the Conical M), defined by a dozen numbers; one tiling rule
    that lays any grid over it; a few skins; the piece layouts Dennis
    composed; and the two official marks cut from it. Everything in
    assets/brand/variants, the generated kit, assets/monolith-logo.svg and
    assets/monolith-emblem.svg comes out of assets/generator/conical_m.py
    from what is written here.

✒ Key Features:
    - The letter: every parameter with its value, and the construction
      in order around the outline
    - The equations: fillets, the cubic flanks, the tiling, parity,
      plinths, piece placement
    - The three layouts as tables of his placements, in cells
    - The official logo and emblem, and what reads them
    - How to make a new variant, a new skin, a new layout or a new letter
    - How the system was verified against the hand-built kit

✒ Other Important Information:
    - Dependencies: Python 3.10+, shapely, numpy, lxml, svgpathtools; the
      code is assets/generator/conical_m.py with mono_svg.py and
      mono_assets.py beside it
    - Reference: brand/conical-monolith-brand-kit.svg is Dennis's
      hand-built kit; brand/conical-monolith-brand-kit-generated.svg
      reproduces it panel for panel
---------
-->

# The Conical Monolith system

One letter, one rule, a few skins, three layouts, two official marks. The
letter is the Conical M: a square-cornered M whose valley is a smooth dip
rather than a V and whose crossbar carries a small tab underneath, the
notch. It is defined by the numbers in §1 and nothing else. A grid of *n* ×
*n* cells laid over the square becomes the tiled M by the rule in §3: every
cell the letter covers is a tile, whole or cut. Pieces from
`assets/chess-pieces.svg` stand on the tiles in the layouts of §5. The 4 × 4
tiling is the official logo, and the same tiling with the quartet of twelve
pieces is the official emblem (§6). `assets/generator/conical_m.py` is the
whole system as code; every file it writes is its output and is never
edited by hand.

Lengths below are in **units of a 1200 × 1200 canvas**, the kit's panel
size. Scaling the canvas scales every length together (`MParams.scaled(S)`),
so a 240 px favicon and a 4800 px poster are the same letter.

## 1. The letter

The outline is drawn clockwise on screen (y down), starting on the left
leg's outer edge just below the top corner. Measured from the outline in
`brand/conical-monolith-brand-kit.svg` (the 8-grid panel's
`outline-8-grid`); the parametric outline differs from the drawn one by 0.12
% of its area, 5.3 units at the widest, which is the drawing's own
left/right asymmetry in the valley flanks.

| Parameter | Value | What it is |
|---|---|---|
| `S` | 1200 | canvas side; the letter fills it edge to edge |
| `leg` | 300 = S/4 | width of each leg |
| `r_corner` | 26.239 | radius at the six convex corners on the perimeter: the four outer corners and the two inner feet |
| `valley_floor_y` | 146.43 | depth of the valley's flat floor below the top edge |
| `valley_floor_w` | 185.39 | width of that floor, centred on S/2 |
| `valley_handle_top` | 59.35 | the flank cubic's handle at the top edge |
| `valley_handle_floor` | 72.39 | the flank cubic's handle at the floor |
| `bar_y` | 509.68 | the crossbar's underside |
| `r_bar` | 25.41 | fillet where the underside meets a leg's inner edge |
| `notch_y` | 600 = S/2 | bottom of the notch |
| `notch_floor_w` | 52.72 | width of the notch's flat bottom, centred |
| `notch_flank_w` | 94.48 | width of each S-curve flank of the notch |

Two derived points matter:

```math
x_v = \text{leg} - r_\text{corner} = 273.76
```

is where each valley flank leaves the top edge — the flank starts exactly
where the top edge would otherwise run on from the corner arc — and

```math
x_f = \tfrac{S}{2} \pm \tfrac{\text{valley\_floor\_w}}{2} = 507.14,\ 692.86
```

are the two ends of the valley floor.

### Construction, in order

1. **Top-left corner**: fillet of `r_corner` between the left edge and the top edge.
2. **Left valley flank**: from `(x_v, 0)` to `(x_f, valley_floor_y)` as one cubic Bézier with horizontal tangents at both ends (§2.2).
3. **Valley floor**: a line to the right end of the floor.
4. **Right valley flank**: the mirror cubic up to `(S − x_v, 0)`.
5. **Top-right, bottom-right corners**: fillets of `r_corner`.
6. **Right leg's inner foot** at `(S − leg, S)`: fillet of `r_corner` (convex).
7. **Crossbar meets the right leg** at `(S − leg, bar_y)`: fillet of `r_bar` (concave).
8. **Notch**: along the underside to the right flank, an S-curve down to the notch floor at `notch_y`, across the floor, the mirror S-curve back up (§2.3).
9. **Crossbar meets the left leg** at `(leg, bar_y)`: fillet of `r_bar`.
10. **Left leg's inner foot**, **bottom-left corner**: fillets of `r_corner`. Close.

The outline has no stroke of its own; the tiles compose it. `Outline.path_d`
is the exact path (lines, arcs, cubics), drawn on the construction panels,
and `Outline.polygon` is the same curve sampled for the tiling.

## 2. The equations

### 2.1 Fillets

A fillet of radius *r* replaces a corner **C** between the lines **C→A** and
**C→B**. With unit vectors **u** toward A and **v** toward B and the interior
angle

```math
\theta = \arccos(\mathbf{u}\cdot\mathbf{v}),
```

the tangent length along each line and the arc's centre are

```math
t = \frac{r}{\tan(\theta/2)}, \qquad
\mathbf{O} = \mathbf{C} + \frac{\mathbf{u}+\mathbf{v}}{\lVert\mathbf{u}+\mathbf{v}\rVert}\cdot\frac{r}{\sin(\theta/2)} .
```

The path runs to **C** + *t***u**, arcs about **O** to **C** + *t***v**, and
continues. For a right angle *t* = *r*. On a clockwise outline a convex
corner takes SVG sweep flag 1, a concave one (the two crossbar corners) 0.

### 2.2 The valley flank

Each flank is a single cubic from **A** = (x_v, 0) to **B** = (x_f, valley_floor_y)
whose control points sit on the horizontals through **A** and **B**:

```math
\mathbf{P}_1 = \mathbf{A} + (h_t, 0), \qquad \mathbf{P}_2 = \mathbf{B} - (h_f, 0), \qquad
\mathbf{F}(t) = (1-t)^3\mathbf{A} + 3(1-t)^2 t\,\mathbf{P}_1 + 3(1-t)t^2\,\mathbf{P}_2 + t^3\mathbf{B}.
```

Horizontal tangents at both ends are what make the dip conical: it leaves
the top edge flat, steepens, and lands on the floor flat. A least-squares
fit of this form to Dennis's drawn flank (which he built from three cubic
segments) gives *h_t* = 59.35 and *h_f* = 72.39 with a maximum error of 1.66
units; a fit with free control points converges to the same horizontal
handles, so the form is his, not an approximation of it.

### 2.3 The notch

The notch is the same construction with equal handles. Each flank runs from
the underside at `(S/2 ∓ (notch_floor_w/2 + notch_flank_w), bar_y)` to the
floor at `(S/2 ∓ notch_floor_w/2, notch_y)` with both handles equal to half
the flank width:

```math
h = \tfrac{\text{notch\_flank\_w}}{2} = 47.24 ,
```

which is the symmetric smoothstep cubic. The notch bottom sits at exactly
S/2, the one landmark the letter shares with the canvas's centre line.

## 3. The tiling

Given a grid density *n*, the cell side is

```math
c = \frac{S}{n}, \qquad \text{cell}(r, k) = [kc,\ (k+1)c] \times [rc,\ (r+1)c],
```

rows *r* and columns *k* counted from the top left, 0-based in code and
1-based, zero-padded, in the ids. Every cell is intersected with the
letter's polygon *M*:

```math
T_{r,k} = \text{cell}(r,k) \cap M, \qquad
\begin{cases}
\text{whole tile (a rect)} & \text{if } |T_{r,k}| = c^2 \\
\text{cut tile (a path)} & \text{if } \varepsilon < |T_{r,k}| < c^2 \\
\text{no tile} & \text{if } |T_{r,k}| \le \varepsilon
\end{cases}
\qquad \varepsilon = 0.5\left(\tfrac{S}{1200}\right)^2 .
```

The floor ε drops the slivers a curve leaves in a corner cell. A cut tile is
the exact intersection, written as a path; its nodes are the cell's corners
plus the samples of the outline across it (32 per arc or cubic, so a 32-cell
grid still has no visible facet). Because the tiles are computed from the
letter and not the letter from the tiles, the tiling closes exactly: the
union of the tiles equals *M* to numerical noise, and no tile ever sits off
its pitch. This is the property the hand-tiled files lacked.

**Parity.** A tile is *light* when *r* + *k* is even, *dark* otherwise, so
the top-left cell is light and the pattern is a chessboard whenever a skin
gives light and dark different colours.

**Plinths.** A layout may ask for a block of 2 × 2 or 3 × 3 cells at
(column, row) to be one tile, the plinth a piece stands on. The block is
intersected with *M* like a cell and claims its cells. Plinth ids are
`plinth-rNN-cNN-…`, named for the block's top-left cell.

**Mortar.** Tiles carry a stroke of width *S*/1200 (1 px at the kit's size)
in the skin's mortar colour, with `paint-order: markers fill stroke`, so the
mortar sits on top of the fills and reads as the grout between tiles, as
Dennis drew it.

**Construction.** The `grid` layout draws no tiles: the outline filled with
the dark tile colour, and over it the full grid as guide lines, `n + 1` each
way with the frame's own edges included. Each is an open path from edge to
edge of the square (`M x,0 V S`, `M 0,y H S`) with no fill, no stroke and no
width, in the style of Dennis's own template,
`grid-template-invisible-line-elements.svg` (`GUIDE_STYLE` in the
generator). A construction grid is a template, not drawing (Dennis,
10/26/2026): its lines paint no pixels, still select and snap in Inkscape
and show in its outline view, and add nothing to the grid's bounding box
beyond the square itself, where lines of any thickness would add half their
width on every side. Visible rules on a plate are still drawn as filled
rects; the guide style is for lines that are there to be snapped to, not
seen.

## 4. Skins

A skin is a dict of roles to colours. Three ship:

| Skin | tile-light | tile-dark | dark, right leg | mortar | Note |
|---|---|---|---|---|---|
| `slate` | #6f8a91 | #6f8a91 | #6f8a91 | #000000 | the kit and the official marks: one slate, black grout; the grid is the only texture |
| `checker` | #e6e6e6 | #6f8a91 | #6f8a91 | #000000 | a chessboard, light where *r* + *k* is even |
| `legs` | #e6e6e6 | #6f8a91 | #000000 | #000000 | the first concept: the right leg's dark tiles are black, so the two legs are the two sides |

Piece colours ride along in the same dict. **Sides are named by their
faces, as the page reads them:** White is boxwood-faced (`white-face`
#decd87, `white-contour` #1a1a1a), Black is ebony-faced (`black-face`
#1a1a1a, `black-contour` #decd87). `chess-pieces.svg` names its sets the
other way round (its open question of which wood is White); the loader
reads the face's wood, so the system never depends on that file's ids.

## 5. Layouts

A layout is a list of placements, each `(side, kind, cx, cy, size, rot,
mirror, plinth)`: the centre of the piece's bounding box and the piece's
size in **cells**, a rotation, a left-to-right mirror, and an optional
plinth `(col, row, span)`. A piece is stamped from its 153.79-unit square in
`chess-pieces.svg` by

```math
\mathbf{M}_\text{piece} = T(c_x c,\ c_y c)\ R(\rho)\ S(\pm s, s)\ T(-\mathbf{b}),
\qquad s = \frac{\text{size}\cdot c}{q},\ q = 153.79,
```

read right to left: move the centre **b** of the piece's own bounding box to
the origin, scale it (negative *x* mirrors it), rotate it, place it. The
three layouts are Dennis's placements, measured from his kit; the tables in
`conical_m.py` carry them to four decimals, which reproduces his panels to
0.02 units.

**Quartet** (n = 4, the emblem): twelve pieces upright, one of each kind per
side, size 0.6596 c (the pawns 0.6395 c, 3 % smaller, as drawn); centred on
their cells at *y* = row + 0.4961, except the pawns, which sit in the part
of their tile the valley leaves (1.2993 and 2.7214, 0.6415), and the kings,
which sit in the part of theirs above the crossbar (1.5 and 2.5, 1.3442).
The three White pieces marked † are mirrored.

| row \ col | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| 0 | White R | Black P | White P | Black R |
| 1 | Black Q | White K † | Black K | White Q † |
| 2 | White B † | — | — | Black B |
| 3 | Black N | — | — | White N |

**Ranks** (n = 8): the two armies lying along the legs, rotated −90°, size
0.8878 c. White's back rank runs down column 0, R N B K Q B N R, its pawns
down column 1; Black's pawns run down column 6 and its back rank down column
7. Each piece sits on its own square's centre, so a piece's bounding-box
centre moves off the cell centre by its own height (0.5616 c for a rook,
0.5 c for a king); the tables keep his small nudges to the pawns' column.
The valley and the crossbar stay bare.

**Scatter** (n = 16): sixteen pieces on 2 × 2 plinths in a zigzag two cells
wide down each leg, size 1.7756 c, and the two kings on 3 × 3 plinths in
the bridge, size 2.6383 c, facing each other (White's mirrored).

| Left leg: piece, plinth (col, row) | Right leg: piece, plinth (col, row) |
|---|---|
| Black R (0, 0) | White R (14, 0) |
| Black N (2, 2) | White N (12, 2) |
| Black B (0, 4) | White B (14, 4) |
| Black P (2, 6) | White Q (12, 6) |
| Black Q (0, 8) | White P (14, 8) |
| White B (2, 10) | Black B (12, 10) |
| White N (0, 12) | Black N (14, 12) |
| White R (2, 14) | Black R (12, 14) |

Kings: White K on (5, 3) span 3, Black K on (8, 3) span 3.

## 6. The official marks

The 4 × 4 Conical M is the MONOLITH mark, chosen by Dennis on 10/26/2026.

| File | What it is | Built as |
|---|---|---|
| `assets/monolith-logo.svg` | the logo: the 4 × 4 tiling, no pieces | `build_mark(4, "bare")`, slate skin, 1200 px |
| `assets/monolith-emblem.svg` | the emblem: the same tiling with the quartet | `build_mark(4, "quartet")`, slate skin, 1200 px |

The emblem keeps the path and the id scheme of the emblem it replaced,
because the page's loading screen is built from it (`tools/build-emblem.mjs`
copies it into `index.html`): `emblem-monolith` > `board-emblem` >
`board-row-NN-emblem` > `square-rNN-cNN-emblem`, and `pieces-emblem` >
`pieces-white-emblem` > `piece-white-king-emblem` > its `-contour-emblem`
and `-face-emblem` paths. The logo is the same under `logo-monolith` with
the suffix `-logo`, and the page's app bar is built from it by the same tool,
which reads its `board-logo` group. Keep both files' paths and these groups;
after either mark changes, run `node tools/build-emblem.mjs` from the project
root.

Every mock-up in `assets/mockups` is built on these two marks, through
`mono_assets.load_logo()` and `load_emblem()`, which call the same
`build_mark()` that writes the files.

## 7. Making things

```bash
python assets/generator/conical_m.py                     # the two marks, the variants, the generated kit
python assets/generator/conical_m.py --only official     # just the logo and the emblem
python assets/generator/conical_m.py --only 8-ranks      # one variant
python assets/generator/conical_m.py --skin checker      # the variants in another skin
python assets/generator/conical_m.py --size 240          # at another canvas size
```

From Python, with `assets/generator` on the path:

```python
from dataclasses import replace
from conical_m import CONICAL, build_mark, render_variant, render_official, SKINS, LAYOUTS
from mono_assets import load_conical

mark = build_mark(12, "bare", CONICAL.scaled(600))          # outline, tiles, pieces
name, svg_text = render_variant(12, "bare", "legs", 600)    # a finished file
drawing = load_conical(4, "quartet")                        # tiles and pieces as stampable elements
```

- **A new density** is a number: `build_mark(32, "bare")`. Nothing else
  changes.
- **A new skin** is a dict in `SKINS` with the tile, mortar and piece roles.
- **A new layout** is a list of `P(...)` placements registered in `LAYOUTS`
  with the density it was composed for.
- **A different letter** is a new `MParams`: `replace(CONICAL,
  valley_floor_y=200)` deepens the valley; `leg=240` thins the legs; every
  mark, variant and mock-up follows, because the tiles are computed from the
  letter.

Ids follow the house pattern with the panel suffix last, `-<n>-<layout>` on
a variant: `board-row-05-8-ranks`, `square-r05-c02-8-ranks`,
`square-r01-c03-cut-8-ranks`, `plinth-r01-c01-16-scatter`,
`piece-black-king-contour-8-ranks`, `grid-line-v-03-4-grid`. The generated
kit wraps each mark in `panel-<n>-<layout>`.

## 8. Verification

- **The letter.** The parametric outline against Dennis's drawn
  `outline-8-grid`: symmetric difference 0.12 % of the area, Hausdorff
  distance 5.3 units on 1200.
- **The tiling.** Every variant: whole tiles sit on exact multiples of *c*,
  and the union of its tiles equals the outline polygon (symmetric
  difference 0.000 units² at every density).
- **The emblem against his 4 × 4 panel.** The twelve pieces' bounding boxes
  match his to 0.017 units; the twelve tiles match his one for one, each
  within 5.3 units (the valley-flank asymmetry above), the six on the legs
  below the top row within 0.01.
- **The kit.** The generated kit beside the hand-built one: the same seven
  panels in the same places; every piece's bounding box within 0.02 units
  of his (quartet 0.017, ranks 0.009, scatter 0.005).
- **The files.** `assets/generator/audit_assets.py` passes every SVG under
  assets: header, titles, an id on every element, no generator defaults,
  every internal reference live, stock namedview; and every `assets/...`
  path written in a document, a script or a header exists.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->
