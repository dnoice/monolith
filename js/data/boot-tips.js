/*
✒ Metadata
    - Title: Loading Screen Tips (MONOLITH Edition - v1.0)
    - File Name: boot-tips.js
    - Relative Path: js/data/boot-tips.js
    - Artifact Type: data
    - Version: 1.0.0
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.0 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release, for the rotating tips and facts Dennis asked for on the
      loading screen: tips on the page's own keys, commands and
      destinations, and facts about chess.

✒ Description:
    What the loading screen's card shows while the page starts, one entry
    at a time in a shuffled order (js/ui/boot-screen.js). A tip is about
    this page and was checked against it (the palette's commands in
    js/ui/palette.js, the keys in js/ui/splitters.js, the destinations and
    controls in README.md); a fact is about chess and is settled history or
    arithmetic.

✒ Key Features:
    - Each entry is { kind, text }: kind 'tip' (shown under a Tip chip) or
      'fact' (under Did you know?).
    - In text, `backticks` mark a key or a command, drawn as a key cap, and
      {palette} stands for the palette's key on this keyboard (Ctrl K, or
      ⌘K on Apple keyboards).
    - Settings → Tips: Off leaves only the facts.

✒ Usage Instructions:
    Loaded by index.html as a classic script before js/main.js, so
    BOOT_TIPS is a global when the modules run. Node tools read it with
    require():
        const BOOT_TIPS = require('./js/data/boot-tips.js');
    Keep an entry short enough to read in the five seconds it stays (about
    120 characters), and check a tip against the page before adding it:
    a tip that names a key or a command the page no longer has misleads.

✒ Other Important Information:
    - Dependencies: none.
    - Compatible platforms: current browsers as a classic script (it defines
      a global), and Node.js 18 or newer through require().
---------
*/
/* ---------- BOOT_TIPS: the loading screen's tips and facts ----------
   Dennis's request (10/24/2026): rotating, randomized tips and facts on the loading screen. The
   tips teach the page; the facts are chess. */
