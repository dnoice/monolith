/*
✒ Metadata
    - Title: Resize And Loop (MONOLITH Edition - v1.3)
    - File Name: loop.js
    - Relative Path: js/app/loop.js
    - Artifact Type: javascript
    - Version: 1.3.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.3.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
      resize refits the camera to the stage (fitCamera()), so the board
      stays whole as the window or the panel changes size.
    - 1.2.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — While the
      loading screen sets its pieces over a board already drawn, the loop
      draws nothing under it, so the screen's animation has the frames;
      drawing resumes as the screen lifts.
    - 1.1.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The first
      frame drawn after start() lifts the loading screen Dennis asked for;
      under the Crucible deck, which leaves nothing to draw, the loop's
      first pass does.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The frame loop and resizing. Resizes are coalesced to one per frame, and
    while a splitter is dragged the 3D view waits until the drag pauses; the
    loop steps every animation, the camera, the telemetry and
    post-processing each frame.

✒ Key Features:
    - resize() and requestResize(): renderer, camera, post-processing and
      mirror sizes, and the camera's fit to the stage (fitCamera() in
      js/scene/camera.js).
    - Canvas redraws for Analyze and the Crucible after a resize, coalesced.
    - loop(): tweens, idle motion, fragments, arrows, motes, the field,
      vectors, the X-Ray, phantoms, candles, the check pulse, the camera and
      the telemetry, and each frame's time for Automatic graphics.
    - The Crucible deck covers the stage, so the loop skips drawing under
      it.
    - The first frame after start() tells the loading screen the board has
      drawn (js/ui/boot-screen.js); under the Crucible deck, the loop's
      first pass does. While the screen then covers the board, the loop
      draws nothing.
    - Starts the page through the viewer's hot-reload hook when there is
      one.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 26 of 26. Other modules import from it,
    for example:
        import { requestResize, resize } from '../app/loop.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/sets.js, scene/board.js, scene/instruments.js,
      scene/phantoms.js, scene/post.js, scene/quality.js, scene/camera.js,
      scene/motion.js, app/state.js, game/board-ui.js, game/ceremony.js,
      scene/worlds.js, ui/analyze.js, ui/analyze-view.js, ui/crucible.js,
      ui/crucible-view.js, ui/telemetry.js, ui/splitters.js,
      app/snapshot.js and ui/boot-screen.js; globals Chess
      (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.shake; reads app.fieldOn and
      app.ghostWarm.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from './store.js';
import { $, prefs } from './base.js';
import { camera, renderer, stage } from '../scene/renderer.js';
import { candleLights } from '../scene/sets.js';
import { HL, stepFragments } from '../scene/board.js';
import { stepField, stepVectors, stepXray, xrState } from '../scene/instruments.js';
import { holoClock, stepPreview, warmGhostPrograms } from '../scene/phantoms.js';
import { post } from '../scene/post.js';
import { stepPerf } from '../scene/quality.js';
import { fitCamera, updateCamera } from '../scene/camera.js';
import { stepIdle, stepTweens } from '../scene/motion.js';
import { renderers } from './state.js';
import { boardState, stepArrows } from '../game/board-ui.js';
import { stepMotes } from '../game/ceremony.js';
import { cathedralWeight, resizeMirror, worldSettled } from '../scene/worlds.js';
import { an } from '../ui/analyze.js';
import { placeXrayChip, renderAnalyze } from '../ui/analyze-view.js';
import { cr } from '../ui/crucible.js';
import { renderCrucible } from '../ui/crucible-view.js';
import { telemetry, updateTelemetry } from '../ui/telemetry.js';
import { splitDrag } from '../ui/splitters.js';
import { start } from './snapshot.js';
import { bootCovering, bootReady } from '../ui/boot-screen.js';

/* ---------- resize + loop ---------- */
export function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); fitCamera();
  post.setSize(w, h); resizeMirror();
  if (renderers.length && (prefs.tab === 'analyze' || prefs.tab === 'crucible')) { const hz = $('#wdl-halo'); if (hz) hz.dataset.h = ''; scheduleResizeDraw(); }
}
let resizeDrawT = 0;
function scheduleResizeDraw() { clearTimeout(resizeDrawT); resizeDrawT = setTimeout(() => { if (prefs.tab === 'analyze') { an.ver++; renderAnalyze(); } else if (prefs.tab === 'crucible') renderCrucible(); }, 120); }
/* Resizes are coalesced to one per frame. While a splitter is being dragged the 3D view is left
   stretched and rendered at its new size once the drag pauses (120 ms) or ends, since a resize
   reallocates the HDR, haze and mirror targets. */
let resizeRaf = 0, resizeIdle = 0;
export function requestResize(now = false) {
  clearTimeout(resizeIdle);
  if (now) { if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = 0; } resize(); return; }
  if (splitDrag) { resizeIdle = setTimeout(resize, 120); return; }
  if (!resizeRaf) resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; resize(); });
}
let last; // set in init()
let checkOf = null, inCheck = false;
let begun = false;   // start() has run: the first frame after it lifts the loading screen
function loop(now) {
  requestAnimationFrame(loop);
  // a rAF timestamp can predate the previous performance.now(), so the interval never goes negative
  const raw = Math.max(0, (now - last) / 1000), dt = Math.min(0.05, raw); last = now; const t = now / 1000;
  // the loading screen is setting its pieces over a board already drawn: nothing to draw under it,
  // and the screen's own animation gets the frames
  if (bootCovering()) return;
  stepTweens(now); stepIdle(t); stepFragments(dt); stepArrows(t); stepMotes(dt);
  stepField(dt, app.fieldOn && prefs.tab === 'analyze'); stepVectors(t); stepXray(dt, t); stepPreview(dt); holoClock.value = t;
  if (app.shake > 0) app.shake = Math.max(0, app.shake - dt * 3.2);
  for (const c of candleLights) { const f = 0.85 + 0.15 * Math.sin(t * 9 + c.phase) * Math.sin(t * 3.3 + c.phase * 2); c.light.intensity = f * cathedralWeight; c.flame.scale.setScalar(0.9 + 0.2 * f); c.flame.scale.y = 1.6 * (0.9 + 0.2 * f); }
  const st = boardState();
  if (st !== checkOf) { checkOf = st; inCheck = Chess.inCheck(st); }   // a position's check, worked out once
  if (inCheck) HL.check.opacity = 0.32 + 0.2 * Math.sin(t * 5);
  updateCamera(t);
  if (!$('#xray-chip').hidden && xrState.sq >= 0) placeXrayChip(xrState.sq);
  if (raw > 0) { telemetry.frames.push(raw * 1000); if (telemetry.frames.length > 90) telemetry.frames.shift(); }
  updateTelemetry(now);
  // the Crucible deck covers the stage completely: nothing to draw underneath
  if (prefs.tab === 'crucible' && cr.view === 'deck') { if (begun) bootReady(); return; }
  stepPerf(raw, now);
  // warmed in the world the previews will be drawn in, not halfway through the change to it
  if (app.ghostWarm === 'pending' && prefs.tab === 'analyze' && worldSettled()) warmGhostPrograms();
  post.render(dt);
  if (begun) bootReady();   // once only; later calls return at once
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  new ResizeObserver(() => requestResize()).observe(stage);
  new ResizeObserver(() => { if (prefs.tab === 'crucible' && !$('#deck').hidden) scheduleResizeDraw(); }).observe($('#deck'));
  last = performance.now();
  requestAnimationFrame(loop);
  const go = data => { start(data); begun = true; };
  window.claude?.hot?.ready ? window.claude.hot.ready(go) : go(window.claude?.hot?.data ?? {});
}
