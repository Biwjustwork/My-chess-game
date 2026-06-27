import { Chess } from 'chess.js';
import { applyRule, isValidTeleportation, getExplosionSquares, applyPostMoveEffects } from './rulesEngine';
import { sanitizeMove, getAllValidMoves } from './chessMoveHelpers';
import { evaluateGameStatus, trackBetrayedPiece, verifyBetrayedPieceAfterExplosions } from './gameStateEvaluator';
import { finalizeTurn } from './turnManager';

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
  
  trackBetrayedPiece(G, moveResult.from, moveResult.to);

  G.fen = chess.fen();
  G.board = chess.board();
  G.lastMove = { from: moveResult.from, to: moveResult.to, captured: moveResult.captured, capturedColor: moveResult.captured ? (moveResult.color === 'w' ? 'b' : 'w') : null };
  G.selectedSquare = null;
  G.validMoves = [];
  G.moveHistory.push(moveResult);
  G.turnCount += 1;

  const gameEval = evaluateGameStatus(G, chess);
  G.gameStatus = gameEval.status;
  G.chaosEscapeAvailable = gameEval.chaosEscapeAvailable;

  G.currentPlayer = chess.turn();

  finalizeTurn(G, events, currentColor);
};

export const teleportPiece = ({ G, ctx, events }, from, to) => {
  if (!G.rulesEngine.activeModifiers.teleportation) return;

  const chess = new Chess(G.fen);
  const currentColor = G.currentPlayer;
  const piece = chess.get(from);
  if (!piece) return;

  // Block teleport if frozen
  if (G.rulesEngine.frozenPieces) {
    const frozen = G.rulesEngine.frozenPieces[currentColor];
    if (frozen && frozen.square === from) {
      return;
    }
  }

  if (to === 'random') {
    const validSquares = [];
    for (let r = 1; r <= 8; r++) {
      for (let c = 0; c < 8; c++) {
        // Prevent pawn on edge rows
        if (piece.type === 'p' && (r === 1 || r === 8)) {
          continue;
        }
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

  chess.remove(from);
  chess.put(piece, to);

  if (targetPiece) {
    applyPostMoveEffects({ from, to, piece: piece.type, color: piece.color, captured: targetPiece.type, flags: 'teleport' }, G.rulesEngine, chess);
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
  
  trackBetrayedPiece(G, from, to);
  verifyBetrayedPieceAfterExplosions(G);

  G.fen = chess.fen();
  G.board = chess.board();
  G.lastMove = { from, to, captured: undefined, flags: 'teleport' };
  G.selectedSquare = null;
  G.validMoves = [];
  G.moveHistory.push({ from, to, piece: piece.type, color: piece.color, flags: 'teleport' });
  G.turnCount += 1;

  const gameEval = evaluateGameStatus(G, chess);
  G.gameStatus = gameEval.status;
  G.chaosEscapeAvailable = gameEval.chaosEscapeAvailable;

  G.currentPlayer = chess.turn();
  G.rulesEngine.teleportMode = false;

  finalizeTurn(G, events, currentColor);
};

export const toggleTeleportMode = ({ G }) => {
  if (!G.rulesEngine.activeModifiers.teleportation) return;
  G.rulesEngine.teleportMode = !G.rulesEngine.teleportMode;
  G.selectedSquare = null;
  G.validMoves = [];
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
