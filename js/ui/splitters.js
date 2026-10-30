/*
✒ Metadata
    - Title: Splitters (MONOLITH Edition - v1.3)
    - File Name: splitters.js
    - Relative Path: js/ui/splitters.js
    - Artifact Type: javascript
    - Version: 1.3.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.3.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.3.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a key a widget has already handled no
      longer also steps the game (the arrows in the Set up editor were
      rewinding the game behind it), and a drag on a game's heartbeat ends
      when the browser takes the pointer.
    - 1.2.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      level buttons it wires are now the cells of Dennis's graphics meter.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Drag handles on the dock, the side panel and the move list, with
    keyboard control and saved sizes; also the dock's scrubber and heartbeat
    pointer handling.

✒ Key Features:
    - Drag, arrow keys (Shift for bigger steps), Home or double-click to
      reset.
    - Sizes saved per viewer and restored (applyLayoutSizes).
    - ARIA values kept in step for screen readers.
    - Synaptic PV scrolling and the heartbeat's pointer scrub.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 25 of 26. Other modules import from it,
    for example:
        import { applyLayoutSizes, beatCv } from '../ui/splitters.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, ui/snackbar.js,
      game/board-ui.js, game/flow.js, ui/analyze.js, ui/analyze-view.js,
      ui/crucible.js, ui/crucible-board.js, ui/crucible-view.js,
      ui/palette.js, ui/grimoire.js, ui/nav.js, scene/pillars.js,
      scene/quality.js and app/loop.js.
    - Shared state (js/app/store.js): reads only app.started and app.busy.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, prefs, reduceMotion, savePrefs } from '../app/base.js';
import { hideSnack } from './snackbar.js';
import { deselect } from '../game/board-ui.js';
import { explore, goLive, showView, viewedPly } from '../game/flow.js';
import { an, xr } from './analyze.js';
import { clearScrub, renderAnalyze, renderSyn } from './analyze-view.js';
import { cr } from './crucible.js';
import { boardOverride, crShowBoard, crStep } from './crucible-board.js';
import { beatPlyAt, drawBeat } from './crucible-view.js';
import { closePalette, layerToggle, openPalette, pal_ } from './palette.js';
import { gr, grBack } from './grimoire.js';
import { setWorldPref } from './nav.js';
import { setPillarsPref } from '../scene/pillars.js';
import { gfxRow, quality, setGfxOption, setQualityPref } from '../scene/quality.js';
import { requestResize } from '../app/loop.js';

/* ---------- splitters: drag handles on the dock, the side panel and the move list ----------
   Dennis's request (10/22/2026): the containers get drag handles. Each splitter sets one size,
   saved per destination in prefs.ui: in Analyze the dock's height; in Crucible the heartbeat's
   height (a taller dock is a more granular heartbeat); the side panel's width; the move list's
   height. Arrow keys step 16 px (48 with Shift); Home or a double-click returns to the default. */
export let splitDrag = null;
const SPLIT_VAR = { dock: '--dock-h', beat: '--beat-h', panel: '--panel-w', moves: '--moves-h' };
const rectOf = sel => $(sel).getBoundingClientRect();
let SPLITS; // set in init()
function layoutPref(key) { const u = prefs.ui && prefs.ui[key], v = u && u[prefs.tab]; return typeof v === 'number' && isFinite(v) ? v : null; }
function syncSplitAria(S) {
  if (S.el.hidden || !S.el.offsetParent) return;
  S.el.setAttribute('aria-valuenow', String(Math.round(S.get()))); S.el.setAttribute('aria-valuemin', String(Math.round(S.min()))); S.el.setAttribute('aria-valuemax', String(Math.round(S.max())));
}
export function applyLayoutSizes() {
  const root = document.documentElement;
  for (const k in SPLIT_VAR) { const v = layoutPref(k); if (v === null) root.style.removeProperty(SPLIT_VAR[k]); else root.style.setProperty(SPLIT_VAR[k], `${Math.round(v)}px`); }
  if (layoutPref('moves') !== null) root.dataset.movesSized = ''; else delete root.dataset.movesSized;
  for (const S of Object.values(SPLITS)) syncSplitAria(S);
}
function splitSet(S, px, save) {
  const key = S.key(), v = Math.round(Math.max(S.min(), Math.min(S.max(), px)));
  prefs.ui = prefs.ui || {}; (prefs.ui[key] = prefs.ui[key] || {})[prefs.tab] = v;
  applyLayoutSizes(); if (save) savePrefs();
}
function splitReset(S) {
  const key = S.key(); if (prefs.ui && prefs.ui[key]) delete prefs.ui[key][prefs.tab];
  applyLayoutSizes(); savePrefs(); requestResize(true);
}
// Synaptic PV hold: pointer (a mouse) or keyboard focus in the grid (see renderSyn)
let synScroll; // set in init()
function synHoldSet(on) { if (an.synHold === on) return; an.synHold = on; if (!on && an.synPending && prefs.tab === 'analyze') renderSyn(); }

