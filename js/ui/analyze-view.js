/*
✒ Metadata
    - Title: Analyze View (MONOLITH Edition - v1.2)
    - File Name: analyze-view.js
    - Relative Path: js/ui/analyze-view.js
    - Artifact Type: javascript
    - Version: 1.2.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — Play
      to here plays an engine line onto the board, badges have a short form,
      a tap aims the X-Ray, and status, fork row and WDL labels keep clear.
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: the X-Ray readout reads no layout in
      the frame loop and works nothing out until the view changes; the
      engine lines are list items holding buttons; the fork walk marks line
      1 only where it still follows the walk's trunk; and fitCanvas() keeps
      a canvas within what every browser can allocate, so a long run's Hive
      still draws.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    MONOLITH Analyze on screen: the stats, the search profile, the WDL
    ribbon, the Synaptic PV scrubber and its phantom preview, the stage
    instruments and the X-Ray readout. It also writes the source badges
    that Analyze and the Crucible share.

✒ Key Features:
    - renderAnalyze(): the whole tab from the model; the search status in
      two lines, what is happening over its detail.
    - previewLine() and clearScrub(): a scrubbed ply shown on the board as
      phantoms.
    - renderSyn(): the Synaptic PV chips. Play to here on a pinned chip
      (or Enter on it, or a double-click on any chip) plays the line to
      that ply onto the board as an explored line, and Shift-click on a
      MultiPV row plays its first move; the game itself never changes.
    - renderXray() and placeXrayChip(): the X-Ray readout and its chip on
      the board; on a screen without hover a tap picks its square.
    - setBadge(), badgeShort(), syncBadges() and setBadgesPref(): each
      source badge in its full or short form ([SF · rec]), the full text
      in a short badge's title.
    - TOK: the canvas colours; fitCanvas() for sharp canvases.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { renderAnalyze, TOK } from '../ui/analyze-view.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/board.js, scene/instruments.js, scene/phantoms.js, app/state.js,
      game/flow.js, game/board-ui.js, coach/coach.js, coach/facts.js,
      game/input.js, ui/analyze.js, ui/grimoire.js and ui/panels.js;
      globals three.js r147 (THREE, from jsDelivr), Chess (js/core/chess.js)
      and Monolith (js/core/monolith.js).
    - Shared state (js/app/store.js): sets app.fieldOn; reads app.orient and
      app.view.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, PI, prefs, savePrefs } from '../app/base.js';
import { camera, renderer } from '../scene/renderer.js';
import { PIECE_NAMES, sqPos } from '../scene/board.js';
import { INK, PIECE_TOP, setField, setVectors, setXray } from '../scene/instruments.js';
import { setPhantoms } from '../scene/phantoms.js';
import { game, render, shown } from '../app/state.js';
import { consultable, consultedAt, CONSULT_DWELL_MS, exploreAppend, markConsult } from '../game/flow.js';
import { boardState, lineQuality } from '../game/board-ui.js';
import { PVAL, see } from '../coach/coach.js';
import { cap1 } from '../coach/facts.js';
import { materialOf, MIN, pct1, sanList, stmScore, whiteScore } from '../game/input.js';
import { an, anEvalShown, deep, fieldEng, xr } from './analyze.js';
import { termify } from './grimoire.js';
import { renderMatchbar } from './panels.js';

/* ---------- source badges ----------
   Every readout names its source. The short form (Settings, or :badges short) keeps the source
   and its recorded or live mark and moves the rest to the badge's title: [SF: MultiPV 5 · d26 ·
   recorded] reads [SF · rec]. The footer's badges (telemetry.js) take their compact form with it. */
export const badgeShort = full => full.replace(/:\s*[^\]]*?(·\s*(?:rec(?:orded)?|live))?\]$/, (m, r) => r ? ` · ${/live/.test(r) ? 'live' : 'rec'}]` : ']');
export function setBadge(el, full) {
  const form = prefs.badges === 'short' ? 'short' : 'full';
  if (el.dataset.full === full && el.dataset.form === form) return;
  el.dataset.full = full; el.dataset.form = form;
  el.textContent = form === 'short' ? badgeShort(full) : full; el.title = form === 'short' ? full : '';
}
export function syncBadges() {
  document.documentElement.dataset.badges = prefs.badges === 'short' ? 'short' : 'full';
  for (const b of document.querySelectorAll('.badge')) if (!b.closest('.tm')) setBadge(b, b.dataset.full || b.textContent);
}
export function setBadgesPref(form) { prefs.badges = form === 'short' ? 'short' : 'full'; savePrefs(); syncBadges(); render(); }

/* ---------- Analyze: scrub preview (phantoms) ---------- */
export function clearScrub() {
  cancelEndPreview(); an.scrub = null; an.pin = null;
  setPhantoms(null, ''); const pc = $('#phantom-chip'); if (pc) pc.hidden = true;
  for (const c of document.querySelectorAll('.syn-chip.on')) c.classList.remove('on');
}
// a chip's line up to its ply, as the chips show it: a numbered line, or the fork row (the trunk to
// the fork, then the walk's second choice there)
function chipLine(line, ply) {
  const st = an.st; if (!st) return null;
  const LN = an.synLines || an.lines, WK = an.synWalk || an.walk;   // what the chips show
  if (line === 'fork') {
    const w = WK && WK.plies[ply]; if (!w) return null;
    const trunk = sanList(st, WK.trunk, ply); const base = trunk.length ? trunk[trunk.length - 1].state : st;
    return { seq: trunk.concat(sanList(base, w.alts[1].pv, 1)), label: `Fork row, ply ${ply + 1}` };
  }
  return LN[line] ? { seq: sanList(st, LN[line].pv, ply + 1), label: `Line ${line + 1}, ply ${ply + 1}` } : null;
}
/* Play to here: an engine line played onto the board as an explored line, so the analysis goes on
   from where it leads. It never touches the game: at the live position of a game it explores too,
   and Back returns to the board it came from. */
