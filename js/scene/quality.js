/*
✒ Metadata
    - Title: Graphics Quality (MONOLITH Edition - v1.2)
    - File Name: quality.js
    - Relative Path: js/scene/quality.js
    - Artifact Type: javascript
    - Version: 1.2.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a saved level this browser cannot run
      is named under Graphics as kept, with Minimal drawing instead; the
      messages tell a missing post-processing script from a browser without
      WebGL 2 (needs()); GPU names read right from Firefox and Linux, Intel
      Arc and Snapdragon laptops count as integrated graphics, and older
      Radeon HD cards and virtual machines have kinds of their own;
      Automatic starts a stretch again after frames it did not measure, and
      a new choice starts its count afresh.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] —
      meterPosition(), where the needle of Dennis's graphics meter points:
      on a level, or for Custom between two, by a rough estimate of what
      the settings cost; Custom's help names the nearest level.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The graphics levels and the settings they are made of. Minimal draws
    straight to the screen and needs no WebGL 2; Low adds HDR rendering,
    multisampling and bloom; Medium adds ray-marched light, MONOLITH's
    mirror floor and 1.5× resolution; High doubles the light's resolution
    and sharpens everything; Ultra is High with finer light, a
    full-resolution mirror and 4096 px shadows. Any setting can be changed
    on its own (Custom). Automatic picks a level for the GPU it finds,
    lowers it when frames run slow and raises it when they run quick, as
    far as the device allows, never returning to a level it had to leave.

✒ Key Features:
    - GFX_LEVELS: the five levels (GFX_ORDER ranks them, lowest first).
    - SETTINGS: the seven settings (HDR rendering, resolution,
      anti-aliasing, light shafts, reflections, shadows, bloom) with their
      options, for Settings → Graphics → Fine-tune.
    - tier(): the settings in use, resolved against this browser (WebGL 2,
      multisample and texture limits), in the fields post.js and
      worlds.js read.
    - setQualityPref() and setGfxOption(): a level, Automatic or Custom; a
      setting that brings the settings back to a level selects that level.
    - Device detection: the GPU's name and kind (software, a virtual
      machine, phone or tablet, integrated, Apple silicon, an older or a
      current graphics card), capped by the memory and processor cores the
      browser reports, gives Automatic its starting level and its ceiling.
    - stepPerf(): Automatic's frame-time watch, in 3 s stretches. Two slow
      ones in a row (under 28 fps; under 40 fps in the 20 s after a rise)
      lower the level; four quick ones (over 50 fps) raise it.
    - The view follows a change of screen density (browser zoom, another
      monitor) at once.
    - describeQuality() and describeFineTune(): what Settings says;
      needs(): what the levels above Minimal lack here.
    - meterPosition(): 0 (Minimal) to 4 (Ultra), where the Settings meter's
      needle points; for Custom, a position between levels from a rough
      cost estimate (scene draws on this screen).

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/scene/post.js
    starts it from its own init() (boot step 8 of 26), once the renderer
    exists and before anything is built; js/app/loop.js gives every frame
    to stepPerf(). Other modules import from it, for example:
        import { tier, setQualityPref } from '../scene/quality.js';
        setQualityPref('high');

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/post.js and app/state.js.
    - Shared state (js/app/store.js): sets app.tierKey (the level in use,
      or 'custom').
    - Saved state: prefs.quality ('auto', a level or 'custom'), prefs.gfx
      (the Custom settings) and prefs.qualityScheme (2: the five levels;
      js/app/base.js moves an older choice across).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { prefs, savePrefs } from '../app/base.js';
import { POST_LACK, POST_OK, renderer } from './renderer.js';
import { post } from './post.js';
import { render, renderers } from '../app/state.js';

/* ---------- the levels ----------
   Dennis's request (10/23/2026): a more realistic, logical, tiered graphics system. The ladder is
   cut by what each step buys, cheapest first. HDR rendering (a half-float target, multisampled,
   with bloom) is the first thing worth paying for: gradients stop banding and the markers glow.
   Ray-marched light and the mirror floor come next: each draws the scene a second time. Then
   resolution, which multiplies everything. Medium and High are the former Balanced and High,
   unchanged; Minimal is the former Low, also unchanged. Minimal keeps the HDR-only settings of Low
   (anti-aliasing, bloom) so that turning HDR on from Minimal arrives at Low. */
