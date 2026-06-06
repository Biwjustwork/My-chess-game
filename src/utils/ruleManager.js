import rulePool from '../rules/rulePool';

/**
 * Get a random rule from the pool, optionally excluding already active rule IDs
 * @param {string[]} excludeIds - IDs of rules already active
 * @returns {object} A random rule object
 */
export function getRandomRule(excludeIds = []) {
  const available = rulePool.filter((r) => !excludeIds.includes(r.id));
  if (available.length === 0) {
    // If all rules have been used, allow repeats
    return rulePool[Math.floor(Math.random() * rulePool.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
