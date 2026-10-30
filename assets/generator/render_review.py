#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✒ Metadata
    - Title: MONOLITH Review Renderer (MONOLITH Edition - v1.1)
    - File Name: render_review.py
    - Relative Path: assets/generator/render_review.py
    - Artifact Type: python
    - Version: 1.1.0
    - Date: 10/26/2026
    - Update: Monday, October 26, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      from render_mockups.py and moved into assets/generator when Dennis
      had the assets folder cleaned up; it now renders the brand as well
      (the two official marks, the variants and the generated kit into
      assets/brand/review) beside the mock-ups.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Fable 5.1] — First
      version, mock-ups only.

✒ Description:
    Renders the MONOLITH SVGs for review: a PNG of every brand file and
    every mock-up at its finished state (CSS animations switched off), and
    for each loading screen an animated GIF made by scrubbing the page's
    Web Animations clock frame by frame, so the GIF shows exactly what the
    browser would play. Brand renders land in assets/brand/review, mock-up
    renders in assets/mockups/review.

✒ Key Features:
    - Headless Chromium through Playwright; each SVG is inlined in a page
      so its <style> animations run as they would in the app
    - Stills: `* { animation: none !important }` injected, one screenshot
    - GIFs: document.getAnimations() paused and stepped by currentTime, so
      the frames are deterministic and the GIF holds on the final state
    - Sizes: brand files at 1100 px on the long side, mock-ups at 75 %

✒ Usage Instructions:
    $ python assets/generator/render_review.py              # brand and mock-ups
    $ python assets/generator/render_review.py --only loading-01
    $ python assets/generator/render_review.py --set brand

✒ Command-Line Arguments:
    Input:
        --set NAME    brand | mockups | all (default all)
        --only NAME   Render only the files whose name starts with NAME

✒ Other Important Information:
    - Dependencies: Python 3.10+, playwright (Chromium installed), Pillow
    - Fonts: the renders use whatever Inter and JetBrains Mono the
      rendering machine has; the SVGs name those families with fallbacks
    - Output is review material: regenerate it, never edit it
---------
"""

from __future__ import annotations

import argparse
import asyncio
import glob
import io
import os
import re

from PIL import Image
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, ".."))
MOCKUPS = os.path.join(ASSETS, "mockups")
BRAND = os.path.join(ASSETS, "brand")

# name prefix -> (gif seconds, fps, scale)
GIFS = {
    "loading-01": (3.6, 12, 0.5),
    "loading-02": (3.4, 12, 0.5),
    "loading-03": (2.4, 12, 0.5),
    "loading-04": (3.4, 12, 0.5),
}


def page_html(svg_text: str, w: int, h: int, freeze: bool, ground: str = "#000") -> str:
    svg_text = re.sub(r'(<svg[^>]*?)\swidth="[^"]*"', rf'\1 width="{w}"', svg_text, count=1)
    svg_text = re.sub(r'(<svg[^>]*?)\sheight="[^"]*"', rf'\1 height="{h}"', svg_text, count=1)
    extra = "<style>* { animation: none !important; }</style>" if freeze else ""
    return (f"<!doctype html><html><head>{extra}</head>"
            f"<body style='margin:0;background:{ground}'>{svg_text}</body></html>")


def size_of(svg: str, long_side: float | None, scale: float | None):
    vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    W, H = float(vb.group(1)), float(vb.group(2))
    k = (long_side / max(W, H)) if long_side else scale
    return W, H, round(W * k), round(H * k)


async def render(jobs: list[tuple[str, str, float | None, float | None, str]]):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for f, out, long_side, scale, ground in jobs:
            os.makedirs(out, exist_ok=True)
            name = os.path.basename(f)[:-4]
            svg = open(f, encoding="utf-8").read()
            W, H, w, h = size_of(svg, long_side, scale)
            page = await browser.new_page(viewport={"width": w, "height": h})
            await page.set_content(page_html(svg, w, h, freeze=True, ground=ground))
            await page.wait_for_timeout(150)
            await page.screenshot(path=os.path.join(out, f"{name}.png"))
            await page.close()
            print("still", os.path.relpath(os.path.join(out, name + ".png"), ASSETS).replace(os.sep, "/"))
            spec = next((v for k, v in GIFS.items() if name.startswith(k)), None)
            if spec is None:
                continue
            secs, fps, gscale = spec
            gw, gh = round(W * gscale), round(H * gscale)
            page = await browser.new_page(viewport={"width": gw, "height": gh})
            await page.set_content(page_html(svg, gw, gh, freeze=False, ground=ground))
            await page.wait_for_timeout(100)
            await page.evaluate("document.getAnimations().forEach(a => a.pause())")
            frames = []
            for i in range(int(secs * fps) + 1):
                await page.evaluate("t => document.getAnimations().forEach(a => { a.currentTime = t; })", i / fps * 1000)
                png = await page.screenshot()
                frames.append(Image.open(io.BytesIO(png)).convert("RGB").quantize(colors=128, method=Image.Quantize.MEDIANCUT))
            await page.close()
            gif = os.path.join(out, f"{name}.gif")
            durations = [round(1000 / fps)] * len(frames)
            durations[-1] = 900                   # hold the finished state before the loop
            frames[0].save(gif, save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=False)
            print("gif  ", os.path.relpath(gif, ASSETS).replace(os.sep, "/"), f"{len(frames)} frames, {os.path.getsize(gif) // 1024} KB")
        await browser.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", default="all", choices=["brand", "mockups", "all"])
    ap.add_argument("--only", default="")
    args = ap.parse_args()
    jobs = []
    if args.set in ("brand", "all"):
        brand_files = [os.path.join(ASSETS, "monolith-logo.svg"), os.path.join(ASSETS, "monolith-emblem.svg")]
        brand_files += sorted(glob.glob(os.path.join(BRAND, "variants", "*.svg")))
        brand_files += sorted(glob.glob(os.path.join(BRAND, "*.svg")))
        jobs += [(f, os.path.join(BRAND, "review"), 1100, None, "#8a8a8a") for f in brand_files]
    if args.set in ("mockups", "all"):
        jobs += [(f, os.path.join(MOCKUPS, "review"), None, 0.75, "#000")
                 for f in sorted(glob.glob(os.path.join(MOCKUPS, "*.svg")))]
    jobs = [j for j in jobs if os.path.basename(j[0]).startswith(args.only)]
    asyncio.run(render(jobs))


if __name__ == "__main__":
    main()