function stepInto(seq) { if (an.st && seq && seq.length) exploreAppend(an.st, seq); }
function previewLine(line, ply, pin = false) {
  const st = an.st, L = chipLine(line, ply); if (!L || !L.seq.length) return;
  const { seq, label } = L;
  const proj = seq[seq.length - 1].state, dm = materialOf(proj) - materialOf(st);
  an.scrub = { line, ply }; if (pin) an.pin = an.pin && an.pin.line === line && an.pin.ply === ply ? null : { line, ply };
  if (pin && !an.pin) { clearScrub(); return; }
  setPhantoms(proj, Chess.fen(proj), st);   // keyed by the projected position: the same position is never rebuilt
  const pc = $('#phantom-chip'); pc.hidden = false;
  /* built once and then only rewritten: a search redraws a pinned line several times a second, and
     a chip rebuilt between the press and the release of Play to here lost the click */
  let go = $('#btn-step-in');
  if (!go) {
    pc.innerHTML = ''; pc.append(document.createElement('b'), document.createElement('span'));
    go = document.createElement('button'); go.type = 'button'; go.className = 'btn text small'; go.id = 'btn-step-in'; go.textContent = 'Play to here';
    go.title = 'Play this line to here on the board and analyse on from there; the game itself does not change';
    go.addEventListener('click', () => { const P = an.pin && chipLine(an.pin.line, an.pin.ply); if (P) stepInto(P.seq); }); pc.appendChild(go);
  }
  const [b, sub] = pc.children, say = (el, t) => { if (el.textContent !== t) el.textContent = t; };
  say(b, `${an.pin ? 'Pinned' : 'Hover'} ${label.toLowerCase()} · ${seq.slice(-4).map(x => x.num + x.san).join(' ')}`);
  say(sub, `hologram: where pieces land · faint: squares they leave · crimson: captured · material ${dm > 0 ? '+' : dm < 0 ? MIN : '±'}${Math.abs(dm)} (White's view, pawns)`);
  go.hidden = !(an.pin && an.pin.line === line && an.pin.ply === ply);
  for (const c of document.querySelectorAll('.syn-chip.on')) c.classList.remove('on');
  const chip = document.querySelector(`.syn-chip[data-line="${line}"][data-ply="${ply}"]`); if (chip) chip.classList.add('on');
}
function endPreview() { previewEndTimer = 0; if (an.pin) previewLine(an.pin.line, an.pin.ply); else clearScrub(); }
let previewEndTimer = 0;
const PREVIEW_GRACE_MS = 140;
function scheduleEndPreview() { clearTimeout(previewEndTimer); previewEndTimer = setTimeout(endPreview, PREVIEW_GRACE_MS); }
function cancelEndPreview() { clearTimeout(previewEndTimer); previewEndTimer = 0; }

/* ---------- Analyze: rendering ---------- */
const GRADE_MO = { best: { css: '#2CC8D8', c: INK.cyan }, good: { css: '#E3E7EE', c: INK.ink }, inaccuracy: { css: '#E8A93A', c: INK.amber }, mistake: { css: '#ED7F83', c: INK.crimson } };
/* Sizes a canvas's pixels to its box at the screen's density (at most 2×), within what every
   browser can allocate (16,384 pixels a side, about 16.7 million in all: Safari's limits), so a
   tall one, a long Crucible run's Hive, draws at a lower density rather than not at all. */
export function fitCanvas(cv) {
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1, 16384 / Math.max(1, r.width, r.height), Math.sqrt(16e6 / Math.max(1, r.width * r.height)));
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w: r.width, h: r.height };
}
export const TOK = { canvas: '#0B0D10', panel: '#14181F', raised: '#1B212A', well: '#0E1116', rule: '#262D38', sqDark: '#181D25', sqLight: '#3F4B5B', steel: '#ABB5C3', ivory: '#ECE8EF', slate: '#556275', obsidian: '#0F1318', ink: '#E3E7EE', ink2: '#A4ACB9', ink3: '#7E8898', cyan: '#2CC8D8', amber: '#E8A93A', crimson: '#ED7F83' };
export const FONT_T = '"Geist Mono", ui-monospace, monospace';
function drawProfile() {
  const cv = $('#profile'); if (!cv || !cv.offsetParent) return;
  const { g, w, h } = fitCanvas(cv);
  g.clearRect(0, 0, w, h);
  const S = an.stream; g.font = `10px ${FONT_T}`; g.textBaseline = 'alphabetic';
  if (!S.length) { g.fillStyle = TOK.ink3; g.fillText(an.status === 'searching' ? 'Waiting for the first depth…' : 'No search yet', 10, h / 2 + 3); return; }
  const L = 28, R = 64, T = 12, B = 18, tmax = Math.max(1, S[S.length - 1].t, an.status === 'searching' ? 0 : 0), dmax = Math.max(4, ...S.map(x => x.depth));
  const X = t => L + (w - L - R) * (t / tmax), Y = d => h - B - (h - T - B) * (d / dmax), Yh = v => h - B - (h - T - B) * (v / 1000);
  g.lineWidth = 1;
  for (let k = 0; k <= 4; k++) { const y = Math.round(T + (h - T - B) * k / 4) + 0.5; g.strokeStyle = k === 4 ? '#3A4352' : 'rgba(38,45,56,.75)'; g.beginPath(); g.moveTo(L, y); g.lineTo(w - R, y); g.stroke(); }
  // hashfull area (per mille, right axis), a soft gradient with a hairline crest
  const hg = g.createLinearGradient(0, T, 0, h - B); hg.addColorStop(0, 'rgba(110,124,145,.42)'); hg.addColorStop(1, 'rgba(85,98,117,.06)');
  g.beginPath(); g.moveTo(X(S[0].t), h - B);
  for (const x of S) g.lineTo(X(x.t), Yh(x.hashfull || 0));
  g.lineTo(X(S[S.length - 1].t), h - B); g.closePath(); g.fillStyle = hg; g.fill();
  g.beginPath(); S.forEach((x, i) => i ? g.lineTo(X(x.t), Yh(x.hashfull || 0)) : g.moveTo(X(x.t), Yh(x.hashfull || 0))); g.strokeStyle = 'rgba(171,181,195,.45)'; g.lineWidth = 1; g.stroke();
  // depth as a step trace (depth is whole iterations), with a node where each one completed
  g.lineJoin = 'round'; g.lineCap = 'round';
  const depthPath = () => { g.beginPath(); g.moveTo(X(S[0].t), Y(S[0].depth)); for (let i = 1; i < S.length; i++) { g.lineTo(X(S[i].t), Y(S[i - 1].depth)); g.lineTo(X(S[i].t), Y(S[i].depth)); } g.lineTo(w - R, Y(S[S.length - 1].depth)); };
  depthPath(); g.strokeStyle = 'rgba(227,231,238,.10)'; g.lineWidth = 4; g.stroke();
  depthPath(); g.strokeStyle = TOK.ink; g.lineWidth = 1.5; g.stroke();
  if ((w - L - R) / Math.max(1, S.length) >= 6) { g.fillStyle = TOK.ink; for (const x of S) { g.beginPath(); g.arc(X(x.t), Y(x.depth), 1.8, 0, PI * 2); g.fill(); } }
  g.fillStyle = TOK.ink3;
  g.fillText(`d${dmax}`, 4, T + 8); g.fillText('0 s', L, h - 5);
  const tl = `${tmax.toFixed(tmax < 10 ? 1 : 0)} s`; g.fillText(tl, w - R - g.measureText(tl).width, h - 5);
  g.fillStyle = TOK.ink; g.fillText('depth', w - R + 8, T + 8);
  g.fillStyle = TOK.ink3; g.fillText('hashfull', w - R + 8, T + 22);
  g.fillText(Monolith.fmtPct((S[S.length - 1].hashfull || 0) / 1000), w - R + 8, T + 34);
}
function gradeLines(lines) {
  const grades = lineQuality(lines.map(l => l || null));
  return grades.map(q => q ? Object.assign({}, q, GRADE_MO[q.key]) : null);
}
/* Looking at the engine in a two-player game (js/game/flow.js markConsult): Analyze open on a live
   two-player game, at the same position of its record, for CONSULT_DWELL_MS and with the engine's
   evaluation on screen marks the side to move. Leaving the tab, a move, or a hidden page starts the
   count again, so passing through the tab (the rail's arrow keys, a click on the way to another tab)
   marks nothing. Run from every render of the tab, and by its own timer when nothing renders. */
