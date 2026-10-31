#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH M (MONOLITH Edition - v1.2)
    - File Name: monolith_m.py
    - Relative Path: assets/generator/monolith_m.py
    - Artifact Type: python
    - Version: 1.2.1
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.1 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      from conical_m.py: at Dennis's request the brand files dropped
      "conical" from their names while the logo is still being decided.
      The letter's parameters are MONOLITH_M (CONICAL before), the
      variants are written as monolith-m-<n>-<layout>-<skin>.svg and the
      kit as monolith-brand-kit-generated.svg, and every file this writes
      names the M, the system and the kit by their new names in a patch
      entry of its own; the entries before it keep their dates.
    - 1.2.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      ruled that a construction grid is a template, not drawing: the grid
      layout's lines are now invisible guide paths over the outline, open
      M…V and M…H paths with no fill, no stroke and no width, as in his
      grid-template-invisible-line-elements.svg (GUIDE_STYLE). They
      render no pixels, still snap and select in Inkscape, keep the
      grid's bounding box to the square itself (the filled rects of 1.1.0
      added half a line on every side), and take less room. The grid
      variants and the generated kit carry it as 1.2.0.
    - 1.1.1 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      logo's header names its reader, the page's app bar, which
      tools/build-emblem.mjs writes it into, as the emblem's names the
      loading screen.
    - 1.1.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis made
      the 4 x 4 M the official mark: this script now writes
      assets/monolith-logo.svg (bare) and assets/monolith-emblem.svg (his
      quartet of twelve pieces), the emblem keeping the id scheme and the
      path the page's emblem build reads. The three layouts are now his
      placements measured from conical-monolith-brand-kit.svg (piece
      centre, size, rotation and mirroring per piece; the scatter's kings
      on 3 x 3 plinths), so the system reproduces his compositions rather
      than approximating them. The grid layout draws his construction
      panels (the outline under the full grid, lines as filled rects). The
      generated kit lays its seven panels out as his kit does. Sides are
      named by their faces (White is boxwood-faced), as the page reads
      them. build_mark() is the public seam the mock-ups load through.
      Moved from assets/brand to assets/generator.
    - 1.0.0 (10/26/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      build of the system Dennis landed on in conical-monolith-brand-kit.svg:
      the letter as parameters, the tiling computed, his layouts as tables.

✒ Description:
    The MONOLITH brand mark as a system: one letter, the MONOLITH M that
    Dennis landed on in monolith-brand-kit.svg, written down as
    parameters and equations, and every variant of the tiled M built from
    it. The outline is computed from a dozen numbers (leg width, corner
    radius, the valley's floor and flank handles, the crossbar's underside,
    the notch); a grid of n by n cells is laid over the square and every
    cell is a whole tile, a tile cut to the outline, or dropped; the piece
    layouts he composed are tables of his own placements. Run it and it
    writes the two official marks, the variants and the generated kit;
    import it and build_mark() gives any size, density, skin or layout.
    The companion document is assets/brand/MONOLITH_M_SYSTEM.md.

✒ Key Features:
    - Geometry: Outline(P) is the letter as an exact SVG path (lines, arcs,
      cubics) and as a shapely polygon; every number is a named parameter
      with Dennis's value as the default
    - Tiling: tiles(n, outline, plinths) lays the n x n grid, clips it, and
      merges plinth blocks (2 x 2 or 3 x 3) under pieces that stand on them
    - Skins: slate (his kit: one slate, black mortar), checker, legs
    - Layouts: bare, grid (construction), quartet (n = 4, the emblem),
      ranks (n = 8), scatter (n = 16), each placement measured from his kit
    - Construction grid: the outline with n + 1 invisible guide lines each
      way over it (GUIDE_STYLE: no fill, no stroke, no width), a template
      to snap to rather than drawing; the frame's own edges included
    - Officials: monolith-logo.svg and monolith-emblem.svg at the assets root
    - Variants under assets/brand/variants, the kit sheet in assets/brand

✒ Usage Instructions:
    $ python assets/generator/monolith_m.py                   # officials, variants, kit
    $ python assets/generator/monolith_m.py --only official   # just the two marks
    $ python assets/generator/monolith_m.py --only 8-ranks    # one variant
    >>> from monolith_m import build_mark, render_variant, MONOLITH_M
    >>> mark = build_mark(4, "quartet", MONOLITH_M.scaled(600))

✒ Command-Line Arguments:
    Output:
        --only NAME   official | kit | <n>-<layout>, e.g. 16-scatter
        --size PX     Canvas side of each mark in px (default 1200)
        --skin NAME   slate | checker | legs for the variants (default slate)

✒ Other Important Information:
    - Dependencies: Python 3.10+, shapely, numpy, lxml, svgpathtools; the
      emitter and the piece loader are mono_svg.py and mono_assets.py
      beside this file
    - Pieces: assets/chess-pieces.svg stamped verbatim (Dennis's nodes)
    - Every file this writes carries the house header and is regenerated,
      never hand-edited; the officials and the page's emblem build follow
---------
"""

from __future__ import annotations

import argparse
import math
import os
from dataclasses import dataclass, field
from datetime import date

import numpy as np
from shapely.geometry import Polygon, box

from mono_assets import (ASSETS, Piece, identity, load_pieces, matrix_attr, parse_transform, piece_ids,
                         stamp_piece, tile_style)
from mono_svg import Svg, n as num, wrap_document

HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.join(ASSETS, "brand")
TODAY = date(2026, 10, 30)
DATE_MDY, DATE_ISO, UPDATE_LONG = TODAY.strftime("%m/%d/%Y"), TODAY.isoformat(), TODAY.strftime("%A, %B %d, %Y")
# Why every file this writes carries a 10/30/2026 patch entry; older entries keep their dates.
RENAMED = ("at Dennis's request the brand files dropped \"conical\" from their names while the "
           "logo is still being decided; the letter is the MONOLITH M, built by monolith_m.py "
           "and written up in MONOLITH_M_SYSTEM.md")
OFFICIAL_RENAMED = ("{version} (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — "
                    + RENAMED[0].upper() + RENAMED[1:]
                    + ", and the kit it was measured from is monolith-brand-kit.svg. The path and "
                    "the {group} group stay put.")


# ---------------------------------------------------------------------------
# 1. The letter: parameters in a 1200-unit square, as Dennis drew it
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class MParams:
    """Every length is in units of a square canvas of side S. Defaults are the
    MONOLITH M of monolith-brand-kit.svg, measured from its outline."""
    S: float = 1200.0
    leg: float = 300.0          # leg width (S / 4)
    r_corner: float = 26.239    # the six convex corners: four outer, two inner feet
    # valley: the dip between the legs, open to the top. Each flank is one cubic
    # with horizontal tangents, from the top edge at x = leg - r_corner down to
    # the floor; the handles are what make it a smooth dip rather than a V
    valley_floor_y: float = 146.43     # depth of the floor below the top edge
    valley_floor_w: float = 185.39     # width of the flat floor, centred
    valley_handle_top: float = 59.35   # the flank's handle at the top edge
    valley_handle_floor: float = 72.39 # the flank's handle at the floor
    # crossbar: the underside of the bridge between the legs, open to the bottom
    bar_y: float = 509.68              # underside of the crossbar
    r_bar: float = 25.41               # fillet where the underside meets a leg's inner edge
    # notch: the tab hanging from the crossbar, centred
    notch_y: float = 600.0             # bottom of the tab (S / 2)
    notch_floor_w: float = 52.72       # width of the tab's flat bottom
    notch_flank_w: float = 94.48       # width of each S-curve flank

    def scaled(self, S: float) -> "MParams":
        k = S / self.S
        return MParams(**{f: getattr(self, f) * k for f in self.__dataclass_fields__})


MONOLITH_M = MParams()


def _fillet(p_prev, corner, p_next, r):
    """Tangent points and centre of the fillet of radius r at `corner`, between
    the lines corner->p_prev and corner->p_next."""
    p_prev, corner, p_next = (np.array(v, float) for v in (p_prev, corner, p_next))
    u = (p_prev - corner) / np.linalg.norm(p_prev - corner)
    v = (p_next - corner) / np.linalg.norm(p_next - corner)
    theta = math.acos(float(np.clip(np.dot(u, v), -1, 1)))       # interior angle
    t = r / math.tan(theta / 2)                                     # tangent length
    bis = (u + v) / np.linalg.norm(u + v)
    return corner + u * t, corner + v * t, corner + bis * (r / math.sin(theta / 2))


def _arc_pts(centre, r, a_from, a_to, steps):
    d = a_to - a_from
    while d > math.pi:
        d -= 2 * math.pi
    while d < -math.pi:
        d += 2 * math.pi
    return [(centre[0] + r * math.cos(a_from + d * k / steps), centre[1] + r * math.sin(a_from + d * k / steps))
            for k in range(steps + 1)]


def _cubic_pts(p0, p1, p2, p3, steps):
    p0, p1, p2, p3 = (np.array(v, float) for v in (p0, p1, p2, p3))
    out = []
    for k in range(steps + 1):
        t = k / steps
        q = (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3
        out.append((float(q[0]), float(q[1])))
    return out


class Outline:
    """The M's outline, built once from MParams: an exact SVG path and a polygon."""

    def __init__(self, P: MParams = MONOLITH_M, steps: int = 32):
        self.P = P
        S, leg, r = P.S, P.leg, P.r_corner
        cx = S / 2
        fl_x0 = cx - P.valley_floor_w / 2             # valley floor, left end
        fl_x1 = cx + P.valley_floor_w / 2
        fy = P.valley_floor_y
        vx = leg - r                                  # where a flank leaves the top edge
        ht, hf = P.valley_handle_top, P.valley_handle_floor
        nf_x0 = cx - P.notch_floor_w / 2 - P.notch_flank_w  # where the notch's left flank leaves the bar
        nf_x1 = cx - P.notch_floor_w / 2                    # where it reaches the notch floor
        by, ny = P.bar_y, P.notch_y
        d, pts = [], []

        def line_to(p):
            p = (float(p[0]), float(p[1]))
            if pts and math.hypot(p[0] - pts[-1][0], p[1] - pts[-1][1]) < 1e-9:
                return
            d.append(f"L {num(p[0])},{num(p[1])}")
            pts.append(p)

        def fillet_to(p_prev, corner, p_next, rad, sweep):
            t1, t2, c = _fillet(p_prev, corner, p_next, rad)
            line_to(t1)
            d.append(f"A {num(rad)},{num(rad)} 0 0 {sweep} {num(t2[0])},{num(t2[1])}")
            a1 = math.atan2(t1[1] - c[1], t1[0] - c[0])
            a2 = math.atan2(t2[1] - c[1], t2[0] - c[0])
            pts.extend(_arc_pts(c, rad, a1, a2, steps)[1:])

        def cubic_to(p1, p2, p3):
            p0 = pts[-1]
            d.append(f"C {num(p1[0])},{num(p1[1])} {num(p2[0])},{num(p2[1])} {num(p3[0])},{num(p3[1])}")
            pts.extend(_cubic_pts(p0, p1, p2, p3, steps)[1:])

        # clockwise on screen, from the left edge just below the top-left corner
        d.append(f"M 0,{num(r)}")
        pts.append((0.0, float(r)))
        fillet_to((0, S), (0, 0), (leg, 0), r, 1)                         # top-left corner
        line_to((vx, 0))                                                  # top edge of the left leg
        cubic_to((vx + ht, 0), (fl_x0 - hf, fy), (fl_x0, fy))             # left valley flank
        line_to((fl_x1, fy))                                              # valley floor
        cubic_to((fl_x1 + hf, fy), (S - vx - ht, 0), (S - vx, 0))         # right valley flank
        fillet_to((0, 0), (S, 0), (S, S), r, 1)                           # top-right corner
        fillet_to((S, 0), (S, S), (0, S), r, 1)                           # bottom-right corner
        fillet_to((S, S), (S - leg, S), (S - leg, 0), r, 1)               # right leg's inner foot
        fillet_to((S - leg, S), (S - leg, by), (0, by), P.r_bar, 0)       # crossbar meets right leg
        line_to((S - nf_x0, by))                                          # underside to the notch
        h = P.notch_flank_w / 2
        cubic_to((S - nf_x0 - h, by), (S - nf_x1 + h, ny), (S - nf_x1, ny))   # notch, right flank
        line_to((nf_x1, ny))                                              # notch floor
        cubic_to((nf_x1 - h, ny), (nf_x0 + h, by), (nf_x0, by))           # notch, left flank
        fillet_to((S, by), (leg, by), (leg, S), P.r_bar, 0)               # crossbar meets left leg
        fillet_to((leg, 0), (leg, S), (0, S), r, 1)                       # left leg's inner foot
        fillet_to((S, S), (0, S), (0, 0), r, 1)                           # bottom-left corner
        d.append("Z")
        self.path_d = " ".join(d)
        self.polygon = Polygon(pts).buffer(0)
        assert self.polygon.is_valid and self.polygon.geom_type == "Polygon", "outline must be one simple polygon"


# ---------------------------------------------------------------------------
# 2. The tiling
# ---------------------------------------------------------------------------

@dataclass
class Tile:
    row: int
    col: int
    span: int               # 1 for a cell, 2 or 3 for a plinth
    geom: Polygon
    whole: bool


def _largest(geom):
    if geom.geom_type == "Polygon":
        return geom
    return max((g for g in geom.geoms if g.geom_type == "Polygon"), key=lambda g: g.area)


def tiles(n: int, outline: Outline, plinths: list[tuple[int, int, int]] = ()) -> list[Tile]:
    """Lay n x n cells of side S/n over the square; keep what the M covers.
    `plinths` are (col, row, span) blocks merged into one tile each."""
    S = outline.P.S
    c = S / n
    floor = 0.5 * (S / 1200) ** 2            # drops the slivers a curve leaves in a corner cell
    taken, out = set(), []
    for (pc, pr, span) in plinths:
        sq = box(pc * c, pr * c, (pc + span) * c, (pr + span) * c)
        inter = sq.intersection(outline.polygon)
        if inter.area <= floor:
            continue
        inter = _largest(inter)
        out.append(Tile(pr, pc, span, inter, inter.area > sq.area - 1e-6 * S))
        taken.update((pr + dr, pc + dc) for dr in range(span) for dc in range(span))
    for r in range(n):
        for col in range(n):
            if (r, col) in taken:
                continue
            sq = box(col * c, r * c, (col + 1) * c, (r + 1) * c)
            inter = sq.intersection(outline.polygon)
            if inter.is_empty or inter.area <= floor:
                continue
            inter = _largest(inter)
            out.append(Tile(r, col, 1, inter, inter.area > sq.area - 1e-6 * S))
    out.sort(key=lambda t: (t.row, t.col))
    return out


def poly_d(poly: Polygon, prec: int = 3) -> str:
    """Exterior ring as a path: near-duplicate nodes merged, collinear nodes dropped."""
    raw = list(poly.exterior.coords)[:-1]
    coords = []
    for p in raw:
        if not coords or math.hypot(p[0] - coords[-1][0], p[1] - coords[-1][1]) > 1e-6:
            coords.append(p)
    if len(coords) > 1 and math.hypot(coords[0][0] - coords[-1][0], coords[0][1] - coords[-1][1]) <= 1e-6:
        coords.pop()
    out = []
    for i, p in enumerate(coords):
        a, b = coords[i - 1], coords[(i + 1) % len(coords)]
        cross = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0])
        if abs(cross) > 1e-4:
            out.append(p)
    return "M " + " L ".join(f"{round(x, prec):g},{round(y, prec):g}" for x, y in out) + " Z"


