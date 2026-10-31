/*
✒ Metadata
    - Title: Coach Board Sense (MONOLITH Edition - v1.0)
    - File Name: coach.js
    - Relative Path: js/coach/coach.js
    - Artifact Type: javascript
    - Version: 1.0.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The Coach's reading of a position, the way a coach at the board would:
    piece values, material along a line, threats, loose and outnumbered
    pieces, development and the phase of the game.

✒ Key Features:
    - see(): static exchange on a square.
    - inDanger() and hasDefender(): loose and outnumbered pieces.
    - pvMaterial() and materialPhrase(): the material along the engine's
      line, in words.
    - phaseOf(), undeveloped() and isPassed().

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { PVAL, isPassed, phaseOf } from '../coach/coach.js';

✒ Other Important Information:
    - Dependencies: no imports; globals Chess (js/core/chess.js) and
      COACH_VOICE (js/data/coach-voice.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
/* ---------- the Coach ----------
   The Coach should be true to its title, not an engine line readout.
   It now reads the game the way a coach at the board would, in the voice of COACH_VOICE:
     - your move gets a verdict against the engine's best, with what each move does and, after a
       slip, the better move and what it changes (the material along the engine's line);
     - the opponent's move is read for you (what it takes, attacks, forks, pins, threatens);
     - on your turn it watches: check, a threat of mate or material (the engine is asked what the
       opponent would play if you passed), loose and outnumbered pieces, else a tip for the phase;
     - opening habits (the same piece again, an early queen, a king walk, a late castle) are said
       once a game, and only when the engine did not prefer the move anyway;
     - the hint comes in steps: a nudge, then the piece, then the move with its reason;
     - the move list carries the marks (?!, ?, ??, !) and every note stays with its move.
   Every claim is a checked fact: the rules engine for attacks and material, a second Stockfish
   (role "coach", 32 MB, MultiPV 3 to depth 12 within 1.5 s) for the grading. Counts of attackers
   and defenders ignore pins, as the X-Ray's do. */
export const PVAL = t => t === 'k' ? 50 : Chess.VAL[t];
export const MINOR_HOME = { w: [1, 2, 5, 6], b: [57, 58, 61, 62] };
export const CENTRE = new Set([27, 28, 35, 36]);
export const undeveloped = (st, c) => MINOR_HOME[c].filter(s => { const p = st.board[s]; return p && p.c === c && (p.t === 'n' || p.t === 'b'); }).length;
const nonPawnMat = (st, c) => st.board.reduce((n, p) => n + (p && p.c === c && p.t !== 'p' && p.t !== 'k' ? Chess.VAL[p.t] : 0), 0);
export function phaseOf(st) {
  const qs = st.board.filter(p => p && p.t === 'q').length, m = nonPawnMat(st, 'w') + nonPawnMat(st, 'b');
  if (m <= 26 || (!qs && m <= 32)) return 'endgame';
  if (st.fullmove <= 10 && (undeveloped(st, st.turn) >= 2 || (st.castling[st.turn + 'K'] || st.castling[st.turn + 'Q']))) return 'opening';
  return 'middlegame';
}
export function isPassed(board, sq, c) {
  const f = sq & 7, r = sq >> 3, dir = c === 'w' ? 1 : -1;
  for (let y = r + dir; y >= 0 && y < 8; y += dir) for (const x of [f - 1, f, f + 1]) { if (x < 0 || x > 7) continue; const p = board[y * 8 + x]; if (p && p.t === 'p' && p.c !== c) return false; }
  return true;
}
/* Static exchange on sq, side `by` capturing first, least valuable attacker first (pins and
   x-rays aside): the material `by` comes out ahead. */
export function see(board, sq, by) {
  const target = board[sq]; if (!target) return 0;
  const vals = c => Chess.attackers(board, sq, c).map(i => PVAL(board[i].t)).sort((a, b) => a - b);
  const side = [vals(by), vals(Chess.other(by))];
  if (!side[0].length) return 0;
  const gain = [PVAL(target.t)]; let on = side[0].shift(), s = 1, d = 0;
  while (side[s].length) { d++; gain[d] = on - gain[d - 1]; on = side[s].shift(); s ^= 1; }
  while (d > 0) { gain[d - 1] = -Math.max(-gain[d - 1], gain[d]); d--; }
  return gain[0];
}
export const hasDefender = (board, sq, c) => Chess.attackers(board, sq, c).length > 0;
export const inDanger = (board, sq) => {
  const p = board[sq]; if (!p || p.t === 'k') return false;
  const opp = Chess.other(p.c), att = Chess.attackers(board, sq, opp); if (!att.length) return false;
  return !hasDefender(board, sq, p.c) || Math.min(...att.map(i => PVAL(board[i].t))) < PVAL(p.t) || see(board, sq, opp) > 0;
};
/* Material along an engine line: what the side to move gains and loses in the first plies (an
   exchange in progress is played out), with equal trades cancelled. */
export function pvMaterial(st, pv, plies = 6, exact = false) {
  const me = st.turn, gained = [], lost = []; let s = st, i = 0;
  for (; i < pv.length; i++) {
    const mv = Chess.fromUci(s, pv[i]); if (!mv) break;
    const cap = mv.ep ? { t: 'p', c: Chess.other(s.turn) } : s.board[mv.to];
    if (cap) (cap.c === me ? lost : gained).push(cap.t);
    if (mv.promo) { (s.turn === me ? gained : lost).push(mv.promo); (s.turn === me ? lost : gained).push('p'); }
    s = Chess.apply(s, mv);
    // stop after `plies`, or (unless exact) up to two later when the line is still mid-exchange
    if (i + 1 >= plies + (exact ? 0 : 2) || (i + 1 >= plies && !cap)) break;
  }
  for (const t of [...gained]) { const j = lost.indexOf(t); if (j >= 0) { lost.splice(j, 1); gained.splice(gained.indexOf(t), 1); } }
  const sum = a => a.reduce((n, t) => n + Chess.VAL[t], 0);
  return { gained, lost, net: sum(gained) - sum(lost), end: s };
}
export function materialPhrase(gain, loss) {
  const M = COACH_VOICE.MATERIAL, one = t => M[t];
  const list = a => {
    a = a.slice().sort((x, y) => Chess.VAL[y] - Chess.VAL[x]);
    const pawns = a.filter(t => t === 'p').length, big = a.filter(t => t !== 'p');
    if (!big.length) return pawns === 1 ? M.p : pawns === 2 ? M.pp : pawns === 3 ? M.ppp : `${pawns} pawns`;
    const words = big.map(one); if (pawns === 1) words.push(M.p); else if (pawns > 1) words.push(pawns === 2 ? M.pp : `${pawns} pawns`);
    return words.length > 1 ? words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1] : words[0];
  };
  if (!loss.length) return list(gain);
  if (gain.length === 1 && gain[0] === 'r' && loss.length === 1 && (loss[0] === 'n' || loss[0] === 'b')) return M.x;
  return `${list(gain)} for ${list(loss)}`;
}
