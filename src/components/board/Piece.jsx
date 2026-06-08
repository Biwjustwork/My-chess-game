import { useDrag } from 'react-dnd';

// Import chess piece images
import WKing from '../../assets/pieces/w-king.png';
import WQueen from '../../assets/pieces/w-queen.png';
import WRook from '../../assets/pieces/w-rook.png';
import WBishop from '../../assets/pieces/w-bishop.png';
import WKnight from '../../assets/pieces/w-knight.png';
import WPawn from '../../assets/pieces/w-pawn.png';
import BKing from '../../assets/pieces/b-king.png';
import BQueen from '../../assets/pieces/b-queen.png';
import BRook from '../../assets/pieces/b-rook.png';
import BBishop from '../../assets/pieces/b-bishop.png';
import BKnight from '../../assets/pieces/b-knight.png';
import BPawn from '../../assets/pieces/b-pawn.png';

const PIECE_IMAGES = {
  wk: WKing, wq: WQueen, wr: WRook, wb: WBishop, wn: WKnight, wp: WPawn,
  bk: BKing, bq: BQueen, br: BRook, bb: BBishop, bn: BKnight, bp: BPawn,
};

const PIECE_NAMES = {
  wk: 'White King', wq: 'White Queen', wr: 'White Rook', wb: 'White Bishop', wn: 'White Knight', wp: 'White Pawn',
  bk: 'Black King', bq: 'Black Queen', br: 'Black Rook', bb: 'Black Bishop', bn: 'Black Knight', bp: 'Black Pawn',
};

/**
 * Chess piece component with drag support — renders piece images
 */
export default function Piece({ piece, square, isCurrentPlayerPiece, isSelected }) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: 'PIECE',
      item: { square, piece },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [piece, square]
  );

  if (!piece) return null;

  const key = `${piece.color}${piece.type}`;
  const imageSrc = PIECE_IMAGES[key];
  const altText = PIECE_NAMES[key] || 'Chess piece';

  if (!imageSrc) return null;

  const activeClass = isSelected 
    ? (piece.color === 'w' ? 'piece-active-w' : 'piece-active-b') 
    : '';

  return (
    <div
      ref={dragRef}
      className={`piece ${isDragging ? 'piece-dragging' : ''} ${activeClass}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <img
        src={imageSrc}
        alt={altText}
        className="piece-img"
        draggable={false}
      />
    </div>
  );
}
