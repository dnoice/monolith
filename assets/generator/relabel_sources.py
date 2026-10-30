#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH Source Relabeller (MONOLITH Edition - v2.0)
    - File Name: relabel_sources.py
    - Relative Path: assets/generator/relabel_sources.py
    - Artifact Type: python
    - Version: 2.0.0
    - Date: 10/26/2026
    - Update: Monday, October 26, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 2.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Rewritten
      for the sources that remain after Dennis retired the logo concepts:
      his hand-built brand kit (brand/conical-monolith-brand-kit.svg) and
      the graphics meter. One labeller now reads any of his drawings by
      what its elements are (tiles on a grid, plinths, construction lines,
      outlines, pieces, groups named by what they hold) instead of a table
      per file; each panel of the kit becomes one group; pieces are named
      by their faces (White is boxwood-faced), as the page reads them;
      stale id references in the namedview are repointed. Moved from
      assets/mockups/generator to assets/generator.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      version, for the four logo concepts and the meter.

✒ Description:
    Brings Dennis's hand-drawn SVG sources up to the house standard without
    touching a node: every element gets a descriptive id, and every panel
    of a sheet becomes one selectable group. Geometry, styles, paint order
    and transforms are left exactly as drawn; the only structural change
    is a transform-free wrapper group where a panel's parts were siblings.
    Run it after any Inkscape pass on a source, so the ids follow the
    drawing.

✒ Key Features:
    - Tiles: square-rNN-cNN-<panel> on the panel's own grid, -cut before
      the suffix when the outline trims it; plinth-rNN-cNN-<panel> for a
      2 x 2 or 3 x 3 block under a piece
    - Pieces: piece-<side>-<kind>[-NN]-<panel> with -contour- and -face-
      children; kind matched against chess-pieces.svg path data, falling
      back on the contour's own aspect ratio for resized copies
    - Construction: outline-<panel>, grid-<panel> holding
      grid-line-v-NN-<panel> and grid-line-h-NN-<panel>
    - Groups named by what they hold: tiles-<part>-<panel> (leg-left,
      bridge, leg-right), pieces-<side>, pieces-<side>-pawns,
      pieces-<side>-back-rank, pieces-kings, pieces-legs
    - The meter: its sectors, inner sectors and needle keep their ids; its
      pieces are renamed by faces
    - Idempotent: a second run writes the same ids

✒ Usage Instructions:
    $ python assets/generator/relabel_sources.py
    $ python assets/generator/relabel_sources.py --dry-run

✒ Other Important Information:
    - Dependencies: Python 3.10+, lxml, svgpathtools, numpy
    - Files: brand/conical-monolith-brand-kit.svg and
      graphics-meter-design-v1.2.svg; chess-pieces.svg already carries its
      own labels and is shared with ChessWorkstation, so it is not touched;
      the logo, the emblem and everything under brand/variants and mockups
      are generated with their ids and are not sources
    - Provenance manifests (c2pa) inside a file's metadata are left alone
