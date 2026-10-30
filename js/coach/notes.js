/*
✒ Metadata
    - Title: Coach Notes (MONOLITH Edition - v1.0)
    - File Name: notes.js
    - Relative Path: js/coach/notes.js
    - Artifact Type: javascript
    - Version: 1.0.2
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: asking for a hint while one is being
      worked out no longer cancels both; coachQueued() lets a study wait its
      turn behind the Coach's reading.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The Coach at work: its own engine, the note for each move (your move
    judged against the best, the opponent's move read for you), the watch on
    your turn, the hint, and the review at the end.

✒ Key Features:
    - coachEngine() and coachSearch(): a separate engine, so the Coach never
      slows the game.
    - coachMove(): a verdict and what the move does, with the better move
      after a slip.
    - coachWatch(): check, threats of mate or material, loose pieces, else a
      tip for the phase.
    - Opening habits said once a game.
    - giveHint(): a hint in steps, from a nudge to the move.
    - coachReview() and coachEnd(): accuracy and the moves worth another
      look.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 15 of 26. Other modules import from it,
    for example:
        import { coachKick, coachOn, giveHint } from '../coach/notes.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/board.js,
      app/state.js, game/engine.js, game/board-ui.js, game/play.js,
      game/lines.js, coach/coach.js, coach/facts.js, coach/book.js and
      game/input.js; globals Chess (js/core/chess.js), Monolith
      (js/core/monolith.js) and COACH_VOICE (js/data/coach-voice.js).
    - Shared state (js/app/store.js): sets app.hint; reads app.started.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { prefs } from '../app/base.js';
import { PIECE_NAMES } from '../scene/board.js';
import { canMoveNow, cur, game, match, render, SIDE } from '../app/state.js';
import { createEngine, engine } from '../game/engine.js';
import { rookSqOf } from '../game/board-ui.js';
import { positionCmd, repetitions, stateIndex } from '../game/play.js';
import { refreshAnalysis } from '../game/lines.js';
import {
  CENTRE, hasDefender, isPassed, materialPhrase, MINOR_HOME, phaseOf, PVAL, pvMaterial, see, undeveloped
} from './coach.js';
import { hashStr, matePattern, moveFacts, voice, why } from './facts.js';
import { bookAt, openingOf } from './book.js';
import { stmScore } from '../game/input.js';

/* ---------- the coach's engine and its notes ---------- */
export let coach; // set in init()
export const coachOn = () => prefs.coach !== false;
export const coachSides = () => !app.started || game.title ? [] : match.opponent === 'cpu' ? [match.human] : ['w', 'b'];
const noteOf = st => { let n = coach.notes.get(st); if (!n) { n = { move: null, watch: null, end: null }; coach.notes.set(st, n); } return n; };
// stmScore (the engine's score from the side to move) is shared with Analyze, defined there
export const esOf = inf => Monolith.expected(stmScore(inf));
function saidOnce(key) {
  const root = game.states[0]; let set = coach.said.get(root); if (!set) { set = new Set(); coach.said.set(root, set); }
  if (set.has(key)) return false; set.add(key); return true;
}
export function coachEngine() {
  if (!coach.eng) { coach.eng = createEngine('coach', { onReady: () => coachKick(), onFail: () => render() }); coach.eng.init(); }
  return coach.eng;
}
export async function coachSearch(cmd, opts) {
  const lines = [];
  await coach.eng.go(cmd, Object.assign({ depth: 12, movetime: 1500, multipv: 1, hash: 32, lines }, opts));
  return lines.filter(Boolean);
}
async function coachLines(st, idx) {
  const have = coach.pre.get(st); if (have) return have;
  const lines = await coachSearch(positionCmd(idx), { multipv: Math.min(3, Chess.allLegal(st).length) });
  if (lines.length) coach.pre.set(st, lines);
  return lines;
}
/* Work that must not be pre-empted by the Coach's own searches (a study's checkpoint): it joins
   the Coach's queue and runs between its notes, on the same engine. */
export function coachQueued(fn) {
  const p = coach.queue.then(fn);
  coach.queue = p.catch(e => { console.warn('coach', e); });
  return p;
}
/* Called after every change to the live game. The work runs in order on the coach's engine; a
   newer call takes over, and a note already written is never redone. */
