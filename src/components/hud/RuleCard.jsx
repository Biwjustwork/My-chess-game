import './HUD.css';
const TYPE_CLASSES = {
  MOVEMENT: 'badge-movement',
  CAPTURE: 'badge-capture',
  SPECIAL: 'badge-special',
  BOARD: 'badge-board',
};

export default function RuleCard({ activeRules }) {
  return (
    <div className="glass-card relative overflow-hidden">
      <div className="font-display text-lg font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
        🎲 Active Rules
      </div>

      {(!activeRules || activeRules.length === 0) ? (
        <div className="text-center text-gray-400 py-6 text-sm">
          <div className="text-4xl mb-2 opacity-50">⏳</div>
          <p>No rules active yet.</p>
          <p className="text-xs mt-1 opacity-70">A new rule appears every 5 turns!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeRules.map((rule, idx) => (
            <div 
              key={rule.id + '-' + idx} 
              className="rule-item group relative cursor-default"
            >
              <span className="text-2xl shrink-0">{rule.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[0.95rem] text-white truncate">{rule.name}</div>
                
                {/* Badges */}
                <div className="flex gap-2 items-center mt-1">
                  <span className={`rule-type-badge ${TYPE_CLASSES[rule.type] || 'badge-special'}`}>
                    {rule.type}
                  </span>
                  {rule.duration > 0 && (
                    <span className="rule-type-badge badge-duration">
                      ⏱ {rule.duration} {rule.duration === 1 ? 'TURN' : 'TURNS'}
                    </span>
                  )}
                </div>

                {/* Expanding Description on Hover */}
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 ease-out mt-1">
                  <div className="overflow-hidden">
                    <p className="text-xs text-gray-300 leading-relaxed pt-1 pb-1 whitespace-pre-line">
                      {rule.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
