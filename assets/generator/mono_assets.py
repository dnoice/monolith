#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH Asset Loader (MONOLITH Edition - v2.0)
    - File Name: mono_assets.py
    - Relative Path: assets/generator/mono_assets.py
    - Artifact Type: library
    - Version: 2.0.1
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 2.0.1 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] —
      load_conical() is now load_monolith_m(), building the M from
      monolith_m.py and its MONOLITH_M parameters, and the kit source is
      brand/monolith-brand-kit.svg: at Dennis's request the brand files
      dropped "conical" from their names while the logo is still being
      decided.
    - 2.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Rewired to
      the Conical Monolith system Dennis landed on: load_conical(n, layout)
      builds any tiled M straight from conical_m.py, and load_logo() and
      load_emblem() return the two official marks (the 4 x 4 M bare and
      with its twelve pieces). The loaders for the retired logo concepts
      and the old emblem are gone with the files. Pieces are now Piece
      objects whose parts keep Dennis's paint order; sides are named by
      their faces (White is boxwood-faced), as the page reads them.
      Palettes speak in tiles and mortar instead of squares. Moved from
      assets/mockups/generator to assets/generator.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      version: logo concepts, emblem, piece set and meter as literal path
      data with composed transforms.

✒ Description:
    The one place the MONOLITH generators get their drawings from. The
    piece set and the graphics meter are the hand-drawn sources, read as
    literal path data with every group transform composed into one matrix,
    so a stamped piece is the drawn nodes and never a re-derivation. The
    tiled M comes from the system in monolith_m.py:
    load_monolith_m(n, layout) returns its tiles and placed pieces as the
    same Elem and Piece objects, so a mock-up stamps the official emblem
    exactly as it stamps any other drawing. Every element carries a ROLE
    (tile-light, tile-dark, white-face, white-contour, black-face,
    black-contour, meter parts) instead of a colour, which is what lets one
    drawing be painted in several palettes.

✒ Key Features:
    - Transforms: parse_transform for translate, scale, rotate and matrix;
      tsr() for translate-then-scale; matrix_attr() writes the shortest
      exact SVG transform
    - load_pieces(): one piece of each kind per side from chess-pieces.svg
      in square-local coordinates; sides by faces (that file names its
      boxwood-contoured, ebony-faced set White; MONOLITH calls it Black)
    - load_monolith_m(n, layout, S): the tiled M as a Drawing; load_logo()
      and load_emblem() are the 4 x 4 bare and quartet marks
    - load_meter(): the graphics gauge's sectors, inner sectors, needle and
      pieces from graphics-meter-design-v1.2.svg
    - PALETTES: five role-to-colour palettes, Slate (as drawn) first
    - stamp_tiles() and stamp_piece(): paint a Drawing into a Group with a
      palette, a matrix and an id scheme, mortar width given in screen px

✒ Usage Instructions:
    from mono_assets import load_emblem, stamp_tiles, stamp_piece, PALETTES, fit
    dr = load_emblem()
    m = fit(dr, 100, 80, 440, 440)
    stamp_tiles(group, dr.squares, PALETTES["slate"], m, idfn=lambda t: f"mark-{t.name}", mortar_px=1)

✒ Other Important Information:
    - Dependencies: Python 3.10+, lxml, svgpathtools, numpy, shapely (the
      last through monolith_m)
    - Paths are relative to the assets folder (the parent of this one), so
      the folder can move with the project
    - The sources are never modified by this module
