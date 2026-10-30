/*
✒ Metadata
    - Title: Move Facts And Voice (MONOLITH Edition - v1.0)
    - File Name: facts.js
    - Relative Path: js/coach/facts.js
    - Artifact Type: javascript
    - Version: 1.0.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    What a move does, as checked facts in the order a coach would name them,
    and the voice that turns them into sentences from COACH_VOICE.

✒ Key Features:
    - moveFacts(): mate patterns, promotion, double and discovered check,
      fork, skewer, pin, trapped pieces, castling, outposts, files, the
      centre, passed pawns and the faults.
    - why(): the reasons a move was good, or the faults of one graded below
      good.
    - voice(): picks a variant whose slots it can fill, the same one for the
      same position.
    - fill() and cap1(): slots and sentence case.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { hashStr, cap1, fill } from '../coach/facts.js';

✒ Other Important Information:
    - Dependencies: imports scene/board.js and coach/coach.js; globals Chess
      (js/core/chess.js) and COACH_VOICE (js/data/coach-voice.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { PIECE_NAMES } from '../scene/board.js';
import {
  CENTRE, hasDefender, inDanger, isPassed, materialPhrase, MINOR_HOME, phaseOf, PVAL, pvMaterial, see
} from './coach.js';

/* ---------- what a move does ----------
   Facts, each checked by the rules engine (and, for material, the engine's own line), in the
   order a coach would name them. The motifs follow lichess's puzzle themes where a rule can
   decide them: mate (with back-rank and smothered patterns), promotion and underpromotion,
   double and discovered check, fork, skewer, pin, discovered attack, a trapped piece, capturing
   the defender, en passant; then the quieter facts: castling, a rescued or defended piece,
   development, an outpost, open and half-open files, the seventh rank, a rook behind a passed
   pawn, the centre, a passed pawn, a fianchetto, connected rooks, the bishop pair, the king in
   the endgame. The last four are faults: a piece put en prise, one left loose, the king's
   pawns loosened, the bishop pair given up. why() names faults only for a move graded below
   good, and the good facts otherwise. */
const FACT_ORDER = ['mate', 'promote', 'underpromote', 'winMat', 'doubleCheck', 'discCheck', 'fork', 'skewer', 'pin', 'discAttack', 'trap', 'removeDefender', 'enPassant', 'capture', 'check', 'castle',
  'escape', 'attack', 'defend', 'develop', 'outpost', 'openFile', 'halfOpen', 'seventh', 'rookBehind', 'centre', 'passer', 'fianchetto', 'connect', 'winsPair', 'kingUp', 'enPrise', 'loosens', 'weakenKing', 'givesPair'];
