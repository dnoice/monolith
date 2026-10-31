<!--
✒ Metadata
    - Title: MONOLITH Changelog (digiSpace Edition - v2.18)
    - File Name: CHANGELOG.md
    - Relative Path: CHANGELOG.md
    - Artifact Type: docs
    - Version: 2.18.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5.1; Anthropic - Claude
      Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Description:
    The complete release history of MONOLITH, named Wizard's Chess until
    2.13.0 (index.html and, since 2.5.0, its css/ and js/ files), newest
    first. The page is a shipped artifact, so its header carries only the
    latest three entries; every entry it has ever carried is here, with the
    long-form reasoning the header has no room for.

✒ Key Features:
    - Every release, including those rolled out of the page header.
    - Attribution tags matching the header, human first.
    - Long-form notes on what changed, why, and how it was checked.

✒ Other Important Information:
    - Dependencies: none; this file is documentation.
    - Compatible platforms: any Markdown renderer.
---------
-->

# MONOLITH changelog

The app was named Wizard's Chess until 2.13.0. Each release below keeps the name of its time.

## 2.18.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis asked for an enhancement pass over each main area of the app, to make the game more
intuitive, and named three things: auto-flip as an option for two players on one screen, a Play
page where the pieces can be moved without starting a game, and alignment and placement that look
intentional. Each area was audited, then rebuilt in a package of its own (the stage, the frame,
play, Analyze and the Crucible, and Position, the Grimoire and Settings), with a pass for phones
and tablets after them; the cathedral's columns and the loading screen had passes of their own.
Packages for the rules of play, the app's chrome and the pieces came last, with new names for the
brand files.

- **The board fits the stage.** The camera no longer sits at one fixed distance: it fits the board
  to the stage, so the frame, every coordinate and both back ranks stay in view at any window size,
  panel width or phone, in both worlds. The fit follows the window, the panel and the evaluation
  bar, and a zoom by hand is kept as a share of it. Reset view returns to the world's own camera,
  so MONOLITH keeps its lower angle; it shows on the stage once the view has been turned or zoomed
  by hand, and it stops the end-of-game swing where it stands.
- **Drag a piece, drag the board.** A piece can be dragged onto its square, in a game, an explored
  line or a study. A click on a piece and then a square still works, and a piece let go anywhere
  else goes back and stays selected. A left drag anywhere else orbits, so a trackpad can orbit
  too; the middle button still does. On a touch screen one finger carries a piece that can move,
  or orbits from anywhere else, and a second finger turns either into a pinch. The orbit hint sits
  at the top right and names the gestures for touch, and the loading screen's orbit tip names the
  left drag.
- **Overlays clear of the board.** The player cards, the chips, the orbit hint, Reset view and
  Analyze's instruments sit in bands along the stage's edges, clear of the board's coordinates and
  pieces. Analyze shows no player cards, and the field's key sits under the layer toggles. On a
  phone the player cards take one compact row each, and a chip takes the top card's place while it
  shows; on a narrow stage the chips sit under the top card, centred across the stage.
- **One panel width per world.** The side panel is 400 px wide in the cathedral and 440 px in
  MONOLITH on screens 1280 px and wider, and 368 px below that, so moving between Play, Position,
  the Grimoire and Settings no longer moves the edge of the stage. The Grimoire's 460 px and the
  Crucible's 500 px are gone; the Crucible's matrix fits in 440 px. A width dragged with the
  splitter is kept per world, and widths saved per tab carry over. From 900 to 1199 px, an iPad
  held sideways, the rail is slimmer and the panel gives way to 344 px, so the stage is nearer
  square: 608 px wide at 1024 × 768, up from 568.
- **The frame lines up.** Each tab keeps its own scroll place, opening at its top or where it was
  left. The Moves card is gone from Settings and the Grimoire, and before a game it folds to its
  title, so Start game is in view on a 1440 × 900 screen. Analyze and the Crucible carry an
  Instrument line over their titles, as the other tabs carry theirs, so every title sits at one
  height. The match strip no longer cuts its numbers short (move 25 read "Move 2." at laptop
  widths). Keyboard focus on a segmented choice, such as Opponent or World, rings the whole
  control. In MONOLITH the move box, the selects, the release chip and Position's chips, rows,
  tools and tiles take the same square corners as the buttons beside them.
- **The wordmark and the app bar.** At Dennis's request the emblem stands as the M of the wordmark
  ("[logo]ONOLITH") and the app bar's actions move to the rail. The M is the MONOLITH M with its
  twelve pieces, as tall as the word's capitals and on its baseline, in each world's colours. The
  emblem's drawing is in the page once, for the loading screen to draw square by square and the
  wordmark whole, about 3.6 KB lighter than the screen's own copy and the bare logo were; the bare
  logo, `assets/monolith-logo.svg`, is no longer read. The command palette, Flip board, Sound and
  the release chip stand at the foot of the rail, under the tabs, the palette as an icon button
  with Ctrl K in its title. Under 900 px, where the rail is the bottom bar, the palette, Flip board
  and Sound go back to the app bar's end, and the release is a line under the wordmark.
- **The rail's selected tab.** At Dennis's request the selected destination is plainer to see: its
  pill is filled, and its label written, in a colour of the rail's own (`--md-nav-active`), the
  house gold in the cathedral and MONOLITH's ink in MONOLITH. The old fill was hard to tell from
  the rail, a contrast of 1.51 in the cathedral and 1.10 in MONOLITH; the new one's is 10.27 and
  14.35. A pointer over another tab lays the same colour faintly on its pill and lights its
  label, keyboard focus shows the same, and a tap on a phone's bottom bar leaves no tint behind.
- **The match strip.** At Dennis's request its words line up: in every segment the labels, the
  values and the larger numbers sit on one baseline, where they were up to 2 px apart, and a
  player with no note leaves no gap after the name. It stands at the app bar's right end, in the
  room the actions left, so it keeps more on a narrower desktop: the levels go under 1100 px and
  the last move under 1000, where they went under 1380 and 1240, and the players, or the tab's
  title, stay at every desktop width, where they went under 1080.
- **The subtitle names the world.** From 900 px up the app bar's subtitle names the world first:
  Cathedral world · marble vs. obsidian, and MONOLITH world · Stockfish 19 instrument, the engine
  named as it loads.
- **The telemetry footer, from 900 px up.** The telemetry footer is set aside under 900 px
  wide, on an upright tablet as on a phone, and the panels carry its readings (the engine card,
  the Crucible's pane). In MONOLITH it pushed an upright tablet's bottom bar up 28 px, so the bar
  moved as the world changed; the bar now stays put.
- **Two players on one screen.** In a friend game the board turns to the side to move a beat after
  each move lands, a cut under Minimal or reduced motion. Undo and Back to live turn it at once,
  stepping through earlier moves leaves it still, and Flip board holds for the move on the board;
  Reset view, pressed while it turns, leaves the turn alone. It is on by default, and its switch
  sits on the setup card when Friend is chosen, in a Board card in the game, in Settings (Turn the
  board for each player) and in the palette as `:autoflip`. Friends can agree a draw (Draw, or
  `:draw`), and with auto-flip off the result card offers Switch sides.
- **The free board.** Before any game the board is free on every tab: both sides move in turn from
  the starting position, the moves show in the move list, and Undo and Reset take them back;
  ← takes back a move and Home clears the line. Play from here makes the line a game that keeps
  its moves. A click on the board on Analyze or Position before a game no longer sends you to Play,
  and with Move pieces on any board off it says how to start. The explore chip, the player cards and
  the move list switch to a tried line on the first click, not the first move.
- **The game kept, written and read.** A game in progress survives a reload, a closed tab or a lost
  GPU process, kept in the browser's storage (`monolith-game-v1`); a finished game comes back
  finished, and Stockfish picks up its turn. Copy PGN, Download PGN and Copy FEN sit under New game
  and Resign, and Load a game on the setup takes a pasted PGN or FEN and plays on from it, naming
  the first move that is not legal; the palette has `:copy pgn`, `:download pgn` and `:load pgn`.
  Against the computer the result card offers the other side; it also offers Analyze game, which
  opens the game in Analyze at the Coach's turning point, as the Coach's end note's Analyze it and
  `:review` do. Start game asks before it ends a game in progress, reads Start new game there, and
  stays in reach at the foot of the Play pane at every size. The move box takes SAN up to ten
  characters (exd8=Q+, Nbxd7+, O-O-O+).
- **A draw against the computer.** Stockfish can be offered a draw on your turn (Draw, or
  `:draw`), and it answers by a rule Dennis agreed. It judges the position at full strength,
  whatever level it plays at, with a short search of its own (depth 14, at most 0.8 s): it accepts
  when it stands a pawn or more worse or faces a forced mate, and accepts a level position (under
  +0.40 for it) from move 20; otherwise it plays on, and says why. After a decline the
  offer can be made again five of your moves later. While it considers, a notice, the move box and
  the Draw button say so. Draw shows in every game but a study and a game loaded for analysis.
- **Analyze loads games and plays lines.** A Load section takes a pasted FEN or PGN and opens it
  there, both sides moved by hand with no computer reply: a PGN game at its last move with its
  moves listed, titled White – Black from its tags; in Analyze, `:fen` does the same with a FEN,
  and its row in the palette says so. A pinned Synaptic PV line offers Play to here, which plays
  the engine line onto the board as an explored line, the game unchanged, and the analysis carries
  on from where it leads; Enter on the pinned chip or a double-click does the same, and Shift-click
  on a MultiPV row plays its first move. On a touch screen the PV's header says to tap a move to
  pin its line, where it said hover and click. Holding Space for the Tactical X-Ray works right
  after a click on the tab and no longer stops Go infinite, and on a phone or tablet a tap on the
  board aims it and a second releases it.
- **Explore in Analyze.** During a game, a move made in Analyze at the live position, by a click, a
  drag or the move box, starts a line to explore from it and never touches the game; the explore
  chip says "Exploring from the live position", and a typed move goes into a line already on the
  board, as a click does. At Dennis's request it has a switch: Explore on Analyze's board, beside
  the layer toggles, Explore in Analyze in Settings' Game card, and `:explore analyze`. It is on by
  default; off, a move made there on your turn is played in the game, as before.
- **The Analyze mark.** In a two-player game, a side that uses Analyze has consulted the engine,
  and its next move carries the Analyze icon in the move list. It counts once Analyze has shown the
  game's evaluation for 1.5 s, at any of its positions, so passing through the tab marks nothing,
  and at once for a move tried in a line from the live position or a game move played from
  Analyze with Explore off. As Dennis asked, the other player is told when their turn comes. The
  PGN follows a marked move with a comment, `{Marble used Analyze before this move}`, the marks
  survive a reload, and an undo keeps those of the positions it returns to. A game against the
  computer, a study, a game loaded for analysis and a Crucible game carry no mark.
- **Analyze reads more plainly.** The match strip shows Analyze's evaluation from White's side,
  with the depth and the search state under it, and the recorded run is named
  Kasparov – Topalov 1999. Source badges have a short form, set in Settings or with
  `:badges short`: `[SF · rec]` for `[SF: MultiPV 5 · d26 · recorded]`, the full badge on hover.
  The dock's TB / Mate line shows only when a line has a mate. The search status beside Go
  infinite reads on two lines, what is happening over its detail, a number keeps its unit, and
  three text collisions are gone: the Sharpness chip, the fork walk's label and the MultiPV
  subtitle.
- **The Crucible.** The verdict reads as a sentence, such as "A is stronger than B: +185.7 Elo, 95 %
  from +129.5 to +252.6." The Hive says a click replays a game and shows a readout on hover. The
  Live run keeps Start run right under its settings, and before a run the deck says what to do
  next and has a Start run of its own. The card over a Crucible game keeps to two rows, the game
  and where you are in it, with the rest under Details, which stays open or closed as you step.
  With a Crucible game on the board the Moves card lists and steps that game, and a typed move can
  no longer freeze the Play game underneath. On a narrower stage an explored line's chip takes the
  card's place (under 820 px, or 920 px while Reset view shows), and under 580 px Reset view is its
  icon alone, clear of the card's Back to the deck.
- **Keys.** On Play, F flips the board, U takes back and H asks for a hint, and Ctrl or Cmd Z takes
  back too, with the focus left on the rail as well. The Grimoire's / works right after a click on
  its tab.
- **Set up asks who plays.** Play this position used to start a game against Stockfish with whatever
  the Play tab held, even with Black to move, and sat far below the board. Set up now asks Who
  plays it: against Stockfish (you take the side to move, or pick the other) or both sides on this
  screen. The button stays at the foot of the panel with a sentence saying how the game will be
  played, Play's own settings are left alone, and a snack offers Go to Play. The palette's `:fen`
  opens a pasted position in Set up rather than playing it. The Castling drill is a both-sides
  game, so either colour can castle.
- **Studies.** A wrong move is taken back and its explanation now stays in the card until the next
  move. Skip to the next is a quiet text button while a study runs; only Next study, once solved,
  is filled. Start study sits right under a study's title, above the fold on a laptop, and on a
  phone a study opens at its title. Up next centres its diagram, the grid's rows line up across
  two-line titles, and the tile rings are a size larger, each count kept inside its ring in both
  worlds; the Set-ups ring is dashed, since it counts positions rather than progress.
- **The Grimoire.** The search box draws one focus ring instead of two, and / reaches it from
  anywhere on the Grimoire, the rail included. A search that finds nothing names the category and,
  when other categories hold the word, offers Show N in All beside Clear search. An article's Go
  to lands on the control it names (Show legal moves, the graphics meter, the FEN box, Hint, Turn
  the board for each player, the PGN buttons, Draw and so on): the panel scrolls it to the middle,
  rings it for a moment and gives a switch or button the focus. A new entry, Turn the board for
  each player, makes 149, and the entries on PGN, draws, Explore, the annotation symbols (the
  Analyze mark), the free board, Play to here, the source badges, touch, the app bar and the rail,
  and Settings' cards describe the page as it now is. Articles lose stray space around their
  section headings, and each viewpoint's icon is centred on its heading.
- **Settings in five cards.** Settings was one long column whose first block had no title. It is
  now five titled cards built like Play's (Game, Board, Sound and motion, World and graphics, and
  Help and about) under a Preferences kicker, so its title sits where the other tabs' do. Coach
  comments and Evaluation bar can be switched here without a game running, the Game card carries
  Explore in Analyze, the Board card Turn the board for each player, and World and graphics Short
  source badges. Keys and mouse and the MONOLITH system fold away, the keys list gains / and F U H,
  and the World choice writes MONOLITH as the rest of the page does. The new preferences start as
  auto-flip on, Explore in Analyze on, full badges and Set up against Stockfish, and a saved value
  outside its choices is repaired on load.
- **The palette knows everyday words.** Ordinary words find commands: start and new game find
  `:new`, turn finds `:flip`, mute finds `:sound`, graphics finds `:quality`, take back finds
  `:undo` and give up finds `:resign`. A word no command knows, such as castling, opens its
  Grimoire entry. New commands: `:legal`, `:coords`, `:animation`, `:tips`, `:keys`, `:study`,
  `:read`, `:setup`, `:resign` (it asks first), `:rematch`, `:badges`, `:autoflip`, `:draw` (to
  the other player or to Stockfish), `:explore analyze`, `:review` and the three PGN commands.
  With nothing typed, the tab in view puts its own groups first, and the groups follow Settings'
  cards; `:explore` names the free board.
- **A phone held sideways, a tablet held upright.** A phone on its side has a layout of its own:
  the sections down the left, the board the full height and the panel at the right, where Start
  game, Analyze's panel and the section bar were out of reach before. A tablet held upright has a
  larger board (800 px across at 820 × 1180, up from 650), and the panel's cards keep to a centred
  column.
- **Phones.** The move list is a strip held at the foot of the panel with the step buttons beside
  it, so a game can be stepped through without scrolling past every card; the move box opens from
  its keyboard button, and messages take the screen's width and sit clear of the strip. Analyze's
  panel shows more (284 px instead of 239 at 390 × 844) with the board the same size. The bottom
  bar no longer moves when Analyze or the Crucible opens or the world changes, MONOLITH's labels in
  it are a little larger, and the telemetry footer is set aside (now under 900 px, above). The
  Crucible's heartbeat shows its whole strip, its heading on one line, and the Crucible's board
  card keeps clear of the board at every width. The player cards line up with the chips when the
  evaluation bar is off, and a pinned line's Play to here stays on the screen.
- **Touch screens and narrow stages.** On touch screens the small buttons, switches and menus are
  at least 40 px tall, and fields and menus use 16 px type, so iOS Safari no longer zooms in on
  one. On a narrower Analyze stage a pinned engine line has room to show (256 px instead of 164 at
  960 × 700), the X-Ray readout sits next to the WDL column instead of 100 px away, and in the WDL
  column the D figure no longer lands on its neighbours when the chances are lopsided.
- **The cathedral's columns.** Dennis reported jagged, pixelated edges on the cathedral's columns
  at some camera angles, and narrowed them down: they showed where the light shafts lie behind the
  columns, seen from outside. The cause was the light pass's composite, which, drawn at a reduced
  resolution, smeared across the columns' silhouettes; the ray march's step banding was ruled out.
  The light is now laid over the scene by depth: against a depth drawn at full resolution, each
  pixel takes only the light whose rays ended where its own surface does, and a pixel on a
  column's edge takes the light of both surfaces it covers, so the edges stay as smooth as the
  anti-aliasing draws them. The column shafts have 64 sides instead of 20, so their outlines stay
  round and steady as the camera orbits close. The full-size depth takes about 1 to 11 MB more
  video memory at Medium and above, kept down by a one-byte channel.
- **The knight, rounded.** Dennis spotted that the knight read flat and matte beside the rest of the
  set, and guessed the cause, its flat faces, which the renders confirmed: a flat face mirrors one
  direction of the room, so each showed one even tone, while a turned piece carries its highlights
  across itself. The knight's neck, head, muzzle, ears and mane are now blocks whose faces bow out
  (a superellipsoid, n = 4) within the old boxes' bounds, so it keeps its blocky outline and its
  height, and the light runs across it. The scene draws 7.5 % more triangles with the same draw
  calls, about 1 % more GPU time at High.
- **A softer finish on the dark pieces.** Dennis spotted hard white lines running down the dark
  pieces in MONOLITH. They were the room's two strip lights, which obsidian's near-mirror clearcoat
  drew as lines a few pixels wide down each turned body. The clearcoat is now 0.22 rough, not 0.08,
  as rough as the slate beneath it, so the same light spreads into a broad, soft sheen and the set
  stays glossy; the cathedral's pieces barely change.