---------
"""

from __future__ import annotations

import math
import os
import re
from dataclasses import dataclass, field

import numpy as np
from lxml import etree
from svgpathtools import parse_path
from svgpathtools.path import transform as sp_transform

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, ".."))

# Every source the generators read, relative to assets/.
SOURCES = {
    "pieces": "chess-pieces.svg",
    "meter": "graphics-meter-design-v1.2.svg",
    "kit": "brand/monolith-brand-kit.svg",
    "logo": "monolith-logo.svg",          # written by monolith_m.py
    "emblem": "monolith-emblem.svg",      # written by monolith_m.py; built into the page
}

BOXWOOD, EBONY = "#decd87", "#1a1a1a"
KINDS = {"K": "king", "Q": "queen", "R": "rook", "B": "bishop", "N": "knight", "P": "pawn"}
CODES = {v: k for k, v in KINDS.items()}

# Palettes: roles to colours. 'ground' is the screen behind the drawing; tiles take
# tile-light where row + column is even and tile-dark otherwise; mortar is the grout
# stroke between tiles. Pieces are named by their faces: White is the light face.
PALETTES = {
    "slate": {
        "label": "Slate", "note": "as drawn: one slate, black mortar",
        "ground": "#17181c", "ground-2": "#1f2126", "ink": "#e8e6df", "ink-2": "#9a9b9f",
        "accent": "#d9b84a",
        "tile-light": "#6f8a91", "tile-dark": "#6f8a91", "mortar": "#000000",
        "white-face": BOXWOOD, "white-contour": EBONY,
        "black-face": EBONY, "black-contour": BOXWOOD,
    },
    "obsidian-gold": {
        "label": "Obsidian & Gold", "note": "the app's own dark chrome, gold on black glass",
        "ground": "#0b0b0d", "ground-2": "#141518", "ink": "#efe9d6", "ink-2": "#8d8a7e",
        "accent": "#d9b84a",
        "tile-light": "#2e2f36", "tile-dark": "#2e2f36", "mortar": "#070708",
        "white-face": "#d9b84a", "white-contour": "#0b0b0d",
        "black-face": "#0b0b0d", "black-contour": "#d9b84a",
    },
    "marble-verdigris": {
        "label": "Marble & Verdigris", "note": "the cathedral's marble with oxidised bronze",
        "ground": "#0e1614", "ground-2": "#15201c", "ink": "#ece7da", "ink-2": "#8da39a",
        "accent": "#c9a961",
        "tile-light": "#4f7268", "tile-dark": "#4f7268", "mortar": "#0b1210",
        "white-face": "#efe9dc", "white-contour": "#15201c",
        "black-face": "#15201c", "black-contour": "#efe9dc",
    },
    "oxblood-parchment": {
        "label": "Oxblood & Parchment", "note": "tournament felt and old paper",
        "ground": "#1a1113", "ground-2": "#241719", "ink": "#efe4cf", "ink-2": "#a8928a",
        "accent": "#d7a85b",
        "tile-light": "#7a2f36", "tile-dark": "#7a2f36", "mortar": "#1d0f11",
        "white-face": "#ead9bd", "white-contour": "#1d0f11",
        "black-face": "#1d0f11", "black-contour": "#ead9bd",
    },
    "glacier": {
        "label": "Glacier", "note": "the analyze workspace's cold blue, ice on steel",
        "ground": "#0f141a", "ground-2": "#161d26", "ink": "#e4ecf2", "ink-2": "#7f95a8",
        "accent": "#5fd3e0",
        "tile-light": "#3f5a70", "tile-dark": "#3f5a70", "mortar": "#0a1017",
        "white-face": "#f2f6f8", "white-contour": "#0c141c",
        "black-face": "#0c141c", "black-contour": "#f2f6f8",
    },
}


# ---------------------------------------------------------------------------
# Transforms
# ---------------------------------------------------------------------------

def identity() -> np.ndarray:
    return np.eye(3)


def parse_transform(s: str | None) -> np.ndarray:
    m = identity()
    for name, args in re.findall(r"(\w+)\s*\(([^)]*)\)", s or ""):
        a = [float(v) for v in re.split(r"[\s,]+", args.strip()) if v]
        if name == "translate":
            t = np.array([[1, 0, a[0]], [0, 1, a[1] if len(a) > 1 else 0], [0, 0, 1]], float)
        elif name == "scale":
            sy = a[1] if len(a) > 1 else a[0]
            t = np.array([[a[0], 0, 0], [0, sy, 0], [0, 0, 1]], float)
        elif name == "matrix":
            t = np.array([[a[0], a[2], a[4]], [a[1], a[3], a[5]], [0, 0, 1]], float)
        elif name == "rotate":
            th = math.radians(a[0])
            r = np.array([[math.cos(th), -math.sin(th), 0], [math.sin(th), math.cos(th), 0], [0, 0, 1]], float)
            if len(a) == 3:
                c = np.array([[1, 0, a[1]], [0, 1, a[2]], [0, 0, 1]], float)
                ci = np.array([[1, 0, -a[1]], [0, 1, -a[2]], [0, 0, 1]], float)
                r = c @ r @ ci
            t = r
        else:
            raise ValueError(f"unsupported transform {name}")
        m = m @ t
    return m


def matrix_attr(m: np.ndarray) -> str | None:
    a, c, e = m[0]
    b, d, f = m[1]
    if np.allclose(m, np.eye(3)):
        return None
    if np.allclose([a, b, c, d], [1, 0, 0, 1]):
        return f"translate({e:.4f},{f:.4f})"
    return f"matrix({a:.6f},{b:.6f},{c:.6f},{d:.6f},{e:.4f},{f:.4f})"


def tsr(tx: float, ty: float, s: float = 1.0) -> np.ndarray:
    """translate then scale, as a matrix (scale applied first to the drawing)."""
    return parse_transform(f"translate({tx},{ty}) scale({s})")


def transformed_bbox(d: str, m: np.ndarray) -> tuple[float, float, float, float]:
    p = sp_transform(parse_path(d), m)
    x0, x1, y0, y1 = p.bbox()
    return x0, y0, x1, y1


def scale_of(m: np.ndarray) -> float:
    """Uniform scale of a similarity matrix (the length of its first column)."""
    return math.hypot(m[0, 0], m[1, 0])


# ---------------------------------------------------------------------------
# Elements
# ---------------------------------------------------------------------------

@dataclass
class Elem:
    name: str          # id tail, kebab-case: square-r01-c02-cut, contour, face, sector-03
    tag: str           # path | circle
    role: str          # a palette role
    attrs: dict        # d, or cx/cy/r, verbatim from the source
    matrix: np.ndarray # composed transform into the drawing's space
    bbox: tuple = (0, 0, 0, 0)
    meta: dict = field(default_factory=dict)   # row, col, span, whole for tiles

    @property
    def centre(self):
        x0, y0, x1, y1 = self.bbox
        return (x0 + x1) / 2, (y0 + y1) / 2


@dataclass
class Piece:
    side: str            # white | black, by faces (White is the boxwood face)
    kind: str            # king | queen | rook | bishop | knight | pawn
    parts: list[Elem]    # in the drawn paint order; each part named contour or face

    @property
    def contour(self) -> Elem:
        return next(p for p in self.parts if p.name == "contour")

    @property
    def bbox(self):
        bs = [p.bbox for p in self.parts]
        return min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)

    @property
    def centre(self):
        x0, y0, x1, y1 = self.bbox
        return (x0 + x1) / 2, (y0 + y1) / 2

    def moved(self, m: np.ndarray) -> "Piece":
        """The same piece with m applied in front of every part's matrix."""
        parts = []
        for p in self.parts:
            mm = m @ p.matrix
            parts.append(Elem(p.name, p.tag, p.role, p.attrs, mm, transformed_bbox(p.attrs["d"], mm), dict(p.meta)))
        return Piece(self.side, self.kind, parts)


