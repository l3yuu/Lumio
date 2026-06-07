import React, { useState } from 'react';

interface CondenserToolProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing') => void;
}

export const CondenserTool: React.FC<CondenserToolProps> = ({ setView }) => {
  const [condenserInput, setCondenserInput] = useState('');
  const [isCondensing, setIsCondensing] = useState(false);
  const [condensedResult, setCondensedResult] = useState<{
    summary: string;
    takeaways: string[];
    vocabulary: { term: string; definition: string }[];
  } | null>(null);

  const handleCondense = () => {
    if (!condenserInput.trim()) return;
    setIsCondensing(true);
    setTimeout(() => {
      setCondensedResult({
        summary: "This section explores cell membrane structures, emphasizing the selective permeability that allows cells to regulate internal environments. Transport mechanisms are classified into passive (diffusion, osmosis) and active (requiring ATP) modes, supported by specific membrane-spanning protein channels.",
        takeaways: [
          "Membrane structure follows the Fluid Mosaic Model (lipid bilayer with embedded proteins).",
          "Passive transport requires no metabolic energy, moving solute molecules down concentrations gradients.",
          "Active transport uses carrier proteins and ATP energy to pump ions against concentrations gradients."
        ],
        vocabulary: [
          { term: "Selective Permeability", definition: "A barrier property allowing specific substances to pass while locking others out." },
          { term: "Osmosis", definition: "Net movement of water across semi-permeable membranes from dilute to concentrated zones." },
          { term: "Active Transport", definition: "Energy-demanding movement of solutes across cell boundaries against gradients." }
        ]
      });
      setIsCondensing(false);
    }, 1500);
  };

  return (
    <div className="sub-page-container">
      <button onClick={() => setView('tools')} className="btn btn-outline" style={{ marginBottom: '2rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
        &larr; Back to Utilities
      </button>
      <header className="sub-page-header" style={{ marginBottom: '3rem' }}>
        <h1 className="sub-page-title">Document Condenser</h1>
        <p className="sub-page-intro">Condense lecture slide outlines or full textbook chapters into concise summaries.</p>
      </header>

      <div className="dashboard-card" style={{ marginBottom: '3rem' }}>
        <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Textbook Chapters or Slides Draft Text</label>
        <textarea
          placeholder="Paste raw textbook segments, slide transcripts, or outline drafts..."
          value={condenserInput}
          onChange={(e) => setCondenserInput(e.target.value)}
          className="form-input"
          style={{ minHeight: '180px', resize: 'vertical', marginBottom: '1.25rem', padding: '0.75rem' }}
        />
        <button
          onClick={handleCondense}
          disabled={isCondensing || !condenserInput.trim()}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontWeight: 'bold' }}
        >
          {isCondensing ? 'Condensing Document Materials...' : 'Condense Draft Content'}
        </button>
      </div>

      {isCondensing && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className="status-indicator-dot online" style={{ margin: '0 auto 1rem auto', width: '12px', height: '12px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Lumio is removing redundancy, isolating vocabulary, and formatting key summaries...</p>
        </div>
      )}

      {!isCondensing && condensedResult && (
        <div className="dashboard-card" style={{ border: '1px solid var(--primary)' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Condensed Materials Summary</span>
            <button 
              onClick={() => { setCondensedResult(null); setCondenserInput(''); }}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Reset
            </button>
          </h3>

          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>High-Density Overview</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>{condensedResult.summary}</p>
          </div>

          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Core Takeaways</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.25rem', margin: 0 }}>
              {condensedResult.takeaways.map((take, index) => (
                <li key={index} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  {take}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Key Terminology & Definitions</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              {condensedResult.vocabulary.map((vocab, index) => (
                <div key={index} style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>{vocab.term}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{vocab.definition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
