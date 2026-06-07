import { RULE_TYPES } from './ruleTypes';

export const specialRules = [
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
];
