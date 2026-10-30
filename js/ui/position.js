/*
✒ Metadata
    - Title: Position (MONOLITH Edition - v2.1)
    - File Name: position.js
    - Relative Path: js/ui/position.js
    - Artifact Type: javascript
    - Version: 2.1.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 2.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 2.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a study's page opens at its top and
      Back returns to the grid where it was, on phones too; the focus stays
      on a FEN field's chip; Copy FEN without the clipboard API copies
      through a field of its own instead of overwriting the FEN box; the
      phase is a labelled group whose term link can be reached, and a row
      that lights squares holds no link inside it; a solved date is written
      as text. renderStudies(), which nothing used, is gone.
    - 2.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The tab
      redesigned after Dennis found it awkward, "a stack of text blocks":
      three views (Studies, Read, Set up) behind one switch that follows
      what you do; studies as diagram cards with progress rings and an Up
      next pick; the board read as bars, piece rows and a structure map;
      a click-to-place board editor tied both ways to a colour-coded FEN.
      The study engine moved to js/ui/studies.js; the FEN wiring came here
      from js/ui/controls.js and js/ui/panels.js.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The Position tab as a place to learn, in three views. Studies: the
    study in progress with a picture of its goal (the moves to find, the
    par, the pawn's road, the moves to hold), the next study to play, and
    the library as cards with their positions. Read: the board you see,
    drawn: whose move and how many moves each side has, the material, the
    phase, a structure map, and the rules state. Set up: a board to build
    a position on, its FEN coloured field by field, and Play.

✒ Key Features:
    - One switch for the three views, remembered (prefs.posView). A study
      that starts opens Studies; Open in Set up, Edit in Set up and the
      palette's :fen open Set up. Badges say when a study runs, when the
      board is in check or over, and when the set-up is edited.
    - Studies: Up next (the first unsolved study, level 1 first, in the
      category shown), category tiles with progress rings, cards with
      diagrams, a detail view with a large diagram and a pager.
    - The Study card draws its goal: a step track for puzzles, a par bar
      for mates, a rank track for queening, a meter for holds; hint dots.
    - Read: everything with squares lights them on the 3D board and on
      the structure map while you point at it, and stays lit on a click.
    - Set up: move, erase or place pieces by click, keyboard or piece
      letter; side to move, castling and en passant derived from the board;
      the FEN box and the board edit each other; fields explained.
    - readBoard() and fenAnatomy(): the facts behind the visuals, kept as
      plain data (the test build reads them).

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 22 of 26. Other modules import from it,
    for example:
        import { insight, setPosView } from '../ui/position.js';
        setPosView('setup');

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/board.js,
      app/state.js, ui/snackbar.js, game/board-ui.js, game/play.js,
      game/flow.js, coach/coach.js, coach/book.js, ui/crucible-board.js,
      ui/grimoire.js, ui/diagram.js and ui/studies.js; globals Chess
      (js/core/chess.js) and STUDIES (js/data/studies.js).
    - Shared state (js/app/store.js): sets app.fenSel and app.fenDirty;
      reads app.view, app.started, app.busy and app.orient.
    - Saved state: prefs.posView ('studies', 'read' or 'setup').
    - Styling: css/position.css.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, panelScroller, prefs, reduceMotion, savePrefs } from '../app/base.js';
import { PIECE_NAMES } from '../scene/board.js';
import { cur, draft, game, match, onRender, render } from '../app/state.js';
import { snack } from './snackbar.js';
import { engine } from '../game/engine.js';
import { boardState, showHighlights } from '../game/board-ui.js';
import { repetitions } from '../game/play.js';
import { explore, startGame } from '../game/flow.js';
import { isPassed, phaseOf } from '../coach/coach.js';
import { bookAt, openingOf } from '../coach/book.js';
import { boardOverride } from './crucible-board.js';
import { grById, termify } from './grimoire.js';
import { setTab } from './nav.js';
import { describeBoard, diagram, pieceIcon } from './diagram.js';
import {
  NUM_WORD, SIDE_NAME, STUDY_CAT, study, studyById, studyEnd, studyHint, studyLineSan, studyMyMoves,
  studyNext, studyProgress, studyReveal, studySolved, studyStart, studyText, studyUpNext
} from './studies.js';

/* ---------- Position: three views behind one switch ----------
   Dennis's request (10/23/2026): the tab felt awkward, a stack of text blocks; make the workflow
   intuitive and smart, with stronger visuals. So the tab has three views, one at a time:
   - Studies: the study you are playing, what to play next, and the library, as pictures.
   - Read: the board you see, drawn as bars, pieces and a map; anything with squares lights them
     on the 3D board while you point at it, and keeps them lit on a click.
   - Set up: a board you build on by clicking, tied both ways to its FEN, and Play.
   The switch follows the work: a study that starts opens Studies, "Open in Set up" and the
   palette's :fen open Set up. Everything else stays where the player left it. */
const VIEWS = ['studies', 'read', 'setup'];
export const pos = { view: 'studies', gen: 0, libKey: '', gridScroll: 0 };
const NS = 'http://www.w3.org/2000/svg';
function h(tag, cls = '', text = '') { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== '') e.textContent = text; return e; }
function svgEl(tag, attrs = {}) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; }
const plural = (n, one, many = one + 's') => `${n === 1 ? 'one' : NUM_WORD[n] || n} ${n === 1 ? one : many}`;
const boardOf = fen => { const r = Chess.parseFen(fen); return r.state ? r.state.board : new Array(64).fill(null); };

export function setPosView(v, { silent = false, focus = false } = {}) {
  if (!VIEWS.includes(v)) return;
  pos.view = v; if (prefs.posView !== v) { prefs.posView = v; savePrefs(); }
  for (const b of document.querySelectorAll('#pos-switch [role="tab"]')) { const on = b.dataset.pv === v; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
  for (const id of VIEWS) $(`#pos-${id}-view`).hidden = id !== v;
  if (v !== 'read' && insight.squares.length) { insight.squares = []; if (!silent) showHighlights(); }
  if (focus) $(`#pv-${v}`).focus();
  if (!silent) render();
}
/* The badges on the switch: a study running, the board in check or over, the set-up edited. */
function renderSwitch() {
  const c = study.cur, sb = $('#pv-studies-badge'); sb.hidden = !(c && c.state === 'playing'); sb.className = 'pv-badge live';
  const st = boardState(), s = Chess.status(st), rb = $('#pv-read-badge'), over = s.over || s.check;
  rb.hidden = !over; rb.className = 'pv-badge ' + (s.mate || s.check ? 'alert' : 'draw');
  rb.title = s.mate ? 'Checkmate' : s.check ? 'Check' : s.over ? 'The game is drawn' : '';
  const eb = $('#pv-setup-badge'); eb.hidden = !app.fenDirty; eb.className = 'pv-badge edited'; eb.title = app.fenDirty ? 'Edited, not played' : '';
}

/* =====================================================================================
   Read: the board you see
   ===================================================================================== */
export const insight = { squares: [], pin: null, key: '', fen: '' };
function piecesWords(counts) {
  const parts = [];
  for (const t of ['q', 'r', 'b', 'n', 'p']) { const n = counts[t] || 0; if (n) parts.push(n === 1 ? `a ${PIECE_NAMES[t]}` : `${NUM_WORD[n] || n} ${PIECE_NAMES[t]}s`); }
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] || '';
}
/* The board's facts as rows { id, term, label, value, small, squares, alert, none, … }, with the
   extra values each visual needs (counts, sides, files, rights). */