---------
"""

from __future__ import annotations

import argparse
import os
import re
from collections import Counter, defaultdict

from lxml import etree
from svgpathtools import parse_path

import mono_assets as A

SVG = "{http://www.w3.org/2000/svg}"
SODI = "{http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd}"
INK = "{http://www.inkscape.org/namespaces/inkscape}"

# The kit: panel names by (column, row) on the sheet; panels are 1200 units with ~44 between.
KIT_PANELS = {(0, 0): ("4-grid", 4), (1, 0): ("8-grid", 8), (2, 0): ("16-grid", 16),
              (0, 1): ("4-quartet", 4), (1, 1): ("8-ranks", 8), (2, 1): ("16-bare", 16),
              (2, 2): ("16-scatter", 16)}
KIT_PITCH = 1240.0


def norm_d(d: str) -> str:
    """Path data without its opening move, so a moved copy of a piece matches its source."""
    s = re.sub(r"\s+", " ", d.strip())
    m = re.match(r"[mM]\s*-?[\d.e]+,-?[\d.e]+\s*(.*)$", s)
    return m.group(1) if m else s


def kind_tables():
    pset = A.load_pieces()
    exact, aspect = {}, {}
    for (side, code), piece in pset.pieces.items():
        for part in piece.parts:
            exact[norm_d(part.attrs["d"])] = piece.kind
        x0, x1, y0, y1 = parse_path(piece.contour.attrs["d"]).bbox()
        aspect[piece.kind] = (x1 - x0) / (y1 - y0)
    return exact, aspect


def kind_of(piece: A.Piece, exact, aspect) -> str:
    for part in piece.parts:
        k = exact.get(norm_d(part.attrs["d"]))
        if k:
            return k
    x0, x1, y0, y1 = parse_path(piece.contour.attrs["d"]).bbox()      # the path's own frame: rotation-proof
    a = (x1 - x0) / (y1 - y0)
    return min(aspect.items(), key=lambda kv: abs(kv[1] - a))[0]


class Labeller:
    def __init__(self, root, dry: bool):
        self.root = root
        self.dry = dry
        self.used = set()
        self.log = Counter()

    def claim(self, e, id_):
        base, k = id_, 2
        while id_ in self.used:
            id_ = f"{base}-{k:02d}"
            k += 1
        self.used.add(id_)
        old = e.get("id")
        e.set("id", id_)
        return old, id_


def _elems(e):
    return [c for c in e if isinstance(c.tag, str)]


def _bbox(e):
    bs = []
    for p in e.iter(f"{SVG}path"):
        if p.get("d"):
            bs.append(A.transformed_bbox(p.get("d"), A._composed(p)))
    for r in e.iter(f"{SVG}rect"):
        x, y, w, h = (float(r.get(k, 0)) for k in ("x", "y", "width", "height"))
        bs.append(A.transformed_bbox(f"M {x},{y} h {w} v {h} h {-w} z", A._composed(r)))
    if e.tag == f"{SVG}path" and e.get("d"):
        bs = [A.transformed_bbox(e.get("d"), A._composed(e))]
    if not bs:
        return None
    return min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)


def _stroke(e) -> str | None:
    m = re.search(r"(?:^|;)\s*stroke:(#[0-9a-fA-F]{6}|none)", e.get("style") or "")
    return m.group(1).lower() if m else None


def label_panel(L: Labeller, panel_root, panel: str, n: int, origin, exact, aspect):
    """Label everything inside one panel group whose grid has n cells of the panel's side."""
    ox, oy = origin
    pb = _bbox(panel_root)
    side = max(pb[2] - pb[0], pb[3] - pb[1])
    c = round(side) / n if side > 600 else 1200 / n
    pieces = {}
    for g in panel_root.iter(f"{SVG}g"):
        p = A.piece_from_group(g)
        if p:
            pieces[g] = p
    piece_paths = {k for g in pieces for k in _elems(g)}     # elements, kept alive, not id()s
    kinds = {g: kind_of(p, exact, aspect) for g, p in pieces.items()}
    # pieces, numbered per side and kind in reading order
    order = sorted(pieces, key=lambda g: (round((pieces[g].centre[1] - oy) / c - 0.5), pieces[g].centre[0]))
    total = Counter((pieces[g].side, kinds[g]) for g in order)
    seen = Counter()
    for g in order:
        p, k = pieces[g], kinds[g]
        seen[(p.side, k)] += 1
        base = f"piece-{p.side}-{k}" + (f"-{seen[(p.side, k)]:02d}" if total[(p.side, k)] > 1 else "")
        L.claim(g, f"{base}-{panel}")
        for kid, part in zip(_elems(g), p.parts):
            L.claim(kid, f"{base}-{part.name}-{panel}")
        L.log["pieces"] += 1
    # leaves that are not piece parts: tiles, outlines, grid lines, strays
    lines = {"v": [], "h": []}
    for e in panel_root.iter():
        if not isinstance(e.tag, str) or e.tag not in (f"{SVG}path", f"{SVG}rect") or e in piece_paths:
            continue
        b = _bbox(e)
        w, h = b[2] - b[0], b[3] - b[1]
        is_open = e.tag == f"{SVG}path" and "z" not in e.get("d").lower()
        if is_open and min(w, h) < 1e-3:                  # a construction line: an open, zero-area path
            lines["v" if w < h else "h"].append((b, e))
            continue
        if _stroke(e) in (None, "none") and w > 0.9 * side and h > 0.9 * side:
            L.claim(e, f"outline-{panel}")
            L.log["outlines"] += 1
            continue
        span = max(1, round(max(w, h) / c))
        cx, cy = ((b[0] + b[2]) / 2 - ox) / c, ((b[1] + b[3]) / 2 - oy) / c
        if span == 1:
            col, row = int(cx), int(cy)
        else:                                             # a plinth: its centre sits span / 2 in
            col, row = round(cx - span / 2), round(cy - span / 2)
        full = abs(w - span * c) < 1.5 and abs(h - span * c) < 1.5
        if full:
            path = parse_path(e.get("d")) if e.tag == f"{SVG}path" else None
            full = path is None or len(re.findall(r"[aAcCqQsS]", e.get("d"))) == 0
        kind = "plinth" if span > 1 else "square"
        L.claim(e, f"{kind}-r{row + 1:02d}-c{col + 1:02d}{'' if full else '-cut'}-{panel}")
        L.log["tiles"] += 1
    for axis, items in lines.items():
        items.sort(key=lambda be: be[0][0] if axis == "v" else be[0][1])
        for i, (b, e) in enumerate(items, 1):
            L.claim(e, f"grid-line-{axis}-{i:02d}-{panel}")
            L.log["grid lines"] += 1
    # groups, innermost first, named by what they hold
    groups = [g for g in panel_root.iter(f"{SVG}g") if g not in pieces and g is not panel_root]
    groups.sort(key=lambda g: -len(list(g.iterancestors())))
    for g in groups:
        ids = [x.get("id") or "" for x in g.iter() if x is not g and isinstance(x.tag, str)]
        held_pieces = [pieces[x] for x in g.iter(f"{SVG}g") if x in pieces]
        has_tiles = any(i.startswith(("square-", "plinth-")) for i in ids)
        has_lines = any(i.startswith("grid-line-") for i in ids)
        if held_pieces and not has_tiles:
            sides = {p.side for p in held_pieces}
            kinds_held = {kinds[x] for x in g.iter(f"{SVG}g") if x in pieces}
            if kinds_held == {"pawn"}:
                name = f"pieces-{sides.pop()}-pawns" if len(sides) == 1 else "pieces-pawns"
            elif len(sides) == 1 and "pawn" not in kinds_held and len(held_pieces) >= 8:
                name = f"pieces-{sides.pop()}-back-rank"
            elif len(sides) == 1:
                name = f"pieces-{sides.pop()}"
            elif len(kinds_held) == 1:
                name = f"pieces-{kinds_held.pop()}s"
            elif g.getparent() is panel_root:
                name = "pieces"
            elif all(not 0.3 < (p.centre[0] - ox) / side < 0.7 for p in held_pieces):
                name = "pieces-legs"                      # every piece stands on one of the legs
            else:
                name = "pieces-mixed"
        elif has_tiles and not held_pieces:
            gb = _bbox(g)
            fx0, fx1 = (gb[0] - ox) / side, (gb[2] - ox) / side
            if fx1 - fx0 > 0.9:
                name = "tiles"
            elif fx1 <= 0.45:
                name = "tiles-leg-left"
            elif fx0 >= 0.55:
                name = "tiles-leg-right"
            else:
                name = "tiles-bridge"
        elif has_lines and not has_tiles and not held_pieces:
            name = "grid"
        else:
            name = "part"
        L.claim(g, f"{name}-{panel}")
    L.claim(panel_root, f"panel-{panel}")