const GFX_ORDER = ['minimal', 'low', 'medium', 'high', 'ultra'];
export const GFX_LEVELS = {
  minimal: { label: 'Minimal', fit: 'any device, with or without WebGL 2', brief: 'no post-processing; works without WebGL 2',
    set: { hdr: false, res: 1, aa: 2, shafts: 'planar', reflect: 0, shadow: 1024, bloom: true } },
  low: { label: 'Low', fit: 'older laptops, phones and tablets', brief: 'HDR, bloom and planar light at 1× resolution',
    set: { hdr: true, res: 1, aa: 2, shafts: 'planar', reflect: 0, shadow: 1024, bloom: true } },
  medium: { label: 'Medium', fit: 'integrated graphics and recent phones and tablets', brief: 'quarter-resolution ray-marched light, a soft mirror floor, 1.5× resolution',
    set: { hdr: true, res: 1.5, aa: 2, shafts: 'medium', reflect: 0.4, shadow: 1024, bloom: true } },
  high: { label: 'High', fit: 'recent laptops, Apple silicon and graphics cards', brief: 'half-resolution ray-marched light, a sharp mirror floor, 2× resolution',
    set: { hdr: true, res: 2, aa: 4, shafts: 'high', reflect: 0.75, shadow: 2048, bloom: true } },
  ultra: { label: 'Ultra', fit: 'graphics cards', brief: 'finer ray-marched light, a full-resolution mirror floor, 4096 px shadows',
    set: { hdr: true, res: 2, aa: 4, shafts: 'ultra', reflect: 1, shadow: 4096, bloom: true } }
};
/* The ray-marched light at each setting: the pass's share of the view's width and height, and the
   steps each ray takes (more steps, less grain in the shafts). */
const SHAFTS = {
  ultra: { haze: 0.75, steps: 56, frac: 'three-quarter' },
  high: { haze: 0.5, steps: 40, frac: 'half' },
  medium: { haze: 0.25, steps: 22, frac: 'quarter' },
  planar: { haze: 0, steps: 0, frac: '' }
};
const REFLECT_WORD = { 1: 'full-resolution', 0.75: 'sharp', 0.4: 'soft' };
/* The settings under Fine-tune, in the order shown: HDR rendering first, since anti-aliasing,
   bloom and ray-marched light need it. `hdr: true` marks a setting that does nothing without it;
   `na` is what such a setting shows then. */
export const SETTINGS = [
  { key: 'hdr', label: 'HDR rendering', opts: [[true, 'On'], [false, 'Off']] },
  { key: 'res', label: 'Resolution', opts: [[2, 'Up to 2×'], [1.5, 'Up to 1.5×'], [1, '1×'], [0.75, '0.75×']] },
  { key: 'aa', label: 'Anti-aliasing', hdr: true, na: 'The browser\'s', opts: [[4, '4× MSAA'], [2, '2× MSAA'], [0, 'Off']] },
  { key: 'shafts', label: 'Light shafts', opts: [['ultra', 'Ray-marched, ¾ res'], ['high', 'Ray-marched, ½ res'], ['medium', 'Ray-marched, ¼ res'], ['planar', 'Planar']] },
  { key: 'reflect', label: 'Reflections', opts: [[1, 'Full'], [0.75, 'Sharp'], [0.4, 'Soft'], [0, 'Off']] },
  { key: 'shadow', label: 'Shadows', opts: [[4096, '4096 px'], [2048, '2048 px'], [1024, '1024 px'], [0, 'Off']] },
  { key: 'bloom', label: 'Bloom', hdr: true, na: 'Off', opts: [[true, 'On'], [false, 'Off']] }
];
const available = k => !GFX_LEVELS[k].set.hdr || POST_OK;
const rank = k => GFX_ORDER.indexOf(k);
const fmt = x => String(+(+x).toFixed(2));
const validCustom = g => !!g && typeof g === 'object' && SETTINGS.every(S => S.opts.some(o => o[0] === g[S.key]));
/* What a set of settings draws here: without WebGL 2 there is no HDR, and without HDR there is no
   multisampling, bloom or ray-marched light. Two sets that draw alike are the same. */
