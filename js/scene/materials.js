/*
✒ Metadata
    - Title: Materials (MONOLITH Edition - v1.1)
    - File Name: materials.js
    - Relative Path: js/scene/materials.js
    - Artifact Type: javascript
    - Version: 1.1.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: matCopy(), a copy of a material that
      keeps its shader patch (three.js's clone() leaves it out).
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The shared materials: marble and obsidian for the pieces, the squares
    and frame, stone, brass, flame and stained glass for the cathedral, and
    the monolith slabs, with the rim-light and marble shader patches. Every
    set and piece draws from this one table.

✒ Key Features:
    - MAT: the materials by name.
    - marbleUniforms: the veining patch for marble.
    - rimUniforms: the rim light that keeps pieces readable against dark
      ground.
    - matCopy(): a copy of a material that keeps its shader patch.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 3 of 26. Other modules import from it, for
    example:
        import { MAT, marbleUniforms } from '../scene/materials.js';

✒ Other Important Information:
    - Dependencies: imports scene/renderer.js; globals three.js r147 (THREE,
      from jsDelivr).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { lin } from './renderer.js';

/* ---------- materials ---------- */
export let MAT; // set in init()
/* Obsidian carries a steel rim in MONOLITH (ruling: black is one material everywhere, obsidian
   edged in steel). A view-dependent edge term joins the emissive light; uRim is 0 in the
   cathedral and 1 in MONOLITH, and the world transition blends it. */
export const rimUniforms = { uRim: { value: 0 }, uRimColor: { value: lin(0xabb5c3) } };
/* Marble keeps its form from any angle (Dennis, 10/15/2026: the white pieces read flat). Two
   terms join the physical shading: the diffuse falls off toward the silhouette, the way matte
   stone darkens where it turns away from the eye, and a contact shade gathers near the board
   (by world height, so a lifted piece leaves it behind). The world transition sets both;
   MONOLITH's ivory under its brighter, cooler light takes the stronger setting. */
export const marbleUniforms = { uEdge: { value: 0.5 }, uContact: { value: 0.86 } };
/* A copy of a material that keeps its shader patch: three r147's clone() leaves out
   onBeforeCompile and customProgramCacheKey, so a plain copy of marble or obsidian would lose its
   form shading or steel rim and compile a stock program of its own. */
export function matCopy(m) {
  const c = m.clone(); c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; return c;
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  /* Obsidian's clearcoat is 0.22 rough, not a mirror's 0.08 (Dennis, 10/30/2026: hard white lines
     ran down the middle of the dark pieces in MONOLITH). MONOLITH's room is lit by two strip lights
     0.8 wide standing at the sides (scene/renderer.js); a turned body is curved across and straight
     along its length, so a mirror-like coat drew each strip as a line a few pixels wide down the
     whole body, wherever the view put it in line with one. At 0.22, as rough as the slate's own
     surface beneath it, the same light spreads into a broad, soft sheen and the set stays glossy.
     One value serves both worlds: the cathedral's broad window and candle panels barely change. */
  MAT = {
    marble: new THREE.MeshPhysicalMaterial({ color: 0xe9e4da, roughness: 0.36, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.3, envMapIntensity: 0.9 }),
    obsidian: new THREE.MeshPhysicalMaterial({ color: 0x15121a, roughness: 0.14, metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.22, envMapIntensity: 1.3 }),
    sqLight: new THREE.MeshStandardMaterial({ color: 0xe4dccd, roughness: 0.5, metalness: 0 }),
    sqDark: new THREE.MeshStandardMaterial({ color: 0x38333f, roughness: 0.6, metalness: 0 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2a262e, roughness: 0.7 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x332f38, roughness: 0.8 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x3c3843, roughness: 0.92 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x2b2830, roughness: 0.95 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x25222a, roughness: 0.9 }),
    glassBlue: new THREE.MeshStandardMaterial({ color: 0x4a62b8, emissive: 0x3f57b4, emissiveIntensity: 1.2, roughness: 0.9 }),
    glassRose: new THREE.MeshStandardMaterial({ color: 0x6c4aa8, emissive: 0x7a4fc0, emissiveIntensity: 1.1, roughness: 0.9 }),
    flame: new THREE.MeshBasicMaterial({ color: 0xffd48a }),
    brass: new THREE.MeshStandardMaterial({ color: 0x8a6a2c, roughness: 0.4, metalness: 0.8 })
  };
  MAT.marble.name = 'material-marble'; MAT.obsidian.name = 'material-obsidian';
  // The environment map gives the pieces their sheen; on the board it washed the squares toward
  // grey, so the board, frame and plinth take only a trace of it.
  for (const k of ['sqLight', 'sqDark', 'frame', 'plinth']) MAT[k].envMapIntensity = 0.25;
  MAT.obsidian.onBeforeCompile = sh => {
    sh.uniforms.uRim = rimUniforms.uRim; sh.uniforms.uRimColor = rimUniforms.uRimColor;
    sh.fragmentShader = 'uniform float uRim;\nuniform vec3 uRimColor;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += uRimColor * uRim * 1.2 * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.6);');
  };
  MAT.obsidian.customProgramCacheKey = () => 'obsidian-steel-rim';
  MAT.marble.onBeforeCompile = sh => {
    sh.uniforms.uEdge = marbleUniforms.uEdge; sh.uniforms.uContact = marbleUniforms.uContact;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vMarbleY;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n\tvMarbleY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = 'uniform float uEdge;\nuniform float uContact;\nvarying float vMarbleY;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n\tfloat mTurn = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.0);\n\tdiffuseColor.rgb *= (1.0 - uEdge * 0.42 * mTurn) * mix(uContact, 1.0, smoothstep(0.0, 0.3, vMarbleY));');
  };
  MAT.marble.customProgramCacheKey = () => 'marble-form-shade';
}
