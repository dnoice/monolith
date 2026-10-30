/*
✒ Metadata
    - Title: Command Palette (MONOLITH Edition - v1.4)
    - File Name: palette.js
    - Relative Path: js/ui/palette.js
    - Artifact Type: javascript
    - Version: 1.4.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.4.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — :version
      names the app MONOLITH, the name Dennis chose.
    - 1.4.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: :define with no exact term searches
      the Grimoire; :calc and :sprt start say why they cannot run; an empty
      list names no active option; and the graphics levels say what they
      lack here.
    - 1.3.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] —
      :quality ultra, high, medium, low and minimal, for Dennis's five
      graphics levels, with auto; :quality balanced is now medium.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The Command Palette: glass, one at a time, Ctrl K (⌘K on Apple
    keyboards). Commands are typed with a colon; a command that cannot run
    right now stays listed with the reason.

✒ Key Features:
    - COMMANDS: every command, with when it can run.
    - Matching by prefix, then substring, then subsequence, then
      description.
    - Groups, arrow-key navigation and single-key shortcuts for the MONOLITH
      layers (F, V, X).
    - A FEN pasted into the palette loads the position.
    - layerToggle(): a MONOLITH layer on or off, opening Analyze first.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 19 of 26. Other modules import from it,
    for example:
        import { layerToggle, closePalette } from '../ui/palette.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      app/sound.js, app/state.js, ui/snackbar.js, game/engine.js,
      game/play.js, game/flow.js, game/lines.js, coach/notes.js,
      ui/analyze.js, ui/analyze-view.js, ui/crucible.js,
      ui/crucible-board.js, ui/grimoire.js, ui/nav.js, ui/position.js,
      scene/pillars.js and scene/quality.js; globals Chess
      (js/core/chess.js).
    - Shared state (js/app/store.js): reads app.orient, app.hint,
      app.started and app.busy.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, APP_DATE, APP_VERSION, prefs, savePrefs } from '../app/base.js';
import { POST_OK } from '../scene/renderer.js';
import { GFX_LEVELS, needs, setQualityPref } from '../scene/quality.js';
import { ensureAudio } from '../app/sound.js';
import { applyPrefs, canMoveNow, game, render, shown } from '../app/state.js';
import { hideSnack, snack } from './snackbar.js';
import { engine } from '../game/engine.js';
import { resultFor } from '../game/play.js';
import { explore, exploreEnd, openSetup, setAutoFlip, setExplorePref, setOrientation, undo } from '../game/flow.js';
import { copyPgn, downloadPgn, openPgnLoad } from '../game/pgn.js';
import { calculateMoves, refreshAnalysis } from '../game/lines.js';
import { coachKick, coachOn, giveHint } from '../coach/notes.js';
import { an, anGoToggle, anStopSearch, loadReference, xr } from './analyze.js';
import { renderAnalyze } from './analyze-view.js';
import { cr, crConfigError, crStartLive, crStopLive } from './crucible.js';
import { boardOverride, crLeaveBoard } from './crucible-board.js';
import { grFind, grOpen, grSearch } from './grimoire.js';
import { setTab, setWorldPref } from './nav.js';
import { openInSetup, setPosView } from './position.js';
import { setPillarsPref } from '../scene/pillars.js';

/* =====================================================================================
   Command Palette: glass, one at a time, Ctrl K (⌘K on Apple keyboards). Commands are typed
   with a colon; matching is by prefix, then substring, then subsequence, then description.
   A command that cannot run right now stays listed with the reason, and Enter on it says so.
   ===================================================================================== */
let IS_MAC; // set in init()
const yes = () => true;
export function layerToggle(k) {
  if (prefs.tab !== 'analyze') setTab('analyze');
  if (k === 'xray') xr.sticky = !xr.sticky; else { prefs.mo[k] = !prefs.mo[k]; savePrefs(); }
  renderAnalyze();
}
/* A graphics level's command, read from js/scene/quality.js only when the palette asks (never at
   load, when that module may not have run yet). */