- **The loading screen's arc.** As the M is written, White's back rank, rook to rook, flies in
  along its own radii, overshoots and settles in an arc over the emblem, the rooks first and the
  king and queen last at the crown. It carries over the idea of Dennis's Firewatch dashboard
  loading screen, whose icons fly in along an arc above its logo. The row breathes while the board
  is built, bows a to h as the glint crosses the emblem, and opens out as the screen lifts; Minimal
  and reduced motion draw it still. The pieces are the house set in the world's accent, written
  into the page by `tools/build-emblem.mjs` 1.3.0 so they paint with the first frame, and the
  emblem leaves the arc its headroom, so the whole stays centred and inside the window on
  desktops, laptops and phones either way up.
- **The cathedral, by name.** At Dennis's request the cathedral is no longer called Gothic: the app
  bar's subtitle (Cathedral world · marble vs. obsidian), the board's label for screen readers, the
  palette's `:world cathedral`, the World setting's note, the Grimoire's Worlds entry, the
  documents and the mockups' taglines now call it the cathedral. The notes on earlier releases
  keep the name they were written with.
- **The brand files, renamed.** At Dennis's request, while the logo is still being decided, the
  brand files no longer carry "conical" in their names: `assets/brand/CONICAL_MONOLITH_SYSTEM.md`
  is `MONOLITH_M_SYSTEM.md`, `conical-monolith-brand-kit.svg` and its generated twin are
  `monolith-brand-kit.svg` and `monolith-brand-kit-generated.svg`, the variants and their review
  PNGs go from `conical-m-<n>-<layout>-<skin>` to `monolith-m-<n>-<layout>-<skin>`, and the brand
  generator `assets/generator/conical_m.py` is `monolith_m.py`, its `CONICAL` parameters
  `MONOLITH_M` and `mono_assets.py`'s `load_conical()` `load_monolith_m()`. The documents, the
  generators and the files they write call the letter the MONOLITH M; the rebuilt files differ
  from the old only in their names, paths and headers, the official marks' geometry is untouched,
  and the notes on earlier releases keep the names they were written with.
- **Left for a later call.** In a two-player game the engine's other help (the evaluation bar,
  Hint, Calculate moves) carries no Analyze mark; on a phone the handover's notice stays over the
  move strip until OK or the next move; the palette button no longer shows its key, Ctrl K, which
  is in its title and in Settings' keys list; and `assets/monolith-logo.svg`, the bare M, is read
  by nothing now, so whether it stays is open while the logo is being decided. Each is left for
  Dennis to decide.
- **Headers and documents.** Every file the release changed carries its own version; the page
  header, `js/app/base.js` (the release on screen), README.md and this file carry 2.18.0. A new
  module, `js/game/pgn.js` 1.0.0, writes and reads PGN. README.md, ARCHITECTURE.md, GRAPHICS.md
  and STUDIES.md describe the release, MONOLITH_HYBRID.md, two mockups and their generator drop
  "Gothic", and the Grimoire has its new entry. `tools/build-piece-models.py` 1.0.1 records in its
  header that it is out of step with the knight and the clearcoat. Shipped headers keep three
  entries; the 37 that rolled out are below, under Entries moved from file headers.

**Checked.**

- On the merged tree: no conflict markers, every script under `js/` and `tools/` passes
  `node --check`, the page has no duplicate ids, and `tools/build-emblem.mjs` reports the page
  current.
- After the seven packages were merged, in headless Chromium on the GPU: all six tabs at
  1600 × 1000 and 390 × 844 in both worlds with no console or page errors; a friend game turning
  the board to π and back to 0, and Reset view pressed against the turn; the free board and Play
  from here; a game against the computer; a reload restoring a game; a typed move in the
  Crucible's Moves box, which no longer freezes the Play game; Analyze loading a FEN, a PGN and text
  that is neither; the X-Ray's Space after a click on the rail; drag-to-move; and the loading
  screen's arc through to the lift. `tools/verify-studies.mjs`: every study passes.
- After the phone and tablet pass was merged (73a4264): the static checks again, then all six tabs
  at 390 × 844, at 820 × 1180 with touch and at 1600 × 1000, in both worlds, with no console or
  page errors, no duplicate ids and no sideways overflow, a pinned line's Play to here inside its
  chip and the Crucible's heartbeat whole; a friend game on phones 390 and 360 px wide in both
  worlds, the board turning each move; and `tools/verify-studies.mjs` again. The sizes given in the
  notes above (Analyze's panel at 390 × 844, the tablet's board at 820 × 1180, the pinned line at
  960 × 700) were measured before and after the pass.
- The cathedral's columns, on the GPU: the teeth went when the light pass was switched off, which
  placed the cause, and a one-pixel remainder came from a single-sample depth against the
  multisampled scene. A 20-sided shaft's outline wobbled 2.9 to 3.2 px peak to peak in an orbit,
  a 64-sided one 0.33 to 0.51 px. Missing anti-aliasing (every level has it), dynamic resolution
  during motion, shadow acne, and the ray march's step banding and shadow lookup were ruled out.
  GPU timer queries stayed within 0.2 ms of the old figures at every level, the draw calls are
  unchanged, and the video memory grows by 1.2 to 10.8 MB at Medium and above. Not verified: other
  GPUs, browsers and phones, and Dennis's own camera poses, which lie outside the camera's limits.
- The rules, on their branch at 1600 × 1000 and 390 × 844 and again after the merge (92f2f52) at
  1600 × 1000: a draw offered to the computer in nine cases, A to I (the start position; the
  computer a queen down, a queen up, and level at move 25; a mate for either side; an undo while
  it judges; an offer on its move, then an engine that fails while it judges; and two players);
  the Explore switch, its Settings row and `:explore analyze`, through a reload; and the Analyze
  mark: the marks, the badge, the handover, the PGN comment, a reload and an undo, and the games
  that carry none. No console or page errors and no duplicate ids.
- The chrome, on its branch: the loading screen's stills the same pixel for pixel with the emblem
  drawn from the shared drawing; the wordmark's M on the word's baseline; every segment of the
  match strip on one baseline; the selected tab's contrast (above); and the actions, in the rail
  and in the app bar, at seven sizes in both worlds: 1600 × 1000, 960 × 700, 1180 × 820,
  820 × 1180, 844 × 390, 390 × 844 and 360 × 780, the last five with touch.
- The pieces, on the GPU in both worlds against renders from before: on a dark rook in MONOLITH
  the brightest streak fell from a peak of 141 to 102 (of 255) and widened from 4 to 9 px; the
  share of the knight in one flat tone fell from 0.64–0.84 to 0.18–0.31 in MONOLITH; the knight
  has 4,803 vertices instead of 2,399, and the frame takes 0.01 to 0.02 ms more GPU time at High.
  A knight's hop, a knight capturing and captured (the shatter), picking a knight by its head and
  Analyze's phantom knights work as before, and the shared geometry is never freed.
- After the rules, chrome and pieces were merged (6787621): the static checks again,
  `tools/build-emblem.mjs` reporting the page current and `tools/verify-studies.mjs` passing; all
  six tabs at 390 × 844, at 820 × 1180 with touch and at 1600 × 1000 in both worlds, with no
  console or page errors; a friend game on a phone; and the chrome's own run at 1600 × 1000,
  960 × 700, 390 × 844 and 844 × 390 in both worlds, the actions working in the rail and in the
  app bar, the release reading v2.18.0 and each world's wordmark in place, with no errors.
- Each package on its own branch before the merge, in headless Chromium (the earliest runs on
  software GL, SwiftShader; the rest on the GPU): its own scripted checks, most at 1600 × 1000
  and 390 × 844, with `tools/verify-studies.mjs` where play, studies or Analyze changed.
- Not tested here: phones and tablets were checked as emulated viewports in headless desktop
  Chromium on one GPU (an RTX 5050 through ANGLE D3D11), not on real devices or in other browsers.
  Also not tested: Copy PGN and Download PGN against a real clipboard and download, reduced motion
  set by the system rather than Minimal, and a live deployment on GitHub Pages. The PV header's
  touch hint (083cacc) was checked on its own, at 390 × 844 with touch and at 1600 × 1000. The
  README's screenshots are still the 2.12.0 capture.
- Not verified for the rules, the chrome and the pieces either: other GPUs and browsers, and real
  devices. Known: an action that has the keyboard focus can lose it when the window is resized
  across 900 px, as the cathedral runs showed; and the piece models are out of step with the
  knight and the clearcoat: `tools/build-piece-models.py` stops at its check that
  `js/scene/board.js` still says what it copies and still writes obsidian's clearcoat at 0.08, and
  the `.blend` files in `assets/models/` show the box knight.

## 2.17.0 (10/26/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis landed on the Conical M, the tiled M he worked out as a system
(`assets/brand/CONICAL_MONOLITH_SYSTEM.md`), and made its 4 × 4 tiling MONOLITH's official logo
(`assets/monolith-logo.svg`, the bare M) and emblem (`assets/monolith-emblem.svg`, the same M
carrying twelve pieces of the house set). He asked for the new logo in the app bar; the loading
screen takes the new emblem from its file.

- **The logo in the app bar.** The bare M replaces the star mark beside the name, at the same 32 px.
  Its squares take the board diagrams' dark tone, as the loading screen's emblem does: in the
  cathedral that is the very slate Dennis drew the M in (#6f8a91). In MONOLITH they take the world's
  light slate (#8C98A8), since its dark slate square (#4E5B6C) sank into the bar at about 2.5:1,
  where the light one holds as the steel star did. The mortar is the bar's own colour, one pixel
  wide at any size (a non-scaling stroke): at 32 px the drawing's own mortar is a thirtieth of a
  pixel, and the twelve squares would merge into one shape.
- **The emblem on the loading screen.** The emblem in `assets/` is the Conical M now, its squares
  one slate where the old emblem's were two tones. The screen draws them in the diagrams' dark
  square, so the cathedral shows the emblem as drawn and MONOLITH shows it in its own slate; the
  woods are unchanged. The M is written as the new letter runs: up the left leg, down to the middle
  of the bridge, up again and down the right leg, the left foot first and the right foot last. The
  inline emblem is 78 KB (it was 99.5 KB).
- **`tools/build-emblem.mjs` 1.2.0.** It stopped on the new emblem ("the squares should have two
  fills"). It now reads a board of one tone as the dark squares; places a square the letter cuts by
  the middle of its outline rather than its first point, which for the generator's paths is a
  corner; places a piece through the transform on its own paths as well as its group's, since the
  generator puts each piece's matrix on its paths; and writes the app bar's logo from
  `assets/monolith-logo.svg` between new `brand-logo` markers in the page, so neither mark is ever
  pasted in by hand. The marks themselves come from Dennis's brand system,
  `assets/generator/conical_m.py`.
- **Headers and documents.** The page header, `css/layout.css`, `css/monolith.css` and
  `js/app/base.js` (the release on screen) carry 2.17.0; README.md and ARCHITECTURE.md describe the
  two marks and what the builder writes, and list `assets/README.md` and the brand system's
  document. Shipped headers keep three entries; the three that rolled out are below, under Entries
  moved from file headers.

**Checked.**

- The builder on the page: 12 squares and 12 pieces in the emblem and 12 squares in the logo, every
  square of class `d`; the timing classes run along the letter from `a0` (the left foot) to `a20`
  (the right foot), and the left and right legs mirror each other. Run a second time, it reports
  both marks current.
- In headless Chromium, the page opened from disk with its scripts and the network blocked, so only
  its markup and stylesheets ran: the app bar at 1280 × 800 (at 1× and 2×) and 390 × 844 (at 3×) in
  both worlds, the logo 32 × 32 at the bar's left gutter with its squares apart, and no sideways
  scroll; the old and new bars compared side by side, and five tones tried for MONOLITH.
- The loading screen scrubbed frame by frame through the page's own CSS animations, in both worlds:
  the M written foot to foot in gold (ink in MONOLITH) and cooling to slate, then, with the second
  stage started by hand, the twelve pieces set down in turn and the glint.
- `assets/generator/audit_assets.py` on the assets folder: all pass.
- Not tested here: the page with its modules running (the boot's real timing, the meter, the
  hand-off to the 3D board), real GPUs, Firefox and Safari, phones and tablets.

## 2.16.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis asked the loading screen to slow down and breathe, and to bring a loading meter and rotating,
randomized tips and facts with it, styled for depth and excitement.

- **Slower, with room to breathe.** The M is written in 2.65 s (it was 1.7 s), each square taking
  0.85 s to light and cool; the name gathers in over 1.5 s. Once the board has drawn, the pieces
  are set down 0.125 s apart, the glint follows, and the emblem holds a breath before the screen
  lifts: 3.6 s (it was 2.05 s), then a 0.95 s fade. A slow light breathes behind the emblem
  throughout, and the screen's ground is lit a little at the centre.
- **A loading meter that tells the truth.** Under the name, a recessed rail with a segment for each
  step: the scripts, the board, the first frame, MONOLITH's pillar models and Stockfish. A segment
  fills, with a flash, only when its step reports in (`bootStep()` in `js/ui/boot-screen.js`,
  called by `js/main.js`, `js/scene/pillars.js` and `js/game/engine.js`), a sheen crosses the step
  under way (on the compositor, so it keeps moving while the board is built), and the line beneath
  names that step, with the count of steps settled. A step that fails is marked and named once
  everything has settled. The screen waits for none of them past the first frame, so the models
  and the engine may still be on their way as it lifts; when all five are in, a sweep of light runs
  the length of the rail.
- **Tips and facts.** A card raised off the stage turns over an entry every 5.2 s, in a shuffled
  order: 23 tips about the page (keys, palette commands, the destinations, Settings) under a Tip
  chip, each checked against the page, and 25 facts about chess under Did you know?. Keys and
  commands are drawn as key caps, and the palette's key is the one for the keyboard (Ctrl K, or ⌘K
  on Apple keyboards). The entries live in a new dataset, `js/data/boot-tips.js`. Settings → Tips:
  Off keeps the card to the facts.
- **Both worlds.** In the cathedral the meter fills in gold with a warm glow, and the card carries a
  gold edge and a gold chip for a tip, blue for a fact. In MONOLITH it is ink and steel, square-cut,
  in the telemetry type, with an outlined chip for a fact; no cyan, which MONOLITH keeps for
  meaning.
- **It follows Animation speed.** Brisk runs every length at 0.55 (about 1.5 s and 2 s for the two
  stages); Minimal draws it still and lifts it as soon as the board has drawn, as reduced motion
  does. A hint under the card says how to skip ("Tap to skip" on touch screens). On a short window,
  a phone on its side, the card and the hint step aside for the emblem.
- **Headers and documents.** ARCHITECTURE.md describes the stages at their new lengths, the meter's
  five steps and what reports each, the tip card and the pace; the README the screen; the page
  header the dataset. Shipped headers keep three entries; the five that rolled out are below,
  under Entries moved from file headers.

- **His drawings.** Dennis renamed his first meter drawing `graphics-meter-design-v1.0.svg`; the
  2.11.0 notes below name it as it was then.
- **The 3D pieces as .blend files.** Dennis asked where the 3D pieces' .blend files were: there
  were none, since the page builds its pieces in code. Now `assets/models/` holds `piece-pawn.blend`
  … `piece-king.blend`, each piece in marble and obsidian with the pillars' review room, and
  `pieces.blend`, the twelve a square apart. A new Blender script, `tools/build-piece-models.py`,
  builds them from `js/scene/board.js`'s own numbers each time it runs: the profiles through
  three.js's spline sampling under a live Screw modifier, the knight's head and the crowns' parts
  where `buildPiece()` puts them, the page's names for every part, and the two materials with a
  `world` value that moves them between the cathedral and MONOLITH. They are organised as the pillar
  files are, each piece's collection with a glTF for MONOLITH exporter. The page loads none of them.

**Checked.**

- In headless Chromium (software GL), the loading screen, 107 checks. Every earlier check holds at
  the new lengths: in every destination and with either world pinned it is in the page and its
  world before any module runs and lifts once the board has drawn; the board is built 2.65 s after
  the writing began, and the pieces, the glint and the breath take their 3.6 s before the lift;
  every route away (reduced motion, blocked storage, `main.js` blocked, a module missing, a frame
  that always throws, a boot step that throws, JavaScript off, the page from disk, no WebGL) ends
  as it should, and a key or a click still skips ahead without reaching the page.
- The meter, traced step by step in both worlds: as the page is parsed it shows the scripts under
  way at 0 / 5, by the time the modules run they are in, and from there no step ever goes back and
  the count is always the steps settled. Stockfish's segment fills only once the engine has
  reported ready, the pillars' only once their three models have arrived, the first frame only
  after the board. Failed steps (the preview, made to fail them) are marked and named once
  everything has settled.
- The tips: shown and turned over while the screen is up (three entries in one software-GL boot),
  with no stray backticks or placeholders and the right chip; Tips: Off shows only facts. All 48
  entries fit the card in two lines on a desktop and three on a phone, in both worlds, without the
  card changing height. Every tip was checked against the page (its keys, commands, settings and
  destinations), and the facts are settled history or arithmetic.
- Animation speed: Brisk writes the M in 1.46 s and sets the pieces in about 2 s; Minimal keeps it
  still, the pieces standing, and lifts it without a fade.
- The layout at 390 × 844, 844 × 390 (the card steps aside), 1280 × 800 and 1920 × 1080: everything
  inside the screen, nothing overlapping, no sideways scroll, and the skip hint fits the device.
- Recorded in both worlds and on a phone with the boot held 0.7 s, and reviewed frame by frame;
  recordings sent to Dennis.
- The pieces, in Blender 5.2: every exporter writes its .glb, and every exported piece, both woods,
  matched the page's own (three.js r147 running `board.js`'s lathe, GEO table and `buildPiece()`)
  part by part, every vertex within 1.5e-7 both ways. No path of the machine that built them is in
  any file. Each piece rendered from its file's camera and looked at.
- The earlier gates, waiting for the screen to lift as a visitor would: the journeys (25), the
  races (10), the palette and keys (9), and the page without WebGL 2, without WebGL and without the
  post-processing scripts (14).
- A fresh clone of the release (129 files), served under `/monolith/` by a plain static server, 14
  checks: the screen, MONOLITH 2.16.0, saved settings moving keys, the vendored engine replying, the
  recorded runs, the pillar models from `assets/models/`, no failed requests, no page errors.
- Not tested here: real GPUs, Firefox and Safari, phones and tablets, and a live deployment on
  GitHub Pages; the screen's total length on a real GPU, where the board builds and the first frame
  draws far faster than the seconds they take in software.

## 2.15.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis asked for the loading screen to be animated, sophisticated, in four to six seconds. He also
finished reworking his piece set, redrew the graphics meter (version 1.2 of his drawing), and asked
for every asset to live under `assets/`.

- **The loading screen, animated.** About five seconds in three stages, after which it lifts:
  1. The M is written, square by square along the letter's stroke (up the left leg, down to the
     V, up, and down the right leg). Each square lights in the world's primary colour (gold in the
     cathedral, ink in MONOLITH) and cools to its own; the name gathers in, letter by letter.
  2. The board is built while the screen rests. The page's boot now runs only once the M is
     written, so its long tasks fall in this pause rather than in the motion; if it takes more than
     a second, a bar sweeps.
  3. Once the board has drawn, Dennis's pieces are set down in turn, the sides alternating from the
     pawns to the kings, and a glint crosses the emblem corner to corner. The screen then lifts,
     the emblem coming forward as it fades.

  A key or a click finishes the stage under way. Keys go no further than the screen while it is
  up, so the page underneath is never worked blind, but the browser's own keys still work. While
  the pieces are set, the frame loop draws nothing under the screen. Reduced motion keeps it still
  and lifts it as soon as the board has drawn. Every square's and piece's moment is a class
  `tools/build-emblem.mjs` gives it, so the stylesheet times the first stage before any script runs.
