#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH Asset Build (MONOLITH Edition - v1.0)
    - File Name: build_all.py
    - Relative Path: assets/generator/build_all.py
    - Artifact Type: python
    - Version: 1.0.0
    - Date: 10/26/2026
    - Update: Monday, October 26, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      version, written when Dennis had the generators gathered into one
      folder and asked that nothing break: one command rebuilds every
      generated asset in order and audits the folder.

✒ Description:
    Rebuilds every generated MONOLITH asset in dependency order and then
    audits the whole assets folder: the brand system first (the official
    logo and emblem, the variants, the generated kit), then the mock-ups
    that are built on the official marks, then the audit. With --render it
    also writes the review PNGs and GIFs. Stops at the first step that
    fails, so a broken generator is never followed by a stale audit.

✒ Key Features:
    - Steps: conical_m.py, build_mockups.py, audit_assets.py, and with
      --render render_review.py
    - --relabel runs relabel_sources.py first, after an Inkscape pass on
      the kit or the meter
    - Each step runs as its own process with this folder as its working
      directory, exactly as it runs by hand

✒ Usage Instructions:
    $ python assets/generator/build_all.py
    $ python assets/generator/build_all.py --relabel --render

✒ Command-Line Arguments:
    Input:
        --relabel    Relabel the hand-drawn sources before building
    Output:
        --render     Also render the review PNGs and GIFs (needs Playwright)

✒ Other Important Information:
    - Dependencies: Python 3.10+ and what the steps need (shapely, numpy,
      lxml, svgpathtools; Pillow and playwright for --render)
    - Exit code: 0 when every step passed, otherwise the failing step's
---------
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def run(script: str, *args: str) -> None:
    print(f"\n== {script} {' '.join(args)}".rstrip())
    code = subprocess.call([sys.executable, os.path.join(HERE, script), *args], cwd=HERE)
    if code:
        print(f"{script} failed with exit code {code}")
        sys.exit(code)


def main():
    ap = argparse.ArgumentParser(description="Rebuild and audit every generated MONOLITH asset.")
    ap.add_argument("--relabel", action="store_true")
    ap.add_argument("--render", action="store_true")
    args = ap.parse_args()
    if args.relabel:
        run("relabel_sources.py")
    run("conical_m.py")
    run("build_mockups.py")
    run("audit_assets.py")
    if args.render:
        run("render_review.py")


if __name__ == "__main__":
    main()
