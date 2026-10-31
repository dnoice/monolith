/*
✒ Metadata
    - Title: Analyze Model (MONOLITH Edition - v1.1)
    - File Name: analyze.js
    - Relative Path: js/ui/analyze.js
    - Artifact Type: javascript
    - Version: 1.1.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — Load
      takes a pasted FEN or PGN game (parsePgn) and opens it in Analyze; the
      reference and Load share analyzeLine(), and xr keeps a tapped square.
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: Go infinite over the recorded
      reference clears the reference's field and fork walk, which stayed on
      screen under the live badge; a search stopped partway through a depth
      closes the hole it can leave in the line table; and loading the
      reference game takes the board at once.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    MONOLITH Analyze's searches and state: the deep MultiPV search with WDL,
    the field search over every legal move, the fork walk along line 1, and
    the recorded reference run. Load brings a pasted FEN or PGN game into
    Analyze the way the reference game comes in.

✒ Key Features:
    - an: the tab's state; xr: the X-Ray's, with the square a tap picked
      on a touch screen (cleared when the position changes).
    - deep and field: two engines for the instrument.
    - anSync(), anGoToggle() and anStopSearch(): the search for the position
      shown, and Go infinite.
    - The fork walk: MultiPV 2 along line 1 to find the fork and
      instabilities.
    - analyzeLine(): a game or position taken into Analyze, both sides by
      hand, ending a running study.
    - loadForAnalysis(): Load's pasted FEN, or a PGN game read by
      parsePgn() (titled White – Black from its tags, or Game from a PGN);
      a game in progress is asked about first, and bad text says why.
    - loadReference(): Kasparov – Topalov 1999 with its recorded Stockfish
      19 run (data/analyze.json).

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { an, xr, anSync } from '../ui/analyze.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/board.js,
      scene/instruments.js, app/state.js, ui/snackbar.js, game/engine.js,
      game/board-ui.js, game/play.js, game/ceremony.js, game/flow.js,
      game/lines.js, game/input.js, game/pgn.js, ui/analyze-view.js,
      ui/nav.js and ui/studies.js; globals Chess (js/core/chess.js) and
      Monolith (js/core/monolith.js).
    - Shared state (js/app/store.js): sets app.fieldOn, app.cpuThinking,
      app.busy, app.started, app.setupOpen, app.view, app.hint, app.calc,
      app.fenDirty and app.lastMove.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, prefs } from '../app/base.js';
import { clearFragments, placePieces } from '../scene/board.js';
import { setVectors, setXray } from '../scene/instruments.js';
import { cur, game, match, render, shown } from '../app/state.js';
import { hideSnack, snack } from './snackbar.js';
import { createEngine, engine, putLine } from '../game/engine.js';
import { deselect } from '../game/board-ui.js';
import { posCmdFor, resultFor, stateIndex } from '../game/play.js';
import { clearCeremony } from '../game/ceremony.js';
import { explore, exploreState, setOrientation } from '../game/flow.js';
import { emptyCalc } from '../game/lines.js';
import { sanList, sanMove, stmScore } from '../game/input.js';
import { parsePgn } from '../game/pgn.js';
import { clearScrub, renderAnalyze } from './analyze-view.js';
import { setTab } from './nav.js';
import { study } from './studies.js';

/* =====================================================================================
   MONOLITH · Analyze. Three searches feed one instrument.
   - deep (its own engine): MultiPV with WDL on the position shown, stopped at the search limit
     unless Go infinite runs it on; its info stream feeds the stats, the search profile and the
     telemetry footer.
   - field (a second engine): every legal move at once (MultiPV = all) to the field depth; each
     square takes the best move that lands on it (the root move-value field).
   - fork walk (the second engine, once the field is done): MultiPV 2 at each of the first eight
     plies of line 1. The fork is the node whose two choices are closest; an instability is a
     node where the walk's first choice is not the trunk's move.
   A position matching the recorded reference (data/analyze.json) shows that recorded run, every
   readout badged as recorded, until Go infinite starts a live one.
   ===================================================================================== */
