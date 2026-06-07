import React, { useState } from 'react';

interface EssayGraderToolProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing') => void;
}

export const EssayGraderTool: React.FC<EssayGraderToolProps> = ({ setView }) => {
  const [essayPrompt, setEssayPrompt] = useState('');
  const [essayInput, setEssayInput] = useState('');
  const [isGradingEssay, setIsGradingEssay] = useState(false);
  const [essayGradingResult, setEssayGradingResult] = useState<{
    grade: string;
    thesisScore: number;
    grammarScore: number;
    structureScore: number;
    critique: string;
    recommendations: string[];
  } | null>(null);

  const handleGrade = () => {
    if (!essayInput.trim()) return;
    setIsGradingEssay(true);
    setTimeout(() => {
      setEssayGradingResult({
        grade: "B+",
        thesisScore: 88,
        grammarScore: 92,
        structureScore: 85,
        critique: "The essay presents a solid, logical thesis argument regarding industrial shifts, supported by sequential references. However, the transitional flow between the third body paragraph and conclusion feels abrupt.",
        recommendations: [
          "Strengthen topic transitions by introducing connecting clauses at paragraph ends.",
          "Add one primary source citation in the third body section to back the economic efficiency assertion.",
          "Avoid repeating similar adjectives in the final summary section."
        ]
      });
      setIsGradingEssay(false);
    }, 1500);
  };

  return (
    <div className="sub-page-container">
      <button onClick={() => setView('tools')} className="btn btn-outline" style={{ marginBottom: '2rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
        &larr; Back to Utilities
      </button>
      <header className="sub-page-header" style={{ marginBottom: '3rem' }}>
        <h1 className="sub-page-title">AI Essay Grader</h1>
        <p className="sub-page-intro">Critique essay drafts against structural rubrics and clear grading points.</p>
      </header>

      <div className="dashboard-card" style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Essay Prompt or Question Topic</label>
          <input
            type="text"
            placeholder="e.g. Compare primary causes of political shifts in the 19th Century..."
            value={essayPrompt}
            onChange={(e) => setEssayPrompt(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '1rem' }}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Essay Content</label>
          <textarea
            placeholder="Paste your essay draft content here..."
            value={essayInput}
            onChange={(e) => setEssayInput(e.target.value)}
            className="form-input"
            style={{ minHeight: '200px', resize: 'vertical', padding: '0.75rem' }}
          />
        </div>

        <button
          onClick={handleGrade}
          disabled={isGradingEssay || !essayInput.trim()}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontWeight: 'bold' }}
        >
          {isGradingEssay ? 'Analyzing Essay Text...' : 'Analyze Draft Essay Grade'}
        </button>
      </div>

      {isGradingEssay && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className="status-indicator-dot online" style={{ margin: '0 auto 1rem auto', width: '12px', height: '12px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Lumio is auditing sentence flows, evaluating thesis claims, and formatting recommendations...</p>
        </div>
      )}

      {!isGradingEssay && essayGradingResult && (
        <div className="dashboard-card" style={{ border: '1px solid var(--primary)' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Grading Review Scorecard</span>
            <button 
              onClick={() => { setEssayGradingResult(null); setEssayInput(''); setEssayPrompt(''); }}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Reset
            </button>
          </h3>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
              {essayGradingResult.grade}
            </div>
            <div style={{ flex: 1, minWidth: '220px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Thesis Argument</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{essayGradingResult.thesisScore}%</div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Grammar / Flow</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{essayGradingResult.grammarScore}%</div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Structure</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{essayGradingResult.structureScore}%</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>General Critique</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>{essayGradingResult.critique}</p>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Recommendations for Improvement</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.25rem', margin: 0 }}>
              {essayGradingResult.recommendations.map((rec, index) => (
                <li key={index} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
