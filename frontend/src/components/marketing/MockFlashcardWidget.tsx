import React, { useState } from 'react';

export const MockFlashcardWidget: React.FC = () => {
  const [authFlashcardFlipped, setAuthFlashcardFlipped] = useState(false);

  return (
    <div
      className="flashcard-perspective h-[140px]"
      onClick={() => setAuthFlashcardFlipped(!authFlashcardFlipped)}
    >
      <div className={`flashcard-inner ${authFlashcardFlipped ? 'flipped' : ''}`}>
        <div className="flashcard-face bg-app border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between text-xs text-ink-muted">
            <span>Flashcard</span>
            <span className="text-warning font-semibold">Due Now</span>
          </div>
          <h3 className="text-[1.2rem] text-ink my-2">Mitosis</h3>
          <p className="text-xs text-primary m-0">Click card to flip & learn</p>
        </div>

        <div className="flashcard-face flashcard-face-back bg-app border border-primary rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between text-xs text-ink-muted">
            <span>Definition</span>
            <span className="text-success font-semibold">+15 XP</span>
          </div>
          <p className="text-sm text-ink leading-snug my-1">
            Cell division resulting in two identical daughter cells, maintaining parent chromosome numbers.
          </p>
          <p className="text-xs text-primary m-0">Click card to flip back</p>
        </div>
      </div>
    </div>
  );
};