- **The house piece set, reworked.** Dennis redrew the pawn and the king and adjusted the knight's
  nostril, to make the set wholly his own; each piece is now one contour and one face. His redraw
  had the kings and queens on each other's files, and at his word they are back on their own, each
  moved one square. The drawing's ids, header and metadata were applied again (Inkscape had given
  the regrouped parts its default ids), and it now ships with MONOLITH as `assets/chess-pieces.svg`.
  `tools/build-piece-set.mjs` reads it by default, finds each piece wherever it stands, and places
  it through every group around it, since his new grouping moves some of them. The board diagrams,
  the graphics meter and the emblem all carry the new pieces.
- **The graphics meter, as Dennis redrew it.** The cells meet edge to edge on a dial a little more
  than a half circle, the two end cells cut flat by the base line, each panel inset evenly. The
  needle is one shape with the hub ring, raised off the base with the pawn in its eye, and turns
  about the hub. The ribbon is gone, and the chosen cell sits above its neighbours now that they
  touch.
- **Assets under `assets/`.** The pillar models and their `.blend` sources moved from `models/`
  to `assets/models/`, with their manifest; the page fetches them from there. Each `.blend`'s
  exporter writes beside the `.blend`, so they still export where they belong.
- **Headers and documents.** ARCHITECTURE.md describes the stages and when the boot runs among
  them; GRAPHICS.md the new meter; the README the screen, the meter and the folder. Shipped headers
  keep three entries; the six that rolled out are below, under Entries moved from file headers.

**Checked.**

- In headless Chromium (software GL), the loading screen, 61 checks. In every destination and with
  either world pinned, it is in the page and in its world before any module runs and lifts once the
  board has drawn, with no page errors. The stages run in order and on time: the board is built
  1.7 s after the writing began, and the pieces and glint take their 2 s before the lift. With
  frames held back after the boot it stays. A key while the pieces are set lifts it at once and
  does not reach the page (Ctrl+K opens no palette until the screen is gone; then it does); a click
  while the M is written starts the board within 0.1 s. Reduced motion, blocked storage, `main.js`
  blocked, a module missing, a frame that always throws, a boot step that throws, JavaScript off,
  the page from disk and no WebGL at all each end as they should.
- The animation recorded in both worlds and reviewed frame by frame; Chrome draws black where a
  colour-mix keyframe has an implied end, so the glint's ends are written out. Recordings sent to
  Dennis.
- The new pieces against Dennis's drawing, square by square: every piece the diagrams draw matches
  the drawing to within 0.01% of its pixels. The emblem's twelve pieces sit on the same squares as
  before, in the right woods.
- The meter at Minimal, Medium, High and Ultra, in both worlds and at phone width: the needle
  points at each level from the raised hub; the chosen cell's outline is whole.
- The earlier gates, waiting for the screen to lift as a visitor would: the journeys (25), the
  races (10), the palette and keys (9), and the page without WebGL 2, without WebGL and without the
  post-processing scripts (14).
- A fresh clone of the release (128 files), served under `/monolith/` by a plain static server, 14
  checks: the screen, MONOLITH 2.15.0, saved settings moving keys, the vendored engine replying, the
  recorded runs, the pillar models from `assets/models/`, no failed requests, no page errors.
- Not tested here: real GPUs, Firefox and Safari, phones and tablets, and a live deployment on
  GitHub Pages; the screen's timing on a real GPU, where the board builds faster than in software.

## 2.14.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis drew a hero image for the new name, an M of chessboard squares with his house piece set
standing on it, and asked whether it could become a loading screen in the app's colours. The page
now opens on it.

- **The screen.** From the first paint until the 3D board has drawn its first frame: the emblem,
  the name in Michroma and a thin sweeping bar, on the stage colour; then a 0.4 s fade. Before
  anything paints, a short script sets the world the page will open in from the saved preferences,
  by the rule the page itself uses (a pinned world; else MONOLITH for Analyze and the Crucible and
  the cathedral for the rest), so the screen and the frame around it appear in that world from the
  start.
- **Its colours.** The emblem's squares and woods are the board diagrams' custom properties
  (`css/position.css`): in the cathedral the squares Dennis drew it on (#e6e6e6 and #6f8a91), in
  MONOLITH the slate pair, with boxwood and ebony pieces in both. The seams between the squares are
  the stage colour. The bar is the world's primary colour: gold in the cathedral, ink in MONOLITH,
  whose solved stops keep cyan for meaning.
- **The emblem.** `assets/monolith-emblem.svg` is Dennis's concept as a house-standard source:
  the ✒ header, a title, his Inkscape view, Dublin Core metadata, and every square and piece named,
  the pieces' parts after the house piece set's. Its pieces are named White and Black by their
  faces, as the page reads them; the concept's ids, copied from the piece set's drawing, ran the
  other way. His concept stays beside it in `assets/` as he drew it.
- **Into the page.** `tools/build-emblem.mjs` writes the emblem into `index.html` as inline SVG
  between two markers, its fills turned into classes: about 100 KB, 27 KB compressed. Inline, it
  needs no request and takes the world's colours from the stylesheet.
- **Taking it away.** `js/ui/boot-screen.js` removes it after the first frame drawn once `start()`
  has run (in the Crucible's deck view, after the loop's first pass). A boot that halts without
  WebGL, or throws, removes it at once; one that finishes but draws nothing uncovers the page after
  8 s. `js/file-check.js` removes it from disk, before its note, and at the window's load event when
  `main.js` or one of its modules never loaded. A `<noscript>` style hides it without JavaScript.
  `#app` is `aria-busy` while it shows, and the screen itself is hidden from screen readers.
  Reduced motion: no fade and no sweep.
- **Two tools on Windows.** Writing `tools/build-emblem.mjs` turned up a fault it would have
  copied: `tools/build-piece-set.mjs` and `tools/pack-models.mjs` found their default folders from
  the script's URL, which on Windows reads `/C:/…` (no Windows path) and keeps `%20` for a space.
  All three now use `fileURLToPath`. The piece-set builder's header template also still said
  Wizard's Chess, so a rebuild would have brought the old name back; it says MONOLITH now.
- **Headers and documents.** ARCHITECTURE.md has a section on the loading screen, with every route
  that takes it away; the README and the page's header mention it. Shipped headers keep three
  entries; the four that rolled out are below, under Entries moved from file headers.

**Checked.**

- In headless Chromium (software GL), 51 checks. In Play, Analyze, the Crucible's deck, the
  Grimoire, and with either world pinned against its destination: the screen and its emblem are in
  the page before any module runs, painted in the world the page then opens in, and gone once the
  board has drawn, with `#app` no longer busy and no page errors. With frames held back after the
  boot, the screen stays; released, it goes within 0.9 s of the first frame. Reduced motion (no
  fade, no sweep), blocked storage, `main.js` blocked, a module missing, a frame that always throws
  (gone at the 8 s fallback), a boot step that throws (gone at once, the error still raised),
  JavaScript off, the page from disk (gone, the note showing) and no WebGL at all (gone, the WebGL
  notice showing).
- The screen rendered at 1280 × 800, 390 × 844 and 844 × 390 in both worlds; previews sent to Dennis.
- `tools/build-emblem.mjs` run twice: the second run finds the page current. Rebuilt from Dennis's
  drawing by its default path, `js/data/piece-set.js` is byte for byte the shipped file, and the
  model packer, by its default folder, writes the nine published wrappers byte for byte. Under
  Node's Windows path rules the default paths now resolve to the project's folders, where they gave
  `\C:\…` before; the tools were not run on Windows itself.
- The earlier gates, again: the journeys through the six destinations (25), the fixed races (10),
  the palette and keys (9), and the page without WebGL 2, without WebGL and without the
  post-processing scripts (14).
- A fresh clone of the release, served under `/monolith/` by a plain static server, 14 checks:
  the page as served carries the screen, its inline emblem and the `<noscript>` style; the screen
  goes once the board has drawn; MONOLITH 2.14.0 boots, saved settings move to the new key, the
  vendored engine starts and replies, the recorded runs and the pillar models load, no request
  fails, no page errors.
- Not tested here: real GPUs, Firefox and Safari, phones and tablets, and a live deployment on
  GitHub Pages.

## 2.13.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis renamed the app MONOLITH. The name was already its second world's, the instrument he
designed in his plates; it now names the whole app as well, and the world keeps it.

- **On screen.** The app bar, the tab's title, the version chip, About and `:version` say
  MONOLITH, and so does the note shown when the page is opened from disk. In the Grimoire a term's
  place is "In MONOLITH", and the MONOLITH entry says the whole app carries the world's name. The
  Crucible's third engine kind is MONOLITH level: the app's levels play as MONOLITH Novice (1) to
  MONOLITH Maximum (8), and a results JSON is titled `Crucible Run (MONOLITH Edition - v1.0)`.
- **Saved settings** move from `wizards-chess-prefs-v2` to `monolith-prefs-v2`. On first load
  the page reads the old key, writes the settings under the new one, and removes the old copy only
  once that write has succeeded; if it fails (storage full or blocked), the old copy stays and is
  read again next time.
- **The tools** look for `index.html` first and still find a `wizards-chess.html` from before
  the rename; the calibrator's console line and PGN event say MONOLITH.
- **The .blend files.** Each collection exporter is now named glTF for MONOLITH, the Rook's and
  `pillars.blend`'s ten included. The name is a fixed 64-byte field, rewritten in place, and only
  the compressed frames that hold it were rewritten, at Blender's own settings.
- **A tenth pillar model.** The Rook, Dennis's idea of a pillar that looks like one of the pieces,
  came from Blender job 2026-011 (`monoliths_build.py` 1.5.0): the game's rook drawn up into a
  column, one watertight mesh, in `column-rook.glb` and `column-rook.blend`, and in
  `pillars.blend` beside the other nine. No style uses it yet; `models/MANIFEST.md` has its rows.
  That build now writes its .blend files with the remembered folder already blank.
- **Headers and documents.** Every file's ✒ Title carries the new name, and its "- vX.Y" now
  matches its Version; in 27 files the title had stayed behind. Headers that named the page
  `wizards-chess.html` name it `index.html`, its file in the repository. Shipped headers keep three
  entries; the 21 that rolled out are below, under Entries moved from file headers.
- **The engine's source.** As Dennis asked, his fork of stockfish.js also keeps the network the
  build embeds, `nn-61e7af4bb97d.nnue`, on its `v19.0.1-net` branch: one commit on top of the
  `v19.0.1` tag, so the fork builds this engine without a download. The file is the network inside
  the vendored `stockfish-19-lite-single.wasm`, byte for byte; `engine/README.md` says where it is.

**Checked.**

- In Node: the preferences repair and the move to the new key, 16 cases (the old key alone, both
  keys, a failed write, blocked storage, a first visit). Every script parses; the rules, the
  levels and the instrument's code changed only in their comments.
- In headless Chromium (software GL), with settings seeded under the old key: the journeys through
  the six destinations (25 checks), the fixed races (10), the palette and keys (9), and the page
  without WebGL 2, without WebGL and without the post-processing scripts (14).
- A fresh clone, served under `/monolith/` by a plain static server, 12 checks: the page boots as
  MONOLITH 2.13.0, saved settings move to the new key, the vendored engine starts and replies, the
  recorded reference and run load, the pillar models load, no request fails, no page errors.
- From the clone: all 18 studies pass against the vendored Stockfish, and the calibrator plays
  from `index.html` by default and still reads the 1.3.0 single-file page.
- The eleven .blend files in Blender 5.2.3: the same objects, meshes, materials and collections,
  only the exporters renamed; the Doric's and the Rook's exporters still write their .glb as
  delivered (only the exporter's version string differs).
- The fork's `v19.0.1-net` branch, fetched fresh, holds the network at its SHA-256, and that
  network equals, byte for byte, the one in the vendored WebAssembly's data segments.
- Not tested here: real GPUs, Firefox and Safari, phones and tablets, and a live deployment on
  GitHub Pages. The README's screenshots still show the old name in the app bar; Dennis asked to
  hold them.

## 2.12.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5]

With the graphics levels settled, Dennis asked for a project-wide audit, cleanup and hardening pass
to prepare the repository for a public release. Four read-only audits covered the six destinations
and the code beneath them: rules, game flow and the engine; Analyze and the Crucible; Position, the
Grimoire, the palette, Settings and the saved preferences; and the scene, the renderer and the frame
loop. This release fixes what they found. Nothing about how the game looks or plays was redesigned;
where a fix changed what the player sees, it says so below.

**Game flow.** Several things could finish after the game had moved on and land in the newer
position:

- The computer's reply, after an undo, a new game or a board change made while it thought. It is
  now checked against the game, the view and the record before and after the wait (`play.js`).
- A move still animating when the board was rebuilt. `boardGen` in `scene/board.js` counts each
  rebuild, and a move that finds the board replaced leaves the new one alone.
- The promotion chooser. It belonged to no position, so choosing a piece after an undo, a new game
  or a change of tab promoted on the wrong board. It is now tied to the position it was opened for,
  and a view change, Explore's undo, a new game or a change of destination closes it.
- The die roll, a resignation and an Explore move, each now checked against the game it began in.
- Asking for a hint while one was being worked out cancelled both searches; the second ask now
  waits for the first.
- A study's hold checkpoint shares the Coach's engine. When the Coach was reading the move, the
  checkpoint got no answer and the study read as solved. It now waits its turn (three tries) and,
  failing that, says it could not check, without marking the study solved.

**Rules.** Bishops alone are insufficient material only when every one stands on squares of one
colour. A FEN's en passant square counts only when it and the square the pawn left are both empty.
`fromUci()` promotes to a queen when a move names no piece it knows. A typed move matches its SAN
exactly before it matches regardless of case, so `bxc4` (a pawn) and `Bxc4` (a bishop) are told
apart. Perft is unchanged on all seven reference positions.

**The engine.** An engine whose Worker errors after it has started used to leave every later
search waiting. It now answers the search it had in hand with nothing, starts again once and, if
it stops again, reports the failure. A terminated engine starts nothing more. Start game waits for
the engine in a game against the computer.

**Saved settings.** Every preference is repaired on load against its type and its choices. A
damaged level or side used to stop the page in its first render. A hot-update snapshot whose game
record does not have the shape this version reads is set aside whole. A study's solved date is
read and written as text only.

**Analyze.** Go infinite over the recorded reference now clears the reference's field and fork
walk, which stayed on screen under the live badge. A search stopped partway through a depth could
leave a hole in the line table, where a move had risen to a higher line and its replacement was
never reported; the final table closes it, ordered by score. The sharpness compares lines 1 and 2
themselves, so a missing line 2 gives none rather than line 3 standing in. The fork walk marks
line 1 only where line 1 still follows the trunk the walk was made along. The engine lines are
list items holding buttons.

**The Crucible.**

- **Zero variance.** A run in which every pair scored the same (one side winning every game) had a
  sample variance of zero, so the GSPRT returned 0 forever and the Elo interval had no width. From
  the second pair on, such a run's statistics now take a small prior: one pseudo-pair spread evenly
  over the five pair scores. Twelve straight 2-0 pairs accept H1 at elo1 10 and α = β 0.05, and
  59 drawn pairs accept H0. A single pair still gives LLR 0 and an unbounded interval. Once the
  pairs differ, the statistics are the plain pentanomial ones, so the recorded run's 45 trace points
  are unchanged (largest difference 0.00005).
- **The book.** The book has 45 openings. With node limits on both sides the engines play the same
  moves from the same position, so an opening played a second time replays the same two games and
  counts them twice. Such a run now holds at most 45 pairs, and Start or `:sprt start` says so when
  the settings ask for more. With UCI_Elo or a level the weakened engines vary their play, and the
  openings come round again.
- **A limit.** Every run stops at 200 pairs, an SPRT run undecided, and the deck says why.
- **The results JSON** writes an unbounded Elo or interval end as `"+inf"` or `"-inf"` (JSON has no
  infinity), and adds the run's settings, each pair with its two games (in the order the pairs
  finished, the order the trace counts them in) and the engine build that actually loaded.
- **The Hive** keeps its canvas within what every browser can allocate, so a long run still draws.
- The speed sparkline outside Analyze follows the play engine, whose number it sits beside, and a
  report without a speed adds no zero. A drag on a game's heartbeat ends when the browser takes the
  pointer.

**Rendering.** The scene audit measured these in three r147 under a counting WebGL context, and
each fix was measured again in the browser:

- **The X-Ray ring** was glass by transmission. Any visible transmissive material makes three.js
  draw every opaque object a second time into a full-size, multisampled render target, twice with
  MONOLITH's reflections on, and that target stays allocated (about 290 MB at High on a 2× screen,
  by the audit's reckoning). It is now glass by its surface (a clear coat, sharp reflections, 30 %
  opacity). With the X-Ray on, draws per frame went from 1,431 to 723 (700 without it), and showing
  it no longer compiles six extra programs. Side by side, the ring reads the same.
- **The preview's warm-up** compiled the transparent piece programs and then disposed the materials
  it drew, which in r147 deletes the programs, so the first preview compiled them again. The
  materials it draws (a ghost of each colour, a hologram and a capture ring) are now kept for the
  page's life, and it runs once the world has settled into Analyze, and again after each world
  change. Three previews in a row now link no programs.
