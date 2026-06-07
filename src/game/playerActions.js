import { Chess } from 'chess.js';
import {
  shouldDrawNewRule,
  draftRules,
  applyRule,
  tickTurnCounter,
  validateMoveWithRules,
  getExtraMovesFromRules,
  applyPostMoveEffects,
  isValidTeleportation,
  getExplosionSquares,
} from './rulesEngine';
import { sanitizeMove, getAllValidMoves } from './chessMoveHelpers';
import { setupGame } from './initialGameState';

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

    const validation = validateMoveWithRules(
      { from, to, piece: piece.type, captured: chess.get(to)?.type, color: piece.color },
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

  if (G.rulesEngine.pendingSecondMove) {
    const tokens = chess.fen().split(' ');
    tokens[1] = tokens[1] === 'w' ? 'b' : 'w';
    if (tokens[1] === 'b') {
      tokens[5] = String(Math.max(1, parseInt(tokens[5], 10) - 1));
    }
    chess.load(tokens.join(' '));

    G.fen = chess.fen();
    G.board = chess.board();
    G.lastMove = { from: moveResult.from, to: moveResult.to };
    G.selectedSquare = moveResult.to;
    G.validMoves = getAllValidMoves({ ...G, fen: chess.fen() }, moveResult.to);
    G.moveHistory.push(moveResult);
    return;
  }

  G.fen = chess.fen();
  G.board = chess.board();
  G.lastMove = { from: moveResult.from, to: moveResult.to };
  G.selectedSquare = null;
  G.validMoves = [];
  G.moveHistory.push(moveResult);
  G.turnCount += 1;
  G.isPromoting = false;
  G.promotionMove = null;

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

  tickTurnCounter(G.rulesEngine, currentColor);
  G.newRuleDrawn = null;

  if (shouldDrawNewRule(G.turnCount)) {
    const drafted = draftRules(G.rulesEngine);
    if (drafted.length > 0) {
      G.draftedRules = drafted;
      G.isDraftingRule = true;
    }
  }

  if (G.gameStatus === 'checkmate' || G.gameStatus === 'draw' || G.gameStatus === 'stalemate') {
    events.endGame({ winner: G.gameStatus === 'checkmate' ? (currentColor === 'w' ? '0' : '1') : undefined });
  } else {
    events.endTurn();
  }
};

export const completeSecondMove = ({ G, ctx, events }, from, to) => {
  if (!G.rulesEngine.pendingSecondMove) return;

  const chess = new Chess(G.fen);
  const currentColor = G.currentPlayer;
  const piece = chess.get(from);
  if (!piece || piece.type !== 'n') return;

  const moveResult = sanitizeMove(chess.move({ from, to }));
  if (!moveResult) return;

  if (moveResult.captured) {
    const capturedColor = G.currentPlayer === 'w' ? 'b' : 'w';
    G.capturedPieces[capturedColor].push(moveResult.captured);
  }

  if (!G.rulesEngine.exhaustedPieces) {
    G.rulesEngine.exhaustedPieces = { w: [], b: [] };
  }
  G.rulesEngine.exhaustedPieces[G.currentPlayer].push({ square: to, remaining: 2 });

  G.rulesEngine.pendingSecondMove = null;

  G.fen = chess.fen();
  G.board = chess.board();
  G.lastMove = { from: moveResult.from, to: moveResult.to };
  G.selectedSquare = null;
  G.validMoves = [];
  G.moveHistory.push(moveResult);
  G.turnCount += 1;

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
  tickTurnCounter(G.rulesEngine, currentColor);
  G.newRuleDrawn = null;

  if (shouldDrawNewRule(G.turnCount)) {
    const drafted = draftRules(G.rulesEngine);
    if (drafted.length > 0) {
      G.draftedRules = drafted;
      G.isDraftingRule = true;
    }
  }

  if (G.gameStatus === 'checkmate' || G.gameStatus === 'draw' || G.gameStatus === 'stalemate') {
    events.endGame({ winner: G.gameStatus === 'checkmate' ? (G.currentPlayer === 'b' ? '0' : '1') : undefined });
  } else {
    events.endTurn();
  }
};

