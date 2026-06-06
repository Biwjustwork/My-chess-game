/**
 * Game.js
 * Main Boardgame.io game configuration for Chaos Chess.
 * Integrates chess.js for standard rules with our custom RulesEngine
 * for the dynamic randomized rule system.
 */

import { Chess } from 'chess.js';
import {
  initRulesEngine,
  shouldDrawNewRule,
  drawNewRule,
  tickTurnCounter,
  validateMoveWithRules,
  getExtraMovesFromRules,
  applyPostMoveEffects,
  isValidTeleportation,
  TURNS_PER_RULE_CHANGE,
} from './RulesEngine';

/**
 * Build the initial game state
 */
function setupGame() {
  const chess = new Chess();
  return {
    fen: chess.fen(),
    pgn: '',
    board: chess.board(),
    turnCount: 0,
    currentPlayer: 'w',
    rulesEngine: initRulesEngine(),
    gameStatus: 'playing', // 'playing' | 'check' | 'checkmate' | 'draw' | 'stalemate'
    lastMove: null,
    capturedPieces: { w: [], b: [] },
    moveHistory: [],
    newRuleDrawn: null,     // Set when a new rule is drawn, cleared after display
    isPromoting: false,
    promotionMove: null,
    selectedSquare: null,
    validMoves: [],
    explosionSquares: [],   // Squares affected by explosive capture
  };
}

/**
 * Get all valid moves for a piece, including extra moves from special rules
 */
function getAllValidMoves(G, square) {
  const chess = new Chess(G.fen);
  const piece = chess.get(square);

  if (!piece) return [];

  // Get standard chess.js legal moves
  let moves = chess.moves({ square, verbose: true });

  // Filter out moves blocked by rules (e.g., Shield Wall)
  moves = moves.filter((move) => {
    const result = validateMoveWithRules(move, G.rulesEngine, chess);
    return result.valid;
  });

  // Add extra moves from active rules
  const extraMoves = getExtraMovesFromRules(square, G.rulesEngine, chess);
  // Filter extra moves that also pass rule validation
  const validExtraMoves = extraMoves.filter((m) => {
    const result = validateMoveWithRules(m, G.rulesEngine, chess);
    return result.valid;
  });

  return [...moves.map((m) => ({ from: m.from, to: m.to, promotion: m.promotion, flags: m.flags })), ...validExtraMoves];
}

/**
 * The main Chaos Chess game definition for boardgame.io
 */
