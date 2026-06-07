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
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <motion.header
        className="text-center mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">Pricing Plans</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Choose the plan that fits your study needs. Upgrade or cancel anytime.</p>
      </motion.header>

      <motion.div
        className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-10 max-w-[800px] mx-auto mt-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="bg-card border border-line rounded-2xl p-10 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1"
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
                <svg className="text-primary flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                5 Outline uploads per month
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Basic Quiz Generation (MCQs)
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Single-player study lobby
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink opacity-50">
                <svg className="text-ink-muted flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Spaced Repetition Flashcards
              </li>
            </ul>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-transparent text-ink border border-line rounded-md w-full justify-center py-3 hover:bg-input hover:border-line-strong"
            onClick={() => { setAuthTab('signup'); setView('auth'); }}
          >
            Start Studying Free
          </motion.button>
        </motion.div>

        <motion.div
          className="bg-card border border-primary rounded-2xl p-10 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1 shadow-pricing"
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
                <svg className="text-primary flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Unlimited outline & note uploads
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Advanced AI Quiz engines & Flashcards
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Unlimited Collaborative Study Groups
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Essay grading critiques & Condensers
              </li>
            </ul>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md w-full justify-center py-3 hover:bg-primary-hover hover:border-primary-hover"
            onClick={() => { setAuthTab('signup'); setView('auth'); }}
          >
            Upgrade to Pro
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-20 w-full overflow-x-auto"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-center mb-10 text-[1.75rem] tracking-[-0.02em] font-bold">Features Comparison Matrix</h2>
        <table className="w-full border-collapse text-left text-[0.95rem]">
          <thead>
            <tr>
              <th className="py-5 px-6 border-b border-line font-semibold text-ink bg-black/10">Feature Category</th>
              <th className="py-5 px-6 border-b border-line font-semibold text-ink bg-black/10 text-center w-1/4">Free Plan</th>
              <th className="py-5 px-6 border-b border-line font-semibold text-ink bg-black/10 text-center w-1/4">Pro Student</th>
            </tr>
          </thead>
          <tbody>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">Monthly Document Uploads</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft">5 uploads</td>
              <td className="py-5 px-6 border-b border-line text-center text-primary font-bold group-hover:bg-ink-soft">Unlimited</td>
            </tr>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">Maximum Outline File Size</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft">2 MB</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft">10 MB</td>
            </tr>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">Multiple-Choice Quiz Simulator</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-primary font-bold">✔</span> (Basic)</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-primary font-bold">✔</span> (Advanced)</td>
            </tr>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">Spaced Repetition Flashcards</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-ink-muted opacity-35">✖</span></td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-primary font-bold">✔</span></td>
            </tr>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">AI Essay Grader Rubrics</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-ink-muted opacity-35">✖</span></td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-primary font-bold">✔</span></td>
            </tr>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">Textbook Document Condenser</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-ink-muted opacity-35">✖</span></td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-primary font-bold">✔</span></td>
            </tr>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">Collaborative Study Lobbies</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft">Single-player only</td>
              <td className="py-5 px-6 border-b border-line text-center text-primary font-bold group-hover:bg-ink-soft">Unlimited Groups</td>
            </tr>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">Scorecard Synchronizer</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-ink-muted opacity-35">✖</span></td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-primary font-bold">✔</span></td>
            </tr>
            <tr className="group">
              <td className="py-5 px-6 border-b border-line font-medium text-ink group-hover:bg-ink-soft">Priority Concept Mapping Support</td>
              <td className="py-5 px-6 border-b border-line text-ink-muted text-center group-hover:text-ink group-hover:bg-ink-soft"><span className="text-ink-muted opacity-35">✖</span></td>
              <td className="py-5 px-6 border-b border-line text-center text-primary font-bold group-hover:bg-ink-soft">✔ (High priority)</td>
            </tr>
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};
