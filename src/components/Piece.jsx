import { useDrag } from 'react-dnd';

// Import chess piece images
import WKing from '../Img-chess/W-King.png';
import WQueen from '../Img-chess/W-Queen.png';
import WRook from '../Img-chess/W-Rook.png';
import WBishop from '../Img-chess/W-Bishop.png';
import WKnight from '../Img-chess/W-Knight.png';
import WPawn from '../Img-chess/W-Pawn.png';
import BKing from '../Img-chess/B-King.png';
import BQueen from '../Img-chess/B-Queen.png';
import BRook from '../Img-chess/B-Rook.png';
import BBishop from '../Img-chess/B-Bishop.png';
import BKnight from '../Img-chess/B-Knight.png';
import BPawn from '../Img-chess/B-Pawn.png';

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
export default function Piece({ piece, square }) {
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

  return (
    <div
      ref={dragRef}
      className={`piece ${isDragging ? 'piece-dragging' : ''}`}
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
