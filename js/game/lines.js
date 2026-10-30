/*
✒ Metadata
    - Title: Evaluation Lines (MONOLITH Edition - v1.0)
    - File Name: lines.js
    - Relative Path: js/game/lines.js
    - Artifact Type: javascript
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
      chose.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The evaluation bar and best line for the position on screen, and
    Calculate moves: the engine's MultiPV candidates drawn as ranked arrows.

✒ Key Features:
    - refreshAnalysis(): the evaluation bar and best line, for the position
      shown.
    - evalView(): the bar's state.
    - calculateMoves(): MultiPV candidates as ranked arrows.
    - scoreOf() and pvToSan().

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 14 of 26. Other modules import from it,
    for example:
        import { refreshAnalysis, emptyCalc } from '../game/lines.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, app/state.js,
      game/engine.js, game/play.js, game/flow.js and ui/panels.js; globals
      Chess (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.calc; reads app.analysisGen
      and app.cpuThinking.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, prefs } from '../app/base.js';
import { learn, render, shown } from '../app/state.js';
import { engine } from './engine.js';
import { posCmdFor, positionCmd, resultFor, stateIndex } from './play.js';
import { explore, exploreState } from './flow.js';
import { renderEvalOnly } from '../ui/panels.js';

/* ---------- analysis: evaluation bar + best line, for the position on screen ---------- */
/* shared, in app/store.js: app.analysisGen */
export function pvToSan(state, uci, max = 8) {
  const out = []; let st = state;
  for (const u of uci.slice(0, max)) {
    const mv = Chess.fromUci(st, u); if (!mv) break;
    const nx = Chess.apply(st, mv);
    out.push((st.turn === 'w' ? `${st.fullmove}.` : (out.length === 0 ? `${st.fullmove}…` : '')) + Chess.san(st, mv, nx)); st = nx;
  }
  return out.join(' ');
}
/* Engine scores come from the side to move; the page always reports them from marble's side. */
export function scoreOf(inf, state) {
  const sign = state.turn === 'w' ? 1 : -1;
  if (inf.kind === 'mate') { const m = inf.value * sign; return { pct: m > 0 ? 100 : 0, label: (m > 0 ? '+M' : '−M') + Math.abs(m) }; }
  const cp = inf.value * sign; return { pct: 100 / (1 + Math.exp(-cp / 350)), label: (cp >= 0 ? '+' : '−') + (Math.abs(cp) / 100).toFixed(1) };
}
export let evalView = { pct: 50, label: '0.0', line: '', depth: 0 };
export function refreshAnalysis() {
  // the evaluation bar belongs to Play; Analyze and Crucible run their own engines
  if (!prefs.evalOn || !engine.ready || app.cpuThinking || prefs.tab === 'analyze' || prefs.tab === 'crucible') return;
  const st = explore.on ? exploreState() : shown(), r = resultFor(st), gen = ++app.analysisGen;
  if (r) { evalView = { pct: r.winner === 'w' ? 100 : r.winner === 'b' ? 0 : 50, label: r.winner ? (r.winner === 'w' ? '1–0' : '0–1') : '½–½', line: r.text, depth: 0 }; render(); return; }
  evalView.line = 'Thinking…'; render();
  engine.go(posCmdFor(st), { depth: 16 }, inf => {
    if (gen !== app.analysisGen || (explore.on ? exploreState() : shown()) !== st || inf.multipv !== 1) return;
    const s = scoreOf(inf, st); evalView = { pct: s.pct, label: s.label, line: pvToSan(st, inf.pv), depth: inf.depth };
    renderEvalOnly();
  });
}

/* ---------- calculate moves: MultiPV candidates as ranked arrows ---------- */
export const emptyCalc = () => ({ state: null, lines: [], active: -1, running: false, depth: 0 });
/* shared, in app/store.js: app.calc */
export async function calculateMoves() {
  const st = shown(); if (!engine.ready || resultFor(st) || app.cpuThinking) return;
  $('#engine-lines').open = true;   // the candidates show inside the engine lines
  const count = Math.min(prefs.lines, Chess.allLegal(st).length);
  app.calc = { state: st, lines: new Array(count).fill(null), active: -1, running: true, depth: 0 };
  render();
  let lastDraw = 0; const gen = engine.gen + 1;
  await engine.go(positionCmd(stateIndex(st)), { depth: 16, movetime: 3000, multipv: count }, inf => {
    if (app.calc.state !== st || inf.multipv > count) return;
    app.calc.lines[inf.multipv - 1] = inf; app.calc.depth = Math.max(app.calc.depth, inf.depth);
    const now = performance.now(); if (now - lastDraw > 150) { lastDraw = now; render(); }
  });
  if (app.calc.state !== st) return;          // a newer calculation owns the panel
  app.calc.running = false; learn('calc'); render();
  if (gen === engine.gen && shown() === st) refreshAnalysis();
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  // ---------- calculate moves: MultiPV candidates as ranked arrows
  app.calc = emptyCalc();
}
