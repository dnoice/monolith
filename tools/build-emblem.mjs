/*
✒ Metadata
    - Title: Emblem Builder (MONOLITH Edition - v1.3)
    - File Name: build-emblem.mjs
    - Relative Path: tools/build-emblem.mjs
    - Artifact Type: javascript
    - Version: 1.3.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.3.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — Also
      writes White's back rank for the loading screen's arc, from
      js/data/piece-set.js or a fourth argument, between boot-arc markers.
    - 1.2.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — For the
      Conical M, which Dennis made MONOLITH's official logo and emblem: a
      board of one tone (his slate tiles) is read as the darker squares, so
      the loading screen draws it in the diagrams' slate, where 1.1.0
      stopped on it; a square cut by the letter is placed by the middle of
      its outline rather than its first point; a piece is placed through
      the transform on its own paths as well as its group's; the M's stroke
      follows the Conical M's legs and bridge; and, as Dennis asked, the
      app bar's logo is written from assets/monolith-logo.svg between the
      page's brand-logo markers, in place of the hand-drawn mark there.
    - 1.1.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — For the
      animated loading screen Dennis asked for: every square gets its moment
      as classes (a0..a20 for when it lights as the M is written, stroke by
      stroke; g0..g12 for the glint), and every piece a wrapper with its
      turn (i0..i11) and its glint, so the stylesheet can time them before
      any script runs.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, for the loading screen Dennis asked for around his emblem:
      it copies assets/monolith-emblem.svg into the page, where the
      loading screen shows it before anything else has loaded.

✒ Description:
    Reads Dennis's two official marks and the house piece set and writes
    them into the page: the emblem (assets/monolith-emblem.svg, the Conical
    M with its twelve pieces) as the loading screen's inline SVG, between
    the page's boot-emblem markers; White's back rank from the piece set
    (js/data/piece-set.js) as the arc over the emblem, between its boot-arc
    markers; and the logo (assets/monolith-logo.svg, the bare M) as the app
    bar's mark, between its brand-logo markers. Inline, all three paint
    with the page's first frame, before any script has run, and the
    stylesheet colours them per world, so they follow the cathedral and
    MONOLITH as the board diagrams do.

✒ Key Features:
    - The squares, in both marks: every square of the board group, a rect
      or a cut path, with its geometry and the group's transform. With two
      fills a square is class l (the lighter) or d (the darker); with one,
      as the Conical M is drawn, every square is class d, the diagrams'
      dark square, which in the cathedral is the very slate of Dennis's M.
    - The pieces (the emblem): every piece-{side}-{type}-emblem group with
      its transform; each path or circle becomes class f (the piece's face)
      or c (its contour and marks). A White piece's faces are its lighter
      fill, a Black piece's its darker, so the stylesheet can give either
      side either wood.
    - Timing, as classes (the emblem): a square's a0..a20 follows its place
      along the M's stroke (up the left leg, down to the middle of the
      bridge, up again, down the right leg), a little later the farther it
      sits from the stroke's centre line; its g0..g12 its place corner to
      corner, for the glint. Each piece is wrapped in a group (class pc)
      with its turn, i0..i11 (the sides alternating, pawns first, kings
      last), and its glint; the piece keeps its own transform inside.
    - Where a square is: a rect's centre; a path written only with absolute
      moves, lines and curves (as the generator writes a cut square), the
      middle of its points; any other path (as Inkscape writes one), its
      first point. A piece is placed by the first point of its drawing,
      through its group's transform and its path's own.
    - The arc (White's back rank): PIECE_SET, read by running
      js/data/piece-set.js (a classic script, not a module), becomes one
      <symbol> per kind, boot-pc-r, -n, -b, -q and -k, with the set's ids
      dropped, since the board diagrams draw the same set into the page
      later; then the eight pieces a to h, rook to rook, each a span of its
      own (class boot-arc-pc) holding a <use> of its kind. The stylesheet
      places each on the arc and times it by its order, and a span moves
      on the compositor where a part of an SVG would not. The pieces keep
      the set's own face and line fills.
    - Numbers rounded to two decimals in the emblem (four for a transform's
      scale) and to one in the logo and the arc: at the sizes they are
      drawn, far below a pixel.
    - The emblem's usual stroke width goes on its board group (class bd),
      and a square drawn wider or narrower keeps its own; the stylesheet
      sets only the stroke's colour and joins, so both survive. The logo's
      squares carry no stroke width: the stylesheet draws its mortar one
      pixel wide at any size, since at 32 pixels the drawing's own mortar
      would vanish. Even-odd fill rules are kept on the pieces' parts.
    - Fails loudly on a missing board, piece, colour or marker, or a piece
      set that cannot be read or lacks a kind, rather than writing half a
      mark.

✒ Usage Instructions:
    Run with Node 18 or later from the project folder after changing
    either mark or the piece set:
        node tools/build-emblem.mjs
    It reads assets/monolith-emblem.svg, assets/monolith-logo.svg and
    js/data/piece-set.js and rewrites the blocks between
    <!-- boot-emblem:start … --> and <!-- boot-emblem:end -->, between
    <!-- boot-arc:start … --> and <!-- boot-arc:end -->, and between
    <!-- brand-logo:start … --> and <!-- brand-logo:end -->, in index.html
    (else wizards-chess.html).
    Other paths, in this order (any left off at the end take the default):
        node tools/build-emblem.mjs path/to/emblem.svg path/to/page.html \
            path/to/logo.svg path/to/piece-set.js
    Never edit the blocks in the page by hand; they are replaced on each
    run. The marks themselves are written by the brand system,
    assets/generator/conical_m.py, and the piece set by
    tools/build-piece-set.mjs.

✒ Other Important Information:
    - Dependencies: Node's fs, path and url only.
    - Input contract: the emblem has a group id="board-emblem" holding the
      squares (rects and paths, one or two fills between them) and groups
      id="piece-{white|black}-{type}-emblem" holding paths and circles in
      two fills; the logo has a group id="board-logo" holding its squares
      the same way; every element styled inline, as Inkscape and the
      generator write it. The piece set declares PIECE_SET with a size
      (the side of a piece's square) and pieces.r, n, b, q and k, each a
      string of SVG.
    - Output: the emblem's classes bd, l, d, pc, pw, pb, f, c, a0..a20,
      g0..g12 and i0..i11, under .boot-emblem; the arc's boot-arc,
      boot-arc-set and boot-arc-pc, with symbols boot-pc-r, -n, -b, -q and
      -k; the logo's bd, l and d, under .brand .logo (all in
      css/layout.css).
    - Compatible platforms: any system with Node 18+.
---------
*/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// fileURLToPath, not the URL's pathname: on Windows that reads /C:/…, and it keeps %20 for a space
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [srcArg, pageArg, logoArg, setArg] = process.argv.slice(2);
const SRC = path.resolve(srcArg || path.join(ROOT, 'assets', 'monolith-emblem.svg'));
const PAGE = path.resolve(pageArg || ['index.html', 'wizards-chess.html'].map(f => path.join(ROOT, f)).find(f => fs.existsSync(f)) || 'index.html');
const fail = m => { console.error(`build-emblem: ${m}`); process.exit(1); };
/* The app bar draws the emblem itself now (Dennis, 10/30/2026: the M with its pieces stands as the
   M of the word), so the bare logo is no longer read; the third argument keeps its place so the
   fourth still names the piece set. */