@dataclass
class Drawing:
    name: str
    width: float
    height: float
    squares: list[Elem] = field(default_factory=list)
    pieces: list[Piece] = field(default_factory=list)


def _fill_of(e) -> str | None:
    st = e.get("style") or ""
    m = re.search(r"(?:^|;)\s*fill:(#[0-9a-fA-F]{6})", st)
    if m:
        return m.group(1).lower()
    f = e.get("fill")
    return f.lower() if f and f.startswith("#") else None


def _tag(e) -> str:
    return e.tag.split("}")[1] if isinstance(e.tag, str) and "}" in e.tag else str(e.tag)


def _composed(e, stop=None) -> np.ndarray:
    chain = []
    cur = e
    while cur is not None and cur is not stop and _tag(cur) != "svg":
        chain.append(parse_transform(cur.get("transform")))
        cur = cur.getparent()
    m = identity()
    for t in reversed(chain):
        m = m @ t
    return m


def _read(name: str):
    path = os.path.join(ASSETS, SOURCES[name])
    root = etree.parse(path).getroot()
    vb = [float(v) for v in root.get("viewBox").split()]
    return root, vb[2], vb[3]


def piece_from_group(g, kind_hint: str | None = None) -> Piece | None:
    """A group of two paths, one boxwood and one ebony, is a piece. The contour is
    the path whose bbox is the larger (it holds the silhouette, the seams and the
    marks); the side is named by the face's wood (boxwood face = White). Each
    path's own transform is composed with the group chain."""
    kids = [c for c in g if isinstance(c.tag, str) and _tag(c) in ("path", "circle")]
    if len(kids) != 2:
        return None
    fills = [_fill_of(k) for k in kids]
    if set(fills) != {BOXWOOD, EBONY}:
        return None
    ms = [_composed(k) for k in kids]
    bb = [transformed_bbox(k.get("d"), m) for k, m in zip(kids, ms)]
    area = [(b[2] - b[0]) * (b[3] - b[1]) for b in bb]
    ci = 0 if area[0] >= area[1] else 1
    face_fill = fills[1 - ci]
    side = "white" if face_fill == BOXWOOD else "black"
    kind = kind_hint
    if kind is None:
        gid = g.get("id") or ""
        m = re.match(r"piece-(?:white|black)-([a-z]+)", gid)
        kind = m.group(1) if m and m.group(1) in CODES else "piece"
    parts = []
    for i, (k, m) in enumerate(zip(kids, ms)):          # document order = paint order
        name = "contour" if i == ci else "face"
        parts.append(Elem(name, "path", f"{side}-{name}", {"d": k.get("d")}, m, bb[i]))
    return Piece(side, kind, parts)


