/*
✒ Metadata
    - Title: Panel Renderers (MONOLITH Edition - v1.6)
    - File Name: panels.js
    - Relative Path: js/ui/panels.js
    - Artifact Type: javascript
    - Version: 1.6.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.6.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — The free
      board, Play from here, auto-flip, Draw and Analyze's evaluation; the
      Moves card folds when empty, lists Crucible games, scrolls sideways.
    - 1.5.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.5.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: the move list, the Coach's notes and
      the candidates are rebuilt only when what they show changes, so a
      click or the focus inside them survives a render; on phones the panel
      no longer jumps to the move list on every render; the strength slider
      is hidden in a study; and Start game waits for the engine in a game
      against the computer.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The renderers that keep the panels in step with the game, or with the
    free board before one: the Play pane, the match strip, the players'
    cards with their captures, the evaluation bar, the move list, the
    Coach's feed and Settings. Each registers with onRender().

✒ Key Features:
    - renderMatchbar(): the match strip in the app bar: the game, the free
      board's line, or the game that Start game will begin; on Analyze the
      evaluation from White's side, with the depth and the search's state.
    - Player cards: names, captures counted from the start position, the
      side to move; an explored line or the free board is what they show.
    - The Play pane: the setup (Play from here, and the board's turn for
      two players on one screen), Draw and the Board card in a friend game,
      and the result card's other side next time (Play obsidian, or Switch
      sides in a friend game whose board stays put).
    - The Moves card: the game, the free board's line or a Crucible game's
      moves (renderCrMoves()); it folds to its head with nothing to list,
      and a phone's one-row strip scrolls sideways to the move in view.
    - The Coach's feed: a badge and a note for each moment (verdict, reply,
      watch, end), with its actions (a move to show, or Analyze it).
    - radio(): segmented choices kept in step with the draft.
    - Settings: every row in step with the preferences, Turn the board for
      each player, Coach comments, Evaluation bar and Short source badges
      included.
    - Settings → Graphics: the level meter (js/ui/gfx-meter.js), Automatic,
      and the Fine-tune rows (built once from js/scene/quality.js's
      SETTINGS).
    - renderEvalOnly(): the evaluation bar alone, shown or hidden and turned
      with the board.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 23 of 26. Other modules import from it,
    for example:
        import { renderMatchbar, radio } from '../ui/panels.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, scene/renderer.js,
      scene/quality.js, app/state.js, game/engine.js, game/board-ui.js,
      game/play.js, game/flow.js, game/lines.js, coach/book.js,
      coach/notes.js, ui/analyze.js, ui/analyze-view.js, ui/crucible.js,
      ui/crucible-board.js, ui/crucible-view.js, ui/system-sheet.js,
      ui/studies.js, ui/gfx-meter.js and scene/pillars.js; globals Chess
      (js/core/chess.js), Monolith (js/core/monolith.js) and LEVELS
      (js/core/levels.js).
    - Shared state (js/app/store.js): sets app.calc; reads app.started,
      app.worldName, app.view, app.cpuThinking, app.orient, app.busy,
      app.setupOpen, app.rolling, app.hint and app.tierKey.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $, prefs } from '../app/base.js';
import { POST_OK } from '../scene/renderer.js';
import { describeFineTune, describeQuality, GFX_LEVELS, gfxRow, SETTINGS } from '../scene/quality.js';
import { buildMeter, renderMeter } from './gfx-meter.js';
import { pillars } from '../scene/pillars.js';
import {
  canMoveNow, cpuSide, cur, draft, game, GLYPH, KING_ICON, match, onRender, render, shown, SIDE,
  SIDE_COLOR, tip, TIP_IDS
} from '../app/state.js';
import { engine } from '../game/engine.js';
import { boardState, drawArrows, lineQuality, qCss, QUALITY } from '../game/board-ui.js';
import { levelNote, playMove, resultFor } from '../game/play.js';
import {
  analyzeExplores, analyzeGame, autoFlipOn, canOfferDraw, consultedAt, consultPlies, drawJudging, explore,
  exploreAvailable, exploreLine, exploreOrigin, exploreState, sandbox, showView, viewedPly
} from '../game/flow.js';
import { emptyCalc, evalView, pvToSan, scoreOf } from '../game/lines.js';
import { openingOf } from '../coach/book.js';
import { coach, coachMark, coachOn, coachSides } from '../coach/notes.js';
import { an, anSync } from './analyze.js';
import { renderAnalyze } from './analyze-view.js';
import { cr, crModel, pad2 } from './crucible.js';
import { boardOverride, renderCrMoves } from './crucible-board.js';
import { renderCrucible } from './crucible-view.js';
import { buildSystemSheet } from './system-sheet.js';
import { study } from './studies.js';

/* ---------- panel renderers ---------- */
// coaching line under "Your move": the castling tip when castling is open, else the select tip
function turnTip(st) {
  const k = Chess.kingSq(st.board, st.turn), c = Chess.legal(st, k).filter(m => m.castle);
  if (c.length && tip('castle')) {
    const names = c.map(m => m.castle === 'K' ? 'kingside (O-O)' : 'queenside (O-O-O)').join(' or ');
    return `You can castle ${names}. Select the king to see the blue castling lanes.`;
  }
  return tip('select') ? 'Select a piece, then a highlighted square.' : '';
}
export const radio = (el, on) => el.setAttribute('aria-checked', String(on));
/* Text that changes only when it differs, so a redraw does not replace an unchanged line. */
const setText = (el, t) => { if (el.textContent !== t) el.textContent = t; };
/* A list rebuilt only when what it shows has changed (sig), keeping the keyboard focus on the same
   item (data-key) across a rebuild. Rebuilding on every render dropped the focus after Enter and
   could swallow a click while Calculate moves redraws every 150 ms. */
function rebuildIf(el, sig, build) {
  if (el.dataset.sig === sig) return false;
  const a = document.activeElement, key = el.contains(a) && a.dataset.key;
  el.dataset.sig = sig; el.innerHTML = ''; build();
  if (key) { const t = [...el.querySelectorAll('[data-key]')].find(x => x.dataset.key === key); if (t) t.focus({ preventScroll: true }); }
  return true;
}

