import { Chess } from 'chess.js';
import { validateMoveWithRules, getExtraMovesFromRules } from './rulesEngine';

/**
 * Sanitize a chess.js Move object into a plain JSON-serializable object.
 * chess.js v1 returns class instances with internal metadata that
 * boardgame.io cannot serialize. We extract only the data we need.
 */
export function sanitizeMove(move) {
  if (!move) return null;
  return {
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    captured: move.captured || null,
    promotion: move.promotion || null,
    flags: move.flags,
    san: move.san || null,
    lan: move.lan || null,
    before: move.before || null,
    after: move.after || null,
  };
}

/**
 * Get all valid moves for a piece, including extra moves from special rules
 */
export function getAllValidMoves(G, square) {
  const chess = new Chess(G.fen);
  const piece = chess.get(square);

  if (!piece) return [];

  // Get standard chess.js legal moves
  let moves = chess.moves({ square, verbose: true });

  // Filter out moves blocked by rules (e.g., Shield Wall)
  moves = moves.filter((move) => {
    const result = validateMoveWithRules(move, G.rulesEngine, chess);
    return result.valid;
  });

  // Add extra moves from active rules
  const extraMoves = getExtraMovesFromRules(square, G.rulesEngine, chess);
  // Filter extra moves that also pass rule validation
  const validExtraMoves = extraMoves.filter((m) => {
    const result = validateMoveWithRules(m, G.rulesEngine, chess);
    return result.valid;
  });

  return [...moves.map((m) => ({ from: m.from, to: m.to, promotion: m.promotion, flags: m.flags })), ...validExtraMoves];
}
