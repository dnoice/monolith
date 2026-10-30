/*
✒ Metadata
    - Title: Studies (MONOLITH Edition - v1.0)
    - File Name: studies.js
    - Relative Path: js/ui/studies.js
    - Artifact Type: javascript
    - Version: 1.0.2
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a hold checkpoint waits for the
      Coach's engine instead of passing unchecked (a study could read as
      solved), and says so when it cannot check; a solved date is read only
      as text.
    - 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release: the study engine moved out of js/ui/position.js when Dennis
      asked for a clearer, more visual Position tab, so the views and the
      rules of a study live apart. Adds the study order (Up next) and the
      progress counts the new views draw.

✒ Description:
    How a study runs. A puzzle plays its replies from its line and takes a
    wrong move back; a practice game is played out against Stockfish at
    full strength and judged by its goal (mate, queen a pawn, hold the
    draw); a set-up loads with the player's own game settings. Solved
    studies are kept in this browser with the date. The Position tab draws
    all of this (js/ui/position.js); nothing here touches the page beyond
    the snackbar and render().

✒ Key Features:
    - studyStart(): starts a study as its own game, without touching the
      saved game settings, and asks first when a game is in progress.
    - studyScripted() and studyAfterMove(): the replies, the checks and the
      verdict, move by move.
    - studyUpNext(): the first study not solved yet, in the study order
      (level 1 to level 3), overall or in one category.
    - studyNext(): the next unsolved study after one, in the same order and
      the same category when one is chosen.
    - studyProgress(): solved and total, overall or per category.
    - studyLineSan(): a puzzle's line in SAN, for the solution.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import, and it has no
    setup of its own (the saved studies are read where they are used). For
    example:
        import { study, studyStart, studyById } from '../ui/studies.js';
        studyStart(studyById.get('back-rank'));

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/motion.js,
      app/state.js, ui/snackbar.js, game/play.js, game/flow.js,
      coach/facts.js, coach/notes.js and ui/crucible.js; globals Chess
      (js/core/chess.js) and STUDIES (js/data/studies.js, documented in
      STUDIES.md).
    - Shared state (js/app/store.js): reads app.started, app.busy and
      app.view.
    - Saved state: prefs.studies, { id: { solved: 'MM/DD/YYYY' } }.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s); ES modules do not load from file://.
---------
*/
import { app } from '../app/store.js';
import { prefs, savePrefs } from '../app/base.js';
import { wait } from '../scene/motion.js';
import { cur, draft, game, match, render } from '../app/state.js';
import { hideSnack, snack } from './snackbar.js';
import { playMove, positionCmd } from '../game/play.js';
import { startGame, undo } from '../game/flow.js';
import { fill, hashStr } from '../coach/facts.js';
import { coachEngine, coachQueued, coachSearch, esOf } from '../coach/notes.js';
import { pad2 } from './crucible.js';

/* ---------- the study engine ----------
   study.cur is the study in progress: { s, state ('playing', 'solved' or 'failed'), tries, hint,
   shown, reject, pending, msg, msgKind, msgAt, checking, gen, ready }. study.sel is the study open
   in the library's detail view, study.cat the category shown. gen counts starts, so the Position
   tab can tell a new study from the one it has drawn. */
export const study = { cur: null, sel: null, cat: 'all', gen: 0 };
export const studyById = new Map(STUDIES.list.map(s => [s.id, s]));
export const STUDY_CAT = Object.fromEntries(STUDIES.cats);
export const SIDE_NAME = c => c === 'w' ? 'White' : 'Black';
export const NUM_WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const studySolved = id => !!(prefs.studies && prefs.studies[id] && typeof prefs.studies[id].solved === 'string' && prefs.studies[id].solved);   // a date, MM/DD/YYYY
/* The studies to work through, level 1 first; within a level, the dataset's order. Set-ups
   (mode 'free') have no goal, so they are never "up next" and never counted as solved. */