function effective(s) {
  const hdr = !!s.hdr && POST_OK;
  return { hdr, res: s.res, aa: hdr ? s.aa : 0, shafts: hdr ? s.shafts : 'planar', reflect: s.reflect, shadow: s.shadow, bloom: hdr && !!s.bloom };
}
const sameLook = (a, b) => { const x = effective(a), y = effective(b); return Object.keys(x).every(k => x[k] === y[k]); };
/* The settings in use, in the fields the pipeline reads, within this browser's limits. */
function resolve(key, s) {
  const e = effective(s), sh = SHAFTS[e.shafts], caps = renderer.capabilities;
  return {
    key, label: key === 'custom' ? 'Custom' : GFX_LEVELS[key].label, set: { ...s }, eff: e,
    ratio: e.res, post: e.hdr, samples: Math.min(e.aa, caps.maxSamples || 0), haze: sh.haze, steps: sh.steps,
    reflect: e.reflect, shadow: Math.min(e.shadow, caps.maxTextureSize || 4096), bloom: e.bloom
  };
}

/* ---------- state ---------- */
export const quality = {
  T: null,            // the resolved settings in use (tier())
  device: { raw: '', name: null, kind: 'unknown', start: 'high', ceiling: 'high', why: '' },
  autoAt: 'high',     // Automatic's level
  barred: new Set(),  // levels Automatic has had to leave since it was switched on
  note: '',           // Automatic's last change, said under Graphics
  advice: ''          // a chosen level running slow, said under Graphics
};
/* shared, in app/store.js: app.tierKey */
export const tier = () => quality.T;
let P; // frame-time stretches, set in startQuality()

/* ---------- the device ----------
   Automatic starts from what the browser says about the GPU: its name where WebGL reports it,
   and failing that whether this is a phone or tablet. Each kind has a starting level and a
   ceiling one above it where the kind spans a wide range, so a strong device proves itself
   rather than being guessed at. Little memory or few cores lower the ceiling. */
const KIND = {
  webgl1: ['this browser, which has no WebGL 2', 'minimal', 'minimal'],
  nopost: ['this page, whose post-processing scripts did not load', 'minimal', 'minimal'],
  software: ['software rendering, without the graphics hardware', 'minimal', 'low'],
  'mobile-old': ['an older phone or tablet GPU', 'low', 'medium'],
  mobile: ['a phone or tablet GPU', 'medium', 'high'],
  discrete: ['a graphics card', 'high', 'ultra'],
  apple: ['Apple silicon', 'high', 'ultra'],
  mac: ['a Mac GPU the browser does not name', 'high', 'ultra'],
  'integrated-old': ['older integrated graphics', 'low', 'medium'],
  'discrete-old': ['an older graphics card', 'medium', 'high'],
  virtual: ["a virtual machine's graphics", 'low', 'medium'],
  integrated: ['integrated graphics', 'medium', 'high'],
  unknown: ['a GPU the browser does not name', 'high', 'ultra'],
  'unknown-mobile': ['a phone or tablet whose GPU the browser does not name', 'medium', 'high']
};
/* A readable name from the renderer string: ANGLE's wrapper, Firefox's "or similar", driver ids
   and details, trademarks and the graphics API removed ("ANGLE (NVIDIA, NVIDIA GeForce RTX 3070
   Direct3D11 vs_5_0 ps_5_0, D3D11)" becomes "NVIDIA GeForce RTX 3070"; Linux's "AMD Radeon RX 6800
   XT (radeonsi, navi21, LLVM 15.0.7, ...)" becomes "AMD Radeon RX 6800 XT"). ANGLE's fields are
   split on the commas outside parentheses, since a Linux name carries its own. */