if (logoArg) console.warn(`build-emblem: the app bar draws the emblem now; ${logoArg} is not read`);

/* ---------- a small tokenizer: the emblem is plain Inkscape SVG, one element per tag ---------- */
const attrsOf = s => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const styleOf = a => Object.fromEntries((a.style || '').split(';').filter(Boolean).map(p => p.split(':').map(x => x.trim())));
/* Each drawn element with the ids of the groups around it, and every group by its id. */
function parse(file) {
  const name = path.basename(file);
  const svg = fs.readFileSync(file, 'utf8');
  const tokens = [...svg.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(\/?)(svg|g|rect|path|circle)\b([^>]*?)(\/?)>/g)]
    .map(m => ({ close: !!m[1], tag: m[2], a: attrsOf(m[3]), self: !!m[4] }));
  const root = tokens.find(t => t.tag === 'svg' && !t.close) || fail(`${name} has no <svg> element`);
  const viewBox = root.a.viewBox || fail(`${name} has no viewBox`);
  const drawn = []; const groups = {}; const stack = [];
  for (const t of tokens) {
    if (t.tag === 'g' && !t.close && !t.self) { stack.push(t.a.id || ''); groups[t.a.id] = t.a; continue; }
    if (t.tag === 'g' && t.close) { stack.pop(); continue; }
    if (['rect', 'path', 'circle'].includes(t.tag) && !t.close) drawn.push({ ...t, within: [...stack] });
  }
  return { name, viewBox, drawn, groups };
}

