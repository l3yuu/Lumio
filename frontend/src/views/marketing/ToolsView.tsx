import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, Layers } from 'lucide-react';
import type { View } from '../../types';

interface ToolsViewProps {
  setView: (view: View) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

export const ToolsView: React.FC<ToolsViewProps> = ({ setView }) => {
  return (
    <motion.div
      className="max-w-[840px] mx-auto py-16 px-6 pb-24"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.header
        className="text-center mb-16"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">AI Study Utilities</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Detailed overview of core tools built to help you review syllabus notes.</p>
      </motion.header>

      <motion.div
        className="flex flex-col gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Flashcard Generator */}
        <motion.div
          className="bg-card border border-line rounded-xl p-7 flex gap-8 items-center flex-wrap"
          variants={itemVariants}
          whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
        >
          <div className="w-11 h-11 rounded-lg bg-cyan-soft text-accent-cyan flex items-center justify-center">
            <Sparkles size={22} />
          </div>
          <div className="flex-1 min-w-[250px]">
            <h3 className="text-xl mb-2">Flashcard Generator</h3>
            <p className="text-ink-muted leading-relaxed text-[0.95rem] mb-5">
              Convert complex text blocks into simple question-and-answer index cards. Utilizing spaced repetition principles, the flashcard decks prioritize cards you get wrong, building memory retention.
            </p>
            <button
              onClick={() => setView('auth')}
              className="inline-flex items-center justify-center gap-2 text-[0.85rem] font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md px-5 py-2 hover:bg-primary-hover hover:border-primary-hover"
            >
              Open Flashcard Generator &rarr;
            </button>
          </div>
        </motion.div>

        {/* AI Essay Grader */}
        <motion.div
          className="bg-card border border-line rounded-xl p-7 flex gap-8 items-center flex-wrap"
          variants={itemVariants}
          whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
        >
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-primary bg-primary-tint-5">
            <HelpCircle size={22} />
          </div>
          <div className="flex-1 min-w-[250px]">
            <h3 className="text-xl mb-2">AI Essay Grader</h3>
            <p className="text-ink-muted leading-relaxed text-[0.95rem] mb-5">
              Submit practice essays for class assignments. Lumio's grading engine critiques thesis statements, grammatical flows, citation structure, and offers concrete recommendations to improve writing grades.
            </p>
            <button
              onClick={() => setView('auth')}
              className="inline-flex items-center justify-center gap-2 text-[0.85rem] font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md px-5 py-2 hover:bg-primary-hover hover:border-primary-hover"
            >
              Open AI Essay Grader &rarr;
            </button>
          </div>
        </motion.div>

        {/* Document Condenser */}
        <motion.div
          className="bg-card border border-line rounded-xl p-7 flex gap-8 items-center flex-wrap"
          variants={itemVariants}
          whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
        >
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-primary bg-success/10">
            <Layers size={22} />
          </div>
          <div className="flex-1 min-w-[250px]">
            <h3 className="text-xl mb-2">Document Condenser</h3>
            <p className="text-ink-muted leading-relaxed text-[0.95rem] mb-5">
              Upload full 80-page textbook PDF chapters. The condenser extracts summaries, highlights core formulas, creates definitions bullet points, and discards fluff paragraphs, saving study time.
            </p>
            <button
              onClick={() => setView('auth')}
              className="inline-flex items-center justify-center gap-2 text-[0.85rem] font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md px-5 py-2 hover:bg-primary-hover hover:border-primary-hover"
            >
              Open Document Condenser &rarr;
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
