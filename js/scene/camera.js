/*
✒ Metadata
    - Title: Camera Orbit (MONOLITH Edition - v1.0)
    - File Name: camera.js
    - Relative Path: js/scene/camera.js
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
    The camera's orbit around the board and the pointer: middle-drag to
    orbit, scroll to zoom, and picking a square or piece under the pointer.

✒ Key Features:
    - cam: theta, phi and distance, eased each frame (updateCamera).
    - Orbit and zoom from the pointer and the wheel.
    - rayCandidates() and resolveClick(): which square a click on the board
      means.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 9 of 26. Other modules import from it, for
    example:
        import { cam, rayCandidates } from '../scene/camera.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, scene/renderer.js, scene/board.js,
      app/sound.js, app/state.js and game/board-ui.js; globals three.js r147
      (THREE, from jsDelivr).
    - Shared state (js/app/store.js): reads only app.shake, app.selected and
      app.legalFor.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, PI } from '../app/base.js';
import { camera, canvas, stage } from './renderer.js';
import { buildPiece, pieceAt, piecesGroup, sqPos } from './board.js';
import { dropAt, easeOut, tween } from './motion.js';
import { applyBackdrop, WORLD } from './worlds.js';
import { ensureAudio } from '../app/sound.js';
import { learn } from '../app/state.js';
import { boardState, grabbable, isTarget, onSquare, rookSqOf } from '../game/board-ui.js';
import { endSwing } from '../game/ceremony.js';
import { turning } from '../game/flow.js';

/* ---------- camera orbit ---------- */
/* fit: the distance at which the board fills the stage inside its safe bands, for the world's pose
   (0 until the stage has been measured); pan: the image-space shift that centres it there, in CSS
   px; hand: the view has been orbited or zoomed by hand since it was last square. */
export const cam = { theta: 0, phi: 0.98, dist: 11.5, fit: 0, pan: { x: 0, y: 0 }, fitPan: { x: 0, y: 0 }, hand: false, target: new THREE.Vector3(0, 0.3, 0) };
const REST = new THREE.Vector3(0, 0.3, 0);   // the target's own place, which the end-of-game swing leaves
export const fitDist = () => cam.fit || WORLD[app.worldName].pose.dist;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
/* shared, in app/store.js: app.shake */
let view = { x: NaN, y: NaN, w: 0, h: 0 }, resetShown = false;
export function updateCamera(t) {
  const sx = app.shake > 0 ? (Math.sin(t * 61) * 0.04 + Math.sin(t * 37) * 0.03) * app.shake : 0, sy = app.shake > 0 ? Math.sin(t * 53) * 0.03 * app.shake : 0;
  camera.position.set(
    cam.target.x + cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta) + sx,
    cam.target.y + cam.dist * Math.cos(cam.phi) + sy,
    cam.target.z + cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta));
  camera.lookAt(cam.target);
  // the pan is applied only when it or the stage has changed: it rebuilds the projection
  const w = stage.clientWidth, h = stage.clientHeight;
  if (w && h && (cam.pan.x !== view.x || cam.pan.y !== view.y || w !== view.w || h !== view.h)) { view = { x: cam.pan.x, y: cam.pan.y, w, h }; camera.setViewOffset(w, h, cam.pan.x, cam.pan.y, w, h); }
  // Reset view shows on the stage while a view turned by hand is still off the world's own pose
  if (cam.hand) {
    const pose = WORLD[app.worldName].pose;
    cam.hand = Math.abs(cam.phi - pose.phi) > 0.03 || Math.abs(cam.dist / fitDist() - 1) > 0.05 || Math.abs(wrap(cam.theta - (app.orient === 'w' ? 0 : PI))) > 0.03;
  }
  if (cam.hand !== resetShown) { resetShown = cam.hand; $('#stage-reset').hidden = !resetShown; }
}