function studyOrder(cat = 'all') {
  return STUDIES.list.map((s, i) => [s, i]).filter(([s]) => s.mode !== 'free' && (cat === 'all' || s.cat === cat))
    .sort((a, b) => a[0].level - b[0].level || a[1] - b[1]).map(([s]) => s);
}
export const studyUpNext = (cat = 'all') => studyOrder(cat).find(s => !studySolved(s.id)) || null;
export function studyProgress(cat = 'all') {
  const L = studyOrder(cat);
  return { done: L.filter(s => studySolved(s.id)).length, total: L.length };
}
export function studyText(key, slots = {}, seed = '') {
  const pool = STUDIES.TEXT[key] || [], ok = pool.filter(t => !/\{\w+\}/.test(fill(t, slots)));
  if (!ok.length) return '';
  const uses = t => new Set(t.match(/\{\w+\}/g) || []).size, most = Math.max(...ok.map(uses)), rich = ok.filter(t => uses(t) === most);
  return fill(rich[hashStr(seed + key) % rich.length], slots);
}
export function studyLineSan(s) {
  let st = Chess.parseFen(s.fen).state; const out = [];
  s.line.forEach((u, i) => {
    const mv = Chess.fromUci(st, u); if (!mv) return;
    const nx = Chess.apply(st, mv), san = Chess.san(st, mv, nx);
    out.push(st.turn === 'w' ? `${st.fullmove}. ${san}` : i === 0 ? `${st.fullmove}… ${san}` : san); st = nx;
  });
  return out.join(' ');
}
/* The moves the player has made in the study so far. */
export const studyMyMoves = () => game.moves.filter((m, i) => game.states[i].turn === match.human).length;
export const userSetup = () => match.study ? { opponent: prefs.opponent, choice: prefs.choice, level: prefs.level } : { opponent: match.opponent, choice: match.choice, level: match.level };
export function studyStart(s) {
  const r = Chess.parseFen(s.fen); if (r.error) return;
  const go = () => {
    hideSnack();
    // a set-up plays with Play's settings, or by both sides on this screen when it says so (vs)
    if (s.mode === 'free') { study.cur = null; if (app.started) Object.assign(draft, userSetup()); if (s.vs === 'both') startGame(r.state, { opponent: 'human', side: s.side, level: draft.level, study: null }); else startGame(r.state); return; }
    const c = { s, state: 'playing', tries: 0, hint: 0, shown: false, reject: null, pending: null, msg: '', msgKind: '', msgAt: null, checking: false, gen: ++study.gen };
    startGame(r.state, { opponent: 'cpu', side: s.side, level: 8, study: c });
  };
  if (app.started && game.sans.length && !game.result && !study.cur) snack(`Start ${s.title}? The current game ends.`, [{ label: 'Keep playing', act: () => {} }, { label: 'Start', filled: true, act: go }], true);
  else go();
}
export function studyEnd() { study.cur = null; render(); }
export function studyHint() { const c = study.cur; if (!c || c.hint >= c.s.hints.length) return; c.hint++; render(); }
export function studyReveal() { const c = study.cur; if (!c) return; c.shown = true; render(); }
function studySay(c, text, kind = '') { c.msg = text; c.msgKind = kind; c.msgAt = cur(); }
function studyDone(c, ok, text) {
  if (c.state !== 'playing') return;
  c.state = ok ? 'solved' : 'failed'; studySay(c, text, ok ? 'good' : 'bad');
  if (ok && !c.shown) { const t = new Date(); if (!prefs.studies || typeof prefs.studies !== 'object') prefs.studies = {}; prefs.studies[c.s.id] = { solved: `${pad2(t.getMonth() + 1)}/${pad2(t.getDate())}/${t.getFullYear()}` }; savePrefs(); }
  snack(text);
}
/* A puzzle's reply comes from its line, after a short beat; a wrong move is taken back. */
export function studyScripted() {
  const c = study.cur; if (!c || c.s.mode !== 'puzzle' || c.state !== 'playing') return false;
  if (c.reject) return true;
  const st = cur(), uci = c.s.line[game.moves.length]; if (!uci) return false;
  if (c.pending === st) return true;
  c.pending = st;
  const play = () => {
    if (c.pending !== st) return;
    if (study.cur !== c || cur() !== st || game.result || app.view !== null) { c.pending = null; return; }
    if (app.busy) { setTimeout(play, 150); return; }
    c.pending = null; const mv = Chess.fromUci(st, uci); if (mv) playMove(mv);
  };
  setTimeout(play, 650);
  return true;
}
function studyTakeBack(c, st, tries = 0) {
  if (study.cur !== c || c.reject !== st) return;
  if (app.busy && tries < 40) { setTimeout(() => studyTakeBack(c, st, tries + 1), 150); return; }
  c.reject = null; if (cur() === st) undo();
}
async function studyCheckpoint(c, idx, n) {
  c.checking = true; studySay(c, studyText('checking', { n }), 'wait'); render();
  const E = coachEngine(), t0 = performance.now();
  while (!E.ready && !E.failed && performance.now() - t0 < 20000) await wait(0.2);
  if (study.cur !== c || c.state !== 'playing') return;
  if (!E.ready) { c.checking = false; studyDone(c, true, studyText('heldNoEngine', { n })); render(); return; }
  /* The check runs in the Coach's queue, so the Coach's own search cannot pre-empt it. A search
     that still comes back empty is tried again; it is never read as a hold. */
  let lines = [];
  for (let tries = 0; tries < 3 && !lines.length; tries++) {
    lines = await coachQueued(() => coachSearch(positionCmd(idx), { depth: 12, movetime: 1500 }));
    if (study.cur !== c || c.state !== 'playing') return;
  }
  if (!lines.length) { c.checking = false; studyDone(c, true, studyText('heldUnchecked', { n })); render(); return; }
  const es = 1 - esOf(lines[0]);
  c.checking = false;
  studyDone(c, es >= 0.25, es >= 0.25 ? studyText('held', { n }) : studyText('failSlipped', { n, who: SIDE_NAME(Chess.other(match.human)) }));
  render();
}
/* Called by afterMove for every move of a game a study runs (afterMove renders next). */
export function studyAfterMove() {
  const c = study.cur; if (!c || c.state !== 'playing') return;
  const k = game.moves.length; if (!k) return;
  const s = c.s, mv = game.moves[k - 1], before = game.states[k - 1], after = game.states[k], me = match.human, mine = before.turn === me, r = game.result;
  if (s.mode === 'puzzle') {
    if (!mine) { studySay(c, ''); return; }
    const final = k >= s.line.length, right = Chess.toUci(mv) === s.line[k - 1] || (final && s.goal === 'mate' && r && r.winner === me);
    if (!right) {
      c.tries++; c.reject = after;
      const t = studyText('wrong', { san: game.sans[k - 1] }, String(c.tries)); studySay(c, t, 'bad'); snack(t);
      studyTakeBack(c, after);
      return;
    }
    if (final) { const line = studyLineSan(s); return studyDone(c, true, c.shown ? studyText('solvedShown', { line }) : c.tries ? studyText('solvedTries', { line, tries: c.tries === 1 ? 'one wrong try' : `${NUM_WORD[c.tries] || c.tries} wrong tries` }) : studyText('solvedLine', { line }, s.id)); }
    studySay(c, studyText('right', {}, String(k)), 'good');
    return;
  }
  const myMoves = studyMyMoves();
  if (s.goal === 'mate') {
    if (r && r.winner === me) return studyDone(c, true, studyText(myMoves <= s.par ? 'matedPar' : 'mated', { n: myMoves, par: s.par }));
    if (r) return studyDone(c, false, studyText('failDraw', { result: r.text }));
    return;
  }
  if (s.goal === 'promote') {
    if (mine && mv.promo && !Chess.allLegal(after).some(m => m.to === mv.to)) return studyDone(c, true, studyText('promoted'));
    if (r) return studyDone(c, false, studyText(r.winner ? 'failLost' : 'failDraw', { result: r.text }));
    if (!after.board.some(p => p && p.c === me && p.t === 'p')) return studyDone(c, false, studyText('failPawn'));
    return;
  }
  if (s.goal === 'hold') {
    if (r) return r.winner && r.winner !== me ? studyDone(c, false, studyText('failLost', { result: r.text })) : studyDone(c, true, studyText('drawn', { result: r.text }));
    if (!mine && mv.promo) return studyDone(c, false, studyText('failQueened'));
    if (mine && myMoves >= s.moves && !c.checking) studyCheckpoint(c, k, myMoves);
  }
}
/* The next study to play after `from`: the next unsolved one in the study order, within the
   category shown when one is chosen (and `from` belongs to it); with all of them solved, simply
   the next one. */
export function studyNext(from, cat = study.cat) {
  const inCat = cat !== 'all' && from && from.cat === cat, L = studyOrder(inCat ? cat : 'all'), i = L.indexOf(from);
  for (let k = 1; k <= L.length; k++) { const s = L[(i + k) % L.length]; if (!studySolved(s.id)) return s; }
  return L[(i + 1) % L.length];
}

