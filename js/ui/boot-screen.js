/*
✒ Metadata
    - Title: Boot Screen (MONOLITH Edition - v1.2)
    - File Name: boot-screen.js
    - Relative Path: js/ui/boot-screen.js
    - Artifact Type: javascript
    - Version: 1.2.0
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      asked the screen to slow down and breathe, with a loading meter and
      rotating tips: the stages are longer (2.65 s and 3.6 s), the meter
      fills a segment only when its step reports in (bootStep), a tip or a
      chess fact turns over every 5.2 s, and the lengths follow the saved
      Animation speed (Brisk shortens them, Minimal draws it still).
    - 1.1.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      animated loading screen Dennis asked for (4 to 6 s): it runs the
      stages, hands the page's boot its moment once the M is written, sets
      the pieces when the first frame is drawn, and lifts the screen when
      the glint is done; a key or a click skips to the end of the stage
      under way, and keys go no further than the screen.
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, for the loading screen Dennis asked for around his emblem:
      the screen the page opens on stays until the 3D board has drawn its
      first frame, then fades out.

✒ Description:
    The loading screen's lifetime, its order and what it reports. The screen
    itself (#boot: Dennis's MONOLITH emblem, the name, the meter and the tip
    card) is markup in the page, so it shows, and its first stage plays,
    from the first paint, in the colours of the world the page will open
    in. This module lets the page's boot run once the M is written, keeps
    the meter to the steps that have actually finished, turns the tips
    over, starts the last stage when the board has drawn, and takes the
    screen away when that is over, or at once when the boot fails.

✒ Key Features:
    - The stages:
        - bootStarted(begin): marks the boot as under way (so
          js/file-check.js leaves the screen to this module), starts the
          tips, and calls begin(), the page's boot, once the M is written
          (the boot-written marker), after marking the screen as holding and
          letting one frame through, so the meter's sheen reaches the
          compositor before the main thread is busy.
        - bootReady(drawn): the first frame is on screen (drawn is false
          only from js/main.js's 8 s fallback); stage 3 begins (class go),
          and the screen lifts when it is over (the boot-set marker). Once
          only: later calls return at once, so the frame loop can call it
          every frame.
        - bootCovering(): true while the screen covers a board that has
          drawn; the frame loop draws nothing then.
        - bootStop(): the boot halted (no WebGL) or failed; the screen goes
          at once, so the notice or the page behind it shows.
    - The meter: bootStep(id, state) moves one of five steps forward,
      never back: scripts (code), board, first frame (light), the pillar
      models (models) and Stockfish (engine), each '' (waiting), 'on'
      (under way), 'ok' or 'no' (failed). A segment fills only on 'ok' or
      'no'; the line under the rail names the first step under way, or the
      last one settled; the count is the steps settled. The screen waits for
      none of them past the first frame, so the last two may still be under
      way as it lifts.
    - The tips: js/data/boot-tips.js's BOOT_TIPS, shuffled, one at a time
      in the card from 1.7 s, the next every 5.2 s. Settings → Tips: Off
      keeps them to the chess facts. Text between backticks is drawn as key
      caps, and {palette} names the palette's key for this keyboard.
    - The pace: the saved Animation speed, set on the root before the first
      paint (data-boot-pace): Cinematic as written, Brisk at 0.55 of every
      length, Minimal still. Reduced motion is still too: nothing moves and
      the screen is removed without its fade.
    - Skipping: a key or a click finishes the stage under way; keys are
      stopped at the window while the screen is up, but nothing is
      prevented, so the browser's own keys still work.
    - Without getAnimations() or a marker, the stages are timed by the clock
      at the same lengths.
    - #app is marked aria-busy while the screen is up, and cleared by every
      route.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js hands
    its boot to bootStarted(), reports the board, and calls bootStop() when
    the boot throws; js/app/loop.js calls bootReady() after each frame once
    start() has run, and draws nothing while bootCovering() is true;
    js/game/engine.js and js/scene/pillars.js report their steps.
        import { bootStep } from '../ui/boot-screen.js';
        bootStep('engine', 'on');   // later 'ok', or 'no' when it failed

✒ Other Important Information:
    - Dependencies: the #boot element and #app in index.html, and the
      early script there that sets data-boot-pace and data-boot-tips; the
      styles in css/layout.css (loading screen), which time the stages;
      BOOT_TIPS from js/data/boot-tips.js (the card stays hidden without
      it).
    - Fallbacks outside this module: js/file-check.js removes the screen
      from disk (file://), and at the window's load event when the boot
      never started (main.js blocked or failing to load); a <noscript>
      style hides it without JavaScript; js/main.js lifts it 8 s after the
      boot when no frame has been drawn.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
/* Lengths at the Cinematic pace, in ms. The stylesheet (css/layout.css, loading screen) holds the
   same ones and times the stages: stage 1 from the first paint, stage 3 once the board has drawn.
   Each has a marker animation on the board group, and a stage is over when its marker finishes. A
   browser without getAnimations(), or without the marker, falls back on the same lengths by the
   clock. REVEAL is when the tip card shows, ROTATE how long each tip stays. */