/* ---------- fitting the board to the stage ----------
   The board's whole footprint (the frame, its coordinates and the pieces of the starting position
   with their tallest standing anywhere they could start, from either side) fits the stage inside
   its safe bands: the --safe-t/r/b/l the stylesheet sets on the canvas for the overlays of each
   destination. The fit is the smallest distance at which the projected footprint fits the safe
   rect; then a pan in image space centres it on the stage, or as near the centre as the bands
   allow, so the near rank, which looms larger, never pushes the far one off. It is measured at
   the world's pose, square to the board, never at a view turned by hand, so orbiting never
   refits; a zoom by hand is kept as a share of the fit when the stage changes. Measured on a
   resize and a change of destination, world or evaluation bar only: about 24 × 600 projections.
   The fog thins as the fit draws the camera back, so the board reads as it does at the world's
   own distance (scene/worlds.js). */
let FOOT = null; // built on the first fit, from pieces made for it
let fitCam, fitV; // set in init()
function footprint() {
  const pts = [], V = (x, y, z) => pts.push(new THREE.Vector3(x, y, z));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { V(sx * 4.35, 0, sz * 4.35); V(sx * 4.35, -0.104, sz * 4.35); V(sx * 4, 0, sz * 4.425); V(sx * 4.425, 0, sz * 4); }
  // each piece's box, made square about its axis so its facing does not matter
  const R = {}, Y = {};
  for (const t of 'pnbrqk') { const b = new THREE.Box3().setFromObject(buildPiece(t, 'w', `fit-${t}`)); R[t] = Math.max(-b.min.x, b.max.x, -b.min.z, b.max.z); Y[t] = b.max.y; }
  const back = 'rnbqkbnr';
  for (let f = 0; f < 8; f++) for (const [rk, t] of [[0, back[f]], [1, 'p'], [6, 'p'], [7, back[f]]]) for (const s of [rk * 8 + f, (7 - rk) * 8 + 7 - f]) {
    const { x, z } = sqPos(s);
    for (const dx of [-R[t], R[t]]) for (const dz of [-R[t], R[t]]) for (const y of [0, Y[t]]) V(x + dx, y, z + dz);
  }
  return pts;
}
export function safeBands() {
  const cs = getComputedStyle(canvas), b = k => parseFloat(cs.getPropertyValue(`--safe-${k}`)) || 0;
  return { t: b('t'), r: b('r'), b: b('b'), l: b('l') };
}
/* What the fit would be for a pose's phi on the stage as it is now: { dist, x, y }, or null while
   the stage has no size. Changes nothing. */
export function fitFor(phi) {
  const W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return null;
  FOOT = FOOT || footprint();
  const s = safeBands(), sw = Math.max(1, W - s.l - s.r), sh = Math.max(1, H - s.t - s.b);
  fitCam.fov = camera.fov; fitCam.aspect = W / H; fitCam.updateProjectionMatrix();
  const span = d => {
    fitCam.position.set(0, REST.y + d * Math.cos(phi), d * Math.sin(phi)); fitCam.lookAt(REST); fitCam.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of FOOT) { fitV.copy(p).project(fitCam); if (fitV.x < x0) x0 = fitV.x; if (fitV.x > x1) x1 = fitV.x; if (fitV.y < y0) y0 = fitV.y; if (fitV.y > y1) y1 = fitV.y; }
    return { x0: (x0 + 1) / 2 * W, x1: (x1 + 1) / 2 * W, y0: (1 - y1) / 2 * H, y1: (1 - y0) / 2 * H };
  };
  let lo = 6, hi = 40;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2, b = span(m); if (b.x1 - b.x0 <= sw && b.y1 - b.y0 <= sh) hi = m; else lo = m; }
  const b = span(hi), bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const cx = Math.min(W - s.r - bw / 2, Math.max(s.l + bw / 2, W / 2)), cy = Math.min(H - s.b - bh / 2, Math.max(s.t + bh / 2, H / 2));
  return { dist: hi, x: (b.x0 + b.x1) / 2 - cx, y: (b.y0 + b.y1) / 2 - cy };
}
/* Fits the camera to the stage for the current world: on a resize, a change of destination (each
   has its own bands) and a change of world. A tween under way (a world change, Reset view) eases
   toward the new fit, since it reads cam.fit and cam.fitPan as it goes. */
