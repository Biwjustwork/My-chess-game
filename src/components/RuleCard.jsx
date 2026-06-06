/**
 * RuleCard - Displays active special rules with glassmorphism styling
 */

const TYPE_BADGE_CLASS = {
  MOVEMENT: 'badge-movement',
  CAPTURE: 'badge-capture',
  SPECIAL: 'badge-special',
  BOARD: 'badge-board',
};

export default function RuleCard({ activeRules }) {
  return (
    <div className="glass-card rule-card-container">
      <div className="section-title">
        🎲 Active Rules
      </div>

      {(!activeRules || activeRules.length === 0) ? (
        <div className="no-rules-placeholder">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div>No rules active yet.</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            A new rule appears every 5 turns!
          </div>
        </div>
      ) : (
        activeRules.map((rule, idx) => (
          <div key={rule.id + '-' + idx} className="rule-item">
            <span className="rule-icon">{rule.icon}</span>
            <div>
              <div className="rule-name">{rule.name}</div>
              <div className="rule-desc">{rule.description}</div>
              <span className={`rule-type-badge ${TYPE_BADGE_CLASS[rule.type] || 'badge-special'}`}>
                {rule.type}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