export const teleportPiece = ({ G, ctx, events }, from, to) => {
  if (!G.rulesEngine.activeModifiers.teleportation) return;

  const chess = new Chess(G.fen);
  const currentColor = G.currentPlayer;

  if (to === 'random') {
    const validSquares = [];
    for (let r = 1; r <= 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = String.fromCharCode(97 + c) + r;
        if (sq !== from) {
          const targetPiece = chess.get(sq);
          if (!targetPiece || (targetPiece.color !== G.currentPlayer && targetPiece.type !== 'k')) {
            const tempChess = new Chess(chess.fen());
            const piece = tempChess.get(from);
            tempChess.remove(from);
            if (targetPiece) tempChess.remove(sq);
            tempChess.put(piece, sq);
            if (!tempChess.isCheck()) {
              validSquares.push(sq);
            }
          }
        }
      }
    }
    if (validSquares.length === 0) return;
    to = validSquares[Math.floor(Math.random() * validSquares.length)];
  } else {
    if (!isValidTeleportation(from, to, chess, G.currentPlayer)) return;
  }

  const targetPiece = chess.get(to);
  if (targetPiece) {
    const capturedColor = G.currentPlayer === 'w' ? 'b' : 'w';
    G.capturedPieces[capturedColor].push(targetPiece.type);
    chess.remove(to);
  }

  const piece = chess.get(from);
  chess.remove(from);
  chess.put(piece, to);

  if (targetPiece) {
    applyPostMoveEffects({ from, to, piece: piece.type, color: piece.color, captured: targetPiece.type, flags: 'x' }, G.rulesEngine, chess);
    if (G.rulesEngine.explodedThisTurn) {
      G.explosionSquares = getExplosionSquares(to);
    }
  } else {
    G.explosionSquares = [];
  }

  const tokens = chess.fen().split(' ');
  tokens[1] = tokens[1] === 'w' ? 'b' : 'w';
  if (tokens[1] === 'w') {
    tokens[5] = String(parseInt(tokens[5], 10) + 1);
  }
  tokens[3] = '-';
  chess.load(tokens.join(' '));

  G.fen = chess.fen();
  G.board = chess.board();
  G.lastMove = { from, to };
  G.selectedSquare = null;
  G.validMoves = [];
  G.moveHistory.push({ from, to, piece: piece.type, color: piece.color, flags: 'teleport' });
  G.turnCount += 1;
  G.currentPlayer = chess.turn();
  G.rulesEngine.teleportMode = false;

  tickTurnCounter(G.rulesEngine, currentColor);
  G.newRuleDrawn = null;

  if (shouldDrawNewRule(G.turnCount)) {
    const drafted = draftRules(G.rulesEngine);
    if (drafted.length > 0) {
      G.draftedRules = drafted;
      G.isDraftingRule = true;
    }
  }

  events.endTurn();
};

export const toggleTeleportMode = ({ G }) => {
  if (!G.rulesEngine.activeModifiers.teleportation) return;
  G.rulesEngine.teleportMode = !G.rulesEngine.teleportMode;
  G.selectedSquare = null;
  G.validMoves = [];
};

export const promote = ({ G, ctx, events }, piece) => {
  if (!G.isPromoting || !G.promotionMove) return;
  const { from, to } = G.promotionMove;
  G.isPromoting = false;
  G.promotionMove = null;
};

export const selectDraftedRule = ({ G, events }, ruleId) => {
  if (!G.isDraftingRule) return;
  const draftedRule = G.draftedRules.find(r => r.id === ruleId);
  const duration = draftedRule ? draftedRule.duration : undefined;
  applyRule(G.rulesEngine, ruleId, duration, G);
  G.draftedRules = [];
  G.isDraftingRule = false;
};

export const clearNewRule = ({ G }) => {
  G.newRuleDrawn = null;
};

export const resetGame = ({ G }) => {
  const freshState = setupGame();
  Object.assign(G, freshState);
};
