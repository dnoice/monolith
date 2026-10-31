/*
✒ Metadata
    - Title: Piece Set Builder (MONOLITH Edition - v1.1)
    - File Name: build-piece-set.mjs
    - Relative Path: tools/build-piece-set.mjs
    - Artifact Type: javascript
    - Version: 1.1.0
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — For
      Dennis's reworked drawing (chess-pieces.svg 1.3.0), which regroups the
      board: a piece is found by its kind wherever it stands (his kings now
      stand on the d-file), every group around it places it, not only its
      own transform, and tags Inkscape breaks across lines are read. With no
      path given it reads the project's own copy, assets/chess-pieces.svg,
      now that the drawing ships with MONOLITH. An Earlier entries line is
      written only when entries roll out of the output's header, and those
      are printed, to be moved to CHANGELOG.md.
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Found
      while writing tools/build-emblem.mjs: the default output path now
      comes from the script's file path through fileURLToPath. Read from the
      URL as before, it broke on Windows (/C:/… is no Windows path) and
      wherever the folder's path holds a space (%20). And the header it
      writes names the app MONOLITH, its title's version following the
      file's: a rebuild would have brought back Wizard's Chess.
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, written when Dennis finished his house piece set and asked
      for it in the Position tab: it turns his drawing into the dataset the
      board diagrams draw from.

✒ Description:
    Reads the hand-drawn house piece set (chess-pieces.svg, a full
    board of the set) and writes js/data/piece-set.js, the six pieces the
    page's board diagrams draw. One drawing per piece is taken (the
    ebony-faced set, whose ids are White's), moved onto its own square, and
    its two colours turned into the custom properties --pc-face and
    --pc-line, so the stylesheet can give either side either wood. The path
    data is copied exactly as drawn.

✒ Key Features:
    - Finds a White piece of each kind by its id, wherever the drawing
      puts it (piece-white-<kind>-<square>; of two or more, the one nearest
      the a-file), and copies it whole, nested groups included. Every
      transform that places it (its groups' as well as its own) is folded
      into one, so its square starts at 0,0.
    - Keeps every path's d, transform and fill-rule; drops what does not
      draw (stroke widths and dashes with no stroke, editor attributes).
    - Renames the copied ids from the board square to the piece
      (piece-white-king-d1-face becomes pc-k-face).
    - Records the source file's version and SHA-256 in the output, so a
      check can tell which drawing the page carries.
    - Fails loudly on a missing piece, square or colour, rather than writing
      a partial set.
    - Carries the output's version and changelog over: the same drawing
      gives the same file; a new one bumps the minor version and adds a
      [dendogg] line: the drawing is hand work, the build mechanical.
      The header keeps three entries; one that rolls out is printed, to be
      moved to CHANGELOG.md.

✒ Usage Instructions:
    Run with Node 18 or later from the project folder:
        node tools/build-piece-set.mjs
    It reads the project's copy of the drawing, assets/chess-pieces.svg
    (ChessWorkstation keeps the same drawing at docs/design/concept/), or
    the path given first; the output goes to js/data/piece-set.js unless a
    second path is given.
    Re-run it whenever the drawing changes; never edit the output by hand.

✒ Other Important Information:
    - Dependencies: Node's fs, path, crypto and url only.
    - Input contract: a group piece-white-<kind>-<square> for each of king,
      queen, rook, bishop, knight and pawn; rects square-{a1..h8}; faces
      filled #1a1a1a (ebony) and contours and marks filled #decd87
      (boxwood); transforms written as translate, scale, rotate or
      matrix.
    - Compatible platforms: any system with Node 18+.
---------
*/
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [srcArg, outArg] = process.argv.slice(2);
const src = path.resolve(srcArg || path.join(ROOT, 'assets', 'chess-pieces.svg'));   // the project's copy of the drawing
if (!fs.existsSync(src)) { console.error(`usage: node tools/build-piece-set.mjs [chess-pieces.svg] [out.js] (no ${src})`); process.exit(2); }
const OUT = path.resolve(outArg || path.join(ROOT, 'js', 'data', 'piece-set.js'));
const svg = fs.readFileSync(src, 'utf8');
const sha = crypto.createHash('sha256').update(fs.readFileSync(src)).digest('hex');
const version = (/- Version: (\S+)/.exec(svg) || [])[1] || 'unknown';
const FACE = '#1a1a1a', LINE = '#decd87';   // ebony faces, boxwood contour and marks, as drawn
const PIECES = [['k', 'king'], ['q', 'queen'], ['r', 'rook'], ['b', 'bishop'], ['n', 'knight'], ['p', 'pawn']];