const WRITTEN = 2650, SET = 3600, LIFT = 950, REVEAL = 1700, ROTATE = 5200;
/* The meter's steps, in the rail's order: what the line says while one is under way, once it is
   in, and, after "Ready", when it failed. */
const STEPS = [
  { id: 'code',   on: 'Loading the scripts',        ok: 'Scripts loaded' },
  { id: 'board',  on: 'Building the board',         ok: 'Board built' },
  { id: 'light',  on: 'Drawing the first frame',    ok: 'First frame drawn', no: 'no frame drawn yet' },
  { id: 'models', on: 'Fetching the pillar models', ok: 'Pillars loaded',    no: 'built pillars stand in' },
  { id: 'engine', on: 'Waking Stockfish',           ok: 'Stockfish ready',   no: 'engine unavailable' }
];
const RANK = { '': 0, on: 1, ok: 2, no: 2 };
const steps = Object.fromEntries(STEPS.map(s => [s.id, s.id === 'code' ? 'on' : '']));   // as the markup starts
let started = false, ready = false, done = false, rotation = 0;
const pace = () => document.documentElement.dataset.bootPace;   // set before the first paint, from Animation speed
const el = () => document.getElementById('boot');
const scale = () => pace() === 'fast' ? 0.55 : 1;
const still = () => pace() === 'minimal' || matchMedia('(prefers-reduced-motion: reduce)').matches;
const release = () => document.getElementById('app')?.removeAttribute('aria-busy');
/* cb once the marker animation `name` has finished, or after ms when it cannot be found. It runs
   from a timer, so an error thrown in it is reported as any other error on the page. */
function after(name, ms, cb) {
  const b = el(), a = still() || !b?.getAnimations ? null : b.getAnimations({ subtree: true }).find(x => x.animationName === name);
  if (a) a.finished.then(() => setTimeout(cb), () => setTimeout(cb));
  else setTimeout(cb, still() ? 0 : Math.max(0, ms));
}
/* A key or a click jumps to the end of the stage under way. Keys go no further while the screen is
   up (the page under it is not to be worked blind), but nothing is prevented, so the browser's own
   keys (reload, close) still work. The meter's sheen and the emblem's breath run on; they mark
   nothing. */
function skip() {
  const b = el(); if (!b || done) return;
  for (const a of b.getAnimations?.({ subtree: true }) || []) {
    if (a.effect?.getTiming?.().iterations === Infinity) continue;
    try { a.finish(); } catch (e) {}
  }
}
function onKey(e) { if (done) return; e.stopImmediatePropagation(); skip(); }

/* ---------- the meter ---------- */
/* A step moves forward only: waiting, under way, then in or failed. Once the board is built, the
   first frame is next. Reports after the screen has gone change nothing anyone sees. */