export let deep = null, fieldEng = null;
export const an = {
  key: '', st: null, idx: 0, gen: 0, tok: 0, source: null, status: 'idle', reason: '', infinite: false, stopAsked: false, t0: 0,
  lines: [], stats: {}, stream: [], field: null, fieldProg: null, walk: null, walkProg: null, focus: -1, scrub: null, pin: null, meta: null,
  rec: null, recState: 'idle', recErr: '', recPromise: null, ver: 0
};
export const xr = { held: false, sticky: false, hover: -1, pin: -1, touch: false };   // pin: the square a tap chose
// the engine's evaluation is on screen: Analyze open with a scored line, live or recorded (js/game/flow.js markConsult)
export const anEvalShown = () => prefs.tab === 'analyze' && (an.source === 'recorded' || an.lines.some(Boolean));
let anTimer = 0;
const anTouch = () => { an.ver++; if (!anTimer) anTimer = setTimeout(() => { anTimer = 0; renderAnalyze(); }, an.status === 'searching' ? 180 : 60); };
function ensureAnalysisEngines() {
  if (!deep) { deep = createEngine('deep', { onReady: () => { if (prefs.tab === 'analyze') anSync(true); }, onFail: () => anTouch() }); deep.init(); }
  if (!fieldEng) { fieldEng = createEngine('field', { onReady: () => { if (prefs.tab === 'analyze' && an.source === 'live' && !an.field && !an.fieldProg) anStartField(an.gen); }, onFail: () => anTouch() }); fieldEng.init(); }
}
const sameFen4 = (a, b) => a.split(' ').slice(0, 4).join(' ') === b.split(' ').slice(0, 4).join(' ');
/* A page opened from disk may not read the files beside it (or they may be missing), so a failed
   fetch there says what to check. */
