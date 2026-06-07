/**
 * core.js
 * Core logic for generating, applying, and reverting special rules in Chaos Chess.
 *
 * IMPORTANT: All state stored by this engine MUST be JSON-serializable
 * because boardgame.io requires it. We only store rule IDs and modifier
 * flags — never function references.
 */

import rulePool from '../../rules/rulePool';
import { getRandomRule } from '../../utils/ruleManager';

export const TURNS_PER_RULE_CHANGE = 5;

// Lookup map: rule ID -> rule object (with functions)
const RULE_MAP = {};
for (const rule of rulePool) {
  RULE_MAP[rule.id] = rule;
}

/**
 * Shared mapping from rule ID to modifier key.
 * Used by applyRule and tickTurnCounter to avoid duplication.
 */
export const MODIFIER_KEYS = {
  reverse_pawns: 'reversePawns',
  explosive_captures: 'explosiveCaptures',
  knights_frenzy: 'knightsFrenzy',
  teleportation: 'teleportation',
  fortress_king: 'fortressKing',
  shield_wall: 'shieldWall',
  bishop_surge: 'bishopSurge',
  phantom_rook: 'phantomRook',
};

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
    ruleDurations: {},        // Map of ruleId -> remaining turns (1-8)
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
 * Draft 3 new random rules.
 * Does not mutate rulesState (except we don't apply modifiers yet).
 * Returns array of serializable rule info for the popup.
 */
export function draftRules(rulesState) {
  const drafted = [];
  const excludeIds = [...rulesState.activeRuleIds];
  
  for (let i = 0; i < 3; i++) {
    const newRule = getRandomRule(excludeIds);
    if (!newRule) break;
    drafted.push({
      id: newRule.id,
      name: newRule.name,
      description: newRule.description,
      type: newRule.type,
      icon: newRule.icon,
    });
    if (!excludeIds.includes(newRule.id)) {
      excludeIds.push(newRule.id);
    }
  }
  return drafted;
}

/**
 * Apply a selected drafted rule.
 * Mutates rulesState directly (Immer-compatible).
 */
export function applyRule(rulesState, ruleId) {
  const rule = getRuleById(ruleId);
  if (!rule) return;

  const modKey = MODIFIER_KEYS[ruleId];
  if (modKey) {
    rulesState.activeModifiers[modKey] = true;
  }

  // Set random duration between 1 and 8 turns
  const duration = Math.floor(Math.random() * 8) + 1;
  rulesState.ruleDurations[ruleId] = duration;

  if (!rulesState.activeRuleIds.includes(ruleId)) {
    rulesState.activeRuleIds.push(ruleId);
  }
  rulesState.ruleHistory.push({ ruleId, drawnAtTurn: rulesState.turnsUntilNextRule });
  rulesState.turnsUntilNextRule = TURNS_PER_RULE_CHANGE;
}

/**
 * Decrement the turn counter toward the next rule.
 * Mutates rulesState directly (Immer-compatible).
 */
export function tickTurnCounter(rulesState) {
  rulesState.turnsUntilNextRule -= 1;

  // Decrease duration of active rules and expire them if they reach 0
  const remainingRuleIds = [];
  for (const ruleId of rulesState.activeRuleIds) {
    if (rulesState.ruleDurations[ruleId] > 0) {
      rulesState.ruleDurations[ruleId] -= 1;
    }
    
    if (rulesState.ruleDurations[ruleId] === 0) {
      // Expire rule
      delete rulesState.ruleDurations[ruleId];
      const modKey = MODIFIER_KEYS[ruleId];
      if (modKey) {
        delete rulesState.activeModifiers[modKey];
      }
      // Special cleanup for teleportation
      if (ruleId === 'teleportation') {
        rulesState.teleportMode = false;
      }
    } else {
      remainingRuleIds.push(ruleId);
    }
  }
  rulesState.activeRuleIds = remainingRuleIds;
}
