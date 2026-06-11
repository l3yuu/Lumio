import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, CheckCircle2, Trophy } from 'lucide-react';
import type { ExamDeadline } from '../../types';

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
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  exams, completedExams, isAddingExam, newExamTitle, newExamSubject, newExamDate, newExamPriority, subjects,
  setIsAddingExam, setNewExamTitle, setNewExamSubject, setNewExamDate, setNewExamPriority,
  handleAddExam, handleDeleteExam, handleCompleteExam,
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [finishingExamId, setFinishingExamId] = useState<number | null>(null);
  const [finishScore, setFinishScore] = useState('');

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
          <button onClick={() => setIsAddingExam(!isAddingExam)} className="btn btn-primary px-3 py-1.5 text-[0.8rem] flex items-center gap-1">
            <Plus size={14} /> Log Exam
          </button>
        </div>

        <AnimatePresence>
          {isAddingExam && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddExam}
              className="bg-app border border-line rounded-lg p-4 mb-6 flex flex-col gap-3 overflow-hidden"
            >
              <div className="text-[0.9rem] font-bold border-b border-line pb-1">Log New Exam</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Title</label>
                  <input type="text" placeholder="e.g. Biology Final" className="w-full bg-input border border-line rounded-md text-ink text-sm px-3 py-2 outline-none focus:border-primary" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="text-[0.75rem] font-semibold text-ink mb-1">Subject</label>
                  <select className="w-full bg-input border border-line rounded-md text-ink text-sm px-3 py-2 outline-none focus:border-primary" value={newExamSubject} onChange={(e) => setNewExamSubject(e.target.value)}>
                    {subjects.map(s => <option key={s} value={s === 'All' ? 'General' : s}>{s === 'All' ? 'General' : s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[0.75rem] font-semibold text-ink mb-1">Priority</label>
                  <select className="w-full bg-input border border-line rounded-md text-ink text-sm px-3 py-2 outline-none focus:border-primary" value={newExamPriority} onChange={(e) => setNewExamPriority(e.target.value as 'high' | 'medium' | 'low')}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Date</label>
                  <input type="date" className="w-full bg-input border border-line rounded-md text-ink text-sm px-3 py-2 outline-none focus:border-primary" value={newExamDate} onChange={(e) => setNewExamDate(e.target.value)} required />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-1">
                <button type="button" className="btn btn-outline px-3 py-1 text-[0.75rem]" onClick={() => setIsAddingExam(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary px-3 py-1 text-[0.75rem]">Save Exam</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="btn btn-outline p-1.5 border-none bg-transparent hover:bg-glass text-ink-muted hover:text-ink"><ChevronLeft size={18} /></button>
          <span className="text-[1rem] font-bold text-ink">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="btn btn-outline p-1.5 border-none bg-transparent hover:bg-glass text-ink-muted hover:text-ink"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-line rounded-lg overflow-hidden">
          {DAYS.map(d => (
            <div key={d} className="bg-card px-2 py-2 text-center text-[0.65rem] font-bold text-ink-muted uppercase tracking-wider">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-card min-h-[80px] p-1.5" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayExams = getExamsForDay(day);
            return (
              <div
                key={day}
                className={`bg-card min-h-[80px] p-1.5 transition-all duration-150 hover:bg-glass ${
                  isToday(day) ? 'ring-1 ring-primary ring-inset' : ''
                }`}
              >
                <span className={`text-[0.7rem] font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                  isToday(day) ? 'bg-primary text-ink-on-primary' : 'text-ink-muted'
                }`}>
                  {day}
                </span>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {dayExams.slice(0, 2).map(exam => (
                    <span key={exam.id} className={`text-[0.55rem] font-bold text-white px-1 py-0.5 rounded truncate leading-tight ${priorityColor(exam.priority)}`} title={exam.title}>
                      {exam.title}
                    </span>
                  ))}
                  {dayExams.length > 2 && (
                    <span className="text-[0.55rem] text-ink-muted font-semibold px-1">+{dayExams.length - 2} more</span>
                  )}
                </div>
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
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityColor(exam.priority)}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[0.85rem] font-semibold text-ink truncate">{exam.title}</span>
                        <span className="text-[0.7rem] text-ink-muted flex items-center gap-2">
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
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[0.85rem] font-semibold text-ink truncate">{exam.title}</span>
                    <span className="text-[0.7rem] text-ink-muted flex items-center gap-2">
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
    </div>
  );
};
