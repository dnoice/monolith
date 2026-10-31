/*
✒ Metadata
    - Title: Hot Snapshot (MONOLITH Edition - v1.1)
    - File Name: snapshot.js
    - Relative Path: js/app/snapshot.js
    - Artifact Type: javascript
    - Version: 1.1.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — A game
      survives a reload: kept in localStorage (monolith-game-v1), it is
      replayed and repaired on start, the side to move below with auto-flip.
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a hot-update snapshot whose game
      record has a shape this version does not read is set aside whole.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Keeps the game through a hot update of the artifact and through a
    reload: snapshot() hands the viewer the game and match on every render
    and keeps the game in this browser, and start() restores one or the
    other and brings the page up. start() is the last step of the boot,
    called by the loop module.

✒ Key Features:
    - snapshot(): the game's states, moves, result, match and draft, for the
      viewer to keep.
    - The kept game (localStorage monolith-game-v1): the start FEN, the
      moves in UCI, the result, title, match settings and orientation,
      written only when they change. A study is not kept, nor an explored
      line or the free board; with no game the key is removed.
    - start(data): restores a snapshot, or else the kept game, sets the
      camera and world, places the pieces, opens the saved tab and starts
      the engine. A hot-update snapshot wins over the kept game.
    - The kept game is repaired, not trusted: its moves replay from the
      start position and stop at the first that is not legal, and every
      setting keeps to its choices; a finished game comes back finished.
    - With the board turning for each player (autoFlipOn() in
      js/game/flow.js), the side to move starts at the bottom.
    - MONOLITH starts at its pose's angle; its distance is fitted to the
      stage (js/scene/camera.js).
    - Without a viewer that keeps snapshots, start() falls back to the kept
      game, or runs with nothing to restore.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { snapshot, start } from '../app/snapshot.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/sets.js,
      scene/board.js, scene/post.js, scene/camera.js, app/state.js,
      game/engine.js, game/play.js, game/ceremony.js, game/flow.js,
      scene/worlds.js, ui/telemetry.js and ui/nav.js; globals Chess
      (js/core/chess.js) and LEVELS (js/core/levels.js).
    - Shared state (js/app/store.js): sets app.started, app.setupOpen,
      app.orient, app.lastMove and app.worldName.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from './store.js';
import { PI, prefs } from './base.js';
import { setWorldYaw } from '../scene/sets.js';
import { placePieces } from '../scene/board.js';
import { post } from '../scene/post.js';
import { cam } from '../scene/camera.js';
import { applyPrefs, cur, draft, game, match, render } from './state.js';
import { engine } from '../game/engine.js';
import { resultFor } from '../game/play.js';
import { restPose } from '../game/ceremony.js';
import { autoFlipOn, consultPlies, setConsultPlies, showFace } from '../game/flow.js';
import { applyWorldMix, desiredWorld, setWorld, WORLD } from '../scene/worlds.js';
import { buildTelemetry } from '../ui/telemetry.js';
import { setTab } from '../ui/nav.js';

/* ---------- viewer hot-update snapshot ---------- */
export function snapshot() {
  try { window.claude?.hot?.snapshot?.(() => ({ v: 2, states: game.states, moves: game.moves, sans: game.sans, result: game.result, title: game.title || null, consult: consultPlies(), started: app.started, match: Object.assign({}, match), draft: Object.assign({}, draft), setupOpen: app.setupOpen, orient: app.orient, theta: cam.theta })); } catch (e) {}
  saveGame();
}

/* ---------- the game kept in this browser (2.18.0) ----------
   A reload, a closed tab or a lost GPU process used to throw the game away. The game on the board
   is kept in localStorage as its start position and its moves (FEN and UCI, a few hundred bytes),
   written when it changes: the signature keeps a render that changed nothing from writing. A
   study is not kept (its scripted replies cannot be rebuilt), nor an explored line or the free
   board; with no game the key goes. */
const GAME_KEY = 'monolith-game-v1';
let savedSig = '';   // '' at load, so the first render (before start() reads the key) leaves it alone
function saveGame() {
  const sig = !app.started || match.study ? '' : [game.states.length, Chess.fen(game.states[0]), game.result && game.result.text, match.opponent, match.choice, match.human, match.level, app.orient, game.title && game.title.name, consultPlies().join(',')].join('|');
  if (sig === savedSig) return;
  savedSig = sig;
  try {
    if (!sig) localStorage.removeItem(GAME_KEY);
    // consult: the plies whose side to move used Analyze in a two-player game (js/game/flow.js)
    else localStorage.setItem(GAME_KEY, JSON.stringify({ v: 1, fen: Chess.fen(game.states[0]), uci: game.moves.map(Chess.toUci), result: game.result, title: game.title || null, consult: consultPlies(),
      match: { opponent: match.opponent, choice: match.choice, human: match.human, level: match.level }, orient: app.orient }));
  } catch (e) {}
}
/* The kept game back on the board. Like the saved preferences, what storage holds is repaired, not
   trusted: the moves replay from the start position and stop at the first that is not legal there
   (the result then comes from the position), and every setting keeps to its choices. */
