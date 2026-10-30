/*
✒ Metadata
    - Title: MONOLITH Core (MONOLITH Edition - v1.1)
    - File Name: monolith.js
    - Relative Path: js/core/monolith.js
    - Artifact Type: library
    - Version: 1.1.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose, and this header names the page by its file in the repository,
      index.html.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a run whose pairs have all scored the
      same now reaches a decision (from the second pair on, a small prior
      gives the variance a value; twelve straight 2-0 pairs accept H1 at
      elo1 10); the Elo interval is unbounded after one pair and never has
      no width; and the sharpness compares lines 1 and 2 themselves, with
      none when line 2 is missing. The recorded run's trace is unchanged.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The instrument's arithmetic as pure functions: expected score,
    White-view scores, WDL, accuracy and the SPRT statistics behind the
    Crucible. Shared by the page and by Node checks against the recorded
    runs (data/analyze.json, data/gauntlet.json).

✒ Key Features:
    - expected(): expected score on a logistic scale fitted to the recorded
      field.
    - Score conventions: { cp, mate } in one stated view; fmtScore() and its
      siblings display White's view with U+2212 for minus and #n for mate.
    - fromInfo() and fromRecord(): engine and recorded scores to White's
      view; flip().
    - wdlWhite() and sharpness(): the WDL ribbon and its halo.
    - field() and fork(): the move-value field and the fork walk.
    - Elo and the SPRT: scoreOfElo(), eloOfScore(), pentanomial(),
      pairStats(), gsprt(), bounds(), eloEstimate() and anomaly().
    - luminance() and contrast(): the System sheet's contrast ledger.

✒ Usage Instructions:
    Loaded by index.html as a classic script, so Monolith is a global for
    every module. In Node:
        const Monolith = require('./js/core/monolith.js');

✒ Examples:
    Monolith.expected({ cp: 35, mate: null });   // 0.53
    Monolith.flip({ cp: 35, mate: null });       // { cp: -35, mate: null }

✒ Other Important Information:
    - Dependencies: none.
    - Compatible platforms: current browsers as a classic script (it defines
      a global), and Node.js 18 or newer through require().
---------
*/
/* MONOLITH core: the instrument's arithmetic. Pure functions, no DOM and no Three.js, shared by
   the page and by node checks against the recorded runs (data/analyze.json, data/gauntlet.json).
   Conventions: a score is { cp, mate } in one stated view (mate null for centipawn scores);
   display is always White's view, with U+2212 for minus and #n for mate. */
