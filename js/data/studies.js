/*
✒ Metadata
    - Title: Studies Dataset (MONOLITH Edition - v1.2)
    - File Name: studies.js
    - Relative Path: js/data/studies.js
    - Artifact Type: data
    - Version: 1.2.0
    - Date: 10/30/2026
    - Update: Friday, October 30, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.2.0 (10/30/2026) [dendogg + Anthropic - Claude Opus 5.5] — A free
      study may set vs: 'both' to be played as a game where you move both
      sides; the Castling drill does.
    - 1.1.1 (10/24/2026) [dendogg + Anthropic - Claude Opus 5.5] — Renamed
      with the project: Wizard's Chess is now MONOLITH, the name Dennis
      chose, and this header names the page by its file in the repository,
      index.html.
    - 1.1.0 (10/23/2026) [dendogg + Anthropic - Claude Opus 5.5] — From
      the release audit Dennis asked for: heldUnchecked, said when a hold
      study's checkpoint gets no verdict from the engine (before, such a
      check counted as a held draw without saying so).
    Earlier entries: see CHANGELOG.md (moved entries)

✒ Description:
    The Position tab's 18 studies: puzzles, practice games and set-ups, each
    a position with a goal, every one checked with Stockfish 19 before it
    went in. STUDIES.md documents the schema and the checks.

✒ Key Features:
    - Five categories: basic mates, mating patterns, tactics, endgames and
      set-ups.
    - Modes puzzle, practice and free; goals line, mate, promote and hold.
      A free study with vs: 'both' is played as both sides on one screen.
    - Pars for the mate drills (Stockfish's quickest mate) and checkpoints
      for the holds.
    - Ideas, graded hints and Grimoire links for each study.
    - TEXT: the page's own sentences about a study in progress.

✒ Usage Instructions:
    Loaded by index.html as a classic script before js/main.js, so STUDIES
    is a global when the modules run. Node tools read it with require():
        const STUDIES = require('./js/data/studies.js');
        Check it with: node tools/verify-studies.mjs

✒ Other Important Information:
    - Dependencies: none.
    - Compatible platforms: current browsers as a classic script (it defines
      a global), and Node.js 18 or newer through require().
    - Reference: STUDIES.md.
---------
*/
/* ---------- STUDIES: the Position tab's lessons ----------
   A Position sidebar with insightful learning components. Each
   study is a position with a goal; every one was checked with Stockfish 19 (the vendored build,
   run under Node) before it went in: in a puzzle each of your moves is the engine's unique best
   and each reply its best defence; in a practice game the evaluation matches the goal (a win to
   take, a draw to hold). STUDIES.md documents the schema, the checks and how to add a study.

   Fields: id; cat (mates, patterns, tactics, endgames, setups); title; level (1 to 3); fen;
   side (the side you play); mode: 'puzzle' (find the moves; the replies come from `line`),
   'practice' (play it out against Stockfish at full strength) or 'free' (load it with your own
   game settings, or with vs: 'both' as a game where you move both sides); goal: 'mate',
   'promote' (queen a pawn the opponent cannot take at once),
   'hold' (a draw by the rules, or `moves` of your moves with the engine still seeing a draw) or
   'line' (play the puzzle's line); line: the puzzle's moves in long algebraic, yours and the
   replies in turn (with goal 'mate' the last move may be any mate); par: Stockfish's quickest
   mate (go mate finds it and nothing shorter), for a mate drill; moves: the moves to hold, for a hold; task: the goal in one line; idea: the
   lesson; hints: given one at a time; read: Grimoire ids to read about. Plain text throughout.
   TEXT holds the page's own sentences about a study in progress, with {slots} as in
   COACH_VOICE. */
