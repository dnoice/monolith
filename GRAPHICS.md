<!--
✒ Metadata
    - Title: MONOLITH Graphics Levels (digiSpace Edition - v1.4)
    - File Name: GRAPHICS.md
    - Relative Path: GRAPHICS.md
    - Artifact Type: docs
    - Version: 1.4.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.4.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.18.0: the light pass's full-resolution depth and depth-matched
      composite, its video memory, and the 64-sided column shafts.
    - 1.3.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      meter as Dennis redrew it (version 1.2): cells edge to edge on a dial
      a little more than a half circle, and a needle that is one shape with
      the hub ring. Adding a level names the cell edges and the needle's
      aims it now uses.
    - 1.2.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose, and the preferences key is monolith-prefs-v2.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: the GPU kinds Automatic now tells
      apart (virtual machines, older graphics cards, and Intel Arc and
      Snapdragon laptops as integrated graphics), how a stretch starts again
      after frames Automatic did not measure and a new choice starts the
      count afresh, and what the page says when the post-processing scripts
      do not load.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.11.0: the meter Dennis designed for choosing a level (five
      back-rank cells, a needle from a pawn hub), and how its needle reads
      Custom settings.
    - 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, with 2.10.0, when Dennis asked for a more realistic,
      logical, tiered graphics system: the five levels, the seven
      Fine-tune settings, how Automatic chooses and adapts, and how to
      change any of it.

✒ Description:
    The reference for MONOLITH's graphics levels: what each level draws and
    why the ladder is cut where it is, what every Fine-tune setting does and
    costs, how Automatic picks a level for a device and moves it with the
    frame rate, what a browser can limit, and where the code lives.

✒ Key Features:
    - The five levels, setting by setting, and what each step up buys.
    - The light pass: its depth at full resolution, the march at the
      level's fraction, and what the depth costs in video memory.
    - The meter Settings chooses them with, and what its needle shows.
    - The seven settings, their options and what depends on what.
    - Automatic: the GPU kinds it recognises, the memory and core caps,
      and its rules for lowering and raising the level.
    - Saved settings, and how a pre-2.10.0 choice was carried across.
    - Recipes for adding a level or a setting.

✒ Other Important Information:
    - Dependencies: none; this file is documentation.
    - Compatible platforms: any Markdown renderer.
    - Scope: the graphics levels only. The rendering techniques
      themselves (the volumetric light, the mirror floor, bloom) are
      described in MONOLITH_HYBRID.md; the code's structure in
      ARCHITECTURE.md.
    - Source of truth: the numbers here are copied from
      js/scene/quality.js. When they differ, the code is right and this
      file is out of date.
---------
-->

# Graphics levels

Settings → Graphics chooses how much the 3D board draws. There are five levels, from Minimal to
Ultra. Each one adds to the level below it, so moving up never takes anything away. **Automatic**
picks a level for the device and moves it with the frame rate. **Fine-tune** sets each part on its
own; any change there makes the graphics **Custom**, and a combination that matches a level selects
that level again. The command palette has the same choices: `:quality auto`, `:quality ultra`,
`:quality high`, `:quality medium`, `:quality low` and `:quality minimal`.

The levels change effects only, never colour. Materials tone-map themselves at every level, so a
marble square is the same marble at Minimal and at Ultra.

## The meter

