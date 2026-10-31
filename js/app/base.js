/*
✒ Metadata
    - Title: App Base (MONOLITH Edition - v1.6)
    - File Name: base.js
    - Relative Path: js/app/base.js
    - Artifact Type: javascript
    - Version: 1.6.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.6.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      release on screen is 2.18.0. New defaults: autoFlip and analyzeExplore
      on, badges 'full', edVs 'cpu'; the last three keep to their choices.
    - 1.5.4 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      release on screen is 2.17.0.
    - 1.5.3 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      release on screen is 2.16.0.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The basics every module leans on: the $ query helper, the release number
    shown on screen, the reduced-motion preference and the saved
    preferences. Also BootHalt, the signal that stops the boot.

✒ Key Features:
    - $: document.querySelector.
    - APP_VERSION and APP_DATE, shown on the release chip at the rail's foot
      (under the wordmark below 900 px) and in Settings; a release bumps
      them with the page header.
    - prefs: the per-viewer preferences in localStorage (monolith-prefs-v2;
      a copy saved under the old name, wizards-chess-prefs-v2, moves there
      on first load), with defaults, and every saved value repaired to its
      type, list or range (nested ones too), including the move of an older
      graphics choice to the five levels (prefs.qualityScheme); savePrefs()
      writes them.
    - reduceMotion and PI.
    - panelScroller(): the element that scrolls the panel at this width.
    - BootHalt: thrown to stop the boot, caught by js/main.js.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 1 of 26. Other modules import from it, for
    example:
        import { prefs, $, PI } from '../app/base.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js; globals Chess (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.SPEED.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from './store.js';

/* Thrown to stop the boot: the renderer throws it when WebGL is missing, and js/main.js catches it
   and runs no further setup. */
export class BootHalt extends Error {}

export const $ = s => document.querySelector(s);
/* The release on screen (10/22/2026), so it is always clear whether a copy is behind. These repeat
   the Version and Date in index.html's ✒ header; a release bumps all of them together. */
export const APP_VERSION = '2.18.0', APP_DATE = '10/30/2026';
export let reduceMotion; // set in init()
/* The element that scrolls a destination's panel: the panes beside the stage on a wide screen,
   the whole panel under it at phone width (css/media.css, 899 px and below). */
export const panelScroller = () => matchMedia('(max-width: 899px)').matches ? $('.panel') : $('.panes');
/* shared, in app/store.js: app.SPEED */
export const PI = Math.PI;

/* ---------- preferences (per-viewer; survive reloads, never required) ---------- */
const PREF_KEY = 'monolith-prefs-v2';
const OLD_PREF_KEY = 'wizards-chess-prefs-v2';   // the key before the app was MONOLITH (2.13.0)
const MO_DEFAULTS = { hash: 64, multipv: 5, wdl: true, limit: 20, fieldDepth: 10, walkDepth: 12, field: true, vectors: true };
const CR_DEFAULTS = { src: 'recorded', aKind: 'nodes', aVal: 3000, bKind: 'nodes', bVal: 2000, mode: 'sprt', elo0: 0, elo1: 10, alpha: 0.05, pairs: 20, par: 2 };
export let prefs; // set in init()
export function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} }
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
/* Repairs for a saved value: one of a list (else the list's first), or a whole number in a range
   (else the default). */
