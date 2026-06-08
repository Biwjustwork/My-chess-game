/**
 * TurnCounter - Shows turn number, countdown to next rule, and current player
 */

import { TURNS_PER_RULE_CHANGE } from '../../game/rulesEngine';
import './HUD.css';

export default function TurnCounter({ turnCount, turnsUntilNextRule, currentPlayer }) {
  const progress = ((TURNS_PER_RULE_CHANGE - turnsUntilNextRule) / TURNS_PER_RULE_CHANGE) * 100;
  const almostDone = turnsUntilNextRule <= 1;

  return (
    <div className="glass-card turn-counter">
      <div className="turn-label">Turn</div>
      <div className="turn-number">{turnCount}</div>

      <div className="progress-bar-container">
        <div
          className={`progress-bar-fill ${almostDone ? 'almost-done' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div style={{
        fontSize: '0.8rem',
        color: almostDone ? 'var(--accent-amber)' : 'var(--text-muted)',
        marginTop: '0.5rem',
        fontWeight: almostDone ? 600 : 400,
      }}>
        {almostDone
          ? '⚡ New rule next turn!'
          : `Next rule in ${turnsUntilNextRule} turn${turnsUntilNextRule !== 1 ? 's' : ''}`
        }
      </div>

      <div className="player-indicator">
        <div className={`player-dot ${currentPlayer === 'w' ? 'player-dot-white' : 'player-dot-black'}`} />
        <span>{currentPlayer === 'w' ? 'White' : 'Black'} to move</span>
      </div>
    </div>
  );
}
