/*
✒ Metadata
    - Title: System Sheet (MONOLITH Edition - v1.0)
    - File Name: system-sheet.js
    - Relative Path: js/ui/system-sheet.js
    - Artifact Type: javascript
    - Version: 1.0.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    The System sheet in Settings: the MONOLITH solved stops as swatches, and
    a contrast ledger computed in the page from the same colours.

✒ Key Features:
    - SWATCHES: the stops and what each colour means.
    - LEDGER: text and surface pairs.
    - buildSystemSheet(): each ratio computed in the page
      (Monolith.contrast) and checked against its floor.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { buildSystemSheet } from '../ui/system-sheet.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js; globals Monolith
      (js/core/monolith.js).
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { $ } from '../app/base.js';

/* ---------- System sheet (Settings): solved stops and the contrast ledger, measured here ---------- */
const SWATCHES = [['canvas', '#0B0D10', 'base layer'], ['panel', '#14181F', 'docked, 100 %'], ['raised', '#1B212A', 'controls'], ['well', '#0E1116', 'plots'], ['rule', '#262D38', 'dividers'],
  ['sq_dark', '#181D25', 'dark square'], ['sq_light', '#3F4B5B', 'light square'], ['sq_dark_lit', '#1C434C', 'glow at ceiling'], ['sq_light_lit', '#3B6676', 'glow at ceiling'], ['steel', '#ABB5C3', 'black rim'],
  ['piece_white', '#ECE8EF', 'ivory · win'], ['slate', '#556275', 'draw'], ['piece_black', '#0F1318', 'obsidian · loss'], ['glass_worst', '#34373E', 'glass over ivory'],
  ['ink', '#E3E7EE', 'primary'], ['ink2', '#A4ACB9', 'secondary'], ['ink3', '#7E8898', 'tertiary'], ['cyan', '#2CC8D8', 'optimal'], ['amber', '#E8A93A', 'volatile'], ['crimson', '#ED7F83', 'anomaly']];
const LEDGER = [['dry board separation', '#3F4B5B', '#181D25', [1.8, 2.1]], ['black rim on dark square', '#ABB5C3', '#181D25', 3.5], ['black rim on light square', '#ABB5C3', '#3F4B5B', 3],
  ['black rim on lit dark square', '#ABB5C3', '#1C434C', 3], ['black rim on lit light square', '#ABB5C3', '#3B6676', 3], ['ivory on dark square', '#ECE8EF', '#181D25', 3], ['ivory on light square', '#ECE8EF', '#3F4B5B', 3],
  ['ivory on lit light square', '#ECE8EF', '#3B6676', 3], ['rim against obsidian core', '#ABB5C3', '#0F1318', 3], ['obsidian core on light square', '#0F1318', '#3F4B5B', 'rim'], ['WDL draw against loss', '#556275', '#0F1318', 3],
  ['WDL win against draw', '#ECE8EF', '#556275', 3], ['primary ink on panel', '#E3E7EE', '#14181F', 12], ['secondary ink on panel', '#A4ACB9', '#14181F', 7], ['tertiary ink on raised', '#7E8898', '#1B212A', 4.5],
  ['cyan (optimal) on panel', '#2CC8D8', '#14181F', 4.5], ['amber (volatile) on panel', '#E8A93A', '#14181F', 4.5], ['crimson (anomaly) on panel', '#ED7F83', '#14181F', 4.5], ['ink on glass, worst case', '#E3E7EE', '#34373E', 4.5],
  ['crimson on glass, worst case', '#ED7F83', '#34373E', 4.5], ['secondary ink on glass, worst case', '#A4ACB9', '#34373E', 4.5], ['cyan vector on light square', '#2CC8D8', '#3F4B5B', 3]];
export function buildSystemSheet() {
  const sw = $('#swatches');
  for (const [n, hex, note] of SWATCHES) { const d = document.createElement('div'); d.className = 'sw'; d.innerHTML = `<i style="background:${hex}"></i><code></code><span></span>`; d.querySelector('code').textContent = `${n} ${hex}`; d.querySelector('span').textContent = note; sw.appendChild(d); }
  const t = $('#ledger'); t.innerHTML = '<tr><th>Pair</th><th class="r">Ratio</th><th class="r">Floor</th><th class="r">Holds</th></tr>';
  let pass = 0;
  for (const [n, fg, bg, floor] of LEDGER) {
    const r = Monolith.contrast(fg, bg), ok = floor === 'rim' ? true : Array.isArray(floor) ? r >= floor[0] && r <= floor[1] : r >= floor; if (ok) pass++;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><span class="pair" style="background:linear-gradient(90deg,${fg} 50%,${bg} 50%)"></span><span></span></td><td class="r"></td><td class="r"></td><td class="r"></td>`;
    tr.children[0].lastChild.textContent = n; tr.children[1].textContent = `${r.toFixed(2)}:1`;
    tr.children[2].textContent = floor === 'rim' ? 'rim carries it' : Array.isArray(floor) ? `${floor[0]}–${floor[1]}` : `≥ ${floor}`; tr.children[3].textContent = ok ? '✓' : '✗';
    t.appendChild(tr);
  }
  const cap = document.createElement('caption'); cap.className = 'help'; cap.style.captionSide = 'bottom'; cap.style.textAlign = 'left'; cap.style.paddingTop = '6px';
  cap.textContent = `${pass} of ${LEDGER.length} pairs hold their floor, computed in this browser.`; t.appendChild(cap);
}
