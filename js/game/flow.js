/*
✒ Metadata
    - Title: Game Flow (MONOLITH Edition - v1.1)
    - File Name: flow.js
    - Relative Path: js/game/flow.js
    - Artifact Type: javascript
    - Version: 1.1.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      board turns for each player and is free before a game; startGame()
      takes a line (Play from here, PGN); draws by agreement; analyzeGame().
    - 1.0.3 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.2 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a die roll, a resignation or an
      Explore move that finishes after the game has moved on leaves it
      alone; a new game, a view change and Explore's undo close an open
      promotion chooser; clearing the fragments moved to js/scene/board.js.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Starting, ending and rewinding games, reviewing earlier moves, and
    exploring: moves tried on a board the game does not own, from any
    position on screen, or on the free board before any game. In a game
    between two people on one screen, the board turns to the side to move.

✒ Key Features:
    - startGame(), rematch(), openSetup(), undo() and resign(); a new game
      and the setup open the Play pane at its top.
    - startGame(startState, opts, line): a line (Play from here, a loaded
      PGN) begins a game part-way with its moves kept, and a decided result
      in it ends the game there.
    - rematch({ swap: true }): the next game on the other side.
    - setOrientation(): the board and the world turn to your side; the die
      for a random side, skipped when the board turns for each player.
    - autoFlipOn(), autoOrient() and setAutoFlip(): in a friend game the
      side to move comes to the bottom a beat after each move (a cut under
      Minimal or reduced motion); turning is true while the board turns,
      and clicks on it wait.
    - canOfferDraw() and offerDraw(): a draw by agreement between two
      players on one screen.
    - analyzeGame(): the game opened in Analyze at the Coach's turning
      point, else at its end.
    - showView() and goLive(): review an earlier move without changing the
      game; they, and undo(), leave the Play game alone while a Crucible
      game is on the board.
    - Explore: a scratch line from a game, an earlier move, a finished game
      or a Crucible game; exploreTyped() takes a typed move into it, and
      exploreAppend() plays an engine line onto it at once (Play to here).
    - The free board: before any game a line starts from the starting
      position (sandbox()), and draftLine() hands it to Play from here.

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
      app.legalFor; reads app.SPEED and app.worldName.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, panelScroller, PI, prefs, reduceMotion, savePrefs } from '../app/base.js';
import { setWorldYaw, worldYaw } from '../scene/sets.js';
import { clearFragments, placePieces } from '../scene/board.js';
import { cam } from '../scene/camera.js';
import { tween } from '../scene/motion.js';
import { sound } from '../app/sound.js';
import { cur, draft, game, learn, match, render, shown, SIDE } from '../app/state.js';
import { hideSnack, snack } from '../ui/snackbar.js';
import { engine } from './engine.js';
import { deselect, rookSqOf, select } from './board-ui.js';
import { animateBoardMove, askPromotion, maybeComputerMove, resultFor } from './play.js';
import { celebrate, ceremonyGen, checkShudder, dealIn, restPose } from './ceremony.js';
import { emptyCalc, refreshAnalysis } from './lines.js';
import { coachKick, turningPly } from '../coach/notes.js';
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
export let turning = false;   // the board is turning: clicks on it wait (board-ui.js), and #stage.turning hides the cards
// a turn asked for (Flip board, a new game, the side preview) outranks one still waiting for its beat (autoOrient)
export function setOrientation(side, animate = true) { autoGen++; turnBoard(side, animate); }
function turnBoard(side, animate) {
  app.orient = side;
  const target = side === 'w' ? 0 : PI, wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const d = wrap(target - cam.theta), orbit = wrap(cam.theta - worldYaw), dy = d + orbit;
  const from = cam.theta, y0 = worldYaw, gen = ++flipGen, settle = () => { turning = false; $('#stage').classList.remove('turning'); };
  if (!animate || (Math.abs(d) < 0.01 && Math.abs(orbit) < 0.01)) { cam.theta = target; setWorldYaw(target); settle(); render(); return; }
  /* the cards swap sides at once (they follow app.orient), so they are out of sight while the
     board turns and come back with it settled */
  turning = true; $('#stage').classList.add('turning');
  tween(0.75 + Math.max(0, Math.abs(orbit) - 0.6) * 0.55, e => { if (gen !== flipGen) return; cam.theta = from + d * e; setWorldYaw(y0 + dy * e); }).then(() => { if (gen === flipGen) settle(); });
  render();
}
/* Turn the board for each player (2.18.0, on by default: friends on one screen were flipping by
   hand every move). In a game between two people, a beat after a move lands, the side to move
   comes to the bottom; under Minimal or reduced motion it is a cut. The side always comes from
   the position (cur().turn), never from match.human, which a hotseat game still sets. Stepping
   through earlier moves leaves the board still, and Back to live turns it again; Flip board
   holds for the move on the board, and the next move turns it again. */
