<!--
✒ Metadata
    - Title: Level Calibration (MONOLITH Edition - v1.1)
    - File Name: CALIBRATION.md
    - Relative Path: CALIBRATION.md
    - Artifact Type: docs
    - Version: 1.1.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      chose to publish the calibration kit. Each of its files had a copy
      or a newer version in the project already, so it became this guide
      at the project's root: the calibrator runs from the project folder
      against the page's own files, and a recipe measures an older
      single-file page.
    - 1.0.0 (10/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, as the README of the self-contained calibration kit built
      so Dennis could run large calibration batches on his own machine.

✒ Description:
    How to run the MONOLITH level calibrator, tools/calibrate.js, and how to
    read what it reports. It estimates how strong each of the computer's
    levels plays, on Stockfish's UCI_Elo scale.

✒ Key Features:
    - One command from the project folder; nothing to install beyond
      Node.js.
    - Recipes for a full sweep, one level, levels below the anchors, a
      saved PGN, slower anchors and an older single-file page.
    - What each column of the results means.
    - How far to trust the numbers, and why comparisons between levels
      hold up better than the absolute ratings.

✒ Other Important Information:
    - Dependencies: Node.js 16 or newer; the vendored Stockfish 19 build
      in engine/.
    - Compatible platforms: Windows, macOS and Linux.
    - The calibrator's own header lists every option, and
      `node tools/calibrate.js --help` prints them.
---------
-->

# Level calibration

`tools/calibrate.js` plays the game's computer levels against Stockfish's Elo-limited mode and
estimates how strong each level really is. It loads the rules, the level table and the move
picker from `js/core/chess.js` and `js/core/levels.js`, the same files the page loads, so it
measures exactly what the game plays.

## Run it

From the project folder (the one that holds `js/` and `engine/`):

```shell
node tools/calibrate.js
```

That runs every level against Elo 1320, 1600, 2000 and 2400, 100 games per pairing, using all
but one CPU core. Each game takes about 10 to 20 seconds of one core. Press Ctrl+C at any time
and it reports what has finished so far.

## Recipes

```shell
# one level, tighter estimate
node tools/calibrate.js --levels 4 --vs elo:1500,elo:1800 --games 400

# levels below Stockfish's 1320 floor: measure them against a level you have already placed
node tools/calibrate.js --levels 1,2 --vs level:3 --games 300

# keep the games to replay them
node tools/calibrate.js --levels 4 --vs elo:1800 --games 200 --pgn club.pgn

# closer to the anchors' own scale (slower)
node tools/calibrate.js --levels 5 --vs elo:2200 --anchor-ms 1000

# an older release: a single-file page (2.4.0 and earlier) is read directly
node tools/calibrate.js --page path/to/wizards-chess.html --levels 4 --vs elo:1800

# every option
node tools/calibrate.js --help
```

## Reading the results

The console table and `calibration.csv` give, for each pairing:

| Column | Meaning |
| --- | --- |
| `w`, `d`, `l` | wins, draws and losses for the level |
| `score` | (wins + half the draws) ÷ games |
| `elo_diff` | rating gap implied by the score |
| `estimate` | anchor rating + gap, on the anchors' UCI_Elo scale |
| `margin95` | ± range that holds with 95% confidence, from the results alone |
| `avg_plies` | average game length in half-moves |

A level that wins or loses every game against an anchor has no measurable gap. The tool reports
"above" or "below" instead of a number; add a stronger or weaker anchor to place it.

`calibration.csv` is written to the folder you run from; Git leaves it out (see `.gitignore`).

## How far to trust it

- The margin shrinks with more games: about ±70 at 100 games, ±35 at 400.
- Comparisons between levels are more reliable than the absolute numbers. The anchors run
  Stockfish's limiter at short move times, and that limiter is calibrated at much longer time
  controls.
- UCI_Elo is an engine-rating scale, not FIDE or an online site's rating.

A retune of the level table (`LEVELS` in `js/core/levels.js`) starts from `calibration.csv`,
and from the PGN when one was saved.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->
