import './HUD.css';
/**
 * GameStatus - Shows game state, captured pieces, move history, and new game button
 */

const PIECE_SYMBOLS = {
  k: { w: '♔', b: '♚' },
  q: { w: '♕', b: '♛' },
  r: { w: '♖', b: '♜' },
  b: { w: '♗', b: '♝' },
  n: { w: '♘', b: '♞' },
  p: { w: '♙', b: '♟' },
};

export default function GameStatus({ G, moves }) {
  const { gameStatus, capturedPieces, moveHistory } = G;

  const statusConfig = {
    check: { text: '⚠️ Check!', className: 'status-check' },
    checkmate: { text: `🏆 Checkmate! ${G.currentPlayer === 'w' ? 'Black' : 'White'} wins!`, className: 'status-checkmate' },
    draw: { text: '🤝 Draw!', className: 'status-draw' },
    stalemate: { text: '🤝 Stalemate!', className: 'status-draw' },
  };

  const status = statusConfig[gameStatus];

  // Format move for display
  const formatMove = (move, idx) => {
    const moveNum = Math.floor(idx / 2) + 1;
    const prefix = idx % 2 === 0 ? `${moveNum}. ` : '';
    if (move.flags === 'teleport') {
      return `${prefix}${move.from}→${move.to} ✨`;
    }
    const piece = move.piece?.toUpperCase() === 'P' ? '' : move.piece?.toUpperCase() || '';
    const capture = move.captured ? 'x' : '';
    return `${prefix}${piece}${capture}${move.to}`;
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Status Banner */}
      {status && (
        <div className={`status-banner ${status.className}`}>
          {status.text}
        </div>
      )}

      {/* Captured Pieces */}
      <div>
        <div className="section-title">💀 Captured</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '14px' }}>♙</span>
            <div className="captured-pieces">
              {capturedPieces.w.map((p, i) => (
                <span key={i}>{PIECE_SYMBOLS[p]?.w || p}</span>
              ))}
              {capturedPieces.w.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '14px' }}>♟</span>
            <div className="captured-pieces">
              {capturedPieces.b.map((p, i) => (
                <span key={i}>{PIECE_SYMBOLS[p]?.b || p}</span>
              ))}
              {capturedPieces.b.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Move History */}
      <div>
        <div className="section-title">📜 Moves</div>
        <div className="move-history">
          {moveHistory.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No moves yet</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
              {moveHistory.slice(-20).map((move, idx) => (
                <span key={idx} className="move-entry">
                  {formatMove(move, moveHistory.length - 20 + idx < 0 ? idx : moveHistory.length - 20 + idx)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Game Button */}
      <button className="btn-new-game" onClick={() => moves.resetGame()}>
        🔄 New Game
      </button>
    </div>
  );
}
