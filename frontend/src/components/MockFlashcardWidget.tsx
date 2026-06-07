import React, { useState } from 'react';

export const MockFlashcardWidget: React.FC = () => {
  const [authFlashcardFlipped, setAuthFlashcardFlipped] = useState(false);

  return (
    <div 
      className={`mock-flashcard ${authFlashcardFlipped ? 'flipped' : ''}`}
      onClick={() => setAuthFlashcardFlipped(!authFlashcardFlipped)}
      style={{
        perspective: '1000px',
        cursor: 'pointer',
        height: '180px'
      }}
    >
      <div className="flashcard-inner" style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transition: 'transform 0.6s',
        transformStyle: 'preserve-3d',
        transform: authFlashcardFlipped ? 'rotateY(180deg)' : 'none'
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          background: 'var(--bg-app)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Flashcard</span>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Due Now</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>Mitosis</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', margin: 0 }}>Click card to flip & learn</p>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'var(--bg-app)',
          border: '1px solid var(--primary)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Definition</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>+15 XP</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4, margin: '0.25rem 0' }}>
            Cell division resulting in two identical daughter cells, maintaining parent chromosome numbers.
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', margin: 0 }}>Click card to flip back</p>
        </div>
      </div>
    </div>
  );
};
