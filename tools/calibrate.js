#!/usr/bin/env node
/*
✒ Metadata
    - Title: Level Calibrator (MONOLITH Edition - v1.2)
    - File Name: calibrate.js
    - Relative Path: tools/calibrate.js
    - Artifact Type: CLI
    - Version: 1.2.0
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Under the
      app's new name, MONOLITH, which Dennis chose: the default page is
      index.html (a copy from before the rename, wizards-chess.html, is
      still found), and the console line and the PGN event say MONOLITH.
    - 1.1.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      the separation of concerns Dennis asked for, the rules and the levels
      are files of their own: it loads js/core/chess.js and
      js/core/levels.js, and still reads a single-file page (such as the
      calibration kit's copy) when there are none.
    - 1.0.0 (10/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, built so Dennis can run large calibration batches on his own
      machine after he judged level 4 to play well above its name.

✒ Description:
    Plays MONOLITH's computer levels against Stockfish's Elo-limited mode
    (or against each other) and estimates each level's rating. It loads the
    rules engine, LEVELS and chooseMove from js/core/chess.js and
    js/core/levels.js, the files the page itself loads, so the games are
    played exactly as the page plays.

✒ Key Features:
    - Exact parity: rules, level table and move choice are loaded from the
      page's own files at start-up, never copied; a single-file page (2.4.0
      and earlier) is read directly.
    - Opponents: Stockfish UCI_Elo anchors (elo:1320 to elo:3190) or
      another page level (level:3), so levels below 1320 can be chained.
    - Parallel: --jobs games run at once, each with its own pair of engine
      processes; colours alternate game by game.
    - Results per pairing: wins, draws, losses, score, Elo estimate with a
      95% margin, average game length.
    - Output: a console table plus CSV, and optional PGN of every game.
    - Game end: mate, stalemate, insufficient material, fifty-move rule,
      threefold repetition, or adjudicated draw at --max-plies.
    - Progress line per finished game; Ctrl+C prints the results so far.
    - No dependencies beyond Node.js and the vendored Stockfish build.

✒ Usage Instructions:
    Run from the project folder (the one that holds js/ and engine/). Pick
    the levels and opponents; each level plays --games games against each
    opponent. Rating estimates assume the anchors' UCI_Elo values; those
    are calibrated by the Stockfish team at much longer time controls, so
    raise --anchor-ms for estimates closer to that scale.

✒ Examples:
    - node tools/calibrate.js
          (levels 1-8 vs elo:1320,1600,2000,2400; 100 games each)
    - node tools/calibrate.js --levels 4 --vs elo:1500,elo:1800 --games 400
    - node tools/calibrate.js --levels 1,2 --vs level:3 --games 200
    - node tools/calibrate.js --levels all --vs elo:1320 --jobs 8
    - node tools/calibrate.js --levels 4 --vs elo:1800 --pgn club.pgn
    - node tools/calibrate.js --levels 5 --vs elo:2200 --anchor-ms 1000

✒ Command-Line Arguments:
    Input:
      --page <path>        The page; its folder's js/core is loaded, or a
                           single-file page is read (default
                           ./index.html, else ./wizards-chess.html)
      --engine <path>      Engine script (default
                           ./engine/stockfish-19-lite-single.js)
    Processing:
      --levels <list>      1-8 comma list, or all (default all)
      --vs <list>          elo:N or level:N, comma list
                           (default elo:1320,elo:1600,elo:2000,elo:2400)
      --games <n>          Games per pairing (default 100)
      --jobs <n>           Concurrent games (default CPU cores - 1)
      --anchor-ms <n>      Move time for elo anchors (default 250)
      --max-plies <n>      Adjudicate a draw after this many (default 300)
    Output:
      --out <path>         CSV of results (default calibration.csv)
      --pgn <path>         Also write every game as PGN
      --quiet              No per-game progress lines

✒ Other Important Information:
    - Dependencies: Node.js 16 or newer; the vendored Stockfish 19 lite
      build (engine/stockfish-19-lite-single.js and .wasm side by side).
    - Compatible platforms: Windows, macOS and Linux with Node.js.
    - Performance: each concurrent game uses about one CPU core; about 10
      to 20 seconds per game at the default settings.
    - Limitations: elo anchors run Stockfish's limiter at short move
      times, so the absolute numbers are approximate; comparisons between
      levels are more reliable than the absolute ratings.
---------
*/
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');