export function fitCamera() {
  const f = fitFor(WORLD[app.worldName].pose.phi); if (!f) return;
  cam.dist = cam.fit ? cam.dist * f.dist / cam.fit : f.dist;
  cam.fit = f.dist; cam.fitPan.x = cam.pan.x = f.x; cam.fitPan.y = cam.pan.y = f.y;
  applyBackdrop();
}
/* Reset view: the world's own pose at the fitted distance, square to the side at the bottom. It
   stops an end-of-game swing first, which would otherwise carry the camera off again. While the
   board turns for the next player (game/flow.js), the turn owns theta and already squares it to
   the side at the bottom, so the reset leaves theta to it from then on: pressed in the beat
   before a turn, its own tween held theta still and the turn then jumped. */
export function resetView() {
  endSwing();
  const pose = WORLD[app.worldName].pose, p0 = cam.phi, r0 = cam.dist / fitDist(), t0 = cam.theta, tg0 = cam.target.clone();
  const dt = wrap((app.orient === 'w' ? 0 : PI) - t0);
  cam.hand = false; let spin = !turning;
  return tween(0.6, e => { cam.phi = p0 + (pose.phi - p0) * e; cam.dist = fitDist() * (r0 + (1 - r0) * e); if (spin && turning) spin = false; if (spin) cam.theta = t0 + dt * e; cam.target.lerpVectors(tg0, REST, e); });
}

/* Pointer. A press on a piece the side to move can play picks it up at once (its targets show):
   drag it onto a square to move it, or let go where it was to keep it selected, and a second click
   puts it down, as clicks always did. A left drag that starts anywhere else orbits, as the middle
   button does, so a trackpad can orbit too; a click elsewhere selects or moves. Touch: one finger
   carries a piece it lands on and orbits from anywhere else, a tap selects, two fingers pinch to
   zoom. */
const ptr = { down: false, drag: false, orbit: false, x: 0, y: 0, id: null, pinch: 0, piece: -1, mesh: null, wasSel: false };
const HOLD = 0.25;   // how high a carried piece floats over the square under the pointer

/* Click resolution.
   The ray yields an ordered list of candidate squares: every piece it passes through (nearest
   first) and the square of the board surface under the cursor. The surface square comes from a
   ray-plane intersection at y = 0, not from the square boxes, so a shallow camera angle cannot
   report the square behind through a box's side face.
   With a piece selected, the nearest candidate that is a legal destination wins, so the lifted
   piece or any piece standing in front of a target is clicked through. With nothing selected, the
   nearest candidate wins, as before. */
let raycaster, boardPlane, planeHit; // set in init()
export function rayCandidates(cx, cy) {
  const r = canvas.getBoundingClientRect();
  // pieces rebuilt since the last frame (undo, review, new game) have no world matrix until it renders
  camera.updateMatrixWorld(); piecesGroup.updateMatrixWorld(true);
  raycaster.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
  const out = [];
  for (const h of raycaster.intersectObjects(piecesGroup.children, true)) {
    let o = h.object; while (o && o.parent !== piecesGroup) o = o.parent;
    const sq = o ? pieceAt.indexOf(o) : -1;
    if (sq >= 0 && !out.some(c => c.sq === sq)) out.push({ sq, dist: h.distance, piece: true });
  }
  if (raycaster.ray.intersectPlane(boardPlane, planeHit)) {
    const f = Math.floor(planeHit.x + 4), rk = Math.floor(4 - planeHit.z);
    if (f >= 0 && f < 8 && rk >= 0 && rk < 8) out.push({ sq: rk * 8 + f, dist: raycaster.ray.origin.distanceTo(planeHit), piece: false });
  }
  return out.sort((a, b) => a.dist - b.dist);
}
export function resolveClick(cx, cy) {
  const cands = rayCandidates(cx, cy);
  if (app.selected >= 0) {
    // The lifted piece and opponent pieces are see-through on the way to a legal square; another
    // piece of the side to move still catches the click, so switching selection always works.
    const mover = boardState().turn;
    for (const c of cands) {
      if (isTarget(c.sq)) return c.sq;
      if (c.piece && c.sq !== app.selected && pieceAt[c.sq] && pieceAt[c.sq].userData.color === mover) return c.sq;
    }
    // The ray found no target. When it hit the lifted piece itself or ran off the board (rays
    // toward the edge files fan outward), the click goes to whichever of the piece's own square
    // and its targets is nearest the cursor on screen, within one square's width of it.
    const hitSelf = cands.some(c => c.piece && c.sq === app.selected), offBoard = !cands.some(c => !c.piece);
    if (hitSelf || offBoard) {
      const r = canvas.getBoundingClientRect();
      const toScreen = (x, z) => { const v = new THREE.Vector3(x, 0, z).project(camera); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; };
      const targets = [...new Set(app.legalFor.flatMap(m => m.castle ? [m.to, rookSqOf(m)] : [m.to]))];
      let best = app.selected, bestD = Infinity, bestW = 0;
      for (const sq of [app.selected, ...targets]) {
        const { x, z } = sqPos(sq), [sx, sy] = toScreen(x, z), d = Math.hypot(sx - cx, sy - cy);
        if (d < bestD) { const a = toScreen(x - 0.5, z), b = toScreen(x + 0.5, z); best = sq; bestD = d; bestW = Math.hypot(b[0] - a[0], b[1] - a[1]); }
      }
      if (best !== app.selected && bestD <= bestW) return best;
      if (hitSelf) return app.selected;
    }
  }
  return cands.length ? cands[0].sq : -1;
}
function pick(cx, cy) { const sq = resolveClick(cx, cy); if (sq >= 0) onSquare(sq); }
/* The piece a press picks up: the nearest one of the side to move on the pointer's ray, the
   selected one included, looking past the opponent's pieces as a click does. A legal target met
   first (a capture, the rook of a castle, an empty square) makes the press a click instead. */
