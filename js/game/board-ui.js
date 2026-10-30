/*
✒ Metadata
    - Title: Board Interaction (MONOLITH Edition - v1.0)
    - File Name: board-ui.js
    - Relative Path: js/game/board-ui.js
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
    What the player sees and does on the board: highlights, castling lanes,
    hint and candidate arrows, selection, hover and the square a click
    means.

✒ Key Features:
    - showHighlights(): selection, legal moves, captures, the last move,
      check, the hint and the Position tab's lit squares.
    - Castling lanes from the king to the rook it would bring across.
    - Arrows: the hint (amber, one) and calculated candidates (blue, ranked
      by quality).
    - select(), deselect() and onSquare(): the click-to-move flow.
    - boardState(): the position the board shows (game, review, explore or a
      Crucible game).

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 12 of 26. Other modules import from it,
    for example:
        import { deselect, boardState } from '../game/board-ui.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/board.js, scene/camera.js, scene/motion.js, app/sound.js,
      app/state.js, ui/snackbar.js, game/play.js, game/flow.js,
      scene/worlds.js, ui/analyze.js, ui/analyze-view.js,
      ui/crucible-board.js, ui/nav.js and ui/position.js; globals three.js
      r147 (THREE, from jsDelivr) and Chess (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.selected and app.legalFor;
      reads app.lastMove, app.hint, app.calc, app.busy, app.started and
      app.view.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, PI, prefs } from '../app/base.js';
import { lin, stage } from '../scene/renderer.js';
import { board, highlights, HL, pieceAt, pulse, sqPos } from '../scene/board.js';
import { rayCandidates, resolveClick } from '../scene/camera.js';
import { easeOut, tween } from '../scene/motion.js';
import { sound } from '../app/sound.js';
import { canMoveNow, cur, game, shown, tip } from '../app/state.js';
import { snack } from '../ui/snackbar.js';
import { askPromotion, playMove } from './play.js';
import {
  explore, exploreAvailable, exploreCheck, exploreSquare, exploreState, goLive, setExplorePref,
  underlyingState
} from './flow.js';
import { markerMono, pal } from '../scene/worlds.js';
import { an, xr } from '../ui/analyze.js';
import { renderXray } from '../ui/analyze-view.js';
import { boardOverride } from '../ui/crucible-board.js';
import { setTab } from '../ui/nav.js';
import { insight } from '../ui/position.js';

/* ---------- board highlights ---------- */
export let castleRing; // set in init()
/* Castling lanes: when the king is selected and castling is legal, a blue lane runs along the
   rank from the king to the rook it would bring across, so the castle square cannot be mistaken
   for an ordinary king step. */
