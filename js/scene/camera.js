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
import { camera, canvas, stage } from './renderer.js';
import { pieceAt, piecesGroup, sqPos } from './board.js';
import { ensureAudio } from '../app/sound.js';
import { cur, learn } from '../app/state.js';
import { isTarget, onSquare, rookSqOf } from '../game/board-ui.js';

/* ---------- camera orbit ---------- */
export const cam = { theta: 0, phi: 0.98, dist: 11.5, target: new THREE.Vector3(0, 0.3, 0) };
/* shared, in app/store.js: app.shake */
export function updateCamera(t) {
  const sx = app.shake > 0 ? (Math.sin(t * 61) * 0.04 + Math.sin(t * 37) * 0.03) * app.shake : 0, sy = app.shake > 0 ? Math.sin(t * 53) * 0.03 * app.shake : 0;
  camera.position.set(
    cam.target.x + cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta) + sx,
    cam.target.y + cam.dist * Math.cos(cam.phi) + sy,
    cam.target.z + cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta));
  camera.lookAt(cam.target);
}
/* Mouse: left click selects, middle button drags to orbit. Touch: one finger drags to orbit,
   a tap selects, two fingers pinch to zoom. */
const ptr = { down: false, drag: false, orbit: false, x: 0, y: 0, id: null, pinch: 0 };

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
    const mover = cur().turn;
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

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  stage.addEventListener('pointerdown', e => {
    // only presses on the board itself; chips and cards over the stage keep their own clicks
    if (e.target !== canvas) return;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    if (e.button === 1) e.preventDefault();
    ptr.down = true; ptr.drag = false; ptr.orbit = e.pointerType !== 'mouse' || e.button === 1;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.id = e.pointerId; stage.setPointerCapture(e.pointerId); ensureAudio();
  });
  stage.addEventListener('pointermove', e => {
    if (!ptr.down || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (!ptr.drag && Math.hypot(dx, dy) > 5) { ptr.drag = true; if (ptr.orbit) stage.classList.add('dragging'); }
    if (ptr.drag && ptr.orbit) { learn('orbit'); cam.theta -= dx * 0.006; cam.phi = Math.min(1.35, Math.max(0.3, cam.phi - dy * 0.004)); ptr.x = e.clientX; ptr.y = e.clientY; }
  });
  stage.addEventListener('pointerup', e => {
    if (!ptr.down || e.pointerId !== ptr.id) return; ptr.down = false; stage.classList.remove('dragging');
    if (!ptr.drag && (e.pointerType !== 'mouse' || e.button === 0)) pick(e.clientX, e.clientY);
  });
  stage.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });
  stage.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });
  stage.addEventListener('pointercancel', () => { ptr.down = false; stage.classList.remove('dragging'); });
  // the wheel zooms only over the board itself: overlays on the stage (the Crucible deck and its
  // Hive, cards, chips) scroll as pages do
  stage.addEventListener('wheel', e => { if (e.target !== canvas) return; e.preventDefault(); learn('orbit'); cam.dist = Math.min(20, Math.max(6, cam.dist + e.deltaY * 0.01)); }, { passive: false });
  stage.addEventListener('touchstart', e => { if (e.touches.length === 2) ptr.pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
  stage.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && e.target === canvas) { e.preventDefault(); const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); cam.dist = Math.min(20, Math.max(6, cam.dist - (d - ptr.pinch) * 0.02)); ptr.pinch = d; ptr.drag = true; }
  }, { passive: false });
  raycaster = new THREE.Raycaster(); boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); planeHit = new THREE.Vector3();
}
