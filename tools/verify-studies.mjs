#!/usr/bin/env node
/*
✒ Metadata
    - Title: Study Verifier (MONOLITH Edition - v1.1)
    - File Name: verify-studies.mjs
    - Relative Path: tools/verify-studies.mjs
    - Artifact Type: javascript
    - Version: 1.1.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Under the
      app's new name, MONOLITH, which Dennis chose, it looks for index.html
      before an older wizards-chess.html.
    - 1.1.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      the separation of concerns Dennis asked for, the rules and the
      studies are files of their own: it loads js/core/chess.js and
      js/data/studies.js, and still reads a single-file page if given one.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, written with the Position tab's studies at Dennis's request,
      so every study can be checked again whenever one is added or edited.

✒ Description:
    Checks every study against the vendored Stockfish 19. It loads the
    STUDIES dataset (js/data/studies.js) and the rules engine
    (js/core/chess.js) the page itself loads, so it tests exactly what
    ships. A puzzle
    passes when each of your moves is the engine's unique best and the
    line ends as its goal says; a practice game passes when the engine's
    evaluation matches its goal (a win for mate and promote, a draw for
    hold); a set-up passes when its FEN is a legal position.

✒ Key Features:
    - Puzzles: your moves must be the engine's best, with every other move
      clearly worse (no other mate as short; otherwise 2.00 pawns or more
      behind); replies are reported beside the engine's best defence.
    - Mate puzzles must end in mate; the last move may be any mate.
    - Practice: mate and promote need a winning evaluation for your side
      (+3.00 or a mate), hold a drawn one (no worse than −0.50); a mate
      drill's par must be Stockfish's quickest mate: go mate par finds it,
      go mate par−1 finds nothing shorter.
    - Options: --depth N (default 20), --only id[,id], --help.
    - Exit code 1 when any study fails, so it can gate a release.

✒ Other Important Information:
    - Usage: in the project folder (the one that holds js/ and engine/),
      run node tools/verify-studies.mjs. A copy without js/ falls back to
      the script blocks of a single-file page (wizards-chess.html or
      index.html, 2.4.0 and earlier).
    - Dependencies: Node.js 18 or newer; the vendored engine in engine/.
    - Compatible platforms: Windows, macOS and Linux.
    - A run takes a few minutes at depth 20 (each par check allows 30 s);
      deeper is slower and surer.
---------
*/
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (args.includes('--help')) { console.log('node tools/verify-studies.mjs [--depth 20] [--only id,id]'); process.exit(0); }
const DEPTH = +(opt('--depth') || 20), ONLY = opt('--only') ? opt('--only').split(',') : null;

