import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, BookOpen, Calendar, Users, Award, TrendingUp, HelpCircle, ArrowUpDown } from 'lucide-react';
import type { QuizAttempt } from '../../types';

interface HistoryPanelProps {
  attempts: QuizAttempt[];
}

type FilterType = 'all' | 'study_module' | 'exam' | 'group_quiz';
type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ attempts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortOrder>('newest');

  // Stats calculation
  const stats = useMemo(() => {
    if (attempts.length === 0) {
      return { total: 0, average: 0, highest: 0, exams: 0, quizzes: 0 };
    }
    const total = attempts.length;
    const sum = attempts.reduce((acc, curr) => acc + curr.percentage, 0);
    const average = Math.round(sum / total);
    const highest = Math.max(...attempts.map(a => a.percentage));
    const exams = attempts.filter(a => a.attemptType === 'exam').length;
    const quizzes = attempts.filter(a => a.attemptType !== 'exam').length;

    return { total, average, highest, exams, quizzes };
  }, [attempts]);

  // Filter and sort attempts
  const filteredAndSortedAttempts = useMemo(() => {
    let result = [...attempts];

    // Filter by type
    if (activeFilter !== 'all') {
      result = result.filter(a => a.attemptType === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.id - a.id; // DB order (id desc is newest)
      }
      if (sortBy === 'oldest') {
        return a.id - b.id;
      }
      if (sortBy === 'highest') {
        return b.percentage - a.percentage;
      }
      if (sortBy === 'lowest') {
        return a.percentage - b.percentage;
      }
      return 0;
    });

    return result;
  }, [attempts, activeFilter, searchQuery, sortBy]);

  const getAttemptIcon = (type: QuizAttempt['attemptType']) => {
    switch (type) {
      case 'study_module':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-sm shrink-0">
            <BookOpen size={18} />
          </div>
        );
      case 'exam':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-sm shrink-0">
            <Calendar size={18} />
          </div>
        );
      case 'group_quiz':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-sm shrink-0">
            <Users size={18} />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center border border-zinc-500/20 shadow-sm shrink-0">
            <HelpCircle size={18} />
          </div>
        );
    }
  };

  const getAttemptTypeLabel = (type: QuizAttempt['attemptType']) => {
    switch (type) {
      case 'study_module':
        return <span className="text-[0.7rem] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none shrink-0">Study Quiz</span>;
      case 'exam':
        return <span className="text-[0.7rem] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none shrink-0">Exam</span>;
      case 'group_quiz':
        return <span className="text-[0.7rem] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none shrink-0">Group Quiz</span>;
      default:
        return <span className="text-[0.7rem] font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none shrink-0">Quiz</span>;
    }
  };

  const getScoreColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    if (percentage >= 50) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
    return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <History className="text-primary animate-pulse" size={24} />
            Quiz & Exam History
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Track and review your scores, attempts, and overall progress in one place.
          </p>
        </div>
      </div>

      {/* Stats Dashboard Grid */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shadow-inner">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="text-[0.65rem] font-bold text-ink-muted uppercase tracking-wider">Total Attempts</div>
              <div className="text-xl font-bold text-ink mt-0.5">{stats.total}</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-card border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
              <Award size={20} />
            </div>
            <div>
              <div className="text-[0.65rem] font-bold text-ink-muted uppercase tracking-wider">Average Score</div>
              <div className="text-xl font-bold text-ink mt-0.5">{stats.average}%</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-[0.65rem] font-bold text-ink-muted uppercase tracking-wider">Highest Score</div>
              <div className="text-xl font-bold text-ink mt-0.5">{stats.highest}%</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-card border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
              <Users size={20} />
            </div>
            <div>
              <div className="text-[0.65rem] font-bold text-ink-muted uppercase tracking-wider">Quizzes / Exams</div>
              <div className="text-xl font-bold text-ink mt-0.5">{stats.quizzes} / {stats.exams}</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="bg-card border border-line rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-line hover:border-line-strong focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-10 text-sm text-ink placeholder-ink-muted transition-all outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort selection */}
          <div className="relative flex items-center bg-input border border-line rounded-xl px-3 py-2 text-sm text-ink-muted hover:border-line-strong select-none">
            <ArrowUpDown size={14} className="mr-2 text-ink-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOrder)}
              className="bg-transparent border-0 text-ink text-xs font-semibold outline-none cursor-pointer pr-1"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Segmented Control / Type filter pills */}
      {attempts.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {([
            { id: 'all' as const, label: 'All History' },
            { id: 'study_module' as const, label: 'Study Quizzes' },
            { id: 'exam' as const, label: 'Exams Logged' },
            { id: 'group_quiz' as const, label: 'Circle Quizzes' },
          ]).map(filterTab => {
            const isActive = activeFilter === filterTab.id;
            return (
              <button
                key={filterTab.id}
                onClick={() => setActiveFilter(filterTab.id)}
                className={`text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer whitespace-nowrap transition-all duration-150 select-none ${
                  isActive
                    ? 'bg-primary text-ink-on-primary shadow-sm shadow-primary/20'
                    : 'bg-card text-ink-muted border border-line hover:bg-glass hover:text-ink'
                }`}
              >
                {filterTab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Attempts List Container */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedAttempts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-card border border-line rounded-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-glass-strong text-ink-muted/30 flex items-center justify-center mb-4 border border-line animate-pulse">
                <History size={32} />
              </div>
              <h3 className="text-lg font-bold text-ink">No history entries found</h3>
              <p className="text-sm text-ink-muted max-w-sm mt-1 px-4">
                {attempts.length === 0 
                  ? "You haven't completed any quizzes or exam countdowns yet. Your completed tests will log automatically."
                  : "Try checking your spelling or selecting another filter tab to view other history items."}
              </p>
            </motion.div>
          ) : (
            filteredAndSortedAttempts.map((attempt) => (
              <motion.div
                key={attempt.id}
                layoutId={`attempt-${attempt.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="flex items-center gap-4 bg-card border border-line hover:border-line-strong hover:bg-glass/30 rounded-2xl p-4 transition-all duration-200 group relative overflow-hidden"
              >
                {/* Visual side accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity ${
                  attempt.percentage >= 80 ? 'bg-emerald-500' : attempt.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`} />

                {/* Left side: Icon */}
                {getAttemptIcon(attempt.attemptType)}

                {/* Middle section: Name and Date */}
                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-semibold text-ink group-hover:text-primary transition-colors truncate">
                      {attempt.title}
                    </h4>
                    <span className="text-[0.7rem] text-ink-muted mt-1 block">
                      {attempt.date}
                    </span>
                  </div>

                  {/* Badges/Category */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                    {getAttemptTypeLabel(attempt.attemptType)}
                  </div>
                </div>

                {/* Right section: Score & Progress bar */}
                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                  <div className="flex items-baseline gap-1 select-none">
                    <span className={`text-base font-extrabold ${getScoreColorClass(attempt.percentage)}`}>
                      {attempt.score}
                    </span>
                    {attempt.score.includes('/') && (
                      <span className="text-[0.7rem] text-ink-muted">correct</span>
                    )}
                  </div>

                  {/* Miniature progress bar */}
                  <div className="w-20 md:w-28 h-1.5 bg-glass-strong border border-line rounded-full overflow-hidden shrink-0">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(attempt.percentage)}`}
                      style={{ width: `${attempt.percentage}%` }}
                    />
                  </div>
                  <span className="text-[0.65rem] text-ink-muted font-bold tracking-tight">
                    {attempt.percentage}% Score
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
