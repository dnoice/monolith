/*
✒ Metadata
    - Title: Game Flow (MONOLITH Edition - v1.0)
    - File Name: flow.js
    - Relative Path: js/game/flow.js
    - Artifact Type: javascript
    - Version: 1.0.3
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.3 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.2 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a die roll, a resignation or an
      Explore move that finishes after the game has moved on leaves it
      alone; a new game, a view change and Explore's undo close an open
      promotion chooser; clearing the fragments moved to js/scene/board.js.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      study state comes from js/ui/studies.js; startGame() no longer
      redraws the studies library itself, since the Position tab redraws
      it from render().
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Starting, ending and rewinding games, reviewing earlier moves, and
    exploring: moves tried on a board the game does not own, from any
    position on screen.

✒ Key Features:
    - startGame(), rematch(), openSetup(), undo() and resign().
    - setOrientation(): the board and the world turn to your side; the die
      for a random side.
    - showView() and goLive(): review an earlier move without changing the
      game.
    - Explore: a scratch line from a game, an earlier move, a finished game
      or a Crucible game.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { explore, exploreState, goLive } from '../game/flow.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/sets.js,
      scene/board.js, scene/camera.js, scene/motion.js, app/sound.js,
      app/state.js, ui/snackbar.js, game/engine.js, game/board-ui.js,
      game/play.js, game/ceremony.js, game/lines.js, coach/notes.js,
      ui/crucible.js, ui/crucible-board.js, ui/nav.js and ui/studies.js;
      globals Chess (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.orient, app.rolling,
      app.cpuThinking, app.lastMove, app.view, app.hint, app.calc,
      app.fenDirty, app.started, app.setupOpen, app.busy, app.selected and
      app.legalFor.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, PI, prefs, reduceMotion, savePrefs } from '../app/base.js';
import { setWorldYaw, worldYaw } from '../scene/sets.js';
import { clearFragments, placePieces } from '../scene/board.js';
import { cam } from '../scene/camera.js';
import { tween } from '../scene/motion.js';
import { sound } from '../app/sound.js';
import { cur, draft, game, learn, match, render, shown, SIDE, SIDE_COLOR } from '../app/state.js';
import { hideSnack, snack } from '../ui/snackbar.js';
import { engine } from './engine.js';
import { deselect, rookSqOf, select } from './board-ui.js';
import { animateBoardMove, askPromotion, maybeComputerMove, resultFor } from './play.js';
import { celebrate, ceremonyGen, checkShudder, dealIn, restPose } from './ceremony.js';
import { emptyCalc, refreshAnalysis } from './lines.js';
import { coachKick } from '../coach/notes.js';
import { pad2 } from '../ui/crucible.js';
import { boardOverride } from '../ui/crucible-board.js';
import { setTab } from '../ui/nav.js';
import { study, studyStart, userSetup } from '../ui/studies.js';

/* ---------- starting, ending and rewinding games ---------- */
/* A flip turns the camera and the world rig together, the same way round, so the scenery holds
   still on screen and only the board turns (see the world rig); both end square to the side
   (rig yaw 0 or π), so each side always sits before the same view. A view orbited by hand comes
   back square on the way: the rig turns by the camera's turn plus that orbit, so only the orbit
   is undone against the scenery, and the farther it was, the longer the turn takes, so the
   scenery never whips past. A newer flip takes over from one still running. */
let flipGen = 0;
export function setOrientation(side, animate = true) {
  app.orient = side;
  const target = side === 'w' ? 0 : PI, wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const d = wrap(target - cam.theta), orbit = wrap(cam.theta - worldYaw), dy = d + orbit;
  const from = cam.theta, y0 = worldYaw, gen = ++flipGen;
  if (!animate || (Math.abs(d) < 0.01 && Math.abs(orbit) < 0.01)) { cam.theta = target; setWorldYaw(target); render(); return; }
  tween(0.75 + Math.max(0, Math.abs(orbit) - 0.6) * 0.55, e => { if (gen !== flipGen) return; cam.theta = from + d * e; setWorldYaw(y0 + dy * e); });
  render();
}
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
export function showFace(n) { [...$('#die').children].forEach((pip, i) => { pip.style.opacity = PIPS[n].includes(i) ? 1 : 0; }); }
/* Random side: the die in the Random card tumbles and settles; odd gives marble, even obsidian. */
let rollGen = 0;   // each start counts; a roll whose start was overtaken stops where it is
function rollDie(done) {
  const face = 1 + Math.floor(Math.random() * 6), side = face % 2 ? 'w' : 'b', die = $('#die'), g = ++rollGen;
  app.rolling = true; die.classList.remove('landed'); render();
  const steps = reduceMotion || prefs.speed === 'minimal' ? 0 : 10; let k = 0;
  const land = () => {
    if (g !== rollGen) return;   // a newer start (a study, a loaded position) took over mid-roll
    showFace(face); die.style.transform = ''; die.classList.add('landed');
    $('#side-help').textContent = `Rolled ${face}: ${match.opponent === 'cpu' || draft.opponent === 'cpu' ? 'you play' : 'the bottom of the board is'} ${SIDE[side].toLowerCase()}.`;
    setTimeout(() => { if (g === rollGen) done(side); }, reduceMotion ? 150 : 650);
  };
  if (!steps) return land();
  const spin = () => { if (g !== rollGen) return; if (++k > steps) return land(); showFace(1 + Math.floor(Math.random() * 6)); die.style.transform = `rotate(${Math.round(Math.random() * 70 - 35)}deg) scale(1.06)`; setTimeout(spin, 50 + k * 13); };
  spin();
}
/* opts (a study): { opponent, side, level, study } set this game's match without touching the
   saved game settings, which the next ordinary game goes back to. */
