import { Chess } from 'chess.js';
import { initRulesEngine } from './rulesEngine';

/**
 * Build the initial game state
 */
export function setupGame() {
  const chess = new Chess();
  return {
    fen: chess.fen(),
    pgn: '',
    board: chess.board(),
    turnCount: 0,
    currentPlayer: 'w',
    rulesEngine: initRulesEngine(),
    gameStatus: 'playing', // 'playing' | 'check' | 'checkmate' | 'draw' | 'stalemate'
    chaosEscapeAvailable: false,
    lastMove: null,
    capturedPieces: { w: [], b: [] },
    moveHistory: [],
    newRuleDrawn: null,     // Set when a new rule is drawn, cleared after display
    isDraftingRule: false,
    draftedRules: [],
    isPromoting: false,
    promotionMove: null,
    selectedSquare: null,
    validMoves: [],
    explosionSquares: [],   // Squares affected by explosive capture
  };
}
