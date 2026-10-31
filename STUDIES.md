<!--
✒ Metadata
    - Title: MONOLITH Studies (digiSpace Edition - v1.3)
    - File Name: STUDIES.md
    - Relative Path: STUDIES.md
    - Artifact Type: docs
    - Version: 1.3.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.3.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      2.18.0: the optional vs: 'both' field, the Castling drill played by
      both sides, a set-up opened in Set up and its Who plays it.
    - 1.2.2 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose, and the preferences key is monolith-prefs-v2.
    - 1.2.1 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From the
      release audit Dennis asked for: a hold checkpoint waits for the
      Coach's engine, and is never passed unchecked.
    - 1.2.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      Position tab's redesign: how a study is found and played in the new
      Studies view (Up next, tiles, cards, the Study card's goal track),
      and the engine's new home, js/ui/studies.js.
    - 1.1.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      the separation of concerns Dennis asked for, the dataset is
      js/data/studies.js and the code that runs it js/ui/position.js; the
      checks load those files, and the references follow.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      record of the Position tab's studies, written with them at Dennis's
      request for a Position sidebar built for learning.

✒ Description:
    The reference for STUDIES, the dataset behind the Studies card on the
    Position tab of MONOLITH (js/data/studies.js). It says what a study is,
    how each kind is played and judged, how every study was checked with
    Stockfish, what each field means, and how to add a study without
    breaking any of that.

✒ Key Features:
    - The three modes (puzzle, practice, set-up) and the four goals, with
      the exact rule that decides each; who answers in each, and Set up's
      Who plays it for a study's position opened there.
    - The checks every study passed, and the tool that repeats them.
    - The 18 studies, with what each one teaches.
    - The schema, field by field, and the steps for adding a study.

✒ Other Important Information:
    - Dependencies: none; this file is documentation. Re-checking the
      studies needs Node.js 18 or newer and tools/verify-studies.mjs.
    - Compatible platforms: any Markdown renderer.
    - Scope: the studies and their judging only. The Read and Set up views
      on the same tab are described in the page itself and in CHANGELOG.md
      (2.4.0 and 2.7.0).
---------
-->

# Studies

The Position tab teaches through studies: positions with a goal. They live in its Studies view:
**Up next** at the top names the first study you have not solved (level 1 first, in the category
shown) and starts it in one press; the category tiles under it show how many of each you have
solved; and every study is a card with its position, opening a detail view with a large diagram,
what it teaches, the terms to read about, Start study and Open in Set up.

Once a study starts, the tab opens Studies wherever you were, and the Study card at the top runs it:
what to do, a picture of the goal (the moves to find, the moves against par, the pawn's road to
the last rank, the moves still to hold), how it is going, hints one at a time (dots on the Hint
button count them), and, for a puzzle, the solution on request. Next study goes to the next one
you have not solved, in the same order and category. The Play tab names the study in its header
while it runs.

Every study was checked with Stockfish 19 before it went in, and `tools/verify-studies.mjs`
repeats the checks against the page as it ships.

## The three modes

| Mode | How it is played | Who answers |
| --- | --- | --- |
| `puzzle` | Find the moves. A wrong move is taken back and counted. | The replies come from the study's own line, after a short beat. |
| `practice` | Play it out until the goal is met or lost. | Stockfish at full strength (level 8, Maximum), for that game only. |
| `free` | A set-up: the position, loaded as an ordinary game. | Play's own settings (opponent, side and level); with `vs: 'both'`, nobody: you move both sides on this screen. |

A study never changes your saved game settings. When it ends (Restart, End study, Next, a new
game or a loaded FEN), the next ordinary game uses your own opponent, side and level again.
Rematch on a study's result card restarts the study.

Open in Set up, on a study's page, puts its position in the Set up view instead, to edit or play
as an ordinary position. There **Who plays it** decides the game Play this position starts:
against Stockfish at Play's level, on the side to move or the other (Stockfish then moves first),
or both sides on this screen. The line beside the button says which, and Play's own settings are
left alone.

## Goals, and what decides them

| Goal | Solved when | Lost when |
| --- | --- | --- |
| `line` (puzzles) | You have played every one of your moves in `line`. | Never: a wrong move is taken back. |
| `mate` (puzzles) | As `line`, except that the last move may be any mate. | Never. |
| `mate` (practice) | You give mate. The note gives your number of moves beside the par. | The game ends in a draw (stalemate, repetition, the fifty-move rule, insufficient material). |
| `promote` | You promote a pawn and the opponent has no legal capture of the new piece. | The game ends without your win, or your last pawn is gone. |
| `hold` | The game is drawn by the rules, or after `moves` of your moves the Coach's engine still gives you at least 25 % (a draw). | You are mated, the opponent promotes a pawn, or the engine sees the game lost at the checkpoint. |

At a `hold` checkpoint the study waits its turn behind the Coach's own reading of the move (the two
share one engine), up to three tries. If the engine still has no answer, the study says it could not
check the position and plays on; it is never marked solved unchecked.

A puzzle solved after Show the solution is finished but not counted. Solved studies are kept in
this browser (`prefs.studies` in `monolith-prefs-v2`), with the date.

## The checks

`tools/verify-studies.mjs` loads `STUDIES` (`js/data/studies.js`) and the rules engine
(`js/core/chess.js`), the files the page itself loads, and asks the vendored Stockfish 19 about each
study, by default to depth 20. A copy from before 2.5.0 has both as script blocks in the page, and
the tool reads them there.

