/**
 * chessHelpers.js
 * Wrapper functions for interacting with chess.js
 * Provides a clean API layer between our game logic and the chess.js library.
 */

import { Chess } from 'chess.js';

/**
 * Create a new chess.js instance
 * @param {string} [fen] - Optional FEN string to initialize from
 * @returns {Chess} chess.js instance
 */
export function createChessInstance(fen) {
  return fen ? new Chess(fen) : new Chess();
}

/**
 * Get all legal moves for a piece at a given square
 * @param {Chess} chess - chess.js instance
 * @param {string} square - e.g., 'e2'
 * @returns {Array} Array of move objects
 */
export function getLegalMoves(chess, square) {
  return chess.moves({ square, verbose: true });
}

/**
 * Attempt to make a move
 * @param {Chess} chess - chess.js instance
 * @param {object} moveObj - { from, to, promotion? }
 * @returns {object|null} Move result or null if invalid
 */
export function makeMove(chess, moveObj) {
  try {
    return chess.move(moveObj);
  } catch {
    return null;
  }
}

/**
 * Get the piece at a specific square
 * @param {Chess} chess - chess.js instance
 * @param {string} square - e.g., 'e2'
 * @returns {object|null} { type, color } or null
 */
export function getPieceAt(chess, square) {
  return chess.get(square);
}

/**
 * Get the current board state as a 2D array
 * @param {Chess} chess - chess.js instance
 * @returns {Array} 8x8 array of pieces
 */
export function getBoardArray(chess) {
  return chess.board();
}

/**
 * Check if the current position is check
 * @param {Chess} chess
 * @returns {boolean}
 */
export function isCheck(chess) {
  return chess.isCheck();
}

/**
 * Check if the current position is checkmate
 * @param {Chess} chess
 * @returns {boolean}
 */
export function isCheckmate(chess) {
  return chess.isCheckmate();
}

/**
 * Check if the game is a draw
 * @param {Chess} chess
 * @returns {boolean}
 */
export function isDraw(chess) {
  return chess.isDraw();
}

/**
 * Check if the game is over (checkmate, draw, stalemate)
 * @param {Chess} chess
 * @returns {boolean}
 */
export function isGameOver(chess) {
  return chess.isGameOver();
}

/**
 * Get the current turn color
 * @param {Chess} chess
 * @returns {'w' | 'b'}
 */
export function getCurrentTurn(chess) {
  return chess.turn();
}

/**
 * Get the FEN string of current position
 * @param {Chess} chess
 * @returns {string}
 */
export function getFen(chess) {
  return chess.fen();
}

/**
 * Load a FEN string into the chess instance
 * @param {Chess} chess
 * @param {string} fen
 */
export function loadFen(chess, fen) {
  chess.load(fen);
}

/**
 * Undo the last move
 * @param {Chess} chess
 * @returns {object|null} The undone move or null
 */
export function undoMove(chess) {
  return chess.undo();
}

/**
 * Convert square notation to row/col indices
 * @param {string} square - e.g., 'e2'
 * @returns {{ row: number, col: number }}
 */
export function squareToIndices(square) {
  const col = square.charCodeAt(0) - 97; // a=0, b=1, ...
  const row = 8 - parseInt(square[1]);    // 8=0, 7=1, ...
  return { row, col };
}

/**
 * Convert row/col indices to square notation
 * @param {number} row - 0-7 (0=rank 8, 7=rank 1)
 * @param {number} col - 0-7 (0=file a, 7=file h)
 * @returns {string} Square notation (e.g., 'e2')
 */
export function indicesToSquare(row, col) {
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}

/**
 * Remove a piece from a square (for explosive captures etc.)
 * @param {Chess} chess
 * @param {string} square
 */
export function removePiece(chess, square) {
  chess.remove(square);
}

/**
 * Place a piece on a square (for teleportation etc.)
 * @param {Chess} chess
 * @param {object} piece - { type, color }
 * @param {string} square
 */
export function placePiece(chess, piece, square) {
  chess.put(piece, square);
}

/**
 * Get move history
 * @param {Chess} chess
 * @returns {Array} Array of move objects
 */
export function getMoveHistory(chess) {
  return chess.history({ verbose: true });
}

/**
 * Map piece type + color to Unicode symbol
 */
export const PIECE_SYMBOLS = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

/**
 * Get the Unicode chess symbol for a piece
 * @param {object} piece - { type, color }
 * @returns {string} Unicode symbol
 */
export function getPieceSymbol(piece) {
  if (!piece) return '';
  return PIECE_SYMBOLS[`${piece.color}${piece.type}`] || '';
}
