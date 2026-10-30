<!--
✒ Metadata
    - Title: MONOLITH Architecture (digiSpace Edition - v1.10)
    - File Name: ARCHITECTURE.md
    - Relative Path: ARCHITECTURE.md
    - Artifact Type: docs
    - Version: 1.10.0
    - Date: 10/26/2026
    - Update: Monday, October 26, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.10.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.17.0: the Conical M Dennis made MONOLITH's official mark, its logo
      in the app bar and its emblem on the loading screen, both written in
      by tools/build-emblem.mjs (one tone read as the dark squares, the
      new brand-logo markers), and the brand system and generators that
      now live under assets/.
    - 1.9.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The tools
      and the load order carry tools/build-piece-models.py and the 3D
      pieces' .blend files Dennis asked for, which the page does not load.
    - 1.9.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.16.0: the slower loading screen Dennis asked for, its meter (the
      five steps, what reports each, and why the screen waits for none past
      the first frame), the tip card and its dataset, and the pace taken
      from Animation speed; js/data/boot-tips.js in the load order and the
      file table.
    - 1.8.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.15.0: the loading screen's three stages and when the boot runs
      among them, the frame loop resting under it, skipping, and the
      builder's timing classes; the graphics meter after Dennis's version
      1.2 drawing; and the models in assets/models/, where Dennis wants
      every asset.
    - 1.7.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.14.0: the loading screen Dennis asked for around his emblem. Its
      markup and the early world script in the load order, its routes away
      (js/ui/boot-screen.js, js/main.js, js/app/loop.js, js/file-check.js),
      and tools/build-emblem.mjs, which writes the emblem into the page.
    - 1.6.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose, and the markup is named by its file in the repository,
      index.html.
    - 1.6.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      calibration kit Dennis chose to publish is now CALIBRATION.md; the
      tools list and the guides point to it.
    - 1.6.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: serving under a sub-path (a GitHub
      Pages project site) and the repository's own files (.nojekyll,
      .gitignore); and, in the file tables, POST_LACK, matCopy(),
      clearFragments() and boardGen, the phantoms' kept shaders,
      worldSettled() and the engine's restart.
    - 1.5.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.11.0: js/ui/gfx-meter.js, the graphics meter Dennis designed, and
      diagram.js's pieceUse().
    - 1.4.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.10.0: js/scene/quality.js holds Dennis's five graphics levels and
      owns app.tierKey; renderer.js, post.js, nav.js and telemetry.js
      described as they now are.
    - 1.3.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.9.0: js/scene/pillars.js puts Dennis's Blender models (models/)
      on MONOLITH's pillar places, loaded by three.js's GLTFLoader.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.8.0: Dennis's house piece set as a fifth dataset
      (js/data/piece-set.js) and the tool that builds it from his drawing
      (tools/build-piece-set.mjs).
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      the Position redesign Dennis asked for in 2.7.0: js/ui/studies.js
      and js/ui/diagram.js added, and position.js, controls.js and
      css/position.css described as they now are.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      record of the page's files, written with 2.5.0, when Dennis asked for
      a proper separation of concerns.

✒ Description:
    How MONOLITH is put together since 2.5.0: what loads in what order, the
    rules every module follows, where shared state lives, what each file
    holds, and how to add to it without breaking the boot.

✒ Key Features:
    - The load order: markup, stylesheets, plain scripts, then the modules.
    - The module rules: definitions at the top level, setup in init(), one
      boot order in js/main.js.
    - The shared store, value by value.
    - Every stylesheet, plain script and module, with its boot step.
    - The loading screen: its stages, when the boot runs among them, and
      every route that takes it away.
    - Recipes for a new panel, module, stylesheet or dataset entry.

✒ Other Important Information:
    - Dependencies: none; this file is documentation.
    - Compatible platforms: any Markdown renderer.
    - Scope: the code's structure. What the features do is in the page's
      header and CHANGELOG.md; the datasets have their own guides
      (COACH_VOICE.md, STUDIES.md), the graphics levels theirs
      (GRAPHICS.md), the level calibrator its own (CALIBRATION.md); the
      engine in engine/README.md.
---------
-->

# Architecture

