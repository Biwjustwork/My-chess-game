import { useDrop } from 'react-dnd';
import Piece from './Piece';

/**
 * Individual board square with drop support
 */
export default function Square({
  row,
  col,
  piece,
  isSelected,
  isValidMove,
  isLastMove,
  isExplosion,
  isFrozen,
  isExhausted,
  isCurrentPlayerPiece,
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

  return (
    <div
      ref={dropRef}
      className={className}
      onClick={() => onSquareClick(square)}
      style={{
        outline: isOver ? '3px solid var(--accent-cyan)' : 'none',
        outlineOffset: '-3px',
      }}
    >
      {piece && <Piece piece={piece} square={square} isCurrentPlayerPiece={isCurrentPlayerPiece && !isFrozen && !isExhausted} />}
      {isValidMove && !piece && <div className="valid-move-dot" />}
      {hasCapture && <div className="valid-capture-ring" />}
      {isFrozen && <div className="frozen-overlay">❄️</div>}
      {isExhausted && <div className="exhausted-overlay">💤</div>}
    </div>
  );
}
