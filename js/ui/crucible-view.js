/*
✒ Metadata
    - Title: Crucible View (MONOLITH Edition - v1.1)
    - File Name: crucible-view.js
    - Relative Path: js/ui/crucible-view.js
    - Artifact Type: javascript
    - Version: 1.1.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      live-run note speaks of MONOLITH levels, under the app's new name,
      which Dennis chose.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a run stopped at its limit says why,
      and the run note explains the book and the limits.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The Crucible on screen: the verdict, the LLR oscilloscope, the Hive of
    games and the heartbeat of a game's evaluation.

✒ Key Features:
    - renderCrucible(): the deck and pane from the model.
    - The oscilloscope: the LLR trace with monotone curves and the bounds.
    - The Hive: one cell per game, hit-tested for hover.
    - The heartbeat: a game's evaluation swings, coloured by size.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 18 of 26. Other modules import from it,
    for example:
        import { renderCrucible, drawBeat } from '../ui/crucible-view.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js, game/engine.js, game/input.js,
      ui/analyze-view.js, ui/crucible.js, ui/crucible-board.js, ui/panels.js
      and ui/splitters.js; globals Chess (js/core/chess.js), Monolith
      (js/core/monolith.js) and LEVELS (js/core/levels.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { $, PI, prefs, reduceMotion } from '../app/base.js';
import { engineFamily } from '../game/engine.js';
import { MIN } from '../game/input.js';
import { fitCanvas, FONT_T, setBadge, TOK } from './analyze-view.js';
import {
  BOOK, cr, CR_ELO_MS, CR_LIMITS, CR_MAX_PAIRS, crMaxPar, crModel, getGauntlet, pad2, resultText
} from './crucible.js';
import { boardOverride, crExpand, crShowBoard, renderBoardCard } from './crucible-board.js';
import { radio, renderMatchbar } from './panels.js';
import { beatCv } from './splitters.js';

/* ---------- Crucible: rendering ---------- */
function crVerdictText(m) {
  if (!m) return ['—', '', ''];
  const last = m.trace[m.trace.length - 1], b = m.sprt;
  const llr = last ? last.llr : 0, games = m.games.filter(g => g && g.done).length;
  if (m.kind === 'live' && m.starting) return ['STARTING', `Loading ${m.par * 2} Stockfish workers…`, ''];
  if (m.verdict) return [m.verdict === 'H1' ? 'H1 ACCEPTED' : 'H0 ACCEPTED', `LLR ${llr.toFixed(3).replace('-', MIN)} ${m.verdict === 'H1' ? '≥' : '≤'} ${(m.verdict === 'H1' ? b.upper : b.lower).toFixed(3).replace('-', MIN)} · pair ${last.pair} · game ${last.games}`,
    m.kind === 'recorded' ? `${m.wall.toFixed(1)} s wall · 1 thread, sequential` : `${m.wall.toFixed(1)} s wall · ${m.par} game${m.par === 1 ? '' : 's'} at once · ${m.par * 2} workers`];
  if (m.running) return [m.mode === 'sprt' ? 'RUNNING · SPRT' : 'RUNNING · FIXED', `LLR ${llr.toFixed(3).replace('-', MIN)} · bounds ${b.lower.toFixed(3).replace('-', MIN)} / +${b.upper.toFixed(3)} · ${games} games`, `${((performance.now() - m.t0) / 1000).toFixed(0)} s · ${m.par} game${m.par === 1 ? '' : 's'} at once`];
  if (m.stopReason === 'pairs') return ['FIXED RUN DONE', `${m.pairs.length} pairs · LLR ${llr.toFixed(3).replace('-', MIN)} (no bound crossed)`, `${m.wall.toFixed(1)} s wall`];
  if (m.stopReason === 'limit') return ['NO DECISION', `${m.pairs.length} pairs · LLR ${llr.toFixed(3).replace('-', MIN)} (no bound crossed): ${m.pairsTarget < CR_MAX_PAIRS ? `every book opening played once, the most a run with nodes on both sides holds` : `the run stops at ${CR_MAX_PAIRS} pairs`}`, `${m.wall.toFixed(1)} s wall`];
  if (m.kind === 'live') return ['STOPPED', m.note || `stopped by you after ${m.pairs.length} pair${m.pairs.length === 1 ? '' : 's'} · LLR ${llr.toFixed(3).replace('-', MIN)}`, m.wall ? `${m.wall.toFixed(1)} s wall` : ''];
  return ['NO DECISION', `LLR ${llr.toFixed(3)} after ${m.pairs.length} pairs`, ''];
}
export function renderCrucible() {
  const on = prefs.tab === 'crucible';
  $('#deck').hidden = !(on && cr.view === 'deck'); $('#beat').hidden = !(on && cr.view === 'board' && !!boardOverride);
  if (!on) { $('#board-card').hidden = true; return; }
  if (cr.src === 'recorded' && cr.dataState === 'idle') getGauntlet();
  for (const b of document.querySelectorAll('[data-crsrc]')) radio(b, b.dataset.crsrc === cr.src);
  for (const b of document.querySelectorAll('[data-crview]')) radio(b, b.dataset.crview === cr.view);
  const m = crModel();
  $('#cr-view-board').disabled = !(m && m.games.some(Boolean));
  // configuration (live)
  $('#cr-config').hidden = cr.src !== 'live';
  if (cr.src === 'live') {
    const c = prefs.cr, running = !!(cr.live && cr.live.running);
    for (const [k, v, kind] of [['#cfg-a-kind', null, c.aKind], ['#cfg-b-kind', null, c.bKind]]) $(k).value = kind;
    for (const [inp, kind, val] of [['#cfg-a-val', c.aKind, c.aVal], ['#cfg-b-val', c.bKind, c.bVal]]) { const el = $(inp); el.min = CR_LIMITS[kind][0]; el.max = CR_LIMITS[kind][1]; if (document.activeElement !== el) el.value = val; }
    for (const b of document.querySelectorAll('[data-crmode]')) radio(b, b.dataset.crmode === c.mode);
    $('#cfg-sprt').hidden = c.mode !== 'sprt'; $('#cfg-fixed').hidden = c.mode !== 'fixed';
    if (document.activeElement !== $('#cfg-elo0')) $('#cfg-elo0').value = c.elo0; if (document.activeElement !== $('#cfg-elo1')) $('#cfg-elo1').value = c.elo1;
    $('#cfg-alpha').value = String(c.alpha); if (document.activeElement !== $('#cfg-pairs')) $('#cfg-pairs').value = c.pairs;
    const par = $('#cfg-par'), max = crMaxPar();
    if (par.options.length !== max) { par.innerHTML = ''; for (let i = 1; i <= max; i++) { const o = document.createElement('option'); o.value = String(i); o.textContent = String(i); par.appendChild(o); } }
    par.value = String(Math.min(max, c.par));
    for (const el of document.querySelectorAll('#cr-config select, #cr-config input, #cr-config [data-crmode]')) el.disabled = running;
    $('#btn-cr-run').disabled = running; $('#btn-cr-stop').disabled = !running;
    const note = $('#cr-run-note');
    if (!note.classList.contains('err') || running) { note.className = 'help'; note.textContent = `${max} game${max === 1 ? '' : 's'} at most at once here (${navigator.hardwareConcurrency || '?'} logical cores, one kept free). Each game uses two engines with 16 MB hash each. UCI_Elo plays ${CR_ELO_MS} ms a move; MONOLITH levels play at their own pace. The book has ${BOOK.length} openings: with nodes on both sides a run holds at most ${BOOK.length} pairs (an opening played again would replay the same games); otherwise the openings come round again. An SPRT run stops undecided at ${CR_MAX_PAIRS} pairs.`; }
  }
  // match
  const [v1, v2, v3] = crVerdictText(m);
  $('#cr-verdict').textContent = cr.src === 'recorded' && cr.dataState !== 'ready' ? (cr.dataState === 'error' ? 'NOT REACHABLE' : 'LOADING') : v1;
  $('#cr-verdict-1').textContent = cr.src === 'recorded' && cr.dataState === 'error' ? `data/gauntlet.json: ${cr.dataErr}` : cr.src === 'live' && !m ? 'Set A and B, then Start run.' : v2;
  $('#cr-verdict-2').textContent = v3;
  $('#cr-match-sub').textContent = !m ? '' : m.kind === 'recorded' ? 'SPRT · stopped at bound · recorded' : m.mode === 'sprt' ? 'SPRT · live in this browser' : `fixed ${m.pairsTarget} pairs · live`;
  setBadge($('#cr-badge-match'), m && m.kind === 'recorded' ? '[Runner: GSPRT · recorded]' : '[Runner: GSPRT]');
  const prog = $('#cr-progress'); prog.hidden = !(m && m.kind === 'live' && (m.running || m.mode === 'fixed'));
  if (!prog.hidden) { const last = m.trace[m.trace.length - 1], llr = last ? last.llr : 0; const f = m.mode === 'fixed' ? m.pairs.length / m.pairsTarget : Math.min(1, Math.abs(llr) / m.sprt.upper); $('#cr-progress-bar').style.width = `${(f * 100).toFixed(1)}%`; }
  // matrix
  const mx = $('#cr-matrix'); mx.innerHTML = '';
  if (m) {
    const A = m.config.A, B = m.config.B;
    const limit = c => c.kind === 'nodes' ? `${c.nodes} nodes` : c.kind === 'elo' ? `UCI_Elo ${c.elo} · ${CR_ELO_MS} ms` : `Level ${c.level} · ${LEVELS[c.level - 1].name}`;
    const rows = [['Engine', 'SF 19', 'SF 19'], ['Build', 'WASM', 'WASM'], ['Limit / move', limit(A), limit(B)], ['Hash', `${A.hash_mb || 16} MB`, `${B.hash_mb || 16} MB`], ['Threads', String(A.threads || 1), String(B.threads || 1)]];
    const head = document.createElement('tr'); head.innerHTML = '<th></th><th>A</th><th>B</th>'; mx.appendChild(head);
    for (const [k, a, b] of rows) { const tr = document.createElement('tr'); const d = a !== b; tr.innerHTML = `<td></td><td class="v${d ? ' diff' : ''}"></td><td class="v${d ? ' diff' : ''}"></td>`; tr.children[0].textContent = k; tr.children[1].textContent = a; tr.children[2].textContent = b; mx.appendChild(tr); }
  }
  // SPRT
  const kv = $('#cr-sprt'); kv.innerHTML = '';
  if (m) {
    const s = m.sprt, items = [['elo0 / elo1', `${s.elo0} / ${s.elo1}`], ['alpha / beta', `${s.alpha} / ${s.beta}`], ['bounds', `${s.lower.toFixed(3).replace('-', MIN)} / +${s.upper.toFixed(3)}`], ['model', 'pentanomial GSPRT'], ['book', `${BOOK.length} openings, paired`]];
    if (m.kind === 'recorded') items.push(['trace re-check', `${m.trace.length} points · max |ΔLLR| ${m.check.traceErr.toFixed(5)}`]);
    for (const [k, v] of items) { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; kv.append(dt, dd); }
  }
  // result
  const done = m ? m.games.filter(g => g && g.done) : [], est = m && m.pairs.length ? Monolith.eloEstimate(m.pairs) : null;
  const fmtElo = x => !isFinite(x) ? (x > 0 ? '+∞' : `${MIN}∞`) : `${x >= 0 ? '+' : MIN}${Math.abs(x).toFixed(1)}`;
  $('#cr-elo').textContent = est ? fmtElo(est.elo) : '—';
  $('#cr-ci').textContent = est ? `Elo · 95 % [${fmtElo(est.lo)}, ${fmtElo(est.hi)}]` : 'Elo · after the first pair';
  const w = done.filter(g => g.a_score === 1).length, d = done.filter(g => g.a_score === 0.5).length, l = done.filter(g => g.a_score === 0).length;
  $('#cr-wdl').textContent = done.length ? `W ${w} · D ${d} · L ${l} over ${done.length} games${m.kind === 'recorded' ? ` · file says +${m.check.recordedElo}` : ''}` : '';
  const bar = $('#cr-ci-bar'); bar.innerHTML = '';
  if (est && isFinite(est.lo) && isFinite(est.hi)) {
    const span = Math.max(50, Math.abs(est.lo), Math.abs(est.hi)) * 1.15, X = v => `${(50 + 50 * v / span).toFixed(2)}%`;
    bar.innerHTML = `<u style="left:50%"></u><i style="left:${X(est.lo)};width:calc(${X(est.hi)} - ${X(est.lo)})"></i><b style="left:calc(${X(est.elo)} - 1px)"></b>`;
    $('#ci-lo-lab').textContent = `${MIN}${span.toFixed(0)}`; $('#ci-hi-lab').textContent = `+${span.toFixed(0)}`;
  } else { $('#ci-lo-lab').textContent = ''; $('#ci-hi-lab').textContent = ''; }
  const pn = m ? Monolith.pentanomial(m.pairs) : { LL: 0, LD: 0, DD_WL: 0, WD: 0, WW: 0 }, mxp = Math.max(1, ...Object.values(pn));
  const pent = $('#cr-penta'); pent.innerHTML = '';
  [['LL', '0'], ['LD', '¼'], ['DD_WL', '½'], ['WD', '¾'], ['WW', '1']].forEach(([k, s]) => {
    const col = document.createElement('div'); if (pn[k] === mxp && mxp > 0) col.className = 'top';
    col.innerHTML = `<span>${pn[k]}</span><i style="height:${(pn[k] / mxp * 66).toFixed(1)}%"></i><small>${s}</small>`; col.title = `${k.replace('_', '+')}: ${pn[k]} pair${pn[k] === 1 ? '' : 's'}`; pent.appendChild(col);
  });
  // anomalies
  const list = $('#cr-anoms'); list.innerHTML = '';
  const flagged = m ? m.games.map((g, i) => ({ g, i })).filter(x => x.g && x.g.anomaly) : [];
  $('#cr-anom-count').textContent = m ? `${flagged.length} flagged` : '';
  $('#cr-anom-count').style.color = flagged.length ? TOK.crimson : '';
  for (const { g, i } of flagged) {
    const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; if (cr.expanded === i && cr.view === 'board') b.className = 'on';
    b.innerHTML = `<span>#${pad2(g.index)}</span><span class="jump"></span><span class="ply"></span>`;
    b.children[1].textContent = `${Monolith.fmtCp(g.anomaly.before)} → ${Monolith.fmtCp(g.anomaly.after)}`; b.children[2].textContent = `ply ${g.anomaly.ply}`;
    b.setAttribute('aria-label', `Open game ${g.index} on the board at ply ${g.anomaly.ply}`);
    b.addEventListener('click', () => crExpand(i)); li.appendChild(b); list.appendChild(li);
  }
  $('#cr-anom-note').textContent = !m ? '' : m.kind === 'recorded' ? `Rule re-checked here: ${m.check.agree} of ${m.check.total} games agree with the recorded flags. Balanced is |eval| ≤ 1.50, decisive ≥ 5.00, within one move of the same engine.` : 'Flagged when one engine\'s own eval goes from |eval| ≤ 1.50 to ≥ 5.00 within one of its moves.';
  $('#btn-cr-copy').disabled = !(m && m.games.some(g => g && g.done));
  renderMatchbar();
  // deck
  $('#osc-sub').textContent = `pentanomial GSPRT · per pair${m && m.kind === 'live' ? ' · live' : ''}`;
  setBadge($('#osc-badge'), m && m.kind === 'recorded' ? `[Runner: GSPRT · ${m.engine.replace('Stockfish ', 'SF')} × 2 · rec]` : `[Runner: GSPRT · ${engineFamily().short} × 2]`);
  $('#hive-sub').textContent = !m ? '' : m.kind === 'recorded' ? `${m.games.length} games · final states · the recorded run was sequential on one thread, laid out as it would tile ${m.games.length} workers` : `${done.length} of ${m.games.filter(Boolean).length} games done · ${m.par} at once in this browser`;
  setBadge($('#hive-badge'), m && m.kind === 'recorded' ? '[Runner: python-chess · SF19 × 2 · rec]' : `[Runner: browser · ${engineFamily().short} × 2]`);
  if (!$('#deck').hidden) { drawOsc(); drawHive(); }
  if (cr.view === 'board') { if (boardOverride) { renderBoardCard(); drawBeat(); } else if (m && m.games[cr.expanded]) crShowBoard(); }
  else $('#board-card').hidden = true;
}
/* LLR oscilloscope, refined after Dennis's note (10/15/2026) that it read jagged and stuttered.
   The trace is a monotone cubic through the per-pair LLR values (Fritsch–Carlson tangents, so
   it never overshoots a recorded point) over a soft fill toward zero, cyan above and crimson
   below; the GSPRT bounds are dashed rules with the regions past them faintly tinted. The view
   glides: when the run outgrows the x range or the LLR the y range, the axes ease to the new
   extents instead of jumping, and a new pair's segment draws itself in. The pair strip under
   it is diverging: a pair A won stands up, a lost pair hangs down, a split pair is a dot. */