def tile_d(t: Tile, c: float) -> str:
    """A whole tile as a four-node square, a cut tile as its exact intersection."""
    if t.whole:
        x, y, s = t.col * c, t.row * c, t.span * c
        return f"M {num(x)},{num(y)} H {num(x + s)} V {num(y + s)} H {num(x)} Z"
    return poly_d(t.geom)


# ---------------------------------------------------------------------------
# 3. Skins
# ---------------------------------------------------------------------------

_WOODS = {"white-face": "#decd87", "white-contour": "#1a1a1a", "black-face": "#1a1a1a", "black-contour": "#decd87"}

SKINS = {
    # the kit: one slate, black mortar between the tiles
    "slate": {"tile-light": "#6f8a91", "tile-dark": "#6f8a91", "mortar": "#000000", **_WOODS},
    # a chessboard: light where row + column is even
    "checker": {"tile-light": "#e6e6e6", "tile-dark": "#6f8a91", "mortar": "#000000", **_WOODS},
    # the first concept: the right leg's dark tiles are black, so the two legs are the two sides
    "legs": {"tile-light": "#e6e6e6", "tile-dark": "#6f8a91", "tile-dark-right": "#000000", "mortar": "#000000",
             **_WOODS},
}


def tile_fill(t: Tile, skin: dict, n: int) -> str:
    if (t.row + t.col) % 2 == 0:
        return skin["tile-light"]
    if "tile-dark-right" in skin and t.col >= n / 2:
        return skin["tile-dark-right"]
    return skin["tile-dark"]