/* ---------- arguments ---------- */
const args = (() => {
  const a = { page: 'index.html', engine: 'engine/stockfish-19-lite-single.js', levels: 'all',
    vs: 'elo:1320,elo:1600,elo:2000,elo:2400', games: 100, jobs: Math.max(1, os.cpus().length - 1),
    anchorMs: 250, maxPlies: 300, out: 'calibration.csv', pgn: null, quiet: false };
  const map = { '--page': 'page', '--engine': 'engine', '--levels': 'levels', '--vs': 'vs', '--games': 'games', '--jobs': 'jobs',
    '--anchor-ms': 'anchorMs', '--max-plies': 'maxPlies', '--out': 'out', '--pgn': 'pgn' };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--quiet') { a.quiet = true; continue; }
    if (argv[i] === '--help' || argv[i] === '-h') { console.log(fs.readFileSync(__filename, 'utf8').split('✒ Command-Line Arguments:')[1].split('✒ Other')[0]); process.exit(0); }
    const k = map[argv[i]]; if (!k || argv[i + 1] === undefined) { console.error(`Unknown or incomplete option: ${argv[i]}. Use --help.`); process.exit(2); }
    a[k] = argv[++i];
  }
  for (const k of ['games', 'jobs', 'anchorMs', 'maxPlies']) { a[k] = parseInt(a[k], 10); if (!(a[k] > 0)) { console.error(`--${k} must be a positive number.`); process.exit(2); } }
  return a;
})();

/* ---------- load rules, LEVELS and chooseMove: the page's js/core files, else a single-file page ---------- */
function fromPage(file) {
  if (!fs.existsSync(file) && path.basename(file) === 'index.html' && fs.existsSync(path.join(path.dirname(file), 'wizards-chess.html'))) file = path.join(path.dirname(file), 'wizards-chess.html');   // a copy from before the rename
  const core = path.join(path.dirname(file), 'js', 'core');
  if (fs.existsSync(path.join(core, 'chess.js')) && fs.existsSync(path.join(core, 'levels.js'))) {
    const Chess = require(path.join(core, 'chess.js'));
    if (typeof globalThis.Chess === 'undefined') globalThis.Chess = Chess;   // chooseMove reads the global, as in the page
    const { LEVELS, chooseMove } = require(path.join(core, 'levels.js'));
    return { Chess, LEVELS, chooseMove };
  }
  if (!fs.existsSync(file)) { console.error(`Cannot find the page at ${file}. Run from its folder or pass --page.`); process.exit(2); }
  const html = fs.readFileSync(file, 'utf8');
  const eng = /<script id="engine">([\s\S]*?)<\/script>/.exec(html);
  if (!eng) { console.error('The page has no <script id="engine"> rules block.'); process.exit(2); }
  const mod = { exports: {} };
  new Function('module', eng[1] + '\nmodule.exports = Chess;')(mod);
  const Chess = mod.exports;
  const i0 = html.indexOf('const LEVELS = ['), i1 = html.indexOf('];', i0) + 2;
  const j0 = html.indexOf('function chooseMove('), j1 = html.indexOf('\nfunction resultFor(', j0);
  if (i0 < 0 || j0 < 0 || j1 < 0) { console.error('Could not find LEVELS or chooseMove in the page.'); process.exit(2); }
  const { LEVELS, chooseMove } = new Function('Chess', `${html.slice(i0, i1)}\n${html.slice(j0, j1)}\nreturn { LEVELS, chooseMove };`)(Chess);
  return { Chess, LEVELS, chooseMove };
}
const { Chess, LEVELS, chooseMove } = fromPage(path.resolve(args.page));
const enginePath = path.resolve(args.engine);
if (!fs.existsSync(enginePath)) { console.error(`Cannot find the engine at ${enginePath}. Pass --engine.`); process.exit(2); }

const levels = args.levels === 'all' ? LEVELS.map((_, i) => i + 1) : args.levels.split(',').map(Number);
if (levels.some(n => !(n >= 1 && n <= LEVELS.length))) { console.error(`--levels takes 1-${LEVELS.length} or all.`); process.exit(2); }
const opponents = args.vs.split(',').map(s => {
  const [kind, v] = s.trim().split(':'); const n = parseInt(v, 10);
  if (kind === 'elo' && n >= 1320 && n <= 3190) return { kind, n, label: `elo:${n}` };
  if (kind === 'level' && n >= 1 && n <= LEVELS.length) return { kind, n, label: `level:${n}` };
  console.error(`Bad opponent "${s}". Use elo:1320-3190 or level:1-${LEVELS.length}.`); process.exit(2);
});

