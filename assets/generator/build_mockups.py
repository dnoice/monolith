#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH Mock-up Builder (MONOLITH Edition - v2.0)
    - File Name: build_mockups.py
    - Relative Path: assets/generator/build_mockups.py
    - Artifact Type: python
    - Version: 2.0.2
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 2.0.2 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      loading-02 and hero-01 taglines read MARBLE VS. OBSIDIAN · CATHEDRAL,
      as the cathedral is no longer called Gothic. Those two screens carry
      their own 2.0.1 header (version, date and entry, emit() taking the
      day), so a rebuild writes the headers they were given by hand. The
      mark is called the MONOLITH M and is read through load_monolith_m()
      from monolith_m.py, as Dennis asked that the brand files drop
      "conical" from their names while the logo is still being decided;
      the screens that name the mark carry it in a 10/30/2026 patch entry
      (2.0.1, loading-01 2.0.2), and the gauge and its palette study,
      which do not, keep 2.0.0.
    - 2.0.1 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      saved his own design ideas over loading-01-rising-columns.svg and
      kept working in it, so that name is his now: loading-01 is written
      as loading-01-rising-columns-generated.svg (LOADING_01), as the
      generated kit sits beside his hand-built one, and the build never
      writes over his file. The screen itself is unchanged.
    - 2.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Rebuilt on
      the two official marks Dennis chose, the 4 x 4 Conical M bare
      (monolith-logo.svg) and with its twelve pieces (monolith-emblem.svg),
      loaded through load_logo() and load_emblem(); the retired logo
      concepts and the old emblem are no longer read. Tiles are drawn as
      Dennis draws them, one fill with the mortar stroked over it, and
      the mark's matrix sits on its group so every animated tile and
      piece is transform-free. The bar is a rank of eight tiles. Palettes
      speak in tiles and mortar; gradient stops carry ids. Moved from
      assets/mockups/generator to assets/generator.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      set: four loading screens on the logo concepts, hero and splash on
      the emblem, the graphics gauge, three palette studies.

✒ Description:
    Emits the MONOLITH screen mock-ups into assets/mockups from the official
    marks and Dennis's hand-drawn sources: four loading screens (each an
    SVG that animates in a browser and shows its finished state in
    Inkscape), a hero image and a splash on the emblem, the graphics-quality
    meter drawn up as the settings widget, and palette studies that paint
    the logo, the emblem, the splash and the meter in five palettes. Every
    tile is the system's geometry and every piece is Dennis's path data
    stamped with a composed matrix; nothing is redrawn here.

✒ Key Features:
    - loading-01 Rising Columns (emblem), written as
      loading-01-rising-columns-generated.svg: the M's four columns rise
      like monoliths, the twelve pieces settle, a rank of eight tiles fills
    - loading-02 Tile Wave (logo): the twelve tiles arrive in a diagonal
      wave from the top-left corner, a hairline bar runs under them
    - loading-03 Chase (logo): an indeterminate shimmer sweeps the tiles
      clockwise around the M's centre; the dots of the status line walk
    - loading-04 Pieces Drop (emblem): the M stands; the twelve pieces
      drop onto it with a soft overshoot, left to right
    - hero-01: the emblem on a mirror floor beside the wordmark and two
      calls to action, 1920 x 1080
    - splash-01: the emblem centred over the wordmark, bar and version
    - meter-01: Dennis's gauge with filled sectors, HIGH in the accent
    - palette-study-01/02/03: logo and emblem, splash, meter in all five
      palettes; --palette paints the single screens in one of them

✒ Usage Instructions:
    $ python assets/generator/build_mockups.py
    $ python assets/generator/build_mockups.py --palette obsidian-gold
    $ python assets/generator/render_review.py --set mockups

✒ Command-Line Arguments:
    Output:
        --palette NAME   Palette for the single screens (default slate, as drawn)
        --all-palettes   Also emit every single screen in every palette,
                         suffixed with the palette's name

✒ Other Important Information:
    - Dependencies: Python 3.10+, lxml, svgpathtools, numpy, shapely
    - Reads the marks through mono_assets.load_logo() and load_emblem(),
      which build them from monolith_m.py, the same code that writes
      assets/monolith-logo.svg and monolith-emblem.svg
    - Animation is CSS inside a <style> in defs; the base attributes of
      every animated element are its finished state, so Inkscape and any
      static renderer show the loaded screen
    - Fonts: Inter (UI) and JetBrains Mono (status and version) with system
      fallbacks; nothing is converted to outlines, so the text stays editable