/* ---------- numbers ---------- */
const round = (s, n = 2) => s.replace(/-?\d*\.\d+(?:e-?\d+)?|-?\d+e-?\d+/gi, v => {
  const r = (+v).toFixed(n).replace(/\.?0+$/, ''); return r === '-0' ? '0' : r;
});
const tf = s => s ? round(s.replace(/matrix\(([^,]+),/, (m, a) => `matrix(${(+a).toFixed(6)},`), 4) : '';
const tfAttr = s => s ? ` transform="${tf(s)}"` : '';
const lum = h => { const m = /^#([0-9a-f]{6})$/i.exec(h) || fail(`a fill that is not #rrggbb: ${h}`); return [0, 2, 4].reduce((s, i) => s + parseInt(m[1].slice(i, i + 2), 16), 0); };

/* ---------- geometry, for the timing ---------- */
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
function affine(t = '') {
  let m = [1, 0, 0, 1, 0, 0];
  for (const [, fn, args] of t.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    const n = fn === 'translate' ? [1, 0, 0, 1, v[0], v[1] || 0] : fn === 'scale' ? [v[0], 0, 0, v[1] ?? v[0], 0, 0] : fn === 'matrix' ? v
      : fn === 'rotate' && v.length === 1 ? [Math.cos(v[0] * Math.PI / 180), Math.sin(v[0] * Math.PI / 180), -Math.sin(v[0] * Math.PI / 180), Math.cos(v[0] * Math.PI / 180), 0, 0] : fail(`a transform the builder cannot read: ${fn}(${args})`);
    m = mul(m, n);
  }
  return m;
}
const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const firstPoint = d => { const m = /^\s*[mM]\s*(-?[\d.]+(?:e-?\d+)?)[\s,]+(-?[\d.]+(?:e-?\d+)?)/.exec(d) || fail('a path that does not start with a move'); return [+m[1], +m[2]]; };
/* A path written only with absolute moves, lines and curves (the generator's cut squares) is placed
   by the middle of its points, its own middle; any other path (Inkscape's relative commands, arcs,
   one-number H and V) by its first point, which needs no parsing. */
const ABSOLUTE = /^[\sMLCZ\d.,eE+-]*$/;
function middleOf(d) {
  if (!ABSOLUTE.test(d)) return firstPoint(d);
  const v = (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number);
  const xs = v.filter((_, i) => i % 2 === 0), ys = v.filter((_, i) => i % 2 === 1);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

/* ---------- the squares ----------
   One fill or two: with two, the lighter is class l and the darker d; with one (the Conical M is
   drawn in one slate, the mortar doing the rest) every square is d, the diagrams' dark square. */
function toneOf(squares, what) {
  const fills = [...new Set(squares.map(d => (styleOf(d.a).fill || '').toLowerCase()))];
  if (fills.length < 1 || fills.length > 2) fail(`${what}: the squares should have one or two fills, found ${fills.join(', ') || 'none'}`);
  const [a, b] = fills.map(lum);
  const light = fills.length === 2 ? (a > b ? fills[0] : fills[1]) : null;
  return d => (styleOf(d.a).fill || '').toLowerCase() === light ? 'l' : 'd';
}
function squareEl(d, id, n, extra = '') {
  if (d.tag === 'rect') return `<rect id="${id}" x="${round(d.a.x, n)}" y="${round(d.a.y, n)}" width="${round(d.a.width, n)}" height="${round(d.a.height, n)}"${tfAttr(d.a.transform)}${extra}/>`;
  if (d.tag === 'path') return `<path id="${id}" d="${round(d.a.d, n)}"${tfAttr(d.a.transform)}${extra}/>`;
  fail(`a ${d.tag} on the board`);
}

/* ================= the emblem: one drawing, drawn twice =================
   The emblem is drawn once, in a hidden sprite that outlives the loading screen (the screen is
   removed from the page when it lifts), and both places draw it with <use>: the loading screen a
   square or a piece at a time, so each keeps its moment as a class on its own <use>, and the app
   bar the whole of it at once. Colour crosses into a <use> by inheritance, so the drawing carries
   none of its own: a square's fill, a piece's face (fill) and contour (currentColor) and the mortar
   come from whoever draws it, the loading screen by its classes, the app bar through the custom
   properties the sprite's groups read (css/layout.css). */
const E = parse(SRC);
const board = E.groups['board-emblem'] || fail(`${E.name} has no group id="board-emblem"`);
const [vx, vy, vw, vh] = E.viewBox.split(/[\s,]+/).map(Number);

/* ---------- where things are, for the loading screen's timing ----------
   The screen's animation (css/layout.css) gives each square and piece a moment by class, from
   buckets: a square's a0..a20 is when it lights as the M is written, stroke by stroke; its g0..g12,
   and a piece's, is when the glint crossing the emblem corner to corner reaches it; a piece's i0..i11
   is its turn to be set down. The stroke is the Conical M's, as a pen would write it, in fractions of
   the emblem: up the left leg's centre line (a leg is a quarter of the width) to the top row's
   middle, down to the bridge's middle (halfway between the valley floor and the notch, 0.31 of the
   height), up to the top of the right leg, and down it. */
const STROKE = [[0.125, 1], [0.125, 0.125], [0.5, 0.31], [0.875, 0.125], [0.875, 1]].map(([x, y]) => [vx + x * vw, vy + y * vh]);
function along(p) {   // how far along the stroke a point lies (0..1), and how far it sits off it
  let best = { d: Infinity, s: 0 }, run = 0, total = 0;
  const segs = STROKE.slice(1).map((q, k) => { const a = STROKE[k], l = Math.hypot(q[0] - a[0], q[1] - a[1]); total += l; return [a, q, l]; });
  for (const [a, q, l] of segs) {
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (q[0] - a[0]) + (p[1] - a[1]) * (q[1] - a[1])) / (l * l)));
    const d = Math.hypot(p[0] - (a[0] + t * (q[0] - a[0])), p[1] - (a[1] + t * (q[1] - a[1])));
    if (d < best.d) best = { d, s: run + t * l };
    run += l;
  }
  return { s: best.s / total, off: best.d };
}
const glintOf = ([x, y]) => Math.round(12 * Math.max(0, Math.min(1, ((x - vx) / vw + (y - vy) / vh) / 2)));

