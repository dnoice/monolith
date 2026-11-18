#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH Piece Concepts Builder (MONOLITH Edition - v1.0)
    - File Name: build_piece_concepts.py
    - Relative Path: assets/generator/build_piece_concepts.py
    - Artifact Type: python
    - Version: 1.0.0
    - Date: 11/07/2026
    - Update: Saturday, November 7, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.0 (11/07/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      version, written when Dennis asked for the rest of the tall concept
      set after drawing the castle and the pawn himself: it draws the
      bishop, the queen and the king in his castle's grammar and seeds
      bishop-concept.svg, queen-concept.svg and king-concept.svg.

✒ Description:
    Draws the bishop, queen and king of the tall MONOLITH concept set (the
    one that is drawn in Inkscape and carried into Blender) in the grammar
    of Dennis's assets/castle-concept.svg: every face of the piece is its
    own gradient-filled cell, and one black outline compound, the
    silhouette minus every cell, runs a 10 px line between all of them. The
    pieces are measured off assets/models/chess-pieces-refrence-image.png
    at 3.85 px per reference pixel and stand on the castle's own plinth, so
    the three sit on the castle's baseline at the castle's scale.

✒ Key Features:
    - The cloisonne compiler: cells are drawn as plain overlapping shapes
      with a paint priority; front to back, each cell loses what the cells
      in front of it claim, grown by the 10 px line, so the separations are
      exact and uniform by construction rather than placed by hand
    - Voids: a cell with no fill carves a real see-through hole (the
      bishop's slot above the orb), edged by its neighbours' outline
    - Clean nodes: booleans run on true curves (skia-pathops), and on the
      way out every run of quadratics that lies on one circle is written
      back as a single SVG arc; sub-pixel slivers are dropped
    - Halves the outline cuts apart are separate elements with named
      suffixes (left/right, upper/lower, inner/outer, 01..NN)
    - Fluted panels (the queen's chiton) are cut into flutes and thin
      dividers with no black gap, in the knight pillar's gradients
    - Every colour comes from the stop sets of Dennis's own pawn, castle
      and knight pillar, one gradient per meaning, placed per element by
      href
    - The plinth module is measured off the castle: lower tier cell 156,
      upper tier cell 168, arch band r 86 to 124, a 52 px glowing slit

✒ Usage Instructions:
    $ python assets/generator/build_piece_concepts.py
    $ python assets/generator/build_piece_concepts.py --only bishop --force
    $ python assets/generator/build_piece_concepts.py --out /tmp/review

✒ Command-Line Arguments:
    Input:
        --only NAME   bishop, queen or king (repeatable); default all three
    Output:
        --out DIR     Write into DIR instead of assets/
        --force       Overwrite a concept SVG that already exists

✒ Other Important Information:
    - Dependencies: Python 3.10+, skia-pathops (exact curve booleans and
      offsets; shapely only works on polylines), shapely, and mono_svg.py
      from this folder for the house document layers
    - Ownership: this script seeds the three concept SVGs. Once Dennis
      takes a drawing over in Inkscape the SVG is the source of record, so
      the script refuses to overwrite an existing file unless --force is
      given; it is not one of build_all.py's steps
    - Frame: x = 0 on the piece's axis, y = 0 on the outline's bottom edge,
      up is negative; each document is cropped to its silhouette like the
      castle's
---------
"""

from __future__ import annotations

import argparse
import math
import os
import sys
from dataclasses import dataclass, field

import pathops
from pathops import ArcSize, Direction, LineCap, LineJoin, Path, PathOp
from shapely.geometry import Polygon

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, HERE)
import mono_svg as ms  # noqa: E402

GAP = 10.0     # the black line between cells: the castle's outline width
TOL = 0.05     # conic to quadratic tolerance, px
ARC_TOL = 0.12 # how far a quadratic run may stray from a circle and still be written as one arc

VERSION = "1.0.0"
DATE_MDY, DATE_ISO, DATE_LONG = "11/07/2026", "2026-11-07", "Saturday, November 7, 2026"
AI_ACK = "Anthropic - Claude Opus 5.5"


# ===========================================================================
# Geometry: a path builder and the curve booleans
# ===========================================================================

class P:
    """Absolute-command path builder feeding a pathops Path (y down, as SVG)."""

    def __init__(self):
        self.p = Path()

    def M(self, x, y):
        self.p.moveTo(x, y); return self

    def L(self, x, y):
        self.p.lineTo(x, y); return self

    def C(self, x1, y1, x2, y2, x, y):
        self.p.cubicTo(x1, y1, x2, y2, x, y); return self

    def A(self, r, x, y, large=False, sweep=True, ry=None):
        self.p.arcTo(r, r if ry is None else ry, 0, ArcSize.LARGE if large else ArcSize.SMALL,
                     Direction.CW if sweep else Direction.CCW, x, y)
        return self

    def Z(self):
        self.p.close(); return self

    def done(self) -> Path:
        return simplify(self.p)


def simplify(p: Path) -> Path:
    q = Path(); q.addPath(p); q.convertConicsToQuads(TOL)
    q.simplify(fix_winding=True)
    return q


def union(*ps: Path) -> Path:
    out = simplify(ps[0])
    for p in ps[1:]:
        out = pathops.op(out, p, PathOp.UNION, fix_winding=True)
    return out


def diff(a: Path, b: Path) -> Path:
    return pathops.op(a, b, PathOp.DIFFERENCE, fix_winding=True)


def inter(a: Path, b: Path) -> Path:
    return pathops.op(a, b, PathOp.INTERSECTION, fix_winding=True)


def offset(p: Path, d: float) -> Path:
    """Grow p by d with round joins: Inkscape's Offset path effect, round."""
    if d <= 0:
        return p
    s = Path(); s.addPath(p)
    s.stroke(2 * d, LineCap.ROUND_CAP, LineJoin.ROUND_JOIN, 4)
    s.convertConicsToQuads(TOL)
    return union(p, s)


def rect(x0, y0, x1, y1) -> Path:
    return P().M(x0, y0).L(x1, y0).L(x1, y1).L(x0, y1).Z().done()


def poly(pts) -> Path:
    b = P().M(*pts[0])
    for q in pts[1:]:
        b.L(*q)
    return b.Z().done()


def circle(cx, cy, r) -> Path:
    return (P().M(cx + r, cy).A(r, cx, cy + r).A(r, cx - r, cy).A(r, cx, cy - r)
            .A(r, cx + r, cy).Z().done())


def ellipse(cx, cy, rx, ry) -> Path:
    """Four cubic quadrants, so an ellipse stays four clean nodes through the booleans."""
    k = 0.5522847498
    kx, ky = k * rx, k * ry
    return (P().M(cx + rx, cy)
            .C(cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry)
            .C(cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy)
            .C(cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry)
            .C(cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy).Z().done())


def rrect(x0, y0, x1, y1, r) -> Path:
    r = min(r, (x1 - x0) / 2, (y1 - y0) / 2)
    return (P().M(x0 + r, y0).L(x1 - r, y0).A(r, x1, y0 + r).L(x1, y1 - r).A(r, x1 - r, y1)
            .L(x0 + r, y1).A(r, x0, y1 - r).L(x0, y0 + r).A(r, x0 + r, y0).Z().done())


def annulus(cx, cy, r0, r1) -> Path:
    return diff(circle(cx, cy, r1), circle(cx, cy, r0))


def affine(p: Path, a=1, b=0, c=0, d=1, e=0, f=0) -> Path:
    q = Path(); q.addPath(p)
    return simplify(q.transform(a, b, c, d, e, f))


def mirror_x(p: Path) -> Path:
    return affine(p, -1, 0, 0, 1, 0, 0)


def sym(p: Path) -> Path:
    """A right-half drawing joined to its mirror across the axis."""
    return union(p, mirror_x(p))


def rotate(p: Path, deg: float, cx: float, cy: float) -> Path:
    t = math.radians(deg); co, si = math.cos(t), math.sin(t)
    return affine(p, co, si, -si, co, cx - co * cx + si * cy, cy - si * cx - co * cy)


# ===========================================================================
# Topology: flattening for bookkeeping, outer contours with their holes
# ===========================================================================

def _expand_implied(segs):
    """Rewrite closed all-off-curve quadratic contours (qCurveTo ending in None)."""
    out = []
    for verb, pts in segs:
        if verb == "qCurveTo" and pts[-1] is None:
            offs = list(pts[:-1])
            start = ((offs[-1][0] + offs[0][0]) / 2, (offs[-1][1] + offs[0][1]) / 2)
            out += [("moveTo", (start,)), ("qCurveTo", tuple(offs) + (start,))]
        else:
            out.append((verb, pts))
    return out


def _bez(pts, t):
    n = len(pts) - 1
    x = y = 0.0
    for i, (px, py) in enumerate(pts):
        w = math.comb(n, i) * (1 - t) ** (n - i) * t ** i
        x += w * px; y += w * py
    return x, y


def _ring(contour: Path):
    ring, cur = [], None
    for verb, pts in _expand_implied(list(contour.segments)):
        if verb == "moveTo":
            cur = pts[0]; ring.append(cur)
        elif verb == "lineTo":
            cur = pts[0]; ring.append(cur)
        elif verb == "qCurveTo":
            offs, end = list(pts[:-1]), pts[-1]
            for i, c in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((c[0] + offs[i + 1][0]) / 2, (c[1] + offs[i + 1][1]) / 2)
                ring += [_bez((cur, c, nxt), k / 10) for k in range(1, 11)]
                cur = nxt
        elif verb == "curveTo":
            ring += [_bez((cur,) + tuple(pts), k / 16) for k in range(1, 17)]
            cur = pts[-1]
    return ring


def components(p: Path):
    """Each outer contour with the holes directly inside it: [(Path, shapely Polygon)]."""
    cons = list(p.contours)
    polys = []
    for c in cons:
        pg = Polygon(_ring(c))
        polys.append(pg if pg.is_valid else pg.buffer(0))
    n = len(cons)
    depth, parent = [0] * n, [None] * n
    for i in range(n):
        rp = polys[i].representative_point()
        for j in range(n):
            if i != j and polys[j].area > polys[i].area and polys[j].contains(rp):
                depth[i] += 1
                if parent[i] is None or polys[j].area < polys[parent[i]].area:
                    parent[i] = j
    groups = {i: [i] for i in range(n) if depth[i] % 2 == 0}
    for i in range(n):
        if depth[i] % 2 == 1 and parent[i] in groups:
            groups[parent[i]].append(i)
    out = []
    for k, idx in groups.items():
        q = Path()
        for i in idx:
            q.addPath(cons[i])
        shp = polys[k]
        for i in idx[1:]:
            shp = shp.difference(polys[i])
        out.append((q, shp))
    return out


def drop_specks(p: Path, min_area: float = 6.0) -> Path:
    """Remove boolean leftovers too small to be drawing."""
    out = Path()
    for q, shp in components(p):
        if shp.area >= min_area:
            out.addPath(q)
    return out


# ===========================================================================
# Path data: lines merged, quadratic runs on one circle written as arcs
# ===========================================================================

def fmt(v: float) -> str:
    s = f"{v:.3f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def _circle3(a, b, c):
    (ax, ay), (bx, by), (cx, cy) = a, b, c
    d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    if abs(d) < 1e-9:
        return None
    a2, b2, c2 = ax * ax + ay * ay, bx * bx + by * by, cx * cx + cy * cy
    ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d
    uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d
    return ux, uy, math.hypot(ax - ux, ay - uy)


def _ops(segs):
    """A contour as primitive ops: ('L', p0, p1), ('Q', p0, c, p1), ('C', p0, c1, c2, p1)."""
    ops, start, cur = [], None, None
    for verb, pts in _expand_implied(segs):
        if verb == "moveTo":
            start = cur = pts[0]
        elif verb == "lineTo":
            ops.append(("L", cur, pts[0])); cur = pts[0]
        elif verb == "qCurveTo":
            offs, end = list(pts[:-1]), pts[-1]
            for i, c in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((c[0] + offs[i + 1][0]) / 2, (c[1] + offs[i + 1][1]) / 2)
                ops.append(("Q", cur, c, nxt)); cur = nxt
        elif verb == "curveTo":
            ops.append(("C", cur, pts[0], pts[1], pts[2])); cur = pts[2]
    return start, ops


def _on_circle(op, circ):
    ux, uy, r = circ
    pts = [op[1], op[3]] + [_bez((op[1], op[2], op[3]), t) for t in (0.25, 0.5, 0.75)]
    return all(abs(math.hypot(x - ux, y - uy) - r) <= ARC_TOL for x, y in pts)


def contour_d(segs) -> str:
    start, ops = _ops(segs)
    out = [f"M {fmt(start[0])},{fmt(start[1])}"]
    i = 0
    while i < len(ops):
        op = ops[i]
        if op[0] == "L":
            p0, p1, j = op[1], op[2], i + 1
            while j < len(ops) and ops[j][0] == "L":
                q1 = ops[j][2]
                cross = (p1[0] - p0[0]) * (q1[1] - p0[1]) - (p1[1] - p0[1]) * (q1[0] - p0[0])
                if abs(cross) / (math.hypot(q1[0] - p0[0], q1[1] - p0[1]) or 1) > 0.01:
                    break
                p1, j = q1, j + 1
            out.append(f"L {fmt(p1[0])},{fmt(p1[1])}")
            i = j
        elif op[0] == "Q":
            j, circ, last = i, None, None
            while j < len(ops) and ops[j][0] == "Q":
                run = ops[i:j + 1]
                pts = [run[0][1]] + [o[3] for o in run]
                if len(pts) >= 4:
                    c3 = _circle3(pts[0], pts[len(pts) // 3], pts[(2 * len(pts)) // 3])
                else:
                    mid = _bez((run[-1][1], run[-1][2], run[-1][3]), 0.5)
                    c3 = _circle3(pts[0], mid if len(pts) == 2 else pts[1], pts[-1])
                if c3 is None or c3[2] > 1e5 or not all(_on_circle(o, c3) for o in run):
                    break
                circ, last, j = c3, j, j + 1
            if circ is None:
                out.append(f"Q {fmt(op[2][0])},{fmt(op[2][1])} {fmt(op[3][0])},{fmt(op[3][1])}")
                i += 1
                continue
            run = ops[i:last + 1]
            ux, uy, r = circ
            tot = sum(((math.atan2(o[3][1] - uy, o[3][0] - ux) - math.atan2(o[1][1] - uy, o[1][0] - ux)
                        + math.pi) % (2 * math.pi) - math.pi) for o in run)
            pieces = max(1, math.ceil(abs(tot) / math.radians(170)))
            a0 = math.atan2(run[0][1][1] - uy, run[0][1][0] - ux)
            for k in range(1, pieces + 1):
                e = run[-1][3] if k == pieces else (ux + r * math.cos(a0 + tot * k / pieces),
                                                    uy + r * math.sin(a0 + tot * k / pieces))
                out.append(f"A {fmt(r)},{fmt(r)} 0 0 {1 if tot > 0 else 0} {fmt(e[0])},{fmt(e[1])}")
            i = last + 1
        else:
            out.append("C " + " ".join(f"{fmt(q[0])},{fmt(q[1])}" for q in op[2:]))
            i += 1
    if len(out) > 2 and out[-1] == f"L {fmt(start[0])},{fmt(start[1])}":
        out.pop()
    return " ".join(out + ["Z"])


def path_d(p: Path) -> str:
    return " ".join(contour_d(list(c.segments)) for c in p.contours if list(c.segments))


# ===========================================================================
# Palette: Dennis's own stop sets, one gradient per meaning
# ===========================================================================

PALETTE = {
    # castle-concept.svg / pawn-and-castle.svg
    "stone-face":   [(0, "#c3a589"), (0.247, "#d9bb9d"), (0.501, "#f3dbc1"), (0.75, "#d5b699"), (1, "#c5a78c")],
    "stone-tier":   [(0, "#c8a98c"), (0.25, "#e1c2a3"), (0.5, "#ebcca9"), (0.75, "#e2c4a6"), (1, "#c9aa8e")],
    "stone-crown":  [(0, "#c8a98c"), (0.25, "#e7cdb2"), (0.5, "#f5dabd"), (0.75, "#e7ccb1"), (1, "#cbac8e")],
    "stone-shadow": [(0, "#816247"), (0.25, "#b09073"), (0.5, "#cba984"), (0.75, "#cba987"), (1, "#c5a485")],
    "stone-shade":  [(0, "#8f6942"), (1, "#dfc8ae")],
    "stone-lit":    [(0, "#d9bfa4"), (1, "#eddcc6")],
    "recess-deep":  [(0, "#745437"), (0.247, "#a1794d"), (0.5, "#b78a56"), (1, "#cc9a5d")],
    "glow-slit":    [(0, "#f89e25"), (0.25, "#fec03c"), (0.5, "#fee15a"), (0.75, "#fefcb7"), (1, "#fcfcd0")],
    "gold-band":    [(0, "#de9b3f"), (0.5, "#fee181"), (1, "#dd942c")],
    "orb-glass":    [(0, "#e4c7a6"), (0.5, "#e1bf93"), (1, "#fdfcc4")],
    # knight-piece-pillar-section.svg, top dark under the overhang
    "flute-shadow": [(0, "#523c2b"), (0.5, "#a48970"), (1, "#aa8f74")],
    "flute-soft":   [(0, "#a2876e"), (0.099, "#b39980"), (0.24, "#cdb49c"), (0.5, "#d3bca4"), (1, "#d3bda5")],
    "flute-warm":   [(0, "#816751"), (0.109, "#977c64"), (0.25, "#ac9178"), (0.356, "#bfa48b"),
                     (0.5, "#cbb199"), (0.75, "#d1b89f"), (1, "#d2b99f")],
    "flute-bright": [(0, "#9a7f68"), (0.06, "#a58a72"), (0.12, "#bca189"), (0.25, "#dec8b2"), (0.386, "#e2ceba"),
                     (0.5, "#e3d0bb"), (0.617, "#e5d2bd"), (0.75, "#e4d0bb"), (1, "#e1ccb6")],
    "flute-mid":    [(0, "#7a624c"), (0.066, "#79624c"), (0.129, "#a48971"), (0.25, "#ccb39a"),
                     (0.376, "#d2baa2"), (0.5, "#d6bfa7"), (1, "#d6bfa7")],
    "flute-dusk":   [(0, "#6c5541"), (0.129, "#826953"), (0.25, "#a1866e"), (0.37, "#a58a72"),
                     (0.5, "#b3987f"), (0.75, "#bca188"), (1, "#ba9f85")],
    "flute-divider": [(0, "#21140a"), (0.109, "#3a291b"), (0.25, "#69543f"), (0.376, "#89705a"),
                      (0.5, "#8d735e"), (0.75, "#9b8169"), (1, "#9d836a")],
    # new for this set: the bishop's petals lit twice, the orb's catch-light
    "stone-twin":   [(0, "#b79a7e"), (0.24, "#ecd5bb"), (0.42, "#d2b598"), (0.5, "#c9ab8e"),
                     (0.58, "#d8bc9f"), (0.76, "#f4ddc3"), (1, "#c7a98c")],
    "highlight":    [(0, "#ffffff", 0.95), (1, "#ffffff", 0)],
}
BAND = "#f3dbc1"   # the castle's arch band, flat
INK = "#000000"    # the outline and the face marks


@dataclass
class Fill:
    kind: str                # flat | lin | rad
    key: str                 # palette key, or a hex for flat
    dir: str = "h"           # lin: h left to right, hl right to left, v top down, vu bottom up
    span: str = "cell"       # lin: across the whole cell, or each split part on its own
    at: tuple | None = None  # rad: (cx, cy, r) in piece coordinates


def flat(h):
    return Fill("flat", h)


def lin(key, dir="h", span="cell"):
    return Fill("lin", key, dir, span)


def rad(key, cx, cy, r):
    return Fill("rad", key, at=(cx, cy, r))


# ===========================================================================
# The cloisonne compiler
# ===========================================================================

@dataclass
class Flutes:
    xs: list           # divider centre lines, piece coordinates
    w: float           # divider width; the knight pillar's dividers are 5.37
    fills: list        # palette keys cycled across the flutes, left to right
    divider: str = "flute-divider"


@dataclass
class Cell:
    id: str
    shape: Path
    fill: object       # Fill, {part name: Fill}, or None for a void
    group: tuple
    z: float           # paint priority, higher in front
    parts: list | None = None
    sort: object = "x"
    gap: float = GAP
    clip: Path | None = None
    flutes: Flutes | None = None
    final: Path | None = None


@dataclass
class Extra:
    """A mark riding on a cell with no outline of its own: face marks, catch-lights."""
    id: str
    shape: Path
    fill: Fill
    on: str


@dataclass
class Piece:
    name: str
    cells: list = field(default_factory=list)
    extras: list = field(default_factory=list)

    def cell(self, id, shape, fill, group, z, **kw):
        c = Cell(id=id, shape=shape, fill=fill, group=tuple(group), z=z, **kw)
        self.cells.append(c)
        return c

    def extra(self, id, shape, fill, on):
        self.extras.append(Extra(id, shape, fill, on))


def compile_cells(cells):
    """Front to back, each cell loses whatever the cells in front of it claim,
    grown by their gap. A void (fill None) carves the cells behind it exactly,
    adds nothing to the silhouette, and so leaves a see-through hole edged by
    its neighbours' outline. Returns the outline: silhouette minus every cell."""
    blocker = sil = None
    finals = []
    for c in sorted(cells, key=lambda c: -c.z):
        shp = c.shape if c.clip is None else inter(c.shape, c.clip)
        if blocker is not None:
            shp = diff(shp, blocker)
        shp = drop_specks(shp)
        c.final = shp
        grown = shp if c.fill is None else offset(shp, c.gap)
        blocker = grown if blocker is None else union(blocker, grown)
        if c.fill is not None:
            sil = grown if sil is None else union(sil, grown)
            finals.append(shp)
    return diff(sil, union(*finals))


def compile_piece(pc: Piece):
    """Records (group, id, d, fill, gradient box) in paint order, plus the page size and shift."""
    outline = compile_cells(pc.cells)
    x0, y0, x1, y1 = outline.bounds
    dx, dy = -x0, -y0
    T = lambda p: affine(p, 1, 0, 0, 1, dx, dy)
    top = (f"{pc.name}-piece",)
    recs = [(top, f"{pc.name}-outline", path_d(T(outline)), flat(INK), None)]
    for c in pc.cells:
        if c.fill is None:
            continue
        fin = T(c.final)
        if c.flutes is not None:
            recs += _flute_records(c, fin, dx)
            continue
        comps = components(fin)
        if callable(c.sort):
            comps.sort(key=lambda t: c.sort(t[1].centroid.x - dx, t[1].centroid.y - dy))
        elif c.sort == "y":
            comps.sort(key=lambda t: (round(t[1].centroid.y, 1), t[1].centroid.x))
        else:
            comps.sort(key=lambda t: (round(t[1].centroid.x, 1), t[1].centroid.y))
        names = c.parts if c.parts is not None else (
            [None] if len(comps) == 1 else ["left", "right"] if len(comps) == 2
            else [f"{i:02d}" for i in range(1, len(comps) + 1)])
        if len(names) != len(comps):
            raise ValueError(f"{c.id}: expected {len(names)} parts, the outline cut {len(comps)}")
        for (q, _), nm in zip(comps, names):
            f = c.fill.get(nm, next(iter(c.fill.values()))) if isinstance(c.fill, dict) else c.fill
            recs.append((c.group, c.id if nm is None else f"{c.id}-{nm}", path_d(q), f,
                         fin.bounds if f.span == "cell" else q.bounds))
    for e in pc.extras:
        host = next(c for c in pc.cells if c.id == e.on)
        shp = T(e.shape)
        f = e.fill if e.fill.kind != "rad" else Fill("rad", e.fill.key, at=(e.fill.at[0] + dx, e.fill.at[1] + dy, e.fill.at[2]))
        recs.append((host.group, e.id, path_d(shp), f, shp.bounds))
    return recs, (x1 - x0, y1 - y0)


def _flute_records(c: Cell, fin: Path, dx: float):
    """Cut a compiled cell into flutes and thin dividers that touch with no black gap."""
    fl = c.flutes
    x0, y0, x1, y1 = fin.bounds
    edges = [x0 - 1] + [x + dx for x in fl.xs] + [x1 + 1]
    recs, k = [], 0
    for i in range(len(edges) - 1):
        a = edges[i] + (fl.w / 2 if i > 0 else 0)
        b = edges[i + 1] - (fl.w / 2 if i < len(edges) - 2 else 0)
        flute = drop_specks(inter(fin, rect(a, y0 - 1, b, y1 + 1)))
        if flute.area > 1:
            k += 1
            recs.append((c.group, f"{c.id}-flute-{k:02d}", path_d(flute),
                         lin(fl.fills[(k - 1) % len(fl.fills)], "v", "part"), flute.bounds))
        if i < len(edges) - 2:
            xm = edges[i + 1]
            dv = drop_specks(inter(fin, rect(xm - fl.w / 2, y0 - 1, xm + fl.w / 2, y1 + 1)))
            if dv.area > 1:
                recs.append((c.group, f"{c.id}-divider-{i + 1:02d}", path_d(dv),
                             lin(fl.divider, "v", "part"), dv.bounds))
    return recs


# ===========================================================================
# Shared parts: the castle's plinth, brush marks, rays
# ===========================================================================

LOWER_H, UPPER_H = 156.0, 168.0   # the castle's tier cells
BAND_RO, BAND_RI = 124.0, 86.0    # the arch band's outer and inner radius
SLIT_HW = 26.0                    # half the glowing slit


def plinth(pc: Piece, lower_hw: float, upper_hw: float) -> float:
    """The castle's two-tier plinth with its arch band and glowing door; returns the upper tier's top."""
    p = pc.name
    yb = -GAP
    lower_top = yb - LOWER_H
    upper_bot = lower_top - GAP
    upper_top = upper_bot - UPPER_H
    yc = lower_top + 8
    grp = (f"{p}-piece", f"{p}-plinth")
    door = grp + (f"{p}-plinth-door",)
    arch_o = union(circle(0, yc, BAND_RO), rect(-BAND_RO, yc, BAND_RO, yb))
    arch_i = union(circle(0, yc, BAND_RI), rect(-BAND_RI, yc, BAND_RI, yb))
    head = yc - BAND_RI + 12 + SLIT_HW
    pc.cell(f"{p}-plinth-door-glow", union(circle(0, head, SLIT_HW), rect(-SLIT_HW, head, SLIT_HW, yb)),
            lin("glow-slit", "v"), door, 40)
    pc.cell(f"{p}-plinth-arch-band", diff(arch_o, arch_i), flat(BAND), grp, 36)
    pc.cell(f"{p}-plinth-door-niche", arch_i, lin("stone-shadow", "v", "part"), door, 34)
    pc.cell(f"{p}-plinth-tier-upper", rect(-upper_hw, upper_top, upper_hw, upper_bot), lin("stone-tier"), grp, 20)
    pc.cell(f"{p}-plinth-tier-lower", rect(-lower_hw, lower_top, lower_hw, yb), lin("stone-face"), grp, 18)
    return upper_top


def lens(a, b, c1, c2, w) -> Path:
    """A brush mark from a to b: two cubics bowing w/2 either side of the curve a-c1-c2-b."""
    nx, ny = -(b[1] - a[1]), (b[0] - a[0])
    n = math.hypot(nx, ny) or 1
    nx, ny = nx / n * w / 2, ny / n * w / 2
    return (P().M(*a).C(c1[0] + nx, c1[1] + ny, c2[0] + nx, c2[1] + ny, *b)
            .C(c2[0] - nx, c2[1] - ny, c1[0] - nx, c1[1] - ny, *a).Z().done())


def ray(cx, cy, deg, r0, r1, w0, w1) -> Path:
    """A tapered spike along bearing deg (0 straight up, clockwise), round-tipped."""
    t = math.radians(deg)
    ux, uy, px, py = math.sin(t), -math.cos(t), math.cos(t), math.sin(t)
    pts = [(cx + ux * r0 + px * w0 / 2, cy + uy * r0 + py * w0 / 2),
           (cx + ux * r1 + px * w1 / 2, cy + uy * r1 + py * w1 / 2),
           (cx + ux * r1 - px * w1 / 2, cy + uy * r1 - py * w1 / 2),
           (cx + ux * r0 - px * w0 / 2, cy + uy * r0 - py * w0 / 2)]
    return union(poly(pts), circle(cx + ux * r1, cy + uy * r1, w1 / 2))


def face_marks(pc: Piece, on: str, eye_y, brow_y, nose_y, mouth_y, s=1.0, stern=0.0):
    """Closed eyes, brows, the nose's bridge and base, and the lips, in ink on the face cell.
    stern lowers the inner brows, thickens them and flattens the mouth (the king)."""
    m = {
        "brow-left": lens((-90 * s, brow_y + 10 - 14 * stern), (-18 * s, brow_y + 2 + 10 * stern),
                          (-70 * s, brow_y - 10 + 6 * stern), (-40 * s, brow_y - 12 + 10 * stern), 9 + 3 * stern),
        "eye-left": lens((-76 * s, eye_y - 3), (-20 * s, eye_y - 3), (-60 * s, eye_y + 11), (-36 * s, eye_y + 11), 9),
        "nose-bridge": lens((-14 * s, eye_y - 16), (-24 * s, nose_y - 12), (-10 * s, eye_y + 20),
                            (-22 * s, nose_y - 40), 6),
        "nose": lens((-28 * s, nose_y - 6), (28 * s, nose_y - 6), (-14 * s, nose_y + 8), (14 * s, nose_y + 8), 8),
        "lips": lens((-40 * s, mouth_y + 2 * stern), (40 * s, mouth_y + 2 * stern),
                     (-16 * s, mouth_y + 4 - 4 * stern), (16 * s, mouth_y + 4 - 4 * stern), 8),
        "lip-lower": lens((-22 * s, mouth_y + 20), (22 * s, mouth_y + 20), (-9 * s, mouth_y + 29),
                          (9 * s, mouth_y + 29), 6),
    }
    m["brow-right"], m["eye-right"] = mirror_x(m["brow-left"]), mirror_x(m["eye-left"])
    for k in ("brow-left", "brow-right", "eye-left", "eye-right", "nose-bridge", "nose", "lips", "lip-lower"):
        pc.extra(f"{pc.name}-head-face-{k}", m[k], flat(INK), on)


# ===========================================================================
# The pieces
# ===========================================================================

def bishop() -> Piece:
    pc, p = Piece("bishop"), "bishop"
    body_bot = plinth(pc, 263.5, 232.5) - GAP
    body_top = -905.0
    g_body, g_mitre, g_staff = (f"{p}-piece", f"{p}-body"), (f"{p}-piece", f"{p}-mitre"), (f"{p}-piece", f"{p}-staff")
    g_orb = g_mitre + (f"{p}-mitre-orb",)

    # body: a tapered block, a centre strip standing proud of two side faces
    pc.cell(f"{p}-body-face", poly([(-207, body_bot), (207, body_bot), (140, body_top), (-140, body_top)]),
            {"left": lin("stone-shade", "h", "part"), "right": lin("stone-lit", "hl", "part")}, g_body, 50,
            parts=["left", "right"])
    pc.cell(f"{p}-body-strip", poly([(-98, body_bot), (98, body_bot), (86, body_top), (-86, body_top)]),
            lin("stone-crown"), g_body, 60)

    # mitre: two petals fitted to the reference silhouette (max error 2.2 px),
    # joined over the tip and split at the neck by the staff
    oy = -1205.0
    half = (P().M(0, -1607).C(53.6, -1402.3, 209, -1362.6, 209, -1220)
            .C(209, -1096.2, 104.3, -1091.1, 84, -943).L(84, body_top - GAP).L(0, body_top - GAP).Z().done())
    pc.cell(f"{p}-mitre-petals", sym(half), lin("stone-twin"), g_mitre, 70)
    # the petals' inner side faces: a keyhole from under the tip, round the orb, to the neck
    bev = (P().M(0, -1522).C(30, -1500, 66, -1450, 72, -1400).C(80, -1340, 96, -1300, 112, -1262)
           .C(122, -1238, 122, -1172, 112, -1150).C(90, -1100, 56, -1040, 0, -962).Z().done())
    pc.cell(f"{p}-mitre-petal-inner", sym(bev),
            {"upper-left": lin("stone-shadow", "v", "part"), "upper-right": lin("stone-shadow", "v", "part"),
             "lower-left": lin("recess-deep", "vu", "part"), "lower-right": lin("recess-deep", "vu", "part")},
            g_mitre, 75, parts=["upper-left", "upper-right", "lower-left", "lower-right"], sort="y")
    # the see-through slot above the orb: a real hole
    slot = (P().M(0, -1470).C(22, -1440, 46, -1400, 56, -1360).C(66, -1320, 76, -1280, 76, -1240)
            .L(76, oy).L(0, oy).Z().done())
    pc.cell(f"{p}-mitre-slot", sym(slot), None, g_mitre, 85, gap=0)

    # the orb, belted in gold to the petals' inner faces
    pc.cell(f"{p}-mitre-orb-glass", circle(0, oy, 76), lin("orb-glass", "v"), g_orb, 95)
    pc.cell(f"{p}-mitre-orb-band", rrect(-124, oy - 11, 124, oy + 11, 11), lin("gold-band"), g_orb, 100)
    pc.extra(f"{p}-mitre-orb-highlight", rotate(ellipse(26, oy - 42, 22, 12), -28, 26, oy - 42),
             rad("highlight", 26, oy - 42, 24), f"{p}-mitre-orb-glass")

    # the staff: one gold rod from under the tip to a disc on the strip
    pc.cell(f"{p}-staff-rod", union(circle(0, -1505, 9), rect(-9, -1505, 9, -470)), lin("gold-band"),
            g_staff, 90, parts=["upper", "lower"], sort="y")
    pc.cell(f"{p}-staff-disc", circle(0, -455, 40), lin("gold-band"), g_staff, 92)
    return pc


def queen() -> Piece:
    pc, p = Piece("queen"), "queen"
    body_bot = plinth(pc, 305.5, 290.0) - GAP
    g_robe, g_head, g_halo = (f"{p}-piece", f"{p}-robe"), (f"{p}-piece", f"{p}-head"), (f"{p}-piece", f"{p}-halo")
    g_crown = g_head + (f"{p}-head-crown",)

    # robe: the body block, and the wrap laid over it
    body = sym(P().M(0, body_bot).L(281, body_bot).C(272, -600, 258, -900, 250, -1090)
               .C(248, -1122, 234, -1140, 205, -1146).L(80, -1170).L(0, -1172).Z().done())
    # sash: a broad band over the left shoulder, down across to the right hip
    sash = (P().M(-300, -1185).C(-120, -1150, 110, -1020, 300, -905)
            .L(300, -735).C(120, -850, -110, -985, -300, -1000).Z().done())
    pc.cell(f"{p}-robe-sash", sash, lin("stone-crown"), g_robe, 66, clip=body)
    # drape: the hanging end of the wrap down the right side, tucked under the sash
    pc.cell(f"{p}-robe-drape", poly([(178, body_bot), (300, body_bot), (300, -870), (210, -870)]),
            lin("stone-lit", "hl"), g_robe, 64, clip=body)
    # pleats: the chiton under the hem, fluted like the knight's pillar
    under = (P().M(-300, -372).C(-130, -500, 60, -700, 300, -860).L(300, body_bot + 20)
             .L(-300, body_bot + 20).Z().done())
    pc.cell(f"{p}-robe-pleats", under, lin("flute-soft", "v"), g_robe, 62, clip=body,
            flutes=Flutes(xs=[-196, -118, -52, 12, 78, 138], w=6,
                          fills=["flute-shadow", "flute-soft", "flute-warm", "flute-bright",
                                 "flute-mid", "flute-dusk", "flute-soft"]))
    # a fold facet down the left side of the wrap's fall, turned from the light
    pc.cell(f"{p}-robe-fold", poly([(-112, -1010), (-300, -1010), (-300, -372)]), lin("stone-shade"),
            g_robe, 60, clip=body)
    # what is left of the block: the fall of the wrap on the left, the right shoulder
    pc.cell(f"{p}-robe-wrap", body, {"left": lin("stone-tier", "h", "part"), "right": lin("stone-lit", "hl", "part")},
            g_robe, 50, parts=["left", "right"])

    # head: neck, face, ears and the hair at the temples
    pc.cell(f"{p}-head-neck", sym(P().M(0, -1330).L(60, -1330).C(60, -1250, 66, -1212, 112, -1176)
                                  .L(0, -1160).Z().done()), lin("stone-face"), g_head, 80)
    pc.cell(f"{p}-head-face", sym(P().M(0, -1530).L(98, -1530).C(104, -1470, 104, -1420, 97, -1385)
                                  .C(90, -1350, 72, -1324, 46, -1308).C(30, -1299, 14, -1296, 0, -1296)
                                  .Z().done()), lin("stone-face"), g_head, 90)
    ear = ellipse(112, -1378, 17, 46)
    pc.cell(f"{p}-head-ear", union(ear, mirror_x(ear)), lin("stone-shade", "h", "part"), g_head, 88)
    pc.cell(f"{p}-head-hair", sym(P().M(0, -1490).L(100, -1490).C(128, -1480, 142, -1450, 134, -1404)
                                  .C(120, -1396, 100, -1398, 0, -1398).Z().done()),
            lin("stone-shadow", "v"), g_head, 85, parts=["left", "right"])
    face_marks(pc, f"{p}-head-face", eye_y=-1440, brow_y=-1468, nose_y=-1386, mouth_y=-1350)

    # crown: a stone diadem following the brow, gold points standing on it
    pc.cell(f"{p}-head-crown-band", (P().M(-112, -1500).C(-60, -1548, 60, -1548, 112, -1500)
                                     .L(112, -1468).C(60, -1514, -60, -1514, -112, -1468).Z().done()),
            lin("stone-crown"), g_crown, 100)
    pts = [rect(-17, -1612, 17, -1530)]
    for x, tip, w in [(-100, -1594, 26), (-58, -1632, 30), (58, -1632, 30), (100, -1594, 26)]:
        base = -1500 - 44 * (1 - (x / 112) ** 2) + 18
        pts.append(poly([(x - w / 2, base), (x + w / 2, base), (x, tip)]))
    pc.cell(f"{p}-head-crown-point", union(*pts), lin("gold-band", "h", "part"), g_crown, 98,
            parts=["01", "02", "03", "04", "05"])

    # halo: the ring, and sun rays that rise from the crown and pass behind it
    hx, hy, rx, ry = 0.0, -1459.0, 0.0, -1513.0
    pc.cell(f"{p}-halo-ring", annulus(hx, hy, 227, 248), lin("gold-band"), g_halo, 70)
    for i, (deg, r1) in enumerate([(-90, 335), (-62, 312), (-35, 297), (0, 304), (35, 297), (62, 312), (90, 335)], 1):
        pc.cell(f"{p}-halo-ray-{i:02d}", ray(rx, ry, deg, 110, r1, 24, 12),
                {"inner": lin("glow-slit", "v", "part"), "outer": lin("gold-band", "h", "part")}, g_halo, 65,
                parts=["inner", "outer"], sort=lambda x, y: math.hypot(x - rx, y - ry))
    return pc


def king() -> Piece:
    pc, p = Piece("king"), "king"
    body_bot = plinth(pc, 341.0, 331.0) - GAP      # the block stands flush on the upper tier
    g_body, g_head, g_halo = (f"{p}-piece", f"{p}-body"), (f"{p}-piece", f"{p}-head"), (f"{p}-piece", f"{p}-halo")
    g_orb, g_crown = g_body + (f"{p}-body-orb",), g_head + (f"{p}-head-crown",)

    # body: an art-deco block, a chamfered inner panel, an arched niche holding
    # the ringed orb, and the glowing channel that runs down into the door
    pc.cell(f"{p}-body-block", poly([(-331, body_bot), (331, body_bot), (331, -1215), (256, -1290),
                                    (-256, -1290), (-331, -1215)]), lin("stone-tier"), g_body, 40)
    pc.cell(f"{p}-body-panel", poly([(-252, body_bot), (252, body_bot), (252, -1140), (192, -1200),
                                    (-192, -1200), (-252, -1140)]), lin("stone-face"), g_body, 45)
    pc.cell(f"{p}-body-niche", union(circle(0, -994, 146), rect(-146, -994, 146, body_bot)),
            lin("stone-shadow", "v"), g_body, 50, parts=["arch", "lower-left", "lower-right"],
            sort=lambda x, y: (0 if y < -900 else 1, x))
    oy, orr = -874.0, 172.0
    pc.cell(f"{p}-body-channel", rect(-66, oy, 66, body_bot), lin("recess-deep", "vu"), g_body, 55)
    pc.cell(f"{p}-body-channel-glow", rect(-36, oy, 36, body_bot), lin("glow-slit", "v"), g_body, 58)
    # the orb's ring, tipped 22 degrees: one gold band whose far half is cut
    # away where it passes behind the glass, so its ends stay whole
    ring = diff(ellipse(0, oy, 294, 56), ellipse(0, oy, 270, 33))
    near = inter(ring, rect(-400, oy, 400, oy + 100))
    far = diff(inter(ring, rect(-400, oy - 100, 400, oy)), circle(0, oy, orr))
    pc.cell(f"{p}-body-orb-ring", rotate(union(near, far), -22, 0, oy), lin("gold-band", "v"), g_orb, 100)
    pc.cell(f"{p}-body-orb-glass", circle(0, oy, orr), lin("orb-glass", "v"), g_orb, 95)
    pc.extra(f"{p}-body-orb-highlight", rotate(ellipse(56, oy - 100, 40, 21), -28, 56, oy - 100),
             rad("highlight", 56, oy - 100, 44), f"{p}-body-orb-glass")

    # head: long hair falling to the shoulders either side of the face and neck
    pc.cell(f"{p}-head-neck", rect(-62, -1500, 62, -1300), lin("stone-face"), g_head, 70)
    pc.cell(f"{p}-head-face", sym(P().M(0, -1662).L(92, -1662).C(98, -1610, 98, -1560, 92, -1535)
                                  .C(86, -1505, 74, -1484, 52, -1474).C(34, -1466, 16, -1464, 0, -1464)
                                  .Z().done()), lin("stone-face"), g_head, 90)
    ear = ellipse(100, -1560, 15, 40)
    pc.cell(f"{p}-head-ear", union(ear, mirror_x(ear)), lin("stone-shade", "h", "part"), g_head, 88)
    pc.cell(f"{p}-head-hair", sym(P().M(0, -1680).L(152, -1680).C(158, -1600, 134, -1420, 121, -1300)
                                  .L(0, -1300).Z().done()),
            {"left": lin("stone-shade", "h", "part"), "right": lin("stone-lit", "hl", "part")}, g_head, 65,
            parts=["left", "right"])
    face_marks(pc, f"{p}-head-face", eye_y=-1590, brow_y=-1616, nose_y=-1534, mouth_y=-1504, s=1.04, stern=1.0)

    # crown: a stone band, two crenellated turrets, the tower and its spire
    pc.cell(f"{p}-head-crown-band", (P().M(-165, -1712).L(165, -1712).L(165, -1668)
                                     .C(80, -1652, -80, -1652, -165, -1668).Z().done()),
            lin("stone-crown"), g_crown, 100)
    turret = poly([(110, -1722), (165, -1722), (165, -1812), (150, -1812), (150, -1782), (128, -1782),
                   (128, -1818), (110, -1818)])
    pc.cell(f"{p}-head-crown-turret", union(turret, mirror_x(turret)), lin("stone-tier", "h", "part"), g_crown, 100)
    pc.cell(f"{p}-head-crown-tower", rect(-50, -1858, 50, -1722), lin("stone-crown"), g_crown, 100)
    pc.cell(f"{p}-head-crown-tower-glow", rrect(-10, -1846, 10, -1734, 10), lin("glow-slit", "v"), g_crown, 104)
    pc.cell(f"{p}-head-crown-collar", rrect(-38, -1900, 38, -1868, 10), lin("gold-band"), g_crown, 100)
    pc.cell(f"{p}-head-crown-spire", poly([(-18, -1910), (18, -1910), (0, -2108)]), lin("stone-crown"), g_crown, 100)

    # halo: the ring, the horizon bar across it, rays rising behind the crown
    hx, hy = 0.0, -1675.0
    pc.cell(f"{p}-halo-ring", annulus(hx, hy, 342, 363), lin("gold-band"), g_halo, 60)
    pc.cell(f"{p}-halo-bar", rrect(-445, -1695, 445, -1677, 9), lin("gold-band", "v", "part"), g_halo, 62,
            parts=["left", "right"])
    for i, deg in enumerate([-60, -30, 30, 60], 1):
        pc.cell(f"{p}-halo-ray-{i:02d}", ray(hx, hy, deg, 150, 350, 22, 10), lin("glow-slit", "v", "part"),
                g_halo, 55)
    return pc


# ===========================================================================
# Documents
# ===========================================================================

DOCS = {
    "bishop": dict(
        description=(
            "The bishop of the tall MONOLITH concept set, drawn to stand beside Dennis's "
            "castle-concept.svg: a pen-nib mitre of two petals joined at the tip, a see-through "
            "slot above a glass orb belted in gold, and a gold staff running down a tapered body "
            "to a disc, on the castle's two-tier plinth with its glowing door. Same 10 px black "
            "outline, palette, scale and baseline as the castle."),
        features=[
            "Canvas cropped to the silhouette, 547 x 1617; the bottom edge is the castle's baseline",
            "bishop-mitre: the petals, their inner faces (upper pair in shadow, lower pair lit "
            "from the orb), and a real see-through slot above the orb",
            "bishop-mitre-orb: glass, gold band and catch-light; bishop-staff: rod in two lengths "
            "and the disc",
            "bishop-body: the centre strip and the left and right faces; bishop-plinth: the "
            "castle's tiers, arch band and door",
        ],
        keywords=["chess", "bishop", "MONOLITH", "concept set", "art deco", "mitre", "orb", "plinth"]),
    "queen": dict(
        description=(
            "The queen of the tall MONOLITH concept set, drawn to stand beside Dennis's "
            "castle-concept.svg: a serene head under a stone diadem with gold points, a gold halo "
            "crossed by seven sun rays, and a wrapped robe whose sash, drape and fold fall over a "
            "fluted chiton cut like the knight's pillar, on the castle's two-tier plinth."),
        features=[
            "Canvas cropped to the silhouette, 702 x 1833; the bottom edge is the castle's baseline",
            "queen-halo: the ring and rays 01 to 07 counted left to right, each split by the ring "
            "into an inner glow and an outer gold spike",
            "queen-head: neck, face with its ink marks, ears, hair, and queen-head-crown (band and "
            "points 01 to 05)",
            "queen-robe: sash, drape, fold, the wrap's two remaining panels, and the pleats as "
            "flutes 01 to 07 with dividers in the knight pillar's gradients",
        ],
        keywords=["chess", "queen", "MONOLITH", "concept set", "art deco", "halo", "crown", "robe"]),
    "king": dict(
        description=(
            "The king of the tall MONOLITH concept set, drawn to stand beside Dennis's "
            "castle-concept.svg: a stern head with long hair under a crenellated crown and spire, "
            "a gold halo with its horizon bar, and an art-deco block whose arched niche holds a "
            "ringed glass orb above a glowing channel that runs down into the plinth's door."),
        features=[
            "Canvas cropped to the silhouette, 910 x 2118 (the halo bar sets the width); the "
            "bottom edge is the castle's baseline",
            "king-halo: ring, horizon bar (left and right of the head) and rays 01 to 04",
            "king-head: neck, face with its ink marks, ears, hair, and king-head-crown (band, "
            "turrets, tower with its glow, collar, spire)",
            "king-body: block, chamfered panel, niche (arch and the two lower bays), channel and "
            "glow; king-body-orb: ring, glass and catch-light",
        ],
        keywords=["chess", "king", "MONOLITH", "concept set", "art deco", "halo", "crown", "orb"]),
}

ID_CONVENTION = (
    "component-subcomponent-panel: <piece>-<part>-<subpart>, nested groups for every unit "
    "(<piece>-piece holds the outline and the part groups). Halves the outline cuts apart take "
    "-left/-right, -upper/-lower, -inner/-outer or -NN counted left to right. Gradients: "
    "gradient-<palette key> holds the stops once; gradient-<element id> places them on one element.")


def build_document(pc: Piece) -> str:
    recs, (W, H) = compile_piece(pc)
    svg = ms.Svg()
    used = []

    def fill_ref(f: Fill, box, eid):
        if f.kind == "flat":
            return f.key
        if f.key not in used:
            used.append(f.key)
        gid = svg.ids.claim(f"gradient-{eid}")
        if f.kind == "lin":
            x0, y0, x1, y1 = box
            xa, ya, xb, yb = {"h": (x0, (y0 + y1) / 2, x1, (y0 + y1) / 2),
                              "hl": (x1, (y0 + y1) / 2, x0, (y0 + y1) / 2),
                              "v": ((x0 + x1) / 2, y0, (x0 + x1) / 2, y1),
                              "vu": ((x0 + x1) / 2, y1, (x0 + x1) / 2, y0)}[f.dir]
            svg.add_def(ms.Node("linearGradient", {
                "id": gid, "inkscape:collect": "always", "xlink:href": f"#gradient-{f.key}",
                "x1": fmt(xa), "y1": fmt(ya), "x2": fmt(xb), "y2": fmt(yb), "gradientUnits": "userSpaceOnUse"}))
        else:
            cx, cy, r = f.at
            svg.add_def(ms.Node("radialGradient", {
                "id": gid, "inkscape:collect": "always", "xlink:href": f"#gradient-{f.key}",
                "cx": fmt(cx), "cy": fmt(cy), "r": fmt(r), "gradientUnits": "userSpaceOnUse"}))
        return f"url(#{gid})"

    # group tree in first-appearance order, so the outline is the piece group's first child
    tree = {}
    order = []

    def node(path):
        if path not in tree:
            tree[path] = []
            if len(path) > 1:
                node(path[:-1])
                tree[path[:-1]].append(("g", path))
            else:
                order.append(path)
        return tree[path]

    for rec in recs:
        node(rec[0]).append(("el", rec))

    def emit(parent, path):
        grp = parent.g(path[-1])
        for kind, item in tree[path]:
            if kind == "g":
                emit(grp, item)
            else:
                _, eid, d, f, box = item
                grp.path(eid, d, style=f"fill:{fill_ref(f, box, eid)};fill-rule:evenodd;stroke:none")

    for root in order:
        emit(svg, root)
    # palette templates go first in <defs>, each stop with its own id
    templates = []
    for k in used:
        stops = [ms.stop(f"gradient-{k}-stop-{i + 1:02d}", s[0], s[1], s[2] if len(s) > 2 else 1.0)
                 for i, s in enumerate(PALETTE[k])]
        templates.append(ms.Node("linearGradient", {"id": svg.ids.claim(f"gradient-{k}"),
                                                     "inkscape:collect": "always"}, children=stops))
    svg.defs[:0] = templates

    meta = DOCS[pc.name]
    ms.AI_ACK = AI_ACK
    name = pc.name.capitalize()
    return ms.wrap_document(
        svg, title=f"{name} Concept (MONOLITH Edition - v1.0)", file_name=f"{pc.name}-concept.svg",
        rel_path=f"assets/{pc.name}-concept.svg", artifact_type="illustration", version=VERSION,
        date_mdy=DATE_MDY, date_iso=DATE_ISO, update_long=DATE_LONG, description=meta["description"],
        key_features=meta["features"] + [
            "Construction: one black outline compound (the silhouette minus every cell, even-odd) "
            "under gradient cells that sit in its holes, 10 px between every cell, as in the castle",
            "One flat layer: groups only, no Inkscape layers; every colour from the palette "
            "lifted from Dennis's pawn, castle and knight pillar",
        ],
        other_info=[
            "Measured off assets/models/chess-pieces-refrence-image.png at 3.85 px per reference "
            "pixel, the castle's scale, and set on the castle's plinth",
            "Part of the tall set for Inkscape and Blender; the 2D board set is a separate cut",
        ],
        keywords=meta["keywords"], width=W, height=H,
        changelog=[f"{VERSION} ({DATE_MDY}) [dendogg + {AI_ACK}] — First version, drawn when Dennis "
                   f"asked for the rest of the tall set after his castle and pawn: the {pc.name} "
                   "in the castle's grammar, on its plinth, at its scale."],
        id_convention=ID_CONVENTION,
        source_note=("Seeded by assets/generator/build_piece_concepts.py. Once Dennis takes the "
                     "drawing over in Inkscape this SVG is the source of record, and the generator "
                     "will not overwrite it unless told to with its force flag"))


def main():
    ap = argparse.ArgumentParser(description="Draw the bishop, queen and king concept SVGs.")
    ap.add_argument("--only", action="append", choices=["bishop", "queen", "king"])
    ap.add_argument("--out", default=ASSETS)
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    for name in a.only or ["bishop", "queen", "king"]:
        dest = os.path.join(a.out, f"{name}-concept.svg")
        if os.path.exists(dest) and not a.force:
            print(f"skip   {dest} (exists; it is Dennis's now, pass --force to overwrite)")
            continue
        doc = build_document(globals()[name]())
        with open(dest, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(doc)
        print(f"wrote  {dest}")


if __name__ == "__main__":
    main()