export function coachKick() {
  if (!coachOn() || !app.started || !coachSides().length) return;
  const E = coachEngine(); if (!E.ready) return;
  const gen = ++coach.gen, idx = game.states.length - 1, root = game.states[0];
  coach.queue = coach.queue.then(() => coachWork(idx, gen, root)).catch(e => { console.warn('coach', e); coach.busy = null; });
}
async function coachWork(idx, gen, root) {
  const live = () => gen === coach.gen && game.states[0] === root && game.states.length - 1 >= idx;
  // at the end of the game, grade any of your moves skipped while the moves came quickly, so the
  // review counts them all; otherwise the last two plies
  const over = game.result && idx === game.states.length - 1, sides = coachSides();
  for (let i = over ? 1 : Math.max(1, idx - 1); i <= idx; i++) {
    if (!live()) return;
    if (i < idx - 1 && !sides.includes(game.states[i - 1].turn)) continue;
    await coachMove(i, live);
  }
  if (!live()) return;
  await coachWatch(idx, live);
  coach.busy = null; render();
}
/* reply keys for the facts of an opponent's move, in the order they are told */
const REPLY_KEY = { mate: 'mate', doubleCheck: 'doubleCheck', discCheck: 'discCheck', promote: 'promote', underpromote: 'underpromote', fork: 'fork', trap: 'trap', skewer: 'skewer', pin: 'pin',
  discAttack: 'discAttack', removeDefender: 'removeDefender', enPassant: 'enPassant', capture: 'capture', check: 'check', castle: 'castle', escape: 'escape', attack: 'attack', defend: 'defend',
  develop: 'develop', outpost: 'outpost', openFile: 'openFile', halfOpen: 'halfOpen', seventh: 'seventh', rookBehind: 'rookBehind', centre: 'centre', passer: 'passer', fianchetto: 'fianchetto',
  connect: 'connect', winsPair: 'winsPair', kingUp: 'kingUp' };
