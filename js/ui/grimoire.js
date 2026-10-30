/*
✒ Metadata
    - Title: Grimoire (MONOLITH Edition - v1.2)
    - File Name: grimoire.js
    - Relative Path: js/ui/grimoire.js
    - Artifact Type: javascript
    - Version: 1.2.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From
      the release audit Dennis asked for: the Grimoire draws at boot (a
      reload onto it showed an empty index), keeps its place and focus on
      phones and after Back, lists its terms as list items holding
      buttons, and ignores a damaged saved category.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
      Position term's Go to button opens the view its where names first
      (Read, Set up or Studies).
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The Grimoire, the reference tab, and term cards anywhere on the page.
    The index searches terms, other names and definitions; an article shows
    a term from three viewpoints.

✒ Key Features:
    - grFind(): scored search over term, other names and text.
    - grRender() and grOpen(): the index and articles, with history
      (grBack).
    - termify(): marks terms in the markup.
    - termOpen() and termClose(): the term card beside any marked term.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. js/main.js calls
    its init() once, as boot step 21 of 26. Other modules import from it,
    for example:
        import { termify, gr, grRender } from '../ui/grimoire.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js, ui/nav.js and ui/position.js;
      globals GRIMOIRE
      (js/data/grimoire.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { $, panelScroller, prefs, reduceMotion, savePrefs } from '../app/base.js';
import { NAV, setTab } from './nav.js';
import { setPosView } from './position.js';

/* ---------- Grimoire: the reference tab, and term cards anywhere ----------
   Dennis's request (10/22/2026): a tab that explains every term on these screens, not only what it
   means but how it reads in a game, in analysis and inside the engine. Entries live in GRIMOIRE
   (js/data/grimoire.js); this is the reader. The index searches terms, other names and the text,
   filtered by category; an article shows the three viewpoints, where the thing is in MONOLITH (with
   a jump there), an example and related terms. Anywhere in the app, a label with a dotted underline
   is a term: a click or Enter opens its card beside it (one card at a time), with Open in Grimoire
   for the full entry. :define <term> does the same from the palette. */
