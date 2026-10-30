/*
✒ Metadata
    - Title: Renderer (MONOLITH Edition - v1.2)
    - File Name: renderer.js
    - Relative Path: js/scene/renderer.js
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
      release audit Dennis asked for: the environment maps can be baked
      again (bakeEnvironments()), so a lost WebGL context comes back with
      its reflections, and let go while it is lost (releaseEnvironments());
      each bake frees its rooms; POST_LACK says what the HDR pipeline lacks
      here, WebGL 2 or three's post-processing scripts.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      quality tiers moved to js/scene/quality.js, where Dennis's five
      graphics levels now live; this file keeps the renderer and reports
      whether the HDR pipeline can run (POST_OK).
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The three.js renderer, the scene and the main camera, with the
    environment maps. With HDR rendering on, the scene renders into a
    half-float MSAA target; Minimal draws straight to the screen. Which
    one runs is the graphics level's choice (js/scene/quality.js).

✒ Key Features:
    - The WebGL renderer: shadows, sRGB output, ACES filmic tone mapping.
      Throws BootHalt when WebGL is missing.
    - POST_OK: whether the HDR pipeline can run here (WebGL 2 and the
      three.js post-processing scripts); POST_LACK: which of the two is
      missing where it cannot.
    - lin(hex): a linear-space colour from an sRGB token.
    - Environment maps baked by PMREM for each world, turned with the board
      (ENV_YAW), and baked again after a lost WebGL context
      (bakeEnvironments(); releaseEnvironments() lets them go while it is
      lost), since what PMREM renders is lost with it.
    - The scene, its fog and the camera (near plane at 1).

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 2 of 26. Other modules import from it, for
    example:
        import { scene, lin, stage } from '../scene/renderer.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js; globals three.js r147 (THREE, from
      jsDelivr).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { $, BootHalt, PI } from '../app/base.js';

/* ---------- renderer ----------
   three.js r147. With post-processing on, the scene renders into a half-float MSAA target, so
   dark gradients do not band and emissive markers can carry values above 1.0. Then a ray-marched
   volumetric light pass, Unreal bloom, and an output pass (sRGB, vignette, dither). Materials
   tone-map themselves (r147 applies the renderer's tone mapping inside render targets), so the
   graphics levels differ only by effects, never by base colour. Minimal draws straight to the
   screen. The levels themselves are in js/scene/quality.js. */
export let stage, canvas; // set in init()
export let renderer;
let GL2; // set in init()
export let POST_OK; // set in init()
export let POST_LACK; // set in init(): '' where the HDR pipeline can run, else what it lacks, 'webgl2' or 'scripts'
/* Linear-space colour from an sRGB token, for unlit markers that must show the token itself. */
export const lin = hex => new THREE.Color(hex).convertSRGBToLinear();

export let scene; // set in init()
/* Near plane at 1: the camera never comes closer to anything than that, and multisampled render
   targets in r147 carry a 16-bit depth buffer, so precision at the board matters. */
export let camera; // set in init()

/* The world's yaw (see setWorldYaw) also turns the reflections: every PBR material reads the
   environment through it, so a flipped board sees the same reflected room as the side it left.
   The value is one shared typed array (three's uniform clone keeps typed arrays by reference),
   patched into the chunk before any material compiles; a three.js without that chunk text keeps
   world-fixed reflections. */
export const ENV_YAW = new Float32Array([1, 0]);
/* Environment maps: a small lit room per world, baked by PMREM. The cathedral's is warm, so
   marble gets soft reflections and obsidian its glint; MONOLITH's is two cool strip lights and a
   softbox, which draws the steel edges on obsidian and keeps ivory neutral. */
