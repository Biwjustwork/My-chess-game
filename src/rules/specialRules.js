import { RULE_TYPES } from './ruleTypes';

export const specialRules = [
  {
    id: 'teleportation',
    name: 'Teleportation',
    description: 'Instead of moving normally, a player can teleport one of their pieces to a RANDOM square! It can even land on and capture enemy pieces (except the King).',
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
    id: 'freeze',
    name: 'Freeze',
    description: 'A random piece from each side (except Kings) is frozen in ice for 1-3 turns and cannot move!',
    type: RULE_TYPES.SPECIAL,
    icon: '❄️',
    affectedPieces: ['all'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, freeze: true } };
    },
    revert: (gameState) => {
      const { freeze, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
  },
  {
    id: 'betrayal',
    name: 'Betrayal (การสลับฝั่ง)',
    description: 'Take control of a random enemy minor piece (Pawn, Knight, or Bishop) for 3 turns. When it expires, it reverts back!',
    type: RULE_TYPES.SPECIAL,
    icon: '🎭',
    affectedPieces: ['p', 'n', 'b'],
    apply: (gameState) => {
      return { ...gameState, activeModifiers: { ...gameState.activeModifiers, betrayal: true } };
    },
    revert: (gameState) => {
      const { betrayal, ...rest } = gameState.activeModifiers;
      return { ...gameState, activeModifiers: rest };
    },
  },
];
