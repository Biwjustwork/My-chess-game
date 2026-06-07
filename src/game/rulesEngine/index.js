/**
 * rulesEngine/index.js
 * Barrel export — re-exports everything from core, lifecycle, and uiHelpers.
 */

export {
  TURNS_PER_RULE_CHANGE,
  MODIFIER_KEYS,
  getRuleById,
  initRulesEngine,
  shouldDrawNewRule,
  draftRules,
  applyRule,
  tickTurnCounter,
} from './core';

export {
  validateMoveWithRules,
  getExtraMovesFromRules,
  applyPostMoveEffects,
  isValidTeleportation,
} from './lifecycle';

export {
  getExplosionSquares,
  getActiveRulesInfo,
} from './uiHelpers';