const oscView = { xmax: 0, ext: 0, n: 0, key: '', raf: 0 };
function monotoneTangents(P) {
  const n = P.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / Math.max(1e-6, P[i + 1][0] - P[i][0]));
  if (n < 2) return m;
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s2 = a * a + b * b;
    if (s2 > 9) { const t = 3 / Math.sqrt(s2); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return m;
}
/* the curve through screen points P up to fractional index upto (the last segment partly drawn) */
function traceMonotone(g, P, upto) {
  const m = monotoneTangents(P), last = Math.min(P.length - 1, upto);
  g.moveTo(P[0][0], P[0][1]);
  const full = Math.floor(last);
  for (let i = 0; i < full; i++) {
    const h = P[i + 1][0] - P[i][0];
    g.bezierCurveTo(P[i][0] + h / 3, P[i][1] + m[i] * h / 3, P[i + 1][0] - h / 3, P[i + 1][1] - m[i + 1] * h / 3, P[i + 1][0], P[i + 1][1]);
  }
  const f = last - full, i = full;
  if (f > 0 && i + 1 < P.length) {
    const h = P[i + 1][0] - P[i][0], y0 = P[i][1], y1 = P[i + 1][1];
    for (let k = 1; k <= 10; k++) {   // Hermite samples across the part of the segment drawn so far
      const t = f * k / 10, t2 = t * t, t3 = t2 * t;
      const y = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m[i + 1];
      g.lineTo(P[i][0] + h * t, y);
    }
  }
  return last;
}
function drawOsc() {
  const cv = $('#osc'); const { g, w, h } = fitCanvas(cv), m = crModel();
  g.clearRect(0, 0, w, h); g.font = `10px ${FONT_T}`;
  if (!m) { g.fillStyle = TOK.ink3; g.fillText(cr.src === 'recorded' ? (cr.dataState === 'error' ? 'The recorded run is not reachable.' : 'Loading the recorded run…') : 'No live run yet.', 12, h / 2); oscView.xmax = 0; return; }
  const tr = m.trace, b = m.sprt, lastG = tr.length ? tr[tr.length - 1].games : 0;
  const ext1 = Math.max(3.2, ...tr.map(t => Math.abs(t.llr) + 0.3)), xmax1 = Math.max(m.kind === 'recorded' ? 100 : 20, Math.ceil((lastG + 1) / 10) * 10);
  // the view eases toward its targets; a different run (or reduced motion) snaps
  const key = `${m.kind}|${m.config && m.config.A ? m.config.A.name : ''}|${m.config && m.config.B ? m.config.B.name : ''}`;
  if (reduceMotion || !oscView.xmax || oscView.key !== key || tr.length < oscView.n - 0.01) Object.assign(oscView, { xmax: xmax1, ext: ext1, n: tr.length, key });
  else { const k = 0.2; oscView.xmax += (xmax1 - oscView.xmax) * k; oscView.ext += (ext1 - oscView.ext) * k; oscView.n = Math.min(tr.length, oscView.n + (tr.length - oscView.n) * 0.22 + 0.012); }
  const settled = Math.abs(oscView.xmax - xmax1) < 0.02 && Math.abs(oscView.ext - ext1) < 0.002 && tr.length - oscView.n < 0.003;
  if (settled) Object.assign(oscView, { xmax: xmax1, ext: ext1, n: tr.length });
  else if (!oscView.raf) oscView.raf = requestAnimationFrame(() => { oscView.raf = 0; if (!$('#deck').hidden) drawOsc(); });
  const xmax = oscView.xmax, ext = oscView.ext;
  const narrow = w < 560, L = 30, R = narrow ? 78 : 104, T = 10, B = 44, H = h - T - B, X = x => L + (w - L - R) * x / xmax, Y = v => T + H / 2 - (H / 2) * v / ext;
  const up = Y(b.upper), lo = Y(b.lower);
  // regions past the bounds
  g.fillStyle = 'rgba(44,200,216,.045)'; g.fillRect(L, T, w - L - R, Math.max(0, up - T));
  g.fillStyle = 'rgba(237,127,131,.045)'; g.fillRect(L, lo, w - L - R, Math.max(0, T + H - lo));
  // grid: integer LLR, the zero line a step brighter
  g.lineWidth = 1;
  for (let v = -Math.floor(ext); v <= Math.floor(ext); v++) {
    const y = Math.round(Y(v)) + 0.5; g.strokeStyle = v === 0 ? '#3A4352' : 'rgba(38,45,56,.75)';
    g.beginPath(); g.moveTo(L, y); g.lineTo(w - R, y); g.stroke();
    g.fillStyle = v === 0 ? TOK.ink2 : TOK.ink3; g.fillText(v > 0 ? `+${v}` : v < 0 ? `${MIN}${-v}` : '0', 4, y + 3);
  }
  const step = xmax > 160 ? 40 : xmax > 80 ? 20 : 10;
  g.fillStyle = TOK.ink3;
  for (let x = 0; x <= xmax + 0.01; x += step) { const px = X(x); if (px > w - R + 1) break; const t = String(x); g.fillText(t, px - g.measureText(t).width / 2, T + H + 13); }
  if (!narrow) g.fillText('games', w - R + 24, T + H + 13);
  g.setLineDash([4, 4]); g.strokeStyle = 'rgba(171,181,195,.7)';
  for (const [v, a, s_, c] of [[b.upper, narrow ? 'H1' : 'H1 · accept', `+${b.upper.toFixed(3)}`, TOK.cyan], [b.lower, narrow ? 'H0' : 'H0 · reject', `${MIN}${(-b.lower).toFixed(3)}`, TOK.crimson]]) {
    const y = Math.round(Y(v)) + 0.5; g.beginPath(); g.moveTo(L, y); g.lineTo(w - R, y); g.stroke();
    g.fillStyle = c; g.fillRect(w - R + 8, y - 9, 2, 8); g.fillStyle = TOK.ink2; g.fillText(a, w - R + 14, y - 2); g.fillStyle = TOK.ink3; g.fillText(s_, w - R + 8, y + 11);
  }
  g.setLineDash([]);
  // the trace: soft fill toward zero, a faint glow, then the line itself
  const P = [[X(0), Y(0)], ...tr.map(t => [X(t.games), Y(t.llr)])];
  if (P.length > 1) {
    const grad = g.createLinearGradient(0, T, 0, T + H);
    grad.addColorStop(0, 'rgba(44,200,216,.20)'); grad.addColorStop(0.5, 'rgba(44,200,216,0)'); grad.addColorStop(0.5, 'rgba(237,127,131,0)'); grad.addColorStop(1, 'rgba(237,127,131,.20)');
    g.beginPath(); const last = traceMonotone(g, P, oscView.n);
    const fi = Math.floor(last), ff = last - fi, ex = fi + 1 < P.length ? P[fi][0] + (P[fi + 1][0] - P[fi][0]) * ff : P[fi][0];
    g.lineTo(ex, Y(0)); g.lineTo(P[0][0], Y(0)); g.closePath(); g.fillStyle = grad; g.fill();
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); traceMonotone(g, P, oscView.n); g.strokeStyle = 'rgba(227,231,238,.10)'; g.lineWidth = 5; g.stroke();
    g.beginPath(); traceMonotone(g, P, oscView.n); g.strokeStyle = TOK.ink; g.lineWidth = 1.6; g.stroke();
    // per-pair nodes when there is room for them
    const gapPx = P.length > 2 ? (P[P.length - 1][0] - P[0][0]) / (P.length - 1) : 99;
    if (gapPx >= 7) { g.fillStyle = TOK.ink2; for (let i = 1; i <= Math.floor(oscView.n); i++) { g.beginPath(); g.arc(P[i][0], P[i][1], 1.6, 0, PI * 2); g.fill(); } }
  }
  if (tr.length) {
    const t = tr[tr.length - 1], ex = X(t.games), ey = Y(t.llr), c = m.verdict === 'H1' ? TOK.cyan : m.verdict === 'H0' ? TOK.crimson : TOK.ink;
    if (settled) { g.fillStyle = c; g.globalAlpha = 0.22; g.beginPath(); g.arc(ex, ey, 7, 0, PI * 2); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(ex, ey, 3.4, 0, PI * 2); g.fill(); }
    const label = m.verdict ? `${m.verdict} accepted · game ${t.games}` : `LLR ${t.llr.toFixed(3).replace('-', MIN)}`;
    g.font = `500 11px Geist, system-ui, sans-serif`; const lw = g.measureText(label).width; const lx = Math.max(L + 4, ex - lw - 14), ly = Math.max(T + 12, Math.min(T + H - 18, ey + (t.llr > 0 ? 30 : -24)));
    g.fillStyle = m.verdict ? c : TOK.ink; g.fillText(label, lx, ly); if (m.verdict) { g.font = `10px ${FONT_T}`; g.fillStyle = TOK.ink2; g.fillText(`LLR ${t.llr.toFixed(3).replace('-', MIN)}`, lx, ly + 13); }
  }
  // pair strip: diverging around a split pair
  const mid = h - 13, half = 8; g.font = `10px ${FONT_T}`; g.fillStyle = TOK.ink3; g.fillText('PAIRS', 2, mid + 3);
  g.fillText(narrow ? "A's pairs" : "A's pair score", w - R + 8, mid + 3);
  g.strokeStyle = 'rgba(38,45,56,.9)'; g.beginPath(); g.moveTo(L, Math.round(mid) + 0.5); g.lineTo(w - R, Math.round(mid) + 0.5); g.stroke();
  const bw = Math.max(1.5, Math.min(6, (X(2) - X(0)) * 0.55)), shown_ = Math.floor(oscView.n);
  m.pairs.forEach((pv, i) => {
    if (i >= shown_) return;
    const x = X(tr[i] ? tr[i].games : (i + 1) * 2) - bw / 2, d = pv - 0.5;
    if (Math.abs(d) < 1e-9) { g.fillStyle = TOK.slate; g.beginPath(); g.arc(x + bw / 2, mid + 0.5, Math.min(1.6, bw / 2 + 0.3), 0, PI * 2); g.fill(); return; }
    const hh = Math.abs(d) * 2 * half; g.fillStyle = d > 0 ? (d > 0.3 ? TOK.ivory : TOK.steel) : (d < -0.3 ? TOK.crimson : '#B76A72');
    if (g.roundRect) { g.beginPath(); g.roundRect(x, d > 0 ? mid - hh : mid + 1, bw, hh, Math.min(1.5, bw / 2)); g.fill(); } else g.fillRect(x, d > 0 ? mid - hh : mid + 1, bw, hh);
  });
}
export let hiveGeom = null;
export function drawHive() {
  const cv = $('#hive'), wrap = cv.parentElement, m = crModel();
  const W = Math.max(200, wrap.clientWidth - 32), games = m ? m.games : [], n = games.length;
  const gap = 8, labelH = 15, beatH = 12;
  let cols = Math.max(3, Math.floor((W + gap) / (60 + gap))); const tile = Math.min(96, Math.floor((W - gap * (cols - 1)) / cols));
  cols = Math.max(1, Math.floor((W + gap) / (tile + gap)));
  const cellH = tile + labelH + beatH + gap, rows = Math.max(1, Math.ceil(n / cols)), Hh = rows * cellH;
  cv.style.width = `${W}px`; cv.style.height = `${Hh}px`;
  const { g } = fitCanvas(cv); g.clearRect(0, 0, W, Hh);
  hiveGeom = { cols, tile, gap, cellH, labelH, beatH, n };
  if (!n) { g.fillStyle = TOK.ink3; g.font = `11px ${FONT_T}`; g.fillText(cr.src === 'live' ? 'Games appear here as they start.' : cr.dataState === 'error' ? 'The recorded run is not reachable.' : 'Loading…', 0, 16); return; }
  const s = tile / 8;
  games.forEach((gm, i) => {
    const cx = (i % cols) * (tile + gap), cy = Math.floor(i / cols) * cellH;
    if (!gm) return;
    const fen = gm.done ? gm.final_fen : (gm.states && gm.states.length ? Chess.fen(gm.states[gm.states.length - 1]) : '');
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { g.fillStyle = (r + f) % 2 ? TOK.sqDark : TOK.sqLight; g.fillRect(cx + f * s, cy + r * s, s, s); }
    if (fen) {
      const rows_ = fen.split(' ')[0].split('/');
      rows_.forEach((row, r) => { let f = 0; for (const ch of row) { if (/\d/.test(ch)) { f += +ch; continue; } const x = cx + f * s + s * 0.22, y = cy + r * s + s * 0.22, z = s * 0.56;
        if (ch === ch.toUpperCase()) { g.fillStyle = TOK.ivory; g.fillRect(x, y, z, z); } else { g.fillStyle = TOK.obsidian; g.fillRect(x, y, z, z); g.strokeStyle = TOK.steel; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, z - 1, z - 1); }
        f++; } });
    }
    const border = gm.anomaly ? TOK.crimson : !gm.done ? TOK.rule : gm.white_score === 1 ? TOK.ivory : gm.white_score === 0 ? TOK.steel : TOK.slate;
    g.strokeStyle = border; g.lineWidth = 2; g.strokeRect(cx + 1, cy + 1, tile - 2, tile - 2);
    if (i === cr.hover || i === cr.sel) { g.strokeStyle = TOK.ink; g.lineWidth = 1; g.strokeRect(cx - 2.5, cy - 2.5, tile + 5, tile + 5); }
    // heartbeat
    const ev = gm.evals || [], by = cy + tile + 3, bh = beatH - 4;
    if (ev.length > 1) {
      g.beginPath(); ev.forEach((e, k) => { const x = cx + tile * k / (ev.length - 1), y = by + bh / 2 - bh / 2 * Math.max(-1, Math.min(1, e / 1000)); k ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.strokeStyle = gm.anomaly ? TOK.crimson : TOK.ink3; g.lineWidth = 1; g.stroke();
    }
    g.font = `10px ${FONT_T}`; g.fillStyle = TOK.ink3;
    const black = gm.white === 'A' ? 'B' : 'A';
    g.fillText(`${pad2(gm.index)} ${gm.white}·${black} ${gm.done ? resultText(gm.white_score) : gm.termination === 'stopped' ? 'stopped' : 'live'}`, cx, cy + tile + beatH + 10);
  });
}
export function hiveIndexAt(x, y) {
  if (!hiveGeom) return -1; const { cols, tile, gap, cellH, n } = hiveGeom;
  const c = Math.floor(x / (tile + gap)), r = Math.floor(y / cellH); if (c < 0 || c >= cols || r < 0) return -1;
  if (x - c * (tile + gap) > tile || y - r * cellH > tile + 24) return -1;
  const i = r * cols + c; return i < n ? i : -1;
}
/* Heartbeat: the game's evaluation trace over a move rail, after Dennis's note (10/15/2026) that
   it should be more granular, with a slot for every move. Every ply owns one slot in the rail:
   White's moves in the upper lane, Black's in the lower, so the two sides interleave like
   brickwork. Book moves sit in plain raised slots; engine moves are shaded by how far the
   evaluation moved at that ply (|Δ| against the previous search, either engine): quiet under
   0.30, notable from 0.30, sharp (amber) from 1.00, severe (crimson) from 3.00. The anomaly's
   cause slot is crimson with its two neighbours outlined. Each scored ply is a node on the
   trace. Hover a slot to read the move and its swing; click, drag or use the arrow keys to go
   there. */
const BEAT = { L: 34, R: 10, T: 8, railH: 13, labelH: 12, gap: 6 };
let BEAT_SWING; // set in init()
function beatModel(gm) {
  const ev = gm.evals || [], op = gm.op || gm.opening.split(' ').length;
  const total = Math.max(op + ev.length, gm.plies || 0, (gm.moves || []).length, 1);
  const clampE = e => Math.max(-2000, Math.min(2000, e));
  // ply p (1-based): eval index p − op − 1, mover White when p is odd
  const evAt = p => { const k = p - op - 1; return k >= 0 && k < ev.length ? ev[k] : null; };
  const swingAt = p => { const k = p - op - 1; if (k < 1 || k >= ev.length) return null; return clampE(ev[k]) - clampE(ev[k - 1]); };
  return { ev, op, total, evAt, swingAt };
}
function beatGeom(w, h, total) {
  const { L, R, T, railH, labelH, gap } = BEAT;
  const railY = h - labelH - railH, plotB = railY - gap, H = Math.max(10, plotB - T), sw = (w - L - R) / total;
  return { L, R, T, H, railY, railH, sw, plotB, xc: p => L + sw * (p - 0.5), x0: p => L + sw * (p - 1) };
}
export function beatPlyAt(clientX) {
  const gm = boardOverride && boardOverride.game; if (!gm) return -1;
  const r = beatCv.getBoundingClientRect(), { total } = beatModel(gm), G = beatGeom(r.width, r.height, total), x = clientX - r.left;
  const p = x < G.L ? 0 : Math.floor((x - G.L) / G.sw) + 1;
  return Math.max(0, Math.min(p, (gm.states ? gm.states.length : total + 1) - 1));
}
function beatMoveText(gm, p) {
  if (p <= 0) return 'starting position';
  const san = (gm.moves || [])[p - 1] || '', num = Math.ceil(p / 2);
  return `${num}${p % 2 ? '.' : '…'} ${san}`;
}
export function drawBeat() {
  const cv = $('#beat-canvas'); if ($('#beat').hidden) return;
  const { g, w, h } = fitCanvas(cv), gm = boardOverride && boardOverride.game; g.clearRect(0, 0, w, h);
  if (!gm) return;
  const M = beatModel(gm), { ev, op, total } = M, G = beatGeom(w, h, total), { L, R, T, H, sw } = G;
  const Y = e => T + H / 2 - H / 2 * Math.max(-1, Math.min(1, e / 1000));
  const a = gm.anomaly, hov = cr.beatHover >= 0 ? cr.beatHover : -1, whiteEng = gm.white, blackEng = gm.white === 'A' ? 'B' : 'A';
  // plot: book region, balanced band, zero line, ±5.00 rules
  g.fillStyle = TOK.raised; g.fillRect(L, T, sw * op, H);
  g.fillStyle = 'rgba(85,98,117,.18)'; g.fillRect(L, Y(150), w - L - R, Y(-150) - Y(150));
  g.strokeStyle = TOK.rule; g.lineWidth = 1; g.beginPath(); g.moveTo(L, Math.round(Y(0)) + 0.5); g.lineTo(w - R, Math.round(Y(0)) + 0.5); g.stroke();
  g.setLineDash([3, 4]); for (const v of [500, -500]) { g.beginPath(); g.moveTo(L, Math.round(Y(v)) + 0.5); g.lineTo(w - R, Math.round(Y(v)) + 0.5); g.stroke(); } g.setLineDash([]);
  // move-number grid: every 10 moves, every 20 when 10 would crowd; a number never sits on
  // the book label or the ply counter
  const every = sw * 20 >= 30 ? 10 : sw * 40 >= 30 ? 20 : 50;
  g.font = `10px ${FONT_T}`;
  const plyLab = `ply ${cr.ply} / ${total}`, plyLabX = w - R - g.measureText(plyLab).width, bookOn = sw * op >= 34, bookEnd = bookOn ? L + 3 + g.measureText('book').width : L;
  for (let mvN = every; mvN * 2 <= total; mvN += every) {
    const x = Math.round(L + sw * mvN * 2) + 0.5;
    g.strokeStyle = 'rgba(126,136,152,.16)'; g.beginPath(); g.moveTo(x, T); g.lineTo(x, G.railY + G.railH); g.stroke();
    const t = String(mvN), tw = g.measureText(t).width;
    if (x - tw / 2 > bookEnd + 6 && x + tw / 2 < plyLabX - 8) { g.fillStyle = TOK.ink3; g.fillText(t, x - tw / 2, h - 2); }
  }
  g.fillStyle = TOK.ink3; g.fillText('+10', 4, T + 8); g.fillText(`${MIN}10`, 4, T + H);
  if (bookOn) g.fillText('book', L + 3, h - 2);
  // the trace, with a node for every scored ply when there is room for one
  if (ev.length) {
    g.beginPath(); ev.forEach((e, k) => { const x = G.xc(op + k + 1), y = Y(e); k ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.strokeStyle = TOK.steel; g.lineWidth = 1.3; g.lineJoin = 'round'; g.stroke();
    if (sw >= 4.5) {
      const r = Math.min(2.2, sw * 0.28);
      ev.forEach((e, k) => { const p = op + k + 1; g.fillStyle = a && Math.abs(p - a.ply) <= 1 ? TOK.crimson : TOK.ink2; g.beginPath(); g.arc(G.xc(p), Y(e), r, 0, PI * 2); g.fill(); });
    }
  }
  // the rail: two lanes, one slot per ply
  const laneH = (G.railH - 3) / 2, laneY = p => p % 2 ? G.railY : G.railY + laneH + 3, inset = sw >= 6 ? 1.5 : sw >= 3.5 ? 1 : 0;
  g.fillStyle = TOK.well; g.fillRect(L, G.railY - 1, w - L - R, G.railH + 2);
  g.fillStyle = TOK.ink3; g.font = `9px ${FONT_T}`; g.fillText('W', L - 12, G.railY + laneH - 0.5); g.fillText('B', L - 12, G.railY + G.railH);
  for (let p = 1; p <= total; p++) {
    const x = G.x0(p) + inset / 2, y = laneY(p), sWidth = Math.max(0.8, sw - inset);
    let c;
    if (p <= op) c = '#262E3A';
    else { const d = M.swingAt(p); c = d === null ? BEAT_SWING[3].c : BEAT_SWING.find(b => Math.abs(d) >= b.min).c; }
    if (a && p === a.ply) c = TOK.crimson;
    g.fillStyle = c; g.fillRect(x, y, sWidth, laneH);
  }
  const outline = (p, color, wdt = 1) => { if (p < 1 || p > total) return; g.strokeStyle = color; g.lineWidth = wdt; g.strokeRect(G.x0(p) + 0.5, laneY(p) - 1.5, Math.max(2, sw) - 1, laneH + 3); };
  if (a) { outline(a.ply - 1, TOK.crimson); outline(a.ply + 1, TOK.crimson); }
  // anomaly marker and the playhead
  if (a) { const x = Math.round(G.xc(a.ply)) + 0.5; g.strokeStyle = TOK.crimson; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, T); g.lineTo(x, G.plotB); g.stroke(); g.font = `10px ${FONT_T}`; g.fillStyle = TOK.crimson; g.fillText(`ply ${a.ply}`, Math.min(x + 4, w - 52), G.plotB - 3); }
  const cx = Math.round(cr.ply > 0 ? G.xc(cr.ply) : L) + 0.5; g.strokeStyle = TOK.ink; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, T); g.lineTo(cx, G.railY + G.railH + 1); g.stroke();
  if (cr.ply > 0) outline(cr.ply, TOK.ink, 1.25);
  if (hov > 0 && hov !== cr.ply) outline(hov, TOK.ink2);
  const e0 = M.evAt(cr.ply); g.font = `10px ${FONT_T}`;
  if (e0 !== null) { g.fillStyle = TOK.ink; g.fillRect(cx - 3, Y(e0) - 3, 6, 6); if (hov < 0) g.fillText(Monolith.fmtCp(e0), Math.min(cx + 6, w - 48), Math.max(T + 9, Y(e0) - 6)); }
  g.fillStyle = TOK.ink3; g.fillText(plyLab, plyLabX, h - 2);
  // hover readout: the move, who played it, its eval and the swing
  if (hov >= 0) {
    const e = M.evAt(hov), d = M.swingAt(hov), who = hov <= 0 ? '' : hov <= op ? 'book' : `${hov % 2 ? 'White' : 'Black'} (${hov % 2 ? whiteEng : blackEng})`;
    const sev = d === null ? null : BEAT_SWING.find(b => Math.abs(d) >= b.min);
    const l1 = `ply ${hov} · ${beatMoveText(gm, hov)}${who ? ' · ' + who : ''}`;
    const l2 = e === null ? (hov <= op && hov > 0 ? 'opening book, not searched' : '') : `own eval ${Monolith.fmtCp(e)}${d === null ? '' : ` · Δ ${d > 0 ? '+' : d < 0 ? MIN : '±'}${(Math.abs(d) / 100).toFixed(2)} ${sev.name}`}${a && hov === a.ply ? ' · anomaly' : ''}`;
    g.font = `500 11px Geist, system-ui, sans-serif`; const w1 = g.measureText(l1).width; g.font = `10px ${FONT_T}`; const w2 = l2 ? g.measureText(l2).width : 0;
    const bw = Math.max(w1, w2) + 16, bh = l2 ? 34 : 20, hx = hov > 0 ? G.xc(hov) : L;
    const bx = Math.max(L, Math.min(w - R - bw, hx + 10 + bw > w - R ? hx - 10 - bw : hx + 10)), by = T + 2;
    g.fillStyle = 'rgba(20,24,31,.8)'; g.fillRect(bx, by, bw, bh); g.strokeStyle = 'rgba(171,181,195,.45)'; g.lineWidth = 1; g.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    g.fillStyle = TOK.ink; g.font = `500 11px Geist, system-ui, sans-serif`; g.fillText(l1, bx + 8, by + 14);
    if (l2) { g.font = `10px ${FONT_T}`; g.fillStyle = sev && sev.min >= 100 ? sev.c : TOK.ink2; g.fillText(l2, bx + 8, by + 28); }
  }
  $('#beat-sub').textContent = `game #${pad2(gm.index)} · evals of both engines, White's view · ±10.00 · balanced band ±1.50 · a slot per move`;
  setBadge($('#beat-badge'), gm.live ? '[SF: info score · own search · live]' : '[SF: info score · own search · rec]');
  cv.setAttribute('aria-valuemax', String((gm.states ? gm.states.length : total + 1) - 1)); cv.setAttribute('aria-valuenow', String(cr.ply));
  cv.setAttribute('aria-valuetext', `ply ${cr.ply}, ${beatMoveText(gm, cr.ply)}${e0 !== null ? `, eval ${Monolith.fmtCp(e0)}` : ''}`);
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  BEAT_SWING = [{ min: 300, c: TOK.crimson, name: 'severe' }, { min: 100, c: TOK.amber, name: 'sharp' }, { min: 30, c: '#6F7A8A', name: 'notable' }, { min: 0, c: '#323B48', name: 'quiet' }];
}
