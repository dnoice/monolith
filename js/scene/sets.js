/*
✒ Metadata
    - Title: World Sets (MONOLITH Edition - v1.2)
    - File Name: sets.js
    - Relative Path: js/scene/sets.js
    - Artifact Type: javascript
    - Version: 1.2.3
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.3 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      cathedral's column shafts have 64 sides instead of 20, so they stay
      round as the camera turns; the Description drops "Gothic".
    - 1.2.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.2.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: the candle lights hang on the rig
      rather than in the cathedral set, so hiding the set in MONOLITH no
      longer changes the light count and recompiles every lit shader.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The two worlds' sets on one turning rig: the cathedral (floor,
    arcades, ribs, lancets, the rose window, candles) and MONOLITH (built,
    steel-edged monoliths over a mirror floor). The rig's yaw turns the
    world with the board.

✒ Key Features:
    - rig and setWorldYaw(): the world turns to the side you play.
    - The cathedral: floor, plinth, 64-sided column shafts that keep their
      outline as the camera turns, capitals, arcades and ribs, lancets, the
      rose window and candle lights.
    - MONOLITH: its materials, steel edges that hold at any distance, the
      mirror floor (or a plain one) and three pillar places, each with a
      built pillar (base, body, raised face panel, cap) that Dennis's
      models replace once they load (monoSlots, js/scene/pillars.js).
    - Walls one-sided, everything mounted on them too, so a camera out
      past a wall sees through it cleanly.
    - mesh(): a named mesh with shadows, added to its parent.
    - The lights of each world: hemisphere, key, rose, MONOLITH's two rim
      lights (high and narrow, on the pieces) and its wash (on the
      monoliths only).

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 4 of 26. Other modules import from it, for
    example:
        import { key, mesh, monoFloorMirror } from '../scene/sets.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js, scene/renderer.js,
      scene/materials.js and scene/pillars.js; globals three.js r147
      (THREE, from jsDelivr).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { PI } from '../app/base.js';
import { ENV_YAW, lin, scene } from './renderer.js';
import { MAT } from './materials.js';
import { startPillars } from './pillars.js';

/* ---------- world rig ----------
   Both worlds' scenery and their lights hang from one rig that turns with the board's
   orientation (Dennis, 10/22/2026: on a flip the pillars swept through the frame and popped in
   and out of view). A flip turns the rig with the camera, so the backdrop holds still on screen
   while the board turns beneath it, and Black sits before the same view White does. The board,
   the plinths (counter-turned) and the mirror floor's rule grid (drawn in world space) never
   turn; ENV_YAW turns the reflections to match. Orbiting by hand moves only the camera. */
let rig; // set in init()

/* ---------- set: cathedral ---------- */
export let set; // set in init()
export const mesh = (name, geo, mat, parent, cast = false, receive = false) => {
  const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = cast; m.receiveShadow = receive; parent.add(m); return m;
};
/* floor and plinth */
let floor; // set in init()
// the plinth's top sits at the squares' underside (y = −0.1), never just beneath their faces
let cathPlinth; // set in init()