function gpuName(raw) {
  if (!raw) return null;
  if (/swiftshader/i.test(raw)) return 'SwiftShader';
  if (/llvmpipe/i.test(raw)) return 'llvmpipe';
  let s = raw.trim().replace(/,? or similar$/i, '');
  const a = /^ANGLE \((.*)\)$/.exec(s);
  if (a) {
    const p = []; let depth = 0, at = 0;
    for (let i = 0; i < a[1].length; i++) {
      const ch = a[1][i];
      if (ch === '(') depth++; else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) { p.push(a[1].slice(at, i).trim()); at = i + 1; }
    }
    p.push(a[1].slice(at).trim()); s = p.length > 1 ? p[1] : p[0];
  }
  s = s.replace(/^ANGLE [\w-]+ Renderer: /, '').replace(/^Mesa /, '').replace(/\(0x[0-9a-f]+\)/gi, '').replace(/\s*\((?:TM|R)\)/gi, '')
    .replace(/\s+(?:Direct3D|OpenGL|Vulkan|Metal|vs_\d|ps_\d).*$/i, '').replace(/\/PCIe.*$/i, '')
    .replace(/(?:\s*\([^()]*\))+$/, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, 42) || null;
}
/* The kind of GPU, from its renderer string, whether HDR can run and whether this is a phone or
   tablet. Software first (it can name anything), then a virtual machine's adapter (it names the
   host's GPU through a layer that costs a great deal), old before new within a family, graphics
   cards before integrated graphics (an "AMD Radeon RX" is a card, an "AMD Radeon Graphics" is not;
   an Intel Arc with a model number, A770 or B580, is a card, the Arc in a Core Ultra is not). An
   Adreno under Direct3D is a Windows laptop's Snapdragon, not a phone's; a Radeon HD numbered with
   a D or G after it is in the processor. */
function classify(raw, hdrOK, mobile) {
  return !hdrOK ? 'webgl1'
    : /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i.test(raw) ? 'software'
    : /virgl|vmware|svga3d|virtio|parallels/i.test(raw) ? 'virtual'
    : /adreno/i.test(raw) && /direct3d|d3d1[12]/i.test(raw) ? 'integrated'
    : /adreno\s*(?:\(tm\))?\s*[3-5]\d\d\b|mali-t|mali-g(?:31|51|52|57|68|71|72)\b|powervr/i.test(raw) ? 'mobile-old'
    : /adreno|mali|immortalis|xclipse|tegra|apple a\d/i.test(raw) || (/^apple gpu$/i.test(raw) && mobile) ? 'mobile'
    : /^apple gpu$/i.test(raw) ? 'mac'
    : /nvidia|geforce|quadro|\brtx\b|radeon(?:\(tm\))? (?:rx(?! vega \d+ graphics)|pro|r[79](?! graphics)|vii)\b|\barc(?:\(tm\))?\s+(?:pro\s+)?[ab]\d{2,3}/i.test(raw) ? 'discrete'
    : /apple m\d/i.test(raw) ? 'apple'
    : /radeon hd [2-7]\d{3}\b(?![dg])/i.test(raw) ? 'discrete-old'
    : /\bhd graphics (?:[2-5]\d{3})\b|\bhd graphics(?! \d)|\bgma\b|radeon hd [2-7]\d{3}/i.test(raw) ? 'integrated-old'
    : /intel|iris|uhd|radeon|vega|amd/i.test(raw) ? 'integrated'
    : mobile ? 'unknown-mobile' : 'unknown';
}
function detect() {
  let raw = '';
  try { const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); raw = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || ''); } catch (e) {}
  const ua = navigator.userAgent || '';
  const mobile = !!(navigator.userAgentData && navigator.userAgentData.mobile) || /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const kind = POST_LACK === 'scripts' ? 'nopost' : classify(raw, POST_OK, mobile);
  let [why, start, ceiling] = KIND[kind];
  const name = gpuName(raw), mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
  if (name && !['webgl1', 'nopost', 'unknown', 'unknown-mobile', 'mac'].includes(kind)) why += ` (${name})`;
  const cap = (mem && mem <= 2) || (cores && cores <= 2) ? 'low' : mem && mem <= 4 ? 'medium' : 'ultra';
  if (rank(cap) < rank(ceiling)) { ceiling = cap; why += mem && mem <= 4 ? `, with ${mem} GB of memory` : `, with ${cores} processor cores`; }
  if (rank(start) > rank(ceiling)) start = ceiling;
  return { raw, name, kind, start, ceiling, why };
}

