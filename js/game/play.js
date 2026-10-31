/*
✒ Metadata
    - Title: Playing Moves (MONOLITH Edition - v1.1)
    - File Name: play.js
    - Relative Path: js/game/play.js
    - Artifact Type: javascript
    - Version: 1.1.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — After a
      move a friend game's board turns. A move ends a line explored over it,
      spares a Crucible game's pieces, and lands if its animation fails.
    - 1.0.3 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.2 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a move, or the computer's reply, that
      finishes after an undo, a new game or a board change no longer lands
      in the new position, and the promotion chooser belongs to the position
      it was opened for.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Making a move happen: playMove() runs a move through the animations, the
    record and the results, then asks the computer for its reply at the
    level being played.

✒ Key Features:
    - playMove() and animateBoardMove(): glides, hops, captures and
      promotion. A line explored over the live position ends before the
      game's move; a move whose animation fails still lands, its pieces
      placed; a Crucible game on the board keeps its pieces while a reply
      is recorded underneath.
    - afterMove(): the result, sounds, the Coach and the next turn; in a
      friend game the board then turns to the side to move (autoOrient()
      in js/game/flow.js).
    - maybeComputerMove(): the engine's reply at the level's limits, with
      chooseMove for levels 1 to 5.
    - playLevel() and levelNote(): a level, adjusted when the engine has no
      Elo limiter.
    - Repetitions, resultFor() and the promotion chooser.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { resultFor, playMove, positionCmd } from '../game/play.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/board.js,
      scene/motion.js, app/sound.js, app/state.js, ui/snackbar.js,
      game/engine.js, game/board-ui.js, game/ceremony.js, game/lines.js,
      coach/notes.js, ui/studies.js, ui/crucible-board.js and game/flow.js;
      globals Chess (js/core/chess.js) and LEVELS (js/core/levels.js).
    - Shared state (js/app/store.js): sets app.busy, app.hint, app.lastMove,
      app.fenDirty and app.cpuThinking; reads app.view and app.rolling.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { PI } from '../app/base.js';
import { boardGen, buildPiece, PIECE_NAMES, pieceAt, piecesGroup, placePieces, sqPos } from '../scene/board.js';
import { animAttack, animMove, easeInOut, easeOut, tween, wait } from '../scene/motion.js';
import { sound } from '../app/sound.js';
import { canMoveNow, cpuSide, cur, game, isCpuTurn, learn, match, render, SIDE } from '../app/state.js';
import { hideSnack, snack } from '../ui/snackbar.js';
import { engine } from './engine.js';
import { deselect } from './board-ui.js';
import { celebrate, checkShudder, promotionFlash } from './ceremony.js';
import { refreshAnalysis } from './lines.js';
import { coachKick } from '../coach/notes.js';
import { studyAfterMove, studyScripted } from '../ui/studies.js';
import { boardOverride } from '../ui/crucible-board.js';
import { autoOrient, explore, exploreEnd } from './flow.js';

/* ---------- playing moves ---------- */
export async function playMove(mv) {
  // a line explored over the live position (Analyze's Play to here) ends before the game's own move:
  // the pieces on the board are the line's, not the game's
  if (explore.on && !boardOverride) exploreEnd();
  app.busy = true; const st = cur(), rec = game.states; deselect(); hideSnack(); app.hint = null;
  const next = Chess.apply(st, mv), san = Chess.san(st, mv, next);
  /* A Crucible game on the board (boardOverride) owns its pieces: a reply that lands meanwhile is
     recorded without moving them, and the Play board is placed again when that game closes. A
     move whose animation fails still counts, and its pieces are placed below: `busy` left set
     froze the game at "Waiting for the reply". */
  let failed = false;
  if (!boardOverride) try {
    await animateBoardMove(st, mv, `promoted-${String(game.states.length).padStart(3, '0')}`, () => {
      if (st.turn !== cpuSide()) { learn('select'); if (mv.castle) learn('castle'); }   // the player has done it
      render();
    });
  } catch (e) { failed = true; console.error(e); }
  /* A new game (or a loaded one) replaced the record while the pieces moved: the move belonged to
     the old game, and whoever replaced it now owns the board and `busy`. */
  if (game.states !== rec || cur() !== st) return;
  game.states.push(next); game.moves.push(mv); game.sans.push(san); app.lastMove = { from: mv.from, to: mv.to };
  app.busy = false; app.fenDirty = false;
  if (failed && !boardOverride) placePieces(next);
  afterMove(next);
}
/* The pieces' side of a move, shared by the game and by explored lines: lift the mover (and the
   victim) out of pieceAt, run `started` (the caller's render), then castle, attack or move, and
   grow a promoted piece. `tag` names a promoted piece's mesh. */