const URGENT = new Set(['mate', 'doubleCheck', 'discCheck', 'fork', 'trap', 'check']);
async function coachMove(i, live) {
  const before = game.states[i - 1], after = game.states[i], mv = game.moves[i - 1], san = game.sans[i - 1];
  if (!before || !after || !mv || noteOf(after).move) return;
  const mover = before.turn, sides = coachSides(), head = `${before.fullmove}${mover === 'w' ? '.' : '…'} ${san}`, seed = `${i}:${san}`;
  const book = bookAt(after), prevOpening = i >= 2 ? openingOf(i - 1) : null, newName = book && (!prevOpening || prevOpening.name !== book.name);
  if (!sides.includes(mover)) {
    // the opponent's move, read for you: the opening's name when it changes, else what it does
    const facts = moveFacts(before, mv, after), f = facts.find(x => REPLY_KEY[x.key]), who = match.opponent === 'cpu' ? 'Stockfish' : SIDE[mover];
    const slots = Object.assign({ san, who }, f ? f.slots : {}, { piece: f && f.slots.piece ? f.slots.piece : PIECE_NAMES[before.board[mv.from].t] });
    let key = f ? REPLY_KEY[f.key] : null;
    if (newName && !(f && URGENT.has(f.key))) { key = 'book'; slots.opening = book.name; }
    const counts = movesPerPiece(i), n = counts.get(mv.to) || 1, p = before.board[mv.from];
    if (!key || key === 'develop') {
      if ((p.t === 'n' || p.t === 'b') && n >= 2 && before.fullmove <= 12 && undeveloped(after, mover) >= 2 && saidOnce('opp-moved-twice')) { key = 'movedTwice'; slots.nth = COACH_VOICE.NTH[n - 1] || `${n}th`; slots.piece = PIECE_NAMES[p.t]; }
      else if (p.t === 'q' && before.fullmove <= 6 && undeveloped(after, mover) >= 3 && saidOnce('opp-early-queen')) key = 'earlyQueen';
    }
    noteOf(after).move = { kind: 'reply', head, who, text: voice(`reply.${key || 'quiet'}`, slots, seed) || voice('reply.quiet', slots, seed), ply: i };
    return;
  }
  coach.busy = head; render();
  const lines = await coachLines(before, i - 1); if (!live() || !lines.length) { coach.busy = null; return; }
  const uci = Chess.toUci(mv), best = lines[0];
  let played = lines.find(l => l.pv[0] === uci);
  if (!played) { const r = await coachSearch(positionCmd(i - 1), { searchmoves: [uci] }); if (!live()) return; played = r[0]; }
  if (!played) { coach.busy = null; return; }
  const esBefore = esOf(best), esAfter = esOf(played), loss = Math.max(0, esBefore - esAfter), isBest = uci === best.pv[0];
  const bestMv = Chess.fromUci(before, best.pv[0]), bestNx = bestMv && Chess.apply(before, bestMv);
  const bestSan = bestMv ? Chess.san(before, bestMv, bestNx) : '';
  const pf = moveFacts(before, mv, after, played.pv), bf = bestMv ? moveFacts(before, bestMv, bestNx, best.pv) : [];
  const pm = pvMaterial(before, played.pv), bm = pvMaterial(before, best.pv);
  const replyMv = played.pv[1] && Chess.fromUci(after, played.pv[1]), reply = replyMv ? Chess.san(after, replyMv, Chess.apply(after, replyMv)) : '';
  const who = match.opponent === 'cpu' ? 'Stockfish' : SIDE[Chess.other(mover)];
  // the grade: expected score given up (chess.com's bands, lichess's win curve; see COACH_VOICE.md)
  let cls = isBest || loss < 0.005 ? 'best' : loss < 0.02 ? 'excellent' : loss < 0.05 ? 'good' : loss < 0.10 ? 'inaccuracy' : loss < 0.20 ? 'mistake' : 'blunder';
  const poor = c => c === 'inaccuracy' || c === 'mistake' || c === 'blunder';
  const replyNx = replyMv && Chess.apply(after, replyMv), rf = replyMv ? moveFacts(after, replyMv, replyNx, played.pv.slice(1)).filter(f => ['mate', 'winMat', 'doubleCheck', 'discCheck', 'fork', 'skewer', 'pin', 'discAttack', 'trap', 'removeDefender', 'capture', 'check', 'attack'].includes(f.key)) : [];
  // the better move is told by what it does that yours does not ("Qh5 hits e5, but Nf3 hits e5
  // and develops" becomes "but Nf3 develops the knight"); a fact both share is said once
  const said1 = f => why([f], 'cmp', 1), shared = new Set(pf.map(said1)), bfNew = bf.filter(f => !shared.has(said1(f)));
  const slots = { san, best: bestSan, why: why(pf, seed, 2, poor(cls)), bestWhy: why(bfNew.length ? bfNew : bf, seed + 'b'), reply, replyWhy: why(rf, seed + 'r', 1), who };
  if (slots.bestWhy === slots.why) slots.bestWhy = '';   // "Nf3 develops the knight; Nc3 develops the knight" says nothing
  const cpOf = l => l.kind === 'mate' ? (l.value > 0 ? 10000 : -10000) : l.value;
  let key = cls, extra = '';
  if (Chess.status(after).mate) { key = 'mated'; cls = 'best'; const pat = matePattern(after); if (pat) slots.pattern = pat; }
  else if (played.kind === 'mate' && played.value > 0) {
    // found: the first of this side's moves to see the mate; kept: every one after it
    const prev = i >= 3 ? (coach.pre.get(game.states[i - 3]) || [])[0] : null;
    slots.n = played.value; key = prev && prev.kind === 'mate' && prev.value > 0 ? 'keepsMate' : 'foundMate'; cls = 'best';
  }
  else if (played.kind === 'mate' && played.value < 0) {
    slots.n = -played.value;
    if (best.kind === 'mate' && best.value < 0) { key = 'lostAnyway'; cls = isBest || loss < 0.005 ? 'best' : 'good'; }
    // lichess's rule for a mate allowed: graded by how bad the position already was
    else { key = 'allowedMate'; const c0 = cpOf(best); cls = c0 < -999 ? 'inaccuracy' : c0 < -700 ? 'mistake' : 'blunder'; }
  }
  else if (best.kind === 'mate' && best.value > 0 && !isBest) {
    // a mate let go: graded by how much is still left (lichess's rule)
    slots.n = best.value; key = 'missedMate'; const c1 = cpOf(played); cls = c1 > 999 ? 'inaccuracy' : c1 > 700 ? 'mistake' : 'blunder';
  }
  else if (book && !poor(cls)) { key = newName ? 'bookEnter' : 'book'; cls = 'book'; slots.opening = book.name; }
  else if (cls === 'best' || cls === 'excellent') {
    // a sacrifice the engine stands behind: material down after the reply, still well placed,
    // and not already winning anyway (chess.com's test for brilliant)
    const sac = pvMaterial(before, played.pv, 2, true);
    if (sac.net <= -2 && esAfter >= 0.5 && esBefore <= 0.92) { key = 'brilliant'; cls = 'best'; slots.mat = materialPhrase(sac.lost, sac.gained); }
    else if (cls === 'best') { const second = lines[1]; key = isBest && second && esBefore - esOf(second) >= 0.2 ? 'only' : slots.why ? 'best' : 'best_plain'; }
  }
  else if (cls === 'mistake' || cls === 'blunder') {
    if (pm.net <= -1) slots.mat = materialPhrase(pm.lost, pm.gained);
    else if (bm.net >= 1) { key = 'missedWin'; slots.mat = materialPhrase(bm.gained, bm.lost); slots.bestWhy = why(bf.filter(f => f.key !== 'winMat'), seed + 'b'); }
    if (key === cls && !slots.mat) key = `${cls}_plain`;
  } else if (!slots.why && COACH_VOICE.verdict[`${cls}_plain`]) key = `${cls}_plain`;
  if (book && poor(cls) && key !== 'allowedMate') extra = voice('habit.bookDubious', { san, opening: book.name }, seed);
  if (slots.n === 1 && COACH_VOICE.verdict[`${key}1`]) key = `${key}1`;
  let text = voice(`verdict.${key}`, slots, seed);
  if (!text) text = voice(`verdict.${cls}_plain`, slots, seed) || voice('verdict.best_plain', slots, seed);
  const note = { kind: 'verdict', cls, key, head, text, ply: i, loss, esBefore, esAfter, best: bestSan, score: Monolith.fromInfo(played, mover), side: mover };
  // a maxim after a slip that cost something, never two in a row
  const prevNote = i >= 3 && game.states[i - 2] ? noteOf(game.states[i - 2]).move : null;
  if ((cls === 'mistake' || cls === 'blunder') && !(prevNote && prevNote.maxim)) {
    const pool = COACH_VOICE.maxims[pm.net <= -1 || rf.length ? 'tactics' : phaseOf(before)] || COACH_VOICE.maxims.middlegame;
    note.maxim = pool[hashStr(seed) % pool.length];
  }
  note.extra = [extra, coachHabit(i, before, mv, after, cls)].filter(Boolean).join(' ');
  noteOf(after).move = note;
}
/* how many times each piece (by its current square) has moved, up to ply i */
function movesPerPiece(i) {
  const counts = new Map();
  for (let k = 0; k < i; k++) {
    const m = game.moves[k], n = (counts.get(m.from) || 0) + 1; counts.delete(m.from); counts.set(m.to, n);
    if (m.castle) { counts.delete(rookSqOf(m)); counts.set((m.from >> 3) * 8 + (m.castle === 'K' ? 5 : 3), 1); }
  }
  return counts;
}
const START_PLACEMENT = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
function coachHabit(i, st, mv, nx, cls) {
  const me = st.turn, p = st.board[mv.from], slots = { move: st.fullmove };
  // the opening's habits only mean something in a game from the starting position
  const fromStart = Chess.fen(game.states[0]).split(' ')[0] === START_PLACEMENT;
  const sound = cls === 'best' || cls === 'excellent' || cls === 'book';
  if (mv.castle && saidOnce(`${me}-castled`)) return voice('habit.castled', slots, `${i}c`);
  if (fromStart && (p.t === 'n' || p.t === 'b') && MINOR_HOME[me].includes(mv.from) && undeveloped(nx, me) === 0 && st.fullmove <= 12 && saidOnce(`${me}-developed`)) return voice('habit.developed', slots, `${i}d`);
  if (sound) return '';
  if (!fromStart) return p.t === 'k' && !mv.castle && (st.castling[me + 'K'] || st.castling[me + 'Q']) && saidOnce(`${me}-king-walk`) ? voice('habit.kingWalk', slots, `${i}k`) : '';
  const n = movesPerPiece(i).get(mv.to) || 1, k = undeveloped(nx, me);
  if ((p.t === 'n' || p.t === 'b' || p.t === 'q') && n >= 2 && st.fullmove <= 12 && k >= 2 && saidOnce(`${me}-moved-twice`)) return voice('habit.movedTwice', Object.assign(slots, { piece: PIECE_NAMES[p.t], nth: COACH_VOICE.NTH[n - 1] || `${n}th`, k }), `${i}m`);
  if (p.t === 'q' && st.fullmove <= 6 && k >= 3 && saidOnce(`${me}-early-queen`)) return voice('habit.earlyQueen', slots, `${i}q`);
  if (p.t === 'k' && !mv.castle && st.fullmove <= 15 && (st.castling[me + 'K'] || st.castling[me + 'Q']) && saidOnce(`${me}-king-walk`)) return voice('habit.kingWalk', slots, `${i}k`);
  const home = me === 'w' ? 4 : 60;
  if (st.fullmove >= 10 && st.fullmove <= 20 && nx.board[home] && nx.board[home].t === 'k' && (nx.castling[me + 'K'] || nx.castling[me + 'Q']) && saidOnce(`${me}-not-castled`)) return voice('habit.notCastled', slots, `${i}n`);
  return '';
}
/* Your turn: check, the opponent's threat (what it would play if you passed), loose pieces, or
   a tip for the phase. Also leaves the engine's lines ready for the hint and the verdict. */