/* ---------- choosing ---------- */
function keyFor(q) {
  if (q === 'auto') return quality.autoAt;
  if (q === 'custom') return 'custom';
  return GFX_LEVELS[q] && available(q) ? q : 'minimal';
}
function settle() { const now = performance.now(); P.settle = now + 4000; P.t0 = now; P.acc = P.n = P.slow = P.fast = 0; }
/* Puts a level (or Custom) in use. The pipeline is rebuilt only when what it draws changes, so
   switching Automatic off at the level it chose changes nothing on screen. */
function apply(key) {
  const T = resolve(key, key === 'custom' ? prefs.gfx : GFX_LEVELS[key].set);
  const rebuild = !quality.T || !sameLook(quality.T.set, T.set);
  app.tierKey = key; quality.T = T;
  if (!renderers.length) return;   // during the boot: start() builds the pipeline
  if (rebuild) { settle(); post.build(); }
  render();
}
/* Settings → Graphics and the palette's :quality: 'auto', a level or 'custom'. Automatic starts
   over from the device's own level each time it is switched on. */
export function setQualityPref(q) {
  if (q !== 'auto' && q !== 'custom' && !(GFX_LEVELS[q] && available(q))) return;
  if (q === 'custom' && !validCustom(prefs.gfx)) prefs.gfx = { ...quality.T.set };
  prefs.quality = q; savePrefs(); quality.note = quality.advice = '';
  if (q === 'auto') { quality.barred.clear(); quality.autoAt = quality.device.start; P.trial = 0; }
  // a new choice starts its own count: stretches measured under the last one say nothing about it
  if (P) { P.slow = P.fast = 0; P.acc = P.n = 0; P.t0 = performance.now(); }
  apply(keyFor(q));
}
/* Fine-tune: one setting changed from what is in use. The result is Custom, unless it draws
   exactly as a level does, which is then selected. */
export function setGfxOption(k, v) {
  const S = SETTINGS.find(s => s.key === k);
  if (!S || !S.opts.some(o => o[0] === v)) return;
  const set = { ...quality.T.set, [k]: v };
  const level = GFX_ORDER.find(l => available(l) && sameLook(GFX_LEVELS[l].set, set));
  if (level) return setQualityPref(level);
  prefs.gfx = set; setQualityPref('custom');
}

/* ---------- Automatic ----------
   Frames are measured in stretches of 3 s, ignoring hidden tabs, frames over a second, and the
   4 s after any change (a new pipeline compiles its shaders). Two slow stretches in a row (frames
   averaging over 1/28 s) lower the level one step and bar the level left; four quick ones (under
   1/50 s) raise it one step, up to the device's ceiling and never to a barred level. For 20 s
   after a rise the bar for slow is 1/40 s, so a level that only just runs is given back quickly.
   Each level is tried at most once, and Automatic cannot swing between two. A level chosen by
   hand is never changed; a slow one is mentioned under Graphics. */
const WINDOW = 3000, SLOW = 1 / 28, TRIAL_SLOW = 1 / 40, FAST = 1 / 50, TRIAL = 20000;
const rate = s => `${(s * 1000).toFixed(0)} ms (${(1 / s).toFixed(0)} fps)`;
export function stepPerf(raw, now) {
  if (!P || document.hidden || raw <= 0 || raw > 1) return;
  // frames the loop drew without measuring (the Crucible deck, a hidden tab) break the stretch: a
  // longer wait since the last measured frame than this frame's own interval starts it again
  const gap = now - P.seen; P.seen = now;
  if (gap > raw * 1000 + 50) { P.t0 = now; P.acc = P.n = 0; return; }
  if (now < P.settle) { P.t0 = now; P.acc = P.n = 0; return; }
  P.acc += raw; P.n++;
  if (now - P.t0 < WINDOW || P.n < 5) return;
  P.avg = P.acc / P.n; P.acc = 0; P.n = 0; P.t0 = now;
  const auto = prefs.quality === 'auto', onTrial = auto && now < P.trial;
  P.slow = P.avg > (onTrial ? TRIAL_SLOW : SLOW) ? P.slow + 1 : 0;
  P.fast = P.avg < FAST ? P.fast + 1 : 0;
  if (!auto) return advise();
  const i = rank(app.tierKey), up = GFX_ORDER[i + 1];
  if (P.slow >= 2 && i > 0) {
    quality.barred.add(app.tierKey); move(GFX_ORDER[i - 1], onTrial ? 'back' : 'lowered'); P.trial = 0;
  } else if (P.fast >= 4 && up && rank(up) <= rank(quality.device.ceiling) && !quality.barred.has(up) && available(up)) {
    move(up, 'raised'); P.trial = now + TRIAL;
  }
}
function move(to, verb) {
  const from = GFX_LEVELS[app.tierKey].label, avg = P.avg;
  quality.autoAt = to;
  quality.note = verb === 'back' ? `Automatic tried ${from} and went back to ${GFX_LEVELS[to].label}: frames averaged ${rate(avg)} there.`
    : `Automatic ${verb} the graphics from ${from} to ${GFX_LEVELS[to].label}: frames averaged ${rate(avg)}.`;
  apply(to);
}
function advise() {
  const before = quality.advice;
  if (P.slow >= 2) quality.advice = app.tierKey === 'minimal'
    ? `Frames are averaging ${rate(P.avg)} even at Minimal; Fine-tune's Resolution goes lower.`
    : `Frames are averaging ${rate(P.avg)}; a lower level, or Automatic, would run more smoothly.`;
  else if (P.avg < SLOW * 0.85) quality.advice = '';
  if (quality.advice !== before && renderers.length) render();
}

