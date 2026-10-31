/*
✒ Metadata
    - Title: Phantoms (MONOLITH Edition - v1.0)
    - File Name: phantoms.js
    - Relative Path: js/scene/phantoms.js
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
      release audit Dennis asked for: the materials the warm-up frame
      compiles (a ghost of each colour, a hologram and a capture ring) are
      kept for the page's life, so no preview compiles them again.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    A line scrubbed in the Synaptic PV is shown as a difference from the
    board: phantom pieces where the line puts them, ghosts where it takes
    them away, capture rings where it takes.

✒ Key Features:
    - setPhantoms(): the difference between the board and a ply of the line.
    - Holographic materials on a shared clock (holoClock).
    - Vacate, capture and arrival rates eased per frame (stepPreview).
    - warmGhostPrograms(): compiles the ghost shaders before first use.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 7 of 26. Other modules import from it, for
    example:
        import { holoClock, phantoms } from '../scene/phantoms.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/materials.js, scene/board.js, scene/instruments.js and
      scene/post.js; globals three.js r147 (THREE, from jsDelivr) and Chess
      (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.ghostWarm.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { PI, reduceMotion } from '../app/base.js';
import { lin, scene } from './renderer.js';
import { MAT } from './materials.js';
import { buildPiece, GEO, PIECE_NAMES, pieceAt, piecesGroup, sqPos } from './board.js';
import { geoOriginRing, INK, vectorsGroup } from './instruments.js';
import { post } from './post.js';

/* ---------- phantoms: a scrubbed line shown as a difference from the board ----------
   Revised (10/22/2026) because a whole second set at 90 % over the real set at
   30 % made it hard to tell what the board was saying. Now:
     - a piece that ends where it stands stays as it is, solid, with no phantom;
     - a piece that leaves its square fades to a faint ghost there (18 %);
     - a piece that is captured fades to a crimson-lit ghost (55 %) over a crimson ring;
     - only the pieces that land somewhere new appear, as holograms rimmed in cyan.
   It moves fluidly: a hologram glides out from the square its piece leaves, and
   between chips the holograms slide to their new squares (matched by colour and type, nearest
   first) while the ghosts cross-fade, all on one exponential ease, so sweeping along a line
   reads as the line being played. The ghosts are per-piece transparent copies of the piece
   materials (same shading hooks); the real materials are never touched. */