async function coachWatch(idx, live) {
  const st = game.states[idx], n = noteOf(st), sides = coachSides();
  if (game.result && idx === game.states.length - 1) { n.end = coachEnd(); return; }
  if (!sides.includes(st.turn) || n.watch) return;
  const lines = await coachLines(st, idx); if (!live()) return;
  const me = st.turn, opp = Chess.other(me), who = match.opponent === 'cpu' ? 'Stockfish' : SIDE[opp], seed = `w${idx}`;
  if (Chess.inCheck(st)) { const k = Chess.allLegal(st).length; n.watch = { kind: 'watch', alert: true, text: k === 1 ? voice('watch.inCheckOne', {}, seed) : voice('watch.inCheck', { k }, seed) }; return; }
  // a forced mate of your own outranks their threats: you strike first
  if (lines[0] && lines[0].kind === 'mate' && lines[0].value > 0 && lines[0].value <= 3) { n.watch = { kind: 'watch', alert: false, chance: true, text: voice('watch.mateChance', { n: lines[0].value }, seed) }; return; }
  // the threat: hand the move to the opponent and ask the engine what it would do
  const nul = Object.assign({}, st, { turn: opp, ep: -1 }), nulMoves = Chess.allLegal(nul);
  const tl = nulMoves.length ? await coachSearch(`position fen ${Chess.fen(nul)}`, { depth: 10, movetime: 900 }) : []; if (!live()) return;
  const t = tl[0], tmv = t && t.pv && t.pv.length ? Chess.fromUci(nul, t.pv[0]) : null;
  if (t && tmv && t.kind === 'mate' && t.value > 0 && t.value <= 3) {
    n.watch = { kind: 'watch', alert: true, text: voice('watch.threatMate', { threat: Chess.san(nul, tmv, Chess.apply(nul, tmv)), who }, seed) }; return;
  }
  // the computer's last move was a slip: the engine likes your side better than after your own
  // move. (In a friend game that move has its own verdict already.)
  const mine = idx >= 2 && !sides.includes(opp) ? noteOf(game.states[idx - 1]).move : null, gain = mine && mine.kind === 'verdict' && lines[0] ? esOf(lines[0]) - mine.esAfter : 0;
  if (gain >= 0.10 && mine.side === me && mine.esAfter < 0.9) {
    n.watch = { kind: 'watch', alert: false, chance: true, text: voice('watch.punish', { who, san: game.sans[idx - 1], grade: gain >= 0.20 ? 'a blunder' : 'a mistake' }, seed) }; return;
  }
  if (t && tmv) {
    const tnx = Chess.apply(nul, tmv), threat = Chess.san(nul, tmv, tnx), real = lines[0] ? 1 - esOf(lines[0]) : 0.5;
    const tm = pvMaterial(nul, t.pv, 4);
    if (tm.net >= 1 && esOf(t) - real >= 0.08) {
      const cap = nul.board[tmv.to];
      n.watch = { kind: 'watch', alert: true, text: voice('watch.threatWin', { threat, who, mat: materialPhrase(tm.gained, tm.lost), target: cap ? PIECE_NAMES[cap.t] : PIECE_NAMES[tm.gained[0]] }, seed) }; return;
    }
  }
  // loose pieces (pieces only; pawns are left to the threat search)
  let flag = null;
  for (let s = 0; s < 64; s++) {
    const p = st.board[s]; if (!p || p.c !== me || p.t === 'k' || p.t === 'p') continue;
    const att = Chess.attackers(st.board, s, opp); if (!att.length) continue;
    const def = Chess.attackers(st.board, s, me), low = att.map(i => st.board[i].t).sort((a, b) => PVAL(a) - PVAL(b))[0];
    const f = !def.length ? { key: 'hanging', rank: 3 } : PVAL(low) < PVAL(p.t) ? { key: 'underAttack', rank: 2 } : att.length > def.length && see(st.board, s, opp) > 0 ? { key: 'outnumbered', rank: 1 } : null;
    if (f && (!flag || f.rank > flag.rank || (f.rank === flag.rank && PVAL(p.t) > PVAL(flag.slots.pieceT)))) flag = Object.assign(f, { slots: { piece: PIECE_NAMES[p.t], pieceT: p.t, sq: Chess.sqName(s), target: PIECE_NAMES[low], k: att.length, k2: def.length } });
  }
  if (flag) { n.watch = { kind: 'watch', alert: true, text: voice(`watch.${flag.key}`, flag.slots, seed) }; return; }
  // the draw rules, when they matter: stalemate while winning, a repetition, the fifty moves
  const es = lines[0] ? esOf(lines[0]) : 0.5;
  if (es >= 0.9 && nulMoves.length <= 4) {
    // only when it can actually happen: one of your own moves would leave them without a move
    const stales = Chess.allLegal(st).some(m2 => { const nx = Chess.apply(st, m2); return !Chess.inCheck(nx) && !Chess.allLegal(nx).length; });
    if (stales) { n.watch = { kind: 'watch', alert: true, text: voice('watch.stalemate', { who }, seed) }; return; }
  }
  if (repetitions(idx) === 2 && (es >= 0.6 || es <= 0.4)) { n.watch = { kind: 'watch', alert: es >= 0.6, text: voice(es >= 0.6 ? 'watch.repeatBetter' : 'watch.repeatWorse', {}, seed) }; return; }
  if (st.halfmove >= 80) { n.watch = { kind: 'watch', alert: false, text: voice('watch.fifty', { k: Math.ceil((100 - st.halfmove) / 2) }, seed) }; return; }
  // a chance: one of their pieces can be won, and the engine's line agrees. The note says so
  // without naming the piece; the hint is there for that.
  const win = lines[0] ? pvMaterial(st, lines[0].pv) : null;
  if (win && win.net >= 1) for (let s2 = 0; s2 < 64; s2++) {
    const q = st.board[s2]; if (!q || q.c !== opp || q.t === 'k') continue;
    if (Chess.attackers(st.board, s2, me).length && (!hasDefender(st.board, s2, opp) || see(st.board, s2, me) > 0)) { n.watch = { kind: 'watch', alert: false, chance: true, text: voice('watch.chance', { who }, seed) }; return; }
  }
  const tip = voice(`tips.${tipKeyFor(st, me)}`, {}, seed);
  n.watch = { kind: 'watch', alert: false, text: voice('watch.calm', { tip }, seed) };
}
/* The calm tip: the one that fits the board. In the opening, its jobs in order (the centre, the
   pieces, the king); in the middlegame, an open file for a rook if there is one; in the endgame,
   the mate against a bare king, the king's march, then the passed pawns. */
