/*
✒ Metadata
    - Title: Board And Pieces (MONOLITH Edition - v1.1)
    - File Name: board.js
    - Relative Path: js/scene/board.js
    - Artifact Type: javascript
    - Version: 1.1.2
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.2 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      knight's neck, head, muzzle, ears and mane are blocks with bowed faces
      (block()) within the old boxes' bounds, so the light runs across them.
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: boardGen counts each rebuild of the
      pieces, so a move still animating leaves a new board alone; fragments
      keep their piece's shading, share one fading copy per capture and
      shrink at the same speed at any frame rate; and clearFragments() lives
      here and frees what it clears.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The board and everything on it: squares, highlight markers, coordinate
    labels, the pieces (lathe-turned, with the knight's head and neck
    built of bowed blocks) and the fragments a captured piece shatters into.

✒ Key Features:
    - sqPos(): a square's world position; the board and its squares.
    - HL: the highlight markers (select, legal, capture, last move, check,
      hint, insight).
    - Coordinate labels on all four sides, relabelled when the board turns.
    - Pieces: lathe profiles per kind, buildPiece(), placePieces() and
      pieceAt().
    - block(): the knight's neck, head, muzzle, ears and mane, boxes whose
      faces bow out (a superellipsoid, n = 4) within the same bounds.
    - Fragments: shatter(), stepFragments() and clearFragments() for
      captures.
    - boardGen: counts each rebuild of the pieces.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 5 of 26. Other modules import from it, for
    example:
        import { sqPos, PIECE_NAMES, pieceAt } from '../scene/board.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js, scene/renderer.js,
      scene/materials.js, scene/sets.js, app/state.js and game/ceremony.js;
      globals three.js r147 (THREE, from jsDelivr) and Chess
      (js/core/chess.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { PI, reduceMotion } from '../app/base.js';
import { scene } from './renderer.js';
import { MAT, matCopy } from './materials.js';
import { floorY, mesh } from './sets.js';
import { renderers } from '../app/state.js';
import { clearCeremony } from '../game/ceremony.js';

/* ---------- board ---------- */
export let board; // set in init()
export const sqPos = i => ({ x: (i & 7) - 3.5, z: 3.5 - (i >> 3) });
export const squares = [], highlights = [];
let geoSquare; // set in init()
let geoDot, geoDotHalo, geoRing, geoFill, geoPulse; // set in init()
const hlMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, depthWrite: false });
export let HL; // set in init()
export let pulse; // set in init()
/* frame rails: four real elements, no overlap */
let railLong, railShort; // set in init()
/* rank and file labels on the rails */
function labelTexture(chars, flip, world = 'cathedral') {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const g = c.getContext('2d');
  const mono = world === 'monolith';
  g.fillStyle = mono ? '#7E8898' : '#c9c0d2'; g.font = mono ? '400 27px "Geist Mono", ui-monospace, monospace' : '500 30px Roboto, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  chars.forEach((ch, i) => { const x = flip ? 1024 - (i + 0.5) * 128 : (i + 0.5) * 128; g.fillText(ch, x, 34); });
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (mono) t.encoding = THREE.sRGBEncoding; return t;
}
const files = [...Chess.FILES], ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
const labelMat = tex => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
let geoLabel; // set in init()
export let lblS; // set in init()
export let lblN; // set in init()
export let lblW; // set in init()
export let lblE; // set in init()
export function relabel(world) {
  [[lblS, files, false], [lblN, files, true], [lblW, ranks, false], [lblE, ranks, true]].forEach(([m, chars, flip]) => {
    const old = m.material.map; m.material.map = labelTexture(chars, flip, world); m.material.needsUpdate = true; if (old) old.dispose();
  });
}