# ---------------------------------------------------------------------------
# 4. Layouts: Dennis's compositions, measured from his kit
# ---------------------------------------------------------------------------

@dataclass
class P:
    """One piece on the mark. side by faces (white = boxwood face); code K Q R B N P;
    (cx, cy) the centre of the piece's bounding box, in cells; size the side of the
    piece set's 153.79-unit square, in cells; rot in degrees, clockwise on screen;
    mirror flips it left to right about its centre; plinth (col, row, span) merges
    a block of cells into one tile under it."""
    side: str
    code: str
    cx: float
    cy: float
    size: float
    rot: float = 0.0
    mirror: bool = False
    plinth: tuple | None = None


# The emblem. Four cells; one of each kind per side; pawns 3 % smaller, as drawn.
QUARTET = [
    P("white", "R", 0.5000, 0.4961, 0.6596),
    P("black", "P", 1.2993, 0.6415, 0.6395),
    P("white", "P", 2.7214, 0.6415, 0.6395),
    P("black", "R", 3.5000, 0.4961, 0.6596),
    P("white", "K", 1.5000, 1.3442, 0.6596, mirror=True),
    P("black", "K", 2.5000, 1.3442, 0.6596),
    P("black", "Q", 0.5000, 1.4961, 0.6596),
    P("white", "Q", 3.5000, 1.4961, 0.6596, mirror=True),
    P("white", "B", 0.5000, 2.4961, 0.6596, mirror=True),
    P("black", "B", 3.5000, 2.4961, 0.6596),
    P("black", "N", 0.5000, 3.4961, 0.6596),
    P("white", "N", 3.5000, 3.4961, 0.6596),
]

