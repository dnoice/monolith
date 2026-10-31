<!--
✒ Metadata
    - Title: MONOLITH Coach Voice (digiSpace Edition - v1.2)
    - File Name: COACH_VOICE.md
    - Relative Path: COACH_VOICE.md
    - Artifact Type: docs
    - Version: 1.2.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose.
    - 1.2.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — With
      the separation of concerns Dennis asked for, the dataset and the
      opening book are files of their own (js/data/) and the Coach is four
      modules (js/coach/); the file references follow.
    - 1.1.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — Dennis
      asked for the Coach's logic to cover as much ground as research
      allows: opening names and the Book grade, Brilliant, lichess's mate
      rules, the punish, repetition, fifty-move and stalemate watches, tips
      that fit the board, and the end-of-game review with lichess's
      accuracy. New keys, the watch order and the sources are recorded.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      record of the Coach's voice and its dataset, written at Dennis's
      direction that the Coach coach in our own style, from a dataset.

✒ Description:
    The style guide for everything the Coach says in MONOLITH, and the
    reference for its dataset, COACH_VOICE, which lives in
    js/data/coach-voice.js. The page never invents a sentence: it picks a
    line from the dataset and fills its slots with facts it has checked.
    This file says how the voice sounds, how a line is chosen, which facts
    can fill a slot, where the Coach's judgements come from, and how to add
    lines without breaking any of that.

✒ Key Features:
    - Six rules of the voice, with examples of right and wrong.
    - The dataset's sections, what triggers each key, and its slots.
    - The order of the watch on your turn, and the grades with their
      sources (chess.com's bands, lichess's win curve, mate rules and
      accuracy, the lichess opening list).
    - How the page chooses a line, so a note never changes while it is
      read and always uses the most facts it has.
    - How to extend the dataset safely.

✒ Other Important Information:
    - Dependencies: none; this file is documentation. The dataset itself
      is plain JavaScript data in js/data/coach-voice.js, as is the opening
      book (js/data/opening-book.js).
    - Compatible platforms: any Markdown renderer.
    - Scope: this governs the Coach's sentences only. Labels, help text
      and the Grimoire follow the page's general copy style.
    - Sources: chess.com's move classification bands; lichess's
      Advice.scala (mate rules), WinPercent.scala and AccuracyPercent.scala
      (win curve and accuracy) and scalalib's Maths.scala (the means);
      lichess-org/chess-openings (CC0) for opening names.
---------
-->

# The Coach's voice

The Coach in MONOLITH speaks like a calm master sitting beside the board. It says what a move does,
why that matters, and, after a slip, what would have been better and what that changes. It never
guesses: every sentence is a line from the dataset `COACH_VOICE` (about 320 lines), filled with
facts the page has checked against the rules and the engine.

## The six rules

1. **The move, then the reason, then the fix.** One idea per sentence.
   - Right: `Nc3 is playable but loose. After g4, the knight on f3 is attacked. d4 was cleaner.`
   - Wrong: `Hmm, not the best! You might want to consider other options here.`
2. **Name pieces and squares exactly.** Use a number only where it decides something.
   - Right: `Your bishop on c4 is loose: attacked, not defended.`
   - Wrong: `One of your pieces might be in a bit of trouble.`
3. **Praise is specific. Criticism always brings the better move and what it changes.** The
   better move is told by what it does that yours does not.
   - Right: `A small slip. Qh5 puts the question to the pawn on e5, but Nf3 brings the knight into play.`
   - Wrong: `Qh5 puts the question to the pawn on e5, but Nf3 puts the question to the pawn on e5 and brings the knight into play.`
4. **Calm, warm, a little dry.** No exclamation marks; no "simply", "just" or "obviously"; never a
   joke at the player's expense.
5. **The board is a place.** Files, diagonals, the king's shelter. Imagery stays light: "tucks the
   king away", "plants a flag in the centre", never a paragraph of metaphor.
6. **A house maxim may close a lesson, never two in a row.** Maxims follow a mistake or a blunder
   and are chosen by the kind of lesson (a tactical loss, the opening, the middlegame, the
   endgame). One of them is the project's own: *Aim twice, shoot once: look at every capture and
   check before you move.*

## What the Coach says, and when

The dataset has one section per moment. Each key holds several variants of the same thought.

