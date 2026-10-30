#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH SVG Emitter (MONOLITH Edition - v1.1)
    - File Name: mono_svg.py
    - Relative Path: assets/generator/mono_svg.py
    - Artifact Type: library
    - Version: 1.1.0
    - Date: 10/26/2026
    - Update: Monday, October 26, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Moved
      from assets/mockups/generator into assets/generator, the one folder
      that now holds every MONOLITH generator, as Dennis asked when he
      had the assets folder cleaned up. stop() added so gradient stops
      carry ids like every other element; the default source note names
      the generator folder instead of the old mock-up path; the document's
      own elements (svg, title, namedview, defs, metadata) take ids from the
      file name instead of Inkscape's svg1, title1 defaults.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      version, for the mock-ups.

✒ Description:
    The small SVG emitter every MONOLITH generator writes through: an
    id registry that refuses generator-default and duplicate ids, a Group
    that hands out rects, paths, circles and text, and wrap_document, which
    wraps a drawing in the digiSpace document layers (✒ header, <title>,
    stock namedview, defs, RDF/DC block). A sibling of ChessWorkstation's
    tools/design/cw_core.py, trimmed to what the mock-ups need, so the
    MONOLITH assets folder stands on its own.

✒ Key Features:
    - IdRegistry: every id kebab-case, never a bare path12, never a duplicate
    - Group.g / rect / path / circle / text / raw; text is positioned by its
      centre line (baseline = cy + 0.355 x size)
    - Svg.add_def for gradients, clip paths and CSS; Svg.style for the
      animation keyframes a loading screen carries; stop() builds a
      gradient stop with its own id
    - wrap_document raises if the header text would put a double hyphen
      inside the XML comment, which Inkscape rejects, and names the
      document's own elements after the file: svg-<stem>, title-<stem>
    - Colour helpers: hex_to_rgb, blend, luminance, contrast

✒ Other Important Information:
    - Dependencies: Python 3.10+ only
    - Compatible platforms: any CPython
    - Fonts: FONT_UI is Inter with system fallbacks; FONT_MONO is JetBrains
      Mono with Cascadia and Consolas fallbacks
---------
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Sequence

FONT_UI = "Inter, 'Segoe UI', system-ui, sans-serif"
FONT_MONO = "'JetBrains Mono', 'Cascadia Mono', Consolas, 'DejaVu Sans Mono', monospace"

SIGNATURE = "︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!"
AUTHOR = "Dennis 'dendogg' Smaltz"
AI_ACK = "Anthropic - Claude Fable 5.1; Anthropic - Claude Opus 5.5"
INKSCAPE_VERSION = "1.4.4 (dcaf3e7, 2026-05-05)"


# ---------------------------------------------------------------------------
# Numbers and colour
# ---------------------------------------------------------------------------

def n(v: float) -> str:
    """Compact number: no trailing zeros, at most 4 decimals."""
    s = f"{v:.4f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def hex_to_rgb(h: str) -> tuple[float, float, float]:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_to_hex(rgb: Sequence[float]) -> str:
    return "#" + "".join(f"{max(0, min(255, round(c * 255))):02x}" for c in rgb)


def blend(fg: str, bg: str, alpha: float) -> str:
    f, b = hex_to_rgb(fg), hex_to_rgb(bg)
    return rgb_to_hex([f[i] * alpha + b[i] * (1 - alpha) for i in range(3)])


def luminance(h: str) -> float:
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ---------------------------------------------------------------------------
# Emitter
# ---------------------------------------------------------------------------

_DEFAULT_ID = re.compile(r"^(rect|path|g|text|circle|ellipse|line|polygon|polyline|tspan|use|layer|svg|defs)\d*$")
_VALID_ID = re.compile(r"^[A-Za-z][A-Za-z0-9-]*$")


class IdRegistry:
    def __init__(self):
        self.ids: set[str] = set()

    def claim(self, id_: str) -> str:
        if not _VALID_ID.match(id_):
            raise ValueError(f"id '{id_}' is not kebab-case alphanumeric")
        if _DEFAULT_ID.match(id_):
            raise ValueError(f"id '{id_}' looks like a generator default")
        if id_ in self.ids:
            raise ValueError(f"duplicate id '{id_}'")
        self.ids.add(id_)
        return id_


def stop(id_: str, offset: float, color: str, opacity: float = 1.0) -> "Node":
    """A gradient <stop> with an id, so no element in a generated file goes unlabelled."""
    return Node("stop", {"id": id_, "offset": n(offset), "style": f"stop-color:{color};stop-opacity:{n(opacity)}"})


def _attrs(d: dict) -> str:
    return "".join(f' {k}="{v}"' for k, v in d.items() if v is not None)


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