// stage: player cards, eval bar, review and setup chips
/* What `c` has taken: the opponent's pieces missing since the game's own starting position
   (a full set for a game from move one or a Crucible game, the set-up position's pieces for a
   study or a loaded FEN), so a set-up position shows no captures that never happened. */
function capturedBy(st, c) {
  const base = boardOverride ? null : Chess.material(game.states[0].board), m = Chess.material(st.board), opp = Chess.other(c);
  const initial = base ? base[opp] : { q: 1, r: 2, b: 2, n: 2, p: 8 };
  let glyphs = '', mine = 0, theirs = 0;
  for (const t of ['q', 'r', 'b', 'n', 'p']) { const missing = Math.max(0, (initial[t] || 0) - (m[opp][t] || 0)); glyphs += GLYPH[opp][t].repeat(missing); }
  for (const t in Chess.VAL) { mine += (m[c][t] || 0) * Chess.VAL[t]; theirs += (m[opp][t] || 0) * Chess.VAL[t]; }
  return { glyphs, adv: mine - theirs };
}
function playerName(c) {
  if (sandbox()) return { name: app.worldName === 'monolith' ? (c === 'w' ? 'White' : 'Black') : SIDE[c], sub: 'Free board' };
  if (app.started && game.title && game.title.players) return { name: game.title.players[c], sub: c === 'w' ? 'White' : 'Black' };
  const opp = app.started ? match.opponent : draft.opponent, human = app.started ? match.human : (draft.choice === 'r' ? null : draft.choice);
  if (opp === 'cpu') {
    if (human === null) return { name: SIDE[c], sub: 'You or Stockfish, decided by the die' };
    const lvl = LEVELS[(app.started ? match.level : draft.level) - 1];
    const side = app.worldName === 'monolith' ? (c === 'w' ? 'White' : 'Black') : SIDE[c];
    return c === human ? { name: 'You', sub: side } : { name: 'Stockfish', sub: `${side} · ${lvl.name}` };
  }
  return { name: app.worldName === 'monolith' ? (c === 'w' ? 'White' : 'Black') : SIDE[c], sub: c === 'w' ? 'Moves first' : 'Moves second' };
}
/* The match strip (see the CSS note at .matchbar). Every tab writes it from its own state. */
// looked up on first use: renderAnalyze and renderCrucible can run before this line has
function mbEls() { return mbEls.c || (mbEls.c = { bar: $('#matchbar'), title: $('#mb-title'), players: $('#mb-players'), move: $('#mb-move'), last: $('#mb-last') }); }
function mbSeg(el, k, v, sub, cls) {
  el.hidden = v === null || v === undefined || v === '';
  if (el.hidden) return;
  const kEl = el.querySelector('.mb-k'), vEl = el.querySelector('b'), sEl = el.querySelector('.mb-s');
  if (kEl) kEl.textContent = k; vEl.textContent = v;
  // a number (the move, a score, a count) reads larger; words keep the strip's text size; the last
  // segment's value is a number only as Analyze's evaluation (Play's last move stays text)
  if (el === mbEls().move) vEl.classList.toggle('num', /^[#\d½]/.test(String(v)));
  else if (el === mbEls().last) vEl.classList.toggle('num', prefs.tab === 'analyze' && /^(?:[+−#]|0\.00$)/.test(String(v)));
  if (sEl) { sEl.textContent = sub || ''; sEl.className = 'mb-s' + (cls ? ' ' + cls : ''); sEl.hidden = !sub; }
}
const sanLabel = (st, san) => `${st.fullmove}${st.turn === 'w' ? '.' : '…'}${san}`;
export function renderMatchbar() {
  const MBAR = mbEls(), tab = prefs.tab, mono = app.worldName === 'monolith';
  const sideName = c => mono ? (c === 'w' ? 'White' : 'Black') : SIDE[c];
  let title = null, players = null, move = null, last = null;
  if (tab === 'analyze') {
    const st = an.st || shown(), rec = an.source === 'recorded', s = an.stats, l1 = an.lines[0];
    // the recorded run's name to its players and year ('Kasparov – Topalov 1999'); the pane's
    // Reference card keeps the whole of it
    title = ['Analyze', rec ? an.meta.name.replace(/,[^,·]*?(\d{4})\b.*$/, ' $1') : explore.on ? 'Explored line' : game.title ? game.title.name : app.started ? (app.view !== null ? 'Earlier position' : 'Live game') : 'Board position'];
    move = ['Move', st.fullmove, an.status === 'over' ? String(an.reason || 'Game over').replace(/\.$/, '') : `${st.turn === 'w' ? 'White' : 'Black'} to move`];
    // the evaluation, the number a reader wants first, with the depth and the search's state
    const state = rec ? 'recorded' : an.status === 'searching' ? (an.infinite ? 'infinite' : 'searching') : an.status === 'stopped' ? 'stopped' : an.status === 'loading' ? 'engine loading' : '';
    last = ['Eval', l1 && an.status !== 'over' ? Monolith.fmtScore(Monolith.fromInfo(l1, st.turn)) : '—', [s.depth !== undefined ? `d${s.depth}` : '', state].filter(Boolean).join(' · '), an.status === 'searching' ? 'think' : ''];
  } else if (tab === 'crucible') {
    const m = crModel(), games = m && m.trace && m.trace.length ? m.trace[m.trace.length - 1].games : m ? m.games.filter(g => g && g.done).length : 0;
    title = ['Crucible', m ? `${m.config.A.name} vs ${m.config.B.name}` : cr.src === 'recorded' ? 'Recorded run' : 'Live run'];
    move = [m && m.mode === 'fixed' ? 'Pairs' : 'SPRT', m ? `${games} games` : '—', m ? (m.verdict ? `${m.verdict} accepted` : m.running ? 'running' : '') : '', m && m.verdict ? 'done' : m && m.running ? 'think' : ''];
    if (cr.view === 'board' && boardOverride && boardOverride.game) last = ['Game', `#${pad2(boardOverride.game.index)}`, `ply ${boardOverride.ply}`];
  } else if (sandbox()) {
    // before a game, moves tried on the free board
    const st = boardState();
    title = ['Free board', exploreLine(4) || 'Starting position'];
    move = ['Move', String(st.fullmove), `${sideName(st.turn)} to move`];
  } else if (!app.started) {
    // before a game: the game Start game will begin, from the Play tab's choices as they change
    const cpu = draft.opponent === 'cpu', die = cpu && draft.choice === 'r', L = LEVELS[draft.level - 1];
    const bot = { name: 'Stockfish', sub: `${L.name} · ${draft.level}/8` };
    const who = c => !cpu ? { name: sideName(c), sub: '' } : die ? (c === 'w' ? { name: 'You', sub: 'side by the die' } : bot) : c === draft.choice ? { name: 'You', sub: sideName(c) } : bot;
    players = { w: who('w'), b: who('b'), on: null, die };
    move = ['Game', 'Not started', ''];
  } else {
    const st = boardState(), live = app.view === null && !explore.on, cpu = match.opponent === 'cpu', r = game.result;
    const who = c => game.title && game.title.players ? { name: game.title.players[c], sub: '' } : cpu ? (c === match.human ? { name: 'You', sub: sideName(c) } : { name: 'Stockfish', sub: `${LEVELS[match.level - 1].name} · ${match.level}/8` }) : { name: sideName(c), sub: '' };
    players = { w: who('w'), b: who('b'), on: r && live ? null : st.turn };
    if (game.title) title = ['Game', game.title.name];
    if (r && live) move = ['Result', r.winner ? (r.winner === 'w' ? '1–0' : '0–1') : '½–½', r.text.split('. ')[0].replace(/\.$/, ''), 'done'];
    else if (explore.on) move = ['Exploring', `move ${st.fullmove}`, `${sideName(st.turn)} to move`];
    else if (!live) move = ['Viewing', `move ${st.fullmove}`, 'End returns to live'];
    else {
      const yours = !cpu || st.turn === match.human, chk = Chess.inCheck(st);
      move = ['Move', String(st.fullmove), app.cpuThinking ? 'Stockfish thinking' : chk ? (cpu ? (yours ? 'You are in check' : 'Stockfish in check') : `${sideName(st.turn)} in check`) : cpu ? (yours ? 'Your move' : 'Stockfish to move') : `${sideName(st.turn)} to move`, app.cpuThinking ? 'think' : chk ? 'check' : ''];
    }
    const em = explore.on && explore.sans.length, ply = viewedPly();
    if (em) last = ['Last', sanLabel(explore.states[explore.states.length - 2], explore.sans[explore.sans.length - 1])];
    else if (ply > 0) last = ['Last', sanLabel(game.states[ply - 1], game.sans[ply - 1])];
  }
  mbSeg(MBAR.title, ...(title || ['', null]));
  MBAR.players.hidden = !players; MBAR.players.classList.toggle('by-die', !!(players && players.die));
  if (players) for (const c of ['w', 'b']) {
    const el = $(`#mb-p-${c}`); el.querySelector('b').textContent = players[c].name; el.querySelector('small').textContent = players[c].sub;
    el.classList.toggle('on', players.on === c);
  }
  mbSeg(MBAR.move, ...(move || ['', null]));
  mbSeg(MBAR.last, ...(last || ['', null]));
  if (title === null && players === null && move === null) MBAR.bar.dataset.empty = ''; else delete MBAR.bar.dataset.empty;
}
export function renderEvalOnly() {
  const bar = $('#evalbar'); bar.hidden = !prefs.evalOn || !engine.ready || prefs.tab === 'analyze' || prefs.tab === 'crucible';
  bar.classList.toggle('flipped', app.orient === 'b');
  $('#evalbar-fill').style.height = evalView.pct.toFixed(1) + '%';
  $('#bestline').hidden = !prefs.evalOn;
  $('#bestline-score').textContent = evalView.depth ? `${evalView.label}  ·  depth ${evalView.depth}` : evalView.label;
  $('#bestline-moves').textContent = evalView.line;
}

// Coach (Play): the coach's notes, then the engine's own lines (evaluation bar, candidates)
const COACH_BADGE = { book: 'Book', best: 'Best', excellent: 'Excellent', good: 'Good', inaccuracy: 'Inaccuracy', mistake: 'Mistake', blunder: 'Blunder' };
const COACH_KEY_BADGE = { brilliant: 'Brilliant', only: 'Only move', foundMate: 'Mate found', foundMate1: 'Mate found', keepsMate: 'Mating', mated: 'Checkmate', allowedMate: 'Allows mate', allowedMate1: 'Allows mate', missedMate: 'Missed mate', missedMate1: 'Missed mate', missedWin: 'Missed win', lostAnyway: 'Forced mate' };
const coachQ = cls => QUALITY.find(q => q.key === ({ best: 'best', excellent: 'best', good: 'good', inaccuracy: 'inaccuracy', mistake: 'mistake', blunder: 'mistake' })[cls]) || QUALITY[1];
function coachNoteEl(n) {
  const li = document.createElement('li'); li.className = `cn ${n.kind}${n.alert ? ' alert' : ''}${n.cls ? ' c-' + n.cls : ''}`;
  if (n.kind === 'verdict' && n.cls !== 'book') li.style.setProperty('--cq', qCss(coachQ(n.cls)));
  const head = document.createElement('div'); head.className = 'cn-head';
  const badge = document.createElement('span'); badge.className = 'cn-badge';
  badge.textContent = n.kind === 'verdict' ? (COACH_KEY_BADGE[n.key] || COACH_BADGE[n.cls]) : n.kind === 'reply' ? n.who : n.kind === 'watch' ? (n.alert ? 'Watch' : n.chance ? 'Chance' : 'Your move') : n.kind === 'end' ? 'Game over' : 'Coach';
  if (n.chance) li.classList.add('chance');
  head.appendChild(badge);
  if (n.head) { const mv = document.createElement('b'); mv.className = 'cn-move'; mv.textContent = n.head; head.appendChild(mv); }
  if (n.score) { const sc = document.createElement('span'); sc.className = 'cn-score'; sc.textContent = Monolith.fmtScore(n.score); sc.title = 'The engine\'s evaluation after this move, from White\'s side'; head.appendChild(sc); }
  li.appendChild(head);
  for (const [cls, text] of [['cn-text', n.text], ['cn-extra', n.extra], ['cn-maxim', n.maxim]]) if (text) { const p = document.createElement('p'); p.className = cls; p.textContent = text; li.appendChild(p); }
  // a note's actions: a move to show on this board, or (tab) the game opened in Analyze there
  for (const a of n.actions || (n.action ? [n.action] : [])) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn text small cn-act'; b.dataset.key = `a${n.kind}${a.ply}${a.tab || ''}`; b.textContent = a.label; b.addEventListener('click', () => a.tab === 'analyze' ? analyzeGame() : showView(a.ply)); li.appendChild(b); }
  return li;
}

/* The free board's line in the move list, numbered as the game's are; it is not a record to step
   through, so its moves are plain text, the last one marked. */
function freeMoves(list) {
  const sans = explore.sans;
  if (!sans.length) { const e = document.createElement('span'); e.className = 'empty'; e.textContent = 'Try a move on the board; the moves show here.'; list.appendChild(e); return; }
  for (let i = 0; i < sans.length; i += 2) {
    const n = document.createElement('span'); n.className = 'num'; n.textContent = `${Math.floor(i / 2) + explore.base.fullmove}.`; list.appendChild(n);
    for (const j of [i, i + 1]) { const m = document.createElement('span'); if (sans[j]) { m.className = 'mv tried' + (j === sans.length - 1 ? ' cur' : ''); m.textContent = sans[j]; } list.appendChild(m); }
  }
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  // Settings → Graphics: the meter's five cells, each saying what its level draws on hover;
  // Fine-tune has one labelled row per setting, whose options are drawn below
  buildMeter();
  for (const b of document.querySelectorAll('[data-quality]')) b.title = `${GFX_LEVELS[b.dataset.quality].label}: ${GFX_LEVELS[b.dataset.quality].brief}`;
  $('#gfx-grid').replaceChildren(...SETTINGS.flatMap(S => {
    const l = document.createElement('label'), sel = document.createElement('select');
    l.htmlFor = sel.id = `gfx-${S.key}`; l.textContent = S.label; sel.className = 'select'; sel.dataset.gfx = S.key;
    return [l, sel];
  }));
  // every element carrying data-tip follows its tip; some also have conditions of their own
  onRender(() => { for (const el of document.querySelectorAll('[data-tip]')) if (el.id !== 'setup-chip') el.hidden = !tip(el.dataset.tip); });
  onRender(({ st, live }) => {
    const sides = { bottom: app.orient, top: Chess.other(app.orient) };
    const ex = explore.on, bs = ex ? boardState() : st;   // an explored line (the free board too) is what the cards describe
    for (const pos of ['top', 'bottom']) {
      const c = sides[pos], el = $(`#player-${pos}`), info = playerName(c), cap = capturedBy(bs, c);
      el.querySelector('.avatar').className = `avatar ${c}`; if (!el.querySelector('.avatar .king-icon')) el.querySelector('.avatar').innerHTML = KING_ICON;
      el.querySelector('.pn').textContent = info.name; el.querySelector('.psub').textContent = info.sub;
      const capEl = el.querySelector('.pcap'); capEl.textContent = cap.glyphs;
      if (cap.adv > 0) { const a = document.createElement('span'); a.className = 'adv'; a.textContent = `+${cap.adv}`; capEl.appendChild(a); }
      const state = el.querySelector('.pstate'); let txt = '', cls = 'pstate';
      const r = ex ? resultFor(bs) : live ? game.result : resultFor(st), on = app.started || ex;
      if (on && r) { if (r.winner === c) { txt = 'Won'; cls += ' won'; } else if (!r.winner) txt = 'Draw'; else txt = r.resigned === c ? 'Resigned' : 'Lost'; }
      // a draw offer being judged: the computer thinks on your turn
      else if (on && live && !ex && drawJudging() && c === cpuSide()) { txt = 'Thinking'; cls += ' think'; }
      else if (on && bs.turn === c) {
        if (live && !ex && app.cpuThinking && c === cpuSide()) { txt = 'Thinking'; cls += ' think'; }
        else if (Chess.inCheck(bs)) { txt = 'Check'; cls += ' check'; }
        else txt = live || ex ? 'To move' : 'Moved next';
        if (!cls.includes('think') && !cls.includes('check')) cls += ' turn';
      }
      state.textContent = txt; state.className = cls;
      el.classList.toggle('active', on && !r && bs.turn === c);
    }
    const mo = prefs.tab === 'analyze' || prefs.tab === 'crucible';
    for (const pos of ['top', 'bottom']) $(`#player-${pos}`).hidden = prefs.tab === 'crucible';
    $('#review-chip').hidden = app.view === null || prefs.tab === 'crucible' || explore.on;
    $('#explore-chip').hidden = !explore.on;
    if (explore.on) {
      // the free board before a game: Back is a reset, and Play from here makes the line a game
      const sb = sandbox(), back = $('#btn-explore-back');
      $('#explore-text').textContent = sb ? `Free board · ${explore.moves.length ? exploreLine() : 'pick a move'}` : `Exploring from ${exploreOrigin()} · ${explore.moves.length ? exploreLine() : 'pick a move'}`;
      $('#btn-explore-undo').disabled = app.busy;
      setText(back, sb ? 'Reset' : 'Back'); back.className = sb ? 'btn text' : 'btn filled';
      $('#btn-explore-play').hidden = !sb || !explore.moves.length;
    }
    if (app.view !== null) $('#review-text').textContent = app.view === 0 ? 'Viewing the starting position' : `Viewing move ${Math.ceil(app.view / 2)}${app.view % 2 ? '' : '…'} ${game.sans[app.view - 1]}`;
    $('#setup-chip').hidden = app.started || app.view !== null || !tip('start') || mo || explore.on;
    // before a game the board itself is the invitation (Move pieces on any board)
    if (!$('#setup-chip').hidden) setText($('#setup-chip'), prefs.explore !== false
      ? (prefs.tab === 'play' ? 'Try a move on the board, or start a game' : 'Try a move on the board, or start a game on the Play tab')
      : (prefs.tab === 'play' ? 'Choose your game, then press Start game' : 'Choose your game on the Play tab, then press Start game'));
    for (const el of document.querySelectorAll('.stage-hint')) if (mo) el.hidden = true;
    renderEvalOnly();
    drawArrows();
  });
  // MONOLITH workspaces, and the context line in the MONOLITH app bar
  onRender(() => {
    if (prefs.tab === 'analyze') anSync();
    renderAnalyze(); renderCrucible();
    $('#dock').hidden = !(prefs.tab === 'analyze' || (prefs.tab === 'crucible' && cr.view === 'board' && !!boardOverride));
    $('#split-dock').hidden = $('#dock').hidden;
    renderMatchbar();
  });

  // Play: setup form or in-game summary
  onRender(({ st, live }) => {
    const showSetup = app.setupOpen || !app.started;
    $('#setup').hidden = !showSetup; $('#ingame').hidden = showSetup;
    if (showSetup) {
      const cpu = draft.opponent === 'cpu';
      // Play from here: the game begins from the free board's line, its moves kept
      const from = !!(draft.from && sandbox() && explore.moves.length);
      $('#setup-from').hidden = !from; setText($('#setup-title'), from ? 'New game from this position' : 'New game');
      if (from) { setText($('#from-line'), exploreLine(12)); setText($('#from-help'), `${SIDE[exploreState().turn]} to move. The game keeps these moves, so Undo can take them back.`); }
      radio($('#opp-cpu'), cpu); radio($('#opp-human'), !cpu);
      $('#opp-cpu').disabled = engine.failed;
      $('#opp-help').textContent = cpu ? (engine.failed ? engine.status : 'Stockfish plays the other side.') : 'Two people take turns on this screen. Marble always moves first.';
      // two players with the board turning for each of them: there is no side at the bottom to choose
      const turns = !cpu && prefs.autoFlip !== false;
      setText($('#setup-intro-text'), cpu ? 'Pick your opponent and your pieces. Your pieces sit at the bottom of the board for the whole game.'
        : turns ? 'Pick your opponent. On one screen the board turns to whoever is to move.' : 'Pick your opponent and the side at the bottom. Flip board turns it at any time.');
      $('#side-legend').textContent = cpu ? 'Your pieces' : turns ? 'Board' : 'Side at the bottom of the board';
      $('#setup-autoflip-row').hidden = cpu; $('#setup-autoflip').checked = turns; $('.side-cards').hidden = turns;
      for (const s of ['w', 'b', 'r']) { radio($(`#side-${s}`), draft.choice === s); $(`#side-${s}`).disabled = app.rolling; }
      if (!app.rolling) $('#side-help').textContent = turns ? 'The board turns to whoever is to move. Marble moves first.' : draft.choice === 'r'
        ? (cpu ? 'The die decides when you press Start game: odd for marble, even for obsidian.' : 'The die decides which side sits at the bottom: odd for marble, even for obsidian.')
        : cpu ? `You play ${SIDE[draft.choice].toLowerCase()} (${SIDE_COLOR[draft.choice]}) and ${from ? (draft.choice === exploreState().turn ? 'move next' : 'Stockfish moves next') : draft.choice === 'w' ? 'make the first move' : 'Stockfish opens the game'}.`
              : `${SIDE[draft.choice]} sits at the bottom. Use Flip board at any time.`;
      $('#level-group').hidden = !cpu;
      const L = LEVELS[draft.level - 1];
      $('#level').value = draft.level; $('#level-out').textContent = L.name;
      $('#level-help').textContent = `Level ${draft.level} of 8. ${L.blurb}${levelNote(draft.level)}`;
      $('#btn-setup-cancel').hidden = !app.started;
      $('#btn-start').disabled = app.rolling || (cpu && !engine.ready);   // a failed engine leaves friend games only
      $('#btn-start').textContent = app.rolling ? 'Rolling…' : (cpu && !engine.ready && !engine.failed) ? 'Loading engine…' : app.started && game.sans.length && !game.result ? 'Start new game' : 'Start game';
      return;
    }
    const cpu = match.opponent === 'cpu', L = LEVELS[match.level - 1];
    const sc = study.cur;
    $('#game-kicker').textContent = game.result ? 'Game over' : !live ? 'Reviewing' : explore.on ? 'Exploring' : sc ? 'Study' : 'In play';
    $('#game-title').textContent = sc ? sc.s.title : game.title ? game.title.name : cpu ? 'You vs Stockfish' : 'Two players';
    $('#game-sub').textContent = sc ? `${sc.s.task} ${sc.s.mode === 'puzzle' ? 'A puzzle: the replies come from its line.' : 'Stockfish plays at full strength.'}` : game.title ? game.title.sub : cpu ? `You play ${(app.worldName === 'monolith' ? SIDE_COLOR[match.human] : SIDE[match.human].toLowerCase())} · ${L.name}, level ${match.level} of 8${match.choice === 'r' ? ' · side chosen by the die' : ''}` : 'Marble and obsidian on one screen';
    const r = game.result;
    $('#result').hidden = !r;
    if (r) {
      // from the player's side against the computer; a friend game names the winning side
      const mood = !r.winner ? 'draw' : !cpu || r.winner === match.human ? 'win' : 'loss';
      $('#result').className = `result ${mood}`;
      $('#result-kicker').textContent = !r.winner ? 'Draw' : cpu ? (mood === 'win' ? 'Victory' : 'Defeat') : `${SIDE[r.winner]} wins`;
      $('#result-text').textContent = cpu || !r.winner ? r.text : r.text.split('. ')[0].replace(/\.?$/, '.');   // friend games: the kicker names the winner
      // the other side next time, against the computer (or with the board staying put); a study has its own rematch
      const swap = $('#btn-rematch-swap'), other = Chess.other(match.human);
      swap.hidden = !!sc || !!game.title || (!cpu && autoFlipOn());
      if (!swap.hidden) setText(swap, cpu ? `Play ${app.worldName === 'monolith' ? SIDE_COLOR[other] : SIDE[other].toLowerCase()}` : 'Switch sides');
    }
    const banner = $('#turn-banner'); banner.hidden = !!r;
    const c = cur().turn, av = banner.querySelector('.avatar'); av.className = `avatar ${c}`; if (!av.querySelector('.king-icon')) av.innerHTML = KING_ICON;
    const yours = !cpu || c === match.human;
    $('#turn-title').textContent = drawJudging() ? 'Stockfish is considering your offer' : app.cpuThinking ? 'Stockfish is thinking' : cpu ? (yours ? 'Your move' : 'Stockfish to move') : `${SIDE[c]} to move`;
    $('#turn-move').textContent = r ? '' : `Move ${cur().fullmove}`;
    // the opening, by name, as the book knows it at the move on the board (custom positions have none)
    const op = game.title ? null : openingOf(viewedPly()), toEl = $('#turn-opening');
    toEl.hidden = !op;
    if (op) { $('#to-eco').textContent = op.eco; $('#to-name').textContent = op.name; toEl.title = `${op.eco} · ${op.name}`; }
    // the hint in steps: Hint → More help (the piece) → Show the move (the arrow) → Hide hint
    const pending = !!(app.hint && app.hint.pending), showing = !!(app.hint && !app.hint.pending && app.hint.state === cur());
    $('#turn-sub').textContent = !live ? 'You are viewing an earlier move. Press Back to live to continue.'
      : showing && app.hint.steps ? app.hint.steps.slice(0, app.hint.level).filter(Boolean).join(' ')
      : Chess.inCheck(cur()) ? 'Your king is in check.'.replace('Your', cpu && !yours ? 'Its' : cpu ? 'Your' : `The ${SIDE[c].toLowerCase()}`)
      : yours ? turnTip(cur()) : '';
    $('#btn-hint').disabled = pending || (!showing && (!canMoveNow() || !engine.ready));
    $('#hint-label').textContent = pending ? 'Thinking…' : !showing ? 'Hint' : app.hint.level === 1 ? 'More help' : app.hint.level === 2 ? 'Show the move' : 'Hide hint';
    $('#btn-hint').setAttribute('aria-pressed', String(showing));
    $('#btn-hint').title = !showing ? 'A nudge first; press again for the piece, then the move' : app.hint.level < 3 ? 'One more step of help' : 'Hide the hint';
    $('#btn-undo').disabled = app.busy || game.states.length < 2;
    $('#btn-resign').disabled = !!r || app.busy;
    /* a draw by agreement: two players on one screen, or against the computer on your turn (2.18.0);
       the wait after the computer declined leaves it enabled, and a click names the move it ends at */
    const dr = $('#btn-draw'), drOk = canOfferDraw();
    dr.hidden = !!sc || !!game.title;
    dr.disabled = !!r || app.busy || (cpu && (app.cpuThinking || c !== match.human || !engine.ready));
    dr.title = !cpu ? 'Offer a draw: the other player agrees or plays on' : drOk === true ? 'Offer a draw: Stockfish judges the position, then agrees or plays on' : drOk;
    // strength can change mid-game; Stockfish reads the level when it starts each move
    $('#live-level-group').hidden = !cpu || !!sc;   // a study plays at its own strength
    // two players: the board's turn for each of them, switched here where it is used
    const bd = !cpu && !sc && !game.title, turns = prefs.autoFlip !== false;
    $('#board-group').hidden = !bd;
    if (bd) { $('#live-autoflip').checked = turns; setText($('#board-help'), turns ? 'After each move, the side to move comes to the bottom. Flip board turns it for this move only.' : 'The board stays where it is. Flip board turns it.'); }
    if (cpu) {
      $('#level-live').value = match.level; $('#live-level-out').textContent = L.name;
      $('#live-level-help').textContent = `Level ${match.level} of 8. ${L.blurb}${levelNote(match.level)}${app.cpuThinking ? ' A change applies from Stockfish\'s next move.' : ''}`;
    }
  });
  onRender(() => {
    const feed = $('#coach-feed'), on = coachOn();
    $('#coach-switch').checked = on;
    feed.hidden = !on || !app.started;
    if (feed.hidden) { feed.innerHTML = ''; feed.dataset.sig = ''; return; }
    const vp = viewedPly(), last = game.states.length - 1, st = game.states[vp], n = st && coach.notes.get(st), items = [];
    if (n && n.end && vp === last) items.push(n.end);
    if (vp === last && !game.result && !explore.on && n && n.watch) items.push(n.watch);
    if (coach.busy && vp === last) items.push({ kind: 'busy', text: `Looking at ${coach.busy}…` });
    if (n && n.move) items.push(n.move);
    const prev = vp >= 1 && vp - 1 >= 1 ? coach.notes.get(game.states[vp - 1]) : null;
    if (prev && prev.move && (!n || !n.move || n.move.kind === 'reply')) items.push(prev.move);
    if (!items.length) {
      const E = coach.eng;
      items.push({ kind: 'idle', text: !coachSides().length ? 'The Coach comments on games you play here.' : E && E.failed ? 'The Coach\'s engine could not start here. Hints and the engine lines below still work.' : E && !E.ready ? 'The Coach is getting its engine ready…' : 'Play a move: the Coach reads each one and tells you what it does.' });
    }
    const shown_ = items.slice(0, 3);
    const noteSig = n => [n.kind, n.cls, n.key, n.alert, n.chance, n.who, n.head, n.score && Monolith.fmtScore(n.score), n.text, n.extra, n.maxim, (n.actions || [n.action]).filter(Boolean).map(a => a.ply + (a.tab || '')).join()].join('|');
    rebuildIf(feed, shown_.map(noteSig).join('\n'), () => { for (const it of shown_) feed.appendChild(coachNoteEl(it)); });
  });
  onRender(({ st }) => {
    const on = engine.ready;
    $('#eval-switch').checked = prefs.evalOn; $('#eval-switch').disabled = !on;
    $('#lines').value = String(prefs.lines);
    $('#btn-calc').disabled = !on || !!resultFor(st) || app.cpuThinking || app.busy || app.calc.running;
    const foot = $('#engine-foot'); foot.className = 'engine-foot' + (engine.ready ? ' ok' : engine.failed ? ' err' : '');
    $('#engine-state').textContent = engine.status;
    const note = $('#calc-note'), list = $('#cands');
    const mine = app.calc.state === st;
    const coach = tip('calc');
    note.textContent = !mine ? (coach ? 'Shows the engine\'s best moves as arrows on the board.' : '')
      : app.calc.running ? `Calculating… depth ${app.calc.depth || 1}` : `Top ${app.calc.lines.filter(Boolean).length} at depth ${app.calc.depth}.${coach ? ' Select a line to isolate its arrow.' : ''}`;
    list.hidden = !mine || !app.calc.lines.some(Boolean);
    if (list.hidden) { list.innerHTML = ''; list.dataset.sig = ''; return; }
    const grades = lineQuality(app.calc.lines), playable = canMoveNow() && st === cur();
    const sig = JSON.stringify([app.calc.lines.map(l => l && [l.pv.slice(0, 12).join(' '), scoreOf(l, st).label]), grades.map(g => g && g.key), app.calc.active, playable]);
    rebuildIf(list, sig, () => app.calc.lines.forEach((inf, i) => {
      if (!inf) return;
      const q = grades[i];
      const li = document.createElement('li'); li.className = `cand q-${q.key}` + (app.calc.active === i ? ' active' : ''); li.tabIndex = 0; li.dataset.key = `c${i}`;
      li.style.setProperty('--q', qCss(q));
      li.setAttribute('aria-pressed', String(app.calc.active === i));
      const sw = document.createElement('span'); sw.className = 'grade'; sw.textContent = q.label;
      sw.title = i === 0 ? 'The engine\'s top move' : q.loss < 1 ? 'As strong as the top move' : `${(q.loss / 100).toFixed(2)} pawns weaker than the top move`;
      const sc = document.createElement('span'); sc.className = 'score'; sc.textContent = scoreOf(inf, st).label;
      const ln = document.createElement('span'); ln.className = 'line'; ln.textContent = pvToSan(st, inf.pv, 6); ln.title = pvToSan(st, inf.pv, 12);
      const play = document.createElement('button'); play.className = 'btn tonal small'; play.textContent = 'Play'; play.dataset.key = `p${i}`;
      play.disabled = !playable;
      play.title = play.disabled ? 'Available on your turn at the live position' : 'Play this move';
      play.addEventListener('click', ev => { ev.stopPropagation(); const mv = Chess.fromUci(st, inf.pv[0]); if (mv && canMoveNow()) { app.calc = emptyCalc(); playMove(mv); } });
      li.append(sw, sc, ln, play);
      const focus = () => { app.calc.active = app.calc.active === i ? -1 : i; render(); };
      li.addEventListener('click', focus); li.addEventListener('keydown', ev => { if (ev.target === li && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); focus(); } });
      list.appendChild(li);
    }));
  });

  // Settings
  onRender(() => {
    $('#set-sound').checked = prefs.sound; $('#set-legal').checked = prefs.legal; $('#set-explore').checked = prefs.explore !== false; $('#set-coords').checked = prefs.coords;
    $('#set-an-explore').checked = prefs.analyzeExplore !== false;
    $('#set-autoflip').checked = prefs.autoFlip !== false;
    $('#set-coach').checked = coachOn(); $('#set-eval').checked = prefs.evalOn; $('#set-eval').disabled = !engine.ready;
    for (const b of document.querySelectorAll('[data-speed]')) radio(b, b.dataset.speed === prefs.speed);
    for (const b of document.querySelectorAll('[data-tips]')) radio(b, b.dataset.tips === prefs.tips);
    const learnedCount = TIP_IDS.filter(id => prefs.learned[id]).length;
    $('#tips-help').textContent = prefs.tips === 'once' ? 'Each tip disappears once you have done what it describes.'
      : prefs.tips === 'always' ? 'Tips stay on screen.' : 'No tips. Status messages such as check still show.';
    $('#btn-tips-reset').hidden = prefs.tips !== 'once' || !learnedCount;
    for (const b of document.querySelectorAll('[data-world]')) radio(b, b.dataset.world === prefs.world);
    $('#world-help').textContent = prefs.world === 'auto' ? `Follows the destination: MONOLITH for Analyze and Crucible, the cathedral for the rest. Now: ${app.worldName === 'monolith' ? 'MONOLITH' : 'cathedral'}.`
      : prefs.world === 'monolith' ? 'MONOLITH everywhere: solved tokens, mirror floor, cool rim light; colour is semantic only.' : 'The cathedral everywhere, Analyze and Crucible included.';
    const sbg = $('#set-badges'); if (sbg) sbg.checked = prefs.badges === 'short';
    for (const b of document.querySelectorAll('[data-pillars]')) radio(b, b.dataset.pillars === pillars.style);
    $('#pillars-help').textContent = (pillars.style === 'classic' ? 'A twisted Solomonic column between a fluted Doric and a plain Tuscan.' : pillars.style === 'modern' ? 'A Prism lit by spiralling cyan lines, between a ringed Halo and a bladed Fin.' : 'The stele, the rift and the spire, each made for its place.')
      + ' Dennis\'s Blender models, seen in MONOLITH.' + (pillars.status === 'loading' ? ' Loading…' : pillars.status === 'failed' ? ` ${pillars.failed.length === 1 ? 'One model' : 'Some models'} could not load here, so the built pillars stand in.` : '');
    // Graphics: Automatic, the level in use on the meter, and Fine-tune showing what it draws
    $('#set-gfx-auto').checked = prefs.quality === 'auto';
    for (const b of document.querySelectorAll('[data-quality]')) { radio(b, b.dataset.quality === app.tierKey); b.disabled = GFX_LEVELS[b.dataset.quality].set.hdr && !POST_OK; }
    renderMeter();
    setText($('#quality-help'), describeQuality());
    for (const S of SETTINGS) {
      const sel = $(`#gfx-${S.key}`), row = gfxRow(S.key), sig = row.opts.map(o => o[1]).join('|');
      if (sel.dataset.sig !== sig) { sel.replaceChildren(...row.opts.map(([, label], i) => new Option(label, String(i)))); sel.dataset.sig = sig; }
      sel.value = String(row.index); sel.disabled = row.disabled;
    }
    setText($('#gfx-fine-help'), describeFineTune());
    if (!$('#swatches').childElementCount) buildSystemSheet();
    const sb = $('#btn-sound'); sb.setAttribute('aria-pressed', String(prefs.sound)); sb.setAttribute('aria-label', prefs.sound ? 'Sound on' : 'Sound off'); sb.title = prefs.sound ? 'Sound on' : 'Sound off';
    $('#ico-sound').setAttribute('d', prefs.sound
      ? 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z'
      : 'M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z');
  });

  // Moves card
  onRender(() => {
    // a Crucible game on the board lists its own moves: the card is never folded then (no game may
    // have started), and the box's Play button goes with its input, which renderCrMoves() disables
    if (boardOverride) { renderCrMoves(); $('#move-form button').disabled = $('#move-input').disabled; $('.moves-card').removeAttribute('data-idle'); return; }
    const list = $('#moves'), vp = viewedPly(), sb = sandbox(), tryOn = prefs.explore !== false;
    const marks = game.sans.map((_, j) => coachOn() ? coachMark(j + 1) : '');
    const used = consultPlies(), mono = app.worldName === 'monolith';   // moves made after using Analyze (a two-player game)
    const rebuilt = rebuildIf(list, JSON.stringify([app.started, game.states[0] && game.states[0].fullmove, game.sans, marks, used, mono, vp, sb && explore.sans, tryOn]), () => {
    if (sb) return freeMoves(list);
    if (!game.sans.length) { const e = document.createElement('span'); e.className = 'empty'; e.textContent = app.started ? 'No moves yet.' : tryOn ? 'Try a move on the board; the moves show here.' : 'Moves appear here once the game starts.'; list.appendChild(e); }
    for (let i = 0; i < game.sans.length; i += 2) {
      const n = document.createElement('span'); n.className = 'num'; n.textContent = `${Math.floor(i / 2) + game.states[0].fullmove}.`; list.appendChild(n);
      for (const j of [i, i + 1]) {
        const s = document.createElement('span');
        if (game.sans[j]) {
          s.className = 'mv' + (j + 1 === vp ? ' cur' : ''); s.textContent = game.sans[j]; s.tabIndex = 0; s.setAttribute('role', 'button'); s.dataset.key = `m${j}`;
          const mark = marks[j];
          if (mark) { const mk = document.createElement('sup'); mk.className = `mk mk-${mark === '!!' ? 'brilliant' : mark === '!' ? 'good' : mark === '?!' ? 'inaccuracy' : mark === '?' ? 'mistake' : 'blunder'}`; mk.textContent = mark; s.appendChild(mk); }
          // the side that played it used Analyze first: the Analyze icon, with who in its title
          const who = consultedAt(j) ? (mono ? (game.states[j].turn === 'w' ? 'White' : 'Black') : SIDE[game.states[j].turn]) : '';
          if (who) { const ub = document.createElement('span'); ub.className = 'mk-consult'; ub.title = `${who} looked at the engine (Analyze) before this move`; ub.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>'; s.appendChild(ub); }
          s.setAttribute('aria-label', `Show the position after ${game.sans[j]}${mark ? `, marked ${mark}` : ''}${who ? `, ${who} used Analyze before it` : ''}`);
          const go = () => showView(j + 1);
          s.addEventListener('click', go); s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
        }
        list.appendChild(s);
      }
    }
    });
    /* The move in view is kept visible by scrolling the list itself, and only when it changed:
       scrollIntoView also scrolled the whole panel on phones, pulling it down to the move list on
       every render. A phone's one-row strip (css/media.css) scrolls sideways. */
    const curEl = rebuilt && list.querySelector('.cur');
    if (curEl) { const r = curEl.getBoundingClientRect(), b = list.getBoundingClientRect(); if (r.top < b.top) list.scrollTop -= b.top - r.top; else if (r.bottom > b.bottom) list.scrollTop += r.bottom - b.bottom; if (r.left < b.left) list.scrollLeft -= b.left - r.left; else if (r.right > b.right) list.scrollLeft += r.right - b.right; }
    else if (rebuilt) list.scrollTop = list.scrollLeft = 0;   // the first position: the list's start
    const at = vp, last = game.states.length - 1;
    // on the free board First resets the line and Previous takes a move back; there is nothing ahead
    $('#nav-first').disabled = (!sb && at === 0) || app.busy; $('#nav-prev').disabled = (!sb && at === 0) || app.busy;
    $('#nav-next').disabled = sb || at >= last || app.busy; $('#nav-last').disabled = sb || at >= last || app.busy;
    // a typed move goes where a click would: the line on the board, Analyze at the live position
    // (Explore in Analyze), the game on your turn, else a line on a board the game does not own
    const typeTry = explore.on || analyzeExplores() || (!canMoveNow() && tryOn && exploreAvailable());
    $('#move-input').disabled = $('#move-form button').disabled = !canMoveNow() && !typeTry;
    $('#move-input').placeholder = typeTry ? 'Try a move: e4, Nf3' : canMoveNow() ? 'e2e4, Nf3 or O-O' : !app.started ? 'Start a game first' : app.view !== null ? 'Back to live to move' : game.result ? 'The game is over' : drawJudging() ? 'Stockfish is considering your offer' : 'Waiting for the reply';
    // with nothing to list (no game, no line tried, no Crucible game on the board) the card folds
    // to its head (css/workspace.css)
    $('.moves-card').toggleAttribute('data-idle', !app.started && !explore.on && !boardOverride);
  });
}