def wrap(siblings, gid):
    """A transform-free group around adjacent siblings, in place, paint order kept."""
    parent = siblings[0].getparent()
    idx = parent.index(siblings[0])
    g = etree.Element(f"{SVG}g")
    g.text = "\n    "
    g.tail = siblings[-1].tail
    g.set("id", gid)
    parent.insert(idx, g)
    for s in siblings:
        g.append(s)
    return g


def relabel_kit(path: str, dry: bool):
    tree = etree.parse(path)
    root = tree.getroot()
    L = Labeller(root, dry)
    exact, aspect = kind_tables()
    stem = "conical-monolith-brand-kit"
    for e, iid in ((root, f"svg-{stem}"),):
        L.claim(e, iid)
    for e in _elems(root):
        t = e.tag.split("}")[1]
        if t in ("title", "defs", "metadata", "namedview"):
            L.claim(e, f"{t}-{stem}")
    # assign every drawable top-level child to a panel by its bbox centre
    by_panel = defaultdict(list)
    for e in _elems(root):
        if e.tag not in (f"{SVG}g", f"{SVG}path", f"{SVG}rect"):
            continue
        b = _bbox(e)
        if b is None:
            continue
        cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        key = (int(cx // KIT_PITCH), int(cy // KIT_PITCH))
        area = (b[2] - b[0]) * (b[3] - b[1])
        if key not in KIT_PANELS or area < 1:
            L.claim(e, f"stray-line-{L.log['strays'] + 1:02d}")
            L.log["strays"] += 1
            continue
        by_panel[key].append(e)
    for key, members in sorted(by_panel.items(), key=lambda kv: (kv[0][1], kv[0][0])):
        panel, n = KIT_PANELS[key]
        if len(members) == 1 and members[0].tag == f"{SVG}g" and not A.piece_from_group(members[0]):
            proot = members[0]
            kids_are_tiles_only = all(c.tag == f"{SVG}path" for c in _elems(proot))
            if kids_are_tiles_only:
                proot = wrap([proot], f"panel-{panel}")
        else:
            members.sort(key=lambda e: e.getparent().index(e))
            proot = wrap(members, f"panel-{panel}")
        pb = _bbox(proot)
        label_panel(L, proot, panel, n, (pb[0], pb[1]), exact, aspect)
    nv = root.find(f"{SODI}namedview")
    if nv is not None:
        nv.set(f"{INK}current-layer", root.get("id"))
    return tree, L


def relabel_meter(path: str, dry: bool):
    """The meter: sectors, inner sectors and needle keep their ids; the two arc groups
    are named for what they hold; the six pieces are named by faces and wrapped in
    one group; the offset path effects get ids that say which one draws the inner
    sectors, and every reference to them follows."""
    tree = etree.parse(path)
    root = tree.getroot()
    L = Labeller(root, dry)
    L.used = {e.get("id") for e in root.iter() if isinstance(e.tag, str) and e.get("id")}
    exact, aspect = kind_tables()
    pieces = []
    for g in root.iter(f"{SVG}g"):
        p = A.piece_from_group(g)
        if p:
            pieces.append((g, p))
    for g, p in pieces:
        k = kind_of(p, exact, aspect)
        for e in [g, *_elems(g)]:
            L.used.discard(e.get("id"))
        L.claim(g, f"piece-{p.side}-{k}-meter")
        for kid, part in zip(_elems(g), p.parts):
            L.claim(kid, f"piece-{p.side}-{k}-{part.name}-meter")
        L.log["pieces"] += 1
    groups = [g for g, _ in pieces]
    if groups and all(g.getparent() is root for g in groups):
        groups.sort(key=lambda g: root.index(g))
        idxs = [root.index(g) for g in groups]
        if idxs == list(range(idxs[0], idxs[0] + len(idxs))):
            existing = root.find(f"{SVG}g[@id='pieces-meter']")
            if existing is None:
                wrap(groups, "pieces-meter")
                L.log["groups wrapped"] += 1
    for g in root.iter(f"{SVG}g"):
        ids = [x.get("id") or "" for x in g if isinstance(x.tag, str)]
        if ids and all(i.startswith("sector-") for i in ids):
            L.used.discard(g.get("id"))
            L.claim(g, "sectors-meter")
        elif ids and all(i.startswith("inner-") for i in ids):
            L.used.discard(g.get("id"))
            L.claim(g, "inner-sectors-meter")
    # path effects: name them by their user, and move every reference
    users = defaultdict(list)
    for e in root.iter():
        if isinstance(e.tag, str) and e.get(f"{INK}path-effect"):
            for ref in e.get(f"{INK}path-effect").split(";"):
                users[ref.strip().lstrip("#")].append(e)
    renames, spare = {}, 0
    for lpe in root.iter(f"{INK}path-effect"):
        old = lpe.get("id")
        if old in users:
            new = f"lpe-{lpe.get('effect', 'effect')}-{users[old][0].get('id')}"
        else:
            spare += 1
            new = f"lpe-{lpe.get('effect', 'effect')}-unused-{spare:02d}-meter"
        if old != new:
            L.used.discard(old)
            _, new = L.claim(lpe, new)
            renames[old] = new
    for e in root.iter():
        if isinstance(e.tag, str) and e.get(f"{INK}path-effect"):
            refs = [r.strip().lstrip("#") for r in e.get(f"{INK}path-effect").split(";")]
            e.set(f"{INK}path-effect", ";".join("#" + renames.get(r, r) for r in refs))
    L.log["path effects"] = len(renames)
    nv = root.find(f"{SODI}namedview")
    if nv is not None and root.get("id"):
        nv.set(f"{INK}current-layer", root.get("id"))
    return tree, L


def write(tree, path: str):
    raw = open(path, encoding="utf-8").read()
    head = raw[:raw.index("<svg")]                       # the XML declaration and the ✒ header, verbatim
    body = etree.tostring(tree.getroot(), encoding="unicode")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(head + body + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    for rel, fn in (("brand/conical-monolith-brand-kit.svg", relabel_kit), ("graphics-meter-design-v1.2.svg", relabel_meter)):
        path = os.path.join(A.ASSETS, rel)
        tree, L = fn(path, args.dry_run)
        if not args.dry_run:
            write(tree, path)
        print(f"{rel}: " + ", ".join(f"{v} {k}" for k, v in L.log.items()))


if __name__ == "__main__":
    main()
