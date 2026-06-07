const TYPE_COLORS = {
  MOVEMENT: 'bg-cyan-500/20 text-cyan-400',
  CAPTURE: 'bg-rose-500/20 text-rose-400',
  SPECIAL: 'bg-purple-500/20 text-purple-400',
  BOARD: 'bg-amber-500/20 text-amber-400',
};

export default function RuleCard({ activeRules }) {
  return (
    <div className="bg-[#1e1e3c]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group/card transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      {/* Animated gradient border effect */}
      <div className="absolute inset-[-2px] bg-gradient-to-br from-purple-500 via-cyan-500 to-amber-500 opacity-20 -z-10 rounded-[18px] group-hover/card:opacity-40 transition-opacity duration-500 animate-[gradient-shift_5s_ease-in-out_infinite]" style={{backgroundSize: '300% 300%'}}></div>
      
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
              className="group relative flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 transition-all duration-300 animate-[slideUp_0.4s_ease-out] cursor-default"
            >
              <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{rule.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[0.95rem] text-white truncate">{rule.name}</div>
                
                {/* Badges */}
                <div className="flex gap-2 items-center mt-1">
                  <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block ${TYPE_COLORS[rule.type] || 'bg-purple-500/20 text-purple-400'}`}>
                    {rule.type}
                  </span>
                  {rule.duration > 0 && (
                    <span className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
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