---------
"""

from __future__ import annotations

import argparse
import os
from datetime import date

import numpy as np

import mono_assets as A
from mono_svg import Node, Svg, blend, n, stop, wrap_document

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(A.ASSETS, "mockups")

SET_DAY = date(2026, 10, 26)        # 2.0.0: the set rebuilt on the official marks
TODAY = date(2026, 10, 30)          # 2.0.1: the mark called the MONOLITH M
VERSION = "2.0.1"
APP_VERSION = "v2.12.0"

W, H = 1600, 1000           # screens
HERO_W, HERO_H = 1920, 1080

EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)"
EASE_OVER = "cubic-bezier(0.34, 1.46, 0.64, 1)"

# loading-01's file: loading-01-rising-columns.svg is Dennis's own design file since 10/26/2026 (he
# saved his ideas over the generated screen and works in it), so the build writes its screen beside it
# under this name and never touches his.
LOADING_01 = "loading-01-rising-columns-generated"

SET_CHANGELOG = ["2.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Rebuilt on the "
                 "official 4 x 4 Conical M Dennis chose (monolith-logo.svg and "
                 "monolith-emblem.svg).",
                 "1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Fable 5.1] — First version, on "
                 "the logo concepts that the Conical M replaced."]
RENAMED = ("the mark is called the MONOLITH M and is built by monolith_m.py: at Dennis's request "
           "the brand files dropped \"conical\" from their names while the logo is still being "
           "decided")
CHANGELOG = [f"2.0.1 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — "
             f"{RENAMED[0].upper()}{RENAMED[1:]}.", *SET_CHANGELOG]

# hero-01 and loading-02: their tagline changed the same day, so their 2.0.1 says both.
TAGLINE_CHANGELOG = [
    "2.0.1 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The tagline reads MARBLE VS. "
    f"OBSIDIAN · CATHEDRAL, as the cathedral is no longer called Gothic, and {RENAMED}.",
    *SET_CHANGELOG]

# meter-01 and palette-study-03 show no mark, so they keep the set's 2.0.0.
SET_HEADER = dict(version="2.0.0", changelog=SET_CHANGELOG, day=SET_DAY)

ID_CONVENTION = (
    "Every element and group carries a descriptive id, component-subcomponent-panel: mark holds "
    "mark-tiles and mark-pieces; a tile is mark-square-rNN-cNN (-cut for one the outline crosses), "
    "counted from the top left of the 4 x 4 grid; a piece is mark-piece-<side>-<kind> holding its "
    "-contour and -face paths, sides named by faces (White is boxwood-faced). On a study sheet the "
    "panel suffix is the palette's key. Series are zero-padded so they sort in Inkscape's Objects "
    "panel. The mark's matrix sits on the mark group, so every animated tile and piece is "
    "transform-free and its CSS animation never fights the geometry."
)

PAL_INFO = ("Palette roles: ground, ground-2, ink, ink-2, accent, tile-light, tile-dark, mortar, "
            "white-face, white-contour, black-face, black-contour")

SWATCH_ROLES = ["ground", "ground-2", "accent", "ink", "ink-2", "tile-light", "tile-dark", "mortar",
                "white-face", "white-contour", "black-face", "black-contour"]


# ---------------------------------------------------------------------------
# Shared chrome
# ---------------------------------------------------------------------------

def ground(svg: Svg, parent, pal: dict, w: float, h: float, sfx: str = "", vignette: bool = True):
    """Screen ground: flat ground colour with a soft radial lift behind the centre."""
    g = parent.g(f"ground{sfx}")
    g.rect(f"ground-fill{sfx}", 0, 0, w, h, pal["ground"])
    if vignette:
        gid = f"ground-lift-gradient{sfx}"
        svg.add_def(Node("radialGradient", {"id": gid, "cx": "0.5", "cy": "0.45", "r": "0.6"}, [
            stop(f"ground-lift-stop-01{sfx}", 0, pal["ground-2"], 1),
            stop(f"ground-lift-stop-02{sfx}", 1, pal["ground-2"], 0),
        ]))
        g.rect(f"ground-lift{sfx}", 0, 0, w, h, f"url(#{gid})")
    return g


def wordmark(group, base: str, pal: dict, cx: float, cy: float, size: float, weight: int = 600,
             tracking: float | None = None, anchor: str = "middle", sfx: str = ""):
    return group.text(f"{base}-wordmark{sfx}", cx, cy, "MONOLITH", size, pal["ink"], weight=weight,
                      anchor=anchor, letter_spacing=size * 0.42 if tracking is None else tracking)


def tagline(group, base: str, pal: dict, cx: float, cy: float, s: str, size: float = 14,
            anchor: str = "middle", sfx: str = ""):
    return group.text(f"{base}-tagline{sfx}", cx, cy, s, size, pal["ink-2"], weight=500,
                      anchor=anchor, letter_spacing=size * 0.36)


def status_line(group, base: str, pal: dict, cx: float, cy: float, s: str, size: float = 13,
                anchor: str = "middle", sfx: str = ""):
    return group.text(f"{base}{sfx}", cx, cy, s, size, pal["ink-2"], mono=True, anchor=anchor)


def version_chip(group, base: str, pal: dict, right: float, cy: float, label: str = APP_VERSION, sfx: str = ""):
    w, h = max(92, 24 + round(len(label) * 7.3)), 28
    x = right - w
    g = group.g(f"{base}{sfx}")
    g.rect(f"{base}-fill{sfx}", x, cy - h / 2, w, h, pal["ground-2"], rx=6)
    g.text(f"{base}-label{sfx}", x + w / 2, cy, label, 12, pal["ink-2"], mono=True, anchor="middle")
    return g


def progress_rank(group, base: str, pal: dict, cx: float, y: float, cell: float = 26, filled: int = 8,
                  animate: bool = False, start: float = 0.0, step: float = 0.35, sfx: str = ""):
    """The bar: a rank of eight tiles with the mark's mortar, filling left to right."""
    x0 = cx - 4 * cell
    g = group.g(f"{base}{sfx}")
    for i in range(8):
        role = "tile-light" if i % 2 == 0 else "tile-dark"
        fill = pal[role] if i < filled else blend(pal[role], pal["ground"], 0.18)
        r = g.rect(f"{base}-tile-{i + 1:02d}{sfx}", x0 + i * cell, y, cell, cell, fill)
        r.attrs["style"] = A.tile_style(fill, pal["mortar"], 1)
        if animate and i < filled:
            r.attrs["class"] = "bar-tile"
            r.attrs["style"] += f";animation-delay:{start + i * step:.2f}s"
    return g


def hairline_bar(group, base: str, pal: dict, x: float, y: float, w: float, animate: bool = False,
                 duration: float = 3.0, delay: float = 0.0, sfx: str = ""):
    g = group.g(f"{base}{sfx}")
    g.rect(f"{base}-track{sfx}", x, y, w, 2, blend(pal["ink"], pal["ground"], 0.12))
    fill = g.rect(f"{base}-fill{sfx}", x, y, w, 2, pal["accent"])
    if animate:
        fill.attrs["class"] = "bar-fill"
        fill.attrs["style"] += f";animation-duration:{duration:.2f}s;animation-delay:{delay:.2f}s"
    return g