let castleLanes; // set in init()
export let castleLaneMat; // set in init()
function castleOptions() { return app.selected >= 0 ? app.legalFor.filter(m => m.castle) : []; }
export function rookSqOf(m) { return (m.from >> 3) * 8 + (m.castle === 'K' ? 7 : 0); }
function drawCastleLanes() {
  for (const c of [...castleLanes.children]) { c.geometry.dispose(); castleLanes.remove(c); }
  if (!prefs.legal) return;
  for (const m of castleOptions()) {
    const a = sqPos(m.from), b = sqPos(rookSqOf(m)), len = Math.abs(b.x - a.x);
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.2), castleLaneMat);
    lane.name = `castle-lane-${m.castle === 'K' ? 'kingside' : 'queenside'}`;
    lane.rotation.x = -PI / 2; lane.position.set((a.x + b.x) / 2, 0.009, a.z);
    castleLanes.add(lane);
  }
}
function clearHighlights() { for (const h of highlights) { h.fill.visible = h.dot.visible = h.ring.visible = false; } }
export const boardState = () => explore.on ? exploreState() : boardOverride ? boardOverride.state : shown();
export function showHighlights() {
  exploreCheck();   // every board change ends here, so a line whose board moved on is dropped first
  clearHighlights();
  const st = boardState(), em = explore.on && explore.moves[explore.moves.length - 1];
  const lm = em ? { from: em.from, to: em.to } : boardOverride ? boardOverride.last : app.lastMove;
  if (lm) for (const s of [lm.from, lm.to]) { highlights[s].fill.material = HL.last; highlights[s].fill.visible = true; }
  // Position: the squares a value in the board reading points at
  if (prefs.tab === 'position') for (const s of insight.squares) { highlights[s].fill.material = HL.insight; highlights[s].fill.visible = true; }
  // the hint's steps: the piece lights at step 2, the target square and arrow at step 3
  const hintOn = !boardOverride && !!(app.hint && !app.hint.pending && app.hint.state === st && app.hint.level >= 2);
  if (hintOn) {
    highlights[app.hint.from].fill.material = HL.hint; highlights[app.hint.from].fill.visible = true;
    const { x, z } = sqPos(app.hint.to); hintMark.position.set(x, 0.014, z);
  }
  hintMark.visible = hintOn && app.hint.level >= 3;
  if (app.selected >= 0 && (explore.on || !boardOverride)) {
    highlights[app.selected].fill.material = HL.select; highlights[app.selected].fill.visible = true;
    if (prefs.legal) for (const m of app.legalFor) {
      if (m.castle) {
        // castling: a ring on the king's target square and on the rook it brings across
        const rank = m.from >> 3, rookSq = m.castle === 'K' ? rank * 8 + 7 : rank * 8;
        for (const s of [m.to, rookSq]) { highlights[s].ring.material = castleRing; highlights[s].ring.visible = true; }
      } else if (m.capture) { highlights[m.to].ring.material = HL.capture; highlights[m.to].ring.visible = true; }
      else highlights[m.to].dot.visible = true;
    }
  }
  if (Chess.inCheck(st)) { const k = Chess.kingSq(st.board, st.turn); highlights[k].fill.material = HL.check; highlights[k].fill.visible = true; }
  drawCastleLanes();
  // the chip names the exact squares: target square or rook, for each legal castle
  const opts = castleOptions(), chip = $('#castle-chip');
  chip.hidden = !opts.length || !tip('castle');
  if (opts.length) $('#castle-text').innerHTML = 'Castle: ' + opts.sort((x, y) => x.castle < y.castle ? -1 : 1).map(m =>
    `<b>${Chess.sqName(m.to)}</b> or the ${Chess.sqName(rookSqOf(m))} rook for ${m.castle === 'K' ? 'O-O' : 'O-O-O'}`).join(' · ');
}

/* ---------- arrows: hint (amber, one) and calculated candidates (blue, ranked) ---------- */
let arrows; // set in init()
/* Candidate quality. Each line is graded by how much it gives up against the best line, in
   centipawns from the mover's side, so equally strong moves share a colour. Bands follow the
   usual analysis convention: best, good, inaccuracy, mistake. Colours avoid the hint's gold. */
export const QUALITY = [
  { key: 'best',       label: 'Best',       max: 10,       c: 0x4fd18b, css: '#4fd18b', mc: 0x2cc8d8, mcss: '#2CC8D8' },
  { key: 'good',       label: 'Good',       max: 60,       c: 0xb8d65a, css: '#b8d65a', mc: 0xe3e7ee, mcss: '#E3E7EE' },
  { key: 'inaccuracy', label: 'Inaccurate', max: 150,      c: 0xf5963b, css: '#f5963b', mc: 0xe8a93a, mcss: '#E8A93A' },
  { key: 'mistake',    label: 'Mistake',    max: Infinity, c: 0xef5b5b, css: '#ef5b5b', mc: 0xed7f83, mcss: '#ED7F83' }
];
/* In MONOLITH the grades take the semantic stops: cyan for the best line, ink for good, amber
   for an inaccuracy (volatility), crimson for a mistake (refutation). */
