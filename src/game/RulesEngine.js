/**
 * RulesEngine.js
 * Logic for generating, applying, and reverting special rules in Chaos Chess.
 * 
 * IMPORTANT: All state stored by this engine MUST be JSON-serializable
 * because boardgame.io requires it. We only store rule IDs and modifier
 * flags — never function references.
 */

import rulePool from '../rules/rulePool';
import { getRandomRule } from '../utils/ruleManager';

const TURNS_PER_RULE_CHANGE = 5;

// Lookup map: rule ID -> rule object (with functions)
const RULE_MAP = {};
for (const rule of rulePool) {
  RULE_MAP[rule.id] = rule;
}

/**
 * Get a rule object by ID from the pool
 */
export function getRuleById(id) {
  return RULE_MAP[id] || null;
}

/**
 * Initialize the rules engine state (JSON-serializable only!)
 */
export function initRulesEngine() {
  return {
    activeRuleIds: [],        // Array of active rule IDs (strings only)
    ruleHistory: [],          // History: [{ ruleId, drawnAtTurn }]
    turnsUntilNextRule: TURNS_PER_RULE_CHANGE,
    activeModifiers: {},      // Key-value map of active modifier flags (booleans)
    pendingSecondMove: null,  // { piece, square, playerId } or null
    teleportMode: false,
  };
}

/**
 * Check if it's time for a new rule to be drawn (every 5 turns)
 */
export function shouldDrawNewRule(turnCount) {
  return turnCount > 0 && turnCount % TURNS_PER_RULE_CHANGE === 0;
}

/**
 * Draw a new random rule and add it to the active rules
 * Returns { updatedState, newRule } where newRule is the serializable info
 */
export function drawNewRule(rulesState) {
  const newRule = getRandomRule(rulesState.activeRuleIds);

  // Compute new modifiers by applying the rule
  const newModifiers = { ...rulesState.activeModifiers };
  // Each rule sets a specific modifier key
  const modifierKeys = {
    reverse_pawns: 'reversePawns',
    explosive_captures: 'explosiveCaptures',
    knights_frenzy: 'knightsFrenzy',
    teleportation: 'teleportation',
    fortress_king: 'fortressKing',
    shield_wall: 'shieldWall',
    bishop_surge: 'bishopSurge',
    phantom_rook: 'phantomRook',
  };
  const modKey = modifierKeys[newRule.id];
  if (modKey) {
    newModifiers[modKey] = true;
  }

  const updatedState = {
    ...rulesState,
    activeRuleIds: [...rulesState.activeRuleIds, newRule.id],
    ruleHistory: [...rulesState.ruleHistory, { ruleId: newRule.id, drawnAtTurn: rulesState.turnsUntilNextRule }],
    turnsUntilNextRule: TURNS_PER_RULE_CHANGE,
    activeModifiers: newModifiers,
  };

  // Return serializable rule info for the popup (no functions)
  const newRuleInfo = {
    id: newRule.id,
    name: newRule.name,
    description: newRule.description,
    type: newRule.type,
    icon: newRule.icon,
  };

  return { updatedState, newRuleInfo };
}

/**
 * Decrement the turn counter toward the next rule
 */
export function tickTurnCounter(rulesState) {
  return {
    ...rulesState,
    turnsUntilNextRule: rulesState.turnsUntilNextRule - 1,
  };
}

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
    };
    const modKey = modifierKeys[ruleId];
    if (modKey && modifiers[modKey]) {
      const moves = rule.getExtraMoves(square, piece, chess);
      extraMoves.push(...moves);
    }
  }

  return extraMoves;
}

/**
 * Apply post-move effects from active rules (e.g., Explosive Captures)
 */
export function applyPostMoveEffects(move, rulesState, chess) {
  const modifiers = rulesState.activeModifiers || {};
  let updatedState = { ...rulesState };

  // Explosive Captures: clear 3x3 grid around captured square
  if (modifiers.explosiveCaptures && move.captured) {
    const rule = getRuleById('explosive_captures');
    if (rule) {
      const affectedSquares = rule.getExplosionSquares(move.to);
      for (const sq of affectedSquares) {
        const piece = chess.get(sq);
        if (piece && piece.type !== 'k') {
          chess.remove(sq);
        }
      }
    }
  }

  // Knight's Frenzy: allow second move
  if (modifiers.knightsFrenzy && move.piece === 'n' && !updatedState.pendingSecondMove) {
    updatedState = {
      ...updatedState,
      pendingSecondMove: { piece: 'n', square: move.to, playerId: move.color },
    };
  }

  return updatedState;
}

/**
 * Get explosion squares for a given square (used by UI)
 */
export function getExplosionSquares(square) {
  const rule = getRuleById('explosive_captures');
  return rule ? rule.getExplosionSquares(square) : [];
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
  return true;
}

/**
 * Get serializable active rule info for the UI (no functions)
 */
export function getActiveRulesInfo(rulesState) {
  return rulesState.activeRuleIds.map((id) => {
    const rule = getRuleById(id);
    if (!rule) return { id, name: id, description: '', type: '', icon: '❓' };
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      icon: rule.icon,
    };
  });
}

export { TURNS_PER_RULE_CHANGE };