- **Puzzles.** Each of your moves must be the engine's best and unique: no other mate as short,
  or every other move at least 2.00 pawns worse. Each reply is reported beside the engine's best
  defence. A `mate` line must end in mate.
- **Practice.** The evaluation for your side must match the goal: a win (+3.00 or a mate) for
  `mate` and `promote`, a draw (no worse than −0.50) for `hold`.
- **Pars.** A mate drill's `par` is Stockfish's quickest mate: `go mate par` finds it and
  `go mate par−1` finds nothing shorter. It is the engine's figure, not a tablebase's, so the
  page says "Stockfish's quickest mate" and never "the shortest".
- **Set-ups.** The FEN must be a legal position.

```shell
node tools/verify-studies.mjs
node tools/verify-studies.mjs --only lucena,philidor --depth 26
```

It exits with code 1 when any study fails.

## The studies

| Id | Category | Level | Mode | Goal | What it teaches |
| --- | --- | --- | --- | --- | --- |
| `queen-mate` | Basic mates | 1 | practice | mate, par 8 | The box: the queen a knight's move away, then the king comes up |
| `rook-mate` | Basic mates | 2 | practice | mate, par 14 | Cutting the king off; the opposition before each rook check |
| `ladder-mate` | Basic mates | 1 | practice | mate, par 5 | Two rooks alternate on adjacent ranks |
| `back-rank` | Mating patterns | 1 | puzzle | mate | A king behind its own pawns |
| `back-rank-deflection` | Mating patterns | 2 | puzzle | mate | Removing the back rank's only guard |
| `smothered` | Mating patterns | 2 | puzzle | mate | A queen sacrifice forces the smother |
| `double-check` | Mating patterns | 3 | puzzle | mate | Réti – Tartakower, Vienna 1910: the double check |
| `royal-fork` | Tactics | 1 | puzzle | line | The knight forks king and rook |
| `pin-queen` | Tactics | 1 | puzzle | line | Pinning the queen to the king |
| `skewer` | Tactics | 2 | puzzle | line | A check on the long diagonal uncovers the rook |
| `discovered` | Tactics | 2 | puzzle | line | Discovered check wins the queen |
| `king-leads` | Endgames | 2 | practice | promote | The king in front, the pawn behind |
| `hold-opposition` | Endgames | 2 | practice | hold, 12 moves | The defender's opposition |
| `square` | Endgames | 1 | practice | hold, 8 moves | The square of the pawn |
| `lucena` | Endgames | 3 | practice | promote | Building a bridge |
| `philidor` | Endgames | 3 | practice | hold, 12 moves | The sixth-rank defence, then checks from behind |
| `start` | Set-ups | 1 | free | — | A normal game |
| `castling-drill` | Set-ups | 1 | free, `vs: 'both'` | — | Castling both ways for both sides; you move both |

## Fields

| Field | Meaning |
| --- | --- |
| `id` | Kebab case, unique; the key for progress. |
| `cat` | `mates`, `patterns`, `tactics`, `endgames` or `setups` (labels in `STUDIES.cats`). |
| `title`, `task` | The study's name, and its goal in one line ("White to move. Mate in two."). |
| `level` | 1 to 3, shown as dots. |
| `fen` | The position. |
| `side` | The side you play. In a `hold` study you may move second. |
| `mode`, `goal` | As in the tables above; `goal` is `null` for a set-up. |
| `vs` | Set-ups only, optional: `'both'` plays the position as a game where you move both sides; without it, a set-up uses Play's settings. |
| `line` | Puzzles: the moves in long algebraic, yours and the replies in turn. |
| `par` | Mate drills: Stockfish's quickest mate (see The checks). |
| `moves` | Holds: your moves before the engine checkpoint. |
| `idea` | The lesson, two to four sentences. |
| `hints` | Given one at a time; each says a little more than the last, none gives the move away outright. |
| `read` | Grimoire ids, shown as "Read about" chips that open the term's card. |

`STUDIES.TEXT` holds the page's own sentences about a study in progress (right, wrong, solved,
held, failed), with `{slots}` filled as in COACH_VOICE. A variant is chosen only when all its
slots can be filled.

## Adding a study

1. Find a position that teaches one idea, and write it as a FEN.
2. Add the entry to `STUDIES.list` in `js/data/studies.js`, beside its category.
3. For a puzzle, write the whole line, your moves and the replies. For a mate drill, leave `par`
   out at first.
4. Run `node tools/verify-studies.mjs --only <id> --depth 24`. Fix the position until it passes:
   a second winning move means the puzzle has two answers and needs changing. For a mate drill,
   take the mate distance it reports, set `par`, and run it again to confirm.
5. Write `idea` and `hints` in the Coach's voice (COACH_VOICE.md): exact squares, no exclamation
   marks, and the hints in order from a nudge to nearly the answer.
6. Point `read` at Grimoire entries, adding an entry first if the idea has none.

## Files

- `js/data/studies.js`: the dataset.
- `js/ui/studies.js`: the code that runs a study (starting it, the replies, the verdicts, the
  solved dates), the study order behind Up next and Next study, and the progress counts.
- `js/ui/position.js`: the Position tab's views, including the Studies view and the Study card;
  the diagrams come from `js/ui/diagram.js`, the markup is in the page, the styles in
  `css/position.css`.
- `tools/verify-studies.mjs`: the checks above.
- `CHANGELOG.md`: the release that introduced the studies (2.4.0).

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->