/* ---------- engine process (UCI over stdio) ---------- */
function Engine() {
  const p = spawn(process.execPath, [enginePath], { stdio: ['pipe', 'pipe', 'ignore'] });
  let buf = '', res = null, lines = [];
  p.stdout.on('data', d => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (l.startsWith('info ') && l.includes(' score ') && !/\b(upper|lower)bound\b/.test(l)) {
        const mp = +(/multipv (\d+)/.exec(l) || [0, 1])[1], s = /score (cp|mate) (-?\d+)/.exec(l), pv = /\bpv (.+)$/.exec(l), dp = /\bdepth (\d+)/.exec(l);
        if (s) lines[mp - 1] = { kind: s[1], value: +s[2], pv: pv ? pv[1].split(' ') : [], depth: dp ? +dp[1] : 0, multipv: mp };
      } else if (l.startsWith('bestmove') && res) { const r = res; res = null; r({ best: l.split(' ')[1], lines }); }
    }
  });
  const send = c => p.stdin.write(c + '\n');
  send('uci');
  return {
    // same option sequence the page's engine.go sends
    go(pos, o) {
      lines = [];
      return new Promise(r => {
        res = r;
        send('setoption name Skill Level value 20');
        send(`setoption name UCI_LimitStrength value ${o.elo ? 'true' : 'false'}`);
        if (o.elo) send(`setoption name UCI_Elo value ${o.elo}`);
        send(`setoption name MultiPV value ${o.multipv || 1}`);
        send(pos); send(`go depth ${o.depth} movetime ${o.ms}`);
      });
    },
    newgame() { send('ucinewgame'); },
    kill() { try { send('quit'); } catch (e) {} setTimeout(() => p.kill(), 200); }
  };
}

/* ---------- one game ---------- */
const repKey = st => { const f = Chess.fen(st).split(' '); const ep = st.ep >= 0 && Chess.allLegal(st).some(m => m.ep); return `${f[0]} ${f[1]} ${f[2]} ${ep ? f[3] : '-'}`; };
async function move(engine, side, st, pos) {
  if (side.kind === 'elo') { const r = await engine.go(pos, { elo: side.n, depth: 30, ms: args.anchorMs }); return Chess.fromUci(st, r.best); }
  const L = LEVELS[side.n - 1];
  const r = await engine.go(pos, { elo: L.elo, depth: L.depth, ms: L.ms, multipv: L.lines || 1 });
  return L.lines ? (chooseMove(st, r.lines, L) || Chess.fromUci(st, r.best)) : Chess.fromUci(st, r.best);
}
async function playGame(pair, testWhite, a, b) {
  a.newgame(); b.newgame();
  let st = Chess.newGame(); const start = Chess.fen(st), uci = [], san = [], seen = new Map();
  let result = '1/2-1/2', reason = 'adjudicated';
  for (let ply = 0; ply < args.maxPlies; ply++) {
    const s = Chess.status(st);
    if (s.mate) { result = st.turn === 'w' ? '0-1' : '1-0'; reason = 'checkmate'; break; }
    if (s.stale) { reason = 'stalemate'; break; }
    if (s.insufficient) { reason = 'insufficient material'; break; }
    if (s.draw50) { reason = 'fifty-move rule'; break; }
    const k = repKey(st); seen.set(k, (seen.get(k) || 0) + 1); if (seen.get(k) >= 3) { reason = 'threefold repetition'; break; }
    const testToMove = (st.turn === 'w') === testWhite;
    const pos = `position fen ${start}` + (uci.length ? ` moves ${uci.join(' ')}` : '');
    const mv = await move(testToMove ? a : b, testToMove ? { kind: 'level', n: pair.level } : pair.opp, st, pos);
    if (!mv) { reason = 'engine returned no move'; break; }
    const nx = Chess.apply(st, mv);
    san.push(Chess.san(st, mv, nx)); uci.push(Chess.toUci(mv)); st = nx;
  }
  const testScore = result === '1/2-1/2' ? 0.5 : (result === '1-0') === testWhite ? 1 : 0;
  return { testScore, result, reason, plies: san.length, san, testWhite };
}

/* ---------- statistics ---------- */
function estimate(r) {
  const n = r.w + r.d + r.l; if (!n) return null;
  const p = (r.w + 0.5 * r.d) / n;
  const varp = (r.w * (1 - p) ** 2 + r.d * (0.5 - p) ** 2 + r.l * (0 - p) ** 2) / n;
  const se = Math.sqrt(varp / n);
  const toElo = q => { const c = Math.min(0.999, Math.max(0.001, q)); return -400 * Math.log10(1 / c - 1); };
  const diff = toElo(p), lo = toElo(p - 1.96 * se), hi = toElo(p + 1.96 * se);
  return { n, p, diff, margin: (hi - lo) / 2, clipped: p <= 0.001 || p >= 0.999 };
}
function oppRating(opp, table) {
  if (opp.kind === 'elo') return opp.n;
  const e = table.find(t => t.level === opp.n && t.estimate !== null);
  return e ? e.estimate : null;
}