let autoGen = 0;
export const autoFlipOn = () => app.started && match.opponent === 'human' && !study.cur && !game.title && prefs.autoFlip !== false;
export function autoOrient(beat = true) {
  const g = ++autoGen, still = reduceMotion || prefs.speed === 'minimal';
  const go = () => { if (g === autoGen && autoFlipOn() && !game.result && app.view === null && !explore.on && !boardOverride && cur().turn !== app.orient) turnBoard(cur().turn, !still); };
  if (beat) setTimeout(go, still ? 300 : 400 * app.SPEED + 100); else go();
}
export function setAutoFlip(on) { prefs.autoFlip = on; savePrefs(); if (on) autoOrient(false); render(); }
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
/* opts (a study, or Set up's Who plays it): { opponent, side, level, study } set this game's match
   without touching the saved game settings, which the next ordinary game goes back to.
   line: { states, moves, sans }, a game begun part-way with its moves kept (Play from here, a
   loaded PGN), so the move list, Undo, the captures, the opening's name and repetitions all have
   its history; a line from the free board (free) is already standing on the board, so it is not
   dealt in, and a record that says how the game ended (result) ends it there. */
export function startGame(startState, opts = null, line = null) {
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
    game.states = line ? line.states.slice() : [startState || Chess.newGame()]; game.moves = line ? line.moves.slice() : []; game.sans = line ? line.sans.slice() : []; game.title = null;
    const lm = game.moves[game.moves.length - 1];
    game.result = resultFor(cur()) || (line && line.result) || null; app.lastMove = lm ? { from: lm.from, to: lm.to } : null; app.view = null; app.hint = null; app.calc = emptyCalc(); app.fenDirty = false;
    draft.from = false; exploreEnd(false);
    clearFragments(); placePieces(cur()); app.started = true; app.setupOpen = false;
    if (prefs.tab === 'play') panelScroller().scrollTop = 0;   // the game's pane opens at its top, not where Start game was
    setOrientation(autoFlipOn() ? cur().turn : side);   // a set-up position may have Obsidian to move
    app.busy = true; render();
    const g0 = ceremonyGen;   // a newer game owns `busy` once it starts
    (line && line.free ? Promise.resolve() : dealIn()).then(() => { if (g0 !== ceremonyGen) return; app.busy = false; render(); refreshAnalysis(); maybeComputerMove(); coachKick(); });
  };
  // with the board turning for each player the die decides nothing in a friend game
  const turns = draft.opponent === 'human' && prefs.autoFlip !== false;
  if (opts) begin(opts.side); else if (draft.choice === 'r' && !turns) rollDie(begin); else begin(draft.choice === 'r' ? 'w' : draft.choice);
}
/* opts.swap: the other side this time (Play obsidian), which the next game keeps as the choice. The
   result card's Rematch passes its click event, which has no swap. */
export function rematch(opts) {
  if (study.cur) { studyStart(study.cur.s); return; }   // a study's rematch is the study again
  Object.assign(draft, userSetup());
  if (opts && opts.swap === true) draft.choice = Chess.other(match.human);
  setTab('play'); startGame();
}
export function openSetup() {
  Object.assign(draft, userSetup());
  app.setupOpen = true; setTab('play'); render(); panelScroller().scrollTop = 0;
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
  placePieces(cur()); render(); refreshAnalysis(); maybeComputerMove(); coachKick(); autoOrient(false);
}
/* A draw by agreement between two players on one screen: the side to move offers, the other side
   answers. canOfferDraw() is true, or the reason it cannot be offered (a declaration, so the
   palette's table can name it while the modules are still loading). */
export function canOfferDraw() { return !app.started ? 'Start a game first' : game.result ? 'The game is over' : match.opponent !== 'human' || study.cur || game.title ? 'Two-player games only' : true; }
export function offerDraw() {
  if (canOfferDraw() !== true || app.busy) return;
  const by = cur().turn, rec = game.states, n = rec.length;
  snack(`${SIDE[by]} offers a draw. Does ${SIDE[Chess.other(by)].toLowerCase()} agree?`, [{ label: 'Keep playing', act: () => {} }, { label: 'Agree to a draw', filled: true, act: () => {
    if (game.states !== rec || rec.length !== n || game.result) return;   // asked about a position the game has since left
    game.result = { text: 'Draw agreed.', winner: null, agreed: true };
    render(); celebrate(game.result); coachKick();
  } }], true);
}
/* A finished game in Analyze: at its turning point when the Coach found one, else at the last
   move (the final position of a mate or a stalemate has nothing left to search). */
