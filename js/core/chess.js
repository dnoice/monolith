/*
✒ Metadata
    - Title: Chess Rules Engine (MONOLITH Edition - v1.0)
    - File Name: chess.js
    - Relative Path: js/core/chess.js
    - Artifact Type: library
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
      chose, and this header names the page by its file in the repository,
      index.html.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: bishops alone are insufficient
      material only when every one stands on squares of one colour; a FEN's
      en passant square counts only when it and the square the pawn left are
      both empty; and fromUci() promotes to a queen when the move names no
      piece it knows.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The rules of chess as pure functions over immutable state: move
    generation, legality, check and mate, draws, FEN and SAN. No DOM and no
    three.js, so the page and the Node tools play by exactly the same rules.

✒ Key Features:
    - legal() and allLegal(): moves for every piece, with castling, en
      passant and promotion.
    - status(): check, mate, stalemate, the fifty-move rule and insufficient
      material.
    - fen() and parseFen(); parseFen returns an error for a position it
      cannot accept.
    - san(), fromUci() and toUci(); sqName() and sqIndex().
    - inCheck(), kingSq(), attackers() and material().
    - Immutable states: apply() returns a new state, so any position can be
      kept and revisited.

✒ Usage Instructions:
    Loaded by index.html as a classic script, so Chess is a global for every
    module. In Node:
        const Chess = require('./js/core/chess.js');

✒ Examples:
    const st = Chess.newGame();
    const mv = Chess.fromUci(st, 'e2e4');
    const next = Chess.apply(st, mv);
    Chess.status(next); // { check, mate, stale, draw50, insufficient, over }
    Chess.parseFen('8/8/8/8/8/8/8/K6k w - - 0 1');

✒ Other Important Information:
    - Dependencies: none.
    - Compatible platforms: current browsers as a classic script (it defines
      a global), and Node.js 18 or newer through require().
    - Used by: 28 of the page's modules, js/core/levels.js,
      tools/verify-studies.mjs and tools/calibrate.js.
---------
*/
/* Chess rules engine. Pure functions over immutable state; no DOM, no Three.js. */
const Chess = (() => {
  const FILES = 'abcdefgh';
  const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const sqName = i => FILES[i & 7] + ((i >> 3) + 1);
  const sqIndex = s => { const f = FILES.indexOf(s[0]); const r = +s[1] - 1; return (f < 0 || r < 0 || r > 7) ? -1 : r * 8 + f; };
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  const N_D = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
  const K_D = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  const B_D = [[1,1],[-1,1],[-1,-1],[1,-1]];
  const R_D = [[1,0],[0,1],[-1,0],[0,-1]];
  const inB = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
  const other = c => c === 'w' ? 'b' : 'w';

  function initialBoard() {
    const b = new Array(64).fill(null);
    START.split('/').forEach((row, ri) => {
      const rank = 7 - ri; let f = 0;
      for (const ch of row) {
        if (/\d/.test(ch)) { f += +ch; continue; }
        b[rank * 8 + f] = { t: ch.toLowerCase(), c: ch === ch.toUpperCase() ? 'w' : 'b' };
        f++;
      }
    });
    return b;
  }
  function newGame() {
    return { board: initialBoard(), turn: 'w', castling: { wK: true, wQ: true, bK: true, bQ: true }, ep: -1, halfmove: 0, fullmove: 1 };
  }

  function isAttacked(board, sq, by) {
    const f = sq & 7, r = sq >> 3;
    const pr = by === 'w' ? r - 1 : r + 1;
    for (const df of [-1, 1]) if (inB(f + df, pr)) { const p = board[pr * 8 + f + df]; if (p && p.c === by && p.t === 'p') return true; }
    for (const [df, dr] of N_D) if (inB(f + df, r + dr)) { const p = board[(r + dr) * 8 + f + df]; if (p && p.c === by && p.t === 'n') return true; }
    for (const [df, dr] of K_D) if (inB(f + df, r + dr)) { const p = board[(r + dr) * 8 + f + df]; if (p && p.c === by && p.t === 'k') return true; }
    for (const [df, dr] of B_D) { let x = f + df, y = r + dr; while (inB(x, y)) { const p = board[y * 8 + x]; if (p) { if (p.c === by && (p.t === 'b' || p.t === 'q')) return true; break; } x += df; y += dr; } }
    for (const [df, dr] of R_D) { let x = f + df, y = r + dr; while (inB(x, y)) { const p = board[y * 8 + x]; if (p) { if (p.c === by && (p.t === 'r' || p.t === 'q')) return true; break; } x += df; y += dr; } }
    return false;
  }
  const kingSq = (board, c) => board.findIndex(p => p && p.t === 'k' && p.c === c);
  const inCheck = (state, c = state.turn) => isAttacked(state.board, kingSq(state.board, c), other(c));

  function pseudo(state, from) {
    const b = state.board, p = b[from]; if (!p || p.c !== state.turn) return [];
    const f = from & 7, r = from >> 3, out = [];
    const push = (to, extra) => out.push(Object.assign({ from, to, capture: !!b[to], ep: false, castle: null, promo: null, needsPromo: false }, extra));
    const slide = dirs => { for (const [df, dr] of dirs) { let x = f + df, y = r + dr; while (inB(x, y)) { const q = b[y * 8 + x]; if (q) { if (q.c !== p.c) push(y * 8 + x); break; } push(y * 8 + x); x += df; y += dr; } } };
    if (p.t === 'p') {
      const dir = p.c === 'w' ? 1 : -1, start = p.c === 'w' ? 1 : 6, last = p.c === 'w' ? 7 : 0;
      const one = (r + dir) * 8 + f;
      if (inB(f, r + dir) && !b[one]) {
        if (r + dir === last) push(one, { promo: 'q', needsPromo: true }); else push(one);
        const two = (r + 2 * dir) * 8 + f;
        if (r === start && !b[two]) push(two);
      }
      for (const df of [-1, 1]) {
        if (!inB(f + df, r + dir)) continue;
        const to = (r + dir) * 8 + f + df, q = b[to];
        if (q && q.c !== p.c) { if (r + dir === last) push(to, { promo: 'q', needsPromo: true }); else push(to); }
        else if (to === state.ep) push(to, { capture: true, ep: true });
      }
    } else if (p.t === 'n') {
      for (const [df, dr] of N_D) if (inB(f + df, r + dr)) { const to = (r + dr) * 8 + f + df; const q = b[to]; if (!q || q.c !== p.c) push(to); }
    } else if (p.t === 'b') slide(B_D);
    else if (p.t === 'r') slide(R_D);
    else if (p.t === 'q') slide(B_D.concat(R_D));
    else if (p.t === 'k') {
      for (const [df, dr] of K_D) if (inB(f + df, r + dr)) { const to = (r + dr) * 8 + f + df; const q = b[to]; if (!q || q.c !== p.c) push(to); }
      const rank = p.c === 'w' ? 0 : 7, e = rank * 8 + 4, opp = other(p.c);
      if (from === e && !isAttacked(b, e, opp)) {
        if (state.castling[p.c + 'K'] && !b[e + 1] && !b[e + 2] && b[e + 3] && b[e + 3].t === 'r' && b[e + 3].c === p.c &&
            !isAttacked(b, e + 1, opp) && !isAttacked(b, e + 2, opp)) push(e + 2, { castle: 'K' });
        if (state.castling[p.c + 'Q'] && !b[e - 1] && !b[e - 2] && !b[e - 3] && b[e - 4] && b[e - 4].t === 'r' && b[e - 4].c === p.c &&
            !isAttacked(b, e - 1, opp) && !isAttacked(b, e - 2, opp)) push(e - 2, { castle: 'Q' });
      }
    }
    return out;
  }

  function apply(state, mv) {
    const b = state.board.slice(), p = b[mv.from];
    const castling = Object.assign({}, state.castling);
    const captured = mv.ep ? b[mv.to + (p.c === 'w' ? -8 : 8)] : b[mv.to];
    let ep = -1;
    b[mv.to] = mv.promo ? { t: mv.promo, c: p.c } : p;
    b[mv.from] = null;
    if (mv.ep) b[mv.to + (p.c === 'w' ? -8 : 8)] = null;
    if (mv.castle) {
      const rank = mv.from >> 3;
      const rf = mv.castle === 'K' ? rank * 8 + 7 : rank * 8, rt = mv.castle === 'K' ? mv.to - 1 : mv.to + 1;
      b[rt] = b[rf]; b[rf] = null;
    }
    if (p.t === 'p' && Math.abs(mv.to - mv.from) === 16) ep = (mv.from + mv.to) / 2;
    if (p.t === 'k') { castling[p.c + 'K'] = false; castling[p.c + 'Q'] = false; }
    const corners = { 0: 'wQ', 7: 'wK', 56: 'bQ', 63: 'bK' };
    if (corners[mv.from]) castling[corners[mv.from]] = false;
    if (corners[mv.to]) castling[corners[mv.to]] = false;
    return {
      board: b, turn: other(state.turn), castling, ep,
      halfmove: (p.t === 'p' || captured) ? 0 : state.halfmove + 1,
      fullmove: state.turn === 'b' ? state.fullmove + 1 : state.fullmove
    };
  }

  const legal = (state, from) => pseudo(state, from).filter(m => !inCheck(apply(state, m), state.turn));
  function allLegal(state) { const out = []; for (let i = 0; i < 64; i++) { const p = state.board[i]; if (p && p.c === state.turn) out.push(...legal(state, i)); } return out; }

  function insufficient(board) {
    const minors = []; let heavy = false, pawns = false;
    board.forEach((p, s) => { if (!p || p.t === 'k') return; if (p.t === 'p') pawns = true; else if (p.t === 'q' || p.t === 'r') heavy = true; else minors.push({ p, s }); });
    if (pawns || heavy) return false;
    if (minors.length <= 1) return true;
    // bishops only, every one on squares of one colour (whoever owns them): no mate is possible.
    // With bishops on both colours, or a knight beside a bishop, a mate can still be composed,
    // so FIDE plays on (as do we).
    const shade = s => ((s >> 3) + (s & 7)) & 1;
    return minors.every(m => m.p.t === 'b') && minors.every(m => shade(m.s) === shade(minors[0].s));
  }
  function status(state) {
    const check = inCheck(state), moves = allLegal(state).length;
    const mate = check && moves === 0, stale = !check && moves === 0;
    const draw50 = state.halfmove >= 100, insuf = insufficient(state.board);
    return { check, mate, stale, draw50, insufficient: insuf, over: mate || stale || draw50 || insuf };
  }

  function san(state, mv, next) {
    const p = state.board[mv.from]; let s = '';
    if (mv.castle) s = mv.castle === 'K' ? 'O-O' : 'O-O-O';
    else {
      if (p.t !== 'p') {
        s += p.t.toUpperCase();
        const others = [];
        for (let i = 0; i < 64; i++) { const q = state.board[i]; if (i !== mv.from && q && q.c === p.c && q.t === p.t && legal(state, i).some(m => m.to === mv.to)) others.push(i); }
        if (others.length) {
          const sameFile = others.some(i => (i & 7) === (mv.from & 7)), sameRank = others.some(i => (i >> 3) === (mv.from >> 3));
          if (!sameFile) s += FILES[mv.from & 7]; else if (!sameRank) s += (mv.from >> 3) + 1; else s += sqName(mv.from);
        }
      } else if (mv.capture) s += FILES[mv.from & 7];
      if (mv.capture) s += 'x';
      s += sqName(mv.to);
      if (mv.promo) s += '=' + mv.promo.toUpperCase();
    }
    const st = status(next); if (st.mate) s += '#'; else if (st.check) s += '+';
    return s;
  }

  function material(board) {
    const counts = { w: {}, b: {} };
    for (const p of board) if (p) counts[p.c][p.t] = (counts[p.c][p.t] || 0) + 1;
    return counts;
  }

  function fen(state) {
    const rows = [];
    for (let r = 7; r >= 0; r--) {
      let row = '', empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = state.board[r * 8 + f];
        if (!p) { empty++; continue; }
        if (empty) { row += empty; empty = 0; }
        row += p.c === 'w' ? p.t.toUpperCase() : p.t;
      }
      if (empty) row += empty;
      rows.push(row);
    }
    const c = state.castling, cs = (c.wK ? 'K' : '') + (c.wQ ? 'Q' : '') + (c.bK ? 'k' : '') + (c.bQ ? 'q' : '');
    return `${rows.join('/')} ${state.turn} ${cs || '-'} ${state.ep >= 0 ? sqName(state.ep) : '-'} ${state.halfmove} ${state.fullmove}`;
  }
  /* Parse a FEN string into a state. Returns { state } or { error } with a plain-English reason.
     Missing trailing fields default (castling '-', no en passant, clocks 0 / 1). Castling rights
     that do not match a king and rook on their home squares are dropped rather than rejected. */
  function parseFen(text) {
    const parts = String(text || '').trim().split(/\s+/);
    if (!parts[0]) return { error: 'The position is empty.' };
    const rows = parts[0].split('/');
    if (rows.length !== 8) return { error: 'The board needs eight ranks separated by slashes.' };
    const board = new Array(64).fill(null), kings = { w: 0, b: 0 };
    for (let ri = 0; ri < 8; ri++) {
      let f = 0;
      for (const ch of rows[ri]) {
        if (/[1-8]/.test(ch)) { f += +ch; continue; }
        if (!/[pnbrqkPNBRQK]/.test(ch)) return { error: `"${ch}" is not a piece letter.` };
        if (f > 7) return { error: `Rank ${8 - ri} has more than eight squares.` };
        const p = { t: ch.toLowerCase(), c: ch === ch.toUpperCase() ? 'w' : 'b' };
        if (p.t === 'k') kings[p.c]++;
        if (p.t === 'p' && (ri === 0 || ri === 7)) return { error: 'Pawns cannot stand on the first or last rank.' };
        board[(7 - ri) * 8 + f] = p; f++;
      }
      if (f !== 8) return { error: `Rank ${8 - ri} does not add up to eight squares.` };
    }
    if (kings.w !== 1 || kings.b !== 1) return { error: 'Each side needs exactly one king.' };
    const turn = (parts[1] || 'w').toLowerCase();
    if (turn !== 'w' && turn !== 'b') return { error: 'Side to move must be w or b.' };
    const cs = parts[2] || '-';
    const rook = (sq, c) => board[sq] && board[sq].t === 'r' && board[sq].c === c;
    const kingHome = c => board[c === 'w' ? 4 : 60] && board[c === 'w' ? 4 : 60].t === 'k' && board[c === 'w' ? 4 : 60].c === c;
    const castling = {
      wK: cs.includes('K') && kingHome('w') && rook(7, 'w'), wQ: cs.includes('Q') && kingHome('w') && rook(0, 'w'),
      bK: cs.includes('k') && kingHome('b') && rook(63, 'b'), bQ: cs.includes('q') && kingHome('b') && rook(56, 'b')
    };
    let ep = -1;
    if (parts[3] && parts[3] !== '-') {
      ep = sqIndex(parts[3]);
      const okRank = turn === 'w' ? 5 : 2, pawnSq = turn === 'w' ? ep - 8 : ep + 8;
      // the pawn that just moved two squares stands beyond the en passant square, and both the
      // square it skipped and the one it left are empty
      const fromSq = turn === 'w' ? ep + 8 : ep - 8;
      if (ep < 0 || (ep >> 3) !== okRank || !board[pawnSq] || board[pawnSq].t !== 'p' || board[pawnSq].c === turn || board[ep] || board[fromSq]) ep = -1;
    }
    const halfmove = Math.max(0, parseInt(parts[4], 10) || 0), fullmove = Math.max(1, parseInt(parts[5], 10) || 1);
    const state = { board, turn, castling, ep, halfmove, fullmove };
    if (isAttacked(board, kingSq(board, other(turn)), turn)) return { error: 'The side not on move is already in check, so this position cannot be reached.' };
    return { state };
  }
  /* Resolve a UCI move string (e2e4, e7e8q) against the legal moves of a state. */
  function fromUci(state, uci) {
    const from = sqIndex(uci.slice(0, 2)), to = sqIndex(uci.slice(2, 4)), promo = uci[4];
    if (from < 0 || to < 0) return null;
    const mv = legal(state, from).find(m => m.to === to);
    if (!mv) return null;
    if (mv.needsPromo) return Object.assign({}, mv, { promo: promo && 'qrbn'.includes(promo) ? promo : 'q', needsPromo: false });
    return mv;
  }
  const toUci = mv => sqName(mv.from) + sqName(mv.to) + (mv.promo || '');

  /* Squares of `by`'s pieces that attack `sq`, pins ignored (the usual attacker count). */
  function attackers(board, sq, by) {
    const f = sq & 7, r = sq >> 3, out = [];
    const at = (x, y, types) => { if (!inB(x, y)) return; const i = y * 8 + x, p = board[i]; if (p && p.c === by && types.includes(p.t)) out.push(i); };
    const pr = by === 'w' ? r - 1 : r + 1;
    for (const df of [-1, 1]) at(f + df, pr, 'p');
    for (const [df, dr] of N_D) at(f + df, r + dr, 'n');
    for (const [df, dr] of K_D) at(f + df, r + dr, 'k');
    const ray = (dirs, types) => { for (const [df, dr] of dirs) { let x = f + df, y = r + dr; while (inB(x, y)) { const p = board[y * 8 + x]; if (p) { if (p.c === by && types.includes(p.t)) out.push(y * 8 + x); break; } x += df; y += dr; } } };
    ray(B_D, 'bq'); ray(R_D, 'rq');
    return out;
  }

  return { FILES, VAL, sqName, sqIndex, newGame, legal, allLegal, apply, status, san, inCheck, kingSq, material, other, fen, parseFen, fromUci, toUci, attackers };
})();
if (typeof module !== 'undefined') module.exports = Chess;