/* ---------- transforms: a piece is placed by every group around it, not only its own ---------- */
// [a, b, c, d, e, f] as in SVG's matrix(); mul(m, n) applies n first
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const inv = m => { const k = m[0] * m[3] - m[1] * m[2]; return [m[3] / k, -m[1] / k, -m[2] / k, m[0] / k, (m[2] * m[5] - m[3] * m[4]) / k, (m[1] * m[4] - m[0] * m[5]) / k]; };
function parseTransform(t = '') {
  let m = [1, 0, 0, 1, 0, 0];
  for (const [, fn, args] of t.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    const n = fn === 'translate' ? [1, 0, 0, 1, v[0], v[1] || 0]
      : fn === 'scale' ? [v[0], 0, 0, v[1] ?? v[0], 0, 0]
      : fn === 'matrix' ? v
      : fn === 'rotate' ? (() => { const r = v[0] * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), [cx = 0, cy = 0] = v.slice(1); return mul(mul([1, 0, 0, 1, cx, cy], [c, sn, -sn, c, 0, 0]), [1, 0, 0, 1, -cx, -cy]); })()
      : null;
    if (!n) throw new Error(`transform ${fn}() is not handled`);
    m = mul(m, n);
  }
  return m;
}
/* For every element with an id: the transform from its own coordinates to the drawing's, through every
   group around it (its own transform included). */
const placed = {};
{
  const stack = [[1, 0, 0, 1, 0, 0]];
  for (const [tag, close, attrs, self] of [...svg.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(\/?)([\w:]+)\b([^>]*?)(\/?)>/g)].map(m => [m[2], !!m[1], m[3], !!m[4]])) {
    if (close) { if (tag === 'g') stack.pop(); continue; }
    const own = mul(stack[stack.length - 1], parseTransform((/\stransform="([^"]*)"/.exec(attrs) || [])[1]));
    const id = (/\sid="([^"]*)"/.exec(attrs) || [])[1];
    if (id) placed[id] = own;
    if (tag === 'g' && !self) stack.push(own);
  }
}
const num = v => +v.toFixed(6);

/* The whole <g id="…"> element, nested groups included. */
function groupOf(id) {
  const at = svg.search(new RegExp(`<g\\s+id="${id}"`));   // Inkscape may break the tag across lines
  if (at < 0) throw new Error(`no group ${id} in ${src}`);
  let depth = 0;
  for (const m of svg.slice(at).matchAll(/<g\b[^>]*>|<\/g>/g)) {
    if (m[0] === '</g>') depth--; else if (!m[0].endsWith('/>')) depth++;
    if (depth === 0) return svg.slice(at, at + m.index + m[0].length);
  }
  throw new Error(`unclosed group ${id}`);
}
function squareOf(sq) {
  const m = new RegExp(`<rect\\s+id="square-${sq}"[^>]*?\\sx="([-\\d.e]+)"[^>]*?\\sy="([-\\d.e]+)"[^>]*?\\swidth="([-\\d.e]+)"`).exec(svg);
  if (!m) throw new Error(`no square ${sq}`);
  return { x: +m[1], y: +m[2], size: +m[3] };
}
/* One style attribute reduced to what draws: the fill (as a custom property) and its rule. */
function style(st, where) {
  const props = Object.fromEntries(st.split(';').map(p => p.split(':').map(x => x.trim())).filter(p => p[0]));
  const fill = (props.fill || '').toLowerCase();
  const v = fill === FACE ? 'var(--pc-face)' : fill === LINE ? 'var(--pc-line)' : null;
  if (!v) throw new Error(`${where}: fill ${fill || '(none)'} is neither ${FACE} nor ${LINE}`);
  return `fill:${v}${props['fill-rule'] ? `;fill-rule:${props['fill-rule']}` : ''}`;
}
const pieces = {};
let size = 0;
for (const [t, name] of PIECES) {
  // a White piece of that kind, wherever the drawing has it (the id names its square): the one
  // nearest the a-file, as a rook a1, a knight b1, a bishop c1 and a pawn a2 are in the start position
  const found = Object.keys(placed).filter(k => new RegExp(`^piece-white-${name}-[a-h][1-8]$`).test(k)).sort();
  if (!found.length) throw new Error(`no group piece-white-${name}-<square> in ${src}`);
  const id = found[0], sq = id.slice(-2), g = groupOf(id), s = squareOf(sq);
  size = size || s.size;
  const open = /^<g\b[^>]*>/.exec(g)[0], inner = g.slice(open.length, -'</g>'.length);
  /* Into the square's own frame: every transform from the piece to the drawing, undone for the square
     (whose groups may move it too), then the square's corner to 0,0. */
  const m = mul([1, 0, 0, 1, -s.x, -s.y], mul(inv(placed[`square-${sq}`]), placed[id])).map(num);
  const tf = m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 ? `translate(${m[4]} ${m[5]})` : `matrix(${m.join(' ')})`;
  let body = inner
    .replace(/\s(?:inkscape|sodipodi):[\w-]+="[^"]*"/g, '')
    .replace(/\sstyle="([^"]*)"/g, (_, st) => ` style="${style(st, id)}"`)
    .replace(new RegExp(`id="${id}`, 'g'), `id="pc-${t}`);
  if (/<(?!\/?(?:g|path|circle|ellipse|rect|polygon)\b)/.test(body)) throw new Error(`${id}: unexpected element`);
  pieces[t] = `<g transform="${tf}">${body}</g>`;
}
/* The header's version and changelog carry over from the last build: the same drawing writes the
   same file, a new drawing bumps the minor version and adds a line (at most three in the header,
   the rest in CHANGELOG.md, as the page's shipped files do). */