const ChaosChess = {
  name: 'chaos-chess',

  setup: () => setupGame(),

  moves: {
    /**
     * Select a square on the board
     */
    selectSquare: ({ G, playerID }, square) => {
      const chess = new Chess(G.fen);
      const currentColor = G.currentPlayer;
      const piece = chess.get(square);

      // If we have a selected piece and clicked a valid move target
      if (G.selectedSquare && G.validMoves.some((m) => m.to === square)) {
        // This is a move attempt — delegate to makeMove
        return; // handled by makeMove
      }

      // Select a new piece
      if (piece && piece.color === currentColor) {
        const validMoves = getAllValidMoves(G, square);
        G.selectedSquare = square;
        G.validMoves = validMoves;
      } else {
        G.selectedSquare = null;
        G.validMoves = [];
      }
    },

    /**
     * Make a chess move
     */
    makeMove: ({ G, ctx, events }, from, to, promotion) => {
      const chess = new Chess(G.fen);
      const currentColor = G.currentPlayer;
      const piece = chess.get(from);

      if (!piece || piece.color !== currentColor) return;

      // Check if this is an extra move from rules (not standard chess.js)
      const extraMoves = getExtraMovesFromRules(from, G.rulesEngine, chess);
      const isExtraMove = extraMoves.some((m) => m.from === from && m.to === to);

      let moveResult = null;

      if (isExtraMove) {
        // For extra moves, we manually move the piece
        const targetPiece = chess.get(to);
        const captured = targetPiece ? targetPiece.type : null;

        // Validate with rules
        const validation = validateMoveWithRules(
          { from, to, piece: piece.type, captured, color: piece.color },
          G.rulesEngine,
          chess
        );
        if (!validation.valid) return;

        // Execute the move manually
        chess.remove(from);
        if (targetPiece) chess.remove(to);
        chess.put(piece, to);

        moveResult = {
          from,
          to,
          piece: piece.type,
          color: piece.color,
          captured,
          flags: 'x',
        };
      } else {
        // Standard chess.js move
        const moveObj = { from, to };
        if (promotion) moveObj.promotion = promotion;

        // Check for pawn promotion
        if (piece.type === 'p') {
          const targetRank = to[1];
          if ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1')) {
            if (!promotion) {
              // Need to ask for promotion piece
              G.isPromoting = true;
              G.promotionMove = { from, to };
              return;
            }
          }
        }

        // Validate with rules before attempting
        const validation = validateMoveWithRules(
          { from, to, piece: piece.type, captured: chess.get(to)?.type, color: piece.color },
          G.rulesEngine,
          chess
        );
        if (!validation.valid) return;

        moveResult = chess.move(moveObj);
        if (!moveResult) return;
      }

      // Track captured pieces
      if (moveResult.captured) {
        const capturedColor = currentColor === 'w' ? 'b' : 'w';
        G.capturedPieces[capturedColor].push(moveResult.captured);
      }

      // Apply post-move effects (explosions, knight frenzy, etc.)
      G.rulesEngine = applyPostMoveEffects(moveResult, G.rulesEngine, chess);

      // Handle explosive captures visual feedback
      if (G.rulesEngine.activeModifiers.explosiveCaptures && moveResult.captured) {
        const explosiveRule = G.rulesEngine.activeRules.find((r) => r.id === 'explosive_captures');
        if (explosiveRule) {
          G.explosionSquares = explosiveRule.getExplosionSquares(to);
          // Clear after a short delay (will be handled by UI)
        }
      } else {
        G.explosionSquares = [];
      }

      // Check if knight's frenzy grants a second move
      if (G.rulesEngine.pendingSecondMove) {
        // Don't end turn yet — player gets another move with the knight
        G.fen = chess.fen();
        G.board = chess.board();
        G.lastMove = { from: moveResult.from, to: moveResult.to };
        G.selectedSquare = moveResult.to;
        G.validMoves = getAllValidMoves({ ...G, fen: chess.fen() }, moveResult.to);
        G.moveHistory.push(moveResult);
        return;
      }

      // Update game state
      G.fen = chess.fen();
      G.board = chess.board();
      G.lastMove = { from: moveResult.from, to: moveResult.to };
      G.selectedSquare = null;
      G.validMoves = [];
      G.moveHistory.push(moveResult);
      G.turnCount += 1;
      G.isPromoting = false;
      G.promotionMove = null;

      // Update game status
      if (chess.isCheckmate()) {
        G.gameStatus = 'checkmate';
      } else if (chess.isCheck()) {
        G.gameStatus = 'check';
      } else if (chess.isDraw()) {
        G.gameStatus = 'draw';
      } else if (chess.isStalemate()) {
        G.gameStatus = 'stalemate';
      } else {
        G.gameStatus = 'playing';
      }

      // Update current player
      G.currentPlayer = chess.turn();

      // Tick rules engine counter and potentially draw new rule
      G.rulesEngine = tickTurnCounter(G.rulesEngine);
      G.newRuleDrawn = null;

      if (shouldDrawNewRule(G.turnCount)) {
        G.rulesEngine = drawNewRule(G.rulesEngine);
        const latestRule = G.rulesEngine.activeRules[G.rulesEngine.activeRules.length - 1];
        G.newRuleDrawn = latestRule;
      }

      // End turn
      if (G.gameStatus === 'checkmate' || G.gameStatus === 'draw' || G.gameStatus === 'stalemate') {
        events.endGame({ winner: G.gameStatus === 'checkmate' ? (currentColor === 'w' ? '0' : '1') : undefined });
      } else {
        events.endTurn();
      }
    },

    /**
     * Complete knight's second move (Knight's Frenzy)
     */
    completeSecondMove: ({ G, ctx, events }, from, to) => {
      if (!G.rulesEngine.pendingSecondMove) return;

      const chess = new Chess(G.fen);
      const piece = chess.get(from);
      if (!piece || piece.type !== 'n') return;

      const moveResult = chess.move({ from, to });
      if (!moveResult) return;

      if (moveResult.captured) {
        const capturedColor = G.currentPlayer === 'w' ? 'b' : 'w';
        G.capturedPieces[capturedColor].push(moveResult.captured);
      }

      // Clear pending second move
      G.rulesEngine = { ...G.rulesEngine, pendingSecondMove: null };

      // Update game state
      G.fen = chess.fen();
      G.board = chess.board();
      G.lastMove = { from: moveResult.from, to: moveResult.to };
      G.selectedSquare = null;
      G.validMoves = [];
      G.moveHistory.push(moveResult);
      G.turnCount += 1;

      // Update game status
      if (chess.isCheckmate()) {
        G.gameStatus = 'checkmate';
      } else if (chess.isCheck()) {
        G.gameStatus = 'check';
      } else if (chess.isDraw()) {
        G.gameStatus = 'draw';
      } else if (chess.isStalemate()) {
        G.gameStatus = 'stalemate';
      } else {
        G.gameStatus = 'playing';
      }

      G.currentPlayer = chess.turn();
      G.rulesEngine = tickTurnCounter(G.rulesEngine);
      G.newRuleDrawn = null;

      if (shouldDrawNewRule(G.turnCount)) {
        G.rulesEngine = drawNewRule(G.rulesEngine);
        const latestRule = G.rulesEngine.activeRules[G.rulesEngine.activeRules.length - 1];
        G.newRuleDrawn = latestRule;
      }

      if (G.gameStatus === 'checkmate' || G.gameStatus === 'draw' || G.gameStatus === 'stalemate') {
        events.endGame({ winner: G.gameStatus === 'checkmate' ? (G.currentPlayer === 'b' ? '0' : '1') : undefined });
      } else {
        events.endTurn();
      }
    },

    /**
     * Teleport a piece to an empty square
     */
    teleportPiece: ({ G, ctx, events }, from, to) => {
      if (!G.rulesEngine.activeModifiers.teleportation) return;

      const chess = new Chess(G.fen);
      if (!isValidTeleportation(from, to, chess, G.currentPlayer)) return;

      const piece = chess.get(from);
      chess.remove(from);
      chess.put(piece, to);

      // Update game state
      G.fen = chess.fen();
      G.board = chess.board();
      G.lastMove = { from, to };
      G.selectedSquare = null;
      G.validMoves = [];
      G.moveHistory.push({ from, to, piece: piece.type, color: piece.color, flags: 'teleport' });
      G.turnCount += 1;
      G.currentPlayer = G.currentPlayer === 'w' ? 'b' : 'w';
      G.rulesEngine.teleportMode = false;

      G.rulesEngine = tickTurnCounter(G.rulesEngine);
      G.newRuleDrawn = null;

      if (shouldDrawNewRule(G.turnCount)) {
        G.rulesEngine = drawNewRule(G.rulesEngine);
        const latestRule = G.rulesEngine.activeRules[G.rulesEngine.activeRules.length - 1];
        G.newRuleDrawn = latestRule;
      }

      events.endTurn();
    },

    /**
     * Toggle teleport mode
     */
    toggleTeleportMode: ({ G }) => {
      if (!G.rulesEngine.activeModifiers.teleportation) return;
      G.rulesEngine.teleportMode = !G.rulesEngine.teleportMode;
      G.selectedSquare = null;
      G.validMoves = [];
    },

    /**
     * Choose promotion piece
     */
    promote: ({ G, ctx, events }, piece) => {
      if (!G.isPromoting || !G.promotionMove) return;
      // Re-dispatch as a move with promotion
      const { from, to } = G.promotionMove;
      G.isPromoting = false;
      G.promotionMove = null;
      // This will be handled by the UI calling makeMove with promotion
    },

    /**
     * Clear the new rule notification
     */
    clearNewRule: ({ G }) => {
      G.newRuleDrawn = null;
    },

    /**
     * Reset the game
     */
    resetGame: ({ G }) => {
      const freshState = setupGame();
      Object.assign(G, freshState);
    },
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