/* ---------- the board ---------- */
const squares = E.drawn.filter(d => d.within.includes('board-emblem'));
if (!squares.length) fail('board-emblem holds no squares');
const tone = toneOf(squares, E.name);
const widths = squares.map(d => styleOf(d.a)['stroke-width']).filter(Boolean);
const usual = widths.sort((a, b) => widths.filter(w => w === b).length - widths.filter(w => w === a).length)[0] || '1';
const boardM = affine(board.transform);
const placeOf = d => apply(mul(boardM, affine(d.a.transform)), d.tag === 'rect' ? [+d.a.x + d.a.width / 2, +d.a.y + d.a.height / 2] : middleOf(d.a.d));
// a square lights by its place along the stroke, a little later the farther it sits from the stroke's
// centre line, as a brush's edge does; spread over a0..a20
const lay = squares.map(d => { const { s, off } = along(placeOf(d)); return s + 0.05 * Math.min(1, off / (0.11 * vw)); });
const [lo, hi] = [Math.min(...lay), Math.max(...lay)];
// the loading screen's squares, each a <use> with its tone and its moments; the drawing's squares,
// each with an id, grouped by tone (they meet edge to edge, so their order on the board is moot)
const sqOut = squares.map((d, k) => `<use href="#emb-s${k}" class="${tone(d)} a${hi > lo ? Math.round(20 * (lay[k] - lo) / (hi - lo)) : 0} g${glintOf(placeOf(d))}"/>`);
const sqDef = squares.map((d, k) => {
  const st = styleOf(d.a), sw = st['stroke-width'] && st['stroke-width'] !== usual ? ` stroke-width="${round(st['stroke-width'])}"` : '';
  return squareEl(d, `emb-s${k}`, 2, sw);
});
const byTone = t => sqDef.filter((_, k) => tone(squares[k]) === t).join('');