@dataclass
class Node:
    tag: str
    attrs: dict
    children: list = field(default_factory=list)
    text: str | None = None
    raw_text: bool = False

    def render(self, indent: int = 2) -> str:
        pad = " " * indent
        a = _attrs(self.attrs)
        if self.text is not None:
            body = self.text if self.raw_text else esc(self.text)
            return f"{pad}<{self.tag}{a}>{body}</{self.tag}>\n"
        if not self.children:
            return f"{pad}<{self.tag}{a} />\n"
        inner = "".join(c.render(indent + 2) for c in self.children)
        return f"{pad}<{self.tag}{a}>\n{inner}{pad}</{self.tag}>\n"


class Group:
    """A <g> that hands out primitives. All ids go through the registry."""

    def __init__(self, svg: "Svg", node: Node):
        self.svg = svg
        self.node = node

    def _add(self, node: Node) -> Node:
        self.node.children.append(node)
        return node

    def g(self, id_: str, transform: str | None = None, **extra) -> "Group":
        node = Node("g", {"id": self.svg.ids.claim(id_), "transform": transform, **extra})
        self._add(node)
        return Group(self.svg, node)

    def rect(self, id_: str, x, y, w, h, fill, rx: float = 0, opacity: float | None = None,
             **extra) -> Node:
        style = f"fill:{fill};stroke:none" + (f";opacity:{n(opacity)}" if opacity is not None else "")
        attrs = {"id": self.svg.ids.claim(id_), "x": n(x), "y": n(y), "width": n(w),
                 "height": n(h), "style": style}
        if rx:
            attrs["rx"] = n(rx)
            attrs["ry"] = n(rx)
        attrs.update(extra)
        return self._add(Node("rect", attrs))

    def path(self, id_: str, d: str, fill: str = "none", stroke: str | None = None,
             stroke_width: float | None = None, opacity: float | None = None,
             linecap: str | None = None, linejoin: str | None = None, dash: str | None = None,
             **extra) -> Node:
        style = [f"fill:{fill}"]
        if stroke:
            style.append(f"stroke:{stroke}")
            if stroke_width is not None:
                style.append(f"stroke-width:{n(stroke_width)}")
            if linecap:
                style.append(f"stroke-linecap:{linecap}")
            if linejoin:
                style.append(f"stroke-linejoin:{linejoin}")
            if dash:
                style.append(f"stroke-dasharray:{dash}")
        else:
            style.append("stroke:none")
        if opacity is not None:
            style.append(f"opacity:{n(opacity)}")
        attrs = {"id": self.svg.ids.claim(id_), "d": d, "style": ";".join(style)}
        attrs.update(extra)
        return self._add(Node("path", attrs))

    def circle(self, id_: str, cx, cy, r, fill, opacity: float | None = None, **extra) -> Node:
        style = f"fill:{fill};stroke:none" + (f";opacity:{n(opacity)}" if opacity is not None else "")
        attrs = {"id": self.svg.ids.claim(id_), "cx": n(cx), "cy": n(cy), "r": n(r), "style": style}
        attrs.update(extra)
        return self._add(Node("circle", attrs))

    def text(self, id_: str, x, cy, s: str, size: float, fill: str, weight: int = 400,
             anchor: str = "start", mono: bool = False, tabular: bool = False,
             italic: bool = False, letter_spacing: float | None = None,
             opacity: float | None = None, baseline: float | None = None, **extra) -> Node:
        """Text positioned by its CENTRE line (baseline = cy + 0.355 * size)."""
        y = baseline if baseline is not None else cy + 0.355 * size
        style = [f"font-family:{FONT_MONO if mono else FONT_UI}", f"font-size:{n(size)}px",
                 f"font-weight:{weight}", f"fill:{fill}", "stroke:none",
                 f"text-anchor:{anchor}"]
        if tabular:
            style.append("font-variant-numeric:tabular-nums")
            style.append("font-feature-settings:'tnum'")
        if italic:
            style.append("font-style:italic")
        if letter_spacing is not None:
            style.append(f"letter-spacing:{n(letter_spacing)}px")
        if opacity is not None:
            style.append(f"opacity:{n(opacity)}")
        attrs = {"id": self.svg.ids.claim(id_), "x": n(x), "y": n(y), "style": ";".join(style),
                 "xml:space": "preserve"}
        attrs.update(extra)
        return self._add(Node("text", attrs, text=s))

    def raw(self, node: Node) -> Node:
        return self._add(node)


class Svg(Group):
    def __init__(self):
        self.ids = IdRegistry()
        self.defs: list[Node] = []
        self.root_children = Node("root", {})
        super().__init__(self, self.root_children)

    def add_def(self, node: Node) -> Node:
        self.defs.append(node)
        return node

    def style(self, id_: str, css: str) -> Node:
        """A <style> block in defs; the CSS is written verbatim (no escaping)."""
        return self.add_def(Node("style", {"id": self.ids.claim(id_), "type": "text/css"},
                                 text="\n" + css.strip("\n") + "\n    ", raw_text=True))

    def body(self) -> str:
        return "".join(c.render(2) for c in self.root_children.children)