/* ---------- the meter's needle ----------
   A rough cost of a set of settings on this screen, in full-resolution scene draws: the scene, the
   HDR target with its multisample resolve and output pass, bloom, the light pass (a depth draw and
   the march, by its share of the pixels and its steps), the mirror's second draw, and the shadow
   map. It ranks the five levels in order on any screen, which is all it is for: placing Custom's
   needle between the two levels it falls between (on a log scale), and naming the nearer one. */
function cost(s) {
  const e = effective(s), px = Math.min(devicePixelRatio || 1, e.res) ** 2, sh = SHAFTS[e.shafts];
  let c = px;
  if (e.hdr) c += px * (0.15 + 0.08 * e.aa);
  if (e.bloom) c += px * 0.25;
  if (sh.haze) c += px * sh.haze * sh.haze * (0.5 + 0.03 * sh.steps);
  c += px * e.reflect * e.reflect * 0.9;
  if (e.shadow) c += 0.05 + 0.1 * (e.shadow / 2048) ** 2;
  return c;
}
export function meterPosition() {
  const T = quality.T;
  if (T.key !== 'custom') return rank(T.key);
  const cs = GFX_ORDER.map(k => cost(GFX_LEVELS[k].set)), c = cost(T.set);
  if (c <= cs[0]) return 0;
  if (c >= cs[4]) return 4;
  let i = 0; while (c > cs[i + 1]) i++;
  return i + Math.log(c / cs[i]) / Math.log(cs[i + 1] / cs[i]);
}

/* ---------- what Settings says ---------- */
const listed = parts => { const s = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]; return s[0].toUpperCase() + s.slice(1) + '.'; };
function summary(T) {
  const p = [T.post ? 'HDR' : 'no post-processing'];
  p.push(T.haze ? `light ray-marched at ${SHAFTS[T.eff.shafts].frac} resolution in ${T.steps} steps` : 'planar light shafts');
  if (T.post) p.push(T.bloom ? 'bloom' : 'no bloom');
  p.push(T.reflect ? `a ${REFLECT_WORD[T.reflect] || 'mirror'} mirror floor in MONOLITH` : 'a plain floor in MONOLITH');
  p.push(T.shadow ? `${T.shadow} px shadows` : 'no shadows');
  p.push(T.post ? (T.samples ? `${T.samples}× multisampling` : 'no anti-aliasing') : 'the browser\'s anti-aliasing');
  p.push(`${fmt(Math.min(devicePixelRatio || 1, T.ratio))}× resolution`);
  return listed(p);
}
/* What the levels above Minimal lack here, as the messages name it: WebGL 2, or, where the browser
   has it, three's post-processing scripts, when they did not arrive from the CDN. */