/* ---------- run ---------- */
(async () => {
  const pairs = [];
  for (const level of levels) for (const opp of opponents) if (!(opp.kind === 'level' && opp.n === level)) pairs.push({ level, opp, w: 0, d: 0, l: 0, plies: 0, done: 0 });
  const queue = [];
  for (const pr of pairs) for (let g = 0; g < args.games; g++) queue.push({ pr, testWhite: g % 2 === 0 });
  const total = queue.length, pgn = args.pgn ? fs.createWriteStream(args.pgn) : null;
  console.log(`MONOLITH level calibration: ${pairs.length} pairing(s) × ${args.games} games = ${total} games, ${args.jobs} at a time.`);
  let finished = 0, stopping = false; const t0 = Date.now();

  const report = () => {
    const table = [];
    console.log('\nLevel           Opponent     Games   +W   =D   -L  Score   Estimate      Avg plies');
    for (const pr of pairs) {
      const e = estimate(pr); if (!e) continue;
      const base = pr.opp.kind === 'elo' ? pr.opp.n : null;
      const est = base !== null ? Math.round(base + e.diff) : null;
      const name = `${pr.level} ${LEVELS[pr.level - 1].name}`.padEnd(15);
      // a clean sweep has no measurable margin: report it as a bound, not as ±0
      const estTxt = e.clipped ? (est === null ? `${e.p > 0.5 ? 'swept' : 'swept by'} opp` : `${e.p > 0.5 ? 'above' : 'below'} ${base}`)
        : est === null ? `${e.diff >= 0 ? '+' : ''}${Math.round(e.diff)} vs opp ±${Math.round(e.margin)}` : `≈${est} ±${Math.round(e.margin)}`;
      console.log(`${name} ${pr.opp.label.padEnd(12)} ${String(e.n).padStart(5)} ${String(pr.w).padStart(4)} ${String(pr.d).padStart(4)} ${String(pr.l).padStart(4)}  ${(e.p * 100).toFixed(1).padStart(5)}%  ${estTxt.padEnd(13)} ${(pr.plies / e.n).toFixed(0).padStart(9)}`);
      table.push({ level: pr.level, name: LEVELS[pr.level - 1].name, opponent: pr.opp.label, games: e.n, w: pr.w, d: pr.d, l: pr.l, score: e.p.toFixed(4),
        elo_diff: e.clipped ? '' : Math.round(e.diff), estimate: e.clipped ? '' : est, margin95: e.clipped ? '' : Math.round(e.margin), avg_plies: (pr.plies / e.n).toFixed(1) });
    }
    const cols = ['level', 'name', 'opponent', 'games', 'w', 'd', 'l', 'score', 'elo_diff', 'estimate', 'margin95', 'avg_plies'];
    fs.writeFileSync(args.out, cols.join(',') + '\n' + table.map(r => cols.map(c => r[c] ?? '').join(',')).join('\n') + '\n');
    console.log(`\nResults written to ${path.resolve(args.out)}${pgn ? ` and games to ${path.resolve(args.pgn)}` : ''}.`);
    console.log('Estimates are on the UCI_Elo scale of the anchors; ± is a 95% margin from the game results alone.');
  };
  process.on('SIGINT', () => { if (stopping) process.exit(1); stopping = true; console.log('\nStopping after the games in progress…'); });

  const worker = async () => {
    const a = Engine(), b = Engine();
    while (queue.length && !stopping) {
      const job = queue.shift(), pr = job.pr;
      const g = await playGame(pr, job.testWhite, a, b);
      if (g.testScore === 1) pr.w++; else if (g.testScore === 0) pr.l++; else pr.d++;
      pr.plies += g.plies; pr.done++; finished++;
      if (!args.quiet) {
        const eta = ((Date.now() - t0) / finished) * (total - finished) / 1000;
        console.log(`[${finished}/${total}] L${pr.level} ${job.testWhite ? 'white' : 'black'} vs ${pr.opp.label}: ${g.result} (${g.reason}, ${g.plies} plies)  ~${Math.round(eta / 60)} min left`);
      }
      if (pgn) {
        const lvl = `Level ${pr.level} ${LEVELS[pr.level - 1].name}`, opp = pr.opp.kind === 'elo' ? `Stockfish UCI_Elo ${pr.opp.n}` : `Level ${pr.opp.n} ${LEVELS[pr.opp.n - 1].name}`;
        const moves = g.san.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ` : '') + m).join(' ');
        pgn.write(`[Event "MONOLITH calibration"]\n[White "${g.testWhite ? lvl : opp}"]\n[Black "${g.testWhite ? opp : lvl}"]\n[Result "${g.result}"]\n[Termination "${g.reason}"]\n\n${moves} ${g.result}\n\n`);
      }
    }
    a.kill(); b.kill();
  };
  await Promise.all(Array.from({ length: Math.min(args.jobs, total) }, worker));
  if (pgn) pgn.end();
  report();
  process.exit(0);
})();