Settings chooses the level on a meter Dennis designed (his drawing's version 1.2): a dial a little
more than a half circle, its five cells meeting edge to edge, Minimal on the left to Ultra on the
right, the two end cells cut flat by the base line. Each holds a piece of his house set in
back-rank order (the rook, knight, bishop, queen and king of the a- to e-files), turned to face
out, with the level's name along the rim. The needle is one shape with the hub ring, which sits
raised off the base with the pawn in its eye; it turns about the hub to point at the level in use
and swings to a new one (it jumps instead when motion is reduced or Animation is Minimal). The
chosen cell shows its piece in Dennis's woods, boxwood and ebony. A line under the dial names the
level and how it was chosen: by Automatic, by hand, or Custom. While Automatic is on, the hub's
face is ringed in the primary colour.

Each cell is a button of its own: it takes a click or a tap anywhere on its shape or its name,
and the arrow keys move along the dial. A cell this browser cannot run (every level above Minimal,
without WebGL 2) is dimmed and cannot be chosen.

**Custom on the meter.** Custom settings match no level, so no cell is chosen; the needle points
between the two levels the settings fall between, by a rough estimate of their cost on this
screen. The estimate counts, in full-resolution scene draws, the scene, the HDR target with its
multisampling and output pass, bloom, the light pass (its depth draw and its march), the mirror's
second draw and the shadow map. It ranks the five levels in order on any screen, which is all it is
for: it is not a frame-time prediction. It still charges the light pass's depth draw at the march's
share, though that draw has run at full resolution since 2.18.0; the levels rank in the same order
either way. The line under the dial, and the help below it, name the
nearer level ("about as demanding as High").

## The levels

| Level | Suits | HDR | Resolution | Anti-aliasing | Light shafts | Reflections | Shadows | Bloom |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Minimal | any device, with or without WebGL 2 | off | 1× | the browser's | planar | off | 1024 px | — |
| Low | older laptops, phones and tablets | on | 1× | 2× MSAA | planar | off | 1024 px | on |
| Medium | integrated graphics, recent phones and tablets | on | up to 1.5× | 2× MSAA | ray-marched, ¼ resolution, 22 steps | soft (0.4) | 1024 px | on |
| High | recent laptops, Apple silicon, graphics cards | on | up to 2× | 4× MSAA | ray-marched, ½ resolution, 40 steps | sharp (0.75) | 2048 px | on |
| Ultra | graphics cards | on | up to 2× | 4× MSAA | ray-marched, ¾ resolution, 56 steps | full (1.0) | 4096 px | on |

The ladder is cut by what each step buys, cheapest first:

1. **Minimal to Low: HDR rendering.** The scene renders into a half-float target with multisampling,
   then bloom and an output pass (sRGB, vignette, dither). Dark gradients stop banding, and the
   markers and instruments drawn brighter than white glow. This is the cheapest step that changes
   the look the most.
2. **Low to Medium: the second scene draws.** Ray-marched light draws the scene again, as a depth
   pass at the view's full resolution, and marches each ray through the key light's cone and
   shadow map at the level's fraction of it, so pieces and columns cut real shafts out of the haze.
   Laid over the scene, each pixel takes the light of the rays that ended at its own depth, and a
   pixel on a silhouette mixes the light of both surfaces it covers, so column edges stay as smooth
   as the anti-aliasing draws them. MONOLITH's mirror floor draws the scene again, reflected.
   Resolution rises to 1.5× on screens that have it.
3. **Medium to High: resolution.** The light's march doubles its resolution in each direction and
   takes 40 steps, the mirror sharpens, shadows double, multisampling goes to 4× and the view
   renders at up to 2×. Resolution multiplies the cost of everything else, which is why it comes
   last.
4. **High to Ultra: refinement.** Light at three-quarter resolution in 56 steps (less grain in the
   shafts, cleaner edges around the pieces), a full-resolution mirror and 4096 px shadows.

Medium and High are the former Balanced and High, setting for setting. Minimal is the former Low.
Low is new: HDR and bloom without the second scene draws.

Since 2.18.0 the light pass's depth is drawn at full size, which takes about 1 to 11 MB more video
memory at Medium and above, depending on the level and the screen; its colour channel is one byte
a pixel, since only the depth is read. Two things hold at every level:
the cathedral's column shafts are 64-sided, so their outlines stay round and steady as the camera
orbits close to them, and the fog thins as the camera's fit to the stage draws it back, so the
board reads the same at any window size.

## Fine-tune

Settings → Graphics → Fine-tune lists the seven settings in use, whichever way they were chosen. A
setting that does nothing right now (because something it needs is off, or this browser cannot do
it) shows what it is drawing instead and cannot be changed, so no control claims an effect it is
not having.

| Setting | Options | What it does | Cost |
| --- | --- | --- | --- |
| HDR rendering | On, Off | The half-float, multisampled pipeline with bloom and the output pass. Off draws straight to the screen. | Low. It needs WebGL 2; without it the row reads Off and cannot change. |
| Resolution | Up to 2×, Up to 1.5×, 1×, 0.75× | Pixels drawn per CSS pixel, never more than the screen has: on a 1× screen, "Up to 2×" draws 1×. 0.75× draws fewer pixels than the screen and lets the browser scale up. | The highest: every other cost scales with the pixel count. |
| Anti-aliasing | 4× MSAA, 2× MSAA, Off | Multisampling of the HDR target. Options above what the GPU supports are not offered. | Moderate, and higher at high resolution. Needs HDR; without it the row reads "The browser's", the canvas's own anti-aliasing. |
| Light shafts | Ray-marched at ¾, ½ or ¼ resolution; Planar | The volumetric light pass, or the cathedral's flat light planes instead. The fraction is the march's; the depth it reads is drawn at full resolution, and each pixel takes the light of the rays that ended at its own depth. | High at ¾ and ½. Ray-marching needs HDR; without it the row reads Planar. |
| Reflections | Full, Sharp, Soft, Off | MONOLITH's mirror floor at 1, 0.75 or 0.4 of the view's resolution, or a plain floor. | Moderate: the scene draws once more, reflected. The cathedral has no mirror floor. |
| Shadows | 4096 px, 2048 px, 1024 px, Off | The key light's shadow map. Off frees the map; the lit materials recompile without shadow lookups and the light shafts march unshadowed light. | Low to moderate. Sizes above the GPU's texture limit are not offered. |
| Bloom | On, Off | The glow around anything brighter than white. | Low. Needs HDR; without it the row reads Off. |

Below the rows, Settings says how dense this screen is and what the view renders at ("This screen
is 2×, so the view renders at 1.5×"), and what is waiting on HDR when it is off.

Turning HDR on from Minimal arrives at Low, since Minimal keeps Low's anti-aliasing and bloom for
when HDR returns. In the same way, a Custom set that comes back to a level's settings selects that
level.

## Automatic

Automatic is on for a new browser. It does two things: it picks a starting level from what the
browser says about the GPU, and it watches the frame rate to move that level.

### Where it starts

The browser names the GPU through WebGL (Chrome and Edge in full, Firefox approximately, Safari only
as "Apple GPU"). The name shown is cleaned of ANGLE's wrapper, driver details and trademarks, from
Firefox's "or similar" and Linux's driver list as much as from Chrome's. The name, and whether the
device is a phone or tablet, give a kind. Each kind has a starting level and a ceiling, the highest
level Automatic will try. Where a kind spans a wide range, the ceiling is one level above the start,
so a strong device proves itself on its frame rate rather than being guessed at.

| Kind | Examples | Starts at | Can rise to |
| --- | --- | --- | --- |
| No WebGL 2 | WebGL 1 browsers | Minimal | Minimal |
| Software rendering | SwiftShader, llvmpipe, Microsoft Basic Render Driver | Minimal | Low |
| Virtual machine | virgl, VMware SVGA, VirtIO, Parallels (the host's GPU through a costly layer) | Low | Medium |
| Older phone or tablet GPU | Adreno 300 to 500 series, Mali-T, Mali-G31, G51, G52, G57, G68, G71 and G72, PowerVR | Low | Medium |
| Phone or tablet GPU | Adreno 600 series and up, newer Mali, Immortalis, Xclipse, Apple GPU on a phone or tablet | Medium | High |
| Older integrated graphics | Intel HD Graphics 2000 to 5000 series and unnumbered, Intel GMA, a Radeon HD 2000 to 7000 in a processor (a D or G after the number) | Low | Medium |
| Integrated graphics | Intel UHD, Iris Xe, the Intel Arc in a Core Ultra, Radeon Graphics and Radeon Vega in a processor, an Adreno in a Windows laptop (Snapdragon X) | Medium | High |
| Apple silicon | Apple M1 and later, any variant | High | Ultra |
| A Mac GPU the browser does not name | Safari on a Mac | High | Ultra |
| Older graphics card | AMD Radeon HD 2000 to 7000 cards | Medium | High |
| Graphics card | NVIDIA GeForce, Quadro and RTX, AMD Radeon RX and Pro, Intel Arc A and B series cards (A770, B580) | High | Ultra |
| Unnamed GPU | no name reported: High on a computer, Medium on a phone or tablet | High or Medium | Ultra or High |

Little memory or few cores lower the ceiling, where the browser reports them (Chrome and Edge
report memory): 4 GB or less caps it at Medium; 2 GB or less, or two cores or fewer, at Low. The
start never sits above the ceiling.

Under Graphics, Settings says what Automatic chose and why ("Automatic chose Medium for integrated
graphics (Intel Iris Xe Graphics). It can rise as far as High while frames stay quick."). The
footer's GPU cell shows the same name.

### How it moves

Automatic measures frames in stretches of 3 seconds. It ignores a hidden tab, any frame over a
second (a stall, not a frame rate), and the 4 seconds after any change of level, while the new
pipeline compiles its shaders. Frames the page draws without measuring (the Crucible deck covers
the stage, so the 3D view is not drawn there) break the stretch: the next one starts afresh, so a
return to the board is never judged on a handful of frames. Choosing a level, Custom or Automatic
starts the count again, so stretches measured under the last choice say nothing about the new one.

- **Lower.** Two slow stretches in a row (frames averaging slower than 28 fps, over 36 ms) lower the
  level one step.
- **Raise.** Four quick stretches in a row (faster than 50 fps, under 20 ms) raise it one step, up to
  the ceiling.
- **Trial.** For 20 seconds after a rise, slow means slower than 40 fps (over 25 ms), so a level that
  only just runs is given back quickly rather than kept at a stutter.
- **No swinging.** A level Automatic has had to leave is barred until Automatic is switched off and
  on again. Each level is tried at most once, so it cannot bounce between two.

Each change is said under Graphics, with the frame time that caused it ("Automatic lowered the
graphics from High to Medium: frames averaged 41 ms (24 fps)."). Switching Automatic off keeps the
level it was at; choosing a level or changing a Fine-tune setting switches it off. Switching it on
starts again from the device's own level, with no bars.

A level chosen by hand is never changed. If frames run slow there, Settings says so ("Frames are
averaging 48 ms (21 fps); a lower level, or Automatic, would run more smoothly."), and the line goes
once they recover.

The frame rate comes from the page's own frame loop, so anything that slows the page counts. On a
slow machine, an engine search competing for the processor reads as slow frames too, and Automatic
treats it the same way. A display that refreshes 30 times a second reads as 33 ms, which is neither
slow nor quick, so Automatic leaves the level where it is.

## What a browser can limit

- **WebGL 2.** Every level above Minimal needs it. Without it, only Minimal is offered (the other
  levels show disabled), Automatic stays at Minimal, and Settings says why.
- **The post-processing scripts.** three.js's pipeline scripts load from jsDelivr with three.js
  itself. If they do not arrive, the page runs as it does without WebGL 2 (Minimal only), and every
  message names the scripts rather than WebGL 2, with the hint that a reload may bring them.
- **Multisampling and texture size.** Fine-tune offers only what the GPU supports. A level asking
  for more draws at the GPU's limit, and its rows show what is actually used.
- **Minimal's anti-aliasing** is the canvas's own, chosen by the browser when the page loads; the
  page cannot change it.
- **Screen density.** A change of density (browser zoom, moving the window to another monitor)
  rebuilds the view at once, at the resolution the setting allows on the new screen.

## Saved settings

The choice is saved per browser in the page's preferences (`monolith-prefs-v2`):

- `quality`: `auto`, a level (`minimal`, `low`, `medium`, `high`, `ultra`) or `custom`.
- `gfx`: the Custom settings (`hdr`, `res`, `aa`, `shafts`, `reflect`, `shadow`, `bloom`). A
  missing or damaged set is dropped, and a Custom choice without one falls back to Automatic.
- `qualityScheme`: `2` once a choice has been read under the five levels.

A choice saved before 2.10.0 is carried across once, keeping its look: Balanced becomes Medium and
the old Low (no post-processing) becomes Minimal. High and Auto keep their names.

## For developers

- **Where it lives.** `js/scene/quality.js` holds the levels (`GFX_LEVELS`), the Fine-tune
  settings (`SETTINGS`), device detection, Automatic and the text Settings shows. `tier()` returns
  the settings in use, resolved against the browser's limits. `js/scene/post.js` builds the
  pipeline from them (`post.build()`), and `js/scene/worlds.js` shows or hides the mirror floor.
  `js/scene/post.js` starts the module in its own setup, boot step 8. `js/app/loop.js` hands every
  frame's time to `stepPerf()`.
- **Adding a level.** Add it to `GFX_LEVELS` with a label, what it suits, a one-line brief (the
  palette shows it) and a full set of the seven settings; put it in `GFX_ORDER` at its rank; add its
  command to the palette; and add its row to the table in this file. The meter
  (`js/ui/gfx-meter.js`) is drawn for five: a sixth level needs a cell edge in `EDGES`, its entry
  in `LEVELS` and a piece in `PIECES` (the back rank has no sixth piece but the pawn, which is the
  hub); the needle's aims (`AIM`) follow from the cells. The cost estimate (`cost()` in quality.js)
  must still rank the levels in order.
- **Adding a setting.** Add it to `SETTINGS` with its options and, if it needs HDR, `hdr: true` and
  what it shows without (`na`). Give every level a value. Add the effective value to `effective()`
  and the field the pipeline reads to `resolve()`. Read it in `post.build()` or wherever it draws,
  and add it to this file. Settings builds its Fine-tune row from `SETTINGS` on its own.
- **Never read a level at load time.** As everywhere in the page, a module reads another module's
  values inside functions, never at its top level (the palette's level commands look their text up
  when the palette is drawn).
- **Checking it.** A change of level must leave no page errors and draw the same colours. The
  headless browser renders with SwiftShader, which Automatic reads as software rendering
  (Minimal), so a check of another level chooses it by hand.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->

