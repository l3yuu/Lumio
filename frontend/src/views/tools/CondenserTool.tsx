import React, { useState } from 'react';
import type { View } from '../../types';

interface CondenserToolProps {
  setView: (view: View) => void;
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
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <button
        onClick={() => setView('tools')}
        className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong mb-8 px-3 py-1.5 text-xs"
      >
        &larr; Back to Utilities
      </button>
      <header className="text-center mb-12">
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">Document Condenser</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Condense lecture slide outlines or full textbook chapters into concise summaries.</p>
      </header>

      <div className="bg-card border border-line rounded-xl p-7 mb-12">
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
      </div>

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
