import React from 'react';
import { motion } from 'framer-motion';
import type { View, AuthTab } from '../../types';

interface HowItWorksViewProps {
  setView: (view: View) => void;
  setAuthTab: (tab: AuthTab) => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ setView, setAuthTab }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <motion.header
        className="text-center mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">How Lumio Works</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">The AI architecture built to accelerate student test performance.</p>
      </motion.header>

      <motion.div
        className="flex flex-col gap-5 my-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex items-center gap-6 bg-card border border-line rounded-xl p-6" variants={stepVariants} whileHover={{ x: 5 }}>
          <span className="w-9 h-9 rounded-md bg-primary text-ink-on-primary flex items-center justify-center font-extrabold">1</span>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Document Ingestion & Chunking</h3>
            <p className="text-[0.88rem] text-ink-muted leading-snug">
              When you upload modules (PDFs, notes, outline transcripts), our platform parses and indexes the documents. Text is split into semantic paragraphs, preserving context boundaries for precise retrieval.
            </p>
          </div>
        </motion.div>

        <motion.div className="flex items-center gap-6 bg-card border border-line rounded-xl p-6" variants={stepVariants} whileHover={{ x: 5 }}>
          <span className="w-9 h-9 rounded-md bg-primary text-ink-on-primary flex items-center justify-center font-extrabold">2</span>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Keyword Extraction & Concept Mapping</h3>
            <p className="text-[0.88rem] text-ink-muted leading-snug">
              Lumio's internal concept engine maps key terminology, definitions, and logic formulas. It establishes relationships between subjects to identify high-priority exam focus areas.
            </p>
          </div>
        </motion.div>

        <motion.div className="flex items-center gap-6 bg-card border border-line rounded-xl p-6" variants={stepVariants} whileHover={{ x: 5 }}>
          <span className="w-9 h-9 rounded-md bg-primary text-ink-on-primary flex items-center justify-center font-extrabold">3</span>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Quiz Formulation & Distractors Generator</h3>
            <p className="text-[0.88rem] text-ink-muted leading-snug">
              Using concepts, Lumio generates multiple-choice questions. It designs realistic "distractors" (incorrect choices) to challenge critical thinking and mirror actual school test layouts.
            </p>
          </div>
        </motion.div>

        <motion.div className="flex items-center gap-6 bg-card border border-line rounded-xl p-6" variants={stepVariants} whileHover={{ x: 5 }}>
          <span className="w-9 h-9 rounded-md bg-primary text-ink-on-primary flex items-center justify-center font-extrabold">4</span>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Scorecard Analytics & Group Sync</h3>
            <p className="text-[0.88rem] text-ink-muted leading-snug">
              Graded practice attempts are logged. Group quiz scorecards synchronize peer leaderboards, giving classmates rankings and detailed corrections sheet reviews to learn collaboratively.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="text-center mt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setAuthTab('signup'); setView('auth'); }}
          className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md px-4 py-2 hover:bg-primary-hover hover:border-primary-hover"
        >
          Start Uploading Now
        </motion.button>
      </motion.div>
    </div>
  );
};
