import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Sparkles, Clock, Calendar, Award, Zap, Target, Trophy, Users, Flame, Layers, Plus, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import type { User, StudyQuest, ExamDeadline, DashboardTab } from '../../types';

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
  aiSearchQuery: string;
  aiResponse: { query: string; answer: string } | null;
  isAiLoading: boolean;
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
  setAiSearchQuery: (v: string) => void;
  setDashboardTab: (tab: DashboardTab) => void;
  setSelectedSubject: (v: string) => void;
  handleAddExam: (e: React.FormEvent) => void;
  handleDeleteExam: (id: number) => void;
  handleToggleQuest: (id: string) => void;
  handleRollNewQuests: () => void;
  handleAiSearch: (e: React.FormEvent) => void;
  getActivityColor: (level: number) => string;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({
  user, level, xp, groupsCount, quests, exams, quizHistory, insightsTab,
  isAddingExam, newExamTitle, newExamSubject, newExamDate, newExamPriority,
  aiSearchQuery, aiResponse, isAiLoading, spacedRepetitionList, heatmapData, subjects, pathData,
  setInsightsTab, setIsAddingExam, setNewExamTitle, setNewExamSubject, setNewExamDate,
  setNewExamPriority, setAiSearchQuery, setDashboardTab, setSelectedSubject,
  handleAddExam, handleDeleteExam, handleToggleQuest, handleRollNewQuests, handleAiSearch, getActivityColor,
}) => {
  return (
    <>
      <div className="bg-[linear-gradient(135deg,rgba(62,207,142,0.06)_0%,rgba(6,182,212,0.04)_100%)] border border-line rounded-xl px-7 py-6 mb-2">
        <h2 className="text-[1.75rem] font-bold mb-1">Welcome back, {user.name}!</h2>
        <p className="text-ink-muted text-[0.9rem] leading-relaxed">
          Track your daily progress, query topics instantly with the AI tutor, and practice scheduled card recall modules.
        </p>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr] gap-6 mb-0 max-md:grid-cols-1">
        <div className="flex flex-col gap-6">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="bg-card border border-line rounded-xl flex flex-col gap-1 p-4">
              <div className="bg-primary-soft text-primary p-2 rounded-lg w-fit mb-1"><Flame size={16} /></div>
              <div className="text-2xl font-bold tracking-tight">5</div>
              <div className="text-[0.7rem] text-ink-muted font-medium uppercase tracking-wider">Day Streak</div>
            </div>
            <div className="bg-card border border-line rounded-xl flex flex-col gap-1 p-4">
              <div className="bg-cyan-soft-2 text-accent-cyan p-2 rounded-lg w-fit mb-1"><Users size={16} /></div>
              <div className="text-2xl font-bold tracking-tight">{groupsCount}</div>
              <div className="text-[0.7rem] text-ink-muted font-medium uppercase tracking-wider">Circles</div>
            </div>
            <div className="bg-card border border-line rounded-xl flex flex-col gap-1 p-4">
              <div className="bg-success/10 text-primary p-2 rounded-lg w-fit mb-1"><Trophy size={16} /></div>
              <div className="text-2xl font-bold tracking-tight">12</div>
              <div className="text-[0.7rem] text-ink-muted font-medium uppercase tracking-wider">Quizzes</div>
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="text-[0.95rem] font-semibold mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Activity Intensity
            </h3>
            <p className="text-[0.75rem] text-ink-muted mb-4">Study hours over the last two weeks.</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {heatmapData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1 min-w-8">
                  <div style={{ width: '100%', height: '36px', borderRadius: '6px', background: getActivityColor(data.level), border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: data.level > 2 ? '#121212' : 'var(--text-primary)', fontWeight: 'bold', transition: 'all 0.2s ease' }} title={`${data.hours} study hours on ${data.label}`}>
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
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Name</label>
                      <input type="text" placeholder="e.g. Biology Final" className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} required />
                    </div>
                    <div className="w-30">
                      <label className="text-[0.75rem] font-semibold text-ink mb-1">Subject Folder</label>
                      <select className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8" value={newExamSubject} onChange={(e) => setNewExamSubject(e.target.value)}>
                        {subjects.map(subj => (<option key={subj} value={subj === 'All' ? 'General' : subj}>{subj === 'All' ? 'General' : subj}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 items-end">
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
                  <div className="flex items-start gap-4 relative z-2" key={exam.id}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-line border-[3px] border-card mt-1.25 shrink-0 z-3 transition-all duration-200 ${exam.priority === 'high' ? 'bg-danger' : exam.priority === 'medium' ? 'bg-warning' : 'bg-accent-cyan'}`}></div>
                    <div className="flex grow items-center justify-between bg-app border border-line rounded-lg p-3 px-4 transition-all duration-200 hover:translate-x-1 hover:border-primary">
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.9rem] font-bold text-ink">{exam.title}</span>
                        <div className="text-[0.75rem] text-ink-muted flex items-center gap-2">
                          <span>{exam.date}</span>
                          <span className="opacity-50">•</span>
                          <span onClick={() => { setDashboardTab('modules'); setSelectedSubject(exam.subject === 'General' ? 'All' : exam.subject); }} className="timeline-subject-tag text-primary font-semibold cursor-pointer inline-flex items-center gap-0.5 p-0.5 px-1.5 rounded bg-primary-tint-5 transition-all duration-200 hover:bg-primary-soft-2 hover:text-primary-hover" title={`Click to review ${exam.subject} modules`}>
                            {exam.subject}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[0.75rem] font-bold rounded px-2 py-0.5 whitespace-nowrap ${exam.priority === 'high' ? 'bg-danger-soft text-danger border border-danger-line' : exam.priority === 'medium' ? 'bg-warning-soft text-warning border border-warning-line' : 'bg-cyan-soft-2 text-accent-cyan border border-cyan-line'}`}>
                          {exam.daysRemaining === 0 ? 'Today!' : `${exam.daysRemaining} days left`}
                        </span>
                        <button onClick={() => handleDeleteExam(exam.id)} className="bg-transparent border-0 text-ink-muted cursor-pointer p-0.5 flex items-center opacity-60 hover:opacity-100 transition-opacity duration-200" title="Delete countdown" type="button">
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </div>
                    </div>
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
                    <text x="25" y="19" fill="var(--text-secondary)" fontSize="10" textAnchor="end">100%</text>
                    <text x="25" y="79" fill="var(--text-secondary)" fontSize="10" textAnchor="end">50%</text>
                    <text x="25" y="139" fill="var(--text-secondary)" fontSize="10" textAnchor="end">0%</text>
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
                              <text x={p.x} y={p.y - 15} fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle">{quizHistory[i]}%</text>
                            </g>
                            <text x={p.x} y="152" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Q{i + 1}</text>
                          </g>
                        ))}
                      </>
                    ) : (
                      <text x="200" y="80" fill="var(--text-secondary)" fontSize="12" textAnchor="middle">Complete quizzes to generate performance graphs.</text>
                    )}
                  </svg>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[0.8rem] text-ink-muted mb-5">Breakdown of study hours spent per subject category.</p>
                <div className="flex flex-col gap-3.5">
                  {[
                    { subject: 'Biology', hours: 14, color: 'linear-gradient(90deg, #3ECF8E, #30B378)' },
                    { subject: 'Economics', hours: 9, color: 'linear-gradient(90deg, #f59e0b, #d97706)' },
                    { subject: 'Mathematics', hours: 6, color: 'linear-gradient(90deg, #06b6d4, #0891b2)' },
                    { subject: 'General Study', hours: 4, color: 'linear-gradient(90deg, #a855f7, #9333ea)' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                      <div className="flex justify-between text-[0.75rem] mb-1.5">
                        <span className="font-semibold text-ink">{item.subject}</span>
                        <span className="text-ink-muted text-[0.7rem]">{item.hours} hours ({Math.round((item.hours / 33) * 100)}%)</span>
                      </div>
                      <div className="h-1.5 bg-ink-tint-1 rounded-sm overflow-hidden border border-ink-soft">
                        <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${(item.hours / 14) * 100}%`, background: item.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-line pt-5">
              <div className="text-[0.8rem] font-bold text-ink mb-3 flex items-center gap-1">
                <Target size={14} className="text-warning" /> Recommended Focus Areas
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { concept: 'Mitochondria function', subject: 'Biology', score: 60, desc: 'Scores are low in Quiz 1. Review flashcards.' },
                  { concept: 'Law of Demand curves', subject: 'Economics', score: 70, desc: 'Practice study modules to lift core concepts.' }
                ].map((rec, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 p-2.5 px-3 bg-amber-bg border border-amber-border rounded-lg transition-all duration-200 hover:bg-amber-border hover:border-amber-border-strong hover:-translate-y-px">
                    <div className="grow">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[0.8rem] font-bold text-ink">{rec.concept}</span>
                        <span className="text-[0.65rem] font-semibold bg-warning-soft text-warning py-0.5 px-1.5 rounded border border-warning-line">{rec.score}% accuracy</span>
                      </div>
                      <p className="text-[0.75rem] text-ink-muted m-0">{rec.desc}</p>
                    </div>
                    <button onClick={() => { setDashboardTab('modules'); setSelectedSubject(rec.subject); }} className="btn btn-outline px-2 py-1 text-[0.7rem] h-6 shrink-0" type="button">Review</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
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
                <div key={quest.id} className={`flex items-center gap-3 py-2.5 px-3 bg-app border border-line rounded-lg cursor-pointer transition-all duration-200 hover:border-primary-line-bold hover:bg-primary-tint-1 ${quest.completed ? 'opacity-65 bg-ink-soft border-line cursor-default' : ''}`} onClick={() => { if (!quest.completed) handleToggleQuest(quest.id); }}>
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

            <div className="flex justify-end mt-6 border-t border-line pt-4">
              <button onClick={handleRollNewQuests} className="btn btn-outline px-2 py-1 text-[0.75rem] h-7 flex items-center gap-1" title="Generate a new set of challenges">
                <RotateCcw size={12} /> Roll New Quests
              </button>
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="text-[0.95rem] font-semibold mb-3 flex items-center gap-2 m-0">
              <Search size={16} className="text-primary" /> AI Concept Tutor
            </h3>
            <p className="text-[0.75rem] text-ink-muted mb-4">Query textbook topics to extract explanations from notes.</p>

            <form onSubmit={handleAiSearch} className="flex gap-2 mb-4">
              <input type="text" placeholder="Search 'mitochondria' or 'demand'..." className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.85rem] py-2 px-3 h-9.5" value={aiSearchQuery} onChange={(e) => setAiSearchQuery(e.target.value)} />
              <button type="submit" className="btn btn-primary px-4 h-9.5 shrink-0">Ask AI</button>
            </form>

            <AnimatePresence mode="wait">
              {isAiLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[0.8rem] text-ink-muted italic flex items-center gap-1.5">
                  <Sparkles size={14} className="animate-spin" /> Fetching concept maps...
                </motion.div>
              )}
              {aiResponse && !isAiLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-app border border-line rounded-lg p-3.5 text-[0.85rem]">
                  <div className="font-semibold text-primary mb-1 flex items-center gap-1">
                    <MessageSquare size={14} /> Topic: "{aiResponse.query}"
                  </div>
                  <p className="text-ink text-[0.8rem] leading-snug m-0">{aiResponse.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="text-[0.95rem] font-semibold mb-4 flex items-center gap-2 m-0">
              <Clock size={16} className="text-primary" /> Spaced Recall Calendar
            </h3>
            <div className="flex flex-col gap-3">
              {spacedRepetitionList.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-app border border-line rounded-lg">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[0.85rem] font-semibold text-ink">{item.name}</span>
                    <span className="text-[0.7rem] text-ink-muted">Recall Strength: {item.progress}%</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', background: item.dueIn.includes('hours') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: item.dueIn.includes('hours') ? '#ef4444' : 'var(--text-secondary)', border: '1px solid currentColor', borderRadius: '4px', padding: '0.15rem 0.4rem', fontWeight: 'bold' }}>
                    Due in {item.dueIn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
