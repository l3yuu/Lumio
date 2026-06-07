import React, { useState } from 'react';
import type { View } from '../../types';

interface EssayGraderToolProps {
  setView: (view: View) => void;
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
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <button
        onClick={() => setView('tools')}
        className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong mb-8 px-3 py-1.5 text-xs"
      >
        &larr; Back to Utilities
      </button>
      <header className="text-center mb-12">
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">AI Essay Grader</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Critique essay drafts against structural rubrics and clear grading points.</p>
      </header>

      <div className="bg-card border border-line rounded-xl p-7 mb-12 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-ink font-semibold mb-2 block">Essay Prompt or Question Topic</label>
          <input
            type="text"
            placeholder="e.g. Compare primary causes of political shifts in the 19th Century..."
            value={essayPrompt}
            onChange={(e) => setEssayPrompt(e.target.value)}
            className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary pl-4"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-ink font-semibold mb-2 block">Essay Content</label>
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
      </div>

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