export function bootStep(id, state = 'ok') {
  if (!(id in steps) || !(state in RANK) || RANK[state] <= RANK[steps[id]]) return;
  steps[id] = state;
  if (id === 'board' && state === 'ok' && !steps.light) steps.light = 'on';
  meter();
}
function meter() {
  const b = el(); if (!b) return;
  for (const s of b.querySelectorAll('.boot-rail [data-step]')) {
    const v = steps[s.dataset.step];
    s.classList.toggle('on', v === 'on'); s.classList.toggle('ok', v === 'ok'); s.classList.toggle('no', v === 'no');
  }
  const settled = STEPS.filter(s => RANK[steps[s.id]] === 2), now = STEPS.find(s => steps[s.id] === 'on');
  const failed = settled.filter(s => steps[s.id] === 'no'), last = settled[settled.length - 1];
  const all = settled.length === STEPS.length;
  const text = now ? `${now.on}…`
    : all ? (failed.length ? `Ready, ${failed.map(s => s.no).join(', ')}` : 'Ready')
    : last ? (steps[last.id] === 'ok' ? last.ok : last.no[0].toUpperCase() + last.no.slice(1))
    : `${STEPS[0].on}…`;
  b.querySelector('.boot-rail')?.classList.toggle('full', all);
  const count = b.querySelector('.boot-count'), line = b.querySelector('.boot-now');
  if (count) count.textContent = `${settled.length} / ${STEPS.length}`;
  if (line && line.textContent !== text) {
    line.textContent = text;
    if (!still() && line.animate) line.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
}

/* ---------- the tips ---------- */
const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');   // as js/ui/palette.js tells them apart
/* A tip's text into its paragraph: backticks mark key caps, {palette} the palette's key here. */
function write(p, text) {
  p.replaceChildren(...text.replaceAll('{palette}', MAC ? '⌘K' : 'Ctrl K').split('`').map((s, i) => {
    if (i % 2 === 0) return document.createTextNode(s);
    const k = document.createElement('kbd'); k.textContent = s; return k;
  }));
}
/* Shuffled, then one at a time in two slots that take turns: the next comes in from below as the
   last lifts away. The card shows at REVEAL, and only then does the turning begin. */
function tips() {
  const b = el(), slots = b ? [...b.querySelectorAll('.boot-tip-item')] : [];
  const all = typeof BOOT_TIPS !== 'undefined' && Array.isArray(BOOT_TIPS) ? BOOT_TIPS : [];
  const deck = all.filter(t => t && typeof t.text === 'string' && (t.kind === 'fact' || (t.kind === 'tip' && document.documentElement.dataset.bootTips !== 'off')));
  if (slots.length < 2 || !deck.length) return;
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  let n = 0, slot = 0;
  const show = () => {
    const t = deck[n++ % deck.length], next = slots[slot], last = slots[slot ^ 1];
    next.dataset.kind = t.kind;
    next.querySelector('.boot-chip-label').textContent = t.kind === 'fact' ? 'Did you know?' : 'Tip';
    write(next.querySelector('p'), t.text);
    last.classList.replace('on', 'off');
    next.classList.remove('off'); void next.offsetWidth;   // back below, unseen, before it rises
    next.classList.add('on');
    slot ^= 1;
  };
  show();
  setTimeout(() => {
    if (done) return;
    b.classList.add('tips');
    if (deck.length > 1) rotation = setInterval(show, ROTATE);
  }, still() ? 0 : Math.max(0, REVEAL * scale() - performance.now()));
}
const stopTips = () => { clearInterval(rotation); rotation = 0; };

/* ---------- the stages ---------- */
/* The boot may begin: once the M is written (stage 1), the screen is marked as holding, a frame is
   let through so the meter's sheen reaches the compositor, and begin() builds the board. */
export function bootStarted(begin) {
  if (started) return; started = true;
  const b = el(); if (!b) { setTimeout(begin); return; }
  b.dataset.state = 'booting';
  addEventListener('keydown', onKey, true); b.addEventListener('pointerdown', skip);
  bootStep('code'); tips();
  after('boot-written', WRITTEN * scale() - performance.now(), () => {
    if (done) { begin(); return; }
    b.classList.add('holding'); bootStep('board', 'on');
    requestAnimationFrame(() => setTimeout(begin));
  });
}

/* The first frame has been drawn (or, from the 8 s fallback, has not): stage 3, then the screen
   lifts. Once only: later calls return at once, so the frame loop can call it every frame. */
export function bootReady(drawn = true) {
  if (ready) return; ready = true;
  bootStep('light', drawn === false ? 'no' : 'ok');
  const b = el(); if (!b || done) { lift(); return; }
  b.classList.remove('holding');
  if (still()) { lift(); return; }
  b.classList.add('go');
  after('boot-set', SET * scale(), lift);
}
/* True while the screen covers a board that has drawn: the frame loop leaves it alone until then. */
export const bootCovering = () => ready && !done;

/* The screen fades and is removed. transitionend can be missed (a hidden tab, a transition cut
   short), so a timer removes it regardless. */
function lift() {
  if (done) return; done = true; release(); stopTips(); removeEventListener('keydown', onKey, true);
  const b = el(); if (!b) return;
  if (still()) { b.remove(); return; }
  const gone = () => b.remove();   // a second call does nothing
  b.addEventListener('transitionend', e => { if (e.target === b) gone(); });
  setTimeout(gone, LIFT * scale() + 300);
  b.classList.add('done');
}

/* The boot stopped (no WebGL) or failed: away at once, so whatever explains it can be seen. */
export function bootStop() { ready = done = true; release(); stopTips(); removeEventListener('keydown', onKey, true); el()?.remove(); }