- **The light count.** three.js counts no light inside a hidden group, so the candle lights inside
  the cathedral set dropped out in MONOLITH and the first world change recompiled every lit
  program. They now hang on the rig, held at zero in MONOLITH. The winner's glow, a light added at
  the moment of a win, is now made at the start and kept at zero between games. The first world
  change now compiles only MONOLITH's own two materials.
- **The world change's veil** held near black for the whole second half, then snapped clear. It now
  clears smoothly, and starts from wherever an interrupted change left it.
- **The crowned king and the fragments** lost marble's form shading or obsidian's steel rim:
  three's `clone()` drops a material's shader patch. `matCopy()` in `scene/materials.js` keeps it.
  The crowned king gets its own material back when the ceremony clears, and an interrupted camera
  swing puts the camera back. A capture's fragments share one fading copy instead of one each,
  and shrink at the same speed at any frame rate. Motes now last less as the Animation setting
  quickens, like every other effect (they lasted longer).
- **A lost WebGL context** (a driver reset, a GPU shared by too many tabs) now comes back whole.
  The environment maps are drawn by PMREM, not loaded, so the context took them with it and the
  pieces came back without their reflections; they are baked again on restore and the pipeline
  rebuilt. What the lost context held is let go while it is lost, when WebGL's delete calls are
  silent; freed after the restore, the stale objects drew 70 console warnings. The bake frees its
  little rooms once drawn.
- The X-Ray readout no longer reads layout in the frame loop, and the check pulse works out a
  position's check once rather than every frame.
- A pillar model that failed to load is fetched again the next time its style is chosen.

**Graphics.** A saved level this browser cannot run (every level above Minimal, without WebGL 2)
is kept as the choice and named under Graphics and under the dial, with Minimal drawing instead.
Automatic restarts a measuring stretch after frames it did not measure (the Crucible
deck covers the stage), so a return to the board is never judged on a handful of frames, and a new
choice starts its count afresh. GPU names now read right from Firefox (", or similar") and Linux
(driver details in parentheses). Intel's Arc in a Core Ultra and a Snapdragon laptop's Adreno count
as integrated graphics; an Arc card with a model number is a card. Older Radeon HD cards and
virtual machines have kinds of their own. When three's post-processing scripts do not arrive from
jsDelivr, the page runs at Minimal as it does without WebGL 2, and every message names the scripts
rather than WebGL 2.

**Position, the Grimoire and the palette.**

- A study's page opens at its top, and Back returns to the grid where it was left, on phones too
  (the scroll reset targeted an element that does not scroll there). The Grimoire draws at boot (a
  reload onto it showed an empty index), keeps its place and focus after Back, and ignores a damaged
  saved category. Its terms are list items holding buttons.
- The focus stays on a FEN field's chip after the chips rebuild. Copy FEN without the clipboard API
  copies through a hidden field of its own; it used to overwrite the FEN box and leave the board
  editor out of step. The phase is a labelled group whose term link can be reached (it was inside
  an image role), and a row that lights squares no longer holds a term link inside its button. A
  feature chip's name is cut short with an ellipsis in a narrow column.
- A key the Set up editor or another widget has handled no longer also steps the game (the
  editor's arrows were rewinding the game behind it). The snackbar's buttons cannot be reached
  once it hides.
- The move list, the Coach's notes and the candidates are rebuilt only when what they show changes,
  so a click or the focus inside them survives a render, and on phones the panel no longer jumps to
  the move list on every render. The strength slider is hidden in a study.
- `:define` with no exact term searches the Grimoire; `:calc` and `:sprt start` say why they cannot
  run; an empty palette list names no active option; and the graphics levels say what they lack.
- The page header no longer claims the palette reaches every action.

**Cleanup.** Rules for classes no page uses (`.card-rule`, `.card-sub`, `.gr-cat-dot`,
`.stage-layer`, `.actions-grid`, `.divider`, `.ref-card`), seventeen `[hidden]` rules the base rule
in `css/tokens.css` already covers, and `renderStudies()`, which nothing called, are gone.
`clearFragments()` moved from `game/flow.js` to `scene/board.js`, beside the fragments it clears.

**The repository.** Dennis chose the MIT License for the project's own files, `LICENSE`: anyone may
use, change and share them, keeping his copyright notice with them, and they come with no warranty.
The Stockfish engine keeps its GPL-3.0. `.gitignore` (operating-system and editor files, Node logs,
the calibrator's `calibration.csv`, the `.glb.json` wrappers, Blender's backups, local secrets) and
`.nojekyll` (GitHub Pages serves the folder as it is) are new. The README is the front door, with
screenshots of the app in `assets/screenshots/`. `engine/README.md` now says where the engine's
complete source is (stockfish.js 19.0.1, by tag and commit), as GPL-3.0 asks of anyone who
publishes it: upstream, and in Dennis's own fork, `dnoice/stockfish.js`, so the source stays
available from his account whatever happens upstream.

- **The .blend files** no longer carry Dennis's Windows username, as he asked. Blender kept it in
  one place in each file: the folder the Shading workspace's File Browser last showed. That folder
  is blanked in all ten files, and only the compressed frame that holds it was rewritten, at the
  settings Blender itself uses. `models/MANIFEST.md` has the new sizes and hashes, and a step for
  keeping a re-saved file clean: clearing the folder from inside Blender leaves the old path in the
  file after its first character.
- **The calibration kit**, which Dennis chose to publish, sat in `engine/` inside a second folder of
  the same name. Its engine was a byte-for-byte copy of `engine/`, and its calibrator (1.0.0) and
  page (1.3.0) were older versions of `tools/calibrate.js`, which still reads a single-file page,
  and of the page. Its guide is now `CALIBRATION.md` at the root, for running the calibrator from
  the project folder. The kit's other files stay on Dennis's machine in `archive/`, which Git leaves
  out.

**Checked.**

- In Node: perft is exact on the seven reference positions; the rules checks pass; the instrument's
  arithmetic passes its 16 checks against the recorded runs (the GSPRT trace unchanged, Elo 185.7
  [129.5, 252.6]); the preferences repair passes its 9 cases; all 18 studies pass against the
  vendored Stockfish 19; twelve straight 2-0 pairs accept H1 and 59 drawn pairs accept H0.
- In headless Chromium (software GL), end to end, 25 checks through the six destinations: a game
  against the computer with Hint, Undo, review, a typed move and Resign; a friend game's mate; the
  recorded reference and a live MultiPV search; the recorded deck, a game on the board, a one-pair
  live run and its JSON; a study opened and started; a Grimoire search and article; Settings
  surviving a reload; 18 quick tab changes; no page errors.
- The fixed races, 10 checks: an undo and a new game while the computer thinks, the promotion
  chooser across a change of tab, the Set up editor's arrow keys, Copy FEN without the clipboard
  API, a hint asked twice at once, and the Crucible's book limit with `:sprt start`'s reason.
- Graphics: the levels and Automatic (36 checks), the palette and keys (9), the meter (13), every
  level's allocations on a 2× screen against GRAPHICS.md (5), the page without WebGL 2 and without
  WebGL, and without the post-processing scripts (14). Renderer resources stay level across three
  cycles of every level in both worlds; a lost and restored context draws the same view, with no
  console warnings.
- The ten .blend files, before and after, in Blender 5.2.3: the same objects, meshes (vertex and
  face hashes), materials, collections and exporters, byte-identical .glb exports, and no trace of
  the username. The calibrator played two games of level 3 against `elo:1320` from the project
  folder, and two against the kit's 1.3.0 page.
- Measured as described above: the X-Ray's draws, the previews' programs, the first world change's
  programs, the veil frame by frame, and 38 real renderer strings classified by `classify()`.
- Every module passes the static checks, and every shipped header keeps at most three entries; the
  rest moved below.
- Not tested here: real GPUs (every render ran on SwiftShader), Firefox and Safari, phones and
  tablets, and a live deployment on GitHub Pages. A fresh clone of the release served under a
  sub-path by a plain static server was tested.

## 2.11.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis drew a concept for choosing the graphics level
(`graphics-meter-design-concept-rough-draft-needs-tuning.svg`): a half-dial of five cells, each a
frame with an inset panel holding a chess piece turned to face out from the centre, from the rook on
the left through the knight, bishop and queen to the king on the right, and a needle from a ribboned
hub holding a pawn. It replaces 2.10.0's bar ladder in Settings → Graphics, in a new module,
`js/ui/gfx-meter.js`.

**From the drawing to the page.** The drawing was marked a rough draft to be tuned, so its shapes
are computed rather than traced. There is one centre and one band (outer radius 141, inner 83, in a
320-wide box), and the cells are parted by gaps 3 units wide all the way along. Each panel is inset
6, and the names run on an arc just outside the band. The pieces are Dennis's house set (the same
drawing the Position tab uses), in back-rank order: the a- to e-file pieces, rook, knight, bishop,
queen and king, for Minimal, Low, Medium, High and Ultra. The pawn sits in the hub. The chosen cell
shows its piece in his woods (boxwood face, ebony line), with a gold edge; the others show theirs in
the panel's own tones. The needle eases to a new level with a small overshoot, or jumps when motion
is reduced or Animation is Minimal. While Automatic is on, the hub's ring is lit. Under the dial a
line names the level and how it was chosen: Automatic, chosen by hand, or Custom.

**Each cell is a real button.** A button sits over each cell's bounding box and draws the cell
inside it, but only the cell's shape and its name take the pointer. Where two cells' boxes overlap,
a click goes to the cell under it, and the gaps and the dial's middle take none. The focus ring is
drawn on the cell's own outline. The arrow keys move along the dial, as on every choice in the
panel. A level this browser cannot run is dimmed and disabled.

**Custom on the dial.** Custom settings match no level, so no cell is chosen. The needle points
between the two levels the settings fall between, placed by a rough estimate of their cost on this
screen (`meterPosition()` in `js/scene/quality.js`): scene draws counted for the scene, HDR with its
multisampling, bloom, the light pass, the mirror and the shadow map. The estimate ranks the five
levels in order on any screen, and it is used only to place the needle and to name the nearer level
("about as demanding as High"). It is not a prediction of frame time.

**Checked.**

- 13 checks, all passing, no page errors. A real click on each cell selects it, with the needle at
  −72°, −36°, 0°, 36° and 72°; a click on a name on the rim selects its level. A point inside one
  cell selects that cell, and clicks in a gap or the dial's middle change nothing. ArrowRight and
  ArrowLeft move the level and the focus. High with 4096 px shadows reads Custom, with the needle
  between High and Ultra, no cell chosen and the readout saying so. Automatic lights the hub.
- The dial rendered in Settings at desktop width in both worlds and at phone width (390 px): the
  names readable around the rim, the chosen cell in its woods, the focus ring on the cell's shape,
  and no horizontal overflow.
- Every file passes the static checks, and every shipped header keeps at most three entries.

## 2.10.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis asked for a more realistic, logical, tiered graphics quality system. The page had three
tiers (High, Balanced, Low) and Auto. The gap between Balanced and Low was the whole pipeline at
once, Auto chose by the window's width alone, and it could only step down. A new module,
`js/scene/quality.js`, now holds five levels, seven settings to fine-tune, and an Automatic that
reads the GPU and moves both ways. GRAPHICS.md, a new document, has every number and rule.

**Five levels, each adding to the one below.** The ladder is cut by what each step buys, cheapest
first:

- **Minimal** draws straight to the screen and needs no WebGL 2: the former Low, setting for
  setting.
- **Low** is new: HDR rendering (the half-float, multisampled target), 2× multisampling and bloom,
  at 1× resolution, without the passes that draw the scene a second time.
- **Medium** adds light ray-marched at quarter resolution in 22 steps, MONOLITH's soft mirror floor
  and up to 1.5× resolution: the former Balanced, unchanged.
- **High** doubles the light's resolution (40 steps), sharpens the mirror, doubles the shadow map to
  2048 px and goes to 4× multisampling and up to 2× resolution: the former High, unchanged.
- **Ultra** is new: light at three-quarter resolution in 56 steps, a full-resolution mirror and
  4096 px shadows.

Settings shows them as a ladder of five, lowest to highest, each with bars that rise with the
level. Hovering a level says what it draws, and the line under the ladder says what the level in
use draws and what it suits. The palette has `:quality ultra`, `high`, `medium`, `low` and
`minimal`, with `auto`.

**Fine-tune.** Under the ladder, Fine-tune lists the settings in use: HDR rendering, resolution
(up to 2×, up to 1.5×, 1× or 0.75×), anti-aliasing (4× or 2× multisampling, or off), light shafts
(ray-marched at ¾, ½ or ¼ resolution, or planar), reflections (full, sharp, soft or off), shadows
(4096, 2048 or 1024 px, or off) and bloom. Changing one makes the graphics Custom. A combination that
matches a level selects that level again: shadows back to 2048 px after a change at High is High,
and HDR turned on at Minimal is Low. A setting that cannot act shows what is drawing instead and
cannot be changed, as Dennis's rule against interfaces that lie about their state asks. Without
HDR, anti-aliasing reads "The browser's", light shafts read Planar and bloom reads Off. Options
beyond the GPU's multisample or texture limits are not offered. Turning shadows off frees the key
light's shadow map; the lit materials recompile without the shadow lookups, and the light shafts
march unshadowed light. Bloom off leaves the bloom pass out of the pipeline.

**Automatic.** It starts from the GPU the browser names (WebGL's renderer string), sorted into
kinds:

| Kind | Starts at | Can rise to |
| --- | --- | --- |
| No WebGL 2 | Minimal | Minimal |
| Software rendering (SwiftShader, llvmpipe) | Minimal | Low |
| Older phone or tablet GPU, older integrated graphics | Low | Medium |
| Phone or tablet GPU, integrated graphics | Medium | High |
| Apple silicon, a Mac GPU Safari does not name, a graphics card, or an unnamed GPU on a computer | High | Ultra |

Where a kind spans a wide range, the ceiling sits a level above the start, so a strong device proves
itself on its frame rate. Memory of 4 GB or less caps the ceiling at Medium; 2 GB or less, or two
cores or fewer, cap it at Low. Frames are then measured in 3-second stretches, skipping hidden tabs,
stalls over a second and the 4 seconds after any change, while shaders compile. Two slow stretches
in a row (under 28 fps) lower the level; four quick ones (over 50 fps) raise it, up to the ceiling.
For 20 seconds after a rise the bar for slow is 40 fps, so a level that only just runs is given back
quickly. A level it has had to leave is not tried again until Automatic is switched off and on, so
it cannot swing between two. Each change is said under Graphics with the frame time behind it, and
so is where Automatic started and why ("Automatic chose Medium for integrated graphics (Intel Iris
Xe Graphics). It can rise as far as High while frames stay quick."). Choosing a level or a setting
switches Automatic off; switching it off keeps the level it was at. A level chosen by hand is never
changed, but if it runs slow, Settings says so until the frames recover.

**Smaller changes.**

- The view follows a change of screen density (browser zoom, a move to another monitor) at once.
  Before, it kept the density it started with.
- The footer's GPU cell gives the GPU's name rather than its vendor ("Intel Iris Xe Graphics", not
  "Intel"). RENDER names the level, with Auto when Automatic chose it.
- The Grimoire's Graphics tiers is now Graphics levels. Balanced is kept as a name to search by.
- A choice saved before 2.10.0 keeps its look. Balanced becomes Medium and Low becomes Minimal;
  High and Auto keep their names. The move happens once, marked by `qualityScheme` in the
  preferences.
- The tiers left `js/scene/renderer.js`, and the frame-time watch left `js/scene/post.js`, both for
  `js/scene/quality.js`. `setQualityPref()` left `js/ui/nav.js` for it too.

**Checked.**

- Every level in both worlds, from the same pose, in headless Chromium: the same colours at every
  level. The plain floor at Minimal and Low becomes the mirror from Medium up, and the haze shows
  from Medium up, thickest and cleanest at Ultra. Custom combinations no level uses were drawn too:
  Minimal with the mirror on, High without shadows (the pieces cast none) and High without bloom.
- A run of 36 checks, all passing, no page errors:
  - A new browser: the headless renderer (SwiftShader) is read as software rendering, so Automatic
    chooses Minimal with a ceiling of Low.
  - Each level builds the pipeline its row in GRAPHICS.md describes: composer, light pass, bloom,
    multisampling, steps, shadow map and mirror.
  - Settings shows High by hand: Automatic off, High checked, every Fine-tune row right.
  - Fine-tune changes: shadows to 4096 px is Custom and back to 2048 px is High; shadows off frees
    the map; HDR off shows anti-aliasing, light shafts and bloom as they draw, disabled; Minimal
    with HDR on is Low.
  - Automatic, on a pretend integrated GPU with a synthetic clock: Medium rises to High on quick
    frames. At 33 fps in the trial it goes back to Medium and High is barred. Slow frames lower
    Medium to Low, and neither High nor Medium is tried again. Its notes and help say all this.
  - A slow level chosen by hand is kept, with advice that clears when frames recover, and
    Automatic switched off keeps its level.
  - Six saved choices (Balanced, Low, High, Low under the new scheme, a damaged Custom, nonsense)
    each move as described.
- 28 GPU renderer strings, written in the formats Chrome, Firefox and Safari report on Windows,
  macOS, Linux, Android and iOS, each sort into the kind GRAPHICS.md lists, with a clean name.
- On a 2× screen, the pixel ratio for each level (1, 1, 1.5, 2, 2) and for each Resolution setting.
- The palette's six `:quality` commands, with descriptions from the level table; arrow keys along
  the ladder; the Automatic switch by click; the Grimoire's search for "Balanced" finding Graphics
  levels. 9 checks, all passing.
- The Settings panel at desktop width in both worlds and at phone width (390 px): five levels fit,
  no label is cut, no horizontal overflow.
- No regressions: the Position checks (65) and the pillar checks (11) all pass. Dennis's layout
  (index.html, the .glb models) boots with a saved Balanced shown as Medium.
- Every file passes the static checks (imports, exports, free names), and every shipped header
  keeps at most three entries.

## 2.9.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis finished his pillars in Blender (job 2026-011, `models/` with `MANIFEST.md`) and asked for
the big swap. Nine models came, each with the .blend it was exported from: three monoliths, each
made for its place (the stele in the centre, the rift on the left, the spire on the right), and six
columns built at the centre's size, three classic (Doric, Tuscan, and the Solomonic, a barley
twist) and three modern (Halo, Fin, and the Prism, its chamfers lit cyan); the Solomonic and the
Prism, which arrived while the swap was under way, are each one solid mesh. He also spotted thin
bars popping in and out between the cathedral's columns.

