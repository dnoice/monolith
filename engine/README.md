<!--
✒ Metadata
    - Title: Vendored Stockfish Engine (MONOLITH Edition - v1.5)
    - File Name: README.md
    - Relative Path: engine/README.md
    - Artifact Type: docs
    - Version: 1.5.2
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.5.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose. As he asked, his fork also keeps a copy of the network the
      build embeds, on its v19.0.1-net branch, checked byte for byte
      against the one inside the vendored engine.
    - 1.5.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      forked stockfish.js to his own GitHub account, so the engine's source
      is listed in two places: upstream, and his fork, which carries the
      same v19.0.1 tag at the same commit.
    - 1.5.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — For
      the public repository Dennis is preparing: where the engine's
      complete source is (stockfish.js 19.0.1, by tag and commit) and how
      its lite single-threaded build is made, the directions GPL-3.0 asks
      for beside object code published from a server; and, from the
      release audit, what happens when an engine stops after it started.
    - 1.4.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      the separation of concerns Dennis asked for, the engine client is
      js/game/engine.js and the page runs only from a server; the loading
      contract says so.
    - 1.3.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      Coach Dennis asked for in 2.3.0 runs a Worker of its own; the
      loading contract lists it beside the play engine.
    - 1.2.0 (10/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis's
      desktop copy ran Stockfish 10; the contract gains the unpkg tier for
      pages opened from disk, and what the page says on Stockfish 10.
    Earlier entries: several engine Workers at once for Dennis's MONOLITH
    hybrid, and the build's missing tbhits (1.1.0, 10/15/2026); the first
    vendoring of Stockfish 19 lite (1.0.0, 10/14/2026, with release 1.2.0
    of the page); see CHANGELOG.md.

✒ Description:
    Records the third-party chess engine vendored into this folder: what it
    is, where it came from, how to verify it, and how the page loads it. The
    engine files themselves are upstream builds and carry their own GPL-3.0
    notices, so they stay byte-for-byte as published and take no house
    header.

✒ Key Features:
    - Source, version and license of every vendored file.
    - SHA-256 hashes so a later sweep can confirm nothing was altered.
    - Where the engine's complete source is (GPL-3.0's Corresponding
      Source), and how this build is made from it.
    - The loading contract the page relies on, so an upgrade knows what to
      keep.

✒ Other Important Information:
    - Dependencies: none; this file is documentation.
    - Compatible platforms: any Markdown renderer.
---------
-->

# Vendored Stockfish engine

This folder holds Stockfish 19 for the MONOLITH page, unmodified from the
upstream npm build. The engine files are third-party code, so they keep their
own notices and carry no house header. This README is the house record of the
vendoring.

## Files

| File | Source | Size | SHA-256 |
| --- | --- | --- | --- |
| `stockfish-19-lite-single.js` | npm `stockfish@19.0.1`, `bin/stockfish-19-lite-single.js` | 28,230 B | `ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a` |
| `stockfish-19-lite-single.wasm` | npm `stockfish@19.0.1`, `bin/stockfish-19-lite-single.wasm` | 1,845,971 B | `ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de` |
| `COPYING.txt` | npm `stockfish@19.0.1`, `Copying.txt` (GNU GPL v3) | 35,821 B | `0b383d5a63da644f628d99c33976ea6487ed89aaa59f0b3257992deac1171e6b` |

- Engine: Stockfish 19, released 09/05/2026 by the Stockfish developers.
- Build: stockfish.js by Nathan Rugg and Chess.com, the lite single-threaded
  WebAssembly flavor. It uses a small NNUE network (`nn-61e7af4bb97d`), so it is
  weaker than full Stockfish but loads at about 1.8 MB instead of about 94 MB, and
  it needs no cross-origin isolation.
- License: GPL-3.0. `COPYING.txt` ships beside the engine as the license requires.

## Source code

The two engine files are object code. Their complete source, the Corresponding Source GPL-3.0
asks for, is stockfish.js 19.0.1: tag `v19.0.1`, commit `0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6`.
It is kept in two places:

- **Upstream:** <https://github.com/nmrugg/stockfish.js>, where the build comes from.
- **MONOLITH's fork:** <https://github.com/dnoice/stockfish.js>, a full copy. Its 456 branches and
  tags match upstream's, `v19.0.1` at the same commit (both checked 10/23/2026). Its
  `v19.0.1-net` branch adds one commit on top of the tag, `536618e`: the network file the build
  embeds, so the fork builds this engine without a download.