# ---------------------------------------------------------------------------
# The piece set
# ---------------------------------------------------------------------------

@dataclass
class PieceSet:
    square: float
    pieces: dict        # (side by faces, code) -> Piece in square-local space


_PSET: PieceSet | None = None


def load_pieces() -> PieceSet:
    """One piece of each kind per side from chess-pieces.svg, in square-local
    coordinates of its 153.79-unit square. Keys are (side, code) with sides by
    faces: ("white", "K") is the boxwood-faced king, which that file names
    piece-black-king-e8."""
    global _PSET
    if _PSET is not None:
        return _PSET
    root, w, h = _read("pieces")
    S = w / 8
    out = {}
    for g in root.iter():
        if not isinstance(g.tag, str) or _tag(g) != "g":
            continue
        m = re.match(r"piece-(white|black)-([a-z]+)-([a-h][1-8])$", g.get("id") or "")
        if not m:
            continue
        p = piece_from_group(g, m.group(2))
        if p is None:
            continue
        key = (p.side, CODES[p.kind])
        if key in out:
            continue
        sq = m.group(3)
        sx, sy = "abcdefgh".index(sq[0]) * S, (8 - int(sq[1])) * S
        out[key] = p.moved(parse_transform(f"translate({-sx},{-sy})"))
    missing = [(s, c) for s in ("white", "black") for c in KINDS if (s, c) not in out]
    if missing:
        raise SystemExit(f"chess-pieces.svg is missing {missing}")
    _PSET = PieceSet(S, out)
    return _PSET


# ---------------------------------------------------------------------------
# The tiled M, from the system
# ---------------------------------------------------------------------------

def load_monolith_m(n: int, layout: str = "bare", S: float = 1200.0) -> Drawing:
    """The MONOLITH M tiled on an n x n grid with one of the kit's layouts, as a
    Drawing in a canvas of side S: tiles carry row, col, span and whole in
    their meta and tile-light / tile-dark as their role (row + column even
    is light); pieces are placed and named by faces."""
    import monolith_m as mm          # local import: monolith_m imports this module
    mark = mm.build_mark(n, layout, mm.MONOLITH_M.scaled(S))
    dr = Drawing(f"monolith-m-{n}-{layout}", S, S)
    for t in mark.tiles:
        d = mm.tile_d(t, mark.cell)
        role = "tile-light" if (t.row + t.col) % 2 == 0 else "tile-dark"
        kind = "plinth" if t.span > 1 else "square"
        name = f"{kind}-r{t.row + 1:02d}-c{t.col + 1:02d}" + ("" if t.whole else "-cut")
        x0, y0, x1, y1 = t.geom.bounds
        dr.squares.append(Elem(name, "path", role, {"d": d}, identity(), (x0, y0, x1, y1),
                               {"row": t.row, "col": t.col, "span": t.span, "whole": t.whole}))
    dr.pieces = list(mark.pieces)
    return dr


def load_logo(S: float = 1200.0) -> Drawing:
    """The official logo: the MONOLITH M on a 4 x 4 grid, no pieces."""
    return load_monolith_m(4, "bare", S)


def load_emblem(S: float = 1200.0) -> Drawing:
    """The official emblem: the MONOLITH M on a 4 x 4 grid with the quartet."""
    return load_monolith_m(4, "quartet", S)


def drawing_bbox(dr: Drawing):
    xs0 = [el.bbox[0] for el in dr.squares]
    ys0 = [el.bbox[1] for el in dr.squares]
    xs1 = [el.bbox[2] for el in dr.squares]
    ys1 = [el.bbox[3] for el in dr.squares]
    return min(xs0), min(ys0), max(xs1), max(ys1)


def fit(dr: Drawing, x: float, y: float, w: float, h: float) -> np.ndarray:
    """Matrix placing a drawing's bbox into the box (x, y, w, h), preserving aspect."""
    bx0, by0, bx1, by1 = drawing_bbox(dr)
    bw, bh = bx1 - bx0, by1 - by0
    s = min(w / bw, h / bh)
    return tsr(x + (w - bw * s) / 2 - bx0 * s, y + (h - bh * s) / 2 - by0 * s, s)


