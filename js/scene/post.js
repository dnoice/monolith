/*
✒ Metadata
    - Title: Post-processing (MONOLITH Edition - v1.2)
    - File Name: post.js
    - Relative Path: js/scene/post.js
    - Artifact Type: javascript
    - Version: 1.2.2
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.2 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      haze is laid over the scene by depth, mixing both surfaces' light at
      silhouettes, so columns keep clean edges; the depth draw is full size.
    - 1.2.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a lost WebGL context is rebuilt when
      the browser restores it (environment maps baked again, the pipeline
      built again, the panels redrawn), and what it held is let go while it
      is lost, when WebGL's delete calls are silent: freed after the
      restore, the stale objects drew 70 console warnings.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Post-processing for every graphics level with HDR rendering (Low and
    up): a ray-marched volumetric light pass, Unreal bloom, and an output
    pass (sRGB, vignette, dither). Without HDR (Minimal) the scene draws
    straight to the screen. Where the light is not ray-marched, the
    cathedral's planar light shafts stand in.

✒ Key Features:
    - post: builds, resizes and renders the pipeline for the settings in
      use (js/scene/quality.js): pixel ratio, multisampling, the light
      pass's resolution and steps, bloom on or off, the key light's shadow
      map size or no shadows.
    - The haze: ray-marched beams at the level's fraction of the view,
      each ray ending at the depth of a full-resolution pre-pass (whose
      unused colour takes one byte a pixel).
    - A depth-matched composite: each pixel takes the haze of the texels
      whose rays ended at its own depth, and a pixel on a silhouette mixes
      both surfaces' haze by how much of it each covers.
    - The output shader: sRGB, vignette and dither.
    - Planar shafts wherever the light is not ray-marched.
    - Recovery from a lost WebGL context: when the browser restores it, the
      environment maps are baked again and the pipeline rebuilt.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 8 of 26; init() also starts the graphics
    levels (js/scene/quality.js). Other modules import from it, for
    example:
        import { post, hazeMix } from '../scene/post.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, scene/renderer.js,
      scene/quality.js, scene/sets.js, scene/board.js, scene/instruments.js,
      scene/phantoms.js, app/state.js, game/ceremony.js, scene/worlds.js and
      app/loop.js; globals three.js r147 (THREE, from jsDelivr).
    - Shared state (js/app/store.js): sets app.ghostWarm.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { bakeEnvironments, camera, canvas, POST_OK, releaseEnvironments, renderer, scene } from './renderer.js';
import { startQuality, tier } from './quality.js';
import { key, monoFloorMirror, monoFloorPlain, set, worldYaw } from './sets.js';
import { fragGroup } from './board.js';
import { instruments } from './instruments.js';
import { phantoms } from './phantoms.js';
import { render, renderers } from '../app/state.js';
import { fx } from '../game/ceremony.js';
import { syncWorldRender } from './worlds.js';
import { resize } from '../app/loop.js';

/* ---------- post-processing: ray-marched volumetric light, bloom, output ----------
   Volumetric light is ray-marched per pixel at three-quarter (Ultra), half (High) or quarter
   (Medium) resolution, in 56, 40 or 22 steps:
   a depth pre-pass gives each ray its end point, and every step samples the key spot light's
   cone, attenuation, a Henyey–Greenstein phase and the light's own shadow map, so pieces and
   columns cut real shafts out of the haze. In the cathedral three slanted window beams join it.
   Animated value noise gives the dust. The result is added to the HDR scene before bloom. */