**The pillars.** A new module, `js/scene/pillars.js`, puts the models on MONOLITH's three pillar
places. Settings has a new choice, MONOLITH pillars, and the palette has `:pillars monoliths`,
`:pillars classic` and `:pillars modern`:

- Monoliths: the stele, rift and spire, at scale 1 (the default).
- Classic: a twisted Solomonic column between a fluted Doric (left) and a plain Tuscan (right).
- Modern: a Prism lit by spiralling cyan lines, between a ringed Halo (left) and a bladed Fin
  (right).

Like the monoliths, every style puts three different designs on the three places, with the newest
in the centre, where it is seen most.

Each file is fetched once, read by three.js r147's GLTFLoader (a new script from jsDelivr, beside
the other three.js examples) and shared between the places that use it. The published page's host
serves no .glb, so it carries each model as `.glb.json`, the same bytes as base64 in JSON, written
by a new tool, `tools/pack-models.mjs`; the page asks for the .glb first and the wrapper second,
then asks each host for what it had. Dennis's folder needs no wrappers: Live Server serves the
.glb. Placement follows the
manifest: the origin at the bottom centre, 0.15 sunk into the floor (times the scale) as the built
bases are, the front toward the board, and a column scaled evenly to its place's height (0.827 on
the left, 0.904 on the right). The models keep their own materials (graphite satin, brushed steel,
cyan glow); the graphite takes MONOLITH's environment strength, 1.2, which glTF cannot carry, and
every mesh casts and receives shadows. The built pillars stay in the scene as the fallback: a place
swaps to its model only once the file has loaded, and keeps its built pillar if the file cannot
load, which Settings then says. The files load a moment after the page starts, so they never
compete with the boot, and a newer choice always wins over a file that arrives late. The .blend
files are his sources and are not published or loaded.

**The bars between the cathedral's columns.** They were the lancet windows' mullions. The aisle
walls are one-sided, so when the camera orbits out past one (at the sides, from about distance 11;
it can go to 20) it looks through the wall, as a cutaway. The mullions were boxes, visible from
both sides, so they stayed behind out there as thin bars floating between the camera and the board,
coming and going as the camera crossed them. Each mullion is now a strip on the wall's face, facing
the nave as the wall does: the same divider from inside, gone with its wall from outside.

**Checked.**

- The three styles in MONOLITH at High and Low, from wide poses that show the pillars whole and from
  the game's usual pose, against the built ones: each model on its place, solid, with its glow
  where the manifest puts it, reflected in the mirror floor, and no bloom from the glow; then the
  classic and modern styles again with the Solomonic and the Prism in the centre, the twist and the
  spiralling lines reading from near and far.
- A run of 11 checks, all passing, no page errors: the saved style loading at boot; Settings
  checked and described; Modern and the palette's `:pillars monoliths` swapping all three places;
  the scale and sink of every place for monoliths and for columns; shadows on every mesh; three
  quick changes in a row ending on the last; and, with one file blocked, the other two places
  loading while the blocked one keeps its built pillar and Settings saying so. The same 11 pass
  with the models served only as `.glb.json`, as on the published page.
- The cathedral from the pose that showed a bar (the camera out past the left wall), before and
  after: the bar is gone, and from inside the windows keep their dividers.
- Every file passes the static checks (imports, exports, free names).

## 2.8.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5]

Two things Dennis brought on the same morning: his finished house piece set, to use on the Position
tab, and the match strip in the app bar, which before a game looked out of place.