export const qColor = q => markerMono() ? q.mc : q.c, qCss = q => markerMono() ? q.mcss : q.css;
const lineValue = inf => inf.kind === 'mate' ? (inf.value > 0 ? 100000 - inf.value * 100 : -100000 - inf.value * 100) : inf.value;
export function lineQuality(lines) {
  const vals = lines.map(l => l ? lineValue(l) : null), best = Math.max(...vals.filter(v => v !== null));
  return vals.map(v => v === null ? null : Object.assign({ loss: best - v }, QUALITY.find(q => best - v <= q.max)));
}
const arrowStyleFor = (q, rank) => ({ c: qColor(q), o: rank === 0 ? 0.95 : 0.82 });
const hintStyle = () => ({ c: pal.hintArrow, o: 1 });
function clearArrows() { for (const a of [...arrows.children]) { a.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== castleRing) o.material.dispose(); }); arrows.remove(a); } }
function makeArrow(name, from, to, style, lift = 0) {
  const a = sqPos(from), b = sqPos(to), dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
  const head = 0.4, w = 0.19, start = 0.16, shaftLen = Math.max(0.05, len - head - start - 0.06), pad = 0.05;
  // flat markers skip the filmic tone mapping, which is for lit surfaces and would wash them out
  const mat = new THREE.MeshBasicMaterial({ color: markerMono() ? lin(style.c) : style.c, transparent: true, opacity: style.o, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const edge = new THREE.MeshBasicMaterial({ color: markerMono() ? lin(pal.arrowEdge) : pal.arrowEdge, transparent: true, opacity: 0.6 * style.o, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const g = new THREE.Group(); g.name = `${name}-arrow`;
  const tri = (hw, h) => { const t = new THREE.Shape(); t.moveTo(-hw, 0); t.lineTo(hw, 0); t.lineTo(0, h); t.closePath(); return new THREE.ShapeGeometry(t); };
  // outline first (dark, slightly larger, a hair below), then the coloured arrow on top
  const outline = new THREE.Group(); outline.name = `${name}-arrow-outline`; outline.position.z = -0.002;
  const oShaft = new THREE.Mesh(new THREE.PlaneGeometry(w + pad * 2, shaftLen + pad), edge); oShaft.name = `${name}-arrow-outline-shaft`; oShaft.position.y = start + shaftLen / 2 - pad / 2; oShaft.renderOrder = 1;
  const oTip = new THREE.Mesh(tri(0.25 + pad * 1.6, head + pad * 2.2), edge); oTip.name = `${name}-arrow-outline-head`; oTip.position.y = start + shaftLen - pad * 0.8; oTip.renderOrder = 1;
  outline.add(oShaft, oTip);
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(w, shaftLen), mat); shaft.name = `${name}-arrow-shaft`; shaft.position.y = start + shaftLen / 2; shaft.renderOrder = 2;
  const tip = new THREE.Mesh(tri(0.25, head), mat); tip.name = `${name}-arrow-head`; tip.position.y = start + shaftLen; tip.renderOrder = 2;
  g.add(outline, shaft, tip);
  // Built in the XY plane pointing +Y. Laying it flat (x = −90°) turns +Y into world −Z; the holder's
  // yaw then turns −Z toward the target: rotating (0,0,−1) by θ gives (−sin θ, 0, −cos θ) = (dx, dz)/len.
  g.rotation.x = -PI / 2;
  const holder = new THREE.Group(); holder.name = name; holder.position.set(a.x, 0.03 + lift, a.z);
  holder.rotation.y = Math.atan2(-dx, -dz); holder.add(g);
  holder.userData.mat = mat;
  return holder;
}
export function drawArrows() {
  clearArrows();
  if (boardOverride || explore.on || prefs.tab === 'analyze') return;
  const st = shown();
  if (app.calc.state === st) {
    const grades = lineQuality(app.calc.lines);
    // drawn worst first, so the best line's arrow lies on top where arrows cross
    app.calc.lines.map((inf, i) => i).reverse().forEach(i => {
      const inf = app.calc.lines[i];
      if (!inf || (app.calc.active >= 0 && app.calc.active !== i)) return;
      const mv = Chess.fromUci(st, inf.pv[0]); if (!mv) return;
      arrows.add(makeArrow(`candidate-${String(i + 1).padStart(2, '0')}-${grades[i].key}`, mv.from, mv.to, arrowStyleFor(grades[i], i), (app.calc.lines.length - i) * 0.002));
    });
  }
  if (app.hint && !app.hint.pending && app.hint.state === st && app.hint.level >= 3) {
    const h = makeArrow('hint', app.hint.from, app.hint.to, hintStyle(), 0.012); arrows.add(h);
    if (!app.hint.drawn) { app.hint.drawn = true; h.scale.set(1, 1, 0.001); tween(0.35, e => h.scale.set(1, 1, Math.max(0.001, e)), easeOut); }
  }
}
// a soft pulse on the hint arrow so it reads as advice, not as a move already made
export function stepArrows(t) {
  const k = Math.sin(t * 3.2);
  for (const a of arrows.children) if (a.name === 'hint') a.userData.mat.opacity = 0.82 + 0.18 * k;
  if (hintMark.visible) hintMarkMat.opacity = 0.62 + 0.18 * k;      // breathes with the arrow
}

/* ---------- selection ---------- */
export function select(sq) {
  app.selected = sq; app.legalFor = Chess.legal(explore.on ? exploreState() : cur(), sq); showHighlights();
  const g = pieceAt[sq], { x, z } = sqPos(sq);
  // lift with a small overshoot, a pulse ring on the square, targets grow outward from the piece
  if (g) { g.userData.lift = 0; tween(0.28, (e, p) => { g.userData.lift = 0.16 * (1 + 0.35 * Math.sin(PI * p)) * e; }, easeOut); }
  pulse.position.set(x, 0.01, z); pulse.visible = true; pulse.scale.setScalar(0.6); HL.pulse.opacity = 0.7;
  tween(0.5, e => { pulse.scale.setScalar(0.6 + 1.1 * e); HL.pulse.opacity = 0.7 * (1 - e); }, easeOut).then(() => { pulse.visible = false; });
  const marks = [];
  for (const m of app.legalFor) {
    const d = Math.hypot((m.to & 7) - (sq & 7), (m.to >> 3) - (sq >> 3));
    marks.push({ m: highlights[m.to][m.capture || m.castle ? 'ring' : 'dot'], d });
    if (m.castle) { const rank = m.from >> 3; marks.push({ m: highlights[m.castle === 'K' ? rank * 8 + 7 : rank * 8].ring, d: d + 1 }); }
  }
  const maxD = Math.max(1, ...marks.map(k => k.d));
  for (const k of marks) k.m.scale.setScalar(0.001);
  tween(0.36, (e, p) => { for (const k of marks) { const local = Math.min(1, Math.max(0, p * 1.6 - 0.6 * k.d / maxD)); k.m.scale.setScalar(0.001 + 0.999 * (1 - Math.pow(1 - local, 3))); } }, p => p)
    .then(() => { for (const k of marks) k.m.scale.setScalar(1); });
  sound.tick(0.5);
}
export function deselect() {
  if (app.selected >= 0 && pieceAt[app.selected]) { const u = pieceAt[app.selected].userData; u.body.position.y = 0; u.body.rotation.y = 0; u.lift = 0; }
  app.selected = -1; app.legalFor = []; showHighlights(); setHover(-1);
}
// a legal destination of the selected piece, or the rook of a legal castle
export function isTarget(sq) { return app.selected >= 0 && app.legalFor.some(m => m.to === sq || (m.castle && rookSqOf(m) === sq)); }

/* Hint destination: a square outline on the square the hint arrow points to. It is the only
   square outline on the board, so it can't be read as a different move. */
export let hintMarkMat; // set in init()
let hintMark; // set in init()

/* Hover (mouse only): click-through draws nothing on the board. The cursor turns into a pointer
   only where a click does something. */
let hoverQueued = null;
function setHover(sq, clickable = false) {
  if (!stage.classList.contains('dragging')) stage.style.cursor = sq >= 0 && clickable ? 'pointer' : '';
}
function clickableAt(sq) {
  if (sq < 0) return false;
  if (explore.on || (prefs.explore && exploreAvailable())) {
    if (app.busy) return false; const st = explore.on ? exploreState() : underlyingState(), p = st.board[sq];
    return isTarget(sq) || !!(p && p.c === st.turn);
  }
  if (boardOverride) return false;
  if (!app.started) return true;                       // a click explains how to start (nudgeStart)
  if (!canMoveNow()) return false;
  const p = cur().board[sq];
  return isTarget(sq) || !!(p && p.c === cur().turn);
}
export function onSquare(sq) {
  // with the X-Ray on in Analyze, a tap chooses its square (touch has no hover to aim it; a second
  // tap on it lets it go); a mouse click still moves pieces while the X-Ray follows the pointer
  if (prefs.tab === 'analyze' && (xr.sticky || xr.held) && xr.touch) { xr.pin = xr.pin === sq ? -1 : sq; renderXray(an.st || shown()); return; }
  if (explore.on || (prefs.explore && exploreAvailable())) return exploreSquare(sq);
  const tryIt = { label: 'Move pieces', act: () => { setExplorePref(true); exploreSquare(sq); } };
  if (boardOverride) { snack('This board shows a Crucible game. Your game waits on the Play tab.', [tryIt, { label: 'Play tab', act: () => setTab('play') }]); return; }
  if (!app.started) { nudgeStart(); return; }
  if (app.view !== null) { snack('You are looking at an earlier move.', [tryIt, { label: 'Back to live', filled: true, act: goLive }]); return; }
  if (game.result) { snack('The game is over.', [tryIt]); return; }
  if (!canMoveNow()) return;
  const st = cur(), p = st.board[sq];
  if (app.selected >= 0) {
    // the target square, or the rook itself when the king is selected (castle by clicking the rook)
    const mv = app.legalFor.find(m => m.to === sq) ||
      app.legalFor.find(m => m.castle && sq === ((m.from >> 3) * 8 + (m.castle === 'K' ? 7 : 0)));
    if (mv) { if (mv.needsPromo) return askPromotion(mv); return playMove(mv); }
  }
  if (p && p.c === st.turn) { if (app.selected === sq) deselect(); else { deselect(); select(sq); } }
  else deselect();
}
function nudgeStart() {
  setTab('play');
  const b = $('#btn-start'); b.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,0,0,1)' });
  snack('Press Start game to begin.');
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  castleRing = new THREE.MeshBasicMaterial({ color: 0xa9c4ea, transparent: true, opacity: 1, depthWrite: false });
  castleLanes = new THREE.Group(); castleLanes.name = 'castle-lanes'; board.add(castleLanes);
  castleLaneMat = new THREE.MeshBasicMaterial({ color: 0x8fb4ec, transparent: true, opacity: 0.38, depthWrite: false });
  // ---------- arrows: hint (amber, one) and calculated candidates (blue, ranked)
  arrows = new THREE.Group(); arrows.name = 'arrows'; board.add(arrows);
  // ---------- selection
  hintMarkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
  hintMark = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 4, 1, PI / 4), hintMarkMat);
  hintMark.name = 'highlight-hint-target'; hintMark.rotation.x = -PI / 2; hintMark.visible = false; board.add(hintMark);
  stage.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    hoverQueued = [e.clientX, e.clientY];
    requestAnimationFrame(() => {
      if (!hoverQueued) return; const [x, y] = hoverQueued; hoverQueued = null; const sq = resolveClick(x, y); setHover(sq, clickableAt(sq));
      // the X-Ray follows the square under the cursor
      const c = prefs.tab === 'analyze' ? rayCandidates(x, y) : [], boardSq = c.length ? c[0].sq : -1;
      if (boardSq !== xr.hover) { xr.hover = boardSq; if (prefs.tab === 'analyze' && (xr.held || xr.sticky)) renderXray(an.st || shown()); }
    });
  });
  stage.addEventListener('pointerleave', () => { hoverQueued = null; setHover(-1); if (xr.hover !== -1) { xr.hover = -1; if (prefs.tab === 'analyze' && (xr.held || xr.sticky)) renderXray(an.st || shown()); } });
}