# Eight cells; the two armies lying along the legs, back ranks outside, pawns inside.
_RANK_ORDER = "RNBKQBNR"
_RANK_X = {  # bbox centre across the leg, per row (the pieces sit on their square's centre)
    "white": [0.5616, 0.5513, 0.5094, 0.5000, 0.5302, 0.5094, 0.5000, 0.5616],
    "white-pawn": [1.5431, 1.5431, 1.5431, 1.5522, 1.5431, 1.5431, 1.5431, 1.5431],
    "black-pawn": [6.5583] * 8,
    "black": [7.5513, 7.5513, 7.5094, 7.5000, 7.5302, 7.5094, 7.5513, 7.5616],
}
RANKS = [pl for r, code in enumerate(_RANK_ORDER) for pl in (
    P("white", code, _RANK_X["white"][r], r + 0.5, 0.8878, rot=-90),
    P("white", "P", _RANK_X["white-pawn"][r], r + 0.5, 0.8878, rot=-90),
    P("black", "P", _RANK_X["black-pawn"][r], r + 0.5, 0.8878, rot=-90),
    P("black", code, _RANK_X["black"][r], r + 0.5, 0.8878, rot=-90),
)]

# Sixteen cells; a zigzag of pieces on 2 x 2 plinths down each leg, the kings on
# 3 x 3 plinths in the bridge, facing each other.
SCATTER = [
    P("black", "R", 1.0000, 1.0000, 1.7756, plinth=(0, 0, 2)),
    P("white", "R", 15.0000, 1.0000, 1.7756, plinth=(14, 0, 2)),
    P("black", "N", 3.0000, 3.0000, 1.7756, plinth=(2, 2, 2)),
    P("white", "N", 13.0000, 3.0000, 1.7756, plinth=(12, 2, 2)),
    P("white", "K", 6.5000, 4.4911, 2.6383, mirror=True, plinth=(5, 3, 3)),
    P("black", "K", 9.5000, 4.4911, 2.6383, plinth=(8, 3, 3)),
    P("black", "B", 1.0000, 5.0000, 1.7756, plinth=(0, 4, 2)),
    P("white", "B", 15.0000, 5.0000, 1.7756, plinth=(14, 4, 2)),
    P("black", "P", 3.0181, 7.0000, 1.7756, plinth=(2, 6, 2)),
    P("white", "Q", 12.9815, 7.0000, 1.7756, plinth=(12, 6, 2)),
    P("black", "Q", 1.0000, 9.0000, 1.7756, plinth=(0, 8, 2)),
    P("white", "P", 15.0000, 9.0000, 1.7756, plinth=(14, 8, 2)),
    P("white", "B", 3.0000, 11.0000, 1.7756, plinth=(2, 10, 2)),
    P("black", "B", 13.0000, 11.0000, 1.7756, plinth=(12, 10, 2)),
    P("white", "N", 1.0000, 13.0000, 1.7756, plinth=(0, 12, 2)),
    P("black", "N", 15.0000, 13.0000, 1.7756, plinth=(14, 12, 2)),
    P("white", "R", 3.0000, 15.0000, 1.7756, plinth=(2, 14, 2)),
    P("black", "R", 13.0000, 15.0000, 1.7756, plinth=(12, 14, 2)),
]

