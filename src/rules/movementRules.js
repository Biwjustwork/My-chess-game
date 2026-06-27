import { RULE_TYPES } from './ruleTypes';

export const movementRules = [
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
      if (piece.color === 'w' && rank > 2) {
        const targetSquare = String.fromCharCode(file) + (rank - 1);
        // Check if square is empty
        const targetPiece = board.get(targetSquare);
        if (!targetPiece) {
          extraMoves.push({ from: square, to: targetSquare, isExtra: true, shouldEndTurn: true });
        }
      } else if (piece.color === 'b' && rank < 7) {
        const targetSquare = String.fromCharCode(file) + (rank + 1);
        const targetPiece = board.get(targetSquare);
        if (!targetPiece) {
          extraMoves.push({ from: square, to: targetSquare, isExtra: true, shouldEndTurn: true });
        }
      }
      return extraMoves;
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
            extraMoves.push({ from: square, to: targetSquare, isExtra: true, shouldEndTurn: true });
          }
        }
      }
      return extraMoves;
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
            extraMoves.push({ from: square, to: targetSquare, isExtra: true, shouldEndTurn: true });
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
    getExtraMoves: (square, piece, board) => {
      if (piece.type !== 'r') return [];
      const file = square.charCodeAt(0);
      const rank = parseInt(square[1]);
      const orthogonalOffsets = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      const extraMoves = [];

      for (const [df, dr] of orthogonalOffsets) {
        let nf = file;
        let nr = rank;
        let piecesJumped = 0;

        while (true) {
          nf += df;
          nr += dr;
          if (nf < 97 || nf > 104 || nr < 1 || nr > 8) break;

          const targetSquare = String.fromCharCode(nf) + nr;
          const targetPiece = board.get(targetSquare);

          if (targetPiece) {
            piecesJumped++;
            if (piecesJumped > 1) {
              break; // Cannot jump over more than 1 piece
            }
          } else {
            if (piecesJumped === 1) {
              // Valid empty square after jumping exactly 1 piece
              // Note: Cannot capture immediately after jumping since targetPiece must be empty here
              extraMoves.push({ from: square, to: targetSquare, isExtra: true, shouldEndTurn: true });
            }
          }
        }
      }
      return extraMoves;
    },
  },
];