export function readBoard(st, idx) {
  const rules = [], struct = [], legal = Chess.allLegal(st), status = Chess.status(st), me = st.turn, them = Chess.other(me);
  const kingOf = c => Chess.kingSq(st.board, c), all = f => { const o = []; for (let s = 0; s < 64; s++) if (f(s, st.board[s])) o.push(s); return o; };
  const targets = [...new Set(legal.map(m => m.to))], nLegal = legal.reduce((a, m) => a + (m.needsPromo ? 4 : 1), 0);
  rules.push({ id: 'side-to-move', term: 'side-to-move', label: 'To move', value: SIDE_NAME(me) + (status.check && !status.mate ? ', in check' : ''), alert: status.check, squares: [kingOf(me)] });
  rules.push({ id: 'legal-move', term: 'legal-move', label: 'Legal moves', value: status.mate ? 'none: checkmate' : status.stale ? 'none: stalemate' : String(nLegal), small: nLegal ? `onto ${targets.length} square${targets.length === 1 ? '' : 's'}` : '', alert: status.mate, squares: targets, n: nLegal });
  // the other side's moves if it were its turn; meaningless while the side to move is in check
  let opp = null;
  if (!status.check && !status.over) { const L = Chess.allLegal({ ...st, turn: them, ep: -1 }); opp = { n: L.reduce((a, m) => a + (m.needsPromo ? 4 : 1), 0), squares: [...new Set(L.map(m => m.to))] }; }
  const rights = c => [c + 'K', c + 'Q'].filter(k => st.castling[k]).map(k => k[1] === 'K' ? 'O-O' : 'O-O-O');
  const now = legal.filter(m => m.castle).map(m => m.castle === 'K' ? 'O-O' : 'O-O-O'), csq = [];
  for (const k of ['wK', 'wQ', 'bK', 'bQ']) if (st.castling[k]) { const home = k[0] === 'w' ? 0 : 56; csq.push(home + 4, home + (k[1] === 'K' ? 7 : 0)); }
  const rightsOf = c => rights(c).join(', ') || 'none';
  rules.push({ id: 'castling', term: 'castling', label: 'Castling', value: `White ${rightsOf('w')} · Black ${rightsOf('b')}`, small: now.length ? `${now.join(' and ')} legal now` : rights(me).length ? 'not legal this move' : '', none: !csq.length, squares: [...new Set(csq)], rights: { ...st.castling }, now });
  const epMoves = legal.filter(m => m.ep);
  rules.push({ id: 'en-passant', term: 'en-passant', label: 'En passant', value: st.ep < 0 ? 'none' : Chess.sqName(st.ep), small: st.ep < 0 ? '' : epMoves.length ? 'a capture there is legal now' : 'no pawn can take there', none: st.ep < 0, squares: st.ep < 0 ? [] : [st.ep, ...epMoves.map(m => m.from)], can: epMoves.length > 0 });
  rules.push({ id: 'fifty-move-rule', term: 'fifty-move-rule', label: 'Fifty-move count', value: `${st.halfmove} of 100 plies`, small: st.halfmove >= 80 ? `${Math.ceil((100 - st.halfmove) / 2)} moves left` : '', alert: st.halfmove >= 80, n: st.halfmove });
  if (idx >= 0) { const n = repetitions(idx); if (n >= 2) rules.push({ id: 'threefold-repetition', term: 'threefold-repetition', label: 'Repetition', value: n >= 3 ? 'three times: a draw' : 'seen twice', small: n === 2 ? 'a third time is a draw' : '', alert: true, n }); }
  const ph = phaseOf(st);
  struct.push({ id: 'phase', term: ph, label: 'Phase', value: { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' }[ph], ph });
  const M = Chess.material(st.board), worth = c => Object.entries(M[c]).reduce((a, [t, n]) => a + (Chess.VAL[t] || 0) * n, 0), d = worth('w') - worth('b');
  const extra = c => { const o = Chess.other(c), out = {}; for (const t of ['q', 'r', 'b', 'n', 'p']) { const k = (M[c][t] || 0) - (M[o][t] || 0); if (k > 0) out[t] = k; } return out; };
  const ew = piecesWords(extra('w')), eb = piecesWords(extra('b'));
  struct.push({ id: 'material-balance', term: 'material-balance', label: 'Material', value: d === 0 ? `level, ${worth('w')} each` : `${SIDE_NAME(d > 0 ? 'w' : 'b')} +${Math.abs(d)}`, small: ew && eb ? `White's ${ew} against Black's ${eb}` : ew ? `White has ${ew} more` : eb ? `Black has ${eb} more` : 'the same pieces', M, worth: { w: worth('w'), b: worth('b') }, d, extra: { w: extra('w'), b: extra('b') } });
  const pawnsOf = c => all((s, p) => p && p.t === 'p' && p.c === c), P = { w: pawnsOf('w'), b: pawnsOf('b') };
  const F = {}; for (const c of ['w', 'b']) { F[c] = new Array(8).fill(0); for (const s of P[c]) F[c][s & 7]++; }
  const byPawn = (fn, id, label, kind) => {
    const sel = { w: P.w.filter(s => fn(s, 'w')), b: P.b.filter(s => fn(s, 'b')) }, text = ['w', 'b'].filter(c => sel[c].length).map(c => `${SIDE_NAME(c)} ${sel[c].map(Chess.sqName).join(' ')}`).join(' · ');
    struct.push({ id, term: id, label, value: text || 'none', none: !text, squares: [...sel.w, ...sel.b], kind, count: sel.w.length + sel.b.length, w: sel.w, b: sel.b });
  };
  byPawn((s, c) => isPassed(st.board, s, c), 'passed-pawn', 'Passed pawns', 'passed');
  byPawn((s, c) => { const f = s & 7; return !(f > 0 && F[c][f - 1]) && !(f < 7 && F[c][f + 1]); }, 'isolated-pawn', 'Isolated pawns', 'isolated');
  byPawn((s, c) => F[c][s & 7] > 1, 'doubled-pawns', 'Doubled pawns', 'doubled');
  const FILES = 'abcdefgh', ALLF = [0, 1, 2, 3, 4, 5, 6, 7], open = ALLF.filter(f => !F.w[f] && !F.b[f]);
  const halfF = c => ALLF.filter(f => !F[c][f] && F[Chess.other(c)][f]), half = c => halfF(c).map(f => FILES[f]);
  const halfText = ['w', 'b'].filter(c => half(c).length).map(c => `${SIDE_NAME(c)} ${half(c).join(', ')}`).join(' · ');
  const closed = ALLF.filter(f => !open.includes(f)).map(f => FILES[f]);
  const openText = !open.length ? 'none' : open.length === 8 ? 'every file' : open.length >= 5 ? `every file but ${closed.join(', ')}` : open.map(f => `${FILES[f]}-file`).join(', ');
  struct.push({ id: 'open-file', term: 'open-file', label: 'Open files', value: openText, small: halfText ? `half-open: ${halfText}` : '', none: !open.length && !halfText, squares: open.flatMap(f => ALLF.map(r => r * 8 + f)), kind: 'open', count: open.length, open, half: { w: halfF('w'), b: halfF('b') } });
  const bishops = c => all((s, p) => p && p.t === 'b' && p.c === c), shade = s => ((s >> 3) + (s & 7)) & 1, B = { w: bishops('w'), b: bishops('b') };
  const pair = c => B[c].length >= 2 && new Set(B[c].map(shade)).size === 2;
  const oppo = B.w.length === 1 && B.b.length === 1 && shade(B.w[0]) !== shade(B.b[0]);
  struct.push({ id: 'bishop-pair', term: 'bishop-pair', label: 'Bishops', value: pair('w') && pair('b') ? 'both sides have the pair' : pair('w') ? 'White has the pair' : pair('b') ? 'Black has the pair' : oppo ? 'one each, on opposite colours' : B.w.length + B.b.length ? `White ${B.w.length}, Black ${B.b.length}` : 'none', small: oppo ? 'they never meet: endings with them lean to a draw' : '', none: !B.w.length && !B.b.length, squares: [...B.w, ...B.b], kind: 'bishop', count: B.w.length + B.b.length, pair: { w: pair('w'), b: pair('b') } });
  const shield = c => { const k = kingOf(c), f = k & 7, r = k >> 3, dir = c === 'w' ? 1 : -1; return P[c].filter(s => Math.abs((s & 7) - f) <= 1 && ((s >> 3) - r) * dir >= 1 && ((s >> 3) - r) * dir <= 2); };
  // in the endgame the king is a fighting piece, so its shelter is no longer the point
  const kingText = c => { const n = shield(c).length; return `${SIDE_NAME(c)} ${Chess.sqName(kingOf(c))}${ph === 'endgame' ? '' : `, ${NUM_WORD[n]} pawn${n === 1 ? '' : 's'} in front`}`; };
  struct.push({ id: 'king-safety', term: 'king-safety', label: 'Kings', value: `${kingText('w')} · ${kingText('b')}`, small: ph === 'endgame' ? 'in the endgame the kings come forward' : '', squares: ph === 'endgame' ? [kingOf('w'), kingOf('b')] : [kingOf('w'), kingOf('b'), ...shield('w'), ...shield('b')], kind: 'shelter', kings: [kingOf('w'), kingOf('b')] });
  const op = idx >= 0 ? openingOf(idx) : bookAt(st);
  if (op) struct.push({ id: 'eco', term: 'eco', label: 'Opening', value: `${op.eco} · ${op.name}`, op });
  const over = status.mate ? `Checkmate: ${SIDE_NAME(them)} wins.` : status.stale ? 'Stalemate: the game is drawn.' : status.insufficient ? 'Insufficient material: the game is drawn.' : status.draw50 ? 'Fifty-move rule: the game is drawn.' : idx >= 0 && repetitions(idx) >= 3 ? 'Threefold repetition: the game is drawn.' : status.check ? `${SIDE_NAME(me)} is in check.` : '';
  return { rules, struct, over, drawn: !status.mate && !status.check && !!over, opp, me, status, pawns: { w: P.w.length, b: P.b.length } };
}
const rowOf = (R, id) => R.rules.find(r => r.id === id) || R.struct.find(r => r.id === id) || null;

/* What is lit: the item pointed at, else the item clicked (insight.pin). Each item is
   { key, squares, kind, files, label, term, value, small }; the 3D board, the structure map and
   the detail line all show the same one. */
const lit = { items: new Map(), hover: null };
function litItem() { const k = lit.hover || (insight.pin && insight.pin.key); return k ? lit.items.get(k) || null : null; }
function applyLit() {
  const it = litItem();
  insight.squares = it ? it.squares : []; showHighlights();
  drawMap(it); drawDetail(it);
  for (const b of document.querySelectorAll('#pos-read-view [data-lit]')) {
    b.classList.toggle('lit', !!it && b.dataset.lit === it.key);
    b.setAttribute('aria-pressed', String(!!insight.pin && insight.pin.key === b.dataset.lit));
  }
}
function bindLit(el, item) {
  lit.items.set(item.key, item); el.dataset.lit = item.key; el.setAttribute('aria-pressed', 'false');
  if (!el.title) el.title = `Light ${item.squares.length === 1 ? 'its square' : 'these squares'} on the board`;
  const enter = () => { lit.hover = item.key; applyLit(); }, leave = () => { if (lit.hover === item.key) lit.hover = null; applyLit(); };
  el.addEventListener('mouseenter', enter); el.addEventListener('focus', enter); el.addEventListener('mouseleave', leave); el.addEventListener('blur', leave);
  el.addEventListener('click', () => {
    const k = lit.items.get(item.key) || item, on = !(insight.pin && insight.pin.key === k.key);
    insight.pin = on ? { key: k.key, squares: k.squares } : null; applyLit();
  });
}
let readSt = null, readR = null;
function renderReading() {
  const st = boardState(), idx = !explore.on && !boardOverride ? game.states.indexOf(st) : -1;
  const key = `${Chess.fen(st)}|${idx}|${game.states.length}`;
  if (key === insight.key) return;
  // a pin belongs to its position: another position starts with nothing lit
  const fen = key.split('|')[0];
  if (insight.fen && insight.fen !== fen) { insight.pin = null; insight.squares = []; lit.hover = null; }
  insight.key = key; insight.fen = fen;
  const R = readBoard(st, idx); readSt = st; readR = R; lit.items.clear();
  $('#pr-aside').textContent = explore.on ? 'Explored line' : boardOverride ? 'Crucible game' : app.view !== null ? (app.view === 0 ? 'Starting position' : `After ${Math.ceil(app.view / 2)}${app.view % 2 ? '.' : '…'} ${game.sans[app.view - 1]}`) : app.started ? 'Live' : 'Before the game';
  const s = $('#pr-status'); s.hidden = !R.over; s.textContent = R.over; s.className = 'pr-status' + (R.drawn ? ' draw' : '');
  drawTurn(R); drawMaterial(R); drawPhase(R); drawLegend(R); drawRules(R);
  $('#pst-aside').textContent = `${R.pawns.w} v ${R.pawns.b} pawns`;
  $('#prl-aside').textContent = `Move ${st.fullmove}`;
  termify($('#pos-read-view'));
  if (insight.pin) { const it = lit.items.get(insight.pin.key); if (it) insight.pin.squares = it.squares; else insight.pin = null; }
  applyLit();
}
/* Whose move, and how many moves each side has (the other side's as if it were its turn). */
function drawTurn(R) {
  const box = $('#pr-turn'); box.innerHTML = '';
  const mine = rowOf(R, 'legal-move'), scale = Math.max(40, mine.n, R.opp ? R.opp.n : 0);
  for (const c of ['w', 'b']) {
    const me = c === R.me, row = h('div', 'pr-side' + (me ? ' me' : '') + (me && R.status.check ? ' check' : ''));
    const who = h('span', 'pr-who'); who.append(h('i', `pr-av ${c}`), h('b', '', SIDE_NAME(c)));
    if (me) { const tag = h('span', 'pr-tag', R.status.mate ? 'mated' : R.status.check ? 'in check' : 'to move'); if (R.status.check) tag.classList.add('alert'); who.appendChild(tag); }
    const n = me ? mine.n : R.opp ? R.opp.n : null, sq = me ? mine.squares : R.opp ? R.opp.squares : [];
    const bar = h(n !== null && n > 0 ? 'button' : 'span', 'pr-mob');
    const track = h('span', 'pr-mob-track'), fill = h('i'); fill.style.width = n ? `${Math.max(3, Math.round(100 * n / scale))}%` : '0'; track.appendChild(fill);
    const num = h('span', 'pr-mob-n', n === null ? '–' : String(n));
    const cap = h('small', '', n === null ? 'waits: the move is the other side\'s' : me ? (n ? `legal moves, onto ${plural(sq.length, 'square')}` : mine.value) : 'moves if it were its turn');
    bar.append(track, num, cap);
    if (bar.tagName === 'BUTTON') { bar.type = 'button'; bindLit(bar, { key: `mob-${c}`, squares: sq, kind: 'target', label: me ? 'Legal moves' : 'Moves if it were its turn', term: me ? 'legal-move' : 'mobility', value: `${SIDE_NAME(c)}: ${n}`, small: `onto ${plural(sq.length, 'square')}` }); }
    row.append(who, bar); box.appendChild(row);
  }
}
/* Material: a split bar of the two sides' points, and each side's pieces as icons. */
function drawMaterial(R) {
  const m = rowOf(R, 'material-balance'), box = $('#pr-material'); box.innerHTML = '';
  $('#pr-mat-sum').textContent = m.d === 0 ? 'level' : `${SIDE_NAME(m.d > 0 ? 'w' : 'b')} +${Math.abs(m.d)}`;
  const tot = m.worth.w + m.worth.b || 1, bar = h('div', 'pr-bal'); bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', `Material: White ${m.worth.w} points, Black ${m.worth.b}. ${m.small}.`);
  const wi = h('i', 'w'); wi.style.flexGrow = m.worth.w || 0.001; const bi = h('i', 'b'); bi.style.flexGrow = m.worth.b || 0.001;
  bar.append(wi, bi); box.appendChild(bar);
  for (const c of ['w', 'b']) {
    const row = h('div', 'pr-pcs'); row.setAttribute('aria-label', `${SIDE_NAME(c)}: ${piecesWords(m.M[c]) || 'only the king'}`); row.setAttribute('role', 'img');
    for (const t of ['q', 'r', 'b', 'n', 'p']) {
      const k = m.M[c][t] || 0; if (!k) continue;
      const g = h('span', 'pr-pc' + (m.extra[c][t] ? ' up' : '')); g.appendChild(pieceIcon(c, t));
      if (k > 1) g.appendChild(h('small', '', `×${k}`));
      row.appendChild(g);
    }
    if (!row.childElementCount) row.appendChild(h('span', 'pr-none', 'king only'));
    row.appendChild(h('b', 'pr-pts', String(m.worth[c])));
    box.appendChild(row);
  }
  box.appendChild(h('p', 'pr-cap', m.small.charAt(0).toUpperCase() + m.small.slice(1) + '.'));
}
function drawPhase(R) {
  // a group of three words, the current one marked (not an image: its term link has to stay reachable)
  const p = rowOf(R, 'phase'), box = $('#pr-phase'); box.innerHTML = '';
  for (const [k, label] of [['opening', 'Opening'], ['middlegame', 'Middlegame'], ['endgame', 'Endgame']]) {
    const seg = h('span', 'pr-ph' + (k === p.ph ? ' on' : '')); const lab = h('span', '', label);
    if (k === p.ph) { lab.dataset.term = k; seg.setAttribute('aria-current', 'true'); }
    seg.appendChild(lab); box.appendChild(seg);
  }
}
/* The structure map: a diagram of the board with its features marked. With nothing lit it shows
   the pawn structure at once; with one feature lit, that feature alone. */
const STRUCT = [['passed-pawn', 'Passed'], ['isolated-pawn', 'Isolated'], ['doubled-pawns', 'Doubled'], ['open-file', 'Open files'], ['king-safety', 'Kings'], ['bishop-pair', 'Bishops']];
function drawLegend(R) {
  const box = $('#pr-legend'); box.innerHTML = '';
  for (const [id, short] of STRUCT) {
    const r = rowOf(R, id); if (!r) continue;
    const b = h('button', `pr-chip k-${r.kind}` + (r.none ? ' none' : '')); b.type = 'button';
    b.append(h('i', 'sw'), h('span', '', short));
    if (r.count !== undefined) b.appendChild(h('small', '', String(r.count)));
    b.setAttribute('aria-label', `${r.label}: ${r.value}${r.small ? `; ${r.small}` : ''}`);
    const files = id === 'open-file' ? { ...Object.fromEntries(r.half.w.map(f => [f, 'half'])), ...Object.fromEntries(r.half.b.map(f => [f, 'half'])), ...Object.fromEntries(r.open.map(f => [f, 'open'])) } : null;
    const sq = id === 'open-file' ? [...r.squares, ...[...r.half.w, ...r.half.b].flatMap(f => [0, 1, 2, 3, 4, 5, 6, 7].map(k => k * 8 + f))] : r.squares;
    bindLit(b, { key: id, squares: r.squares, mapSquares: sq, kind: r.kind, files, label: r.label, term: r.term, value: r.value, small: r.small, kings: r.kings });
    if (!r.squares.length && !(files && Object.keys(files).length)) b.disabled = true;
    box.appendChild(b);
  }
}
function drawMap(it) {
  const box = $('#pr-map'); if (!readSt || !readR) return;
  const marks = {}, add = (sq, k) => { (marks[sq] = marks[sq] || []).push(k); };
  let files = {}, dim = null;
  if (!it) {
    for (const id of ['passed-pawn', 'isolated-pawn', 'doubled-pawns']) { const r = rowOf(readR, id); for (const s of r.squares) add(s, r.kind); }
    for (const f of rowOf(readR, 'open-file').open) files[f] = 'open';
  } else if (it.kind === 'open') files = it.files || {};
  else if (it.kind === 'shelter') { for (const s of it.squares) add(s, (it.kings || []).includes(s) ? 'shelter' : 'focus'); }
  else for (const s of it.squares) add(s, it.kind || 'focus');
  if (it) { const on = new Set(it.mapSquares || it.squares); dim = new Set([...Array(64).keys()].filter(s => !on.has(s))); }
  box.innerHTML = '';
  box.appendChild(diagram(readSt.board, { flip: app.orient === 'b', coords: true, marks, files, dim, label: `Structure map. ${describeBoard(readSt.board)}` }));
}
function drawDetail(it) {
  const p = $('#pr-detail'); p.innerHTML = '';
  if (!it) { p.className = 'pr-detail hint'; p.textContent = 'The map marks each feature in its chip\'s colour. Point at a chip to see that one alone, on the map and on the board.'; return; }
  p.className = 'pr-detail';
  const lab = h('b', '', it.label); if (it.term && grById.get(it.term)) lab.dataset.term = it.term; p.append(lab, document.createTextNode(': '));
  for (const [i, part] of String(it.value).split(' · ').entries()) { if (i) p.appendChild(document.createTextNode(' · ')); p.appendChild(h('span', 'pr-line', part)); }
  if (it.small) p.appendChild(h('small', '', it.small));
  termify(p);
}
/* The rules state: castling rights as badges, en passant, the fifty-move count as a bar,
   repetition, and the opening's name. */
function drawRules(R) {
  const box = $('#pr-rules'); box.innerHTML = '';
  const line = (term, label, body, item) => {
    const row = h(item ? 'button' : 'div', 'pr-rule' + (item && item.alert ? ' alert' : ''));
    if (item) row.type = 'button'; else row.setAttribute('role', 'group');
    // a row that lights squares is a button, and a term link inside it would nest one control in
    // another: its term goes in the line under the map that the lit row fills (drawDetail) instead
    const l = h('span', 'pr-rl'); const t = h('span', '', label); if (term && !item) t.dataset.term = term; l.appendChild(t);
    row.append(l, body);
    if (item) bindLit(row, item);
    box.appendChild(row); return row;
  };
  const c = rowOf(R, 'castling'), cb = h('span', 'pr-castle');
  for (const side of ['w', 'b']) {
    const g = h('span', 'pr-cg'); g.appendChild(h('i', `pr-av ${side}`));
    for (const [k, txt] of [['K', 'O-O'], ['Q', 'O-O-O']]) {
      const has = c.rights[side + k], now = has && side === R.me && c.now.includes(txt);
      const b = h('span', 'pr-badge' + (has ? ' on' : ' off') + (now ? ' now' : ''), txt); b.title = `${SIDE_NAME(side)} ${txt}: ${has ? now ? 'legal now' : 'right kept' : 'right lost'}`;
      g.appendChild(b);
    }
    cb.appendChild(g);
  }
  if (c.small) cb.appendChild(h('small', '', c.small));
  // castling, labelled in words for screen readers; it lights the kings and rooks that keep a right
  const crow = line('castling', 'Castling', cb, c.squares.length ? { key: 'castling', squares: c.squares, kind: 'focus', label: c.label, term: c.term, value: c.value, small: c.small } : null);
  crow.setAttribute('aria-label', `Castling: ${c.value}${c.small ? `; ${c.small}` : ''}`);
  const e = rowOf(R, 'en-passant'), eb = h('span', 'pr-ep');
  eb.append(h('span', 'pr-badge' + (e.none ? ' none' : ' on') + (e.can ? ' now' : ''), e.value)); if (e.small) eb.appendChild(h('small', '', e.small));
  line('en-passant', 'En passant', eb, e.squares.length ? { key: 'en-passant', squares: e.squares, kind: 'focus', label: e.label, term: e.term, value: e.value, small: e.small } : null);
  const f = rowOf(R, 'fifty-move-rule'), fb = h('span', 'pr-fifty' + (f.alert ? ' alert' : ''));
  const tr = h('span', 'pr-mob-track'), fi = h('i'); fi.style.width = `${Math.min(100, f.n)}%`; tr.appendChild(fi);
  tr.setAttribute('role', 'img'); tr.setAttribute('aria-label', `${f.n} of 100 plies`);
  fb.append(tr, h('small', '', f.small ? `${f.value}: ${f.small}` : f.value));
  line('fifty-move-rule', 'Fifty-move count', fb, null);
  const rep = rowOf(R, 'threefold-repetition');
  if (rep) { const rb = h('span', 'pr-rep'); for (let i = 0; i < 3; i++) rb.appendChild(h('i', i < rep.n ? 'on' : '')); rb.appendChild(h('small', '', rep.small ? `${rep.value}: ${rep.small}` : rep.value)); line('threefold-repetition', 'Repetition', rb, null).classList.add('alert'); }
  const op = rowOf(R, 'eco');
  if (op) { const ob = h('span', 'pr-open'); ob.append(h('code', '', op.op.eco), h('span', '', op.op.name)); line('eco', 'Opening', ob, null); }
}

/* =====================================================================================
   Studies: the study in progress, Up next, the library
   ===================================================================================== */
export function studyKind(s) {
  if (s.mode === 'free') return 'Free play';
  if (s.mode === 'puzzle') { const n = Math.ceil(s.line.length / 2); return s.goal === 'mate' ? `Mate in ${n}` : n === 1 ? 'Find the move' : `Find ${n} moves`; }
  return s.goal === 'mate' ? `Mate · par ${s.par}` : s.goal === 'promote' ? 'Queen the pawn' : s.goal === 'hold' ? `Hold ${s.moves} moves` : 'Practice';
}
const MODE_WORD = { puzzle: 'Puzzle', practice: 'Against Stockfish', free: 'Set-up' };
function levelDots(n) {
  const lv = h('span', 'st-lv'); lv.setAttribute('role', 'img'); lv.setAttribute('aria-label', `Level ${n} of 3`); lv.title = `Level ${n} of 3`;
  for (let i = 1; i <= 3; i++) lv.appendChild(h('i', i <= n ? 'on' : ''));
  return lv;
}
function ring(done, total, text, cls = '') {
  const s = svgEl('svg', { viewBox: '0 0 40 40', class: 'st-ring' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' });
  s.appendChild(svgEl('circle', { cx: 20, cy: 20, r: 16, class: 'bg' }));
  if (total && done) { const pct = Math.round(100 * done / total); s.appendChild(svgEl('circle', { cx: 20, cy: 20, r: 16, class: 'fg', pathLength: 100, 'stroke-dasharray': `${pct} 100`, transform: 'rotate(-90 20 20)' })); }
  const t = svgEl('text', { x: 20, y: 20, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: text.length > 4 ? 'longer' : text.length > 3 ? 'long' : '' }); t.textContent = text; s.appendChild(t);
  return s;
}
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
function studyDiagram(s, o = {}) { return diagram(boardOf(s.fen), { flip: s.side === 'b', label: `${s.title}. ${describeBoard(boardOf(s.fen))} ${s.side === 'b' ? 'Shown from Black\'s side.' : ''}`.trim(), ...o }); }
/* Opens a study's page (null goes back to the grid). The page starts at its top, and the grid comes
   back where it was left, in whichever element scrolls the panel at this width. */
export function studyOpen(id) {
  const was = study.sel, sc = panelScroller();
  study.sel = id ? studyById.get(id) || null : null;
  if (!was && study.sel && sc) pos.gridScroll = sc.scrollTop;
  pos.libKey = ''; renderLibrary();
  if (study.sel) {
    if (sc) {
      sc.scrollTop = 0;
      // a short panel (a phone's) opens at the card instead, so the title and Start show under the switch
      const r = sc.getBoundingClientRect();
      if ($('#st-start').getBoundingClientRect().bottom > r.bottom) sc.scrollTop += $('#pos-studies').getBoundingClientRect().top - r.top - $('#pos-switch').offsetHeight - 8;
    }
    setTimeout(() => $('#st-d-title').focus({ preventScroll: true }), 0);
  }
  else if (was && sc) sc.scrollTop = pos.gridScroll || 0;
}
/* The studies shown in the grid (and paged in the detail view): the category chosen. */
const shownStudies = () => STUDIES.list.filter(x => study.cat === 'all' || x.cat === study.cat);
function renderLibrary() {
  const c = study.cur, solved = STUDIES.list.filter(s => studySolved(s.id)).map(s => s.id).join(',');
  const key = [study.cat, study.sel ? study.sel.id : '', solved, c ? c.s.id : '', c ? c.state : ''].join('|');
  if (key === pos.libKey) return;
  pos.libKey = key;
  const all = studyProgress('all');
  $('#ps-progress').textContent = `${all.done} of ${all.total} solved`;
  drawTiles();
  const s = study.sel;
  $('#st-index').hidden = !!s; $('#st-detail').hidden = !s;
  if (s) { drawDetailView(s); return; }
  drawUpNext(); drawGrid();
}
function drawTiles() {
  const box = $('#st-cats'); box.innerHTML = '';
  for (const [k, label] of STUDIES.cats) {
    const b = h('button', 'st-tile'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.scat = k; b.dataset.k = k;
    b.setAttribute('aria-checked', String(k === study.cat));
    const n = STUDIES.list.filter(s => k === 'all' || s.cat === k).length;
    if (k === 'setups') { b.appendChild(ring(0, 0, String(n), 'free')); b.setAttribute('aria-label', `${label}: ${plural(n, 'position')} to play freely`); }
    else { const p = studyProgress(k); b.appendChild(ring(p.done, p.total, `${p.done}/${p.total}`)); b.setAttribute('aria-label', `${label}: ${p.done} of ${p.total} solved`); if (p.total && p.done === p.total) b.classList.add('done'); }
    b.appendChild(h('span', 'st-tile-l', label));
    b.addEventListener('click', () => { const had = document.activeElement === b; study.cat = k; study.sel = null; pos.libKey = ''; renderLibrary(); if (had) $(`#st-cats [data-k="${k}"]`).focus(); });
    b.tabIndex = k === study.cat ? 0 : -1;   // one tab stop; the page's radiogroup keys move along
    box.appendChild(b);
  }
}
/* Up next: the first unsolved study in the order (level 1 first) of the category shown. With
   every study there solved, it says so and points at a category with studies left. */
function drawUpNext() {
  const box = $('#st-next'), c = study.cur;
  if ((c && c.state === 'playing') || study.cat === 'setups') { box.hidden = true; return; }
  box.hidden = false;
  const s = studyUpNext(study.cat), dg = $('#st-next-dg'); dg.innerHTML = '';
  box.classList.toggle('done', !s); delete box.dataset.scat;
  const start = $('#st-next-start'), open = $('#st-next-open'), meta = $('#st-next-meta'); meta.innerHTML = '';
  if (s) {
    box.dataset.scat = s.cat;
    $('#st-next-kick').textContent = study.cat === 'all' ? 'Up next' : `Up next in ${STUDY_CAT[study.cat]}`;
    dg.appendChild(studyDiagram(s));
    $('#st-next-title').textContent = s.title; $('#st-next-task').textContent = s.task;
    const chip = h('span', 'st-chip', STUDY_CAT[s.cat]); chip.dataset.scat = s.cat;
    meta.append(chip, levelDots(s.level), h('span', 'st-kind', studyKind(s)));
    start.hidden = false; start.textContent = 'Start'; start.onclick = () => studyStart(s);
    open.hidden = false; open.onclick = () => studyOpen(s.id);
    return;
  }
  const p = studyProgress(study.cat), left = STUDIES.cats.map(([k]) => k).filter(k => k !== 'all' && k !== 'setups' && k !== study.cat).find(k => studyUpNext(k));
  dg.appendChild(ring(p.done, p.total, '✓'));
  $('#st-next-kick').textContent = 'All solved';
  $('#st-next-title').textContent = study.cat === 'all' ? `Every study is solved: ${p.total} of ${p.total}.` : `Every study in ${STUDY_CAT[study.cat]} is solved.`;
  $('#st-next-task').textContent = left ? `${STUDY_CAT[left]} still has ${plural(studyProgress(left).total - studyProgress(left).done, 'study', 'studies')} to solve.` : 'Play any of them again: a solved study keeps its date.';
  open.hidden = true;
  if (left) { start.hidden = false; start.textContent = `Go to ${STUDY_CAT[left]}`; start.onclick = () => { study.cat = left; pos.libKey = ''; renderLibrary(); }; }
  else start.hidden = true;
}
function drawGrid() {
  const list = $('#st-list'); list.innerHTML = '';
  for (const x of shownStudies()) {
    const li = h('li'), b = h('button', 'st-card'); b.type = 'button'; b.dataset.scat = x.cat; b.dataset.id = x.id;
    const playing = study.cur && study.cur.s === x, done = studySolved(x.id);
    if (playing) b.classList.add('active');
    const th = h('span', 'st-thumb'); th.appendChild(studyDiagram(x));
    if (done) { const mark = h('span', 'st-done'); mark.title = `Solved ${prefs.studies[x.id].solved}`; mark.innerHTML = CHECK; th.appendChild(mark); }   // the date is text, never markup
    if (playing) th.appendChild(h('span', 'st-tag', study.cur.state === 'playing' ? 'Playing' : study.cur.state === 'solved' ? 'Solved' : 'Try again'));
    const body = h('span', 'st-card-b'); body.appendChild(h('b', '', x.title));
    const meta = h('span', 'st-meta'); meta.append(levelDots(x.level), h('span', 'st-kind', studyKind(x))); body.appendChild(meta);
    b.append(th, body); b.title = x.task;
    b.setAttribute('aria-label', `${x.title}. ${STUDY_CAT[x.cat]}. ${studyKind(x)}. ${x.task} Level ${x.level} of 3.${done ? ' Solved.' : ''}${playing ? ' In progress.' : ''}`);
    b.addEventListener('click', () => studyOpen(x.id));
    li.appendChild(b); list.appendChild(li);
  }
}
function drawDetailView(s) {
  $('#st-detail').dataset.scat = s.cat;
  const L = shownStudies(), i = L.indexOf(s);
  $('#st-d-pos').textContent = i >= 0 ? `${i + 1} of ${L.length}` : '';
  $('#st-prev').disabled = $('#st-fwd').disabled = L.length < 2 || i < 0;
  const bd = $('#st-d-board'); bd.innerHTML = ''; bd.appendChild(studyDiagram(s, { coords: true }));
  const chip = $('#st-d-cat'); chip.textContent = STUDY_CAT[s.cat]; chip.dataset.scat = s.cat;
  $('#st-d-title').textContent = s.title; $('#st-d-task').textContent = s.task; $('#st-d-idea').textContent = s.idea;
  const facts = $('#st-d-facts'); facts.innerHTML = '';
  const fact = (cls, ...kids) => { const li = h('li', cls); li.append(...kids); facts.appendChild(li); return li; };
  fact('', h('span', '', MODE_WORD[s.mode]), h('b', '', studyKind(s)));
  if (s.vs === 'both') fact('', h('i', 'pr-av w'), h('i', 'pr-av b'), h('span', '', 'You move both sides'));
  else fact('', h('i', `pr-av ${s.side}`), h('span', '', `You play ${SIDE_NAME(s.side)}`));
  fact('', levelDots(s.level), h('span', '', `Level ${s.level}`));
  if (studySolved(s.id)) { const f = fact('solved'); f.insertAdjacentHTML('beforeend', CHECK); f.appendChild(h('span', '', `Solved ${prefs.studies[s.id].solved}`)); }
  const read = $('#st-d-read'); read.innerHTML = '';
  for (const id of s.read || []) { const e = grById.get(id); if (!e) continue; const a = h('span', '', e.term); a.dataset.term = id; a.dataset.cat = e.cat; read.appendChild(a); }
  termify(read); $('#st-d-read-box').hidden = !read.childElementCount;
  const live = study.cur && study.cur.s === s;
  $('#st-start').textContent = s.mode === 'free' ? 'Play it' : live ? 'Restart study' : studySolved(s.id) ? 'Play it again' : 'Start study';
}
function pageStudy(step) { const L = shownStudies(), i = L.indexOf(study.sel); if (i < 0 || L.length < 2) return; studyOpen(L[(i + step + L.length) % L.length].id); }

/* The Study card: what to do, a picture of the goal, the status, hints and the way on. */
function renderStudyLive() {
  const c = study.cur, card = $('#study-live');
  card.hidden = !c; if (!c) return;
  const s = c.s; card.dataset.scat = s.cat;
  $('#sl-meta').textContent = `${STUDY_CAT[s.cat]} · level ${s.level} of 3`;
  const goal = $('#sl-goal'); goal.textContent = studyKind(s); goal.dataset.scat = s.cat;
  $('#sl-title').textContent = s.title; $('#sl-task').textContent = s.task;
  const mine = cur().turn === match.human, live = app.view === null;
  if (!c.ready && !app.busy) c.ready = true;   // the pieces have dealt in
  let text = c.msgAt === cur() && c.msg ? c.msg : '', kind = c.msgAt === cur() ? c.msgKind : '';
  if (!text) {
    if (c.state !== 'playing') { text = c.msg; kind = c.state === 'solved' ? 'good' : 'bad'; }
    else if (!live) { text = 'You are viewing an earlier move. Back to live to continue.'; kind = 'wait'; }
    else if (!c.ready) { text = 'Setting up the position…'; kind = 'wait'; }
    else if (mine) { text = studyText('yourMove', {}, String(game.moves.length)); kind = 'turn'; }
    else { text = s.mode === 'puzzle' ? studyText('theirMove') : 'Stockfish is thinking.'; kind = 'wait'; }
  }
  const st = $('#sl-status'); st.textContent = text; st.className = 'sl-status' + (kind ? ' ' + kind : '');
  drawTrack(c);
  const hints = $('#sl-hints'); hints.innerHTML = '';
  for (const t of s.hints.slice(0, c.hint)) hints.appendChild(h('li', '', t));
  const hb = $('#sl-hint'); hb.hidden = !s.hints.length; hb.disabled = c.hint >= s.hints.length;
  $('#sl-hint-label').textContent = c.hint >= s.hints.length ? 'No more hints' : c.hint ? 'Next hint' : 'Hint';
  // one dot per hint, lit as they are shown; once all are out the label says so
  const dots = $('#sl-hint-dots'); dots.innerHTML = ''; if (c.hint < s.hints.length) for (let i = 0; i < s.hints.length; i++) dots.appendChild(h('i', i < c.hint ? 'on' : ''));
  hb.setAttribute('aria-label', `${$('#sl-hint-label').textContent}: ${c.hint} of ${s.hints.length} shown`);
  const rv = $('#sl-reveal'); rv.hidden = s.mode !== 'puzzle'; rv.disabled = c.shown;
  $('#sl-solution').hidden = !c.shown; if (c.shown) $('#sl-solution').textContent = studyLineSan(s);
  // once the study is over, only Restart and Next matter
  $('#study-live .card-actions').hidden = (hb.hidden && rv.hidden) || c.state !== 'playing';
  // Next study is the call once it is solved; until then skipping stays as quiet as Restart and End
  const nx = $('#sl-next'); nx.textContent = c.state === 'solved' ? 'Next study' : 'Skip to the next';
  nx.classList.toggle('filled', c.state === 'solved'); nx.classList.toggle('text', c.state !== 'solved');
}
/* The goal, drawn: the moves to find (puzzles), the moves against par (mates), the pawn's road
   to the last rank (queening), the moves still to hold (holds). */
function drawTrack(c) {
  const s = c.s, box = $('#sl-track'); box.innerHTML = ''; box.className = 'sl-track';
  const head = (l, r) => { const d = h('div', 'sl-th'); d.append(h('span', '', l), h('span', '', r)); box.appendChild(d); return d; };
  if (s.mode === 'puzzle') {
    const n = Math.ceil(s.line.length / 2), played = game.moves.length;
    head(`Your moves: ${Math.min(Math.ceil(played / 2), n)} of ${n}`, c.tries ? `${plural(c.tries, 'wrong try', 'wrong tries')}` : c.state === 'solved' ? 'solved' : '').lastChild.classList.toggle('bad', !!c.tries);
    const ol = h('ol', 'sl-steps'); ol.setAttribute('aria-label', 'Your moves in the solution');
    for (let i = 0; i < n; i++) {
      const ply = i * 2, li = h('li');
      if (ply < played) { li.className = 'done'; li.textContent = game.sans[ply]; }
      else { li.textContent = `${i + 1}`; if (ply === played && c.state === 'playing') li.className = 'now'; }
      li.setAttribute('aria-label', ply < played ? `Move ${i + 1}: ${game.sans[ply]}` : `Move ${i + 1} to find`);
      ol.appendChild(li);
    }
    box.appendChild(ol); return;
  }
  const n = studyMyMoves();
  if (s.goal === 'mate') {
    const scale = Math.max(Math.ceil(s.par * 1.5), n + 2), over = n > s.par;
    head(`Your moves: ${n}`, `Par ${s.par}`).lastChild.classList.toggle('bad', over);
    const bar = h('div', 'sl-bar'); bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', `${n} moves played; Stockfish mates in ${s.par}`);
    const a = h('i', 'in'); a.style.width = `${100 * Math.min(n, s.par) / scale}%`; bar.appendChild(a);
    if (over) { const b = h('i', 'over'); b.style.left = `${100 * s.par / scale}%`; b.style.width = `${100 * (n - s.par) / scale}%`; bar.appendChild(b); }
    const par = h('b', 'par'); par.style.left = `${100 * s.par / scale}%`; bar.appendChild(par);
    box.appendChild(bar); return;
  }
  if (s.goal === 'promote') {
    const me = match.human, st = cur(), dir = me === 'w' ? 1 : -1;
    const pawns = st.board.map((p, i) => p && p.c === me && p.t === 'p' ? i : -1).filter(i => i >= 0);
    const lead = pawns.sort((a, b) => dir * ((b >> 3) - (a >> 3)))[0], ranks = me === 'w' ? [1, 2, 3, 4, 5, 6, 7] : [6, 5, 4, 3, 2, 1, 0];
    const at = lead === undefined ? (c.state === 'solved' ? 7 : -1) : ranks.indexOf(lead >> 3), togo = lead === undefined ? 0 : ranks.length - 1 - at;
    head(lead === undefined ? (c.state === 'solved' ? 'Queened' : 'No pawn left') : `Pawn on ${Chess.sqName(lead)}`, lead === undefined ? '' : `${plural(togo, 'square')} to queen`);
    const ol = h('ol', 'sl-ranks'); ol.setAttribute('aria-label', 'The pawn\'s road to the last rank');
    ranks.forEach((r, i) => {
      const li = h('li', i < at ? 'past' : i === at ? 'here' : '');
      if (i === at && lead !== undefined) li.appendChild(pieceIcon(me, 'p')); else if (i === ranks.length - 1) li.appendChild(pieceIcon(me, 'q'));
      li.appendChild(h('small', '', String(r + 1))); li.setAttribute('aria-label', `Rank ${r + 1}${i === at ? ': the pawn' : ''}`);
      ol.appendChild(li);
    });
    box.appendChild(ol); return;
  }
  if (s.goal === 'hold') {
    const k = Math.min(n, s.moves);
    head(`Moves held: ${k} of ${s.moves}`, c.checking ? 'checking with the engine…' : k >= s.moves ? '' : 'then the engine checks');
    const ol = h('ol', 'sl-hold' + (c.checking ? ' checking' : '')); ol.setAttribute('role', 'img'); ol.setAttribute('aria-label', `${k} of ${s.moves} moves held`);
    for (let i = 0; i < s.moves; i++) ol.appendChild(h('li', i < k ? 'on' : ''));
    box.appendChild(ol);
  }
}

/* =====================================================================================
   Set up: a board to build on, tied both ways to the FEN box
   ===================================================================================== */
/* ed is the position being built. It keeps what the player asked for (castling letters, an en
   passant square) and the FEN writes what the board allows, so moving a rook away and back
   gives its right back. */
const ed = { board: new Array(64).fill(null), turn: 'w', want: 'KQkq', ep: '-', half: 0, full: 1, flip: false, tool: 'move', held: -1, cursor: 12, focused: false, seen: '', vs: 'cpu', side: null };
const CASTLE = [['K', 'w', 4, 7, 'White O-O'], ['Q', 'w', 4, 0, 'White O-O-O'], ['k', 'b', 60, 63, 'Black O-O'], ['q', 'b', 60, 56, 'Black O-O-O']];
const canCastle = ch => { const [, c, k, r] = CASTLE.find(x => x[0] === ch); const K = ed.board[k], R = ed.board[r]; return !!(K && K.t === 'k' && K.c === c && R && R.t === 'r' && R.c === c); };
/* En passant squares the board allows: behind an enemy pawn that could just have moved two. */
function epCandidates() {
  const out = [], them = Chess.other(ed.turn), r = them === 'b' ? 4 : 3, behind = them === 'b' ? 5 : 2, start = them === 'b' ? 6 : 1;
  for (let f = 0; f < 8; f++) { const p = ed.board[r * 8 + f]; if (p && p.t === 'p' && p.c === them && !ed.board[behind * 8 + f] && !ed.board[start * 8 + f]) out.push(Chess.sqName(behind * 8 + f)); }
  return out;
}
function edPlacement() {
  const rows = [];
  for (let r = 7; r >= 0; r--) { let row = '', e = 0; for (let f = 0; f < 8; f++) { const p = ed.board[r * 8 + f]; if (!p) { e++; continue; } if (e) { row += e; e = 0; } row += p.c === 'w' ? p.t.toUpperCase() : p.t; } if (e) row += e; rows.push(row); }
  return rows.join('/');
}
function edFen() {
  const cs = [...'KQkq'].filter(ch => ed.want.includes(ch) && canCastle(ch)).join('') || '-';
  const ep = epCandidates().includes(ed.ep) ? ed.ep : '-';
  return `${edPlacement()} ${ed.turn} ${cs} ${ep} ${ed.half} ${ed.full}`;
}
function edFromState(st) {
  ed.board = st.board.map(p => p ? { c: p.c, t: p.t } : null); ed.turn = st.turn;
  ed.want = [...'KQkq'].filter(ch => st.castling[(ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase()]).join('');
  ed.ep = st.ep >= 0 ? Chess.sqName(st.ep) : '-'; ed.half = st.halfmove; ed.full = st.fullmove; ed.held = -1;
}
/* A lenient read of a FEN for the editor: any eight ranks of eight squares, whatever the kings
   or the rules say (the FEN's own check reports those). False when the board cannot be read. */
function edFromText(text) {
  const parts = String(text || '').trim().split(/\s+/), rows = (parts[0] || '').split('/');
  if (rows.length !== 8) return false;
  const board = new Array(64).fill(null);
  for (let ri = 0; ri < 8; ri++) { let f = 0; for (const ch of rows[ri]) { if (/[1-8]/.test(ch)) { f += +ch; continue; } if (!/[pnbrqk]/i.test(ch) || f > 7) return false; board[(7 - ri) * 8 + f] = { t: ch.toLowerCase(), c: ch === ch.toUpperCase() ? 'w' : 'b' }; f++; } if (f !== 8) return false; }
  ed.board = board; ed.turn = (parts[1] || 'w').toLowerCase() === 'b' ? 'b' : 'w';
  ed.want = (parts[2] || '-').replace(/[^KQkq]/g, ''); ed.ep = parts[3] || '-';
  ed.half = /^\d+$/.test(parts[4] || '') ? +parts[4] : 0; ed.full = /^\d+$/.test(parts[5] || '') ? +parts[5] : 1; ed.held = -1;
  return true;
}
function edSay(text) { $('#ed-live').textContent = text; }
const pieceName = p => `${p.c === 'w' ? 'white' : 'black'} ${PIECE_NAMES[p.t]}`;
/* The board was edited: write its FEN into the box. */
function edCommit(say = '') {
  const box = $('#fen'); box.value = edFen(); app.fenDirty = true; app.fenSel = -1;
  ed.seen = box.value;
  const note = $('#fen-note'); note.className = 'help'; note.textContent = 'Edited. Play this position starts a game from it.';
  if (say) edSay(say);
  renderSetup(true); renderSwitch();
}
function edAct(sq, tool = ed.tool) {
  const p = ed.board[sq], name = Chess.sqName(sq), rank = sq >> 3;
  if (tool === 'move') {
    if (ed.held < 0) { if (!p) { edSay(`${name} is empty. Pick a piece to move, or choose a piece from the tray to place one.`); return; } ed.held = sq; edSay(`${pieceName(p)} on ${name} picked up: choose its square.`); renderSetup(true); return; }
    const from = ed.held, q = ed.board[from]; ed.held = -1;
    if (from === sq) { edSay('Put back.'); renderSetup(true); return; }
    if (q.t === 'p' && (rank === 0 || rank === 7)) { edSay('Pawns cannot stand on the first or last rank.'); renderSetup(true); return; }
    ed.board[sq] = q; ed.board[from] = null; edCommit(`${pieceName(q)} to ${name}${p ? `, the ${pieceName(p)} taken off` : ''}.`); return;
  }
  if (tool === 'erase') { if (!p) { edSay(`${name} is already empty.`); return; } ed.board[sq] = null; edCommit(`${pieceName(p)} taken off ${name}.`); return; }
  const np = { c: tool[0], t: tool[1] };
  if (p && p.c === np.c && p.t === np.t) { ed.board[sq] = null; edCommit(`${pieceName(p)} taken off ${name}.`); return; }
  if (np.t === 'p' && (rank === 0 || rank === 7)) { edSay('Pawns cannot stand on the first or last rank.'); return; }
  let moved = '';
  if (np.t === 'k') for (let i = 0; i < 64; i++) { const k = ed.board[i]; if (i !== sq && k && k.t === 'k' && k.c === np.c) { ed.board[i] = null; moved = ` (one king a side: it left ${Chess.sqName(i)})`; } }
  ed.board[sq] = np; edCommit(`${pieceName(np)} on ${name}${moved}.`);
}
const TOOLS = [['move', 'Move a piece', '<path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>'], ['erase', 'Erase', '<path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4 4 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z"/>']];
function buildTray() {
  const tray = $('#ed-tray'); tray.innerHTML = '';
  const add = (id, label, node) => {
    const b = h('button', 'ed-tool' + (id.length === 2 ? ' pc' : '')); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.tool = id; b.setAttribute('aria-label', label); b.title = label;
    b.appendChild(node); b.addEventListener('click', () => { ed.tool = id; ed.held = -1; edSay(id === 'move' ? 'Move: click a piece, then its square.' : id === 'erase' ? 'Erase: click a piece to take it off. Right-click erases with any tool.' : `Place: click a square for a ${label.toLowerCase()}; click it again to take it off.`); renderSetup(true); });
    tray.appendChild(b);
  };
  // two rows of seven: Move and White's pieces, then Erase and Black's
  TOOLS.forEach(([id, label, path], i) => {
    const s = svgEl('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', class: 'ed-ic' }); s.innerHTML = path; add(id, label, s);
    const c = i ? 'b' : 'w'; for (const t of ['k', 'q', 'r', 'b', 'n', 'p']) add(c + t, `${c === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[t]}`, pieceIcon(c, t));
  });
}
function drawEditor() {
  const box = $('#ed-board'), marks = {};
  if (ed.held >= 0) marks[ed.held] = 'held';
  if (ed.focused) marks[ed.cursor] = [].concat(marks[ed.cursor] || [], 'cursor');
  const svg = diagram(ed.board, { flip: ed.flip, coords: true, marks, hit: true, label: 'Board editor', cls: 'dg-edit' });
  svg.removeAttribute('role'); svg.setAttribute('aria-hidden', 'true');
  box.innerHTML = ''; box.appendChild(svg);
  for (const b of document.querySelectorAll('#ed-tray .ed-tool')) { const on = b.dataset.tool === ed.tool; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }
  for (const b of document.querySelectorAll('#ed-turn [data-edturn]')) b.setAttribute('aria-checked', String(b.dataset.edturn === ed.turn));
  const cb = $('#ed-castle');
  if (cb.childElementCount === 1) for (const [ch, , , , label] of CASTLE) { const b = h('button', 'ed-cs'); b.type = 'button'; b.dataset.cs = ch; b.append(h('i', `pr-av ${ch === ch.toUpperCase() ? 'w' : 'b'}`), h('span', '', label.split(' ')[1])); b.setAttribute('aria-label', label); b.addEventListener('click', () => { ed.want = ed.want.includes(ch) ? ed.want.replace(ch, '') : ed.want + ch; edCommit(`${label}: ${ed.want.includes(ch) ? 'allowed' : 'not allowed'}.`); }); cb.appendChild(b); }
  for (const b of cb.querySelectorAll('[data-cs]')) { const ch = b.dataset.cs, ok = canCastle(ch); b.disabled = !ok; b.setAttribute('aria-pressed', String(ok && ed.want.includes(ch))); b.title = ok ? `${b.getAttribute('aria-label')}: click to ${ed.want.includes(ch) ? 'take the right away' : 'give the right'}` : 'The king or that rook is not on its starting square'; }
  const sel = $('#ed-ep'), cands = epCandidates(), cur_ = cands.includes(ed.ep) ? ed.ep : '-';
  sel.innerHTML = ''; for (const v of ['-', ...cands]) { const o = h('option', '', v === '-' ? 'none' : v); o.value = v; sel.appendChild(o); }
  sel.value = cur_; sel.disabled = !cands.length; sel.title = cands.length ? 'The square a pawn has just skipped' : 'No pawn could just have moved two squares';
  $('#ed-flip').setAttribute('aria-pressed', String(ed.flip));
}
function edKey(e) {
  // the cursor shows once the keyboard is in use (a click focuses the board without one, and a
  // redraw on focus would swallow that click)
  if (!ed.focused) { ed.focused = true; renderSetupView(); }
  const f = ed.cursor & 7, r = ed.cursor >> 3, dx = ed.flip ? -1 : 1;
  const move = (df, dr) => { const nf = Math.max(0, Math.min(7, f + df)), nr = Math.max(0, Math.min(7, r + dr)); ed.cursor = nr * 8 + nf; const p = ed.board[ed.cursor]; edSay(`${Chess.sqName(ed.cursor)}: ${p ? pieceName(p) : 'empty'}`); renderSetup(true); };
  if (e.key === 'ArrowLeft') move(-dx, 0); else if (e.key === 'ArrowRight') move(dx, 0);
  else if (e.key === 'ArrowUp') move(0, dx); else if (e.key === 'ArrowDown') move(0, -dx);
  else if (e.key === 'Enter' || e.key === ' ') edAct(ed.cursor);
  else if (e.key === 'Delete' || e.key === 'Backspace') edAct(ed.cursor, 'erase');
  else if (/^[KQRBNPkqrbnp]$/.test(e.key)) edAct(ed.cursor, (e.key === e.key.toUpperCase() ? 'w' : 'b') + e.key.toLowerCase());
  else if (e.key === 'Escape' && ed.held >= 0) { ed.held = -1; edSay('Put back.'); renderSetup(true); }
  else return;
  e.preventDefault();
}

/* ---------- the FEN's six fields ---------- */
const FEN_FIELDS = [['pieces', 'Pieces'], ['turn', 'To move'], ['castling', 'Castling'], ['ep', 'En passant'], ['half', 'Halfmove clock'], ['full', 'Move']];
const FEN_SHORT = ['Pieces', 'To move', 'Castling', 'En passant', 'Halfmoves', 'Move'];
let fenSeen = '';
export function fenAnatomy(text) {
  const parts = String(text || '').trim().split(/\s+/).filter(Boolean), r = Chess.parseFen(text), st = r.state;
  const out = FEN_FIELDS.map(([k, label], i) => ({ k, label, raw: parts[i], err: '', note: '', read: '' }));
  const [P, T, C, E, H, N] = out, err = r.error || '';
  if (!parts.length) { P.err = 'The box is empty.'; return { fields: out, ok: false, error: P.err }; }
  if (err && !/Side to move/.test(err)) P.err = err;
  if (/Side to move/.test(err)) T.err = err;
  if (/already in check/.test(err)) T.note = 'The side not on move is in check, so this cannot be the position.';
  if (!P.err) {
    const n = c => (P.raw.match(c === 'w' ? /[PNBRQK]/g : /[pnbrqk]/g) || []).length;
    P.read = `Rank 8 down to rank 1, each from the a-file to the h-file, ranks split by a slash. Capitals are White's pieces, small letters Black's (K king, Q queen, R rook, B bishop, N knight, P pawn); a digit counts empty squares. Here ${n('w')} white and ${n('b')} black pieces.`;
  }
  if (T.raw === undefined) T.note = 'Missing: taken as w.'; else if (!T.err) T.read = T.raw.toLowerCase() === 'w' ? 'w: White is to move.' : 'b: Black is to move.';
  if (C.raw === undefined) C.note = 'Missing: taken as -, no castling.';
  else {
    const bad = [...C.raw].filter(ch => !'KQkq-'.includes(ch));
    if (bad.length) C.note = `${bad.join(' ')} ${bad.length === 1 ? 'is not a castling letter' : 'are not castling letters'}, and ${bad.length === 1 ? 'is' : 'are'} ignored.`;
    const said = { K: 'White short (K)', Q: 'White long (Q)', k: 'Black short (k)', q: 'Black long (q)' }, kept = [], dropped = [];
    for (const ch of 'KQkq') if (C.raw.includes(ch)) (st && st.castling[(ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase()] ? kept : dropped).push(ch);
    const allowed = kept.map(ch => said[ch]), list = allowed.length > 1 ? `${allowed.slice(0, -1).join(', ')} and ${allowed[allowed.length - 1]}` : allowed[0];
    C.read = C.raw === '-' ? '-: neither side may castle again.' : allowed.length ? `${C.raw}: castling is still allowed for ${list}. These are rights for later moves, not moves legal now.` : `${C.raw}: as written, but no castling right holds on this board.`;
    if (st && dropped.length) C.note = `${dropped.join(' ')} ${dropped.length === 1 ? 'is' : 'are'} dropped: the king or that rook is not on its starting square.`;
  }
  if (E.raw === undefined) E.note = 'Missing: taken as -.';
  else if (E.raw === '-') E.read = '-: no pawn has just moved two squares.';
  else if (st && st.ep >= 0) { const can = Chess.allLegal(st).some(m => m.ep); E.read = `${E.raw}: a pawn has just moved two squares, passing ${E.raw}. It can be taken there on this move only${can ? ', and a capture is legal now' : ', but no pawn stands ready to take it'}.`; }
  else E.note = `${E.raw} does not fit this position (no pawn has just passed it), so it is ignored.`;
  const num = (f, def, read) => { if (f.raw === undefined) f.note = `Missing: taken as ${def}.`; else if (!/^\d+$/.test(f.raw)) f.note = `${f.raw} is not a number: taken as ${def}.`; else f.read = read(+f.raw); };
  num(H, 0, n => `${n}: ${n === 1 ? 'one ply' : `${n} plies`} since the last capture or pawn move. At 100 the game is drawn by the fifty-move rule.`);
  num(N, 1, n => `${n}: the move number. It goes up by one after each of Black's moves.`);
  if (parts.length > 6) N.note = `${parts.length - 6} extra field${parts.length - 6 === 1 ? '' : 's'} after the move number ${parts.length - 6 === 1 ? 'is' : 'are'} ignored.`;
  return { fields: out, ok: !r.error, error: r.error || '' };
}
function fenFieldRange(text, i) {
  const re = /\S+/g; let m, k = 0;
  while ((m = re.exec(text))) { if (k === i) return [m.index, m.index + m[0].length]; k++; }
  return null;
}
/* The colour layer under the FEN box: each field in its own colour, the selected one marked,
   a field in error underlined. It mirrors the box's text exactly, character for character. */
function drawFenHl(text, A) {
  const hl = $('#fen-hl'); hl.innerHTML = ''; let i = 0;
  for (const m of text.matchAll(/(\s+)|(\S+)/g)) {
    if (m[1]) { hl.appendChild(document.createTextNode(m[1])); continue; }
    const f = A.fields[i], sp = h('span', `fh f${Math.min(i, 6)}` + (f && f.err ? ' err' : f && f.note ? ' note' : '') + (i === app.fenSel ? ' sel' : ''), m[2]);
    hl.appendChild(sp); i++;
  }
  hl.appendChild(document.createTextNode('​'));
  hl.scrollTop = $('#fen').scrollTop;
}
/* The box grows with its text instead of scrolling, so the colour layer under it always wraps at
   the same places. */
function fitFen() { const box = $('#fen'); if (!box.offsetParent) return; box.style.height = 'auto'; box.style.height = `${box.scrollHeight + 2}px`; }
export function renderFenFields(force = false) {
  const box = $('#fen'), text = box.value, sig = `${text}|${app.fenDirty}|${app.fenSel}`;
  fitFen();
  if (!force && sig === fenSeen) return;
  fenSeen = sig;
  const A = fenAnatomy(text), wrap = $('#fen-fields'); wrap.innerHTML = '';
  drawFenHl(text, A);
  A.fields.forEach((f, i) => {
    const b = h('button', `fen-f f${i}` + (f.err ? ' err' : f.note ? ' note' : '')); b.type = 'button';
    b.setAttribute('aria-pressed', String(i === app.fenSel));
    b.append(h('small', '', FEN_SHORT[i]), h('code', '', f.raw === undefined ? '—' : f.raw)); b.title = `${f.label}: ${f.err || f.note || f.read || 'not given'}`;
    b.addEventListener('click', () => {
      app.fenSel = app.fenSel === i ? -1 : i; renderFenFields(true);
      // the chips were just rebuilt: the selection goes to the text, the focus to the new chip
      const rg = app.fenSel >= 0 ? fenFieldRange(box.value, app.fenSel) : null, chip = $('#fen-fields').children[i];
      if (rg) { box.focus({ preventScroll: true }); box.setSelectionRange(rg[0], rg[1]); }
      if (chip) chip.focus({ preventScroll: true });
    });
    wrap.appendChild(b);
  });
  const ex = $('#fen-explain'); ex.innerHTML = '';
  const f = app.fenSel >= 0 ? A.fields[app.fenSel] : A.fields.find(x => x.err) || null;
  if (f) { ex.className = `fen-explain f${A.fields.indexOf(f)}` + (f.err ? ' err' : ''); ex.append(h('b', '', `${f.label}. `), document.createTextNode([f.err, f.read, f.note].filter(Boolean).join(' ') || 'Not given.')); }
  else ex.className = 'fen-explain';
  const aside = $('#pf-aside'); aside.textContent = !A.ok ? 'Not a legal position' : app.fenDirty ? 'Edited, not played' : 'Matches the board';
  aside.className = 'card-aside' + (!A.ok ? ' err' : app.fenDirty ? ' edited' : '');
  $('#ed-board').classList.toggle('invalid', !A.ok);
}
/* The box and the editor follow the board you see until either is edited. */
function syncSetup() {
  const box = $('#fen');
  if (app.fenDirty || document.activeElement === box) return;
  const st = boardState(), f = Chess.fen(st);
  if (box.value !== f) box.value = f;
  if (ed.seen !== f) { ed.seen = f; edFromState(st); if (prefs.tab === 'position' && pos.view === 'setup') drawEditor(); }
}
function renderSetup(force = false) {
  if (force) drawEditor();
  renderFenFields(force);
  renderEdPlay();
}
let edDrawnKey = '';
function renderSetupView() {
  const k = `${ed.seen}|${ed.flip}|${ed.tool}|${ed.held}|${ed.focused}|${ed.cursor}`;
  if (k !== edDrawnKey) { edDrawnKey = k; drawEditor(); }
  renderFenFields();
  renderEdPlay();
}
/* Who plays the position: you against Stockfish, on the side to move unless you pick the other, or
   both sides on this screen. The opponent is kept between visits; the side goes with the position.
   The foot beside Play this position says which, so the button never starts a game unannounced. */
const edVs = () => engine.failed ? 'human' : ed.vs;
function renderEdPlay() {
  const vs = edVs(), side = ed.side || ed.turn, L = LEVELS[draft.level - 1], wait = vs === 'cpu' && !engine.ready;
  for (const b of document.querySelectorAll('#ed-vs [data-edvs]')) { const on = b.dataset.edvs === vs; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; b.disabled = b.dataset.edvs === 'cpu' && engine.failed; }
  $('#ed-side').hidden = vs !== 'cpu';
  for (const b of document.querySelectorAll('#ed-side [data-edside]')) { const on = b.dataset.edside === side; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }
  $('#btn-fen-load').disabled = wait;
  $('#ed-play-help').textContent = vs === 'human' ? `You move both sides on this screen, ${SIDE_NAME(ed.turn)} first.`
    : wait ? 'Stockfish is still loading.'
    : side === ed.turn ? `You play ${SIDE_NAME(side)}, the side to move, against Stockfish at ${L.name}, level ${draft.level} of 8.`
    : `You play ${SIDE_NAME(side)} against Stockfish at ${L.name}, level ${draft.level} of 8; Stockfish moves first.`;
}
/* Load what the Set up view holds: the box's FEN, as a new game played as the foot says. The game's
   own settings stand aside (startGame's opts), so the next ordinary game is Play's again. */
function loadFen() {
  const note = $('#fen-note'), r = Chess.parseFen($('#fen').value);
  if (r.error) { note.className = 'help err'; note.textContent = r.error; return; }
  const cpu = edVs() === 'cpu', side = cpu && ed.side || r.state.turn;
  const go = () => {
    app.fenDirty = false;
    startGame(r.state, { opponent: cpu ? 'cpu' : 'human', side, level: draft.level, study: null });
    const what = `A new game from this position: ${cpu ? `you play ${SIDE_NAME(side)} against Stockfish` : 'you move both sides'}.`;
    note.className = 'help'; note.textContent = what;
    snack(what, [{ label: 'Go to Play', act: () => setTab('play') }]);
  };
  if (app.started && game.sans.length && !game.result) snack('Play this position? The current game ends.', [{ label: 'Keep playing', act: () => {} }, { label: 'Play it', filled: true, act: go }], true);
  else go();
}
function copyText(text, note) {
  const done = () => { if (note) { note.className = 'help'; note.textContent = 'FEN copied to the clipboard.'; } else snack('FEN copied to the clipboard.'); };
  /* Without the clipboard API (a page served over plain http, an older browser): the copy command on
     a hidden field of its own, so the FEN box and the board editor are left as they were; where that
     is refused too, the FEN is shown for copying by hand. */
  const fallback = () => {
    const back = document.activeElement, ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true'); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove(); if (back && back.focus) back.focus({ preventScroll: true });
    if (ok) return done();
    const msg = `This browser refused the copy. The FEN: ${text}`;
    if (note) { note.className = 'help'; note.textContent = msg; } else snack(msg, [{ label: 'Done', act: () => {} }], true);
  };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
}
/* Put a position into the Set up view and open it: a study's (edited, not loaded) or the board
   you see (still matching it). */
export function openInSetup(fen, { flip = false, say = '', side = null } = {}) {
  const box = $('#fen'); ed.side = side;
  if (fen) { box.value = fen; edFromText(fen); ed.seen = fen; app.fenDirty = true; } else { app.fenDirty = false; const st = boardState(); box.value = Chess.fen(st); edFromState(st); ed.seen = box.value; }
  app.fenSel = -1; ed.flip = flip; ed.tool = 'move';
  const n = $('#fen-note'); n.className = 'help'; n.textContent = say;
  edSay('Pick a tool, then click a square. Right-click erases.');
  setPosView('setup'); renderSetup(true);
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  if (!prefs.studies || typeof prefs.studies !== 'object') prefs.studies = {};
  pos.view = VIEWS.includes(prefs.posView) ? prefs.posView : 'studies';
  if (study.cur) pos.gen = study.cur.gen;
  setPosView(pos.view, { silent: true });
  // the switch: click, or arrow keys between the three
  const tabs = [...document.querySelectorAll('#pos-switch [role="tab"]')];
  for (const b of tabs) {
    b.addEventListener('click', () => setPosView(b.dataset.pv));
    b.addEventListener('keydown', e => {
      const i = tabs.indexOf(b), j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (j === null) return; e.preventDefault(); setPosView(tabs[(j + tabs.length) % tabs.length].dataset.pv, { focus: true });
    });
  }
  // Studies: the study in progress
  $('#sl-hint').addEventListener('click', studyHint);
  $('#sl-reveal').addEventListener('click', studyReveal);
  $('#sl-restart').addEventListener('click', () => { if (study.cur) studyStart(study.cur.s); });
  $('#sl-end').addEventListener('click', studyEnd);
  $('#sl-next').addEventListener('click', () => { const c = study.cur; if (!c) return; const n = studyNext(c.s); study.sel = null; studyStart(n); });
  // Studies: the library
  $('#st-back').addEventListener('click', () => {
    const id = study.sel && study.sel.id; studyOpen(null);
    const b = id && document.querySelector(`#st-list .st-card[data-id="${id}"]`); if (b) b.focus();
  });
  $('#st-prev').addEventListener('click', () => pageStudy(-1));
  $('#st-fwd').addEventListener('click', () => pageStudy(1));
  $('#st-start').addEventListener('click', () => { if (study.sel) studyStart(study.sel); });
  $('#st-tofen').addEventListener('click', () => {
    const s = study.sel; if (!s) return;
    openInSetup(s.fen, { flip: s.side === 'b', side: s.side, say: `${s.title} is set up. Change anything you like, choose who plays it, then Play this position.` });
  });
  // Read
  $('#pr-edit').addEventListener('click', () => openInSetup(null, { flip: app.orient === 'b', say: 'The board you see is set up. Edit it, then Play this position.' }));
  $('#pr-copy').addEventListener('click', () => copyText(Chess.fen(boardState()), null));
  // Set up: the editor
  buildTray();
  const eb = $('#ed-board');
  eb.tabIndex = 0; eb.setAttribute('role', 'application'); eb.setAttribute('aria-roledescription', 'board editor');
  eb.setAttribute('aria-label', 'Board editor. Arrow keys move between squares; Enter uses the tool; Delete clears a square; a piece letter places that piece (capitals White).');
  eb.setAttribute('aria-describedby', 'ed-live');
  eb.addEventListener('click', e => { const r = e.target.closest('[data-sq]'); if (r) { ed.cursor = +r.dataset.sq; edAct(+r.dataset.sq); } });
  eb.addEventListener('contextmenu', e => { const r = e.target.closest('[data-sq]'); if (!r) return; e.preventDefault(); edAct(+r.dataset.sq, 'erase'); });
  eb.addEventListener('keydown', edKey);
  eb.addEventListener('blur', () => { if (ed.focused) { ed.focused = false; renderSetupView(); } });
  for (const b of document.querySelectorAll('#ed-turn [data-edturn]')) b.addEventListener('click', () => { if (ed.turn === b.dataset.edturn) return; ed.turn = b.dataset.edturn; edCommit(`${SIDE_NAME(ed.turn)} to move.`); });
  $('#ed-ep').addEventListener('change', e => { ed.ep = e.target.value; edCommit(ed.ep === '-' ? 'No en passant square.' : `En passant on ${ed.ep}.`); });
  $('#ed-clear').addEventListener('click', () => {
    const kings = ed.board.map((p, i) => p && p.t === 'k' ? [i, p] : null).filter(Boolean);
    ed.board = new Array(64).fill(null);
    for (const c of ['w', 'b']) { const k = kings.find(([, p]) => p.c === c); ed.board[k ? k[0] : c === 'w' ? 4 : 60] = { c, t: 'k' }; }
    ed.held = -1; ed.half = 0; ed.full = 1; ed.ep = '-'; edCommit('Cleared: only the kings are left.');
  });
  $('#ed-start').addEventListener('click', () => { edFromState(Chess.newGame()); edCommit('The starting position.'); });
  $('#ed-seen').addEventListener('click', () => openInSetup(null, { flip: ed.flip, say: 'Back to the board you see.' }));
  $('#ed-flip').addEventListener('click', () => { ed.flip = !ed.flip; edSay(ed.flip ? 'Black at the bottom.' : 'White at the bottom.'); renderSetup(true); });
  // Set up: the FEN box
  const box = $('#fen');
  box.addEventListener('input', () => {
    app.fenDirty = true; const note = $('#fen-note'); note.className = 'help'; note.textContent = 'Edited. Play this position starts a game from it.';
    if (edFromText(box.value)) { ed.seen = box.value; drawEditor(); }
    renderFenFields(true); renderSwitch();
  });
  box.addEventListener('scroll', () => { $('#fen-hl').scrollTop = box.scrollTop; });
  $('#btn-fen-load').addEventListener('click', loadFen);
  ed.vs = prefs.edVs === 'human' ? 'human' : 'cpu';
  for (const b of document.querySelectorAll('#ed-vs [data-edvs]')) b.addEventListener('click', () => { ed.vs = b.dataset.edvs; prefs.edVs = ed.vs; savePrefs(); renderEdPlay(); });
  // the side to move is the default, so choosing it again goes back to following the position
  for (const b of document.querySelectorAll('#ed-side [data-edside]')) b.addEventListener('click', () => { ed.side = b.dataset.edside === ed.turn ? null : b.dataset.edside; renderEdPlay(); });
  $('#btn-fen-copy').addEventListener('click', () => copyText($('#fen').value.trim(), $('#fen-note')));
  edSay('Pick a tool, then click a square. Right-click erases.');
  onRender(() => {
    // a study that starts opens Studies, wherever the player was
    if (study.cur && study.cur.gen !== pos.gen) {
      pos.gen = study.cur.gen; insight.pin = null; lit.hover = null; study.sel = null;
      if (pos.view !== 'studies') setPosView('studies', { silent: true });
      if (prefs.tab === 'position') { const pane = $('#pane-position'), sc = panelScroller(); if (pane) pane.scrollTop = 0; if (sc) sc.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }
    }
    syncSetup(); renderSwitch();
    // away from Read, nothing stays lit, and Read redraws in full when it comes back
    if (prefs.tab !== 'position' || pos.view !== 'read') { insight.key = ''; lit.hover = null; }
    if (prefs.tab !== 'position') { if (insight.squares.length) insight.squares = []; return; }
    if (pos.view === 'studies') { renderStudyLive(); renderLibrary(); }
    else if (pos.view === 'read') renderReading();
    else renderSetupView();
  });
}
