<!--
✒ Metadata
    - Title: MONOLITH Hybrid Build Record (digiSpace Edition - v1.8)
    - File Name: MONOLITH_HYBRID.md
    - Relative Path: MONOLITH_HYBRID.md
    - Artifact Type: docs
    - Version: 1.8.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.8.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: the app is MONOLITH now, after this world, as Dennis
      chose; the page is index.html, its file in the repository.
    - 1.8.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: the X-Ray ring is glass by its surface
      rather than by transmission; the phantoms' warm-up and the materials
      it keeps; every light in both worlds, so world changes and wins
      compile nothing; the Crucible's pair limits; and this release's checks
      under Verification.
    - 1.7.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.10.0: Techniques names Dennis's five graphics levels (Ultra's
      finer light, Medium for Balanced, Minimal for the old Low).
    - 1.6.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis's
      notes on 2.5.0: the board's white hot spots (MONOLITH's light, under
      Techniques) and the pillars, now built with depth.
    - 1.5.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      the separation of concerns Dennis asked for, the hybrid's code is in
      its own files (js/scene, js/ui, js/core/monolith.js); Files says
      where each part is.
    - 1.4.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis's
      2.3.0 notes: the X-Ray as a gauge with a docked readout (rulings 1
      and 8 revised), term cards in glass, the match strip in the app bar.
    Earlier entries: 1.3.0 (10/22/2026), Dennis's 2.2.1 notes (steel edges
    drawn by the surfaces, the world rig that turns with a flip); 1.2.0
    (10/22/2026), ruling 7 revised at Dennis's direction (previews as a
    difference view), the held Synaptic grid, the steady dock and its
    handles, the footer fit; 1.1.0 (10/15/2026), Dennis's 2.1.0 round
    (jump-path vectors, the grounded X-Ray, the heartbeat's move rail, play
    on any board); 1.0.0 (10/15/2026), the first record, with Wizard's
    Chess 2.0.0. All are in CHANGELOG.md.

✒ Description:
    How Dennis's MONOLITH concept (the v1.1 plates Analyze, Crucible Deck
    and System Sheet, with their recorded Stockfish 19 data) was baked into
    the chess game, then named Wizard's Chess, as a second world on the same
    3D board: what came across and where it lives, the rulings kept, the
    rendering techniques used in place of the flat plates, what the browser
    stack cannot carry, and how the result was checked.

✒ Key Features:
    - Component map from every plate element to its place in the hybrid.
    - The rendering techniques behind each 3D layer.
    - Dropped and adapted items, each with its reason.
    - The verification record: node checks against the recorded runs and
      headless browser runs.

✒ Other Important Information:
    - Dependencies: the page (index.html), 2.2.0 or later, data/analyze.json
      and data/gauntlet.json (Dennis's recorded runs), engine/ (Stockfish
      19).
    - Compatible platforms: any Markdown renderer.
    - Limitations: describes the browser build only; MONOLITH's native
      Windows and Linux stack is out of scope here.
---------
-->

# The MONOLITH world: the hybrid

**Brief, as given:** "Take the MONOLITH concept and bake it into our 3d chess game and turn it into
a hybrid app … get all of the applicable components built and disregard anything that does not
work because of the stack differences. The svg plates are reference only, we still need to use ray
lighting and other advanced techniques to pull off the other layers now!"

**Shape of the result.** One page, one board, two worlds. The Gothic cathedral holds the game
(Play, Position). MONOLITH holds the instrument (Analyze, Crucible). By default the world follows
the destination; Settings can pin either. The plates' flat SVG layers are rebuilt as lit 3D objects
and post-processed light on the real board.

## Component map

### Plate 01, Analyze

