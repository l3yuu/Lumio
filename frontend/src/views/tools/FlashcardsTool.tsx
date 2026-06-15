import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import type { View, User } from '../../types';
import { API_BASE_URL } from '../../config';

interface FlashcardsToolProps {
  setView: (view: View) => void;
  user?: User;
  setUser?: (user: User | null) => void;
}

interface FlashcardHistory {
  id: number;
  title: string;
  cards: { front: string; back: string }[];
  created_at: string;
}

export const FlashcardsTool: React.FC<FlashcardsToolProps> = ({ setView: _setView, user, setUser }) => {
  const [flashcardInput, setFlashcardInput] = useState('');
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<{ front: string; back: string; flipped: boolean }[]>([]);
  const [flashcardError, setFlashcardError] = useState('');
  const [history, setHistory] = useState<FlashcardHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Daily limit tracking
  const dailyLimit = user?.is_premium ? 25 : 5;
  const getDailyCount = (): number => {
    const st = user?.studyTime || {};
    const quotaDate = st.flashcard_quota_date || '';
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (quotaDate === todayStr) {
      return st.flashcard_quota_used || 0;
    }
    return 0;
  };
  const dailyCount = getDailyCount();
  const dailyRemaining = Math.max(0, dailyLimit - dailyCount);

  // Load history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to load flashcard history:', err);
      }
    };

    fetchHistory();
  }, []);

  const deleteHistoryEntry = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/flashcards/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setHistory(prev => prev.filter(h => h.id !== id));
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to delete flashcard deck');
      }
    } catch (err: any) {
      console.error('Delete flashcard error:', err);
      alert(err.message || 'Failed to delete flashcard deck.');
    }
  };

  const loadFromHistory = (entry: FlashcardHistory) => {
    setGeneratedFlashcards(entry.cards.map(c => ({ ...c, flipped: false })));
    setFlashcardInput(entry.title);
    setShowHistory(false);
  };

  const handleGenerate = async () => {
    if (!flashcardInput.trim()) return;

    // Check daily limit
    if (dailyRemaining <= 0) {
      setFlashcardError(`Daily generation limit reached. ${user?.is_premium ? 'Pro' : 'Free'} users can generate ${dailyLimit} decks per day.`);
      return;
    }

    setIsGeneratingFlashcards(true);
    setFlashcardError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setFlashcardError('You must be logged in to generate flashcards.');
      setIsGeneratingFlashcards(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/flashcards/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: flashcardInput,
          count: 10,
          title: `Flashcards: ${flashcardInput.slice(0, 30).trim()}...`
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate flashcards');
      }
      const newDeck = await response.json();
      const mappedCards = newDeck.cards.map((c: { front: string; back: string }) => ({
        front: c.front,
        back: c.back,
        flipped: false
      }));
      setGeneratedFlashcards(mappedCards);

      // Save to history state
      setHistory(prev => [newDeck, ...prev]);

      // Update daily count locally in user's profile state
      if (setUser && user) {
        const st = user.studyTime ? { ...user.studyTime } : {};
        const todayStr = new Date().toLocaleDateString('en-CA');
        st.flashcard_quota_date = todayStr;
        st.flashcard_quota_used = (st.flashcard_quota_used || 0) + 1;
        setUser({ ...user, studyTime: st });
      }
    } catch (err: any) {
      console.error('Flashcard generation error:', err);
      setFlashcardError(err.message || 'Failed to generate flashcards. Please try again.');
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  return (
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <header className="text-center mb-12">
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">Flashcard Generator</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Convert complex notes into flippable, active-recall study decks instantly.</p>
      </header>

      <div className="bg-card border border-line rounded-xl p-7 mb-6">
        <label className="block text-sm font-semibold mb-1.5 text-ink font-semibold mb-2 block">Study Notes Source Text</label>
        <textarea
          placeholder="Paste text notes or outline drafts..."
          value={flashcardInput}
          onChange={(e) => setFlashcardInput(e.target.value)}
          className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary min-h-[150px] resize-y mb-5 px-3"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGeneratingFlashcards || !flashcardInput.trim() || dailyRemaining <= 0}
            className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center py-3.5 font-bold"
          >
            {isGeneratingFlashcards ? 'Analyzing Concept Outlines...' : 'Generate Flashcards Decks'}
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-ink-muted">
          <span>{dailyRemaining} / {dailyLimit} generations left today</span>
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
                Generation History
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
                        {entry.cards.length} cards • {new Date(entry.created_at).toLocaleDateString()}
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

      {isGeneratingFlashcards && (
        <div className="text-center py-12">
          <div className="w-3 h-3 rounded-full mx-auto mb-4 bg-success animate-pulse-soft"></div>
          <p className="text-ink-muted text-[0.95rem]">Lumio is analyzing your notes and creating active-recall flashcards...</p>
        </div>
      )}

      {flashcardError && (
        <div className="flex items-start gap-3 bg-danger-soft text-danger border border-danger-line rounded-lg p-4 mb-6">
          <span className="text-lg leading-none shrink-0 mt-0.5">&#x26A0;</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-0.5">Flashcard Generation Failed</p>
            <p className="text-[0.85rem] opacity-90">{flashcardError}</p>
          </div>
          <button
            onClick={() => setFlashcardError('')}
            className="bg-transparent border-0 text-danger text-sm cursor-pointer shrink-0 p-0 leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {!isGeneratingFlashcards && generatedFlashcards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ perspective: '1000px' }}
        >
          <h3 className="text-[1.4rem] mb-6 flex justify-between items-center">
            <span>Generated Study Cards ({generatedFlashcards.length})</span>
            <button
              onClick={() => { setGeneratedFlashcards([]); setFlashcardInput(''); }}
              className="bg-transparent border-0 text-danger text-xs cursor-pointer"
            >
              Clear Deck
            </button>
          </h3>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
            {generatedFlashcards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
                style={{ perspective: '1000px' }}
                className="mock-flashcard flashcard-perspective h-[200px]"
                onClick={() => {
                  const updated = [...generatedFlashcards];
                  updated[index].flipped = !updated[index].flipped;
                  setGeneratedFlashcards(updated);
                }}
              >
                <div className={`flashcard-inner ${card.flipped ? 'flipped' : ''}`}>
                  <div className="flashcard-face bg-card border border-line rounded-xl p-6 flex flex-col justify-between">
                    <div className="flex justify-between text-xs text-ink-muted">
                      <span>Concept Card {index + 1}</span>
                      <span className="text-primary font-semibold">Active</span>
                    </div>
                    <h4 className="text-[1.15rem] text-ink my-2 leading-snug">{card.front}</h4>
                    <p className="text-xs text-primary m-0">Click card to flip &amp; reveal answer</p>
                  </div>

                  <div className="flashcard-face flashcard-face-back bg-card border border-primary rounded-xl p-6 flex flex-col justify-between">
                    <div className="flex justify-between text-xs text-ink-muted">
                      <span>Answer Sheet</span>
                      <span className="text-success font-semibold">Correct</span>
                    </div>
                    <p className="text-[0.9rem] text-ink my-2 leading-snug">{card.back}</p>
                    <p className="text-xs text-primary m-0">Click card to flip back</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
