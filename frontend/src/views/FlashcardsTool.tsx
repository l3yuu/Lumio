import React, { useState } from 'react';

interface FlashcardsToolProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing') => void;
}

export const FlashcardsTool: React.FC<FlashcardsToolProps> = ({ setView }) => {
  const [flashcardInput, setFlashcardInput] = useState('');
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<{ front: string; back: string; flipped: boolean }[]>([]);

  const handleGenerate = () => {
    if (!flashcardInput.trim()) return;
    setIsGeneratingFlashcards(true);
    setTimeout(() => {
      setGeneratedFlashcards([
        { front: "What is the primary function of Mitochondria?", back: "To convert chemical energy from nutrients into ATP molecules.", flipped: false },
        { front: "What cellular process occurs in Mitochondria to generate ATP?", back: "Cellular respiration.", flipped: false },
        { front: "What structures distinguish Mitochondria from other organelles?", back: "Double-membranes and their own independent DNA.", flipped: false }
      ]);
      setIsGeneratingFlashcards(false);
    }, 1500);
  };

  return (
    <div className="sub-page-container">
      <button onClick={() => setView('tools')} className="btn btn-outline" style={{ marginBottom: '2rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
        &larr; Back to Utilities
      </button>
      <header className="sub-page-header" style={{ marginBottom: '3rem' }}>
        <h1 className="sub-page-title">Flashcard Generator</h1>
        <p className="sub-page-intro">Convert complex notes into flippable, active-recall study decks instantly.</p>
      </header>

      <div className="dashboard-card" style={{ marginBottom: '3rem' }}>
        <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Study Notes Source Text</label>
        <textarea
          placeholder="Paste text notes or outline drafts..."
          value={flashcardInput}
          onChange={(e) => setFlashcardInput(e.target.value)}
          className="form-input"
          style={{ minHeight: '150px', resize: 'vertical', marginBottom: '1.25rem', padding: '0.75rem' }}
        />
        <button
          onClick={handleGenerate}
          disabled={isGeneratingFlashcards || !flashcardInput.trim()}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontWeight: 'bold' }}
        >
          {isGeneratingFlashcards ? 'Analyzing Concept Outlines...' : 'Generate Flashcards Decks'}
        </button>
      </div>

      {isGeneratingFlashcards && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className="status-indicator-dot online" style={{ margin: '0 auto 1rem auto', width: '12px', height: '12px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Lumio is mapping concepts, formulating questions, and compiling answer sets...</p>
        </div>
      )}

      {!isGeneratingFlashcards && generatedFlashcards.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Generated Study Cards ({generatedFlashcards.length})</span>
            <button 
              onClick={() => { setGeneratedFlashcards([]); setFlashcardInput(''); }} 
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Clear Deck
            </button>
          </h3>
          
          <div className="showcase-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {generatedFlashcards.map((card, index) => (
              <div 
                key={index}
                className={`mock-flashcard ${card.flipped ? 'flipped' : ''}`}
                onClick={() => {
                  const updated = [...generatedFlashcards];
                  updated[index].flipped = !updated[index].flipped;
                  setGeneratedFlashcards(updated);
                }}
                style={{
                  perspective: '1000px',
                  cursor: 'pointer',
                  height: '200px'
                }}
              >
                <div className="flashcard-inner" style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transition: 'transform 0.6s',
                  transformStyle: 'preserve-3d',
                  transform: card.flipped ? 'rotateY(180deg)' : 'none'
                }}>
                  {/* Front */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Concept Card {index + 1}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Active</span>
                    </div>
                    <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0.5rem 0', lineHeight: 1.4 }}>{card.front}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', margin: 0 }}>Click card to flip & reveal answer</p>
                  </div>

                  {/* Back */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--primary)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Answer Sheet</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Correct</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: '0.5rem 0' }}>{card.back}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', margin: 0 }}>Click card to flip back</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