/* ---------- pieces ---------- */
function lathe(points, segs = 40) {
  const curve = new THREE.SplineCurve(points.map(p => new THREE.Vector2(p[0], p[1])));
  const pts = curve.getPoints(points.length * 6);
  pts[0].x = 0; pts[pts.length - 1].x = 0;
  for (const p of pts) if (p.x < 0) p.x = 0;
  const g = new THREE.LatheGeometry(pts, segs); g.computeVertexNormals(); return g;
}
/* The knight's neck, head, muzzle, ears and mane (the knight read flat and
   matte beside the rest of the set). They were plain boxes: a flat face mirrors one direction of
   the room, so each face showed one even tone, while every lathe-turned piece curves and carries
   its highlights across itself. Each part is now a block whose faces bow out: a box w × h × d
   drawn on the superellipsoid |x/a|^n + |y/b|^n + |z/c|^n = 1 (a, b, c its half sizes), with the
   surface's own normals, so the shading runs smoothly over faces and edges alike. Its bounding
   box is the box's, so the knight stands as tall and wide as before (the camera's fit and
   PIECE_TOP measure the same); n = 4 keeps the blocky silhouette while no face stays flat. */
function block(w, h, d, n = 4, step = 0.03) {
  // an even count across each side puts a vertex on every face's centre, where the block reaches
  // the box's own extent
  const a = [w / 2, h / 2, d / 2], seg = a.map(v => 2 * Math.max(2, Math.round(v / step)));
  const g = new THREE.BoxGeometry(2, 2, 2, seg[0], seg[1], seg[2]), P = g.attributes.position, N = g.attributes.normal, c = [0, 0, 0];
  for (let i = 0; i < P.count; i++) {
    c[0] = P.getX(i); c[1] = P.getY(i); c[2] = P.getZ(i);
    // pulled in along its ray from the centre onto the surface; a face's centre stays put
    const s = Math.pow(Math.abs(c[0]) ** n + Math.abs(c[1]) ** n + Math.abs(c[2]) ** n, -1 / n);
    P.setXYZ(i, c[0] * s * a[0], c[1] * s * a[1], c[2] * s * a[2]);
    const gx = Math.sign(c[0]) * Math.abs(c[0] * s) ** (n - 1) / a[0], gy = Math.sign(c[1]) * Math.abs(c[1] * s) ** (n - 1) / a[1], gz = Math.sign(c[2]) * Math.abs(c[2] * s) ** (n - 1) / a[2];
    const l = Math.hypot(gx, gy, gz); N.setXYZ(i, gx / l, gy / l, gz / l);
  }
  g.computeBoundingBox(); g.computeBoundingSphere(); return g;
}
const BASE = [[0, 0], [0.33, 0], [0.34, 0.05], [0.31, 0.09], [0.24, 0.13]];
const PROFILES = {
  p: BASE.concat([[0.18, 0.3], [0.16, 0.42], [0.21, 0.46], [0.15, 0.5], [0.2, 0.57], [0.22, 0.66], [0.16, 0.76], [0.07, 0.8], [0, 0.81]]),
  r: BASE.concat([[0.22, 0.17], [0.2, 0.6], [0.27, 0.65], [0.27, 0.84], [0.19, 0.86], [0.19, 0.84], [0, 0.84]]),
  b: BASE.concat([[0.2, 0.16], [0.15, 0.45], [0.14, 0.62], [0.2, 0.67], [0.13, 0.71], [0.2, 0.8], [0.17, 0.96], [0.07, 1.06], [0, 1.08]]),
  q: BASE.concat([[0.23, 0.17], [0.17, 0.5], [0.15, 0.82], [0.22, 0.9], [0.14, 0.95], [0.25, 1.1], [0.21, 1.24], [0.12, 1.3], [0, 1.31]]),
  k: BASE.concat([[0.24, 0.17], [0.18, 0.55], [0.15, 0.9], [0.23, 0.98], [0.15, 1.03], [0.25, 1.2], [0.22, 1.34], [0.1, 1.4], [0, 1.41]]),
  nBase: BASE.concat([[0.22, 0.17], [0.2, 0.3], [0.21, 0.36], [0, 0.36]])
};
export const GEO = {};
export const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
export const yawFor = c => c === 'w' ? PI : 0;