const GR_CATS = [['all', 'All'], ['rules', 'Rules'], ['notation', 'Notation'], ['tactics', 'Tactics'], ['eval', 'Evaluation'], ['engine', 'Engine'], ['analysis', 'Analysis'], ['testing', 'Testing'], ['interface', 'Interface']];
const GR_CAT_NAME = Object.fromEntries(GR_CATS);
const GR_VIEWS = [
  ['game', 'In a game', 'M12 2a3.2 3.2 0 0 0-2 5.7C8.7 8.4 8 9.6 8 11h2l-1.2 6h6.4L14 11h2c0-1.4-.7-2.6-2-3.3A3.2 3.2 0 0 0 12 2zM6 19v3h12v-3z'],
  ['analysis', 'In analysis', 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z'],
  ['engine', 'Inside the engine', 'M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z']
];
export const grById = new Map(GRIMOIRE.map(e => [e.id, e]));
export const gr = { cat: 'all', q: '', id: null, list: [] };
const grNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[_\-–—/·().,:;'"!?]+/g, ' ').replace(/\s+/g, ' ').trim();
function grScore(e, q) {
  if (!q) return 1;
  const t = grNorm(e.term), ak = (e.aka || []).map(grNorm), id = e.id.replace(/-/g, ' ');
  if (t === q || id === q || ak.includes(q)) return 100;
  if (t.startsWith(q)) return 80;
  if (ak.some(a => a.startsWith(q))) return 70;
  if (t.includes(q) || ak.some(a => a.includes(q))) return 50;
  const body = grNorm([e.def, e.game, e.analysis, e.engine, e.where, e.example].filter(Boolean).join(' '));
  return q.split(' ').every(w => body.includes(w)) ? 10 : 0;
}
const grSort = (a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' });
/* Where "Go to" lands: the control an article names, when it is on screen there (a missing or hidden
   one leaves the jump at the top of the tab). Kept beside the code that knows the page's markup,
   rather than in the entries. */
const GR_AT = {
  'legal-move': '#set-legal', 'ranks-and-files': '#set-coords', explore: '#set-explore', worlds: '[data-world]', 'graphics-tiers': '#gfx-meter', tips: '[data-tips]',
  fen: '#fen', castling: '#pos-rules', 'en-passant': '#pos-rules', 'fifty-move-rule': '#pos-rules', endgame: '#pr-phase', studies: '#st-cats',
  'passed-pawn': '#pr-legend', 'isolated-pawn': '#pr-legend', 'doubled-pawns': '#pr-legend', 'open-file': '#pr-legend', 'bishop-pair': '#pr-legend',
  hint: '#btn-hint', resignation: '#btn-resign', coach: '#coach', 'calculate-moves': '#btn-calc', 'best-line': '#eval-switch', 'eval-bar': '#eval-switch', evaluation: '#eval-switch',
  'skill-levels': '#level, #level-live', 'uci-elo': '#level, #level-live'
};
function grLand(sel) {
  const t = [...document.querySelectorAll(sel)].find(el => !el.closest('[hidden]')); if (!t) return;
  const d = t.closest('details'); if (d && !d.open) d.open = true;   // the Coach card's engine lines
  if (!t.getClientRects().length) return;
  const row = t.closest('.switch-row,.set-item') || (t.matches('input,button,select,textarea') ? t.parentElement : t);
  // centred in the panel's own scroller (scrollIntoView would move the page around it on phones)
  const sc = panelScroller(), a = row.getBoundingClientRect(), b = sc.getBoundingClientRect();
  sc.scrollTo({ top: Math.max(0, sc.scrollTop + a.top - b.top - Math.max(0, (b.height - a.height) / 2)), behavior: reduceMotion ? 'auto' : 'smooth' });
  row.classList.remove('gr-land'); void row.offsetWidth; row.classList.add('gr-land');
  setTimeout(() => row.classList.remove('gr-land'), 1600);
  // a switch, slider or button takes the focus; a text field does not (a phone would open its keyboard)
  if (t.matches('button,select,input[type="checkbox"],input[type="range"]') && !t.disabled) t.focus({ preventScroll: true });
}
function grFilter() {
  const q = grNorm(gr.q);
  const pool = GRIMOIRE.filter(e => gr.cat === 'all' || e.cat === gr.cat);
  return q ? pool.map(e => ({ e, s: grScore(e, q) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || grSort(a.e, b.e)).map(x => x.e) : pool.slice().sort(grSort);
}
/* the best entry for free text (palette, links) */
export function grFind(text) {
  const q = grNorm(text); if (!q) return null;
  let best = null, bs = 0; for (const e of GRIMOIRE) { const s = grScore(e, q); if (s > bs) { bs = s; best = e; } }
  return best;
}
function grMark(el, text, q) {
  const i = q ? grNorm(text).indexOf(q) : -1;
  if (i < 0 || grNorm(text).length !== text.length) { el.textContent = text; return; }
  const m = document.createElement('mark'); m.textContent = text.slice(i, i + q.length);
  el.append(text.slice(0, i), m, text.slice(i + q.length));
}
function grBuildCats() {
  const box = $('#gr-cats'); box.innerHTML = '';
  for (const [k, label] of GR_CATS) {
    const n = k === 'all' ? GRIMOIRE.length : GRIMOIRE.filter(e => e.cat === k).length; if (!n) continue;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'gr-cat'; b.dataset.cat = k; b.setAttribute('role', 'radio');
    b.append(label + ' '); const sm = document.createElement('small'); sm.textContent = n; b.appendChild(sm);
    b.addEventListener('click', () => { gr.cat = k; grSave(); grRender(); });
    box.appendChild(b);
  }
}
const grSave = () => { prefs.gr = { cat: gr.cat, id: gr.id }; savePrefs(); };
export function grRender() {
  for (const b of document.querySelectorAll('.gr-cat')) { const on = b.dataset.cat === gr.cat; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }
  const article = $('#gr-article'), index = $('#gr-index');
  gr.list = grFilter();
  if (gr.id && grById.has(gr.id)) { index.hidden = true; article.hidden = false; grFillArticle(grById.get(gr.id)); return; }
  index.hidden = false; article.hidden = true;
  const list = $('#gr-list'), q = grNorm(gr.q); list.innerHTML = '';
  $('#gr-count').textContent = `${gr.list.length} ${gr.list.length === 1 ? 'term' : 'terms'}${gr.cat !== 'all' ? ` in ${GR_CAT_NAME[gr.cat]}` : ''}${q ? ` matching “${gr.q.trim()}”` : ''}`;
  if (!gr.list.length) {
    // not a dead end: when other categories have the word, say how many and go there in one step
    const inAll = gr.cat !== 'all' && q ? GRIMOIRE.filter(e => grScore(e, q) > 0).length : 0, word = gr.q.trim();
    const p = document.createElement('p'); p.className = 'gr-none';
    p.textContent = inAll ? `Nothing in ${GR_CAT_NAME[gr.cat]} matches “${word}”.` : `Nothing matches “${word}”. Try a shorter word, or another spelling.`;
    const row = document.createElement('div'); row.className = 'row gr-none-act';
    const btn = (cls, text, act) => { const b = document.createElement('button'); b.type = 'button'; b.className = `btn ${cls} small`; b.textContent = text; b.addEventListener('click', () => { act(); grRender(); $('#gr-q').focus(); }); row.appendChild(b); };
    if (inAll) btn('filled', `Show ${inAll} in All`, () => { gr.cat = 'all'; grSave(); });
    btn('outlined', 'Clear search', () => { gr.q = ''; $('#gr-q').value = ''; });
    list.append(p, row); return;
  }
  let letter = '';
  for (const e of gr.list) {
    if (!q) { const L = /[a-z]/i.test(e.term[0]) ? e.term[0].toUpperCase() : '#'; if (L !== letter) { letter = L; const h = document.createElement('div'); h.className = 'gr-letter'; h.setAttribute('role', 'presentation'); h.textContent = L; list.appendChild(h); } }
    const li = document.createElement('div'); li.setAttribute('role', 'listitem');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'gr-item'; b.dataset.cat = e.cat; b.dataset.id = e.id; li.appendChild(b);
    const top = document.createElement('span'); top.className = 'gr-it-top';
    const t = document.createElement('b'); grMark(t, e.term, q);
    const c = document.createElement('span'); c.className = 'gr-it-cat'; c.textContent = GR_CAT_NAME[e.cat];
    top.append(t, c);
    const d = document.createElement('p'); d.textContent = e.def;
    b.append(top, d); b.addEventListener('click', () => grOpen(e.id));
    list.appendChild(li);
  }
}
function grFillArticle(e) {
  const art = $('#gr-article'); art.dataset.cat = e.cat;
  const chip = $('#gr-a-cat'); chip.textContent = GR_CAT_NAME[e.cat]; chip.dataset.cat = e.cat;
  $('#gr-a-term').textContent = e.term;
  $('#gr-a-aka').textContent = e.aka && e.aka.length ? `Also: ${e.aka.join(' · ')}` : '';
  $('#gr-a-def').textContent = e.def;
  const views = $('#gr-a-views'); views.innerHTML = '';
  for (const [k, label, icon] of GR_VIEWS) {
    if (!e[k]) continue;
    const v = document.createElement('section'); v.className = 'gr-view';
    v.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icon}"/></svg><h4></h4><p></p>`;
    v.querySelector('h4').textContent = label; v.querySelector('p').textContent = e[k]; views.appendChild(v);
  }
  $('#gr-a-where-box').hidden = !e.where; $('#gr-a-where').textContent = e.where || '';
  const go = $('#gr-a-go'), tab = NAV.find(n => n.id === e.go && n.id !== 'grimoire');
  // a Position term goes to the view its "where" names first (Read, Set up or Studies)
  const pv = e.go === 'position' && (/Position, (Read|Set up|Studies)/.exec(e.where || '') || [])[1];
  go.hidden = !tab;
  if (tab) { go.textContent = `Go to ${tab.label}${pv ? `: ${pv}` : ''}`; go.onclick = () => { setTab(tab.id); if (pv) setPosView({ Read: 'read', 'Set up': 'setup', Studies: 'studies' }[pv]); if (GR_AT[e.id]) requestAnimationFrame(() => grLand(GR_AT[e.id])); }; }
  $('#gr-a-ex-box').hidden = !e.example; $('#gr-a-ex').textContent = e.example || '';
  const see = $('#gr-a-see'); see.innerHTML = '';
  const rel = (e.see || []).map(id => grById.get(id)).filter(Boolean);
  $('#gr-a-see-box').hidden = !rel.length;
  for (const r of rel) { const b = document.createElement('button'); b.type = 'button'; b.dataset.cat = r.cat; b.textContent = r.term; b.addEventListener('click', () => grOpen(r.id)); see.appendChild(b); }
  // previous and next walk the list the reader came from (search and category included)
  const at = gr.list.findIndex(x => x.id === e.id), seq = at >= 0 ? gr.list : GRIMOIRE.slice().sort(grSort), k = seq.findIndex(x => x.id === e.id);
  const prev = seq[k - 1], next = seq[k + 1];
  $('#gr-prev').disabled = !prev; $('#gr-next').disabled = !next;
  $('#gr-prev').title = prev ? `Previous: ${prev.term}` : ''; $('#gr-next').title = next ? `Next: ${next.term}` : '';
  $('#gr-prev').onclick = () => prev && grOpen(prev.id); $('#gr-next').onclick = () => next && grOpen(next.id);
}
/* Opening an article starts it at its top, and Back returns to where the index was, with the
   focus on the term that was open (or the search box). The panel's scroller is the panes on a wide
   screen and the whole panel at phone width. */
export function grOpen(id) {
  if (!grById.has(id)) return;
  if (!gr.id) gr.scroll = panelScroller().scrollTop;
  gr.id = id; grSave(); grRender();
  panelScroller().scrollTop = 0; $('#gr-a-term').focus({ preventScroll: true });
}
export function grBack() {
  const was = gr.id; gr.id = null; grSave(); grRender();
  panelScroller().scrollTop = gr.scroll || 0;
  const item = was && [...document.querySelectorAll('#gr-list .gr-item')].find(b => b.dataset.id === was);
  (item || $('#gr-q')).focus({ preventScroll: true });
}
/* A search from outside the Grimoire (the palette's :define with no exact match): the index,
   filtered, and remembered. */
export function grSearch(q) { gr.q = q || ''; $('#gr-q').value = gr.q; gr.id = null; grSave(); grRender(); }

/* Term cards: one at a time, beside the term that opened it. */
const tp = { anchor: null, id: null };
export function termify(root = document) {
  for (const el of root.querySelectorAll ? root.querySelectorAll('[data-term]') : []) {
    const e = grById.get(el.dataset.term);
    if (!e) { el.removeAttribute('data-term'); continue; }   // no entry, no underline: a dead click would lie
    if (el.dataset.termReady) continue;
    el.dataset.termReady = '1'; el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-haspopup', 'dialog'); el.setAttribute('aria-expanded', 'false');
    if (!el.title) el.title = `${e.term}: open its Grimoire card`;
  }
}
function termOpen(anchor, id, fromKey) {
  const e = grById.get(id); if (!e) return;
  if (tp.anchor === anchor) { termClose(fromKey); return; }
  termClose(false);
  const pop = $('#term-pop');
  tp.anchor = anchor; tp.id = id; anchor.setAttribute('aria-expanded', 'true');
  $('#tp-cat').textContent = GR_CAT_NAME[e.cat]; $('#tp-cat').dataset.cat = e.cat;
  $('#tp-term').textContent = e.term; $('#tp-def').textContent = e.def;
  const views = $('#tp-views'); views.innerHTML = '';
  for (const [k, label] of GR_VIEWS) {
    if (!e[k]) continue;
    const row = document.createElement('div'); row.className = 'tp-v';
    const b = document.createElement('b'); b.textContent = { game: 'Game', analysis: 'Analysis', engine: 'Engine' }[k];
    const sp = document.createElement('span'); sp.textContent = e[k]; row.append(b, sp); views.appendChild(row);
  }
  pop.hidden = false; pop.classList.remove('in'); void pop.offsetWidth; pop.classList.add('in');
  termPlace();
  if (fromKey) $('#tp-open').focus();
}
function termPlace() {
  const pop = $('#term-pop'), a = tp.anchor; if (!a || pop.hidden) return;
  const r = a.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight || (!r.width && !r.height)) { termClose(false); return; }
  const w = pop.offsetWidth, h = pop.offsetHeight, m = 12;
  let x = Math.min(innerWidth - w - m, Math.max(m, r.left + r.width / 2 - w / 2));
  let y = r.bottom + 8; if (y + h > innerHeight - m) y = Math.max(m, r.top - 8 - h);
  pop.style.left = `${Math.round(x)}px`; pop.style.top = `${Math.round(y)}px`;
}
export function termClose(restore) {
  const pop = $('#term-pop'); if (pop.hidden && !tp.anchor) return;
  pop.hidden = true;
  const a = tp.anchor; tp.anchor = null; tp.id = null;
  if (a) { a.setAttribute('aria-expanded', 'false'); if (restore && a.isConnected) a.focus(); }
}

/* ---------- setup: run once, in order, by js/main.js ---------- */
export function init() {
  if (prefs.gr && typeof prefs.gr === 'object') { if (Object.hasOwn(GR_CAT_NAME, prefs.gr.cat)) gr.cat = prefs.gr.cat; if (grById.has(prefs.gr.id)) gr.id = prefs.gr.id; }
  $('#gr-back').addEventListener('click', grBack);
  $('#gr-q').addEventListener('input', e => { gr.q = e.target.value; grRender(); });
  $('#gr-q').addEventListener('keydown', e => {
    if (e.key === 'Escape' && e.target.value) { e.preventDefault(); e.stopPropagation(); e.target.value = ''; gr.q = ''; grRender(); }
    else if (e.key === 'Enter' && gr.list.length) { e.preventDefault(); grOpen(gr.list[0].id); }
  });
  // capture phase: a term inside a label opens its card instead of toggling the label's control
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-term]');
    if (t && !e.target.closest('#term-pop')) { e.preventDefault(); e.stopPropagation(); termOpen(t, t.dataset.term, false); return; }
    if (tp.anchor && !e.target.closest('#term-pop')) termClose(false);
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && tp.anchor) { e.preventDefault(); e.stopPropagation(); termClose(true); return; }
    /* / searches from anywhere on the Grimoire, the rail included (the page's own shortcuts leave a
       tablist's keys alone), unless it is being typed into a field or the palette is open */
    if (e.key === '/' && prefs.tab === 'grimoire' && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) && !$('#palette').classList.contains('show')) { e.preventDefault(); if (gr.id) grBack(); $('#gr-q').focus(); return; }
    const t = e.target.closest && e.target.closest('[data-term]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); termOpen(t, t.dataset.term, true); }
  }, true);
  addEventListener('resize', termPlace);
  document.addEventListener('scroll', e => { if (tp.anchor && !(e.target.closest && e.target.closest('#term-pop'))) termPlace(); }, true);
  $('#tp-close').addEventListener('click', () => termClose(true));
  $('#tp-open').addEventListener('click', () => { const id = tp.id; termClose(false); setTab('grimoire'); grOpen(id); });
  for (const b of document.querySelectorAll('.badge')) if (!b.dataset.term) b.dataset.term = 'source-badges';
  grBuildCats(); termify();
  grRender();   // drawn now, so a reload onto the Grimoire (or its saved article) shows it at once
}
