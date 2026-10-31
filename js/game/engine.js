/*
✒ Metadata
    - Title: Stockfish Client (MONOLITH Edition - v1.0)
    - File Name: engine.js
    - Relative Path: js/game/engine.js
    - Artifact Type: javascript
    - Version: 1.0.3
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.3 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Reports
      Stockfish under way, ready or failed to the loading screen's meter
      Dennis asked for.
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: an engine that stops working after it
      has started answers its pending search, restarts once and then reports
      the failure, instead of leaving searches waiting; a terminated engine
      starts nothing more.
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The UCI client for Stockfish: it starts the best engine it can
    (Stockfish 19 lite from engine/, the same build from unpkg, or Stockfish
    10 as a last resort) and speaks UCI to it over postMessage.

✒ Key Features:
    - Three engines in order of preference, each a Worker.
    - createEngine(role, { onReady, onFail }): options, readiness, go and
      stop, with info lines parsed.
    - engine: the engine that plays; allEngines lists every engine the page
      started.
    - engineFamily() and the labels the page shows for each build.
    - putLine(): files an info line under its MultiPV rank, dropping a lower
      rank with the same first move.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 11 of 26. Other modules import from it,
    for example:
        import { engine, createEngine } from '../game/engine.js';

✒ Other Important Information:
    - Dependencies: imports app/store.js, app/base.js, app/state.js,
      game/play.js and game/lines.js; globals Chess (js/core/chess.js).
    - Shared state (js/app/store.js): sets app.cpuThinking; reads
      app.worldName.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { app } from '../app/store.js';
import { $ } from '../app/base.js';
import { render } from '../app/state.js';
import { maybeComputerMove } from './play.js';
import { refreshAnalysis } from './lines.js';
import { bootStep } from '../ui/boot-screen.js';

/* ---------- Stockfish ----------
   First choice: Stockfish 19 lite (WASM, single-threaded) published beside this page under
   engine/, run as a Worker from the artifact's own files. When that Worker cannot start (the
   engine folder is missing, or the host refuses it), the second choice is the same build, byte
   for byte (see engine/README.md), from unpkg in a blob Worker; the build reads its .wasm
   address from the Worker URL's hash. (jsDelivr refuses this package: it is over its size
   limit.) Last resort: the Stockfish 10 asm.js single file from cdnjs, which has no UCI_Elo,
   no WDL and a 16 MB hash; the page says so wherever it matters. All three speak UCI over
   postMessage. */
