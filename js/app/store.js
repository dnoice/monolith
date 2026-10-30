/*
✒ Metadata
    - Title: Shared Store (MONOLITH Edition - v1.0)
    - File Name: store.js
    - Relative Path: js/app/store.js
    - Artifact Type: javascript
    - Version: 1.0.2
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] —
      app.tierKey names one of Dennis's five graphics levels, or Custom,
      and is set by js/scene/quality.js.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, written for the separation of concerns Dennis asked for: the
      variables that more than one module reassigns, in one object.

✒ Description:
    The one object for state that several modules change: whether a game has
    started, the selected square, whose move is being viewed, the hint, the
    render tier and the rest. An imported binding cannot be reassigned, so
    these live here as app.name instead of as variables.

✒ Key Features:
    - 22 shared values, grouped by the module that owns each.
    - Initial values where they are constants; the rest are set by their
      owner's init().
    - Everything else stays in its own module, exported read-only.

✒ Usage Instructions:
    Import it and read or assign a value:
        import { app } from '../app/store.js';
        if (!app.busy) app.selected = sq;

✒ Other Important Information:
    - Dependencies: none.
    - Compatible platforms: current Chrome, Edge, Firefox and Safari, served
      over http(s); ES modules do not load from file://.
---------
*/
/* The variables more than one module reassigns. An imported binding is read-only, so these live here
   as app.name; everything else stays in its own module. Grouped by the module that owns each. */
export const app = {
  /* app/base */
  SPEED: undefined,       // animation speed: the Speed setting, capped by reduced motion; set by app/base's init()
  /* scene/quality */
  tierKey: undefined,     // the graphics level in use (minimal … ultra) or 'custom'; set by scene/quality.js
  /* scene/phantoms */
  ghostWarm: 'pending',   // 'pending' until the ghost shaders are compiled, then 'done'
  /* scene/camera */
  shake: 0,               // camera shake still to play out
  /* app/sound */
  muted: false,           // the Sound setting is off
  /* app/state */
  started: false,         // a game has started
  setupOpen: true,        // the Play pane shows the new-game setup
  rolling: false,         // the die is rolling for a random side
  orient: undefined,      // the side at the bottom of the board, 'w' or 'b'; set by app/state's init()
  selected: -1,           // the selected square, -1 for none
  legalFor: [],           // the selected piece's legal moves
  busy: false,            // a move is animating
  lastMove: null,         // the last move's from and to squares
  view: null,             // the ply under review, null when live
  hint: null,             // the hint on show and its step, or null
  cpuThinking: false,     // the computer is searching for its move
  fenDirty: false,        // the FEN box was edited and not yet loaded
  /* game/lines */
  analysisGen: 0,         // the evaluation search's generation; stale results are dropped
  calc: undefined,        // Calculate moves' candidates; set by game/lines's init()
  /* scene/worlds */
  worldName: 'cathedral', // the world on screen
  /* ui/analyze */
  fieldOn: false,         // the move-value field is shown
  /* ui/position */
  fenSel: -1,             // the FEN field selected on the Position tab, -1 for none
};
