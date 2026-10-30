/*
✒ Metadata
    - Title: Snackbar (MONOLITH Edition - v1.0)
    - File Name: snackbar.js
    - Relative Path: js/ui/snackbar.js
    - Artifact Type: javascript
    - Version: 1.0.2
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Found
      in the release audit Dennis asked for: a dismissed message's buttons
      are disabled at once, where before they stayed focusable while
      invisible (Tab and Enter could still run "Play it").
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: split out of wizards-chess.html 2.4.0 when
      Dennis asked for a proper separation of concerns.

✒ Description:
    One message at a time at the foot of the stage, with optional actions;
    it hides itself after a few seconds unless it is sticky.

✒ Key Features:
    - snack(msg, actions, sticky).
    - hideSnack().
    - Actions as text or filled buttons.

✒ Usage Instructions:
    An ES module of the page; nothing in it runs on import. It has no setup
    of its own: its code runs when other modules call it. Other modules
    import from it, for example:
        import { snack, hideSnack } from '../ui/snackbar.js';

✒ Other Important Information:
    - Dependencies: imports app/base.js.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s) (Live Server, a static host, the artifact); ES modules do
      not load from file://.
---------
*/
import { $ } from '../app/base.js';

/* ---------- snackbar: one message at a time ---------- */
let snackTimer = 0, snackKind = '';
/* kind names a message that something else may need to withdraw (the promotion chooser, when the
   position it was offered for is no longer on the board). */
export function snack(msg, actions = [], sticky = false, kind = '') {
  const sb = $('#snackbar'); sb.innerHTML = ''; clearTimeout(snackTimer); snackKind = kind;
  const m = document.createElement('span'); m.className = 'msg'; m.textContent = msg; sb.appendChild(m);
  for (const a of actions) {
    const b = document.createElement('button'); b.className = 'btn ' + (a.filled ? 'filled' : 'text'); b.textContent = a.label;
    b.addEventListener('click', () => { hideSnack(); a.act(); }); sb.appendChild(b);
  }
  sb.classList.add('show');
  if (!sticky) snackTimer = setTimeout(hideSnack, 4200);
}
/* A dismissed message fades out, and its buttons are disabled at once, so an invisible "Play it"
   is never one Tab and Enter away from ending a game. (The status region itself stays exposed, so
   the next message is still announced.) */
export function hideSnack(kind = '') {
  if (kind && kind !== snackKind) return;   // only that kind of message, when one is asked for
  const sb = $('#snackbar'); sb.classList.remove('show'); clearTimeout(snackTimer); snackKind = '';
  for (const b of sb.querySelectorAll('button')) b.disabled = true;
}