const FAULTS = new Set(['enPrise', 'loosens', 'weakenKing', 'givesPair']);
const DIRS = { r: [[1, 0], [-1, 0], [0, 1], [0, -1]], b: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
const dirsOf = t => t === 'r' ? DIRS.r : t === 'b' ? DIRS.b : t === 'q' ? DIRS.r.concat(DIRS.b) : [];
const onBoard = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;
/* the first two occupied squares along a ray from sq */
function rayHits(board, sq, df, dr) {
  const out = []; let x = (sq & 7) + df, y = (sq >> 3) + dr;
  while (onBoard(x, y) && out.length < 2) { const s = y * 8 + x; if (board[s]) out.push(s); x += df; y += dr; }
  return out;
}
const bishops = (board, c) => board.filter(p => p && p.c === c && p.t === 'b').length;
export function matePattern(nx) {
  const loser = nx.turn, k = Chess.kingSq(nx.board, loser), checkers = Chess.attackers(nx.board, k, Chess.other(loser));
  if (checkers.length !== 1) return null;
  const c = nx.board[checkers[0]], kf = k & 7, kr = k >> 3, ring = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if ((dx || dy) && onBoard(kf + dx, kr + dy)) ring.push((kr + dy) * 8 + kf + dx);
  if (c.t === 'n' && ring.every(s => nx.board[s] && nx.board[s].c === loser)) return 'smothered mate';
  const home = loser === 'w' ? 0 : 7, fwd = loser === 'w' ? 1 : -1;
  if (kr === home && 'rq'.includes(c.t) && (checkers[0] >> 3) === home) {
    const front = [-1, 0, 1].map(dx => onBoard(kf + dx, kr + fwd) ? (kr + fwd) * 8 + kf + dx : -1).filter(s => s >= 0);
    if (front.every(s => nx.board[s] && nx.board[s].c === loser)) return 'back-rank mate';
  }
  return null;
}
export function moveFacts(st, mv, nx, pv) {
  const me = st.turn, opp = Chess.other(me), p = st.board[mv.from], out = [], add = (key, slots = {}) => out.push({ key, slots });
  const PN_ = t => PIECE_NAMES[t], to = mv.to, mover = nx.board[to], file = s => 'abcdefgh'[s & 7];
  if (Chess.status(nx).mate) { const pat = matePattern(nx); add('mate', pat ? { pattern: pat } : {}); }
  if (mv.promo) add(mv.promo === 'q' ? 'promote' : 'underpromote', { piece: PN_(mv.promo) });
  const mat = pv && pv.length ? pvMaterial(st, pv) : null;
  if (mat && mat.net >= 1) add('winMat', { mat: materialPhrase(mat.gained, mat.lost) });
  const oppK = Chess.kingSq(nx.board, opp), checkers = Chess.inCheck(nx) ? Chess.attackers(nx.board, oppK, me) : [];
  // pieces hit from the new square: the king, a bigger piece, or an undefended one
  const hits = [];
  for (let s = 0; s < 64; s++) {
    const q = nx.board[s]; if (!q || q.c !== opp) continue;
    if (!Chess.attackers(nx.board, s, me).includes(to)) continue;
    const before = Chess.attackers(st.board, s, me).includes(mv.from);
    if (q.t === 'k' || PVAL(q.t) > PVAL(mover.t) || !hasDefender(nx.board, s, opp)) hits.push({ s, q, fresh: !before });
  }
  // discovered: a line piece behind the moved one now sees through its old square
  const disc = [];
  for (let l = 0; l < 64; l++) {
    const L = nx.board[l]; if (!L || L.c !== me || l === to || !'bqr'.includes(L.t)) continue;
    for (const [df, dr] of dirsOf(L.t)) {
      const [h] = rayHits(nx.board, l, df, dr); if (h === undefined) continue;
      let x = (l & 7) + df, y = (l >> 3) + dr, through = false;
      while (onBoard(x, y) && y * 8 + x !== h) { if (y * 8 + x === mv.from) through = true; x += df; y += dr; }
      const q = nx.board[h];
      if (through && q.c === opp && (q.t === 'k' || PVAL(q.t) > PVAL(L.t) || !hasDefender(nx.board, h, opp))) disc.push({ l, L, h, q });
    }
  }
  if (checkers.length >= 2) add('doubleCheck');
  else { const dc = disc.find(d => d.q.t === 'k'); if (dc) add('discCheck', { piece: PN_(dc.L.t) }); }
  const forkHits = hits.filter(h => h.fresh || h.q.t === 'k');
  if (forkHits.length >= 2) { const [a, b] = forkHits.sort((x, y) => PVAL(y.q.t) - PVAL(x.q.t)); add('fork', { target: PN_(a.q.t), target2: PN_(b.q.t) }); }
  // along the mover's own lines: a skewer (the front piece is worth more) or a pin (worth less)
  if ('bqr'.includes(mover.t)) {
    const old = new Set(); for (const [df, dr] of dirsOf(p.t)) { const [a, b] = rayHits(st.board, mv.from, df, dr); if (a !== undefined && b !== undefined) old.add(`${a}-${b}`); }
    for (const [df, dr] of dirsOf(mover.t)) {
      const [a, b] = rayHits(nx.board, to, df, dr); if (a === undefined || b === undefined) continue;
      const A = nx.board[a], B = nx.board[b]; if (A.c !== opp || B.c !== opp || old.has(`${a}-${b}`)) continue;
      if (A.t !== 'k' && A.t !== 'p' && (B.t === 'k' || PVAL(B.t) > PVAL(A.t))) add('pin', { target: PN_(A.t), behind: PN_(B.t) });
      else if (A.t !== 'p' && (A.t === 'k' || PVAL(A.t) > PVAL(B.t)) && B.t !== 'p' && (PVAL(B.t) >= PVAL(mover.t) || !hasDefender(nx.board, b, opp))) add('skewer', { target: PN_(A.t), behind: PN_(B.t) });
    }
  }
  const dA = disc.find(d => d.q.t !== 'k'); if (dA) add('discAttack', { piece: PN_(dA.L.t), target: PN_(dA.q.t), tsq: Chess.sqName(dA.h) });
  // a trapped piece: attacked where it loses, and every square it can reach loses too
  const nul = Object.assign({}, nx, { turn: opp, ep: -1 });
  if (!Chess.inCheck(nx)) for (let s = 0; s < 64; s++) {
    const q = nx.board[s]; if (!q || q.c !== opp || !'nbrq'.includes(q.t) || !inDanger(nx.board, s) || inDanger(st.board, s)) continue;
    const escapes = Chess.legal(nul, s);
    if (escapes.length && escapes.every(m2 => inDanger(Chess.apply(nul, m2).board, m2.to))) { add('trap', { target: PN_(q.t), tsq: Chess.sqName(s) }); break; }
  }
  const capT = mv.ep ? 'p' : st.board[to] && st.board[to].t;
  if (capT && !mv.ep) {
    // capturing a defender: a piece it guarded is now attacked and has no guard left
    for (let s = 0; s < 64; s++) {
      const q = st.board[s]; if (!q || q.c !== opp || s === to || q.t === 'k') continue;
      if (Chess.attackers(st.board, s, opp).includes(to) && Chess.attackers(nx.board, s, me).length && !hasDefender(nx.board, s, opp)) { add('removeDefender', { target: PN_(q.t), tsq: Chess.sqName(s) }); break; }
    }
  }
  if (mv.ep) add('enPassant'); else if (capT) add('capture', { target: PN_(capT), tsq: Chess.sqName(to) });
  if (checkers.length === 1 && !out.some(f => f.key === 'discCheck')) add('check');
  if (mv.castle) add('castle', { wing: mv.castle === 'K' ? 'king' : 'queen' });
  if (inDanger(st.board, mv.from) && !inDanger(nx.board, to)) add('escape', { piece: PN_(p.t) });
  const attacks = hits.filter(h => h.fresh && h.q.t !== 'k');
  if (attacks.length === 1 && !out.some(f => f.key === 'fork')) add('attack', { target: PN_(attacks[0].q.t), tsq: Chess.sqName(attacks[0].s) });
  for (let s = 0; s < 64; s++) {
    const q = st.board[s]; if (!q || q.c !== me || s === mv.from || q.t === 'k') continue;
    if (Chess.attackers(st.board, s, opp).length && !hasDefender(st.board, s, me) && Chess.attackers(nx.board, s, me).includes(to)) { add('defend', { target: PN_(q.t), tsq: Chess.sqName(s) }); break; }
  }
  if ((p.t === 'n' || p.t === 'b') && MINOR_HOME[me].includes(mv.from) && st.fullmove <= 14) add('develop', { piece: PN_(p.t) });
  // outpost: a knight in the far half, held by a pawn, beyond the reach of enemy pawns
  const rel = r => me === 'w' ? r : 7 - r, tr = to >> 3, tf = to & 7;
  if (p.t === 'n' && rel(tr) >= 3 && rel(tr) <= 5 && Chess.attackers(nx.board, to, me).some(s => nx.board[s].t === 'p')) {
    let chased = false;
    for (const x of [tf - 1, tf + 1]) for (let y = 0; y < 8; y++) { if (x < 0 || x > 7) continue; const q = nx.board[y * 8 + x]; if (q && q.t === 'p' && q.c === opp && (me === 'w' ? y > tr : y < tr)) chased = true; }
    if (!chased) add('outpost');
  }
  if (p.t === 'r' && (mv.from & 7) !== tf) {
    const pawns = [0, 1, 2, 3, 4, 5, 6, 7].map(y => nx.board[y * 8 + tf]).filter(q => q && q.t === 'p');
    if (!pawns.length) add('openFile', { file: file(to) }); else if (!pawns.some(q => q.c === me)) add('halfOpen', { file: file(to) });
  }
  if (p.t === 'r' && rel(tr) === 6 && rel(mv.from >> 3) !== 6) add('seventh');
  if (p.t === 'r') for (const dr of [1, -1]) {
    const [h] = rayHits(nx.board, to, 0, dr); if (h === undefined) continue;
    const q = nx.board[h], ahead = q && q.t === 'p' && isPassed(nx.board, h, q.c) && ((q.c === 'w') === (dr === 1));
    if (ahead) { add('rookBehind'); break; }
  }
  if (CENTRE.has(to) && st.fullmove <= 14 && (p.t === 'p' || p.t === 'n')) add('centre');
  if (p.t === 'p' && !mv.promo && isPassed(nx.board, to, me) && rel(tr) >= 4) add('passer');
  if (p.t === 'b' && ((me === 'w' && ((mv.from === 5 && to === 14 && nx.board[22] && nx.board[22].t === 'p') || (mv.from === 2 && to === 9 && nx.board[17] && nx.board[17].t === 'p'))) ||
      (me === 'b' && ((mv.from === 61 && to === 54 && nx.board[46] && nx.board[46].t === 'p') || (mv.from === 58 && to === 49 && nx.board[41] && nx.board[41].t === 'p'))))) add('fianchetto');
  const homeR = me === 'w' ? 0 : 7, rooksOn = b => [0, 1, 2, 3, 4, 5, 6, 7].map(x => homeR * 8 + x).filter(s => b[s] && b[s].c === me && b[s].t === 'r');
  const connected = b => { const r = rooksOn(b); if (r.length !== 2) return false; for (let s = r[0] + 1; s < r[1]; s++) if (b[s]) return false; return true; };
  if (!connected(st.board) && connected(nx.board)) add('connect');
  const bMe0 = bishops(st.board, me), bOpp0 = bishops(st.board, opp), bMe = bishops(nx.board, me), bOpp = bishops(nx.board, opp);
  if (capT === 'b' && bOpp0 === 2 && bOpp < 2 && bMe === 2) add('winsPair');
  if (p.t === 'k' && !mv.castle && phaseOf(st) === 'endgame') {
    const dc = s => Math.max(Math.abs((s & 7) - 3.5), Math.abs((s >> 3) - 3.5));
    if (dc(to) < dc(mv.from)) add('kingUp');
  }
  // faults: named only when the move is graded below good (see why)
  // en prise: the exchange on the new square loses more than the move took
  if (mover.t !== 'k' && !Chess.status(nx).mate && see(nx.board, to, opp) > (capT ? Chess.VAL[capT] : 0)) add('enPrise', { piece: PN_(mover.t) });
  let loose = null;
  for (let s = 0; s < 64; s++) {
    const q = nx.board[s]; if (!q || q.c !== me || s === to || q.t === 'k' || q.t === 'p') continue;
    if (inDanger(nx.board, s) && !inDanger(st.board, s) && (!loose || PVAL(q.t) > PVAL(nx.board[loose].t))) loose = s;
  }
  if (loose !== null) add('loosens', { target: PN_(nx.board[loose].t), tsq: Chess.sqName(loose) });
  const myK = Chess.kingSq(nx.board, me), kf = myK & 7;
  if (p.t === 'p' && !capT && (myK >> 3) === homeR && (mv.from >> 3) === (me === 'w' ? 1 : 6) && ((kf >= 6 && (mv.from & 7) >= 5) || (kf <= 2 && (mv.from & 7) <= 2))) add('weakenKing');
  if (p.t === 'b' && capT === 'n' && bMe0 === 2 && bMe < 2 && bOpp === 2) add('givesPair');
  // the bottom line suppresses its own parts
  const has = k => out.some(f => f.key === k);
  const kept = out.filter(f => !(f.key === 'capture' && (has('winMat') || has('mate'))) && !(f.key === 'check' && (has('mate') || has('doubleCheck'))) && !(f.key === 'attack' && (has('skewer') || has('discAttack'))));
  return kept.sort((a, b) => FACT_ORDER.indexOf(a.key) - FACT_ORDER.indexOf(b.key));
}

/* ---------- voice: pick a line, fill its slots ---------- */
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export const fill = (t, slots) => t.replace(/\{(\w+)\}/g, (m, k) => slots[k] === undefined || slots[k] === null || slots[k] === '' ? m : String(slots[k]));
export const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
/* A line from the dataset: of the variants whose slots can all be filled, those that use the
   most facts, then one of them by the seed. A line that opens with a slot keeps the slot's own
   case (SAN like e4 stays lowercase); text of the voice's own is capitalised. */
export function voice(path, slots, seed) {
  const [a, b] = path.split('.'), pool = b ? COACH_VOICE[a] && COACH_VOICE[a][b] : COACH_VOICE[a];
  if (!pool || !pool.length) return '';
  const ok = pool.filter(t => !/\{\w+\}/.test(fill(t, slots)));
  if (!ok.length) return '';
  const uses = t => new Set(t.match(/\{\w+\}/g) || []).size, most = Math.max(...ok.map(uses)), rich = ok.filter(t => uses(t) === most);
  const t = rich[hashStr(seed + path) % rich.length], out = fill(t, slots);
  return t[0] === '{' ? out : cap1(out);
}
/* What a move does, in words: up to `max` facts joined with "and". `faults` true names the
   faults first (for a move graded below good); otherwise faults are left out. */
export function why(facts, seed, max = 2, faults = false) {
  const list = faults ? facts.filter(f => FAULTS.has(f.key)).concat(facts.filter(f => !FAULTS.has(f.key))) : facts.filter(f => !FAULTS.has(f.key));
  const parts = [];
  for (const f of list) { if (parts.length >= max) break; const r = voice(`REASONS.${f.key}`, f.slots, seed + f.key); if (r) parts.push(r.charAt(0).toLowerCase() + r.slice(1)); }
  return parts.join(' and ');
}
