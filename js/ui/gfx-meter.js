/*
✒ Metadata
    - Title: Graphics Meter (MONOLITH Edition - v1.1)
    - File Name: gfx-meter.js
    - Relative Path: js/ui/gfx-meter.js
    - Artifact Type: javascript
    - Version: 1.1.0
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Built to
      Dennis's meter drawing, version 1.2 (graphics-meter-design--v1.2.svg):
      the cells meet edge to edge on a dial a little more than a half
      circle, the end cells cut flat by the base line; each panel is inset
      evenly and narrowly; and the needle is one shape with the hub ring,
      raised off the base, turning about the hub with the pawn in its eye.
      The ribbon is gone.
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — In the
      release audit: a saved level this browser cannot run shows under the
      dial with what it needs, WebGL 2 or the post-processing scripts.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The graphics level chooser in Settings, after the meter drawing (version
    1.2): a dial a little more than a half circle with five cells, one per
    level from Minimal (left) to Ultra (right), each carrying a piece of the
    house set in back-rank order (the rook, knight, bishop, queen and king
    of the a- to e-files), turned to face out, with the level's name along
    the rim. The needle, drawn as one shape with the hub ring and holding
    the pawn in its eye, points at the level in use and swings to a new one.
    For Custom settings it points between the levels, at a rough estimate of
    what the settings cost. A line under the dial names the level and how it
    was chosen.

✒ Key Features:
    - Five real buttons (role radio), one per cell, each sized to its cell
      and drawing it; only the cell's own shape takes the pointer, so
      neighbouring cells never steal a click, and the focus ring follows
      the shape.
    - The geometry is the drawing's, scaled into a 320-wide box with room
      for the names: concentric arcs; five cells meeting edge to edge, three
      of 38.9° across the top and the two ends cut flat by the base line
      below the centre; a panel inset evenly in each.
    - The needle turns about the hub's centre, which sits above the dial's,
      so each level's angle is worked out from the hub to the middle of its
      cell.
    - The chosen cell shows its piece in the set's woods (boxwood face,
      ebony line); the rest show it in the panel's own tones.
    - The needle eases to its level with a small overshoot, or jumps when
      motion is reduced or animation is set to Minimal.
    - Automatic is marked on the hub's face and in the line under the dial.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/ui/panels.js
    builds it in its init() (buildMeter) and redraws it with Settings
    (renderMeter); js/ui/splitters.js wires its buttons with the rest of
    Settings → Graphics ([data-quality]). For example:
        import { buildMeter, renderMeter } from '../ui/gfx-meter.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js, scene/renderer.js,
      scene/quality.js and ui/diagram.js; globals PIECE_SET
      (js/data/piece-set.js), through diagram.js.
    - Styling: css/layout.css (the gfx-meter rules).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s); ES modules do not load from file://.
---------
*/
import { $, prefs, reduceMotion } from '../app/base.js';
import { POST_OK } from '../scene/renderer.js';
import { GFX_LEVELS, meterPosition, needs, quality } from '../scene/quality.js';
import { pieceUse } from './diagram.js';

/* ---------- geometry ----------
   The meter, version 1.2 of its drawing (10/24/2026): a dial a little more than a half circle,
   its two end cells cut flat by the base line below the centre; five cells meeting edge to edge
   (three of 38.9° across the top, the ends to the base), each a frame with a panel inset evenly
   and a piece of the set turned to face out; and a needle that is one shape with the hub, a ring
   drawn to a point, raised off the base, with the pawn in its eye. Its proportions, scaled into a
   320-wide box that keeps room for the level names on an arc just outside the band. */
const NS = 'http://www.w3.org/2000/svg';
const K = 141 / 153.32;                  // the drawing's outer radius to this box's
const G = {
  w: 320, h: 180, cx: 160, cy: 158, R: 141, r: 85.94 * K, inset: 3.8 * K, drop: 10.9 * K, label: 149, piece: 40.8,
  hub: { dy: -16.65 * K, ro: 32.05 * K, ri: 23.4 * K, len: 66.6 * K, half: 20.3 * Math.PI / 180, pawn: 40.8 }
};
const LEVELS = ['minimal', 'low', 'medium', 'high', 'ultra'];
const PIECES = ['r', 'n', 'b', 'q', 'k'];          // the back rank, a- to e-file
const DEG = Math.PI / 180;
// the cells' radial edges, as angles from the +x axis (left to right); the ends are cut by the base line
const EDGES = [148.4, 109.45, 70.55, 31.6].map(d => d * DEG);
const f = n => +n.toFixed(2);
const pt = (a, rho) => [G.cx + rho * Math.cos(a), G.cy - rho * Math.sin(a)];
const H = [G.cx, G.cy + G.hub.dy];        // the hub's centre, raised off the dial's
/* The angle where a circle of radius rho meets the base line, lifted by pad (the left end's, or the
   right's), so the end cells stop at the base as drawn. */
