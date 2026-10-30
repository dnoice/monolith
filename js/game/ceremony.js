/*
✒ Metadata
    - Title: Ceremony (MONOLITH Edition - v1.0)
    - File Name: ceremony.js
    - Relative Path: js/game/ceremony.js
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
      release audit Dennis asked for: the winner's glow is one light kept at
      zero between games (a light added at the win recompiled every lit
      shader at that moment); the crowned king keeps its marble or obsidian
      shading and gets its own material back when the ceremony clears; an
      interrupted camera swing puts the camera back; and motes last less as
      the Animation setting quickens, like every other effect.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The game's ceremonies: pieces dealt in at the start, the shudder of a
    king in check, the flash of a promotion, and the end: the loser's king
    topples, the winner's army waves and bows, the camera swings.

✒ Key Features:
    - dealIn(): the pieces arrive at the start of a game.
    - checkShudder() and promotionFlash().
    - celebrate(): topple, crown, army wave, bow and camera swing.
    - restPose(): the board as a finished game leaves it.
    - Motes and ring bursts, cleared when a new game starts; the winner's
      glow, one light kept at zero between games.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 13 of 26. Other modules import from it,
    for example:
        import { restPose, celebrate } from '../game/ceremony.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/board.js, scene/camera.js, scene/motion.js, app/sound.js,
      app/state.js, scene/worlds.js and scene/materials.js; globals
      three.js r147 (THREE, from jsDelivr) and Chess (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.shake; reads app.SPEED.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { PI, prefs, reduceMotion } from '../app/base.js';
import { scene } from '../scene/renderer.js';
import { pieceAt, sqPos } from '../scene/board.js';
import { cam, fitDist } from '../scene/camera.js';
import { easeIn, easeInOut, easeOut, tween, wait } from '../scene/motion.js';
import { sound } from '../app/sound.js';
import { cur, game } from '../app/state.js';
import { markerColor, markerMono, pal } from '../scene/worlds.js';
import { matCopy } from '../scene/materials.js';

/* ---------- ceremony: game start, check, promotion and game end ----------
   Every effect here runs on the shared tween clock, so the Animation setting scales it, and
   each sequence carries the ceremony generation it started under: a new game, an undo or a
   review bumps the generation, clears the effects, and any step still waiting stops quietly. */
export let ceremonyGen = 0;
export let fx; // set in init()
const motes = [];   // live particle systems
let moteTex; // set in init()
const heavyFx = () => !reduceMotion && prefs.speed !== 'minimal';
/* The winner's glow is one light made at the start and kept at zero between games: a light added
   at the moment of a win would change the light count and recompile every lit program then. */
let winnerGlow; // set in init()
const crowned = [];   // the crowned king's meshes, each with the material it had before
let swing = null;     // the camera's pose before an end-of-game swing, while one runs
export function clearCeremony() {
  ceremonyGen++;
  cam.target.set(0, 0.3, 0);
  if (swing) { cam.theta = swing.theta; cam.dist = swing.ratio * fitDist(); swing = null; }
  for (const m of [...fx.children]) { m.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); fx.remove(m); }
  motes.length = 0;
  winnerGlow.intensity = 0;
  for (const [o, m] of crowned) { o.material.dispose(); o.material = m; }
  crowned.length = 0;
}
const live = gen => gen === ceremonyGen;
const after = (s, gen) => wait(s).then(() => live(gen));

/* A flat ring that grows and fades on a square. */
function ringBurst(sq, color, dur = 0.7, grow = 2.2, name = 'ring-burst') {
  const { x, z } = sqPos(sq);
  const mat = new THREE.MeshBasicMaterial({ color: markerColor(color), toneMapped: !markerMono(), transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.46, 48), mat);
  m.name = `${name}-${Chess.sqName(sq)}`; m.rotation.x = -PI / 2; m.position.set(x, 0.02, z); fx.add(m);
  return tween(dur, e => { m.scale.setScalar(0.6 + grow * e); mat.opacity = 0.85 * (1 - e); }, easeOut)
    .then(() => { fx.remove(m); m.geometry.dispose(); mat.dispose(); });
}

