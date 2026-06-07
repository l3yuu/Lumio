import React from 'react';
import type { User, View, DashboardTab } from '../../types';

interface FooterProps {
  user: User | null;
  setView: (view: View) => void;
  setDashboardTab?: (tab: DashboardTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ user, setView, setDashboardTab }) => {
  return (
    <footer className="mt-24 border-t border-line bg-app">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-16 mb-16 max-md:grid-cols-1 max-md:gap-10">
          <div>
            <button
              onClick={() => { setView(user ? 'dashboard' : 'landing'); if (setDashboardTab) setDashboardTab('overview'); }}
              className="bg-transparent border-none p-0 cursor-pointer inline-flex items-center mb-4 text-2xl font-extrabold tracking-tight text-ink"
            >
              <span>Lumio</span>
            </button>
            <p className="text-[0.9rem] text-ink-muted mb-6 max-w-[250px] leading-relaxed">
              Empowering students to excel in exams with AI-powered study modules and collaborative group quizzes.
            </p>
            <div className="flex gap-4">
              <a href="#twitter" aria-label="Twitter" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-line text-ink-muted hover:text-primary hover:border-primary transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="https://github.com/l3yuu/Lumio" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-line text-ink-muted hover:text-primary hover:border-primary transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
              <a href="#linkedin" aria-label="LinkedIn" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-line text-ink-muted hover:text-primary hover:border-primary transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-ink mb-4">Platform</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              <li><button onClick={() => { setView(user ? 'dashboard' : 'landing'); if (setDashboardTab) setDashboardTab('overview'); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">Dashboard</button></li>
              <li><button onClick={() => { setView('how-it-works'); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">How it Works</button></li>
              <li><button onClick={() => { setView('docs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">Documentation</button></li>
              <li><button onClick={() => { setView(user ? 'dashboard' : 'auth'); if (setDashboardTab) setDashboardTab('groups'); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">Study Groups</button></li>
              <li><button onClick={() => { setView(user ? 'dashboard' : 'auth'); if (setDashboardTab) setDashboardTab('modules'); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">My Modules</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-ink mb-4">Study Tools</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              <li><button onClick={() => { setView('tools'); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">Flashcard Generator</button></li>
              <li><button onClick={() => { setView('tools'); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">AI Essay Grader</button></li>
              <li><button onClick={() => { setView('tools'); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">Doc Condenser</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-ink mb-4">Contact</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              <li><button onClick={() => { setView('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-transparent border-none p-0 cursor-pointer text-sm text-ink-muted hover:text-primary transition-colors text-left">Contact Us</button></li>
              <li className="text-[0.9rem] mb-2">
                <a href="mailto:support.lumio@gmail.com" className="text-[0.9rem] text-ink-muted hover:text-primary transition-colors">
                  support.lumio@gmail.com
                </a>
              </li>
              <li className="text-ink-muted text-[0.9rem] mb-2">+63 9605215327</li>
              <li className="text-ink-muted text-[0.9rem]">Quezon City, Philippines</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-line flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-ink-muted">
          <p>&copy; {new Date().getFullYear()} Lumio Study Companion. All rights reserved.</p>
          <div className="flex gap-6">
            <a
              href="#privacy"
              className="text-[0.85rem] text-ink-muted hover:text-primary transition-colors"
              onClick={(e) => { e.preventDefault(); setView('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="text-[0.85rem] text-ink-muted hover:text-primary transition-colors"
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