const Monolith = (() => {
  const K = 271.58562551601267;          // logistic scale fitted to the recorded field: reproduces exp_white to 1e-12
  const MINUS = '−';
  const isMate = s => s && s.mate !== null && s.mate !== undefined;
  /* Expected score for the side the score belongs to: mate in n wins (1), being mated loses (0). */
  const expected = s => !s ? null : isMate(s) ? (s.mate > 0 ? 1 : 0) : 1 / (1 + Math.exp(-s.cp / K));
  const flip = s => !s ? s : isMate(s) ? { cp: null, mate: -s.mate } : { cp: -s.cp, mate: null };
  /* Engine info ({ kind, value }, side to move) → White-view score. */
  const fromInfo = (inf, turn) => {
    const sgn = turn === 'w' ? 1 : -1;
    return inf.kind === 'mate' ? { cp: null, mate: inf.value * sgn } : { cp: inf.value * sgn, mate: null };
  };
  /* Recorded scores ({ mate, cp }) carry cp ±9996 beside a mate; the mate wins. */
  const fromRecord = s => s.mate !== null && s.mate !== undefined ? { cp: null, mate: s.mate } : { cp: s.cp, mate: null };
  const sign = v => v > 0 ? '+' : v < 0 ? MINUS : '';
  const fmtScore = s => !s ? '—' : isMate(s) ? `#${s.mate < 0 ? MINUS : ''}${Math.abs(s.mate)}` : `${sign(s.cp)}${(Math.abs(s.cp) / 100).toFixed(2)}`;
  const fmtCp = cp => `${sign(cp)}${(Math.abs(cp) / 100).toFixed(2)}`;
  // a number and its unit are joined by a no-break space, so a line never breaks between them
  const fmtPct = (x, d = 1) => x === null || x === undefined || !isFinite(x) ? '—' : `${(x * 100).toFixed(d)}\u00a0%`;
  const fmtCount = n => n === null || n === undefined ? '—' : n >= 1e9 ? `${(n / 1e9).toFixed(2)}\u00a0G` : n >= 1e6 ? `${(n / 1e6).toFixed(2)}\u00a0M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}\u00a0k` : String(Math.round(n));
  /* WDL per mille from the side to move → White's view. */
  const wdlWhite = (wdl, turn) => !wdl ? null : turn === 'w' ? wdl.slice() : [wdl[2], wdl[1], wdl[0]];

  /* Sharpness (MultiPV Dropoff): expected score lost from line 1 to line 2 and to line 3, from the
     mover's side. The halo comes on at 10 %. */
  const HALO = 0.10;
  /* By line: d12 compares lines 1 and 2 themselves, so a missing line 2 gives no sharpness (not
     line 3 standing in for it). */
  function sharpness(scoresStm) {
    const e = scoresStm.map(s => s ? expected(s) : null);
    if (e[0] === null || e[0] === undefined || e[1] === null || e[1] === undefined) return null;
    const d12 = e[0] - e[1], d13 = e[2] === null || e[2] === undefined ? null : e[0] - e[2];
    return { d12, d13, halo: d12 >= HALO };
  }

  /* Root move-value field. moves: [{ to, e }] with e the mover's expected score. Each square takes
     the best move landing on it; brightness is full at no loss and dark at a loss of 50 %. */
  const FIELD_DARK = 0.5, FIELD_NEAR = 0.05;
  function field(moves) {
    const sq = new Array(64).fill(null);
    let best = null;
    for (const m of moves) {
      if (m.e === null || m.e === undefined) continue;
      if (!best || m.e > best.e) best = m;
      if (!sq[m.to] || m.e > sq[m.to].e) sq[m.to] = m;
    }
    if (!best) return null;
    const bright = sq.map(m => m ? Math.max(0, Math.min(1, 1 - (best.e - m.e) / FIELD_DARK)) : 0);
    const near = moves.filter(m => m.e !== null && best.e - m.e <= FIELD_NEAR).length;
    const lit = sq.filter(m => m && best.e - m.e <= FIELD_NEAR).length;
    return { bright, best, perSquare: sq, near, lit, total: moves.length };
  }

  /* Fork walk: the trunk node whose two best replies are closest in expected score. Gaps are
     |E1 − E2| (view-independent). Instability: the walk's first choice differs from the trunk. */
  function fork(plies) {
    let at = -1, min = Infinity;
    plies.forEach((p, i) => { if (p && p.gap !== null && p.gap < min) { min = p.gap; at = i; } });
    return at;
  }

  /* Pentanomial GSPRT with logistic Elo (Van den Bergh's approximation), over pair scores in
     {0, .25, .5, .75, 1}. Returns LLR 0 for a single pair, which says nothing about the spread. */
  const scoreOfElo = elo => 1 / (1 + Math.pow(10, -elo / 400));
  const eloOfScore = s => s <= 0 ? -Infinity : s >= 1 ? Infinity : -400 * Math.log10(1 / s - 1);
  /* The pair statistics. While every pair so far has scored the same, the sample variance is zero:
     the plain test then never decides and the interval has no width, so a run that one side wins
     every time would go on for ever. From the second pair on, such a run's statistics take a small
     prior instead, one pseudo-pair spread evenly over the five pair scores (a fifth each of 0, ¼,
     ½, ¾ and 1: their sum is ½, their squares ⅜). Twelve straight 2-0 pairs then accept H1 at
     elo1 10, α = β 0.05. Once the pairs differ, the statistics are the plain pentanomial ones,
     the ones the recorded run's trace was computed with. */
  function pairStats(pairs) {
    const n = pairs.length; if (!n) return { n: 0, mean: 0.5, variance: 0, prior: false };
    const sum = pairs.reduce((a, b) => a + b, 0), sq = pairs.reduce((a, b) => a + b * b, 0);
    const mean = sum / n, variance = Math.max(0, sq / n - mean * mean);
    if (n < 2 || variance > 1e-12) return { n, mean, variance, prior: false };
    const N = n + 1, m = (sum + 0.5) / N;
    return { n: N, mean: m, variance: Math.max(0, (sq + 0.375) / N - m * m), prior: true };
  }
  function gsprt(pairs, elo0, elo1) {
    const { n, mean, variance } = pairStats(pairs);
    if (!n || variance <= 1e-12) return 0;
    const s0 = scoreOfElo(elo0), s1 = scoreOfElo(elo1);
    return 0.5 * n * (s1 - s0) * (2 * mean - s0 - s1) / variance;
  }
  const bounds = (alpha, beta) => ({ lower: Math.log(beta / (1 - alpha)), upper: Math.log((1 - beta) / alpha) });
  /* Elo from the mean pair score, with its 95 % interval (unbounded after a single pair). The
     estimate is the plain mean's; the prior above only gives the interval a width. */
  function eloEstimate(pairs) {
    const { n, variance } = pairStats(pairs);
    if (!n) return null;
    const mean = pairs.reduce((a, b) => a + b, 0) / pairs.length;
    if (pairs.length < 2) return { elo: eloOfScore(mean), lo: -Infinity, hi: Infinity, mean };
    const half = 1.96 * Math.sqrt(variance / n);
    return { elo: eloOfScore(mean), lo: eloOfScore(mean - half), hi: eloOfScore(mean + half), mean };
  }
  /* Pentanomial counts from A's pair scores: LL, LD, DD+WL, WD, WW. */
  function pentanomial(pairs) {
    const c = { LL: 0, LD: 0, DD_WL: 0, WD: 0, WW: 0 }, keys = ['LL', 'LD', 'DD_WL', 'WD', 'WW'];
    for (const p of pairs) c[keys[Math.round(p * 4)]]++;
    return c;
  }

  /* Anomaly: a game flagged when one engine's own consecutive evals (two plies apart, White's
     view) go from balanced (|e| ≤ 150) to decisive (|e| ≥ 500). evals[i] belongs to the move at
     moves[openingPlies + i]; the move that caused the jump is the other engine's, one ply before. */
  const BALANCED = 150, DECISIVE = 500;
  function anomaly(evals, openingPlies) {
    for (let i = 2; i < evals.length; i++) {
      if (Math.abs(evals[i - 2]) <= BALANCED && Math.abs(evals[i]) >= DECISIVE)
        return { at: i, ply: openingPlies + i, before: evals[i - 2], cause: evals[i - 1], after: evals[i] };
    }
    return null;
  }

  /* WCAG 2.x contrast ratio between two #rrggbb colours. */
  function luminance(hex) {
    const v = parseInt(hex.slice(1), 16), ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(x => { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  const contrast = (a, b) => { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };

  return { K, MINUS, HALO, FIELD_DARK, FIELD_NEAR, BALANCED, DECISIVE, isMate, expected, flip, fromInfo, fromRecord, fmtScore, fmtCp, fmtPct, fmtCount, wdlWhite,
    sharpness, field, fork, scoreOfElo, eloOfScore, pairStats, gsprt, bounds, eloEstimate, pentanomial, anomaly, luminance, contrast };
})();
if (typeof module !== 'undefined') module.exports = Monolith;