# ---------------------------------------------------------------------------
# digiSpace document wrapper — the five metadata layers
# ---------------------------------------------------------------------------

def wrap_text(s: str, width: int = 74, indent: str = "    ") -> str:
    import textwrap
    return "\n".join(indent + line for line in textwrap.wrap(" ".join(s.split()), width,
                                                             break_on_hyphens=False))


def _bullets(items: Sequence[str]) -> str:
    return "\n".join(wrap_text(f, 70, "      ").replace("      ", "    - ", 1) for f in items)


def wrap_document(svg: Svg, *, title: str, file_name: str, rel_path: str,
                  artifact_type: str, version: str, date_mdy: str, date_iso: str,
                  update_long: str, description: str, key_features: Sequence[str],
                  other_info: Sequence[str], keywords: Sequence[str],
                  width: float, height: float, changelog: Sequence[str] = (),
                  id_convention: str | None = None, source_note: str | None = None) -> str:
    changelog_block = f"\n✒ Changelog:\n{_bullets(changelog)}\n" if changelog else ""
    convention = f"\n✒ Id Convention:\n{wrap_text(id_convention)}\n" if id_convention else ""
    source = source_note or ("Source of truth: a generator in assets/generator emits this "
                             "file; edit the script, not the SVG, and port any Inkscape hand "
                             "pass back into the generator")
    header = f"""<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!--
✒ Metadata
    - Title: {title}
    - File Name: {file_name}
    - Relative Path: {rel_path}
    - Artifact Type: {artifact_type}
    - Version: {version}
    - Date: {date_mdy}
    - Update: {update_long}
    - Author: {AUTHOR}
    - A.I. Acknowledgement: {AI_ACK}
    - Signature: {SIGNATURE}
{changelog_block}
✒ Description:
{wrap_text(description)}

✒ Key Features:
{_bullets(key_features)}
{convention}
✒ Other Important Information:
{_bullets(list(other_info) + [source])}
    - XML note: an SVG header cannot carry the standard's closing dash rule,
      because a double hyphen is illegal inside an XML comment
-->
"""
    if "--" in header[header.index("<!--") + 4:header.index("-->")]:
        raise ValueError("header text contains '--', which is illegal inside an XML comment; reword it")
    stem = re.sub(r"[^A-Za-z0-9-]+", "-", file_name.rsplit(".", 1)[0]).strip("-")
    defs = "".join(d.render(4) for d in svg.defs)
    subjects = "".join(f"            <rdf:li>{esc(k)}</rdf:li>\n" for k in keywords)
    return f"""{header}
<svg
   width="{n(width)}"
   height="{n(height)}"
   viewBox="0 0 {n(width)} {n(height)}"
   version="1.1"
   id="svg-{stem}"
   inkscape:version="{INKSCAPE_VERSION}"
   sodipodi:docname="{file_name}"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:xlink="http://www.w3.org/1999/xlink"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:dc="http://purl.org/dc/elements/1.1/">
  <title
     id="title-{stem}">{esc(title)}</title>
  <sodipodi:namedview
     id="namedview-{stem}"
     pagecolor="#ffffff"
     bordercolor="#000000"
     borderopacity="0.25"
     inkscape:showpageshadow="2"
     inkscape:pageopacity="0.0"
     inkscape:pagecheckerboard="false"
     inkscape:deskcolor="#d1d1d1"
     inkscape:document-units="px"
     showborder="false"
     inkscape:zoom="0.35"
     inkscape:cx="{n(width / 2)}"
     inkscape:cy="{n(height / 2)}"
     inkscape:window-maximized="1"
     inkscape:current-layer="svg-{stem}" />
  <defs
     id="defs-{stem}">
{defs}  </defs>
{svg.body()}  <metadata
     id="metadata-{stem}">
    <rdf:RDF>
      <cc:Work
         rdf:about="">
        <dc:title>{esc(title)}</dc:title>
        <dc:date>{date_iso}</dc:date>
        <dc:creator>
          <cc:Agent>
            <dc:title>{AUTHOR}</dc:title>
          </cc:Agent>
        </dc:creator>
        <dc:contributor>
          <cc:Agent>
            <dc:title>{AI_ACK}</dc:title>
          </cc:Agent>
        </dc:contributor>
        <dc:rights>
          <cc:Agent>
            <dc:title>{AUTHOR}</dc:title>
          </cc:Agent>
        </dc:rights>
        <dc:language>en</dc:language>
        <dc:description>{esc(" ".join(description.split()))}</dc:description>
        <dc:subject>
          <rdf:Bag>
{subjects}          </rdf:Bag>
        </dc:subject>
      </cc:Work>
    </rdf:RDF>
  </metadata>
</svg>
"""
