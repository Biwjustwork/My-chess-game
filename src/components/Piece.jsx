import { useDrag } from 'react-dnd';

const PIECE_SYMBOLS = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

/**
 * Chess piece component with drag support
 */
export default function Piece({ piece, square }) {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'PIECE',
    item: { square, piece },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  if (!piece) return null;

  const symbol = PIECE_SYMBOLS[`${piece.color}${piece.type}`] || '';
  const colorClass = piece.color === 'w' ? 'piece-white' : 'piece-black';

  return (
    <div
      ref={dragRef}
      className={`piece ${colorClass} ${isDragging ? 'piece-dragging' : ''}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {symbol}
    </div>
  );
}