/* pointed-arch helpers (equilateral: span 2a, centres on the springers) */
function archOutline(a, t, leg) {
  const sh = new THREE.Shape();
  const outer = [], inner = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) { const th = PI - (PI / 3) * (i / steps); outer.push([a + 2 * a * Math.cos(th), 2 * a * Math.sin(th)]); }
  for (let i = 0; i <= steps; i++) { const th = PI / 3 - (PI / 3) * (i / steps); outer.push([-a + 2 * a * Math.cos(th), 2 * a * Math.sin(th)]); }
  const R = 2 * a - t, phi = Math.acos(-a / R);
  for (let i = 0; i <= steps; i++) { const th = PI - (PI - phi) * (i / steps); inner.push([a + R * Math.cos(th), R * Math.sin(th)]); }
  for (let i = 0; i <= steps; i++) { const th = (PI - phi) - (PI - phi) * (i / steps); inner.push([-a + R * Math.cos(th), R * Math.sin(th)]); }
  sh.moveTo(-a, -leg); sh.lineTo(-a, 0);
  outer.forEach(p => sh.lineTo(p[0], p[1]));
  sh.lineTo(a, -leg); sh.lineTo(a - t, -leg); sh.lineTo(a - t, 0);
  inner.reverse().forEach(p => sh.lineTo(p[0], p[1]));
  sh.lineTo(-a + t, -leg); sh.closePath();
  return sh;
}
function lancetShape(a, h) {
  const sh = new THREE.Shape(); sh.moveTo(-a, 0); sh.lineTo(-a, h);
  const steps = 20;
  for (let i = 0; i <= steps; i++) { const th = PI - (PI / 3) * (i / steps); sh.lineTo(a + 2 * a * Math.cos(th), h + 2 * a * Math.sin(th)); }
  for (let i = 0; i <= steps; i++) { const th = PI / 3 - (PI / 3) * (i / steps); sh.lineTo(-a + 2 * a * Math.cos(th), h + 2 * a * Math.sin(th)); }
  sh.lineTo(a, 0); sh.closePath(); return sh;
}
export const colZ = [8, 3, -2, -7, -12, -17, -22], colX = 6.5, colTop = 8.6, floorY = -0.45;
let geoShaft; // set in init()
let geoCap, geoBase; // set in init()
let geoArcade; // set in init()
let geoRib; // set in init()
/* side aisle walls with lancet windows */
let geoWall; // set in init()
let geoLancet, geoMullion; // set in init()
/* apse wall, rose window, three tall lancets */
const apseZ = -24.5;
let rose; // set in init()
let geoApseLancet; // set in init()
/* light shafts from the left windows */
let shaftTex; // set in init()
let matShaft; // set in init()
/* candles at the plinth corners */
export const candleLights = [];
/* lights */
export let hemi; // set in init()
export let key; // set in init()
export let roseLight; // set in init()

/* ---------- set: MONOLITH ----------
   The instrument's world: a dark mirror floor (a Reflector whose reflection is tone-mapped,
   faded with distance and laid over the canvas colour, with a faint one-unit rule grid), a slab
   plinth edged in steel, three graphite monoliths standing in the dark under a soft wash, and
   cool rim lights that outline the pieces. The key light is shared with the cathedral and retuned
   per world. All lights exist from the start (at zero), so a world change never recompiles a
   shader. */
export let monoSet; // set in init()
let MO_MAT; // set in init()
/* Steel edges, drawn by the surfaces themselves (Dennis, 10/22/2026: the edges were paper thin and
   read as broken, jagged lines). They were boxes 18 mm across, under a pixel wide at the
   monoliths' distance, so the rasteriser kept and dropped them pixel by pixel. The plinth and the
   monoliths are now unit boxes scaled to size, and their shader measures each fragment's distance
   to the framed face's border in pixels, by its screen-space derivative: a band 12 mm wide on
   each face that meets at the edge, never narrower than 1.6 pixels, smoothed across a pixel and a
   half and faintly haloed, so it holds steady at any distance and angle. STEEL_AXIS names
   the framed face: 1 is the top (the plinth), 2 the front (a monolith). */
