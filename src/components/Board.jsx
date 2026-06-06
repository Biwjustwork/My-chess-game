import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Chess } from 'chess.js';
import Square from './Square';
import { getAllValidMoves } from '../game/Game';

import WQueen from '../Img-chess/W-Queen.png';
import WRook from '../Img-chess/W-Rook.png';
import WBishop from '../Img-chess/W-Bishop.png';
import WKnight from '../Img-chess/W-Knight.png';
import BQueen from '../Img-chess/B-Queen.png';
import BRook from '../Img-chess/B-Rook.png';
import BBishop from '../Img-chess/B-Bishop.png';
import BKnight from '../Img-chess/B-Knight.png';

const PROMOTION_IMAGES = {
  wq: WQueen, wr: WRook, wb: WBishop, wn: WKnight,
  bq: BQueen, br: BRook, bb: BBishop, bn: BKnight,
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/**
 * Chess board component - renders 8x8 grid with interaction
 */
export default function Board({ G, moves }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const chess = new Chess(G.fen);
  const board = chess.board();
  const currentColor = G.currentPlayer;

  // Compute valid moves for a given square
  const computeValidMoves = useCallback((square) => {
    return getAllValidMoves(G, square);
  }, [G]);

  const handleSquareClick = useCallback((square) => {
    const clickChess = new Chess(G.fen);
    const piece = clickChess.get(square);

    // Teleport mode
    if (G.rulesEngine?.teleportMode) {
      if (selectedSquare && !piece) {
        moves.teleportPiece(selectedSquare, square);
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      if (piece && piece.color === currentColor) {
        setSelectedSquare(square);
        // In teleport mode, all empty squares are valid
        const emptySquares = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const sq = String.fromCharCode(97 + c) + (8 - r);
            if (!clickChess.get(sq)) emptySquares.push({ from: square, to: sq });
          }
        }
        setValidMoves(emptySquares);
        return;
      }
    }

    // Knight's Frenzy second move
    if (G.rulesEngine?.pendingSecondMove) {
      if (selectedSquare) {
        moves.completeSecondMove(selectedSquare, square);
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      const pending = G.rulesEngine.pendingSecondMove;
      if (square === pending.square) {
        const vm = computeValidMoves(square);
        setSelectedSquare(square);
        setValidMoves(vm);
        return;
      }
    }

    // If a piece is selected and clicking a valid move target
    if (selectedSquare && validMoves.some((m) => m.to === square)) {
      const movingPiece = clickChess.get(selectedSquare);

      // Check for pawn promotion
      if (movingPiece?.type === 'p') {
        const targetRank = square[1];
        if ((movingPiece.color === 'w' && targetRank === '8') || (movingPiece.color === 'b' && targetRank === '1')) {
          // Show promotion dialog
          setPromotionData({ from: selectedSquare, to: square });
          return;
        }
      }

      moves.makeMove(selectedSquare, square);
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // Select a new piece
    if (piece && piece.color === currentColor) {
      const vm = computeValidMoves(square);
      setSelectedSquare(square);
      setValidMoves(vm);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [selectedSquare, validMoves, G.fen, currentColor, moves, computeValidMoves, G.rulesEngine]);

  const handleDrop = useCallback((from, to) => {
    const dropChess = new Chess(G.fen);
    const movingPiece = dropChess.get(from);
    if (!movingPiece || movingPiece.color !== currentColor) return;

    // Check for pawn promotion on drop
    if (movingPiece.type === 'p') {
      const targetRank = to[1];
      if ((movingPiece.color === 'w' && targetRank === '8') || (movingPiece.color === 'b' && targetRank === '1')) {
        setPromotionData({ from, to });
        return;
      }
    }

    if (G.rulesEngine?.teleportMode) {
      moves.teleportPiece(from, to);
    } else if (G.rulesEngine?.pendingSecondMove) {
      moves.completeSecondMove(from, to);
    } else {
      moves.makeMove(from, to);
    }
    setSelectedSquare(null);
    setValidMoves([]);
  }, [G.fen, currentColor, moves, G.rulesEngine]);

  // Promotion state
  const [promotionData, setPromotionData] = useState(null);

  const handlePromotion = (pieceType) => {
    if (!promotionData) return;
    moves.makeMove(promotionData.from, promotionData.to, pieceType);
    setPromotionData(null);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const isSquareValidMove = (sq) => validMoves.some((m) => m.to === sq);
  const isSquareLastMove = (sq) => G.lastMove && (sq === G.lastMove.from || sq === G.lastMove.to);
  const isSquareExplosion = (sq) => G.explosionSquares && G.explosionSquares.includes(sq);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="board-section">
        <div className="board-container">
          <div className="board-grid">
            {board.map((row, rowIdx) =>
              row.map((piece, colIdx) => {
                const square = String.fromCharCode(97 + colIdx) + (8 - rowIdx);
                return (
                  <Square
                    key={square}
                    row={rowIdx}
                    col={colIdx}
                    piece={piece}
                    isSelected={selectedSquare === square}
                    isValidMove={isSquareValidMove(square)}
                    isLastMove={isSquareLastMove(square)}
                    isExplosion={isSquareExplosion(square)}
                    onSquareClick={handleSquareClick}
                    onDrop={handleDrop}
                  />
                );
              })
            )}
          </div>
          {/* File labels */}
          <div className="board-labels-row">
            {FILES.map((f) => (
              <span key={f} className="board-label">{f}</span>
            ))}
          </div>
        </div>

        {/* Teleport button */}
        {G.rulesEngine?.activeModifiers?.teleportation && (
          <button
            className={`teleport-btn ${G.rulesEngine?.teleportMode ? 'active' : ''}`}
            onClick={() => moves.toggleTeleportMode()}
          >
            ✨ {G.rulesEngine?.teleportMode ? 'Cancel Teleport' : 'Teleport Mode'}
          </button>
        )}

        {/* Pending second move indicator */}
        {G.rulesEngine?.pendingSecondMove && (
          <div style={{ color: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
            🐴 Knight's Frenzy — Move your Knight again!
          </div>
        )}
      </div>

      {/* Promotion Dialog */}
      {promotionData && (
        <div className="promotion-overlay" onClick={() => setPromotionData(null)}>
          <div className="promotion-dialog" onClick={(e) => e.stopPropagation()}>
            {['q', 'r', 'b', 'n'].map((p) => (
              <div
                key={p}
                className="promotion-piece"
                onClick={() => handlePromotion(p)}
              >
                <img
                  src={PROMOTION_IMAGES[`${currentColor}${p}`]}
                  alt={p}
                  style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </DndProvider>
  );
}