# name -> (the density it was composed for, or None for any; placements)
LAYOUTS = {
    "bare": (None, []),
    "grid": (None, []),
    "quartet": (4, QUARTET),
    "ranks": (8, RANKS),
    "scatter": (16, SCATTER),
}


def place(pl: P, c: float) -> Piece:
    """Stamp one placement: centre the piece's bbox on its own origin, scale it
    (negative x mirrors it), rotate it, move it to (cx, cy) cells."""
    pset = load_pieces()
    piece = pset.pieces[(pl.side, pl.code)]
    x0, y0, x1, y1 = piece.bbox
    s = pl.size * c / pset.square
    m = parse_transform(f"translate({pl.cx * c},{pl.cy * c}) rotate({pl.rot}) "
                        f"scale({-s if pl.mirror else s},{s}) translate({-(x0 + x1) / 2},{-(y0 + y1) / 2})")
    return piece.moved(m)


@dataclass
class Mark:
    P: MParams
    n: int
    layout: str
    cell: float
    outline: Outline
    tiles: list[Tile]
    pieces: list[Piece] = field(default_factory=list)


def build_mark(n: int, layout: str = "bare", P_: MParams = MONOLITH_M) -> Mark:
    """The tiled M: its outline, its tiles and its placed pieces, ready to draw."""
    if layout not in LAYOUTS:
        raise ValueError(f"unknown layout {layout}; one of {list(LAYOUTS)}")
    composed_for, placements = LAYOUTS[layout]
    if composed_for is not None and composed_for != n:
        raise ValueError(f"the {layout} layout is composed for n = {composed_for}, not {n}")
    outline = Outline(P_)
    c = P_.S / n
    plinths = [pl.plinth for pl in placements if pl.plinth]
    ts = [] if layout == "grid" else tiles(n, outline, plinths)
    pieces = [place(pl, c) for pl in placements]
    return Mark(P_, n, layout, c, outline, ts, pieces)


# ---------------------------------------------------------------------------
# 5. Drawing
# ---------------------------------------------------------------------------

# A guide line: an open path that renders nothing. Dennis's ruling (10/26/2026, after his
# grid-template-invisible-line-elements.svg): a construction grid is a template, so its lines carry no
# fill, no stroke and no width. They still snap and select in Inkscape (and show in its outline view),
# add nothing to a group's bounding box beyond the square itself, and paint no pixels. The style is his.
GUIDE_STYLE = ("fill:none;fill-rule:evenodd;stroke:none;stroke-width:0;stroke-linecap:round;"
               "stroke-linejoin:round;stroke-dasharray:none;paint-order:markers fill stroke")
GUIDE_NOTE = ("The grid's lines are invisible guide paths (no fill, no stroke, no width): a template to snap "
              "to, not drawing, so they paint nothing and the grid's bounding box is the square itself.")


