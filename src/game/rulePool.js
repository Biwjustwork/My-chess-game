/**
 * rulePool.js
 * A dictionary of all possible randomized special rules for Chaos Chess.
 * Each rule defines its metadata and how it modifies standard chess behavior.
 */

const RULE_TYPES = {
  MOVEMENT: 'MOVEMENT',
  CAPTURE: 'CAPTURE',
  SPECIAL: 'SPECIAL',
  BOARD: 'BOARD',
};

const rulePool = [
  {
    id: 'reverse_pawns',
    name: 'Reverse Pawns',
    description: 'Pawns can move one square backward (toward their own starting rank).',
    type: RULE_TYPES.MOVEMENT,
    icon: '🔄',
    affectedPieces: ['p'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, reversePawns: true } };
    },
    revert: (gameState) => {
      const { reversePawns, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
    // Returns extra moves allowed by this rule for a given piece
    getExtraMoves: (square, piece, board) => {
      if (piece.type !== 'p') return [];
      const file = square.charCodeAt(0); // a=97
      const rank = parseInt(square[1]);
      const extraMoves = [];

      // Backward for white is decreasing rank, for black is increasing rank
      if (piece.color === 'w' && rank > 1) {
        const targetSquare = String.fromCharCode(file) + (rank - 1);
        // Check if square is empty
        const targetPiece = board.get(targetSquare);
        if (!targetPiece) {
          extraMoves.push({ from: square, to: targetSquare });
        }
      } else if (piece.color === 'b' && rank < 8) {
        const targetSquare = String.fromCharCode(file) + (rank + 1);
        const targetPiece = board.get(targetSquare);
        if (!targetPiece) {
          extraMoves.push({ from: square, to: targetSquare });
        }
      }
      return extraMoves;
    },
  },
  {
    id: 'explosive_captures',
    name: 'Explosive Captures',
    description: 'When a piece is captured, all pieces on adjacent squares (3×3 grid) are also removed — except Kings!',
    type: RULE_TYPES.CAPTURE,
    icon: '💥',
    affectedPieces: ['all'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, explosiveCaptures: true } };
    },
    revert: (gameState) => {
      const { explosiveCaptures, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
    // Returns adjacent squares in 3x3 grid
    getExplosionSquares: (square) => {
      const file = square.charCodeAt(0);
      const rank = parseInt(square[1]);
      const squares = [];
      for (let f = file - 1; f <= file + 1; f++) {
        for (let r = rank - 1; r <= rank + 1; r++) {
          if (f >= 97 && f <= 104 && r >= 1 && r <= 8) {
            const sq = String.fromCharCode(f) + r;
            if (sq !== square) {
              squares.push(sq);
            }
          }
        }
      }
      return squares;
    },
  },
  {
    id: 'knights_frenzy',
    name: "Knight's Frenzy",
    description: 'Knights can move TWICE in a single turn! After moving a Knight, you may move it again.',
    type: RULE_TYPES.MOVEMENT,
    icon: '🐴',
    affectedPieces: ['n'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, knightsFrenzy: true } };
    },
    revert: (gameState) => {
      const { knightsFrenzy, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
  },
  {
    id: 'teleportation',
    name: 'Teleportation',
    description: 'Instead of moving normally, a player can teleport one of their pieces to ANY empty square (costs a turn).',
    type: RULE_TYPES.SPECIAL,
    icon: '✨',
    affectedPieces: ['all'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, teleportation: true } };
    },
    revert: (gameState) => {
      const { teleportation, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
    getEmptySquares: (board) => {
      const emptySquares = [];
      for (let file = 0; file < 8; file++) {
        for (let rank = 1; rank <= 8; rank++) {
          const square = String.fromCharCode(97 + file) + rank;
          if (!board.get(square)) {
            emptySquares.push(square);
          }
        }
      }
      return emptySquares;
    },
  },
  {
    id: 'fortress_king',
    name: 'Fortress King',
    description: 'The King gains the ability to move like a Knight for this phase!',
    type: RULE_TYPES.MOVEMENT,
    icon: '🏰',
    affectedPieces: ['k'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, fortressKing: true } };
    },
    revert: (gameState) => {
      const { fortressKing, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
    getExtraMoves: (square, piece, board) => {
      if (piece.type !== 'k') return [];
      const file = square.charCodeAt(0);
      const rank = parseInt(square[1]);
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      const extraMoves = [];
      for (const [df, dr] of knightOffsets) {
        const nf = file + df;
        const nr = rank + dr;
        if (nf >= 97 && nf <= 104 && nr >= 1 && nr <= 8) {
          const targetSquare = String.fromCharCode(nf) + nr;
          const targetPiece = board.get(targetSquare);
          if (!targetPiece || targetPiece.color !== piece.color) {
            extraMoves.push({ from: square, to: targetSquare });
          }
        }
      }
      return extraMoves;
    },
  },
  {
    id: 'shield_wall',
    name: 'Shield Wall',
    description: 'Pawns become invincible — they cannot be captured this phase!',
    type: RULE_TYPES.CAPTURE,
    icon: '🛡️',
    affectedPieces: ['p'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, shieldWall: true } };
    },
    revert: (gameState) => {
      const { shieldWall, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
  },
  {
    id: 'bishop_surge',
    name: 'Bishop Surge',
    description: 'Bishops can also move one square orthogonally (like a mini-Queen)!',
    type: RULE_TYPES.MOVEMENT,
    icon: '⚡',
    affectedPieces: ['b'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, bishopSurge: true } };
    },
    revert: (gameState) => {
      const { bishopSurge, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
    getExtraMoves: (square, piece, board) => {
      if (piece.type !== 'b') return [];
      const file = square.charCodeAt(0);
      const rank = parseInt(square[1]);
      const orthogonalOffsets = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      const extraMoves = [];
      for (const [df, dr] of orthogonalOffsets) {
        const nf = file + df;
        const nr = rank + dr;
        if (nf >= 97 && nf <= 104 && nr >= 1 && nr <= 8) {
          const targetSquare = String.fromCharCode(nf) + nr;
          const targetPiece = board.get(targetSquare);
          if (!targetPiece || targetPiece.color !== piece.color) {
            extraMoves.push({ from: square, to: targetSquare });
          }
        }
      }
      return extraMoves;
    },
  },
  {
    id: 'phantom_rook',
    name: 'Phantom Rook',
    description: 'Rooks can jump over exactly one piece in their path, like a cannon!',
    type: RULE_TYPES.MOVEMENT,
    icon: '👻',
    affectedPieces: ['r'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, phantomRook: true } };
    },
    revert: (gameState) => {
      const { phantomRook, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
  },
];

/**
 * Get a random rule from the pool, optionally excluding already active rule IDs
 * @param {string[]} excludeIds - IDs of rules already active
 * @returns {object} A random rule object
 */
export function getRandomRule(excludeIds = []) {
  const available = rulePool.filter((r) => !excludeIds.includes(r.id));
  if (available.length === 0) {
    // If all rules have been used, allow repeats
    return rulePool[Math.floor(Math.random() * rulePool.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export { RULE_TYPES };
export default rulePool;
