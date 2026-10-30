/*
✒ Metadata
    - Title: Crucible Board (MONOLITH Edition - v1.0)
    - File Name: crucible-board.js
    - Relative Path: js/ui/crucible-board.js
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
    A Crucible game expanded onto the 3D board: step through its moves,
    explore from any of them, and go back to the deck.

✒ Key Features:
    - crExpand() and crShowBoard(): a game onto the board.
    - crStep(): move through the game.
    - boardOverride: the position the board shows instead of the game's.
    - renderBoardCard() and crLeaveBoard().

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { boardOverride } from '../ui/crucible-board.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/board.js,
      scene/instruments.js, app/state.js, game/board-ui.js,
      game/ceremony.js, game/flow.js, game/input.js, ui/crucible.js and
      ui/crucible-view.js; globals Chess (js/core/chess.js) and Monolith
      (js/core/monolith.js).
    - Shared state (js/app/store.js): reads only app.view.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, prefs } from '../app/base.js';
import { placePieces } from '../scene/board.js';
import { INK, setVectors } from '../scene/instruments.js';
import { game, render, shown } from '../app/state.js';
import { deselect, showHighlights } from '../game/board-ui.js';
import { restPose } from '../game/ceremony.js';
import { explore } from '../game/flow.js';
import { sanMove } from '../game/input.js';
import { cr, crModel, pad2, resultText } from './crucible.js';
import { drawBeat } from './crucible-view.js';

/* ---------- Crucible: expanded game on the 3D board ---------- */
export let boardOverride = null;
function crGameStates(g) {
  if (g.states && g.states.length === g.moves.length + 1) return g;
  let st = Chess.newGame(); const states = [st], mvs = [];
  for (const san of g.moves) { const mv = sanMove(st, san); if (!mv) break; st = Chess.apply(st, mv); states.push(st); mvs.push(mv); }
  g.states = states; g.mvs = mvs; return g;
}
export function crExpand(i) {
  const m = crModel(); const g = m && m.games[i]; if (!g) return;
  crGameStates(g); cr.expanded = i; cr.sel = i;
  cr.ply = g.anomaly ? Math.min(g.anomaly.ply, g.states.length - 1) : g.states.length - 1;
  cr.view = 'board'; crShowBoard(); render();
}
export function crShowBoard() {
  const m = crModel(), g = m && m.games[cr.expanded];
  if (!g || prefs.tab !== 'crucible' || cr.view !== 'board') return crLeaveBoard();
  crGameStates(g);
  cr.ply = Math.max(0, Math.min(cr.ply, g.states.length - 1));
  const st = g.states[cr.ply], mv = cr.ply > 0 ? g.mvs[cr.ply - 1] : null;
  const fresh = !boardOverride || boardOverride.game !== g || boardOverride.ply !== cr.ply;
  boardOverride = { state: st, last: mv ? { from: mv.from, to: mv.to } : null, game: g, ply: cr.ply };
  if (fresh) { deselect(); placePieces(st); }
  const an_ = g.anomaly;
  if (an_ && cr.ply === an_.ply && g.mvs[an_.ply - 1]) { const c = g.mvs[an_.ply - 1]; const landed = st.board[c.to]; setVectors([{ from: c.from, to: c.to, color: INK.crimson, glow: 1.6, opacity: 0.95, radius: 0.036, reticle: true, name: 'crucible-anomaly-vector', landOn: landed ? landed.t : null }], g.states[an_.ply - 1]); }
  else setVectors([]);
  showHighlights(); renderBoardCard(); drawBeat(); renderCrMoves();
}
export function crLeaveBoard() {
  if (!boardOverride) return;
  boardOverride = null; setVectors([]);
  placePieces(shown()); if (app.view === null) restPose(game.result); showHighlights();
}
export function crStep(d) {
  const m = crModel(), g = m && m.games[cr.expanded]; if (!g) return;
  cr.ply = Math.max(0, Math.min(g.states.length - 1, cr.ply + d)); crShowBoard();
}
/* The Moves card lists the game on the board, numbered from its first move, with the ply in view
   marked; a move goes there, and the card's steps walk this game (controls.js). The move box
   rests: the Play game is not on the board, and moves tried here are explored by clicking a piece.
   The list is rebuilt only when it changes, keeping the keyboard focus on the same move. */
