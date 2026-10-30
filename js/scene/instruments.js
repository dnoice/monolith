/*
✒ Metadata
    - Title: MONOLITH Instruments (MONOLITH Edition - v1.0)
    - File Name: instruments.js
    - Relative Path: js/scene/instruments.js
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
      release audit Dennis asked for: the X-Ray ring is glass by its surface
      (a clear coat and sharp reflections) rather than by transmission,
      which made three.js draw the whole scene a second time every frame
      while the X-Ray showed.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The instrument's 3D layers on the board: the sub-surface move-value
    field, the ballistic vectors of the candidate moves, and the Tactical
    X-Ray ring over a square. Colour is semantic (INK): cyan optimal, amber
    volatile, crimson refutation.

✒ Key Features:
    - INK: the solved stops as colours.
    - The field: a texture of move values under the squares, eased toward
      each new search (setField, stepField).
    - Vectors: arcs from piece to target per candidate, with origin rings
      and markers (setVectors, stepVectors).
    - The X-Ray: a glass ring with a delta arc, a track, a head, ticks,
      beads and threads (setXray, stepXray, xrState).

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 6 of 26. Other modules import from it, for
    example:
        import { INK, setVectors, setXray } from '../scene/instruments.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/sets.js, scene/board.js and scene/motion.js; globals three.js
      r147 (THREE, from jsDelivr) and Chess (js/core/chess.js).
    - Shared state (js/app/store.js): reads only app.orient.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { PI } from '../app/base.js';
import { lin, scene } from './renderer.js';
import { mesh } from './sets.js';
import { sqPos } from './board.js';
import { easeOut, tween } from './motion.js';

/* ---------- MONOLITH instruments (3D layers) ----------
   Field: a ray-marched sub-surface glow. Each fragment of a plane on the board marches ten
   samples down into a thin virtual slab along the view ray, so a lit square glows from beneath
   the surface and shifts with parallax as the camera orbits. The ceiling is 22 % at a square's
   centre in the plate's sRGB terms; blending here is linear, where the same look is about 8 %
   coverage, and the ray-march spreads it at oblique angles, so the shader scales by FIELD_LINEAR
   (about 10 % straight on).
   Vectors: ballistic tube arcs for the engine lines' first moves, each the jump the piece would
   make (crown to target, or onto the crown of the piece it takes), tapered at launch, with a
   pulse travelling along it and a launch ring on the board; line 1 is cyan and bright enough to
   bloom, lines 2–5 are steel.
   X-Ray: a transmissive glass torus lying on the board inside a square, with the expected-score
   delta as a crimson arc, and threads from each attacker (steel) and defender (slate).
   Phantoms: a scrubbed line's projected position as a difference from the board: holograms
   where pieces land, faint ghosts where they leave, crimson ghosts for captures (see below). */
export const INK = { cyan: 0x2cc8d8, amber: 0xe8a93a, crimson: 0xed7f83, ink: 0xe3e7ee, ink2: 0xa4acb9, ink3: 0x7e8898, steel: 0xabb5c3, slate: 0x556275, ivory: 0xece8ef, obsidian: 0x0f1318, canvas: 0x0b0d10 };
const FIELD_LINEAR = 0.45;
export let instruments; // set in init()
const fieldBuf = new Uint8Array(64 * 4), fieldNow = new Float32Array(64), fieldGoal = new Float32Array(64);
let fieldTex; // set in init()
let fieldMat; // set in init()
let fieldPlane; // set in init()
let fieldLight; // set in init()
let fieldBest = -1;
export function setField(bright, best) {
  for (let i = 0; i < 64; i++) fieldGoal[i] = bright ? bright[i] : 0;
  fieldBest = best === undefined ? -1 : best;
}
export function stepField(dt, on) {
  const k = Math.min(1, dt * 5); let dirty = false;
  for (let i = 0; i < 64; i++) {
    const v = fieldNow[i] + (fieldGoal[i] - fieldNow[i]) * k;
    if (Math.abs(v - fieldNow[i]) > 1e-4 || (fieldNow[i] !== fieldGoal[i] && Math.abs(v - fieldGoal[i]) < 1e-4)) { fieldNow[i] = Math.abs(v - fieldGoal[i]) < 1e-4 ? fieldGoal[i] : v; dirty = true; }
  }
  if (dirty) { for (let i = 0; i < 64; i++) fieldBuf[i * 4] = Math.round(fieldNow[i] * 255); fieldTex.needsUpdate = true; }
  const u = fieldMat.uniforms.uOn; u.value += ((on ? 1 : 0) - u.value) * Math.min(1, dt * 4);
  fieldPlane.visible = u.value > 0.002;
  if (fieldBest >= 0) { const { x, z } = sqPos(fieldBest); fieldLight.position.set(x, 0.55, z); }
  fieldLight.intensity = fieldBest >= 0 ? 0.9 * u.value * fieldNow[fieldBest] : 0;
}

