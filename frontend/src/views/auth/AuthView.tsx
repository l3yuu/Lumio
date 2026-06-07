import React, { useState } from 'react';
import { MockQuizWidget } from '../../components/marketing/MockQuizWidget';
import { MockFlashcardWidget } from '../../components/marketing/MockFlashcardWidget';
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
    <div className="flex flex-row-reverse h-full w-full bg-app overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12 bg-app h-full overflow-y-auto">
        <div className="w-full max-w-[400px] flex flex-col">
          <button
            onClick={() => setView('landing')}
            className="bg-transparent border-0 cursor-pointer p-0 mb-12"
          >
            <span>Lumio</span>
          </button>

          <div className="mb-8">
            <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-ink mb-2">
              {authTab === 'login' ? 'Welcome back' : 'Get started'}
            </h1>
            <p className="text-ink-muted text-[0.95rem]">
              {authTab === 'login' ? 'Sign in to your account' : 'Create your student account'}
            </p>
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

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
            {authTab === 'signup' && (
              <div className="flex flex-col gap-[0.35rem] mb-5">
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
            )}

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

            <button type="submit" className="inline-flex items-center justify-center w-full gap-2 text-sm p-[0.85rem] rounded-md font-bold transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover mt-2">
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
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-10 bg-card border-r border-line relative overflow-hidden h-full max-md:hidden">
        <div className="max-w-[520px] w-full h-full flex flex-col justify-center gap-5">
          <div>
            <h2 className="text-[1.75rem] font-bold tracking-[-0.02em] text-ink mb-3">Experience Lumio</h2>
            <p className="text-ink-muted text-[0.95rem] leading-snug mb-10">
              Test-drive our study simulator right here. Upload materials and immediately trigger automated quizzes, spaced repetition cards, and live group challenges.
            </p>
          </div>

          <div className="relative mb-6 bg-app border border-line rounded-xl overflow-hidden">
            <div className="flex items-center justify-between py-3 px-4 border-b border-line bg-black/10">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
              </div>
              <div className="text-[0.8rem] text-ink-muted font-medium">Cellular Biology 101 - Quiz</div>
            </div>
            <div className="p-6">
              <MockQuizWidget />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <MockFlashcardWidget />

            <div className="bg-app border border-line rounded-xl p-5 flex flex-col justify-between h-[180px] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex justify-between text-xs text-ink-muted mb-2">
                <span>Study Lobby</span>
                <span className="text-success flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block"></span>
                  Live Sync
                </span>
              </div>
              <div className="flex flex-col gap-2 flex-1 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-[22px] h-[22px] rounded-full bg-success flex items-center justify-center text-[0.7rem] font-bold text-ink-on-primary">S</div>
                  <div className="flex flex-col">
                    <span className="text-xs text-ink font-semibold">Sarah (Sarah Miller)</span>
                    <span className="text-[0.65rem] text-ink-muted">Quiz accuracy: 90%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-[22px] h-[22px] rounded-full bg-blue flex items-center justify-center text-[0.7rem] font-bold text-white">A</div>
                  <div className="flex flex-col">
                    <span className="text-xs text-ink font-semibold">Alex Rivera</span>
                    <span className="text-[0.65rem] text-ink-muted">Condensing Syllabus...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