// the rules engine and the studies, from the files the page loads (js/core, js/data); a copy
// from before the split (2.4.0 and earlier) has them as script blocks in the page instead
const require = createRequire(import.meta.url);
const CORE = path.join(ROOT, 'js', 'core', 'chess.js'), DATA = path.join(ROOT, 'js', 'data', 'studies.js');
let Chess, STUDIES;
if (fs.existsSync(CORE) && fs.existsSync(DATA)) { Chess = require(CORE); STUDIES = require(DATA); }
else {
  const pageFile = ['index.html', 'wizards-chess.html'].map(f => path.join(ROOT, f)).find(f => fs.existsSync(f));
  if (!pageFile) { console.error('No js/core/chess.js and js/data/studies.js, and no single-file page, beside the tools folder.'); process.exit(2); }
  const page = fs.readFileSync(pageFile, 'utf8');
  const block = id => { const m = new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`).exec(page); if (!m) throw new Error(`no script ${id} in the page`); return m[1]; };
  const mod = { exports: null }; new Function('module', block('engine'))(mod); Chess = mod.exports;
  STUDIES = new Function(`${block('studies')}; return STUDIES;`)();
}

// a UCI driver for the vendored Stockfish
function engine() {
  const p = spawn(process.execPath, [path.join(ROOT, 'engine', 'stockfish-19-lite-single.js')], { stdio: ['pipe', 'pipe', 'inherit'] });
  let buf = '', waiters = [];
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); for (const w of waiters.slice()) w(line); } });
  const send = s => p.stdin.write(s + '\n');
  const until = pred => new Promise(res => { const w = line => { if (pred(line)) { waiters = waiters.filter(x => x !== w); res(line); } }; waiters.push(w); });
  return {
    async init() { send('uci'); await until(l => l === 'uciok'); send('setoption name Hash value 64'); send('isready'); await until(l => l === 'readyok'); },
    async search(fen, moves, multipv = 3) {
      send(`setoption name MultiPV value ${multipv}`); send('isready'); await until(l => l === 'readyok');
      send(`position fen ${fen}${moves.length ? ' moves ' + moves.join(' ') : ''}`);
      const lines = [];
      const w = line => { const m = /^info .*\bdepth (\d+) .*multipv (\d+) .*score (cp|mate) (-?\d+)(?: (lowerbound|upperbound))? .*\bpv (.+)$/.exec(line); if (m && !m[5]) lines[+m[2] - 1] = { kind: m[3], value: +m[4], pv: m[6].split(' ') }; };
      waiters.push(w); send(`go depth ${DEPTH}`); await until(l => l.startsWith('bestmove')); waiters = waiters.filter(x => x !== w);
      return lines.filter(Boolean);
    },
    // go mate n: the mate distance the engine finds when asked for a mate in n or less (null: none)
    async mate(fen, n, ms = 30000) {
      send('ucinewgame'); send('isready'); await until(l => l === 'readyok');
      send(`setoption name MultiPV value 1`); send(`position fen ${fen}`); let found = null;
      const w = line => { const m = / score mate (\d+) /.exec(line); if (m) found = +m[1]; };
      waiters.push(w); send(`go mate ${n} movetime ${ms}`); await until(l => l.startsWith('bestmove')); waiters = waiters.filter(x => x !== w);
      return found;
    },
    quit() { send('quit'); }
  };
}
const fmt = l => !l ? '—' : `${l.kind === 'mate' ? '#' + l.value : (l.value / 100).toFixed(2)} ${l.pv[0]}`;

const E = engine(); await E.init();
let failed = 0;
for (const s of STUDIES.list) {
  if (ONLY && !ONLY.includes(s.id)) continue;
  const r = Chess.parseFen(s.fen), notes = []; let ok = !r.error;
  if (r.error) notes.push(`FEN: ${r.error}`);
  else if (s.mode === 'puzzle') {
    let st = r.state; const played = [];
    for (let i = 0; i < s.line.length; i++) {
      const lines = await E.search(s.fen, played), [a, b] = lines, want = s.line[i];
      if (i % 2 === 0) {
        const last = i === s.line.length - 1 && s.goal === 'mate';
        const unique = a && a.pv[0] === want && (!b || (a.kind === 'mate' ? !(b.kind === 'mate' && b.value > 0 && b.value <= a.value) : (b.kind === 'mate' ? b.value < 0 : a.value - b.value >= 200)));
        if (!unique && !(last && a && a.kind === 'mate' && a.value === 1)) ok = false;
        notes.push(`you ${want}: ${unique ? 'unique best' : 'NOT the unique best'} (${lines.map(fmt).join(', ')})`);
      } else notes.push(`reply ${want}${a && a.pv[0] === want ? ' (the engine\'s best)' : ` (engine prefers ${fmt(a)})`}`);
      const mv = Chess.fromUci(st, want); if (!mv) { ok = false; notes.push(`illegal move ${want}`); break; }
      st = Chess.apply(st, mv); played.push(want);
    }
    if (s.goal === 'mate' && !Chess.status(st).mate) { ok = false; notes.push('the line does not end in mate'); }
  } else if (s.mode === 'practice') {
    const [a] = await E.search(s.fen, [], 1), sign = r.state.turn === s.side ? 1 : -1;
    const mate = a && a.kind === 'mate' ? a.value * sign : null, cp = a && a.kind === 'cp' ? a.value * sign : null;
    if (s.goal === 'mate' || s.goal === 'promote') { if (!(mate > 0 || cp >= 300)) ok = false; }
    if (s.goal === 'hold') { if (!(cp !== null ? cp >= -50 : mate > 0)) ok = false; }
    notes.push(`${s.goal}: the engine says ${fmt(a)} for the side to move`);
    if (s.goal === 'mate' && s.par) {
      // the par must be Stockfish's quickest mate: found when asked for it, nothing shorter when asked for one less
      const shorter = s.par > 1 ? await E.mate(s.fen, s.par - 1) : null, atPar = await E.mate(s.fen, s.par);
      const parOk = atPar !== null && atPar <= s.par && !(shorter !== null && shorter < s.par);
      if (!parOk) ok = false;
      notes.push(`par ${s.par}: ${parOk ? 'confirmed' : 'WRONG'} (go mate ${s.par - 1} gives ${shorter ?? 'none'}, go mate ${s.par} gives ${atPar ?? 'none'})`);
    }
  } else notes.push('set-up: a legal position');
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${s.id}\n   ${notes.join('\n   ')}`);
}
E.quit();
console.log(failed ? `${failed} stud${failed === 1 ? 'y' : 'ies'} failed` : 'every study passed');
process.exit(failed ? 1 : 0);
