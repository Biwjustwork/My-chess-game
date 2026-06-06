/**
 * RulesEngine.js
 * Logic for generating, applying, and reverting special rules in Chaos Chess.
 * Manages the lifecycle of randomized rules that activate every 5 turns.
 */

import { getRandomRule } from './rulePool';

const TURNS_PER_RULE_CHANGE = 5;

/**
 * Initialize the rules engine state
 */
export function initRulesEngine() {
  return {
    activeRules: [],        // Array of currently active rule objects
    ruleHistory: [],        // History of all rules that have been drawn
    turnsUntilNextRule: TURNS_PER_RULE_CHANGE,
    activeModifiers: {},    // Key-value map of active modifier flags
    pendingSecondMove: null, // For Knight's Frenzy — tracks if knight has a second move
    teleportMode: false,     // For Teleportation — whether we're in teleport selection mode
  };
}

/**
 * Check if it's time for a new rule to be drawn (every 5 turns)
 * @param {number} turnCount - Current global turn count (increments after each player's move)
 * @returns {boolean}
 */
export function shouldDrawNewRule(turnCount) {
  return turnCount > 0 && turnCount % TURNS_PER_RULE_CHANGE === 0;
}

/**
 * Draw a new random rule and add it to the active rules
 * @param {object} rulesState - Current rules engine state
 * @returns {object} Updated rules state with new rule added
 */
export function drawNewRule(rulesState) {
  const activeRuleIds = rulesState.activeRules.map((r) => r.id);
  const newRule = getRandomRule(activeRuleIds);

  const updatedState = {
    ...rulesState,
    activeRules: [...rulesState.activeRules, newRule],
    ruleHistory: [...rulesState.ruleHistory, { rule: newRule, drawnAtTurn: rulesState.turnsUntilNextRule }],
    turnsUntilNextRule: TURNS_PER_RULE_CHANGE,
  };

  // Apply the rule's state modifications
  if (newRule.apply) {
    return newRule.apply(updatedState);
  }
  return updatedState;
}

/**
 * Decrement the turn counter toward the next rule
 * @param {object} rulesState
 * @returns {object} Updated state
 */
export function tickTurnCounter(rulesState) {
  return {
    ...rulesState,
    turnsUntilNextRule: rulesState.turnsUntilNextRule - 1,
  };
}

/**
 * Check if a move is valid under the current active rules
 * This is used to override/augment chess.js validation
 * @param {object} move - { from, to, piece, captured }
 * @param {object} rulesState - Current rules engine state
 * @param {object} chess - chess.js instance
 * @returns {{ valid: boolean, reason: string | null }}
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
 * Get extra valid moves granted by active rules
 * @param {string} square - The square a piece is on (e.g., 'e2')
 * @param {object} rulesState - Current rules engine state
 * @param {object} chess - chess.js instance
 * @returns {Array} Extra moves [{from, to}, ...]
 */
export function getExtraMovesFromRules(square, rulesState, chess) {
  const piece = chess.get(square);
  if (!piece) return [];

  const extraMoves = [];
  const modifiers = rulesState.activeModifiers || {};

  for (const rule of rulesState.activeRules) {
    if (rule.getExtraMoves) {
      // Check if this rule's modifier is actually active
      const modifierKey = Object.keys(modifiers).find((k) =>
        rule.id.replace(/_([a-z])/g, (_, l) => l.toUpperCase()) ===
        k.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/_([a-z])/g, (_, l) => l.toUpperCase())
      );
      // Simpler: just check if any modifier for this rule is set
      if (rule.apply) {
        const testState = rule.apply({ activeModifiers: {} });
        const ruleModKey = Object.keys(testState.activeModifiers)[0];
        if (modifiers[ruleModKey]) {
          const moves = rule.getExtraMoves(square, piece, chess);
          extraMoves.push(...moves);
        }
      }
    }
  }

  return extraMoves;
}

/**
 * Apply post-move effects from active rules (e.g., Explosive Captures)
 * @param {object} move - The move that was just made
 * @param {object} rulesState - Current rules engine state
 * @param {object} chess - chess.js instance (will be mutated)
 * @returns {object} Updated rules state
 */
export function applyPostMoveEffects(move, rulesState, chess) {
  const modifiers = rulesState.activeModifiers || {};
  let updatedState = { ...rulesState };

  // Explosive Captures: clear 3x3 grid around captured square
  if (modifiers.explosiveCaptures && move.captured) {
    const explosiveRule = rulesState.activeRules.find((r) => r.id === 'explosive_captures');
    if (explosiveRule) {
      const affectedSquares = explosiveRule.getExplosionSquares(move.to);
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
 * Check if a teleportation move is valid
 * @param {string} from - Source square
 * @param {string} to - Target square
 * @param {object} chess - chess.js instance
 * @param {string} currentPlayer - 'w' or 'b'
 * @returns {boolean}
 */
export function isValidTeleportation(from, to, chess, currentPlayer) {
  const piece = chess.get(from);
  if (!piece) return false;
  if (piece.color !== currentPlayer) return false;
  const target = chess.get(to);
  if (target) return false; // Must teleport to empty square
  return true;
}

export { TURNS_PER_RULE_CHANGE };
