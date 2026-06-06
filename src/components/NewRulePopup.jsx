/**
 * NewRulePopup - Dramatic reveal modal when a new rule is drawn
 */

import { useEffect, useState } from 'react';

const SPARKLE_COUNT = 12;

function generateSparkles() {
  return Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    delay: Math.random() * 1.5 + 's',
    tx: (Math.random() - 0.5) * 120 + 'px',
    ty: (Math.random() - 0.5) * 120 + 'px',
  }));
}

export default function NewRulePopup({ rule, onDismiss }) {
  const [sparkles] = useState(generateSparkles);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!rule) return null;

  return (
    <div className="popup-overlay" onClick={onDismiss}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        {/* Sparkles */}
        {sparkles.map((s) => (
          <div
            key={s.id}
            className="sparkle"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              '--tx': s.tx,
              '--ty': s.ty,
            }}
          />
        ))}

        <div className="popup-subtitle">⚡ New Rule Activated!</div>
        <div className="popup-icon">{rule.icon}</div>
        <div className="popup-rule-name">{rule.name}</div>
        <div className="popup-rule-desc">{rule.description}</div>

        <button className="popup-btn" onClick={onDismiss}>
          Got it!
        </button>
      </div>
    </div>
  );
}