const baseAngle = (rho, pad, left) => { const a = Math.asin((G.drop - pad) / rho); return left ? Math.PI + a : -a; };
/* Cell i's outline between radii ri and ro, inset by pad: edges facing a neighbour are pulled in by
   pad, the ends stop pad above the base line. */
function span(i, rho, pad) {
  const a0 = i === 0 ? baseAngle(rho, pad, true) : EDGES[i - 1] - pad / rho;
  const a1 = i === 4 ? baseAngle(rho, pad, false) : EDGES[i] + pad / rho;
  return [a0, a1];
}
function cell(i, ri, ro, pad) {
  const [o0, o1] = span(i, ro, pad), [i0, i1] = span(i, ri, pad);
  const A = pt(o0, ro), B = pt(o1, ro), C = pt(i1, ri), D = pt(i0, ri);
  return { d: `M${f(A[0])} ${f(A[1])}A${f(ro)} ${f(ro)} 0 0 1 ${f(B[0])} ${f(B[1])}L${f(C[0])} ${f(C[1])}A${f(ri)} ${f(ri)} 0 0 0 ${f(D[0])} ${f(D[1])}Z` };
}
/* The middle of a cell's span, where its piece stands and its name is centred. */
const centreAngle = i => { const [a0, a1] = span(i, (G.R + G.r) / 2, 0); return (a0 + a1) / 2; };
/* The needle's turn for each level: from the hub's centre to the middle of the cell, in degrees
   from straight up. Custom settings fall between two of these. */
const AIM = LEVELS.map((_, i) => { const [x, y] = pt(centreAngle(i), (G.R + G.r) / 2); return Math.atan2(x - H[0], H[1] - y) / DEG; });
/* The box around a cell and its name (sampled along both arcs), for the button that holds it. */
function box(i) {
  const xs = [], ys = [];
  for (const rho of [G.r, G.label + 9]) { const [a0, a1] = span(i, rho, 0); for (let k = 0; k <= 12; k++) { const p = pt(a0 + (a1 - a0) * k / 12, rho); xs.push(p[0]); ys.push(p[1]); } }
  const x = Math.max(0, Math.min(...xs) - 2), y = Math.max(0, Math.min(...ys) - 2), X = Math.min(G.w, Math.max(...xs) + 2), Y = Math.min(G.h, Math.max(...ys) + 1);
  return { x: f(x), y: f(y), w: f(X - x), h: f(Y - y) };
}
const el = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
/* A piece of the house set, size s, centred at (x, y), turned by deg. */
function piece(t, x, y, s, deg, cls) {
  const g = el('g', { class: cls, transform: `rotate(${f(deg)} ${f(x)} ${f(y)})` });
  g.appendChild(pieceUse(t, f(x - s / 2), f(y - s / 2), s));
  return g;
}
/* The needle and its hub as one shape, pointing straight up: a ring around the hub's centre drawn
   out to a point, with the eye cut out (even-odd), as in the drawing. */
function needlePath() {
  const { ro, ri, len, half } = G.hub, [hx, hy] = H;
  const P1 = [hx - ro * Math.sin(half), hy - ro * Math.cos(half)], P2 = [hx + ro * Math.sin(half), hy - ro * Math.cos(half)];
  return `M${f(hx)} ${f(hy - len)}L${f(P1[0])} ${f(P1[1])}A${f(ro)} ${f(ro)} 0 1 0 ${f(P2[0])} ${f(P2[1])}Z`
    + `M${f(hx)} ${f(hy - ri)}A${f(ri)} ${f(ri)} 0 1 0 ${f(hx)} ${f(hy + ri)}A${f(ri)} ${f(ri)} 0 1 0 ${f(hx)} ${f(hy - ri)}Z`;
}

let meter, needle, readLevel, readMode; // set in buildMeter()
/* Builds the dial into #gfx-meter: a button per level (the ones splitters.js wires by
   data-quality), then the needle and hub on top, which take no pointer. */