export function startGame(startState, opts = null) {
  learn('start'); learn('setup-intro');
  rollGen++; app.rolling = false;   // a roll still tumbling for an earlier start is dropped
  engine.abort(); app.cpuThinking = false; hideSnack(); deselect();
  if (opts) Object.assign(match, { opponent: opts.opponent, choice: opts.side, level: opts.level, study: true });
  else {
    Object.assign(match, { opponent: draft.opponent, choice: draft.choice, level: draft.level, study: false });
    Object.assign(prefs, { opponent: draft.opponent, choice: draft.choice, level: draft.level }); savePrefs();
  }
  study.cur = opts && opts.study ? opts.study : null;
  const begin = side => {
    app.rolling = false; match.human = side;
    game.states = [startState || Chess.newGame()]; game.moves = []; game.sans = []; game.title = null;
    game.result = resultFor(cur()); app.lastMove = null; app.view = null; app.hint = null; app.calc = emptyCalc(); app.fenDirty = false;
    clearFragments(); placePieces(cur()); app.started = true; app.setupOpen = false;
    setOrientation(side);
    app.busy = true; render();
    const g0 = ceremonyGen;   // a newer game owns `busy` once it starts
    dealIn().then(() => { if (g0 !== ceremonyGen) return; app.busy = false; render(); refreshAnalysis(); maybeComputerMove(); coachKick(); });
  };
  if (opts) begin(opts.side); else if (draft.choice === 'r') rollDie(begin); else begin(draft.choice);
}
export function rematch() {
  if (study.cur) { studyStart(study.cur.s); return; }   // a study's rematch is the study again
  Object.assign(draft, userSetup()); setTab('play'); startGame();
}
export function openSetup() {
  Object.assign(draft, userSetup());
  app.setupOpen = true; setTab('play'); render();
}
export function undo() {
  if (app.busy || game.states.length < 2 || !app.started || boardOverride) return;
  if (app.view !== null) goLive();
  engine.abort(); app.cpuThinking = false; hideSnack();
  // against the computer, undo returns to your last turn (its reply and your move)
  let popped = 0;
  while (game.states.length > 1 && (popped === 0 || (match.opponent === 'cpu' && cur().turn !== match.human))) { game.states.pop(); game.moves.pop(); game.sans.pop(); popped++; }
  game.result = null; deselect(); app.hint = null;
  const m = game.moves[game.moves.length - 1]; app.lastMove = m ? { from: m.from, to: m.to } : null;
  placePieces(cur()); render(); refreshAnalysis(); maybeComputerMove(); coachKick();
}
export function resign() {
  if (!app.started || game.result) return;
  const loser = match.opponent === 'cpu' ? match.human : cur().turn, winner = Chess.other(loser), rec = game.states;
  snack(match.opponent === 'cpu' ? 'Resign this game?' : `Resign for ${SIDE[loser].toLowerCase()}?`, [{ label: 'Keep playing', act: () => {} }, { label: 'Resign', filled: true, act: () => {
    if (game.states !== rec || game.result) return;   // asked about a game that has since been replaced or ended
    engine.abort(); app.cpuThinking = false;
    game.result = { text: `${SIDE[loser]} resigns. ${SIDE[winner]} wins.`, winner, resigned: loser };
    render(); celebrate(game.result); coachKick();
  } }], true);
}

/* ---------- review: step through the game without changing it ---------- */
/* While a Crucible game is on the board (boardOverride) the review, Live and Undo leave the Play
   game alone: they would place its pieces over that game's. The Moves card steps that game then. */
export function showView(idx) {
  if (app.busy || boardOverride) return;
  hideSnack('promotion');
  if (idx >= game.states.length - 1) return goLive();
  app.view = Math.max(0, idx); deselect();
  const m = app.view > 0 ? game.moves[app.view - 1] : null; app.lastMove = m ? { from: m.from, to: m.to } : null;
  placePieces(shown()); render(); refreshAnalysis();
}
export function goLive() {
  if (app.busy || boardOverride) return;
  hideSnack('promotion');
  app.view = null;
  const m = game.moves[game.moves.length - 1]; app.lastMove = m ? { from: m.from, to: m.to } : null;
  placePieces(cur()); restPose(game.result); render(); refreshAnalysis(); maybeComputerMove();
}
export const viewedPly = () => app.view === null ? game.states.length - 1 : app.view;