function grabAt(cx, cy) {
  for (const c of rayCandidates(cx, cy)) {
    if (isTarget(c.sq)) return -1;
    if (grabbable(c.sq)) return c.sq;
    if (!c.piece) return -1;
  }
  return -1;
}
/* A carried piece floats over the point of the board under the pointer, so it hangs over the square
   it would land on, as a selected piece lifts over its own. */
function carry(cx, cy) {
  const r = canvas.getBoundingClientRect(), g = ptr.mesh;
  raycaster.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
  if (!raycaster.ray.intersectPlane(boardPlane, planeHit)) return;
  g.position.set(Math.min(4.2, Math.max(-4.2, planeHit.x)), HOLD, Math.min(4.2, Math.max(-4.2, planeHit.z)));
}
function putBack(g, sq) { const a = g.position.clone(), { x, z } = sqPos(sq); tween(0.15, e => g.position.set(a.x + (x - a.x) * e, a.y * (1 - e), a.z + (z - a.z) * e), easeOut); }
/* Letting go of a carried piece: on a legal square it moves there through the same path a click
   takes (the game, an explored line, a study), settling from where it was dropped; anywhere else
   it goes back and stays selected. The square is read along the pointer's ray as a click's is,
   except that a piece of its own side standing in front of the square is looked past (a drop
   cannot mean switching pieces), so a piece pointed at is taken and a square half hidden behind a
   pawn still takes the drop. A press and release without a drag is a click, read as clicks always
   were: on a piece just picked up it leaves it selected; on one already selected it puts it down,
   or reaches through it to a target behind. */