export async function animateBoardMove(st, mv, tag, started = null) {
  const mover = pieceAt[mv.from], g0 = boardGen, rebuilt = () => boardGen !== g0;
  const victimSq = mv.ep ? mv.to + (st.turn === 'w' ? -8 : 8) : mv.to;
  const victim = mv.capture ? pieceAt[victimSq] : null;
  if (victim) pieceAt[victimSq] = null;
  pieceAt[mv.from] = null;
  if (started) started();
  if (mv.castle) {
    // king and rook travel together; the rook hops over the king
    const rank = mv.from >> 3, rf = mv.castle === 'K' ? rank * 8 + 7 : rank * 8, rt = mv.castle === 'K' ? mv.to - 1 : mv.to + 1;
    const rook = pieceAt[rf]; pieceAt[rf] = null; sound.tick();
    await Promise.all([animMove(mover, mv.from, mv.to), wait(0.12).then(() => animHop(rook, rf, rt))]);
    if (!rebuilt()) pieceAt[rt] = rook; sound.tick(0.7);
  } else if (victim) await animAttack(mover, mv.from, mv.to, victim);
  else { sound.tick(); await animMove(mover, mv.from, mv.to); }
  // the pieces were rebuilt while this one moved (a new game, another board): the new board is
  // already right, and this mesh is no longer on it
  if (rebuilt()) return false;
  pieceAt[mv.to] = mover;
  if (mv.promo) {
    piecesGroup.remove(mover);
    const id = `piece-${st.turn === 'w' ? 'marble' : 'obsidian'}-${PIECE_NAMES[mv.promo]}-${tag}`;
    const g = buildPiece(mv.promo, st.turn, id); const { x, z } = sqPos(mv.to); g.position.set(x, 0, z); g.scale.setScalar(0.01); piecesGroup.add(g); pieceAt[mv.to] = g;
    promotionFlash(mv.to);
    await tween(0.35, e => g.scale.setScalar(0.01 + 0.99 * e), easeOut);
  }
  return true;
}
async function animHop(g, from, to) {
  const a = sqPos(from), b = sqPos(to), body = g.userData.body;
  g.userData.anim = true; body.position.y = 0;
  await tween(0.55, (e, p) => { g.position.x = a.x + (b.x - a.x) * e; g.position.z = a.z + (b.z - a.z) * e; g.position.y = 0.9 * Math.sin(PI * p); body.rotation.z = 0.2 * Math.sin(PI * p) * Math.sign(b.x - a.x); }, easeInOut);
  g.position.set(b.x, 0, b.z); body.rotation.z = 0; g.userData.anim = false;
}
/* The UCI position for game.states[idx]: the start position plus every move to it. */
export function positionCmd(idx) {
  const moves = game.moves.slice(0, idx).map(Chess.toUci);
  return `position fen ${Chess.fen(game.states[0])}` + (moves.length ? ` moves ${moves.join(' ')}` : '');
}
export const stateIndex = st => { const i = game.states.lastIndexOf(st); return i < 0 ? game.states.length - 1 : i; };
// a position of the game keeps its move history (repetitions); an explored one goes by FEN
export const posCmdFor = st => game.states.includes(st) ? positionCmd(stateIndex(st)) : `position fen ${Chess.fen(st)}`;
/* Threefold repetition: same placement, side to move, castling rights and en passant chance. */
function repKey(st) {
  const f = Chess.fen(st).split(' ');
  const epLive = st.ep >= 0 && Chess.allLegal(st).some(m => m.ep);
  return `${f[0]} ${f[1]} ${f[2]} ${epLive ? f[3] : '-'}`;
}
export function repetitions(idx) {
  const key = repKey(game.states[idx]); let n = 0;
  for (let i = idx; i >= 0; i--) { if (repKey(game.states[i]) === key) n++; if (i > 0 && (game.states[i].halfmove === 0)) break; }
  return n;
}
export function playLevel(n) {
  const L = LEVELS[n - 1];
  return L.elo && engine.ready && !engine.has('UCI_Elo') ? Object.assign({}, L, LEVEL_NO_ELO[n], { elo: 0 }) : L;
}
export function levelNote(n) {
  return LEVELS[n - 1].elo && engine.ready && !engine.has('UCI_Elo') ? ` ${engine.name} has no Elo limiter, so this level is approximated by the page's own move chooser.` : '';
}
export function resultFor(st) {
  const s = Chess.status(st);
  if (s.mate) return { text: `Checkmate. ${SIDE[Chess.other(st.turn)]} wins.`, winner: Chess.other(st.turn) };
  if (s.stale) return { text: 'Stalemate. The game is drawn.', winner: null };
  if (s.insufficient) return { text: 'Draw by insufficient material.', winner: null };
  if (s.draw50) return { text: 'Draw by the fifty-move rule.', winner: null };
  if (game.states.includes(st) && repetitions(stateIndex(st)) >= 3) return { text: 'Draw by threefold repetition.', winner: null };
  return null;
}
function afterMove(next) {
  game.result = resultFor(next);
  studyAfterMove();
  if (!game.result && Chess.inCheck(next)) { sound.chime(); checkShudder(Chess.kingSq(next.board, next.turn)); }
  render(); autoOrient();   // two players on one screen: the board turns to the side to move, a beat after the move lands
  if (game.result) celebrate(game.result);   // the result card in the Play panel carries Rematch
  refreshAnalysis();
  maybeComputerMove();
  coachKick();
}
export async function maybeComputerMove() {
  if (!isCpuTurn() || game.result || app.view !== null || app.busy || app.cpuThinking || app.rolling) return;
  if (studyScripted()) return;
  if (!engine.ready) return;
  const st = cur(), rec = game.states;
  app.cpuThinking = true; deselect(); render();
  const L = playLevel(match.level), gen = engine.gen + 1, t0 = performance.now();
  const lines = [];
  const best = await engine.go(positionCmd(game.states.length - 1), { elo: L.elo, depth: L.depth, movetime: L.ms, multipv: L.lines || 1, lines });
  /* The reply still belongs to this position only if nothing changed while the engine thought,
     or during the short beat after it: an undo, a new or loaded game, a resignation, a move under
     review. A newer search owns the thinking flag, so a stale reply leaves it alone. */
  const stale = () => gen !== engine.gen || !app.cpuThinking || app.view !== null || game.states !== rec || cur() !== st || !!game.result || app.busy;
  if (stale()) { if (gen === engine.gen) app.cpuThinking = false; render(); return; }
  await wait(Math.max(0, 0.45 - (performance.now() - t0) / 1000));   // a short beat so instant replies still read as a turn
  if (stale()) { if (gen === engine.gen) app.cpuThinking = false; render(); return; }
  app.cpuThinking = false;
  const mv = L.lines ? (chooseMove(st, lines, L) || (best && Chess.fromUci(st, best))) : best && Chess.fromUci(st, best);
  if (!mv) { render(); snack('The engine returned no move.'); return; }
  playMove(mv);
}
/* The chooser belongs to the position it was offered in: stepping the review, an undo or another
   tab withdraws it (hideSnack('promotion')), and a choice made after the position changed does
   nothing. `still` says whether that position is still the one to move in. */
export function askPromotion(mv, play = playMove, still = null) {
  const st0 = cur(), ok = still || (() => cur() === st0 && canMoveNow());
  const opts = [['q', 'Queen'], ['r', 'Rook'], ['b', 'Bishop'], ['n', 'Knight']].map(([t, l]) => ({ label: l, filled: t === 'q', act: () => { if (ok()) play(Object.assign({}, mv, { promo: t, needsPromo: false })); } }));
  snack('Promote the pawn to', opts, true, 'promotion');
}
