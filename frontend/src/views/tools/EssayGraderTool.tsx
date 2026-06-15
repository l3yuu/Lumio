import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import type { View } from '../../types';
import { API_BASE_URL } from '../../config';

interface EssayGraderToolProps {
  setView: (view: View) => void;
}

interface EssayHistory {
  id: number;
  title: string;
  prompt: string;
  essay_text: string;
  grade: string;
  thesis_score: number;
  grammar_score: number;
  structure_score: number;
  critique: string;
  recommendations: string[];
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const EssayGraderTool: React.FC<EssayGraderToolProps> = ({ setView: _setView }) => {
  const [essayPrompt, setEssayPrompt] = useState('');
  const [essayInput, setEssayInput] = useState('');
  const [isGradingEssay, setIsGradingEssay] = useState(false);
  const [essayError, setEssayError] = useState('');
  const [essayGradingResult, setEssayGradingResult] = useState<{
    grade: string;
    thesisScore: number;
    grammarScore: number;
    structureScore: number;
    critique: string;
    recommendations: string[];
  } | null>(null);

  const [history, setHistory] = useState<EssayHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/essay-grader`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to load essay grading history:', err);
      }
    };

    fetchHistory();
  }, []);

  const deleteHistoryEntry = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/essay-grader/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setHistory(prev => prev.filter(h => h.id !== id));
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to delete essay history entry');
      }
    } catch (err: unknown) {
      console.error('Delete essay history error:', err);
      alert((err instanceof Error ? err.message : null) || 'Failed to delete essay history entry.');
    }
  };

  const loadFromHistory = (entry: EssayHistory) => {
    setEssayPrompt(entry.prompt || '');
    setEssayInput(entry.essay_text);
    setEssayGradingResult({
      grade: entry.grade,
      thesisScore: entry.thesis_score,
      grammarScore: entry.grammar_score,
      structureScore: entry.structure_score,
      critique: entry.critique,
      recommendations: entry.recommendations
    });
    setShowHistory(false);
  };

  const handleGrade = async () => {
    if (!essayInput.trim()) return;
    setIsGradingEssay(true);
    setEssayError('');
    setEssayGradingResult(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setEssayError('You must be logged in to use the AI Essay Grader.');
      setIsGradingEssay(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/essay-grader/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: essayPrompt,
          text: essayInput
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to grade essay.');
      }

      const newRecord = await response.json();
      setEssayGradingResult({
        grade: newRecord.grade,
        thesisScore: newRecord.thesis_score,
        grammarScore: newRecord.grammar_score,
        structureScore: newRecord.structure_score,
        critique: newRecord.critique,
        recommendations: newRecord.recommendations
      });
      setHistory(prev => [newRecord, ...prev]);
    } catch (err: unknown) {
      console.error('Grading essay error:', err);
      setEssayError((err instanceof Error ? err.message : null) || 'Failed to grade essay. Please try again.');
    } finally {
      setIsGradingEssay(false);
    }
  };

  return (
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <header className="text-center mb-12">
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">AI Essay Grader</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Critique essay drafts against structural rubrics and clear grading points.</p>
      </header>

      <div className="bg-card border border-line rounded-xl p-7 mb-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-ink block">Essay Prompt or Question Topic</label>
          <input
            type="text"
            placeholder="e.g. Compare primary causes of political shifts in the 19th Century..."
            value={essayPrompt}
            onChange={(e) => setEssayPrompt(e.target.value)}
            className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary pl-4"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-ink block">Essay Content</label>
          <textarea
            placeholder="Paste your essay draft content here..."
            value={essayInput}
            onChange={(e) => setEssayInput(e.target.value)}
            className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary min-h-[200px] resize-y px-3"
          />
        </div>

        <button
          onClick={handleGrade}
          disabled={isGradingEssay || !essayInput.trim()}
          className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center py-3.5 font-bold"
        >
          {isGradingEssay ? 'Analyzing Essay Text...' : 'Analyze Draft Essay Grade'}
        </button>

        <div className="flex items-center justify-between mt-1 text-xs text-ink-muted">
          <span>Double check criteria for best results</span>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 text-primary hover:text-primary-hover cursor-pointer bg-transparent border-0 font-medium"
            >
              <Clock size={14} />
              {showHistory ? 'Hide History' : 'View History'}
            </button>
          )}
        </div>
      </div>

      {essayError && (
        <div className="flex items-start gap-3 bg-danger-soft text-danger border border-danger-line rounded-lg p-4 mb-6">
          <span className="text-lg leading-none shrink-0 mt-0.5">&#x26A0;</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-0.5">Grading Failed</p>
            <p className="text-[0.85rem] opacity-90">{essayError}</p>
          </div>
          <button
            onClick={() => setEssayError('')}
            className="bg-transparent border-0 text-danger text-sm cursor-pointer shrink-0 p-0 leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* History Section */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card border border-line rounded-xl p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Grading History
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-app border border-line rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadFromHistory(entry)}>
                      <p className="text-sm text-ink font-medium truncate">{entry.title}</p>
                      <p className="text-xs text-ink-muted mt-1">
                        Grade: {entry.grade} • Thesis: {entry.thesis_score}% • Grammar: {entry.grammar_score}% • {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteHistoryEntry(entry.id)}
                      className="text-ink-muted hover:text-danger cursor-pointer bg-transparent border-0 p-1 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isGradingEssay && (
        <div className="text-center py-12">
          <div className="w-3 h-3 rounded-full mx-auto mb-4 bg-success animate-pulse-soft"></div>
          <p className="text-ink-muted text-[0.95rem]">Lumio is auditing sentence flows, evaluating thesis claims, and formatting recommendations...</p>
        </div>
      )}

      {!isGradingEssay && essayGradingResult && (
        <div className="bg-card border border-line rounded-xl p-7 border-primary">
          <h3 className="text-[1.4rem] mb-6 flex justify-between items-center">
            <span>Grading Review Scorecard</span>
            <button
              onClick={() => { setEssayGradingResult(null); setEssayInput(''); setEssayPrompt(''); }}
              className="bg-transparent border-0 text-danger text-xs cursor-pointer"
            >
              Reset
            </button>
          </h3>

          <div className="flex gap-8 flex-wrap mb-8 items-center">
            <div className="bg-success/10 text-primary w-20 h-20 rounded-full flex items-center justify-center text-[2.5rem] font-extrabold">
              {essayGradingResult.grade}
            </div>
            <div className="flex-1 min-w-[220px] grid grid-cols-3 gap-4">
              <div className="border border-line rounded-lg p-3 text-center">
                <div className="text-xs text-ink-muted mb-1">Thesis Argument</div>
                <div className="text-xl font-bold text-ink">{essayGradingResult.thesisScore}%</div>
              </div>
              <div className="border border-line rounded-lg p-3 text-center">
                <div className="text-xs text-ink-muted mb-1">Grammar / Flow</div>
                <div className="text-xl font-bold text-ink">{essayGradingResult.grammarScore}%</div>
              </div>
              <div className="border border-line rounded-lg p-3 text-center">
                <div className="text-xs text-ink-muted mb-1">Structure</div>
                <div className="text-xl font-bold text-ink">{essayGradingResult.structureScore}%</div>
              </div>
            </div>
          </div>

          <div className="mb-6 pb-6 border-b border-line">
            <h4 className="text-base text-ink mb-2">General Critique</h4>
            <p className="text-ink-muted text-[0.9rem] leading-relaxed m-0">{essayGradingResult.critique}</p>
          </div>

          <div>
            <h4 className="text-base text-ink mb-2">Recommendations for Improvement</h4>
            <ul className="flex flex-col gap-2 pl-5 m-0">
              {essayGradingResult.recommendations.map((rec, index) => (
                <li key={index} className="text-ink-muted text-[0.9rem] leading-snug">
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