function loadGame() {
  let d; try { d = JSON.parse(localStorage.getItem(GAME_KEY)); } catch (e) { return false; }
  if (!d || d.v !== 1 || typeof d.fen !== 'string' || !Array.isArray(d.uci)) return false;
  const r = Chess.parseFen(d.fen); if (r.error) return false;
  const states = [r.state], moves = [], sans = [];
  for (const u of d.uci) {
    const st = states[states.length - 1], mv = typeof u === 'string' ? Chess.fromUci(st, u) : null; if (!mv) break;
    const nx = Chess.apply(st, mv); moves.push(mv); sans.push(Chess.san(st, mv, nx)); states.push(nx);
  }
  const m = d.match && typeof d.match === 'object' ? d.match : {}, side = c => c === 'b' ? 'b' : 'w', res = d.result;
  Object.assign(game, { states, moves, sans, title: d.title && typeof d.title.name === 'string' ? d.title : null });
  setConsultPlies(d.consult);   // each a position the moves replayed to
  game.result = moves.length === d.uci.length && res && typeof res.text === 'string' && [null, 'w', 'b'].includes(res.winner) ? res : resultFor(cur());
  Object.assign(match, { opponent: m.opponent === 'human' ? 'human' : 'cpu', choice: ['w', 'b', 'r'].includes(m.choice) ? m.choice : 'w', human: side(m.human),
    level: Number.isInteger(m.level) && m.level >= 1 && m.level <= LEVELS.length ? m.level : prefs.level, study: false });
  app.started = true; app.setupOpen = false; app.orient = side(d.orient);
  const lm = moves[moves.length - 1]; app.lastMove = lm ? { from: lm.from, to: lm.to } : null;
  return true;
}
/* A snapshot is the page's own, taken before a hot update; one whose game record does not have
   the shape this version reads (from another version, or damaged) is set aside whole rather than
   half used: every state a 64-square board with a side to move and castling rights, and a move
   and its SAN for each step between two states. */
const validState = s => !!s && Array.isArray(s.board) && s.board.length === 64 && (s.turn === 'w' || s.turn === 'b') && !!s.castling && typeof s.castling === 'object';
function validSnapshot(d) {
  if (!d || d.v !== 2 || !Array.isArray(d.states) || !d.states.length || !d.states.every(validState)) return false;
  const n = d.states.length - 1, mv = d.moves || [], sn = d.sans || [];
  return Array.isArray(mv) && Array.isArray(sn) && mv.length === n && sn.length === n && mv.every(m => m && Number.isInteger(m.from) && Number.isInteger(m.to));
}
export function start(data) {
  applyPrefs();
  if (validSnapshot(data)) {
    game.states = data.states; game.moves = data.moves || []; game.sans = data.sans || []; game.result = data.result || null; game.title = data.title || null;
    setConsultPlies(data.consult);
    app.started = !!data.started; app.setupOpen = !!data.setupOpen;
    if (data.match) Object.assign(match, data.match); if (data.draft) Object.assign(draft, data.draft);
    app.orient = data.orient === 'b' ? 'b' : 'w';
    const m = game.moves[game.moves.length - 1]; app.lastMove = m ? { from: m.from, to: m.to } : null;
  } else loadGame();   // no hot update: the game this browser kept, if there is one
  // two players with the board turning: the side to move sits at the bottom, even if the page went during the beat before a turn
  if (autoFlipOn() && !game.result) app.orient = cur().turn;
  cam.theta = app.orient === 'w' ? 0 : PI; setWorldYaw(cam.theta);
  showFace(5);
  buildTelemetry();
  post.build();
  const w0 = desiredWorld(); applyWorldMix(w0 === 'monolith' ? 1 : 0); app.worldName = w0 === 'monolith' ? 'cathedral' : 'monolith'; setWorld(w0, false);
  if (w0 === 'monolith') cam.phi = WORLD.monolith.pose.phi;   // its distance is fitted to the stage (scene/camera.js)
  placePieces(cur()); restPose(game.result);
  setTab(prefs.tab);
  render(); engine.init();
}
