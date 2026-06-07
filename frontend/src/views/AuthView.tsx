import React, { useState } from 'react';
import { MockQuizWidget } from '../components/MockQuizWidget';
import { MockFlashcardWidget } from '../components/MockFlashcardWidget';

interface AuthViewProps {
  authTab: 'login' | 'signup';
  setAuthTab: (tab: 'login' | 'signup') => void;
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing') => void;
  setUser: (user: { name: string; email: string } | null) => void;
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
    setUser({ name, email: formEmail });
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setView('dashboard');
  };

  return (
    <div className="auth-split-layout">
      {/* Left Column: Form */}
      <div className="auth-form-column">
        <div className="auth-form-container">
          <button 
            onClick={() => setView('landing')} 
            className="brand" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '3rem' }}
          >
            <span>Lumio</span>
          </button>

          <div className="auth-heading-section">
            <h1 className="auth-title">
              {authTab === 'login' ? 'Welcome back' : 'Get started'}
            </h1>
            <p className="auth-subtitle">
              {authTab === 'login' ? 'Sign in to your account' : 'Create your student account'}
            </p>
          </div>

          {/* Google OAuth Button */}
          <button 
            type="button" 
            className="btn btn-outline social-btn" 
            onClick={() => {
              setUser({ name: 'Google Student', email: 'student@gmail.com' });
              setView('dashboard');
            }}
            style={{ width: '100%', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.19-4.53z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {authTab === 'signup' && (
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }}
                />
              </div>
            )}

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Email address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                className="form-input"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                {authTab === 'login' && (
                  <a href="#forgot" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Forgot password?</a>
                )}
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="form-input"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
                style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              {authTab === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <div className="auth-switch-prompt" style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {authTab === 'login' ? (
              <>Don't have an account? <button onClick={() => setAuthTab('signup')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer', padding: 0 }}>Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setAuthTab('login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer', padding: 0 }}>Sign in</button></>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Showcase */}
      <div className="auth-quote-column">
        <div className="auth-interactive-showcase">
          <div className="auth-showcase-header">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Experience Lumio</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '2.5rem' }}>
              Test-drive our study simulator right here. Upload materials and immediately trigger automated quizzes, spaced repetition cards, and live group challenges.
            </p>
          </div>

          {/* Quiz Widget Mockup */}
          <div className="mock-window quiz-mock" style={{ marginBottom: '1.5rem', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="mock-window-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
              <div className="mock-dots" style={{ display: 'flex', gap: '6px' }}>
                <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
              </div>
              <div className="mock-window-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Cellular Biology 101 - Quiz</div>
            </div>
            <div className="mock-window-body" style={{ padding: '1.5rem' }}>
              <MockQuizWidget />
            </div>
          </div>

          {/* Flashcard and Study Group Grid */}
          <div className="showcase-grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Spaced Repetition Card */}
            <MockFlashcardWidget />

            {/* Live Study Group Lobby */}
            <div className="mock-group-lobby" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <span>Study Lobby</span>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  Live Sync
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#1c1c1c' }}>S</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>Sarah (Sarah Miller)</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Quiz accuracy: 90%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>A</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>Alex Rivera</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Condensing Syllabus...</span>
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
