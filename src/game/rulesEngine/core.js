/**
 * core.js
 * Core logic for generating, applying, and reverting special rules in Chaos Chess.
 *
 * IMPORTANT: All state stored by this engine MUST be JSON-serializable
 * because boardgame.io requires it. We only store rule IDs and modifier
 * flags — never function references.
 */

import { Chess } from 'chess.js';
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
  freeze: 'freeze',
  betrayal: 'betrayal',
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
    explosiveUsed: { w: false, b: false },
    explodedThisTurn: false,
    exhaustedPieces: { w: [], b: [] },
    frozenPieces: { w: null, b: null },
    betrayedPiece: null,
    betrayedPieceJustExpired: false,
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
    
    let duration = Math.floor(Math.random() * 8) + 1;
    if (newRule.id === 'freeze') {
      duration = Math.floor(Math.random() * 3) + 1;
    } else if (newRule.id === 'betrayal') {
      duration = 3;
    }
    
    drafted.push({
      id: newRule.id,
      name: newRule.name,
      description: newRule.description,
      type: newRule.type,
      icon: newRule.icon,
      duration: duration,
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
export function applyRule(rulesState, ruleId, duration, G) {
  const rule = getRuleById(ruleId);
  if (!rule) return;

  const modKey = MODIFIER_KEYS[ruleId];
  if (modKey) {
    rulesState.activeModifiers[modKey] = true;
  }

  if (ruleId === 'explosive_captures') {
    rulesState.explosiveUsed = { w: false, b: false };
  }

  // Use the provided duration, or default to random if not supplied
  let finalDuration = duration !== undefined ? duration : (Math.floor(Math.random() * 8) + 1);
  if (ruleId === 'freeze' && duration === undefined) {
    finalDuration = Math.floor(Math.random() * 3) + 1;
  } else if (ruleId === 'betrayal' && duration === undefined) {
    finalDuration = 3;
  }

  rulesState.betrayedPieceJustExpired = false;

  if (ruleId === 'betrayal' && G && G.board) {
    const enemyColor = G.currentPlayer === 'w' ? 'b' : 'w';
    const targets = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = G.board[r][c];
        if (piece && piece.color === enemyColor && ['p', 'n', 'b'].includes(piece.type)) {
          targets.push(String.fromCharCode(97 + c) + (8 - r));
        }
      }
    }
    if (targets.length > 0) {
      const targetSq = targets[Math.floor(Math.random() * targets.length)];
      const tempChess = new Chess(G.fen);
      const piece = tempChess.get(targetSq);
      tempChess.remove(targetSq);
      tempChess.put({ type: piece.type, color: G.currentPlayer }, targetSq);
      
      rulesState.betrayedPiece = {
        square: targetSq,
        originalColor: piece.color,
        type: piece.type
      };
      
      G.fen = tempChess.fen();
      G.board = tempChess.board();
    }
  }

  if (ruleId === 'freeze' && G && G.board) {
    const wPieces = [];
    const bPieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = G.board[r][c];
        if (piece && piece.type !== 'k') {
          const sq = String.fromCharCode(97 + c) + (8 - r);
          if (piece.color === 'w') wPieces.push(sq);
          else bPieces.push(sq);
        }
      }
    }
    rulesState.frozenPieces = { w: null, b: null };
    if (wPieces.length > 0) {
      rulesState.frozenPieces.w = {
        square: wPieces[Math.floor(Math.random() * wPieces.length)],
        remaining: finalDuration
      };
    }
    if (bPieces.length > 0) {
      rulesState.frozenPieces.b = {
        square: bPieces[Math.floor(Math.random() * bPieces.length)],
        remaining: finalDuration
      };
    }
  }

  rulesState.ruleDurations[ruleId] = finalDuration;

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
export function tickTurnCounter(rulesState, currentPlayer, G) {
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
      if (ruleId === 'freeze') {
        rulesState.frozenPieces = { w: null, b: null };
      }
      if (ruleId === 'betrayal') {
        if (rulesState.betrayedPiece && G) {
          try {
            const tempChess = new Chess(G.fen);
            const sq = rulesState.betrayedPiece.square;
            const piece = tempChess.get(sq);
            if (piece && piece.color === currentPlayer) {
              tempChess.remove(sq);
              tempChess.put({ type: piece.type, color: rulesState.betrayedPiece.originalColor }, sq);
              G.fen = tempChess.fen();
              G.board = tempChess.board();
              rulesState.betrayedPieceJustExpired = true;
            }
          } catch (e) {
            console.error('Error reverting betrayal:', e);
          }
        }
        rulesState.betrayedPiece = null;
      }
    } else {
      remainingRuleIds.push(ruleId);
    }
  }
  rulesState.activeRuleIds = remainingRuleIds;

  // Tick exhausted pieces for the player whose turn just ended
  if (rulesState.exhaustedPieces && currentPlayer) {
    if (rulesState.exhaustedPieces[currentPlayer]) {
      rulesState.exhaustedPieces[currentPlayer] = rulesState.exhaustedPieces[currentPlayer].filter(p => {
        p.remaining -= 1;
        return p.remaining > 0;
      });
    }
  }

  // Tick frozen pieces for the player whose turn just ended
  if (rulesState.frozenPieces && currentPlayer) {
    if (rulesState.frozenPieces[currentPlayer]) {
      rulesState.frozenPieces[currentPlayer].remaining -= 1;
      if (rulesState.frozenPieces[currentPlayer].remaining <= 0) {
        rulesState.frozenPieces[currentPlayer] = null;
      }
    }
  }
}
