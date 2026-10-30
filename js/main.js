/*
✒ Metadata
    - Title: Boot (MONOLITH Edition - v1.2)
    - File Name: main.js
    - Relative Path: js/main.js
    - Artifact Type: javascript
    - Version: 1.2.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The boot
      reports the board built to the loading screen's meter Dennis asked
      for, and the 8 s fallback says no frame was drawn (bootReady(false)).
    - 1.2.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The boot
      waits for the loading screen to write its M (1.7 s from the first
      paint, or less when a key or a click skips it), so its long tasks fall
      in the screen's rest rather than in its motion, for the animated
      screen Dennis asked for.
    - 1.1.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      loading screen Dennis asked for, around his emblem: the boot marks it
      as started, takes it away at once when a step halts (no WebGL) or
      throws, and uncovers the page 8 s after a boot that has drawn no
      frame.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The page's entry point: it imports the modules that have setup work and
    runs their init() functions in a fixed order, the same order in which
    the single-file page ran that code. A missing WebGL stops the boot
    cleanly.

✒ Key Features:
    - One place for the boot order: every module's top level holds only
      definitions, so importing never runs anything.
    - BootHalt: thrown by the renderer when WebGL is missing; the page shows
      its WebGL notice and nothing after it runs.
    - Modules without setup are not listed; they load through the modules
      that import them.
    - The loading screen (js/ui/boot-screen.js): the boot is handed to it
      and runs once the screen has written its M; the screen is taken away
      at once when the boot halts or fails, and uncovered 8 s after a boot
      that has drawn no frame.

✒ Usage Instructions:
    Loaded by index.html as <script type="module" src="js/main.js">, after
    the classic scripts. To add a module with setup work, export an init()
    from it and add it to BOOT where its setup belongs in the order.

✒ Other Important Information:
    - Dependencies: every module with an init(), and ui/boot-screen.js;
      globals from the classic scripts through them.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s); ES modules do not load from file://.
---------
*/
import { BootHalt } from './app/base.js';
import { bootReady, bootStarted, bootStep, bootStop } from './ui/boot-screen.js';
import * as base from './app/base.js';
import * as renderer from './scene/renderer.js';
import * as materials from './scene/materials.js';
import * as sets from './scene/sets.js';
import * as board from './scene/board.js';
import * as instruments from './scene/instruments.js';
import * as phantoms from './scene/phantoms.js';
import * as post from './scene/post.js';
import * as camera from './scene/camera.js';
import * as state from './app/state.js';
import * as engine from './game/engine.js';
import * as boardUi from './game/board-ui.js';
import * as ceremony from './game/ceremony.js';
import * as lines from './game/lines.js';
import * as notes from './coach/notes.js';
import * as worlds from './scene/worlds.js';
import * as crucible from './ui/crucible.js';
import * as crucibleView from './ui/crucible-view.js';
import * as palette from './ui/palette.js';
import * as telemetry from './ui/telemetry.js';
import * as grimoire from './ui/grimoire.js';
import * as position from './ui/position.js';
import * as panels from './ui/panels.js';
import * as controls from './ui/controls.js';
import * as splitters from './ui/splitters.js';
import * as loop from './app/loop.js';

/* The boot: each step is a module's init(), in the order the single-file page ran the same code.
   A module's top level holds only definitions, so importing never does anything by itself and
   the order lives here alone. A step that cannot go on (no WebGL) throws BootHalt, and nothing
   after it runs. */
const BOOT = [
  base,         // the release on screen, reduced motion, the saved preferences
  renderer,     // WebGL renderer, scene, camera, environment maps
  materials,    // the material table (MAT)
  sets,         // the world rig, the cathedral and MONOLITH sets
  board,        // the board, highlights, labels, pieces and fragments
  instruments,  // the field, vectors and the Tactical X-Ray
  phantoms,     // the phantom groups
  post,         // the volumetric light pass, where post-processing runs
  camera,       // orbit, zoom and clicks on the stage
  state,        // the match and draft settings from the preferences
  engine,       // the engine that plays, and what follows when it is ready
  boardUi,      // castling lanes, arrows and the hint mark
  ceremony,     // the effects group and the mote texture
  lines,        // the candidate-move state
  notes,        // the Coach's state
  worlds,       // the cathedral's marker palette to begin with
  crucible,     // the Crucible's source, recorded or live
  crucibleView, // the heartbeat strip colours
  palette,      // the palette's input and keys
  telemetry,    // the GPU name, where WebGL reports it
  grimoire,     // Grimoire categories and term links
  position,     // the Position tab: its views, editor and renderer
  panels,       // the panel renderers
  controls,     // every control's handlers, then the first render
  splitters,    // splitters and the dock's pointer handling
  loop,         // resize observers, the frame loop, then start()
];
/* The loading screen (js/ui/boot-screen.js) plays while the page starts. The boot runs once the
   screen has written its M, so the boot's long tasks fall in the screen's pause rather than in its
   motion; the screen then sets its pieces once the first frame is drawn. A boot that halts or fails
   takes the screen away at once. One that runs reports the board built to the screen's meter, and
   if it draws no frame within 8 s of finishing (a renderer that throws on every frame) it uncovers
   the page anyway, saying so on the meter, so it never stays hidden behind the screen; the 8 s
   start once the boot is done, since a slow device can spend seconds in it. */
function boot() {
  try { for (const step of BOOT) step.init(); bootStep('board'); setTimeout(() => bootReady(false), 8000); }
  catch (e) { bootStop(); if (!(e instanceof BootHalt)) throw e; }
}
bootStarted(boot);