**The house piece set.** Dennis drew a full chess set in Inkscape for ChessWorkstation
(`chess-pieces.svg` 1.2.0): six pieces in one grammar, a contour of constant width around flat
faces, with the knight on its own foot and the king and bishop, the two that carry a cross, on a
curved one. The board diagrams on the Position tab (study cards, Up next, the detail board, the
structure map, the board editor and its tray, the material rows, the pawn's road) now draw it in
place of the stand-in silhouettes 2.7.0 shipped with.

- `tools/build-piece-set.mjs` reads his drawing and writes `js/data/piece-set.js`, a new plain
  script (`PIECE_SET`). It takes the ebony-faced pieces (the ones with White's ids), moves each onto
  its own square, copies the path data exactly as drawn, and turns his two colours into custom
  properties: `--pc-face` for the faces and `--pc-line` for the contour and the marks inside a face.
  It records the drawing's version and SHA-256, keeps its own version and changelog from one build
  to the next, and stops rather than writing a partial set if a piece, square or colour is missing.
- The woods swap roles between the sides, as he drew them: White has boxwood faces (#decd87) with an
  ebony contour (#1a1a1a), Black the reverse. His layout leaves open which wood is White; here the
  game settles it, since White is the marble, light side.
- The cathedral's diagram squares are now the ones he drew the set on (#e6e6e6 and #6f8a91), where
  boxwood reads best; MONOLITH keeps its slate squares and the same woods.
- A piece fills its square, with the margins he drew, instead of being inset.

**The match strip before a game.** It read "Play, New game | Next, Choose and start": the Play
panel's own heading repeated, an instruction where the strip reports state, and the phrase set in
the larger type meant for the move number. Now, before a game, it shows the game Start game will
begin, built from the Play tab's choices as they change ("You, Marble vs Stockfish, Club 4/8",
"Marble vs Obsidian" for a friend, half-marble dots when the die picks the side), then "Game: Not
started", in the same segments and type as during a game. Only a number (the move, a score, a count)
takes the larger size anywhere in the strip, so "Viewing move 12" and the like now match too.

**Checked.**

- The Position flow run from 2.7.0, 65 checks, all passing, no page errors, with the new pieces in
  every diagram.
- Screenshots of every Position view in both worlds, and the pieces on four palettes side by side
  (the cathedral's old squares, his own, MONOLITH's with the woods, and MONOLITH's with ivory and
  ink), at full size, as 120-pixel thumbnails and as icons on a dark card, which chose the palette.
- The match strip before a game against the computer, against a friend, with the die, in MONOLITH,
  and in a game after 1.e4: the text of each read back and the strip seen.
- The piece-set build run twice on the same drawing writes the same file byte for byte.
- Every file passes the static checks (imports, exports, free names).

## 2.7.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis found the new Position tab awkward and asked for a more intuitive and smarter workflow with
stronger visuals, "not just a stack of text blocks". The tab was four cards stacked one under the
other (the study in progress, the board read aloud as a two-column list, the FEN with its field
chips, and a text list of studies), so every task meant scrolling past the other three, and nothing
in it showed a board.

**One switch, three views.** A segmented switch at the top of the tab (it stays in sight as the
pane scrolls) holds Studies, Read and Set up; one view shows at a time and the tab remembers the
last one. The switch follows the work: a study that starts opens Studies, wherever it was started
from; Open in Set up (a study), Edit in Set up (Read) and the palette's `:fen` open Set up; a
Grimoire term's Go to button opens the view its "where" names first. Badges on the switch say when
a study is running, when the board is in check or the game is over, and when the set-up has been
edited and not played.

**Board diagrams.** A new module, `js/ui/diagram.js`, draws flat SVG boards from a board array:
from either side, with coordinates, square marks, tinted files, dimmed squares and click targets.
The pieces are an original set of simple silhouettes, drawn once as SVG symbols, so every diagram
looks the same in every browser. The squares are mid-tone so both piece colours read on both
square colours, with a palette per world (warm stone in the cathedral, slate in MONOLITH).

**Studies.**

- *Up next* names the first study not yet solved, level 1 first, in the category shown, with its
  diagram, task, category, level and goal, and Start. With every study there solved it says so and
  points to a category that still has some.
- The categories are tiles with progress rings (solved of total); the studies are cards, two
  across, each with its position from the side you play, its level, its goal ("Mate in 2",
  "Hold 12 moves") and a check once solved. The category chips and the text list are gone.
- The detail view shows a large diagram with coordinates, the goal, the side you play, the level and
  the solve date as chips, a pager through the category, and Start study and Open in Set up (it was
  Show its FEN).
- The Study card draws its goal: puzzles a step track of your moves (each filled with its SAN, the
  current one ringed, wrong tries counted); mates a par bar (your moves against Stockfish's
  quickest mate, red past par); queening the pawn's road to the last rank; holds a meter of the
  moves to hold. Hints show as dots on the Hint button. Next study now follows the study order
  (level 1 first) and stays in the category shown.

**Read.** The same facts as before (the code that finds them is unchanged), drawn: whose move it is
and how many legal moves each side has, as bars (the other side's as if it were its turn, left
out while the side to move is in check); the material as a split bar of the two sides' points and a
row of piece icons per side, with the extra pieces marked; the phase as a three-step meter; a
structure map (a diagram with passed, isolated and doubled pawns and open files marked) with a chip
for each feature, including kings with their shelter and bishops; and the rules state as badges:
castling rights per side (the ones legal now filled), the en passant square, the fifty-move count
as a bar, repetition as three dots. Pointing at a bar, chip or badge lights its squares on the map
and on the 3D board; a click keeps them lit, and a pin is kept per position.

**Set up.** A board editor: a tray of tools (move, erase and the twelve pieces), and a board you
click to place, move or take off pieces; right-click erases; the keyboard works too (arrow keys,
Enter, Delete, and a piece letter places that piece). Side to move, castling (offered only where
the king and rook stand on their squares) and en passant (only squares a pawn could just have
skipped) are set beside it; Clear (it keeps the kings), Start position, Board you see and Flip
under it. The FEN box and the editor edit each other: build on the board and the FEN is written;
paste or type a FEN and the board follows. The box sits over a colour layer, so each of the six
fields has its own colour, shared with its chip and its explanation; a field in error is
underlined, and the selected field is marked in the box. Load position is now Play this position;
Copy FEN copies what the box holds (Copy FEN on Read copies the board you see).

**The code.** The study engine moved from `js/ui/position.js` to `js/ui/studies.js` (with the study
order and progress counts the views draw); `position.js` now holds the three views, the editor and
the wiring that was in `js/ui/controls.js` (the FEN box, Load, Copy, the study card, the library)
and `js/ui/panels.js` (the FEN box following the board). The boot is unchanged: 26 steps.
`css/position.css` was rewritten. The Grimoire's "where" texts name the new views, and the
Position tab's panel is 400 pixels wide by default on screens 1,280 pixels and wider.

**Checked.**

- A browser run of the new flows (headless Chromium), 65 checks, all passing, no page errors: the
  tiles, cards and diagrams; Up next per category; the detail pager and Back with focus returned; a
  puzzle solved after one wrong try (the try counted on the track, the move taken back, the reply
  from the line, the solve saved, the ring counting it); Next study staying in the category; hints
  and their dots; the par bar, hold meter and pawn road; Read's bars, chips and badges lighting the
  map and the board, clearing on leave, a pin restored on return; the editor by real pointer clicks
  (a right-click erases), keyboard and move tool; castling toggles following the rooks; Clear, Start
  position and an illegal FEN; the colour layer matching the box character for character and in
  size; Play this position; the switch following a study, Open in Set up (from Black's side for a
  Black study) and the palette's `:fen`; the Grimoire's Go to opening Read or Set up; the Read badge
  and banner for a position in check; one view at a time.
- Screenshots of every view in both worlds, and at phone width (390 pixels), where nothing
  overflows the page.
- The puzzle's reply took 19 seconds in the headless browser and 23 seconds in 2.5.0 on the same
  machine: the delay is the software renderer finishing its animations, not the new code.
- Every file passes the static checks (imports, exports, free names).

## 2.6.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis served 2.5.0 through Live Server and found it all present, then turned to MONOLITH, with
screenshots: from certain angles the board showed glaring white hot spots (the cathedral looks
right), and the pillars were still awkward, flat panes that might do better with some geometry and
depth. Both were there before the split.

**The hot spots.** Rendering the board alone from six poses, and again with each light path taken
out in turn, showed three causes stacked:

- The key's cone was narrow (0.42 rad) with a long penumbra (0.7), so its full-strength core was a
  pool about four squares wide in the middle of the board, the rest falling off around it.
- The squares were glossy (roughness 0.42 and 0.46), and two rim lights stood low behind the board
  (4.5 up, a 0.5 rad cone), so from a low camera their glints raked across the squares.
- Bloom started at 0.8, below the brightest a tone-mapped surface reaches, so every strong glint
  crossed it and bloomed into a blaze several squares across.

Now the key's core covers the board (0.5 rad, penumbra 0.45, intensity 1.6 from 1.75), the squares
are satin (0.5 and 0.54), the cone's haze is lighter (0.72 from 1.15), the rim lights stand high and
narrow (8 up, 0.34 rad, aimed at the pieces' middle rather than the board), and bloom starts at
0.95, so only the brightest glints and what is drawn past white (the vectors, the X-Ray, the
markers) glow. The cathedral's values are untouched.

**The pillars.** Each monolith is now built rather than one thin slab: a base block, a body about a
third as deep as it is wide, a face panel stepped 12 cm out of the front, and a cap, every part a
unit box so the steel edges keep their screen-space width (the 2.2.1 rule). The material is graphite
steel (metalness 0.55, roughness 0.42) instead of near-black glass: a dark mirror showed only the
wall behind the camera, so the faces vanished and only the steel outlines read. A soft wash light
from high over the board's far side now lights the monoliths alone, lighter at the top, so they
stand solid against the haze; the board lies outside its cone. The top of each monolith is where it
was, and the base still stands 15 cm into the floor.

Dennis is modelling a pillar in Blender. When it arrives it can replace these (a glTF file loaded at
run time); the built ones stay as the fallback.

**Checked.**

- The board, pieces hidden, from six poses before and after (headless Chromium, High tier): the
  share of near-white pixels at the two low poses falls from 6.9 % and 2.6 % to none, the brightest
  half-percent from 255 to 214, and the board's mean brightness stays about the same.
- With the pieces, from the same poses and two wide ones: no blaze anywhere; the monoliths read as
  solid, with their base, face step and cap, from near and far.
- The cathedral against 2.5.0 at three poses: it differs by no more than 2.5.0 differs from itself
  between two runs (candles and dust move).
- Every file passes the static checks (imports, exports, free names).

## 2.5.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis found the single HTML file getting unwieldy and asked for a proper separation of concerns
before any more updates. He runs the page from VS Code's Live Server, so the code could become ES
modules. The game is unchanged: this release moves code, it does not rewrite it.

**Where everything went.**

- **The page** (`wizards-chess.html`; `index.html` in Dennis's copy) keeps the markup and the ✒
  header: 707 lines instead of 8,748.
- **The stylesheet**: 12 files in `css/`, cut at its section breaks and linked in their original
  order, so the cascade is the same.
- **The rules engine, the MONOLITH maths and the four datasets** were already separate script
  blocks; each is now a plain script of its own in `js/core` or `js/data`, and also exports itself
  for Node. The computer levels (`LEVELS`, `LEVEL_NO_ELO`, `chooseMove`) joined them as
  `js/core/levels.js`, so the calibrator loads the file the page plays.
- **The 5,850-line main script**: 41 ES modules in five folders (`app`, `scene`, `game`, `coach`,
  `ui`), cut at its own section headers, plus `js/app/store.js` and `js/main.js`.

ARCHITECTURE.md maps every file, the load order and the boot.

**How the modules keep the old order.** ES modules evaluate their imports first, and these import
each other in cycles, so import order cannot be the boot order. Three rules replace it:

1. A module's top level only defines: functions, constants built from literals and pure helpers,
   and `let` declarations.
2. Everything a section used to do when the single file reached it (build meshes, wire listeners,
   register a renderer) is in the module's `init()`, in the same order.
3. `js/main.js` calls the 26 `init()`s in the order the single file ran them.

The early `return` when WebGL is missing became `BootHalt`, thrown by the renderer and caught by
`main.js`, so nothing after it runs, as before.

**Shared state.** An imported binding is read-only, so the 22 variables that more than one module
assigns now live in one object, `app`, in `js/app/store.js` (`app.busy`, `app.view`, `app.hint`
and so on), each with its owner and a line on what it means. The plan sent to Dennis called it `S`;
`S` is already a local name in three functions, so it is `app`.

**How it was cut.** Not by hand. A script parsed the old main script (acorn), resolved every name
in every scope (eslint-scope), assigned each top-level statement to a module by its section, and
wrote each module's imports and exports from the names it actually uses. A declaration stayed at a
module's top level only when evaluating it touches nothing but literals, pure globals and pure
helpers; anything else (a DOM query, a three.js scene object, a read of the preferences, a call to
another module) moved into `init()` at its original place, its name declared at the top. The shaders
and other template literals were never re-indented.

**Made with the split.**

- Opened straight from disk, the page now says it needs a server, over the whole page, instead of
  showing controls that do nothing: browsers do not run ES modules from `file://`.
  `js/file-check.js` is the one plain script that shows the note.
- The navigation section header, which the Grimoire had come to sit between and its code, is back
  with the navigation code; `chooseMove`'s comment is back on `chooseMove`.
- The comment on the engine's fallbacks and two Grimoire entries (WASM build, Reference) no longer
  speak of the page opened from disk; they say when the fallback is used.
- `tools/verify-studies.mjs` 1.1.0 and `tools/calibrate.js` 1.1.0 load `js/core` and `js/data` with
  `require()`, and still read a single-file page (2.4.0 and earlier, such as the calibration kit's
  copy).
- New: ARCHITECTURE.md. Updated: COACH_VOICE.md 1.2.0, STUDIES.md 1.1.0, MONOLITH_HYBRID.md 1.5.0,
  engine/README.md 1.4.0. Every new file carries the full ✒ header.

**Checked.**

- **Static.** All 51 script files parse; every import names an export that exists; no module uses
  a name it neither declares nor imports, beyond the globals the page defines; no import is unused.
- **2.4.0 and 2.5.0 side by side** (headless Chromium, SwiftShader):
  - the 3D scene's 767 objects are identical, internal ids included, so every mesh, material,
    geometry and texture is made in the same order;
  - GPU resources (54 geometries, 23 textures, 19 shader programs) and the saved preferences match;
  - the DOM after boot is identical apart from the version, and after each tab switch identical
    apart from the engine's search lines, which differ from run to run;
  - frame pacing after load is the same, and 2.5.0 is ready about 1.5 s sooner.
- **Regression runs** on 2.5.0, no page errors in any:
  - a game against level 6 with hint, undo, review and the phone layout;
  - the Coach: verdicts, replies, the watch and hints in three steps; a quick mate with its marks,
    the accuracy review and undo;
  - layout at 1920, 1440, 1280, 1024 and 390 px in both worlds: the match strip, no overflow;
  - the Crucible deck and game #78 on the board; the X-Ray readout at phone width;
  - the Grimoire: 148 entries, searches, every article, `:define` and term cards;
  - Position: the board reading and FEN fields, the knight fork, Réti – Tartakower with the
    solution, practice studies played out (solved, held and failed), a study then a loaded FEN,
    and a term card from the reading.
  - Two readings in those runs (a hover that lights no squares in the Philidor position, and the
    level after an unconfirmed load) were run on 2.4.0 too and are the same there.
- **Standalone copy:** opened from disk the note covers the page; over http it boots with
  Stockfish 19 lite ready from `engine/`. A test site that lacked the engine files fell back to the
  same build from unpkg, as designed, so that tier works from the modules too.
- **Node:** the checks against the recorded runs (expected score, Sharpness, the field, the fork
  walk, the GSPRT trace, Elo, pentanomial counts, anomalies, contrast, perft) pass on `js/core`;
  `tools/verify-studies.mjs` passes all 18 studies at depth 20, the three mate pars confirmed; and
  `tools/calibrate.js` plays games from the split files and from a 2.4.0 page.

## 2.4.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis asked for the Position sidebar to be enhanced into "more insightful and ideal learning
components". It had a FEN box and four practice positions; it now has four cards, the active
one first.

**The Study card** appears at the top while a study runs: the goal, a live status line, your
moves so far as chips (for a puzzle), hints one at a time, the solution on request, and Restart,
End study and Next study. Wrong moves, solves and failures are also said in the snackbar, so
the news reaches you on any tab, and the Play tab names the study in its header.

**On the board** reads the position you see, whether the live game, an earlier move, an explored
line or a Crucible game, in two groups:

- *Rules:* side to move (and check), legal moves and the squares they reach, castling rights
  with what is legal right now, en passant (and whether a capture there is legal), the
  fifty-move count, and repetition when a position has come up twice.
- *Structure:* phase, material with the imbalance in words ("White's rook against Black's
  bishop and two pawns"), passed, isolated and doubled pawns, open and half-open files, bishops
  (the pair, or opposite colours and what that means for an ending), the kings and their pawn
  shelter, and the opening's name and code.

Each label is a Grimoire term. Each value that concerns squares lights them on the board while
you point at it, in a colour of its own (blue in the cathedral, cyan in MONOLITH); a click keeps
them lit.

**The FEN card** keeps the box, Load position and Copy FEN, and adds the FEN's six fields as
chips. Select one and it is read out from its own value, and the matching part of the box is
selected. It also says what the parser silently corrects: a castling right whose king or rook
has moved is dropped, an en passant square that does not fit is ignored, a missing field takes
its default. The card's corner says whether the box matches the board, has been edited, or is
not a legal position. The box now follows the board you see, an explored line included, and
Copy FEN copies that.

**Studies** replaces the practice positions: 18 lessons in five categories (Basic mates, Mating
patterns, Tactics, Endgames, Set-ups), each with a level, a one-line goal, the idea it teaches,
hints, and "Read about" links into the Grimoire.

- *Puzzles* (back-rank mate and its deflection, the smothered mate, Réti – Tartakower 1910, the
  knight fork, the pin on the queen, the skewer, discovered check): find the moves; a wrong one
  is taken back and counted, the replies come from the study's line, the last move of a mate may
  be any mate.
- *Practice games* (queen, rook and two-rook mates; king and pawn, won and held; the square of
  the pawn; Lucena; Philidor) are played against Stockfish at full strength for that game only,
  and judged by their goal: mate (with Stockfish's quickest mate as the par), queen a pawn that
  cannot be taken at once, or hold the draw (by the rules, or confirmed by the engine after a set
  number of moves).
- *Set-ups* (the starting position, the castling drill) load with your own settings, as before.
- Solved studies get a tick and a count in the card's corner, kept in this browser. A puzzle
  solved after showing the solution is finished but not counted.

Every study was checked with the vendored Stockfish 19 before it went in: each puzzle move is
the engine's unique best and each reply its best defence; each practice position evaluates as
its goal says; each mate par is Stockfish's quickest mate. Two candidates failed and were
redrawn (a skewer blocked by a pawn, and a pin the defender could break), and one practice position was
dropped (a bishop and wrong rook's pawn fortress Stockfish scored at +0.82). The checks ship as
`tools/verify-studies.mjs`; `STUDIES.md` documents the dataset, the judging and how to add a
study.

**Also.**

- The old "King and pawn ending" practice position (White to move, "escort the pawn or hold the
  draw") is a dead draw with best play, so its note promised a choice that is not there. Two
  studies replace it: one won (the king leads), one to hold (the opposition).
- The player cards counted captures against a full set, so a set-up position showed a row of
  pieces that were never taken. Captures now count from the game's own starting position.
- Eleven Grimoire entries for the new terms (passed pawn, isolated pawn, doubled pawns, open
  file, bishop pair, opposition, Lucena position, Philidor position, back-rank mate, smothered
  mate, studies), and the entries that pointed to the old practice positions now point to the
  studies: 148 entries in all.

**Checked.**

- Every script block passes a syntax check, and `tools/verify-studies.mjs` passes all 18 studies
  at depth 20, with the three mate pars confirmed by `go mate`.
- Headless Chromium (SwiftShader):
  - The board reading at the start and in the Philidor position, its squares lit on hover.
  - The FEN fields: dropped castling rights, an ignored en passant square and a broken board
    are each reported, and selecting a field selects it in the box.
  - The knight fork: a wrong move taken back, the reply from the line, solved after one wrong
    try, the tick and the count.
  - Réti – Tartakower: hints to the last one, the solution shown, finished but not counted.
  - Played out against Stockfish:
    - the two-rook mate (solved);
    - the square of the pawn (drawn by insufficient material, solved);
    - the square again, played badly (failed at the checkpoint);
    - king and pawn (queened safely, solved).
  - After a study, a loaded FEN went back to the saved level, and its player cards showed no
    phantom captures.
  - Both worlds and phone width (no overflow); a term card opens from the reading.

## 2.3.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis's round from play-testing 2.2: a Coach that is true to its title, a reference for every
term, the X-Ray's card out of the way, a Play panel with hierarchy, and a header that informs.

**A Coach that coaches.** Dennis's note: the Coach was an engine line readout. It now reads the
game as a coach at the board would, and every sentence comes from a dataset of its own,
`COACH_VOICE`, written in one voice at his direction (style guide and schema in COACH_VOICE.md).
The page never invents a sentence; it picks a line and fills its slots with checked facts.

- *Your move* gets a verdict against the engine's best, graded by the expected score it gives up:
  Best, Excellent (under 2 %), Good (5 %), Inaccuracy (10 %), Mistake (20 %), Blunder; a move
  from the opening list is Book. The note says what the move does (develops, castles, attacks,
  forks, pins, skewers, uncovers an attack, traps a piece, defends, claims the centre or an open
  file, wins material along the engine's line), and after a slip, the opponent's best answer and
  what it does, then the better move and what it adds. Special cases have their own lines:
  Brilliant, only move, mate found, mate missed, mate allowed, a win of material missed.
- *The opponent's move* is read for you: the opening's name when the game enters a new one, else
  what it takes, attacks, forks, pins, threatens, or that it is quiet; an early queen or the same
  piece moving again is called out once.
- *Your turn* gets a watch: check and the number of ways out; a forced mate of your own; a threat,
  found by handing the opponent the move (a null-move search) and asking what it would do; the
  computer's slip, when there is one to punish; loose, outnumbered or undercut pieces; a stalemate
  trap, a repetition or the fifty-move count when they matter; a chance (something of theirs can
  be won, without saying what); or a tip that fits the board: the opening's jobs in order (centre,
  develop, castle), an open file for a rook, the mate against a bare king, the king's march, a
  passed pawn.
- *Opening habits* (the same piece twice with pieces still at home, an early queen, a king walk, a
  late castle) are said once a game, and only when the engine did not prefer the move anyway;
  castling and full development are praised once. From a set-up position only the king walk and
  castling apply.
- *Hints come in steps*: a nudge about the kind of move, then the piece (lit on the board), then
  the move with its reason and the arrow. The button reads Hint, More help, Show the move, Hide
  hint.
- *The move list* carries ?!, ?, ??, ! and !! beside graded moves; reviewing a move shows what
  the Coach said there.
- *The game ends with a review*: each coached side's accuracy, its inaccuracies, mistakes and
  blunders, and the turning point with a button that shows it on the board.
- *The turn card names the opening* with its ECO code (C50 · Italian Game), as far as the game
  has followed the list.
- *House maxims* close a mistake or a blunder, chosen by the kind of lesson, never two in a row.
  One is Dennis's own: "Aim twice, shoot once: look at every capture and check before you move."

The Coach runs its own Stockfish (32 MB, MultiPV 3 to depth 12 within 1.5 s per position), so
grading never waits on the opponent's engine. Comments switch off in the Coach card's header or
with :coach. The evaluation bar, best line and Calculate moves stay, folded under Engine lines.

*Research behind it.* Dennis asked for the Coach's logic to cover as much ground as research
allows, so its judgements follow published sources rather than guesses:

- The grade bands are chess.com's move-classification bands (expected score lost), and the curve
  from centipawns to expected score is lichess's (WinPercent.scala); the page's logistic constant,
  fitted earlier to Dennis's recorded field, turned out to be the same curve.
- Mates follow lichess's Advice.scala: allowing a mate is a blunder unless the mover already stood
  at −7.00 (a mistake) or −10.00 (an inaccuracy), and a mate let go is graded by what remains.
- Brilliant follows the common definition: a sacrifice of two points or more that the engine
  stands behind, made when not already winning easily.
- Accuracy is lichess's AccuracyPercent.scala, with scalalib's means (the harmonic mean floors
  each move at 1), checked against its own numbers (a 10-point drop scores 64.58).
- Opening names come from lichess-org/chess-openings (CC0): all 3,865 lines replayed with the
  page's rules engine and keyed by position, as `OPENING_BOOK` in its own script block.

**The Grimoire.** A new tab on the rail: a reference for 137 terms in and around the interface,
written for this app and checked against its code (the three drafting runs were stopped before they
wrote anything, so the entries were written directly). Each entry has a definition, how it reads in a game, in analysis and inside
the engine, where it appears in Wizard's Chess (with a jump to that tab), an example and related
terms. The index searches terms, other names and the text, by category (Rules, Notation,
Tactics, Evaluation, Engine, Analysis, Testing, Interface), with / to search. Across the app,
labels with a dotted underline are terms: a click or Enter opens a short card beside the label
(one at a time), with Open in Grimoire for the full entry; source badges explain themselves the
same way. :define <term> opens an entry from the palette. Opening the Grimoire never changes the
world, and it hides the move list for reading room.

**The X-Ray, out of the way and saying more.** Dennis's note: the card was still in the way, and
the ring's red arc could do more. The readout now docks at the board's left edge (and moves right
only while the inspected square would sit under it; a strip along the bottom on phones). The
ring is a gauge read clockwise from the top: the arc is the expected score the best move onto the
square gives up, on a faint track with quarter notches, coloured by verdict (cyan and a full
circle when the best move of all lands there, ivory within 5 %, amber to 15 %, crimson beyond),
with a bright bead at its end. Beads on the ring point at every piece bearing on the square:
solid ivory for White, hollow steel for Black, threaded to their pieces in the same colours. A
rim outside carries the square's state: crimson and breathing when a piece there hangs, amber
when it is outnumbered or attacked by something cheaper. The readout lists the pieces by side
and names the state (Hanging, Outnumbered, Defended, White controls, Contested and so on).

**Play in cards.** Dennis's note: the panel was awkward, with COACH sitting there without
hierarchy. Every block is now a card with a head (icon, title, and the value it is about on the
right): the turn card with Hint and Undo and the move number; the Coach; the computer's strength
with the level's name. New game and Resign sit apart at the foot. The new-game form uses the same
cards. Group titles elsewhere end in a hairline.

**The match strip.** Dennis's note: "You vs Stockfish · move 2" read as an afterthought. The app
bar's centre is now a pill: the players with the side to move ringed (and the computer's level),
the move number with what is happening (your move, Stockfish thinking, check, the result), and
the last move. Analyze shows the position's name, move, side to move and search depth; Crucible
the two engines, games played and the verdict. It narrows with the bar and appears in both
worlds.

**Also.** The copy for Dennis's folder now puts the title, meta, ✒ header, font links and styles in
the `<head>` (they sat inside `<body>` before; browsers tolerated it), with `lang="en"`.

**Fixed along the way.**

- Insufficient material: king and bishop against king and bishop was drawn whatever squares the
  bishops stood on. It is now drawn only with both bishops on squares of one colour, as FIDE's
  dead-position rule has it; with opposite colours a mate can still be composed, so play goes on.
- The Crucible's adjudication note named dead positions among the endings it detects; it detects
  insufficient material, and now says so.
- After a finished game the move field read "Waiting for the reply"; it now says the game is over.

**Checked.**

- Every script block passes a syntax check; the unit checks pass (the recorded field, Sharpness,
  the GSPRT trace, Elo and interval, pentanomial, the anomaly flags, contrast, score formatting,
  perft from the start to depth 3 and Kiwipete to depth 2), and the bishops rule was run on four
  positions (opposite colours play on; same colours, light or dark, are drawn).
- Headless Chromium (SwiftShader), the Coach: the Italian Game named C50 on the turn card with
  Book grades; a scholar's mate reviewed (Marble 93 %, Obsidian 20 %, turning point 3… Nf6, its
  button showing that move); a stalemate trap, the fifty-move countdown (8 moves left at a clock
  of 85), a repetition while winning, and Stockfish's 2… Qh4 called a blunder to punish; a
  10-point drop scores 64.58, as lichess's formula gives; hints in three steps; undo and review.
- The Grimoire: all 137 entries open with at least one viewpoint and working See also links;
  search, the / key, :define from the palette, a term card in Analyze and Open in Grimoire (the
  world kept); no overflow at phone width.
- Regression: Play, the dock and footer, the layout from 1920 to 390 px, the Crucible's strip and
  the phone X-Ray, with no page errors.
- The standalone copy from file:// renders in standards mode with its title in the head, shows
  v2.3.0, loads Stockfish 19 and coaches the first moves.

## 2.2.1 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5]

Two of Dennis's notes on MONOLITH, from his screenshot of Analyze.

**Steel edges that hold.** Dennis saw the monoliths' edges as paper-thin lines that broke into
jagged dashes. Each edge was its own box, 18 mm across (12 mm on the plinth). At the monoliths'
distance that is under a pixel, so the rasteriser kept and dropped it pixel by pixel, and the
line broke up and crawled as the camera moved. The edge boxes are gone (13 meshes). The plinth
and the three monoliths are now unit boxes scaled to size, and their own shader draws the steel.
Each fragment measures its distance to the framed face's border in pixels, from its screen-space
derivative. The band is 12 mm on each face that meets at the edge, never narrower than 1.6 px,
smoothed across a pixel and a half and faintly haloed. Up close it is as wide as the steel; far
off it holds two pixels. Seen at an angle, both faces light, so a corner reads as a bevel. A
monolith's front face is framed on all four sides (its foot is under the floor), and so is the
plinth's top. Each monolith now stands 15 cm into the floor. Two of them floated 5 cm above it, a gap the
mirror floor could show.

**A flip that turns the board, not the world.** Flipping the board swung the camera 180° around
it in three quarters of a second. In the cathedral, the near columns swept through the
foreground; in MONOLITH, the monoliths whipped across the edges of the frame. Either way they
popped in and out of view. Now both worlds' scenery and their lights (the key light, the rose
window, the rim lights) hang from one world rig. A flip turns the rig with the camera, the same
way and on the same easing, so the backdrop holds still on screen while the board turns beneath
it. The reflections turn too: the PBR materials read their environment through the rig's yaw, a
small patch to three's envmap chunk. The haze pass reads the key light's world position and turns
the window beams. Things that belong to the board never turn: the plinths (counter-turned), the
mirror floor's rule grid (drawn in world space) and the board itself. Black now sits before the
same view White does: the apse and rose window in the cathedral, the monoliths in MONOLITH. Each
is lit the same way from either side. A view orbited by hand comes back square during the flip.
The rig turns by the camera's turn plus that orbit, so only the orbit is undone against the
scenery. The farther the orbit, the longer the turn (up to about two seconds), so nothing whips
past. A newer flip takes over from one still running. Orbiting by hand still moves only the
camera.

Checked in headless Chromium (SwiftShader, so real-GPU appearance and timing are not
measured here):

- the edges, at 4× zoom against 2.2.0, at a wide pose that shows all three monoliths;
- the flip at six poses in each world, before and after;
- a timed flip, sampled every frame, with the camera and the rig together on every frame;
- that every flip ends square, from a square view, a lightly orbited view and the far side;
- that turning only the environment yaw changes the reflections (the uniform reaches the
  shaders);
- no page errors.

## 2.2.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5]

A round of Dennis's notes from his desktop copy, each fixed where it started.

**A steady dock.** In Analyze the dock under the board grew in steps as lines and notes arrived,
and each step shortened the board, which read as a stutter. The dock now keeps a fixed height
while shown (by default clamp(170 px, 32 vh, 300 px)); what does not fit scrolls inside it under a
sticky Synaptic PV header. The board always keeps at least 240 px.

**Drag handles.** On Dennis's request the containers get drag handles: the dock's top edge, the
side panel's left edge and the move list's top edge. In Crucible the dock handle sizes the
heartbeat itself, so a taller dock is a more granular heartbeat. Sizes are saved per destination
(prefs.ui), arrow keys step 16 px (48 with Shift), and Home or a double-click returns to the
default. Each handle shows a small grip and brightens on hover, focus and drag; they are proper
separators for assistive technology, and on phones, where the containers stack, they are not
shown. While a handle moves, the 3D view stretches and re-renders at its new size once the drag
pauses (120 ms) or ends, since a resize reallocates the HDR, haze and mirror targets; ordinary
resizes are coalesced to one per frame.

**No more chip glitching.** Dennis still saw the Synaptic chips glitch. A search refreshes the
lines several times a second, and each refresh rebuilt the chip grid under the cursor, moving the
chip being read, re-firing its hover and swapping the phantoms. While the pointer or keyboard
focus is in the grid, the chips are now held (the header says "held while you read · updates
when you leave"), previews read the same snapshot the chips show, and a new position is never
held. Phantoms are keyed by the projected position, so the same position is never rebuilt.
Evaluation labels on the chips keep a fixed width, so a changing number cannot shift its row.

**Previews that say what changes.** Dennis found the whole second set of phantoms at 90 % over the
real set at 30 % hard to read, and asked for smoother movement between chips. A scrubbed line is
now shown as a difference from the board: a piece that ends where it stands stays solid with no
phantom; a piece that leaves its square fades to a faint ghost there (18 %); a captured piece
fades to a crimson-lit ghost (55 %) over a crimson ring; and only the pieces that land somewhere
new appear, as holograms rimmed in cyan. Holograms glide out from the squares their pieces leave,
and between chips they slide to their new squares, matched by colour and type, closest pair
first across the board; ghosts cross-fade, all on one exponential ease. The ghosts are
per-piece transparent copies of the piece materials with the same shading hooks, so the real
materials are never touched, and the one-time shader compile still happens in a warm-up frame on
the way into Analyze. The vectors step aside while a line is previewed, since they describe the
root position's first moves. The phantom chip's legend says what each look means. This revises
MONOLITH ruling 7 (phantoms at 90 % over current pieces at 30 %) at Dennis's direction.

**The version chip by Ctrl K.** Dennis found the label beside the title odd; it is now a rounded
chip in the app bar beside the palette button, in both worlds, and on phones a line under the
title.

**A footer that fits.** The MONOLITH telemetry footer ran off the right edge. It now steps to the
loosest fit that holds: full, compact (every source badge stays but shows only its source, such as
"[SF]", with the full text on hover), tight (no sparklines or meters, closer padding), then tight
with the least telling readouts set aside one by one (GPU name, heap, sensors, host, TB hits). It
loosens only with 24 px to spare, so a number at the boundary cannot make it flicker, and if even
the tightest fit is too wide it scrolls under the wheel with a fade marking the clipped edge.

**The move list as a docked sheet.** Dennis noted the move list looked out of place under the
panel's scrollbar. The panel and the list now use slim scrollbars with a stable gutter, and the
list sits under a soft lift with its drag grip at the top edge, so it reads as a sheet docked to
the panel. Section sub-headings keep a readable width and wrap to their own line before shrinking
to a sliver beside a badge (the search profile's had broken into a column of single words), and
the engine card keeps "Hash 64 MB" on one line.

Checked: unit checks pass; headless Chromium covered the dock through a search (the board's
height held as lines arrived; its one change is the MONOLITH footer appearing with the world
switch), the hold (a marked chip survived five engine updates while hovered and was replaced
after leaving), all four handles by mouse and the dock's also by keyboard and double-click reset
(the 3D view re-rendered at its new size), the difference view (ghost kinds, a capture, and holograms gliding between chips
with closest-pair matching), the footer at 2000, 1600, 1280 and 1000 px (compact at 2000; at 1000
it scrolls), and phone widths with no overflow and the handles hidden.

## 2.1.1 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5]

On Dennis's request ("add the current version number somewhere in the interface … so I can always
know if I am behind or not when we iterate"), the page shows which release it is. A quiet label
beside the title reads `v2.1.1` in both worlds; on phones it drops under the title as a line of
its own, so the app bar loses no width. It is a label, not a control, and its tooltip says that
a lower number than the published page shows means the copy is behind. Settings → About opens
with "Wizard's Chess 2.1.1, released 10/22/2026.", and the palette gains `:version` under a new
About group.

The figures come from `APP_VERSION` and `APP_DATE` in the script, which repeat the ✒ header's
Version and Date; the header now says so under Other Important Information, so a release bumps
both. The 1.3.2 entry rolls out of the page header into this file's history, which already
carries it.

The check that prompted the request was real: the copy in Dennis's project folder was still
2.0.0 (the artifact download of 10/15, untouched; a line-by-line comparison found only this
release line's own changes). It is replaced by this release, wrapped in the same standalone page
shell as the download, with the matching CHANGELOG.md, MONOLITH_HYBRID.md and engine/README.md.

Making room for the label exposed two app bar edges, fixed with it. The brand block was allowed to
shrink below its content, which clipped the subtitle once the label joined it ("Stockfish 19" lost
its number), so it now keeps the width its content needs, and on phones only the title may
ellipsize. MONOLITH's wide Michroma title is set a size smaller on phones so it fits at 360 px.

Checked: unit checks pass; headless Chromium shows the label at 1280, 899, 390 and 360 px wide in
both worlds with no horizontal overflow and no clipped title, the About line and `:version` read
the same release, and the header's Version and Date equal `APP_VERSION` and `APP_DATE`.

## 2.1.0 (10/15/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis's first play-testing round on the 2.0 hybrid, run from his desktop copy. Every item below
is one of his reports or requests, fixed where it started rather than where it showed.

**Stockfish 19 from disk, and labels that tell the truth.** Dennis's screenshots showed the
Analyze card reading "Stockfish 10 · asm.js build" under a header that said Stockfish 19. Opened
straight from a file, Edge will not start a Worker from a file URL, so the page had fallen back to
Stockfish 10, which has no UCI_Elo, no WDL ("WDL not reported") and a hash fixed at 16 MB. So
Expert and Master had been playing at full strength there. The engine list gains a middle tier:
the same Stockfish 19.0.1 lite files from unpkg, byte for byte (the SHA-256 hashes match
engine/README.md), in a blob Worker that reads its .wasm address from the Worker URL's hash.
jsDelivr refuses the package, which is over its 150 MB limit. Everything that names the engine now
follows the one that loaded: the MONOLITH subtitle, the About line, the Analyze card (with the
hash the engine will really take), the Crucible engine choices and badges. Options the engine
lacks are disabled with the reason (UCI_Elo in Crucible), and on an engine without UCI_Elo,
Expert and Master use the page's own move chooser, tightened past Strong, and say so. Opened from
disk, data/*.json cannot be read either; the error now says why and what to do.

**Vectors that read as jumps.** The arcs started on the board inside the moving piece, so each one
spilled out of the piece's waist ("all of the pieces are taking a tinkle") and showed black specks
along its length. The specks were NaN pixels: GLSL leaves pow(x, y) undefined for x < 0, ANGLE's
Direct3D back end returns NaN, and 1 − |n·v| dips a hair below zero where a tube faces the camera.
Bases are clamped and squares written as x * x, in the tubes and the phantoms alike. Each vector
is now the jump the piece would make: a cubic that leaves just above the mover's crown and drops
steeply onto the target, or onto the crown of the piece it takes (a played move in Crucible lands
on the piece now standing there). It is tapered and faded at launch; the arrowhead's point
touches the landing point; a launch ring marks the origin square.

**No flicker between Synaptic chips.** Crossing the 4 px gap between two chips ended the preview
for a frame, so every piece flashed back to solid and the phantoms vanished; and each start of a
preview flipped the piece materials' `transparent` flag, which in three.js selects a different
shader program (a compile the first time). Leaving a chip now only schedules the end (140 ms);
the pieces fade by opacity alone, flipping `transparent` once per preview session; and one
invisible warm-up frame compiles those programs on the way into Analyze. The phantoms'
scanlines fade out where they would be finer than a pixel, so distant phantoms no longer shimmer.
A newer report of a move in one MultiPV slot also drops a stale copy in another slot (Dennis's
screenshot showed e3 as both line 2 and line 3).

**X-Ray.** The ring floated at mid-piece height, 0.66 wide: under perspective it slid off its
square the farther the square sat from the view's centre, and it covered the neighbours. It now
lies on the board around the piece's base, inside the square (radius 0.43), with the threads
ending at it. Its chip is see-through and sits beside the square's on-screen footprint, on
whichever side has room, never over it.

**Heartbeat with a slot for every move.** On Dennis's suggestion the Crucible heartbeat gains a
move rail: one slot per ply, White's moves in the upper lane and Black's in the lower, book moves
plain, engine moves shaded by how far the evaluation moved at that ply (quiet, notable from
0.30, sharp from 1.00, severe from 3.00), the anomaly's cause slot crimson with its neighbours
outlined. Each scored ply is a node on the trace. Hovering a slot reads its move, mover, eval
and swing; click, drag and the arrow keys still go there, and the canvas is a proper slider for
assistive technology.

**Play on any board.** Dennis's ruling: every board in every mode can be played on, behind a
toggle. Settings gains Move pieces on any board (on by default). A board the game rules leave
read-only (a Crucible game, an earlier move under review, a finished game) takes moves into a
scratch line, with the moves, Undo and Back on a chip. The line never touches the game or the
recorded run; stepping the record, the review or the tab drops it. Analyze and the evaluation bar
follow the explored position. With the toggle off, such a board offers Move pieces in its message.
The palette gains :explore and :explore back.

**Polish.** The LLR oscilloscope draws a monotone cubic through the per-pair LLR (no overshoot)
over a fill toward zero, with tinted regions past the bounds; its axes glide to new extents and a
new pair draws itself in, instead of the stepped trace that jumped. The pair strip is diverging.
The confidence bar, pentanomial bars and anomaly rows are refined, and the search profile gets a
gradient hashfull and depth nodes. White pieces get form shading (diffuse falling off toward the
silhouette, and a contact shade near the board), stronger in MONOLITH. The command palette is
re-styled: grouped commands, the reason a command can't run as its own tag, shortcut keys, a cyan
focus rule instead of the white box. The mouse wheel scrolls the Hive and other stage overlays
and zooms only over the board.

Checked: unit checks (perft, Monolith maths) pass; headless Chromium runs at Low and High covered
the vectors, the hover sweep (the ghost never dropped across five chips and the materials
rebuilt once), X-Ray placement, the heartbeat hover and click, exploration in Crucible and in
review (the game and the record unchanged, Analyze following, Back restoring), the file:// load
(Stockfish 19 from unpkg) and a forced Stockfish 10 fallback (labels, hash cap, approximated
levels, disabled UCI_Elo). SwiftShader does not reproduce ANGLE's NaN, so the speck fix rests
on the shader change itself until it is seen on Dennis's GPU.

## 2.0.0 (10/15/2026) [dendogg + Anthropic - Claude Opus 5.5]

On Dennis's request ("take the MONOLITH concept and bake it into our 3d chess game and turn it
into a hybrid app"), the page becomes two worlds on one board. The Gothic cathedral keeps the
game. MONOLITH, built from Dennis's three v1.1 plates and their recorded Stockfish 19 data,
becomes the instrument: Analyze is rebuilt around it and a new Crucible destination runs real
engine matches. The plates were reference only, so the layers are re-made in 3D with ray-traced
and post-processed light rather than copied as flat graphics. MONOLITH_HYBRID.md records what
came across, how, and what the browser stack cannot carry.

**Renderer.** three.js moves from r128 to r147, the last release that still ships the classic
`examples/js` scripts the page can load without a build step. With effects on, the scene renders
into a half-float, multisampled HDR target; r147 tone-maps materials inside render targets, so the
base look matches the direct path, and unlit markers can exceed 1.0 to drive bloom. Then:

- a ray-marched volumetric light pass at half (High) or quarter (Balanced) resolution. A depth
  pre-pass gives each ray its end; each step samples the key spot light's cone, its attenuation,
  a Henyey–Greenstein phase and the light's own shadow map, so pieces and columns cut real shafts
  out of the haze. Three slanted window beams join it in the cathedral; value noise gives the dust;
- Unreal bloom;
- an output pass that converts to sRGB, with a soft vignette and dither against banding.

Quality tiers High, Balanced and Low; Auto picks High (Balanced on phones) and steps down after
two three-second windows averaging over 1/28 s a frame, and says so in Settings. Low draws straight
to the screen with the old planar shafts. Two side effects were fixed at the root: r147 gives
multisampled targets a 16-bit depth buffer, under which the plinth top (0.01 below the squares)
z-fought through them as stripes, so the plinth top now sits at the squares' underside and the
camera's near plane moved from 0.1 to 1 (nothing comes closer); and fog, which blends in linear
light under post-processing, runs 18 % denser there so both paths look alike.

**Worlds.** A transition blends materials, lights, haze, bloom and backdrop, swaps the sets under a
dip to the canvas colour, and eases the camera to the world's pose. The MONOLITH world has the
solved tokens on the board, ivory pieces and obsidian ones edged by a view-dependent steel rim, a
Reflector mirror floor with a faint rule grid, a steel-edged plinth, three obsidian monoliths
and cool rim lights. Marker colours follow the world, keeping MONOLITH's colour semantic only
(cyan optimal, amber volatile, crimson anomaly or refutation). The interface remaps the Material
tokens to the solved stops, with Michroma for structure, Geist for the interface and Geist Mono for
telemetry. Settings: World (Auto follows the destination, or Cathedral, or Monolith) and Graphics.

**Engines.** The single engine object became a factory of UCI clients with full info parsing
(depth, seldepth, multipv, score and bounds, WDL, nodes, NPS, hashfull, tbhits, time, PV), limits
by depth, time, nodes or infinite, searchmoves, and options set only when they change and only if
the engine offers them. Play and coaching keep their own engine; Analyze runs two more; a live
Crucible run makes two per game slot, so A and B never share a hash table.

**Analyze.** Engine card with Go infinite and Stop, and "stopped at … (limit)"; stats; MultiPV
table with WDL bars (White's view) graded Best cyan, Good ink, Inaccurate amber, Mistake crimson;
Sharpness (MultiPV Dropoff) with the halo at 10 %; search profile; UCI options. A second engine
scores every legal move for the root move-value field, a glow ray-marched in a thin slab under the
board (22 % ceiling in the plate's sRGB terms) with a cyan point light on the best square, then
walks line 1 for the fork and any instability. Ballistic tube vectors with travelling pulses,
numbered markers and a cyan reticle; a transmissive glass X-Ray ring with attacker and defender
threads and a crimson arc for the expected score lost by the best move onto the square; the WDL
ribbon with its amber zigzag halo; the Synaptic PV dock, where hovering or pinning any move shows
the projected position as hologram phantoms at 90 % over the real pieces at 30 %. The reference
loads Kasparov – Topalov 1999 with its recorded run. Calculate moves and the evaluation bar moved
to a Coach group in Play, with their original colours in the cathedral.

**Crucible.** The recorded gauntlet is replayed and re-checked in the browser: all 45 LLR points
(max difference 0.00005), Elo +185.7 [129.5, 252.6], pentanomial 0, 3, 10, 17, 15, and the anomaly
rule against every recorded flag (90 of 90 agree). The deck shows the LLR oscilloscope and the
Hive; any tile or anomaly opens that game on the 3D board with a crimson vector on the move that
caused the jump and a heartbeat strip to scrub. Live runs play Stockfish 19 by nodes or UCI_Elo,
or Wizard's levels, under an SPRT or a fixed number of pairs, with the documented adjudication,
up to four games at once, and copy a results JSON with a _meta block.

**Also.** Command Palette (glass, Ctrl K or ⌘K, fuzzy, every command live or saying why not); the
telemetry footer with a source badge on every readout, including recorded host samples where a run
carries them; the System sheet in Settings with the swatches and the 22-pair contrast ledger
measured live; the rail gains Crucible; phone layouts for every view.

**Checked.** In node against the recorded runs: the expected-score logistic reproduces every field
exp_white (k = 271.5856, error under 1e-12), Sharpness, the 48-move replay to the recorded FEN,
the field (1 of 45 within 5 %), X-Ray on d4 (1 attacker, 0 defenders, 34.0 %), fork and
instability plies, the GSPRT trace, bounds, Elo and interval, pentanomial counts, all nine
anomalies with game 78 at ply 95, four contrast ratios, score formatting, and perft. In headless
Chromium: the recorded Analyze and Crucible screens read the plates' numbers; a live 10-second
search, field and fork walk complete; Go infinite and Stop; a live fixed run plays and releases
its workers; a CPU game, typed moves, Hint, Calculate moves, undo, review, FEN by palette, and the
world and quality switches; phone width with no horizontal overflow; High-tier renders of both
worlds; no page errors.

## 1.3.2 (10/14/2026) [dendogg + Anthropic - Claude Opus 5.5]

On Dennis's request, the candidate lines in Analyze are coloured by strength. Each line is
graded by how much it gives up against the engine's top line, in centipawns from the mover's
side, so equally strong moves share a grade rather than being told apart by rank alone:

| Grade | Loss against the top line | Colour |
| --- | --- | --- |
| Best | 0.1 pawn or less | green |
| Good | up to 0.6 pawn | lime |
| Inaccurate | up to 1.5 pawns | orange |
| Mistake | more than 1.5 pawns | red |

Mate scores count as decisive, so passing up a forced mate grades as a mistake. Each row shows
its grade as a coloured label, with the exact gap on hover, and the board arrows take the same
colour, drawn worst first so the best arrow lies on top. The colours steer clear of the hint's
gold. Arrows now skip the renderer's filmic tone mapping, which had washed them toward pastel,
so the board matches the list. Checked: the grading bands with unit cases (equal lines,
a clear best, each band, mate), and in headless Chromium on a position with a hanging queen,
where Nxh4 graded Best and the alternatives graded Mistake, with no page errors.

## 1.3.1 (10/14/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis spotted the king in the "Your move" avatar sitting small and off-centre in its circle.
The avatars used the ♔ and ♚ text glyphs, and where those land depends on whichever font the
system substitutes for chess symbols, since the page's own fonts don't include them. Every
avatar (the turn banner, both player cards and the side choice in New game) now shows a drawn
king icon. It is symmetric about the centre of its 24-unit grid and spans it evenly top to
bottom, so it is centred by geometry in any browser, and it scales with the circle. Measured in
headless Chromium, the icon sits within 0.01 px of each circle's centre.

## 1.3.0 (10/14/2026) [dendogg + Anthropic - Claude Opus 5.5]

Dennis pointed out that a won game ended with no ceremony at all. This release builds out the
animation layer on the existing tween, shatter and lighting systems.

- **Game start.** Pieces drop onto their squares with a small bounce, centre ranks first. Moves
  are held until they land, so the computer can't move mid-drop.
- **Check.** The checked king shudders and a red shockwave ring leaves its square.
- **Promotion.** A gold ring flash and a short rise of motes as the new piece grows in.
- **Checkmate and resignation.** The losing king shudders, then topples away from the attacker,
  pivoting on its base rim, and lands with a thud, a small camera shake and a dust ring. The
  winning king rises, spins once and glows gold, with gold motes spiralling up and a warm light
  over it. Its army hops in a wave outward from it, a four-note fanfare plays, and the camera
  swings toward the point between the two kings and back.
- **Draw.** Both kings bow, silver motes rise from each, and two soft notes play.
- **Result card.** It rises in. Against the computer the headline reads Victory or Defeat, with a
  shimmer on a win; friend games name the winning side, and draws read Draw. The snackbar that
  repeated the result is gone, since the card carries Rematch. The WON badge on the player card
  pops in.
- **Rest pose.** Stepping back through the moves and returning to the final position shows the
  losing king lying down again without replaying the ceremony.
- **Control.** Every step runs on the shared tween clock, so the Animation setting scales it.
  Minimal and reduced-motion keep the topple and the card but drop the camera swing and most
  particles. A new game, undo or review cancels a running ceremony cleanly.
- **Fixes found while testing:**
  - The Back to live chip and other controls over the board ignored mouse clicks. The stage
    captured the pointer on every press, so their clicks never arrived. The stage now takes only
    presses that land on the board itself.
  - Click-through failed on the edge files, because rays aimed at a lifted pawn's upper half run
    off the side of the board. The click now goes to whichever of the piece's own square and its
    legal targets is nearest the cursor on screen, within one square's width.
  - Clicks made right after the pieces were rebuilt (undo, review, new game) could miss them until
    the next frame rendered. The click test now refreshes the pieces' positions itself.
- **Tooling.** Added `tools/calibrate.js`, a command-line calibrator Dennis can run for large
  batches. It plays the page's levels against Stockfish's UCI_Elo anchors, or against each other,
  and writes CSV and optional PGN.
- **Checked by:** a headless Chromium run of the drop-in, Fool's mate (the king toppled, then
  crown, motes and glow), the rest pose after review, undo standing the king back up, check,
  promotion, resignation, a threefold draw, the camera swing out and back, click-through on h2,
  and the Back to live chip, with no page errors.

## 1.2.2 (10/14/2026) [dendogg + Anthropic - Claude Opus 5.5]

On Dennis's request, the computer's strength can be set at any point in a game, not only in
the New game form. A Computer strength slider in the Play panel shows the level's name and
description. A change takes effect from Stockfish's next move, and the player card, the game
summary and the next New game form all follow it. The page also hides `[hidden]` elements with
its own rule rather than relying on the host's reset. Checked in headless Chromium: Club changed
to Beginner mid-game, the next reply played at the new level, the slider hides in friend games,
no page errors.

## 1.2.1 (10/14/2026) [dendogg + Anthropic - Claude Opus 5.5]

Corrections from Dennis's play-testing against the computer.

- **Levels.** Dennis found the computer unbeatable at Club. Measured, Stockfish 19's Skill Level
  setting barely weakens it at short searches: from Skill 2 up it took a hanging queen 20 times
  out of 20. Levels 1 to 5 now choose the move in the page. Stockfish reports its top lines, the
  page prefers better lines with a falloff set per level, and at a per-level rate it plays a
  random legal move instead. Levels 6 and 7 use Stockfish's calibrated `UCI_Elo` limiter (2000
  and 2500), and level 8 is unrestricted. Re-measured on the same position: Novice took the
  queen 10 times out of 16, Beginner 14, Casual 13, and Club and above every time.
- **Move history and repetition.** Dennis's game showed the computer's king shuffling Kc2-Kb1.
  The engine had been sent only the current position, so it could not see repetitions, and the
  game had no threefold rule. The engine now receives the start position plus every move, and a
  third occurrence of a position (same placement, side to move, castling rights and live en
  passant) ends the game as a draw.
- **Hint.** On Dennis's direction: the square outline now marks the square the hint arrow
  points to, replacing the blue ring there. The click-through outline is gone, so the hint
  outline is the only square outline on the board. The sentence restating the hint is removed,
  and the button now toggles: Hint, Thinking…, Hide hint.
- **Tips.** Dennis asked for coaching text to show once or be switchable. Settings has a Tips
  control: Until used (the default) hides each tip once the player has done what it describes,
  Always keeps them, and Off hides them. Status text such as check, thinking and review always
  shows. The tips are the start chip, the panel introductions, "Select a piece…", the castling
  note and chip, the orbit hint, and the Calculate moves explanation. Show tips again resets
  them.
- **Checked by:** a headless Chromium run of the level measurement above, a threefold draw from
  Nf3 Nf6 Ng1 Ng8 played twice, the hint outline landing on the arrow's target square, Hide
  hint, tips hiding after the first move and returning under Always, with no page errors.

## 1.2.0 (10/14/2026) [dendogg + Anthropic - Claude Fable 5.1; Anthropic - Claude Opus 5.5]

Interface rebuilt to Dennis's brief for a more sophisticated layout that is easy to
extend, together with a run of corrections from his play-testing.

- **Layout.** A navigation rail with Play, Analyze, Position and Settings (a bottom
  bar on phones), the stage with a player card at each end of the board, and a move
  list that stays present under every tab. Each panel registers an `onRender()`
  callback against one shared context, so a new feature is one `NAV` entry, one
  `<section class="pane">` and one callback.
- **Choosing a side.** Dennis found "Play marble / Play obsidian" unclear and
  disjointed. It is now a New game setup: opponent (Computer, or Friend on the same
  screen), your pieces (Marble moves first, Obsidian, or Random), and eight named
  difficulty levels with a one-line description each. The player cards show who
  plays which side for the whole game.
- **Orientation.** On Dennis's observation that no board app rotates every move,
  Follow turn is removed. Your side is at the bottom from the start of the game and
  only moves on Flip board or a manual orbit.
- **Random side.** On Dennis's request: a die tumbles in the Random card when you
  press Start game; odd gives marble, even gives obsidian.
- **Engine.** Dennis corrected the version: Stockfish 19 is current (released
  09/05/2026), not 10. The page now runs the Stockfish 19 lite single-threaded
  WebAssembly build, vendored under `engine/` (see `engine/README.md`), and falls
  back to the Stockfish 10 asm.js build from cdnjs if WebAssembly cannot run.
- **Calculate moves.** Dennis's feature: a MultiPV search for one to five candidate
  moves, listed with scores and lines and drawn as ranked blue arrows. Selecting a
  line isolates its arrow, and Play makes that move on your turn.
- **Hint.** To Dennis's spec: an amber arrow from the suggested piece to its
  square, with a soft pulse.
- **Castling.** Dennis reported it as missing. The rules engine already generated
  castling (perft-verified), but the interface hid it. When the king is selected
  there are now blue lanes from king to rook, rings on the target square and on the
  rook, and a chip naming the squares. Clicking the rook castles, as does typing
  O-O or O-O-O. King and rook move together, with the rook hopping over the king.
- **Click-through.** Dennis found that at low camera angles a lifted piece blocks
  the square in front of it. With a piece selected, a click now goes to the nearest
  legal destination along the line of sight, passing through the lifted piece and
  through opponent pieces, while your other pieces still catch the click so you can
  switch selection. The square under the cursor comes from a ray-plane intersection,
  not the square boxes, so a shallow angle can't report the square behind. A hover
  outline shows where a click will land, and the cursor turns into a pointer only
  where a click does something.
- **Contrast.** Following Dennis's note on contrast, legal-move dots are larger and
  brighter with a dark halo, capture rings are thicker, and the board takes only a
  trace of the environment reflection that had been washing the squares toward grey.
  Selecting a piece lifts it with a small overshoot, sends a pulse ring across its
  square, and grows the move markers outward from the piece.
- **Other additions.** Resign, Rematch, review controls (first, previous, next,
  live, and ← → keys), typed moves in SAN and castling notation, four practice
  positions, and settings for sound, legal-move markers, coordinates and animation
  speed, saved per browser.
- **Checked by:** perft node counts unchanged; Stockfish 19 MultiPV and Skill Level
  confirmed against its UCI option list; a headless Chromium run of setup, the
  computer opening as marble, a hint, castling by clicking the rook (1.O-O with a
  correct FEN), click-through on a lifted pawn (1.e3), three calculated lines,
  analysis, and the phone layout with no horizontal overflow and no page errors.

## 1.1.1 (10/14/2026) [dendogg + Anthropic - Claude Fable 5.1]

Camera orbit moved to the middle mouse button on Dennis's direction. Left click only
selects now, so picking a square no longer starts a stray orbit. The browser's
middle-click autoscroll is suppressed over the board. On touch, one finger orbits,
a tap selects and a pinch zooms.

## 1.1.0 (10/14/2026) [dendogg + Anthropic - Claude Fable 5.1]

FEN support on Dennis's direction. A validating parser checks for eight ranks, one
king per side, no pawns on the end ranks, and the side not on move not being in
check. Castling or en passant fields that don't fit the board are dropped rather
than rejected. A Position field mirrors the board, with Copy and Load. Tested
against a dozen valid and invalid strings.

## 1.0.0 (10/14/2026) [dendogg + Anthropic - Claude Fable 5.1]

First playable build to Dennis's brief: a full 32-piece game on a 64-square board, a
Gothic cathedral set, marble and obsidian pieces with idle, move, attack and shatter
animations, and a single-level Material UI. Stockfish was added mid-build at
Dennis's request, as the Stockfish 10 asm.js build from cdnjs, for play against the
computer, analysis, hints and review. The rules engine was verified by perft (start
position to depth 4, Kiwipete to depth 3, and the en passant and promotion test
position to depth 4, all matching the reference counts).

## Entries moved from file headers

A shipped file's ✒ header keeps its latest three changelog entries; older ones move here, word for
word, under the file they came from.

### `js/app/base.js`

- 1.5.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.15.0.
- 1.5.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.14.0.
- 1.5.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.13.0,
  under the name Dennis chose, MONOLITH, which the version chip and About now show. The preferences
  move to monolith-prefs-v2: a copy saved under wizards-chess-prefs-v2 is written there on first
  load, then removed, so nothing is lost.
- 1.4.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.12.0. From
  the release audit Dennis asked for: every saved preference is repaired on load (a damaged level or
  side used to stop the page in its first render), and panelScroller() names the panel's scroller.
- 1.3.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.11.0.
- 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.10.0, and
  the graphics preference takes Dennis's five levels: a saved Balanced becomes Medium and a saved
  Low becomes Minimal, which draw exactly as those did.
- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.9.0, and
  the preferences keep the MONOLITH pillar style (prefs.pillars) Dennis's Blender models came with.
- 1.0.3 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.8.0.
- 1.0.2 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.7.0.
- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The release on screen is 2.6.0.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/palette.js`

- 1.3.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — :quality ultra, high, medium, low
  and minimal, for Dennis's five graphics levels, with auto; :quality balanced is now medium.
- 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — :pillars monoliths, classic and
  modern choose MONOLITH's pillars from Dennis's Blender models.
- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — :fen opens the Position tab's Set up
  view, and :fen with a FEN plays it from there, for the redesigned tab Dennis asked for.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/panels.js`

- 1.4.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Settings → Graphics draws Dennis's
  graphics meter (js/ui/gfx-meter.js) in place of the bar ladder, its needle on the level in use.
- 1.3.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Settings → Graphics for Dennis's
  tiered levels: the Automatic switch, the five-level ladder, what the level in use draws, and the
  Fine-tune rows, each showing the value in use or why it cannot change.
- 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Settings shows the MONOLITH pillar
  style, with what each one is and whether Dennis's models have loaded.
- 1.1.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Before a game the match strip shows
  the game Start game will begin (players from the Play tab's choices, "Game: Not started"),
  replacing "Play, New game / Next, Choose and start", which Dennis found out of place; only a number
  takes the larger size.
- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The FEN box's sync with the board
  moved to js/ui/position.js, which now keeps the box and its board editor together; the study state
  comes from js/ui/studies.js.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/splitters.js`

- 1.2.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The level buttons it wires are now
  the cells of Dennis's graphics meter.
- 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Wires Settings → Graphics for
  Dennis's tiered levels: the Automatic switch, the level ladder and the Fine-tune rows.
- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Wires Settings' MONOLITH pillars
  choice, beside the world and graphics choices, for Dennis's Blender models.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/scene/worlds.js`

- 1.1.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Reads the graphics level from
  js/scene/quality.js, the new home of Dennis's tiered levels; the mirror floor shows wherever the
  level's reflections are on.
- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis found hot spots on MONOLITH's
  board: its key light now spreads evenly, its squares are a touch more satin, its haze is lighter
  and only what shines past white blooms; the wash on the monoliths follows the world.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/scene/sets.js`

- 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The pillar places are shared
  (monoSlots) so Dennis's Blender models can stand on them (js/scene/pillars.js), the built pillars
  kept as the fallback; the lancet mullions face the nave only, so a camera out past the aisle walls
  no longer sees them float as thin bars.
- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis found MONOLITH's board glaring
  from low angles and its pillars flat: the rim lights now sit high and narrow, the monoliths are
  built (base, body, raised face, cap) and a wash light reads them solid.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `css/position.css`

- 2.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The pieces take Dennis's house set
  and its two woods (boxwood White, ebony Black); the cathedral's diagram squares are the ones he
  drew the set on.
- 2.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Rewritten for the redesigned Position
  tab Dennis asked for: the view switch, board diagrams with their own palette per world, study
  cards and progress rings, the goal tracks, the drawn board reading, the board editor and the
  colour-coded FEN.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `css/layout.css`

- 1.4.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The loading screen animated, as
  Dennis asked: the M written square by square, the pieces set down in turn, a glint, then the lift,
  timed by class and by two marker animations (see the section). The graphics meter follows his
  version 1.2 drawing: the needle turns about the hub, which carries the Automatic mark; the ribbon
  is gone, and the chosen cell sits above its neighbours, since the cells now meet.
- 1.3.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — The loading screen Dennis asked for,
  around his emblem: on the stage colour of the world the page opens in, with the board diagrams'
  squares and woods, the name in Michroma and a sweeping bar that stands still under reduced motion.
- 1.2.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed with the project: Wizard's
  Chess is now MONOLITH, the name Dennis chose, and this header names the page by its file in the
  repository, index.html.
- 1.2.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the release audit Dennis asked
  for: rules for classes no page uses (.stage-layer, .actions-grid, .divider) and [hidden] rules the
  base rule in css/tokens.css already covers are gone.
- 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The graphics meter from Dennis's
  concept replaces the bar ladder: five back-rank cells on a half-dial, a needle and a pawn hub.
- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The graphics level ladder and the
  Fine-tune rows, for Dennis's tiered graphics levels in Settings.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `css/play.css`

- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The match strip, which Dennis found
  disjointed before a game: only a number takes the larger size, and a side the die will pick shows
  half marble, half obsidian.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/app/loop.js`

- 1.0.3 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed with the project: Wizard's
  Chess is now MONOLITH, the name Dennis chose.
- 1.0.2 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the release audit Dennis asked
  for: the preview shaders are warmed once a world change has settled, in the world they will be
  drawn in, and the check pulse works out a position's check once rather than every frame.
- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Frame times go to
  js/scene/quality.js, where Automatic now raises as well as lowers Dennis's graphics levels.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/data/grimoire.js`

- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Where each term appears on the
  Position tab, for its new Read, Set up and Studies views; the FEN entry describes the board editor
  and Play this position.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: the
  grimoire-data script block of wizards-chess.html 2.4.0 when Dennis asked for a proper separation
  of concerns.

### `js/game/flow.js`

- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The study state comes from
  js/ui/studies.js; startGame() no longer redraws the studies library itself, since the Position
  tab redraws it from render().
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/game/play.js`

- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — studyAfterMove() and studyScripted()
  come from js/ui/studies.js, where the study engine moved with the Position redesign.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/scene/post.js`

- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — For Dennis's tiered graphics levels:
  the pipeline is built from the level's settings (bloom and shadows can each be off, the light at
  three resolutions), and the frame-time watch moved to js/scene/quality.js, which this file now
  starts.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/scene/quality.js`

- 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release, for Dennis's request
  for a more realistic, logical, tiered graphics system: five levels, each adding one set of
  features to the one below; seven settings to fine-tune; and Automatic, which reads the GPU and
  moves the level with the frame rate.

### `js/scene/renderer.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/diagram.js`

- 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release, for the Position tab
  Dennis asked to be more visual than a stack of text: flat board diagrams with a piece set of their
  own.

### `js/ui/grimoire.js`

- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — A Position term's Go to button opens
  the view its where names first (Read, Set up or Studies).
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/nav.js`

- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — setQualityPref() moved to
  js/scene/quality.js with the rest of Dennis's tiered graphics levels.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/position.js`

- 2.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The tab redesigned after Dennis
  found it awkward, "a stack of text blocks": three views (Studies, Read, Set up) behind one switch
  that follows what you do; studies as diagram cards with progress rings and an Up next pick; the
  board read as bars, piece rows and a structure map; a click-to-place board editor tied both ways
  to a colour-coded FEN. The study engine moved to js/ui/studies.js; the FEN wiring came here from
  js/ui/controls.js and js/ui/panels.js.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/telemetry.js`

- 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — With Dennis's tiered graphics levels:
  RENDER names the level (with Auto when Automatic chose it), and GPU shows the cleaned-up name the
  levels detect from ("Intel Iris Xe Graphics", not "Intel").
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/main.js`

- 1.0.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed with the project: Wizard's
  Chess is now MONOLITH, the name Dennis chose, and this header names the page by its file in the
  repository, index.html.
- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — Boot step 22 is the redesigned
  Position tab: its views, board editor and renderer.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release, written for the
  separation of concerns Dennis asked for: the page's one boot sequence, as a list of module inits.

### `js/ui/gfx-meter.js`

- 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release, built from Dennis's
  concept drawing for Settings → Graphics
  (graphics-meter-design-concept-rough-draft-needs-tuning.svg): a half-dial of five cells carrying
  the back rank, rook to king, and a needle from a pawn hub.

### `js/scene/pillars.js`

- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the release audit Dennis asked
  for: a model that failed to load is fetched again the next time its style is chosen.
- 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release: Dennis's Blender
  pillars (three monoliths, six columns) take the place of the built ones in MONOLITH, as he asked,
  in three styles to choose from in Settings.

### `js/game/engine.js`

- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the release audit Dennis asked
  for: an engine that stops working after it has started answers its pending search, restarts once
  and then reports the failure, instead of leaving searches waiting; a terminated engine starts
  nothing more.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `css/monolith.css`

- 1.0.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the release audit Dennis asked
  for: a rule for a class no page uses (.ref-card) is gone.
- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `css/grimoire.css`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `css/terms.css`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `css/workspace.css`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `css/xray.css`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/analyze-view.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/analyze.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/controls.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/crucible-view.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/crucible.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/ui/studies.js`

- 1.0.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release: the study engine
  moved out of js/ui/position.js when Dennis asked for a clearer, more visual Position tab, so the
  views and the rules of a study live apart. Adds the study order (Up next) and the progress counts
  the new views draw.

### `js/game/ceremony.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/app/snapshot.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/coach/notes.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/core/monolith.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/data/studies.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: the
  studies script block of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of
  concerns.

### `js/scene/board.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

### `js/scene/materials.js`

- 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First release as its own file: split
  out of wizards-chess.html 2.4.0 when Dennis asked for a proper separation of concerns.

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->