const today = new Date(), pad = n => String(n).padStart(2, '0');
let date = `${pad(today.getMonth() + 1)}/${pad(today.getDate())}/${today.getFullYear()}`;
let long = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const wrap = (text, first = '    - ', rest = '      ') => { const out = []; let line = first; for (const w of text.split(' ')) { if ((line + w).length > 76 && line.trim()) { out.push(line.trimEnd()); line = rest; } line += w + ' '; } out.push(line.trimEnd()); return out.join('\n'); };
let fileVersion = '1.0.0';
let entries = wrap(`1.0.0 (${date}) [dendogg + Anthropic - Claude Opus 5.5] — First release: Dennis's house piece set, which he finished drawing and asked to see in the Position tab, as the board diagrams' pieces.`);
if (fs.existsSync(OUT)) {
  const prev = fs.readFileSync(OUT, 'utf8');
  const pv = (/- Version: (\S+)/.exec(prev) || [])[1], ps = (/sha256: "([0-9a-f]+)"/.exec(prev) || [])[1];
  const pe = (/✒ Changelog:\n([\s\S]*?)\n\n✒ Description:/.exec(prev) || [])[1];
  if (pv && pe) {
    if (ps === sha) { fileVersion = pv; entries = pe; date = (/- Date: (\S+)/.exec(prev) || [])[1] || date; long = (/- Update: (.+)/.exec(prev) || [])[1] || long; }
    else {
      const [M, m] = pv.split('.').map(Number); fileVersion = `${M}.${m + 1}.0`;
      const all = pe.split(/\n(?=    - \d)/).filter(e => /^    - \d/.test(e)).map(e => e.replace(/\n    Earlier entries:[^\n]*$/, ''));
      const kept = all.slice(0, 2), dropped = all.slice(2), earlier = /\n    Earlier entries:/.test(pe);
      entries = [wrap(`${fileVersion} (${date}) [dendogg] — Rebuilt from chess-pieces.svg ${version}, Dennis's latest drawing.`), ...kept].join('\n')
        + (dropped.length || earlier ? '\n    Earlier entries: see CHANGELOG.md (moved entries)' : '');
      // the header keeps three entries; what rolls out belongs in CHANGELOG.md, word for word
      if (dropped.length) console.warn(`move to CHANGELOG.md, under js/data/piece-set.js:\n${dropped.join('\n')}`);
    }
  }
}
const header = `/*
✒ Metadata
    - Title: House Piece Set (MONOLITH Edition - v${fileVersion.split('.').slice(0, 2).join('.')})
    - File Name: piece-set.js
    - Relative Path: js/data/piece-set.js
    - Artifact Type: data
    - Version: ${fileVersion}
    - Date: ${date}
    - Update: ${long}
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
${entries}

✒ Description:
    The hand-drawn house piece set (king, queen, rook, bishop, knight,
    pawn) as SVG markup, one piece per square of ${size} units, for the
    board diagrams (js/ui/diagram.js). Generated from the drawing; the path
    data is the drawing's, exactly as drawn.

✒ Key Features:
    - PIECE_SET.pieces: k, q, r, b, n, p, each a <g> that fills a square
      of PIECE_SET.size units from 0,0.
    - Two colours as custom properties: --pc-face (the flat faces) and
      --pc-line (the contour and the marks inside a face). The stylesheet
      sets them per side and per world (css/position.css).
    - PIECE_SET.source: the drawing's file, version and SHA-256.

✒ Usage Instructions:
    A plain script, loaded by the page before the modules; it defines the
    global PIECE_SET and, under Node, exports it. Do not edit it by hand:
    change the drawing (assets/chess-pieces.svg) and run
        node tools/build-piece-set.mjs

✒ Other Important Information:
    - Source: assets/chess-pieces.svg ${version}, the set's drawing (the same
      drawing as ChessWorkstation's docs/design/concept/chess-pieces.svg);
      SHA-256 ${sha}.
    - The drawing's ebony-faced set (ranks 1 and 2) is the one copied; in
      the page, White takes boxwood faces and Black ebony ones.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari.
---------
*/
`;
const body = `const PIECE_SET = {
  source: { file: 'chess-pieces.svg', version: ${JSON.stringify(version)}, sha256: ${JSON.stringify(sha)} },
  size: ${size},
  pieces: {
${PIECES.map(([t]) => `    ${t}: ${JSON.stringify(pieces[t])}`).join(',\n')}
  }
};
if (typeof module !== 'undefined') module.exports = PIECE_SET;
`;
fs.writeFileSync(OUT, header + body);
console.log(`wrote ${OUT}: ${PIECES.length} pieces from ${path.basename(src)} ${version}, ${(header.length + body.length) / 1000 | 0} kB`);
