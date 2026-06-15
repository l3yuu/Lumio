import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import type { View } from '../../types';
import { API_BASE_URL } from '../../config';

interface CondenserToolProps {
  setView: (view: View) => void;
}

interface CondenserHistory {
  id: number;
  title: string;
  summary: string;
  takeaways: string[];
  vocabulary: { term: string; definition: string }[];
  created_at: string;
}

export const CondenserTool: React.FC<CondenserToolProps> = ({ setView: _setView }) => {
  const [condenserInput, setCondenserInput] = useState('');
  const [isCondensing, setIsCondensing] = useState(false);
  const [condensedResult, setCondensedResult] = useState<{
    summary: string;
    takeaways: string[];
    vocabulary: { term: string; definition: string }[];
  } | null>(null);
  const [condenserError, setCondenserError] = useState('');
  const [history, setHistory] = useState<CondenserHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/condenser`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to load condenser history:', err);
      }
    };

    fetchHistory();
  }, []);

  const deleteHistoryEntry = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/condenser/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setHistory(prev => prev.filter(h => h.id !== id));
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to delete condenser history entry');
      }
    } catch (err: any) {
      console.error('Delete condenser history error:', err);
      alert(err.message || 'Failed to delete condenser history entry.');
    }
  };

  const loadFromHistory = (entry: CondenserHistory) => {
    setCondensedResult({
      summary: entry.summary,
      takeaways: entry.takeaways,
      vocabulary: entry.vocabulary
    });
    setShowHistory(false);
  };

  const handleCondense = async () => {
    if (!condenserInput.trim()) return;
    setIsCondensing(true);
    setCondenserError('');
    setCondensedResult(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setCondenserError('You must be logged in to use the Document Condenser.');
      setIsCondensing(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/condenser/condense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: condenserInput })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to condense document.');
      }

      const newRecord = await response.json();
      setCondensedResult(newRecord);
      setHistory(prev => [newRecord, ...prev]);
    } catch (err: any) {
      console.error('Condensing document error:', err);
      setCondenserError(err.message || 'Failed to condense document. Please try again.');
    } finally {
      setIsCondensing(false);
    }
  };

  return (
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <header className="text-center mb-12">
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">Document Condenser</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Condense lecture slide outlines or full textbook chapters into concise summaries.</p>
      </header>

      <div className="bg-card border border-line rounded-xl p-7 mb-6">
        <label className="block text-sm font-semibold mb-1.5 text-ink font-semibold mb-2 block">Textbook Chapters or Slides Draft Text</label>
        <textarea
          placeholder="Paste raw textbook segments, slide transcripts, or outline drafts..."
          value={condenserInput}
          onChange={(e) => setCondenserInput(e.target.value)}
          className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary min-h-[180px] resize-y mb-5 px-3"
        />
        <button
          onClick={handleCondense}
          disabled={isCondensing || !condenserInput.trim()}
          className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center py-3.5 font-bold"
        >
          {isCondensing ? 'Condensing Document Materials...' : 'Condense Draft Content'}
        </button>
        <div className="flex items-center justify-between mt-3 text-xs text-ink-muted">
          <span>Double check notes for best results</span>
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

      {condenserError && (
        <div className="flex items-start gap-3 bg-danger-soft text-danger border border-danger-line rounded-lg p-4 mb-6">
          <span className="text-lg leading-none shrink-0 mt-0.5">&#x26A0;</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-0.5">Condensing Failed</p>
            <p className="text-[0.85rem] opacity-90">{condenserError}</p>
          </div>
          <button
            onClick={() => setCondenserError('')}
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
                Condensation History
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
                        {entry.takeaways.length} takeaways • {entry.vocabulary.length} terms • {new Date(entry.created_at).toLocaleDateString()}
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

      {isCondensing && (
        <div className="text-center py-12">
          <div className="w-3 h-3 rounded-full mx-auto mb-4 bg-success animate-pulse-soft"></div>
          <p className="text-ink-muted text-[0.95rem]">Lumio is removing redundancy, isolating vocabulary, and formatting key summaries...</p>
        </div>
      )}

      {!isCondensing && condensedResult && (
        <div className="bg-card border border-line rounded-xl p-7 border-primary">
          <h3 className="text-[1.4rem] mb-6 flex justify-between items-center">
            <span>Condensed Materials Summary</span>
            <button
              onClick={() => { setCondensedResult(null); setCondenserInput(''); }}
              className="bg-transparent border-0 text-danger text-xs cursor-pointer"
            >
              Reset
            </button>
          </h3>

          <div className="mb-6 pb-6 border-b border-line">
            <h4 className="text-[1.05rem] text-ink mb-2">High-Density Overview</h4>
            <p className="text-ink-muted text-[0.9rem] leading-relaxed m-0">{condensedResult.summary}</p>
          </div>

          <div className="mb-6 pb-6 border-b border-line">
            <h4 className="text-[1.05rem] text-ink mb-2">Core Takeaways</h4>
            <ul className="flex flex-col gap-2 pl-5 m-0">
              {condensedResult.takeaways.map((take, index) => (
                <li key={index} className="text-ink-muted text-[0.9rem] leading-snug">
                  {take}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[1.05rem] text-ink mb-2">Key Terminology & Definitions</h4>
            <div className="grid grid-cols-1 gap-3">
              {condensedResult.vocabulary.map((vocab, index) => (
                <div key={index} className="bg-black/15 py-3 px-4 rounded-md border-l-[3px] border-l-primary">
                  <strong className="text-[0.85rem] text-ink block mb-0.5">{vocab.term}</strong>
                  <span className="text-xs text-ink-muted leading-snug">{vocab.definition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