/* ballistic vectors */
export let vectorsGroup; // set in init()
const vecClock = { value: 0 };
let vectorKey = '';
/* Shader hygiene: GLSL leaves pow(x, y) undefined for x < 0, and ANGLE's Direct3D back end
   (Chrome and Edge on Windows) returns NaN there. 1 − |n·v| dips a hair below zero where a
   surface faces the camera, and those NaN pixels showed as black specks along the tubes and
   phantoms, smeared further by bloom. Bases are clamped and squares written as x * x. */
function tubeMaterial(color, glow, opacity, speed, radius) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: lin(color) }, uTime: vecClock, uGlow: { value: glow }, uOpacity: { value: opacity }, uGrow: { value: 0 }, uSpeed: { value: speed }, uRadius: { value: radius } },
    vertexShader: `uniform float uRadius; varying float vU; varying float vF;
      void main() {
        vU = uv.x;
        // TubeGeometry places each vertex at curve(u) + normal * radius, so pulling it back along
        // the normal tapers the tube: 30 % of its radius at launch, full width by u = 0.28.
        float taper = mix(0.3, 1.0, smoothstep(0.0, 0.28, uv.x));
        vec4 w = modelMatrix * vec4(position - normal * uRadius * (1.0 - taper), 1.0);
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vF = clamp(1.0 - abs(dot(n, normalize(cameraPosition - w.xyz))), 0.0, 1.0);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `uniform vec3 uColor; uniform float uTime, uGlow, uOpacity, uGrow, uSpeed;
      varying float vU; varying float vF;
      void main() {
        if (vU > uGrow) discard;
        float head = fract(uTime * uSpeed);
        float d0 = (vU - head) * 9.0, d1 = (vU - head + 1.0) * 9.0;
        float pulse = exp(-d0 * d0) + exp(-d1 * d1);
        float edge = pow(clamp(vF, 0.0, 1.0), 1.6);
        float launch = smoothstep(0.0, 0.12, vU);
        gl_FragColor = vec4(uColor * (0.8 + 0.5 * edge) * (1.0 + uGlow * pulse), uOpacity * (0.78 + 0.22 * edge) * launch);
        #include <encodings_fragment>
      }`,
    transparent: true, depthWrite: false, toneMapped: false
  });
}
/* Crown heights of the piece meshes in buildPiece (top of the cross, finial, merlons, ears). */
export const PIECE_TOP = { p: 0.81, n: 1.1, b: 1.19, r: 0.98, q: 1.45, k: 1.7 };
/* A vector is the jump the piece would make: it leaves just above the mover's crown, rises,
   and drops steeply onto the target square, or onto the crown of the piece it takes. Starting
   at the board inside the piece made every arc spill out of the piece's waist. */
function arcCurve(from, to, lift = 0, st = null, landOn = null) {
  const a = sqPos(from), b = sqPos(to), len = Math.max(1e-3, Math.hypot(b.x - a.x, b.z - a.z));
  const ux = (b.x - a.x) / len, uz = (b.z - a.z) / len;
  // landOn: the piece type standing on the target once the move is made (a move already played)
  const mover = st && st.board[from], victim = landOn ? { t: landOn } : st && st.board[to];
  const y0 = (mover ? PIECE_TOP[mover.t] : 0.85) + 0.1, y1 = victim ? PIECE_TOP[victim.t] + 0.08 : 0.06;
  const top = Math.max(y0, y1) + 0.34 + 0.11 * len + lift;
  return new THREE.CubicBezierCurve3(
    new THREE.Vector3(a.x + ux * 0.06, y0, a.z + uz * 0.06),
    new THREE.Vector3(a.x + ux * len * 0.22, top, a.z + uz * len * 0.22),
    new THREE.Vector3(b.x - ux * len * 0.16, top, b.z - uz * len * 0.16),
    new THREE.Vector3(b.x, y1, b.z));
}
/* The first part of a curve, so the tube stops where the arrowhead's base begins. */
class TrimmedCurve extends THREE.Curve {
  constructor(curve, tEnd) { super(); this.curve = curve; this.tEnd = tEnd; }
  getPoint(t, target = new THREE.Vector3()) { return this.curve.getPoint(t * this.tEnd, target); }
}
export let geoOriginRing; // set in init()
const markerCache = new Map();
function markerTexture(text, fg, bg, border) {
  const key = [text, fg, bg, border].join('|'); if (markerCache.has(key)) return markerCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = bg; g.strokeStyle = border; g.lineWidth = 4;
  g.beginPath(); g.roundRect ? g.roundRect(6, 6, 52, 52, 6) : g.rect(6, 6, 52, 52); g.fill(); if (border !== bg) g.stroke();
  g.fillStyle = fg; g.font = '600 34px Geist, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 32, 34);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; markerCache.set(key, t); return t;
}
function makeReticle(color, name) {
  const g = new THREE.Group(); g.name = name;
  const mat = new THREE.MeshBasicMaterial({ color: lin(color), toneMapped: false, transparent: true, opacity: 0.95, depthWrite: false });
  const L = 0.2, T = 0.034, H = 0.47;
  for (const [sx, sz, n] of [[1, -1, 'ne'], [1, 1, 'se'], [-1, 1, 'sw'], [-1, -1, 'nw']]) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(L, T), mat); a.name = `${name}-corner-${n}-h`; a.rotation.x = -PI / 2; a.position.set(sx * (H - L / 2), 0, sz * H);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(T, L), mat); b.name = `${name}-corner-${n}-v`; b.rotation.x = -PI / 2; b.position.set(sx * H, 0, sz * (H - L / 2));
    g.add(a, b);
  }
  g.userData.mat = mat; return g;
}
function disposeTree(o) { o.traverse(x => { if (x.geometry && !x.userData.keepGeometry) x.geometry.dispose(); if (x.material && !x.material.userData.keep) x.material.dispose(); }); }
/* list: [{ from, to, color, glow, opacity, radius, label, reticle, name, landOn }], drawn in order (the
   best line last, so it sits on top); st is the position the moves start from, which sets the
   launch and landing heights. Rebuilt only when it changes. */
export function setVectors(list, st = null) {
  const key = JSON.stringify(list.map(v => [v.from, v.to, v.color, v.label, v.reticle])) + (st ? '|' + Chess.fen(st) : '');
  if (key === vectorKey) return; vectorKey = key;
  for (const c of [...vectorsGroup.children]) { disposeTree(c); vectorsGroup.remove(c); }
  const origins = new Map();   // origin square → the best-ranked vector leaving it (later entries rank higher)
  list.forEach((v, i) => {
    origins.set(v.from, v);
    const g = new THREE.Group(); g.name = v.name || `vector-${String(i + 1).padStart(2, '0')}`;
    const curve = arcCurve(v.from, v.to, (list.length - i) * 0.03, st, v.landOn);
    const tipH = v.radius * 6, tipR = v.radius * 2.6, len = curve.getLength();
    const tEnd = curve.getUtoTmapping(Math.max(0.5, 1 - tipH / len));
    const mat = tubeMaterial(v.color, v.glow, v.opacity, 0.55 + 0.05 * i, v.radius);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new TrimmedCurve(curve, tEnd), 96, v.radius, 12, false), mat); tube.name = `${g.name}-tube`; tube.renderOrder = 5;
    const tipMat = new THREE.MeshBasicMaterial({ color: lin(v.color), toneMapped: false, transparent: true, opacity: v.opacity, depthWrite: false });
    // the arrowhead's base meets the end of the tube and its point touches the landing point
    const end = curve.getPoint(1), dir = end.clone().sub(curve.getPoint(tEnd)).normalize();
    const tip = new THREE.Mesh(new THREE.ConeGeometry(tipR, tipH, 20), tipMat); tip.name = `${g.name}-tip`; tip.renderOrder = 5;
    tip.position.copy(end).addScaledVector(dir, -tipH / 2); tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); tip.visible = false;
    g.add(tube, tip);
    if (v.label) {
      const top = v.color === INK.cyan, b = sqPos(v.to), victim = v.landOn ? { t: v.landOn } : st && st.board[v.to];
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture(v.label, top ? '#0B0D10' : '#E3E7EE', top ? '#2CC8D8' : '#14181F', top ? '#2CC8D8' : '#ABB5C3'), toneMapped: false, depthWrite: false, transparent: true }));
      sp.name = `${g.name}-marker`; sp.position.set(b.x + 0.36, victim ? PIECE_TOP[victim.t] + 0.16 : 0.34, b.z - 0.36); sp.scale.setScalar(0.27); sp.renderOrder = 6; sp.material.userData.keep = false; g.add(sp);
    }
    if (v.reticle) { const r = makeReticle(v.color, `${g.name}-reticle`); const b = sqPos(v.to); r.position.set(b.x, 0.016, b.z); r.renderOrder = 5; g.add(r); g.userData.reticle = r; }
    vectorsGroup.add(g);
    tween(0.5, e => { mat.uniforms.uGrow.value = e; tip.visible = e > 0.97; }, easeOut);
  });
  // one launch ring per origin square, in the colour of the best line that leaves it
  if (origins.size) {
    const og = new THREE.Group(); og.name = 'vector-origins';
    [...origins.values()].forEach((v, i) => {
      const ring = new THREE.Mesh(geoOriginRing, new THREE.MeshBasicMaterial({ color: lin(v.color), toneMapped: false, transparent: true, opacity: v.color === INK.steel ? 0.5 : 0.85, depthWrite: false }));
      ring.name = `vector-origin-${Chess.sqName(v.from)}`; ring.rotation.x = -PI / 2; const a = sqPos(v.from); ring.position.set(a.x, 0.014, a.z); ring.renderOrder = 5;
      ring.userData.keepGeometry = true; og.add(ring);
    });
    vectorsGroup.add(og);
  }
}
export function stepVectors(t) {
  vecClock.value = t;
  for (const g of vectorsGroup.children) if (g.userData.reticle) g.userData.reticle.scale.setScalar(1 + 0.03 * Math.sin(t * 2.4));
}

/* Tactical X-Ray */
let xray; // set in init()
let xrayGlass; // set in init()
/* The ring lies on the board around the base of the piece, inside its square (radius 0.43 of a
   square's 0.5). It used to float at mid-piece height and 0.66 wide: under perspective a ring
   that high drifts off its square the farther the square is from the view's centre, and that
   wide it covered the neighbours (Dennis, 10/15/2026). */
const XR_R = 0.43;
let xrRing; // set in init()
// the state rim, just outside the gauge: steel and faint when calm, amber when pressed, crimson
// and breathing when a piece on the square hangs (see stepXray)
let xrRim; // set in init()
/* The ring is a gauge (Dennis, 10/22/2026: the red arc should be more prominent and say more).
   Read it like a dial seen from your side of the board, starting at the top and running
   clockwise:
     - the arc is the expected score the best move onto this square gives up against the best
       move overall, on a faint full-circle track with quarter ticks; its colour is the verdict:
       cyan when the best move lands here (then it is a full circle), ivory within 5 %, amber to
       15 %, crimson beyond; a bright bead marks its end;
     - beads sit on the ring in the direction of every piece bearing on the square: solid ivory
       for White's pieces, hollow steel rings for Black's (obsidian edged in steel), each joined
       to its piece by a thread of the same colour;
     - a rim just outside carries the square's state: crimson and breathing when a piece there
       hangs (attacked, undefended), amber when it is outnumbered or attacked by something
       cheaper, faint steel otherwise. Everything stays inside the square. */
let xrArcMat; // set in init()
let xrArc; // set in init()
let xrTrackMat; // set in init()
let xrTrack; // set in init()
let xrHeadMat; // set in init()
let xrHead; // set in init()
let xrTicks; // set in init()
let xrTickMat; // set in init()
let xrBeads; // set in init()
let geoBeadW, geoBeadB; // set in init()
let xrThreads; // set in init()
let XR_SIDE; // set in init()
const XR_SEV = { best: INK.cyan, near: INK.ivory, slip: INK.amber, loss: INK.crimson, none: INK.steel };
const XR_STATE = { hanging: INK.crimson, pressed: INK.amber, calm: INK.steel, best: INK.cyan };
export const xrState = { sq: -1, arc: 0, goal: 0, key: '', state: 'calm' };
const xrArcColor = new THREE.Color(), xrRimColor = new THREE.Color();
export function setXray(sq, x) {
  const on = sq >= 0;
  xray.visible = on; xrThreads.visible = on;
  if (!on) { xrState.sq = -1; return; }
  xrState.goal = x.arc; xrState.state = x.state;
  xrArcColor.copy(lin(XR_SEV[x.sev])); xrRimColor.copy(lin(XR_STATE[x.state]));
  xrArcMat.uniforms.uColor.value.copy(xrArcColor); xrHeadMat.color.copy(xrArcColor);
  const key = [sq, x.pieces.map(p => p.sq + p.c).join(','), app.orient].join('|');
  if (key === xrState.key) return;
  const fresh = xrState.sq !== sq; xrState.key = key; xrState.sq = sq;
  const { x: px, z: pz } = sqPos(sq); xray.position.set(px, 0.04, pz); xray.rotation.y = app.orient === 'b' ? PI : 0;
  if (fresh) { xrState.arc = 0; xray.scale.setScalar(0.86); tween(0.32, e => xray.scale.setScalar(0.86 + 0.14 * e), easeOut); }
  for (const c of [...xrThreads.children]) { c.geometry.dispose(); xrThreads.remove(c); }
  for (const c of [...xrBeads.children]) xrBeads.remove(c);
  const flip = app.orient === 'b' ? -1 : 1, count = { w: 0, b: 0 };
  for (const p of x.pieces) {
    const a = sqPos(p.sq), dx = a.x - px, dz = a.z - pz, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    const n = String(++count[p.c]).padStart(2, '0'), side = p.c === 'w' ? 'white' : 'black';
    const bead = new THREE.Mesh(p.c === 'w' ? geoBeadW : geoBeadB, XR_SIDE[p.c]); bead.name = `xray-bead-${side}-${n}`; bead.renderOrder = 5;
    bead.position.set(ux * XR_R * flip, 0.05, uz * XR_R * flip); if (p.c === 'b') bead.rotation.x = -PI / 2; xrBeads.add(bead);
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(a.x, 0.05, a.z), new THREE.Vector3(px + ux * XR_R, 0.05, pz + uz * XR_R)), 1, 0.011, 6, false), XR_SIDE[p.c]);
    m.name = `xray-thread-${side}-${n}`; m.renderOrder = 4; xrThreads.add(m);
  }
}
export function stepXray(dt, t) {
  if (!xray.visible) return;
  xrState.arc += (xrState.goal - xrState.arc) * Math.min(1, dt * 5);
  const arc = xrState.arc; xrArcMat.uniforms.uArc.value = arc; xrArc.visible = arc > 0.003; xrHead.visible = arc > 0.003 && arc < 0.997;
  const a = PI / 2 - arc * 2 * PI; xrHead.position.set(Math.cos(a) * XR_R, 0.04, -Math.sin(a) * XR_R);
  // the rim: steady for most states, breathing crimson when a piece hangs
  const k = xrState.state === 'hanging' ? 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 4.2)) : xrState.state === 'calm' ? 0.3 : 0.9;
  xrRim.material.color.copy(xrRimColor); xrRim.material.opacity = k;
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  instruments = new THREE.Group(); instruments.name = 'instruments'; scene.add(instruments);
  fieldTex = new THREE.DataTexture(fieldBuf, 8, 8, THREE.RGBAFormat);
  fieldTex.magFilter = fieldTex.minFilter = THREE.NearestFilter; fieldTex.needsUpdate = true;
  fieldMat = new THREE.ShaderMaterial({
    uniforms: { tField: { value: fieldTex }, uColor: { value: lin(INK.cyan) }, uCeil: { value: 0.22 * FIELD_LINEAR }, uOn: { value: 0 }, uSlab: { value: 0.16 } },
    vertexShader: `varying vec3 vW;
    void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D tField; uniform vec3 uColor; uniform float uCeil, uOn, uSlab;
    varying vec3 vW;
    float glowAt(vec2 bp) {
      if (bp.x < 0.0 || bp.y < 0.0 || bp.x >= 8.0 || bp.y >= 8.0) return 0.0;
      vec2 cell = floor(bp);
      float b = texture2D(tField, (cell + 0.5) / 8.0).r;
      return b * (1.0 - smoothstep(0.06, 0.62, length(fract(bp) - 0.5)));
    }
    void main() {
      vec3 V = normalize(vW - cameraPosition);
      float vy = max(0.25, -V.y), acc = 0.0, wsum = 0.0;
      for (int i = 0; i < 10; i++) {
        float f = (float(i) + 0.5) / 10.0;
        vec3 p = vW + V * (f * uSlab / vy);
        float w = exp(-2.4 * f);
        acc += glowAt(vec2(p.x + 4.0, 4.0 - p.z)) * w; wsum += w;
      }
      float a = uCeil * uOn * acc / wsum;
      if (a < 0.001) discard;
      gl_FragColor = vec4(uColor, a);
      #include <encodings_fragment>
    }`,
    transparent: true, depthWrite: false, toneMapped: false
  });
  fieldPlane = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), fieldMat);
  fieldPlane.name = 'field-subsurface'; fieldPlane.rotation.x = -PI / 2; fieldPlane.position.y = 0.004; fieldPlane.renderOrder = -1; instruments.add(fieldPlane);
  fieldLight = new THREE.PointLight(lin(INK.cyan), 0, 2.6, 2); fieldLight.name = 'light-field-best'; fieldLight.position.set(0, 0.5, 0); scene.add(fieldLight);
  vectorsGroup = new THREE.Group(); vectorsGroup.name = 'vectors'; instruments.add(vectorsGroup);
  geoOriginRing = new THREE.RingGeometry(0.4, 0.435, 56);
  xray = new THREE.Group(); xray.name = 'xray'; xray.visible = false; instruments.add(xray);
  /* Glass by its surface, not by transmission: in three r147 any visible transmissive material makes
     every render draw the opaque scene a second time into a full-size multisampled target (twice
     with reflections on, the mirror's render too), and compiles a second program for each lit
     material the first time it shows. A clear, mostly transparent coat with sharp reflections of
     the environment reads as the same glass ring at none of that cost. */
  xrayGlass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.8, transparent: true, opacity: 0.3, depthWrite: false });
  xrayGlass.name = 'material-xray-glass';
  xrRing = mesh('xray-ring-glass', new THREE.TorusGeometry(XR_R, 0.034, 24, 128), xrayGlass, xray); xrRing.rotation.x = -PI / 2;
  xrRim = mesh('xray-ring-state-rim', new THREE.TorusGeometry(XR_R + 0.056, 0.01, 8, 128), new THREE.MeshBasicMaterial({ color: lin(INK.steel), toneMapped: false, transparent: true, opacity: 0.3, depthWrite: false }), xray);
  xrRim.rotation.x = -PI / 2; xrRim.position.y = 0.034;
  xrArcMat = new THREE.ShaderMaterial({
    uniforms: { uArc: { value: 0 }, uColor: { value: lin(INK.crimson) } },
    vertexShader: `varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uArc; uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float a = 1.0 - vUv.x;                       // 0 at the top, growing clockwise
      if (a > uArc) discard;
      float head = smoothstep(max(0.0, uArc - 0.06), uArc, a);
      gl_FragColor = vec4(uColor * (1.35 + 1.1 * head), 1.0);
      #include <encodings_fragment>
    }`,
    toneMapped: false
  });
  xrArc = mesh('xray-ring-delta-arc', new THREE.TorusGeometry(XR_R, 0.022, 12, 192), xrArcMat, xray); xrArc.rotation.set(-PI / 2, 0, PI / 2); xrArc.position.y = 0.038;
  xrTrackMat = new THREE.MeshBasicMaterial({ color: lin(INK.steel), toneMapped: false, transparent: true, opacity: 0.28, depthWrite: false });
  xrTrack = mesh('xray-ring-track', new THREE.TorusGeometry(XR_R, 0.007, 6, 160), xrTrackMat, xray); xrTrack.rotation.x = -PI / 2; xrTrack.position.y = 0.036;
  xrHeadMat = new THREE.MeshBasicMaterial({ color: lin(INK.crimson), toneMapped: false });
  xrHead = mesh('xray-ring-delta-head', new THREE.SphereGeometry(0.034, 16, 12), xrHeadMat, xray); xrHead.position.y = 0.04;
  xrTicks = new THREE.Group(); xrTicks.name = 'xray-ring-ticks'; xray.add(xrTicks);
  xrTickMat = new THREE.MeshBasicMaterial({ color: lin(INK.ink), toneMapped: false, transparent: true, opacity: 0.55, depthWrite: false });
  for (let k = 0; k < 4; k++) {
    // notches across the track at 0, 25, 50 and 75 %; the start notch is the longest
    const a = PI / 2 - k * PI / 2, t = mesh(`xray-ring-tick-${String(k + 1).padStart(2, '0')}`, new THREE.BoxGeometry(k ? 0.06 : 0.09, 0.008, 0.012), xrTickMat, xrTicks);
    t.position.set(Math.cos(a) * XR_R, 0.044, -Math.sin(a) * XR_R); t.rotation.y = a;
  }
  xrBeads = new THREE.Group(); xrBeads.name = 'xray-beads'; xray.add(xrBeads);
  geoBeadW = new THREE.SphereGeometry(0.03, 14, 10); geoBeadB = new THREE.TorusGeometry(0.026, 0.009, 8, 24);
  xrThreads = new THREE.Group(); xrThreads.name = 'xray-threads'; instruments.add(xrThreads);
  XR_SIDE = {
    w: new THREE.MeshBasicMaterial({ color: lin(INK.ivory), toneMapped: false, transparent: true, opacity: 0.9, depthWrite: false }),
    b: new THREE.MeshBasicMaterial({ color: lin(INK.steel), toneMapped: false, transparent: true, opacity: 0.85, depthWrite: false })
  };
}
