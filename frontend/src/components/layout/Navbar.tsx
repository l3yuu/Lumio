import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Menu, X, ChevronRight, Sparkles, HelpCircle, Layers, Settings, Bell } from 'lucide-react';
import type { User, View, AuthTab, DashboardTab, Module } from '../../types';

interface NavbarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  view: View;
  setView: (view: View) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  user: User | null;
  handleLogout: () => void;
  setAuthTab: (tab: AuthTab) => void;
  setActiveQuizModule: (mod: Module | null) => void;
  setSelectedGroupId: (id: number | null) => void;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed?: boolean;
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
  dashboardTab,
  setDashboardTab,
  onToggleSidebar,
  isSidebarCollapsed = false,
}) => {
  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 w-full border-b border-line bg-app/85 backdrop-blur-xl">
      <div className={`max-w-[1200px] w-full mx-auto py-3 px-8 flex justify-between items-center ${user && view === 'dashboard' ? 'max-w-full pl-0 pr-6' : user ? 'max-w-full px-6' : ''}`}>
        <div className="flex items-center">
          {view === 'dashboard' && user ? (
            <div className="flex items-center justify-center shrink-0 w-[72px]">
              <motion.button
                onClick={onToggleSidebar}
                aria-label="Toggle Sidebar"
                className="inline-flex bg-transparent border-0 cursor-pointer p-2 items-center justify-center text-ink-muted rounded-full hover:text-ink hover:bg-glass"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <motion.span
                  animate={{ rotate: isSidebarCollapsed ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="flex"
                >
                  <Menu size={20} />
                </motion.span>
              </motion.button>
            </div>
          ) : null}
          <button
            onClick={() => { setView(user ? 'dashboard' : 'landing'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }}
            className={`flex items-center gap-2 no-underline text-ink text-xl font-bold tracking-[-0.03em] bg-transparent border-0 cursor-pointer p-0 leading-none ${view === 'dashboard' && user ? 'ml-3' : ''}`}
          >
            <span>Lumio</span>
          </button>
        </div>

        {!user && (
          <ul className="hidden md:flex gap-6 list-none items-center">
            <li>
              <button
                onClick={() => { setView('landing'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:!text-primary ${view === 'landing' ? '!text-primary' : ''}`}
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => { setView('how-it-works'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:!text-primary ${view === 'how-it-works' ? '!text-primary' : ''}`}
              >
                How it Works
              </button>
            </li>
            <li className="relative inline-block group">
              <button
                onClick={() => { setView('tools'); setActiveQuizModule(null); }}
                className={`flex items-center gap-1 bg-transparent border-0 cursor-pointer py-2 px-3 font-medium text-[0.95rem] text-ink transition-colors duration-200 hover:!text-primary group-hover:!text-primary ${['tools', 'flashcards', 'essay-grader', 'condenser'].includes(view) ? '!text-primary' : ''}`}
              >
                Study Tools
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 translate-y-2.5 w-[280px] bg-app/95 backdrop-blur-2xl border border-line rounded-xl p-3 shadow-lg opacity-0 invisible pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[1010] flex flex-col gap-1 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-x-[-50%] group-hover:translate-y-1">
                <button
                  onClick={() => { setView('flashcards'); setActiveQuizModule(null); }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3"
                >
                  <Sparkles size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">Flashcard Generator</span>
                    <span className="text-xs text-ink-muted leading-snug">Automatic spaced repetition cards</span>
                  </div>
                </button>
                <button
                  onClick={() => { setView('essay-grader'); setActiveQuizModule(null); }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3"
                >
                  <HelpCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">AI Essay Grader</span>
                    <span className="text-xs text-ink-muted leading-snug">Feedback synced to grading rubrics</span>
                  </div>
                </button>
                <button
                  onClick={() => { setView('condenser'); setActiveQuizModule(null); }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3"
                >
                  <Layers size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">Document Condenser</span>
                    <span className="text-xs text-ink-muted leading-snug">Summarize large books & drafts</span>
                  </div>
                </button>
              </div>
            </li>
            <li>
              <button
                onClick={() => { setView('docs'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:!text-primary ${view === 'docs' ? '!text-primary' : ''}`}
              >
                Docs
              </button>
            </li>
            <li>
              <button
                onClick={() => { setView('pricing'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:!text-primary ${view === 'pricing' ? '!text-primary' : ''}`}
              >
                Pricing
              </button>
            </li>
          </ul>
        )}

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div className="relative inline-block mr-1.5 group">
                <button
                  className="bg-transparent border-0 cursor-pointer p-2 flex items-center relative text-ink rounded-full transition-colors duration-200 hover:bg-glass"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-[pulse-green_2s_infinite]"></span>
                </button>
                <div className="absolute top-full left-auto right-0 translate-y-2.5 w-[320px] p-0 bg-app/95 backdrop-blur-2xl border border-line rounded-xl shadow-lg opacity-0 invisible pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[1010] flex flex-col gap-0 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-1">
                  <div className="p-2 px-4 pb-3 border-b border-line flex justify-between items-center mb-1 font-semibold text-[0.9rem] text-ink">
                    <span>Notifications</span>
                    <button className="bg-transparent border-0 text-primary text-xs cursor-pointer py-0.5 px-1 font-medium transition-opacity duration-150 hover:opacity-80">Mark all as read</button>
                  </div>

                  <div className="p-3 px-4 flex flex-col gap-1 border-b border-line cursor-pointer transition-colors duration-150 hover:bg-glass last:border-b-0">
                    <div className="text-sm font-semibold text-ink">Alex Johnson posted a new module</div>
                    <div className="text-xs text-ink-muted">"Limits & Continuity" in Study Circle</div>
                    <div className="text-[0.7rem] text-ink-muted mt-0.5">10 mins ago</div>
                  </div>

                  <div className="p-3 px-4 flex flex-col gap-1 border-b border-line cursor-pointer transition-colors duration-150 hover:bg-glass last:border-b-0">
                    <div className="text-sm font-semibold text-ink">Sarah Miller finished Chapter 3 Quiz</div>
                    <div className="text-xs text-ink-muted">Scored 3/3 (100%) in 45s</div>
                    <div className="text-[0.7rem] text-ink-muted mt-0.5">1 hour ago</div>
                  </div>

                  <div className="p-3 px-4 flex flex-col gap-1 border-b border-line cursor-pointer transition-colors duration-150 hover:bg-glass last:border-b-0">
                    <div className="text-sm font-semibold text-ink">Upcoming Session: Biology 101</div>
                    <div className="text-xs text-ink-muted">Group quiz session starts in 15 minutes</div>
                    <div className="text-[0.7rem] text-ink-muted mt-0.5">2 hours ago</div>
                  </div>
                </div>
              </div>

              <div className="relative inline-block group">
                <button
                  className="flex items-center bg-transparent border-0 cursor-pointer p-0"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm object-cover border-[1.5px] border-line flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm object-cover border-[1.5px] border-line flex-shrink-0 bg-primary text-ink-on-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="absolute top-full left-auto right-0 translate-y-2.5 w-[280px] bg-app/95 backdrop-blur-2xl border border-line rounded-xl p-3 shadow-lg opacity-0 invisible pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[1010] flex flex-col gap-1 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-1">
                  <div className="p-2 px-3 border-b border-line mb-2">
                    <div className="font-semibold text-sm text-ink">{user.name}</div>
                    <div className="text-xs text-ink-muted overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setView('dashboard');
                      setDashboardTab('settings');
                      setActiveQuizModule(null);
                      setSelectedGroupId(null);
                    }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3 flex items-center gap-2 p-2 px-3"
                  >
                    <Settings size={16} />
                    <span className="text-sm">Profile Settings</span>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3 flex items-center gap-2 p-2 px-3"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <div className="h-px bg-line my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3 flex items-center gap-2 p-2 px-3 text-danger"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <button onClick={toggleTheme} className="bg-transparent border-0 text-ink-muted cursor-pointer flex items-center justify-center p-2 rounded-md transition-colors duration-150 hover:text-ink hover:bg-input" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <a
                href="https://github.com/l3yuu/Lumio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-muted flex items-center justify-center p-2 rounded-md transition-colors duration-150 no-underline hover:text-ink hover:bg-input"
                aria-label="GitHub Repository"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
              <button onClick={() => { setAuthTab('login'); setView('auth'); }} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-transparent border-line text-ink hover:bg-input hover:border-line-strong">Login</button>
              <button onClick={() => { setAuthTab('signup'); setView('auth'); }} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover">Sign Up</button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center bg-transparent border-0 text-ink cursor-pointer p-2 rounded-md transition-colors duration-150 hover:bg-input"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`fixed inset-0 w-screen h-screen bg-[#171717] z-[2000] flex flex-col p-0 overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? 'translate-x-0 visible pointer-events-auto' : '-translate-x-full invisible pointer-events-none'}`}>
        <div className="h-16 px-8 flex justify-between items-center border-b border-line flex-shrink-0">
          <button
            onClick={() => { setView(user ? 'dashboard' : 'landing'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 no-underline text-ink text-xl font-bold tracking-[-0.03em] bg-transparent border-0 cursor-pointer p-0 leading-none"
          >
            <span>Lumio</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden flex items-center justify-center bg-transparent border-0 text-ink cursor-pointer p-2 rounded-md transition-colors duration-150 hover:bg-input"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <ul className="list-none flex flex-col py-6 px-8 flex-1 overflow-y-auto mb-[150px]">
          {user ? (
            <>
              <li style={{ animationDelay: '0.05s' }}>
                <button
                  onClick={() => { setView('dashboard'); setDashboardTab('overview'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'dashboard' && dashboardTab !== 'settings' ? 'text-primary' : ''}`}
                >
                  <span>Dashboard</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.1s' }}>
                <button
                  onClick={() => { setView('dashboard'); setDashboardTab('settings'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'dashboard' && dashboardTab === 'settings' ? 'text-primary' : ''}`}
                >
                  <span>Profile Settings</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
            </>
          ) : (
            <>
              <li style={{ animationDelay: '0.05s' }}>
                <button
                  onClick={() => { setView('landing'); setActiveQuizModule(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'landing' ? 'text-primary' : ''}`}
                >
                  <span>Home</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.1s' }}>
                <button
                  onClick={() => { setView('how-it-works'); setActiveQuizModule(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'how-it-works' ? 'text-primary' : ''}`}
                >
                  <span>How it Works</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.15s' }}>
                <button
                  onClick={() => { setView('tools'); setActiveQuizModule(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'tools' ? 'text-primary' : ''}`}
                >
                  <span>Study Tools</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.2s' }}>
                <button
                  onClick={() => { setView('docs'); setActiveQuizModule(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'docs' ? 'text-primary' : ''}`}
                >
                  <span>Docs</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
              <li style={{ animationDelay: '0.25s' }}>
                <button
                  onClick={() => { setView('pricing'); setMobileMenuOpen(false); }}
                  className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'pricing' ? 'text-primary' : ''}`}
                >
                  <span>Pricing</span>
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-line bg-[#171717] flex flex-col gap-4 w-full z-[2010]">
          <button onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} className="bg-transparent border-0 text-ink-muted cursor-pointer flex items-center justify-center p-2 rounded-md transition-colors duration-150 hover:text-ink hover:bg-input w-full justify-start gap-2 px-3 mb-1" aria-label="Toggle theme">
            {theme === 'dark' ? (
              <><Sun size={18} /> <span>Light Mode</span></>
            ) : (
              <><Moon size={18} /> <span>Dark Mode</span></>
            )}
          </button>
          <div className="flex gap-6 p-2 px-3">
            <a href="#twitter" aria-label="Twitter" className="text-ink-muted no-underline text-[0.92rem] transition-colors duration-200 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a
              href="https://github.com/l3yuu/Lumio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted no-underline text-[0.92rem] transition-colors duration-200 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="GitHub Repository"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
            <a href="#linkedin" aria-label="LinkedIn" className="text-ink-muted no-underline text-[0.92rem] transition-colors duration-200 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {user ? (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-transparent border-line text-ink hover:bg-input hover:border-line-strong w-full justify-center py-3">Logout</button>
            ) : (
              <div className="flex flex-col gap-3">
                <button onClick={() => { setAuthTab('signup'); setView('auth'); setMobileMenuOpen(false); }} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover w-full justify-center py-3.5 font-bold">Sign Up</button>
                <button onClick={() => { setAuthTab('login'); setView('auth'); setMobileMenuOpen(false); }} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-transparent border-line text-ink hover:bg-input hover:border-line-strong w-full justify-center py-3.5">Login</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