export let phantoms; // set in init()
export const holoClock = { value: 0 };
function holoMaterial(base, rim, rimK, opacity = 0.9) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uBase: { value: lin(base) }, uRim: { value: lin(rim) }, uRimK: { value: rimK }, uTime: holoClock, uOpacity: { value: opacity } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; vY = (modelMatrix * vec4(position, 1.0)).y; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uBase, uRim; uniform float uRimK, uTime, uOpacity;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float diff = 0.38 + 0.62 * max(dot(n, normalize(vec3(0.35, 0.8, 0.5))), 0.0);
        float fres = pow(clamp(1.0 - abs(dot(n, v)), 0.0, 1.0), 2.2);
        // scanlines fade out where they would be finer than about a pixel, so distant
        // phantoms don't shimmer into moiré as the lines scroll
        float aa = 1.0 - smoothstep(0.5, 1.4, fwidth(vY * 95.0));
        float scan = 0.9 + 0.1 * aa * sin(vY * 95.0 - uTime * 3.0);
        gl_FragColor = vec4(uBase * diff * scan + uRim * fres * uRimK, uOpacity);
        #include <encodings_fragment>
      }`,
    extensions: { derivatives: true },
    transparent: true, depthWrite: true, toneMapped: false
  });
  m.userData.keep = true; return m;
}
const PV = { key: '', list: [], ghosts: new Map() };   // list: arriving holograms; ghosts: real piece group → its fade
const PV_RATE = 14, PV_FLOOR = { vacate: 0.18, capture: 0.55 }, PV_CAPTURE = lin(INK.crimson);
let pvMarks; // set in init()
const sqDist = (a, b) => Math.hypot((a & 7) - (b & 7), (a >> 3) - (b >> 3));
/* What the line changes: arrivals (with the square each comes from), squares left, captures. */
function previewDiff(base, proj) {
  const leave = [], arrive = [];
  for (let s = 0; s < 64; s++) {
    const B = base.board[s], P = proj.board[s];
    if (B && P && B.c === P.c && B.t === P.t) continue;
    if (B) leave.push(s);
    if (P) arrive.push({ sq: s, c: P.c, t: P.t, from: -1 });
  }
  const free = new Set(leave);
  for (const pawnPass of [false, true]) for (const a of arrive) {   // same type first, then a pawn for a promotion
    if (a.from >= 0) continue; let best = -1, bd = Infinity;
    for (const s of free) { const B = base.board[s]; if (B.c !== a.c || B.t !== (pawnPass ? 'p' : a.t)) continue; const d = sqDist(s, a.sq); if (d < bd) { bd = d; best = s; } }
    if (best >= 0) { a.from = best; free.delete(best); }
  }
  return { arrive, vacate: leave.filter(s => !free.has(s)), capture: [...free] };
}
function spawnPhantom(a) {
  const mat = holoMaterial(a.c === 'w' ? INK.ivory : INK.obsidian, INK.cyan, a.c === 'w' ? 0.9 : 1.3, 0);
  const g = buildPiece(a.t, a.c, `phantom-${a.c === 'w' ? 'ivory' : 'obsidian'}-${PIECE_NAMES[a.t]}-${Chess.sqName(a.sq)}`, { w: mat, b: mat });
  g.traverse(o => { o.castShadow = false; o.receiveShadow = false; if (o.isMesh) o.renderOrder = 7; });
  const o = sqPos(a.from >= 0 ? a.from : a.sq), t = sqPos(a.sq);
  const P = { g, mat, c: a.c, t: a.t, sq: a.sq, x: o.x, z: o.z, tx: t.x, tz: t.z, k: 0, goal: 1 };
  g.position.set(o.x, 0, o.z); g.scale.setScalar(0.88); phantoms.add(g); return P;
}
function dropPhantom(P) { phantoms.remove(P.g); P.g.traverse(o => { if (o.geometry && !Object.values(GEO).includes(o.geometry)) o.geometry.dispose(); }); P.mat.dispose(); }
function ghostMaterialFor(g, kind) {
  const src = g.userData.color === 'w' ? MAT.marble : MAT.obsidian, m = src.clone();
  m.onBeforeCompile = src.onBeforeCompile; m.customProgramCacheKey = src.customProgramCacheKey;
  m.transparent = true; m.depthWrite = false; m.name = `${src.name}-ghost-${kind}`;
  if (kind === 'capture') m.emissive.copy(PV_CAPTURE);
  m.emissiveIntensity = 0; m.userData.keep = false; return m;
}
function ghostSet(g, kind) {
  let G = PV.ghosts.get(g);
  if (!kind) { if (G) G.goal = 0; return; }
  if (G && G.kind !== kind) { G.mat.dispose(); G.mat = ghostMaterialFor(g, kind); G.kind = kind; G.meshes.forEach(([m]) => { m.material = G.mat; }); }
  if (G) { G.goal = 1; return; }
  const meshes = []; g.traverse(o => { if (o.isMesh) meshes.push([o, o.material, o.castShadow]); });
  G = { kind, k: 0, goal: 1, mat: ghostMaterialFor(g, kind), meshes, ring: null };
  for (const [m] of meshes) { m.material = G.mat; m.castShadow = false; }
  PV.ghosts.set(g, G);
}
function captureRing(G, g, on) {
  if (on && !G.ring) {
    G.ring = new THREE.Mesh(geoOriginRing, new THREE.MeshBasicMaterial({ color: PV_CAPTURE, toneMapped: false, transparent: true, opacity: 0, depthWrite: false }));
    G.ring.name = `phantom-capture-ring-${g.name}`; G.ring.rotation.x = -PI / 2; G.ring.position.set(g.position.x, 0.015, g.position.z); G.ring.renderOrder = 5; pvMarks.add(G.ring);
  } else if (!on && G.ring) { pvMarks.remove(G.ring); G.ring.material.dispose(); G.ring = null; }
}
function ghostRestore(g, G) { for (const [m, mat, sh] of G.meshes) { m.material = mat; m.castShadow = sh; } captureRing(G, g, false); G.mat.dispose(); PV.ghosts.delete(g); }
/* proj: the projected position, base: the position on the board; null ends the preview. */
export function setPhantoms(proj, key, base = null) {
  if (key === PV.key) return; PV.key = key;
  if (!proj || !base) { for (const P of PV.list) P.goal = 0; for (const G of PV.ghosts.values()) G.goal = 0; return; }
  const d = previewDiff(base, proj), want = new Map();
  for (const s of d.vacate) want.set(s, 'vacate'); for (const s of d.capture) want.set(s, 'capture');
  for (let s = 0; s < 64; s++) if (pieceAt[s]) ghostSet(pieceAt[s], want.get(s) || null);
  for (const [g, G] of PV.ghosts) if (!pieceAt.includes(g)) G.goal = 0;
  // holograms already shown are matched to the new arrivals closest pair first across the whole
  // board, so one that stays put never slides off to stand in for a neighbour
  const pool = PV.list.filter(P => P.goal > 0), pairs = [], usedP = new Set(), usedA = new Set(), next = [];
  d.arrive.forEach((a, ai) => { const t = sqPos(a.sq); for (const P of pool) if (P.c === a.c && P.t === a.t) pairs.push([Math.hypot(P.x - t.x, P.z - t.z), ai, P]); });
  pairs.sort((x, y) => x[0] - y[0]);
  const match = new Map();
  for (const [, ai, P] of pairs) if (!usedA.has(ai) && !usedP.has(P)) { usedA.add(ai); usedP.add(P); match.set(ai, P); }
  d.arrive.forEach((a, ai) => {
    const P = match.get(ai);
    if (P) { const t = sqPos(a.sq); Object.assign(P, { sq: a.sq, tx: t.x, tz: t.z, goal: 1 }); next.push(P); }
    else next.push(spawnPhantom(a));
  });
  for (const P of PV.list) if (!next.includes(P)) { P.goal = 0; next.push(P); }
  PV.list = next;
}
export function stepPreview(dt) {
  // the vectors describe the root's first moves, so they step aside while a line is previewed
  vectorsGroup.visible = !PV.list.some(P => P.goal > 0);
  if (!PV.list.length && !PV.ghosts.size) return;
  const a = reduceMotion ? 1 : 1 - Math.exp(-dt * PV_RATE), ease = (v, to) => Math.abs(to - v) < 0.002 ? to : v + (to - v) * a;
  for (let i = PV.list.length - 1; i >= 0; i--) {
    const P = PV.list[i]; P.k = ease(P.k, P.goal); P.x = ease(P.x, P.tx); P.z = ease(P.z, P.tz);
    P.g.position.set(P.x, 0, P.z); P.g.scale.setScalar(0.88 + 0.12 * P.k); P.mat.uniforms.uOpacity.value = 0.9 * P.k; P.g.visible = P.k > 0.003;
    if (P.goal === 0 && P.k === 0) { dropPhantom(P); PV.list.splice(i, 1); }
  }
  for (const [g, G] of PV.ghosts) {
    G.k = ease(G.k, G.goal);
    G.mat.opacity = 1 - (1 - PV_FLOOR[G.kind]) * G.k; if (G.kind === 'capture') G.mat.emissiveIntensity = 1.4 * G.k;
    captureRing(G, g, G.kind === 'capture'); if (G.ring) G.ring.material.opacity = 0.85 * G.k;
    if (G.goal === 0 && G.k === 0) ghostRestore(g, G);
  }
}
/* The first preview would compile the transparent variants of the piece programs, and the
   hologram's, mid-hover; one frame drawn on the way into Analyze pays for that up front: a ghost
   copy on one piece of each colour at full opacity (it looks exactly like the frame it replaces),
   and a hologram and a capture ring at no opacity over one of them. The materials drawn are kept for the page's life
   (KEEP), not disposed: in three r147 disposing the last material that uses a program deletes the
   program, and every preview ends by disposing its own ghosts and holograms, so without a keeper
   the next preview would compile them all again. */
/* shared, in app/store.js: app.ghostWarm */
const KEEP = { w: null, b: null, holo: null, ring: null };
export function warmGhostPrograms() {
  if (app.ghostWarm !== 'pending' || PV.list.length || PV.ghosts.size || !piecesGroup.children.length) return;
  app.ghostWarm = 'done';
  const picks = ['w', 'b'].map(c => pieceAt.find(g => g && g.userData.color === c)).filter(Boolean), saved = [];
  if (!KEEP.holo) {
    KEEP.holo = holoMaterial(INK.ivory, INK.cyan, 0.9, 0); KEEP.holo.depthWrite = false; KEEP.holo.name = 'material-phantom-keeper';
    KEEP.ring = new THREE.MeshBasicMaterial({ color: PV_CAPTURE, toneMapped: false, transparent: true, opacity: 0, depthWrite: false }); KEEP.ring.name = 'material-capture-ring-keeper';
  }
  let holo = null, ring = null;
  for (const g of picks) {
    const c = g.userData.color, m = KEEP[c] || (KEEP[c] = ghostMaterialFor(g, 'keeper'));
    m.opacity = 1; m.userData.keep = true;
    g.traverse(o => {
      if (!o.isMesh) return;
      saved.push([o, o.material]); o.material = m;
      if (!holo) {
        holo = new THREE.Mesh(o.geometry, KEEP.holo); holo.name = 'phantom-keeper'; holo.matrixAutoUpdate = false; holo.matrix.copy(o.matrixWorld); holo.frustumCulled = false; phantoms.add(holo);
        ring = new THREE.Mesh(geoOriginRing, KEEP.ring); ring.name = 'phantom-capture-ring-keeper'; ring.rotation.x = -PI / 2; ring.position.set(g.position.x, 0.015, g.position.z); ring.frustumCulled = false; pvMarks.add(ring);
      }
    });
  }
  try { post.render(0); } finally { for (const [o, m0] of saved) o.material = m0; if (holo) { phantoms.remove(holo); pvMarks.remove(ring); } }
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  phantoms = new THREE.Group(); phantoms.name = 'phantoms'; scene.add(phantoms);
  pvMarks = new THREE.Group(); pvMarks.name = 'phantom-capture-rings'; phantoms.add(pvMarks);
}
