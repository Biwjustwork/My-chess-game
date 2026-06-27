import { Chess } from 'chess.js';
import { sanitizeMove, getAllValidMoves } from './chessMoveHelpers';
import { validateMoveWithRules, getExtraMovesFromRules, applyPostMoveEffects, getExplosionSquares } from './rulesEngine';
import { setupGame } from './initialGameState';
import { evaluateGameStatus, trackBetrayedPiece, verifyBetrayedPieceAfterExplosions } from './gameStateEvaluator';
import { finalizeTurn } from './turnManager';

export const selectSquare = ({ G, playerID }, square) => {
  if (G.isDraftingRule) return;

  if (G.rulesEngine.pendingSecondMove) {
    if (square !== G.rulesEngine.pendingSecondMove.square) {
      return;
    }
  }

  const chess = new Chess(G.fen);
  const currentColor = G.currentPlayer;
  const piece = chess.get(square);

  if (G.selectedSquare && G.validMoves.some((m) => m.to === square)) {
    return;
  }

  if (piece && piece.color === currentColor) {
    const validMoves = getAllValidMoves(G, square);
    G.selectedSquare = square;
    G.validMoves = validMoves;
  } else {
    G.selectedSquare = null;
    G.validMoves = [];
  }
};

export const makeMove = ({ G, ctx, events }, from, to, promotion) => {
  if (G.isDraftingRule) return;
  const chess = new Chess(G.fen);
  const currentColor = G.currentPlayer;
  const piece = chess.get(from);

  if (!piece || piece.color !== currentColor) return;

  const extraMoves = getExtraMovesFromRules(from, G.rulesEngine, chess);
  const extraMovePlayed = extraMoves.find((m) => m.from === from && m.to === to);

  let moveResult = null;

  if (extraMovePlayed) {
    const targetPiece = chess.get(to);
    const captured = targetPiece ? targetPiece.type : null;

    const validation = validateMoveWithRules(
      { from, to, piece: piece.type, captured, color: piece.color },
      G.rulesEngine,
      chess
    );
    if (!validation.valid) return;

    chess.remove(from);
    if (targetPiece) chess.remove(to);
    chess.put(piece, to);

    if (extraMovePlayed.shouldEndTurn !== false) {
      const tokens = chess.fen().split(' ');
      tokens[1] = tokens[1] === 'w' ? 'b' : 'w';
      if (tokens[1] === 'w') {
        tokens[5] = String(parseInt(tokens[5], 10) + 1);
      }
      tokens[3] = '-';
      chess.load(tokens.join(' '));
    }

    moveResult = {
      from,
      to,
      piece: piece.type,
      color: piece.color,
      captured,
      flags: 'x',
    };
  } else {
    const moveObj = { from, to };
    if (promotion) moveObj.promotion = promotion;

    if (piece.type === 'p') {
      const targetRank = to[1];
      if ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1')) {
        if (!promotion) {
          G.isPromoting = true;
          G.promotionMove = { from, to };
          return;
        }
      }
    }

    let captured = chess.get(to)?.type;
    if (!captured && piece.type === 'p' && from[0] !== to[0]) {
      // En Passant capture
      captured = 'p';
    }

    const validation = validateMoveWithRules(
      { from, to, piece: piece.type, captured, color: piece.color },
      G.rulesEngine,
      chess
    );
    if (!validation.valid) return;

    try {
      moveResult = sanitizeMove(chess.move(moveObj));
    } catch (error) {
      console.warn("Invalid move caught:", error.message);
      return;
    }
    
    if (!moveResult) return;
  }

  if (moveResult.captured) {
    const capturedColor = currentColor === 'w' ? 'b' : 'w';
    G.capturedPieces[capturedColor].push(moveResult.captured);
  }

  applyPostMoveEffects(moveResult, G.rulesEngine, chess);

  if (G.rulesEngine.explodedThisTurn) {
    G.explosionSquares = getExplosionSquares(to);
  } else {
    G.explosionSquares = [];
  }
  
  trackBetrayedPiece(G, moveResult.from, moveResult.to);
  verifyBetrayedPieceAfterExplosions(G);

  if (G.rulesEngine.pendingSecondMove) {
    const tokens = chess.fen().split(' ');
    tokens[1] = tokens[1] === 'w' ? 'b' : 'w';
    if (tokens[1] === 'b') {
      tokens[5] = String(Math.max(1, parseInt(tokens[5], 10) - 1));
    }
    chess.load(tokens.join(' '));

    G.fen = chess.fen();
    G.board = chess.board();
    G.lastMove = { from: moveResult.from, to: moveResult.to, captured: moveResult.captured, capturedColor: moveResult.captured ? (moveResult.color === 'w' ? 'b' : 'w') : null };
    G.selectedSquare = moveResult.to;
    G.validMoves = getAllValidMoves({ ...G, fen: chess.fen() }, moveResult.to);
    G.moveHistory.push(moveResult);
    return;
  }

  G.fen = chess.fen();
  G.board = chess.board();
  G.lastMove = { from: moveResult.from, to: moveResult.to, captured: moveResult.captured, capturedColor: moveResult.captured ? (moveResult.color === 'w' ? 'b' : 'w') : null };
  G.selectedSquare = null;
  G.validMoves = [];
  G.moveHistory.push(moveResult);
  G.turnCount += 1;
  G.isPromoting = false;
  G.promotionMove = null;

  const gameEval = evaluateGameStatus(G, chess);
  G.gameStatus = gameEval.status;
  G.chaosEscapeAvailable = gameEval.chaosEscapeAvailable;

  G.currentPlayer = chess.turn();

  finalizeTurn(G, events, currentColor);
};

export const promote = ({ G, ctx, events }, piece) => {
  if (!G.isPromoting || !G.promotionMove) return;
  const { from, to } = G.promotionMove;
  G.isPromoting = false;
  G.promotionMove = null;
};

export const resetGame = ({ G }) => {
  const freshState = setupGame();
  Object.assign(G, freshState);
};
