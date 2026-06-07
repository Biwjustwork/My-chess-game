import { setupGame } from './initialGameState';
import {
  selectSquare,
  makeMove,
  completeSecondMove,
  teleportPiece,
  toggleTeleportMode,
  promote,
  selectDraftedRule,
  clearNewRule,
  resetGame,
} from './playerActions';
import { getAllValidMoves } from './chessMoveHelpers';

const ChaosChess = {
  name: 'chaos-chess',

  setup: () => setupGame(),

  moves: {
    selectSquare,
    makeMove,
    completeSecondMove,
    teleportPiece,
    toggleTeleportMode,
    promote,
    selectDraftedRule,
    clearNewRule,
    resetGame,
  },

  endIf: ({ G }) => {
    if (G.gameStatus === 'checkmate') {
      return { winner: G.currentPlayer === 'w' ? '1' : '0' };
    }
    if (G.gameStatus === 'draw' || G.gameStatus === 'stalemate') {
      return { draw: true };
    }
  },

  turn: {
    minMoves: 0,
    maxMoves: 3, // For Knight's Frenzy double moves
  },
};

export { getAllValidMoves };
export default ChaosChess;