let consultOpen = null, consultTimer = 0;   // { rec, ply, t }: open on this position since t
function consultWatch() {
  const ply = game.states.length - 1;
  if (prefs.tab !== 'analyze' || !consultable() || document.visibilityState === 'hidden' || consultedAt(ply)) { consultOpen = null; clearTimeout(consultTimer); consultTimer = 0; return; }
  if (!consultOpen || consultOpen.rec !== game.states || consultOpen.ply !== ply) consultOpen = { rec: game.states, ply, t: performance.now() };
  const left = CONSULT_DWELL_MS - (performance.now() - consultOpen.t);
  if (left <= 0 && anEvalShown()) {
    const k = consultOpen; consultOpen = null; clearTimeout(consultTimer); consultTimer = 0;
    // outside the render that called this: the mark renders (and saves) itself
    setTimeout(() => { if (k.rec === game.states && k.ply === game.states.length - 1 && anEvalShown()) markConsult(); }, 0);
    return;
  }
  if (!consultTimer) consultTimer = setTimeout(() => { consultTimer = 0; consultWatch(); }, Math.max(250, left));
}
let anDomVer = -1;
export function renderAnalyze() {
  const on = prefs.tab === 'analyze';
  consultWatch();
  $('#layer-toggles').hidden = !on; $('#syn').hidden = !on;
  if (!on) { $('#wdl').hidden = true; $('#wdl-none').hidden = true; $('#field-legend').hidden = true; $('#xray-chip').hidden = true; $('#phantom-chip').hidden = true; return; }
  const st = an.st || shown(), rec = an.source === 'recorded', R = an.rec, recTag = rec ? ' · recorded' : '';
  const lines = an.lines.filter(Boolean), l1 = an.lines[0];
  // engine card
  const E = deep;
  $('#an-name').textContent = rec ? 'Stockfish 19' : E && E.ready ? E.name.replace(' lite', '') : 'Stockfish 19';
  $('#an-build').textContent = rec ? `WASM build · ${an.meta.threads} thread · Hash ${an.meta.hash} MB · MultiPV ${lines.length} · recorded ${an.meta.date || ''}`.trim()
    : E && E.ready ? `${E.build} · 1 thread · Hash\u00a0${E.cap('Hash', prefs.mo.hash)}\u00a0MB${E.cap('Hash', prefs.mo.hash) < prefs.mo.hash ? ' (engine maximum)' : ''} · MultiPV ${Math.min(prefs.mo.multipv, Chess.allLegal(st).length || 1)}`
    : E && E.failed ? E.status : 'Loading the engine…';
  const s = an.stats, tSec = s.time !== undefined ? s.time / 1000 : 0;
  const searching = an.status === 'searching';
  const go = $('#btn-go');
  go.disabled = !(E && E.ready) || an.status === 'over' || an.status === 'idle' && !an.st;
  $('#go-label').textContent = searching && an.infinite ? 'Stop' : 'Go infinite';
  $('#ico-go').setAttribute('d', searching && an.infinite ? 'M6 6h12v12H6z' : 'M8 5v14l11-7z');
  go.title = searching && an.infinite ? 'Stop the search' : searching ? 'Keep searching without a time limit' : 'Search without a time limit';
  /* The search status in two parts, what is happening over its detail, so the break always falls
     between them (one string wrapped wherever 21ch ran out, leaving 's' or '(limit)' alone); a
     number keeps its unit by a no-break space. Rewritten only when it changes. */
  const sec = x => `${x.toFixed(1)}\u00a0s`;
  const [stA, stB] = an.status === 'over' ? ['game over', String(an.reason).split('. ')[0].replace(/\.$/, '').toLowerCase()]
    : an.status === 'loading' ? ['engine', 'loading…'] : an.status === 'failed' ? ['engine', 'unavailable']
    : rec ? ['recorded', `${sec(an.meta.seconds)} · limit`]
    : searching ? ['searching', an.infinite ? `${sec(tSec)} · infinite` : `limit ${prefs.mo.limit}\u00a0s`]
    : an.reason === 'user' ? ['stopped by you', `at ${sec(tSec)}`] : an.reason === 'limit' ? ['stopped', `at ${sec(tSec)} · limit`] : ['', ''];
  const so = $('#an-stopped');
  if (so.dataset.v !== `${stA}|${stB}`) { so.dataset.v = `${stA}|${stB}`; so.textContent = ''; if (stA) { const x = document.createElement('b'), y = document.createElement('span'); x.textContent = stA; y.textContent = stB; so.append(x, ' ', y); } }
  setBadge($('#an-badge-uci'), `[SF: UCI info${recTag}]`);
  $('#st-depth').textContent = s.depth ? `${s.depth}/${s.seldepth || s.depth}` : '—';
  $('#st-nodes').textContent = Monolith.fmtCount(s.nodes);
  $('#st-nps').textContent = Monolith.fmtCount(s.nps);
  $('#st-hash').textContent = s.hashfull !== undefined ? Monolith.fmtPct(s.hashfull / 1000) : '—';
  $('#st-tb').textContent = s.tbhits !== undefined ? String(s.tbhits) : s.nodes !== undefined ? 'not reported' : '—';
  $('#st-tb').title = s.tbhits === undefined && s.nodes !== undefined ? 'This Stockfish build has no Syzygy tablebase support, so it reports no tbhits.' : '';
  $('#st-time').textContent = s.time !== undefined ? `${tSec.toFixed(1)} s` : '—';
  const dTop = l1 ? l1.depth : 0;
  setBadge($('#an-badge-pv'), `[SF: MultiPV ${lines.length || prefs.mo.multipv}${dTop ? ` · d${dTop}` : ''}${recTag}]`);
  $('#pv-sub').textContent = lines.length ? 'White\'s view · graded vs line 1' : '';
  // MultiPV table
  if (anDomVer !== an.ver) {
    anDomVer = an.ver;
    const table = $('#pv-table'); table.innerHTML = '';
    const grades = gradeLines(an.lines);
    if (!lines.length) { const e = document.createElement('div'); e.className = 'pv-empty'; e.setAttribute('role', 'listitem'); e.textContent = an.status === 'over' ? 'The game is over in this position.' : searching ? 'Searching…' : (E && E.failed) ? 'The engine could not start here.' : 'Waiting for the engine.'; table.appendChild(e); }
    an.lines.forEach((inf, i) => {
      if (!inf) return;
      const q = grades[i] || GRADE_MO.good, seq = sanList(st, inf.pv, 10), ws = whiteScore(inf, st.turn), wdl = Monolith.wdlWhite(inf.wdl, st.turn);
      // a list item holding the row's button (a button cannot be the list item itself: its role would replace the button's)
      const item = document.createElement('div'), row = document.createElement('button'); item.setAttribute('role', 'listitem'); row.type = 'button'; item.appendChild(row);
      row.className = 'pv-row' + (i === 0 ? ' best' : '') + (an.focus === i ? ' focus' : ''); row.style.setProperty('--q', q.css);
      row.setAttribute('aria-pressed', String(an.focus === i));
      row.title = `${an.focus === i ? 'Show every line' : 'Show only this line on the board'} · Shift-click plays its first move`;
      const idx = document.createElement('span'); idx.className = 'i'; idx.textContent = i + 1;
      const mv = document.createElement('span'); mv.className = 'pv-mv'; mv.textContent = seq.length ? seq[0].san : inf.pv[0];
      const gr = document.createElement('span'); gr.className = 'pv-grade'; gr.textContent = q.label; mv.appendChild(gr);
      const ev = document.createElement('span'); ev.className = 'pv-ev'; ev.textContent = Monolith.fmtScore(ws);
      const wm = document.createElement('span'); wm.className = 'wdl-mini';
      if (wdl) { wm.innerHTML = `<span class="wdl-bar"><i class="w" style="width:${pct1(wdl[0])}%"></i><i class="d" style="width:${pct1(wdl[1])}%"></i><i class="l" style="width:${pct1(wdl[2])}%"></i></span><span class="wdl-num">${Math.round(wdl[0] / 10)} / ${Math.round(wdl[1] / 10)} / ${Math.round(wdl[2] / 10)}</span>`; }
      else wm.innerHTML = '<span class="wdl-num">WDL —</span>';
      const ln = document.createElement('span'); ln.className = 'pv-ln'; ln.textContent = seq.slice(1).map(x => x.num + x.san).join(' ');
      row.append(idx, mv, ev, wm, ln);
      row.addEventListener('click', e => { if (e.shiftKey) return stepInto(sanList(st, inf.pv, 1)); an.focus = an.focus === i ? -1 : i; an.ver++; renderAnalyze(); });
      table.appendChild(item);
    });
    renderSyn();
  }
  // sharpness
  const sharp = Monolith.sharpness(an.lines.map(stmScore));
  $('#sh-12').textContent = sharp ? Monolith.fmtPct(sharp.d12) : '—'; $('#sh-12').classList.toggle('amber', !!(sharp && sharp.halo));
  $('#sh-13').textContent = sharp && sharp.d13 !== null ? Monolith.fmtPct(sharp.d13) : '—';
  const chip = $('#sh-chip'); chip.className = 'chip' + (sharp && sharp.halo ? ' amber' : ''); chip.textContent = !sharp ? 'one line' : sharp.halo ? 'Knife-edge · halo on' : 'Calm · halo off';
  $('#sh-note').textContent = `halo threshold 10 %${an.field ? ` · ${an.field.near} of ${an.field.total} moves within 5 %` : ''}`;
  setBadge($('#an-badge-sharp'), `[SF: MultiPV ${lines.length || prefs.mo.multipv}${recTag}]`);
  setBadge($('#an-badge-stream'), `[SF: info stream · ${an.stream.length} update${an.stream.length === 1 ? '' : 's'}${recTag}]`);
  drawProfile();
  // options
  $('#opt-hash').value = String(prefs.mo.hash); $('#opt-multipv').value = String(prefs.mo.multipv); $('#opt-wdl').checked = prefs.mo.wdl;
  $('#opt-wdl').disabled = !!(E && E.ready && !E.has('UCI_ShowWDL'));
  $('#opt-limit').value = String(prefs.mo.limit); $('#opt-field').value = String(prefs.mo.fieldDepth); $('#opt-walk').value = String(prefs.mo.walkDepth);
  $('#uci-profile').textContent = rec ? `recorded run · ${an.meta.seconds} s · Hash ${an.meta.hash} MB · field d${an.meta.fieldDepth}` : `live run · 1 thread · Hash ${prefs.mo.hash} MB`;
  if (an.recState === 'error' && !$('#ref-note').textContent) { $('#ref-note').className = 'help err'; $('#ref-note').textContent = `The recorded run is not reachable here (data/analyze.json: ${an.recErr}).`; }
  $('#btn-reference').disabled = an.recState === 'error' || an.recState === 'loading';
  // context title (MONOLITH app bar)
  renderMatchbar();
  renderStageInstruments(st, sharp, rec);
}
function renderStageInstruments(st, sharp, rec) {
  const l1 = an.lines[0], recTag = rec ? ' · rec' : '';
  // layer toggles
  for (const b of document.querySelectorAll('[data-layer]')) {
    const k = b.dataset.layer, onK = k === 'xray' ? (xr.sticky || xr.held) : prefs.mo[k];
    b.setAttribute('aria-pressed', String(!!onK));
  }
  $('#xray-mode').textContent = xr.sticky ? (tapOnly() ? '· tap a square' : '· on') : tapOnly() ? '' : '· hold Space';
  // Explore in Analyze (js/game/flow.js analyzeExplores): where a move made on this board goes during a game
  const exb = $('#btn-an-explore'), exOn = prefs.analyzeExplore !== false;
  exb.setAttribute('aria-checked', String(exOn));
  exb.title = exOn ? 'Explore: on. During a game a move made here starts a line from the position shown; the game does not change. Click to play moves in the game instead'
    : 'Explore: off. During a game a move made here on your turn is played in the game. Click to explore lines instead';
  // WDL ribbon (White's view)
  const wdl = l1 ? Monolith.wdlWhite(l1.wdl, st.turn) : null, ribbon = $('#wdl');
  ribbon.hidden = !wdl; $('#wdl-none').hidden = !!wdl || !l1;
  if (!wdl && l1) $('#wdl-none').firstChild.textContent = !rec && deep && deep.ready && !deep.has('UCI_ShowWDL') ? `WDL not reported by ${deep.name} ` : !rec && !prefs.mo.wdl ? 'WDL off in the engine options ' : 'WDL not reported ';
  if (wdl) {
    const W = wdl[0] / 10, D = wdl[1] / 10, Lp = wdl[2] / 10, flip = app.orient === 'b';
    $('#wdl-v').classList.toggle('flipped', flip);
    $('#wdl-w').style.height = `${W}%`; $('#wdl-dseg').style.height = `${D}%`; $('#wdl-l').style.height = `${Lp}%`;
    $('#wdl-top').textContent = flip ? `W ${W.toFixed(1)}` : `L ${Lp.toFixed(1)}`;
    $('#wdl-bottom').textContent = flip ? `L ${Lp.toFixed(1)}` : `W ${W.toFixed(1)}`;
    const dEl = $('#wdl-d'), dTop = (flip ? W : Lp) + D / 2, sb0 = $('#wdl-sharp'), hTot = ribbon.clientHeight || 1;
    const sharpEnd = (sb0.offsetTop + sb0.offsetHeight) / hTot * 100;
    // and clear of the labels at either end (half its own line and 3 px), all it has to keep off
    // where a narrow stage hides Sharpness: it sat on the top one when the split was lopsided
    const tl = $('#wdl-top'), lh = 10, lo = Math.max(sharpEnd + 4, (tl.offsetTop + tl.offsetHeight + lh) / hTot * 100), hi = ($('#wdl-bottom').offsetTop - lh) / hTot * 100;
    dEl.textContent = `D ${D.toFixed(1)}`; dEl.style.top = `${Math.max(dTop, lo)}%`; dEl.hidden = D < 4 || Math.max(dTop, lo) > Math.min(90, hi);
    const sb = $('#wdl-sharp'); sb.classList.toggle('calm', !(sharp && sharp.halo));
    $('#wdl-sharp-val').textContent = sharp ? Monolith.fmtPct(sharp.d12) : '—';
    $('#wdl-sharp-sub').textContent = sharp ? (sharp.halo ? `line 1 · d${l1.depth}` : 'halo off') : 'one line';
    setBadge($('#wdl-badge-wdl'), `[SF: WDL${recTag}]`); setBadge($('#wdl-badge-pv'), `[SF: MultiPV${recTag}]`);
    const halo = $('#wdl-halo'); halo.hidden = !(sharp && sharp.halo);
    const H = halo.clientHeight;
    if (H && halo.dataset.h !== String(H)) {
      halo.dataset.h = String(H); const svg = halo.querySelector('svg'); svg.setAttribute('viewBox', `0 0 10 ${H + 24}`);
      let d = 'M1 0'; for (let y = 6, k = 1; y <= H + 24; y += 6, k++) d += ` L${k % 2 ? 9 : 1} ${y}`;
      $('#wdl-halo-path').setAttribute('d', d);
    }
  }
  // field legend
  const fl = $('#field-legend'); fl.hidden = !prefs.mo.field;
  const F = an.field;
  setBadge($('#fl-badge'), `[SF: Root MultiPV Field${F ? ` · d${F.depth}` : ''}${recTag}]`);
  $('#fl-text').textContent = F && F.done ? `${F.total} legal moves · depth ${F.depth} each · brightest move per square · ${F.near} of ${F.total} within 5 % of best · ${F.lit} square${F.lit === 1 ? '' : 's'} lit`
    : an.fieldProg ? `Scoring all ${an.fieldProg.total} legal moves · depth ${an.fieldProg.depth || 1} of ${an.fieldProg.target}…`
    : an.status === 'over' ? 'No legal moves to score.' : fieldEng && fieldEng.failed ? 'The field engine could not start here.' : 'The field starts with the search.';
  // 3D: field, vectors, X-Ray
  app.fieldOn = prefs.mo.field && !!F;
  setField(F ? F.bright : null, F ? F.best.to : -1);
  if (prefs.mo.vectors && an.lines.length) {
    const list = [];
    an.lines.forEach((inf, i) => {
      if (!inf || !inf.pv.length || (an.focus >= 0 && an.focus !== i)) return;
      const mv = Chess.fromUci(st, inf.pv[0]); if (!mv) return;
      const top = i === 0;
      list.push({ from: mv.from, to: mv.to, color: top ? INK.cyan : INK.steel, glow: top ? 2.2 : 0.45, opacity: top ? 0.95 : 0.72, radius: top ? 0.034 : 0.02, label: String(i + 1), reticle: top, name: `vector-line-${String(i + 1).padStart(2, '0')}` });
    });
    setVectors(list.reverse(), st);
  } else setVectors([]);
  renderXray(st);
}
function xrayTarget(st) {
  if (!(xr.held || xr.sticky)) return -1;
  if (xr.hover >= 0) return xr.hover;
  if (xr.pin >= 0) return xr.pin;
  const m = app.view === null ? game.moves[game.moves.length - 1] : app.view > 0 ? game.moves[app.view - 1] : null;
  return m && game.states.includes(st) ? m.to : (an.field ? an.field.best.to : -1);
}
/* The X-Ray readout, docked beside the board (see the CSS note at .xray-chip): the square, the
   gauge's number, the best move landing there against the best overall, the square's state, and
   every piece bearing on it by side. */