/* Rising, swirling motes around a point. */
function moteBurst(x, z, color, count, opts = {}) {
  if (!heavyFx()) count = Math.round(count / 4);
  const pos = new Float32Array(count * 3), vel = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * PI * 2, r = (opts.radius ?? 0.35) * Math.sqrt(Math.random());
    pos[i * 3] = x + Math.cos(a) * r; pos[i * 3 + 1] = (opts.y0 ?? 0.2) + Math.random() * (opts.height ?? 1.2); pos[i * 3 + 2] = z + Math.sin(a) * r;
    vel.push({ up: (opts.rise ?? 0.9) * (0.5 + Math.random()), swirl: (opts.swirl ?? 1.6) * (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.8), out: (opts.out ?? 0.25) * Math.random() });
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: markerColor(color), toneMapped: !markerMono(), size: opts.size ?? 0.09, map: moteTex, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat); pts.name = opts.name || 'motes'; fx.add(pts);
  motes.push({ pts, vel, cx: x, cz: z, age: 0, life: (opts.life ?? 2.6) * app.SPEED });   // shorter as the Animation setting quickens, like every tween
}
export function stepMotes(dt) {
  for (let i = motes.length - 1; i >= 0; i--) {
    const s = motes[i]; s.age += dt;
    const p = s.pts.geometry.attributes.position, arr = p.array;
    for (let j = 0; j < s.vel.length; j++) {
      const v = s.vel[j], dx = arr[j * 3] - s.cx, dz = arr[j * 3 + 2] - s.cz;
      const ang = v.swirl * dt, ca = Math.cos(ang), sa = Math.sin(ang), grow = 1 + v.out * dt;
      arr[j * 3] = s.cx + (dx * ca - dz * sa) * grow; arr[j * 3 + 2] = s.cz + (dx * sa + dz * ca) * grow; arr[j * 3 + 1] += v.up * dt;
    }
    p.needsUpdate = true;
    const k = s.age / s.life; s.pts.material.opacity = k < 0.15 ? k / 0.15 : Math.max(0, 1 - (k - 0.15) / 0.85);
    if (k >= 1) { fx.remove(s.pts); s.pts.geometry.dispose(); s.pts.material.dispose(); motes.splice(i, 1); }
  }
}

/* Game start: pieces drop onto their squares, centre ranks first. */
export async function dealIn() {
  const gen = ceremonyGen, list = [];
  pieceAt.forEach((g, sq) => { if (g) list.push({ g, d: Math.abs((sq >> 3) - 3.5) * 0.06 + (sq & 7) * 0.012 }); });
  for (const { g } of list) { g.userData.anim = true; g.position.y = 1.4; g.scale.setScalar(0.85); }
  await Promise.all(list.map(({ g, d }) => wait(d).then(() => tween(0.42, (e, p) => {
    if (!live(gen)) return;
    const bounce = p < 0.78 ? 1 - Math.pow(1 - p / 0.78, 2) : 1 - 0.06 * Math.sin(PI * (p - 0.78) / 0.22);
    g.position.y = 1.4 * (1 - bounce); g.scale.setScalar(0.85 + 0.15 * Math.min(1, p * 1.4));
  }, p => p))));
  for (const { g } of list) { g.position.y = 0; g.scale.setScalar(1); g.userData.anim = false; }
  if (live(gen)) sound.tick(0.6);
}

/* Check: the king shudders and a red shockwave leaves its square. */
export function checkShudder(sq) {
  const g = pieceAt[sq]; if (!g || g.userData.fallen) return;
  ringBurst(sq, pal.checkBurst, 0.6, 1.8, 'check-burst');
  const body = g.userData.body; g.userData.anim = true;
  tween(0.42, (e, p) => { body.rotation.z = 0.09 * Math.sin(p * PI * 7) * (1 - p); body.position.y = 0.03 * Math.sin(p * PI); }, p => p)
    .then(() => { body.rotation.z = 0; body.position.y = 0; if (!g.userData.fallen) g.userData.anim = false; });
}

