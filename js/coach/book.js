/*
✒ Metadata
    - Title: Opening Book Lookup (MONOLITH Edition - v1.0)
    - File Name: book.js
    - Relative Path: js/coach/book.js
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
    Looks positions up in OPENING_BOOK, so the Coach can say a move is book
    and name the opening, even after a transposition.

✒ Key Features:
    - bookKey(): the dataset's FNV-1a key for a state.
    - bookAt(): the book record for a position, cached.
    - openingOf(): the name of the opening the game is in.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { openingOf, bookAt } from '../coach/book.js';

✒ Other Important Information:
    - Dependencies: imports app/state.js and coach/facts.js; globals Chess
      (js/core/chess.js) and OPENING_BOOK (js/data/opening-book.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { game } from '../app/state.js';
import { hashStr } from './facts.js';

/* ---------- the opening book (the dataset is js/data/opening-book.js) ---------- */
let bookMap = null;
const bookCache = new WeakMap();
function bookKey(st) {
  const f = Chess.fen(st).split(' '), ep = st.ep >= 0 && Chess.allLegal(st).some(x => x.ep) ? f[3] : '-';
  return hashStr(`${f[0]} ${f[1]} ${f[2]} ${ep}`).toString(36);
}
export function bookAt(st) {
  if (!st) return null;
  if (bookCache.has(st)) return bookCache.get(st);
  if (!bookMap) { bookMap = new Map(); for (const rec of OPENING_BOOK.entries.split('|')) { const [k, eco, f, ...v] = rec.split(','); bookMap.set(k, { eco, fam: OPENING_BOOK.families[parseInt(f, 36)], variation: v.join(',') }); } }
  const e = bookMap.get(bookKey(st)), out = e ? { eco: e.eco, fam: e.fam, name: e.variation ? `${e.fam}: ${e.variation}` : e.fam } : null;
  bookCache.set(st, out); return out;
}
/* the game's opening so far: the last named position at or before ply (lichess's own method) */
export function openingOf(ply) {
  for (let i = Math.min(ply, game.states.length - 1); i >= 0; i--) { const b = bookAt(game.states[i]); if (b) return Object.assign({ ply: i }, b); }
  return null;
}