/* ---------- explore: try moves on a board the game does not own ----------
   Dennis's ruling (10/15/2026): every board in every mode can be played on, behind a toggle
   (Settings → Move pieces on any board, on by default). A board the game rules leave read-only
   (a Crucible game, an earlier move under review, a finished game) takes moves into a scratch
   line instead. The line never touches the game or the recorded run: Undo steps it back, Back
   returns to the board it started from, and anything that changes that board underneath it
   (stepping the review or the heartbeat, a new game, leaving the Crucible board) drops it.
   Analyze and the evaluation bar follow the explored position while it lasts. */
export const explore = { on: false, base: null, states: [], moves: [], sans: [] };
export const exploreState = () => explore.states[explore.states.length - 1];
export const underlyingState = () => boardOverride ? boardOverride.state : shown();
export const exploreAvailable = () => !!boardOverride || (app.started && (app.view !== null || !!game.result));
export function setExplorePref(on) { prefs.explore = on; savePrefs(); if (!on && explore.on) exploreEnd(); else render(); }
function exploreStart() {
  const base = underlyingState();
  Object.assign(explore, { on: true, base, states: [base], moves: [], sans: [] });
  deselect(); placePieces(base);   // fresh pieces: an ended game's poses don't carry into the line
}
/* replace: put the underlying board's pieces back (Back, Undo past the start); without it the
   caller that changed the board underneath has placed them already. */
export function exploreEnd(replace = true) {
  if (!explore.on) return;
  Object.assign(explore, { on: false, base: null, states: [], moves: [], sans: [] });
  app.selected = -1; app.legalFor = [];
  if (replace) { placePieces(underlyingState()); if (!boardOverride && app.view === null) restPose(game.result); hideSnack(); render(); refreshAnalysis(); }
}
export function exploreUndo() {
  if (!explore.on || app.busy) return;
  hideSnack('promotion');
  if (!explore.moves.length) return exploreEnd();
  explore.states.pop(); explore.moves.pop(); explore.sans.pop();
  deselect(); placePieces(exploreState()); render(); refreshAnalysis();
}
// called from render: the board the line started from has changed underneath it
export function exploreCheck() { if (explore.on && underlyingState() !== explore.base) exploreEnd(false); }
export function exploreSquare(sq) {
  if (app.busy) return;
  if (!explore.on) {
    const st0 = underlyingState(), p0 = st0.board[sq];
    if (!p0 || p0.c !== st0.turn) { snack(Chess.allLegal(st0).length ? `${SIDE_COLOR[st0.turn] === 'white' ? 'White' : 'Black'} is to move here: pick one of its pieces to try a move.` : 'No legal moves in this position.'); return; }
    exploreStart();
  }
  const st = exploreState(), p = st.board[sq];
  if (app.selected >= 0) {
    const mv = app.legalFor.find(m => m.to === sq) || app.legalFor.find(m => m.castle && sq === rookSqOf(m));
    if (mv) { if (mv.needsPromo) return askPromotion(mv, exploreMove, () => explore.on && exploreState() === st && !app.busy); return exploreMove(mv); }
  }
  if (p && p.c === st.turn) { if (app.selected === sq) deselect(); else { deselect(); select(sq); } }
  else deselect();
}
async function exploreMove(mv) {
  if (!explore.on) return;
  app.busy = true; const st = exploreState(); deselect(); hideSnack();
  const next = Chess.apply(st, mv), san = Chess.san(st, mv, next);
  await animateBoardMove(st, mv, `explored-${String(explore.moves.length + 1).padStart(3, '0')}`, () => render());
  if (!explore.on || exploreState() !== st) { app.busy = false; return; }   // dropped while the pieces moved
  explore.states.push(next); explore.moves.push(mv); explore.sans.push(san);
  app.busy = false;
  if (Chess.inCheck(next)) { sound.chime(); checkShudder(Chess.kingSq(next.board, next.turn)); }
  render(); refreshAnalysis();
}
/* "12… Nf6 13. e5": the explored moves numbered from the position they started in. */
export function exploreLine(max = 6) {
  const b = explore.base; if (!b) return '';
  const out = []; let num = b.fullmove, turn = b.turn;
  explore.sans.forEach((san, i) => {
    out.push(turn === 'w' ? `${num}. ${san}` : i === 0 ? `${num}… ${san}` : san);
    if (turn === 'b') num++; turn = turn === 'w' ? 'b' : 'w';
  });
  return out.length > max ? '… ' + out.slice(-max).join(' ') : out.join(' ');
}
export function exploreOrigin() {
  if (boardOverride && boardOverride.game) return `game #${pad2(boardOverride.game.index)}, ply ${boardOverride.ply}`;
  if (app.view !== null) return app.view === 0 ? 'the starting position' : `move ${Math.ceil(app.view / 2)}${app.view % 2 ? '' : '…'} ${game.sans[app.view - 1]}`;
  return 'the final position';
}