export function buildPiece(type, color, id, mats = null) {
  const mat = mats ? mats[color] : color === 'w' ? MAT.marble : MAT.obsidian;
  const g = new THREE.Group(); g.name = id; g.rotation.y = yawFor(color);
  const body = new THREE.Group(); body.name = `${id}-body`; g.add(body);
  const part = (suffix, geo) => mesh(`${id}-${suffix}`, geo, mat, body, true, true);
  if (type === 'n') {
    part('base', GEO.nBase);
    const neck = part('neck', GEO.neck); neck.position.set(0, 0.6, -0.02); neck.rotation.x = -0.32;
    const head = part('head', GEO.head); head.position.set(0, 0.86, 0.1); head.rotation.x = 0.18;
    const muz = part('muzzle', GEO.muzzle); muz.position.set(0, 0.76, 0.36); muz.rotation.x = 0.3;
    const e1 = part('ear-01', GEO.ear); e1.position.set(-0.07, 1.03, -0.02); e1.rotation.x = -0.3;
    const e2 = part('ear-02', GEO.ear); e2.position.set(0.07, 1.03, -0.02); e2.rotation.x = -0.3;
    const mane = part('mane', GEO.mane); mane.position.set(0, 0.6, -0.2); mane.rotation.x = -0.32;
  } else {
    part('body', GEO[type]);
    if (type === 'r') for (let i = 0; i < 6; i++) { const m = part(`merlon-${String(i + 1).padStart(2, '0')}`, GEO.merlon); const a = i * PI / 3; m.position.set(Math.cos(a) * 0.21, 0.91, Math.sin(a) * 0.21); m.rotation.y = -a; }
    if (type === 'b') part('finial', GEO.finial).position.y = 1.12;
    if (type === 'q') { for (let i = 0; i < 6; i++) { const m = part(`pearl-${String(i + 1).padStart(2, '0')}`, GEO.pearl); const a = i * PI / 3; m.position.set(Math.cos(a) * 0.19, 1.29, Math.sin(a) * 0.19); } part('finial', GEO.finial).position.y = 1.38; }
    if (type === 'k') { part('cross-upright', GEO.crossV).position.y = 1.55; part('cross-arm', GEO.crossH).position.y = 1.6; }
  }
  g.userData = { type, color, body, phase: Math.random() * 20, anim: false };
  return g;
}

export let piecesGroup; // set in init()
export let pieceAt = new Array(64).fill(null);
function clearPieces() { for (const g of pieceAt) if (g) piecesGroup.remove(g); pieceAt.fill(null); }
/* Counts each rebuild of the pieces, so a move still animating can tell that the board under it
   was replaced (a new game, the Crucible's board) and leave the new one alone. */
export let boardGen = 0;
export function placePieces(state) {
  boardGen++;
  if (typeof clearCeremony === 'function' && renderers.length) clearCeremony();
  clearPieces(); const counts = { w: {}, b: {} };
  for (let i = 0; i < 64; i++) {
    const p = state.board[i]; if (!p) continue;
    counts[p.c][p.t] = (counts[p.c][p.t] || 0) + 1;
    const id = `piece-${p.c === 'w' ? 'marble' : 'obsidian'}-${PIECE_NAMES[p.t]}-${String(counts[p.c][p.t]).padStart(2, '0')}`;
    const g = buildPiece(p.t, p.c, id); const { x, z } = sqPos(i); g.position.set(x, 0, z); piecesGroup.add(g); pieceAt[i] = g;
  }
}