export function dataErr(err) {
  return location.protocol === 'file:' ? 'not readable here; the page is open from a file on disk, where browsers often block reading the files beside it, so check that the data folder sits beside the page, or open the published page or serve the folder (for example python -m http.server)' : String(err && err.message || err);
}
function getRecorded() {
  if (an.recState === 'ready') return Promise.resolve(an.rec);
  if (an.recPromise) return an.recPromise;
  an.recState = 'loading';
  an.recPromise = fetch('data/analyze.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(j => {
      if (!j || !j.position || !Array.isArray(j.lines) || !Array.isArray(j.field)) throw new Error('unexpected format');
      an.rec = j; an.recState = 'ready';
      if (prefs.tab === 'analyze' && an.st && an.source !== 'recorded' && !an.infinite && sameFen4(Chess.fen(an.st), j.position.fen)) { anSync(true); }
      return j;
    })
    .catch(err => { an.recState = 'error'; an.recErr = dataErr(err); an.recPromise = null; return null; })
    .finally(() => anTouch());
  return an.recPromise;
}
export function anSync(force = false) {
  if (prefs.tab !== 'analyze') return;
  ensureAnalysisEngines(); getRecorded();
  const st = explore.on ? exploreState() : shown(), idx = stateIndex(st), key = posCmdFor(st);
  if (!force && key === an.key) return;
  const gen = ++an.gen; xr.pin = -1;   // a square chosen by a tap belongs to the position it was chosen in
  Object.assign(an, { key, st, idx, synLines: null, synWalk: null, synKey: '', source: null, status: 'idle', reason: '', infinite: false, stopAsked: false, lines: [], stats: {}, stream: [], field: null, fieldProg: null, walk: null, walkProg: null, focus: -1, meta: null });
  clearScrub();
  if (deep) deep.abort(); if (fieldEng) fieldEng.abort();
  const over = resultFor(st);
  if (over) { an.status = 'over'; an.reason = over.text; anTouch(); return; }
  if (an.recState === 'ready' && sameFen4(Chess.fen(st), an.rec.position.fen)) { loadRecorded(); anTouch(); return; }
  anStartDeep(false); anStartField(gen); anTouch();
}
export function anStop() {
  an.gen++; an.key = ''; an.status = 'idle';
  if (deep) deep.abort(); if (fieldEng) fieldEng.abort();
  clearScrub(); app.fieldOn = false; setVectors([]); setXray(-1);
}
function recInfo(l, turn) {
  const sgn = turn === 'w' ? 1 : -1, mate = l.score.mate !== null && l.score.mate !== undefined;
  return { multipv: l.multipv, pv: l.uci.slice(), kind: mate ? 'mate' : 'cp', value: mate ? l.score.mate * sgn : l.score.cp * sgn, wdl: l.wdl ? l.wdl.slice() : null,
    depth: l.depth, seldepth: l.seldepth, nodes: l.nodes, nps: l.nps, hashfull: l.hashfull, tbhits: l.tbhits, time: Math.round(l.time * 1000), scored: true };
}
function loadRecorded() {
  const R = an.rec, st = an.st, turn = st.turn;
  Object.assign(an, { source: 'recorded', status: 'stopped', reason: 'recorded', infinite: false });
  an.meta = { seconds: R.settings.seconds, hash: R.settings.hash_mb, fieldDepth: R.settings.field_depth, threads: R.settings.threads, engine: R.engine, date: R._meta && R._meta.date, name: R.position.name };
  an.lines = R.lines.map(l => recInfo(l, turn));
  const l1 = R.lines[0];
  an.stats = { depth: l1.depth, seldepth: l1.seldepth, nodes: l1.nodes, nps: l1.nps, hashfull: l1.hashfull, tbhits: l1.tbhits, time: Math.round(l1.time * 1000) };
  an.stream = R.stream.map(x => ({ t: x.t, depth: x.depth, nodes: x.nodes, nps: x.nps, hashfull: x.hashfull, tbhits: x.tbhits }));
  const moves = R.field.map(f => {
    const mv = Chess.fromUci(st, f.uci);
    return { uci: f.uci, san: f.san, from: mv ? mv.from : -1, to: Chess.sqIndex(f.to), capture: !!(mv && mv.capture), score: Monolith.fromRecord(f.score), e: turn === 'w' ? f.exp_white : 1 - f.exp_white, depth: f.depth };
  });
  setFieldFrom(moves, R.settings.field_depth, true);
  an.walk = {
    trunk: l1.uci.slice(0, 8), trunkDepth: l1.depth, depth: null, done: true, fork: R.fork_ply,
    plies: R.walk.map((w, k) => { const alts = w.alts.map(a => ({ uci: a.uci[0], pv: a.uci, san: a.san, score: Monolith.fromRecord(a.score) })); return { ply: k, turn: w.turn === 'white' ? 'w' : 'b', alts, gap: w.gap, instab: alts[0].uci !== l1.uci[k] }; })
  };
}
function setFieldFrom(moves, depth, done) {
  const f = Monolith.field(moves.map(m => ({ to: m.to, e: m.e, m })));
  if (!f) { an.field = null; return; }
  an.field = { moves, depth, done, bright: f.bright, best: f.best.m, perSquare: f.perSquare.map(x => x ? x.m : null), near: f.near, lit: f.lit, total: moves.length };
}
function anStartDeep(infinite) {
  if (!deep || !deep.ready) { an.status = deep && deep.failed ? 'failed' : 'loading'; anTouch(); return; }
  const gen = an.gen, tok = ++an.tok, st = an.st, legal = Chess.allLegal(st).length;
  // a live search over the recorded reference replaces all of it: its field and fork walk were the
  // file's, and would otherwise stay on screen under the live badge
  if (an.source === 'recorded') Object.assign(an, { field: null, fieldProg: null, walk: null, walkProg: null, synLines: null, synWalk: null, synKey: '' });
  Object.assign(an, { source: 'live', status: 'searching', infinite, reason: '', stopAsked: false, t0: performance.now(), lines: [], stats: {}, stream: [], meta: null });
  if (!an.field && an.walk) an.walk = null;
  const opts = { multipv: Math.max(1, Math.min(prefs.mo.multipv, legal)), hash: prefs.mo.hash, wdl: prefs.mo.wdl, onStats: inf => anStats(inf, tok) };
  if (infinite) opts.infinite = true; else opts.movetime = prefs.mo.limit * 1000;
  deep.go(an.key, opts, inf => anInfo(inf, tok)).then(() => {
    if (tok !== an.tok || gen !== an.gen || an.source !== 'live') return;
    closeHoles(an.lines);
    an.status = 'stopped'; an.reason = an.stopAsked ? 'user' : 'limit'; anTouch(); anMaybeWalk(gen);
  });
  anTouch();
}
/* A search stopped partway through a depth can leave a hole: a move rose to a higher line, its old
   line was cleared (putLine), and the line that would have replaced it was never reported. The
   final table closes it: the lines left, ordered by score and numbered again, so line 2 is always
   the second best of what was found and the sharpness compares lines 1 and 2. */