export function analyzeGame() {
  if (!app.started) return;
  const p = turningPly(), last = game.states.length - 1;
  showView(p !== null ? p : resultFor(cur()) && last > 0 ? last - 1 : last); setTab('analyze');
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
  placePieces(cur()); restPose(game.result); render(); refreshAnalysis(); maybeComputerMove(); autoOrient(false);
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
/* Before any game the board is free (2.18.0): both sides move in turn from the starting position
   on every tab, and Play from here turns the line into a game. */
export const exploreAvailable = () => !!boardOverride || !app.started || app.view !== null || !!game.result;
export const sandbox = () => explore.on && !app.started && !boardOverride;
// Play from here: the free board's line as it stands when Start game is pressed (draft.from marks the choice)
export const draftLine = () => draft.from && sandbox() && explore.moves.length ? { states: explore.states.slice(), moves: explore.moves.slice(), sans: explore.sans.slice(), free: true } : null;
export function setExplorePref(on) { prefs.explore = on; savePrefs(); if (!on && explore.on) exploreEnd(); else render(); }
function exploreStart() {
  const base = underlyingState();
  Object.assign(explore, { on: true, base, states: [base], moves: [], sans: [] }); draft.from = false;   // a new line is not yet one to play from
  deselect(); placePieces(base);   // fresh pieces: an ended game's poses don't carry into the line
  render();   // the chip, the cards and the move list say so from the first click, not the first move
}
/* replace: put the underlying board's pieces back (Back, Undo past the start); without it the
   caller that changed the board underneath has placed them already. */
export function exploreEnd(replace = true) {
  if (!explore.on) return;
  Object.assign(explore, { on: false, base: null, states: [], moves: [], sans: [] });
  app.selected = -1; app.legalFor = []; draft.from = false;   // a reset free board takes Play from here with it
  if (replace) { placePieces(underlyingState()); if (!boardOverride && app.view === null) restPose(game.result); hideSnack(); render(); refreshAnalysis(); }
}
export function exploreUndo() {
  if (!explore.on || app.busy) return;
  hideSnack('promotion');
  if (!explore.moves.length) return exploreEnd();
  explore.states.pop(); explore.moves.pop(); explore.sans.pop();
  deselect(); placePieces(exploreState()); render(); refreshAnalysis();
}
/* A line played onto the board at once (Analyze's Play to here): each move ({ mv, san, state }, as
   sanList gives them) joins the explored line without animation, as a jump in the review does. It
   starts from `from`, the position Analyze shows: the explored line's end, or the board under it. */
export function exploreAppend(from, seq) {
  if (app.busy || !seq.length || from !== (explore.on ? exploreState() : underlyingState())) return false;
  if (!explore.on) exploreStart();
  for (const x of seq) { explore.states.push(x.state); explore.moves.push(x.mv); explore.sans.push(x.san); }
  deselect(); hideSnack(); placePieces(exploreState()); render(); refreshAnalysis();
  return true;
}
// called from render: the board the line started from has changed underneath it
export function exploreCheck() { if (explore.on && underlyingState() !== explore.base) exploreEnd(false); }
export function exploreSquare(sq) {
  if (app.busy) return;
  if (!explore.on) {
    const st0 = underlyingState(), p0 = st0.board[sq];
    const who = app.worldName === 'monolith' ? (st0.turn === 'w' ? 'White' : 'Black') : SIDE[st0.turn];
    if (!p0 || p0.c !== st0.turn) { snack(Chess.allLegal(st0).length ? `${who} is to move here: pick one of its pieces to try a move.` : 'No legal moves in this position.'); return; }
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
// a typed move (the move box) into the line, starting one from the board on screen if need be
export function exploreTyped(mv) { if (app.busy || turning) return; if (!explore.on) exploreStart(); return exploreMove(mv); }
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
  if (!boardOverride && !app.started) return 'the starting position';
  if (boardOverride && boardOverride.game) return `game #${pad2(boardOverride.game.index)}, ply ${boardOverride.ply}`;
  if (app.view !== null) return app.view === 0 ? 'the starting position' : `move ${Math.ceil(app.view / 2)}${app.view % 2 ? '' : '…'} ${game.sans[app.view - 1]}`;
  return 'the final position';
}
