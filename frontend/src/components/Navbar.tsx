import React from 'react';
import { Sun, Moon, Menu, X, ChevronRight, Sparkles, HelpCircle, Layers } from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing' | 'privacy' | 'terms' | 'docs';
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing' | 'privacy' | 'terms' | 'docs') => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  user: { name: string; email: string } | null;
  handleLogout: () => void;
  setAuthTab: (tab: 'login' | 'signup') => void;
  setActiveQuizModule: (mod: any) => void;
  setSelectedGroupId: (id: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  toggleTheme,
  view,
  setView,
  mobileMenuOpen,
  setMobileMenuOpen,
  user,
  handleLogout,
  setAuthTab,
  setActiveQuizModule,
  setSelectedGroupId,
}) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button 
          onClick={() => { setView(user ? 'dashboard' : 'landing'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }} 
          className="brand" 
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <span>Lumio</span>
        </button>
        
        {/* Navigation routing */}
        <ul className="nav-links desktop-only">
          {user ? (
            <>
              <li>
                <button 
                  onClick={() => { setView('dashboard'); setActiveQuizModule(null); setSelectedGroupId(null); }} 
                  className={`sidebar-link ${view === 'dashboard' ? 'active' : ''}`}
                  style={{ background: 'none' }}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setView('landing'); setActiveQuizModule(null); setSelectedGroupId(null); }} 
                  className={`sidebar-link ${view === 'landing' ? 'active' : ''}`}
                  style={{ background: 'none' }}
                >
                  Explore Home
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <button 
                  onClick={() => { setView('landing'); setActiveQuizModule(null); }} 
                  className={`sidebar-link ${view === 'landing' ? 'active' : ''}`}
                  style={{ background: 'none' }}
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setView('how-it-works'); setActiveQuizModule(null); }} 
                  className={`sidebar-link ${view === 'how-it-works' ? 'active' : ''}`}
                  style={{ background: 'none' }}
                >
                  How it Works
                </button>
              </li>
              <li className="nav-dropdown-wrapper">
                <button 
                  onClick={() => { setView('tools'); setActiveQuizModule(null); }} 
                  className={`nav-dropdown-trigger ${['tools', 'flashcards', 'essay-grader', 'condenser'].includes(view) ? 'active' : ''}`}
                >
                  Study Tools
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div className="nav-dropdown-menu">
                  <button 
                    onClick={() => { setView('flashcards'); setActiveQuizModule(null); }}
                    className="nav-dropdown-item"
                  >
                    <Sparkles size={16} className="nav-dropdown-item-icon" />
                    <div className="nav-dropdown-item-content">
                      <span className="nav-dropdown-item-title">Flashcard Generator</span>
                      <span className="nav-dropdown-item-desc">Automatic spaced repetition cards</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => { setView('essay-grader'); setActiveQuizModule(null); }}
                    className="nav-dropdown-item"
                  >
                    <HelpCircle size={16} className="nav-dropdown-item-icon" />
                    <div className="nav-dropdown-item-content">
                      <span className="nav-dropdown-item-title">AI Essay Grader</span>
                      <span className="nav-dropdown-item-desc">Feedback synced to grading rubrics</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => { setView('condenser'); setActiveQuizModule(null); }}
                    className="nav-dropdown-item"
                  >
                    <Layers size={16} className="nav-dropdown-item-icon" />
                    <div className="nav-dropdown-item-content">
                      <span className="nav-dropdown-item-title">Document Condenser</span>
                      <span className="nav-dropdown-item-desc">Summarize large books & drafts</span>
                    </div>
                  </button>
                </div>
              </li>
              <li>
                <button 
                  onClick={() => { setView('docs'); setActiveQuizModule(null); }} 
                  className={`sidebar-link ${view === 'docs' ? 'active' : ''}`}
                  style={{ background: 'none' }}
                >
                  Docs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setView('pricing'); setActiveQuizModule(null); }} 
                  className={`sidebar-link ${view === 'pricing' ? 'active' : ''}`}
                  style={{ background: 'none' }}
                >
                  Pricing
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="navbar-actions desktop-only">
          <button onClick={toggleTheme} className="theme-switch-btn" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a 
            href="https://github.com/l3yuu/Lumio" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="github-nav-link" 
            aria-label="GitHub Repository"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </a>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="course-author-avatar" style={{ background: 'var(--primary)', color: '#121212', fontWeight: 'bold' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'inline' }}>
                Hi, {user.name}
              </span>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => { setAuthTab('login'); setView('auth'); }} className="btn btn-outline">Login</button>
              <button onClick={() => { setAuthTab('signup'); setView('auth'); }} className="btn btn-primary">Sign Up</button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="mobile-menu-toggle" 
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Overlay Drawer */}
      <div className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <button 
            onClick={() => { setView(user ? 'dashboard' : 'landing'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }} 
            className="brand" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span>Lumio</span>
          </button>
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            className="mobile-menu-toggle" 
            style={{ display: 'flex' }}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <ul className="mobile-nav-links">
          {user ? (
            <>
              <li style={{ animationDelay: '0.05s' }}>
                <button 
                  onClick={() => { setView('dashboard'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }} 
                  className={`mobile-nav-link ${view === 'dashboard' ? 'active' : ''}`}
                >
                  <span>Dashboard</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.1s' }}>
                <button 
                  onClick={() => { setView('landing'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }} 
                  className={`mobile-nav-link ${view === 'landing' ? 'active' : ''}`}
                >
                  <span>Explore Home</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
            </>
          ) : (
            <>
              <li style={{ animationDelay: '0.05s' }}>
                <button 
                  onClick={() => { setView('landing'); setActiveQuizModule(null); setMobileMenuOpen(false); }} 
                  className={`mobile-nav-link ${view === 'landing' ? 'active' : ''}`}
                >
                  <span>Home</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.1s' }}>
                <button 
                  onClick={() => { setView('how-it-works'); setActiveQuizModule(null); setMobileMenuOpen(false); }} 
                  className={`mobile-nav-link ${view === 'how-it-works' ? 'active' : ''}`}
                >
                  <span>How it Works</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.15s' }}>
                <button 
                  onClick={() => { setView('tools'); setActiveQuizModule(null); setMobileMenuOpen(false); }} 
                  className={`mobile-nav-link ${view === 'tools' ? 'active' : ''}`}
                >
                  <span>Study Tools</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.2s' }}>
                <button 
                  onClick={() => { setView('docs'); setActiveQuizModule(null); setMobileMenuOpen(false); }} 
                  className={`mobile-nav-link ${view === 'docs' ? 'active' : ''}`}
                >
                  <span>Docs</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.25s' }}>
                <button 
                  onClick={() => { setView('pricing'); setMobileMenuOpen(false); }} 
                  className={`mobile-nav-link ${view === 'pricing' ? 'active' : ''}`}
                >
                  <span>Pricing</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="mobile-menu-footer">
          <button onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} className="theme-switch-btn" style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.75rem', marginBottom: '0.25rem' }} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <><Sun size={18} /> <span>Light Mode</span></>
            ) : (
              <><Moon size={18} /> <span>Dark Mode</span></>
            )}
          </button>
          <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0.75rem' }}>
            <a href="#twitter" aria-label="Twitter" className="footer-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a 
              href="https://github.com/l3yuu/Lumio" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link" 
              onClick={() => setMobileMenuOpen(false)}
              aria-label="GitHub Repository"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
            <a href="#linkedin" aria-label="LinkedIn" className="footer-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>
          
          <div className="mobile-menu-auth">
            {user ? (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                Logout
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => { setAuthTab('signup'); setView('auth'); setMobileMenuOpen(false); }} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontWeight: 'bold' }}>
                  Sign Up
                </button>
                <button onClick={() => { setAuthTab('login'); setView('auth'); setMobileMenuOpen(false); }} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
