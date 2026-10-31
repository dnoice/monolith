/*
✒ Metadata
    - Title: App State (MONOLITH Edition - v1.0)
    - File Name: state.js
    - Relative Path: js/app/state.js
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
    The app layer's core: the game record, the match being played, the words
    for sides and pieces, the tips system and the render registry. Panels
    register a renderer with onRender(); render() runs them all from one
    context, so a new panel is never wired into anyone else's code.

✒ Key Features:
    - game: the states, moves, SANs and result of the game on the board.
    - match and draft: the game being played, and the settings being chosen
      for the next one.
    - cur(), shown(), cpuSide(), isCpuTurn() and canMoveNow().
    - Vocabulary: SIDE (Marble, Obsidian), SIDE_COLOR, GLYPH and the king
      icon.
    - Tips: tip(id) and learn(id), with the once, always and off modes.
    - applyPrefs(): speed, sound and coordinates from the preferences.
    - onRender() and render(): the render registry.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 10 of 26. Other modules import from it,
    for example:
        import { render, game, cur } from '../app/state.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/board.js,
      game/board-ui.js, game/flow.js and app/snapshot.js; globals Chess
      (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.SPEED, app.muted and
      app.orient; reads app.started, app.setupOpen, app.rolling,
      app.selected, app.legalFor, app.busy, app.lastMove, app.view,
      app.hint, app.cpuThinking and app.fenDirty.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from './store.js';
import { prefs, reduceMotion, savePrefs } from './base.js';
import { lblE, lblN, lblS, lblW } from '../scene/board.js';
import { showHighlights } from '../game/board-ui.js';
import { exploreCheck } from '../game/flow.js';
import { boardOverride } from '../ui/crucible-board.js';
import { snapshot } from './snapshot.js';

/* =====================================================================================
   App layer. Everything below is UI and game flow; the rules live in Chess, the 3D world
   above. Panels register a renderer with onRender(); render() runs them all from one
   context object, so a new panel never has to be wired into anyone else's code.
   ===================================================================================== */

/* ---------- tips ----------
   Coaching text ("Select a piece…", the castling chip, the orbit hint, panel intros) is a tip.
   Status text (check, thinking, reviewing an earlier move, errors) is not, and always shows.
   Tips mode: 'once' hides each tip after the player has done what it describes, 'always' keeps
   them, 'off' hides them all. A new tip is one id: mark its element with data-tip="id" (or
   test tip('id') in a renderer) and call learn('id') where the player does the thing. */
export const TIP_IDS = ['start', 'setup-intro', 'select', 'castle', 'orbit', 'analyze-intro', 'crucible-intro', 'position-intro', 'calc'];
export function tip(id) { return prefs.tips === 'always' || (prefs.tips !== 'off' && !prefs.learned[id]); }
export function learn(id) {
  if (prefs.learned[id]) return;
  prefs.learned[id] = true; savePrefs();
  if (typeof render === 'function' && renderers.length) render();
}
const SPEEDS = { normal: 1, fast: 0.55, minimal: 0.25 };
export function applyPrefs() {
  app.SPEED = Math.min(SPEEDS[prefs.speed] || 1, reduceMotion ? 0.3 : 1);
  app.muted = !prefs.sound;
  for (const l of [lblS, lblN, lblW, lblE]) l.visible = prefs.coords;
}

/* ---------- vocabulary ---------- */
export const SIDE = { w: 'Marble', b: 'Obsidian' };
/* The avatar king: a drawn icon rather than the ♔/♚ glyph, whose position inside the circle
   depends on whichever font the system substitutes for chess symbols. */
export const KING_ICON = '<svg class="king-icon" viewBox="0 0 24 24" aria-hidden="true"><rect class="king-icon-cross-upright" x="11.1" y="2.6" width="1.8" height="4.4" rx=".3"/><rect class="king-icon-cross-arm" x="9.9" y="3.8" width="4.2" height="1.7" rx=".3"/><path class="king-icon-crown" d="M8.3 11C8.3 8.6 9.9 7.2 12 7.2S15.7 8.6 15.7 11Z"/><rect class="king-icon-collar" x="8" y="11.5" width="8" height="1.5" rx=".75"/><path class="king-icon-body" d="M9.6 13.4H14.4L15.9 18.8H8.1Z"/><rect class="king-icon-base" x="6.6" y="19.3" width="10.8" height="2.1" rx="1.05"/></svg>';
export const SIDE_COLOR = { w: 'white', b: 'black' };
export const GLYPH = { w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }, b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' } };

/* ---------- state ---------- */
export const game = { states: [Chess.newGame()], moves: [], sans: [], result: null };
export let match; // set in init()
export let draft; // set in init()
/* shared, in app/store.js: app.started, app.setupOpen, app.rolling, app.orient */
/* shared, in app/store.js: app.selected, app.legalFor, app.busy, app.lastMove, app.view, app.hint, app.cpuThinking */
/* shared, in app/store.js: app.fenDirty */
export const cur = () => game.states[game.states.length - 1];
export const shown = () => app.view === null ? cur() : game.states[app.view];
export const cpuSide = () => match.opponent === 'cpu' ? Chess.other(match.human) : null;
export const isCpuTurn = () => app.started && match.opponent === 'cpu' && cur().turn !== match.human;
// never while a Crucible game is on the board: its pieces are not the game's (a move typed there
// ran the Play game's move against them and froze it)
export const canMoveNow = () => app.started && app.view === null && !app.busy && !game.result && !app.cpuThinking && !app.rolling && !isCpuTurn() && !boardOverride;

/* ---------- render registry ---------- */
export const renderers = [];
export const onRender = fn => renderers.push(fn);
export function render() {
  exploreCheck();
  const st = shown();
  const ctx = { st, status: Chess.status(st), live: app.view === null };
  for (const fn of renderers) fn(ctx);
  showHighlights();
  snapshot();
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  // ---------- state
  match = { opponent: prefs.opponent, choice: prefs.choice, human: prefs.choice === 'b' ? 'b' : 'w', level: prefs.level };
  draft = { opponent: prefs.opponent, choice: prefs.choice, level: prefs.level, from: false };   // from: Play from here (the free board's line)
  app.orient = match.human;
}
