/**
 * App.jsx - Main entry point for Chaos Chess
 * Uses boardgame.io Client to wrap the game with UI
 */

import { useState, useCallback } from 'react';
import { Client } from 'boardgame.io/react';
import ChaosChess from './game/ChaosChessEngine';
import Board from './components/board/Board';
import RuleCard from './components/hud/RuleCard';
import TurnCounter from './components/hud/TurnCounter';
import GameStatus from './components/hud/GameStatus';
import RuleDraftModal from './components/overlays/RuleDraftModal';
import { getActiveRulesInfo } from './game/rulesEngine';

/**
 * The main board component receives boardgame.io props
 */
function ChaosChessBoard({ G, ctx, moves, reset }) {
  const handleSelectDraftedRule = (ruleId) => {
    moves.selectDraftedRule(ruleId);
  };

  return (
    <div className="app-container">
      {/* Title */}
      <h1 className="app-title">
        <span>⚔️ </span>CHAOS CHESS
      </h1>

      {/* Game Layout */}
      <div className="game-layout">
        {/* Left Sidebar */}
        <div className="sidebar">
          <TurnCounter
            turnCount={G.turnCount}
            turnsUntilNextRule={G.rulesEngine?.turnsUntilNextRule ?? 5}
            currentPlayer={G.currentPlayer}
          />
          <RuleCard activeRules={getActiveRulesInfo(G.rulesEngine)} />
        </div>

        {/* Board */}
        <Board G={G} ctx={ctx} moves={moves} reset={reset} />

        {/* Right Sidebar */}
        <div className="sidebar">
          <GameStatus G={G} moves={moves} />
        </div>
      </div>

      {/* Rule Drafting Modal */}
      {G.isDraftingRule && (
        <RuleDraftModal 
          draftedRules={G.draftedRules} 
          onSelectRule={handleSelectDraftedRule} 
        />
      )}
    </div>
  );
}

const App = Client({
  game: ChaosChess,
  board: ChaosChessBoard,
  debug: false,
});

export default App;
