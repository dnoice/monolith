/*
✒ Metadata
    - Title: Hot Snapshot (MONOLITH Edition - v1.0)
    - File Name: snapshot.js
    - Relative Path: js/app/snapshot.js
    - Artifact Type: javascript
    - Version: 1.0.2
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a hot-update snapshot whose game
      record has a shape this version does not read is set aside whole.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    Keeps the game through a hot update of the artifact: snapshot() hands
    the viewer the game and match on every render, and start() restores them
    and brings the page up. start() is the last step of the boot, called by
    the loop module.

✒ Key Features:
    - snapshot(): the game's states, moves, result, match and draft, for the
      viewer to keep.
    - start(data): restores a snapshot, sets the camera and world, places
      the pieces, opens the saved tab and starts the engine.
    - Without a viewer that keeps snapshots, start() runs with nothing to
      restore.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { snapshot, start } from '../app/snapshot.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/sets.js,
      scene/board.js, scene/post.js, scene/camera.js, app/state.js,
      game/engine.js, game/ceremony.js, game/flow.js, scene/worlds.js,
      ui/telemetry.js and ui/nav.js.
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
import { restPose } from '../game/ceremony.js';
import { showFace } from '../game/flow.js';
import { applyWorldMix, desiredWorld, setWorld, WORLD } from '../scene/worlds.js';
import { buildTelemetry } from '../ui/telemetry.js';
import { setTab } from '../ui/nav.js';

/* ---------- viewer hot-update snapshot ---------- */
export function snapshot() {
  try { window.claude?.hot?.snapshot?.(() => ({ v: 2, states: game.states, moves: game.moves, sans: game.sans, result: game.result, title: game.title || null, started: app.started, match: Object.assign({}, match), draft: Object.assign({}, draft), setupOpen: app.setupOpen, orient: app.orient, theta: cam.theta })); } catch (e) {}
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
    app.started = !!data.started; app.setupOpen = !!data.setupOpen;
    if (data.match) Object.assign(match, data.match); if (data.draft) Object.assign(draft, data.draft);
    app.orient = data.orient === 'b' ? 'b' : 'w';
    const m = game.moves[game.moves.length - 1]; app.lastMove = m ? { from: m.from, to: m.to } : null;
  }
  cam.theta = app.orient === 'w' ? 0 : PI; setWorldYaw(cam.theta);
  showFace(5);
  buildTelemetry();
  post.build();
  const w0 = desiredWorld(); applyWorldMix(w0 === 'monolith' ? 1 : 0); app.worldName = w0 === 'monolith' ? 'cathedral' : 'monolith'; setWorld(w0, false);
  if (w0 === 'monolith') { cam.phi = WORLD.monolith.pose.phi; cam.dist = WORLD.monolith.pose.dist; }
  placePieces(cur()); restPose(game.result);
  setTab(prefs.tab);
  render(); engine.init();
}