const steelUniforms = { uSteelColor: { value: lin(0xabb5c3).multiplyScalar(0.5) } };
function steelEdged(mat, axis) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uSteelColor = steelUniforms.uSteelColor;
    sh.vertexShader = 'varying vec3 vSteelP;\nvarying vec3 vSteelH;\nvarying vec3 vSteelN;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n\tvec3 steelS = vec3( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ), length( modelMatrix[ 2 ].xyz ) );\n\tvSteelP = position * steelS; vSteelH = 0.5 * steelS; vSteelN = normal;');
    sh.fragmentShader = `#define STEEL_AXIS ${axis}\nuniform vec3 uSteelColor;\nvarying vec3 vSteelP;\nvarying vec3 vSteelH;\nvarying vec3 vSteelN;\n` + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
	vec3 steelFw = max( fwidth( vSteelP ), vec3( 1e-6 ) );
	vec3 steelPx = ( vSteelH - abs( vSteelP ) ) / steelFw;
	vec3 steelW = max( vec3( 1.6 ), 0.012 / steelFw );
	vec3 steelL = max( 1.0 - smoothstep( steelW - 0.75, steelW + 0.75, steelPx ), 0.18 * exp( - steelPx / 3.0 ) );
	float steel = 0.0;
	#if STEEL_AXIS == 1
	if ( vSteelN.y > 0.5 ) steel = max( steelL.x, steelL.z ); else if ( vSteelN.y > - 0.5 ) steel = steelL.y * step( 0.0, vSteelP.y );
	#else
	if ( vSteelN.z > 0.5 ) steel = max( steelL.x, steelL.y ); else if ( vSteelN.z > - 0.5 ) steel = steelL.z * step( 0.0, vSteelP.z );
	#endif
	totalEmissiveRadiance += uSteelColor * steel;`);
  };
  mat.customProgramCacheKey = () => `steel-edged-${axis}`;
}
const MonoFloorShader = {
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uBase: { value: lin(0x0b0d10) }, uRule: { value: lin(0x262d38) }, uMix: { value: 0.3 } },
  vertexShader: `uniform mat4 textureMatrix;
    varying vec4 vUvR; varying vec3 vW;
    void main() { vUvR = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 uBase, uRule; uniform float uMix;
    varying vec4 vUvR; varying vec3 vW;
    void main() {
      vec3 refl = texture2DProj(tDiffuse, vUvR).rgb;
      #if defined( TONE_MAPPING )
      refl = toneMapping(refl);
      #endif
      float r = length(vW.xz);
      vec3 c = uBase + refl * uMix * (1.0 - smoothstep(4.5, 17.0, r));
      vec2 d = abs(fract(vW.xz + 0.5) - 0.5), fw = fwidth(vW.xz) * 1.4;
      float line = 1.0 - min(smoothstep(0.0, fw.x, d.x), smoothstep(0.0, fw.y, d.y));
      c = mix(c, uRule, line * 0.6 * (1.0 - smoothstep(3.5, 13.0, r)));
      gl_FragColor = vec4(c, 1.0);
      #include <encodings_fragment>
    }`
};
export let monoFloorPlain; // set in init()
export let monoFloorMirror = null;           // built on first use (High and Balanced)
export function mirrorFloor() {
  if (monoFloorMirror || !THREE.Reflector) return monoFloorMirror;
  monoFloorMirror = new THREE.Reflector(new THREE.PlaneGeometry(70, 70), { textureWidth: 512, textureHeight: 512, clipBias: 0.002, shader: MonoFloorShader, multisample: 0 });
  monoFloorMirror.name = 'floor-monolith-mirror'; monoFloorMirror.material.extensions = { derivatives: true };
  monoFloorMirror.rotation.x = -PI / 2; monoFloorMirror.position.y = floorY + 0.001; monoSet.add(monoFloorMirror);
  return monoFloorMirror;
}
let geoUnitBox; // set in init()
let monoPlinth; // set in init()
/* The three pillar places: { n, g (the place's group), w, h, parts (the built pillar), model }.
   js/scene/pillars.js puts Dennis's models on them and keeps the built parts as the fallback. */
export const monoSlots = [];
export let rimLights; // set in init()
export let monoWash; // set in init()
/* The rig's yaw: 0 for White's side, π for Black's (see setOrientation). */
export let worldYaw = 0;
export function setWorldYaw(a) {
  worldYaw = a; rig.rotation.y = a; cathPlinth.rotation.y = monoPlinth.rotation.y = -a;
  ENV_YAW[0] = Math.cos(a); ENV_YAW[1] = Math.sin(a);
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  rig = new THREE.Group(); rig.name = 'rig-world'; scene.add(rig);
  // ---------- set: cathedral
  set = new THREE.Group(); set.name = 'set-cathedral'; rig.add(set);
  floor = mesh('floor-nave', new THREE.PlaneGeometry(60, 80), MAT.floor, set, false, true);
  floor.rotation.x = -PI / 2; floor.position.set(0, -0.45, -8);
  cathPlinth = mesh('plinth-board', new THREE.BoxGeometry(9.4, 0.36, 9.4), MAT.plinth, set, true, true); cathPlinth.position.y = -0.28;
  /* 64 sides, not 20 (Dennis, 10/30/2026: the pillars did not hold their shape as the camera
     turned): a 20-sided shaft's outline sits up to 5 mm inside the round one and jumps from edge to
     edge as the view turns, two to three pixels at a nearby column; at 64 it stays within a third of
     a pixel. One geometry serves all fourteen shafts, so the cost is a few thousand triangles. */
  geoShaft = new THREE.CylinderGeometry(0.42, 0.46, colTop - floorY - 0.9, 64);
  geoCap = new THREE.BoxGeometry(1.3, 0.45, 1.3); geoBase = new THREE.BoxGeometry(1.3, 0.45, 1.3);
  geoArcade = new THREE.ExtrudeGeometry(archOutline(2.5, 0.32, 0.25), { depth: 0.36, bevelEnabled: false });
  geoRib = new THREE.ExtrudeGeometry(archOutline(colX, 0.34, 0.2), { depth: 0.3, bevelEnabled: false });
  colZ.forEach((z, i) => {
    const n = String(i + 1).padStart(2, '0');
    [['left', -colX], ['right', colX]].forEach(([side, x]) => {
      const g = new THREE.Group(); g.name = `column-${n}-${side}`; g.position.set(x, 0, z); set.add(g);
      mesh(`column-${n}-${side}-base`, geoBase, MAT.stoneDark, g, true, true).position.y = floorY + 0.225;
      mesh(`column-${n}-${side}-shaft`, geoShaft, MAT.stone, g, true, true).position.y = floorY + 0.45 + (colTop - floorY - 0.9) / 2;
      mesh(`column-${n}-${side}-capital`, geoCap, MAT.stoneDark, g, true, true).position.y = colTop - 0.225;
      if (i < colZ.length - 1) {
        const arch = mesh(`arcade-${n}-${side}`, geoArcade, MAT.stone, g, false, false);
        arch.rotation.y = PI / 2; arch.position.set(0.18, colTop, -2.5);
      }
    });
    const rib = mesh(`vault-rib-${n}`, geoRib, MAT.stoneDark, set, false, false); rib.position.set(0, colTop, z - 0.15);
  });
  geoWall = new THREE.PlaneGeometry(50, 16);
  /* The aisle walls are one-sided, so a camera orbiting out past them (at the sides, from about
     distance 11) looks through them, as a cutaway. The mullions were boxes, seen from both sides,
     so out there they stayed behind as thin bars floating between the columns (Dennis,
     10/23/2026). Each is now a strip on the wall's face, facing the nave like the wall itself:
     from inside the same divider, from outside gone with its wall. */
  geoLancet = new THREE.ShapeGeometry(lancetShape(0.55, 3.6)); geoMullion = new THREE.PlaneGeometry(0.08, 4.5);
  [['left', -10.5, PI / 2], ['right', 10.5, -PI / 2]].forEach(([side, x, ry]) => {
    const w = mesh(`wall-aisle-${side}`, geoWall, MAT.stoneDark, set, false, true); w.position.set(x, 7, -8); w.rotation.y = ry;
    colZ.forEach((z, i) => {
      if (i === colZ.length - 1) return;
      const n = String(i + 1).padStart(2, '0');
      const win = new THREE.Group(); win.name = `lancet-${n}-${side}`; win.position.set(x - Math.sign(x) * 0.05, 2.6, z - 2.5); win.rotation.y = ry; set.add(win);
      mesh(`lancet-${n}-${side}-glass`, geoLancet, MAT.glassBlue, win);
      mesh(`lancet-${n}-${side}-mullion`, geoMullion, MAT.stoneDark, win).position.set(0, 2.2, 0.03);
    });
  });
  mesh('wall-apse', new THREE.PlaneGeometry(26, 18), MAT.stoneDark, set, false, true).position.set(0, 8, apseZ);
  rose = new THREE.Group(); rose.name = 'rose-window'; rose.position.set(0, 9.2, apseZ + 0.05); set.add(rose);
  mesh('rose-window-glass', new THREE.CircleGeometry(2.6, 48), MAT.glassRose, rose);
  mesh('rose-window-rim', new THREE.TorusGeometry(2.6, 0.22, 10, 48), MAT.stone, rose).position.z = 0.1;
  mesh('rose-window-hub', new THREE.TorusGeometry(0.75, 0.12, 8, 32), MAT.stone, rose).position.z = 0.08;
  for (let i = 0; i < 12; i++) {
    const sp = mesh(`rose-window-spoke-${String(i + 1).padStart(2, '0')}`, new THREE.BoxGeometry(0.1, 1.9, 0.1), MAT.stone, rose);
    const ang = i * PI / 6; sp.position.set(Math.cos(ang) * 1.68, Math.sin(ang) * 1.68, 0.08); sp.rotation.z = ang + PI / 2;
  }
  geoApseLancet = new THREE.ShapeGeometry(lancetShape(0.7, 3.2));
  [-4.2, 0, 4.2].forEach((x, i) => {
    const l = mesh(`lancet-apse-${String(i + 1).padStart(2, '0')}`, geoApseLancet, MAT.glassBlue, set); l.position.set(x, 1.4, apseZ + 0.05);
  });
  shaftTex = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256); grad.addColorStop(0, 'rgba(160,180,255,0.0)'); grad.addColorStop(0.25, 'rgba(160,180,255,0.35)'); grad.addColorStop(1, 'rgba(160,180,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 256);
    const side = g.createLinearGradient(0, 0, 64, 0); side.addColorStop(0, 'rgba(0,0,0,1)'); side.addColorStop(0.5, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = side; g.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(c); return t;
  })();
  matShaft = new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  [0.5, -4.5, -9.5].forEach((z, i) => {
    const s = mesh(`light-shaft-${String(i + 1).padStart(2, '0')}`, new THREE.PlaneGeometry(1.6, 15), matShaft, set);
    s.position.set(-5.2, 3.2, z); s.rotation.set(0, 0, -0.95); s.rotation.y = 0.15;
  });
  [[-5.2, 5.2], [5.2, 5.2], [-5.2, -5.2], [5.2, -5.2]].forEach(([x, z], i) => {
    const n = String(i + 1).padStart(2, '0');
    const g = new THREE.Group(); g.name = `candle-${n}`; g.position.set(x, floorY, z); set.add(g);
    mesh(`candle-${n}-stand`, new THREE.CylinderGeometry(0.06, 0.12, 1.4, 12), MAT.brass, g, true).position.y = 0.7;
    mesh(`candle-${n}-dish`, new THREE.CylinderGeometry(0.22, 0.18, 0.06, 16), MAT.brass, g, true).position.y = 1.42;
    mesh(`candle-${n}-wax`, new THREE.CylinderGeometry(0.09, 0.1, 0.5, 12), MAT.marble, g, true).position.y = 1.7;
    const flame = mesh(`candle-${n}-flame`, new THREE.SphereGeometry(0.07, 10, 10), MAT.flame, g); flame.position.y = 2.02; flame.scale.y = 1.6;
    // the light hangs on the rig, not in the candle: three counts no light inside a hidden group,
    // so one in the set would drop out in MONOLITH and recompile every lit program; on the rig it
    // stays counted and the loop holds it at zero there (cathedralWeight)
    const light = new THREE.PointLight(0xffb45a, 1.0, 11, 2); light.name = `candle-${n}-light`; light.position.set(x, floorY + 2.1, z); rig.add(light);
    candleLights.push({ light, flame, phase: Math.random() * 10 });
  });
  hemi = new THREE.HemisphereLight(0x3b4262, 0x120f14, 0.55); hemi.name = 'light-hemisphere'; scene.add(hemi);
  key = new THREE.SpotLight(0xffe9c8, 1.5, 60, 0.55, 0.6, 1.2); key.name = 'light-key-spot';
  key.position.set(4, 14, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.camera.near = 4; key.shadow.camera.far = 30;
  key.target.position.set(0, 0, 0); rig.add(key, key.target);
  roseLight = new THREE.PointLight(0x7b86d8, 1.0, 45, 1.6); roseLight.name = 'light-rose-window'; roseLight.position.set(0, 8, -19); rig.add(roseLight);
  // ---------- set: MONOLITH
  monoSet = new THREE.Group(); monoSet.name = 'set-monolith'; monoSet.visible = false; rig.add(monoSet);
  MO_MAT = {
    slab: new THREE.MeshStandardMaterial({ color: lin(0x14181f), roughness: 0.6, metalness: 0.05 }),
    // graphite steel rather than near-black glass: the faces show the room's strip lights as soft
    // gradients instead of reflecting the dark wall behind the camera, so the volume reads
    monolith: new THREE.MeshPhysicalMaterial({ color: 0x1c2129, roughness: 0.42, metalness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.35, envMapIntensity: 1.2 }),
    floor: new THREE.MeshStandardMaterial({ color: lin(0x0b0d10), roughness: 0.85 })
  };
  MO_MAT.slab.name = 'material-monolith-slab'; MO_MAT.monolith.name = 'material-monolith-graphite';
  steelEdged(MO_MAT.slab, 1); steelEdged(MO_MAT.monolith, 2);
  monoFloorPlain = mesh('floor-monolith', new THREE.PlaneGeometry(70, 70), MO_MAT.floor, monoSet, false, true);
  monoFloorPlain.rotation.x = -PI / 2; monoFloorPlain.position.y = floorY;
  geoUnitBox = new THREE.BoxGeometry(1, 1, 1);
  monoPlinth = mesh('plinth-monolith', geoUnitBox, MO_MAT.slab, monoSet, true, true); monoPlinth.position.y = -0.28; monoPlinth.scale.set(9.4, 0.36, 9.4);
  /* Each monolith is built rather than one slab (Dennis, 10/23/2026: the pillars were awkward,
     flat panes that showed only their steel outline). A base block and a cap bracket a body about
     a third as deep as it is wide, and a face panel steps 12 cm out of the front. Every view now
     meets real faces: the sides take the room's strip lights, the panel's step draws a second
     steel frame inside the first, and the wash grades the faces from the top down. Each part is
     a unit box scaled to size, so the steel edges keep their screen-space width. The base stands
     15 cm into the floor, so no monolith floats above its reflection; the top is where it was. */
  [['01-centre', 0, -16, 0, 3.4, 10.4], ['02-left', -10.5, -11.5, 0.55, 2.6, 8.6], ['03-right', 11, -10.5, -0.5, 2.8, 9.4]].forEach(([n, x, z, ry, w, h]) => {
    const g = new THREE.Group(); g.name = `monolith-${n}`; g.position.set(x, floorY, z); g.rotation.y = ry; monoSet.add(g);
    const d = Math.max(0.9, w * 0.34), y0 = 0.35, y1 = h - 0.45, inset = 0.22;
    const part = (p, mat, sx, sy, sz, px, py, pz) => { const m = mesh(`monolith-${n}-${p}`, geoUnitBox, mat, g, true, true); m.scale.set(sx, sy, sz); m.position.set(px, py, pz); return m; };
    const parts = [
      part('base', MO_MAT.slab, w + 0.5, 0.5, d + 0.5, 0, 0.1, 0),
      part('body', MO_MAT.monolith, w, y1 - y0, d, 0, (y0 + y1) / 2, 0),
      part('face', MO_MAT.monolith, w - 2 * inset, y1 - y0 - 2 * inset, 0.12, 0, (y0 + y1) / 2, d / 2 + 0.06),
      part('cap', MO_MAT.slab, w + 0.16, 0.3, d + 0.16, 0, h - 0.3, 0)
    ];
    monoSlots.push({ n, g, w, h, parts, model: null });
  });
  /* The rim lights outline the pieces from behind (Dennis, 10/23/2026: from low angles the board
     blazed white). They stood low and wide (4.5 up, a 0.5 rad cone), raking the squares, and
     their glint crossed the bloom threshold. High (8 up) and narrow (0.34 rad), aimed at the
     pieces' middle, they still wrap the pieces while their glint on the squares stays soft. */
  rimLights = [[-7.5, 8, -9], [7.5, 8, -9]].map(([x, y, z], i) => {
    const l = new THREE.SpotLight(0xc8d3e6, 0, 40, 0.34, 0.9, 1); l.name = `light-monolith-rim-${i ? 'right' : 'left'}`;
    l.position.set(x, y, z); l.target.position.set(0, 1, 0); rig.add(l, l.target); return l;
  });
  /* The wash: one soft spot from high over the board's far side onto the monoliths, so their
     faces read lighter at the top and solid against the haze. The board lies outside its cone. */
  monoWash = new THREE.SpotLight(0xc8d3e6, 0, 70, 0.5, 0.8, 1); monoWash.name = 'light-monolith-wash';
  monoWash.position.set(0, 20, -2); monoWash.target.position.set(0, 3, -14); rig.add(monoWash, monoWash.target);
  // Dennis's Blender pillars replace the built ones once their files arrive (js/scene/pillars.js)
  startPillars();
}