const oneOf = (o, k, list) => { if (!list.includes(o[k])) o[k] = list[0]; };
const inRange = (o, k, lo, hi, d) => { if (!Number.isInteger(o[k]) || o[k] < lo || o[k] > hi) o[k] = d; };

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  $('#app-ver').textContent = $('#app-ver-sub').textContent = `v${APP_VERSION}`;
  $('#app-ver').title = `MONOLITH ${APP_VERSION}, released ${APP_DATE}. A lower number than the published page shows means this copy is behind.`;
  $('#about-version').textContent = `MONOLITH ${APP_VERSION}, released ${APP_DATE}.`;
  reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  app.SPEED = reduceMotion ? 0.3 : 1;
  const DEFAULTS = { sound: true, speed: 'normal', legal: true, explore: true, analyzeExplore: true, autoFlip: true, badges: 'full', edVs: 'cpu', coords: true, lines: 3, evalOn: false, tab: 'play', opponent: 'cpu', choice: 'w', level: 4, tips: 'once', learned: {}, world: 'auto', quality: 'auto', gfx: null, pillars: 'monoliths' };
  prefs = Object.assign({}, DEFAULTS, (() => { try { const v = JSON.parse(localStorage.getItem(PREF_KEY) ?? localStorage.getItem(OLD_PREF_KEY)); return isObj(v) ? v : {}; } catch (e) { return {}; } })());
  /* Saved values are repaired, not trusted: storage can hold a value from an older release, or one
     edited by hand, and one bad value must never stop the page from starting (a level of 0 or a
     side of "x" used to throw in the first render). Every default keeps its type; choices keep to
     their lists; numbers keep to their ranges; nested objects keep their shapes. */
  for (const [k, v] of Object.entries(DEFAULTS)) if (v !== null && (isObj(v) ? !isObj(prefs[k]) : typeof prefs[k] !== typeof v)) prefs[k] = isObj(v) ? {} : v;
  oneOf(prefs, 'speed', ['normal', 'fast', 'minimal']); oneOf(prefs, 'tips', ['once', 'always', 'off']);
  oneOf(prefs, 'opponent', ['cpu', 'human']); oneOf(prefs, 'choice', ['w', 'b', 'r']);
  oneOf(prefs, 'world', ['auto', 'cathedral', 'monolith']); oneOf(prefs, 'pillars', ['monoliths', 'classic', 'modern']);
  oneOf(prefs, 'badges', ['full', 'short']); oneOf(prefs, 'edVs', ['cpu', 'human']); oneOf(prefs, 'analyzeExplore', [true, false]);
  inRange(prefs, 'level', 1, typeof LEVELS !== 'undefined' && LEVELS.length || 8, DEFAULTS.level); inRange(prefs, 'lines', 1, 5, DEFAULTS.lines);
  for (const k of ['coach', 'engineOpen']) if (k in prefs && typeof prefs[k] !== 'boolean') delete prefs[k];
  prefs.mo = Object.assign({}, MO_DEFAULTS, isObj(prefs.mo) ? prefs.mo : {});
  for (const [k, v] of Object.entries(MO_DEFAULTS)) if (typeof prefs.mo[k] !== typeof v) prefs.mo[k] = v;
  for (const [k, lo, hi] of [['hash', 1, 1024], ['multipv', 1, 5], ['limit', 1, 3600], ['fieldDepth', 1, 30], ['walkDepth', 1, 30]]) inRange(prefs.mo, k, lo, hi, MO_DEFAULTS[k]);
  prefs.cr = Object.assign({}, CR_DEFAULTS, isObj(prefs.cr) ? prefs.cr : {});
  for (const [k, v] of Object.entries(CR_DEFAULTS)) if (typeof prefs.cr[k] !== typeof v || (typeof v === 'number' && !isFinite(prefs.cr[k]))) prefs.cr[k] = v;
  oneOf(prefs.cr, 'src', ['recorded', 'live']); oneOf(prefs.cr, 'mode', ['sprt', 'fixed']); oneOf(prefs.cr, 'aKind', ['nodes', 'elo', 'level']); oneOf(prefs.cr, 'bKind', ['nodes', 'elo', 'level']);
  // splitter sizes: { key: { tab: px } }, numbers only
  if (!isObj(prefs.ui)) delete prefs.ui;
  else for (const [k, m] of Object.entries(prefs.ui)) { if (!isObj(m)) delete prefs.ui[k]; else for (const [t, v] of Object.entries(m)) if (typeof v !== 'number' || !isFinite(v)) delete m[t]; }
  /* 2.10.0 cut the graphics into five levels (10/23/2026). The old Balanced is Medium and
     the old Low (no post-processing) is Minimal, setting for setting, so a saved choice keeps
     drawing as it did. The scheme mark is not among the defaults, so a choice saved before it
     existed is moved once. js/scene/quality.js checks prefs.gfx, the Custom settings. */
  if (prefs.qualityScheme !== 2) { prefs.quality = { balanced: 'medium', low: 'minimal' }[prefs.quality] || prefs.quality; prefs.qualityScheme = 2; }
  if (!['auto', 'ultra', 'high', 'medium', 'low', 'minimal', 'custom'].includes(prefs.quality)) prefs.quality = 'auto';
  /* 2.13.0: the app is MONOLITH (10/24/2026) and its preferences key with it. Settings saved
     under the old key are written under the new one, then the old copy goes; if the write fails
     (storage full or blocked), the old copy stays and is read again next time. */
  try { if (localStorage.getItem(OLD_PREF_KEY) !== null) { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); localStorage.removeItem(OLD_PREF_KEY); } } catch (e) {}
}
