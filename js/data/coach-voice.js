/*
✒ Metadata
    - Title: Coach Voice Dataset (MONOLITH Edition - v1.0)
    - File Name: coach-voice.js
    - Relative Path: js/data/coach-voice.js
    - Artifact Type: data
    - Version: 1.0.1
    - Date: 10/24/2026
    - Update: Saturday, October 24, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.0.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose, and this header names the page by its file in the repository,
      index.html.
    - 1.0.0 (10/22/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      release as its own file: the coach-voice script block of
      wizards-chess.html 2.4.0 when Dennis asked for a proper separation of
      concerns.

✒ Description:
    Every sentence the Coach can say, by key, each with variants and
    {slots}. The page never invents a sentence: it picks a variant whose
    slots it can fill with facts it has checked.

✒ Key Features:
    - Verdicts for your move against the engine's best, with the better move
      after a slip.
    - Readings of the opponent's move: what it takes, attacks, forks, pins
      and threatens.
    - The watch on your turn, opening habits, tips by phase, and the
      end-of-game review.
    - House maxims, never two in a row.
    - The voice's six rules, at the top of the file; COACH_VOICE.md is the
      full guide.

✒ Usage Instructions:
    Loaded by index.html as a classic script before js/main.js, so
    COACH_VOICE is a global when the modules run. Node tools read it with
    require():
        const COACH_VOICE = require('./js/data/coach-voice.js');

✒ Other Important Information:
    - Dependencies: none.
    - Compatible platforms: current browsers as a classic script (it defines
      a global), and Node.js 18 or newer through require().
    - Style guide: COACH_VOICE.md.
---------
*/
/* ---------- the Coach's voice: every sentence the Coach can say ----------
   The Coach should coach, in our own style, from a dataset of its
   own. This is that dataset. The page never invents a sentence: it picks a line from here and
   fills its slots with facts it has checked (the rules, the engine's lines, the material along
   them). COACH_VOICE.md is the style guide and explains how to add lines.

   The voice, in six rules:
     1. The move, then the reason, then the fix. One idea per sentence.
     2. Name pieces and squares exactly. A number only where it decides something.
     3. Praise is specific. Criticism always brings the better move and what it changes.
     4. Calm, warm, a little dry. No exclamation marks, no "simply", "just" or "obviously";
        never a joke at the player's expense.
     5. The board is a place: files, diagonals, the king's shelter. Imagery stays light.
     6. A house maxim may close a lesson, never two in a row.

   How a line is chosen: each key holds variants; the page keeps only the variants whose slots it
   can fill, of those the ones that use the most facts, then picks one by a hash of the moment, so
   a note never changes while you read it and the same moment always reads the same way.

   Slots: {san} the move played · {best} the engine's move · {why} {bestWhy} what a move does
   (from REASONS) · {reply} the opponent's answer that punishes it · {mat} material ("a knight",
   "the exchange") · {n} moves to mate · {piece} {sq} a piece and its square · {target} {tsq} a
   piece it hits and where · {who} the opponent ("Stockfish", "Obsidian") · {wing} king or
   queen · {nth} "second", "third" · {k} a count · {move} the move number · {threat} the
   opponent's threatened move · {result} the result line. */
