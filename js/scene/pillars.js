/*
✒ Metadata
    - Title: MONOLITH Pillars (MONOLITH Edition - v1.0)
    - File Name: pillars.js
    - Relative Path: js/scene/pillars.js
    - Artifact Type: javascript
    - Version: 1.0.4
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.4 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Reports
      the pillar models under way, loaded or failed to the loading screen's
      meter Dennis asked for, the first time a style loads.
    - 1.0.3 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      models moved with the project's assets, as Dennis asked: they are
      fetched from assets/models/.
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Puts Dennis's glTF models (assets/models/, documented in
    assets/models/MANIFEST.md) on MONOLITH's three pillar places. A style
    names a model per place: Monoliths (stele, rift, spire, each made for
    its place), Classic (a Solomonic column between a Doric and a Tuscan) or
    Modern (a Prism between a Halo and a Fin). The built pillars stay in the
    scene as the fallback: a place swaps to its model only once the file has
    loaded, and keeps the built pillar if it cannot.

✒ Key Features:
    - setPillarsPref(style): saves the choice and swaps every place to the
      style's models, loading each file once and sharing it between places.
    - Placement from the manifest: the origin at the bottom centre, sunk
      0.15 (times the scale) into the floor as the built bases are, the
      front toward the board; a column scaled evenly to its place's
      height.
    - The models' own materials kept (graphite satin, brushed steel, cyan
      glow), with the environment strength MONOLITH's graphite has, and
      shadows cast and received like the built parts.
    - pillars.status: 'loading', 'ready' or 'failed' (with the files that
      failed), which Settings reports.
    - A newer choice wins: a file that arrives after the style changed is
      kept for later but not shown.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/scene/sets.js
    starts it once its pillar places exist (startPillars(), shortly after
    the boot so the files do not compete with it); Settings and the palette
    call setPillarsPref(). For example:
        import { pillars, setPillarsPref } from '../scene/pillars.js';
        setPillarsPref('classic');

✒ Other Important Information:
    - Dependencies: imports app/base.js, app/state.js and scene/sets.js;
      globals three.js r147 (THREE) and its GLTFLoader (examples/js, from
      jsDelivr).
    - Files: assets/models/{monolith-stele, monolith-rift, monolith-spire,
      column-solomonic, column-doric, column-tuscan, column-prism,
      column-halo, column-fin}.glb, fetched relative to the page; where a
      host serves no .glb, the same bytes as .glb.json
      (tools/pack-models.mjs). The .blend files are not loaded.
    - Saved state: prefs.pillars ('monoliths', 'classic' or 'modern').
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s); ES modules and the models do not load from file://.
---------
*/
import { prefs, savePrefs } from '../app/base.js';
import { render } from '../app/state.js';
import { monoSlots } from './sets.js';
import { bootStep } from '../ui/boot-screen.js';

/* ---------- MONOLITH's pillars: Dennis's models ----------
   Dennis's request (10/23/2026): swap the built pillars for the ones he made in Blender. He made
   nine (assets/models/MANIFEST.md): three monoliths, one for each place at its exact size, and six
   columns built for the centre place, three classic and three modern, which scale evenly into
   the side places. A style names a model for each place and, as the monoliths do, puts three
   different designs on the three places: the newest, one solid mesh each (the Solomonic, the
   Prism), in the centre where it is seen most. */
const PILLAR_STYLES = {
  monoliths: { label: 'Monoliths', models: { '01-centre': 'monolith-stele', '02-left': 'monolith-rift', '03-right': 'monolith-spire' } },
  classic: { label: 'Classic', models: { '01-centre': 'column-solomonic', '02-left': 'column-doric', '03-right': 'column-tuscan' } },
  modern: { label: 'Modern', models: { '01-centre': 'column-prism', '02-left': 'column-halo', '03-right': 'column-fin' } }
};
const COLUMN_HEIGHT = 10.4;   // every column is built at the centre place's height
const SINK = 0.15;            // and stands this far into the floor, as the built bases do
export const pillars = { style: 'monoliths', status: 'idle', failed: [] };
const files = new Map();      // model name → Promise of its prepared scene
let loader = null, gen = 0, started = false;
/* The same model, two ways to fetch it: the .glb itself (Dennis's folder, any static server), or
   .glb.json, the same bytes as base64 in JSON, for a host that serves no .glb (the published page;
   tools/pack-models.mjs writes them). Whichever answers first is tried first after that, so each
   host asks for what it has. */
