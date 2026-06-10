import { memo } from 'react';
import { useDrop } from 'react-dnd';
import Piece from './Piece';

/**
 * Individual board square with drop support
 */
export default memo(function Square({
  row,
  col,
  piece,
  isSelected,
  isValidMove,
  isLastMove,
  isCapture,
  isExplosion,
  isFrozen,
  isExhausted,
  isBetrayed,
  isCurrentPlayerPiece,
  isTeleportMode,
  isTeleportAnimTarget,
  onSquareClick,
  onDrop,
}) {
  const square = String.fromCharCode(97 + col) + (8 - row);

  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: 'PIECE',
      drop: (item) => {
        if (onDrop) onDrop(item.square, square);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDrop, square]
  );

  const isLight = (row + col) % 2 === 0;
  const hasCapture = isValidMove && piece;

  let className = `square ${isLight ? 'square-light' : 'square-dark'}`;
  if (isSelected) className += ' square-selected';
  if (isLastMove) className += ' square-last-move';
  if (isExplosion) className += ' square-explosion';
  if (isFrozen) className += ' square-frozen';
  if (isExhausted) className += ' square-exhausted';
  if (isBetrayed) className += ' square-betrayed';
  if (isTeleportMode && isCurrentPlayerPiece) className += ' square-teleport-hover';

  const pieceNames = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  const pieceDesc = piece ? `${piece.color === 'w' ? 'White' : 'Black'} ${pieceNames[piece.type]}` : 'Empty';
  let stateDesc = '';
  if (isSelected) stateDesc = 'Selected';
  else if (isValidMove) stateDesc = piece ? 'Valid capture' : 'Valid move target';
  const ariaLabel = `${square}, ${pieceDesc}${stateDesc ? `, ${stateDesc}` : ''}`;

  return (
    <button
      type="button"
      ref={dropRef}
      className={className}
      onClick={() => onSquareClick(square)}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      style={{
        outline: isOver ? '3px solid var(--accent-cyan)' : 'none',
        outlineOffset: '-3px',
      }}
    >
      {piece && <Piece piece={piece} square={square} isCurrentPlayerPiece={isCurrentPlayerPiece && !isFrozen && !isExhausted} isSelected={isSelected} hidden={isTeleportAnimTarget} />}
      {isValidMove && !piece && <span className="valid-move-dot" aria-hidden="true" />}
      {hasCapture && <span className="valid-capture-ring" aria-hidden="true" />}
      {isFrozen && <span className="frozen-overlay" aria-hidden="true">❄️</span>}
      {isExhausted && <span className="exhausted-overlay" aria-hidden="true">💤</span>}
      {isBetrayed && <span className="betrayal-overlay" aria-hidden="true">🎭</span>}
      {isCapture && <span className={`capture-effect capture-${isCapture}`} aria-hidden="true"></span>}
    </button>
  );
});
