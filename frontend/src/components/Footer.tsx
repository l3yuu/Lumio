import React from 'react';

interface FooterProps {
  user: { name: string; email: string } | null;
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing' | 'privacy' | 'terms') => void;
  setDashboardTab?: (tab: 'overview' | 'modules' | 'groups' | 'tools' | 'settings') => void;
}

export const Footer: React.FC<FooterProps> = ({ user, setView, setDashboardTab }) => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-column">
            <button 
              onClick={() => { setView(user ? 'dashboard' : 'landing'); if (setDashboardTab) setDashboardTab('overview'); }} 
              className="brand" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', marginBottom: '1rem' }}
            >
              <span>Lumio</span>
            </button>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '250px', lineHeight: '1.5' }}>
              Empowering students to excel in exams with AI-powered study modules and collaborative group quizzes.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="#twitter" aria-label="Twitter" className="footer-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="https://github.com/l3yuu/Lumio" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="footer-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
              <a href="#linkedin" aria-label="LinkedIn" className="footer-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>
          
          <div className="footer-links-column">
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links-list">
              <li><button onClick={() => { setView(user ? 'dashboard' : 'landing'); if (setDashboardTab) setDashboardTab('overview'); }} className="footer-link-btn">Dashboard</button></li>
              <li><button onClick={() => { setView('how-it-works'); }} className="footer-link-btn">How it Works</button></li>
              <li><button onClick={() => { setView(user ? 'dashboard' : 'auth'); if (setDashboardTab) setDashboardTab('groups'); }} className="footer-link-btn">Study Groups</button></li>
              <li><button onClick={() => { setView(user ? 'dashboard' : 'auth'); if (setDashboardTab) setDashboardTab('modules'); }} className="footer-link-btn">My Modules</button></li>
            </ul>
          </div>
          
          <div className="footer-links-column">
            <h4 className="footer-title">Study Tools</h4>
            <ul className="footer-links-list">
              <li><button onClick={() => { setView('tools'); }} className="footer-link-btn">Flashcard Generator</button></li>
              <li><button onClick={() => { setView('tools'); }} className="footer-link-btn">AI Essay Grader</button></li>
              <li><button onClick={() => { setView('tools'); }} className="footer-link-btn">Doc Condenser</button></li>
            </ul>
          </div>
          
          <div className="footer-links-column">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-links-list">
              <li style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>support@lumio.study</li>
              <li style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>+1 (555) 492-8822</li>
              <li style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>100 Pine St, San Francisco, CA</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Lumio Study Companion. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a 
              href="#privacy" 
              className="footer-link" 
              style={{ fontSize: '0.85rem' }}
              onClick={(e) => { e.preventDefault(); setView('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              Privacy Policy
            </a>
            <a 
              href="#terms" 
              className="footer-link" 
              style={{ fontSize: '0.85rem' }}
              onClick={(e) => { e.preventDefault(); setView('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
