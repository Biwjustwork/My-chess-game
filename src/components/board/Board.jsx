import { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Chess } from 'chess.js';
import Square from './Square';
import { getAllValidMoves } from '../../game/ChaosChessEngine';
import { isValidTeleportation } from '../../game/rulesEngine';

import WQueen from '../../assets/Img-chibi-pieces/w-queen.png';
import WRook from '../../assets/Img-chibi-pieces/w-rook.png';
import WBishop from '../../assets/Img-chibi-pieces/w-bishop.png';
import WKnight from '../../assets/Img-chibi-pieces/w-knight.png';
import BQueen from '../../assets/Img-chibi-pieces/b-queen.png';
import BRook from '../../assets/Img-chibi-pieces/b-rook.png';
import BBishop from '../../assets/Img-chibi-pieces/b-bishop.png';
import BKnight from '../../assets/Img-chibi-pieces/b-knight.png';
import './Board.css';

const PROMOTION_IMAGES = {
  wq: WQueen, wr: WRook, wb: WBishop, wn: WKnight,
  bq: BQueen, br: BRook, bb: BBishop, bn: BKnight,
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/**
 * Chess board component - renders 8x8 grid with interaction
 */
export default function Board({ G, moves, reset }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const chess = new Chess(G.fen);
  const board = chess.board();
  const currentColor = G.currentPlayer;

  // Compute valid moves for a given square
  const computeValidMoves = useCallback((square) => {
    return getAllValidMoves(G, square);
  }, [G]);

  // Clear local selection when teleport mode toggles so UI updates correctly
  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, [G.rulesEngine?.teleportMode]);

  const handleSquareClick = useCallback((square) => {
    const clickChess = new Chess(G.fen);
    const piece = clickChess.get(square);

    // Teleport mode
    if (G.rulesEngine?.teleportMode) {
      if (piece && piece.color === currentColor) {
        moves.teleportPiece(square, 'random');
        setSelectedSquare(null);
        setValidMoves([]);
      }
      return;
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
    // 1. เพิ่มบรรทัดนี้เพื่อเช็กว่าถ้า from/to เป็น Object ให้ดึงค่า square ออกมา
    const fromSquare = typeof from === 'object' ? from.square || from.id : from;
    const toSquare = typeof to === 'object' ? to.square || to.id : to;

    const dropChess = new Chess(G.fen);
    
    // 2. เปลี่ยนมาใช้ fromSquare และ toSquare
    const movingPiece = dropChess.get(fromSquare);
    
    if (!movingPiece || movingPiece.color !== currentColor) return;

    // Check for pawn promotion on drop
    if (movingPiece.type === 'p') {
      const targetRank = toSquare[1];
      if ((movingPiece.color === 'w' && targetRank === '8') || (movingPiece.color === 'b' && targetRank === '1')) {
        setPromotionData({ from: fromSquare, to: toSquare });
        return;
      }
    }

    if (G.rulesEngine?.teleportMode) {
      moves.teleportPiece(fromSquare, 'random');
    } else if (G.rulesEngine?.pendingSecondMove) {
      moves.completeSecondMove(fromSquare, toSquare);
    } else {
      // 3. ใช้ค่า string แท้ๆ ส่งเข้า boardgame.io
      moves.makeMove(fromSquare, toSquare); 
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

  const isSquareFrozen = (sq) => {
    const frozen = G.rulesEngine?.frozenPieces;
    if (!frozen) return false;
    return (frozen.w?.square === sq) || (frozen.b?.square === sq);
  };

  const isSquareExhausted = (sq) => {
    const exhausted = G.rulesEngine?.exhaustedPieces;
    if (!exhausted) return false;
    return (exhausted.w || []).some(p => p.square === sq) || 
           (exhausted.b || []).some(p => p.square === sq);
  };

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
                    isFrozen={isSquareFrozen(square)}
                    isExhausted={isSquareExhausted(square)}
                    isBetrayed={G.rulesEngine?.betrayedPiece?.square === square}
                    isCurrentPlayerPiece={piece && piece.color === currentColor}
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

          {/* Game Over / Checkmate Overlay */}
          {G.gameStatus === 'checkmate' && (
            <div className="game-over-overlay">
              <div className="game-over-dialog">
                <h2>CHECKMATE!</h2>
                <p>{G.currentPlayer === 'w' ? 'Black' : 'White'} wins the game!</p>
                <button onClick={() => reset()} className="play-again-btn">
                  Play Again
                </button>
              </div>
            </div>
          )}
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

        {/* Chaos Escape Hint */}
        {G.gameStatus === 'check' && G.chaosEscapeAvailable && (
          <div className="chaos-escape-hint">
            <strong>CHECK!</strong> คุณยังมีทางรอดด้วยกฎพิเศษอยู่นะ!
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
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
