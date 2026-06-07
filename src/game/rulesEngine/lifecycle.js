/**
 * lifecycle.js
 * Move validation, extra moves, post-move effects, and teleportation logic.
 */

import { Chess } from 'chess.js';
import { getRuleById } from './core';

/**
 * Check if a move is blocked by active rules
 */
export function validateMoveWithRules(move, rulesState, chess) {
  const modifiers = rulesState.activeModifiers || {};

  // Shield Wall: Pawns can't be captured
  if (modifiers.shieldWall && move.captured) {
    const targetPiece = chess.get(move.to);
    if (targetPiece && targetPiece.type === 'p') {
      return { valid: false, reason: 'Shield Wall is active! Pawns cannot be captured.' };
    }
  }

  // Freeze: Frozen pieces cannot move
  if (rulesState.frozenPieces) {
    const frozen = rulesState.frozenPieces[move.color];
    if (frozen && frozen.square === move.from) {
      return { valid: false, reason: 'This piece is frozen in ice and cannot move!' };
    }
  }

  // Exhaustion: Exhausted pieces cannot move
  if (rulesState.exhaustedPieces) {
    const exhausted = rulesState.exhaustedPieces[move.color] || [];
    if (exhausted.some(p => p.square === move.from)) {
      return { valid: false, reason: 'This piece is exhausted and cannot move this turn.' };
    }
  }

  // Permanent rule: Cannot make a move that leaves own King in check
  try {
    const tempChess = new Chess(chess.fen());
    const pieceObj = tempChess.get(move.from);
    if (pieceObj) {
      tempChess.remove(move.from);
      if (move.captured) tempChess.remove(move.to);
      if (move.to) tempChess.put(pieceObj, move.to);
      if (tempChess.isCheck()) {
        return { valid: false, reason: 'Cannot move into check.' };
      }
    }
  } catch (e) {
    console.error('Validation error checking check state:', e);
  }

  return { valid: true, reason: null };
}

/**
 * Get extra valid moves granted by active rules (using rule IDs to look up functions)
 */
export function getExtraMovesFromRules(square, rulesState, chess) {
  const piece = chess.get(square);
  if (!piece) return [];

  const extraMoves = [];
  const modifiers = rulesState.activeModifiers || {};

  for (const ruleId of rulesState.activeRuleIds) {
    const rule = getRuleById(ruleId);
    if (!rule || !rule.getExtraMoves) continue;

    // Check if this rule's modifier is active
    const modifierKeys = {
      reverse_pawns: 'reversePawns',
      fortress_king: 'fortressKing',
      bishop_surge: 'bishopSurge',
      phantom_rook: 'phantomRook',
    };
    const modKey = modifierKeys[ruleId];
    if (modKey && modifiers[modKey]) {
      try {
        const moves = rule.getExtraMoves(square, piece, chess);
        if (!Array.isArray(moves)) {
          console.error(`[Rules Engine] Error: Rule ${rule.id} did not return an array of moves. Returned:`, moves);
        } else {
          extraMoves.push(...moves);
        }
      } catch (error) {
        console.error(`[Rules Engine] Exception executing getExtraMoves for rule ${rule.id}:`, error);
      }
    }
  }

  return extraMoves;
}

/**
 * Apply post-move effects from active rules (e.g., Explosive Captures).
 * Mutates rulesState directly (Immer-compatible).
 */
export function applyPostMoveEffects(move, rulesState, chess) {
  const modifiers = rulesState.activeModifiers || {};
  rulesState.explodedThisTurn = false;

  // Explosive Captures: clear 3x3 grid around captured square
  if (modifiers.explosiveCaptures && move.captured) {
    if (!rulesState.explosiveUsed || !rulesState.explosiveUsed[move.color]) {
      if (!rulesState.explosiveUsed) rulesState.explosiveUsed = { w: false, b: false };
      rulesState.explosiveUsed[move.color] = true;
      rulesState.explodedThisTurn = true;

      const rule = getRuleById('explosive_captures');
      if (rule) {
        const affectedSquares = rule.getExplosionSquares(move.to);
        for (const sq of affectedSquares) {
          const piece = chess.get(sq);
          if (piece && piece.type !== 'k') {
            chess.remove(sq);
          }
        }
        // Kamikaze
        const capturingPiece = chess.get(move.to);
        if (capturingPiece && capturingPiece.type !== 'k') {
          chess.remove(move.to);
        }
      }
    }
  }

  // Knight's Frenzy: allow second move
  if (modifiers.knightsFrenzy && move.piece === 'n' && !rulesState.pendingSecondMove) {
    rulesState.pendingSecondMove = { piece: 'n', square: move.to, playerId: move.color };
  }
}

/**
 * Check if a teleportation move is valid
 */
export function isValidTeleportation(from, to, chess, currentPlayer) {
  const piece = chess.get(from);
  if (!piece) return false;
  if (piece.color !== currentPlayer) return false;
  const target = chess.get(to);
  if (target) return false;

  // Permanent rule: Teleportation cannot leave the King in check
  try {
    const tempChess = new Chess(chess.fen());
    tempChess.remove(from);
    tempChess.put(piece, to);
    if (tempChess.isCheck()) {
      return false;
    }
  } catch (e) {
    console.error('Teleportation validation error checking check state:', e);
  }

  return true;
}