| Plate element | In the hybrid | Where |
| --- | --- | --- |
| Engine panel: name, build, "Go infinite", "stopped at … (limit)" | Engine card; Go infinite toggles to Stop; the stop reason reads limit, you, or recorded | Analyze panel |
| Depth, nodes, NPS, hashfull, tbhits, time | Stats grid from the engine's own info lines | Analyze panel |
| MultiPV table with WDL | Five lines, White's view, WDL bars, graded Best (cyan), Good (ink), Inaccurate (amber), Mistake (crimson); a row isolates its vector | Analyze panel |
| Sharpness (MultiPV Dropoff), KNIFE-EDGE chip, halo threshold 10 % | Same numbers and chip, plus "N of M moves within 5 %" from the field | Analyze panel |
| Search profile | Depth step trace with a node per completed depth, gradient hashfull area, from the info stream | Analyze panel, canvas |
| UCI options | Threads (fixed at 1, said so), Hash, MultiPV, UCI_ShowWDL, search limit, field and walk depths | Analyze panel |
| Sub-surface move-value field and its legend | Ray-marched glow under the board, 22 % ceiling, cyan point light on the best square; legend with its badge | 3D board, stage |
| Ballistic vectors, reticle, numbered markers | Each line's first move as the jump the piece would make, crown to target (or onto the crown it takes), tapered at launch, with travelling pulses (line 1 cyan and blooming, 2–5 steel), cone tips, sprite markers, a launch ring, cyan reticle | 3D board |
| Tactical X-Ray ring, attackers and defenders, crimson delta arc | Clear-coated glass torus lying on the board inside the square, steel and slate threads ending at it, crimson arc for expected score lost; a see-through chip beside the square; toggle or hold Space | 3D board, stage |
| WDL ribbon with the amber Sharpness halo | Vertical ribbon (ivory, slate, obsidian edged in steel), animated zigzag halo, badges | Stage |
| Synaptic PV scrubber, fork row, instability mark | Dock under the stage at a steady, draggable height: five lines of chips, the fork row of second choices with gaps, notes for the fork and instabilities; the chips hold still while read | Dock |
| Phantom ghosting (current 30 %, phantoms 90 %, material change) | Hover or pin any chip: the projected position as a difference from the board (cyan-rimmed holograms where pieces land, faint ghosts where they leave, crimson ghosts and rings for captures, unchanged pieces solid), gliding from chip to chip; material in pawns | 3D board, stage |
| Telemetry footer | Browser-honest footer, each readout with its source badge; it steps down (compact badges, tight, least telling readouts set aside) to fit its width | Footer |
| Kasparov – Topalov position and recorded run | "Reference" loads the 48 moves and shows the recorded run, badged recorded | Analyze panel |

### Plate 02, Crucible Deck

