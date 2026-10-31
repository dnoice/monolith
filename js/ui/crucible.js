/*
✒ Metadata
    - Title: Crucible Model (MONOLITH Edition - v1.1)
    - File Name: crucible.js
    - Relative Path: js/ui/crucible.js
    - Artifact Type: javascript
    - Version: 1.1.2
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.2 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — cr
      keeps whether the board card's Details is open (cardOpen), so it stays
      open or closed while a game is stepped through.
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The app's
      own levels play as MONOLITH Novice (1) to MONOLITH Maximum (8), and a
      results JSON is titled Crucible Run (MONOLITH Edition - v1.0), under
      the name Dennis chose.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a run with nodes on both sides holds
      at most one pair per book opening (an opening played again would
      replay the same games), and every run stops at 200 pairs, an SPRT run
      undecided; :sprt start and Start share one check of the settings; and
      the results JSON writes unbounded values as text and adds the run's
      settings, each pair's games and the engine build that loaded.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    MONOLITH Crucible: a paired-opening gauntlet between two engine
    configurations, decided by a real pentanomial GSPRT. The recorded run is
    replayed and re-checked in the browser; a live run plays on its own
    Stockfish workers.

✒ Key Features:
    - cr: the tab's state; crModel(): the run as the deck shows it.
    - The recorded run (data/gauntlet.json): LLR trace, Elo, interval and
      pentanomial counts recomputed and compared.
    - Live runs: two workers per game slot, so A and B never share a hash
      table.
    - Limits by nodes, Elo or page level; BOOK: the openings.
    - crConfigError(): what is wrong with the run as set up; crPairCap()
      and CR_MAX_PAIRS: the most pairs a run plays (one per opening with
      nodes on both sides, 200 otherwise).
    - crCopyJson(): the run as JSON.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 17 of 26. Other modules import from it,
    for example:
        import { cr, crModel, pad2 } from '../ui/crucible.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js, app/state.js, ui/snackbar.js,
      game/engine.js, game/play.js, game/input.js, ui/analyze.js,
      ui/crucible-board.js, ui/crucible-view.js and ui/nav.js; globals Chess
      (js/core/chess.js), Monolith (js/core/monolith.js) and LEVELS
      (js/core/levels.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { $, prefs, savePrefs } from '../app/base.js';
import { render } from '../app/state.js';
import { snack } from './snackbar.js';
import { createEngine, engineFamily } from '../game/engine.js';
import { playLevel } from '../game/play.js';
import { sanMove } from '../game/input.js';
import { dataErr } from './analyze.js';
import { crLeaveBoard } from './crucible-board.js';
import { renderCrucible } from './crucible-view.js';
import { setTab } from './nav.js';

/* =====================================================================================
   MONOLITH · Crucible. A paired-opening gauntlet between two engine configurations, decided by
   a real pentanomial GSPRT (logistic Elo). The recorded run (data/gauntlet.json) is replayed and
   re-checked in the browser: its LLR trace, Elo, interval, pentanomial counts and anomaly flags
   are recomputed from the games and compared with what the file says. A live run plays here on
   its own Stockfish workers, two per game slot, so A and B never share a hash table. Leaving the
   tab does not stop a live run.
   ===================================================================================== */