const PIECE_LETTER = { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: '' };
function xrayRead(st, sq) {
  const occ = st.board[sq], W = Chess.attackers(st.board, sq, 'w'), B = Chess.attackers(st.board, sq, 'b');
  const name = s2 => { const q = st.board[s2]; return q.t === 'p' ? `pawn ${Chess.sqName(s2)}` : PIECE_LETTER[q.t] + Chess.sqName(s2); };
  const order = l => l.slice().sort((a, b) => PVAL(st.board[b].t) - PVAL(st.board[a].t));
  let state = 'calm', label, detail;
  if (occ && occ.t !== 'k') {
    const own = occ.c, them = Chess.other(own), att = them === 'w' ? W : B, def = own === 'w' ? W : B, pn = PIECE_NAMES[occ.t];
    const low = att.length ? Math.min(...att.map(i => PVAL(st.board[i].t))) : Infinity;
    detail = `${cap1(pn)}: attacked ${att.length}, defended ${def.length}`;
    if (att.length && !def.length) { state = 'hanging'; label = 'Hanging'; }
    else if (att.length && low < PVAL(occ.t)) { state = 'pressed'; label = 'Attacked by less'; }
    else if (att.length && att.length > def.length && see(st.board, sq, them) > 0) { state = 'pressed'; label = 'Outnumbered'; }
    else label = att.length ? 'Defended' : 'Not attacked';
  } else if (occ) { const them = occ.c === 'w' ? B : W; label = them.length ? 'King in check' : 'King'; state = them.length ? 'pressed' : 'calm'; detail = `${occ.c === 'w' ? 'White' : 'Black'}'s king`; }
  else { label = W.length > B.length ? 'White controls' : B.length > W.length ? 'Black controls' : W.length ? 'Contested' : 'Quiet'; detail = `White reaches it ${W.length}×, Black ${B.length}×`; }
  return { state, label, detail, w: order(W).map(name), b: order(B).map(name), pieces: W.map(i => ({ sq: i, c: 'w' })).concat(B.map(i => ({ sq: i, c: 'b' }))) };
}
export function renderXray(st) {
  const chip = $('#xray-chip'), sq = xrayTarget(st);
  if (sq < 0) { setXray(-1); chip.hidden = true; return; }
  const F = an.field, onto = F ? F.moves.filter(m => m.to === sq).sort((a, b) => b.e - a.e) : [], top = onto[0] || null;
  const share = top && F ? Math.max(0, F.best.e - top.e) : null, best = !!(top && F && top === F.best);
  const sev = best ? 'best' : share === null ? 'none' : share < 0.05 ? 'near' : share < 0.15 ? 'slip' : 'loss';
  const R = xrayRead(st, sq);
  setXray(sq, { arc: best ? 1 : share === null ? 0 : Math.min(1, share), sev, state: R.state, pieces: R.pieces });
  chip.hidden = false; chip.innerHTML = '';
  chip.style.setProperty('--xs', { best: TOK.cyan, near: TOK.ivory, slip: TOK.amber, loss: TOK.crimson, none: TOK.steel }[sev]);
  const el = (tag, cls, text, parent = chip) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; parent.appendChild(e); return e; };
  const head = el('div', 'xr-head');
  el('span', 'xr-title', 'X-Ray', head).dataset.term = 'tactical-xray';
  el('span', 'xr-sq', Chess.sqName(sq), head);
  el('span', 'xr-mode', xr.sticky ? (tapOnly() ? 'on · tap a square' : 'on · X turns it off') : 'held · Space', head);
  const g = el('div', 'xr-gauge'), bar = el('i', '', undefined, g); bar.style.setProperty('--xg', `${((best ? 1 : share || 0) * 100).toFixed(1)}%`);
  const gl = el('span', '', best ? 'best move' : share === null ? (F ? 'no move lands' : 'scoring…') : `${Monolith.fmtPct(share)} lost`, g);
  if (!best && share !== null) gl.dataset.term = 'expected-score';
  if (top) {
    const row = el('div', 'xr-row'); el('b', '', top.san, row); el('span', '', Monolith.fmtScore(top.score), row);
    const bs = F.best.score, ts = top.score;
    if (!best && !Monolith.isMate(bs) && !Monolith.isMate(ts)) el('span', 'xr-delta', Monolith.fmtCp(ts.cp - bs.cp), row);
    el('div', 'xr-sub', best ? 'The best move on the board lands here.' : `The best move overall is ${F.best.san} (${Monolith.fmtScore(F.best.score)}).`);
  } else el('div', 'xr-sub', F ? 'No legal move lands on this square.' : 'The field is still scoring the moves.');
  const stt = el('span', 'xr-status', R.label); stt.style.setProperty('--xt', { hanging: TOK.crimson, pressed: TOK.amber, calm: TOK.ink3 }[R.state]);
  if (R.state === 'hanging') stt.dataset.term = 'hanging-piece';
  el('div', 'xr-sub', R.detail).dataset.term = 'attackers-and-defenders';
  const sides = el('div', 'xr-sides');
  for (const c of ['w', 'b']) {
    const row = el('div', 'xr-side', undefined, sides); el('i', `xr-bead ${c}`, undefined, row).setAttribute('aria-hidden', 'true');
    el('span', 'k', c === 'w' ? 'White' : 'Black', row); const list = el('em', '', R[c].length ? R[c].join(', ') : '—', row); list.title = list.textContent;
  }
  const bd = el('span', 'badge'); bd.dataset.term = 'source-badges'; setBadge(bd, F ? `[SF: Root MultiPV Field · d${F.depth}${an.source === 'recorded' ? ' · rec' : ''}]` : '[SF: field pending]');
  termify(chip);
  xrChip.w = chip.offsetWidth || 224; xrChip.h = chip.offsetHeight || 200; xrChip.key = '';   // measured once per rebuild
  placeXrayChip(sq);
}
/* The readout docks at the stage's left edge, and moves to the right only while the square it
   describes (its four corners and the top of a standing piece) would sit under it. The loop calls
   this every frame while the X-Ray shows, so it reads no layout (the chip's size is taken when it
   is rebuilt, the stage's from the renderer) and does nothing until the camera, the square or a
   size has changed. */