export let beatCv; // set in init()
let beatDrag = false;
const beatAt = e => { const p = beatPlyAt(e.clientX); if (p < 0) return; cr.ply = p; crShowBoard(); };

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  SPLITS = {
    dock: {
      el: $('#split-dock'), axis: 'y', key: () => prefs.tab === 'crucible' ? 'beat' : 'dock',
      get: () => prefs.tab === 'crucible' ? rectOf('#beat-canvas').height : rectOf('#dock').height,
      min: () => prefs.tab === 'crucible' ? 72 : 110,
      // the board keeps 240 px; in Crucible the dock's own chrome (header, padding) rides along
      max: () => { const chrome = prefs.tab === 'crucible' ? rectOf('#dock').height - rectOf('#beat-canvas').height : 0; return Math.max(SPLITS.dock.min(), rectOf('.body').height - 240 - chrome); }
    },
    panel: { el: $('#split-panel'), axis: 'x', key: () => 'panel', get: () => rectOf('.panel').width, min: () => 300, max: () => Math.max(300, Math.min(760, innerWidth - rectOf('#nav').width - 480)) },
    moves: { el: $('#split-moves'), axis: 'y', key: () => 'moves', get: () => rectOf('.moves-card').height, min: () => 110, max: () => Math.max(110, rectOf('.panel').height - 160) }
  };
  for (const S of Object.values(SPLITS)) {
    const pos = e => S.axis === 'y' ? e.clientY : e.clientX;
    S.el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return; e.preventDefault(); S.el.setPointerCapture(e.pointerId);
      splitDrag = { S, start: S.get(), p0: pos(e) }; S.el.classList.add('dragging'); document.body.classList.add('splitting', `splitting-${S.axis}`);
    });
    // each handle sits on its container's outer edge (the dock's and the move list's top, the
    // panel's left), so dragging it away from the container grows the container
    S.el.addEventListener('pointermove', e => { if (splitDrag && splitDrag.S === S) splitSet(S, splitDrag.start - (pos(e) - splitDrag.p0), false); });
    const end = () => {
      if (!splitDrag || splitDrag.S !== S) return;
      splitDrag = null; S.el.classList.remove('dragging'); document.body.classList.remove('splitting', 'splitting-x', 'splitting-y');
      savePrefs(); requestResize(true);
    };
    S.el.addEventListener('pointerup', end); S.el.addEventListener('pointercancel', end); S.el.addEventListener('lostpointercapture', end);
    S.el.addEventListener('dblclick', () => splitReset(S));
    S.el.addEventListener('keydown', e => {
      const grow = S.axis === 'y' ? { ArrowUp: 1, ArrowDown: -1 } : { ArrowLeft: 1, ArrowRight: -1 };
      if (e.key in grow) { e.preventDefault(); e.stopPropagation(); splitSet(S, S.get() + grow[e.key] * (e.shiftKey ? 48 : 16), true); requestResize(true); }
      else if (e.key === 'Home') { e.preventDefault(); e.stopPropagation(); splitReset(S); }
    });
  }
  synScroll = $('.syn-scroll');
  synScroll.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') synHoldSet(true); });
  synScroll.addEventListener('pointerleave', () => { if (!synScroll.contains(document.activeElement)) synHoldSet(false); });
  synScroll.addEventListener('focusin', () => synHoldSet(true));
  synScroll.addEventListener('focusout', e => { if (!synScroll.contains(e.relatedTarget) && !synScroll.matches(':hover')) synHoldSet(false); });
  beatCv = $('#beat-canvas'); beatCv.addEventListener('pointerdown', e => { beatDrag = true; beatCv.setPointerCapture(e.pointerId); beatAt(e); });
  beatCv.addEventListener('pointermove', e => {
    if (beatDrag) return beatAt(e);
    const p = e.pointerType === 'mouse' ? beatPlyAt(e.clientX) : -1; if (p !== cr.beatHover) { cr.beatHover = p; drawBeat(); }
  });
  // a drag ends however the pointer goes: lifted, taken by the browser (a scroll), or its capture lost
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) beatCv.addEventListener(ev, () => { beatDrag = false; });
  beatCv.addEventListener('pointerleave', () => { if (cr.beatHover !== -1) { cr.beatHover = -1; drawBeat(); } });
  beatCv.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); crStep(e.key === 'ArrowLeft' ? -1 : 1); } });
  // Settings: world, pillars and graphics
  for (const b of document.querySelectorAll('[data-world]')) b.addEventListener('click', () => setWorldPref(b.dataset.world));
  // Graphics: a level on the meter is a choice by hand (Automatic off); switching Automatic off
  // keeps the level it was at; a Fine-tune row changes one setting from what is in use
  for (const b of document.querySelectorAll('[data-quality]')) b.addEventListener('click', () => setQualityPref(b.dataset.quality));
  $('#set-gfx-auto').addEventListener('change', e => setQualityPref(e.target.checked ? 'auto' : quality.T.key));
  for (const sel of document.querySelectorAll('[data-gfx]')) sel.addEventListener('change', () => {
    const opt = gfxRow(sel.dataset.gfx).opts[+sel.value]; if (opt) setGfxOption(sel.dataset.gfx, opt[0]);
  });
  for (const b of document.querySelectorAll('[data-pillars]')) b.addEventListener('click', () => setPillarsPref(b.dataset.pillars));
  // keyboard: palette anywhere; Space holds the X-Ray; F V X toggle the layers; F U H on Play;
  // review with arrows
  // the keyup that ends a held X-Ray is spent too, or the button under the focus would be pressed
  document.addEventListener('keyup', e => { if (e.code === 'Space' && xr.held) { e.preventDefault(); xr.held = false; renderAnalyze(); } });
  window.addEventListener('blur', () => { if (xr.held) { xr.held = false; renderAnalyze(); } });
  // a mouse click leaves no focus on Go infinite or a layer toggle, so Space (the X-Ray) never
  // presses them again (a Space on Go stopped the search); keyboard focus stays where it was put
  for (const b of document.querySelectorAll('#btn-go,.layer-btn')) b.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') requestAnimationFrame(() => b.blur()); });
  // a tap on the board while the X-Ray is on chooses its square (touch has no hover to aim it)
  $('#stage').addEventListener('pointerdown', e => { xr.touch = e.pointerType === 'touch'; }, true);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); pal_.open ? closePalette() : openPalette(); return; }
    if (pal_.open) return;
    // a widget that handled the key itself (the Set up board editor, the heartbeat strip) keeps it
    if (e.defaultPrevented) return;
    /* Space for the X-Ray and / for the Grimoire's search come before the guard below: a click on
       the rail leaves the focus in it (a tablist), and the keys were lost until the next click
       elsewhere. Each keeps its own guard: a field, a term (Space opens its card) or another
       control the key belongs to. */
    if (prefs.tab === 'analyze' && e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest('input,textarea,select,summary,a,[contenteditable],[role="radiogroup"],[role="application"],[data-term]') && (!e.target.closest('button,[tabindex]') || e.target.closest('.nav-item,.pv-row'))) {
      e.preventDefault(); if (!xr.held) { xr.held = true; renderAnalyze(); } return;
    }
    if (prefs.tab === 'grimoire' && e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest('input,textarea,select,[contenteditable]')) { e.preventDefault(); if (gr.id) grBack(); $('#gr-q').focus(); return; }
    if (e.target.closest('input,textarea,select,[role="radiogroup"],[role="tablist"],[role="application"]')) return;
    if (e.key === 'Escape') { deselect(); hideSnack(); if (an.pin) clearScrub(); return; }
    /* Play: F flips the board, U takes back and H asks for a hint, each by pressing its own button,
       which knows when it may run (and what Flip does in a game that turns the board itself);
       Ctrl or ⌘ Z takes back too. On Analyze F is the Field, so these keep to Play (F also to
       Position, where the board is the same). */
    if ((prefs.tab === 'play' || prefs.tab === 'position') && !e.altKey && !e.repeat) {
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      const act = mod ? (k === 'z' && !e.shiftKey && prefs.tab === 'play' ? 'undo' : null) : k === 'f' ? 'flip' : prefs.tab === 'play' ? { u: 'undo', h: 'hint' }[k] : null;
      if (act) { e.preventDefault(); $(act === 'undo' && explore.on ? '#btn-explore-undo' : `#btn-${act}`).click(); return; }
    }
    if (prefs.tab === 'analyze' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = { f: 'field', v: 'vectors', x: 'xray' }[e.key.toLowerCase()];
      if (k && !e.repeat) { e.preventDefault(); layerToggle(k); return; }
    }
    if (prefs.tab === 'crucible' && cr.view === 'board' && boardOverride && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End')) {
      e.preventDefault(); const g = boardOverride.game;
      if (e.key === 'Home') { cr.ply = 0; crShowBoard(); } else if (e.key === 'End') { cr.ply = g.states.length - 1; crShowBoard(); } else crStep(e.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (!app.started || app.busy) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); showView(viewedPly() - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); showView(viewedPly() + 1); }
    else if (e.key === 'Home') { e.preventDefault(); showView(0); }
    else if (e.key === 'End') { e.preventDefault(); goLive(); }
  });
  // ripple state layer on Material controls
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn,.icon-btn,.seg button,.side-card,.nav-item,.preset'); if (!b || b.disabled || reduceMotion) return;
    const r = b.getBoundingClientRect(), s = document.createElement('span'); s.className = 'ripple';
    const size = Math.max(r.width, r.height); s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 520);
  });
}