Either one holds Stockfish 19's C++ source under `src/`, the WebAssembly build scripts and the
licence (`Copying.txt`, the same file as `COPYING.txt` here, by its SHA-256). This flavour is
built with `npm run build-single-lite` (`node build.js --single-threaded --lite`) under emscripten
6.0.9, as the repository's README describes. The build embeds a small network,
`nn-61e7af4bb97d.nnue` (named in `src/evaluate.h`), from `src/`; when the file is missing it
downloads it from Stockfish's network server. Upstream does not hold that file. The fork's
`v19.0.1-net` branch does, at `src/nn-61e7af4bb97d.nnue`: 1,166,381 bytes, SHA-256
`61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b`, downloaded from that server
on 10/24/2026. It is the network inside `stockfish-19-lite-single.wasm` here, byte for byte (read
from the WebAssembly file's data segments). Stockfish's networks repository
(<https://github.com/official-stockfish/networks>) says networks are uploaded to that server under
the CC0 licence.

Publishing this folder from a server (a public repository, GitHub Pages) conveys the engine's object
code. GPL-3.0 section 6(d) allows the source to sit on another server, as it does here, provided
these directions stay beside the object code and the source stays available for as long as the
object code is offered. The fork keeps that availability in Dennis's hands whatever happens
upstream, and the upstream link records where the build came from.

## How the page loads it

- `js/game/engine.js` (the page's Stockfish client) starts
  `new Worker('engine/stockfish-19-lite-single.js')`. The path resolves against the page, not the
  module, so this folder stays beside the page.
- The worker finds its WebAssembly by swapping `.js` for `.wasm` in its own URL, unless
  the Worker URL's hash names it (`…#<encoded .wasm address>`). Beside the page the two
  files must stay side by side with matching names, and the `.wasm` file must be served
  as `application/wasm`.
- When that Worker cannot start (this folder is missing, or a host refuses it), the second tier
  is the same build from unpkg,
  `https://unpkg.com/stockfish@19.0.1/bin/stockfish-19-lite-single.js`, loaded with
  `importScripts` in a blob Worker whose URL hash carries the matching `.wasm` address.
  unpkg serves both files byte for byte as vendored here (the hashes above match, checked
  10/15/2026) with `Access-Control-Allow-Origin: *`. jsDelivr refuses this package: at
  over 150 MB it exceeds jsDelivr's package limit.
- The engine speaks UCI over `postMessage`. Besides UCI text lines it posts
  download-progress objects; the page ignores anything that isn't a string.
- An engine that stops working after it has started (its Worker errors) answers the search it
  had in hand with nothing, is started again once, and after a second stop is reported as failed,
  so no search waits on a dead Worker.
- If a tier errors or doesn't answer `uciok` within 20 seconds, the page tries the next;
  the last resort is Stockfish 10.0.2 (asm.js) from cdnjs. Stockfish 10 has no
  `UCI_LimitStrength`, `UCI_Elo` or `UCI_ShowWDL`, and its hash is fixed at 16 MB, so on
  it the page names Stockfish 10 everywhere, shows the real hash, says WDL is not
  reported, approximates Expert and Master with its own move chooser (and says so), and
  disables UCI_Elo in Crucible. If every tier fails, friend games still work and the
  Engine lines in the Coach card say why.
- Several Workers run from these files at once, each its own engine with its own hash:
  one for play (it also answers a hint when the Coach has no line ready), one for the
  Coach (32 MB), two for Analyze (the main search and the root field), and two per
  game slot in a live Crucible run (up to four slots). The page reads
  each engine's `option` list and sets only options it offers.
- This build has no Syzygy support (no `SyzygyPath` option), so its `info` lines
  carry no `tbhits`; the page reports that as "not reported" rather than zero.

## Upgrading

1. Fetch the new `bin/stockfish-<n>-lite-single.js` and `.wasm` from the same npm
   package, along with `Copying.txt`.
2. Update the worker path and the unpkg address (`SF19_CDN`) in `ENGINES` in
   `js/game/engine.js`, and the engine name and `family`/`short` labels.
3. Replace the rows above with the new sizes and hashes, then bump this file's
   version.

## Verification

```shell
sha256sum engine/stockfish-19-lite-single.js engine/stockfish-19-lite-single.wasm engine/COPYING.txt
```

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->