function tipKeyFor(st, me) {
  const ph = phaseOf(st), opp = Chess.other(me), has = (c, t) => st.board.some(p => p && p.c === c && p.t === t);
  if (ph === 'opening') {
    const home = me === 'w' ? 4 : 60, canCastle = st.board[home] && st.board[home].t === 'k' && (st.castling[me + 'K'] || st.castling[me + 'Q']);
    const ownCentre = [...CENTRE].some(c => st.board[c] && st.board[c].c === me && st.board[c].t === 'p');
    return st.fullmove <= 3 && !ownCentre ? 'centre' : undeveloped(st, me) >= 2 ? 'develop' : canCastle ? 'castle' : 'develop';
  }
  if (ph === 'endgame') {
    if (!st.board.some(p => p && p.c === opp && p.t !== 'k') && (has(me, 'q') || has(me, 'r'))) return 'endgameMate';
    const k = Chess.kingSq(st.board, me), kf = k % 8, kr = k >> 3;
    if (kf < 2 || kf > 5 || kr < 2 || kr > 5) return 'endgameKing';
    const passer = st.board.some((p, s2) => p && p.t === 'p' && isPassed(st.board, s2, p.c));
    return passer ? (has(me, 'r') ? 'endgameRook' : 'endgamePasser') : 'endgame';
  }
  const openFile = [0, 1, 2, 3, 4, 5, 6, 7].some(f => ![0, 1, 2, 3, 4, 5, 6, 7].some(r => { const p = st.board[r * 8 + f]; return p && (p.t === 'p' || (p.t === 'r' && p.c === me)); }));
  return has(me, 'r') && openFile ? 'middlegameRook' : 'middlegame';
}
/* The game in review: lichess's accuracy for each coached side (each move from the drop in win
   chance, then the mean of a volatility-weighted mean and a harmonic mean), the count of
   inaccuracies, mistakes and blunders, and the move where the game turned. */
