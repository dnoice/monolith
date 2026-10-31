/*
✒ Metadata
    - Title: Worlds (MONOLITH Edition - v1.2)
    - File Name: worlds.js
    - Relative Path: js/scene/worlds.js
    - Artifact Type: javascript
    - Version: 1.2.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: the veil of a world change clears
      smoothly over its second half and starts from where an interrupted
      change left it (it held dark, then snapped clear); worldSettled() says
      when a change has finished; and a change warms the preview shaders
      again.
    - 1.1.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Reads
      the graphics level from js/scene/quality.js, the new home of Dennis's
      tiered levels; the mirror floor shows wherever the level's
      reflections are on.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Cathedral and MONOLITH on one board. The world follows the destination
    (MONOLITH for Analyze and Crucible) or stays where Settings puts it; a
    change blends materials, lights, haze and bloom, swaps the sets at the
    midpoint and eases the camera to the world's pose.

✒ Key Features:
    - PAL and pal: the marker palette of each world.
    - WORLD: each world's pose, fog, bloom and backdrop.
    - applyWorldMix(): the continuous blend between the worlds.
    - setWorld() and desiredWorld(): the transition, and which world a tab
      wants.
    - resizeMirror() and syncWorldRender().
    - worldSettled(): whether a world change has finished.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 16 of 26. Other modules import from it,
    for example:
        import { desiredWorld, markerMono, pal } from '../scene/worlds.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/quality.js, scene/materials.js, scene/sets.js, scene/board.js,
      scene/instruments.js, scene/post.js, scene/camera.js, scene/motion.js,
      app/state.js, game/engine.js and game/board-ui.js; globals three.js
      r147 (THREE, from jsDelivr).
    - Shared state (js/app/store.js): sets app.worldName and app.ghostWarm
      (the preview shaders are warmed again in each world).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, PI, prefs, reduceMotion } from '../app/base.js';
import { canvas, ENV, lin, renderer, scene, stage } from './renderer.js';
import { tier } from './quality.js';
import { marbleUniforms, MAT, rimUniforms } from './materials.js';
import {
  hemi, key, mirrorFloor, monoFloorMirror, monoFloorPlain, monoSet, monoWash, rimLights, roseLight, set
} from './sets.js';
import { fragMats, HL, relabel } from './board.js';
import { INK } from './instruments.js';
import { hazeMix, planarShafts, post } from './post.js';
import { cam, fitCamera, fitDist } from './camera.js';
import { easeInOut, tween } from './motion.js';
import { renderers } from '../app/state.js';
import { engineFamily } from '../game/engine.js';
import { castleLaneMat, castleRing, drawArrows, hintMarkMat, showHighlights } from '../game/board-ui.js';

/* =====================================================================================
   Worlds: Cathedral ↔ MONOLITH. One board, two worlds. The world follows the destination by
   default (MONOLITH for Analyze and Crucible, the cathedral elsewhere) or stays where Settings
   puts it. A change runs one transition: materials, lights, haze, bloom and backdrop blend
   continuously, the sets swap under a dip to the canvas colour at the midpoint, and the camera
   eases to the world's pose. Marker colours follow the world: MONOLITH keeps colour semantic
   (cyan optimal, amber volatile, crimson anomaly or refutation; structure in ink and steel).
   ===================================================================================== */
const PAL = {
  cathedral: { select: 0xf0c96a, legal: 0xffd77a, halo: 0x120e14, capture: 0xff6a58, last: 0xe3bf72, check: 0xff5a4a, hint: 0x9bb6dc, hintRing: 0xa9c4ea, pulse: 0xffe2a0, insight: 0x5f8fe8,
    castle: 0xa9c4ea, castleLane: 0x8fb4ec, hintArrow: 0xffc861, hintMark: 0xffffff, arrowEdge: 0x120e16, victory: 0xffd77a, crown: 0xffc861, promo: 0xffd77a, promoMote: 0xffe2a0, checkBurst: 0xff5a4a, drawMote: 0xcfd6e6, dust: 0xb9b1c4 },
  monolith: { select: INK.steel, legal: INK.ink, halo: INK.canvas, capture: INK.ink, last: INK.slate, check: INK.crimson, hint: INK.cyan, hintRing: INK.cyan, pulse: INK.ink, insight: INK.cyan,
    castle: INK.steel, castleLane: INK.steel, hintArrow: INK.cyan, hintMark: INK.cyan, arrowEdge: INK.canvas, victory: INK.ivory, crown: INK.ivory, promo: INK.ivory, promoMote: INK.ivory, checkBurst: INK.crimson, drawMote: INK.steel, dust: INK.slate }
};
export let pal; // set in init()
/* An unlit marker colour: the cathedral keeps its established (tone-mapped) look; MONOLITH shows
   the solved token exactly. */
