import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, Layers } from 'lucide-react';

interface ToolsViewProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing') => void;
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
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }
  }
};

export const ToolsView: React.FC<ToolsViewProps> = ({ setView }) => {
  return (
    <motion.div 
      className="sub-page-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.header 
        className="sub-page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="sub-page-title">AI Study Utilities</h1>
        <p className="sub-page-intro">Detailed overview of core tools built to help you review syllabus notes.</p>
      </motion.header>

      <motion.div 
        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="dashboard-card" 
          style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}
          variants={itemVariants}
          whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
        >
          <div className="tool-icon" style={{ width: '44px', height: '44px', borderRadius: '8px', margin: 0 }}>
            <Sparkles size={22} />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Flashcard Generator</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Convert complex text blocks into simple question-and-answer index cards. Utilizing spaced repetition principles, the flashcard decks prioritize cards you get wrong, building memory retention.
            </p>
            <button onClick={() => setView('flashcards')} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Open Flashcard Generator &rarr;
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-card" 
          style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}
          variants={itemVariants}
          whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
        >
          <div className="tool-icon" style={{ width: '44px', height: '44px', borderRadius: '8px', margin: 0, color: 'var(--primary)', background: 'rgba(62,207,142,0.08)' }}>
            <HelpCircle size={22} />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>AI Essay Grader</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Submit practice essays for class assignments. Lumio's grading engine critiques thesis statements, grammatical flows, citation structure, and offers concrete recommendations to improve writing grades.
            </p>
            <button onClick={() => setView('essay-grader')} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Open AI Essay Grader &rarr;
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-card" 
          style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}
          variants={itemVariants}
          whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
        >
          <div className="tool-icon" style={{ width: '44px', height: '44px', borderRadius: '8px', margin: 0, color: 'var(--primary)', background: 'rgba(16,185,129,0.08)' }}>
            <Layers size={22} />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Document Condenser</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Upload full 80-page textbook PDF chapters. The condenser extracts summaries, highlights core formulas, creates definitions bullet points, and discards fluff paragraphs, saving study time.
            </p>
            <button onClick={() => setView('condenser')} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Open Document Condenser &rarr;
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
