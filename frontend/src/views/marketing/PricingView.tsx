import React from 'react';
import { motion } from 'framer-motion';
import type { View, AuthTab } from '../../types';

interface PricingViewProps {
  setView: (view: View) => void;
  setAuthTab: (tab: AuthTab) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ setView, setAuthTab }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <div className="max-w-210 mx-auto py-12 pb-24 w-full">
      <motion.header
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-[2rem] sm:text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">Pricing Plans</h1>
        <p className="text-[1rem] sm:text-[1.15rem] text-ink-muted leading-relaxed">Choose the plan that fits your study needs. Upgrade or cancel anytime.</p>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-200 mx-auto mt-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="bg-card border border-line rounded-2xl p-6 sm:p-10 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1"
          variants={cardVariants}
          whileHover={{ y: -5, borderColor: 'var(--color-line)' }}
          transition={{ duration: 0.2 }}
        >
          <div>
            <h3 className="text-[1.5rem] m-0 mb-2">Free Plan</h3>
            <p className="text-[0.9rem] text-ink-muted m-0 mb-8">Great for individuals starting out</p>
            <div className="mb-8">
              <span className="text-[2.5rem] font-extrabold text-ink">$0</span>
              <span className="text-[0.95rem] text-ink-muted">/ month</span>
            </div>
            <ul className="list-none p-0 m-0 mb-10 flex flex-col gap-3.5">
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                5 Outline uploads per month
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Basic Quiz Generation (MCQs)
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Single-player study lobby
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink opacity-50">
                <svg className="text-ink-muted shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Spaced Repetition Flashcards
              </li>
            </ul>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-transparent text-ink border border-line rounded-md w-full py-3 hover:bg-input hover:border-line-strong"
            onClick={() => { setAuthTab('signup'); setView('auth'); }}
          >
            Start Studying Free
          </motion.button>
        </motion.div>

        <motion.div
          className="bg-card border border-primary rounded-2xl p-6 sm:p-10 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1 shadow-pricing"
          variants={cardVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <span className="absolute top-5 right-6 text-xs font-semibold bg-success/10 text-primary py-1 px-3 rounded-full">Most Popular</span>
          <div>
            <h3 className="text-[1.5rem] m-0 mb-2">Pro Student</h3>
            <p className="text-[0.9rem] text-ink-muted m-0 mb-8">Everything you need for exam cycles</p>
            <div className="mb-8">
              <span className="text-[2.5rem] font-extrabold text-ink">$8</span>
              <span className="text-[0.95rem] text-ink-muted">/ month</span>
            </div>
            <ul className="list-none p-0 m-0 mb-10 flex flex-col gap-3.5">
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Unlimited outline & note uploads
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Advanced AI Quiz engines & Flashcards
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Unlimited Collaborative Study Groups
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Essay grading critiques & Condensers
              </li>
            </ul>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md w-full py-3 hover:bg-primary-hover hover:border-primary-hover"
            onClick={() => { setAuthTab('signup'); setView('auth'); }}
          >
            Upgrade to Pro
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-16 w-full"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-center mb-6 text-[1.4rem] sm:text-[1.75rem] tracking-[-0.02em] font-bold">Features Comparison Matrix</h2>

        {/* Header row */}
        <div className="flex items-center border-b border-line bg-card rounded-t-xl px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex-1 text-[0.75rem] sm:text-[0.9rem] font-semibold text-ink">Feature</div>
          <div className="w-18 sm:w-27.5 text-center text-[0.75rem] sm:text-[0.9rem] font-semibold text-ink shrink-0">Free</div>
          <div className="w-18 sm:w-27.5 text-center text-[0.75rem] sm:text-[0.9rem] font-semibold text-primary shrink-0">Pro</div>
        </div>

        {/* Feature rows */}
        {([
          { label: 'Monthly Document Uploads', free: '5 uploads', pro: 'Unlimited', proHighlight: true },
          { label: 'Max File Size',             free: '2 MB',      pro: '10 MB',     proHighlight: false },
          { label: 'MCQ Quiz Simulator',        free: 'Basic',     pro: 'Advanced',  proHighlight: false },
          { label: 'Spaced Rep. Flashcards',    free: null,        pro: true,        proHighlight: true },
          { label: 'AI Essay Grader',           free: null,        pro: true,        proHighlight: true },
          { label: 'Document Condenser',        free: null,        pro: true,        proHighlight: true },
          { label: 'Collaborative Lobbies',     free: '1 player',  pro: 'Unlimited', proHighlight: true },
          { label: 'Scorecard Sync',            free: null,        pro: true,        proHighlight: true },
          { label: 'Priority AI Support',       free: null,        pro: true,        proHighlight: true },
        ] as { label: string; free: string | null; pro: string | boolean | null; proHighlight: boolean }[]).map((row, i, arr) => (
          <div
            key={row.label}
            className={`flex items-center px-3 py-3 sm:px-5 sm:py-4 ${i < arr.length - 1 ? 'border-b border-line' : 'rounded-b-xl'} hover:bg-ink-soft transition-colors duration-150`}
          >
            <div className="flex-1 text-[0.78rem] sm:text-[0.9rem] font-medium text-ink leading-snug pr-2">{row.label}</div>
            <div className="w-18 sm:w-27.5 text-center text-[0.78rem] sm:text-[0.9rem] text-ink-muted shrink-0">
              {row.free === null
                ? <span className="text-ink-muted opacity-40 font-bold">✖</span>
                : <span>{row.free}</span>
              }
            </div>
            <div className="w-18 sm:w-27.5 text-center text-[0.78rem] sm:text-[0.9rem] shrink-0">
              {row.pro === true
                ? <span className="text-primary font-bold">✔</span>
                : <span className={row.proHighlight ? 'text-primary font-bold' : 'text-ink-muted'}>{row.pro as string}</span>
              }
            </div>
          </div>
        ))}
      </motion.div>

    </div>
  );
};
