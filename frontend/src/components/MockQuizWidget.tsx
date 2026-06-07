import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

export const MockQuizWidget: React.FC = () => {
  const [authMockOptionSelected, setAuthMockOptionSelected] = useState<number | null>(null);

  return (
    <div className="mock-window quiz-mock" style={{ position: 'relative', marginBottom: 'clamp(0.5rem, 1.5vh, 1rem)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div className="mock-window-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
        <div className="mock-dots" style={{ display: 'flex', gap: '6px' }}>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
        </div>
        <div className="mock-window-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Cellular Biology 101 - Quiz</div>
      </div>
      <div className="mock-window-body" style={{ padding: 'clamp(0.75rem, 1.75vh, 1.25rem)' }}>
        <div className="mock-quiz-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
          <span className="mock-badge" style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 600 }}>Active Quiz</span>
          <span className="mock-timer" style={{ color: 'var(--text-secondary)' }}>Time Left: 0:45</span>
        </div>
        
        <h4 className="mock-quiz-question" style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.4, fontWeight: 600 }}>
          Which organelle converts chemical energy from food into compounds the cell can use?
        </h4>
        
        <div className="mock-quiz-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
              padding: '0.5rem 0.75rem',
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

        <AnimatePresence>
          {authMockOptionSelected !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 15, 15, 0.9)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 100,
                padding: '1.5rem'
              }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 350, delay: 0.05 }}
                style={{ textAlign: 'center', maxWidth: '320px', width: '100%' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  {authMockOptionSelected === 1 ? (
                    <>
                      <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle2 size={48} />
                      </div>
                      <h3 style={{ fontSize: '1.3rem', color: '#10b981', fontWeight: 700, margin: '0.25rem 0' }}>Correct Answer!</h3>
                    </>
                  ) : (
                    <>
                      <div style={{ color: '#ef4444', display: 'flex', justifyContent: 'center' }}>
                        <XCircle size={48} />
                      </div>
                      <h3 style={{ fontSize: '1.3rem', color: '#ef4444', fontWeight: 700, margin: '0.25rem 0' }}>Incorrect</h3>
                    </>
                  )}
                  
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                    {[
                      "Incorrect. Chloroplasts convert sunlight energy into sugars via photosynthesis, mostly found in plants.",
                      "Correct! Mitochondria acts as the cell's battery, manufacturing ATP molecules to fuel biological activities.",
                      "Incorrect. Lysosomes digest waste, cellular debris, and foreign invaders."
                    ][authMockOptionSelected]}
                  </p>
                  
                  <button 
                    onClick={() => setAuthMockOptionSelected(null)} 
                    className={authMockOptionSelected === 1 ? "btn btn-primary" : "btn btn-outline"} 
                    style={{ width: '100%', justifyContent: 'center', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  >
                    {authMockOptionSelected === 1 ? "Awesome" : "Try Again"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