const STUDIES = {
  cats: [['all', 'All'], ['mates', 'Basic mates'], ['patterns', 'Mating patterns'], ['tactics', 'Tactics'], ['endgames', 'Endgames'], ['setups', 'Set-ups']],
  list: [
    { id: 'queen-mate', cat: 'mates', title: 'Queen and king against king', level: 1, fen: '8/8/8/3k4/8/8/8/Q3K3 w - - 0 1', side: 'w', mode: 'practice', goal: 'mate', par: 8,
      task: 'White to move. Mate the lone king.',
      idea: 'The queen alone can drive the king to the edge, but it cannot mate without help. Keep the queen a knight\'s move from the enemy king, so that every move shrinks its box without giving check; once the king is on the edge, bring your own king up and mate there.',
      hints: ['Put the queen a knight\'s move away from the black king: it takes squares without checking.', 'When the king is stuck on the edge, stop shrinking the box and walk your king toward it.', 'The mate comes with the queen on the edge, guarded by your king. Until then, leave the black king a square, or it is stalemate.'],
      read: ['checkmate', 'stalemate', 'endgame'] },
    { id: 'rook-mate', cat: 'mates', title: 'Rook and king against king', level: 2, fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1', side: 'w', mode: 'practice', goal: 'mate', par: 14,
      task: 'White to move. Mate with king and rook.',
      idea: 'The rook cuts the board along a rank or a file, and the king supports it. Shrink the box one line at a time: when the two kings face each other, the rook checks and the king must step back a line; when they do not, make a waiting move with the rook.',
      hints: ['Cut the black king off with the rook along a rank or a file.', 'Bring your king up until the two kings face each other with one square between them.', 'With the kings face to face, check with the rook: the king has to give way. On the edge, that check is mate.'],
      read: ['checkmate', 'opposition', 'endgame'] },
    { id: 'ladder-mate', cat: 'mates', title: 'Two rooks: the ladder', level: 1, fen: '8/8/3k4/8/8/8/8/R3K2R w - - 0 1', side: 'w', mode: 'practice', goal: 'mate', par: 5,
      task: 'White to move. Mate with the two rooks.',
      idea: 'Two rooks mate without the king\'s help. One rook holds a line, the other checks on the next one, and they climb toward the edge like the rungs of a ladder. Keep them far from the black king, so that it cannot attack them.',
      hints: ['One rook guards a rank; the other checks on the rank beyond it.', 'If the king walks up to a rook, move that rook to the far side of the board and carry on.'],
      read: ['checkmate', 'endgame'] },
    { id: 'back-rank', cat: 'patterns', title: 'Back-rank mate', level: 1, fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', side: 'w', mode: 'puzzle', goal: 'mate', line: ['a1a8'],
      task: 'White to move. Mate in one.',
      idea: 'A king behind its own unmoved pawns has no air. A rook or a queen on the back rank mates it, and nothing can step in between.',
      hints: ['Look at the black king\'s escape squares: its own pawns stand on them.'],
      read: ['back-rank-mate', 'checkmate'] },
    { id: 'back-rank-deflection', cat: 'patterns', title: 'Back rank: remove the guard', level: 2, fen: '2qr2k1/5ppp/8/8/8/8/3Q1PPP/3R2K1 w - - 0 1', side: 'w', mode: 'puzzle', goal: 'mate', line: ['d2d8', 'c8d8', 'd1d8'],
      task: 'White to move. Mate in two.',
      idea: 'The rook on d8 is all that guards Black\'s back rank, and the queen beside it is its only defender. Offer the rook something it must take, and the rank opens.',
      hints: ['The d-file holds two of your pieces against one of Black\'s.', 'Start with the queen, and expect to lose her.'],
      read: ['back-rank-mate', 'sacrifice', 'checkmate'] },
    { id: 'smothered', cat: 'patterns', title: 'Smothered mate', level: 2, fen: '5r1k/pp4pp/8/q2Q2N1/2B5/8/5PPP/6K1 w - - 0 1', side: 'w', mode: 'puzzle', goal: 'mate', line: ['d5g8', 'f8g8', 'g5f7'],
      task: 'White to move. Mate in two.',
      idea: 'A king walled in by its own pieces can be mated by a single knight. Here the queen forces a black rook onto the last free square beside the king, and the knight does the rest.',
      hints: ['Which square beside the black king is still empty, and what guards it?', 'The queen can go there with check, and the bishop on c4 stands behind her.'],
      read: ['smothered-mate', 'sacrifice', 'checkmate'] },
    { id: 'double-check', cat: 'patterns', title: 'Réti – Tartakower, Vienna 1910', level: 3, fen: 'rnb1kb1r/pp3ppp/2p5/4q3/4n3/3Q4/PPPB1PPP/2KR1BNR w kq - 0 9', side: 'w', mode: 'puzzle', goal: 'mate', line: ['d3d8', 'e8d8', 'd2g5', 'd8c7', 'g5d8'],
      task: 'White to move. Mate in three.',
      idea: 'A double check can only be answered by a king move. Réti gave his queen to draw the king onto d8, where the bishop and the rook on d1 then checked it at once.',
      hints: ['Your rook already watches the d-file, and the black king is one step from it.', 'Bring the king to d8 at any price, then move the bishop with check so the rook checks too.'],
      read: ['double-check', 'discovered-attack', 'sacrifice'] },
    { id: 'royal-fork', cat: 'tactics', title: 'The knight fork', level: 1, fen: 'r3k3/pp3ppp/8/3N4/8/8/PPP2PPP/4K3 w - - 0 1', side: 'w', mode: 'puzzle', goal: 'line', line: ['d5c7', 'e8d7', 'c7a8'],
      task: 'White to move. Win material.',
      idea: 'A knight attacks squares that no other piece covers in the same move. Check the king and attack the rook with one jump, and the rook falls.',
      hints: ['Find the square from which a knight attacks both e8 and a8.'],
      read: ['fork', 'check'] },
    { id: 'pin-queen', cat: 'tactics', title: 'Pin the queen to the king', level: 1, fen: '4k2r/pp1q1ppp/8/8/P7/5N2/1PP2PPP/2R2BK1 w - - 0 1', side: 'w', mode: 'puzzle', goal: 'line', line: ['f1b5'],
      task: 'White to move. Win the queen.',
      idea: 'A piece in front of its own king cannot leave the line it stands on. Line the queen up with the king on a diagonal, and she is lost for a bishop.',
      hints: ['The black queen and king share a diagonal.', 'Your bishop can reach it, and the pawn on a4 guards the square.'],
      read: ['pin', 'material'] },
    { id: 'skewer', cat: 'tactics', title: 'Skewer on the long diagonal', level: 2, fen: 'r7/p4p2/2k5/8/8/8/5PPP/1B4K1 w - - 0 1', side: 'w', mode: 'puzzle', goal: 'line', line: ['b1e4', 'c6d6', 'e4a8'],
      task: 'White to move. Win the rook.',
      idea: 'A skewer is a pin turned around: the valuable piece stands in front, must move, and uncovers the one behind it. Check the king along the long diagonal and the rook on a8 hangs behind it.',
      hints: ['The black king and rook share a diagonal.', 'Check first: the king has to step off the line.'],
      read: ['skewer', 'check'] },
    { id: 'discovered', cat: 'tactics', title: 'Discovered check', level: 2, fen: '8/3pkpp1/7p/6q1/4N3/8/5PPP/4R1K1 w - - 0 1', side: 'w', mode: 'puzzle', goal: 'line', line: ['e4g5'],
      task: 'White to move. Win the queen.',
      idea: 'When a piece steps out of a line, the piece behind it attacks. Move the knight with a capture and let the rook behind it give check: the opponent must answer the check and has no time to recapture.',
      hints: ['Your rook on e1 is aimed at the black king, with your own knight in the way.', 'Where can the knight go that matters most?'],
      read: ['discovered-attack', 'check'] },
    { id: 'king-leads', cat: 'endgames', title: 'King and pawn: the king leads', level: 2, fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', side: 'w', mode: 'practice', goal: 'promote',
      task: 'White to move. Queen the pawn.',
      idea: 'With your king in front of its pawn on the sixth rank, the pawn queens whatever Black does, as long as the king leads and the pawn follows. Push too early and the black king blocks it; step back and the win is gone.',
      hints: ['Do not push the pawn yet. Step the king to d6 or f6, beside the pawn\'s path.', 'Push when your king guards the square in front of the pawn.', 'With the pawn on e7, your king must cover e8: d7 or f7 does it.'],
      read: ['opposition', 'promotion', 'endgame'] },
    { id: 'hold-opposition', cat: 'endgames', title: 'King and pawn: hold the draw', level: 2, fen: '8/8/4k3/8/4K3/4P3/8/8 w - - 0 1', side: 'b', mode: 'practice', goal: 'hold', moves: 12,
      task: 'You play Black. White moves first: keep the draw.',
      idea: 'Against king and pawn, the defending king draws by standing in front of the pawn and keeping the opposition: when the kings face each other with one square between, the side to move must give way. As the pawn advances, step straight back toward its queening square.',
      hints: ['Keep your king directly in front of the white king when you can: that is the opposition.', 'When White\'s king steps aside, step to the same side; when the pawn comes up, step straight back.', 'On the last rank, keep the king in front of the pawn: White can only stalemate you or let the pawn go.'],
      read: ['opposition', 'draw', 'endgame'] },
    { id: 'square', cat: 'endgames', title: 'The square of the pawn', level: 1, fen: '8/8/8/5k2/P7/8/8/7K b - - 0 1', side: 'b', mode: 'practice', goal: 'hold', moves: 8,
      task: 'Black to move. Catch the pawn.',
      idea: 'Draw a square from the pawn to its queening rank. If your king can step into it, it catches the pawn. Here the square runs from a4 to e8, and the king on f5 is one step outside it.',
      hints: ['The pawn needs four moves to queen. Count yours.', 'Go toward the a-file and the eighth rank at once: e4, e5 and e6 all enter the square.'],
      read: ['promotion', 'endgame'] },
    { id: 'lucena', cat: 'endgames', title: 'Lucena position', level: 3, fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1', side: 'w', mode: 'practice', goal: 'promote',
      task: 'White to move. Queen the pawn and keep the queen.',
      idea: 'The Lucena position is the winning rook ending every player should know. Your king is stuck in front of the pawn and the black rook checks it from the side. Push the black king a file further away, then build a bridge: a rook on the fourth rank shields your king from the checks as it comes out.',
      hints: ['First check on the d-file, to drive the black king one more file away.', 'Then lift the rook to the fourth rank: Rd4.', 'Walk the king out toward the rook. When the checks run out, the rook blocks the last one.'],
      read: ['lucena-position', 'promotion', 'endgame'] },
    { id: 'philidor', cat: 'endgames', title: 'Philidor position', level: 3, fen: '4k3/7R/1r6/3KP3/8/8/8/8 w - - 0 1', side: 'b', mode: 'practice', goal: 'hold', moves: 12,
      task: 'You play Black. White moves first: keep the draw.',
      idea: 'The Philidor position is the defender\'s answer to rook and pawn. Keep your rook on the sixth rank so the white king cannot come forward. Once the pawn steps onto the sixth, the king has lost its shelter: take the rook to the far end and check it from behind.',
      hints: ['While the pawn is on the fifth rank, keep the rook on the sixth (b6, c6, a6).', 'When the pawn moves to e6, take the rook to the first rank.', 'Then check from behind, again and again. The white king has nowhere to hide.'],
      read: ['philidor-position', 'draw', 'endgame'] },
    { id: 'start', cat: 'setups', title: 'Starting position', level: 1, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', side: 'w', mode: 'free', goal: null,
      task: 'A normal game from move one, with your game settings.',
      idea: 'Every game starts here. Fight for the centre, bring out the knights and bishops, and castle before the centre opens.',
      hints: [], read: ['opening', 'development', 'centre'] },
    { id: 'castling-drill', cat: 'setups', title: 'Castling drill', level: 1, fen: 'r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NPBN2/PPPQ1PPP/R3K2R w KQkq - 0 1', side: 'w', mode: 'free', goal: null, vs: 'both',
      task: 'Both sides can castle either way; you move both.',
      idea: 'Try O-O and O-O-O for both colours. Click the king, then its target square or the rook; the chip on the board names the squares, and lanes mark the path.',
      hints: [], read: ['castling', 'castling-notation', 'king-safety'] }
  ],
  TEXT: {
    yourMove: ['Your move.', 'Your move. Take your time.'],
    theirMove: ['The reply is coming.'],
    right: ['Right. Keep going.', 'That is the move. What now?', 'Correct. The next one is yours.'],
    wrong: ['Not this one: {san} is taken back. Try again.', '{san} does not do it. It is taken back; look again.'],
    solvedLine: ['Solved: {line}', 'Solved, and on the first try: {line}'],
    solvedTries: ['Solved after {tries}: {line}'],
    solvedShown: ['Done, with the solution shown: {line}'],
    mated: ['Mate in {n}. Stockfish\'s quickest mate from here takes {par}.', 'Mate in {n} moves; Stockfish mates in {par}.'],
    matedPar: ['Mate in {n}: as quick as Stockfish\'s best.'],
    promoted: ['The pawn queens and the queen is safe. The rest is technique.'],
    held: ['Held for {n} moves, and the engine still sees a draw.'],
    drawn: ['{result} The draw is yours.'],
    failDraw: ['{result} The win slipped away; restart and try again.'],
    failPawn: ['The pawn is gone, and the win with it. Restart and try again.'],
    failQueened: ['The pawn queened. Restart and try again.'],
    failLost: ['{result} Restart and try again.'],
    failSlipped: ['After {n} moves the engine sees a win for {who}: the draw slipped away.'],
    checking: ['{n} moves held. Checking the position with the engine…'],
    heldNoEngine: ['Held for {n} moves. (The engine could not start here to confirm the draw.)'],
    heldUnchecked: ['Held for {n} moves. (The engine gave no verdict this time, so the draw is not confirmed.)']
  }
};
if (typeof module !== 'undefined') module.exports = STUDIES;
