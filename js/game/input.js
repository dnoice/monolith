/*
✒ Metadata
    - Title: Typed Moves (MONOLITH Edition - v1.0)
    - File Name: input.js
    - Relative Path: js/game/input.js
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
      release audit Dennis asked for: a typed move matches its SAN exactly
      before it matches regardless of case, so bxc4 (a pawn) and Bxc4 (a
      bishop) are told apart.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    Moves typed in the move box: long algebraic (e2e4), SAN (Nf3, exd5,
    e8=Q) or castling (O-O), and SAN back to moves for replaying long games
    quickly.

✒ Key Features:
    - parseTyped(): any of the three notations, against the legal moves.
    - sanMove() and sanList(): only moves to the named square are spelled
      out, so long games replay fast.
    - Score helpers shared with Analyze and the Coach: stmScore(),
      whiteScore(), pct1() and materialOf().

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { MIN, sanMove, stmScore } from '../game/input.js';

✒ Other Important Information:
    - Dependencies: imports app/state.js; globals Chess (js/core/chess.js)
      and Monolith (js/core/monolith.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { SIDE } from '../app/state.js';

/* ---------- typed moves: long algebraic (e2e4), SAN (Nf3, exd5, e8=Q) or castling (O-O) ---------- */
export function parseTyped(st, text) {
  const raw = text.trim(); if (!raw) return null;
  const norm = raw.replace(/0/g, 'O').replace(/[+#!?]/g, '');
  const moves = Chess.allLegal(st).flatMap(m => m.needsPromo ? ['q', 'r', 'b', 'n'].map(p => Object.assign({}, m, { promo: p, needsPromo: false })) : [m]);
  if (/^O-O(-O)?$/i.test(norm)) return moves.find(m => m.castle === (norm.length > 3 ? 'Q' : 'K')) || { error: 'Castling is not legal here.' };
  const lan = norm.toLowerCase().replace(/[^a-h1-8qrbn]/g, '');
  if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(lan)) {
    const from = Chess.sqIndex(lan.slice(0, 2)), to = Chess.sqIndex(lan.slice(2, 4)), promo = lan[4];
    // king onto its own rook (e1h1) is accepted as castling, as many apps allow
    const castleByRook = moves.find(m => m.castle && m.from === from && to === (m.from >> 3) * 8 + (m.castle === 'K' ? 7 : 0));
    if (castleByRook) return castleByRook;
    const hit = moves.filter(m => m.from === from && m.to === to);
    if (!hit.length) {
      const p = st.board[from];
      if (!p || p.c !== st.turn) return { error: `No ${SIDE[st.turn].toLowerCase()} piece on ${Chess.sqName(from)}.` };
      return { error: `${Chess.sqName(from)} to ${Chess.sqName(to)} is not a legal move.` };
    }
    return hit.length === 1 ? hit[0] : (hit.find(m => m.promo === (promo || 'q')) || hit[0]);
  }
  // the exact spelling first, so bxc4 is the b-pawn and Bxc4 the bishop; then any case (nf3)
  const want = norm.replace(/=/g, ''), sans = moves.map(m => [m, Chess.san(st, m, Chess.apply(st, m)).replace(/[+#=]/g, '')]);
  const found = (sans.find(([, s]) => s === want) || sans.find(([, s]) => s.toLowerCase() === want.toLowerCase()) || [])[0];
  return found || { error: `"${raw}" is not a legal move here. Try e2e4, Nf3 or O-O.` };
}

/* ---------- SAN to move: only moves to the named square are spelled out, so long games replay fast ---------- */
export function sanMove(st, san) {
  const clean = String(san).replace(/[+#!?]/g, ''), legal = Chess.allLegal(st);
  if (/^O-O(-O)?$/.test(clean)) return legal.find(m => m.castle === (clean.length > 3 ? 'Q' : 'K')) || null;
  const m = /([a-h][1-8])(=?[QRBN])?$/.exec(clean); if (!m) return null;
  const to = Chess.sqIndex(m[1]), promo = m[2] ? m[2].replace('=', '').toLowerCase() : null;
  for (const c of legal) {
    if (c.to !== to) continue;
    const mv = c.needsPromo ? Object.assign({}, c, { promo: promo || 'q', needsPromo: false }) : c;
    if (Chess.san(st, mv, Chess.apply(st, mv)).replace(/[+#]/g, '') === clean) return mv;
  }
  return null;
}
export const stmScore = inf => !inf ? null : inf.kind === 'mate' ? { cp: null, mate: inf.value } : { cp: inf.value, mate: null };
export const whiteScore = (inf, turn) => inf ? Monolith.fromInfo(inf, turn) : null;
export const pct1 = x => (x / 10).toFixed(1);
export const MIN = Monolith.MINUS;
export function sanList(state, uci, max = 15) {
  const out = []; let st = state;
  for (const u of uci.slice(0, max)) {
    const mv = Chess.fromUci(st, u); if (!mv) break;
    const nx = Chess.apply(st, mv);
    out.push({ san: Chess.san(st, mv, nx), num: st.turn === 'w' ? `${st.fullmove}.` : out.length === 0 ? `${st.fullmove}…` : '', state: nx, mv }); st = nx;
  }
  return out;
}
export function materialOf(st) { let w = 0, b = 0; for (const p of st.board) if (p) { if (p.c === 'w') w += Chess.VAL[p.t]; else b += Chess.VAL[p.t]; } return w - b; }