export const BOOK = ["e4 e5 Nf3 Nc6 Bb5 a6", "e4 e5 Nf3 Nc6 Bc4 Bc5", "e4 c5 Nf3 d6 d4 cxd4", "e4 c5 Nc3 Nc6", "e4 e6 d4 d5 Nc3 Nf6", "e4 c6 d4 d5 e5 Bf5", "e4 d5 exd5 Qxd5", "e4 Nf6 e5 Nd5", "d4 d5 c4 e6 Nc3 Nf6", "d4 d5 c4 c6 Nf3 Nf6", "d4 Nf6 c4 e6 Nc3 Bb4", "d4 Nf6 c4 g6 Nc3 Bg7", "d4 Nf6 c4 c5 d5 e6", "d4 f5 g3 Nf6", "c4 e5 Nc3 Nf6", "c4 c5 Nf3 Nc6", "Nf3 d5 g3 Nf6", "Nf3 Nf6 c4 b6", "e4 g6 d4 Bg7", "e4 d6 d4 Nf6 Nc3 g6", "d4 e6 c4 Bb4+", "e4 e5 Nf3 d6 d4 exd4", "e4 c5 Nf3 e6 d4 cxd4", "d4 d5 Bf4 Nf6", "e4 e5 Nc3 Nf6", "d4 Nf6 Bg5 e6", "e4 c5 c3 Nf6", "e4 e6 d4 d5 e5 c5", "c4 Nf6 Nc3 e6", "d4 d5 Nf3 Nf6 e3 e6", "e4 e5 f4 exf4", "g3 d5 Bg2 Nf6", "e4 e5 Nf3 Nf6", "e4 e5 Nf3 Nc6 d4 exd4", "e4 e5 Nf3 Nc6 Nc3 Nf6", "e4 e5 Bc4 Nf6", "e4 c5 Nf3 Nc6 d4 cxd4", "e4 c5 Nf3 g6", "e4 c5 d4 cxd4 c3", "e4 c6 Nc3 d5 Nf3 Bg4", "e4 e6 d4 d5 Nd2 c5", "e4 e6 d4 d5 exd5 exd5", "e4 d6 d4 Nf6 Nc3 e5", "e4 Nc6 d4 d5", "e4 b6 d4 Bb7"];
export const CR_LIMITS = { nodes: [100, 2000000], elo: [1320, 3190], level: [1, 8] };
export const CR_ELO_MS = 150;
export const cr = { data: null, dataState: 'idle', dataErr: '', dataPromise: null, recorded: null, live: null, view: 'deck', sel: -1, hover: -1, beatHover: -1, expanded: -1, ply: 0, ver: 0, lastDraw: 0, cardOpen: false };
export const crMaxPar = () => Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
export const pad2 = n => String(n).padStart(2, '0');
export const resultText = ws => ws === 1 ? '1–0' : ws === 0 ? '0–1' : '½–½';
function crTouch() { cr.ver++; if (prefs.tab === 'crucible') { const now = performance.now(); if (now - cr.lastDraw > 220) { cr.lastDraw = now; renderCrucible(); } else if (!cr.pending) { cr.pending = setTimeout(() => { cr.pending = 0; cr.lastDraw = performance.now(); renderCrucible(); }, 240); } } }
export function getGauntlet() {
  if (cr.dataState === 'ready') return Promise.resolve(cr.data);
  if (cr.dataPromise) return cr.dataPromise;
  cr.dataState = 'loading';
  cr.dataPromise = fetch('data/gauntlet.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(j => { if (!j || !Array.isArray(j.games) || !j.sprt || !j.config) throw new Error('unexpected format'); cr.data = j; cr.recorded = crRecordedModel(j); cr.dataState = 'ready'; return j; })
    .catch(err => { cr.dataState = 'error'; cr.dataErr = dataErr(err); cr.dataPromise = null; return null; })
    .finally(() => { cr.ver++; if (prefs.tab === 'crucible') renderCrucible(); });
  return cr.dataPromise;
}
function crGame(g) {
  const op = g.opening.split(' ').length;
  return { index: g.index, opening: g.opening, op, white: g.white, moves: g.moves, plies: g.plies, final_fen: g.final_fen, evals: g.evals, white_score: g.white_score, a_score: g.a_score, termination: g.termination, seconds: g.seconds, anomaly: Monolith.anomaly(g.evals, op), recordedFlag: g.crash_ply, done: true };
}
function crTrace(pairs, elo0, elo1) { const t = []; for (let k = 1; k <= pairs.length; k++) t.push({ pair: k, games: 2 * k, llr: Monolith.gsprt(pairs.slice(0, k), elo0, elo1) }); return t; }
function crRecordedModel(G) {
  const games = G.games.map(crGame), pairs = [];
  for (let k = 0; 2 * k + 1 < games.length; k++) pairs.push((games[2 * k].a_score + games[2 * k + 1].a_score) / 2);
  const sp = G.sprt, b = Monolith.bounds(sp.alpha, sp.beta), trace = crTrace(pairs, sp.elo0, sp.elo1), last = trace[trace.length - 1];
  const traceErr = Math.max(0, ...trace.map((t, i) => sp.trace[i] ? Math.abs(t.llr - sp.trace[i].llr) : 0));
  const flagged = games.filter(g => g.anomaly), agree = games.filter(g => (g.anomaly ? g.anomaly.at : null) === (g.recordedFlag === undefined ? null : g.recordedFlag)).length;
  return {
    kind: 'recorded', engine: G.engine, config: { A: Object.assign({ kind: 'nodes', value: G.config.A.nodes }, G.config.A), B: Object.assign({ kind: 'nodes', value: G.config.B.nodes }, G.config.B) },
    sprt: { elo0: sp.elo0, elo1: sp.elo1, alpha: sp.alpha, beta: sp.beta, lower: b.lower, upper: b.upper }, mode: 'sprt', games, pairs, trace,
    verdict: last && last.llr >= b.upper ? 'H1' : last && last.llr <= b.lower ? 'H0' : null, wall: G.result.wall_seconds, par: 1, running: false,
    host: G.host, check: { traceErr, agree, total: games.length, flagged: flagged.length, recordedElo: G.result.elo, recordedCi: G.result.elo_ci95 }
  };
}
export const crModel = () => cr.src === 'live' ? cr.live : cr.recorded;
function crCfgFrom(kind, val) {
  const [lo, hi] = CR_LIMITS[kind] || [0, 0], v = Math.round(+val);
  if (!(v >= lo && v <= hi)) return { error: `${kind === 'nodes' ? 'Nodes per move' : kind === 'elo' ? 'UCI_Elo' : 'Level'} must be between ${lo.toLocaleString()} and ${hi.toLocaleString()}.` };
  if (kind === 'nodes') return { kind, value: v, nodes: v, name: `${engineFamily().short} · nodes ${v}`, hash_mb: 16, threads: 1 };
  if (kind === 'elo') return { kind, value: v, elo: v, name: `${engineFamily().short} · UCI_Elo ${v}`, hash_mb: 16, threads: 1 };
  return { kind, value: v, level: v, name: `MONOLITH ${LEVELS[v - 1].name} (${v})`, hash_mb: 16, threads: 1 };
}
function crGoOpts(cfg, lines) {
  if (cfg.kind === 'nodes') return { nodes: cfg.nodes, multipv: 1, hash: 16, wdl: false, lines };
  if (cfg.kind === 'elo') return { elo: cfg.elo, movetime: CR_ELO_MS, multipv: 1, hash: 16, wdl: false, lines };
  const L = playLevel(cfg.level);
  return { elo: L.elo, depth: L.depth, movetime: L.ms, multipv: L.lines || 1, hash: 16, wdl: false, lines };
}
function waitReady(e) { return new Promise(res => { const t0 = performance.now(); const tick = () => { if (e.ready) return res(true); if (e.failed || performance.now() - t0 > 30000) return res(false); setTimeout(tick, 120); }; tick(); }); }
/* The most pairs a run plays; an SPRT run that has crossed no bound by then stops undecided. */
export const CR_MAX_PAIRS = 200;
/* With node limits on both sides the engines play the same moves from the same position, so a book
   opening played a second time would replay the same pair of games and count it twice: such a run
   holds at most one pair per opening. With UCI_Elo or a level, the weakened engines vary their
   moves, and the openings come round again after the book's last. */
export const crPairCap = (A, B) => A.kind === 'nodes' && B.kind === 'nodes' ? Math.min(BOOK.length, CR_MAX_PAIRS) : CR_MAX_PAIRS;
/* What is wrong with the run as set up, or '' (the Start button and :sprt start both ask). */
export function crConfigError() {
  const c = prefs.cr, A = crCfgFrom(c.aKind, c.aVal), B = crCfgFrom(c.bKind, c.bVal);
  if (A.error || B.error) return A.error || B.error;
  if (c.mode === 'sprt' && !(c.elo1 > c.elo0)) return 'elo1 must be greater than elo0.';
  const cap = crPairCap(A, B);
  if (c.mode === 'fixed' && !(c.pairs >= 1 && c.pairs <= cap)) return cap < CR_MAX_PAIRS ? `With nodes on both sides, pairs must be between 1 and ${cap}: the book has ${BOOK.length} openings, and playing one again would replay the same two games.` : `Pairs must be between 1 and ${CR_MAX_PAIRS}.`;
  return '';
}
export async function crStartLive() {
  if (cr.live && cr.live.running) return;
  const c = prefs.cr, A = crCfgFrom(c.aKind, c.aVal), B = crCfgFrom(c.bKind, c.bVal);
  const err = crConfigError();
  if (err) { $('#cr-run-note').className = 'help err'; $('#cr-run-note').textContent = err; return; }
  const P = Math.max(1, Math.min(crMaxPar(), c.par)), b = Monolith.bounds(c.alpha, c.alpha);
  const Lv = cr.live = {
    kind: 'live', engine: 'Stockfish 19 WASM', config: { A, B }, pairGames: [], sprt: { elo0: c.elo0, elo1: c.elo1, alpha: c.alpha, beta: c.alpha, lower: b.lower, upper: b.upper }, mode: c.mode,
    pairsTarget: c.mode === 'fixed' ? c.pairs : crPairCap(A, B), par: P, games: [], pairs: [], counted: new Set(), trace: [], running: true, starting: true, verdict: null, t0: performance.now(), wall: 0, next: 0, slots: [], note: '', stopReason: ''
  };
  cr.src = 'live'; prefs.cr.src = 'live'; savePrefs(); cr.expanded = -1; cr.view = 'deck'; crLeaveBoard(); crTouch(); render();
  for (let i = 0; i < P; i++) { const slot = { A: createEngine(`crucible-${i + 1}-a`), B: createEngine(`crucible-${i + 1}-b`) }; slot.A.init(); slot.B.init(); Lv.slots.push(slot); }
  const ok = await Promise.all(Lv.slots.flatMap(s => [waitReady(s.A), waitReady(s.B)]));
  Lv.starting = false;
  if (!ok.every(Boolean) || !Lv.running) { Lv.running = false; Lv.note = Lv.stopReason ? '' : 'The engines could not start in this browser.'; crTerminate(Lv); crTouch(); render(); return; }
  const ch = Lv.slots[0].A.choice; if (ch) Lv.engine = `${ch.name} · ${ch.build}`;   // the build that loaded, not the one hoped for
  crTouch();
  await Promise.all(Lv.slots.map(s => crSlotLoop(Lv, s)));
  if (Lv.running) Lv.running = false;
  Lv.wall = (performance.now() - Lv.t0) / 1000; crTerminate(Lv); crTouch(); render();
  if (Lv.verdict) snack(`Crucible: ${Lv.verdict === 'H1' ? 'H1 accepted. A is stronger by more than elo0' : 'H0 accepted. A is not stronger by elo1'} after ${Lv.pairs.length} pairs.`, [{ label: 'Open', act: () => setTab('crucible') }]);
}
function crTerminate(Lv) { for (const s of Lv.slots) { s.A.terminate(); s.B.terminate(); } }
export function crStopLive(reason = 'user') {
  const Lv = cr.live; if (!Lv || !Lv.running) return;
  Lv.running = false; Lv.stopReason = reason;
  for (const s of Lv.slots) { s.A.abort(); s.B.abort(); }
  crTouch(); render();
}
async function crSlotLoop(Lv, slot) {
  while (Lv.running) {
    const gi = Lv.next, pair = Math.floor(gi / 2);
    if (pair >= Lv.pairsTarget) return;
    Lv.next++;
    const g = { index: gi + 1, opening: BOOK[pair % BOOK.length], round: Math.floor(pair / BOOK.length) + 1, op: 0, white: gi % 2 === 0 ? 'A' : 'B', moves: [], states: [], mvs: [], evals: [], plies: 0, final_fen: '', white_score: null, a_score: null, termination: '', anomaly: null, done: false, live: true, seconds: 0 };
    Lv.games[gi] = g;
    await crPlay(Lv, slot, g);
    if (!g.done) { g.termination = 'stopped'; crTouch(); return; }
    crPairCheck(Lv, pair);
  }
}
async function crPlay(Lv, slot, g) {
  const t0 = performance.now();
  let st = Chess.newGame(); g.states.push(st);
  const uci = [];
  for (const san of g.opening.split(' ')) { const mv = sanMove(st, san); if (!mv) break; const nx = Chess.apply(st, mv); g.moves.push(Chess.san(st, mv, nx)); g.mvs.push(mv); g.states.push(nx); uci.push(Chess.toUci(mv)); st = nx; }
  g.op = g.moves.length; g.plies = g.moves.length;
  const eng = { w: g.white === 'A' ? slot.A : slot.B, b: g.white === 'A' ? slot.B : slot.A };
  const cfgOf = { w: Lv.config[g.white], b: Lv.config[g.white === 'A' ? 'B' : 'A'] };
  slot.A.send('ucinewgame'); slot.B.send('ucinewgame');
  const reps = new Map(), rk = s => Chess.fen(s).split(' ').slice(0, 4).join(' ');
  reps.set(rk(st), 1);
  let winRun = 0, winSign = 0, drawRun = 0;
  const end = (ws, term) => { g.white_score = ws; g.a_score = g.white === 'A' ? ws : 1 - ws; g.termination = term; g.final_fen = Chess.fen(st); g.anomaly = Monolith.anomaly(g.evals, g.op); g.done = true; g.seconds = (performance.now() - t0) / 1000; crTouch(); };
  while (Lv.running) {
    const s = Chess.status(st);
    if (s.mate) return end(st.turn === 'w' ? 0 : 1, 'checkmate');
    if (s.stale) return end(0.5, 'stalemate');
    if (s.insufficient) return end(0.5, 'insufficient material');
    if (s.draw50) return end(0.5, 'fifty-move rule');
    if ((reps.get(rk(st)) || 0) >= 3) return end(0.5, 'threefold repetition');
    if (g.moves.length >= 240) return end(0.5, 'adjudicated draw');
    const side = st.turn, e = eng[side], cfg = cfgOf[side], lines = [];
    const best = await e.go(`position startpos${uci.length ? ` moves ${uci.join(' ')}` : ''}`, crGoOpts(cfg, lines));
    if (!Lv.running) return;
    let mv = null;
    const Lc = cfg.kind === 'level' ? playLevel(cfg.level) : null;
    if (Lc && Lc.lines) mv = chooseMove(st, lines, Lc);
    if (!mv && best && best !== '(none)') mv = Chess.fromUci(st, best);
    if (!mv) return end(0.5, 'no move from engine');
    let ev = 0; const inf = lines[0];
    if (inf) { const w = Monolith.fromInfo(inf, side); ev = Monolith.isMate(w) ? (w.mate > 0 ? 9999 : -9999) : Math.max(-9999, Math.min(9999, w.cp)); }
    g.evals.push(ev);
    const nx = Chess.apply(st, mv); g.moves.push(Chess.san(st, mv, nx)); g.mvs.push(mv); g.states.push(nx); uci.push(Chess.toUci(mv)); st = nx; g.plies = g.moves.length;
    const k = rk(st); reps.set(k, (reps.get(k) || 0) + 1);
    if (Math.abs(ev) >= 1000) { if (winRun && Math.sign(ev) === winSign) winRun++; else { winRun = 1; winSign = Math.sign(ev); } } else winRun = 0;
    if (winRun >= 4) return end(winSign > 0 ? 1 : 0, 'adjudicated win');
    drawRun = g.moves.length > 80 && Math.abs(ev) <= 10 ? drawRun + 1 : 0;
    if (drawRun >= 10) return end(0.5, 'adjudicated draw');
    if (g.moves.length % 4 === 0) crTouch();
  }
}
function crPairCheck(Lv, pair) {
  const a = Lv.games[2 * pair], b = Lv.games[2 * pair + 1];
  if (!a || !b || !a.done || !b.done || Lv.counted.has(pair)) return;
  Lv.counted.add(pair); Lv.pairs.push((a.a_score + b.a_score) / 2); Lv.pairGames.push([a.index, b.index]);   // pairs count in the order they finish
  const llr = Monolith.gsprt(Lv.pairs, Lv.sprt.elo0, Lv.sprt.elo1);
  Lv.trace.push({ pair: Lv.pairs.length, games: Lv.games.filter(x => x && x.done).length, llr });
  if (Lv.mode === 'sprt' && Lv.running) {
    if (llr >= Lv.sprt.upper) { Lv.verdict = 'H1'; crStopLive('bound'); }
    else if (llr <= Lv.sprt.lower) { Lv.verdict = 'H0'; crStopLive('bound'); }
  }
  if (Lv.pairs.length >= Lv.pairsTarget && Lv.running) { Lv.running = false; Lv.stopReason = Lv.mode === 'fixed' ? 'pairs' : 'limit'; }
  crTouch();
}
/* The run as JSON, on the clipboard. Numbers JSON cannot hold are written as text: an unbounded
   Elo or interval end as "+inf" or "-inf". Each pair names its two games, in the order the pairs
   finished (the order the trace counts them in). */
export function crCopyJson() {
  const m = crModel(); if (!m) return;
  const games = m.games.filter(g => g && g.done);
  const pairs = m.pairs, est = Monolith.eloEstimate(pairs), pn = Monolith.pentanomial(pairs);
  const num = x => isFinite(x) ? +x.toFixed(1) : x > 0 ? '+inf' : '-inf';
  const pairGames = m.pairGames || pairs.map((s, i) => [2 * i + 1, 2 * i + 2]);
  const today = new Date(), mmddyyyy = `${pad2(today.getMonth() + 1)}/${pad2(today.getDate())}/${today.getFullYear()}`;
  const out = {
    _meta: { title: 'Crucible Run (MONOLITH Edition - v1.0)', file: 'crucible-run.json', path: 'data/crucible-run.json', artifact_type: 'data', version: '1.0.0', date: mmddyyyy, author: "Dennis 'dendogg' Smaltz", ai: 'Anthropic - Claude Opus 5.5', signature: '︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!', description: `${m.kind === 'recorded' ? 'Recorded gauntlet, re-checked in the browser' : 'Live gauntlet played in the browser'}: paired openings, pentanomial GSPRT trace.` },
    engine: m.engine, config: m.config, sprt: Object.assign({}, m.sprt, { trace: m.trace }),
    result: { pairs: pairs.length, games: games.length, a_wins: games.filter(g => g.a_score === 1).length, draws: games.filter(g => g.a_score === 0.5).length, a_losses: games.filter(g => g.a_score === 0).length, pentanomial: pn, elo: est ? num(est.elo) : null, elo_ci95: est ? [num(est.lo), num(est.hi)] : null, wall_seconds: m.kind === 'live' ? +(m.running ? (performance.now() - m.t0) / 1000 : m.wall).toFixed(1) : m.wall, verdict: m.verdict },
    run: { kind: m.kind, mode: m.mode, pairs_target: isFinite(m.pairsTarget) ? m.pairsTarget : null, parallel: m.par, stop_reason: m.stopReason || (m.verdict ? 'bound' : null), book_openings: BOOK.length },
    pairs: pairs.map((s, i) => ({ pair: i + 1, games: pairGames[i], a_score: s })),
    games: games.map(g => ({ index: g.index, opening: g.opening, round: g.round || 1, white: g.white, moves: g.moves, plies: g.plies, final_fen: g.final_fen, evals: g.evals, white_score: g.white_score, a_score: g.a_score, termination: g.termination, crash_ply: g.anomaly ? g.anomaly.at : null, seconds: g.seconds }))
  };
  const text = JSON.stringify(out, null, 1);
  const done = () => snack('Results JSON copied to the clipboard.');
  try { navigator.clipboard.writeText(text).then(done, () => snack('The clipboard is blocked here.')); } catch (e) { snack('The clipboard is blocked here.'); }
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  cr.src = prefs.cr.src === 'live' ? 'live' : 'recorded';
}