def draw_mark(group, mark: Mark, skin: dict | str, panel: str, root_id: str | None = None):
    """Draw one tiled M into `group` with its origin at (0, 0). Ids end in -<panel>:
    board-<panel> > board-row-NN-<panel> > square-rNN-cNN[-cut]-<panel> (or
    plinth-...); pieces-<panel> > pieces-white-<panel> > piece-white-king-<panel>
    > piece-white-king-contour-<panel>; for the grid layout outline-<panel> and,
    over it, grid-<panel> > grid-verticals-<panel> > grid-line-v-NN-<panel>, each line
    an invisible guide path (GUIDE_STYLE) from edge to edge of the square."""
    skin = SKINS[skin] if isinstance(skin, str) else skin
    S, n, c = mark.P.S, mark.n, mark.cell
    w = S / 1200                                  # mortar width: 1 at the kit's size
    g = group.g(root_id or f"mark-{panel}")
    if mark.layout == "grid":
        g.path(f"outline-{panel}", mark.outline.path_d, fill=skin["tile-dark"])
        grid = g.g(f"grid-{panel}")
        vs, hs = grid.g(f"grid-verticals-{panel}"), grid.g(f"grid-horizontals-{panel}")
        for k in range(n + 1):
            vs.path(f"grid-line-v-{k + 1:02d}-{panel}", f"M {num(k * c)},0 V {num(S)}").attrs["style"] = GUIDE_STYLE
            hs.path(f"grid-line-h-{k + 1:02d}-{panel}", f"M 0,{num(k * c)} H {num(S)}").attrs["style"] = GUIDE_STYLE
        return g
    board = g.g(f"board-{panel}")
    rows = {}
    for t in mark.tiles:
        if t.row not in rows:
            rows[t.row] = board.g(f"board-row-{t.row + 1:02d}-{panel}")
        fill = tile_fill(t, skin, n)
        kind = "plinth" if t.span > 1 else "square"
        tid = f"{kind}-r{t.row + 1:02d}-c{t.col + 1:02d}{'' if t.whole else '-cut'}-{panel}"
        if t.whole:
            node = rows[t.row].rect(tid, t.col * c, t.row * c, t.span * c, t.span * c, fill)
        else:
            node = rows[t.row].path(tid, poly_d(t.geom), fill=fill)
        node.attrs["style"] = tile_style(fill, skin["mortar"], w)
    if mark.pieces:
        pg = g.g(f"pieces-{panel}")
        order = sorted(range(len(mark.pieces)), key=lambda i: (round(mark.pieces[i].centre[1] / c, 1),
                                                               mark.pieces[i].centre[0]))
        for side in ("white", "black"):
            side_pieces = [mark.pieces[i] for i in order if mark.pieces[i].side == side]
            if not side_pieces:
                continue
            sg = pg.g(f"pieces-{side}-{panel}")
            for base, piece in zip(piece_ids(side_pieces), side_pieces):
                stamp_piece(sg, base, piece, skin, identity(), suffix=f"-{panel}")
    return g


ID_CONVENTION = (
    "component-subcomponent-panel, the panel suffix last: board-<panel> holds board-row-NN-<panel>, "
    "and each row its tiles, square-rNN-cNN-<panel> counted from the top left, -cut before the "
    "suffix for a tile the outline crosses, plinth-rNN-cNN-<panel> for a merged block under a "
    "piece; pieces-<panel> holds pieces-white-<panel> and pieces-black-<panel>, and they hold "
    "piece-<side>-<kind>[-NN]-<panel>, each its -contour- and -face- path. Sides are named by "
    "their faces: White is boxwood-faced. A construction panel holds outline-<panel> and "
    "grid-<panel> with its verticals and horizontals."
)


def _doc(svg, *, title, file_name, rel_path, version, description, features, keywords, width, height, changelog,
         id_convention=ID_CONVENTION, other=()):
    return wrap_document(
        svg, title=title, file_name=file_name, rel_path=rel_path, artifact_type="illustration", version=version,
        date_mdy=DATE_MDY, date_iso=DATE_ISO, update_long=UPDATE_LONG, description=description,
        key_features=features, other_info=["Dependencies: none; opens in Inkscape 1.4 and renders in any browser",
                                           *other],
        keywords=keywords, width=width, height=height, changelog=changelog, id_convention=id_convention,
        source_note="Source of truth: assets/generator/monolith_m.py emits this file; edit the "
                    "script or its parameters, not the SVG, then rerun it")


def _stats(mark: Mark) -> str:
    whole = sum(1 for t in mark.tiles if t.whole and t.span == 1)
    cut = sum(1 for t in mark.tiles if not t.whole and t.span == 1)
    plinths = sum(1 for t in mark.tiles if t.span > 1)
    s = f"{whole} whole tiles, {cut} cut to the outline"
    if plinths:
        s += f", {plinths} plinths"
    if mark.pieces:
        s += f", {len(mark.pieces)} pieces"
    return s


