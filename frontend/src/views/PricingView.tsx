import React from 'react';
import { motion } from 'framer-motion';

interface PricingViewProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing') => void;
  setAuthTab: (tab: 'login' | 'signup') => void;
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
    <div className="sub-page-container">
      <motion.header 
        className="sub-page-header" 
        style={{ marginBottom: '4rem' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="sub-page-title">Pricing Plans</h1>
        <p className="sub-page-intro">Choose the plan that fits your study needs. Upgrade or cancel anytime.</p>
      </motion.header>

      <motion.div 
        className="pricing-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Free Tier */}
        <motion.div 
          className="pricing-card"
          variants={cardVariants}
          whileHover={{ y: -5, borderColor: 'var(--border)' }}
          transition={{ duration: 0.2 }}
        >
          <div className="pricing-header">
            <h3>Free Plan</h3>
            <p>Great for individuals starting out</p>
          </div>
          <div className="pricing-price">
            <span className="amount">$0</span>
            <span className="period">/ month</span>
          </div>
          <ul className="pricing-features">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              5 Outline uploads per month
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Basic Quiz Generation (MCQs)
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Single-player study lobby
            </li>
            <li style={{ opacity: 0.5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--text-secondary)' }}><polyline points="20 6 9 17 4 12"/></svg>
              Spaced Repetition Flashcards
            </li>
          </ul>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-outline" 
            onClick={() => { setAuthTab('signup'); setView('auth'); }}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            Start Studying Free
          </motion.button>
        </motion.div>

        {/* Pro Tier */}
        <motion.div 
          className="pricing-card popular"
          variants={cardVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <span className="pricing-popular-badge">Most Popular</span>
          <div className="pricing-header">
            <h3>Pro Student</h3>
            <p>Everything you need for exam cycles</p>
          </div>
          <div className="pricing-price">
            <span className="amount">$8</span>
            <span className="period">/ month</span>
          </div>
          <ul className="pricing-features">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Unlimited outline & note uploads
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Advanced AI Quiz engines & Flashcards
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Unlimited Collaborative Study Groups
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Essay grading critiques & Condensers
            </li>
          </ul>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary" 
            onClick={() => { setAuthTab('signup'); setView('auth'); }}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            Upgrade to Pro
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Features Comparison Matrix */}
      <motion.div 
        className="pricing-matrix-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="pricing-matrix-title">Features Comparison Matrix</h2>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Feature Category</th>
              <th className="tier-header">Free Plan</th>
              <th className="tier-header">Pro Student</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="feature-name">Monthly Document Uploads</td>
              <td className="tier-value">5 uploads</td>
              <td className="tier-value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Unlimited</td>
            </tr>
            <tr>
              <td className="feature-name">Maximum Outline File Size</td>
              <td className="tier-value">2 MB</td>
              <td className="tier-value">10 MB</td>
            </tr>
            <tr>
              <td className="feature-name">Multiple-Choice Quiz Simulator</td>
              <td className="tier-value"><span className="feature-check">✔</span> (Basic)</td>
              <td className="tier-value"><span className="feature-check">✔</span> (Advanced)</td>
            </tr>
            <tr>
              <td className="feature-name">Spaced Repetition Flashcards</td>
              <td className="tier-value"><span className="feature-cross">✖</span></td>
              <td className="tier-value"><span className="feature-check">✔</span></td>
            </tr>
            <tr>
              <td className="feature-name">AI Essay Grader Rubrics</td>
              <td className="tier-value"><span className="feature-cross">✖</span></td>
              <td className="tier-value"><span className="feature-check">✔</span></td>
            </tr>
            <tr>
              <td className="feature-name">Textbook Document Condenser</td>
              <td className="tier-value"><span className="feature-cross">✖</span></td>
              <td className="tier-value"><span className="feature-check">✔</span></td>
            </tr>
            <tr>
              <td className="feature-name">Collaborative Study Lobbies</td>
              <td className="tier-value">Single-player only</td>
              <td className="tier-value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Unlimited Groups</td>
            </tr>
            <tr>
              <td className="feature-name">Scorecard Synchronizer</td>
              <td className="tier-value"><span className="feature-cross">✖</span></td>
              <td className="tier-value"><span className="feature-check">✔</span></td>
            </tr>
            <tr>
              <td className="feature-name">Priority Concept Mapping Support</td>
              <td className="tier-value"><span className="feature-cross">✖</span></td>
              <td className="tier-value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✔ (High priority)</td>
            </tr>
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};