def draw_mark(parent, dr: A.Drawing, pal: dict, m: np.ndarray, *, prefix: str = "mark", sfx: str = "",
              mortar_px: float = 1.0, tile_cls=None, tile_delay=None, columns=None, piece_cls=None,
              piece_delay=None, **group_kw):
    """The tiled M as one group carrying the placement matrix: prefix-tiles (or
    prefix-column-NN groups when `columns` is a CSS class) and prefix-pieces >
    prefix-pieces-<side> > prefix-piece-<side>-<kind>. Tiles and pieces are
    transform-free inside it, so they can carry CSS animation classes."""
    g = parent.g(f"{prefix}{sfx}", transform=A.matrix_attr(m), **group_kw)
    width = mortar_px / A.scale_of(m)
    tiles = g.g(f"{prefix}-tiles{sfx}")
    holders = {}
    if columns:
        for col in sorted({t.meta["col"] for t in dr.squares}):
            holders[col] = tiles.g(f"{prefix}-column-{col + 1:02d}{sfx}", **{"class": columns})
    for i, t in enumerate(dr.squares):
        holder = holders.get(t.meta["col"], tiles)
        node = holder.path(f"{prefix}-{t.name}{sfx}", t.attrs["d"], fill=pal[t.role])
        node.attrs["style"] = A.tile_style(pal[t.role], pal["mortar"], width)
        if tile_cls:
            node.attrs["class"] = tile_cls
            node.attrs["style"] += f";animation-delay:{tile_delay(t, i):.2f}s"
    if dr.pieces:
        pg = g.g(f"{prefix}-pieces{sfx}")
        order = sorted(dr.pieces, key=lambda p: (p.centre[0], p.centre[1]))
        rank = {id(p): k for k, p in enumerate(order)}
        for side in ("white", "black"):
            ps = [p for p in sorted(dr.pieces, key=lambda p: (p.centre[1], p.centre[0])) if p.side == side]
            if not ps:
                continue
            sg = pg.g(f"{prefix}-pieces-{side}{sfx}")
            for base, piece in zip(A.piece_ids(ps), ps):
                kw = {}
                if piece_cls:
                    kw = {"class": piece_cls, "style": f"animation-delay:{piece_delay(piece, rank[id(piece)]):.2f}s"}
                A.stamp_piece(sg, f"{prefix}-{base}", piece, pal, A.identity(), suffix=sfx, **kw)
    return g