/* ---------- the pieces ---------- */
const pieceIds = Object.keys(E.groups).filter(id => /^piece-(white|black)-(king|queen|rook|bishop|knight|pawn)-emblem$/.test(id));
for (const side of ['white', 'black']) for (const t of ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'])
  if (!pieceIds.includes(`piece-${side}-${t}-emblem`)) fail(`no group id="piece-${side}-${t}-emblem"`);
// set down in turn, the two sides alternating from the pawns up to the kings
const ORDER = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].flatMap(t => [`piece-white-${t}-emblem`, `piece-black-${t}-emblem`]);
const pcOut = ORDER.map((id, n) => {
  const side = id.split('-')[1], parts = E.drawn.filter(d => d.within.includes(id));
  const fills = [...new Set(parts.map(d => (styleOf(d.a).fill || '').toLowerCase()))];
  if (fills.length !== 2) fail(`${id} should have two fills, found ${fills.join(', ')}`);
  const lighter = lum(fills[0]) > lum(fills[1]) ? fills[0] : fills[1];
  const face = side === 'white' ? lighter : fills.find(f => f !== lighter);
  // the face takes the fill it inherits, the contour and marks the colour (currentColor)
  const body = parts.map(d => {
    const st = styleOf(d.a), paint = st.fill.toLowerCase() === face ? '' : ' fill="currentColor"', eo = st['fill-rule'] === 'evenodd' ? ' fill-rule="evenodd"' : '';
    if (d.tag === 'path') return `<path d="${round(d.a.d)}"${tfAttr(d.a.transform)}${paint}${eo}/>`;
    if (d.tag === 'circle') return `<circle cx="${round(d.a.cx)}" cy="${round(d.a.cy)}" r="${round(d.a.r)}"${tfAttr(d.a.transform)}${paint}/>`;
    fail(`a ${d.tag} in ${id}`);
  }).join('');
  const first = parts.find(d => d.tag === 'path') || fail(`${id} has no path`);
  const at = apply(mul(affine(E.groups[id].transform), affine(first.a.transform)), firstPoint(first.a.d));
  // in the drawing, the piece with its own transform inside a group of its side's woods (for the
  // app bar, which draws the whole emblem); the loading screen draws the piece alone, its wrapper
  // taking the animation and its <use> the side's woods
  const w = side === 'white' ? 'w' : 'b';
  return {
    def: `<g style="fill:var(--pc-${w}f);color:var(--pc-${w}l)"><g id="emb-p${n}"${tfAttr(E.groups[id].transform)}>${body}</g></g>`,
    use: `<g class="pc i${n} g${glintOf(at)}"><use href="#emb-p${n}" class="p${w}"/></g>`
  };
});
/* The drawing, in a sprite placed before the loading screen and never removed (css/layout.css
   keeps it out of the layout). Its board group reads the mortar from --emb-mortar and --emb-sw
   (no mortar unless set: the loading screen's squares take theirs from its .bd), its tone groups
   the squares' fills from --emb-d and --emb-l; a square drawn wider or narrower than the rest
   keeps its own stroke width. */