export const markerMono = () => pal === PAL.monolith;
export const markerColor = hex => markerMono() ? lin(hex) : new THREE.Color(hex);
/* MONOLITH's light (Dennis, 10/23/2026: from some angles the board glared white). Three things
   made the glare. The key's cone was narrow (0.42 rad) with a long penumbra, so its full-strength
   core was a pool about four squares wide; the squares were glossy (0.42 and 0.46); and bloom
   started at 0.8, below the brightest a tone-mapped surface can reach, so every strong glint
   bloomed into a blaze. Now the core covers the board (0.5 rad, penumbra 0.45), the squares are
   satin (0.5, 0.54), the haze is lighter (0.72), and bloom starts at 0.95, so only the brightest
   glints and the markers and instruments drawn past white glow. The cathedral is unchanged. */
export const WORLD = {
  cathedral: { marble: [0xe9e4da, 0.36, 0.45, 0.9], obsidian: [0x15121a, 0.14, 1, 1.3], sqLight: new THREE.Color(0xe4dccd), sqDark: new THREE.Color(0x38333f), frame: new THREE.Color(0x2a262e), rough: [0.5, 0.6],
    bg: 0x0b0a0e, fog: 0.04, exposure: 1.1, key: { pos: [4, 14, 7], color: 0xffe9c8, intensity: 1.5, angle: 0.55, penumbra: 0.6 }, hemi: [0x3b4262, 0x120f14, 0.55],
    haze: { spot: 1, beam: 1, density: 0.009 }, bloom: [0.45, 0.55, 0.84], pose: { phi: 0.98, dist: 11.5 } },
  monolith: { marble: [0xece8ef, 0.34, 0.42, 0.62], obsidian: [0x0f1318, 0.22, 0.7, 1.1], sqLight: lin(0x3f4b5b).multiplyScalar(1.5), sqDark: lin(0x181d25).multiplyScalar(1.5), frame: lin(0x1b212a), rough: [0.5, 0.54],
    bg: 0x0b0d10, fog: 0.03, exposure: 1.15, key: { pos: [-1.2, 15, 4.2], color: 0xe8eef8, intensity: 1.6, angle: 0.5, penumbra: 0.45 }, hemi: [0x2a3240, 0x0b0d10, 0.42],
    haze: { spot: 0.72, beam: 0, density: 0.0095 }, bloom: [0.62, 0.5, 0.95], pose: { phi: 0.84, dist: 11.2 } }
};
export let worldK = 0, worldGen = 0, cathedralWeight = 1;
const _ca = new THREE.Color(), _cb = new THREE.Color(), bgSrgb = new THREE.Color();
const mixColor = (target, a, b, k) => target.copy(_ca.set(a)).lerp(_cb.set(b), k);
/* With post-processing, fog blends in linear light, which reads lighter than the direct path's
   sRGB-space blend; a slightly denser fog keeps the two tiers looking alike. The camera's distance
   is fitted to the stage (scene/camera.js), and the fog thins by as much as the fit draws it back
   from the world's own distance, so the board is as clear at any size as at that one. */