function closeHoles(lines) {
  if (!lines.some((l, i) => !l && lines.slice(i + 1).some(Boolean))) return;
  const L = lines.filter(Boolean).sort((a, b) => Monolith.expected(stmScore(b)) - Monolith.expected(stmScore(a)));
  lines.length = 0; L.forEach((l, i) => { l.multipv = i + 1; lines.push(l); });
}
function anInfo(inf, tok) {
  if (tok !== an.tok) return;
  putLine(an.lines, inf);
  if (inf.multipv === 1 && (!an.stream.length || an.stream[an.stream.length - 1].depth < inf.depth))
    an.stream.push({ t: (inf.time || 0) / 1000, depth: inf.depth, nodes: inf.nodes, nps: inf.nps, hashfull: inf.hashfull, tbhits: inf.tbhits });
  if (inf.multipv === 1) anMaybeWalk(an.gen);
  anTouch();
}
function anStats(inf, tok) {
  if (tok !== an.tok) return; const s = an.stats;
  if (inf.scored && inf.multipv === 1) { s.depth = inf.depth; s.seldepth = inf.seldepth; }
  for (const k of ['nodes', 'nps', 'hashfull', 'tbhits', 'time']) if (inf[k] !== undefined) s[k] = inf[k];
}
export function anGoToggle() {
  if (prefs.tab !== 'analyze') { setTab('analyze'); }
  if (!deep || !deep.ready || an.status === 'over') return;
  if (an.status === 'searching' && an.infinite) { an.stopAsked = true; deep.stopNow(); return; }
  anStartDeep(true);
  if (!an.field && !an.fieldProg) anStartField(an.gen);
}
export function anStopSearch() { if (deep && an.status === 'searching') { an.stopAsked = true; deep.stopNow(); } }
async function anStartField(gen) {
  if (!fieldEng || !fieldEng.ready || gen !== an.gen || !an.st) return;
  const st = an.st, legal = Chess.allLegal(st), n = Math.min(256, legal.length), depth = prefs.mo.fieldDepth;
  if (!n) return;
  an.field = null; an.fieldProg = { depth: 0, target: depth, total: n };
  const lines = [];
  const build = d => {
    const moves = lines.filter(Boolean).map(inf => {
      const mv = Chess.fromUci(st, inf.pv[0]); if (!mv) return null;
      const s = stmScore(inf);
      return { uci: inf.pv[0], san: Chess.san(st, mv, Chess.apply(st, mv)), from: mv.from, to: mv.to, capture: mv.capture, score: Monolith.fromInfo(inf, st.turn), e: Monolith.expected(s), depth: inf.depth };
    }).filter(Boolean);
    setFieldFrom(moves, d, false);
  };
  await fieldEng.go(an.key, { multipv: n, depth, hash: 16, wdl: false, lines }, inf => {
    if (gen !== an.gen) return;
    if (inf.depth > an.fieldProg.depth) an.fieldProg.depth = inf.depth;
    if (inf.multipv === n) { build(inf.depth); anTouch(); }
  });
  if (gen !== an.gen) return;
  build(depth); if (an.field) an.field.done = true; an.fieldProg = null; anTouch();
  anMaybeWalk(gen);
}
function anMaybeWalk(gen) {
  if (gen !== an.gen || an.walk || an.walkProg || !an.field || !an.field.done || an.source !== 'live') return;
  const l1 = an.lines[0];
  if (!l1 || !l1.pv || l1.pv.length < 2 || (l1.depth < 12 && an.status === 'searching')) return;
  anStartWalk(gen, l1);
}
async function anStartWalk(gen, l1) {
  const trunk = l1.pv.slice(0, 8), base = an.key;
  an.walk = { trunk, trunkDepth: l1.depth, depth: prefs.mo.walkDepth, plies: [], done: false, fork: -1 };
  an.walkProg = { at: 0, total: trunk.length };
  let st = an.st;
  for (let k = 0; k < trunk.length; k++) {
    if (gen !== an.gen) return;
    an.walkProg.at = k + 1; anTouch();
    if (Chess.allLegal(st).length < 2) break;
    const prefix = trunk.slice(0, k), pos = prefix.length ? (base.includes(' moves ') ? `${base} ${prefix.join(' ')}` : `${base} moves ${prefix.join(' ')}`) : base;
    const lines = [];
    await fieldEng.go(pos, { multipv: 2, depth: prefs.mo.walkDepth, hash: 16, wdl: false, lines });
    if (gen !== an.gen) return;
    const alts = lines.filter(Boolean).slice(0, 2).map(inf => ({ uci: inf.pv[0], pv: inf.pv, san: sanList(st, inf.pv, 10).map(x => x.san), score: Monolith.fromInfo(inf, st.turn) }));
    if (alts.length < 2) break;
    an.walk.plies.push({ ply: k, turn: st.turn, alts, gap: Math.abs(Monolith.expected(alts[0].score) - Monolith.expected(alts[1].score)), instab: alts[0].uci !== trunk[k] });
    const mv = Chess.fromUci(st, trunk[k]); if (!mv) break; st = Chess.apply(st, mv);
  }
  if (gen !== an.gen) return;
  an.walk.done = true; an.walk.fork = Monolith.fork(an.walk.plies); an.walkProg = null; anTouch();
}

