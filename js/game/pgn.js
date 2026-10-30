/*
✒ Metadata
    - Title: Game Records (MONOLITH Edition - v1.0)
    - File Name: pgn.js
    - Relative Path: js/game/pgn.js
    - Artifact Type: javascript
    - Version: 1.0.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, with 2.18.0: the game written out as PGN (copied or
      downloaded), a PGN or a FEN read back in as a game, and the FEN of
      the board on screen copied.

✒ Description:
    The game as a record other chess software reads: PGN out, PGN (or a
    FEN) in. A game played here can be taken to another site or kept as a
    file, and a game from elsewhere can be pasted in to review, analyse or
    play on from.

✒ Key Features:
    - gamePgn(): the seven standard tags, SetUp and FEN for a game that
      began part-way, the moves numbered from where it began (12... when
      Black moved first), how it ended as a comment, wrapped at 80 columns.
    - parsePgn(): reads the tags, skips comments, variations, NAGs, move
      numbers and annotation marks, and replays the moves; an error names
      the first move that is not legal, with its number.
    - Moves written with more than SAN needs (Nbd7 where Nd7 is enough,
      e2e4, castling with zeros) are still read.
    - A bare FEN pasted in its place is read as a game from that position.
    - loadPgn(): the record begins a game with the setup's choices, asking
      first when a game is in progress; a decided result in the record
      ends the game there.
    - copyPgn(), downloadPgn() and copyFen(), with a copy that still works
      where the clipboard API is missing.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it, for example:
        import { copyPgn, parsePgn } from '../game/pgn.js';
        const r = parsePgn(text);   // { states, moves, sans, tags, result } or { error }

✒ Examples:
    gamePgn() after 1. e4 e5 2. Nf3 against the computer at level 4:
        [Event "MONOLITH game"] … [White "You"] [Black "Stockfish (Club,
        level 4)"] [Result "*"], then "1. e4 e5 2. Nf3 *".
    parsePgn('1. e4 e5 2. Nf3 {a comment} (2. f4) Nc6 3. Bb5 a6 1-0')
        gives six moves and the result 1-0.
    parsePgn('1. e4 e5 2. Ke3') gives { error: 'Move 2. Ke3 is not legal
        here.' }.

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, app/state.js,
      ui/snackbar.js, game/input.js, game/flow.js and ui/studies.js; globals
      Chess (js/core/chess.js) and LEVELS (js/core/levels.js).
    - Shared state (js/app/store.js): reads app.started.
    - The PGN Date tag is YYYY.MM.DD, the format PGN requires; the
      downloaded file is named monolith-YYYY-MM-DD.pgn.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $ } from '../app/base.js';
import { game, match, SIDE } from '../app/state.js';
import { snack } from '../ui/snackbar.js';
import { boardState } from './board-ui.js';
import { sanMove } from './input.js';
import { openSetup, startGame } from './flow.js';
import { study } from '../ui/studies.js';

/* ---------- PGN out ---------- */
export const resultToken = r => !r ? '*' : r.winner === 'w' ? '1-0' : r.winner === 'b' ? '0-1' : '1/2-1/2';
const tagLine = (k, v) => `[${k} "${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;
// the players as the page names them: the loaded game's own names, You and Stockfish, or the two sides
function players() {
  if (game.title && game.title.players) return game.title.players;
  if (match.opponent !== 'cpu') return { w: SIDE.w, b: SIDE.b };
  const L = LEVELS[match.level - 1], bot = `Stockfish (${L.name}, level ${match.level})`;
  return match.human === 'w' ? { w: 'You', b: bot } : { w: bot, b: 'You' };
}
const ymd = (d, sep) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join(sep);
export function gamePgn(now = new Date()) {
  const s0 = game.states[0], p = players(), res = resultToken(game.result);
  const tags = [['Event', study.cur ? study.cur.s.title : game.title ? game.title.name : 'MONOLITH game'], ['Site', 'MONOLITH'], ['Date', ymd(now, '.')], ['Round', '-'], ['White', p.w], ['Black', p.b], ['Result', res]];
  if (Chess.fen(s0) !== Chess.fen(Chess.newGame())) tags.push(['SetUp', '1'], ['FEN', Chess.fen(s0)]);
  // the move number stays with its move, so a line never breaks between them
  const words = []; let num = s0.fullmove, turn = s0.turn;
  game.sans.forEach((san, i) => { words.push(turn === 'w' ? `${num}. ${san}` : i === 0 ? `${num}... ${san}` : san); if (turn === 'b') num++; turn = turn === 'w' ? 'b' : 'w'; });
  if (game.result) words.push(`{${game.result.text.replace(/[{}]/g, '')}}`);
  words.push(res);
  const lines = []; let line = '';
  for (const w of words) { if (line && line.length + 1 + w.length > 80) { lines.push(line); line = w; } else line = line ? `${line} ${w}` : w; }
  lines.push(line);
  return `${tags.map(([k, v]) => tagLine(k, v)).join('\n')}\n\n${lines.join('\n')}\n`;
}

/* ---------- PGN in ---------- */
const RESULT = /^(1-0|0-1|1\/2-1\/2|½-½|\*)$/;
/* A move written with more than SAN needs: a disambiguation SAN would leave out (Nbd7), long
   algebraic (e2e4), a promotion without its = sign, castling with zeros. One legal move must
   fit, or it is not read. */
function looseMove(st, tok) {
  const s = tok.replace(/[+#]/g, '').replace(/0/g, 'O');
  if (/^O-O(-O)?$/.test(s)) return sanMove(st, s);
  const m = /^([KQRBN])?([a-h])?([1-8])?[x-]?([a-h][1-8])=?([QRBNqrbn])?$/.exec(s); if (!m) return null;
  const [, pc, f, r, to, promo] = m, kind = pc ? pc.toLowerCase() : 'p';
  const hits = Chess.allLegal(st).filter(c => { const from = Chess.sqName(c.from); return st.board[c.from].t === kind && Chess.sqName(c.to) === to && (!f || from[0] === f) && (!r || from[1] === r); });
  if (hits.length !== 1) return null;
  return hits[0].needsPromo ? Object.assign({}, hits[0], { promo: promo ? promo.toLowerCase() : 'q', needsPromo: false }) : hits[0];
}
/* The record as { start, states, moves, sans, tags, result }, or { error } in plain words. The
   result is the Result tag's (null for * or none); the moves replay from the FEN tag, or from the
   starting position. */
export function parsePgn(text) {
  const src = String(text || '').trim();
  if (!src) return { error: 'Paste a game in PGN, or a FEN, first.' };
  if (!src.includes('[')) { const f = Chess.parseFen(src); if (!f.error) return { start: f.state, states: [f.state], moves: [], sans: [], tags: {}, result: null }; }
  const tags = {}, TAG = /\[\s*([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\s*\]/g;
  for (const m of src.matchAll(TAG)) tags[m[1]] = m[2].replace(/\\(.)/g, '$1');
  let body = src.replace(TAG, ' ').replace(/\{[^}]*\}/g, ' ').replace(/;[^\n]*/g, ' '), was;
  do { was = body; body = body.replace(/\([^()]*\)/g, ' '); } while (body !== was);   // variations, innermost first
  body = body.replace(/\$\d+/g, ' ').replace(/\d+\s*(\.|…)+/g, ' ');
  const toks = body.split(/\s+/).filter(t => t && !RESULT.test(t));
  let start = Chess.newGame();
  if (tags.FEN) { const f = Chess.parseFen(tags.FEN); if (f.error) return { error: `The record's starting position (its FEN tag) does not read: ${f.error}` }; start = f.state; }
  if (!toks.length && !tags.FEN) return { error: 'No moves found. Paste a game in PGN, such as 1. e4 e5 2. Nf3, or a FEN.' };
  const states = [start], moves = [], sans = [];
  for (const tok of toks) {
    const st = states[states.length - 1], t = tok.replace(/[!?]+$/, ''), mv = sanMove(st, t) || looseMove(st, t);
    if (!mv) return { error: `Move ${st.fullmove}${st.turn === 'w' ? '.' : '...'} ${tok} is not legal here.` };
    const nx = Chess.apply(st, mv); moves.push(mv); sans.push(Chess.san(st, mv, nx)); states.push(nx);
  }
  const rt = tags.Result || (RESULT.exec(body.trim().split(/\s+/).pop() || '') || [])[0];
  const winner = rt === '1-0' ? 'w' : rt === '0-1' ? 'b' : null, decided = rt === '1-0' || rt === '0-1' || rt === '1/2-1/2' || rt === '½-½';
  return { start, states, moves, sans, tags, result: decided ? { text: winner ? `${SIDE[winner]} wins. The game ended here.` : 'Draw. The game ended here.', winner, recorded: true } : null };
}
/* A record from the Load a game box (or the palette) begins a game with the choices on the setup
   card; a game in progress is not ended without asking. */
