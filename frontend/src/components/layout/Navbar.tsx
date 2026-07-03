import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X, ChevronRight, Sparkles, Layers, Settings, Bell, FileText, Users, Calendar, History, Notebook } from 'lucide-react';
import type { User, View, AuthTab, DashboardTab, Module, Notification, GroupInvitation, StudyGroup } from '../../types';

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
  notifications?: Notification[];
  invitations?: GroupInvitation[];
  onMarkNotificationRead?: (id: number) => void;
  onMarkAllNotificationsRead?: () => void;
  onAcceptInvitation?: (id: number) => void;
  onDeclineInvitation?: (id: number) => void;
  onToggleAiSidebar?: () => void;
  isPwaInstallable?: boolean;
  onPwaInstall?: () => void;
  showPwaBanner?: boolean;
  onDismissPwaBanner?: () => void;
  groups?: StudyGroup[];
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
  notifications = [],
  invitations = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onAcceptInvitation,
  onDeclineInvitation,
  onToggleAiSidebar,
  isPwaInstallable = false,
  onPwaInstall = () => {},
  showPwaBanner = false,
  onDismissPwaBanner = () => {},
  groups = [],
}) => {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const notifRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 w-full border-b border-line bg-app/85 backdrop-blur-xl">
      {/* PWA Dismissible Top Banner */}
      {showPwaBanner && isPwaInstallable && view !== 'auth' && (
        <div className="bg-primary text-ink-on-primary py-2 px-4 flex items-center justify-between text-xs sm:text-sm font-semibold select-none border-b border-primary-hover relative z-50">
          <div className="flex items-center gap-2 overflow-hidden mr-6">
            <Sparkles size={14} className="shrink-0 animate-pulse text-ink-on-primary" />
            <span className="truncate">Download the Lumio mobile app for a full-screen experience!</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={onPwaInstall}
              className="bg-ink-on-primary text-primary px-3 py-0.5 rounded-md text-[0.75rem] font-bold shadow-sm hover:opacity-90 transition active:scale-95 cursor-pointer"
            >
              Install
            </button>
            <button 
              onClick={onDismissPwaBanner}
              className="hover:bg-[rgba(0,0,0,0.1)] p-0.5 rounded transition cursor-pointer"
              aria-label="Close installation banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <div className={
        !user
          ? "max-w-300 w-full mx-auto py-3 px-6 lg:px-8 flex justify-between items-center"
          : view === 'dashboard'
            ? "max-w-full w-full mx-auto py-3 pl-6 pr-6 lg:pl-0 lg:pr-6 flex justify-between items-center"
            : "max-w-full w-full mx-auto py-3 px-6 flex justify-between items-center"
      }>
        <div className="flex items-center">
          {/* Mobile hamburger — left side, mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center bg-transparent border-0 text-ink cursor-pointer p-2 rounded-md transition-colors duration-150 hover:bg-input mr-2"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {view === 'dashboard' && user ? (
            <div className="hidden lg:flex items-center justify-center shrink-0 w-18">
              <motion.button
                onClick={onToggleSidebar}
                aria-label="Toggle Sidebar"
                className="inline-flex bg-transparent border-0 cursor-pointer p-2 items-center justify-center text-ink-muted rounded-full hover:text-ink hover:bg-glass"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <span className="flex">
                  <Menu size={20} />
                </span>
              </motion.button>
            </div>
          ) : null}
          <button
            onClick={() => { setView(user ? 'dashboard' : 'landing'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }}
            className={`flex items-center gap-2 no-underline text-ink text-xl font-bold tracking-[-0.03em] bg-transparent border-0 cursor-pointer p-0 leading-none ml-3 ${view === 'dashboard' && user ? 'lg:ml-3' : 'lg:ml-0'}`}
          >
            <span>Lumio</span>
          </button>
        </div>

        {!user && (
          <ul className="hidden lg:flex gap-6 list-none items-center">
            <li>
              <button
                onClick={() => { setView('landing'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:text-primary! ${view === 'landing' ? 'text-primary!' : ''}`}
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => { setView('how-it-works'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:text-primary! ${view === 'how-it-works' ? 'text-primary!' : ''}`}
              >
                How it Works
              </button>
            </li>
            <li>
              <button
                onClick={() => { setView('tools'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:text-primary! ${view === 'tools' ? 'text-primary!' : ''}`}
              >
                Study Tools
              </button>
            </li>

            <li>
              <button
                onClick={() => { setView('docs'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:text-primary! ${view === 'docs' ? 'text-primary!' : ''}`}
              >
                Docs
              </button>
            </li>
            <li>
              <button
                onClick={() => { setView('pricing'); setActiveQuizModule(null); }}
                className={`text-ink no-underline font-medium text-sm transition-colors duration-150 bg-transparent border-0 cursor-pointer py-2 px-3 flex items-center hover:text-primary! ${view === 'pricing' ? 'text-primary!' : ''}`}
              >
                Pricing
              </button>
            </li>
          </ul>
        )}

        <div className={
          user
            ? "flex items-center gap-1.5 sm:gap-3 lg:gap-4"
            : "hidden lg:flex items-center gap-4"
        }>
          {user ? (
            <>
              {/* Ask AI Chatbot Toggle */}
              <button
                onClick={() => {
                  onToggleAiSidebar?.();
                }}
                className="bg-transparent border-0 cursor-pointer p-2 flex items-center relative text-ink rounded-full transition-colors duration-200 hover:bg-glass mr-1"
                title="Ask AI Concept Tutor"
                aria-label="Ask AI Concept Tutor"
              >
                <Sparkles size={20} className="text-primary animate-pulse" />
              </button>

              <div ref={notifRef} className="relative inline-block mr-1.5">
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setUserMenuOpen(false);
                  }}
                  className="bg-transparent border-0 cursor-pointer p-2 flex items-center relative text-ink rounded-full transition-colors duration-200 hover:bg-glass"
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                >
                  <Bell size={20} />
                  {(notifications.some(n => !n.is_read) || invitations.length > 0) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-[pulse-green_2s_infinite]"></span>
                  )}
                </button>
                <div className={`fixed lg:absolute top-[58px] lg:top-full left-4 right-4 lg:left-auto lg:right-0 lg:translate-y-2.5 lg:w-90 p-0 bg-app/95 backdrop-blur-2xl border border-line rounded-xl shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-1010 flex flex-col gap-0 ${
                  notifOpen
                    ? 'opacity-100 visible pointer-events-auto translate-y-1'
                    : 'opacity-0 invisible pointer-events-none'
                }`}>
                  <div className="p-3 px-4 border-b border-line flex justify-between items-center font-semibold text-[0.9rem] text-ink">
                    <span>Notifications</span>
                    <div className="flex gap-2">
                      {onMarkAllNotificationsRead && (notifications.some(n => !n.is_read) || invitations.length > 0) && (
                        <button onClick={() => { onMarkAllNotificationsRead(); }} className="bg-transparent border-0 text-primary text-xs cursor-pointer py-0.5 px-1 font-medium transition-opacity duration-150 hover:opacity-80">Mark all as read</button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-90 overflow-y-auto">
                    {/* Pending invitations */}
                    {invitations.map(inv => (
                      <div key={`inv-${inv.id}`} className="p-3 px-4 flex flex-col gap-1.5 border-b border-line transition-colors duration-150 hover:bg-glass last:border-b-0">
                        <div className="text-sm font-semibold text-ink flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                          {inv.inviter_name} invited you
                        </div>
                        <div className="text-xs text-ink-muted">Join "{inv.group_name}"</div>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => { onAcceptInvitation?.(inv.id); setNotifOpen(false); }}
                            className="text-xs font-semibold bg-primary text-ink-on-primary px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all hover:bg-primary-hover"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => { onDeclineInvitation?.(inv.id); setNotifOpen(false); }}
                            className="text-xs font-semibold bg-transparent text-ink-muted border border-line px-2.5 py-1 rounded-lg cursor-pointer transition-all hover:text-ink hover:bg-glass"
                          >
                            Decline
                          </button>
                        </div>
                        <div className="text-[0.65rem] text-ink-muted mt-0.5">{inv.created_at}</div>
                      </div>
                    ))}

                    {/* System notifications */}
                    {notifications.length === 0 && invitations.length === 0 ? (
                      <div className="p-6 text-center text-sm text-ink-muted">No notifications yet</div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (onMarkNotificationRead && !n.is_read) onMarkNotificationRead(n.id);
                            setNotifOpen(false);
                            
                            if (n.type === 'module_shared' || n.type === 'note_shared') {
                              const isModule = n.type === 'module_shared';
                              const group = groups.find(g =>
                                isModule
                                  ? g.modules?.some(m => m.id === n.related_id)
                                  : g.notes?.some(nt => nt.id === n.related_id)
                              );
                              if (group) {
                                setView('dashboard');
                                setSelectedGroupId(group.id);
                                setDashboardTab('groups');
                              }
                            }
                          }}
                          className={`p-3 px-4 flex flex-col gap-0.5 border-b border-line cursor-pointer transition-colors duration-150 hover:bg-glass last:border-b-0 ${!n.is_read ? 'bg-primary-soft/10' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${!n.is_read ? 'text-ink' : 'text-ink-muted'}`}>{n.title}</span>
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>}
                          </div>
                          {n.message && <div className="text-xs text-ink-muted line-clamp-1">{n.message}</div>}
                          <div className="text-[0.65rem] text-ink-muted/60 mt-0.5">{n.created_at}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer link to full notifications panel */}
                  {setDashboardTab && (
                    <div className="p-2 border-t border-line">
                      <button
                        onClick={() => { setView('dashboard'); setDashboardTab('notifications'); setNotifOpen(false); setActiveQuizModule(null); setSelectedGroupId(null); }}
                        className="w-full text-center text-xs font-medium text-primary bg-transparent border-0 cursor-pointer py-1.5 rounded-lg transition-colors hover:bg-primary-soft"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div ref={userMenuRef} className="relative inline-block">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center bg-transparent border-0 cursor-pointer p-0"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm object-cover border-[1.5px] border-line shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm object-cover border-[1.5px] border-line shrink-0 bg-primary text-ink-on-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                <div className={`absolute top-full left-auto right-0 translate-y-2.5 w-70 bg-app/95 backdrop-blur-2xl border border-line rounded-xl p-3 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-1010 flex flex-col gap-1 ${
                  userMenuOpen
                    ? 'opacity-100 visible pointer-events-auto translate-y-1'
                    : 'opacity-0 invisible pointer-events-none'
                }`}>
                  <div className="p-2 px-3 border-b border-line mb-2">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm text-ink">{user.name}</div>
                      {user.is_premium && (
                        <span className="text-[0.65rem] font-extrabold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase tracking-wider leading-none">
                          Pro
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setView('dashboard');
                      setDashboardTab('settings');
                      setActiveQuizModule(null);
                      setSelectedGroupId(null);
                      setUserMenuOpen(false);
                    }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3 px-3"
                  >
                    <Settings size={16} />
                    <span className="text-sm">Profile Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                      setUserMenuOpen(false);
                    }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3 px-3"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <div className="h-px bg-line my-1"></div>

                  <button
                    onClick={() => {
                      handleLogout();
                      setUserMenuOpen(false);
                    }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-transparent border-0 text-ink text-left cursor-pointer transition-all duration-200 w-full hover:bg-ink-tint-3 px-3"
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
              <button onClick={() => { setAuthTab('login'); setView('auth'); }} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-transparent text-ink hover:bg-input hover:border-line-strong">Login</button>
              <button onClick={() => { setAuthTab('signup'); setView('auth'); }} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary hover:bg-primary-hover hover:border-primary-hover">Sign Up</button>
            </>
          )}
        </div>

      </div>

      {/* ── Mobile menu drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-1999 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 h-screen w-[85vw] max-w-85 bg-app z-2000 flex flex-col overflow-hidden shadow-2xl lg:hidden"
            >
              {/* Header */}
              <div className="h-16 px-6 flex justify-between items-center border-b border-line shrink-0">
                <button
                  onClick={() => { setView(user ? 'dashboard' : 'landing'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 no-underline text-ink text-xl font-bold tracking-[-0.03em] bg-transparent border-0 cursor-pointer p-0 leading-none"
                >
                  <span>Lumio</span>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center bg-transparent border-0 text-ink cursor-pointer p-2 rounded-md transition-colors duration-150 hover:bg-input"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex flex-col flex-1 overflow-y-auto">
                {isPwaInstallable && (
                  <div className="px-4 py-3 border-b border-line shrink-0">
                    <button
                      onClick={() => { onPwaInstall(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-[0.9rem] font-bold text-primary bg-primary/10 hover:bg-primary/15 transition-all duration-150 cursor-pointer"
                    >
                      <Sparkles size={16} className="animate-pulse text-primary" />
                      <span>Install Mobile App</span>
                    </button>
                  </div>
                )}
                {user ? (
                  <>
                    {/* ACCOUNT section */}
                    <div className="px-6 pt-5 pb-4 border-b border-line">
                      <span className="text-[0.7rem] text-ink-muted font-semibold uppercase tracking-wider block mb-1">Account</span>
                      <span className="text-[0.9rem] text-ink font-semibold block overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</span>
                    </div>

                    {/* Nav items */}
                    <nav className="flex flex-col px-3 py-3 gap-0.5">
                      {([
                        { tab: 'overview' as const, icon: <Layers size={18} />, label: 'Overview Panels' },
                        { tab: 'modules'  as const, icon: <FileText size={18} />, label: 'My Study Modules' },
                        { tab: 'history'  as const, icon: <History size={18} />, label: 'Quiz History' },
                        { tab: 'notes'    as const, icon: <Notebook size={18} />, label: 'My Notes' },
                        { tab: 'groups'   as const, icon: <Users size={18} />, label: 'Collaborative Circles' },
                        { tab: 'tools'    as const, icon: <Sparkles size={18} />, label: 'Study Tools' },
                        { tab: 'calendar' as const, icon: <Calendar size={18} />, label: 'Exam Calendar' },
                      ]).map(item => {
                        const isActive = view === 'dashboard' && dashboardTab === item.tab;
                        return (
                          <button
                            key={item.tab}
                            onClick={() => { setView('dashboard'); setDashboardTab(item.tab); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border-0 cursor-pointer text-left text-[0.95rem] font-medium transition-all duration-150 border-l-2 ${
                              isActive
                                ? 'text-primary bg-primary/8 border-l-primary'
                                : 'text-ink-muted hover:text-ink hover:bg-glass border-l-transparent'
                            }`}
                          >
                            <span className={isActive ? 'text-primary' : 'text-ink-muted'}>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </nav>

                    {/* Settings pinned at bottom */}
                    <div className="mt-auto px-3 pb-3 border-t border-line pt-3">
                      <button
                        onClick={() => { setView('dashboard'); setDashboardTab('settings'); setActiveQuizModule(null); setSelectedGroupId(null); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border-0 cursor-pointer text-left text-[0.95rem] font-medium transition-all duration-150 border-l-2 ${
                          view === 'dashboard' && dashboardTab === 'settings'
                            ? 'text-primary bg-primary/8 border-l-primary'
                            : 'text-ink-muted hover:text-ink hover:bg-glass border-l-transparent'
                        }`}
                      >
                        <Settings size={18} className={view === 'dashboard' && dashboardTab === 'settings' ? 'text-primary' : 'text-ink-muted'} />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => { toggleTheme(); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border-0 cursor-pointer text-left text-[0.95rem] font-medium text-ink-muted hover:text-ink hover:bg-glass transition-all duration-150"
                      >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                      </button>
                      <button
                        onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-md border border-line text-sm font-medium text-ink cursor-pointer bg-transparent hover:bg-input transition-all duration-150"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ul className="list-none flex flex-col py-4 px-8">
                      <li>
                        <button onClick={() => { setView('landing'); setActiveQuizModule(null); setMobileMenuOpen(false); }} className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'landing' ? 'text-primary' : ''}`}>
                          <span>Home</span><ChevronRight size={16} style={{ opacity: 0.7 }} />
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setView('how-it-works'); setActiveQuizModule(null); setMobileMenuOpen(false); }} className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'how-it-works' ? 'text-primary' : ''}`}>
                          <span>How it Works</span><ChevronRight size={16} style={{ opacity: 0.7 }} />
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setView('tools'); setActiveQuizModule(null); setMobileMenuOpen(false); }} className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'tools' ? 'text-primary' : ''}`}>
                          <span>Study Tools</span><ChevronRight size={16} style={{ opacity: 0.7 }} />
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setView('docs'); setActiveQuizModule(null); setMobileMenuOpen(false); }} className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'docs' ? 'text-primary' : ''}`}>
                          <span>Docs</span><ChevronRight size={16} style={{ opacity: 0.7 }} />
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setView('pricing'); setMobileMenuOpen(false); }} className={`w-full text-left bg-transparent border-0 py-5 px-2 text-[1.15rem] font-semibold text-ink cursor-pointer border-b border-line rounded-none flex justify-between items-center transition-colors duration-150 hover:text-primary ${view === 'pricing' ? 'text-primary' : ''}`}>
                          <span>Pricing</span><ChevronRight size={16} style={{ opacity: 0.7 }} />
                        </button>
                      </li>
                    </ul>

                    <div className="mt-auto p-6 border-t border-line flex flex-col gap-3">
                      <button onClick={() => { toggleTheme(); }} className="bg-transparent border-0 text-ink-muted cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-150 hover:text-ink hover:bg-input w-full">
                        {theme === 'dark' ? <><Sun size={18} /><span>Light Mode</span></> : <><Moon size={18} /><span>Dark Mode</span></>}
                      </button>
                      <button onClick={() => { setAuthTab('signup'); setView('auth'); setMobileMenuOpen(false); }} className="inline-flex items-center gap-2 text-sm px-4 py-3.5 rounded-md font-bold transition-all duration-150 border border-transparent cursor-pointer bg-primary text-ink-on-primary hover:bg-primary-hover w-full justify-center">Sign Up</button>
                      <button onClick={() => { setAuthTab('login'); setView('auth'); setMobileMenuOpen(false); }} className="inline-flex items-center gap-2 text-sm px-4 py-3.5 rounded-md font-medium transition-all duration-150 border border-line cursor-pointer bg-transparent text-ink hover:bg-input hover:border-line-strong w-full justify-center">Login</button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
