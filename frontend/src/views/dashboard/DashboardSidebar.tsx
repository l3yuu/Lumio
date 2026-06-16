import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, FileText, Users, Sparkles, Calendar, Settings, Shield, ChevronDown, HelpCircle, Timer, History, Notebook } from 'lucide-react';
import type { User, Module, DashboardTab } from '../../types';

interface DashboardSidebarProps {
  isCollapsed: boolean;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  setActiveQuizModule: (mod: Module | null) => void;
  user: User;
  completeQuest: (actionType: 'view_settings') => void;
  invitationCount: number;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isCollapsed,
  dashboardTab,
  setDashboardTab,
  selectedGroupId,
  setSelectedGroupId,
  setActiveQuizModule,
  user,
  completeQuest,
  invitationCount,
}) => {
  const isAdminMode = user.role === 'superadmin' && dashboardTab.startsWith('admin');
  const [toolsExpanded, setToolsExpanded] = useState(false);

  const DollarIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
  const GroupListIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

  const toolsSubItems: { tab: DashboardTab; icon: React.ReactNode; label: string }[] = [
    { tab: 'tool-flashcards', icon: <Sparkles size={16} />, label: 'Flashcards' },
    { tab: 'tool-essay', icon: <HelpCircle size={16} />, label: 'Essay Grader' },
    { tab: 'tool-condenser', icon: <Layers size={16} />, label: 'Condenser' },
    { tab: 'tool-pomodoro', icon: <Timer size={16} />, label: 'Focus Timer' },
  ];

  const isToolsActive = dashboardTab === 'tools' || dashboardTab.startsWith('tool-');

  const items: { tab: DashboardTab; icon: React.ReactNode; label: string; matches: (tab: DashboardTab, gid: number | null) => boolean; badge: number }[] = isAdminMode ? [
    { tab: 'admin-overview', icon: <Layers size={18} />, label: 'Overview Panels', matches: (tab) => tab === 'admin-overview', badge: 0 },
    { tab: 'admin-users', icon: <Users size={18} />, label: 'User Management', matches: (tab) => tab === 'admin-users', badge: 0 },
    { tab: 'admin-sales', icon: DollarIcon, label: 'Sales & Revenue', matches: (tab) => tab === 'admin-sales', badge: 0 },
    { tab: 'admin-modules', icon: <FileText size={18} />, label: 'Modules Created', matches: (tab) => tab === 'admin-modules', badge: 0 },
    { tab: 'admin-exams', icon: <Calendar size={18} />, label: 'Exams Scheduled', matches: (tab) => tab === 'admin-exams', badge: 0 },
    { tab: 'admin-groups', icon: GroupListIcon, label: 'Groups Created', matches: (tab) => tab === 'admin-groups', badge: 0 },
  ] : [
    { tab: 'overview', icon: <Layers size={18} />, label: 'Overview Panels', matches: (tab, gid) => tab === 'overview' && gid === null, badge: 0 },
    { tab: 'modules', icon: <FileText size={18} />, label: 'My Study Modules', matches: (tab, gid) => tab === 'modules' && gid === null, badge: 0 },
    { tab: 'history', icon: <History size={18} />, label: 'Quiz History', matches: (tab, gid) => tab === 'history' && gid === null, badge: 0 },
    { tab: 'notes', icon: <Notebook size={18} />, label: 'My Notes', matches: (tab, gid) => tab === 'notes' && gid === null, badge: 0 },
    { tab: 'groups', icon: <Users size={18} />, label: 'Collaborative Circles', matches: (tab, gid) => tab === 'groups' || gid !== null, badge: invitationCount },
    { tab: 'calendar', icon: <Calendar size={18} />, label: 'Exam Calendar', matches: (tab, gid) => tab === 'calendar' && gid === null, badge: 0 },
  ];

  const btnClass = (isActive: boolean) =>
    `group flex items-center gap-3 border-0 bg-transparent text-left cursor-pointer transition-all duration-150 rounded-lg no-underline font-medium text-[0.875rem] max-md:w-auto max-md:whitespace-nowrap max-md:py-2.5 max-md:px-4 max-md:shrink-0 max-md:justify-center max-md:text-[0.85rem]
      ${isCollapsed
        ? 'md:w-12 md:h-12 md:p-0 md:justify-center md:gap-0'
        : `w-full py-2.5 px-3 ${
            isActive
              ? 'text-primary bg-primary-soft border-l-2 border-primary pl-[10px]'
              : 'text-ink-muted hover:text-ink hover:bg-glass-strong border-l-2 border-transparent pl-[10px]'
          }`
      }`;

  const iconClass = (isActive: boolean) =>
    `relative flex items-center justify-center transition-all duration-150 shrink-0 [&_svg]:shrink-0
      ${isCollapsed
        ? `w-10 h-10 rounded-xl ${isActive ? 'bg-primary-soft text-primary shadow-glow-primary-soft' : 'text-ink-muted group-hover:bg-glass-strong group-hover:text-ink'}`
        : `${isActive ? 'text-primary' : 'text-ink-muted group-hover:text-ink'}`
      }`;

  const labelClass = () =>
    `transition-all duration-200 max-w-37.5 opacity-100 whitespace-nowrap inline-block overflow-hidden text-ellipsis ${isCollapsed ? 'md:max-w-0 md:opacity-0' : ''}`;

  return (
    <motion.aside
      layout
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className={`flex md:flex-col max-md:flex-row md:gap-0.5 max-md:gap-2 h-full w-full max-md:h-auto bg-card max-md:bg-app border-line md:border-r max-md:border-r-0 md:border-b-0 max-md:border-b md:pt-5 md:pb-6 max-md:py-3 md:px-2.5 max-md:px-4 overflow-hidden md:box-border max-md:overflow-x-auto scrollbar-none ${isCollapsed ? 'md:py-6 md:items-center md:gap-2' : ''}`}
    >
      <div className={`px-2 pt-1 pb-4 mb-4 border-b border-line overflow-hidden transition-all duration-300 max-md:hidden ${isCollapsed ? 'md:max-h-0 md:mb-0 md:p-0 md:opacity-0 md:border-b-0 md:h-0' : 'max-h-20 opacity-100'}`}>
        <span className="text-[0.7rem] text-ink-muted font-semibold uppercase tracking-wider block mb-1">Account</span>
        <span className="text-[0.85rem] text-ink font-medium block overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</span>
      </div>

      {items.map(item => (
        <button
          key={item.tab}
          className={btnClass(item.matches(dashboardTab, selectedGroupId))}
          onClick={() => { setDashboardTab(item.tab); setActiveQuizModule(null); setSelectedGroupId(null); }}
          title={isCollapsed ? item.label : undefined}
        >
          <div className={iconClass(item.matches(dashboardTab, selectedGroupId))}>
            {item.icon}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[0.6rem] font-bold flex items-center justify-center leading-none">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </div>
          <span className={labelClass()}>{item.label}</span>
        </button>
      ))}

      {!isAdminMode && (
        <>
          <button
            className={btnClass(isToolsActive)}
            onClick={() => {
              if (isCollapsed) {
                setDashboardTab('tool-flashcards');
                setActiveQuizModule(null);
                setSelectedGroupId(null);
              } else {
                setToolsExpanded(!toolsExpanded);
              }
            }}
            title={isCollapsed ? 'Study Tools' : undefined}
          >
            <div className={iconClass(isToolsActive)}>
              <Sparkles size={18} />
            </div>
            <span className={labelClass()}>Study Tools</span>
            {!isCollapsed && (
              <ChevronDown
                size={14}
                className={`ml-auto text-ink-muted transition-transform duration-200 ${toolsExpanded ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          <AnimatePresence>
            {toolsExpanded && !isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {toolsSubItems.map(subItem => (
                  <button
                    key={subItem.tab}
                    className={`group flex items-center gap-3 border-0 bg-transparent text-left cursor-pointer transition-all duration-150 rounded-lg no-underline font-medium text-[0.8rem] w-full py-2 pl-[38px] pr-3 ${
                      dashboardTab === subItem.tab
                        ? 'text-primary bg-primary-soft'
                        : 'text-ink-muted hover:text-ink hover:bg-glass-strong'
                    }`}
                    onClick={() => {
                      setDashboardTab(subItem.tab);
                      setActiveQuizModule(null);
                      setSelectedGroupId(null);
                    }}
                  >
                    <div className={`flex items-center justify-center transition-all duration-150 shrink-0 ${
                      dashboardTab === subItem.tab ? 'text-primary' : 'text-ink-muted group-hover:text-ink'
                    }`}>
                      {subItem.icon}
                    </div>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{subItem.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {user.role === 'superadmin' && (
        <button
          className={`${btnClass(false)} mt-auto max-md:mt-0 mb-2 border border-primary/20 hover:border-primary bg-primary-soft/30 hover:bg-primary-soft text-primary`}
          onClick={() => {
            if (isAdminMode) {
              setDashboardTab('overview');
            } else {
              setDashboardTab('admin-overview');
            }
            setActiveQuizModule(null);
            setSelectedGroupId(null);
          }}
          title={isCollapsed ? (isAdminMode ? 'Switch to Student View' : 'Switch to Admin View') : undefined}
        >
          <div className={iconClass(false)}>
            {isAdminMode ? <Sparkles size={18} className="text-primary animate-pulse" /> : <Shield size={18} className="text-primary" />}
          </div>
          <span className={labelClass()}>
            {isAdminMode ? 'Student View' : 'Admin Portal'}
          </span>
        </button>
      )}

      <button
        className={`${btnClass(dashboardTab === 'settings' && selectedGroupId === null)} ${user.role === 'superadmin' ? '' : 'mt-auto max-md:mt-0'}`}
        onClick={() => { setDashboardTab('settings'); setActiveQuizModule(null); setSelectedGroupId(null); completeQuest('view_settings'); }}
        title={isCollapsed ? 'Settings' : undefined}
      >
        <div className={iconClass(dashboardTab === 'settings' && selectedGroupId === null)}>
          <Settings size={18} />
        </div>
        <span className={labelClass()}>Settings</span>
      </button>
    </motion.aside>
  );
};