export function renderCrMoves() {
  const g = boardOverride && boardOverride.game, list = $('#moves'); if (!g) return;
  const sig = `cr ${g.index} ${g.moves.length} ${cr.ply}`;
  if (list.dataset.sig !== sig) {
    const a = document.activeElement, key = list.contains(a) && a.dataset.key;
    list.dataset.sig = sig; list.innerHTML = '';
    for (let i = 0; i < g.moves.length; i += 2) {
      const n = document.createElement('span'); n.className = 'num'; n.textContent = `${i / 2 + 1}.`; list.appendChild(n);
      for (const j of [i, i + 1]) {
        const s = document.createElement('span');
        if (g.moves[j]) {
          s.className = 'mv' + (j + 1 === cr.ply ? ' cur' : ''); s.textContent = g.moves[j]; s.tabIndex = 0; s.setAttribute('role', 'button'); s.dataset.key = `m${j}`;
          s.setAttribute('aria-label', `Show game ${g.index} after ${g.moves[j]}`);
          const go = () => { cr.ply = j + 1; crShowBoard(); };
          s.addEventListener('click', go); s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
        }
        list.appendChild(s);
      }
    }
    if (key) { const t = list.querySelector(`[data-key="${key}"]`); if (t) t.focus({ preventScroll: true }); }
    // the move in view is kept visible by scrolling the list itself, never the panel
    const c = list.querySelector('.cur');
    if (c) { const r = c.getBoundingClientRect(), b = list.getBoundingClientRect(); if (r.top < b.top) list.scrollTop -= b.top - r.top; else if (r.bottom > b.bottom) list.scrollTop += r.bottom - b.bottom; }
  }
  const last = g.states.length - 1;
  $('#nav-first').disabled = $('#nav-prev').disabled = cr.ply <= 0; $('#nav-next').disabled = $('#nav-last').disabled = cr.ply >= last;
  const inp = $('#move-input'); inp.disabled = true; inp.placeholder = 'Click a piece to try a move';
}
export function renderBoardCard() {
  const card = $('#board-card'), g = boardOverride && boardOverride.game;
  card.hidden = !g; if (!g) return;
  const a = g.anomaly, black = g.white === 'A' ? 'B' : 'A';
  card.innerHTML = '';
  const line = (cls, text) => { const el = document.createElement('div'); if (cls) el.className = cls; el.textContent = text; card.appendChild(el); return el; };
  line('ink', `Game #${pad2(g.index)}${a ? ' · anomaly' : ''}${g.live && !g.done ? ' · in progress' : ''}`);
  line('', `${g.opening} · White ${g.white} · Black ${black} · ${g.plies} plies${g.done ? ` · ${resultText(g.white_score)}` : ''}`);
  if (a) {
    const mvIdx = a.ply - 1, by = mvIdx % 2 === 0 ? g.white : black, num = Math.floor(mvIdx / 2) + 1;
    const big = line('mv-big', `${num}${mvIdx % 2 ? '…' : '.'}${g.moves[mvIdx]}`);
    big.title = 'The move after which the other engine\'s eval jumped';
    line('', `played by ${by} · its own eval ${Monolith.fmtCp(a.cause)}`);
    const other = by === 'A' ? 'B' : 'A';
    line('ink', `${other}'s eval ${Monolith.fmtCp(a.before)} → ${Monolith.fmtCp(a.after)}`);
    line('', 'balanced to decisive in one own move');
  }
  if (g.done) line('', `ended by ${g.termination}`);
  line('', `Ply ${cr.ply} of ${g.states.length - 1} · ← → to step`);
  if (prefs.explore && !explore.on) line('', 'Click a piece to try your own moves from here.');
  const back = document.createElement('div'); back.className = 'row';
  const b1 = document.createElement('button'); b1.className = 'btn outlined small'; b1.textContent = 'Back to the deck'; b1.addEventListener('click', () => { cr.view = 'deck'; crLeaveBoard(); render(); });
  back.appendChild(b1); card.appendChild(back);
}