Until 2.4.0 the app (then named Wizard's Chess) was one HTML file of almost 9,000 lines. In 2.5.0 it
is a page of markup with its styles in `css/` and its code in `js/`, cut at the seams the single
file already had: its section headers. Nothing about the game changed, and nothing about the order in which things happen.

## Serving the page

The page loads ES modules, which browsers run only over http(s). Open the project folder with VS
Code's Live Server (or any static server) and load the page there; the published artifact is served
the same way. Opened straight from disk (`file://`), the page shows a note that says so, put there
by `js/file-check.js`, a plain script that still runs from disk; it takes the loading screen away
first.

Every path the page loads is relative to it (`css/`, `js/`, `engine/`, `assets/models/`, `data/`), so the
folder works at a server's root or under a sub-path, as a GitHub Pages project site serves it
(`https://<user>.github.io/<repo>/`). The `.nojekyll` file at the root tells GitHub Pages to serve
the folder as it is, without running Jekyll over it (Pages reads only that the file exists).
`.gitignore` keeps out what is generated or local: the `.glb.json` wrappers `tools/pack-models.mjs`
writes for hosts that refuse `.glb`, Blender's backup files, editor and OS files, and logs.

## What loads, in order

1. **The markup**: `index.html`. Everything the panels show is in it; the code fills and toggles
   it. It opens with the loading screen (`#boot`, with Dennis's emblem inline, the meter and the
   tip card), and just before it a short inline script sets the world's skin (`data-skin`) from the
   saved preferences, so the screen and the frame around it paint in the world the page opens in,
   and the pace and tips the screen follows (`data-boot-pace`, `data-boot-tips`). See
   [The loading screen](#the-loading-screen).
2. **The stylesheets**: 12 files, one cascade cut at its section breaks, linked in their original
   order, so a later sheet may still refine an earlier one.
3. **`js/file-check.js`** (the note shown from disk, and the loading screen's fallback), then
   **three.js r147** and its examples from jsDelivr: the
   post-processing passes, the mirror (`Reflector`) and the glTF loader (classic scripts, the global
   `THREE`).
4. **The plain scripts**: the rules (`Chess`), the MONOLITH maths (`Monolith`), the levels (`LEVELS`,
   `chooseMove`) and the six datasets. Each defines a global for the page and, under Node, exports
   the same value through `module.exports`, so the tools load exactly what the page runs.
5. **`js/main.js`**, a module, which imports the rest and runs the boot.

The engine (`engine/`), the recorded runs (`data/`) and Dennis's MONOLITH pillars
(`assets/models/*.glb`, see `assets/models/MANIFEST.md`) are fetched by the code at run time, by
paths relative to the page. The `.blend` files beside them are the models' sources; the page never
loads them, nor the 3D pieces' `.blend` files there, which `tools/build-piece-models.py` builds from
`js/scene/board.js` for work in Blender. Everything of Dennis's that is art rather than code lives under `assets/`: his drawings,
the logo and the emblem with the brand system and Python generators that draw them (`brand/`,
`generator/`), the mock-ups, the game's sounds, the models and the README's screenshots, all mapped
in `assets/README.md`.

### Stylesheets

| Order | File | What it holds |
| --- | --- | --- |
| 1 | `css/tokens.css` | The custom properties every other sheet reads: colour, type, shape and motion tokens for the cathedral world, and the MONOLITH solved stops that replace them in the instrument world. |
| 2 | `css/layout.css` | The frame of the page and its shared controls: the app bar, the navigation rail, the stage, the side panel and the move list, with the buttons, segmented choices, switches and cards the panels are built from; and the loading screen. |
| 3 | `css/monolith.css` | How the shared components look in the MONOLITH world, and the components only the instrument has. |
| 4 | `css/crucible.css` | The Crucible tab: the deck that covers the stage, the game board card and the pane beside it. |
| 5 | `css/workspace.css` | The parts of the workspace around the board that are not a tab: the telemetry footer, the Command Palette, the System sheet, the dock, the move sheet and the splitters. |
| 6 | `css/play.css` | The Play pane as cards (Dennis, 10/22/2026), and the match strip in the app bar that names who is playing, the level and whose move it is. |
| 7 | `css/grimoire.css` | The Grimoire tab: the searchable index of terms, the category chips and the article view with its three viewpoints (in a game, in analysis, inside the engine). |
| 8 | `css/position.css` | The Position tab: the view switch, the board diagrams with a palette per world, the studies (Up next, tiles, cards, the Study card's goal tracks), the board reading and the board editor with its coloured FEN. |
| 9 | `css/terms.css` | A Grimoire term wherever it appears on screen: a quiet dotted underline, and the card a click or Enter opens. |
| 10 | `css/coach.css` | The Coach's feed in the Play pane: one note per moment of the game, each with its badge, the move, the score and the text in the Coach's voice. |
| 11 | `css/xray.css` | The Tactical X-Ray readout docked beside the board (Dennis, 10/22/2026): the square, its state, the gauge and the move, with a two-line strip on phones. |
| 12 | `css/media.css` | The overrides for small screens and reduced motion, kept last so they win: on phones and narrow tablets the rail becomes a bottom bar, very narrow screens tighten further, and reduced motion turns transitions off. |

### Plain scripts

| File | Global | Also loaded by |
| --- | --- | --- |
| `js/core/chess.js` | `Chess`: the rules as pure functions over immutable states | `tools/verify-studies.mjs`, `tools/calibrate.js`, `js/core/levels.js` |
| `js/core/monolith.js` | `Monolith`: the instrument's arithmetic | — (Node-ready, for checks against `data/*.json`) |
| `js/core/levels.js` | `LEVELS`, `LEVEL_NO_ELO`, `chooseMove`: the computer's levels | `tools/calibrate.js` |
| `js/data/coach-voice.js` | `COACH_VOICE`: every sentence the Coach can say (COACH_VOICE.md) | — |
| `js/data/opening-book.js` | `OPENING_BOOK`: named openings keyed by position | — |
| `js/data/studies.js` | `STUDIES`: the Position tab's studies (STUDIES.md) | `tools/verify-studies.mjs` |
| `js/data/piece-set.js` | `PIECE_SET`: Dennis's house piece set, the board diagrams' pieces; built from his drawing, never edited by hand | written by `tools/build-piece-set.mjs` |
| `js/data/grimoire.js` | `GRIMOIRE`: the reference entries | — |
| `js/data/boot-tips.js` | `BOOT_TIPS`: the loading screen's tips about the page and facts about chess | — |

## The module rules

The app is ES modules in five folders by concern. Three rules keep the boot what it was in the single
file:

1. **A module's top level only defines.** Function declarations, constants built from literals and
   pure helpers, and `let` declarations. Nothing at the top level touches the page, the scene, the
   preferences or another module's values. A value that needs any of that is declared at the top
   (`export let fieldTex; // set in init()`) and assigned in `init()`.
2. **Setup is `init()`.** Everything a module did when the single file reached its section (building
   meshes, wiring listeners, registering a renderer) is in its exported `init()`, in the same order.
3. **`js/main.js` owns the order.** It calls each `init()` once, in the order the single file ran that
   code. ES modules evaluate their imports first, and these modules import each other in cycles, so
   import order is not a boot order; with rule 1 it does not need to be.

A module without setup has no `init()` and is not in the boot; it loads through the modules that
import it. When WebGL is missing, the renderer throws `BootHalt` (from `js/app/base.js`); `main.js`
catches it and runs no further step, as the single file's early `return` did. Since 2.15.0 the boot
runs a little after the module loads: `main.js` hands it to the loading screen, which starts it
once the screen has written its M (see [The loading screen](#the-loading-screen)).

### The boot

| Step | Module | What its `init()` sets up |
| --- | --- | --- |
| 1 | `app/base.js` | the release on screen, reduced motion, the saved preferences |
| 2 | `scene/renderer.js` | WebGL renderer, scene, camera, environment maps |
| 3 | `scene/materials.js` | the material table (MAT) |
| 4 | `scene/sets.js` | the world rig, the cathedral and MONOLITH sets |
| 5 | `scene/board.js` | the board, highlights, labels, pieces and fragments |
| 6 | `scene/instruments.js` | the field, vectors and the Tactical X-Ray |
| 7 | `scene/phantoms.js` | the phantom groups |
| 8 | `scene/post.js` | the volumetric light pass, where post-processing runs; then the graphics levels (`scene/quality.js`): the device, the saved choice, the settings the first build reads |
| 9 | `scene/camera.js` | orbit, zoom and clicks on the stage |
| 10 | `app/state.js` | the match and draft settings from the preferences |
| 11 | `game/engine.js` | the engine that plays, and what follows when it is ready |
| 12 | `game/board-ui.js` | castling lanes, arrows and the hint mark |
| 13 | `game/ceremony.js` | the effects group and the mote texture |
| 14 | `game/lines.js` | the candidate-move state |
| 15 | `coach/notes.js` | the Coach's state |
| 16 | `scene/worlds.js` | the cathedral's marker palette to begin with |
| 17 | `ui/crucible.js` | the Crucible's source, recorded or live |
| 18 | `ui/crucible-view.js` | the heartbeat strip colours |
| 19 | `ui/palette.js` | the palette's input and keys |
| 20 | `ui/telemetry.js` | the GPU name the graphics levels detected, where WebGL reports one |
| 21 | `ui/grimoire.js` | Grimoire categories and term links |
| 22 | `ui/position.js` | the Position tab: its views, board editor and renderer |
| 23 | `ui/panels.js` | the panel renderers |
| 24 | `ui/controls.js` | every control's handlers, then the first render |
| 25 | `ui/splitters.js` | splitters and the dock's pointer handling |
| 26 | `app/loop.js` | resize observers, the frame loop, then start() |

The last step attaches the resize observers, starts the frame loop and calls `start()`
(`js/app/snapshot.js`), which restores a hot snapshot if the viewer has one, places the pieces, opens
the saved tab and starts the engine.

### The loading screen

Dennis's emblem covers the page while it starts (2.14.0), animated since 2.15.0, and since 2.16.0
slower, with a loading meter and a rotating tip: about seven seconds plus the boot itself at the
Cinematic pace. `#boot` is markup, the first child of `#app`, so it shows, and its first stage
plays, from the first paint, before any script has run. An early script in the page's head sets
the world (`data-skin`) and two more saved preferences the screen follows: Animation speed
(`data-boot-pace`) and Tips (`data-boot-tips`). The stylesheet times the stages
(`css/layout.css`, loading screen) and `js/ui/boot-screen.js` runs their order:

1. **The M is written** (2.65 s from the first paint): the squares light along the letter's stroke,
   each in the world's primary colour cooling to its own, and the name gathers in; the meter rises
   at 1.3 s and the tip card at 1.7 s. Every square's moment is a class the builder gave it (`a0`
   to `a20`).
2. **The board is built**: when stage 1's marker animation (`boot-written`) ends, the screen is
   marked `holding`, one frame is let through, and the page's boot runs (`main.js` handed it to
   `bootStarted()`). The boot holds the main thread for a moment, so it falls in the screen's rest
   rather than in its motion; the meter's working segment keeps its sheen moving on the compositor
   meanwhile.
3. **The pieces are set**: the first frame drawn after `start()` calls `bootReady()`; the screen
   takes the class `go`, the pieces are set down in turn (`i0` to `i11`), a glint crosses the
   emblem (`g0` to `g12`) and it holds a breath, 3.6 s in all (the `boot-set` marker). Meanwhile the
   frame loop draws nothing under it (`bootCovering()`), so the animation has the frames.
4. **The screen lifts**: a 0.95 s fade, the emblem coming forward and the meter and card settling
   away, then the screen is removed.

**The meter** has a segment for each step, filled only when that step reports in through
`bootStep(id, state)`, where a state is waiting, `on` (under way), `ok` or `no` (failed), and moves
forward only:

| Step | Under way from | In when |
| --- | --- | --- |
| `code`, the scripts | the first paint (the markup starts there) | `bootStarted()`: every classic script and module has loaded |
| `board` | stage 2 | `main.js`, once every boot step has run |
| `light`, the first frame | the board's report | `bootReady()`; `bootReady(false)` from the 8 s fallback marks it failed |
| `models`, MONOLITH's pillars | `js/scene/pillars.js` starting the saved style | all three models of the style have loaded, or failed (the built pillars stand in) |
| `engine`, Stockfish | `js/game/engine.js`'s `init()` | the engine reports ready, or fails |

The line under the rail names the first step under way, or the last one settled, and `Ready` once
all five are (naming any that failed); the count is the steps settled. The screen waits for none of
them past the first frame, so the pillars and the engine may still be under way as it lifts.

**The tip card** shows one entry of `BOOT_TIPS` (`js/data/boot-tips.js`) at a time, shuffled, the next
every 5.2 s: a tip about the page under a Tip chip, or a chess fact under Did you know?. Tips: Off
in Settings keeps it to the facts. Text between backticks is drawn as key caps, and `{palette}`
names the palette's key for the keyboard (Ctrl K, or ⌘K on Apple keyboards).

**The pace** is the saved Animation speed: Cinematic as above, Brisk at 0.55 of every length (the
custom property `--bt` in the stylesheet, `scale()` in the script), and Minimal still. A key or a
click finishes the stage under way; keys go no further than the screen while it is up (the page
under it is not worked blind), but nothing is prevented, so the browser's own keys still work.
Without `getAnimations()` the stages are timed by the clock. Under reduced motion, or Minimal,
nothing moves: the screen stands complete and is removed as soon as the board has drawn.

The screen also goes by these routes, whichever comes first:

| Route | Done by | When |
| --- | --- | --- |
| The boot halts or fails | `main.js` calls `bootStop()` | a step throws `BootHalt` (no WebGL) or any error; at once, so the WebGL notice or the page shows |
| No frame | `main.js` calls `bootReady(false)` | 8 s after a boot that finished and has drawn nothing (a renderer that throws on every frame); the meter marks the frame failed, stage 3 plays and the screen lifts |
| The boot never started | `js/file-check.js` | the window's load event, when `main.js` or one of its modules did not load (`#boot` has no `data-state`, which `bootStarted()` sets) |
| From disk | `js/file-check.js` | at once, before the note that says to serve the page |
| No JavaScript | a `<noscript>` style | it never shows |

`#app` is `aria-busy` while the screen is up, and every route clears it; the screen itself is
hidden from screen readers. The emblem is written into the page by `tools/build-emblem.mjs` from
`assets/monolith-emblem.svg`, never edited there by hand. Its squares and woods are the board
diagrams' custom properties (`css/position.css`) and its seams the stage colour, so it changes with
the world as the diagrams do. Since 2.17.0 it is the Conical M, its squares one slate, which the
builder reads as the diagrams' dark square: in the cathedral that is the slate Dennis drew it in.
The same builder writes the app bar's logo, the bare M from `assets/monolith-logo.svg`, between
the page's `brand-logo` markers: its squares in the same tone (MONOLITH lifts them to its light
slate in `css/monolith.css`, where its dark one sinks into the bar) and its mortar the bar's colour,
a pixel wide at any size.

## Shared state

An imported binding is read-only: a module can read another module's `let`, but cannot assign it.
The variables that more than one module assigns live in one object, `app`, in `js/app/store.js`, and
are written as `app.busy`, `app.view` and so on. Everything else stays in the module that owns it,
exported for reading. Objects that other modules change only by their properties (`game`, `prefs`,
`an`, `cr`, `study`) stay in their modules too.

| Value | Owner |
| --- | --- |
| `app.SPEED` | `app/base.js` |
| `app.tierKey` | `scene/quality.js` |
| `app.ghostWarm` | `scene/phantoms.js` |
| `app.shake` | `scene/camera.js` |
| `app.muted` | `app/sound.js` |
| `app.started` | `app/state.js` |
| `app.setupOpen` | `app/state.js` |
| `app.rolling` | `app/state.js` |
| `app.orient` | `app/state.js` |
| `app.selected` | `app/state.js` |
| `app.legalFor` | `app/state.js` |
| `app.busy` | `app/state.js` |
| `app.lastMove` | `app/state.js` |
| `app.view` | `app/state.js` |
| `app.hint` | `app/state.js` |
| `app.cpuThinking` | `app/state.js` |
| `app.fenDirty` | `app/state.js` |
| `app.analysisGen` | `game/lines.js` |
| `app.calc` | `game/lines.js` |
| `app.worldName` | `scene/worlds.js` |
| `app.fieldOn` | `ui/analyze.js` |
| `app.fenSel` | `ui/position.js` |

`store.js` says what each value means. A new variable that a second module needs to assign belongs
there, under its owner.

## The render registry

Panels never call each other. Each registers a renderer with `onRender(fn)` (from `js/app/state.js`)
in its `init()`, and `render()` runs them all, in registration order, from one context object:
`{ st, status, live }`, the position on screen, its status and whether it is the live game. After
the renderers, `render()` updates the board's highlights and the hot snapshot.

## The files

### `js/app/`

The page as an app: its basics, state, sound, the frame loop and the hot snapshot.

| File | What it holds | Boot step |
| --- | --- | --- |
| `base.js` | The basics every module leans on: the $ query helper, the release number shown on screen, the reduced-motion preference and the saved preferences. | 1 |
| `sound.js` | The page's sounds, synthesized with Web Audio rather than loaded from files. | — |
| `state.js` | The app layer's core: the game record, the match being played, the words for sides and pieces, the tips system and the render registry. | 10 |
| `snapshot.js` | Keeps the game through a hot update of the artifact: snapshot() hands the viewer the game and match on every render, and start() restores them and brings the page up. | — |
| `loop.js` | The frame loop and resizing; the first frame after `start()` tells the loading screen the board has drawn, and the loop draws nothing while the screen then covers it. | 26 |
| `store.js` | The one object for state that several modules change: whether a game has started, the selected square, whose move is being viewed, the hint, the render tier and the rest. | — |

### `js/scene/`

The 3D world: renderer, graphics levels, materials, the two sets, the board and pieces, instruments,
post-processing, camera, motion and the world transition.

| File | What it holds | Boot step |
| --- | --- | --- |
| `renderer.js` | The three.js renderer, the scene and the main camera, with the environment maps, and `POST_OK`: whether the HDR pipeline can run here (`POST_LACK` names what is missing: WebGL 2 or three's post-processing scripts). | 2 |
| `quality.js` | The graphics levels (GRAPHICS.md): Minimal, Low, Medium, High and Ultra, the seven Fine-tune settings, device detection, Automatic's frame-time watch (`stepPerf()`, fed by `app/loop.js`) and what Settings says about them. Started by `post.js`. | — |
| `materials.js` | The shared materials: marble and obsidian for the pieces, the squares and frame, stone, brass, flame and stained glass for the cathedral, and the monolith slabs, with the rim-light and marble shader patches; `matCopy()` copies a material with its patch (three r147's `clone()` drops it). | 3 |
| `sets.js` | The two worlds' sets on one turning rig: the Gothic cathedral (floor, arcades, ribs, lancets, the rose window, candles) and MONOLITH (three pillar places, each with a built, steel-edged pillar, over a mirror floor). | 4 |
| `pillars.js` | Dennis's Blender pillars (`assets/models/*.glb`) on MONOLITH's pillar places, in three styles (the monoliths; Solomonic, Doric and Tuscan columns; Prism, Halo and Fin), swapped in once loaded, the built pillars kept as the fallback. Started by `sets.js`. | — |
| `board.js` | The board and everything on it: squares, highlight markers, coordinate labels, the lathe-turned pieces and the fragments a captured piece shatters into (`clearFragments()`), and `boardGen`, which counts each rebuild of the pieces so a move still animating leaves a new board alone. | 5 |
| `instruments.js` | The instrument's 3D layers on the board: the sub-surface move-value field, the ballistic vectors of the candidate moves, and the Tactical X-Ray ring over a square. | 6 |
| `phantoms.js` | A line scrubbed in the Synaptic PV is shown as a difference from the board: phantom pieces where the line puts them, ghosts where it takes them away, capture rings where it takes. A warm-up frame compiles their shaders once the world has settled, and its materials are kept so the programs stay. | 7 |
| `post.js` | Post-processing for every level with HDR (Low and up): a ray-marched volumetric light pass, Unreal bloom, and an output pass (sRGB, vignette, dither), built from the level's settings. | 8 |
| `camera.js` | The camera's orbit around the board and the pointer: middle-drag to orbit, scroll to zoom, and picking a square or piece under the pointer. | 9 |
| `motion.js` | Tweens and the pieces' movement: glides, hops and lunges, facing the target and back, and the idle breathing of the pieces between moves. | — |
| `worlds.js` | Cathedral and MONOLITH on one board: the transition, its veil, and `worldSettled()`. | 16 |

### `js/game/`

Playing chess: the Stockfish client, board interaction, moves, ceremony, game flow, the evaluation
lines and typed moves.

| File | What it holds | Boot step |
| --- | --- | --- |
| `engine.js` | The UCI client for Stockfish: it starts the best engine it can (Stockfish 19 lite from engine/, the same build from unpkg, or Stockfish 10 as a last resort) and speaks UCI to it over postMessage. An engine that stops after it has started is restarted once, then reported. | 11 |
| `board-ui.js` | What the player sees and does on the board: highlights, castling lanes, hint and candidate arrows, selection, hover and the square a click means. | 12 |
| `play.js` | Making a move happen: playMove() runs a move through the animations, the record and the results, then asks the computer for its reply at the level being played. | — |
| `ceremony.js` | The game's ceremonies: pieces dealt in at the start, the shudder of a king in check, the flash of a promotion, and the end: the loser's king topples, the winner's army waves and bows, the camera swings. | 13 |
| `flow.js` | Starting, ending and rewinding games, reviewing earlier moves, and exploring: moves tried on a board the game does not own, from any position on screen. | — |
| `lines.js` | The evaluation bar and best line for the position on screen, and Calculate moves: the engine's MultiPV candidates drawn as ranked arrows. | 14 |
| `input.js` | Moves typed in the move box: long algebraic (e2e4), SAN (Nf3, exd5, e8=Q) or castling (O-O), and SAN back to moves for replaying long games quickly. | — |

### `js/coach/`

The Coach: its reading of the board, what a move does, the opening book and its notes.

| File | What it holds | Boot step |
| --- | --- | --- |
| `coach.js` | The Coach's reading of a position, the way a coach at the board would: piece values, material along a line, threats, loose and outnumbered pieces, development and the phase of the game. | — |
| `facts.js` | What a move does, as checked facts in the order a coach would name them, and the voice that turns them into sentences from COACH_VOICE. | — |
| `book.js` | Looks positions up in OPENING_BOOK, so the Coach can say a move is book and name the opening, even after a transposition. | — |
| `notes.js` | The Coach at work: its own engine, the note for each move (your move judged against the best, the opponent's move read for you), the watch on your turn, the hint, and the review at the end. | 15 |

### `js/ui/`

The panels and tools: the loading screen, Analyze, the Crucible, the palette, telemetry, the System
sheet, the Grimoire, navigation, the board diagrams, the studies, Position, the panel renderers,
controls and splitters.

| File | What it holds | Boot step |
| --- | --- | --- |
| `boot-screen.js` | The loading screen's order: `bootStarted(begin)` runs the page's boot once the M is written and starts the tips, `bootReady(drawn)` after the first frame starts the last stage and lifts the screen when it ends (once only, so the loop calls it freely), `bootStep(id, state)` moves a step of the meter forward, `bootCovering()` tells the loop to rest, `bootStop()` removes the screen when the boot halts or fails. See [The loading screen](#the-loading-screen). | — |
| `snackbar.js` | One message at a time at the foot of the stage, with optional actions; it hides itself after a few seconds unless it is sticky. | — |
| `analyze.js` | MONOLITH Analyze's searches and state: the deep MultiPV search with WDL, the field search over every legal move, the fork walk along line 1, and the recorded reference run. | — |
| `analyze-view.js` | MONOLITH Analyze on screen: the stats, the search profile, the WDL ribbon, the Synaptic PV scrubber and its phantom preview, the stage instruments and the X-Ray readout. | — |
| `crucible.js` | MONOLITH Crucible: a paired-opening gauntlet between two engine configurations, decided by a real pentanomial GSPRT. | 17 |
| `crucible-board.js` | A Crucible game expanded onto the 3D board: step through its moves, explore from any of them, and go back to the deck. | — |
| `crucible-view.js` | The Crucible on screen: the verdict, the LLR oscilloscope, the Hive of games and the heartbeat of a game's evaluation. | 18 |
| `palette.js` | The Command Palette: glass, one at a time, Ctrl K (⌘K on Apple keyboards). | 19 |
| `telemetry.js` | MONOLITH's telemetry footer: browser-honest readouts, each with its source badge. | 20 |
| `system-sheet.js` | The System sheet in Settings: the MONOLITH solved stops as swatches, and a contrast ledger computed in the page from the same colours. | — |
| `grimoire.js` | The Grimoire, the reference tab, and term cards anywhere on the page. | 21 |
| `nav.js` | Single-level navigation: the rail (a bottom bar on phones) and the tab switch, which also moves the world when it follows the destination; the world setting. | — |
| `diagram.js` | Flat SVG board diagrams drawn with Dennis's house piece set (`PIECE_SET`): study cards, the structure map, the board editor, piece icons, and single pieces placed in other drawings (`pieceUse()`). | — |
| `gfx-meter.js` | The graphics meter in Settings, after Dennis's drawing (version 1.2): five back-rank cells meeting edge to edge on a dial a little more than a half circle (rook for Minimal to king for Ultra), each a button that takes the pointer only on its shape, and a needle that is one shape with the hub ring, turning about the hub, pointing between levels for Custom. Built and drawn by `panels.js`. | — |
| `studies.js` | How a study runs (puzzles, practice games, set-ups), the study order behind Up next and Next study, and the progress counts. | — |
| `position.js` | The Position tab in three views behind one switch: Studies (Up next, tiles, cards, the Study card), Read (the board you see, drawn) and Set up (a board editor tied to a coloured FEN). | 22 |
| `panels.js` | The renderers that keep the panels in step with the game: the Play pane, the match strip, the players' cards with their captures, the evaluation bar, the move list, the Coach's feed and Settings (its Graphics rows built from `scene/quality.js`). | 23 |
| `controls.js` | Wires every control on the page: the rail, the Play pane, the move box, Analyze, Crucible and Settings, the keyboard shortcuts, and the first render. The Position tab wires its own. | 24 |
| `splitters.js` | Drag handles on the dock, the side panel and the move list, with keyboard control and saved sizes; also the dock's scrubber and heartbeat pointer handling. | 25 |

## Adding to it

- **A panel or tab**: one entry in `NAV` (`js/ui/nav.js`), one `<section class="pane">` with the
  matching id in the page, and one `onRender()` callback registered from the feature's own module.
  The rail and the phone bar pick it up. A palette command is one more entry in `COMMANDS`
  (`js/ui/palette.js`).
- **A module**: put it in the folder of its concern. Import what it uses by name; export what others
  use. If it has setup work, export `init()` and add it to `BOOT` in `js/main.js` where that work
  belongs. Keep its top level to definitions (rule 1).
- **A shared variable**: if a second module must assign it, move it into `app` in `js/app/store.js`
  under its owner, with a line on what it means.
- **Styles**: add them to the sheet of their concern. A new sheet goes into the page's `<link>` list
  at the place in the cascade where it belongs; `css/media.css` stays last.
- **A study, a Coach line or a Grimoire entry**: edit the dataset in `js/data/`; STUDIES.md and
  COACH_VOICE.md have the steps, and `node tools/verify-studies.mjs` checks the studies.
- **A graphics level or setting**: edit `js/scene/quality.js`; GRAPHICS.md has the steps.

## Tools

- `node tools/verify-studies.mjs` checks every study with the vendored Stockfish (STUDIES.md).
- `node tools/calibrate.js` plays the levels against Stockfish's UCI_Elo anchors (CALIBRATION.md).
- `node tools/pack-models.mjs` wraps each `assets/models/*.glb` as `.glb.json` (the same bytes, base64 in
  JSON) for a host that serves no .glb, such as the published page; `js/scene/pillars.js` reads
  either.
- `node tools/build-piece-set.mjs` rebuilds `js/data/piece-set.js` from Dennis's drawing of the
  piece set, `assets/chess-pieces.svg` (ChessWorkstation keeps the same drawing). The path data is
  copied as drawn; the two woods become custom properties the stylesheet sets per side and world.
- `node tools/build-emblem.mjs` writes Dennis's two official marks into the page: the emblem
  (`assets/monolith-emblem.svg`) as the loading screen's inline SVG, between its `boot-emblem`
  markers, and the logo (`assets/monolith-logo.svg`) as the app bar's mark, between its `brand-logo`
  markers. The geometry is copied as drawn, rounded to two decimals in the emblem and one in the
  logo; the square fills (one tone is read as the dark squares, two as light and dark) and the two
  woods become classes the stylesheet colours per world, and every square and piece of the emblem
  gets its moment in the loading screen's animation as a class (`a0`..`a20`, `g0`..`g12`,
  `i0`..`i11`). The marks are drawn by the brand system (`assets/generator/conical_m.py`); run the
  builder after either changes.
- `blender --background --python tools/build-piece-models.py -- assets/models` builds the 3D pieces as
  `.blend` files (`piece-pawn.blend` … `piece-king.blend`, and `pieces.blend`) from `js/scene/board.js`'s
  own numbers: its profiles through three.js's spline sampling under a Screw modifier of the lathe's
  40 steps, the boxes and spheres where `buildPiece()` puts them, and the two materials after
  `js/scene/materials.js` and `js/scene/worlds.js`. The page does not load them; it still builds its
  pieces in code. See `assets/models/MANIFEST.md`.

The first two load `js/core` and `js/data` with `require()`, so they test the same code the page runs. Each
still reads a single-file page (2.4.0 and earlier) when there is no `js/` beside it.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->