# ---------------------------------------------------------------------------
# Stamping
# ---------------------------------------------------------------------------

def tile_style(fill: str, mortar: str, width: float) -> str:
    """A tile's style: its fill, and the mortar as a stroke painted over the fill,
    as the brand kit draws the grout."""
    return (f"fill:{fill};stroke:{mortar};stroke-width:{width:.4g};stroke-linejoin:round;"
            "paint-order:markers fill stroke")


def stamp_tiles(group, tiles: list[Elem], pal: dict, m: np.ndarray, idfn, mortar_px: float = 1.0,
                wrap=None):
    """Paint tiles into group under matrix m. idfn(tile) gives each tile's id;
    mortar_px is the grout width on screen. wrap(tile, i) may return a Group to
    hold the tile (an animation unit); otherwise tiles go straight into group."""
    width = mortar_px / scale_of(m)
    nodes = []
    for i, t in enumerate(tiles):
        holder = wrap(t, i) if wrap else group
        node = holder.path(idfn(t), t.attrs["d"], fill=pal[t.role], transform=matrix_attr(m @ t.matrix))
        node.attrs["style"] = tile_style(pal[t.role], pal["mortar"], width)
        nodes.append(node)
    return nodes


def stamp_piece(group, base: str, piece: Piece, pal: dict, m: np.ndarray, suffix: str = "", **kw):
    """One piece as one group: base{suffix} holding base-contour{suffix} and
    base-face{suffix}, in the drawn paint order, coloured by role."""
    g = group.g(f"{base}{suffix}", **kw)
    for part in piece.parts:
        g.path(f"{base}-{part.name}{suffix}", part.attrs["d"], fill=pal[part.role],
               transform=matrix_attr(m @ part.matrix))
    return g


def piece_ids(pieces: list[Piece]) -> list[str]:
    """piece-<side>-<kind>, with -NN only where a side has more than one of a kind."""
    from collections import Counter
    total = Counter((p.side, p.kind) for p in pieces)
    seen = Counter()
    out = []
    for p in pieces:
        seen[(p.side, p.kind)] += 1
        base = f"piece-{p.side}-{p.kind}"
        if total[(p.side, p.kind)] > 1:
            base += f"-{seen[(p.side, p.kind)]:02d}"
        out.append(base)
    return out


# ---------------------------------------------------------------------------
# The graphics meter (graphics-meter-design-v1.2.svg)
# ---------------------------------------------------------------------------

@dataclass
class Meter:
    width: float
    height: float
    outer: list[Elem]        # five sectors, left to right
    inner: list[Elem]        # five inner sectors, left to right
    needle: Elem
    pieces: list[Piece]      # five on the sectors left to right, then the hub pawn


def load_meter() -> Meter:
    root, w, h = _read("meter")
    by_id = {e.get("id"): e for e in root.iter() if isinstance(e.tag, str) and e.get("id")}

    def elem(pid, role):
        e = by_id[pid]
        m = _composed(e)
        d = e.get("d")
        return Elem(pid, "path", role, {"d": d}, m, transformed_bbox(d, m))

    outer_ids = [k for k in by_id if re.match(r"sector-\d+-meter$", k)]
    inner_ids = [k for k in by_id if re.match(r"inner-\d+-meter$", k)]
    needle_id = next(k for k in by_id if k.startswith("needle-"))
    outer = sorted((elem(p, "meter-sector") for p in outer_ids), key=lambda el: el.centre[0])
    inner = sorted((elem(p, "meter-inner") for p in inner_ids), key=lambda el: el.centre[0])
    for i, el in enumerate(outer, 1):
        el.name = f"sector-{i:02d}"
    for i, el in enumerate(inner, 1):
        el.name = f"inner-{i:02d}"
    needle = elem(needle_id, "meter-needle")
    needle.name = "needle"
    pieces = []
    for e in root.iter():
        if isinstance(e.tag, str) and _tag(e) == "g":
            p = piece_from_group(e)
            if p:
                pieces.append(p)
    hub = min(pieces, key=lambda p: abs(p.centre[0] - w / 2) + abs(p.centre[1] - h))
    pieces.remove(hub)
    pieces.sort(key=lambda p: p.centre[0])
    pieces.append(hub)
    return Meter(w, h, outer, inner, needle, pieces)