| Plate element | In the hybrid | Where |
| --- | --- | --- |
| Match card (H1 ACCEPTED, LLR ≥ bound, pair, game, wall time) | Same, recomputed in the browser | Crucible panel |
| UCI parameter matrix, differing fields raised | Same | Crucible panel |
| SPRT block | elo0 and elo1, alpha and beta, bounds, model, book, and the trace re-check | Crucible panel |
| Result, A's view; pentanomial chart | Elo with 95 % interval and bar; W, D, L; pentanomial bars | Crucible panel |
| Anomalies list | Same rule, re-checked; each row opens its game | Crucible panel |
| LLR oscilloscope with pair scores | Canvas: monotone cubic trace over a fill toward zero, dashed bounds with tinted regions past them, gliding axes, verdict marker, diverging pair-score strip | Stage, deck view |
| The Hive (90 micro-boards, results by border, heartbeat lines) | Canvas tiles from the final FENs; ivory, slate, steel borders; crimson for anomalies; click or keyboard to open | Stage, deck view |
| Expanded anomaly game | The game on the 3D board at the anomaly ply, crimson vector and reticle on the causing move, an info card, and a heartbeat with a slot per move (White's lane, Black's lane, shaded by the eval's swing) to hover, click or scrub; the board can be played on in a scratch line | Stage, board view; dock |
| A real SPRT | Live runs in the browser: SF19 by nodes or UCI_Elo, or MONOLITH levels; SPRT or fixed pairs; up to four games at once; at most 200 pairs (one per book opening, 45, with nodes on both sides, whose games would repeat exactly); results JSON | Crucible panel |

### Plate 03, System Sheet

| Plate element | In the hybrid | Where |
| --- | --- | --- |
| Colour tokens, seed → solved | The solved stops drive the MONOLITH world, CSS and 3D alike | Whole page |
| Contrast ledger | The 22 pairs, measured in the browser by the WCAG formula | Settings, MONOLITH system |
| Tri-tier type | Michroma (structure), Geist (interface, tabular figures), Geist Mono (telemetry) | MONOLITH world |
| Piece set (ivory; obsidian with steel rim) | The 3D pieces re-materialed: ivory, obsidian with a fresnel steel rim | 3D board |
| Command Palette | Glass palette, Ctrl K or ⌘K, fuzzy matching, grouped when empty, every command live or tagged with why not, shortcuts shown | Everywhere |
| Phantom ghosting specimen | Built for real in Analyze | See Plate 01 |

## Rulings, as kept

1. **Colour is semantic only.** Cyan: line 1, vectors, reticle, field glow, the hint in MONOLITH.
   Amber: the halo, sharpness when the halo is on, instability. Crimson: anomalies, the anomaly
   vector, and in MONOLITH the check marker (a refutation of the mover's position). The X-Ray's arc
   takes the same stops by verdict (revised 10/22/2026): cyan when the best move lands on the
   square, ivory within 5 %, amber to 15 %, crimson beyond; its rim is crimson for a hanging piece.
   Structure is ink, steel and slate. The cathedral keeps its own palette.
2. **Black is one material everywhere:** obsidian with a steel rim on the 3D pieces, the phantoms,
   the Hive dots and the loss segment of every WDL bar.
3. **Results by border** in the Hive: ivory 1–0, slate ½, steel 0–1.
4. **White's view** for every score, U+2212 for minus, `#n` for mate.
5. **Absent reads absent.** The browser engine reports no tbhits and the page says "not reported";
   cores, heap and GPU read "not exposed" where the browser withholds them; recorded host samples
   show only with a recorded run, badged as recorded.
6. **No dead controls.** Threads is a fixed value with the reason; a palette command that cannot run
   stays listed with its reason.
7. **Phantoms** show what a line changes (revised at Dennis's direction, 10/22/2026; the plate's
   90 % phantoms over current pieces at 30 % read as two overlapping sets): unchanged pieces stay
   solid, a piece leaving its square fades to 18 %, a captured piece to a crimson-lit 55 % over a
   crimson ring, and only the pieces landing somewhere new appear, as cyan-rimmed holograms.
   Material from the projected position.
8. **Docked surfaces are opaque**; glass only on the X-Ray readout, the Command Palette and the
   Grimoire's term cards. The X-Ray readout is see-through on purpose (Dennis, 10/15/2026) and,
   since 10/22/2026 at his direction, docks beside the board instead of floating by the square: at
   the stage's left edge, moving right only while the square it describes would sit under it.
9. **Every telemetry layer carries a source badge** (`[SF: …]`, `[Runner: …]`, `[Browser: …]`,
   `[WebGL: …]`, `[Renderer: …]`, `[Recorded: …]`, `[Data: …]`). Where the footer is short of room
   a badge shows only its source (`[SF]`), with the full text on hover.
10. **Every board can be played on** (Dennis, 10/15/2026), behind Settings → Move pieces on any
    board. A read-only board takes moves into a scratch line that never changes the game or the
    record.

## Techniques

- **Pipeline.** three.js r147 (the last release with the classic `examples/js` scripts). With HDR
  rendering on (every graphics level from Low up; GRAPHICS.md has the levels), the scene renders
  into a half-float multisampled target. r147 tone-maps materials inside render targets, so the
  levels differ only in effects; unlit markers skip tone mapping and can exceed 1.0 to feed bloom.
  Then volumetric light, Unreal bloom, and an output pass (linear to sRGB, vignette, dither).
  Minimal renders straight to the screen.
- **Ray-marched volumetric light.** A depth pre-pass (geometry only, the mirror floor replaced by a
  plain plane so it does not re-render) gives each ray its end. Each of 56 (Ultra), 40 (High) or
  22 (Medium) steps samples the key spot light's cone and attenuation, a Henyey–Greenstein phase (g 0.35) and
  the light's own shadow map, so pieces cut visible shafts; the cathedral adds three slanted window
  beams. Value noise animates the dust. The pass runs at three-quarter, half or quarter resolution,
  jittered per pixel, and is added before bloom. Without shadows (a Fine-tune choice) it marches
  unshadowed light.
- **Sub-surface field.** A plane on the board marches ten samples down a 0.16-unit virtual slab along
  the view ray, weighted by depth, so a lit square glows from beneath and shifts with parallax. The
  plate's 22 % ceiling is an sRGB-space mix; linear blending reaches the same look at about 8 %, and
  the march spreads it at an angle, so coverage is 22 % × 0.45 (about 10 % straight on).
- **Vectors.** Cubic Bézier jump paths from just above the mover's crown, rising with distance and
  dropping steeply onto the target or the crown of the piece taken. Tube meshes tapered in the
  vertex shader (each vertex pulled back along its normal), faded at launch, with a shader pulse
  travelling along the length coordinate and a fresnel edge; the tube stops where the arrowhead's
  base begins. Shader bases are clamped before every pow(): ANGLE on Direct3D returns NaN for a
  negative base, which drew black specks. Line 1 is bright enough to bloom.
- **X-Ray.** A glass torus drawn by its surface (a clear coat, sharp reflections of the environment,
  30 % opacity; not transmission, which in three r147 draws the whole opaque scene a second time
  every frame, twice with reflections on) lying on the board inside the square, so perspective cannot slide it off its square, read as a gauge clockwise from
  the top (the group turns with the orientation): the arc, drawn by discarding past its share
  with a brighter head, on a faint track with quarter notches and a bead at its end; beads at the
  direction of every piece bearing on the square (ivory spheres for White, steel rings for Black)
  with threads of the same colour; a state rim just outside, breathing crimson for a hanging
  piece. Everything stays within the square's half-width.
- **Phantoms.** A diff of the board against the projected position: arrivals matched to the squares
  their pieces leave (same type first, then a pawn for a promotion, nearest first), what is left
  over is captured. Arrivals use the piece builder with a hologram shader (fixed key light, cyan
  fresnel rim, scanlines that fade out where they would be finer than a pixel); ghosts are
  per-piece transparent copies of the piece materials with the same shading hooks, so the real
  materials never change. Everything eases on one exponential (rate 14/s): holograms glide from
  the squares their pieces leave and, between chips, to their new squares by closest-pair matching
  across the board. A warm-up frame, once the change into Analyze's world has settled (and again
  after each world change), compiles the transparent variants, the hologram and the capture ring;
  the materials it draws are kept for the page's life, since in three r147 disposing the last
  material that uses a program deletes the program.
- **Synaptic hold.** While the pointer or keyboard focus is in the chip grid, refreshes wait and the
  header says so; previews read the snapshot the chips show.
- **Form shade on marble.** The diffuse falls off toward the silhouette and a contact shade gathers
  near the board (by world height), so ivory keeps its form under MONOLITH's bright, cool light.
- **Steel rim on obsidian.** A view-dependent edge term injected into the physical material's
  emissive light, blended by the world transition.
- **Mirror floor.** A Reflector with its own shader: the reflection tone-mapped, faded with distance
  over the canvas colour, under an anti-aliased one-unit rule grid.
- **MONOLITH's light** (Dennis, 10/23/2026: from some angles the board glared white). Three causes
  stacked. The key's cone was narrow (0.42 rad) with a long penumbra, so its full-strength core was
  a pool about four squares wide; the squares were glossy (roughness 0.42 and 0.46); and bloom
  started at 0.8, below the brightest a tone-mapped surface reaches, so the glints of the key and of
  the two low rim lights bloomed into a blaze. Now the key's core covers the board (0.5 rad,
  penumbra 0.45, intensity 1.6), the squares are satin (0.5, 0.54), the haze is lighter (0.72),
  the rim lights stand high and narrow (8 up, 0.34 rad, aimed at the pieces' middle), and bloom
  starts at 0.95, so only the brightest glints and what is drawn past white (instruments, markers)
  glow. The cathedral is unchanged.
- **Monoliths** (Dennis, 10/23/2026: the pillars read as flat panes). Each is built from unit boxes:
  a base, a body about a third as deep as it is wide, a face panel stepped 12 cm out of the front,
  and a cap. The material is graphite steel (metalness 0.55, roughness 0.42) rather than near-black
  glass, so the faces show the room's strip lights as gradients, and a soft wash light from high over
  the board's far side lights them alone, lighter at the top.
- **Steel edges.** The plinth and the monoliths' parts are unit boxes scaled to size, and their shader
  draws the steel: each fragment's distance to the framed face's border, in pixels from its
  screen-space derivative, gives a 12 mm band on both faces that meet at the edge, never narrower
  than 1.6 px, smoothed and faintly haloed (Dennis, 10/22/2026). Separate edge boxes, under a
  pixel wide at that distance, broke into dashes.
- **World rig.** Both worlds' scenery and lights hang from one rig that turns with the board's
  orientation. A flip turns the rig with the camera, so the backdrop holds still while the board
  turns (Dennis, 10/22/2026: the pillars popped in and out of view). The plinths counter-turn, the
  floor's rule grid is drawn in world space, the PBR environment chunk reads through the rig's yaw
  (one shared typed-array uniform), and the haze pass takes the key light's world position and
  turns the window beams. Black sits before the same view as White.
- **World transition.** One tween blends every material, light, haze and bloom parameter and the
  backdrop; the sets and environment maps swap at the midpoint under a dip to the canvas colour,
  which clears again over the second half (and starts from wherever an interrupted change left it).
  Every light exists in both worlds, at zero where it does not shine: the cathedral's candle lights
  hang on the rig, not in the set the world hides, and the winner's glow is made at the start, so
  neither a world change nor a win changes the light count and recompiles the lit shaders.

## Dropped for the stack

| Plate item | Why it is not in the browser build |
| --- | --- |
| Lc0 layers (Policy Prior, MLH) | No Lc0 network runs in this page. The root MultiPV field stands in for a policy prior, as the plate's own legend says. |
| Syzygy (`:syzygy`, SyzygyPath, TB hits) | The WebAssembly build has no tablebase support; tbhits read "not reported". |
| CPU load and frequency, hwmon, NVML, Windows thermals and the Ring-0 bridge | Web pages cannot read them. A recorded run's own psutil samples show, badged as recorded. |
| Threads above 1 | The browser build is single-threaded; parallel work runs as separate engines (Analyze field, Crucible slots). |
| The System workspace as a tab | Its live parts (tokens, ledger, palette, phantoms) are built in where they work; the ledger sits in Settings. |
| Plate construction rules (no strokes, generator ids, font-measured layout, the 17-check audit) | They govern the SVG plates, not a live 3D page. |

## Adapted

- Pieces stay the page's 3D lathe pieces, re-materialed to the MONOLITH set, rather than slab glyphs.
- SAN is set in letters (Re7+) rather than figurines, which no installed font draws reliably.
- The Crucible's deck and board are two views of the stage, switched in the panel, so the 3D board
  can carry a game while the deck covers it otherwise; nothing renders under the deck.
- Live engine figures differ from the recorded run: the browser search is time-limited, and the field
  and walk default to depth 10 and 12 (adjustable to 16 and 18).

## Verification

Node, against the recorded runs (`analyze.json`, `gauntlet.json`), 16 checks, all passing:

- the expected-score logistic reproduces every field `exp_white` (k = 271.5856, error under 1e-12);
- Sharpness 0.4516 and 0.5639; the 48 SAN moves replay to the recorded FEN;
- field: 45 legal moves, 1 within 5 %, 1 square lit (e7);
- X-Ray d4: 1 attacker (f4), 0 defenders, 34.0 % lost;
- fork at ply 6 (gap 6.9 %), instability at ply 7 (Ra7 against the trunk's Qc3);
- GSPRT: all 45 trace points (max difference 0.00005), bounds ±2.9444, Elo 185.7 [129.5, 252.6],
  pentanomial 0, 3, 10, 17, 15;
- anomalies: 9 flags, none mismatched; game 78 at ply 95, 48.Bxc3, +0.93 → +7.47, mover +7.00;
- contrast 1.91, 8.16, 4.28 and 4.52; score formatting; perft.

Headless Chromium (software GL):

- the recorded Analyze and Crucible screens show the plates' numbers;
- a live 10-second search, the field and the fork walk complete, then Go infinite and Stop work;
- a live fixed Crucible run plays, decides and releases its workers;
- 2.1.0: a hover sweep across five chips never drops the preview and rebuilds the materials once;
  exploration on a Crucible game and on a reviewed move leaves the game and the record unchanged,
  with Analyze following the explored position; the heartbeat hover and click land on the right
  ply; the page opened from file:// runs Stockfish 19 from unpkg, and a forced Stockfish 10
  fallback shows its own name, a 16 MB hash, approximated Expert and Master, and UCI_Elo
  disabled; the wheel scrolls the Hive without zooming the camera;
- the Play flow passes: CPU game, typed moves, Hint, Calculate moves, undo, review, FEN load from the
  palette, and the world and graphics switches;
- phone width shows no horizontal overflow, and High-tier renders of both worlds draw;
- 2.3.0: the X-Ray on a hanging knight (full cyan ring, crimson state, one ivory bead, the readout
  docked left) and on a square the best move gives 6 % away; the match strip in Analyze;
- 2.6.0: the board, pieces hidden, from six poses before and after: the share of near-white
  pixels at the two low poses falls from 6.9 % and 2.6 % to none, and the brightest half-percent from
  255 to 214, with the board's mean brightness about the same; the cathedral differs from 2.5.0 by
  no more than it differs from itself between two runs; the monoliths from a wide and a near pose;
- 2.2.1: the steel edges at 4× zoom against 2.2.0; the flip at six poses in each world, before
  and after; a timed flip with the camera and the rig together on every sampled frame; every flip
  ends square, including from an orbited view; turning only the environment yaw changes the
  reflections;
- 2.12.0: with the X-Ray shown at High, draws per frame went from 1,431 to 723 (700 without it),
  with no programs of its own beyond its materials; after the warm-up, three previews in a row link
  no programs (the first preview had linked eight); the first world change compiles only MONOLITH's
  own two materials; the veil, traced frame by frame, clears smoothly through a whole change and
  through changes reversed before and after the swap; in Node, the recorded GSPRT trace is
  unchanged, twelve straight 2-0 pairs accept H1 and 59 drawn pairs accept H0;
- no page errors in any run.

## Files

- `index.html`: the page's markup; its styles are in `css/` and its code in `js/` (see
  `ARCHITECTURE.md`). The MONOLITH parts:
  - `js/core/monolith.js`: the instrument's arithmetic (expected score, WDL, Sharpness, the field,
    the fork, the SPRT, contrast);
  - `js/scene/instruments.js` (field, vectors, X-Ray), `js/scene/phantoms.js` (the difference view),
    `js/scene/sets.js` (the MONOLITH set and mirror floor) and `js/scene/worlds.js` (the transition);
  - `js/ui/analyze.js` and `js/ui/analyze-view.js` (Analyze), `js/ui/crucible.js`,
    `js/ui/crucible-board.js` and `js/ui/crucible-view.js` (Crucible), `js/ui/telemetry.js` (the
    footer) and `js/ui/system-sheet.js` (the System sheet);
  - `css/monolith.css`, `css/crucible.css` and `css/xray.css`.
- `data/analyze.json`, `data/gauntlet.json`: Dennis's recorded MONOLITH runs, published unchanged.
- `engine/`: Stockfish 19 lite, see `engine/README.md`.
- `CHANGELOG.md`: the 2.1.0 and 2.0.0 entries and every earlier one.

## Licences

- Stockfish 19 is GPL-3.0 (`engine/COPYING.txt`); three.js is MIT; Geist, Geist Mono and Michroma are
  SIL OFL 1.1, served by Google Fonts.
- The MONOLITH plates, tokens and rulings are Dennis's.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->

