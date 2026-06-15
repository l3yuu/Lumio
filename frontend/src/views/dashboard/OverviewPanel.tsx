import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Calendar, Award, Zap, Target, Trophy, Users, Flame, Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { User, StudyQuest, ExamDeadline, DashboardTab } from '../../types';
import { getCompanionMessage, type CompanionMood, type RecentExamFinish } from '../../utils/companionMessage';

const asStudyHours = (value: number | string | undefined, fallback: number) =>
  typeof value === 'number' ? value : fallback;



interface OverviewPanelProps {
  user: User;
  level: number;
  xp: number;
  groupsCount: number;
  quests: StudyQuest[];
  exams: ExamDeadline[];
  quizHistory: number[];
  insightsTab: 'performance' | 'time';
  isAddingExam: boolean;
  newExamTitle: string;
  newExamSubject: string;
  newExamDate: string;
  newExamPriority: 'high' | 'medium' | 'low';
  spacedRepetitionList: { id: number; name: string; subject: string; dueIn: string; progress: number }[];
  heatmapData: { label: string; hours: number; level: number }[];
  subjects: string[];
  pathData: { linePath: string; areaPath: string; points: { x: number; y: number }[] } | null;
  setInsightsTab: (tab: 'performance' | 'time') => void;
  setIsAddingExam: (v: boolean) => void;
  setNewExamTitle: (v: string) => void;
  setNewExamSubject: (v: string) => void;
  setNewExamDate: (v: string) => void;
  setNewExamPriority: (v: 'high' | 'medium' | 'low') => void;
  setDashboardTab: (tab: DashboardTab) => void;
  setSelectedSubject: (v: string) => void;
  handleAddExam: (e: React.FormEvent) => void;
  handleDeleteExam: (id: number) => void;
  handleCompleteExam: (id: number, score?: string) => void;
  getActivityColor: (level: number) => string;
  handleStreakCheckIn: () => void;
  recentExamFinish?: RecentExamFinish | null;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({
  user, level, xp, groupsCount, quests, exams, quizHistory, insightsTab,
  isAddingExam, newExamTitle, newExamSubject, newExamDate, newExamPriority,
  spacedRepetitionList, heatmapData, subjects, pathData,
  setInsightsTab, setIsAddingExam, setNewExamTitle, setNewExamSubject, setNewExamDate,
  setNewExamPriority, setDashboardTab, setSelectedSubject,
  handleAddExam, handleDeleteExam, handleCompleteExam, getActivityColor,
  handleStreakCheckIn, recentExamFinish,
}) => {
  const [isCheckInOpen, setIsCheckInOpen] = React.useState(false);
  const [finishingExamId, setFinishingExamId] = React.useState<number | null>(null);
  const [finishScore, setFinishScore] = React.useState('');

  const cancelFinishing = () => {
    setFinishingExamId(null);
    setFinishScore('');
  };

  const submitFinish = (examId: number) => {
    if (!finishScore.trim()) return;
    handleCompleteExam(examId, finishScore);
    cancelFinishing();
  };

  const companion = React.useMemo(
    () => getCompanionMessage({
      user,
      exams,
      quests,
      quizHistory,
      heatmapData,
      spacedRepetitionList,
      recentExamFinish,
    }),
    [user, exams, quests, quizHistory, heatmapData, spacedRepetitionList, recentExamFinish],
  );

  const companionStyles: Record<CompanionMood, { banner: string; icon: string }> = {
    urgent: {
      banner: 'bg-[linear-gradient(135deg,rgba(245,158,11,0.1)_0%,rgba(62,207,142,0.05)_100%)] border-warning/30',
      icon: 'bg-warning-soft text-warning',
    },
    celebrate: {
      banner: 'bg-[linear-gradient(135deg,rgba(62,207,142,0.12)_0%,rgba(6,182,212,0.06)_100%)] border-primary/35',
      icon: 'bg-primary-soft text-primary',
    },
    motivate: {
      banner: 'bg-[linear-gradient(135deg,rgba(6,182,212,0.08)_0%,rgba(62,207,142,0.06)_100%)] border-accent-cyan/25',
      icon: 'bg-cyan-soft-2 text-accent-cyan',
    },
    warm: {
      banner: 'bg-[linear-gradient(135deg,rgba(62,207,142,0.06)_0%,rgba(6,182,212,0.04)_100%)] border-line',
      icon: 'bg-primary-soft text-primary',
    },
    neutral: {
      banner: 'bg-[linear-gradient(135deg,rgba(62,207,142,0.06)_0%,rgba(6,182,212,0.04)_100%)] border-line',
      icon: 'bg-glass text-ink-muted',
    },
  };

  const style = companionStyles[companion.mood];

  return (
    <>
      <motion.div
        key={companion.message}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`border rounded-xl px-4 py-4 sm:px-7 sm:py-6 mb-2 ${style.banner}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 mt-0.5 ${style.icon}`}>
            <Sparkles size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-[1.75rem] font-bold mb-1.5 leading-tight">
              {companion.greeting}, {user.name}!
            </h2>
            <p className="text-ink-muted text-xs sm:text-[0.9rem] leading-relaxed m-0">
              {companion.message}
            </p>
            {companion.actionLabel && companion.actionTab && (
              <button
                type="button"
                onClick={() => setDashboardTab(companion.actionTab!)}
                className="mt-3 text-[0.8rem] font-semibold text-primary bg-primary-tint-5 border border-primary/20 rounded-md px-3 py-1.5 hover:bg-primary-soft transition-colors cursor-pointer"
              >
                {companion.actionLabel}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-[1.2fr_1fr] gap-6 mb-0 max-md:grid-cols-1 min-w-0">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div 
              onClick={() => setIsCheckInOpen(true)}
              className="bg-card border border-line rounded-xl flex flex-col gap-1 p-3 sm:p-4 cursor-pointer hover:scale-[1.02] hover:border-primary transition-all duration-200 select-none"
              title="Click to claim your daily check-in"
            >
              <div className="bg-primary-soft text-primary p-1.5 sm:p-2 rounded-lg w-fit mb-0.5 sm:mb-1"><Flame size={14} className="sm:w-4 sm:h-4" /></div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight">{user.streak !== undefined ? user.streak : 5}</div>
              <div className="text-[0.6rem] sm:text-[0.7rem] text-ink-muted font-medium uppercase tracking-wider truncate"><span className="hidden sm:inline">Day </span>Streak</div>
            </div>
            <div 
              onClick={() => setDashboardTab('groups')}
              className="bg-card border border-line rounded-xl flex flex-col gap-1 p-3 sm:p-4 cursor-pointer hover:scale-[1.02] hover:border-primary transition-all duration-200 select-none"
              title="Click to view Collaborative Circles"
            >
              <div className="bg-cyan-soft-2 text-accent-cyan p-1.5 sm:p-2 rounded-lg w-fit mb-0.5 sm:mb-1"><Users size={14} className="sm:w-4 sm:h-4" /></div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight">{groupsCount}</div>
              <div className="text-[0.6rem] sm:text-[0.7rem] text-ink-muted font-medium uppercase tracking-wider truncate">Circles</div>
            </div>
            <div 
              onClick={() => setDashboardTab('modules')}
              className="bg-card border border-line rounded-xl flex flex-col gap-1 p-3 sm:p-4 cursor-pointer hover:scale-[1.02] hover:border-primary transition-all duration-200 select-none"
              title="Click to view My Study Modules"
            >
              <div className="bg-success/10 text-primary p-1.5 sm:p-2 rounded-lg w-fit mb-0.5 sm:mb-1"><Trophy size={14} className="sm:w-4 sm:h-4" /></div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight">{user.quizzesCount !== undefined ? user.quizzesCount : 12}</div>
              <div className="text-[0.6rem] sm:text-[0.7rem] text-ink-muted font-medium uppercase tracking-wider truncate">Quizzes</div>
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="text-[0.95rem] font-semibold mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Activity Intensity
            </h3>
            <p className="text-[0.75rem] text-ink-muted mb-4">Study hours over the last two weeks.</p>
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1.5 flex-nowrap scrollbar-thin">
              {heatmapData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1 min-w-10 shrink-0">
                  <div 
                    style={{ width: '100%', height: '36px', borderRadius: '6px', background: getActivityColor(data.level), border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: data.level > 2 ? '#121212' : 'var(--text-primary)', fontWeight: 'bold' }} 
                    title={`${data.hours} study hours on ${data.label}.`}
                  >
                    {data.hours > 0 && `${data.hours}h`}
                  </div>
                  <span className="text-[0.7rem] text-ink-muted mt-1">{data.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[0.95rem] font-semibold flex items-center gap-2 m-0">
                <Calendar size={16} className="text-primary" /> Exam Countdowns
              </h3>
              <button onClick={() => setIsAddingExam(!isAddingExam)} className="btn btn-outline px-2 py-1 text-[0.75rem] h-7 flex items-center gap-0.5">
                <Plus size={12} /> Add Exam
              </button>
            </div>

            <AnimatePresence>
              {isAddingExam && (
                <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleAddExam} className="bg-app border border-line rounded-lg p-4 mb-5 flex flex-col gap-3 overflow-hidden">
                  <div className="text-[0.9rem] font-bold border-b border-line pb-1">Add New Exam Countdown</div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Name</label>
                      <input type="text" placeholder="e.g. Biology Final" className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} required />
                    </div>
                    <div className="w-full sm:w-30 shrink-0">
                      <label className="text-[0.75rem] font-semibold text-ink mb-1">Subject Folder</label>
                      <select className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8" value={newExamSubject} onChange={(e) => setNewExamSubject(e.target.value)}>
                        {subjects.map(subj => (<option key={subj} value={subj === 'All' ? 'General' : subj}>{subj === 'All' ? 'General' : subj}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Date</label>
                      <input type="date" className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8" value={newExamDate} onChange={(e) => setNewExamDate(e.target.value)} required />
                    </div>
                    <div className="flex-1">
                      <label className="text-[0.75rem] font-semibold text-ink mb-1">Priority</label>
                      <select className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8" value={newExamPriority} onChange={(e) => setNewExamPriority(e.target.value as 'high' | 'medium' | 'low')}>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-1">
                    <button type="button" className="btn btn-outline px-3 py-1 text-[0.75rem] h-7" onClick={() => setIsAddingExam(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary px-3 py-1 text-[0.75rem] h-7">Save</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-5 relative pl-2">
              {exams.length > 0 && <div className="absolute left-2.75 top-2 bottom-2 w-0.5 bg-line z-1"></div>}
              {exams.length === 0 ? (
                <div className="text-center p-4 text-ink-muted text-[0.85rem]">No upcoming exams. Click "Add Exam" to schedule one!</div>
              ) : (
                exams.map((exam) => (
                  <div className="flex items-start gap-2.5 sm:gap-4 relative z-2" key={exam.id}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-line border-[3px] border-card mt-3 shrink-0 z-3 transition-all duration-200 ${exam.priority === 'high' ? 'bg-danger' : exam.priority === 'medium' ? 'bg-warning' : 'bg-accent-cyan'}`}></div>
                    <div className="flex items-center justify-between gap-3 bg-app border border-line rounded-lg p-3 px-3 sm:px-4 transition-all duration-200 hover:translate-x-1 hover:border-primary grow min-w-0">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[0.88rem] font-bold text-ink truncate" title={exam.title}>{exam.title}</span>
                        <div className="text-[0.72rem] text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>{exam.date}</span>
                          <span className="opacity-50">•</span>
                          <span onClick={() => { setDashboardTab('modules'); setSelectedSubject(exam.subject === 'General' ? 'All' : exam.subject); }} className="timeline-subject-tag text-primary font-semibold cursor-pointer inline-flex items-center gap-0.5 p-0.5 px-1.5 rounded bg-primary-tint-5 transition-all duration-200 hover:bg-primary-soft-2 hover:text-primary-hover" title={`Click to review ${exam.subject} modules`}>
                            {exam.subject}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {finishingExamId !== exam.id && (
                          <span className={`text-[0.7rem] font-bold rounded px-2 py-0.5 whitespace-nowrap ${exam.priority === 'high' ? 'bg-danger-soft text-danger border border-danger-line' : exam.priority === 'medium' ? 'bg-warning-soft text-warning border border-warning-line' : 'bg-cyan-soft-2 text-accent-cyan border border-cyan-line'}`}>
                            {exam.daysRemaining === 0 ? 'Today!' : `${exam.daysRemaining}d left`}
                          </span>
                        )}
                        {finishingExamId !== exam.id && (
                          <button onClick={() => { setFinishingExamId(exam.id); setFinishScore(''); }} className="bg-transparent border-0 text-ink-muted cursor-pointer p-0.5 flex items-center opacity-60 hover:opacity-100 transition-opacity duration-200" title="Mark as finished" type="button">
                            <CheckCircle2 size={14} className="text-primary" />
                          </button>
                        )}
                        {finishingExamId !== exam.id && (
                          <button onClick={() => handleDeleteExam(exam.id)} className="bg-transparent border-0 text-ink-muted cursor-pointer p-0.5 flex items-center opacity-60 hover:opacity-100 transition-opacity duration-200" title="Delete countdown" type="button">
                            <Trash2 size={14} className="text-danger" />
                          </button>
                        )}
                      </div>
                    </div>
                    {finishingExamId === exam.id && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 pl-7">
                        <input
                          type="text"
                          placeholder="Your score (e.g. 85%)"
                          value={finishScore}
                          onChange={(e) => setFinishScore(e.target.value)}
                          className="flex-1 min-w-[120px] bg-input border border-line rounded-md text-ink text-sm px-3 py-1.5 outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => submitFinish(exam.id)}
                          disabled={!finishScore.trim()}
                          className="btn btn-primary px-3 py-1 text-[0.75rem] disabled:opacity-50"
                        >
                          Finish
                        </button>
                        <button type="button" onClick={cancelFinishing} className="btn btn-outline px-3 py-1 text-[0.75rem]">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[0.95rem] font-semibold flex items-center gap-2 m-0">
                <Layers size={16} className="text-primary" /> Insights & Analytics
              </h3>
              <div className="flex bg-ink-tint-1 border border-line rounded-md p-0.5">
                <button className={`bg-transparent border-0 text-[0.7rem] font-semibold text-ink-muted py-1 px-2 rounded cursor-pointer transition-all duration-200 hover:text-ink ${insightsTab === 'performance' ? 'bg-glass-strong text-primary shadow-pop' : ''}`} onClick={() => setInsightsTab('performance')} type="button">Quiz Accuracy</button>
                <button className={`bg-transparent border-0 text-[0.7rem] font-semibold text-ink-muted py-1 px-2 rounded cursor-pointer transition-all duration-200 hover:text-ink ${insightsTab === 'time' ? 'bg-glass-strong text-primary shadow-pop' : ''}`} onClick={() => setInsightsTab('time')} type="button">Study Time</button>
              </div>
            </div>

            {insightsTab === 'performance' ? (
              <div>
                <p className="text-[0.8rem] text-ink-muted mb-4">Live quiz score percentages tracked over your active study sessions.</p>
                <div className="h-40 bg-[rgba(5,5,5,0.2)] border border-line rounded-lg p-4 pb-2 relative flex items-center justify-center">
                  <svg viewBox="0 0 400 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <line x1="35" y1="15" x2="380" y2="15" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="35" y1="75" x2="380" y2="75" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="35" y1="135" x2="380" y2="135" stroke="var(--border)" strokeWidth="1" />
                    <text x="25" y="19" fill="var(--text-secondary)" className="text-[9px] sm:text-[10px]" textAnchor="end">100%</text>
                    <text x="25" y="79" fill="var(--text-secondary)" className="text-[9px] sm:text-[10px]" textAnchor="end">50%</text>
                    <text x="25" y="139" fill="var(--text-secondary)" className="text-[9px] sm:text-[10px]" textAnchor="end">0%</text>
                    {quizHistory.length >= 2 && pathData ? (
                      <>
                        {pathData.areaPath && <path d={pathData.areaPath} fill="url(#chartGlow)" />}
                        {pathData.linePath && <path d={pathData.linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                        {pathData.points.map((p, i) => (
                          <g key={i} className="chart-point-group">
                            <line x1={p.x} y1="15" x2={p.x} y2="135" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" className="hover-guide" />
                            <circle cx={p.x} cy={p.y} r="6" fill="var(--primary)" opacity="0.3" className="chart-point-glow" />
                            <circle cx={p.x} cy={p.y} r="4" fill="#181818" stroke="var(--primary)" strokeWidth="2.5" />
                            <g className="chart-tooltip">
                              <rect x={p.x - 25} y={p.y - 28} width="50" height="20" rx="4" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />
                              <text x={p.x} y={p.y - 15} fill="var(--text-primary)" className="text-[9px] sm:text-[10px]" fontWeight="bold" textAnchor="middle">{quizHistory[i]}%</text>
                            </g>
                            <text x={p.x} y="152" fill="var(--text-secondary)" className="text-[8px] sm:text-[9px]" textAnchor="middle">Q{i + 1}</text>
                          </g>
                        ))}
                      </>
                    ) : (
                      <text x="200" y="80" fill="var(--text-secondary)" className="text-[10px] sm:text-xs" textAnchor="middle">Complete quizzes to generate performance graphs.</text>
                    )}
                  </svg>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[0.8rem] text-ink-muted mb-5">Breakdown of study hours spent per subject category.</p>
                <div className="flex flex-col gap-3.5">
                  {[
                    { subject: 'Biology', hours: asStudyHours(user.studyTime?.Biology, 14), color: 'linear-gradient(90deg, #3ECF8E, #30B378)' },
                    { subject: 'Economics', hours: asStudyHours(user.studyTime?.Economics, 9), color: 'linear-gradient(90deg, #f59e0b, #d97706)' },
                    { subject: 'Mathematics', hours: asStudyHours(user.studyTime?.Mathematics, 6), color: 'linear-gradient(90deg, #06b6d4, #0891b2)' },
                    { subject: 'General Study', hours: asStudyHours(user.studyTime?.['General Study'], 4), color: 'linear-gradient(90deg, #a855f7, #9333ea)' },
                  ].map((item, idx, arr) => {
                    const total = arr.reduce((sum, i) => sum + i.hours, 0);
                    const max = Math.max(...arr.map(i => i.hours));
                    return (
                      <div key={idx} className="flex flex-col">
                        <div className="flex justify-between text-[0.75rem] mb-1.5">
                          <span className="font-semibold text-ink">{item.subject}</span>
                          <span className="text-ink-muted text-[0.7rem]">{item.hours} hours ({total > 0 ? Math.round((item.hours / total) * 100) : 0}%)</span>
                        </div>
                        <div className="h-1.5 bg-ink-tint-1 rounded-sm overflow-hidden border border-ink-soft">
                          <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${max > 0 ? (item.hours / max) * 100 : 0}%`, background: item.color }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-line pt-5">
              <div className="text-[0.8rem] font-bold text-ink mb-3 flex items-center gap-1">
                <Target size={14} className="text-warning" /> Recommended Focus Areas
              </div>
              <div className="flex flex-col gap-3">
                {!user.focusAreas || user.focusAreas.length === 0 ? (
                  <div className="text-center p-4 text-ink-muted text-[0.8rem] bg-ink-soft rounded-lg border border-line">
                    No recommended focus areas yet. Complete quizzes to identify concepts that need review!
                  </div>
                ) : (
                  user.focusAreas.map((rec, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 px-3 bg-amber-bg border border-amber-border rounded-lg transition-all duration-200 hover:bg-amber-border hover:border-amber-border-strong hover:-translate-y-px">
                      <div className="grow min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[0.8rem] font-bold text-ink">{rec.concept}</span>
                          <span className="text-[0.65rem] font-semibold bg-warning-soft text-warning py-0.5 px-1.5 rounded border border-warning-line">{rec.score}% accuracy</span>
                        </div>
                        <p className="text-[0.75rem] text-ink-muted m-0 leading-relaxed">{rec.desc}</p>
                      </div>
                      <button onClick={() => { setDashboardTab('modules'); setSelectedSubject(rec.subject); }} className="btn btn-outline px-2 py-1 text-[0.7rem] h-6 shrink-0 self-end sm:self-center" type="button">Review</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          <div className="bg-card border border-line rounded-xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[0.95rem] font-semibold flex items-center gap-2 m-0">
                <Award size={16} className="text-primary" /> Daily Study Quests
              </h3>
              <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-primary bg-primary-soft py-1 px-2 rounded-full border border-primary-line">
                <Zap size={12} fill="var(--primary)" className="text-primary" /> Level {level}
              </span>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center text-[0.75rem] mb-2">
                <span className="text-ink-muted font-medium">Rank Progression</span>
                <span className="text-primary font-bold">{xp} / {level * 100} XP ({Math.round((xp / (level * 100)) * 100)}%)</span>
              </div>
              <div className="h-2 bg-ink-soft rounded overflow-hidden border border-line relative">
                <div className="h-full bg-[linear-gradient(90deg,var(--color-primary),#06b6d4)] rounded transition-all duration-400" style={{ width: `${Math.min(100, Math.round((xp / (level * 100)) * 100))}%` }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {quests.map((quest) => (
                <div key={quest.id} className={`flex items-center gap-3 py-2.5 px-3 bg-app border border-line rounded-lg transition-all duration-200 ${quest.completed ? 'opacity-65 bg-ink-soft' : ''}`}>
                  <div className="flex items-center justify-center shrink-0">
                    {quest.completed ? <CheckCircle2 size={16} className="text-primary animate-[pop-check_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]" /> : <Target size={16} className="text-ink-muted" />}
                  </div>
                  <div className="grow text-[0.8rem] text-ink font-medium leading-tight">
                    <span className={`transition-all duration-200 ${quest.completed ? 'line-through text-ink-muted' : ''}`}>{quest.text}</span>
                  </div>
                  <span className={`text-[0.7rem] font-bold bg-cyan-soft-2 text-accent-cyan py-0.5 px-2 rounded border border-cyan-line whitespace-nowrap ${quest.completed ? 'bg-ink-soft text-ink-muted border-line' : ''}`}>+{quest.points} XP</span>
                </div>
              ))}
            </div>
          </div>


          <div className="bg-card border border-line rounded-xl p-5 overflow-hidden">
            <h3 className="text-[0.95rem] font-semibold mb-4 flex items-center gap-2 m-0">
              <Clock size={16} className="text-primary" /> Spaced Recall Calendar
            </h3>
             <div className="flex flex-col gap-3">
               {spacedRepetitionList.length === 0 ? (
                 <div className="text-center p-4 text-ink-muted text-[0.8rem] bg-ink-soft rounded-lg border border-line">
                   No recall modules scheduled. Upload a module or create study items to start spaced repetition!
                 </div>
               ) : (
                 spacedRepetitionList.map((item) => (
                   <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-app border border-line rounded-lg overflow-hidden min-w-0">
                     <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
                       <span className="text-[0.85rem] font-semibold text-ink truncate" title={item.name}>{item.name}</span>
                       <span className="text-[0.7rem] text-ink-muted">Recall Strength: {item.progress}%</span>
                     </div>
                     <span className="self-end sm:self-center shrink-0" style={{ fontSize: '0.7rem', background: item.dueIn.includes('hours') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: item.dueIn.includes('hours') ? '#ef4444' : 'var(--text-secondary)', border: '1px solid currentColor', borderRadius: '4px', padding: '0.15rem 0.4rem', fontWeight: 'bold' }}>
                       Due in {item.dueIn}
                     </span>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCheckInOpen && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-line rounded-2xl p-5 sm:p-8 max-w-105 w-full shadow-lg relative text-center"
            >
              <div className="flex items-center justify-center mx-auto mb-4 bg-primary-soft text-primary p-3 rounded-full w-14 h-14">
                <Flame size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">Daily Streak Check-in</h3>
              <p className="text-ink-muted text-sm mb-6">
                Keep your momentum going! Claim your daily check-in to build your study streak and earn XP.
              </p>
              
              <div className="bg-app border border-line rounded-xl p-4 mb-6 flex justify-around">
                <div>
                  <div className="text-2xl font-bold text-primary">{user.streak !== undefined ? user.streak : 5}</div>
                  <div className="text-[0.7rem] text-ink-muted uppercase font-semibold">Current Streak</div>
                </div>
                <div className="border-r border-line"></div>
                <div>
                  <div className="text-2xl font-bold text-accent-cyan">{user.lastCheckIn === new Date().toDateString() ? 'Claimed' : 'Not Claimed'}</div>
                  <div className="text-[0.7rem] text-ink-muted uppercase font-semibold">Status</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(false)}
                  className="btn btn-outline flex-1 py-2"
                >
                  Close
                </button>
                {user.lastCheckIn === new Date().toDateString() ? (
                  <button
                    type="button"
                    disabled
                    className="btn btn-primary flex-1 py-2 opacity-50 cursor-not-allowed"
                  >
                    Claimed Today
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleStreakCheckIn();
                      setIsCheckInOpen(false);
                    }}
                    className="btn btn-primary flex-1 py-2"
                  >
                    Check In (+10 XP)
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
