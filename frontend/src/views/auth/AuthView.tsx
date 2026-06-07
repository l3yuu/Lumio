import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { View, AuthTab, User } from '../../types';

interface AuthViewProps {
  authTab: AuthTab;
  setAuthTab: (tab: AuthTab) => void;
  setView: (view: View) => void;
  setUser: (user: User | null) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ authTab, setAuthTab, setView, setUser }) => {
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formPassword || (authTab === 'signup' && !formName)) {
      alert('Please fill in all required fields.');
      return;
    }
    const name = authTab === 'signup' ? formName : formEmail.split('@')[0];
    setUser({
      name,
      email: formEmail,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      school: 'State University'
    });
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setView('dashboard');
  };

  return (
    <div className="flex flex-row-reverse h-screen w-full bg-app">
      {/* Right side: form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 bg-app overflow-y-auto">
        <motion.div 
          className="w-full max-w-105 flex flex-col"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={() => setView('landing')}
            className="bg-transparent border-0 cursor-pointer p-0 mb-12 self-start"
          >
            <span className="text-xl font-bold tracking-[-0.03em] text-ink">Lumio</span>
          </button>

          <div className="mb-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={authTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-ink mb-2">
                  {authTab === 'login' ? 'Welcome back' : 'Get started'}
                </h1>
                <p className="text-ink-muted text-[0.95rem]">
                  {authTab === 'login' ? 'Sign in to your account' : 'Create your student account'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="flex items-center justify-center w-full gap-3 text-sm px-3 py-3 rounded-md font-medium transition-all duration-200 border border-line text-ink cursor-pointer bg-card hover:bg-input hover:border-line-strong mb-5"
            onClick={() => {
              setUser({
                name: 'Google Student',
                email: 'student@gmail.com',
                avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
                school: 'State University'
              });
              setView('dashboard');
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.19-4.53z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center text-center text-ink-muted text-sm my-4 before:content-[''] before:flex-1 before:border-b before:border-line after:content-[''] after:flex-1 after:border-b after:border-line">
            <span className="px-4">or</span>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col">
            <AnimatePresence initial={false}>
              {authTab === 'signup' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-[0.35rem]">
                    <label className="block text-[0.85rem] font-medium mb-1.5 text-ink-muted">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full bg-input border border-line rounded-md p-3 text-ink text-[0.9rem] outline-none focus:border-primary"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-[0.35rem] mb-5">
              <label className="block text-[0.85rem] font-medium mb-1.5 text-ink-muted">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-input border border-line rounded-md p-3 text-ink text-[0.9rem] outline-none focus:border-primary"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-[0.35rem] mb-5">
              <div className="flex justify-between items-center">
                <label className="block text-[0.85rem] font-medium mb-1.5 text-ink-muted">Password</label>
                {authTab === 'login' && (
                  <a href="#forgot" className="text-[0.8rem] text-ink-muted no-underline">Forgot password?</a>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-input border border-line rounded-md p-3 text-ink text-[0.9rem] outline-none focus:border-primary"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="inline-flex items-center justify-center w-full gap-2 text-sm p-[0.85rem] rounded-md font-bold transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary hover:bg-primary-hover hover:border-primary-hover mt-2">
              {authTab === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <div className="text-center mt-8 text-[0.9rem] text-ink-muted">
            {authTab === 'login' ? (
              <>Don't have an account? <button onClick={() => setAuthTab('signup')} className="bg-transparent border-0 text-primary font-medium cursor-pointer p-0">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setAuthTab('login')} className="bg-transparent border-0 text-primary font-medium cursor-pointer p-0">Sign in</button></>
            )}
          </div>
        </motion.div>
      </div>

      {/* Left side: brand panel */}
      <div className="flex-1 flex items-center justify-center p-10 bg-card border-r border-line relative overflow-hidden max-md:hidden">
        {/* Decorative background circles */}
        <div className="absolute -top-20 -left-20 w-75 h-75 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-15 -right-15 w-62.5 h-62.5 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

        <motion.div 
          className="max-w-95 w-full flex flex-col items-start text-left gap-8"
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo mark */}
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 7V12C4 16.42 7.42 20.57 12 21C16.58 20.57 20 16.42 20 12V7L12 3Z" fill="currentColor" className="text-primary" opacity="0.8"/>
              <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h2 className="text-[2rem] font-bold tracking-[-0.02em] text-ink mb-4 leading-tight">
              Experience Lumio
            </h2>
            <p className="text-ink-muted text-[1rem] leading-relaxed">
              Test-drive our study simulator right here. Upload materials and immediately trigger automated quizzes, spaced repetition cards, and live group challenges.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full">
            {[
              { emoji: '⚡', label: 'Automated Quizzes' },
              { emoji: '🃏', label: 'Spaced Repetition Cards' },
              { emoji: '👥', label: 'Live Group Challenges' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 bg-app/60 border border-line rounded-lg px-4 py-3">
                <span className="text-lg">{f.emoji}</span>
                <span className="text-sm font-medium text-ink">{f.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
