import React from 'react';
import { motion } from 'framer-motion';

interface HowItWorksViewProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing') => void;
  setAuthTab: (tab: 'login' | 'signup') => void;
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
    <div className="sub-page-container">
      <motion.header 
        className="sub-page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="sub-page-title">How Lumio Works</h1>
        <p className="sub-page-intro">The AI architecture built to accelerate student test performance.</p>
      </motion.header>

      <motion.div 
        className="diagram-flex"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="diagram-step" variants={stepVariants} whileHover={{ x: 5 }}>
          <span className="diagram-step-num">1</span>
          <div className="diagram-step-info">
            <h3 className="diagram-step-title">Document Ingestion & Chunking</h3>
            <p className="diagram-step-desc">
              When you upload modules (PDFs, notes, outline transcripts), our platform parses and indexes the documents. Text is split into semantic paragraphs, preserving context boundaries for precise retrieval.
            </p>
          </div>
        </motion.div>

        <motion.div className="diagram-step" variants={stepVariants} whileHover={{ x: 5 }}>
          <span className="diagram-step-num">2</span>
          <div className="diagram-step-info">
            <h3 className="diagram-step-title">Keyword Extraction & Concept Mapping</h3>
            <p className="diagram-step-desc">
              Lumio's internal concept engine maps key terminology, definitions, and logic formulas. It establishes relationships between subjects to identify high-priority exam focus areas.
            </p>
          </div>
        </motion.div>

        <motion.div className="diagram-step" variants={stepVariants} whileHover={{ x: 5 }}>
          <span className="diagram-step-num">3</span>
          <div className="diagram-step-info">
            <h3 className="diagram-step-title">Quiz Formulation & Distractors Generator</h3>
            <p className="diagram-step-desc">
              Using concepts, Lumio generates multiple-choice questions. It designs realistic "distractors" (incorrect choices) to challenge critical thinking and mirror actual school test layouts.
            </p>
          </div>
        </motion.div>

        <motion.div className="diagram-step" variants={stepVariants} whileHover={{ x: 5 }}>
          <span className="diagram-step-num">4</span>
          <div className="diagram-step-info">
            <h3 className="diagram-step-title">Scorecard Analytics & Group Sync</h3>
            <p className="diagram-step-desc">
              Graded practice attempts are logged. Group quiz scorecards synchronize peer leaderboards, giving classmates rankings and detailed corrections sheet reviews to learn collaboratively.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        style={{ textAlign: 'center', marginTop: '4rem' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setAuthTab('signup'); setView('auth'); }} 
          className="btn btn-primary"
        >
          Start Uploading Now
        </motion.button>
      </motion.div>
    </div>
  );
};
