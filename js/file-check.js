/*
✒ Metadata
    - Title: File Check (MONOLITH Edition - v1.1)
    - File Name: file-check.js
    - Relative Path: js/file-check.js
    - Artifact Type: javascript
    - Version: 1.1.0
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.1.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — For the
      loading screen Dennis asked for: from disk, where nothing else would
      lift it, the screen goes before the note shows; served, it goes at the
      window's load event if the page's modules never started the boot.
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose, and this header names the page by its file in the repository,
      index.html.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, written with the separation of concerns Dennis asked for:
      since the page became ES modules it runs only from a server, and a
      page opened from disk now says so instead of staying blank.

✒ Description:
    The one check that must work without modules: opened straight from disk
    (file://), the page cannot run its ES modules, so this plain script
    takes the loading screen away and shows the note that says to open it
    through a server. Served, it only stands by in case the modules never
    start the boot (main.js blocked or failing to load), and then takes the
    loading screen away at the window's load event.

✒ Key Features:
    - Runs as a classic script, which browsers still run from file://.
    - From disk: removes the loading screen (#boot) and shows #serve-fail,
      the note that covers the page.
    - Served: removes the loading screen at the load event only when the
      boot never started (#boot has no data-state); otherwise
      js/ui/boot-screen.js owns it.

✒ Usage Instructions:
    Loaded by index.html before every other script. Nothing to call.

✒ Other Important Information:
    - Dependencies: the #serve-fail, #boot and #app elements in the page.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari.
---------
*/
/* Opened straight from disk (file://), browsers refuse to run the page's ES modules, so nothing else
   would start. This plain script still runs there, and shows the note that says what to do; the
   loading screen, which nothing would lift, goes first. */
(function () {
  function unboot() {
    var b = document.getElementById('boot'); if (b && b.parentNode) b.parentNode.removeChild(b);
    var a = document.getElementById('app'); if (a) a.removeAttribute('aria-busy');
  }
  if (location.protocol === 'file:') { unboot(); var note = document.getElementById('serve-fail'); if (note) note.classList.add('show'); return; }
  /* Served, js/main.js takes the loading screen away once the board has drawn. If main.js never got
     as far as starting the boot (blocked, missing, or failing to load one of its modules), nothing
     would: by the window's load event the page's modules have run, so a boot not yet marked as
     started never will be, and the screen goes. */
  window.addEventListener('load', function () { var b = document.getElementById('boot'); if (b && !b.dataset.state) unboot(); });
})();