/* A game or a position taken into Analyze, both sides moved by hand: the board is replaced at once,
   since nothing else owns it, and Analyze opens on its last position. states, moves and sans are
   the game record's; title is game.title; orient the side at the bottom. The reference and Load
   (a pasted FEN, or a game in PGN) come in here. */
export function analyzeLine(states, moves, sans, title, orient = 'w') {
  engine.abort(); app.cpuThinking = false; app.busy = false; hideSnack(); deselect(); clearCeremony();
  Object.assign(game, { states, moves, sans, result: null, title });
  Object.assign(match, { opponent: 'human', choice: 'w', human: 'w', study: false }); study.cur = null;
  game.result = resultFor(cur());
  app.started = true; app.setupOpen = false; app.view = null; app.hint = null; app.calc = emptyCalc(); app.fenDirty = false;
  const last = moves[moves.length - 1]; app.lastMove = last ? { from: last.from, to: last.to } : null;
  clearFragments(); placePieces(cur()); setOrientation(orient);
  if (prefs.tab !== 'analyze') setTab('analyze'); else { render(); anSync(true); }
}
// a game in progress is asked about first; the reference or a loaded position is simply replaced
const replacing = (q, label, go) => {
  if (app.started && game.sans.length && !game.result && !game.title) snack(`${q} The current game ends.`, [{ label: 'Keep playing', act: () => {} }, { label, filled: true, act: go }], true);
  else go();
};
/* Load: a pasted FEN, or a game in PGN, analysed where it is, without leaving Analyze (the
   palette's :fen does the same here). Returns what was wrong with the text, or '' once it is
   loading. */
