import { Chess } from 'chess.js';
import { getAllValidMoves } from './chessMoveHelpers';

export const evaluateGameStatus = (G, chess) => {
  let hasAnyValidMove = false;
  const currentPlayer = chess.turn();
  const board = chess.board();

  if (G.rulesEngine.activeModifiers.teleportation) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === currentPlayer) {
          const fromSq = String.fromCharCode(97 + c) + (8 - r);
          for (let tr = 1; tr <= 8; tr++) {
             for (let tc = 0; tc < 8; tc++) {
                const toSq = String.fromCharCode(97 + tc) + tr;
                if (fromSq !== toSq) {
                  const targetPiece = chess.get(toSq);
                  if (!targetPiece || (targetPiece.color !== currentPlayer && targetPiece.type !== 'k')) {
                    const tempChess = new Chess(chess.fen());
                    const pieceToMove = tempChess.get(fromSq);
                    tempChess.remove(fromSq);
                    if (targetPiece) tempChess.remove(toSq);
                    tempChess.put(pieceToMove, toSq);
                    if (!tempChess.isCheck()) {
                       hasAnyValidMove = true;
                       break;
                    }
                  }
                }
             }
             if (hasAnyValidMove) break;
          }
        }
        if (hasAnyValidMove) break;
      }
      if (hasAnyValidMove) break;
    }
  }

  if (!hasAnyValidMove) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === currentPlayer) {
          const sq = String.fromCharCode(97 + c) + (8 - r);
          const moves = getAllValidMoves(G, sq);
          if (moves.length > 0) {
            hasAnyValidMove = true;
            break;
          }
        }
      }
      if (hasAnyValidMove) break;
    }
  }

  const isCheck = chess.isCheck();

  if (!hasAnyValidMove) {
    if (isCheck) return { status: 'checkmate', chaosEscapeAvailable: false };
    else return { status: 'stalemate', chaosEscapeAvailable: false };
  } else {
    if (isCheck && chess.isCheckmate()) {
       return { status: 'check', chaosEscapeAvailable: true };
    }
    if (isCheck) {
       return { status: 'check', chaosEscapeAvailable: false };
    }
    return { status: 'playing', chaosEscapeAvailable: false };
  }
};

export const trackBetrayedPiece = (G, from, to) => {
  if (G.rulesEngine.betrayedPiece) {
    if (G.rulesEngine.betrayedPiece.square === to) {
      G.rulesEngine.betrayedPiece = null;
    } else if (G.rulesEngine.betrayedPiece.square === from) {
      G.rulesEngine.betrayedPiece.square = to;
    }
  }
};

export const verifyBetrayedPieceAfterExplosions = (G) => {
  if (G.rulesEngine.explodedThisTurn && G.explosionSquares && G.rulesEngine.betrayedPiece) {
    if (G.explosionSquares.includes(G.rulesEngine.betrayedPiece.square)) {
      G.rulesEngine.betrayedPiece = null;
    }
  }
};
