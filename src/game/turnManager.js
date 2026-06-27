import { Chess } from 'chess.js';
import { evaluateGameStatus } from './gameStateEvaluator';
import { tickTurnCounter, shouldDrawNewRule, draftRules } from './rulesEngine';

export const finalizeTurn = (G, events, currentColor) => {
  tickTurnCounter(G.rulesEngine, currentColor, G);
  
  if (G.rulesEngine.betrayedPieceJustExpired) {
    const freshChess = new Chess(G.fen);
    const freshEval = evaluateGameStatus(G, freshChess);
    G.gameStatus = freshEval.status;
    G.chaosEscapeAvailable = freshEval.chaosEscapeAvailable;
    G.currentPlayer = freshChess.turn();
  }

  G.newRuleDrawn = null;

  if (shouldDrawNewRule(G.turnCount)) {
    const drafted = draftRules(G.rulesEngine);
    if (drafted.length > 0) {
      G.draftedRules = drafted;
      G.isDraftingRule = true;
    }
  }

  if (G.gameStatus === 'checkmate' || G.gameStatus === 'draw' || G.gameStatus === 'stalemate') {
    let winner = undefined;
    if (G.gameStatus === 'checkmate') {
      winner = (G.currentPlayer === 'w') ? '1' : '0';
    }
    events.endGame({ winner });
  } else {
    events.endTurn();
  }
};
