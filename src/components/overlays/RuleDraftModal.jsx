import './Overlays.css';
export default function RuleDraftModal({ draftedRules, onSelectRule }) {
  if (!draftedRules || draftedRules.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-gradient-to-br from-indigo-950 to-purple-950 border border-purple-500/40 rounded-2xl p-8 max-w-5xl w-11/12 text-center shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-[popup-entrance_0.5s_ease-out]">
        
        <h2 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-wider font-display">
          Draft a Rule
        </h2>
        <p className="text-gray-300 mb-8 font-medium">Choose one rule to apply to the game!</p>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch">
          {draftedRules.map((rule) => (
            <div 
              key={rule.id}
              onClick={() => onSelectRule(rule.id)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6 cursor-pointer flex flex-col items-center transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_10px_30px_rgba(168,85,247,0.4)] hover:-translate-y-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="text-6xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {rule.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display text-center relative z-10">
                {rule.name}
              </h3>
              <p className="text-sm text-gray-300 text-center flex-grow relative z-10">
                {rule.description}
              </p>
              
              <div className="mt-4 mb-2 bg-purple-500/20 rounded-full px-4 py-1 border border-purple-500/30 relative z-10">
                <span className="text-xs font-bold text-purple-300">
                  ⏳ Lasts for {rule.duration} {rule.duration === 1 ? 'turn' : 'turns'}
                </span>
              </div>
              
              <div className="mt-4 w-full pt-4 border-t border-white/10 relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400 group-hover:text-cyan-400 transition-colors duration-300">
                  Select Rule
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
