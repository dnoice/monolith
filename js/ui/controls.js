/*
✒ Metadata
    - Title: Controls (MONOLITH Edition - v1.1)
    - File Name: controls.js
    - Relative Path: js/ui/controls.js
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
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      Position tab's handlers (the FEN box, Load, Copy, the study card and
      the library) moved to js/ui/position.js with the tab's redesign,
      after Dennis found the tab awkward.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    Wires every control on the page: the rail, the Play pane, the move box,
    Analyze, Crucible and Settings, the keyboard shortcuts, and the first
    render. The Position tab wires its own (js/ui/position.js).

✒ Key Features:
    - buildNav() and the initial renders.
    - Play: opponent, side, level, start, rematch, undo, resign and the move
      box.
    - Analyze and Crucible settings, saved as they change.
    - Settings: sound, speed, tips, coordinates, the world and quality.
    - Arrow keys in radio groups, and the Hive's pointer and keyboard
      handling.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 24 of 26.

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/camera.js,
      scene/motion.js, app/sound.js, app/state.js, ui/snackbar.js,
      game/engine.js, game/board-ui.js, game/play.js, game/flow.js,
      game/lines.js, coach/notes.js, game/input.js, ui/analyze.js,
      ui/analyze-view.js, ui/crucible.js, ui/crucible-board.js,
      ui/crucible-view.js, ui/palette.js and ui/nav.js; globals Chess
      (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.setupOpen and
      app.analysisGen; reads app.started, app.orient, app.cpuThinking and
      app.calc.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, PI, prefs, savePrefs } from '../app/base.js';
import { cam } from '../scene/camera.js';
import { tween } from '../scene/motion.js';
import { ensureAudio } from '../app/sound.js';
import { applyPrefs, canMoveNow, cur, draft, match, render } from '../app/state.js';
import { snack } from './snackbar.js';
import { engine } from '../game/engine.js';
import { deselect } from '../game/board-ui.js';
import { playMove } from '../game/play.js';
import {
  exploreEnd, exploreUndo, goLive, openSetup, rematch, resign, setExplorePref, setOrientation, showView,
  startGame, undo, viewedPly
} from '../game/flow.js';
import { calculateMoves, refreshAnalysis } from '../game/lines.js';
import { coachKick, giveHint } from '../coach/notes.js';
import { parseTyped } from '../game/input.js';
import { an, anGoToggle, anSync, loadReference } from './analyze.js';
import { renderAnalyze } from './analyze-view.js';
import { cr, crCopyJson, crModel, crStartLive, crStopLive, getGauntlet } from './crucible.js';
import { crExpand, crLeaveBoard } from './crucible-board.js';
import { drawHive, hiveGeom, hiveIndexAt, renderCrucible } from './crucible-view.js';
import { layerToggle } from './palette.js';
import { buildNav } from './nav.js';

/* ---------- controls ---------- */
const optSave = (k, v) => { prefs.mo[k] = v; savePrefs(); if (an.source !== 'recorded') anSync(true); else renderAnalyze(); };
const crNum = (sel, key) => $(sel).addEventListener('change', e => { const v = +e.target.value; if (isFinite(v)) { prefs.cr[key] = v; savePrefs(); } $('#cr-run-note').className = 'help'; renderCrucible(); });
const KIND_DEFAULT = { nodes: 3000, elo: 1800, level: 4 };
let hive; // set in init()

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  buildNav();
  $('#opp-cpu').addEventListener('click', () => { draft.opponent = 'cpu'; render(); });
  $('#opp-human').addEventListener('click', () => { draft.opponent = 'human'; render(); });
  for (const s of ['w', 'b', 'r']) $(`#side-${s}`).addEventListener('click', () => {
    draft.choice = s;
    if (!app.started && s !== 'r') setOrientation(s);   // preview: the chosen pieces swing to the bottom
    render();
  });
  // arrow keys move between radio options in a group
  for (const group of document.querySelectorAll('[role="radiogroup"]')) group.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const opts = [...group.querySelectorAll('[role="radio"]:not(:disabled)')], i = opts.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault(); e.stopPropagation(); const n = opts[(i + ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1) + opts.length) % opts.length]; n.focus(); n.click();
  });
  $('#level').addEventListener('input', e => { draft.level = +e.target.value; render(); });
  $('#level-live').addEventListener('input', e => {
    match.level = draft.level = prefs.level = +e.target.value; savePrefs(); render();
  });
  $('#btn-start').addEventListener('click', () => { ensureAudio(); startGame(); });
  $('#btn-setup-cancel').addEventListener('click', () => { app.setupOpen = false; if (!app.started) return; if (app.orient !== match.human && match.opponent === 'cpu') setOrientation(match.human); render(); });
  $('#btn-new').addEventListener('click', openSetup);
  $('#btn-new-2').addEventListener('click', openSetup);
  $('#btn-rematch').addEventListener('click', rematch);
  $('#btn-undo').addEventListener('click', undo);
  $('#btn-resign').addEventListener('click', resign);
  $('#btn-hint').addEventListener('click', giveHint);
  $('#btn-live').addEventListener('click', goLive);
  $('#btn-flip').addEventListener('click', () => setOrientation(Chess.other(app.orient)));
  $('#btn-flip-2').addEventListener('click', () => setOrientation(Chess.other(app.orient)));
  $('#btn-reset-view').addEventListener('click', () => {
    const p0 = cam.phi, d0 = cam.dist, t0 = cam.theta, target = app.orient === 'w' ? 0 : PI; let dt = Math.atan2(Math.sin(target - t0), Math.cos(target - t0));
    tween(0.6, e => { cam.phi = p0 + (0.98 - p0) * e; cam.dist = d0 + (11.5 - d0) * e; cam.theta = t0 + dt * e; });
  });
  $('#btn-sound').addEventListener('click', () => { ensureAudio(); prefs.sound = !prefs.sound; savePrefs(); applyPrefs(); render(); });
  $('#set-sound').addEventListener('change', e => { ensureAudio(); prefs.sound = e.target.checked; savePrefs(); applyPrefs(); render(); });
  $('#set-legal').addEventListener('change', e => { prefs.legal = e.target.checked; savePrefs(); render(); });
  $('#set-explore').addEventListener('change', e => setExplorePref(e.target.checked));
  $('#btn-explore-undo').addEventListener('click', exploreUndo);
  $('#btn-explore-back').addEventListener('click', () => exploreEnd());
  $('#set-coords').addEventListener('change', e => { prefs.coords = e.target.checked; savePrefs(); applyPrefs(); render(); });
  for (const b of document.querySelectorAll('[data-tips]')) b.addEventListener('click', () => { prefs.tips = b.dataset.tips; savePrefs(); render(); });
  $('#btn-tips-reset').addEventListener('click', () => { prefs.learned = {}; savePrefs(); render(); snack('Tips will show again.'); });
  for (const b of document.querySelectorAll('[data-speed]')) b.addEventListener('click', () => { prefs.speed = b.dataset.speed; savePrefs(); applyPrefs(); render(); });
  // Settings' Coach comments and Evaluation bar are the Coach card's switches, so each runs theirs
  for (const [set, own] of [['#set-coach', '#coach-switch'], ['#set-eval', '#eval-switch']]) $(set).addEventListener('change', e => { const s = $(own); s.checked = e.target.checked; s.dispatchEvent(new Event('change')); });
  $('#engine-lines').open = prefs.engineOpen !== undefined ? !!prefs.engineOpen : !!prefs.evalOn;
  $('#engine-lines').addEventListener('toggle', e => { prefs.engineOpen = e.target.open; savePrefs(); });
  $('#coach-switch').addEventListener('change', e => { prefs.coach = e.target.checked; savePrefs(); render(); if (prefs.coach) coachKick(); });
  $('#eval-switch').addEventListener('change', e => {
    prefs.evalOn = e.target.checked; savePrefs();
    if (!prefs.evalOn) { app.analysisGen++; if (!app.cpuThinking && !app.calc.running) engine.abort(); }
    render(); refreshAnalysis();
  });
  $('#lines').addEventListener('change', e => { prefs.lines = Math.max(1, Math.min(5, +e.target.value || 3)); savePrefs(); });
  $('#btn-calc').addEventListener('click', calculateMoves);
  $('#nav-first').addEventListener('click', () => showView(0));
  $('#nav-prev').addEventListener('click', () => showView(viewedPly() - 1));
  $('#nav-next').addEventListener('click', () => showView(viewedPly() + 1));
  $('#nav-last').addEventListener('click', goLive);
  $('#move-form').addEventListener('submit', e => {
    e.preventDefault(); ensureAudio(); if (!canMoveNow()) return;
    const inp = $('#move-input'), r = parseTyped(cur(), inp.value);
    if (!r) return;
    if (r.error) { snack(r.error); return; }
    inp.value = ''; deselect(); playMove(r);
  });
  // Analyze controls
  for (const b of document.querySelectorAll('[data-layer]')) b.addEventListener('click', () => layerToggle(b.dataset.layer));
  $('#btn-go').addEventListener('click', anGoToggle);
  $('#opt-hash').addEventListener('change', e => optSave('hash', +e.target.value));
  $('#opt-multipv').addEventListener('change', e => optSave('multipv', +e.target.value));
  $('#opt-wdl').addEventListener('change', e => optSave('wdl', e.target.checked));
  $('#opt-limit').addEventListener('change', e => optSave('limit', +e.target.value));
  $('#opt-field').addEventListener('change', e => optSave('fieldDepth', +e.target.value));
  $('#opt-walk').addEventListener('change', e => optSave('walkDepth', +e.target.value));
  $('#btn-reference').addEventListener('click', loadReference);
  // Crucible controls
  for (const b of document.querySelectorAll('[data-crsrc]')) b.addEventListener('click', () => {
    cr.src = b.dataset.crsrc; prefs.cr.src = cr.src; savePrefs(); cr.expanded = -1; cr.sel = -1; cr.view = 'deck'; crLeaveBoard();
    if (cr.src === 'recorded') getGauntlet(); render();
  });
  for (const b of document.querySelectorAll('[data-crview]')) b.addEventListener('click', () => {
    const v = b.dataset.crview; if (v === cr.view) return;
    if (v === 'board') { const m = crModel(); const i = cr.expanded >= 0 ? cr.expanded : m ? m.games.findIndex(g => g && g.anomaly) : -1; crExpand(i >= 0 ? i : 0); }
    else { cr.view = 'deck'; crLeaveBoard(); render(); }
  });
  for (const b of document.querySelectorAll('[data-crmode]')) b.addEventListener('click', () => { prefs.cr.mode = b.dataset.crmode; savePrefs(); renderCrucible(); });
  crNum('#cfg-a-val', 'aVal'); crNum('#cfg-b-val', 'bVal'); crNum('#cfg-elo0', 'elo0'); crNum('#cfg-elo1', 'elo1'); crNum('#cfg-pairs', 'pairs'); crNum('#cfg-par', 'par'); crNum('#cfg-alpha', 'alpha');
  for (const [sel, kk, vk] of [['#cfg-a-kind', 'aKind', 'aVal'], ['#cfg-b-kind', 'bKind', 'bVal']]) $(sel).addEventListener('change', e => { prefs.cr[kk] = e.target.value; prefs.cr[vk] = KIND_DEFAULT[e.target.value] - (kk === 'bKind' && e.target.value !== 'level' ? (e.target.value === 'nodes' ? 1000 : 200) : 0); savePrefs(); renderCrucible(); });
  $('#btn-cr-run').addEventListener('click', crStartLive);
  $('#btn-cr-stop').addEventListener('click', () => crStopLive('user'));
  $('#btn-cr-copy').addEventListener('click', crCopyJson);
  hive = $('#hive');
  hive.addEventListener('pointermove', e => { const r = hive.getBoundingClientRect(), i = hiveIndexAt(e.clientX - r.left, e.clientY - r.top); if (i !== cr.hover) { cr.hover = i; hive.style.cursor = i >= 0 ? 'pointer' : ''; drawHive(); } });
  hive.addEventListener('pointerleave', () => { if (cr.hover !== -1) { cr.hover = -1; drawHive(); } });
  hive.addEventListener('click', e => { const r = hive.getBoundingClientRect(), i = hiveIndexAt(e.clientX - r.left, e.clientY - r.top); if (i >= 0) crExpand(i); });
  hive.addEventListener('keydown', e => {
    const m = crModel(); if (!m || !hiveGeom) return; const n = m.games.length;
    const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: hiveGeom.cols, ArrowUp: -hiveGeom.cols }[e.key];
    if (d) { e.preventDefault(); e.stopPropagation(); cr.sel = Math.max(0, Math.min(n - 1, (cr.sel < 0 ? 0 : cr.sel + d))); drawHive(); }
    else if (e.key === 'Enter' && cr.sel >= 0) { e.preventDefault(); crExpand(cr.sel); }
  });
}