export function buildMeter() {
  meter = $('#gfx-meter'); readLevel = $('#gfx-read-level'); readMode = $('#gfx-read-mode');
  meter.style.setProperty('--gm-ratio', `${G.w} / ${G.h}`);
  LEVELS.forEach((k, i) => {
    const b = box(i), btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'gfx-cell'; btn.dataset.quality = k;
    btn.setAttribute('role', 'radio'); btn.setAttribute('aria-label', GFX_LEVELS[k].label);
    Object.assign(btn.style, { left: `${f(b.x / G.w * 100)}%`, top: `${f(b.y / G.h * 100)}%`, width: `${f(b.w / G.w * 100)}%`, height: `${f(b.h / G.h * 100)}%` });
    const svg = el('svg', { viewBox: `${b.x} ${b.y} ${b.w} ${b.h}`, 'aria-hidden': 'true', focusable: 'false' });
    const a = centreAngle(i), mid = (G.R + G.r) / 2, [px, py] = pt(a, mid), id = `gfx-arc-${k}`;
    const [l0, l1] = span(i, G.label, 0), L0 = pt(l0 - 0.02, G.label), L1 = pt(l1 + 0.02, G.label);
    const defs = el('defs'); defs.appendChild(el('path', { id, d: `M${f(L0[0])} ${f(L0[1])}A${G.label} ${G.label} 0 0 1 ${f(L1[0])} ${f(L1[1])}` }));
    svg.appendChild(defs);
    svg.appendChild(el('path', { class: 'gfx-hit', d: cell(i, G.r, G.label + 9, 0).d }));       // the cell and its name take the pointer
    svg.appendChild(el('path', { class: 'gfx-frame', d: cell(i, G.r, G.R, 0).d }));
    svg.appendChild(el('path', { class: 'gfx-panel', d: cell(i, G.r, G.R, G.inset).d }));
    svg.appendChild(piece(PIECES[i], px, py, G.piece, 90 - a * 180 / Math.PI, 'gfx-piece'));
    const text = el('text', { class: 'gfx-label' }), tp = el('textPath', { href: `#${id}`, startOffset: '50%', 'text-anchor': 'middle' });
    tp.textContent = GFX_LEVELS[k].label.toUpperCase(); text.appendChild(tp); svg.appendChild(text);
    btn.appendChild(svg); meter.appendChild(btn);
  });
  // the needle with its hub ring (drawn pointing straight up, turned about the hub by renderMeter),
  // then the hub's face in its eye and the pawn, which stay still
  const dial = el('svg', { class: 'gfx-dial', viewBox: `0 0 ${G.w} ${G.h}`, 'aria-hidden': 'true', focusable: 'false' });
  needle = el('g', { class: 'gfx-needle' });
  needle.style.transformOrigin = `${f(H[0])}px ${f(H[1])}px`;
  needle.appendChild(el('path', { d: needlePath(), 'fill-rule': 'evenodd' }));
  dial.appendChild(needle);
  dial.appendChild(el('circle', { class: 'gfx-hub-face', cx: f(H[0]), cy: f(H[1]), r: f(G.hub.ri) }));
  dial.appendChild(piece('p', H[0], H[1] - 1.5 * K, G.hub.pawn, 0, 'gfx-pawn'));
  meter.appendChild(dial);
}
/* The needle on the level in use (between levels for Custom), the hub marked when Automatic
   chose it, and the line under the dial. */
export function renderMeter() {
  if (!meter) return;
  const T = quality.T, t = meterPosition(), auto = prefs.quality === 'auto';
  const lo = Math.max(0, Math.min(3, Math.floor(t)));
  needle.style.transform = `rotate(${f(AIM[lo] + (AIM[lo + 1] - AIM[lo]) * (t - lo))}deg)`;
  meter.dataset.auto = String(auto); meter.dataset.custom = String(T.key === 'custom');
  meter.dataset.motion = reduceMotion || prefs.speed === 'minimal' ? 'off' : 'on';
  const near = GFX_LEVELS[LEVELS[Math.round(t)]].label;
  const kept = GFX_LEVELS[prefs.quality] && GFX_LEVELS[prefs.quality].set.hdr && !POST_OK ? GFX_LEVELS[prefs.quality].label : '';
  const level = T.key === 'custom' ? 'Custom' : T.label;
  const mode = T.key === 'custom' ? `about as demanding as ${near}` : auto ? 'Automatic' : kept ? `${kept} needs ${needs()}` : 'chosen by hand';
  if (readLevel.textContent !== level) readLevel.textContent = level;
  if (readMode.textContent !== mode) readMode.textContent = mode;
}
