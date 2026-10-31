/*
✒ Metadata
    - Title: Telemetry Footer (MONOLITH Edition - v1.1)
    - File Name: telemetry.js
    - Relative Path: js/ui/telemetry.js
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
      release audit Dennis asked for: the speed sparkline follows the engine
      its number comes from (the play engine's own info outside Analyze),
      and a report without a speed adds no zero.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      Dennis's tiered graphics levels: RENDER names the level (with Auto
      when Automatic chose it), and GPU shows the cleaned-up name the
      levels detect from ("Intel Iris Xe Graphics", not "Intel").
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    MONOLITH's telemetry footer: browser-honest readouts, each with its
    source badge. Pages cannot read CPU load, clocks or sensors, so those
    read absent unless a recorded run carries its host's own samples.

✒ Key Features:
    - Engine figures from Stockfish's own info lines (nps, hash, tablebase
      hits).
    - Frame time from requestAnimationFrame; cores from hardwareConcurrency;
      heap and GPU name where the browser exposes them.
    - Sparklines and the fit to the footer's width.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 20 of 26. Other modules import from it,
    for example:
        import { telemetry, buildTelemetry } from '../ui/telemetry.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/post.js, scene/quality.js, game/engine.js, game/input.js,
      ui/analyze.js, ui/analyze-view.js, ui/crucible.js and ui/grimoire.js;
      globals Monolith (js/core/monolith.js).
    - Shared state (js/app/store.js): reads only app.worldName.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, prefs } from '../app/base.js';
import { renderer } from '../scene/renderer.js';
import { post } from '../scene/post.js';
import { quality, tier } from '../scene/quality.js';
import { allEngines, engine } from '../game/engine.js';
import { MIN } from '../game/input.js';
import { an } from './analyze.js';
import { fitCanvas, TOK } from './analyze-view.js';
import { cr, crModel } from './crucible.js';
import { termify } from './grimoire.js';

/* =====================================================================================
   Telemetry footer (MONOLITH): browser-honest readouts, each with its source badge. Engine
   figures come from Stockfish's own info lines; frame time from requestAnimationFrame; cores
   from navigator.hardwareConcurrency; the page heap only where the browser exposes it; the GPU
   name only where WebGL reports it. Pages cannot read CPU load, clocks or sensors, so those read
   absent unless a recorded run carries its host's own samples, which are badged as recorded.
   ===================================================================================== */