/* Promotion: a gold flash and a short rise of motes. */
export function promotionFlash(sq) {
  const { x, z } = sqPos(sq);
  ringBurst(sq, pal.promo, 0.7, 2.4, 'promotion-burst');
  moteBurst(x, z, pal.promoMote, 40, { life: 1.4, height: 0.8, rise: 1.1, name: 'promotion-motes' });
}

/* A king tips over away from `from` (a square), pivoting on its base rim, then settles. */
const TOPPLE = 1.42;
function toppleTarget(g, from) {
  const k = g.position, a = from === null ? null : sqPos(from);
  let dx = a ? k.x - a.x : 0, dz = a ? k.z - a.z : 1; const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n;
  // work in the piece's local frame (it is yawed to face the opponent)
  const inv = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -g.rotation.y);
  const dir = new THREE.Vector3(dx, 0, dz).applyQuaternion(inv);
  const axis = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
  return { dir, axis, pivot: dir.clone().multiplyScalar(0.3) };
}
function poseTopple(g, t, amount) {
  const q = new THREE.Quaternion().setFromAxisAngle(t.axis, amount), body = g.userData.body;
  body.quaternion.copy(q);
  body.position.copy(t.pivot).add(t.pivot.clone().negate().applyQuaternion(q));
}
async function topple(sq, from, gen) {
  const g = pieceAt[sq]; if (!g) return;
  g.userData.anim = true; g.userData.fallen = true;
  const t = toppleTarget(g, from), body = g.userData.body;
  await tween(0.45, (e, p) => { if (live(gen)) body.rotation.z = 0.12 * Math.sin(p * PI * 6) * (1 - p * 0.5); }, p => p);
  if (!live(gen)) return; body.rotation.set(0, 0, 0);
  await tween(0.62, e => { if (live(gen)) poseTopple(g, t, TOPPLE * e); }, easeIn);
  if (!live(gen)) return;
  sound.thud(); app.shake = Math.max(app.shake, 0.7); ringBurst(sq, pal.dust, 0.8, 2.0, 'dust-burst');
  await tween(0.32, (e, p) => { if (live(gen)) poseTopple(g, t, TOPPLE - 0.12 * Math.sin(PI * p)); }, p => p);
}
/* The final resting pose without animation (returning to a finished game). */
export function restPose(result) {
  if (!result || !result.winner) return;
  const loser = Chess.other(result.winner), st = cur(), sq = Chess.kingSq(st.board, loser), g = pieceAt[sq];
  if (!g) return;
  const from = result.resigned ? null : (game.moves.length ? game.moves[game.moves.length - 1].to : null);
  g.userData.anim = true; g.userData.fallen = true; poseTopple(g, toppleTarget(g, from), TOPPLE);
}

/* The winning king rises, spins and glows; its army hops in a wave. */
async function crown(sq, gen) {
  const g = pieceAt[sq]; if (!g) return;
  const { x, z } = sqPos(sq), body = g.userData.body;
  g.userData.anim = true;
  // its own materials, so only this king glows
  body.traverse(o => { if (o.isMesh) { crowned.push([o, o.material]); o.material = matCopy(o.material); o.material.emissive = new THREE.Color(pal.crown); o.material.emissiveIntensity = 0; } });
  const glow = winnerGlow; glow.color.set(pal.crown); glow.position.set(x, 2.4, z);
  moteBurst(x, z, pal.victory, 170, { name: 'victory-motes', life: 3.2, height: 1.5, rise: 1.0, swirl: 1.8 });
  await tween(1.7, (e, p) => {
    if (!live(gen)) return;
    body.position.y = 0.32 * Math.sin(PI * Math.min(1, p * 1.15)) + 0.04;
    body.rotation.y = 2 * PI * e;
    const k = Math.sin(PI * Math.min(1, p * 1.4));
    body.traverse(o => { if (o.isMesh) o.material.emissiveIntensity = 0.12 + 0.5 * k; });
    glow.intensity = 0.6 + 2.2 * k;
  }, easeInOut);
  if (!live(gen)) return;
  body.rotation.y = 0; body.position.y = 0;
  body.traverse(o => { if (o.isMesh) o.material.emissiveIntensity = 0.12; });
  glow.intensity = 0.6; g.userData.anim = false;
}
async function armyWave(color, fromSq, gen) {
  const a = sqPos(fromSq), jobs = [];
  pieceAt.forEach((g, sq) => {
    if (!g || sq === fromSq || g.userData.color !== color || g.userData.fallen) return;
    const b = sqPos(sq), d = Math.hypot(b.x - a.x, b.z - a.z);
    jobs.push(wait(0.25 + d * 0.07).then(() => {
      if (!live(gen)) return; g.userData.anim = true; const body = g.userData.body;
      return tween(0.42, (e, p) => { if (live(gen)) { body.position.y = 0.28 * Math.sin(PI * p); body.rotation.x = -0.12 * Math.sin(PI * p); } }, p => p)
        .then(() => { body.position.y = 0; body.rotation.x = 0; g.userData.anim = false; });
    }));
  });
  await Promise.all(jobs);
}
/* Both kings bow once (draws). */
async function bow(sq, gen) {
  const g = pieceAt[sq]; if (!g) return; const body = g.userData.body; g.userData.anim = true;
  await tween(1.1, (e, p) => { if (live(gen)) body.rotation.x = 0.32 * Math.sin(PI * p); }, easeInOut);
  body.rotation.x = 0; g.userData.anim = false;
}
/* A slow swing that drifts toward the point between the two kings, so both stay in frame, then
   returns to where the player had the camera. Its distance is a share of the fitted one, so a stage
   resized meanwhile is not undone; Reset view ends it where it is (endSwing). */