const defs = `<svg class="emb-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><g id="emb">`
  + `<g${tfAttr(board.transform)} style="stroke:var(--emb-mortar,none);stroke-width:var(--emb-sw,${round(usual)});stroke-linejoin:round;stroke-linecap:round">`
  + ['d', 'l'].map(t => byTone(t) && `<g style="fill:var(--emb-${t})">${byTone(t)}</g>`).join('') + '</g>'
  + pcOut.map(p => p.def).join('') + '</g></defs></svg>';
const emblem = `<svg class="boot-emblem" viewBox="${round(E.viewBox)}" aria-hidden="true" focusable="false">`
  + `<g class="bd"${tfAttr(board.transform)} stroke-width="${round(usual)}">${sqOut.join('')}</g>${pcOut.map(p => p.use).join('')}</svg>`;
// the app bar's mark: the whole emblem, as the M of the word (css/layout.css sizes it)
const logo = `<svg class="logo" viewBox="${round(E.viewBox)}" aria-hidden="true" focusable="false"><use href="#emb"/></svg>`;

/* ================= the arc: White's back rank over the emblem =================
   The house piece set (js/data/piece-set.js, a classic script, so it is run here rather than
   imported) as one symbol per kind, and the eight pieces in file order, a to h, each an element of
   its own: the stylesheet places them on the arc and times them by their order, and an element
   moves on the compositor where a part of an SVG would not. The set's ids are dropped, since the
   board diagrams draw the same set into the page later. */
const SET = path.resolve(setArg || path.join(ROOT, 'js', 'data', 'piece-set.js'));
const PS = (() => { try { return new Function(`${fs.readFileSync(SET, 'utf8')}\nreturn PIECE_SET;`)(); } catch (e) { fail(`${path.basename(SET)} could not be read: ${e.message}`); } })();
const RANK = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
for (const t of new Set(RANK)) if (typeof PS?.pieces?.[t] !== 'string') fail(`${path.basename(SET)} has no ${t} in its pieces`);
const side = round(String(PS.size), 1);
const symbols = [...new Set(RANK)].map(t => `<symbol id="boot-pc-${t}" viewBox="0 0 ${side} ${side}">${round(PS.pieces[t].replace(/\s+id="[^"]*"/g, '').replace(/\s+/g, ' ').replace(/> </g, '><'), 1)}</symbol>`);
const arc = `<div class="boot-arc" aria-hidden="true"><svg class="boot-arc-set" focusable="false"><defs>${symbols.join('')}</defs></svg>`
  + RANK.map(t => `<span class="boot-arc-pc"><svg viewBox="0 0 ${side} ${side}" focusable="false"><use href="#boot-pc-${t}"/></svg></span>`).join('') + '</div>';

/* ---------- into the page ---------- */
const page = fs.readFileSync(PAGE, 'utf8');
let out = page;
for (const [name, html] of [['emblem-defs', defs], ['boot-emblem', emblem], ['boot-arc', arc], ['brand-logo', logo]]) {
  const re = new RegExp(`(<!-- ${name}:start[^>]*-->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(out)) fail(`${path.basename(PAGE)} has no ${name} markers`);
  out = out.replace(re, (m, a, b) => `${a}\n${html}\n${b}`);
}
const rel = f => path.relative(process.cwd(), f);
if (out === page) { console.log(`${rel(PAGE)}: the emblem, the arc and the app bar's mark are already current`); process.exit(0); }
fs.writeFileSync(PAGE, out);
console.log(`${rel(PAGE)}: emblem drawn from ${rel(SRC)} (${squares.length} squares, ${pieceIds.length} pieces, ${defs.length.toLocaleString('en-US')} bytes), `
  + `used by the loading screen (${emblem.length.toLocaleString('en-US')} bytes) and the app bar (${logo.length.toLocaleString('en-US')} bytes); `
  + `arc from ${rel(SET)} (${RANK.length} pieces, ${arc.length.toLocaleString('en-US')} bytes)`);