| Section | When it speaks | Keys |
| --- | --- | --- |
| `verdict` | After each of your moves, graded against the engine's best | `book`, `bookEnter` (a move from the opening list; `bookEnter` names a new opening), `best`, `brilliant`, `only`, `excellent`, `good`, `inaccuracy`, `mistake`, `blunder` (each grade with a `_plain` form when a fact is missing), `missedWin`, `allowedMate`, `missedMate`, `foundMate` (each with a `1` form for mate in one), `keepsMate`, `lostAnyway`, `mated` |
| `reply` | After the opponent's move | `mate`, `book` (the opening's name when it changes), `doubleCheck`, `discCheck`, `discAttack`, `skewer`, `trap`, `removeDefender`, `enPassant`, `underpromote`, `fork`, `pin`, `capture`, `check`, `threatMate`, `threatWin`, `attack`, `promote`, `escape`, `defend`, `castle`, `develop`, `outpost`, `openFile`, `halfOpen`, `seventh`, `rookBehind`, `centre`, `passer`, `fianchetto`, `connect`, `winsPair`, `kingUp`, `movedTwice`, `earlyQueen`, `quiet` |
| `watch` | On your turn, before you move | `inCheck`, `inCheckOne`, `mateChance`, `threatMate`, `punish`, `threatWin`, `hanging`, `underAttack`, `outnumbered`, `stalemate`, `repeatBetter`, `repeatWorse`, `fifty`, `chance`, `calm` |
| `tips` | Inside a calm watch note | `centre`, `develop`, `castle` (the opening's jobs in order); `middlegame`, `middlegameRook` (an open file and a rook to put on it); `endgameMate` (against a bare king), `endgameKing`, `endgameRook`, `endgamePasser`, `endgame` |
| `habit` | Your own opening habits, each at most once a game | `movedTwice`, `earlyQueen`, `kingWalk`, `notCastled`, `castled`, `developed`, `bookDubious` (a known line the engine does not trust) |
| `hint` | The Hint button, one step at a time | nudges `mate`, `winMat`, `capture`, `check`, `discover`, `trap`, `attack`, `defend`, `castle`, `develop`, `quiet`; then `piece`; then `move` (or `move_plain`) |
| `end` | When the game is over | `win`, `loss`, `draw`, `resigned`; the review's `accuracy` (one coached side) or `accuracySide` (both, in a friend game), `turn`, `clean` |
| `maxims` | Under a mistake or a blunder | `tactics`, `opening`, `middlegame`, `endgame` |
| `REASONS` | Inside other lines: what a move does | `mate`, `promote`, `underpromote`, `doubleCheck`, `discCheck`, `discAttack`, `skewer`, `trap`, `removeDefender`, `enPassant`, `winMat`, `fork`, `pin`, `capture`, `check`, `castle`, `escape`, `attack`, `defend`, `develop`, `centre`, `passer`, `kingUp`, `outpost`, `openFile`, `halfOpen`, `seventh`, `rookBehind`, `fianchetto`, `connect`, `winsPair`; and the faults `enPrise`, `loosens`, `weakenKing`, `givesPair`, told first after a slip |

### The watch, in order

On your turn the watch says one thing, the most urgent:

1. Check (`inCheck`, or `inCheckOne` when one move is left).
2. A forced mate of your own in three or fewer (`mateChance`): you strike first.
3. The opponent's mate threat in three or fewer (`threatMate`), from a null-move search: the move
   is handed to the opponent and the engine says what it would play.
4. In a game against the computer, its last move was a slip: the expected score is 10 % or more
   better for you than after your own move (`punish`, with "a mistake" or, from 20 %, "a
   blunder"). In a friend game that move already has its own verdict.
5. The opponent's material threat (`threatWin`), when the threat costs you 8 % or more.
6. Your loose pieces: hanging, attacked by something cheaper, or outnumbered.
7. The draw rules, when they matter: a stalemate trap when you are winning (one of your own moves
   would leave the opponent without a move), a position that has appeared twice while one side is
   better (`repeatBetter`, `repeatWorse`), the fifty-move count from forty moves on (`fifty`).
8. A chance to win something (`chance`), without naming it; the hint is there for that.
9. A tip that fits the board (`calm`).

### Opening names

Book moves and opening names come from the lichess-org chess-openings list (public domain, CC0),
compiled into the page's `OPENING_BOOK`: about 3,900 named positions. Each is keyed by a hash of
the placement, the side to move, the castling rights and an en passant square only when a capture
there is legal, so transpositions find their names. The game's opening is the last named position
at or before the move shown, as lichess names it; the turn card shows it with its ECO code.

## Grades

The verdict grades come from the expected score the move gives up against the engine's best. The
bands are chess.com's; the curve from score to expected score is lichess's,
1 / (1 + e^(−cp / 271.6)), which the MONOLITH instruments use too.

| Grade | Expected score lost | Mark |
| --- | --- | --- |
| Book | a move from the opening list that is not a slip | |
| Best | none (the engine's move, or within 0.5 %) | |
| Excellent | under 2 % | |
| Good | under 5 % | |
| Inaccuracy | under 10 % | ?! |
| Mistake | under 20 % | ? |
| Blunder | 20 % or more | ?? |

Special verdicts:

- **Only move** (!): the best move when the next best gives up 20 % or more.
- **Brilliant** (!!): Best or Excellent, giving up two points of material or more after the
  reply, with the expected score still 50 % or more and not above 92 % before the move (a
  sacrifice the engine stands behind, made when not already winning easily).
- **Mate found** (!), **Mating**, **Checkmate**: a mate seen first, kept, delivered.
- **Allows mate**: lichess's rule. A blunder, unless the mover already stood at −7.00 (a mistake)
  or −10.00 (an inaccuracy). **Forced mate** (`lostAnyway`) when the mate was already forced.
- **Missed mate**: graded by what is left after the move: an inaccuracy if still +10.00 or
  better, a mistake from +7.00, otherwise a blunder.
- **Missed win**: a mistake or blunder where the engine's move won material and yours did not.

## The review

When the game ends, the end note adds a review for each coached side:

- **Accuracy**, by lichess's formula. Each move scores
  103.1668 × e^(−0.04354 × d) − 3.1669 + 1 for a drop of d points in win chance (100 when the
  chance does not drop), clamped to 0–100. The game figure is the mean of a volatility-weighted
  mean (weights: the spread of win chances over a sliding window, 2 to 8 plies, clamped to 0.5–12)
  and a harmonic mean (each move floored at 1). The win chances come from the Coach's own
  depth-12 searches.
- The counts of inaccuracies, mistakes and blunders.
- **The turning point**: the move that gave up the most expected score, when it gave up 10 % or
  more, with a button that shows it on the board. Without one, `clean`.

Moves skipped while the moves came quickly are graded before the review, so it counts them all.

## Slots

A slot is a word in braces. The page fills it with a checked fact or leaves the variant out.

| Slot | Fact | Checked by |
| --- | --- | --- |
| `{san}` | The move played, in SAN | the rules engine |
| `{best}` | The engine's best move | the Coach's Stockfish, MultiPV 3 to depth 12 within 1.5 s |
| `{why}`, `{bestWhy}` | What a move does, from `REASONS` (up to two, joined with "and"); `bestWhy` keeps only what the better move adds | the rules engine, plus the material along the engine's line |
| `{reply}`, `{replyWhy}` | The opponent's best answer to your move, and what it does | the engine's line for your move |
| `{mat}` | Material won or lost ("a knight", "the exchange", "a bishop for a pawn") | the captures along the engine's line, an exchange in progress played out |
| `{n}` | Moves to mate | the engine's mate score |
| `{pattern}` | The mate's name (back rank, smothered) | the final position |
| `{opening}` | The opening's name | the opening book |
| `{piece}`, `{sq}`, `{target}`, `{tsq}`, `{target2}`, `{behind}`, `{file}`, `{wing}` | Pieces, squares, files and wings | the rules engine |
| `{who}` | The opponent ("Stockfish", or the side's name in a friend game) | the match |
| `{threat}` | What the opponent would play if you passed | the engine, given the move in your place |
| `{grade}` | "a mistake" or "a blunder", for the punish watch | the change in expected score |
| `{acc}`, `{counts}`, `{loss}`, `{move}` | The review's accuracy, error counts, the turning point's cost and move | the Coach's notes |
| `{nth}`, `{k}`, `{k2}`, `{tip}`, `{result}` | Words and counts | the page |

Attacker and defender counts ignore pins, as the X-Ray's do. A piece is "loose" when it is
attacked and not defended; "outnumbered" when the exchange on its square loses material.

## How a line is chosen

1. Keep only the variants whose slots can all be filled.
2. Of those, keep the ones that use the most facts.
3. Pick one by a hash of the move and the moment, so the same note always reads the same way and
   never changes while it is on screen.
4. A line that opens with a slot keeps the slot's own case (`e4 claims the centre`); text of the
   voice's own is capitalised.

Opening habits (`movedTwice`, `earlyQueen`, `notCastled`, `developed`) are only said in games that
start from the initial position; from a set-up position only `kingWalk` and `castled` apply.

## Adding lines

- Add a variant to an existing key before adding a new key; a new key needs page code to trigger
  it.
- Use only the slots listed for that key's moment. A variant that needs a fact the page does not
  have is never chosen, so a misspelt slot fails safe, silently.
- Keep each variant to one or two sentences, and read it aloud with real moves in it.
- Run the six rules over it. If it would sound wrong said to a beginner and to a master alike,
  rewrite it.

## Files

- `js/data/coach-voice.js`: the dataset.
- `js/data/opening-book.js`: the opening book.
- `js/coach/`: the Coach that uses them: `facts.js` finds what a move does and picks and fills the
  lines (`voice()`), `notes.js` writes the notes, the watch, the hints and the review, `book.js`
  reads the opening book, and `coach.js` reads the board (material, threats, development).
- `ARCHITECTURE.md`: where these sit among the page's files.
- `CHANGELOG.md`: the release that introduced the Coach (2.3.0).

<!-- ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once! -->