let swingGen = 0;
export function endSwing() { if (swing) { swingGen++; swing = null; } }
function cameraSwing(gen, a, b) {
  if (!heavyFx()) return;
  const t0 = cam.theta, r0 = cam.dist / fitDist(), tg0 = cam.target.clone(), sg = ++swingGen, on = () => live(gen) && sg === swingGen;
  const pa = sqPos(a), pb = sqPos(b), mid = new THREE.Vector3((pa.x + pb.x) / 2, 0.3, (pa.z + pb.z) / 2);
  const toward = tg0.clone().lerp(mid, 0.45), span = Math.hypot(pa.x - pb.x, pa.z - pb.z);
  const dz = -Math.min(0.9, Math.max(0, 0.9 - span * 0.08));        // zoom in less when the kings are far apart
  const pose = k => { cam.theta = t0 + 0.32 * k; cam.dist = (r0 + dz / 11.5 * k) * fitDist(); cam.target.copy(tg0).lerp(toward, k); };
  swing = { theta: t0, ratio: r0 };   // an interrupted swing is put back by clearCeremony()
  tween(2.2, e => { if (on()) pose(e); }, easeInOut)
    .then(() => on() && tween(2.4, e => { if (on()) pose(1 - e); }, easeInOut))
    .then(() => { if (on()) swing = null; else if (!live(gen)) cam.target.copy(tg0); });
}

/* The game-end ceremony for a result that has just happened. */
export async function celebrate(result) {
  clearCeremony(); const gen = ceremonyGen, st = cur();
  if (!result.winner) {
    sound.drawTone();
    const kings = ['w', 'b'].map(c => Chess.kingSq(st.board, c));
    for (const sq of kings) { const { x, z } = sqPos(sq); moteBurst(x, z, pal.drawMote, 70, { name: 'draw-motes', life: 2.4, height: 1.2, rise: 0.7 }); }
    await Promise.all(kings.map(sq => bow(sq, gen)));
    return;
  }
  const loserSq = Chess.kingSq(st.board, Chess.other(result.winner)), winSq = Chess.kingSq(st.board, result.winner);
  const from = result.resigned ? null : (game.moves.length ? game.moves[game.moves.length - 1].to : null);
  cameraSwing(gen, loserSq, winSq);
  await topple(loserSq, from, gen);
  if (!(await after(0.1, gen))) return;
  sound.fanfare();
  await Promise.all([crown(winSq, gen), armyWave(result.winner, winSq, gen)]);
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  fx = new THREE.Group(); fx.name = 'effects'; scene.add(fx);
  winnerGlow = new THREE.PointLight(0xffffff, 0, 7, 2); winnerGlow.name = 'light-winner-glow'; scene.add(winnerGlow);
  moteTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,0.55)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
}
