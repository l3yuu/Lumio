import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, ShieldCheck, X, Sparkles, Loader2 } from 'lucide-react';
import type { View, AuthTab, User } from '../../types';
import { API_BASE_URL } from '../../config';

interface PricingViewProps {
  setView: (view: View) => void;
  setAuthTab: (tab: AuthTab) => void;
  user?: User | null;
}

export const PricingView: React.FC<PricingViewProps> = ({ setView, setAuthTab, user }) => {
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [loadingGateway, setLoadingGateway] = useState<string | null>(null);

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

  const handleUpgradeClick = () => {
    if (!user) {
      setAuthTab('signup');
      setView('auth');
    } else {
      setShowGatewayModal(true);
    }
  };

  const handleSelectGateway = (gateway: 'stripe' | 'paymongo') => {
    setLoadingGateway(gateway);
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ gateway })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to create checkout session');
      return data;
    })
    .then(data => {
      if (data.url) {
        window.location.href = data.url;
      }
    })
    .catch(err => {
      alert(err.message);
      setLoadingGateway(null);
    });
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
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-[2.5rem] font-extrabold text-ink">₱0</span>
              <span className="text-[0.95rem] text-ink-muted">/ month</span>
            </div>
            <ul className="list-none p-0 m-0 mb-10 flex flex-col gap-3.5">
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                5 AI Quiz generations per day
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                5 AI Chatbot queries per day
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Create up to 2 collaborative circles
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
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-[2.5rem] font-extrabold text-ink">₱100</span>
              <span className="text-[0.95rem] text-ink-muted">/ month</span>
            </div>
            <ul className="list-none p-0 m-0 mb-10 flex flex-col gap-3.5">
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                25 AI Quiz generations per day (5x)
              </li>
              <li className="flex items-center gap-3 text-[0.9rem] text-ink">
                <svg className="text-primary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                25 AI Chatbot queries per 12 hrs
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
            className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md w-full py-3 hover:bg-primary-hover hover:border-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleUpgradeClick}
            disabled={user?.is_premium}
          >
            {user?.is_premium ? 'Already Subscribed' : 'Upgrade to Pro'}
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
          { label: 'Daily Quiz Generations',    free: '5 quizzes', pro: '25 quizzes', proHighlight: true },
          { label: 'Max File Size',             free: '2 MB',      pro: '10 MB',     proHighlight: false },
          { label: 'AI Chatbot Queries',        free: '5 / day',   pro: '25 / 12 hrs', proHighlight: true },
          { label: 'MCQ Quiz Simulator',        free: 'Basic',     pro: 'Advanced',  proHighlight: false },
          { label: 'Spaced Rep. Flashcards',    free: null,        pro: true,        proHighlight: true },
          { label: 'AI Essay Grader',           free: null,        pro: true,        proHighlight: true },
          { label: 'Document Condenser',        free: null,        pro: true,        proHighlight: true },
          { label: 'Collaborative Circles',     free: '2 circles',  pro: 'Unlimited', proHighlight: true },
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

      {/* Payment Gateway Modal */}
      <AnimatePresence>
        {showGatewayModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowGatewayModal(false)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold text-ink">Confirm Payment Method</h3>
                <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                  Unlock Pro Student. Access higher limits and collaborative lobbies instantly.
                </p>
              </div>

              <div className="flex flex-col gap-3.5">
                <button
                  onClick={() => handleSelectGateway('paymongo')}
                  disabled={loadingGateway !== null}
                  className="flex items-center justify-between p-4 bg-input hover:bg-glass border border-line hover:border-line-strong rounded-xl cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group text-left w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:scale-105 transition-transform">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">E-Wallet Pass (Paymongo)</div>
                      <div className="text-xs text-ink-muted mt-0.5">One-time 30-Day Pass (₱100 PHP)</div>
                    </div>
                  </div>
                  {loadingGateway === 'paymongo' ? (
                    <Loader2 className="animate-spin text-primary shrink-0" size={18} />
                  ) : (
                    <span className="text-[0.75rem] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded uppercase shrink-0">GCash/Maya/Cards</span>
                  )}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-line flex items-center justify-center gap-2 text-[0.7rem] text-ink-muted">
                <ShieldCheck size={14} className="text-primary" />
                <span>Secured payments. Cancel or manage billing at any time.</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
