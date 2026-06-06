/**
 * App.jsx - Main entry point for Chaos Chess
 * Uses boardgame.io Client to wrap the game with UI
 */

import { useState, useCallback } from 'react';
import { Client } from 'boardgame.io/react';
import ChaosChess from './game/Game';
import Board from './components/Board';
import RuleCard from './components/RuleCard';
import TurnCounter from './components/TurnCounter';
import GameStatus from './components/GameStatus';
import NewRulePopup from './components/NewRulePopup';
import { getActiveRulesInfo } from './game/RulesEngine';

/**
 * The main board component receives boardgame.io props
 */
function ChaosChessBoard({ G, ctx, moves }) {
  const [showNewRule, setShowNewRule] = useState(null);

  // Detect when a new rule is drawn
  // We track it locally to show the popup
  const handleNewRule = useCallback(() => {
    if (G.newRuleDrawn && (!showNewRule || showNewRule.id !== G.newRuleDrawn.id)) {
      setShowNewRule(G.newRuleDrawn);
    }
  }, [G.newRuleDrawn, showNewRule]);

  // Trigger check on render
  if (G.newRuleDrawn && (!showNewRule || showNewRule.id !== G.newRuleDrawn.id)) {
    // Use setTimeout to avoid setting state during render
    setTimeout(() => setShowNewRule(G.newRuleDrawn), 0);
  }

  const dismissPopup = useCallback(() => {
    setShowNewRule(null);
    if (G.newRuleDrawn) {
      moves.clearNewRule();
    }
  }, [moves, G.newRuleDrawn]);

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
        <Board G={G} ctx={ctx} moves={moves} />

        {/* Right Sidebar */}
        <div className="sidebar">
          <GameStatus G={G} moves={moves} />
        </div>
      </div>

      {/* New Rule Popup */}
      {showNewRule && (
        <NewRulePopup rule={showNewRule} onDismiss={dismissPopup} />
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
