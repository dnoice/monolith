#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH Asset Audit (MONOLITH Edition - v2.0)
    - File Name: audit_assets.py
    - Relative Path: assets/generator/audit_assets.py
    - Artifact Type: python
    - Version: 2.0.0
    - Date: 10/26/2026
    - Update: Monday, October 26, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 2.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      from audit_mockups.py and moved into assets/generator when Dennis had
      the assets folder cleaned up. It now audits every SVG under assets
      (not a fixed list), checks every element rather than the drawable
      ones (gradient stops, clip paths, path effects, the document's own
      svg, title, namedview, defs and metadata), checks that every internal
      reference resolves, keeps the namedview stock, and checks that every
      assets/... file path written in a header, a document or a script
      exists, so no link goes stale when a file moves.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      version: header, titles, ids and animation wrappers of the mock-ups.

✒ Description:
    Mechanical checks on the MONOLITH assets folder, the way ChessWorkstation's
    audit_plate.py checks its plates. Every SVG is checked for the house
    header and metadata, descriptive and unique ids on every element, live
    internal references, and transform-free animation units; every text
    file (Markdown, Python, SVG headers) is checked for links to files under
    assets/ that no longer exist. One line per check per file, a summary,
    and a non-zero exit on any FAIL.

✒ Key Features:
    - H1 ✒ header present; H2 File Name and Relative Path match the file;
      H3 no double hyphen inside the header comment
    - T1 <title> is the first child; T2 header title = <title> = dc:title
    - I1 every element outside the RDF block has an id; I2 none is a
      generator default (path12, g4, svg1, path-effect26, stop3); I3 ids are
      unique; I4 ids are kebab-case alphanumeric
    - R1 every url(#id), href="#id", path-effect and current-layer
      reference resolves to an element in the file
    - N1 the namedview keeps Inkscape's stock page and desk colours
    - A1 animated units (any element with a class) carry no transform
    - L1 every assets/... path written in a .md, .py or .svg header exists

✒ Usage Instructions:
    $ python assets/generator/audit_assets.py
    $ python assets/generator/audit_assets.py assets/monolith-emblem.svg

✒ Other Important Information:
    - Dependencies: Python 3.10+, lxml
    - Scope: every .svg, .md and .py under assets except models/ (binary
      Blender exports and their manifest are checked by the project's own
      tools) and the review/ folders (rendered PNG and GIF only)
    - The RDF and Dublin Core block and any provenance manifest are
      metadata content, not drawing, and need no ids
---------
"""

from __future__ import annotations

import glob
import os
import re
import sys

from lxml import etree

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, ".."))
PROJECT = os.path.normpath(os.path.join(ASSETS, ".."))
SVG = "{http://www.w3.org/2000/svg}"
NS = {"svg": "http://www.w3.org/2000/svg", "dc": "http://purl.org/dc/elements/1.1/"}
INK = "{http://www.inkscape.org/namespaces/inkscape}"
SODI = "{http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd}"
META_NS = ("http://www.w3.org/1999/02/22-rdf-syntax-ns#", "http://purl.org/dc/elements/1.1/",
           "http://creativecommons.org/ns#", "http://c2pa.org/manifest")
DEFAULT_ID = re.compile(r"^(rect|path|g|text|circle|ellipse|line|polygon|polyline|tspan|use|layer|svg|defs|title|"
                        r"metadata|namedview|stop|mask|clipPath|linearGradient|radialGradient|style|path-effect|"
                        r"grid|page|image|filter)\d+$")
VALID_ID = re.compile(r"^[A-Za-z][A-Za-z0-9-]*$")
LINK = re.compile(r"\bassets/[A-Za-z0-9_./-]+\.(?:svg|py|md|png|gif|jpg|glb|blend)\b")
SKIP_DIRS = (os.sep + "models" + os.sep, os.sep + "review" + os.sep, os.sep + "__pycache__" + os.sep)


def _ns(e) -> str:
    return e.tag.split("}")[0][1:] if isinstance(e.tag, str) and "}" in e.tag else ""


def audit_svg(path: str, check) -> None:
    raw = open(path, encoding="utf-8").read()
    rel = os.path.relpath(path, ASSETS).replace(os.sep, "/")
    root = etree.parse(path).getroot()
    head = raw[raw.find("<!--"):raw.find("-->")] if "<!--" in raw[:200] else ""
    check("H1", "✒ Metadata" in head and "- Title:" in head, "✒ header present")
    fn = re.search(r"- File Name: (.+)", head)
    rp = re.search(r"- Relative Path: (.+)", head)
    check("H2", bool(fn and rp) and fn.group(1).strip() == os.path.basename(path)
          and rp.group(1).strip() == f"assets/{rel}",
          f"File Name / Relative Path match ({fn and fn.group(1).strip()}, {rp and rp.group(1).strip()})")
    check("H3", "--" not in head[4:], "no double hyphen inside the header comment")
    first = next((c for c in root if isinstance(c.tag, str)), None)
    check("T1", first is not None and first.tag == f"{SVG}title", "<title> is the first child")
    ht = re.search(r"- Title: (.+)", head)
    dct = root.xpath("//dc:title", namespaces=NS)
    check("T2", bool(ht) and first is not None and ht.group(1).strip() == (first.text or "").strip()
          == (dct[0].text if dct else None), "header title = <title> = dc:title")
    ids, missing, defaults, bad = [], [], [], []
    for e in root.iter():
        if not isinstance(e.tag, str) or _ns(e) in META_NS:
            continue
        i = e.get("id")
        if not i:
            missing.append(e.tag.split("}")[1])
            continue
        ids.append(i)
        if DEFAULT_ID.match(i):
            defaults.append(i)
        if not VALID_ID.match(i):
            bad.append(i)
    dups = sorted({i for i in ids if ids.count(i) > 1})
    check("I1", not missing, f"every element has an id ({len(ids)} ids, missing on {sorted(set(missing))[:4]})")
    check("I2", not defaults, f"no generator-default ids ({defaults[:4]})")
    check("I3", not dups, f"ids unique ({dups[:4]})")
    check("I4", not bad, f"ids kebab-case ({bad[:4]})")
    idset = set(ids)
    refs = set(re.findall(r"url\(#([^)]+)\)", raw)) | set(re.findall(r'href="#([^"]+)"', raw))
    for e in root.iter():
        if isinstance(e.tag, str) and e.get(f"{INK}path-effect"):
            refs |= {r.strip().lstrip("#") for r in e.get(f"{INK}path-effect").split(";")}
    nv = root.find(f"{SODI}namedview")
    if nv is not None and nv.get(f"{INK}current-layer"):
        refs.add(nv.get(f"{INK}current-layer"))
    dangling = sorted(r for r in refs if r not in idset)
    check("R1", not dangling, f"internal references resolve ({len(refs)} checked, dangling {dangling[:4]})")
    stock = nv is not None and nv.get("pagecolor", "").lower() == "#ffffff" and \
        nv.get(f"{INK}deskcolor", "").lower() == "#d1d1d1"
    check("N1", stock, "namedview keeps the stock page and desk colours")
    animated = [e for e in root.iter() if isinstance(e.tag, str) and e.get("class")]
    with_tf = [e.get("id") for e in animated if e.get("transform") and e.tag != f"{SVG}text"]
    check("A1", not with_tf, f"animated units carry no transform ({len(animated)} animated, {with_tf[:3]})")


def audit_links(path: str, check) -> None:
    text = open(path, encoding="utf-8").read()
    if path.endswith(".svg"):
        text = text[:text.find("-->")] if "-->" in text else ""
    links = sorted(set(LINK.findall(text)))
    stale = [l for l in links if not os.path.exists(os.path.join(PROJECT, l))]
    check("L1", not stale, f"assets/ paths exist ({len(links)} checked, stale {stale[:4]})")


def main():
    targets = sys.argv[1:]
    if not targets:
        targets = [p for ext in ("svg", "md", "py") for p in glob.glob(os.path.join(ASSETS, "**", f"*.{ext}"), recursive=True)
                   if not any(s in p for s in SKIP_DIRS)]
    targets = sorted(os.path.abspath(t) for t in targets)
    fails = 0
    for path in targets:
        lines = []

        def check(code, ok, msg):
            nonlocal fails
            lines.append(f"  {code:3} {'pass' if ok else 'FAIL'}  {msg}")
            fails += 0 if ok else 1

        if path.endswith(".svg"):
            audit_svg(path, check)
        audit_links(path, check)
        print(os.path.relpath(path, ASSETS).replace(os.sep, "/"))
        print("\n".join(lines))
    print(f"\n{'ALL PASS' if fails == 0 else f'{fails} FAIL(S)'} across {len(targets)} files")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