const xrProj = new THREE.Vector3(), xrSize = new THREE.Vector2(), xrChip = { w: 224, h: 200, key: '' };
let narrowMQ = null, hoverMQ = null; // made on first use
// a screen with no hover (a phone, a tablet): the X-Ray is aimed by a tap, not held under Space
const tapOnly = () => (hoverMQ || (hoverMQ = matchMedia('(hover: none)'))).matches;
export function placeXrayChip(sq) {
  const chip = $('#xray-chip'); if (chip.hidden) return;
  if ((narrowMQ || (narrowMQ = matchMedia('(max-width: 899px)'))).matches) { chip.classList.remove('right'); xrChip.key = ''; return; }
  const p = boardState().board[sq], topY = p ? PIECE_TOP[p.t] : 0.1, e = camera.matrixWorld.elements;
  renderer.getSize(xrSize);
  const key = `${sq} ${topY} ${xrSize.x} ${xrSize.y} ${xrChip.w} ${xrChip.h} ${camera.projectionMatrix.elements[5]} ${e[8]} ${e[9]} ${e[10]} ${e[12]} ${e[13]} ${e[14]}`;
  if (key === xrChip.key) return;
  xrChip.key = key;
  const { x, z } = sqPos(sq), W = xrSize.x, H = xrSize.y;
  let x0 = Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [dx, dy, dz] of [[-0.5, 0, -0.5], [0.5, 0, -0.5], [-0.5, 0, 0.5], [0.5, 0, 0.5], [0, topY, 0]]) {
    xrProj.set(x + dx, dy, z + dz).project(camera);
    const px = (xrProj.x + 1) / 2 * W, py = (1 - xrProj.y) / 2 * H;
    x0 = Math.min(x0, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
  }
  const cw = xrChip.w, ch = xrChip.h, top = (H - ch) / 2;
  const under = x0 < 16 + cw + 12 && y1 > top - 8 && y0 < top + ch + 8;
  chip.classList.toggle('right', under);
}
/* Synaptic PV. While the pointer or keyboard focus is in the grid the chips are held: a search
   refreshes the lines several times a second, and rebuilding the grid under the cursor moved the
   chip being read, re-fired its hover and swapped the phantoms (the glitching Dennis saw). Updates
   wait until the pointer or focus leaves, the header says so, and previews read the same snapshot
   the chips show. A new position is never held. */