function gfxDesc(k) { return `Graphics: ${GFX_LEVELS[k].label}, ${GFX_LEVELS[k].brief}`; }
function gfxWhen(k) { return !GFX_LEVELS[k].set.hdr || POST_OK || `Needs ${needs()}`; }
const COMMANDS = [
  { cmd: ':go', desc: 'Go infinite on the analysed position', run: anGoToggle, when: () => an.status !== 'over' || 'The game is over in this position' },
  { cmd: ':stop', desc: 'Stop the analysis search', run: anStopSearch, when: () => an.status === 'searching' || 'No search is running' },
  { cmd: ':field', desc: 'Root move-value field on or off', run: () => layerToggle('field'), when: yes },
  { cmd: ':vectors', desc: 'Ballistic vectors on or off', run: () => layerToggle('vectors'), when: yes },
  { cmd: ':xray', desc: 'Tactical X-Ray on or off (or hold Space)', run: () => layerToggle('xray'), when: yes },
  { cmd: ':reference', desc: 'Kasparov – Topalov 1999 with its recorded Stockfish 19 run', run: loadReference, when: () => an.recState !== 'error' || 'data/analyze.json is not reachable' },
  { cmd: ':sprt start', desc: 'Start a live Crucible run with the settings in Crucible', run: () => { setTab('crucible'); crStartLive(); }, when: () => cr.live && cr.live.running ? 'A live run is already playing' : crConfigError() || true },
  { cmd: ':sprt stop', desc: 'Stop the live Crucible run', run: () => crStopLive('user'), when: () => !!(cr.live && cr.live.running) || 'No live run is playing' },
  { cmd: ':recorded', desc: 'Open the recorded gauntlet in Crucible', run: () => { cr.src = 'recorded'; prefs.cr.src = 'recorded'; savePrefs(); cr.view = 'deck'; crLeaveBoard(); setTab('crucible'); render(); }, when: yes },
  { cmd: ':new', desc: 'New game setup', run: openSetup, when: yes },
  { cmd: ':flip', desc: 'Invert the board', run: () => setOrientation(Chess.other(app.orient)), when: yes },
  { cmd: ':fen', arg: true, desc: 'Paste a board state after the command to load it, or open the Position panel', run: arg => palFen(arg), when: yes },
  { cmd: ':copy fen', desc: 'Copy the FEN of the position shown', run: () => { try { navigator.clipboard.writeText(Chess.fen(boardOverride ? boardOverride.state : shown())).then(() => snack('FEN copied to the clipboard.'), () => snack('The clipboard is blocked here.')); } catch (e) { snack('The clipboard is blocked here.'); } }, when: yes },
  { cmd: ':hint', desc: 'A hint on your turn, one step at a time: a nudge, the piece, the move', run: () => { setTab('play'); giveHint(); }, when: () => (app.hint && !app.hint.pending) || (canMoveNow() && engine.ready) || (!app.started ? 'Start a game first' : !engine.ready ? 'The engine is still loading' : 'Not your turn at the live position') },
  { cmd: ':undo', desc: 'Take back the last move (yours and the reply)', run: undo, when: () => (app.started && game.states.length > 1 && !app.busy) || 'Nothing to undo' },
  { cmd: ':calc', desc: 'Calculate candidate moves (Play, Coach)', run: () => { setTab('play'); calculateMoves(); }, when: () => (engine.ready && app.started && !resultFor(shown()) && !app.cpuThinking && !app.busy && !app.calc.running) || (!app.started ? 'Start a game first' : app.cpuThinking ? 'The computer is thinking' : app.calc.running ? 'Already calculating' : app.busy ? 'A move is still being played' : 'Not available in this position') },
  { cmd: ':coach', desc: 'Coach comments on or off (verdicts, threats, tips)', run: () => { prefs.coach = !coachOn(); savePrefs(); render(); if (prefs.coach) coachKick(); snack(prefs.coach ? 'Coach comments: on.' : 'Coach comments: off.'); }, when: yes },
  { cmd: ':eval', desc: 'Evaluation bar on or off', run: () => { prefs.evalOn = !prefs.evalOn; savePrefs(); render(); refreshAnalysis(); }, when: () => engine.ready || 'The engine is still loading' },
  { cmd: ':world auto', desc: 'World follows the destination (MONOLITH for Analyze and Crucible)', run: () => setWorldPref('auto'), when: yes },
  { cmd: ':world cathedral', desc: 'Stay in the cathedral', run: () => setWorldPref('cathedral'), when: yes },
  { cmd: ':world monolith', desc: 'Stay in MONOLITH', run: () => setWorldPref('monolith'), when: yes },
  { cmd: ':pillars monoliths', desc: 'MONOLITH pillars: the stele, rift and spire', run: () => setPillarsPref('monoliths'), when: yes },
  { cmd: ':pillars classic', desc: 'MONOLITH pillars: a Solomonic column between a Doric and a Tuscan', run: () => setPillarsPref('classic'), when: yes },
  { cmd: ':pillars modern', desc: 'MONOLITH pillars: a Prism between a Halo and a Fin', run: () => setPillarsPref('modern'), when: yes },
  { cmd: ':quality auto', desc: 'Graphics: a level for this device, raised and lowered with the frame rate', run: () => setQualityPref('auto'), when: yes },
  // the five levels, highest first, described from their table when the palette is drawn
  ...['ultra', 'high', 'medium', 'low', 'minimal'].map(k => ({ cmd: `:quality ${k}`, get desc() { return gfxDesc(k); }, run: () => setQualityPref(k), when: () => gfxWhen(k) })),
  { cmd: ':play', desc: 'Go to Play', run: () => setTab('play'), when: yes },
  { cmd: ':analyze', desc: 'Go to Analyze', run: () => setTab('analyze'), when: yes },
  { cmd: ':crucible', desc: 'Go to Crucible', run: () => setTab('crucible'), when: yes },
  { cmd: ':position', desc: 'Go to Position', run: () => setTab('position'), when: yes },
  { cmd: ':grimoire', desc: 'Go to the Grimoire, the reference for every term', run: () => setTab('grimoire'), when: yes },
  { cmd: ':define', arg: true, desc: 'Look a term up in the Grimoire: type it after the command (:define hashfull)', run: arg => { const e = arg ? grFind(arg) : null; setTab('grimoire'); if (e) grOpen(e.id); else { grSearch(arg); if (arg) snack(`No entry for “${arg}”. Showing the closest matches.`); setTimeout(() => $('#gr-q').focus(), 0); } }, when: yes },
  { cmd: ':settings', desc: 'Go to Settings', run: () => setTab('settings'), when: yes },
  { cmd: ':sound', desc: 'Sound on or off', run: () => { ensureAudio(); prefs.sound = !prefs.sound; savePrefs(); applyPrefs(); render(); }, when: yes },
  { cmd: ':reset view', desc: 'Camera back to the default angle', run: () => $('#btn-reset-view').click(), when: yes },
  { cmd: ':explore', desc: 'Move pieces on any board on or off (Crucible games, earlier moves, finished games)', run: () => { setExplorePref(prefs.explore === false); snack(prefs.explore ? 'Move pieces on any board: on.' : 'Move pieces on any board: off.'); }, when: yes },
  { cmd: ':explore back', desc: 'Leave the explored line and return to the board it started from', run: () => exploreEnd(), when: () => explore.on || 'No line is being explored' },
  { cmd: ':version', desc: 'Which release this copy is', run: () => snack(`MONOLITH ${APP_VERSION}, released ${APP_DATE}.`), when: yes },
  /* play: auto-flip, free board, PGN, draw */
  { cmd: ':autoflip', desc: 'Turn the board for each player on or off (friend games on one screen)', run: () => { setAutoFlip(prefs.autoFlip === false); snack(prefs.autoFlip ? 'Turn the board for each player: on.' : 'Turn the board for each player: off.'); }, when: yes },
  { cmd: ':copy pgn', desc: 'Copy the game as PGN, for another site or app (explored lines are not part of it)', run: copyPgn, when: () => app.started || 'No game yet' },
  { cmd: ':download pgn', desc: 'Save the game as a .pgn file', run: downloadPgn, when: () => app.started || 'No game yet' },
  { cmd: ':load pgn', desc: 'Paste a game in PGN (or a FEN) to review it or play on from it', run: openPgnLoad, when: yes }
];
/* Palette groups (shown as headers when nothing is typed) and the keys that also run a command. */
const PAL_GROUPS = [
  ['Analyze', [':go', ':stop', ':field', ':vectors', ':xray', ':reference']],
  ['Crucible', [':sprt start', ':sprt stop', ':recorded']],
  ['Game', [':new', ':hint', ':undo', ':coach', ':calc', ':eval', ':explore', ':explore back']],
  ['Board', [':flip', ':fen', ':copy fen', ':reset view']],
  ['Two players', [':autoflip']],
  ['Game record', [':copy pgn', ':download pgn', ':load pgn']],
  ['Go to', [':play', ':analyze', ':crucible', ':position', ':grimoire', ':settings']],
  ['Grimoire', [':define']],
  ['World, graphics and sound', [':world auto', ':world cathedral', ':world monolith', ':pillars monoliths', ':pillars classic', ':pillars modern', ':quality auto', ':quality ultra', ':quality high', ':quality medium', ':quality low', ':quality minimal', ':sound']],
  ['About', [':version']]
];
const palGroupOf = c => { const g = PAL_GROUPS.find(([, l]) => l.includes(c.cmd)); return g ? g[0] : 'More'; };
const PAL_KEYS = { ':field': ['F'], ':vectors': ['V'], ':xray': ['X'] };
function palFen(arg) {
  if (!arg) { setTab('position'); setPosView('setup'); setTimeout(() => $('#fen').focus(), 0); return; }
  const r = Chess.parseFen(arg);
  if (r.error) { snack(r.error); return; }
  setTab('position'); openInSetup(arg); $('#btn-fen-load').click();
}
export const pal_ = { open: false, items: [], sel: 0, back: null, arg: '' };
function palScore(c, q) {
  if (!q) return 1;
  const s = c.cmd.slice(1).toLowerCase();
  if (s.startsWith(q)) return 100 - s.length;
  if (s.includes(q)) return 60 - s.indexOf(q);
  let i = 0; for (const ch of s) if (ch === q[i]) i++;
  if (i === q.length) return 30;
  return c.desc.toLowerCase().includes(q) ? 10 : 0;
}
function palRender() {
  const raw = $('#pal-input').value, q0 = raw.trim().replace(/^:/, '').toLowerCase();
  const argM = /^:?(fen|define)\s+(.+)$/i.exec(raw.trim());
  pal_.arg = argM ? argM[2].trim() : '';
  const grouped = !q0 && !argM;
  pal_.items = argM ? COMMANDS.filter(c => c.cmd === `:${argM[1].toLowerCase()}`)
    : grouped ? PAL_GROUPS.flatMap(([, l]) => l.map(k => COMMANDS.find(c => c.cmd === k)).filter(Boolean)).concat(COMMANDS.filter(c => palGroupOf(c) === 'More'))
    : COMMANDS.map(c => ({ c, s: palScore(c, q0) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.c);
  pal_.sel = Math.max(0, Math.min(pal_.sel, pal_.items.length - 1));
  const list = $('#pal-list'); list.innerHTML = '';
  if (!pal_.items.length) { const e = document.createElement('li'); e.className = 'pal-empty'; e.textContent = 'No command matches. Try :go, :flip or :fen.'; list.appendChild(e); }
  let group = '';
  pal_.items.forEach((c, i) => {
    if (grouped && palGroupOf(c) !== group) { group = palGroupOf(c); const h = document.createElement('li'); h.className = 'pal-group'; h.setAttribute('role', 'presentation'); h.textContent = group; list.appendChild(h); }
    const ok = c.when(), li = document.createElement('li'); li.className = 'pal-item' + (ok === true ? '' : ' off'); li.id = `pal-opt-${i}`;
    li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === pal_.sel)); if (ok !== true) li.setAttribute('aria-disabled', 'true');
    const code = document.createElement('code'), colon = document.createElement('i'); colon.textContent = ':'; code.append(colon, c.cmd.slice(1));
    const dEntry = c.cmd === ':define' && pal_.arg ? grFind(pal_.arg) : null;
    const span = document.createElement('span'); span.textContent = c.cmd === ':define' && pal_.arg ? (dEntry ? `Open ${dEntry.term}: ${dEntry.def.slice(0, 64)}${dEntry.def.length > 64 ? '…' : ''}` : `Search the Grimoire for “${pal_.arg.slice(0, 40)}”`) : c.arg && pal_.arg ? `Load ${pal_.arg.slice(0, 48)}${pal_.arg.length > 48 ? '…' : ''}` : c.desc;
    const side = document.createElement('div'); side.className = 'side';
    if (ok !== true) { const why = document.createElement('em'); why.className = 'why'; why.textContent = ok; why.title = ok; side.appendChild(why); }
    for (const k of PAL_KEYS[c.cmd] || []) { const kb = document.createElement('kbd'); kb.textContent = k; side.appendChild(kb); }
    const en = document.createElement('b'); en.className = 'enter'; en.setAttribute('aria-hidden', 'true'); en.textContent = '↵'; side.appendChild(en);
    li.append(code, span, side);
    li.addEventListener('mousemove', () => { if (pal_.sel !== i) { pal_.sel = i; list.querySelectorAll('.pal-item').forEach((el, j) => el.setAttribute('aria-selected', String(j === i))); $('#pal-input').setAttribute('aria-activedescendant', `pal-opt-${i}`); } });
    li.addEventListener('click', () => palRun(i));
    list.appendChild(li);
  });
  // an empty list points at nothing: the attribute goes rather than naming an option that does not exist
  if (pal_.items.length) $('#pal-input').setAttribute('aria-activedescendant', `pal-opt-${pal_.sel}`); else $('#pal-input').removeAttribute('aria-activedescendant');
  $('#pal-foot-note').textContent = `${pal_.items.length} of ${COMMANDS.length}`;
}
export function openPalette() {
  if (pal_.open) return; pal_.open = true; pal_.back = document.activeElement; pal_.sel = 0;
  hideSnack(); $('#palette').classList.add('show'); const inp = $('#pal-input'); inp.value = ''; palRender(); inp.focus();
}
export function closePalette() { if (!pal_.open) return; pal_.open = false; $('#palette').classList.remove('show'); if (pal_.back && pal_.back.focus) pal_.back.focus(); }
function palRun(i) {
  const c = pal_.items[i]; if (!c) return;
  const ok = c.when();
  if (ok !== true) { snack(ok); return; }
  const arg = pal_.arg; closePalette(); c.run(arg);
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  $('#pal-input').addEventListener('input', () => { pal_.sel = 0; palRender(); });
  $('#pal-input').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = pal_.items.length; if (n) { pal_.sel = (pal_.sel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; palRender(); const el = $(`#pal-opt-${pal_.sel}`); if (el) el.scrollIntoView({ block: 'nearest' }); } }
    else if (e.key === 'Enter') { e.preventDefault(); palRun(pal_.sel); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePalette(); }
    else if (e.key === 'Tab') { e.preventDefault(); const c = pal_.items[pal_.sel]; if (c) { e.target.value = c.cmd + (c.arg ? ' ' : ''); palRender(); } }
  });
  $('#palette').addEventListener('pointerdown', e => { if (e.target.id === 'palette') closePalette(); });
  $('#btn-palette').addEventListener('click', openPalette);
  $('#pal-kbd').textContent = IS_MAC ? '⌘K' : 'Ctrl K'; $('#kbd-palette').textContent = IS_MAC ? '⌘ K' : 'Ctrl K';
  $('#btn-palette').title = `Command palette (${IS_MAC ? '⌘K' : 'Ctrl K'})`;
}