export const telemetry = { npsHist: [], npsSeen: null, frames: [], t: 0, cells: {} };   // npsHist: the play engine's, as its info arrives
let GPU_NAME; // set in init()
const TM_TERM = { nps: 'nps', hash: 'hashfull', tb: 'tb-hits', games: 'parallel-games', llr: 'llr', host: 'telemetry', sensors: 'telemetry', frame: 'telemetry', render: 'graphics-tiers', workers: 'wasm-build', heap: 'telemetry', gpu: 'telemetry' };
export function buildTelemetry() {
  const foot = $('#telemetry');
  // a wheel over the footer scrolls it sideways when it is still too wide at its tightest
  foot.addEventListener('wheel', e => { if (foot.scrollWidth <= foot.clientWidth + 1) return; e.preventDefault(); foot.scrollLeft += e.deltaY || e.deltaX; }, { passive: false });
  const defs = [['nps', 'NPS', true, false], ['hash', 'HASH', false, true], ['tb', 'TB HITS'], ['games', 'GAMES', true], ['llr', 'LLR'], ['host', 'HOST'], ['sensors', 'SENSORS'], ['frame', 'FRAME', true], ['render', 'RENDER'], ['workers', 'WORKERS'], ['heap', 'HEAP'], ['gpu', 'GPU']];
  for (const [k, label, spark, meter] of defs) {
    const c = document.createElement('span'); c.className = 'tm'; c.dataset.k = k;
    const b = document.createElement('b'); b.textContent = label; if (TM_TERM[k]) b.dataset.term = TM_TERM[k]; c.appendChild(b);
    let cv = null, mt = null;
    if (spark) { cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); c.appendChild(cv); }
    if (meter) { mt = document.createElement('span'); mt.className = 'meter'; mt.innerHTML = '<i></i>'; c.appendChild(mt); }
    const v = document.createElement('span'); v.className = 'v'; c.appendChild(v);
    const bd = document.createElement('span'); bd.className = 'badge'; c.appendChild(bd);
    const bf = document.createElement('span'); bf.className = 'bf'; const bs = document.createElement('span'); bs.className = 'bs'; bd.append(bf, bs);
    bd.dataset.term = 'source-badges';
    foot.appendChild(c); telemetry.cells[k] = { el: c, v, bd, bf, bs, cv, mt };
  }
  termify(foot);
}
function spark(cv, vals, color = TOK.steel) {
  if (!cv || !vals.length) return; const { g, w, h } = fitCanvas(cv); g.clearRect(0, 0, w, h);
  const mx = Math.max(...vals), mn = Math.min(...vals), span = mx - mn || 1;
  g.beginPath(); vals.forEach((v, i) => { const x = vals.length === 1 ? w : w * i / (vals.length - 1), y = h - 1 - (h - 2) * (v - mn) / span; i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.strokeStyle = color; g.lineWidth = 1; g.stroke();
}
export function updateTelemetry(now) {
  const foot = $('#telemetry'); foot.hidden = app.worldName !== 'monolith';
  if (foot.hidden || now - telemetry.t < 300) return; telemetry.t = now;
  if (!foot.offsetWidth) return;   // set aside by the stylesheet (a phone): nothing to read or fit
  const C = telemetry.cells, show = (k, on) => { C[k].el.hidden = !on; return on; },
    set_ = (k, v, badge) => { const c = C[k]; c.v.textContent = v; if (c.bf.textContent !== badge) { c.bf.textContent = badge; c.bs.textContent = badge.replace(/:.*\]$/, ']'); c.bd.title = badge; } };
  const tab = prefs.tab, crTab = tab === 'crucible', anTab = tab === 'analyze';
  // engine readouts: Analyze's search, else the play engine's last search
  const S = anTab ? an.stats : (engine.last || {}), rec = anTab && an.source === 'recorded';
  // the sparkline follows the engine the number comes from: Analyze's search stream there, the
  // play engine's recent info elsewhere; a line that reports no speed adds no point (not a zero)
  const L = engine.last; if (L && L !== telemetry.npsSeen && L.nps > 0) { telemetry.npsSeen = L; telemetry.npsHist.push(L.nps); if (telemetry.npsHist.length > 60) telemetry.npsHist.shift(); }
  if (show('nps', !crTab)) { set_('nps', S.nps !== undefined ? Monolith.fmtCount(S.nps) : '—', `[SF: info nps${rec ? ' · rec' : anTab ? '' : ' · play'}]`); spark(C.nps.cv, anTab ? an.stream.filter(x => x.nps > 0).map(x => x.nps) : telemetry.npsHist); }
  if (show('hash', !crTab)) { set_('hash', S.hashfull !== undefined ? Monolith.fmtPct(S.hashfull / 1000) : '—', `[SF: hashfull${rec ? ' · rec' : ''}]`); C.hash.mt.firstChild.style.width = `${((S.hashfull || 0) / 10).toFixed(1)}%`; }
  // tablebase hits only when the engine reports them (this build has no Syzygy, so it never does)
  if (show('tb', !crTab && S.tbhits !== undefined)) set_('tb', String(S.tbhits), `[SF: tbhits${rec ? ' · rec' : ''}]`);
  const m = crTab ? crModel() : null;
  if (show('games', crTab)) {
    const done = m ? m.games.filter(g => g && g.done).length : 0, secs = m ? (m.kind === 'recorded' ? m.wall : m.running ? (now - m.t0) / 1000 : m.wall) : 0;
    set_('games', m ? `${done} · ${secs > 0 ? (done / secs * 60).toFixed(0) : 0}/min` : '—', `[Runner: pairs/game${m && m.kind === 'recorded' ? ' · rec' : ''}]`);
    spark(C.games.cv, m ? m.trace.map(t => t.games) : []);
  }
  if (show('llr', crTab)) { const t = m && m.trace[m.trace.length - 1]; set_('llr', t ? `${t.llr.toFixed(2).replace('-', MIN)} / ${m.sprt.upper.toFixed(2)}` : '—', '[Runner: GSPRT]'); }
  const host = crTab && cr.src === 'recorded' && cr.data ? cr.data.host : anTab && an.source === 'recorded' && an.rec ? an.rec.host : null;
  if (show('host', !!host)) {
    const L = host.load.filter(x => x.cpu_percent > 0), mean = L.reduce((a, b) => a + b.cpu_percent, 0) / Math.max(1, L.length), f = L.length ? L[L.length - 1].freq_mhz : null;
    set_('host', `${mean.toFixed(0)} % · ${f ? f + ' MHz · ' : ''}${host.cpu_count} cores`, `[Recorded: psutil · ${host.os}]`);
  }
  if (show('sensors', !!host)) set_('sensors', host && !host.temps && !host.gpu ? 'none exposed' : 'recorded', '[Recorded: hwmon · NVML]');
  const fr = telemetry.frames, avg = fr.length ? fr.reduce((a, b) => a + b, 0) / fr.length : 0;
  set_('frame', avg ? `${(1000 / avg).toFixed(0)} fps · ${avg.toFixed(1)} ms` : '—', '[Browser: rAF]'); spark(C.frame.cv, fr.slice(-60));
  const T = tier();
  set_('render', `${prefs.quality === 'auto' ? 'Auto ' : ''}${T.label}${post.volume ? ` · ray-march ${T.steps}` : ''}${post.bloom ? ' · bloom' : ''}${post.composer ? ' · HDR' : ''} · ${renderer.getPixelRatio().toFixed(1)}×`, '[Renderer: three.js r147]');
  const busy = [...allEngines].filter(e => e.searching).length;
  set_('workers', `${busy} busy of ${allEngines.size} · ${navigator.hardwareConcurrency || '?'} cores`, '[Browser: hardwareConcurrency]');
  const mem = performance.memory; set_('heap', mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(0)} MB page` : 'not exposed', '[Browser: performance.memory]');
  set_('gpu', GPU_NAME || 'not exposed', '[WebGL: renderer info]');
  fitTelemetry(foot);
}
/* Steps the footer to the loosest fit that holds: full, compact badges, tight, then tight with
   the least telling readouts set aside one by one (GPU name, heap, sensors, host, TB hits). It
   loosens again only with 24 px to spare, so a changing number at the boundary cannot make it
   flicker between levels. */
const TM_FIT = ['', 'compact', 'tight'], TM_CUT = ['gpu', 'heap', 'sensors', 'host', 'tb'];
function fitTelemetry(foot) {
  // measured from the cells themselves: a flex row's scrollWidth never reads less than its box
  const cs = getComputedStyle(foot), room = foot.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const need = () => { let w = 0; for (const c of foot.children) if (c.offsetWidth) w += c.getBoundingClientRect().width; return w; };
  const levels = TM_FIT.length + TM_CUT.length, over = () => need() > room + 0.5;
  const at = i => {
    const f = TM_FIT[Math.min(i, TM_FIT.length - 1)]; if (f) foot.dataset.fit = f; else delete foot.dataset.fit;
    TM_CUT.forEach((k, j) => telemetry.cells[k].el.classList.toggle('tm-cut', i >= TM_FIT.length + j));
    foot.dataset.level = String(i);
  };
  let i = Math.max(0, +(foot.dataset.level || 0)); at(i);
  while (i < levels - 1 && over()) at(++i);
  if (i > 0 && !over()) { at(i - 1); if (need() + 24 > room) at(i); else i--; }
  foot.classList.toggle('over', over());
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  GPU_NAME = quality.device.name;   // detected once, for the graphics levels (js/scene/quality.js)
}