export function loadPgn(text) {
  const r = parsePgn(text), note = $('#pgn-note'); note.dataset.help ||= note.textContent;   // the card's own help, back once the game loads
  const say = (t, err) => { note.className = err ? 'help err' : 'help'; note.textContent = t; };
  if (r.error) { say(r.error, true); return; }
  const go = () => { say(note.dataset.help); $('#pgn-box').value = ''; $('#pgn-load').open = false; startGame(null, null, { states: r.states, moves: r.moves, sans: r.sans, result: r.result }); };
  if (app.started && game.sans.length && !game.result) snack('Load this game? The current one ends.', [{ label: 'Keep playing', act: () => {} }, { label: 'Load it', filled: true, act: go }], true);
  else go();
}

/* ---------- copy and download ---------- */
/* Without the clipboard API (a page served over plain http, an older browser): the copy command
   on a hidden field of its own; where that is refused too, say how else to get it. */
function copyOut(text, what, refused) {
  const done = () => snack(`${what} copied to the clipboard.`);
  const fallback = () => {
    const back = document.activeElement, ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true'); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove(); if (back && back.focus) back.focus({ preventScroll: true });
    if (ok) done(); else snack(refused, [{ label: 'Done', act: () => {} }], true);
  };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
}
export function copyPgn() { copyOut(gamePgn(), 'PGN', 'This browser refused the copy. Download PGN saves the game as a file instead.'); }
export function copyFen() { const f = Chess.fen(boardState()); copyOut(f, 'FEN', `This browser refused the copy. The FEN: ${f}`); }
export function downloadPgn() {
  const url = URL.createObjectURL(new Blob([gamePgn()], { type: 'application/x-chess-pgn' })), a = document.createElement('a');
  a.href = url; a.download = `monolith-${ymd(new Date(), '-')}.pgn`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// the setup with Load a game open (it scrolls itself into view as it opens), the box ready to paste into
export function openPgnLoad() { openSetup(); $('#pgn-load').open = true; $('#pgn-box').focus({ preventScroll: true }); }