export const needs = () => POST_LACK === 'scripts' ? 'the post-processing scripts' : 'WebGL 2';
export function describeQuality() {
  const T = quality.T, d = quality.device, out = [];
  if (GFX_LEVELS[prefs.quality] && !available(prefs.quality)) out.push(`${GFX_LEVELS[prefs.quality].label} is kept as your choice, but it needs ${needs()}, so Minimal draws instead.`);
  if (prefs.quality === 'auto') {
    if (quality.note) out.push(quality.note);
    const above = GFX_ORDER.slice(rank(T.key) + 1, rank(d.ceiling) + 1).filter(l => !quality.barred.has(l) && available(l));
    const rise = above.length ? ` It can rise as far as ${GFX_LEVELS[above[above.length - 1]].label} while frames stay quick.` : '';
    out.push(T.key === d.start ? `Automatic chose ${T.label} for ${d.why}.${rise}` : `Automatic is at ${T.label}; it began at ${GFX_LEVELS[d.start].label} for ${d.why}.${rise}`);
  } else if (T.key === 'custom') out.push(`Custom settings, from Fine-tune, about as demanding as ${GFX_LEVELS[GFX_ORDER[Math.round(meterPosition())]].label}. Choosing a level replaces them.`);
  else out.push(`${T.label} suits ${GFX_LEVELS[T.key].fit}.`);
  out.push(summary(T));
  if (quality.advice) out.push(quality.advice);
  if (!POST_OK) out.push(POST_LACK === 'scripts' ? 'The post-processing scripts did not load from the network, and every level above Minimal needs them; reloading the page may bring them.' : 'This browser has no WebGL 2, which every level above Minimal needs.');
  return out.join(' ');
}
export function describeFineTune() {
  const T = quality.T, dpr = devicePixelRatio || 1, out = [];
  out.push(`This screen is ${fmt(dpr)}×, so the view renders at ${fmt(Math.min(dpr, T.ratio))}×.`);
  if (!POST_OK) out.push(`HDR rendering needs ${POST_LACK === 'scripts' ? 'the post-processing scripts, which did not load' : 'WebGL 2, which this browser does not have'}: edges are smoothed by the browser and the light shafts are planar.`);
  else if (!T.post) out.push('Anti-aliasing, bloom and ray-marched light need HDR rendering; without it the browser smooths the edges and the light shafts are planar.');
  out.push('Resolution and light shafts cost the most; reflections draw MONOLITH a second time; shadows and bloom cost the least. A change here makes the graphics Custom, and a match with a level selects it.');
  return out.join(' ');
}
/* One Fine-tune row: its options as shown (within this browser's limits, or the one thing it can
   be when it depends on something that is off), the one in use, and whether it can change. */
export function gfxRow(k) {
  const S = SETTINGS.find(s => s.key === k), T = quality.T, caps = renderer.capabilities;
  if (k === 'hdr' && !POST_OK) return { opts: [[false, 'Off']], index: 0, disabled: true };
  if (S.hdr && !T.post) return { opts: [[null, S.na]], index: 0, disabled: true };
  if (k === 'shafts' && !T.post) return { opts: [['planar', 'Planar']], index: 0, disabled: true };
  const opts = S.opts.filter(o => (k !== 'aa' || o[0] <= (caps.maxSamples || 0)) && (k !== 'shadow' || o[0] <= (caps.maxTextureSize || 4096)));
  const v = k === 'aa' ? T.samples : k === 'shadow' ? T.shadow : k === 'hdr' ? T.post : T.set[k];
  return { opts, index: Math.max(0, opts.findIndex(o => o[0] === v)), disabled: false };
}

/* ---------- setup: run once, by js/scene/post.js's init() ---------- */
export function startQuality() {
  const now = performance.now();
  P = { acc: 0, n: 0, t0: now, seen: now, avg: 0, slow: 0, fast: 0, settle: now + 4000, trial: 0 };
  quality.device = detect();
  if (!validCustom(prefs.gfx)) prefs.gfx = null;
  if (prefs.quality === 'custom' && !prefs.gfx) prefs.quality = 'auto';
  quality.autoAt = quality.device.start;
  apply(keyFor(prefs.quality));
  // the view follows a change of screen density (browser zoom, a move to another monitor)
  const watch = () => {
    const mq = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    const on = () => { mq.removeEventListener('change', on); if (renderers.length) { post.build(); render(); } watch(); };
    mq.addEventListener('change', on);
  };
  watch();
}