def render_variant(n: int, layout: str = "bare", skin: str = "slate", size: float = 1200.0) -> tuple[str, str]:
    mark = build_mark(n, layout, MONOLITH_M.scaled(size))
    svg = Svg()
    panel = f"{n}-{layout}"
    draw_mark(svg, mark, skin, panel)
    fname = f"monolith-m-{n}-{layout}-{skin}.svg"
    grid = layout == "grid"
    version = "1.2.1" if grid else "1.1.1"
    what = {"grid": "the construction template: the outline with the full grid over it as invisible guide lines",
            "bare": "the tiled M without pieces"}.get(layout, f"the {layout} layout")
    doc = _doc(
        svg, title=f"MONOLITH M {n} x {n} {layout} {skin} (MONOLITH Edition - v{version[:3]})",
        file_name=fname, rel_path=f"assets/brand/variants/{fname}", version=version,
        description=(f"The MONOLITH M on a {n} by {n} grid of {size / n:g} px cells in the {skin} "
                     f"skin, {what}" + (f": {_stats(mark)}" if mark.tiles else "") +
                     ". Built by assets/generator/monolith_m.py from the letter's parameters; the "
                     "system is described in assets/brand/MONOLITH_M_SYSTEM.md."),
        features=[f"Canvas {size:g} x {size:g}; grid {n} x {n}; cell {size / n:g} px",
                  "Outline: legs S/4, corners r 26.24, valley floor 146.43 deep and 185.39 wide with cubic flanks "
                  "(handles 59.35 and 72.39), crossbar underside at 509.68, notch to 600 (1200 units, scaled)",
                  f"Skin {skin}: tiles {SKINS[skin]['tile-light']} and {SKINS[skin]['tile-dark']}, mortar "
                  f"{SKINS[skin]['mortar']}",
                  (f"Grid: {n + 1} guide lines each way, the frame's edges included, laid over the outline; "
                   "no fill, no stroke, no width" if grid else
                   "Pieces: chess-pieces.svg stamped verbatim at Dennis's placements; White is boxwood-faced")],
        keywords=["MONOLITH", "brand", "logo", "tiled M", "chess"], width=size, height=size,
        id_convention=ID_CONVENTION + (" " + GUIDE_NOTE if grid else ""),
        changelog=[f"{version} ({DATE_MDY}) [dendogg + Anthropic - Claude Opus 5.5] — Renamed "
                   f"from conical-m-{n}-{layout}-{skin}.svg: {RENAMED}."] + (
                  ["1.2.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — The grid's lines "
                   "are invisible guide paths over the outline, as Dennis ruled for a construction "
                   "template; the filled rects of 1.1.0 painted pixels and widened the bounding "
                   "box."]
                  if grid else []) + [
                   "1.1.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Rebuilt with "
                   "Dennis's placements measured from his kit, sides named by faces, and the "
                   "construction layout.",
                   "1.0.0 (10/26/2026) [dendogg + Anthropic - Claude Fable 5.1] — First build of the system "
                   "Dennis landed on in conical-monolith-brand-kit.svg."])
    return fname, doc


OFFICIAL = {
    "logo": dict(
        n=4, layout="bare", file="monolith-logo.svg", root="logo-monolith", panel="logo",
        version="1.0.2", title="MONOLITH Logo (MONOLITH Edition - v1.0)",
        description=("MONOLITH's official logo, chosen by Dennis on 10/26/2026: the MONOLITH M "
                     "cut into a four by four grid of slate tiles with black mortar, no pieces. "
                     "The letter is his (measured from monolith-brand-kit.svg and written down in "
                     "assets/brand/MONOLITH_M_SYSTEM.md); "
                     "this file is the system's rendering of it at 1200 px, and the emblem is the same mark with "
                     "his twelve pieces standing on it. It is the source of the page's app bar logo: "
                     "tools/build-emblem.mjs writes it into index.html, reading its board-logo group."),
        changelog=[OFFICIAL_RENAMED.format(version="1.0.2", group="board-logo"),
                   "1.0.1 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis asked for "
                   "the logo in the "
                   "web app's header: the page's app bar carries it now, written in by tools/build-emblem.mjs, so "
                   "its path and its board-logo group stay put.",
                   "1.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis made the 4 x 4 Conical M "
                   "the official logo; first build, from the system."],
    ),
    "emblem": dict(
        n=4, layout="quartet", file="monolith-emblem.svg", root="emblem-monolith", panel="emblem",
        version="2.0.1", title="MONOLITH Emblem (MONOLITH Edition - v2.0)",
        description=("MONOLITH's official emblem, chosen by Dennis on 10/26/2026: the MONOLITH M "
                     "cut into a four by four grid of slate tiles with black mortar, with his "
                     "quartet of twelve pieces standing on it, one of each kind per side. The "
                     "letter and the placements are his (measured from monolith-brand-kit.svg and "
                     "written down in "
                     "assets/brand/MONOLITH_M_SYSTEM.md); "
                     "this file is the system's rendering of them at 1200 px. It is the source of the page's "
                     "loading screen: tools/build-emblem.mjs copies it into index.html."),
        changelog=[
            OFFICIAL_RENAMED.format(version="2.0.1", group="board-emblem"),
            "2.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis landed on the Conical M and made "
            "its 4 x 4 panel with pieces the official emblem; the 23 x 24 board M of 1.x is retired. Same path "
            "and the same id scheme (board-row-NN-emblem, square-rNN-cNN-emblem, pieces-white-emblem, "
            "piece-white-king-emblem and its -contour- and -face- paths), sides named by faces as the page reads "
            "them; the tiles are now one slate with black mortar.",
            "1.2.0 (10/25/2026) [dendogg + Anthropic - Claude Fable 5.1] — The 23 x 24 board M rebuilt on exact "
            "30 x 30 px squares at Dennis's direction; superseded by 2.0.0.",
            "1.1.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The pieces are Dennis's set as he had "
            "then drawn it (chess-pieces.svg 1.3.0).",
            "1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis's concept for MONOLITH's emblem "
            "made into the source of the loading screen.",
        ],
    ),
}