const winPct = es => 100 * es;
function moveAccuracy(before, after) {
  if (after >= before) return 100;
  return Math.max(0, Math.min(100, 103.1668100711649 * Math.exp(-0.04354415386753951 * (before - after)) - 3.166924740191411 + 1));
}
function coachReview() {
  const N = game.states.length, wp = new Array(N).fill(null), moves = [];
  for (let i = 1; i < N; i++) {
    const m = (coach.notes.get(game.states[i]) || {}).move;
    if (!m || m.kind !== 'verdict' || m.esBefore === undefined) continue;
    const white = m.side === 'w', toW = e => winPct(white ? e : 1 - e);
    wp[i - 1] = toW(m.esBefore); wp[i] = toW(m.esAfter);
    moves.push({ i, m, acc: moveAccuracy(winPct(m.esBefore), winPct(m.esAfter)) });
  }
  for (let i = 0; i < N; i++) if (wp[i] === null && i > 0) wp[i] = wp[i - 1];   // carry across unanalysed plies
  const size = Math.max(2, Math.min(8, Math.floor((N - 1) / 10)));
  const sd = a => { const v = a.filter(x => x !== null); if (v.length < 2) return 0.5; const mu = v.reduce((x, y) => x + y, 0) / v.length; return Math.sqrt(v.reduce((x, y) => x + (y - mu) ** 2, 0) / v.length); };
  const weightAt = k => { const start = Math.max(0, k - size + 2); return Math.max(0.5, Math.min(12, sd(wp.slice(start, start + size)))); };
  const out = {};
  for (const c of coachSides()) {
    const mine = moves.filter(x => x.m.side === c); if (!mine.length) continue;
    const w = mine.map(x => weightAt(x.i - 1)), wsum = w.reduce((a, b) => a + b, 0);
    const weighted = mine.reduce((a, x, k) => a + x.acc * w[k], 0) / wsum, harmonic = mine.length / mine.reduce((a, x) => a + 1 / Math.max(1, x.acc), 0);
    const count = k => mine.filter(x => x.m.cls === k).length, worst = mine.reduce((a, x) => (!a || x.m.loss > a.m.loss ? x : a), null);
    out[c] = { acc: (weighted + harmonic) / 2, inacc: count('inaccuracy'), mistakes: count('mistake'), blunders: count('blunder'), worst: worst && worst.m.loss >= 0.10 ? worst : null };
  }
  return out;
}
function coachEnd() {
  const r = game.result; if (!r) return null;
  const cpu = match.opponent === 'cpu', key = r.resigned ? 'resigned' : !r.winner ? 'draw' : !cpu || r.winner === match.human ? 'win' : 'loss', seed = `end${game.states.length}`;
  const R = coachReview(), lines = [], plural = (n, one, many) => `${n === 0 ? 'no' : n} ${n === 1 ? one : many}`;
  let turn = null;
  for (const c of Object.keys(R)) {
    const x = R[c], acc = `${Math.round(x.acc)} %`;
    const counts = !x.inacc && !x.mistakes && !x.blunders ? 'no inaccuracies, mistakes or blunders' : `${plural(x.inacc, 'inaccuracy', 'inaccuracies')}, ${plural(x.mistakes, 'mistake', 'mistakes')} and ${plural(x.blunders, 'blunder', 'blunders')}`;
    lines.push(Object.keys(R).length > 1 ? voice('end.accuracySide', { who: SIDE[c], acc, counts }, seed + c) : voice('end.accuracy', { acc, counts }, seed + c));
    if (x.worst && (!turn || x.worst.m.loss > turn.m.loss)) turn = x.worst;
  }
  if (turn) lines.push(voice('end.turn', { move: turn.m.head, loss: Monolith.fmtPct(turn.m.loss, 0) }, seed));
  else if (Object.keys(R).length) lines.push(voice('end.clean', {}, seed));
  return { kind: 'end', text: voice(`end.${key}`, { result: r.text }, seed), extra: lines.join(' '), action: turn ? { label: `Show ${turn.m.head}`, ply: turn.i } : null };
}
/* The move-list mark for a graded move. */
const COACH_MARK = { inaccuracy: '?!', mistake: '?', blunder: '??' };
export function coachMark(ply) {
  const st = game.states[ply]; if (!st) return '';
  const n = coach.notes.get(st), m = n && n.move; if (!m || m.kind !== 'verdict') return '';
  return m.key === 'brilliant' ? '!!' : m.key === 'only' || m.key === 'foundMate' || m.key === 'foundMate1' ? '!' : COACH_MARK[m.cls] || '';
}
/* The hint, one step at a time: a nudge (what kind of move), the piece, then the move. */
export async function giveHint() {
  const st = cur();
  if (app.hint && app.hint.pending && app.hint.state === st) return;   // already being worked out: a second ask would cancel both searches
  if (app.hint && !app.hint.pending && app.hint.state === st) { if (app.hint.level < 3) app.hint.level++; else app.hint = null; render(); return; }
  if (!canMoveNow() || !engine.ready) return;
  app.hint = { state: st, pending: true, level: 1 }; render();
  let line = (coach.pre.get(st) || [])[0];
  if (!line) {
    const lines = [], gen = engine.gen + 1;
    await engine.go(positionCmd(stateIndex(st)), { depth: 12, movetime: 1500, lines });
    if (gen !== engine.gen) { if (app.hint && app.hint.pending) app.hint = null; render(); return; }
    line = lines.filter(Boolean)[0];
  }
  if (cur() !== st || !app.hint || app.hint.state !== st) { if (app.hint && app.hint.pending) app.hint = null; render(); return; }
  const mv = line && Chess.fromUci(st, line.pv[0]);
  if (!mv) { app.hint = null; render(); return; }
  const nx = Chess.apply(st, mv), san = Chess.san(st, mv, nx), facts = moveFacts(st, mv, nx, line.pv), seed = `h${game.states.length}`;
  const NUDGE = { winMat: 'winMat', doubleCheck: 'discover', discCheck: 'discover', discAttack: 'discover', trap: 'trap', fork: 'attack', skewer: 'attack', pin: 'attack', removeDefender: 'capture', enPassant: 'capture', capture: 'capture', check: 'check', attack: 'attack', escape: 'defend', defend: 'defend', castle: 'castle', develop: 'develop' };
  const f = line.kind === 'mate' && line.value > 0 ? 'mate' : (facts.find(x => NUDGE[x.key]) || {}).key;
  const nudgeKey = f === 'mate' ? 'mate' : NUDGE[f] || 'quiet';
  const w = why(facts, seed), piece = PIECE_NAMES[st.board[mv.from].t];
  app.hint = { state: st, level: 1, from: mv.from, to: mv.to, san, piece: st.board[mv.from].t,
    steps: [voice(`hint.${nudgeKey}`, {}, seed), voice('hint.piece', { piece, sq: Chess.sqName(mv.from) }, seed), w ? voice('hint.move', { san, why: w }, seed) : voice('hint.move_plain', { san }, seed)] };
  render(); refreshAnalysis();
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  coach = { eng: null, notes: new WeakMap(), pre: new WeakMap(), said: new WeakMap(), gen: 0, queue: Promise.resolve(), busy: null };
}