const OutputShader = {
  uniforms: { tDiffuse: { value: null }, uVignette: { value: 0.3 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVignette, uTime;
    varying vec2 vUv;
    vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
    float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 d = (vUv - 0.5) * vec2(1.15, 1.0);
      c *= 1.0 - uVignette * smoothstep(0.4, 1.12, length(d) * 1.25);
      gl_FragColor = vec4(toSRGB(c) + (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) / 255.0, 1.0);
    }`
};
const HazeShader = {
  uniforms: {
    tDepth: { value: null }, tShadow: { value: null }, uShadowOn: { value: 0 }, uShadowM: { value: new THREE.Matrix4() },
    uProjInv: { value: new THREE.Matrix4() }, uViewInv: { value: new THREE.Matrix4() }, uCam: { value: new THREE.Vector3() },
    uLPos: { value: new THREE.Vector3() }, uLDir: { value: new THREE.Vector3(0, -1, 0) }, uLCol: { value: new THREE.Color() }, uLCos: { value: 0.8 }, uLPen: { value: 0.1 },
    uBeamO: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uBeamD: { value: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0)] },
    uBeamCol: { value: new THREE.Color() }, uBeamR: { value: 0.62 }, uBeamLen: { value: 13 }, uBeams: { value: 0 },
    uDensity: { value: 0.01 }, uSpotGain: { value: 1 }, uBeamGain: { value: 1 }, uTime: { value: 0 }, uMaxDist: { value: 42 }, uG: { value: 0.35 }
  },
  vertexShader: `varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `#include <packing>
    uniform sampler2D tDepth, tShadow;
    uniform float uShadowOn, uLCos, uLPen, uDensity, uTime, uMaxDist, uG, uSpotGain, uBeamGain, uBeams, uBeamR, uBeamLen;
    uniform mat4 uShadowM, uProjInv, uViewInv;
    uniform vec3 uCam, uLPos, uLDir, uLCol, uBeamCol;
    uniform vec3 uBeamO[3]; uniform vec3 uBeamD[3];
    varying vec2 vUv;
    float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
    float vnoise(vec3 p) {
      vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                 mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
    }
    float phaseHG(float c, float g) { float g2 = g * g; return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * c, 1.5); }
    void main() {
      float d = texture2D(tDepth, vUv).x;
      vec4 vp = uProjInv * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); vp /= vp.w;
      vec3 wp = (uViewInv * vp).xyz;
      vec3 rd = wp - uCam; float dist = length(rd); rd /= dist;
      if (d >= 0.99999) dist = uMaxDist;
      dist = min(dist, uMaxDist);
      float stepLen = dist / float(STEPS);
      float t = stepLen * hash13(vec3(gl_FragCoord.xy, fract(uTime) * 61.0));
      vec3 acc = vec3(0.0);
      for (int i = 0; i < STEPS; i++) {
        vec3 p = uCam + rd * t;
        float dens = uDensity * (0.45 + 1.1 * vnoise(p * 0.7 + vec3(0.0, -uTime * 0.05, uTime * 0.03)));
        vec3 L = p - uLPos; float dl = length(L); vec3 Ln = L / dl;
        float cone = smoothstep(uLCos, uLCos + uLPen, dot(Ln, uLDir));
        if (cone > 0.0 && uSpotGain > 0.0) {
          float vis = 1.0;
          if (uShadowOn > 0.5) {
            vec4 sc = uShadowM * vec4(p, 1.0); sc.xyz /= sc.w;
            if (sc.x > 0.0 && sc.x < 1.0 && sc.y > 0.0 && sc.y < 1.0 && sc.z < 1.0) vis = step(sc.z - 0.003, unpackRGBAToDepth(texture2D(tShadow, sc.xy)));
          }
          acc += uLCol * (uSpotGain * cone * vis * phaseHG(dot(Ln, -rd), uG) / (1.0 + dl * dl * 0.004)) * dens;
        }
        for (int b = 0; b < 3; b++) {
          if (float(b) >= uBeams) break;
          vec3 q = p - uBeamO[b]; float along = dot(q, uBeamD[b]);
          if (along > 0.0 && along < uBeamLen) {
            float beam = 1.0 - smoothstep(uBeamR * 0.3, uBeamR, length(q - uBeamD[b] * along));
            acc += uBeamCol * (uBeamGain * beam * (1.0 - along / uBeamLen) * phaseHG(dot(uBeamD[b], -rd), uG)) * dens;
          }
        }
        t += stepLen;
      }
      gl_FragColor = vec4(acc * stepLen, dist);   // alpha: where this ray ended, for the composite
    }`
};
/* The haze is marched at a fraction of the view's resolution, so a texel can straddle a column's
   silhouette and take either the column's short ray or the long ray to the wall behind it. Spread
   over the pixels as it was (Dennis, 10/30/2026: jagged, pixelated pillars), the wrong one drew
   stair-steps two or four pixels deep along every column standing in front of the lit haze. Each
   pixel now takes only the texels whose rays ended where its own does (the full-resolution depth
   against the distance each texel stored), blended as before, and the nearest of the four where
   none does; across flat surfaces all four agree, so the dust stays as smooth as it was.
   The depth is one sample a pixel while the scene under it is multisampled, so a pixel on the
   silhouette is partly column and partly wall but took one surface's haze: a hard one-pixel stair
   along the anti-aliased edge. There the pixel takes both surfaces' haze, mixed by how much of it
   each covers, read from the scene's own colour between its neighbours on either side. */
const HazeComposite = {
  uniforms: { tDiffuse: { value: null }, tHaze: { value: null }, tDepth: { value: null }, uHazeSize: { value: new THREE.Vector2(1, 1) }, uPx: { value: new THREE.Vector2(1, 1) }, uProjInv: { value: new THREE.Matrix4() }, uMaxDist: { value: 42 } },
  vertexShader: OutputShader.vertexShader,
  fragmentShader: `uniform sampler2D tDiffuse, tHaze, tDepth;
    uniform vec2 uHazeSize, uPx; uniform mat4 uProjInv; uniform float uMaxDist;
    varying vec2 vUv;
    vec4 h0, h1, h2, h3, bw;
    float range(vec2 uv) {
      float d = texture2D(tDepth, uv).x;
      vec4 vp = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
      return d >= 0.99999 ? uMaxDist : min(length(vp.xyz / vp.w), uMaxDist);
    }
    // the haze of the surface at distance r: the texels whose rays ended there, or the nearest
    vec3 hazeAt(float r) {
      vec4 e = abs(vec4(h0.a, h1.a, h2.a, h3.a) - r) / r, w = bw * step(e, vec4(0.1));
      float s = w.x + w.y + w.z + w.w, m = min(min(e.x, e.y), min(e.z, e.w));
      return s > 1e-4 ? (h0.rgb * w.x + h1.rgb * w.y + h2.rgb * w.z + h3.rgb * w.w) / s
        : m == e.x ? h0.rgb : m == e.y ? h1.rgb : m == e.z ? h2.rgb : h3.rgb;
    }
    void main() {
      vec2 p = vUv * uHazeSize - 0.5, f = fract(p), t = (floor(p) + 0.5) / uHazeSize, o = 1.0 / uHazeSize;
      h0 = texture2D(tHaze, t); h1 = texture2D(tHaze, t + vec2(o.x, 0.0)); h2 = texture2D(tHaze, t + vec2(0.0, o.y)); h3 = texture2D(tHaze, t + o);
      bw = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
      float r = range(vUv);
      vec3 c = texture2D(tDiffuse, vUv).rgb, hz = hazeAt(r);
      // on a silhouette: the neighbour farthest off in depth is across it, the opposite one is this side
      vec4 n = vec4(range(vUv - vec2(uPx.x, 0.0)), range(vUv + vec2(uPx.x, 0.0)), range(vUv - vec2(0.0, uPx.y)), range(vUv + vec2(0.0, uPx.y)));
      vec4 g = abs(n - r) / min(n, vec4(r));
      float k = max(max(g.x, g.y), max(g.z, g.w));
      if (k > 0.1) {
        vec2 dir = k == g.x ? vec2(-uPx.x, 0.0) : k == g.y ? vec2(uPx.x, 0.0) : k == g.z ? vec2(0.0, -uPx.y) : vec2(0.0, uPx.y);
        float rq = k == g.x ? n.x : k == g.y ? n.y : k == g.z ? n.z : n.w;
        vec3 cp = texture2D(tDiffuse, vUv - dir).rgb, dq = texture2D(tDiffuse, vUv + dir).rgb - cp;
        hz = mix(hz, hazeAt(rq), clamp(dot(c - cp, dq) / max(dot(dq, dq), 1e-6), 0.0, 1.0));
      }
      gl_FragColor = vec4(c + hz, 1.0);
    }`
};
/* What the haze sees of the world, blended by the world transition (see setWorld). */
export const hazeMix = { spot: 1, beam: 1, density: 0.012 };
/* Window beams: through the first three left lancets, down toward the board (in the world rig's
   frame; the haze pass turns them with it). */
const BEAMS = [0.5, -4.5, -9.5].map(z => ({ o: new THREE.Vector3(-10.3, 5.2, z), d: new THREE.Vector3(8.6, -5.4, 1.4).normalize() }));
const Y_AXIS = new THREE.Vector3(0, 1, 0);
let VolumePass = null;
export let planarShafts; // set in init()
export const post = {
  composer: null, volume: null, bloom: null, output: null,
  build() {
    const T = tier(); this.dispose();
    renderer.setPixelRatio(Math.min(devicePixelRatio, T.ratio));
    /* The key light is the only one that casts shadows. Without them its map is freed, and the
       lit materials recompile without the shadow lookups (three.js keys its programs on the
       number of shadowed lights); the haze then marches unshadowed light. */
    key.castShadow = T.shadow > 0;
    if (key.shadow.map && (!key.castShadow || key.shadow.mapSize.x !== T.shadow)) { key.shadow.map.dispose(); key.shadow.map = null; }
    if (key.castShadow) key.shadow.mapSize.set(T.shadow, T.shadow);
    if (T.post && POST_OK) {
      const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: T.samples }); rt.texture.name = 'rt-scene-hdr';
      const c = new THREE.EffectComposer(renderer, rt);
      c.addPass(new THREE.RenderPass(scene, camera));
      if (T.haze > 0 && VolumePass) { this.volume = new VolumePass(T.haze, T.steps); c.addPass(this.volume); }
      if (T.bloom) { this.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.55, 0.82); c.addPass(this.bloom); }
      this.output = new THREE.ShaderPass(OutputShader); c.addPass(this.output);
      this.composer = c;
    }
    for (const sh of planarShafts) sh.userData.planar = !this.volume;
    if (typeof syncWorldRender === 'function') syncWorldRender();
    app.ghostWarm = 'pending';   // a new pipeline can need new program variants for the preview
    resize();
  },
  dispose() {
    if (this.composer) { for (const p of this.composer.passes) if (p.dispose) p.dispose(); this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose(); }
    this.composer = this.volume = this.bloom = this.output = null;
  },
  setSize(w, h) { if (this.composer) { this.composer.setPixelRatio(renderer.getPixelRatio()); this.composer.setSize(w, h); } },
  render(dt) {
    if (this.composer) { this.output.uniforms.uTime.value = performance.now() / 1000; this.composer.render(dt); }
    else renderer.render(scene, camera);
  }
};
/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  if (POST_OK) VolumePass = class extends THREE.Pass {
    constructor(scale, steps) {
      super(); this.scale = scale; this.needsSwap = true; this.w = 0; this.h = 0;
      this.haze = new THREE.ShaderMaterial({ defines: { STEPS: steps }, uniforms: THREE.UniformsUtils.clone(HazeShader.uniforms), vertexShader: HazeShader.vertexShader, fragmentShader: HazeShader.fragmentShader, depthTest: false, depthWrite: false });
      this.comp = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.clone(HazeComposite.uniforms), vertexShader: HazeComposite.vertexShader, fragmentShader: HazeComposite.fragmentShader, depthTest: false, depthWrite: false });
      this.haze.name = 'material-haze-raymarch'; this.comp.name = 'material-haze-composite';
      const u = this.haze.uniforms; BEAMS.forEach((b, i) => { u.uBeamO.value[i] = b.o.clone(); u.uBeamD.value[i] = b.d.clone(); });
      u.uBeamCol.value.set(0x9fb2ff);
      this.qH = new THREE.FullScreenQuad(this.haze); this.qC = new THREE.FullScreenQuad(this.comp);
      this.depthMat = new THREE.MeshBasicMaterial({ colorWrite: false }); this.depthMat.name = 'material-depth-prepass';
      this.fw = this.fh = 0; this.makeTargets(1, 1, 1, 1);
    }
    /* The depth at the view's full resolution, which the composite matches each pixel against; the
       haze at the level's fraction of it, read texel by texel (nearest), never blended blind. */
    makeTargets(fw, fh, w, h) {
      if (this.depthRT) { this.depthRT.depthTexture.dispose(); this.depthRT.dispose(); this.hazeRT.dispose(); }
      // its colour is never written: one byte a pixel rather than four, now that it is full size
      this.depthRT = new THREE.WebGLRenderTarget(fw, fh, { format: THREE.RedFormat }); this.depthRT.texture.name = 'rt-haze-depth';
      this.depthRT.depthTexture = new THREE.DepthTexture(fw, fh); this.depthRT.depthTexture.type = THREE.UnsignedIntType;
      this.hazeRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }); this.hazeRT.texture.name = 'rt-haze';
      this.fw = fw; this.fh = fh; this.w = w; this.h = h; this.comp.uniforms.uHazeSize.value.set(w, h); this.comp.uniforms.uPx.value.set(1 / fw, 1 / fh);
    }
    setSize(w, h) { const sw = Math.max(1, Math.round(w * this.scale)), sh = Math.max(1, Math.round(h * this.scale)); if (w !== this.fw || h !== this.fh || sw !== this.w || sh !== this.h) this.makeTargets(w, h, sw, sh); }
    render(r, writeBuffer, readBuffer) {
      // 1. depth pre-pass: opaque geometry only; the mirror floor stands in as a plain plane
      const hide = [instruments, phantoms, fx, fragGroup].filter(o => o.visible);
      for (const o of hide) o.visible = false;
      const mirror = monoFloorMirror && monoFloorMirror.visible ? monoFloorMirror : null;
      if (mirror) { mirror.visible = false; monoFloorPlain.visible = true; }
      const auto = r.shadowMap.autoUpdate; r.shadowMap.autoUpdate = false;
      scene.overrideMaterial = this.depthMat;
      r.setRenderTarget(this.depthRT); r.clear(); r.render(scene, camera);
      scene.overrideMaterial = null; r.shadowMap.autoUpdate = auto;
      if (mirror) { mirror.visible = true; monoFloorPlain.visible = false; }
      for (const o of hide) o.visible = true;
      // 2. in-scattering
      const u = this.haze.uniforms;
      u.tDepth.value = this.depthRT.depthTexture;
      u.uProjInv.value.copy(camera.projectionMatrixInverse); u.uViewInv.value.copy(camera.matrixWorld); u.uCam.value.setFromMatrixPosition(camera.matrixWorld);
      // the key light and the window beams turn with the world rig (see setWorldYaw)
      key.getWorldPosition(u.uLPos.value); key.target.getWorldPosition(u.uLDir.value).sub(u.uLPos.value).normalize();
      BEAMS.forEach((b, i) => { u.uBeamO.value[i].copy(b.o).applyAxisAngle(Y_AXIS, worldYaw); u.uBeamD.value[i].copy(b.d).applyAxisAngle(Y_AXIS, worldYaw); });
      u.uLCos.value = Math.cos(key.angle); u.uLPen.value = Math.max(1e-4, Math.cos(key.angle * (1 - key.penumbra)) - Math.cos(key.angle));
      u.uLCol.value.copy(key.color).multiplyScalar(key.intensity);
      const sm = key.shadow.map; u.uShadowOn.value = sm ? 1 : 0; if (sm) { u.tShadow.value = sm.texture; u.uShadowM.value.copy(key.shadow.matrix); }
      u.uSpotGain.value = hazeMix.spot; u.uBeamGain.value = hazeMix.beam; u.uBeams.value = hazeMix.beam > 0.01 ? 3 : 0; u.uDensity.value = hazeMix.density;
      u.uTime.value = performance.now() / 1000;
      r.setRenderTarget(this.hazeRT); r.clear(); this.qH.render(r);
      // 3. composite over the scene, each pixel from the texels that ended at its own depth
      const c = this.comp.uniforms; c.tDiffuse.value = readBuffer.texture; c.tHaze.value = this.hazeRT.texture; c.tDepth.value = this.depthRT.depthTexture;
      c.uProjInv.value.copy(camera.projectionMatrixInverse); c.uMaxDist.value = u.uMaxDist.value;
      r.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.qC.render(r);
    }
    dispose() { this.depthRT.depthTexture.dispose(); this.depthRT.dispose(); this.hazeRT.dispose(); this.haze.dispose(); this.comp.dispose(); this.depthMat.dispose(); this.qH.dispose(); this.qC.dispose(); }
  };
  planarShafts = set.children.filter(o => o.name.startsWith('light-shaft-'));
  // the graphics levels: the device, the saved choice, the settings the first build() reads
  startQuality();
  /* A lost WebGL context (a driver reset, a GPU shared by too many tabs) is restored by the
     browser, as three.js asks it to. Images upload again by themselves, but what was drawn on the
     GPU is gone: the environment maps are baked again and the pipeline built again. */
  // the pipeline and the environment maps are let go while the context is lost, when WebGL's delete
  // calls are silent (freed after the restore, each stale object drew a console warning), and built
  // again once the browser gives the context back
  canvas.addEventListener('webglcontextlost', () => { post.dispose(); releaseEnvironments(); });
  canvas.addEventListener('webglcontextrestored', () => { bakeEnvironments(); post.build(); if (renderers.length) render(); });
}