export function renderSyn() {
  const grid = $('#syn-grid');
  if (an.synHold && an.synKey === an.key && grid.childElementCount) { an.synPending = true; $('#syn-hold').hidden = false; return; }
  an.synPending = false; $('#syn-hold').hidden = true; an.synKey = an.key;
  an.synLines = an.lines.slice(); an.synWalk = an.walk ? Object.assign({}, an.walk, { plies: an.walk.plies.slice() }) : null;
  const LN = an.synLines;
  grid.innerHTML = '';
  const st = an.st, rec = an.source === 'recorded', W = an.synWalk;
  setBadge($('#syn-badge-pv'), `[SF: MultiPV ${LN.filter(Boolean).length || prefs.mo.multipv}${LN[0] ? ` · d${LN[0].depth}` : ''}${rec ? ' · rec' : ''}]`);
  setBadge($('#syn-badge-walk'), `[SF: fork walk · MultiPV 2${W && W.depth ? ` · d${W.depth}` : ''}${rec ? ' · rec' : ''}]`);
  // a mate in the lines is named here; the tablebase count, a constant 'not reported' in this build,
  // stays with the stats card (its TB hits cell says why) and the footer
  const mates = LN.map((l, i) => l && l.kind === 'mate' ? `${Monolith.fmtScore(whiteScore(l, st.turn))} in line ${i + 1}` : null).filter(Boolean);
  $('#syn-tb').hidden = !mates.length; $('#syn-tb').textContent = mates.length ? `Mate: ${mates.join(', ')}` : '';
  const notes = $('#syn-notes'); notes.innerHTML = '';
  if (!st || !LN.some(Boolean)) { const e = document.createElement('div'); e.className = 'syn-empty'; e.textContent = an.status === 'over' ? 'No lines: the game is over here.' : 'Lines appear here as the engine searches.'; grid.appendChild(e); return; }
  const chipFor = (line, k, san, small, cls = '') => {
    const c = document.createElement('button'); c.type = 'button'; c.className = 'syn-chip ' + cls; c.dataset.line = line; c.dataset.ply = k;
    c.textContent = san; if (small) { const sm = document.createElement('small'); sm.textContent = small; c.appendChild(sm); }
    c.setAttribute('aria-label', `${line === 'fork' ? 'Fork row' : `Line ${+line + 1}`}, ply ${k + 1}: ${san}${small ? ' ' + small : ''}`);
    // leaving a chip only schedules the end, so crossing the gap to the next chip never drops
    // the preview for a frame (that drop was the flicker)
    c.addEventListener('mouseenter', () => { cancelEndPreview(); previewLine(line === 'fork' ? 'fork' : +line, k); });
    c.addEventListener('focus', () => { cancelEndPreview(); previewLine(line === 'fork' ? 'fork' : +line, k); });
    c.addEventListener('mouseleave', scheduleEndPreview); c.addEventListener('blur', scheduleEndPreview);
    c.addEventListener('click', () => { cancelEndPreview(); previewLine(line === 'fork' ? 'fork' : +line, k, true); });
    // Enter on the pinned chip, or a double-click on any, plays the line to it (Play to here)
    const ln = line === 'fork' ? 'fork' : +line, into = () => { const L = chipLine(ln, k); if (L) stepInto(L.seq); };
    c.addEventListener('keydown', e => { if (e.key === 'Enter' && an.pin && an.pin.line === ln && an.pin.ply === k) { e.preventDefault(); into(); } });
    c.addEventListener('dblclick', into);
    return c;
  };
  LN.forEach((inf, i) => {
    if (!inf) return;
    const ws = whiteScore(inf, st.turn), e = Monolith.expected(ws);
    const idx = document.createElement('span'); idx.className = 'syn-i'; idx.textContent = i + 1;
    const ev = document.createElement('span'); ev.className = 'syn-ev'; ev.textContent = Monolith.fmtScore(ws); if (i === 0) ev.style.color = TOK.cyan;
    const bar = document.createElement('span'); bar.className = 'syn-bar' + (i === 0 ? ' l1' : ''); bar.title = `White's expected score ${Monolith.fmtPct(e)}`; bar.innerHTML = `<i style="width:${(e * 100).toFixed(1)}%"></i>`;
    const chips = document.createElement('div'); chips.className = 'syn-chips' + (i === 0 ? ' syn-l1' : '');
    // the walk was made along line 1 as it stood then (its trunk): its marks go only on the plies
    // where line 1 still follows that trunk, never on a line that has since changed under them
    let same = 0; if (i === 0 && W) while (same < inf.pv.length && inf.pv[same] === W.trunk[same]) same++;
    sanList(st, inf.pv, 15).forEach((x, k) => {
      let small = '', cls = '';
      if (i === 0 && W && W.plies[k] && k < same) { small = Monolith.fmtScore(W.plies[k].alts[0].score); if (W.fork === k && W.done) cls += ' fork'; if (W.plies[k].instab) cls += ' instab'; }
      chips.appendChild(chipFor(i, k, x.num + x.san, small, cls));
    });
    grid.append(idx, ev, bar, chips);
    if (i === 0 && W) {
      const lab = document.createElement('span'); lab.className = 'syn-lab'; lab.style.gridColumn = '1 / 4';
      // the label keeps to its three columns; that the walk followed an earlier line 1 is said by a
      // quiet chip at the head of the row, where it fits on a phone too (it ran under the chips)
      lab.textContent = W.done && W.fork >= 0 ? `fork · ply ${W.fork + 1}` : an.walkProg ? `walking ${an.walkProg.at}/${an.walkProg.total}…` : 'fork walk';
      const row = document.createElement('div'); row.className = 'syn-chips';
      if (same < W.plies.length) { const e = document.createElement('span'); e.className = 'syn-chip gap'; e.textContent = 'earlier line 1'; e.title = 'The fork walk followed line 1 as it stood earlier; line 1 has changed since'; row.appendChild(e); }
      W.plies.forEach((p, k) => row.appendChild(chipFor('fork', k, p.alts[1].san[0], `${(p.gap * 100).toFixed(1)}%`, 'alt' + (W.fork === k && W.done ? ' fork' : ''))));
      grid.append(lab, row);
    }
  });
  if (W && W.done && W.fork >= 0 && W.plies[W.fork]) {
    const p = W.plies[W.fork], n = document.createElement('div');
    n.textContent = `◆ fork: the trunk node whose second choice is closest (smallest expected-score gap) · ply ${W.fork + 1}: ${p.alts[0].san[0]} ${Monolith.fmtScore(p.alts[0].score)} against ${p.alts[1].san[0]} ${Monolith.fmtScore(p.alts[1].score)}, a gap of ${(p.gap * 100).toFixed(1)} %`;
    notes.appendChild(n);
  }
  if (W) W.plies.filter(p => p.instab).forEach(p => {
    const trunkSan = sanList(st, W.trunk, p.ply + 1)[p.ply], alt = p.alts.find(a => a.uci === W.trunk[p.ply]);
    const n = document.createElement('div'); n.className = 'amber';
    n.textContent = `ply ${p.ply + 1}${W.depth ? `, depth ${W.depth}` : ''} prefers ${p.alts[0].san[0]} ${Monolith.fmtScore(p.alts[0].score)} to the trunk's ${trunkSan ? trunkSan.san : W.trunk[p.ply]}${alt ? ' ' + Monolith.fmtScore(alt.score) : ''} (shallow walk disagrees with the d${W.trunkDepth} trunk)`;
    notes.appendChild(n);
  });
  if (an.pin) previewLine(an.pin.line, an.pin.ply);
}
