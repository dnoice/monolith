/*
✒ Metadata
    - Title: Computer Levels (MONOLITH Edition - v1.0)
    - File Name: levels.js
    - Relative Path: js/core/levels.js
    - Artifact Type: library
    - Version: 1.0.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose, and this header names the page by its file in the repository,
      index.html.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: LEVELS, LEVEL_NO_ELO and chooseMove, moved
      out of wizards-chess.html 2.4.0 when Dennis asked for a proper
      separation of concerns.

✒ Description:
    The eight computer levels and the move chooser that weakens Stockfish
    for levels 1 to 5. It is a file of its own so the calibrator plays
    exactly the levels the page plays.

✒ Key Features:
    - LEVELS: name, search limits, candidate lines, spread and slip for each
      of the eight levels, with the blurb the Play tab shows.
    - chooseMove: picks among the engine's top lines with a preference that
      falls off by spread centipawns, or slips to a random legal move.
    - LEVEL_NO_ELO: the tightened chooser Expert and Master borrow when the
      engine has no UCI_Elo limiter.
    - In Node it loads js/core/chess.js itself when Chess is not already
      defined.

✒ Usage Instructions:
    Loaded by index.html after js/core/chess.js as a classic script, so
    LEVELS and chooseMove are globals for the modules. In Node:
        const { LEVELS, chooseMove } = require('./js/core/levels.js');

✒ Examples:
    LEVELS[3].name;   // 'Club'
    // lines: the engine's MultiPV info lines for st, best first
    const mv = chooseMove(st, lines, LEVELS[3]);

✒ Other Important Information:
    - Dependencies: Chess (js/core/chess.js).
    - Compatible platforms: current browsers as a classic script (it defines
      a global), and Node.js 18 or newer through require().
    - Used by: game/play.js, ui/panels.js, ui/crucible.js,
      ui/crucible-view.js and tools/calibrate.js.
---------
*/
/* Strength. Stockfish's Skill Level barely weakens it at short searches (it finds a hanging queen
   every time from Skill 2 up), so levels 1–5 choose the move here: Stockfish reports its top
   `lines` moves, the page picks one with a preference that falls off by `spread` centipawns of
   loss, and with chance `slip` plays a random legal move instead. Levels 6–7 use Stockfish's
   calibrated UCI_Elo limiter; level 8 is unrestricted. */
const LEVELS = [
  { name: 'Novice',   lines: 8, depth: 3,  ms: 200,  spread: 300, slip: 0.30, blurb: 'Blunders often and misses free pieces. Good for learning how the pieces move.' },
  { name: 'Beginner', lines: 8, depth: 4,  ms: 250,  spread: 190, slip: 0.15, blurb: 'Hangs pieces now and then and overlooks simple tactics.' },
  { name: 'Casual',   lines: 6, depth: 5,  ms: 300,  spread: 110, slip: 0.07, blurb: 'Develops sensibly but makes regular mistakes you can punish.' },
  { name: 'Club',     lines: 5, depth: 6,  ms: 400,  spread: 60,  slip: 0.03, blurb: 'A solid club player. Takes free material and makes the odd inaccuracy.' },
  { name: 'Strong',   lines: 4, depth: 8,  ms: 600,  spread: 28,  slip: 0.01, blurb: 'Plays accurate chess with occasional second-best moves.' },
  { name: 'Expert',   elo: 2000, depth: 12, ms: 900,  blurb: 'Stockfish limited to roughly expert strength. Rarely blunders.' },
  { name: 'Master',   elo: 2500, depth: 16, ms: 1500, blurb: 'Stockfish limited to roughly master strength. Calculates deeply.' },
  { name: 'Maximum',  depth: 20, ms: 2500, blurb: 'Unrestricted Stockfish. No human player is expected to win.' }
];
/* Expert and Master lean on Stockfish's UCI_Elo limiter. An engine without it (the Stockfish 10
   fallback) would quietly play them at full strength, so there they borrow the page's own
   chooser, tightened past Strong; the level text says so. */
const LEVEL_NO_ELO = { 6: { lines: 4, spread: 16, slip: 0 }, 7: { lines: 3, spread: 7, slip: 0 } };
/* Pick a move at a weakened level from the engine's lines (scores are from the mover's side). */
function chooseMove(st, lines, L) {
  const legal = Chess.allLegal(st);
  if (Math.random() < L.slip) { const m = legal[Math.floor(Math.random() * legal.length)]; return m.needsPromo ? Object.assign({}, m, { promo: 'q', needsPromo: false }) : m; }
  const val = inf => inf.kind === 'mate' ? (inf.value > 0 ? 100000 - inf.value * 100 : -100000 - inf.value * 100) : inf.value;
  const cands = lines.filter(Boolean).map(inf => ({ inf, v: val(inf), mv: Chess.fromUci(st, inf.pv[0]) })).filter(c => c.mv);
  if (!cands.length) return null;
  const best = Math.max(...cands.map(c => c.v));
  const w = cands.map(c => Math.exp(-Math.min(best - c.v, 3000) / L.spread));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) return cands[i].mv; }
  return cands[0].mv;
}
// In Node (the calibration tools) Chess comes from its own file; in the page it is a global.
if (typeof module !== 'undefined') {
  if (typeof Chess === 'undefined') globalThis.Chess = require('./chess.js');
  module.exports = { LEVELS, LEVEL_NO_ELO, chooseMove };
}