const BOOT_TIPS = [
  // the page
  { kind: 'tip', text: 'Press `{palette}` anywhere for the command palette: most settings and actions are a few letters away.' },
  { kind: 'tip', text: 'Type `:define` and a term in the palette to open its Grimoire entry, for example `:define hashfull`.' },
  { kind: 'tip', text: 'Stuck? A hint comes one step at a time: a nudge, then the piece, then the move.' },
  { kind: 'tip', text: 'Eight levels, from Novice to Maximum, and you can change the level in the middle of a game.' },
  { kind: 'tip', text: 'Hold `Space` in Analyze for the Tactical X-Ray: attackers, defenders and what a move there costs.' },
  { kind: 'tip', text: 'In Analyze, `F`, `V` and `X` turn the move-value field, the vectors and the X-Ray on and off.' },
  { kind: 'tip', text: 'Drag a piece onto a square to move it, and drag the board itself to orbit; scroll or pinch to zoom.' },
  { kind: 'tip', text: 'Step through the moves with `←` and `→`; `Home` and `End` jump to the start and back to the live position.' },
  { kind: 'tip', text: 'Type a move straight into the move field: `e2e4`, or `e7e8q` to promote.' },
  { kind: 'tip', text: 'The world follows where you are: the cathedral for Play, MONOLITH for Analyze and the Crucible. Settings can pin either.' },
  { kind: 'tip', text: '`:reference` loads Kasparov – Topalov, Wijk aan Zee 1999, with its recorded Stockfish 19 run.' },
  { kind: 'tip', text: 'With Explore on (the default), a Crucible game, an earlier move or a finished game takes your moves into a scratch line.' },
  { kind: 'tip', text: 'Underlined terms anywhere in the app open a short Grimoire card.' },
  { kind: 'tip', text: 'The Grimoire explains every term on these screens; press `/` there to search it.' },
  { kind: 'tip', text: 'MONOLITH’s pillars come in three styles, Monoliths, Classic and Modern. Try `:pillars classic`.' },
  { kind: 'tip', text: 'The Coach reads every move: verdicts, threats and tips. `:coach` turns its comments on or off.' },
  { kind: 'tip', text: 'Can’t decide between marble and obsidian? Roll the die.' },
  { kind: 'tip', text: 'Graphics on Automatic starts from your GPU and raises or lowers the level with the frame rate.' },
  { kind: 'tip', text: 'Every study in the Position tab was checked with Stockfish before it went in.' },
  { kind: 'tip', text: '`:copy fen` copies the position on screen as FEN.' },
  { kind: 'tip', text: 'After a game, the review shows your accuracy and the turning point.' },
  { kind: 'tip', text: 'Settings → Animation: Brisk shortens this screen too, and Minimal keeps it still.' },
  { kind: 'tip', text: 'The Crucible replays a recorded engine gauntlet: an SPRT match with its LLR trace, Elo interval and anomalies.' },
  // chess
  { kind: 'fact', text: 'White has 20 possible first moves: 16 with the pawns and 4 with the knights.' },
  { kind: 'fact', text: 'After one move each, 400 different positions can be on the board.' },
  { kind: 'fact', text: 'After two moves each, 197,281 different games are possible.' },
  { kind: 'fact', text: 'Fool’s Mate is the fastest checkmate there is: 1. f3 e5 2. g4 Qh4#.' },
  { kind: 'fact', text: 'En passant has to be taken at once, on the very next move, or the chance is gone.' },
  { kind: 'fact', text: 'A pawn that reaches the last rank must become a queen, rook, bishop or knight: never a king, never still a pawn.' },
  { kind: 'fact', text: 'You may not castle out of check, through check or into it, nor once the king or that rook has moved.' },
  { kind: 'fact', text: 'Stalemate, no legal move without being in check, is a draw, not a win.' },
  { kind: 'fact', text: 'After fifty moves each with no capture and no pawn move, either player may claim a draw.' },
  { kind: 'fact', text: 'When the same position comes up a third time, with the same side to move, a draw can be claimed.' },
  { kind: 'fact', text: 'A knight can visit all 64 squares exactly once. The knight’s tour has been studied for more than a thousand years.' },
  { kind: 'fact', text: 'Until the late 1400s the queen moved only one square, diagonally.' },
  { kind: 'fact', text: 'The bishop began as the alfil, which jumped exactly two squares diagonally.' },
  { kind: 'fact', text: 'Claude Shannon estimated about 10¹²⁰ possible games of chess, far more than the atoms in the observable universe.' },
  { kind: 'fact', text: '“Checkmate” comes from the Persian shāh māt: the king is helpless.' },
  { kind: 'fact', text: 'The rook takes its name from the Persian rukh, a chariot.' },
  { kind: 'fact', text: 'In 1997 IBM’s Deep Blue beat the world champion, Garry Kasparov, in a six-game match.' },
  { kind: 'fact', text: 'The Immortal Game, Anderssen against Kieseritzky, London 1851: White won after giving up both rooks and the queen.' },
  { kind: 'fact', text: 'Elo ratings are named after Arpad Elo, the physics professor who devised them.' },
  { kind: 'fact', text: 'The two kings can never stand on neighbouring squares: the one that moved there would be in check.' },
  { kind: 'fact', text: 'Light on the right: each player has a light square in the near right-hand corner.' },
  { kind: 'fact', text: 'Castling is the only move in which two of your pieces move at once.' },
  { kind: 'fact', text: 'Nikolić against Arsović, Belgrade 1989, ran 269 moves and more than 20 hours, and ended in a draw.' },
  { kind: 'fact', text: 'Kasparov’s Immortal, against Topalov in 1999, turns on a rook sacrifice: 24. Rxd4!!' },
  { kind: 'fact', text: 'Stockfish, the engine on this page, is free software under the GPL, built by volunteers around the world.' }
];
if (typeof module !== 'undefined') module.exports = BOOT_TIPS;