const SF19_CDN = 'https://unpkg.com/stockfish@19.0.1/bin/stockfish-19-lite-single';
const blobWorker = (src, hash = '') => new Worker(URL.createObjectURL(new Blob([`importScripts(${JSON.stringify(src)});`], { type: 'text/javascript' })) + hash);
const ENGINES = [
  { name: 'Stockfish 19 lite', family: 'Stockfish 19', short: 'SF19', build: 'WASM build', from: 'this page\'s engine folder', make: () => new Worker('engine/stockfish-19-lite-single.js') },
  { name: 'Stockfish 19 lite', family: 'Stockfish 19', short: 'SF19', build: 'WASM build · unpkg', from: 'unpkg', make: () => blobWorker(`${SF19_CDN}.js`, '#' + encodeURIComponent(`${SF19_CDN}.wasm`)) },
  { name: 'Stockfish 10', family: 'Stockfish 10', short: 'SF10', build: 'asm.js build', from: 'cdnjs', make: () => blobWorker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js') }
];
/* The engine the page actually runs, for labels: the play engine once it is ready, Stockfish 19
   (the intended engine) until then. */
export const engineFamily = () => (engine && engine.ready && engine.choice) || ENGINES[0];
/* Labels that name the engine follow the one that loaded; options it lacks are disabled with
   the reason rather than accepted and ignored. */
function engineLabels() {
  const f = engineFamily(), elo = !engine.ready || engine.has('UCI_Elo');
  if (app.worldName === 'monolith') $('#brand-sub').textContent = `MONOLITH world · ${f.family} instrument`;
  for (const id of ['#cfg-a-kind', '#cfg-b-kind']) {
    const sel = $(id); if (!sel) continue;
    for (const o of sel.options) {
      if (o.value === 'nodes') o.textContent = `${f.family} · nodes per move`;
      if (o.value === 'elo') { o.textContent = `${f.family} · UCI_Elo${elo ? '' : ' (this engine has none)'}`; o.disabled = !elo; }
    }
    if (!elo && sel.value === 'elo') { sel.value = 'nodes'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }
}
/* One UCI info line → fields. Bound lines (lowerbound/upperbound) keep their stats but are
   flagged, and `scored` marks an exact line with a depth and a score: only those feed line
   tables, as before. */
function parseInfo(line) {
  const tok = line.split(' '), out = { bound: false, multipv: 1 };
  for (let i = 1; i < tok.length; i++) {
    switch (tok[i]) {
      case 'depth': out.depth = +tok[++i]; break;
      case 'seldepth': out.seldepth = +tok[++i]; break;
      case 'multipv': out.multipv = +tok[++i]; break;
      case 'score': out.kind = tok[++i]; out.value = +tok[++i]; if (tok[i + 1] === 'lowerbound' || tok[i + 1] === 'upperbound') { out.bound = true; i++; } break;
      case 'wdl': out.wdl = [+tok[i + 1], +tok[i + 2], +tok[i + 3]]; i += 3; break;
      case 'nodes': out.nodes = +tok[++i]; break;
      case 'nps': out.nps = +tok[++i]; break;
      case 'hashfull': out.hashfull = +tok[++i]; break;
      case 'tbhits': out.tbhits = +tok[++i]; break;
      case 'time': out.time = +tok[++i]; break;
      case 'currmove': out.currmove = tok[++i]; break;
      case 'currmovenumber': out.currmovenumber = +tok[++i]; break;
      case 'pv': out.pv = tok.slice(i + 1); i = tok.length; break;
      case 'string': i = tok.length; break;
    }
  }
  out.scored = out.depth !== undefined && !!out.kind && !out.bound;
  if (!out.pv) out.pv = [];
  return out;
}
/* A MultiPV slot takes the newest exact line for it. Stockfish reports its lines in batches, and
   a slot whose newest report is only a bound keeps its older line, which can be the very move
   that now ranks in another slot (Analyze showed e3 as both line 2 and line 3). The newer
   report wins and the stale copy is dropped until its slot reports again. */
export function putLine(arr, inf) {
  const k = inf.multipv - 1, mv = inf.pv[0];
  arr[k] = inf;
  if (mv) for (let j = 0; j < arr.length; j++) if (j !== k && arr[j] && arr[j].pv[0] === mv) arr[j] = undefined;
}
/* A UCI client around one engine Worker. Several run side by side: `engine` plays (and answers
   a hint when the Coach has no line ready), `coach.eng` reads the game for the Coach, `deep` and
   `fieldEng` serve Analyze, and the Crucible runner makes a pair per game slot.
   go() is serialized per engine: it stops whatever runs, sets only the options that changed,
   sends the position and the limits, and resolves to the best move; callers compare `gen` to
   drop a result that a later request pre-empted. opts: depth, movetime, nodes, infinite,
   searchmoves, multipv, elo, hash, wdl, lines (deepest exact info per MultiPV line), onStats
   (every info line, bounds included), newGame. */
export const allEngines = new Set();
export function createEngine(role, { onReady = null, onFail = null } = {}) {
  const E = {
    role, worker: null, ready: false, failed: false, name: '', build: '', choice: null, status: 'Loading engine…', attempt: 0,
    resolver: null, onInfo: null, chain: Promise.resolve(), gen: 0, options: {}, set: {}, searching: false, busyMs: 0, since: 0, last: null,
    timer: 0, dead: false, restarts: 0,
    init() {
      if (this.dead) return;   // terminated: never starts again (a load timer can outlive it)
      if (typeof Worker === 'undefined') return this.fail('This browser cannot run the engine');
      const choice = ENGINES[this.attempt];
      if (!choice) return this.fail('The engine could not load here');
      this.status = `Loading ${choice.name}…`; if (role === 'play') render();
      try { this.worker = choice.make(); } catch (e) { return this.next(); }
      clearTimeout(this.timer); this.timer = setTimeout(() => { if (!this.ready) this.next(); }, 20000);
      this.worker.onerror = () => { clearTimeout(this.timer); if (!this.ready) this.next(); else this.crashed(); };
      this.worker.onmessage = e => {
        if (typeof e.data !== 'string') return;               // Stockfish 19 also posts download-progress objects
        for (const line of e.data.split('\n')) this.line(line.trim(), choice);
      };
      this.send('uci');
    },
    line(line, choice) {
      if (!line) return;
      if (line.startsWith('option name ')) { const m = /^option name (.+?) type (\w+)(.*)$/.exec(line); if (m) this.options[m[1]] = { type: m[2], rest: m[3] }; return; }
      if (line === 'uciok') {
        clearTimeout(this.timer); this.ready = true; this.choice = choice; this.name = choice.name; this.build = choice.build; this.status = `${choice.name} ready`;
        if (onReady) onReady(this); return;
      }
      if (line.startsWith('info ')) { const inf = parseInfo(line); if (inf.nodes !== undefined || inf.scored) { this.last = inf; this.lastLine = line; } if (this.onInfo) this.onInfo(inf); return; }
      if (line.startsWith('bestmove')) {
        if (this.searching) { this.busyMs += performance.now() - this.since; this.searching = false; }
        const r = this.resolver; this.resolver = null; this.onInfo = null; if (r) r(line.split(' ')[1]);
      }
    },
    next() { if (this.ready || this.dead) return; if (this.worker) { try { this.worker.terminate(); } catch (e) {} this.worker = null; } this.attempt++; this.init(); },
    /* The worker died after it was ready (out of memory, a crash in the WebAssembly): whatever
       waits on it is answered with no move, and the same build starts once more; a second death
       is a failure, which the panels report. */
    crashed() {
      const r = this.resolver; this.resolver = null; this.onInfo = null; if (r) r(null);
      this.searching = false; this.ready = false; this.set = {}; this.gen++;
      if (this.worker) { try { this.worker.terminate(); } catch (e) {} this.worker = null; }
      if (this.restarts++ < 1) this.init(); else this.fail('The engine stopped working');
    },
    fail(msg) {
      this.failed = true; this.ready = false; if (this.worker) { try { this.worker.terminate(); } catch (e) {} this.worker = null; }
      this.status = `${msg}.`; if (onFail) onFail(this, msg);
    },
    send(c) { if (this.worker) this.worker.postMessage(c); },
    has(name) { return !!this.options[name]; },
    /* The value an option will really take: clamped to the engine's own min/max (Stockfish 10's
       hash, for one, is fixed at 16 MB). */
    cap(name, value) { const o = this.options[name]; if (!o) return value; const lo = /\bmin (-?\d+)/.exec(o.rest), hi = /\bmax (-?\d+)/.exec(o.rest); return Math.max(lo ? +lo[1] : -Infinity, Math.min(hi ? +hi[1] : Infinity, value)); },
    opt(name, value) {
      if (!this.has(name)) return;
      const v = String(value); if (this.set[name] === v) return;
      this.set[name] = v; this.send(`setoption name ${name} value ${v}`);
    },
    stopNow() { if (!this.resolver) return Promise.resolve(); return new Promise(r => { const prev = this.resolver; this.resolver = v => { prev(v); r(); }; this.send('stop'); }); },
    go(pos, opts, onInfo) {
      if (!this.ready) return Promise.resolve(null);
      const gen = ++this.gen; let result;
      const started_ = this.chain.then(async () => {
        await this.stopNow();
        if (gen !== this.gen) { result = Promise.resolve(null); return; }
        this.opt('Skill Level', 20);
        this.opt('UCI_LimitStrength', opts.elo ? 'true' : 'false');
        if (opts.elo) this.opt('UCI_Elo', opts.elo);
        this.opt('MultiPV', opts.multipv || 1);
        if (opts.hash) this.opt('Hash', opts.hash);
        this.opt('UCI_ShowWDL', opts.wdl === false ? 'false' : 'true');
        if (opts.newGame) this.send('ucinewgame');
        this.send(pos);
        this.onInfo = inf => {
          if (inf.scored) { if (opts.lines) putLine(opts.lines, inf); if (onInfo) onInfo(inf); }
          if (opts.onStats) opts.onStats(inf);
        };
        result = new Promise(res => { this.resolver = res; });
        let go = 'go';
        if (opts.infinite) go += ' infinite';
        else { if (opts.nodes) go += ` nodes ${opts.nodes}`; if (opts.depth) go += ` depth ${opts.depth}`; if (opts.movetime) go += ` movetime ${opts.movetime}`; }
        if (opts.searchmoves && opts.searchmoves.length) go += ` searchmoves ${opts.searchmoves.join(' ')}`;
        this.searching = true; this.since = performance.now();
        this.send(go);
      });
      this.chain = started_.catch(() => {});
      return started_.then(() => result);
    },
    abort() { this.gen++; this.onInfo = null; this.send('stop'); },
    terminate() { this.dead = true; clearTimeout(this.timer); this.gen++; this.ready = false; if (this.worker) { try { this.worker.terminate(); } catch (e) {} this.worker = null; } const r = this.resolver; this.resolver = null; if (r) r(null); this.searching = false; allEngines.delete(this); }
  };
  allEngines.add(E);
  return E;
}
export let engine; // set in init()

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  bootStep('engine', 'on');   // the loading screen's meter: Stockfish is on its way
  engine = createEngine('play', {
    onReady(e) {
      bootStep('engine');   // first: the meter's step is in whatever follows
      const c = e.choice;
      $('#about-engine').textContent = `Engine: ${e.name}, ${c.build}, loaded from ${c.from}${c.short === 'SF10' ? ' (last-resort fallback: no Elo limiter, no WDL)' : ' (Stockfish developers; stockfish.js by Nathan Rugg and Chess.com)'}, GPL-3.0. Built with three.js r147.`;
      engineLabels(); render(); refreshAnalysis(); maybeComputerMove();
    },
    onFail(e) { bootStep('engine', 'no'); e.status += ' Friend games still work.'; app.cpuThinking = false; render(); }
  });
}
