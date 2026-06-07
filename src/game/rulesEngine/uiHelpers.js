/**
 * uiHelpers.js
 * UI-facing helpers for displaying rule information.
 */

import { getRuleById } from './core';

/**
 * Get explosion squares for a given square (used by UI)
 */
export function getExplosionSquares(square) {
  const rule = getRuleById('explosive_captures');
  return rule ? rule.getExplosionSquares(square) : [];
}

/**
 * Get serializable active rule info for the UI (no functions)
 */
export function getActiveRulesInfo(rulesState) {
  return rulesState.activeRuleIds.map((id) => {
    const rule = getRuleById(id);
    const duration = rulesState.ruleDurations[id] || 0;
    if (!rule) return { id, name: id, description: '', type: '', icon: '❓', duration };
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      icon: rule.icon,
      duration: duration,
    };
  });
}