const FOG_POST = 1.18;
export function applyBackdrop() {
  const post_ = !!post.composer;
  scene.background.copy(bgSrgb); if (post_) scene.background.convertSRGBToLinear();
  scene.fog.color.copy(bgSrgb); if (post_) scene.fog.color.convertSRGBToLinear();
  scene.fog.density = baseFog * (post_ ? FOG_POST : 1) * (cam.fit ? WORLD[app.worldName].pose.dist / cam.fit : 1);
}
let baseFog = 0.04;
export function applyWorldMix(k) {
  worldK = k; const A = WORLD.cathedral, B = WORLD.monolith, L = (a, b) => a + (b - a) * k;
  mixColor(MAT.marble.color, A.marble[0], B.marble[0], k); MAT.marble.roughness = L(A.marble[1], B.marble[1]); MAT.marble.clearcoat = L(A.marble[2], B.marble[2]); MAT.marble.envMapIntensity = L(A.marble[3], B.marble[3]);
  mixColor(MAT.obsidian.color, A.obsidian[0], B.obsidian[0], k); MAT.obsidian.roughness = L(A.obsidian[1], B.obsidian[1]); MAT.obsidian.clearcoat = L(A.obsidian[2], B.obsidian[2]); MAT.obsidian.envMapIntensity = L(A.obsidian[3], B.obsidian[3]);
  rimUniforms.uRim.value = k;
  marbleUniforms.uEdge.value = L(0.5, 0.9); marbleUniforms.uContact.value = L(0.86, 0.76);
  mixColor(MAT.sqLight.color, A.sqLight, B.sqLight, k); MAT.sqLight.roughness = L(A.rough[0], B.rough[0]);
  mixColor(MAT.sqDark.color, A.sqDark, B.sqDark, k); MAT.sqDark.roughness = L(A.rough[1], B.rough[1]);
  mixColor(MAT.frame.color, A.frame, B.frame, k);
  fragMats.w.color.copy(MAT.marble.color); fragMats.b.color.copy(MAT.obsidian.color);
  key.position.set(L(A.key.pos[0], B.key.pos[0]), L(A.key.pos[1], B.key.pos[1]), L(A.key.pos[2], B.key.pos[2]));
  mixColor(key.color, A.key.color, B.key.color, k); key.intensity = L(A.key.intensity, B.key.intensity); key.angle = L(A.key.angle, B.key.angle); key.penumbra = L(A.key.penumbra, B.key.penumbra);
  mixColor(hemi.color, A.hemi[0], B.hemi[0], k); mixColor(hemi.groundColor, A.hemi[1], B.hemi[1], k); hemi.intensity = L(A.hemi[2], B.hemi[2]);
  cathedralWeight = 1 - k; roseLight.intensity = 1 - k;
  for (const l of rimLights) l.intensity = 1.15 * k;
  monoWash.intensity = 1.3 * k;
  renderer.toneMappingExposure = L(A.exposure, B.exposure);
  hazeMix.spot = L(A.haze.spot, B.haze.spot); hazeMix.beam = L(A.haze.beam, B.haze.beam); hazeMix.density = L(A.haze.density, B.haze.density);
  if (post.bloom) { post.bloom.strength = L(A.bloom[0], B.bloom[0]); post.bloom.radius = L(A.bloom[1], B.bloom[1]); post.bloom.threshold = L(A.bloom[2], B.bloom[2]); }
  mixColor(bgSrgb, A.bg, B.bg, k); baseFog = L(A.fog, B.fog);
  applyBackdrop();
}
/* The level-dependent parts of a world: mirror or plain floor, planar or ray-marched shafts. */
export function syncWorldRender() {
  const mono = worldK >= 0.5, useMirror = mono && tier().reflect > 0 && !!THREE.Reflector;
  if (useMirror) mirrorFloor();
  if (monoFloorMirror) { monoFloorMirror.visible = useMirror; resizeMirror(); }
  monoFloorPlain.visible = !useMirror;
  for (const sh of planarShafts) sh.visible = !!sh.userData.planar;
  applyWorldMix(worldK);
}
export function resizeMirror() {
  if (!monoFloorMirror) return;
  const pr = renderer.getPixelRatio(), f = Math.max(0.25, tier().reflect);
  monoFloorMirror.getRenderTarget().setSize(Math.max(64, Math.round(stage.clientWidth * pr * f)), Math.max(64, Math.round(stage.clientHeight * pr * f)));
}
function applyMarkerPalette(mono) {
  pal = mono ? PAL.monolith : PAL.cathedral;
  const paint = (m, hex) => { m.color.copy(markerColor(hex)); if (m.toneMapped !== !mono) { m.toneMapped = !mono; m.needsUpdate = true; } };
  for (const k of Object.keys(HL)) paint(HL[k], pal[k]);
  paint(castleRing, pal.castle); paint(castleLaneMat, pal.castleLane); paint(hintMarkMat, pal.hintMark);
}
function swapWorld(mono) {
  set.visible = !mono; monoSet.visible = mono;
  app.ghostWarm = 'pending';   // the previews' programs are warmed again for this world, once it settles
  scene.environment = mono ? ENV.monolith : ENV.cathedral;
  relabel(mono ? 'monolith' : 'cathedral');
  applyMarkerPalette(mono);
  syncWorldRender();
  if (renderers.length) { showHighlights(); drawArrows(); }
}
/* True once a world change has finished (the mix is at its world's end). */
export const worldSettled = () => Math.abs(worldK - (app.worldName === 'monolith' ? 1 : 0)) < 1e-3;
// the Grimoire is a reference: opening it never changes the world
export const desiredWorld = () => prefs.world !== 'auto' ? prefs.world : ['analyze', 'crucible'].includes(prefs.tab) ? 'monolith' : prefs.tab === 'grimoire' ? app.worldName : 'cathedral';
export function setWorld(name, animate = true) {
  if (name === app.worldName && Math.abs(worldK - (name === 'monolith' ? 1 : 0)) < 1e-3) return;
  app.worldName = name; document.documentElement.dataset.skin = name;
  $('#brand-sub').textContent = name === 'monolith' ? `MONOLITH world · ${engineFamily().family} instrument` : 'Cathedral world · marble vs. obsidian';
  canvas.setAttribute('aria-label', name === 'monolith' ? '3D chess board in the MONOLITH instrument' : '3D chess board inside a cathedral');
  const to = name === 'monolith' ? 1 : 0, from = worldK, gen = ++worldGen, fade = $('#stage-fade');
  /* The camera eases to the world's pose at the distance fitted for it, and to its pan: both read
     live, so a stage that changes size on the way (the dock coming up) is still fitted at the end. */
  const pose = WORLD[name].pose, p0 = cam.phi, d0 = cam.dist, pan0 = { x: cam.pan.x, y: cam.pan.y };
  fitCamera();
  if (!animate || reduceMotion || prefs.speed === 'minimal') {
    applyWorldMix(to); swapWorld(to >= 0.5); fade.style.opacity = '0';
    if (animate) { cam.phi = pose.phi; cam.dist = fitDist(); }
    return;
  }
  /* The veil dips to 0.92 at the swap, halfway, and clears again over the second half. It starts
     from wherever an interrupted change left it: a change that needs no swap (the way back before
     halfway) only clears it. */
  let swapped = (from >= 0.5) === (to >= 0.5);
  const dip = !swapped, fade0 = Math.min(1, Math.max(0, +fade.style.opacity || 0));
  tween(0.95, (e, p) => {
    if (gen !== worldGen) return;
    const k = easeInOut(p);
    applyWorldMix(from + (to - from) * k);
    fade.style.opacity = String(dip ? Math.max(fade0 * (1 - p), 0.92 * Math.sin(PI * p)) : fade0 * (1 - p));
    if (!swapped && p >= 0.5) { swapped = true; swapWorld(to >= 0.5); }
    cam.phi = p0 + (pose.phi - p0) * k; cam.dist = d0 + (fitDist() - d0) * k;
    cam.pan.x = pan0.x + (cam.fitPan.x - pan0.x) * k; cam.pan.y = pan0.y + (cam.fitPan.y - pan0.y) * k;
  }, p => p).then(() => { if (gen === worldGen) { fade.style.opacity = '0'; if (!swapped) swapWorld(to >= 0.5); } });
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  pal = PAL.cathedral;
}