def render_official(kind: str, size: float = 1200.0) -> tuple[str, str]:
    spec = OFFICIAL[kind]
    mark = build_mark(spec["n"], spec["layout"], MONOLITH_M.scaled(size))
    svg = Svg()
    draw_mark(svg, mark, "slate", spec["panel"], root_id=spec["root"])
    doc = _doc(
        svg, title=spec["title"], file_name=spec["file"], rel_path=f"assets/{spec['file']}", version=spec["version"],
        description=spec["description"],
        features=[f"Canvas {size:g} x {size:g}; the MONOLITH M edge to edge on a 4 x 4 grid of "
                  f"{size / 4:g} px cells: {_stats(mark)}",
                  "Tiles: slate #6f8a91, mortar #000000 stroked over the fill at 1 px per 1200 (paint-order "
                  "markers fill stroke), as Dennis draws the grout",
                  *(["Pieces: chess-pieces.svg stamped verbatim at Dennis's placements; White is boxwood-faced "
                     "(#decd87 face, #1a1a1a contour), Black ebony-faced; pawns 3 % smaller, as drawn"]
                    if mark.pieces else []),
                  "One flat layer: groups only, no Inkscape layers",
                  "Regenerate by running assets/generator/monolith_m.py; its official target "
                  "rebuilds just the two marks"],
        keywords=["MONOLITH", "logo" if kind == "logo" else "emblem", "brand", "tiled M", "chess"],
        width=size, height=size, changelog=spec["changelog"],
        other=["Official: the 4 x 4 MONOLITH M is the MONOLITH mark; every mock-up under "
               "assets/mockups is built on this file's geometry"])
    return spec["file"], doc


KIT_ROWS = [[(4, "grid"), (8, "grid"), (16, "grid")],
            [(4, "quartet"), (8, "ranks"), (16, "bare")],
            [None, None, (16, "scatter")]]


def render_kit(size: float = 1200.0, gap: float = 44.0, skin: str = "slate") -> tuple[str, str]:
    """The kit sheet, laid out as Dennis's: construction panels on top, then the
    quartet, the ranks and the bare 16, then the scatter under them on the right."""
    W = H = 3 * size + 2 * gap
    svg = Svg()
    stats = []
    for ri, row in enumerate(KIT_ROWS):
        for ci, spec in enumerate(row):
            if spec is None:
                continue
            n, layout = spec
            panel = f"{n}-{layout}"
            cell = svg.g(f"panel-{panel}", transform=f"translate({num(ci * (size + gap))},{num(ri * (size + gap))})")
            mark = build_mark(n, layout, MONOLITH_M.scaled(size))
            draw_mark(cell, mark, skin, panel)
            stats.append(f"{panel}: {_stats(mark) if mark.tiles else 'outline and grid'}")
    fname = "monolith-brand-kit-generated.svg"
    doc = _doc(
        svg, title="MONOLITH Brand Kit Generated (MONOLITH Edition - v1.2)", file_name=fname,
        rel_path=f"assets/brand/{fname}", version="1.2.1",
        description=("Dennis's brand kit rebuilt by the system, panel for panel: the construction drawings on 4, 8 "
                     "and 16 grids across the top; the quartet, the ranks and the bare 16 below them; the scatter "
                     "under those on the right. Every tile is computed from the letter's parameters and every "
                     "piece stands where he placed it. His hand-built kit, "
                     "brand/monolith-brand-kit.svg, is the reference this reproduces."),
        features=[f"Seven panels of {size:g} px, {gap:g} px apart; canvas {W:g} x {H:g}", *stats],
        keywords=["MONOLITH", "brand kit", "logo", "tiled M", "chess"], width=W, height=H,
        changelog=[f"1.2.1 ({DATE_MDY}) [dendogg + Anthropic - Claude Opus 5.5] — Renamed from "
                   f"conical-monolith-brand-kit-generated.svg, beside his kit, now "
                   f"monolith-brand-kit.svg: {RENAMED}.",
                   "1.2.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — The construction "
                   "panels' grid lines are invisible guide paths over the outline, as Dennis ruled "
                   "for a template.",
                   "1.1.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Laid out as "
                   "Dennis's kit (seven panels, construction row on top) with his measured "
                   "placements.",
                   "1.0.0 (10/26/2026) [dendogg + Anthropic - Claude Fable 5.1] — First generated kit."],
        id_convention="panel-<n>-<layout> holds one mark; inside it the ids of the variant files, suffixed "
                      "-<n>-<layout>. " + ID_CONVENTION + " " + GUIDE_NOTE)
    return fname, doc


VARIANTS = [(4, "grid"), (8, "grid"), (16, "grid"), (8, "bare"), (16, "bare"), (24, "bare"),
            (8, "ranks"), (16, "scatter")]


def _write(path: str, doc: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(doc)
    print("wrote", os.path.relpath(path, ASSETS).replace(os.sep, "/"))


def main():
    ap = argparse.ArgumentParser(description="Build the MONOLITH M marks, variants and kit.")
    ap.add_argument("--only", default=None, help="official | kit | <n>-<layout>")
    ap.add_argument("--size", type=float, default=1200.0)
    ap.add_argument("--skin", default="slate", choices=list(SKINS))
    args = ap.parse_args()
    if args.only in (None, "official"):
        for kind in OFFICIAL:
            fname, doc = render_official(kind, args.size)
            _write(os.path.join(ASSETS, fname), doc)
    for n, layout in VARIANTS:
        if args.only not in (None, f"{n}-{layout}"):
            continue
        fname, doc = render_variant(n, layout, args.skin, args.size)
        _write(os.path.join(BRAND, "variants", fname), doc)
    if args.only in (None, "kit"):
        fname, doc = render_kit(args.size, skin=args.skin)
        _write(os.path.join(BRAND, fname), doc)


if __name__ == "__main__":
    main()
