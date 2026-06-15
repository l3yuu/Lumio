import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, CheckCircle2, Trophy, X, Zap } from 'lucide-react';
import type { ExamDeadline, ExamQuizLink } from '../../types';

interface CalendarPanelProps {
  exams: ExamDeadline[];
  completedExams: ExamDeadline[];
  isAddingExam: boolean;
  newExamTitle: string;
  newExamSubject: string;
  newExamDate: string;
  newExamPriority: 'high' | 'medium' | 'low';
  subjects: string[];
  setIsAddingExam: (v: boolean) => void;
  setNewExamTitle: (v: string) => void;
  setNewExamSubject: (v: string) => void;
  setNewExamDate: (v: string) => void;
  setNewExamPriority: (v: 'high' | 'medium' | 'low') => void;
  handleAddExam: (e: React.FormEvent) => void;
  handleDeleteExam: (id: number) => void;
  handleCompleteExam: (id: number, score?: string) => void;
  examQuizLinks?: Record<number, ExamQuizLink>;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  exams, completedExams, isAddingExam, newExamTitle, newExamSubject, newExamDate, newExamPriority, subjects,
  setIsAddingExam, setNewExamTitle, setNewExamSubject, setNewExamDate, setNewExamPriority,
  handleAddExam, handleDeleteExam, handleCompleteExam, examQuizLinks,
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [finishingExamId, setFinishingExamId] = useState<number | null>(null);
  const [finishScore, setFinishScore] = useState('');
  const [selectedDate, setSelectedDate] = useState<{ day: number; month: number; year: number } | null>(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamDeadline | null>(null);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<{ exam: ExamDeadline; fromDetail: boolean } | null>(null);

  const startFinishing = (examId: number) => {
    setFinishingExamId(examId);
    setFinishScore('');
  };

  const cancelFinishing = () => {
    setFinishingExamId(null);
    setFinishScore('');
  };

  const submitFinish = (examId: number) => {
    if (!finishScore.trim()) return;
    handleCompleteExam(examId, finishScore);
    cancelFinishing();
  };

  const { year, month, daysInMonth, firstDayOfMonth } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    return {
      year: y,
      month: m,
      daysInMonth: new Date(y, m + 1, 0).getDate(),
      firstDayOfMonth: new Date(y, m, 1).getDay(),
    };
  }, [viewDate]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const examMap = useMemo(() => {
    const map: Record<string, ExamDeadline[]> = {};
    exams.forEach(exam => {
      const d = exam.rawDate || exam.date;
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const key = `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(exam);
      }
    });
    return map;
  }, [exams]);

  const selectedDayExams = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.year}-${selectedDate.month}-${selectedDate.day}`;
    return examMap[key] || [];
  }, [selectedDate, examMap]);

  const getExamsForDay = (day: number) => {
    const key = `${year}-${month}-${day}`;
    return examMap[key] || [];
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const priorityColor = (p: string) =>
    p === 'high' ? 'bg-danger' : p === 'medium' ? 'bg-warning' : 'bg-accent-cyan';

  const priorityLabel = (p: string) =>
    p === 'high' ? 'High' : p === 'medium' ? 'Medium' : 'Low';

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card border border-line rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[1.15rem] flex items-center gap-2 m-0">
            <CalendarIcon size={18} className="text-primary" /> Exam Calendar
          </h3>
          <button onClick={() => setIsAddingExam(true)} className="btn btn-primary px-3 py-1.5 text-[0.8rem] flex items-center gap-1">
            <Plus size={14} /> Log Exam
          </button>
        </div>

        {/* Log New Exam Modal */}
        {isAddingExam && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={(e) => { handleAddExam(e); setIsAddingExam(false); }}
              className="bg-card border border-line rounded-2xl p-6 max-w-md w-full shadow-lg flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h3 className="text-lg font-bold text-ink flex items-center gap-2 m-0">
                  <Plus size={18} className="text-primary" /> Log New Exam
                </h3>
                <button type="button" onClick={() => setIsAddingExam(false)} className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Title</label>
                  <input type="text" placeholder="e.g. Biology Final" className="w-full bg-input border border-line rounded-lg text-ink text-sm px-3 py-2.5 outline-none focus:border-primary" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.75rem] font-semibold text-ink mb-1">Subject</label>
                    <select className="w-full bg-input border border-line rounded-lg text-ink text-sm px-3 py-2.5 outline-none focus:border-primary" value={newExamSubject} onChange={(e) => setNewExamSubject(e.target.value)}>
                      {(() => {
                        const seen = new Set<string>();
                        return subjects.filter(s => {
                          const key = s.toLowerCase().trim();
                          if (seen.has(key)) return false;
                          seen.add(key);
                          return true;
                        }).map(s => <option key={s} value={s === 'All' ? 'General' : s}>{s === 'All' ? 'General' : s}</option>);
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="text-[0.75rem] font-semibold text-ink mb-1">Priority</label>
                    <select className="w-full bg-input border border-line rounded-lg text-ink text-sm px-3 py-2.5 outline-none focus:border-primary" value={newExamPriority} onChange={(e) => setNewExamPriority(e.target.value as 'high' | 'medium' | 'low')}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Date</label>
                  <input type="date" className="w-full bg-input border border-line rounded-lg text-ink text-sm px-3 py-2.5 outline-none focus:border-primary" value={newExamDate} onChange={(e) => setNewExamDate(e.target.value)} required />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-line">
                <button type="button" onClick={() => setIsAddingExam(false)} className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover">Save Exam</button>
              </div>
            </motion.form>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="btn btn-outline p-1.5 border-none bg-transparent hover:bg-glass text-ink-muted hover:text-ink"><ChevronLeft size={18} /></button>
          <span className="text-[1rem] font-bold text-ink">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="btn btn-outline p-1.5 border-none bg-transparent hover:bg-glass text-ink-muted hover:text-ink"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-line rounded-lg overflow-hidden">
          {DAYS.map(d => (
            <div key={d} className="bg-card px-2 py-2 text-center text-[0.65rem] font-bold text-ink-muted uppercase tracking-wider">
              <span className="hidden sm:inline">{d}</span>
              <span className="inline sm:hidden">{d[0]}</span>
            </div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-card min-h-[50px] sm:min-h-[80px] p-1 sm:p-1.5" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayExams = getExamsForDay(day);
            return (
              <div
                key={day}
                onClick={() => setSelectedDate({ day, month, year })}
                className={`bg-card min-h-[50px] sm:min-h-[80px] p-1 sm:p-1.5 transition-all duration-150 hover:bg-glass cursor-pointer flex flex-col justify-between ${
                  isToday(day) ? 'ring-1 ring-primary ring-inset' : ''
                }`}
              >
                <span className={`text-[0.7rem] font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                  isToday(day) ? 'bg-primary text-ink-on-primary' : 'text-ink-muted'
                }`}>
                  {day}
                </span>
                {/* Desktop View: Show title pills */}
                <div className="hidden sm:flex flex-col gap-0.5 mt-0.5">
                  {dayExams.slice(0, 2).map(exam => (
                    <span key={exam.id} className={`text-[0.55rem] font-bold text-white px-1 py-0.5 rounded truncate leading-tight ${priorityColor(exam.priority)}`} title={exam.title}>
                      {exam.title}
                    </span>
                  ))}
                  {dayExams.length > 2 && (
                    <span className="text-[0.55rem] text-ink-muted font-semibold px-1">+{dayExams.length - 2} more</span>
                  )}
                </div>
                {/* Mobile View: Show event dots */}
                {dayExams.length > 0 && (
                  <div className="flex sm:hidden flex-row gap-0.5 justify-center mt-1 flex-wrap">
                    {dayExams.map(exam => (
                      <span
                        key={exam.id}
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColor(exam.priority)}`}
                        title={exam.title}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-line rounded-xl p-5">
        <h3 className="text-[1.15rem] mb-4 flex items-center gap-2 m-0">
          <CalendarIcon size={16} className="text-primary" /> Upcoming Exams
        </h3>
        {exams.length === 0 ? (
          <div className="text-center p-6 text-ink-muted text-[0.85rem]">No exams logged yet. Use the calendar to add your first exam!</div>
        ) : (
          <div className="flex flex-col gap-2">
            {[...exams]
              .sort((a, b) => (a.rawDate || a.date).localeCompare(b.rawDate || b.date))
              .map(exam => (
                <div key={exam.id} className="bg-app border border-line rounded-lg p-3 px-4 hover:border-primary/50 transition-all duration-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityColor(exam.priority)}`} />
                      <div className="flex flex-col min-w-0 flex-1">
                        <button
                          onClick={() => setSelectedExamDetail(exam)}
                          className="text-[0.85rem] font-semibold text-ink truncate flex items-center gap-1.5 text-left bg-transparent border-0 p-0 cursor-pointer hover:text-primary transition-colors"
                        >
                          {exam.title}
                          {(examQuizLinks?.[exam.id]?.attempts?.length ?? 0) > 0 ? (
                            <span className="text-[10px] font-bold text-accent-cyan bg-cyan-soft-2 border border-cyan-line px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <Zap size={10} /> {examQuizLinks![exam.id].attempts.length} Attempt{examQuizLinks![exam.id].attempts.length > 1 ? 's' : ''}
                            </span>
                          ) : examQuizLinks?.[exam.id] ? (
                            <span className="text-[10px] font-bold text-accent-cyan bg-cyan-soft-2 border border-cyan-line px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <Zap size={10} /> Quiz Ready
                            </span>
                          ) : null}
                        </button>
                        <span className="text-[0.7rem] text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>{exam.date}</span>
                          <span className="opacity-50">•</span>
                          <span>{exam.subject}</span>
                          <span className="opacity-50">•</span>
                          <span>{priorityLabel(exam.priority)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {finishingExamId !== exam.id && (
                        <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded ${
                          exam.daysRemaining === 0 ? 'bg-danger-soft text-danger border border-danger-line' :
                          exam.daysRemaining <= 3 ? 'bg-warning-soft text-warning border border-warning-line' :
                          'bg-cyan-soft-2 text-accent-cyan border border-cyan-line'
                        }`}>
                          {exam.daysRemaining === 0 ? 'Today' : `${exam.daysRemaining}d left`}
                        </span>
                      )}
                      {finishingExamId !== exam.id && (
                        <button
                          onClick={() => startFinishing(exam.id)}
                          className="bg-transparent border-0 text-ink-muted cursor-pointer p-1 opacity-60 hover:opacity-100 hover:text-primary transition-all"
                          title="Mark exam as finished"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {finishingExamId !== exam.id && (
                        <button onClick={() => handleDeleteExam(exam.id)} className="bg-transparent border-0 text-ink-muted cursor-pointer p-1 opacity-50 hover:opacity-100 transition-opacity" title="Delete exam">
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      )}
                    </div>
                  </div>
                  {finishingExamId === exam.id && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-line">
                      <label className="text-[0.75rem] font-semibold text-ink shrink-0">Your score</label>
                      <input
                        type="text"
                        placeholder="e.g. 85% or 42/50"
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
                        Finish Exam
                      </button>
                      <button type="button" onClick={cancelFinishing} className="btn btn-outline px-3 py-1 text-[0.75rem]">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {completedExams.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-5">
          <h3 className="text-[1.15rem] mb-4 flex items-center gap-2 m-0">
            <Trophy size={16} className="text-primary" /> Finished Exams
          </h3>
          <div className="flex flex-col gap-2">
            {completedExams.map(exam => (
              <div key={exam.id} className="flex items-center justify-between bg-app border border-line rounded-lg p-3 px-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[0.85rem] font-semibold text-ink truncate">{exam.title}</span>
                    <span className="text-[0.7rem] text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{exam.date}</span>
                      <span className="opacity-50">•</span>
                      <span>{exam.subject}</span>
                    </span>
                  </div>
                </div>
                {exam.score && (
                  <span className="text-[0.8rem] font-bold px-2.5 py-0.5 rounded bg-primary-tint-5 text-primary border border-primary/20 shrink-0">
                    {exam.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
          <div className="bg-card border border-line rounded-2xl p-4 sm:p-6 max-w-lg w-full shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-line">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2 m-0">
                <CalendarIcon size={18} className="text-primary" /> 
                Schedule for {MONTHS[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)} 
                className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96 py-2 flex flex-col gap-3">
              {selectedDayExams.length === 0 ? (
                <div className="text-center py-8 text-ink-muted flex flex-col items-center gap-3">
                  <span className="text-sm">No exams scheduled for this day.</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const yyyy = selectedDate.year;
                      const mm = String(selectedDate.month + 1).padStart(2, '0');
                      const dd = String(selectedDate.day).padStart(2, '0');
                      setNewExamDate(`${yyyy}-${mm}-${dd}`);
                      setIsAddingExam(true);
                      setSelectedDate(null);
                    }}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover"
                  >
                    <Plus size={12} /> Log Exam for this Day
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedDayExams.map(exam => (
                    <div key={exam.id} className="bg-app border border-line rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${priorityColor(exam.priority)}`} />
                          <div className="flex flex-col min-w-0">
                            <button
                              onClick={() => setSelectedExamDetail(exam)}
                              className="text-sm font-bold text-ink leading-snug flex items-center gap-1.5 text-left bg-transparent border-0 p-0 cursor-pointer hover:text-primary transition-colors"
                            >
                              {exam.title}
                              {(examQuizLinks?.[exam.id]?.attempts?.length ?? 0) > 0 ? (
                                <span className="text-[10px] font-bold text-accent-cyan bg-cyan-soft-2 border border-cyan-line px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                  <Zap size={10} /> {examQuizLinks![exam.id].attempts.length} Attempt{examQuizLinks![exam.id].attempts.length > 1 ? 's' : ''}
                                </span>
                              ) : examQuizLinks?.[exam.id] ? (
                                <span className="text-[10px] font-bold text-accent-cyan bg-cyan-soft-2 border border-cyan-line px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                  <Zap size={10} /> Quiz Ready
                                </span>
                              ) : null}
                            </button>
                            <span className="text-xs text-ink-muted mt-0.5">
                              {exam.subject} • {priorityLabel(exam.priority)} Priority
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded ${
                            exam.daysRemaining === 0 ? 'bg-danger-soft text-danger border border-danger-line' :
                            exam.daysRemaining <= 3 ? 'bg-warning-soft text-warning border border-warning-line' :
                            'bg-cyan-soft-2 text-accent-cyan border border-cyan-line'
                          }`}>
                            {exam.daysRemaining === 0 ? 'Today' : `${exam.daysRemaining}d left`}
                          </span>
                        </div>
                      </div>

                      {/* Modal inner actions (Mark finished / Delete) */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center pt-2 border-t border-line mt-1">
                        {finishingExamId === exam.id ? (
                          <div className="flex flex-wrap items-center gap-2 w-full">
                            <label className="text-[0.75rem] font-semibold text-ink shrink-0">Your score</label>
                            <input
                              type="text"
                              placeholder="e.g. 85%"
                              value={finishScore}
                              onChange={(e) => setFinishScore(e.target.value)}
                              className="flex-1 min-w-[100px] bg-input border border-line rounded-md text-ink text-xs px-2.5 py-1.5 outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleCompleteExam(exam.id, finishScore);
                                setFinishingExamId(null);
                                setFinishScore('');
                              }}
                              disabled={!finishScore.trim()}
                              className="btn btn-primary px-2.5 py-1.5 text-[0.7rem] disabled:opacity-50"
                            >
                              Finish
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setFinishingExamId(null)} 
                              className="btn btn-outline px-2.5 py-1.5 text-[0.7rem]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setFinishingExamId(exam.id)}
                              className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover w-full sm:w-auto"
                            >
                              <CheckCircle2 size={12} /> Mark as Finished
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmExam({ exam, fromDetail: false })}
                              className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-danger-line text-danger hover:bg-danger-soft w-full sm:w-auto"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-line mt-1">
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Detail Dashboard */}
      {selectedExamDetail && (
        <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
          <div className="bg-card border border-line rounded-2xl p-4 sm:p-6 max-w-lg w-full shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full shrink-0 ${priorityColor(selectedExamDetail.priority)}`} />
                <div>
                  <h3 className="text-lg font-bold text-ink m-0">{selectedExamDetail.title}</h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {selectedExamDetail.subject} • {priorityLabel(selectedExamDetail.priority)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedExamDetail(null)} className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-input border border-line px-2.5 py-1 rounded-lg text-ink-muted">
                Due: {selectedExamDetail.date}
              </span>
              <span className={`font-bold px-2.5 py-1 rounded-lg border ${
                selectedExamDetail.daysRemaining === 0 ? 'bg-danger-soft text-danger border-danger-line' :
                selectedExamDetail.daysRemaining <= 3 ? 'bg-warning-soft text-warning border-warning-line' :
                'bg-cyan-soft-2 text-accent-cyan border-cyan-line'
              }`}>
                {selectedExamDetail.daysRemaining === 0 ? 'Today' : `${selectedExamDetail.daysRemaining} days left`}
              </span>
            </div>

            {/* Linked Quiz Attempts */}
            {examQuizLinks?.[selectedExamDetail.id] ? (
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold text-ink flex items-center gap-1.5 m-0">
                  <Zap size={14} className="text-accent-cyan" /> Practice Attempts
                </h4>
                {examQuizLinks[selectedExamDetail.id].attempts.length === 0 ? (
                  <p className="text-xs text-ink-muted">Quiz generated and linked. Take the quiz to record attempts.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {[...examQuizLinks[selectedExamDetail.id].attempts].reverse().map((attempt, i) => (
                      <div key={i} className="flex items-center justify-between bg-app border border-line rounded-lg p-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-ink">{attempt.quizName}</span>
                          <span className="text-[0.7rem] text-ink-muted">{attempt.date}</span>
                        </div>
                        <span className="text-sm font-bold text-primary bg-primary-tint-5 border border-primary/20 px-2.5 py-0.5 rounded">
                          {attempt.score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-ink-muted text-xs">
                No practice quizzes linked to this exam yet.
              </div>
            )}

            <div className="flex flex-col gap-3 pt-3 border-t border-line mt-1">
              {finishingExamId === selectedExamDetail.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[0.75rem] font-semibold text-ink shrink-0">Score</label>
                  <input
                    type="text"
                    placeholder="e.g. 85% or 42/50"
                    value={finishScore}
                    onChange={(e) => setFinishScore(e.target.value)}
                    className="flex-1 min-w-[100px] bg-input border border-line rounded-md text-ink text-xs px-2.5 py-1.5 outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleCompleteExam(selectedExamDetail.id, finishScore);
                      setFinishingExamId(null);
                      setFinishScore('');
                      setSelectedExamDetail(null);
                    }}
                    disabled={!finishScore.trim()}
                    className="btn btn-primary text-xs py-1.5 px-3 rounded-lg"
                  >
                    Finish
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinishingExamId(null)}
                    className="btn btn-outline text-xs py-1.5 px-3 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFinishingExamId(selectedExamDetail.id)}
                    className="btn btn-primary text-xs py-2 px-3 rounded-lg flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Mark as Finished
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmExam({ exam: selectedExamDetail, fromDetail: true })}
                    className="btn btn-outline border-danger-line text-danger hover:bg-danger-soft text-xs py-2 px-3 rounded-lg flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedExamDetail(null)}
                    className="btn btn-outline border-line text-ink-muted hover:text-ink text-xs py-2 px-3 rounded-lg ml-auto"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmExam && (
        <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
          <div className="bg-card border border-line rounded-2xl p-6 max-w-sm w-full shadow-lg flex flex-col gap-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center mx-auto mb-3">
                <Trash2 size={22} className="text-danger" />
              </div>
              <h3 className="text-lg font-bold text-ink m-0">Delete Exam</h3>
              <p className="text-sm text-ink-muted mt-2">
                Are you sure you want to delete <strong className="text-ink">{deleteConfirmExam.exam.title}</strong>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmExam(null)}
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteExam(deleteConfirmExam.exam.id);
                  if (deleteConfirmExam.fromDetail) setSelectedExamDetail(null);
                  setDeleteConfirmExam(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer bg-danger text-white border border-danger hover:bg-danger-hover"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
