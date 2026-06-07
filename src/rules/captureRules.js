import { RULE_TYPES } from './ruleTypes';

export const captureRules = [
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
];
