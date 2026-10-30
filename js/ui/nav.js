/*
✒ Metadata
    - Title: Navigation (MONOLITH Edition - v1.1)
    - File Name: nav.js
    - Relative Path: js/ui/nav.js
    - Artifact Type: javascript
    - Version: 1.1.2
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.1.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: changing destinations closes an open
      promotion chooser.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] —
      setQualityPref() moved to js/scene/quality.js with the rest of
      Dennis's tiered graphics levels.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Single-level navigation: the rail (a bottom bar on phones) and the tab
    switch, which also moves the world when it follows the destination.

✒ Key Features:
    - NAV and buildNav(): the destinations.
    - setTab(): shows a destination and saves it, sizes the layout for it,
      puts Analyze's searches away on the way out, and lets the world
      follow.
    - setWorldPref(): the world setting. (The graphics setting is
      setQualityPref() in js/scene/quality.js.)

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { setTab, setWorldPref } from '../ui/nav.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js, app/state.js, game/board-ui.js,
      game/lines.js, scene/worlds.js, ui/analyze.js, ui/crucible.js,
      ui/crucible-board.js, ui/grimoire.js and ui/splitters.js.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { $, prefs, savePrefs } from '../app/base.js';
import { learn, render, renderers, TIP_IDS } from '../app/state.js';
import { deselect } from '../game/board-ui.js';
import { refreshAnalysis } from '../game/lines.js';
import { desiredWorld, setWorld } from '../scene/worlds.js';
import { anStop, anSync } from './analyze.js';
import { cr, getGauntlet } from './crucible.js';
import { crLeaveBoard, crShowBoard } from './crucible-board.js';
import { grRender, termClose } from './grimoire.js';
import { applyLayoutSizes } from './splitters.js';
import { hideSnack } from './snackbar.js';

/* ---------- navigation (single level) ---------- */
export const NAV = [
  { id: 'play', label: 'Play', icon: 'M12 2a3.2 3.2 0 0 0-2 5.7C8.7 8.4 8 9.6 8 11h2l-1.2 6h6.4L14 11h2c0-1.4-.7-2.6-2-3.3A3.2 3.2 0 0 0 12 2zM6 19v3h12v-3z' },
  { id: 'analyze', label: 'Analyze', icon: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z' },
  { id: 'crucible', label: 'Crucible', icon: 'M8 2h8v2h-1v5.3l5.2 9.1A2.4 2.4 0 0 1 18.1 22H5.9a2.4 2.4 0 0 1-2.1-3.6L9 9.3V4H8zm3 2v5.8L8.6 14h6.8L13 9.8V4z' },
  { id: 'position', label: 'Position', icon: 'M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z' },
  { id: 'grimoire', label: 'Grimoire', rule: 'evenodd', icon: 'M6 2h12a2 2 0 0 1 2 2v14H7.5a1 1 0 0 0 0 2H20v2H7.5A3.5 3.5 0 0 1 4 18.5V4a2 2 0 0 1 2-2zm6 3.6-1.15 3.05L7.8 9.8l3.05 1.15L12 14l1.15-3.05L16.2 9.8l-3.05-1.15z' },
  { id: 'settings', label: 'Settings', icon: 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z' }
];
export function buildNav() {
  const nav = $('#nav');
  for (const n of NAV) {
    const b = document.createElement('button'); b.className = 'nav-item'; b.id = `nav-${n.id}`; b.type = 'button';
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', `pane-${n.id}`);
    b.innerHTML = `<span class="nav-pill"><svg viewBox="0 0 24 24" aria-hidden="true"><path${n.rule ? ` fill-rule="${n.rule}"` : ''} d="${n.icon}"/></svg></span><span class="nav-label">${n.label}</span>`;
    b.addEventListener('click', () => setTab(n.id));
    nav.appendChild(b);
  }
  nav.addEventListener('keydown', e => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    const i = NAV.findIndex(n => n.id === prefs.tab), d = (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 1;
    const n = NAV[(i + d + NAV.length) % NAV.length]; setTab(n.id); $(`#nav-${n.id}`).focus();
  });
}
export function setTab(id) {
  if (!NAV.some(n => n.id === id)) id = 'play';
  const prev = prefs.tab;
  // a panel's intro has been read once the player moves on to another panel
  if (prev !== id && TIP_IDS.includes(`${prev}-intro`)) learn(`${prev}-intro`);
  prefs.tab = id; savePrefs();
  for (const n of NAV) { const on = n.id === id, b = $(`#nav-${n.id}`); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; $(`#pane-${n.id}`).hidden = !on; }
  document.documentElement.dataset.tab = id;
  applyLayoutSizes();   // sizes are per destination, the panel's width per world
  // leaving a MONOLITH workspace puts its instruments away; a live Crucible run keeps playing
  if (prev === 'analyze' && id !== 'analyze') anStop();
  if (prev === 'crucible' && id !== 'crucible') { crLeaveBoard(); $('#board-card').hidden = true; }
  setWorld(desiredWorld(), renderers.length > 0 && prev !== id);
  if (!renderers.length) return;
  if (id === 'analyze') { deselect(); anSync(true); }
  if (id === 'crucible') { deselect(); if (cr.src === 'recorded') getGauntlet(); if (cr.view === 'board') crShowBoard(); }
  if (id === 'grimoire' && prev !== id) grRender();
  if (prev !== id) { termClose(false); hideSnack('promotion'); }
  render();
  if (id !== 'analyze' && id !== 'crucible' && prev !== id) refreshAnalysis();
}
export function setWorldPref(w) { prefs.world = w; savePrefs(); setWorld(desiredWorld(), true); applyLayoutSizes(); render(); }
