import React, { useState } from 'react';

export const MockQuizWidget: React.FC = () => {
  const [authMockOptionSelected, setAuthMockOptionSelected] = useState<number | null>(null);

  return (
    <div className="mock-window quiz-mock" style={{ marginBottom: '1.5rem', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div className="mock-window-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
        <div className="mock-dots" style={{ display: 'flex', gap: '6px' }}>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
        </div>
        <div className="mock-window-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Cellular Biology 101 - Quiz</div>
      </div>
      <div className="mock-window-body" style={{ padding: '1.5rem' }}>
        <div className="mock-quiz-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.8rem' }}>
          <span className="mock-badge" style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 600 }}>Active Quiz</span>
          <span className="mock-timer" style={{ color: 'var(--text-secondary)' }}>Time Left: 0:45</span>
        </div>
        
        <h4 className="mock-quiz-question" style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: 1.4, fontWeight: 600 }}>
          Which organelle converts chemical energy from food into compounds the cell can use?
        </h4>
        
        <div className="mock-quiz-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { text: "Chloroplasts", id: 0 },
            { text: "Mitochondria", id: 1 },
            { text: "Lysosomes", id: 2 }
          ].map((opt) => {
            let optionStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
            };

            if (authMockOptionSelected !== null) {
              if (opt.id === 1) {
                optionStyle.borderColor = '#10b981';
                optionStyle.background = 'rgba(16, 185, 129, 0.08)';
                optionStyle.color = '#10b981';
              } else if (authMockOptionSelected === opt.id) {
                optionStyle.borderColor = '#ef4444';
                optionStyle.background = 'rgba(239, 68, 68, 0.08)';
                optionStyle.color = '#ef4444';
              } else {
                optionStyle.opacity = 0.5;
              }
            }

            return (
              <button 
                key={opt.id}
                style={optionStyle}
                onClick={() => authMockOptionSelected === null && setAuthMockOptionSelected(opt.id)}
                disabled={authMockOptionSelected !== null}
                className="mock-quiz-option-btn"
              >
                <span style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  border: '1px solid currentColor', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {String.fromCharCode(65 + opt.id)}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {authMockOptionSelected !== null && (
          <div className="mock-explanation" style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', borderLeft: `3px solid ${authMockOptionSelected === 1 ? '#10b981' : '#ef4444'}` }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              {[
                "Incorrect. Chloroplasts convert sunlight energy into sugars via photosynthesis, mostly found in plants.",
                "Correct! Mitochondria acts as the cell's battery, manufacturing ATP molecules to fuel biological activities.",
                "Incorrect. Lysosomes digest waste, cellular debris, and foreign invaders."
              ][authMockOptionSelected]}
            </p>
            <button 
              onClick={() => setAuthMockOptionSelected(null)} 
              style={{ 
                marginTop: '0.75rem', 
                background: 'none', 
                border: 'none', 
                color: 'var(--primary)', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                padding: 0
              }}
            >
              Reset Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