export function loadForAnalysis(text) {
  const note = $('#an-load-note'), t = String(text || '').trim();
  const say = (msg, err = false) => { note.className = 'help' + (err ? ' err' : ''); note.textContent = msg; return err ? msg : ''; };
  if (!t) return say('Paste a FEN or a PGN game first.', true);
  const r = Chess.parseFen(t);
  if (r.error) return loadPgnForAnalysis(t, r.error, say);
  const side = r.state.turn === 'w' ? 'White' : 'Black';
  replacing('Analyze this position?', 'Analyze it', () => {
    analyzeLine([r.state], [], [], { name: 'Position from a FEN', sub: 'Loaded for analysis from a FEN, both sides by hand' }, r.state.turn);
    say(`Loaded, ${side} to move. Moves on the board are made by hand for both sides.`);
  });
  return '';
}
/* Not a FEN: a game in PGN (js/game/pgn.js reads it), opened at its last move with its moves in
   the list, as the reference game is. Text that is neither says what failed: the PGN's own error
   when it reads as a game (tags or move numbers), else the FEN's. */
function loadPgnForAnalysis(t, fenErr, say) {
  const g = parsePgn(t);
  if (g.error) return say(/^\s*(\[|\d+\s*\.)/.test(t) ? g.error : `This is neither a FEN nor a PGN game. As a FEN: ${fenErr}`, true);
  const T = g.tags, tag = k => T[k] && T[k] !== '?' ? T[k] : '', w = tag('White'), b = tag('Black');
  const at = [tag('Event'), (tag('Date').match(/^\d{4}/) || [''])[0]].filter(Boolean).join(' ');
  const sub = at ? `${at} · loaded for analysis from a PGN, both sides by hand` : 'Loaded for analysis from a PGN, both sides by hand';
  const title = w && b ? { name: `${w} – ${b}`, players: { w, b }, sub } : { name: 'Game from a PGN', sub };
  const n = g.sans.length, end = g.states[n].turn === 'w' ? 'White' : 'Black';
  replacing('Analyze this game?', 'Analyze it', () => {
    analyzeLine(g.states, g.moves, g.sans, title);
    say(n ? `Loaded, ${n} ${n === 1 ? 'move' : 'moves'}. The board shows the last position, ${end} to move; step back through the move list to see the game.`
      : `Loaded, ${end} to move. Moves on the board are made by hand for both sides.`);
  });
  return '';
}

/* the reference game: Kasparov – Topalov with its recorded run */
let pendingTitle = null;
export function loadReference() {
  getRecorded().then(R => {
    const note = $('#ref-note');
    if (!R) { note.className = 'help err'; note.textContent = `The recorded run is not reachable (data/analyze.json: ${an.recErr || 'missing'}).`; return; }
    let st = Chess.newGame(); const states = [st], moves = [], sans = [];
    for (const s of R.position.moves) {
      const mv = sanMove(st, s); if (!mv) { note.className = 'help err'; note.textContent = `The recorded moves do not replay (${s}).`; return; }
      const nx = Chess.apply(st, mv); moves.push(mv); sans.push(Chess.san(st, mv, nx)); states.push(nx); st = nx;
    }
    const go = () => {
      note.className = 'help'; note.textContent = 'Loaded. The board shows the position after 24…cxd4; step back through the move list to see the game.';
      analyzeLine(states, moves, sans, { name: 'Kasparov – Topalov', players: { w: 'Kasparov', b: 'Topalov' }, sub: `Wijk aan Zee 1999 · ${R.position.eco || ''} · loaded for analysis, both sides by hand`.replace(' ·  ·', ' ·') });
    };
    replacing('Load the reference game?', 'Load', go);
  });
}
