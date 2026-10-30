/*
✒ Metadata
    - Title: Board Diagrams (MONOLITH Edition - v1.2)
    - File Name: diagram.js
    - Relative Path: js/ui/diagram.js
    - Artifact Type: javascript
    - Version: 1.2.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] —
      pieceUse() places one of Dennis's pieces inside another drawing, for
      the graphics meter he designed for Settings.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      pieces are Dennis's house piece set, which he finished drawing and
      asked to see here (js/data/piece-set.js); the stand-in silhouettes
      are gone. A piece fills its square, as he drew it.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    Flat SVG chess diagrams for the panels: a study's thumbnail, the
    position a FEN describes, the structure map that shows passed and
    weak pawns, the board editor. The pieces are Dennis's hand-drawn house
    set (js/data/piece-set.js), drawn once as SVG symbols, so every diagram
    renders the same in every browser, whatever chess glyphs its fonts
    carry.

✒ Key Features:
    - diagram(board, options): an 8×8 SVG from a board array, from White's
      or Black's side, with optional coordinates and square marks.
    - Marks by kind (passed, isolated, doubled, bishop, held, cursor as
      squares; shelter and focus as rings; target as a dot), each a class
      the stylesheet colours per world. Square marks on one square nest.
    - Whole files tinted (open, half), and squares dimmed to show one
      feature alone.
    - Square hit areas with a data-sq attribute, for diagrams you can
      click (the Set up editor).
    - pieceIcon(colour, type): one piece as a small inline SVG, for trays,
      material rows and buttons.
    - pieceUse(type, x, y, size): one piece placed inside another SVG (the
      Settings graphics meter), coloured by the --pc-* properties around
      it.
    - One shared sprite of symbols, added to the page on first use.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no
    setup of its own. For example:
        import { diagram, pieceIcon } from '../ui/diagram.js';
        box.appendChild(diagram(state.board, { flip: true, coords: true }));

✒ Other Important Information:
    - Dependencies: no imports; globals PIECE_SET (js/data/piece-set.js)
      for the pieces and Chess (js/core/chess.js) for square names.
    - Styling: css/position.css (the --dg-* squares and the --pc-* woods,
      per world).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s); ES modules do not load from file://.
---------
*/

const NS = 'http://www.w3.org/2000/svg';
const NAMES = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };
let sprite = null;
function ensureSprite() {
  if (sprite && sprite.isConnected) return;
  sprite = document.createElementNS(NS, 'svg');
  sprite.setAttribute('aria-hidden', 'true'); sprite.setAttribute('width', '0'); sprite.setAttribute('height', '0');
  sprite.style.position = 'absolute'; sprite.id = 'dg-sprite';
  // Dennis's house piece set (js/data/piece-set.js), one symbol per piece, each a square. Its two
  // colours are custom properties (--pc-face, --pc-line), which a <use> passes into its copy of
  // the symbol, so the stylesheet colours each side
  const n = PIECE_SET.size;
  sprite.innerHTML = `<defs>${Object.entries(PIECE_SET.pieces).map(([t, g]) => `<symbol id="dg-${t}" viewBox="0 0 ${n} ${n}">${g}</symbol>`).join('')}</defs>`;
  document.body.appendChild(sprite);
}
function el(tag, attrs = {}) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; }
/* One piece as a small inline icon (trays, material rows). */
export function pieceIcon(c, t, label = '') {
  ensureSprite();
  const s = el('svg', { viewBox: `0 0 ${PIECE_SET.size} ${PIECE_SET.size}`, class: `dg-icon dg-${c === 'w' ? 'pw' : 'pb'}` });
  if (label) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', label); } else s.setAttribute('aria-hidden', 'true');
  s.appendChild(el('use', { href: `#dg-${t}` }));
  return s;
}
/* One piece placed inside another drawing: a <use> of its symbol, size × size from x, y. Its woods
   come from the --pc-face and --pc-line properties of whatever contains it. */
export function pieceUse(t, x, y, size) {
  ensureSprite();
  return el('use', { href: `#dg-${t}`, x, y, width: size, height: size });
}
/* A diagram of a board (64 squares, a1 first, as the rules engine keeps it).
   options: flip (Black at the bottom), coords (file and rank letters), marks (sq → kind or
   [kinds]), files ({ file: kind } to tint whole files), hit (square hit areas), label (its
   accessible name), dim (a Set of squares that fade, for a mark shown alone), cls (classes). */