let formats = ['glb', 'glb.json'];
async function fetchGlb(name) {
  let last = null;
  for (const fmt of formats) {
    try {
      const r = await fetch(`assets/models/${name}.${fmt}`);
      if (!r.ok) throw new Error(`assets/models/${name}.${fmt}: ${r.status}`);
      const buf = fmt === 'glb' ? await r.arrayBuffer() : Uint8Array.from(atob((await r.json()).glb), c => c.charCodeAt(0)).buffer;
      if (formats[0] !== fmt) formats = [fmt, ...formats.filter(f => f !== fmt)];
      return buf;
    } catch (e) { last = e; }
  }
  throw last;
}
/* One file, loaded once. Its meshes cast and receive shadows like the built parts, and the
   graphite takes the environment strength MONOLITH's own graphite has (glTF cannot carry it). */
function loadModel(name) {
  if (files.has(name)) return files.get(name);
  const p = (async () => {
    if (!THREE.GLTFLoader) throw new Error('GLTFLoader is not loaded');
    loader = loader || new THREE.GLTFLoader();
    const buf = await fetchGlb(name);
    const gltf = await new Promise((resolve, reject) => loader.parse(buf, 'assets/models/', resolve, reject));
    const root = gltf.scene.getObjectByName(name) || gltf.scene;
    root.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      if (o.material && o.material.name === 'graphite-satin') o.material.envMapIntensity = 1.2;
    });
    return root;
  })();
  files.set(name, p);
  // a failure is reported through pillars.status, and forgotten, so choosing the style again
  // fetches the file again (a dropped connection is not the last word)
  p.catch(() => { if (files.get(name) === p) files.delete(name); });
  return p;
}
/* Show a place's model, or its built pillar when it has none. */
function showModel(slot, model) {
  if (slot.model) { slot.g.remove(slot.model); slot.model = null; }
  for (const part of slot.parts) part.visible = !model;
  if (!model) return;
  slot.g.add(model); slot.model = model;
}
function setPillars(style) {
  if (!PILLAR_STYLES[style]) style = 'monoliths';
  pillars.style = style;
  if (!monoSlots.length) return;   // before the set exists: startPillars() applies it
  const g = ++gen, S = PILLAR_STYLES[style].models;
  pillars.status = 'loading'; pillars.failed = []; bootStep('models', 'on');   // the loading screen's meter, the first time
  const jobs = monoSlots.map(slot => {
    const name = S[slot.n];
    return loadModel(name).then(root => {
      if (g !== gen) return;
      const m = root.clone(), scale = name.startsWith('column-') ? slot.h / COLUMN_HEIGHT : 1;
      m.name = `pillar-${slot.n}-${name}`; m.scale.setScalar(scale); m.position.set(0, -SINK * scale, 0);
      showModel(slot, m);
    }, () => {
      if (g !== gen) return;
      showModel(slot, null);
      if (!pillars.failed.includes(name)) pillars.failed.push(name);
    });
  });
  Promise.all(jobs).then(() => { if (g !== gen) return; pillars.status = pillars.failed.length ? 'failed' : 'ready'; bootStep('models', pillars.failed.length ? 'no' : 'ok'); render(); });
}
/* The Settings choice (and the palette's :pillars): saved, applied, and the panels redrawn. */
export function setPillarsPref(style) {
  if (!PILLAR_STYLES[style]) return;
  prefs.pillars = style; savePrefs(); setPillars(style); render();
}
/* Called by the set once its places exist: the saved style, after the boot has had its turn. */
export function startPillars() {
  if (started) return; started = true;
  pillars.style = PILLAR_STYLES[prefs.pillars] ? prefs.pillars : 'monoliths';
  setTimeout(() => setPillars(pillars.style), 1200);
}