/* ---------- fragments (shatter) ---------- */
export const fragments = [];
let fragGeos; // set in init()
export let fragMats; // set in init()
export let fragGroup; // set in init()
export function shatter(g) {
  const box = new THREE.Box3().setFromObject(g); const c = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3());
  // one shatter's fragments share their timing, so they share the one copy they fade out with (S)
  const n = reduceMotion ? 10 : 22, mat = fragMats[g.userData.color], S = { n, fade: null };
  for (let i = 0; i < n; i++) {
    const f = new THREE.Mesh(fragGeos[i % fragGeos.length], mat); f.name = `fragment-${String(fragments.length + 1).padStart(3, '0')}`;
    const h = Math.random() * size.y, r = Math.random() * (0.08 + 0.22 * (1 - h / size.y)), a = Math.random() * PI * 2;
    f.position.set(g.position.x + Math.cos(a) * r, h + 0.03, g.position.z + Math.sin(a) * r);
    f.scale.setScalar(0.7 + Math.random() * 0.9); f.castShadow = true;
    const dir = new THREE.Vector3(f.position.x - g.position.x, 0, f.position.z - g.position.z).normalize();
    f.userData = {
      v: new THREE.Vector3(dir.x * (1 + Math.random() * 2.2), 1.5 + Math.random() * 3, dir.z * (1 + Math.random() * 2.2)),
      w: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14),
      t: 0, bounced: 0, S
    };
    fragGroup.add(f); fragments.push(f);
  }
  piecesGroup.remove(g);
}
function dropFade(S) { if (S.fade) { S.fade.dispose(); S.fade = null; } }
/* Removes every fragment at once (a new game, an undo), with the copies they faded with. */
export function clearFragments() { for (const f of fragments) { fragGroup.remove(f); dropFade(f.userData.S); } fragments.length = 0; }
export function stepFragments(dt) {
  for (let i = fragments.length - 1; i >= 0; i--) {
    const f = fragments[i], u = f.userData; u.t += dt;
    u.v.y -= 9.8 * dt; f.position.addScaledVector(u.v, dt);
    f.rotation.x += u.w.x * dt; f.rotation.y += u.w.y * dt; f.rotation.z += u.w.z * dt;
    const onBoard = Math.abs(f.position.x) < 4.7 && Math.abs(f.position.z) < 4.7, groundY = onBoard ? 0.04 : floorY + 0.04;
    if (f.position.y < groundY && u.v.y < 0) { f.position.y = groundY; u.v.y *= -0.35; u.v.x *= 0.6; u.v.z *= 0.6; u.w.multiplyScalar(0.5); u.bounced++; }
    // shrinking by 1.5% a frame at 60 frames a second, at any frame rate
    if (u.t > 1.1) { const k = Math.max(0, 1 - (u.t - 1.1) / 0.6); f.scale.setScalar(f.scale.x * Math.pow(0.985, dt * 60)); f.material = u.S.fade || (u.S.fade = matCopy(f.material)); f.material.opacity = k; }
    if (u.t > 1.75) { fragGroup.remove(f); fragments.splice(i, 1); if (--u.S.n === 0) dropFade(u.S); }
  }
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  board = new THREE.Group(); board.name = 'board'; scene.add(board);
  geoSquare = new THREE.BoxGeometry(1, 0.1, 1);
  geoDot = new THREE.CircleGeometry(0.17, 28); geoDotHalo = new THREE.RingGeometry(0.17, 0.24, 28); geoRing = new THREE.RingGeometry(0.32, 0.46, 40); geoFill = new THREE.PlaneGeometry(0.98, 0.98); geoPulse = new THREE.RingGeometry(0.38, 0.5, 40);
  HL = { select: hlMat(0xf0c96a), legal: hlMat(0xffd77a), halo: hlMat(0x120e14), capture: hlMat(0xff6a58), last: hlMat(0xe3bf72), check: hlMat(0xff5a4a), hint: hlMat(0x9bb6dc), hintRing: hlMat(0xa9c4ea), pulse: hlMat(0xffe2a0) };
  HL.hint.opacity = 0.4; HL.hintRing.opacity = 0.95; HL.halo.opacity = 0.55;
  HL.last.opacity = 0.28; HL.legal.opacity = 1; HL.select.opacity = 0.55; HL.check.opacity = 0.45; HL.capture.opacity = 1;
  HL.insight = hlMat(0x5f8fe8); HL.insight.opacity = 0.5;   // Position: squares a value in the board reading points at
  pulse = new THREE.Mesh(geoPulse, HL.pulse); pulse.name = 'highlight-pulse'; pulse.rotation.x = -PI / 2; pulse.visible = false; board.add(pulse);
  for (let i = 0; i < 64; i++) {
    const { x, z } = sqPos(i), nm = Chess.sqName(i);
    const sq = mesh(`square-${nm}`, geoSquare, ((i & 7) + (i >> 3)) % 2 ? MAT.sqLight : MAT.sqDark, board, false, true);
    sq.position.set(x, -0.05, z); sq.userData.sq = i; squares.push(sq);
    const fill = mesh(`highlight-fill-${nm}`, geoFill, HL.select, board); fill.rotation.x = -PI / 2; fill.position.set(x, 0.006, z); fill.visible = false;
    const dotGroup = new THREE.Group(); dotGroup.name = `highlight-dot-${nm}`; dotGroup.position.set(x, 0.012, z); dotGroup.rotation.x = -PI / 2; dotGroup.visible = false; board.add(dotGroup);
    mesh(`highlight-dot-${nm}-halo`, geoDotHalo, HL.halo, dotGroup);
    mesh(`highlight-dot-${nm}-core`, geoDot, HL.legal, dotGroup).position.z = 0.001;
    const ring = mesh(`highlight-ring-${nm}`, geoRing, HL.capture, board); ring.rotation.x = -PI / 2; ring.position.set(x, 0.012, z); ring.visible = false;
    highlights.push({ fill, dot: dotGroup, ring });
  }
  railLong = new THREE.BoxGeometry(8.7, 0.1, 0.35); railShort = new THREE.BoxGeometry(0.35, 0.1, 8);
  mesh('frame-rail-south', railLong, MAT.frame, board, false, true).position.set(0, -0.054, 4.175);
  mesh('frame-rail-north', railLong, MAT.frame, board, false, true).position.set(0, -0.054, -4.175);
  mesh('frame-rail-west', railShort, MAT.frame, board, false, true).position.set(-4.175, -0.054, 0);
  mesh('frame-rail-east', railShort, MAT.frame, board, false, true).position.set(4.175, -0.054, 0);
  geoLabel = new THREE.PlaneGeometry(8, 0.5);
  lblS = mesh('label-files-south', geoLabel, labelMat(labelTexture(files, false)), board); lblS.rotation.x = -PI / 2; lblS.position.set(0, 0.002, 4.175);
  lblN = mesh('label-files-north', geoLabel, labelMat(labelTexture(files, true)), board); lblN.rotation.set(-PI / 2, 0, PI); lblN.position.set(0, 0.002, -4.175);
  lblW = mesh('label-ranks-west', geoLabel, labelMat(labelTexture(ranks, false)), board); lblW.rotation.set(-PI / 2, 0, PI / 2); lblW.position.set(-4.175, 0.002, 0);
  lblE = mesh('label-ranks-east', geoLabel, labelMat(labelTexture(ranks, true)), board); lblE.rotation.set(-PI / 2, 0, -PI / 2); lblE.position.set(4.175, 0.002, 0);
  // ---------- pieces
  for (const k in PROFILES) GEO[k] = lathe(PROFILES[k]);
  GEO.merlon = new THREE.BoxGeometry(0.11, 0.14, 0.11);
  GEO.pearl = new THREE.SphereGeometry(0.05, 10, 10);
  GEO.finial = new THREE.SphereGeometry(0.07, 12, 12);
  GEO.crossV = new THREE.BoxGeometry(0.06, 0.3, 0.06); GEO.crossH = new THREE.BoxGeometry(0.2, 0.06, 0.06);
  GEO.neck = block(0.26, 0.52, 0.22); GEO.head = block(0.24, 0.24, 0.46);
  GEO.muzzle = block(0.18, 0.14, 0.16); GEO.ear = block(0.06, 0.14, 0.07); GEO.mane = block(0.08, 0.5, 0.14);
  piecesGroup = new THREE.Group(); piecesGroup.name = 'pieces'; scene.add(piecesGroup);
  // ---------- fragments (shatter)
  fragGeos = [new THREE.TetrahedronGeometry(0.09), new THREE.TetrahedronGeometry(0.06), new THREE.BoxGeometry(0.1, 0.07, 0.08), new THREE.DodecahedronGeometry(0.07)];
  fragMats = { w: matCopy(MAT.marble), b: matCopy(MAT.obsidian) };
  fragMats.w.transparent = fragMats.b.transparent = true;
  fragGroup = new THREE.Group(); fragGroup.name = 'fragments'; scene.add(fragGroup);
}