function drop(dragged, cx, cy) {
  const sq = ptr.piece, g = ptr.mesh, wasSel = ptr.wasSel; ptr.piece = -1; ptr.mesh = null;
  if (!dragged) { if (wasSel && app.selected === sq) pick(cx, cy); return; }
  if (pieceAt[sq] !== g) return;   // the board was rebuilt under the carry (an undo, a new game)
  const hit = app.selected === sq ? rayCandidates(cx, cy).find(c => isTarget(c.sq)) : null, t = hit ? hit.sq : app.selected === sq ? resolveClick(cx, cy) : -1;
  if (t >= 0 && t !== sq && isTarget(t)) { dropAt(g); onSquare(t); dropAt(null); if (app.busy) return; }
  putBack(g, sq);   // not a move, or one that asks first (a promotion): the piece goes home
}
function endCarry() { if (ptr.piece >= 0 && ptr.mesh && pieceAt[ptr.piece] === ptr.mesh) putBack(ptr.mesh, ptr.piece); ptr.piece = -1; ptr.mesh = null; }
const zoomTo = d => { const f = fitDist(); cam.dist = Math.min(f * 1.75, Math.max(f * 0.55, d)); cam.hand = true; };

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  stage.addEventListener('pointerdown', e => {
    // only presses on the board itself; chips and cards over the stage keep their own clicks
    if (e.target !== canvas) return;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    if (e.button === 1) e.preventDefault();
    // a second finger is a pinch (the touch handlers below): the first finger's carry or orbit ends
    if (ptr.down && e.pointerId !== ptr.id) { endCarry(); ptr.orbit = false; return; }
    Object.assign(ptr, { down: true, drag: false, x: e.clientX, y: e.clientY, id: e.pointerId, piece: -1, mesh: null, wasSel: false });
    // a press on a piece it can carry selects it at once; a press on a target stays a click
    const sq = e.button === 1 ? -1 : grabAt(e.clientX, e.clientY);
    if (sq >= 0) {
      ptr.wasSel = app.selected === sq; if (!ptr.wasSel) onSquare(sq);
      if (app.selected === sq && pieceAt[sq]) { ptr.piece = sq; ptr.mesh = pieceAt[sq]; }   // read after: a new explored line rebuilds the pieces
    }
    ptr.orbit = ptr.piece < 0;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    ensureAudio();
  });
  stage.addEventListener('pointermove', e => {
    if (!ptr.down || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (!ptr.drag && Math.hypot(dx, dy) > 5) { ptr.drag = true; stage.style.cursor = ''; stage.classList.add('dragging'); }
    if (!ptr.drag) return;
    if (ptr.piece >= 0) { if (pieceAt[ptr.piece] === ptr.mesh && app.selected === ptr.piece) carry(e.clientX, e.clientY); else { ptr.piece = -1; ptr.mesh = null; } }
    else if (ptr.orbit) { learn('orbit'); cam.hand = true; cam.theta -= dx * 0.006; cam.phi = Math.min(1.35, Math.max(0.3, cam.phi - dy * 0.004)); ptr.x = e.clientX; ptr.y = e.clientY; }
  });
  stage.addEventListener('pointerup', e => {
    if (!ptr.down || e.pointerId !== ptr.id) return; ptr.down = false; stage.classList.remove('dragging');
    if (ptr.mesh) return drop(ptr.drag, e.clientX, e.clientY);
    if (!ptr.drag && (e.pointerType !== 'mouse' || e.button === 0)) pick(e.clientX, e.clientY);
  });
  stage.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });
  stage.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });
  stage.addEventListener('pointercancel', () => { ptr.down = false; stage.classList.remove('dragging'); endCarry(); });
  // the wheel zooms only over the board itself: overlays on the stage (the Crucible deck and its
  // Hive, cards, chips) scroll as pages do; the range and the step follow the fitted distance
  stage.addEventListener('wheel', e => { if (e.target !== canvas) return; e.preventDefault(); learn('orbit'); zoomTo(cam.dist + e.deltaY * 0.01 * fitDist() / 11.5); }, { passive: false });
  stage.addEventListener('touchstart', e => { if (e.touches.length === 2) ptr.pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
  // a pinch that starts during a carry comes after a move the browser has already let go of, so
  // it is cancelled only where it still can be (the canvas takes no panning anyway)
  stage.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && e.target === canvas) { if (e.cancelable) e.preventDefault(); const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); zoomTo(cam.dist - (d - ptr.pinch) * 0.02 * fitDist() / 11.5); ptr.pinch = d; ptr.drag = true; }
  }, { passive: false });
  raycaster = new THREE.Raycaster(); boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); planeHit = new THREE.Vector3();
  fitCam = new THREE.PerspectiveCamera(camera.fov, 1, camera.near, camera.far); fitV = new THREE.Vector3();
  // each destination and world has its own bands and pose, and the evaluation bar widens the left
  // band: refit when any of them changes, even when the stage keeps its size (resizes refit from
  // app/loop.js); the renderers set these on every render, so only a real change counts
  const refit = rs => { if (rs.some(r => r.oldValue !== r.target.getAttribute(r.attributeName))) fitCamera(); };
  new MutationObserver(refit).observe(document.documentElement, { attributes: true, attributeOldValue: true, attributeFilter: ['data-tab', 'data-skin'] });
  new MutationObserver(refit).observe($('#evalbar'), { attributes: true, attributeOldValue: true, attributeFilter: ['hidden'] });
}
