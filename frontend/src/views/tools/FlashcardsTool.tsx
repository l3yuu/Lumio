import React, { useState } from 'react';
import type { View } from '../../types';

interface FlashcardsToolProps {
  setView: (view: View) => void;
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
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <button
        onClick={() => setView('tools')}
        className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong mb-8 px-3 py-1.5 text-xs"
      >
        &larr; Back to Utilities
      </button>
      <header className="text-center mb-12">
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">Flashcard Generator</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Convert complex notes into flippable, active-recall study decks instantly.</p>
      </header>

      <div className="bg-card border border-line rounded-xl p-7 mb-12">
        <label className="block text-sm font-semibold mb-1.5 text-ink font-semibold mb-2 block">Study Notes Source Text</label>
        <textarea
          placeholder="Paste text notes or outline drafts..."
          value={flashcardInput}
          onChange={(e) => setFlashcardInput(e.target.value)}
          className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary min-h-[150px] resize-y mb-5 px-3"
        />
        <button
          onClick={handleGenerate}
          disabled={isGeneratingFlashcards || !flashcardInput.trim()}
          className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center py-3.5 font-bold"
        >
          {isGeneratingFlashcards ? 'Analyzing Concept Outlines...' : 'Generate Flashcards Decks'}
        </button>
      </div>

      {isGeneratingFlashcards && (
        <div className="text-center py-12">
          <div className="w-3 h-3 rounded-full mx-auto mb-4 bg-success animate-pulse-soft"></div>
          <p className="text-ink-muted text-[0.95rem]">Lumio is mapping concepts, formulating questions, and compiling answer sets...</p>
        </div>
      )}

      {!isGeneratingFlashcards && generatedFlashcards.length > 0 && (
        <div>
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
              <div
                key={index}
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
