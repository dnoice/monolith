/*
✒ Metadata
    - Title: Motion (MONOLITH Edition - v1.0)
    - File Name: motion.js
    - Relative Path: js/scene/motion.js
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
    Tweens and the pieces' movement: glides, hops and lunges, facing the
    target and back, and the idle breathing of the pieces between moves.

✒ Key Features:
    - tween() and stepTweens(): eased animations on one clock, scaled by the
      speed setting.
    - easeIn, easeOut and easeInOut.
    - animMove() and animAttack(): a move and a capture.
    - stepIdle(): the pieces' idle motion.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { tween, easeOut, easeInOut } from '../scene/motion.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/board.js and
      app/sound.js.
    - Shared state (js/app/store.js): sets app.shake; reads app.SPEED and
      app.selected.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { PI } from '../app/base.js';
import { pieceAt, shatter, sqPos, yawFor } from './board.js';
import { sound } from '../app/sound.js';

/* ---------- tweens ---------- */
const tweens = [];
export const easeInOut = p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
export const easeOut = p => 1 - Math.pow(1 - p, 3), easeIn = p => p * p * p;
export function tween(dur, fn, ease = easeInOut) { return new Promise(res => tweens.push({ t0: performance.now(), dur: Math.max(1, dur * 1000 * app.SPEED), fn, ease, res })); }
export function stepTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i]; const p = Math.min(1, (now - tw.t0) / tw.dur); tw.fn(tw.ease(p), p);
    if (p >= 1) { tweens.splice(i, 1); tw.res(); }
  }
}
export const wait = s => new Promise(r => setTimeout(r, s * 1000 * app.SPEED));

/* ---------- piece animation ---------- */
async function faceToward(g, dx, dz, dur = 0.14) {
  const target = Math.atan2(dx, dz); let from = g.rotation.y;
  let d = target - from; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI;
  await tween(dur, e => { g.rotation.y = from + d * e; }, easeOut);
}
async function faceHome(g, dur = 0.22) {
  const target = yawFor(g.userData.color); let from = g.rotation.y;
  let d = target - from; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI;
  await tween(dur, e => { g.rotation.y = from + d * e; }, easeInOut);
}
export async function animMove(g, from, to) {
  const a = sqPos(from), b = sqPos(to), body = g.userData.body, hop = g.userData.type === 'n';
  g.userData.anim = true; body.rotation.z = 0; body.position.y = 0;
  await faceToward(g, b.x - a.x, b.z - a.z);
  const h = hop ? 1.0 : 0.22, dur = hop ? 0.6 : 0.42 + 0.03 * Math.hypot(b.x - a.x, b.z - a.z);
  await tween(dur, (e, p) => {
    g.position.x = a.x + (b.x - a.x) * e; g.position.z = a.z + (b.z - a.z) * e;
    g.position.y = h * Math.sin(PI * p);
    body.rotation.x = (hop ? 0.35 : 0.14) * Math.sin(PI * p);
  }, hop ? easeInOut : easeInOut);
  g.position.set(b.x, 0, b.z); body.rotation.x = 0;
  await faceHome(g); g.userData.anim = false;
}
export async function animAttack(g, from, to, victim) {
  const a = sqPos(from), b = sqPos(to), body = g.userData.body, hop = g.userData.type === 'n';
  g.userData.anim = true; if (victim) victim.userData.anim = true; body.rotation.z = 0; body.position.y = 0;
  await faceToward(g, b.x - a.x, b.z - a.z, 0.12);
  // wind up
  await tween(0.18, e => { body.rotation.x = -0.28 * e; g.position.y = 0.12 * e; }, easeOut);
  // lunge to the impact point
  const k = 0.62;
  await tween(hop ? 0.3 : 0.24, (e, p) => {
    g.position.x = a.x + (b.x - a.x) * k * e; g.position.z = a.z + (b.z - a.z) * k * e;
    g.position.y = hop ? 0.9 * Math.sin(PI * p * 0.85) : 0.12 + 0.18 * Math.sin(PI * p);
    body.rotation.x = -0.28 + 0.75 * e;
  }, easeIn);
  if (victim) { shatter(victim); sound.crack(); app.shake = 1; }
  await tween(0.22, e => { body.rotation.x = 0.47 - 0.3 * e; }, easeOut);
  await wait(0.12);
  await tween(0.38, (e, p) => {
    g.position.x = a.x + (b.x - a.x) * (k + (1 - k) * e); g.position.z = a.z + (b.z - a.z) * (k + (1 - k) * e);
    g.position.y = (hop ? 0.45 : 0.12) * Math.sin(PI * p) * (1 - p) + (hop ? 0.3 : 0.1) * (1 - e);
    body.rotation.x = 0.17 * (1 - e);
  }, easeInOut);
  g.position.set(b.x, 0, b.z); body.rotation.x = 0;
  await faceHome(g); g.userData.anim = false;
}
export function stepIdle(t) {
  for (const g of pieceAt) {
    if (!g || g.userData.anim) continue;
    const ph = g.userData.phase, body = g.userData.body;
    body.position.y = 0.012 * Math.sin(t * 1.4 + ph);
    body.rotation.z = 0.018 * Math.sin(t * 0.9 + ph);
    body.rotation.x = 0.012 * Math.sin(t * 1.1 + ph * 1.3);
  }
  if (app.selected >= 0 && pieceAt[app.selected] && !pieceAt[app.selected].userData.anim) {
    const u = pieceAt[app.selected].userData; u.body.position.y = (u.lift || 0) + 0.03 * Math.sin(t * 4); u.body.rotation.y = 0.04 * Math.sin(t * 2.2);
  }
}