export function diagram(board, o = {}) {
  ensureSprite();
  const pad = o.coords ? 0.42 : 0, size = 8 + pad;
  const svg = el('svg', { viewBox: `${-pad} 0 ${size} ${size}`, class: 'dg' + (o.cls ? ' ' + o.cls : '') });
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', o.label || 'Board diagram');
  const xy = sq => { const f = sq & 7, r = sq >> 3; return o.flip ? [7 - f, r] : [f, 7 - r]; };
  const sqG = el('g', { class: 'dg-squares' }), markG = el('g', { class: 'dg-marks' }), pcG = el('g', { class: 'dg-pieces' }), hitG = el('g', { class: 'dg-hits' });
  for (let sq = 0; sq < 64; sq++) {
    const [x, y] = xy(sq), light = ((sq >> 3) + (sq & 7)) & 1;
    sqG.appendChild(el('rect', { x, y, width: 1, height: 1, class: `dg-sq ${light ? 'l' : 'd'}${o.dim && o.dim.has(sq) ? ' dim' : ''}` }));
  }
  if (o.files) for (const [f, kind] of Object.entries(o.files)) { const x = o.flip ? 7 - +f : +f; markG.appendChild(el('rect', { x, y: 0, width: 1, height: 8, class: `dg-file ${kind}` })); }
  for (const [sq, kinds] of Object.entries(o.marks || {})) {
    const [x, y] = xy(+sq);
    let ring = 0;   // several square marks on one square nest inside each other
    for (const kind of [].concat(kinds)) {
      if (kind === 'target') markG.appendChild(el('circle', { cx: x + 0.5, cy: y + 0.5, r: 0.16, class: 'dg-mk target' }));
      else if (kind === 'shelter' || kind === 'focus') markG.appendChild(el('circle', { cx: x + 0.5, cy: y + 0.5, r: 0.44, class: `dg-mk ${kind}` }));
      else { const i = 0.04 + 0.1 * ring++; markG.appendChild(el('rect', { x: x + i, y: y + i, width: 1 - 2 * i, height: 1 - 2 * i, rx: 0.1, class: `dg-mk ${kind}` })); }
    }
  }
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]; if (!p) continue; const [x, y] = xy(sq);
    const u = el('use', { href: `#dg-${p.t}`, x, y, width: 1, height: 1, class: `dg-pc dg-${p.c === 'w' ? 'pw' : 'pb'}${o.dim && o.dim.has(sq) ? ' dim' : ''}` });
    pcG.appendChild(u);
  }
  svg.append(sqG, markG, pcG);
  if (o.coords) {
    const cg = el('g', { class: 'dg-coords' });
    for (let i = 0; i < 8; i++) {
      const file = 'abcdefgh'[o.flip ? 7 - i : i], rank = o.flip ? i + 1 : 8 - i;
      const ft = el('text', { x: i + 0.5, y: 8.33, 'text-anchor': 'middle' }); ft.textContent = file; cg.appendChild(ft);
      const rt = el('text', { x: -0.21, y: i + 0.6, 'text-anchor': 'middle' }); rt.textContent = rank; cg.appendChild(rt);
    }
    svg.appendChild(cg);
  }
  if (o.hit) {
    for (let sq = 0; sq < 64; sq++) {
      const [x, y] = xy(sq), r = el('rect', { x, y, width: 1, height: 1, class: 'dg-hit', 'data-sq': sq });
      const p = board[sq], name = Chess.sqName(sq);
      const t = el('title'); t.textContent = p ? `${name}: ${p.c === 'w' ? 'white' : 'black'} ${NAMES[p.t]}` : name; r.appendChild(t);
      hitG.appendChild(r);
    }
    svg.appendChild(hitG);
  }
  return svg;
}
/* A short accessible description of a board: who has what. */
export function describeBoard(board) {
  const side = c => { const n = {}; for (const p of board) if (p && p.c === c) n[p.t] = (n[p.t] || 0) + 1; return Object.keys(n).length ? ['k', 'q', 'r', 'b', 'n', 'p'].filter(t => n[t]).map(t => `${n[t] > 1 ? n[t] + ' ' : ''}${NAMES[t]}${n[t] > 1 ? 's' : ''}`).join(', ') : 'nothing'; };
  return `White: ${side('w')}. Black: ${side('b')}.`;
}