const COACH_VOICE = {
  // what a move does: verb phrases, third person, joined with "and" when there are two
  REASONS: {
    mate: ['delivers mate', 'delivers a {pattern}'],
    promote: ['makes a new {piece}', 'promotes to a {piece}'],
    underpromote: ['underpromotes to a {piece}', 'makes a {piece} instead of a queen'],
    doubleCheck: ['gives double check', 'checks with two pieces at once'],
    discCheck: ['uncovers check from the {piece}', 'opens a discovered check from the {piece}'],
    discAttack: ['uncovers an attack on the {target} on {tsq}', 'unmasks the {piece} against the {target} on {tsq}'],
    skewer: ['skewers the {target} and the {behind}', 'lines up the {target} with the {behind} behind it'],
    trap: ['traps the {target} on {tsq}: it has no safe square', 'leaves the {target} on {tsq} with nowhere to go'],
    removeDefender: ['removes the defender of the {target} on {tsq}', 'takes away the guard of the {target} on {tsq}'],
    enPassant: ['takes en passant', 'captures en passant'],
    winMat: ['wins {mat}', 'nets {mat}'],
    fork: ['forks the {target} and the {target2}', 'hits the {target} and the {target2} at once'],
    pin: ['pins the {target} to the {behind}', 'nails the {target} to the {behind}'],
    capture: ['takes the {target} on {tsq}', 'captures on {tsq}'],
    check: ['gives check', 'checks the king'],
    castle: ['castles {wing}side', 'tucks the king away on the {wing}side'],
    escape: ['takes the {piece} out of danger', 'rescues the {piece}'],
    attack: ['attacks the {target} on {tsq}', 'puts the question to the {target} on {tsq}'],
    defend: ['covers the {target} on {tsq}', 'guards the {target} on {tsq}'],
    develop: ['develops the {piece}', 'brings the {piece} into play'],
    centre: ['claims the centre', 'plants a flag in the centre'],
    passer: ['pushes the passed pawn', 'walks the passed pawn forward'],
    kingUp: ['brings the king into the fight'],
    outpost: ['plants the knight on an outpost', 'puts the knight on a square no pawn can chase it from'],
    openFile: ['takes the open {file}-file', 'puts the rook on the open {file}-file'],
    halfOpen: ['puts the rook on the half-open {file}-file'],
    seventh: ['puts the rook on the seventh rank', 'lands the rook on the seventh'],
    rookBehind: ['puts the rook behind the passed pawn'],
    fianchetto: ['fianchettoes the bishop', 'sets the bishop on the long diagonal'],
    connect: ['connects the rooks'],
    winsPair: ['wins the bishop pair'],
    // faults: named only for a move graded below good
    enPrise: ['puts the {piece} where it can be taken', 'leaves the {piece} en prise'],
    loosens: ['leaves the {target} on {tsq} loose', 'leaves the {target} on {tsq} without enough cover'],
    weakenKing: ['loosens the pawns in front of the king', 'opens a gap in the king\'s shelter'],
    givesPair: ['gives up the bishop pair']
  },

  // your move, graded against the engine's best
  verdict: {
    best: [
      '{san} {why}. The engine agrees.',
      'Exactly. {san} {why}.',
      '{san} is the move: it {why}.',
      'The engine\'s first choice. {san} {why}.'
    ],
    book: [
      '{san} is book: {opening}.',
      'Book move. {opening}.'
    ],
    bookEnter: [
      'With {san} the game enters the {opening}.',
      '{san}, and this is the {opening}.'
    ],
    brilliant: [
      'A real sacrifice. {san} gives up {mat}, and the engine still prefers it.',
      'Brilliant: {san} gives up {mat}, and the position is better for it.'
    ],
    lostAnyway: [
      'No defence held here: mate in {n} was forced either way.',
      'The mate could not be stopped; mate in {n} whatever you played.'
    ],
    best_plain: [
      '{san}. The engine agrees.',
      'Exactly the engine\'s choice.',
      '{san} is the move here.'
    ],
    only: [
      '{san} was the only move that holds, and you found it.',
      'Every other move loses ground. {san} {why}.',
      'Under pressure, the one good move: {san}.'
    ],
    excellent: [
      '{san} {why}. A hair behind {best}, no more.',
      'Strong. {san} {why}; the engine\'s {best} is only a shade better.',
      '{san} keeps everything in hand. {best} was the same idea with a little more bite.'
    ],
    good: [
      '{san} {why}. Fine, though {best} {bestWhy}.',
      '{san} is sound, though it allows {reply}, which {replyWhy}. {best} kept that out.',
      '{san} is sound. {best} was a touch sharper: it {bestWhy}.',
      'Reasonable. {san} {why}, but {best} {bestWhy}.'
    ],
    good_plain: [
      '{san} is sound. {best} was a touch more precise.',
      'Reasonable. The engine slightly prefers {best}.'
    ],
    inaccuracy: [
      'A small slip. After {san}, {reply} {replyWhy}. {best} {bestWhy}.',
      '{san} gives {who} {reply}, which {replyWhy}. {best} was cleaner.',
      'A small slip. {san} {why}, but {best} {bestWhy}.',
      '{san} lets a little of the position go. {best} {bestWhy}.',
      '{san} is playable but loose. Look at {best}: it {bestWhy}.'
    ],
    inaccuracy_plain: [
      'A small slip. {best} was more accurate.',
      '{san} lets a little of the position go; {best} held it.'
    ],
    mistake: [
      '{san} is a mistake. After {reply}, you lose {mat}. {best} {bestWhy}.',
      'This one hurts: {reply} answers {san} and wins {mat}. {best} {bestWhy}.',
      '{san} gives {who} a chance. {reply} wins {mat}; {best} kept it together.'
    ],
    mistake_plain: [
      '{san} is a mistake: {reply} {replyWhy}, and the position turns. {best} {bestWhy}.',
      'After {san}, {reply} {replyWhy}. That is the problem; {best} avoided it.',
      '{san} is a mistake: the position turns after {reply}. {best} {bestWhy}.',
      '{san} hands over the initiative. {best} {bestWhy}.',
      'A mistake. {best} was the move: it {bestWhy}.'
    ],
    blunder: [
      '{san} is a blunder. {reply} wins {mat}. {best} {bestWhy}.',
      'Careful: after {san}, {reply} takes {mat}. {best} was the move: it {bestWhy}.',
      '{san} drops {mat} to {reply}. Before every move, look at what it leaves behind.'
    ],
    blunder_plain: [
      '{san} is a blunder: {reply} {replyWhy}. {best} was the move.',
      '{san} is a blunder: it turns the game. {best} {bestWhy}.',
      'That one turns the game. {best} was the move: it {bestWhy}.'
    ],
    allowedMate: [
      '{san} allows mate: {reply} starts a forced mate in {n}. {best} {bestWhy}.',
      'Danger. After {san}, {reply} mates in {n}. {best} was the way out.'
    ],
    allowedMate1: [
      '{san} allows mate in one: {reply}. {best} {bestWhy}.',
      'After {san}, {reply} is mate. {best} was the way out.'
    ],
    missedMate: [
      'There was mate in {n}, starting with {best}. {san} is still good, but the hunt was on.',
      'A forced mate in {n} was there: {best}. Checks first, every time.'
    ],
    missedMate1: [
      '{best} was mate in one. {san} lets the king go.',
      'Mate in one was on the board: {best}. Checks first, every time.'
    ],
    missedWin: [
      '{best} would have won {mat}: it {bestWhy}. {san} lets the chance pass.',
      'A chance slipped by: {best} {bestWhy}, winning {mat}.'
    ],
    foundMate1: [
      '{san}, and mate follows next move.',
      '{san} leaves one move to mate.'
    ],
    foundMate: [
      '{san}, and the net closes: mate in {n}.',
      'Mate in {n}. {san} found it.',
      '{san} starts the finish: mate in {n} is forced.'
    ],
    keepsMate: [
      '{san} keeps the mating net tight: mate in {n}.',
      'Still forced: mate in {n}.'
    ],
    mated: [
      '{san} is mate. Clean.',
      'Checkmate with {san}. The king had nowhere left to go.',
      '{san}: a {pattern}.',
      'A {pattern}: {san}.'
    ]
  },

  // the opponent's move, read for you
  reply: {
    mate: ['{san} is mate.', 'Checkmate: {san}.', '{san} is a {pattern}.'],
    book: ['{who} answers with the {opening}.', 'Book: {san} is the {opening}.'],
    doubleCheck: ['{san} is double check: only the king can move.'],
    discCheck: ['{san} uncovers check from the {piece}.'],
    discAttack: ['{san} uncovers an attack on your {target} on {tsq}.'],
    skewer: ['{san} skewers your {target} and {behind}.'],
    trap: ['{san} traps your {target} on {tsq}: it has no safe square.'],
    removeDefender: ['{san} removes the defender of your {target} on {tsq}.'],
    enPassant: ['{who} takes en passant.'],
    underpromote: ['{san}: {who} makes a {piece} instead of a queen.'],
    outpost: ['{who} plants a knight on an outpost with {san}.'],
    openFile: ['{who} puts a rook on the open {file}-file.'],
    halfOpen: ['{who} puts a rook on the half-open {file}-file.'],
    seventh: ['A rook reaches your second rank: {san}.'],
    rookBehind: ['{who} puts a rook behind a passed pawn.'],
    fianchetto: ['{who} fianchettoes the bishop.'],
    connect: ['{who} connects the rooks.'],
    winsPair: ['{san} takes the bishop pair from you.'],
    threatMate: [
      '{san} threatens mate: {threat} is coming unless you stop it.',
      'Danger on the board. {who} threatens {threat}, and that is mate.'
    ],
    threatWin: [
      '{san} threatens {threat}, which would win {mat}.',
      'Watch {tsq}: {who} is lining up {threat} to win {mat}.'
    ],
    check: ['{san} is check.', '{who} checks with {san}.'],
    fork: ['{san} forks your {target} and {target2}.', 'A fork: {san} hits your {target} and {target2} at once.'],
    capture: [
      '{who} takes your {target} on {tsq}.',
      '{san}: the {piece} captures on {tsq}.'
    ],
    attack: [
      '{san} attacks your {target} on {tsq}.',
      '{who} goes after your {target} on {tsq}.'
    ],
    pin: ['{san} pins your {target} to your {behind}.'],
    promote: ['{san}: {who} has a new {piece}.', 'A new {piece} for {who}: {san}.'],
    escape: ['{who} pulls the {piece} out of danger.', '{san} takes the {piece} to safety.'],
    defend: ['{san} covers the {target} on {tsq}.', '{who} shores up the {target} on {tsq}.'],
    centre: ['{san} claims the centre.', '{who} stakes out the centre with {san}.'],
    passer: ['{who} pushes the passed pawn: {san}. Watch its path to promotion.', '{san}: the passed pawn moves up. Blockade it before it gathers speed.'],
    kingUp: ['{who} brings the king forward. Endgame kings fight.'],
    castle: [
      '{who} castles {wing}side. Its king is safe for now.',
      '{who} castles; the rooks can talk to each other.'
    ],
    develop: [
      '{who} develops: {san} brings the {piece} out.',
      '{san} develops the {piece}.'
    ],
    movedTwice: [
      '{who} moves the same {piece} again. That is time not spent on development: bring your pieces out and open the centre.',
      'The {piece} moves for the {nth} time. While {who} shuffles, you build: develop with tempo.'
    ],
    earlyQueen: [
      'The queen comes out early. Develop with tempo: every attack on her is a free move for you.',
      '{who}\'s queen is out before the minor pieces. Chase her with moves that develop.'
    ],
    quiet: [
      '{san}: a quiet move. Ask what it changes: which squares it covers now.',
      '{who} plays {san}. No direct threat, so your plan comes first.'
    ]
  },

  // your turn: what to watch
  watch: {
    inCheck: [
      'You are in check: {k} legal moves.',
      'Check. {k} ways out; find the one that keeps your shape.'
    ],
    inCheckOne: ['Check, and only one legal move.'],
    mateChance: [
      'There is a forced mate on the board. Look at every check.',
      'Mate in {n} is there for the taking. Checks first.'
    ],
    threatMate: [
      'Watch out: {who} threatens mate with {threat}.',
      'Before anything else: {threat} would be mate.'
    ],
    threatWin: [
      'Threat: {threat} would win {mat}.',
      '{who} is aiming {threat} at your {target}. Deal with it first.'
    ],
    hanging: [
      'Your {piece} on {sq} is loose: attacked, not defended.',
      'The {piece} on {sq} hangs. Defend it, move it, or make a bigger threat.'
    ],
    outnumbered: [
      'Your {piece} on {sq} is attacked {k} times and defended {k2}.',
      'Count on {sq}: {k} attackers against {k2} defenders.'
    ],
    underAttack: [
      'Your {piece} on {sq} is attacked by a {target}, which is worth less.',
      'A {target} is hitting your {piece} on {sq}. Trading down is not in your favour.'
    ],
    chance: [
      'Look twice: one of {who}\'s pieces is loose.',
      'There is more here than a quiet move. Something of {who}\'s can be won.',
      'Before a quiet move, count again: a piece of {who}\'s is short of defenders.'
    ],
    punish: [
      '{who}\'s {san} was {grade}: the engine now likes your position better. Find the move that proves it.',
      '{san} was {grade} by {who}. Look for the way to punish it.'
    ],
    repeatBetter: ['This position has now appeared twice. A third time is a draw, and you are better: change course.'],
    repeatWorse: ['This position has appeared twice. A third time is a draw, which would suit you here.'],
    fifty: ['{k} moves left before the fifty-move rule: a capture or a pawn move resets the count.'],
    stalemate: ['Careful: {who} has almost no moves left. Leave the king a square, or it is stalemate.'],
    calm: [
      'No immediate threats. {tip}',
      'All quiet. {tip}'
    ]
  },

  // quiet-moment tips: the opening's in the order its jobs come, then by phase
  tips: {
    centre: [
      'Fight for the centre: e4, d4, e5 and d5 are worth more than the edges.',
      'Start in the middle: a pawn on e4 or d4 opens lines for the pieces behind it.'
    ],
    develop: [
      'Develop a piece you have not moved yet.',
      'Knights and bishops first; the queen can wait.'
    ],
    castle: [
      'Get your king castled before the centre opens.',
      'The pieces are out; now tuck the king away.'
    ],
    middlegame: [
      'Find your least active piece and give it a job.',
      'Make a plan: which side of the board is yours?',
      'Before you move, check what your opponent wants to do next.'
    ],
    middlegameRook: [
      'There is an open file on the board. A rook wants it.',
      'Look for the open file and put a rook on it.'
    ],
    endgameMate: [
      'Drive the lone king to the edge, then bring your own king up to help: the mate needs both.',
      'Box the king in a little more with each move, and leave it a square until the mate is there.'
    ],
    endgameKing: [
      'Bring the king toward the centre: in the endgame it fights.',
      'The king is a fighting piece now. March it toward the middle.'
    ],
    endgameRook: [
      'Rooks belong behind passed pawns, yours or theirs.',
      'Passed pawns are the story now. Put a rook behind one.'
    ],
    endgamePasser: [
      'Passed pawns are the story now. Push yours, stop theirs.',
      'A passed pawn is a candidate for a queen. Escort yours; blockade theirs.'
    ],
    endgame: [
      'With few pieces left, count the tempi: whose king gets there first?',
      'Make a pawn break and give the position a passed pawn.'
    ]
  },

  // your own habits in the opening, each said at most once a game
  habit: {
    movedTwice: [
      'That is the {piece}\'s {nth} move, and {k} of your minor pieces are still at home. In the opening, every move should wake a new piece.',
      'The same {piece} again. Meanwhile {k} minor pieces are waiting; give them a turn.'
    ],
    earlyQueen: [
      'The queen is out early. She can be chased with gain of tempo; knights and bishops first.',
      'An early queen invites attacks that develop your opponent. Bring the minor pieces out before her.'
    ],
    kingWalk: [
      'The king stepped off its square, and the right to castle went with it. In the opening, kings stay behind their pawns.'
    ],
    notCastled: [
      'Move {move} and the king is still in the middle. Castling connects the rooks and takes the king out of the line of fire.',
      'The king has not castled yet. Once the centre opens, that gets expensive.'
    ],
    castled: [
      'Castled. The king has a shelter and the rooks can find each other.',
      'King safe, rooks connected. That is the opening\'s first job done.'
    ],
    bookDubious: [
      '{san} is a known line ({opening}), but the engine does not trust it.',
      'This is the {opening}, a known line, but the engine finds a hole in it.'
    ],
    developed: [
      'All four minor pieces are out by move {move}. That is the opening done properly.',
      'Every minor piece is in play. Now the plans begin.'
    ]
  },

  // the hint, one step at a time: a nudge, then the piece, then the move
  hint: {
    mate: ['There is a forced mate here. Start with checks.', 'Mate is on the board. Look at every check.'],
    winMat: ['Something can be won here. Look at captures and double attacks.', 'Material is on offer. Count attackers and defenders.'],
    capture: ['There is a capture that works. Count the defenders before you take.', 'Look at the captures first.'],
    check: ['A check helps you here.', 'Look at your checks.'],
    attack: ['Look for a move that creates a threat.', 'Go on the offensive: which of their pieces is short of defenders?'],
    discover: ['One of your pieces can step aside and reveal an attack.', 'Look behind your pieces: a line is waiting to open.'],
    trap: ['One of their pieces is short of squares.', 'Something of theirs has nowhere safe to go.'],
    defend: ['Something of yours needs looking after.', 'Defence first: what is your opponent threatening?'],
    castle: ['Your king wants a shelter.', 'Think about the king before anything else.'],
    develop: ['Bring another piece into the game.', 'One of your pieces has not joined the fight yet.'],
    quiet: ['No tactic is needed. Improve your worst-placed piece.', 'A quiet, useful move. Which piece does the least right now?'],
    piece: ['The {piece} on {sq} has the move.', 'Look at your {piece} on {sq}.'],
    move: ['{san}: it {why}.', 'Play {san}. It {why}.'],
    move_plain: ['The engine plays {san}.']
  },

  // the game is over
  end: {
    accuracy: ['Accuracy {acc}: {counts}.', '{acc} accuracy, with {counts}.'],
    accuracySide: ['{who}: {acc} accuracy, {counts}.'],
    turn: ['The game turned at {move}, which gave up {loss} of the expected score.', 'The turning point: {move} ({loss} of the expected score).'],
    clean: ['Not one mistake: a clean game.'],
    win: ['{result} Well played: the last blow landed.', '{result} A clean finish.'],
    loss: ['{result} Step back through the moves marked ? and ?? in the move list: that is where it turned.', '{result} Every loss leaves a lesson in the move list; the marks show where.'],
    draw: ['{result} Half a point, earned.', '{result}'],
    resigned: ['{result} Resigning is part of the game. Review the marked moves and play again.']
  },

  // house maxims, by the kind of lesson: one may close a lesson, never two in a row
  maxims: {
    tactics: [
      'Aim twice, shoot once: look at every capture and check before you move.',
      'Checks, captures, threats: for both sides, every move.',
      'A loose piece is a target waiting for a tempo.',
      'Count the attackers and defenders before you capture.'
    ],
    opening: [
      'In the opening, every move should wake a new piece.',
      'Castle before the storm, not during it.',
      'Aim twice, shoot once: look at every capture and check before you move.'
    ],
    middlegame: [
      'Checks, captures, threats: for both sides, every move.',
      'Rooks want open files; give them one.',
      'A knight on the edge covers half the squares it could.',
      'Ahead in material, trade pieces. Behind, keep them on.'
    ],
    endgame: [
      'In the endgame the king is a fighting piece.',
      'Ahead in material, trade pieces. Behind, keep them on.'
    ]
  },

  // ordinals and material, so the slots read as English
  NTH: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'],
  MATERIAL: { p: 'a pawn', pp: 'two pawns', ppp: 'three pawns', n: 'a knight', b: 'a bishop', r: 'a rook', q: 'the queen', x: 'the exchange', piece: 'a piece', pieceP: 'a piece and a pawn' }
};
if (typeof module !== 'undefined') module.exports = COACH_VOICE;