function buildEnvironment(world) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 16), new THREE.MeshBasicMaterial({ color: world === 'monolith' ? 0x0c0f13 : 0x1b1821, side: THREE.BackSide }));
  room.name = `env-${world}-room`; s.add(room);
  const panel = (name, w, h, pos, rot, col, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) }));
    m.name = `env-${world}-${name}`; m.position.set(...pos); m.rotation.set(...rot); s.add(m);
  };
  if (world === 'monolith') {
    panel('softbox', 6, 6, [0, 7.9, 0], [PI / 2, 0, 0], 0xe6ecf5, 3.2);
    panel('strip-left', 0.8, 12, [-7.9, 1, 0], [0, PI / 2, 0], 0xcfd8e6, 4.5);
    panel('strip-right', 0.8, 12, [7.9, 1, 0], [0, -PI / 2, 0], 0xcfd8e6, 4.5);
    panel('strip-back', 12, 0.6, [0, 2, -7.9], [0, 0, 0], 0xb8c3d4, 3);
    panel('floor', 10, 10, [0, -7.9, 0], [-PI / 2, 0, 0], 0x14181f, 0.4);
  } else {
    panel('ceiling', 7, 7, [0, 7.9, 0], [PI / 2, 0, 0], 0xffe3b8, 5);
    panel('window-left', 3, 9, [-7.9, 2, -2], [0, PI / 2, 0], 0x8fa8ff, 2.6);
    panel('candle-right', 3, 7, [7.9, 1.5, 3], [0, -PI / 2, 0], 0xffc28a, 1.6);
    panel('floor', 10, 10, [0, -7.9, 0], [-PI / 2, 0, 0], 0x2a2530, 0.4);
  }
  return s;
}
export let ENV; // set in init()
let envTargets; // set in init(): the render targets ENV's maps live in
/* Bakes both worlds' environment maps and puts the current world's on the scene. A lost WebGL
   context takes rendered textures with it (three.js re-uploads images, but a PMREM map is drawn,
   not loaded), so js/scene/post.js calls this again when the context is restored. Each little room
   is freed once baked, and a rebake frees the targets it replaces (disposing a PMREM texture alone
   would leave its target). */
/* Lets the environment maps go (a lost context has already taken them): called while the context
   is lost, when WebGL's delete calls are silent, so the rebake on restore has nothing stale to free. */
export function releaseEnvironments() {
  if (envTargets) { envTargets.cathedral.dispose(); envTargets.monolith.dispose(); envTargets = null; }
}
export function bakeEnvironments() {
  const old = envTargets, mono = !!ENV && scene.environment === ENV.monolith, pmrem = new THREE.PMREMGenerator(renderer);
  const bake = world => {
    const s = buildEnvironment(world), rt = pmrem.fromScene(s, 0.03);
    s.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    return rt;
  };
  envTargets = { cathedral: bake('cathedral'), monolith: bake('monolith') };
  ENV = { cathedral: envTargets.cathedral.texture, monolith: envTargets.monolith.texture };
  pmrem.dispose();
  scene.environment = mono ? ENV.monolith : ENV.cathedral;
  if (old) { old.cathedral.dispose(); old.monolith.dispose(); }
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  stage = $('#stage'); canvas = $('#scene');
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { $('#webgl-fail').classList.add('show'); throw new BootHalt('WebGL is not available'); }
  GL2 = renderer.capabilities.isWebGL2;
  // the pipeline needs WebGL 2 and three's post-processing scripts, which load from the CDN with three
  const scripts = !!(THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass && THREE.UnrealBloomPass && THREE.FullScreenQuad);
  POST_OK = GL2 && scripts; POST_LACK = !GL2 ? 'webgl2' : !scripts ? 'scripts' : '';
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  scene = new THREE.Scene(); scene.name = 'scene';
  scene.background = new THREE.Color(0x0b0a0e);
  scene.fog = new THREE.FogExp2(0x0b0a0e, 0.04);
  camera = new THREE.PerspectiveCamera(40, 1, 1, 140); camera.name = 'camera-main';
  {
    const chunk = THREE.ShaderChunk.envmap_physical_pars_fragment, n = 'inverseTransformDirection( normal, viewMatrix )', r = 'inverseTransformDirection( reflectVec, viewMatrix )';
    if (chunk && chunk.includes(n) && chunk.includes(r) && THREE.ShaderLib.standard && THREE.ShaderLib.physical) {
      for (const k of ['standard', 'physical']) THREE.ShaderLib[k].uniforms.envYaw = { value: ENV_YAW };
      THREE.ShaderChunk.envmap_physical_pars_fragment = chunk
        .replace('#if defined( USE_ENVMAP )', '#if defined( USE_ENVMAP )\n\tuniform vec2 envYaw;\n\tvec3 envTurn( const in vec3 d ) { return vec3( envYaw.x * d.x - envYaw.y * d.z, d.y, envYaw.y * d.x + envYaw.x * d.z ); }')
        .replace(n, `envTurn( ${n} )`).replace(r, `envTurn( ${r} )`);
    }
  }
  bakeEnvironments();
}