def emit(svg: Svg, file_name: str, *, title: str, description: str, key_features, other_info, keywords,
         width, height, artifact_type="mockup", id_convention=None, version=None, changelog=None,
         day=None):
    """Write one mock-up. version, changelog and day (the header's date) default to the set's;
    a screen with its own history (loading-01, renamed; hero-01 and loading-02, retagged)
    passes its own."""
    day = day or TODAY
    doc = wrap_document(svg, title=title, file_name=file_name, rel_path=f"assets/mockups/{file_name}",
                        artifact_type=artifact_type, version=version or VERSION,
                        date_mdy=day.strftime("%m/%d/%Y"), date_iso=day.isoformat(),
                        update_long=day.strftime("%A, %B %d, %Y"), description=description,
                        key_features=key_features, other_info=other_info, keywords=keywords, width=width,
                        height=height, changelog=changelog or CHANGELOG,
                        id_convention=id_convention or ID_CONVENTION,
                        source_note="Source of truth: assets/generator/build_mockups.py emits this file; edit "
                                    "the script, not the SVG, and port any Inkscape hand pass back into it")
    path = os.path.join(OUT, file_name)
    os.makedirs(OUT, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(doc)
    print("wrote", os.path.relpath(path, A.ASSETS).replace(os.sep, "/"))


MARK_INFO = ("Mark: the official 4 x 4 MONOLITH M (assets/monolith-logo.svg, monolith-emblem.svg), "
             "built by assets/generator/monolith_m.py; pieces from assets/chess-pieces.svg stamped "
             "verbatim")


# ---------------------------------------------------------------------------
# Loading 01 — Rising Columns (emblem)
# ---------------------------------------------------------------------------

def build_loading_01(pal, suffix=""):
    svg = Svg()
    dr = A.load_emblem()
    ground(svg, svg, pal, W, H)
    m = A.fit(dr, 580, 120, 440, 440)
    s = A.scale_of(m)
    rise = dr.height * 1.02                               # a full mark height: each column starts below the base
    svg.add_def(Node("clipPath", {"id": "mark-ground-clip"}, [
        Node("rect", {"id": "mark-ground-clip-rect", "x": n(560), "y": n(0), "width": n(480), "height": n(560)})]))
    rising = svg.g("mark-rising", **{"clip-path": "url(#mark-ground-clip)"})
    draw_mark(rising, dr, pal, m, columns="col", piece_cls="piece",
              piece_delay=lambda p, k: 0.95 + k * 0.07)
    copy = svg.g("copy")
    wordmark(copy, "copy", pal, W / 2, 648, 44)
    tagline(copy, "copy", pal, W / 2, 700, "A CHESS INSTRUMENT")
    progress_rank(copy, "bar", pal, W / 2, 790, animate=True, start=0.4, step=0.32)
    status_line(copy, "copy-status", pal, W / 2, 860, "raising the cathedral  ·  stockfish 19 · wasm  ·  62 %")
    version_chip(svg, "version", pal, W - 40, H - 40)
    col_css = "\n".join(f"      #mark-column-{c:02d} {{ animation-delay: {0.1 + (c - 1) * 0.16:.2f}s; }}" for c in range(1, 5))
    svg.style("anim-css", f"""
      .col {{ animation: rise 0.9s {EASE_OUT} both; }}
{col_css}
      .piece {{ animation: appear 0.5s ease-out both; transform-box: fill-box; transform-origin: 50% 100%; }}
      .bar-tile {{ animation: fill-in 0.3s ease-out both; }}
      @keyframes rise {{ from {{ transform: translateY({rise:.0f}px); opacity: 0; }} 30% {{ opacity: 1; }} to {{ transform: none; opacity: 1; }} }}
      @keyframes appear {{ from {{ opacity: 0; transform: translateY({14 / s:.0f}px) scale(0.92); }} to {{ opacity: 1; transform: none; }} }}
      @keyframes fill-in {{ from {{ opacity: 0.18; }} to {{ opacity: 1; }} }}
    """)
    emit(svg, f"{LOADING_01}{suffix}.svg", version="2.0.2",
         changelog=[f"2.0.2 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — "
                    f"{RENAMED[0].upper()}{RENAMED[1:]}.",
                    "2.0.1 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Written under "
                    "this name after Dennis saved his own design ideas over "
                    "loading-01-rising-columns.svg, which is his design file now; the screen is "
                    "unchanged.", *SET_CHANGELOG],
         title=f"MONOLITH Loading Screen 01 Rising Columns ({pal['label']})",
         description=("Loading screen built on the official emblem, the 4 x 4 MONOLITH M with its "
                      "twelve pieces. "
                      "The M's four columns rise out of the ground line at its feet like monoliths being raised, "
                      "one after another (a clip at the base hides each column until it emerges); the pieces then "
                      "settle onto their tiles; a rank of eight tiles below the wordmark "
                      "fills as the bar. In a browser the CSS runs once and holds; in Inkscape the finished "
                      "screen shows."),
         key_features=["Columns: rise one mark height out of the ground line at the M's feet, 0.9 s each, 0.16 s apart",
                       "Pieces: fade and settle from 14 px below, 0.07 s apart left to right, after the columns",
                       "Bar: eight tiles with the mark's mortar, filling 0.32 s apart",
                       "Text: wordmark 44 px tracked, tagline, status line in mono, version chip",
                       f"Palette: {pal['label']} ({pal['note']})"],
         other_info=[MARK_INFO, PAL_INFO],
         keywords=["MONOLITH", "loading screen", "emblem", "animation", "chess"], width=W, height=H)


# ---------------------------------------------------------------------------
# Loading 02 — Tile Wave (logo)
# ---------------------------------------------------------------------------

def build_loading_02(pal, suffix=""):
    svg = Svg()
    dr = A.load_logo()
    ground(svg, svg, pal, W, H)
    m = A.fit(dr, 600, 110, 400, 400)
    span = 2 * dr.width
    draw_mark(svg, dr, pal, m, tile_cls="tile",
              tile_delay=lambda t, i: 0.1 + (t.centre[0] + t.centre[1]) / span * 1.2)
    copy = svg.g("copy")
    wordmark(copy, "copy", pal, W / 2, 610, 44)
    tagline(copy, "copy", pal, W / 2, 662, "MARBLE VS. OBSIDIAN  ·  CATHEDRAL")
    hairline_bar(copy, "bar", pal, W / 2 - 180, 760, 360, animate=True, duration=2.6, delay=0.2)
    status_line(copy, "copy-status", pal, W / 2, 810, "compiling shaders  ·  hdr · bloom · mirror floor")
    version_chip(svg, "version", pal, W - 40, H - 40)
    svg.style("anim-css", f"""
      .tile {{ animation: tile-in 0.6s {EASE_OVER} both; transform-box: fill-box; transform-origin: 50% 50%; }}
      .bar-fill {{ animation: grow linear both; transform-box: fill-box; transform-origin: 0 50%; }}
      @keyframes tile-in {{ from {{ opacity: 0; transform: scale(0.35); }} to {{ opacity: 1; transform: none; }} }}
      @keyframes grow {{ from {{ transform: scaleX(0); }} to {{ transform: none; }} }}
    """)
    emit(svg, f"loading-02-tile-wave{suffix}.svg", changelog=TAGLINE_CHANGELOG,
         title=f"MONOLITH Loading Screen 02 Tile Wave ({pal['label']})",
         description=("Loading screen built on the official logo, the 4 x 4 MONOLITH M without "
                      "pieces. Its twelve "
                      "tiles arrive in a diagonal wave from the top-left corner, each scaling up from its centre "
                      "with a slight overshoot; a hairline bar under the tagline runs in the accent."),
         key_features=["Tiles: scale 0.35 to 1 with fade and overshoot, delay by (x + y) across the mark, 1.2 s spread",
                       "Bar: hairline track and accent fill scaling from the left over 2.6 s",
                       f"Palette: {pal['label']} ({pal['note']})"],
         other_info=[MARK_INFO, PAL_INFO],
         keywords=["MONOLITH", "loading screen", "logo", "animation", "chess"], width=W, height=H)


# ---------------------------------------------------------------------------
# Loading 03 — Chase (logo)
# ---------------------------------------------------------------------------

def build_loading_03(pal, suffix=""):
    svg = Svg()
    dr = A.load_logo()
    ground(svg, svg, pal, W, H)
    m = A.fit(dr, 580, 120, 440, 440)
    cx, cy = dr.width / 2, dr.height / 2
    period = 2.4

    def phase(t, i):
        ang = (np.degrees(np.arctan2(t.centre[1] - cy, t.centre[0] - cx)) + 90) % 360
        return -(ang / 360) * period

    draw_mark(svg, dr, pal, m, tile_cls="shimmer", tile_delay=phase)
    copy = svg.g("copy")
    wordmark(copy, "copy", pal, W / 2, 648, 44)
    tagline(copy, "copy", pal, W / 2, 700, "A CHESS INSTRUMENT")
    st = copy.g("status")
    status_line(st, "status-line", pal, W / 2 - 6, 800, "searching the position", anchor="end")
    dots = st.g("status-dots")
    for i in range(3):
        d = dots.circle(f"status-dot-{i + 1:02d}", W / 2 + 6 + i * 12, 800, 2.2, pal["ink-2"])
        d.attrs["class"] = "dot"
        d.attrs["style"] += f";animation-delay:{i * 0.2:.1f}s"
    status_line(copy, "copy-status-detail", pal, W / 2, 836, "depth 26  ·  29.8 M nodes  ·  multipv 5", size=12)
    version_chip(svg, "version", pal, W - 40, H - 40)
    svg.style("anim-css", f"""
      .shimmer {{ animation: shimmer {period}s ease-in-out infinite; }}
      .dot {{ animation: walk 1.2s ease-in-out infinite; }}
      @keyframes shimmer {{ 0% {{ opacity: 1; }} 18% {{ opacity: 0.32; }} 48% {{ opacity: 1; }} 100% {{ opacity: 1; }} }}
      @keyframes walk {{ 0%, 60%, 100% {{ opacity: 0.25; }} 30% {{ opacity: 1; }} }}
    """)
    emit(svg, f"loading-03-chase{suffix}.svg",
         title=f"MONOLITH Loading Screen 03 Chase ({pal['label']})",
         description=("Indeterminate loading screen built on the official logo. The twelve tiles dim and recover "
                      "in turn, the sweep running clockwise around the M's centre every 2.4 s; three dots walk "
                      "after the status line. For the states that have no known length: an engine search, a "
                      "network wait."),
         key_features=["Tiles: opacity 1 to 0.32 and back, phase by angle from the M's centre, looping",
                       "Dots: three, 0.2 s apart, 1.2 s loop",
                       f"Palette: {pal['label']} ({pal['note']})"],
         other_info=[MARK_INFO, PAL_INFO],
         keywords=["MONOLITH", "loading screen", "logo", "animation", "chess"], width=W, height=H)


# ---------------------------------------------------------------------------
# Loading 04 — Pieces Drop (emblem)
# ---------------------------------------------------------------------------

def build_loading_04(pal, suffix=""):
    svg = Svg()
    dr = A.load_emblem()
    ground(svg, svg, pal, W, H)
    m = A.fit(dr, 600, 110, 400, 400)
    s = A.scale_of(m)
    draw_mark(svg, dr, pal, m, piece_cls="drop", piece_delay=lambda p, k: 0.2 + k * 0.11)
    copy = svg.g("copy")
    wordmark(copy, "copy", pal, W / 2, 610, 44)
    tagline(copy, "copy", pal, W / 2, 662, "PLAY  ·  ANALYZE  ·  CRUCIBLE  ·  POSITION  ·  GRIMOIRE")
    progress_rank(copy, "bar", pal, W / 2, 760, animate=True, start=0.3, step=0.22)
    status_line(copy, "copy-status", pal, W / 2, 830, "placing the pieces  ·  12 of 12")
    version_chip(svg, "version", pal, W - 40, H - 40)
    svg.style("anim-css", f"""
      .drop {{ animation: drop 0.7s {EASE_OVER} both; }}
      .bar-tile {{ animation: fill-in 0.3s ease-out both; }}
      @keyframes drop {{ from {{ transform: translateY({-140 / s:.0f}px); opacity: 0; }} 35% {{ opacity: 1; }} to {{ transform: none; opacity: 1; }} }}
      @keyframes fill-in {{ from {{ opacity: 0.18; }} to {{ opacity: 1; }} }}
    """)
    emit(svg, f"loading-04-pieces-drop{suffix}.svg",
         title=f"MONOLITH Loading Screen 04 Pieces Drop ({pal['label']})",
         description=("Loading screen built on the official emblem. The M is already standing; its twelve pieces "
                      "drop onto it from 140 px above, left to right, each landing with a soft overshoot. The bar "
                      "is a rank of eight tiles."),
         key_features=["Pieces: translateY from 140 px above with overshoot easing, 0.11 s apart, left to right",
                       "Tiles: static", "Bar: eight tiles filling 0.22 s apart",
                       f"Palette: {pal['label']} ({pal['note']})"],
         other_info=[MARK_INFO, PAL_INFO],
         keywords=["MONOLITH", "loading screen", "emblem", "animation", "chess"], width=W, height=H)


# ---------------------------------------------------------------------------
# Hero 01 — the emblem on a mirror floor
# ---------------------------------------------------------------------------

def emblem_with_reflection(svg: Svg, parent, pal: dict, x: float, y: float, h: float, floor_gap: float = 18,
                           strength: float = 0.22, depth: float = 0.42):
    dr = A.load_emblem()
    m = A.fit(dr, x, y, h, h)
    w = h
    g = parent.g("emblem")
    draw_mark(g, dr, pal, m, mortar_px=1.0)
    floor_y = y + h + floor_gap
    flip = np.array([[1, 0, 0], [0, -1, 2 * floor_y], [0, 0, 1]], float)
    svg.add_def(Node("linearGradient", {"id": "reflection-gradient", "x1": "0", "y1": n(floor_y), "x2": "0",
                                        "y2": n(floor_y + h * depth), "gradientUnits": "userSpaceOnUse"}, [
        stop("reflection-stop-01", 0, "#ffffff", strength),
        stop("reflection-stop-02", 1, "#ffffff", 0),
    ]))
    svg.add_def(Node("mask", {"id": "reflection-mask", "maskUnits": "userSpaceOnUse", "x": n(x - 10),
                              "y": n(floor_y), "width": n(w + 20), "height": n(h * depth)}, [
        Node("rect", {"id": "reflection-mask-rect", "x": n(x - 10), "y": n(floor_y), "width": n(w + 20),
                      "height": n(h * depth), "style": "fill:url(#reflection-gradient)"}),
    ]))
    r = g.g("reflection", mask="url(#reflection-mask)")
    draw_mark(r, dr, pal, flip @ m, prefix="reflection-mark")
    g.rect("floor-line", x - 60, floor_y - 1, w + 120, 1, blend(pal["accent"], pal["ground"], 0.35))
    return g


def build_hero_01(pal, suffix=""):
    svg = Svg()
    ground(svg, svg, pal, HERO_W, HERO_H)
    emblem_with_reflection(svg, svg, pal, 150, 150, 640)
    copy = svg.g("copy")
    x = 1000
    wordmark(copy, "copy", pal, x, 380, 96, weight=700, tracking=30, anchor="start")
    copy.rect("copy-rule", x, 470, 640, 2, pal["accent"])
    copy.text("copy-subtitle", x, 536, "A chess instrument.", 40, pal["ink"], weight=300, anchor="start")
    copy.text("copy-line-01", x, 604, "Play, analyze and study on a board carved for serious players:", 20,
              pal["ink-2"], anchor="start")
    copy.text("copy-line-02", x, 636, "Stockfish 19 in the browser, a synaptic PV, the Crucible and the Grimoire.",
              20, pal["ink-2"], anchor="start")
    cta = copy.g("cta")
    play = cta.g("cta-play")
    play.rect("cta-play-fill", x, 700, 176, 56, pal["accent"], rx=10)
    play.text("cta-play-label", x + 88, 728, "Play", 20, pal["ground"], weight=600, anchor="middle")
    ana = cta.g("cta-analyze")
    ana.rect("cta-analyze-fill", x + 196, 700, 200, 56, blend(pal["ink"], pal["ground"], 0.08), rx=10)
    ana.text("cta-analyze-label", x + 296, 728, "Analyze", 20, pal["ink"], weight=500, anchor="middle")
    tagline(copy, "copy", pal, x, 836, "MARBLE VS. OBSIDIAN  ·  CATHEDRAL", anchor="start")
    version_chip(svg, "version", pal, HERO_W - 60, HERO_H - 56, f"{APP_VERSION} · MIT")
    emit(svg, f"hero-01-mirror-floor{suffix}.svg", changelog=TAGLINE_CHANGELOG,
         title=f"MONOLITH Hero 01 Mirror Floor ({pal['label']})",
         description=("Hero image, 1920 x 1080. The official emblem stands on the left on a mirror floor, its "
                      "reflection fading into the ground over the lower part of its height, the way the in-game "
                      "floor reflects the pieces; the wordmark, a rule in the accent, the subtitle, two lines of "
                      "copy and the Play and Analyze calls to action sit to its right."),
         key_features=["Emblem: 640 px, the official mark, reflection by a masked flip of the same group",
                       "Floor: a one-pixel accent hairline 18 px under the emblem",
                       "Type: wordmark 96 px bold tracked 30, subtitle 40 px light, copy 20 px, tagline tracked caps",
                       "Calls to action: Play filled in the accent, Analyze on glass",
                       f"Palette: {pal['label']} ({pal['note']})"],
         other_info=[MARK_INFO, PAL_INFO],
         keywords=["MONOLITH", "hero", "emblem", "landing", "chess"], width=HERO_W, height=HERO_H)


# ---------------------------------------------------------------------------
# Splash 01 — the emblem centred
# ---------------------------------------------------------------------------

def splash(svg: Svg, parent, pal: dict, sfx: str = ""):
    ground(svg, parent, pal, W, H, sfx=sfx)
    dr = A.load_emblem()
    m = A.fit(dr, W / 2 - 250, 110, 500, 500)
    draw_mark(parent, dr, pal, m, sfx=sfx)
    copy = parent.g(f"copy{sfx}")
    wordmark(copy, "copy", pal, W / 2, 700, 56, sfx=sfx)
    tagline(copy, "copy", pal, W / 2, 756, "A CHESS INSTRUMENT", sfx=sfx)
    hairline_bar(copy, "bar", pal, W / 2 - 180, 846, 360, sfx=sfx)
    status_line(copy, "copy-status", pal, W / 2, 890, "loading  ·  stockfish 19 · wasm", sfx=sfx)
    version_chip(parent, "version", pal, W - 40, H - 40, sfx=sfx)


def build_splash_01(pal, suffix=""):
    svg = Svg()
    splash(svg, svg, pal)
    emit(svg, f"splash-01-emblem{suffix}.svg",
         title=f"MONOLITH Splash 01 Emblem ({pal['label']})",
         description=("Splash screen, 1600 x 1000: the official emblem centred at 500 px over the wordmark, "
                      "tagline, a hairline bar and a mono status line, the version chip in the corner. The first "
                      "thing the window shows."),
         key_features=["Emblem: the official mark, centred",
                       "Type: wordmark 56 px tracked, tagline 14 px tracked caps, status 13 px mono",
                       "Bar: 360 px hairline track with the accent fill at full",
                       f"Palette: {pal['label']} ({pal['note']})"],
         other_info=[MARK_INFO, PAL_INFO],
         keywords=["MONOLITH", "splash", "emblem", "chess"], width=W, height=H)


# ---------------------------------------------------------------------------
# Meter 01 — the graphics-quality gauge
# ---------------------------------------------------------------------------

LEVELS = ["MINIMAL", "LOW", "MEDIUM", "HIGH", "ULTRA"]
METER_ANGLES = [-72, -36, 0, 36, 72]      # sector centres, degrees from straight up
METER_R = 153.31977                       # Dennis's outer arc radius
METER_C = (153.0, 153.31977)              # its centre in his 306 x 170 space
METER_HUB = (153.0, 135.4)                # the pawn's centre, the needle's pivot


def meter_widget(parent, base: str, pal: dict, x: float, y: float, w: float, active: int = 3, sfx: str = ""):
    """Dennis's gauge drawn up as the settings widget: sectors filled, the active one in
    the accent, his five pieces on their sectors, the pawn on the needle hub, the needle
    turned to the active sector."""
    mt = A.load_meter()
    s = w / mt.width
    m = A.tsr(x, y, s)
    g = parent.g(f"{base}{sfx}")
    sec = g.g(f"{base}-sectors{sfx}")
    for i, el in enumerate(mt.outer):
        fill = pal["accent"] if i == active else blend(pal["ink"], pal["ground"], 0.12 if i < active else 0.07)
        sec.path(f"{base}-{el.name}{sfx}", el.attrs["d"], fill=fill, transform=A.matrix_attr(m @ el.matrix))
    inn = g.g(f"{base}-inner-sectors{sfx}")
    for i, el in enumerate(mt.inner):
        fill = pal["accent"] if i == active else blend(pal["ink"], pal["ground"], 0.08 if i < active else 0.045)
        inn.path(f"{base}-{el.name}{sfx}", el.attrs["d"], fill=fill, transform=A.matrix_attr(m @ el.matrix))
    pcs = g.g(f"{base}-pieces{sfx}")
    for i, p in enumerate(mt.pieces):
        if i == active:
            inks = {f"{p.side}-contour": pal["ground"], f"{p.side}-face": pal["ink"]}
        elif i < 5:
            inks = {f"{p.side}-contour": pal["ink-2"], f"{p.side}-face": pal["ground"]}
        else:
            inks = {f"{p.side}-contour": pal["ink"], f"{p.side}-face": pal["ground"]}
        A.stamp_piece(pcs, f"{base}-piece-{p.kind}", p, pal | inks, m, suffix=sfx)
    hub = A.parse_transform(f"rotate({METER_ANGLES[active]},{METER_HUB[0]},{METER_HUB[1]})")
    g.path(f"{base}-needle{sfx}", mt.needle.attrs["d"], fill=pal["ink"], transform=A.matrix_attr(m @ hub @ mt.needle.matrix))
    lab = g.g(f"{base}-labels{sfx}")
    cx, cy = x + METER_C[0] * s, y + METER_C[1] * s
    r = METER_R * s + 15
    for i, (lv, ang) in enumerate(zip(LEVELS, METER_ANGLES)):
        a = np.radians(ang)
        lx, ly = cx + r * np.sin(a), cy - r * np.cos(a)
        t = lab.text(f"{base}-label-{i + 1:02d}{sfx}", lx, ly, lv, 11, pal["ink"] if i == active else pal["ink-2"],
                     weight=600, anchor="middle", letter_spacing=2.2)
        t.attrs["transform"] = f"rotate({ang},{n(lx)},{n(ly)})"
    return g


def build_meter_01(pal, suffix=""):
    svg = Svg()
    ground(svg, svg, pal, W, H, vignette=False)
    panel = svg.g("panel")
    px, py, pw, ph = 480, 120, 640, 760
    panel.rect("panel-fill", px, py, pw, ph, pal["ground-2"], rx=14)
    head = panel.g("panel-heading")
    head.text("panel-heading-label", px + 32, py + 44, "GRAPHICS", 13, pal["ink-2"], weight=600, letter_spacing=3)
    head.rect("panel-heading-rule", px + 130, py + 44, pw - 162, 1, blend(pal["ink"], pal["ground-2"], 0.12))
    auto = panel.g("panel-auto")
    auto.text("panel-auto-label", px + 32, py + 92, "Automatic", 18, pal["ink"], weight=500)
    auto.text("panel-auto-note-01", px + 32, py + 118, "Picks a level for this device, then raises or", 13, pal["ink-2"])
    auto.text("panel-auto-note-02", px + 32, py + 136, "lowers it with the frame rate", 13, pal["ink-2"])
    tg = auto.g("panel-toggle")
    tg.rect("panel-toggle-track", px + pw - 84, py + 80, 52, 26, blend(pal["ink"], pal["ground-2"], 0.10), rx=13)
    tg.circle("panel-toggle-knob", px + pw - 71, py + 93, 9, pal["ink-2"])
    meter_widget(panel, "meter", pal, px + 90, py + 215, pw - 180, active=3)
    lvl = panel.g("panel-level")
    lvl.text("panel-level-label", px + pw / 2, py + 500, "High", 20, pal["ink"], weight=600, anchor="middle")
    lvl.text("panel-level-note", px + pw / 2, py + 528, "chosen by hand", 13, pal["ink-2"], anchor="middle")
    copy = panel.g("panel-copy")
    lines = ["High suits recent laptops, Apple silicon and graphics cards.",
             "HDR, light ray-marched at half resolution in 40 steps, bloom,",
             "a sharp mirror floor in MONOLITH, 2048 px shadows, 4x",
             "multisampling and 1x resolution."]
    for i, s in enumerate(lines):
        copy.text(f"panel-copy-{i + 1:02d}", px + 32, py + 580 + i * 22, s, 14, pal["ink-2"])
    ft = panel.g("panel-finetune")
    ft.text("panel-finetune-label", px + 32, py + 690, "Fine-tune", 15, pal["ink"], weight=500)
    ft.path("panel-finetune-chevron", f"M {px + pw - 46},{py + 685} l 7,7 l 7,-7", stroke=pal["ink-2"],
            stroke_width=1.5, linecap="round", linejoin="round")
    version_chip(svg, "version", pal, W - 40, H - 40)
    emit(svg, f"meter-01-graphics-gauge{suffix}.svg", **SET_HEADER,
         title=f"MONOLITH Meter 01 Graphics Gauge ({pal['label']})",
         description=("Dennis's graphics-quality meter (graphics-meter-design-v1.2.svg) drawn up as the Settings "
                      "widget it is for. His five sectors and five inner sectors are filled, the active sector in "
                      "the accent with its piece inverted on it; his five pieces lean along the arc as he placed "
                      "them, rook to queen, with the pawn as the needle hub. Labels MINIMAL to ULTRA follow the "
                      "arc. The panel copy mirrors the app's."),
         key_features=["Gauge geometry: every path from graphics-meter-design-v1.2.svg, stamped verbatim",
                       "Sectors: passed levels at 12 % ink, the active level in the accent, unreached at 7 %; the "
                       "needle turns to the active sector",
                       "Pieces: rook, knight, bishop, king, queen on the sectors; pawn on the needle hub",
                       "Labels: 11 px tracked caps rotated to the arc",
                       f"Palette: {pal['label']} ({pal['note']})"],
         other_info=["Source: graphics-meter-design-v1.2.svg; the pieces inside it are chess-pieces.svg", PAL_INFO,
                     "As drawn the king sits on HIGH and the queen on ULTRA; the app today has them the other way round"],
         keywords=["MONOLITH", "settings", "graphics", "meter", "gauge", "chess"], width=W, height=H)


# ---------------------------------------------------------------------------
# Palette studies
# ---------------------------------------------------------------------------

def sheet_chrome(svg: Svg, w: float, h: float, title: str, subtitle: str, file_name: str):
    """A review sheet: dark ground, title row, rule, footer."""
    head = svg.g("sheet-header")
    svg.node.children.insert(0, svg.node.children.pop())     # header group first in paint order
    head.rect("sheet-ground", 0, 0, w, h, "#1a1b1e")
    head.text("sheet-title", 48, 52, title, 26, "#e8e6df", weight=600)
    head.text("sheet-subtitle", 48, 86, subtitle, 14, "#9a9b9f")
    head.rect("sheet-rule", 48, 108, w - 96, 1, "#b99a66")
    svg.text("sheet-footer", 48, h - 28, f"MONOLITH · assets/mockups/{file_name} · generated by "
             "assets/generator/build_mockups.py", 11, "#6b6c70", mono=True)


def swatches(group, base: str, pal: dict, x: float, y: float, size: float = 18, sfx: str = ""):
    g = group.g(f"{base}{sfx}")
    for i, r in enumerate(SWATCH_ROLES):
        g.rect(f"{base}-{r}{sfx}", x + i * (size + 3), y, size, size, pal[r], rx=3)
    return g


def build_palette_study_marks():
    svg = Svg()
    pals = list(A.PALETTES.items())
    cols, cell_w, cell_h = 5, 300, 680
    w, h = 48 * 2 + cols * cell_w + (cols - 1) * 20, 140 + cell_h + 72
    fname = "palette-study-01-logo.svg"
    logo, emblem = A.load_logo(), A.load_emblem()
    for i, (key, pal) in enumerate(pals):
        x, y = 48 + i * (cell_w + 20), 140
        sfx = f"-{key}"
        g = svg.g(f"cell{sfx}")
        g.rect(f"cell-ground{sfx}", x, y, cell_w, cell_h, pal["ground"], rx=10)
        draw_mark(g, logo, pal, A.fit(logo, x + 40, y + 30, cell_w - 80, cell_w - 80), prefix="logo", sfx=sfx)
        draw_mark(g, emblem, pal, A.fit(emblem, x + 40, y + 280, cell_w - 80, cell_w - 80), prefix="emblem", sfx=sfx)
        wordmark(g, "cell", pal, x + cell_w / 2, y + 548, 20, sfx=sfx)
        g.text(f"cell-name{sfx}", x + 20, y + 590, pal["label"], 15, pal["ink"], weight=600)
        g.text(f"cell-note{sfx}", x + 20, y + 612, pal["note"], 11, pal["ink-2"])
        swatches(g, "cell-swatches", pal, x + 20, y + cell_h - 46, 18, sfx=sfx)
    sheet_chrome(svg, w, h, "MONOLITH — Palette Study 01: the logo and the emblem",
                 "The official 4 x 4 MONOLITH M, bare and with its pieces, painted in five "
                 "palettes; the swatch "
                 "row is ground, lift, accent, ink, ink-2, the two tiles, mortar and the four piece inks.", fname)
    emit(svg, fname, title="MONOLITH Palette Study 01 Logo and Emblem",
         description=("Review sheet: the official logo and emblem painted in the five candidate palettes, each "
                      "cell on its own ground with the wordmark, the palette's name and note, and a swatch row."),
         key_features=["Five cells, 300 px wide, one palette each; the logo above the emblem",
                       "Swatch order: " + ", ".join(SWATCH_ROLES),
                       "Palettes: " + ", ".join(p["label"] for _, p in pals)],
         other_info=[MARK_INFO, PAL_INFO], keywords=["MONOLITH", "palette", "logo", "emblem", "study"],
         width=w, height=h, artifact_type="plate")


def build_palette_study_splash():
    svg = Svg()
    pals = list(A.PALETTES.items())
    scale = 0.3
    cw, ch = W * scale, H * scale
    cols, rows = 3, 2
    w = 48 * 2 + cols * cw + (cols - 1) * 20
    h = 140 + rows * ch + (rows - 1) * 48 + 96
    fname = "palette-study-02-splash.svg"
    for i, (key, pal) in enumerate(pals):
        r, c = divmod(i, cols)
        x, y = 48 + c * (cw + 20), 140 + r * (ch + 48)
        sfx = f"-{key}"
        cell = svg.g(f"cell{sfx}")
        inner = cell.g(f"cell-splash{sfx}", transform=f"translate({n(x)},{n(y)}) scale({n(scale)})")
        splash(svg, inner, pal, sfx=sfx)
        cell.text(f"cell-name{sfx}", x, y + ch + 22, f"{pal['label']}  ·  {pal['note']}", 13, "#e8e6df", weight=500)
    r, c = divmod(len(pals), cols)
    x, y = 48 + c * (cw + 20), 140 + r * (ch + 48)
    kg = svg.g("key")
    kg.rect("key-ground", x, y, cw, ch, "#232428", rx=8)
    kg.text("key-title", x + 24, y + 30, "ROLES", 12, "#9a9b9f", weight=600, letter_spacing=3)
    for j, role in enumerate(SWATCH_ROLES):
        yy = y + 56 + j * 19
        row = kg.g(f"key-row-{role}")
        for k, (key, pal) in enumerate(pals):
            row.rect(f"key-{role}-{key}", x + 24 + k * 22, yy - 7, 16, 14, pal[role], rx=2)
        row.text(f"key-{role}-label", x + 24 + 5 * 22 + 8, yy, role, 11, "#c9c8c2", mono=True)
    sheet_chrome(svg, w, h, "MONOLITH — Palette Study 02: the splash",
                 "Splash 01 in five palettes at 30 %. The sixth cell keys the roles.", fname)
    emit(svg, fname, title="MONOLITH Palette Study 02 Splash",
         description=("Review sheet: splash 01 built five times at 30 % scale, once per candidate palette, with a "
                      "sixth cell keying every palette role across the five."),
         key_features=["Five splash cells plus a role key", "Same geometry in every cell; only the palette changes"],
         other_info=[MARK_INFO, PAL_INFO], keywords=["MONOLITH", "palette", "splash", "study"],
         width=w, height=h, artifact_type="plate")


def build_palette_study_meter():
    svg = Svg()
    pals = list(A.PALETTES.items())
    cols, cell_w, cell_h = 5, 300, 250
    w, h = 48 * 2 + cols * cell_w + (cols - 1) * 20, 140 + cell_h + 60
    fname = "palette-study-03-meter.svg"
    for i, (key, pal) in enumerate(pals):
        x, y = 48 + i * (cell_w + 20), 140
        sfx = f"-{key}"
        g = svg.g(f"cell{sfx}")
        g.rect(f"cell-ground{sfx}", x, y, cell_w, cell_h, pal["ground-2"], rx=10)
        meter_widget(g, "meter", pal, x + 40, y + 48, cell_w - 80, active=3, sfx=sfx)
        g.text(f"cell-name{sfx}", x + 20, y + cell_h - 24, pal["label"], 14, pal["ink"], weight=600)
    sheet_chrome(svg, w, h, "MONOLITH — Palette Study 03: the graphics meter",
                 "Dennis's gauge as the settings widget, HIGH active, in five palettes.", fname)
    emit(svg, fname, title="MONOLITH Palette Study 03 Graphics Meter", **SET_HEADER,
         description="Review sheet: the graphics gauge widget in the five candidate palettes, HIGH active in each.",
         key_features=["Five cells, one palette each", "Gauge geometry from graphics-meter-design-v1.2.svg, stamped verbatim"],
         other_info=["Source: graphics-meter-design-v1.2.svg", PAL_INFO],
         keywords=["MONOLITH", "palette", "meter", "study"], width=w, height=h, artifact_type="plate")


# ---------------------------------------------------------------------------

SINGLES = {
    "loading-01": build_loading_01, "loading-02": build_loading_02, "loading-03": build_loading_03,
    "loading-04": build_loading_04, "hero-01": build_hero_01, "splash-01": build_splash_01,
    "meter-01": build_meter_01,
}


def main():
    ap = argparse.ArgumentParser(description="Build the MONOLITH mock-ups on the official marks.")
    ap.add_argument("--palette", default="slate", choices=list(A.PALETTES))
    ap.add_argument("--all-palettes", action="store_true")
    args = ap.parse_args()
    for name, fn in SINGLES.items():
        fn(A.PALETTES[args.palette])
        if args.all_palettes:
            for key, pal in A.PALETTES.items():
                if key != args.palette:
                    fn(pal, suffix=f"-{key}")
    build_palette_study_marks()
    build_palette_study_splash()
    build_palette_study_meter()


if __name__ == "__main__":
    main()
