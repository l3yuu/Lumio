import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, CheckCircle2, Timer, AlertTriangle, Lightbulb, BookOpen } from 'lucide-react';
import type { Module, StudyGroup, GroupQuizSession, GroupQuizRank, GroupQuizRankResponse, ExamDeadline } from '../../types';
import { WS_BASE_URL } from '../../config';

interface RosterMember {
  user_id: number;
  name: string;
  online: boolean;
  finished?: boolean;
  score?: string;
}

interface QuizPanelProps {
  activeQuizModule: Module;
  isGroupQuizMode: boolean;
  activeGroup: StudyGroup | undefined;
  selectedAnswers: { [questionId: number]: number | string };
  showQuizResults: boolean;
  quizScore: number;
  activeQuizSession: GroupQuizSession | null;
  setActiveQuizModule: (mod: Module | null) => void;
  setIsGroupQuizMode: (v: boolean) => void;
  handleSelectAnswer: (questionId: number, optionIndex: number | string) => void;
  handleSubmitQuiz: () => void;
  startQuiz: (module: Module) => void;
  startGroupQuiz: (module: Module, groupId: number) => void;
  selectedGroupId: number | null;
  exams?: ExamDeadline[];
  handleRecordQuizAttempt?: (examId: number, score: string, quizName: string) => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({
  activeQuizModule,
  isGroupQuizMode,
  activeGroup,
  selectedAnswers,
  showQuizResults,
  quizScore,
  activeQuizSession,
  setActiveQuizModule,
  setIsGroupQuizMode,
  handleSelectAnswer,
  handleSubmitQuiz,
  startQuiz,
  startGroupQuiz,
  selectedGroupId,
  exams,
  handleRecordQuizAttempt,
}) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [liveRankings, setLiveRankings] = useState<GroupQuizRank[]>([]);
  const [liveAvgScore, setLiveAvgScore] = useState<string>("0%");
  
  const startTimeRef = useRef<number>(0);
  const onSubmitRef = useRef<() => void>(() => {});

  // Timer, Mode, and Exam linking states
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number>(0); // in minutes, 0 means untimed
  const [isMockMode, setIsMockMode] = useState(false);
  const [linkedExamId, setLinkedExamId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [timerActive, setTimerActive] = useState(false);

  const [revealedHints, setRevealedHints] = useState<{ [questionId: number]: boolean }>({});
  const [typedAnswers, setTypedAnswers] = useState<{ [questionId: number]: string }>({});

  const toggleHint = (questionId: number) => {
    setRevealedHints(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const getQuestionTypeBadge = (type?: string) => {
    const t = type || 'multiple_choice';
    if (t === 'true_false') return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    if (t === 'fill_in_blank') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (t === 'short_answer') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  const getQuestionTypeLabel = (type?: string) => {
    const t = type || 'multiple_choice';
    if (t === 'true_false') return 'True / False';
    if (t === 'fill_in_blank') return 'Fill-in-the-Blank';
    if (t === 'short_answer') return 'Short Answer';
    return 'Multiple Choice';
  };

  // WebSocket connection for real-time multiplayer group quiz
  useEffect(() => {
    if (!isGroupQuizMode || !selectedGroupId) return;
    startTimeRef.current = Date.now();
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to FastAPI WebSockets endpoint
    const ws = new WebSocket(`${WS_BASE_URL}/api/groups/ws/${selectedGroupId}/quiz/${activeQuizModule.id}?token=${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected to Group Quiz Room');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'roster_update') {
          setRoster(data.members || []);
        } else if (data.type === 'scoreboard_update') {
          setLiveAvgScore(data.avgScore || "0%");
          if (data.rankings) {
            const mappedRankings = data.rankings.map((r: GroupQuizRankResponse) => ({
              name: r.name,
              score: r.score,
              percentage: r.percentage,
              time: r.time,
              isUser: r.is_user
            }));
            setLiveRankings(mappedRankings);
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    socketRef.current = ws;

    return () => {
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.onopen = null;
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => {
          ws.close();
        };
      } else {
        ws.close();
      }
      socketRef.current = null;
    };
  }, [isGroupQuizMode, selectedGroupId, activeQuizModule.id]);

  const onSubmit = () => {
    let score = 0;
    activeQuizModule.questions.forEach((q) => {
      if (q.questionType === 'short_answer') {
        const userAnswer = selectedAnswers[q.id];
        const correctAnswer = q.options[q.correctAnswerIndex] || '';
        if (
          typeof userAnswer === 'string' &&
          userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        ) {
          score += 1;
        }
      } else {
        if (selectedAnswers[q.id] === q.correctAnswerIndex) score += 1;
      }
    });

    const percent = Math.round((score / activeQuizModule.questions.length) * 100);
    const durationMs = Date.now() - startTimeRef.current;
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor(durationMs / 1000 / 60);
    const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    if (isGroupQuizMode && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'submit_score',
        score: `${score}/${activeQuizModule.questions.length}`,
        percentage: percent,
        time: durationStr
      }));
    }

    // Link quiz attempt to exam
    if (linkedExamId && handleRecordQuizAttempt) {
      handleRecordQuizAttempt(linkedExamId, `${score}/${activeQuizModule.questions.length}`, activeQuizModule.name);
    }

    handleSubmitQuiz();
    setTimerActive(false);
  };

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });

  // Active countdown timer effect
  useEffect(() => {
    if (!timerActive) return;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          window.setTimeout(() => onSubmitRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerActive]);

  const showQuizLobby = !isGroupQuizMode && !isQuizStarted;

  const rankingsToRender = isGroupQuizMode && liveRankings.length > 0
    ? liveRankings
    : (activeQuizSession ? activeQuizSession.rankings : []);

  const avgScoreToRender = isGroupQuizMode && liveRankings.length > 0
    ? liveAvgScore
    : (activeQuizSession ? activeQuizSession.avgScore : '0%');

  return (
    <div className="bg-card border border-line rounded-xl p-7 shadow-lg">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-line">
        <div>
          <h3 className="text-2xl mb-1">
            {isGroupQuizMode ? 'Group Quiz Session' : 'Individual Practice Quiz'}
          </h3>
          <span className="text-ink-muted text-[0.9rem]">
            Module: {activeQuizModule.name} {isGroupQuizMode && activeGroup && ` | Group: ${activeGroup.name}`}
          </span>
        </div>
        <button
          onClick={() => { setActiveQuizModule(null); setIsGroupQuizMode(false); }}
          className="btn btn-outline px-4 py-2 text-[0.85rem]"
        >
          Exit Quiz
        </button>
      </div>

      {isGroupQuizMode && roster.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center mb-6 p-4 bg-app border border-line rounded-xl">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Live Study Partners:</span>
          <div className="flex flex-wrap gap-2">
            {roster.map((member) => (
              <span key={member.user_id} className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold border ${member.online ? 'bg-primary-soft text-primary border-primary-line' : 'bg-ink-soft text-ink-muted border-line'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${member.online ? 'bg-primary animate-pulse' : 'bg-ink-muted'}`} />
                {member.name} {member.finished && <span className="text-[0.7rem] opacity-80">(finished: {member.score})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {!showQuizResults ? (
        showQuizLobby ? (
          <div className="flex flex-col gap-6 py-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-app border border-line rounded-xl text-center">
              <h4 className="text-xl font-bold text-ink mb-2">Quiz Setup & Lobby</h4>
              <p className="text-ink-muted text-xs mb-0">Configure your settings before launching your quiz.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timer Selection */}
              <div className="p-5 bg-app border border-line rounded-xl flex flex-col gap-3">
                <label className="text-sm font-bold text-ink flex items-center gap-2">
                  <Timer size={16} className="text-primary animate-pulse" /> Quiz Timer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 5, 10, 15, 30].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setTimeLimit(mins)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold capitalize transition-all duration-150 ${
                        timeLimit === mins
                          ? 'bg-primary text-ink-on-primary border-primary shadow-glow-primary-soft'
                          : 'bg-input border-line text-ink-muted hover:text-ink hover:border-line-strong'
                      }`}
                    >
                      {mins === 0 ? 'No Limit' : `${mins} min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="p-5 bg-app border border-line rounded-xl flex flex-col gap-3">
                <label className="text-sm font-bold text-ink flex items-center gap-2">
                  <Trophy size={16} className="text-primary" /> Mode Selection
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMockMode(false)}
                    className={`flex-1 py-3 px-4 rounded-lg border text-xs font-bold text-left transition-all duration-150 flex flex-col gap-1 ${
                      !isMockMode
                        ? 'bg-primary/5 border-primary text-ink'
                        : 'bg-input border-line text-ink-muted hover:border-line-strong'
                    }`}
                  >
                    <span className={!isMockMode ? 'text-primary' : 'text-ink'}>Practice Mode</span>
                    <span className="text-[0.65rem] font-normal leading-relaxed text-ink-muted">View score and detailed explanations right after submission.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMockMode(true)}
                    className={`flex-1 py-3 px-4 rounded-lg border text-xs font-bold text-left transition-all duration-150 flex flex-col gap-1 ${
                      isMockMode
                        ? 'bg-primary/5 border-primary text-ink'
                        : 'bg-input border-line text-ink-muted hover:border-line-strong'
                    }`}
                  >
                    <span className={isMockMode ? 'text-primary' : 'text-ink'}>Mock Exam Mode</span>
                    <span className="text-[0.65rem] font-normal leading-relaxed text-ink-muted">Simulates real exam rules. Strict timer. No instant hints.</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Exam Deadline Linking */}
            {exams && exams.length > 0 && (
              <div className="p-5 bg-app border border-line rounded-xl flex flex-col gap-3">
                <label className="text-sm font-bold text-ink flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" /> Link Quiz to an Upcoming Exam
                </label>
                <select
                  value={linkedExamId || ''}
                  onChange={e => setLinkedExamId(Number(e.target.value) || null)}
                  className="w-full bg-input border border-line rounded-lg text-ink text-sm px-3 py-2.5 outline-none focus:border-primary transition-all"
                >
                  <option value="">-- Do Not Link to Exam --</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.subject}) - Due {exam.date}
                    </option>
                  ))}
                </select>
                <p className="text-[0.7rem] text-ink-muted leading-relaxed">
                  * Completing this quiz will log your score as a practice attempt linked to the exam. You can review attempts from your Exam Calendar.
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-end mt-4">
              <button
                onClick={() => { setActiveQuizModule(null); setIsGroupQuizMode(false); }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsQuizStarted(true);
                  setTypedAnswers({});
                  startTimeRef.current = Date.now();
                  if (timeLimit > 0) {
                    setTimeLeft(timeLimit * 60);
                    setTimerActive(true);
                  }
                }}
                className="btn btn-primary px-8"
              >
                Launch Quiz &rarr;
              </button>
            </div>
          </div>
        ) : (
          <>
            {timeLimit > 0 && timerActive && (() => {
              const formatTimeLeft = (sec: number) => {
                const mins = Math.floor(sec / 60);
                const secs = sec % 60;
                return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
              };
              const timerPercentage = timeLimit > 0 ? (timeLeft / (timeLimit * 60)) * 100 : 0;
              const timerBarColor = timerPercentage < 20 ? 'bg-danger' : timerPercentage < 50 ? 'bg-warning' : 'bg-primary';
              return (
                <div className="mb-6 p-4 bg-app border border-line rounded-xl flex flex-col gap-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-ink">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary animate-pulse" />
                      Remaining Time
                    </span>
                    <span className={timeLeft < 15 ? 'text-danger animate-pulse font-bold' : 'text-primary font-mono'}>
                      {formatTimeLeft(timeLeft)}
                    </span>
                  </div>
                  <div className="w-full bg-line h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 rounded-full ${timerBarColor}`}
                      style={{ width: `${timerPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {isMockMode && (
              <div className="mb-6 p-4 bg-danger-soft border border-danger-line rounded-xl flex items-center gap-2 text-left text-xs font-semibold text-danger">
                <AlertTriangle size={14} />
                <span>Mock Exam Mode Active: Immediate question review is disabled until full submission.</span>
              </div>
            )}

            {activeQuizModule.questions.map((q, index) => {
              const selected = selectedAnswers[q.id];
              const isAnswered = selected !== undefined;
              const hasHint = q.hint && q.hint.trim().length > 0;

              return (
                <div className="mb-10 text-left bg-glass border border-line/55 rounded-2xl p-6 shadow-sm relative overflow-hidden" key={q.id}>
                  {/* Metadata header row: Type badge, Section Reference, Hint button */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 border-b border-line/40 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[0.62rem] font-extrabold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getQuestionTypeBadge(q.questionType)}`}>
                        {getQuestionTypeLabel(q.questionType)}
                      </span>
                      {q.reference && (
                        <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium text-ink-muted bg-glass-strong border border-line/50 px-2.5 py-0.5 rounded-full select-none">
                          <BookOpen size={10} className="text-primary/70 shrink-0" />
                          Ref: {q.reference}
                        </span>
                      )}
                    </div>
                    {hasHint && !isMockMode && !isAnswered && (
                      <button
                        onClick={() => toggleHint(q.id)}
                        className={`inline-flex items-center gap-1 text-[0.65rem] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none ${
                          revealedHints[q.id]
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-sm'
                            : 'bg-glass-strong text-ink-muted border-line hover:text-ink hover:bg-glass hover:border-line-strong'
                        }`}
                      >
                        <Lightbulb size={11} className={revealedHints[q.id] ? 'animate-pulse' : ''} />
                        {revealedHints[q.id] ? 'Hide Hint' : 'Show Hint'}
                      </button>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="text-lg leading-snug mb-5 font-bold text-ink">
                    {index + 1}. {q.question}
                  </div>

                  {/* Hint Content Bubble */}
                  {revealedHints[q.id] && q.hint && !isMockMode && !isAnswered && (
                    <div className="mb-4 text-[11px] leading-relaxed text-amber-400 bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Lightbulb size={13} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[9px] mr-1 bg-amber-500/10 px-1 py-0.2 rounded">Hint:</span>
                        {q.hint}
                      </div>
                    </div>
                  )}

                  {/* Options List / Text Input */}
                  {q.questionType === 'short_answer' ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          disabled={isAnswered && !isMockMode}
                          placeholder="Type your answer here..."
                          value={typedAnswers[q.id] ?? ''}
                          onChange={(e) => setTypedAnswers({ ...typedAnswers, [q.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isAnswered) {
                              e.preventDefault();
                              if (typedAnswers[q.id]?.trim()) {
                                handleSelectAnswer(q.id, typedAnswers[q.id].trim());
                              }
                            }
                          }}
                          className="flex-1 bg-input border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 px-4 text-sm text-ink placeholder-ink-muted transition-all outline-none"
                        />
                        {(!isAnswered || isMockMode) && (
                          <button
                            type="button"
                            disabled={!(typedAnswers[q.id]?.trim()) || (isMockMode && typedAnswers[q.id]?.trim() === selected)}
                            onClick={() => handleSelectAnswer(q.id, typedAnswers[q.id].trim())}
                            className="btn btn-primary px-5 font-bold transition-all cursor-pointer"
                          >
                            {isMockMode ? (selected !== undefined ? 'Update' : 'Save Answer') : 'Submit'}
                          </button>
                        )}
                      </div>
                      
                      {isAnswered && !isMockMode && (
                        <div className="mt-2 text-xs flex flex-col gap-2 p-4 bg-app border border-line rounded-xl">
                          <div className="flex justify-between items-center">
                            <span className="text-ink-muted">Your Answer:</span>
                            <span className={String(selected).trim().toLowerCase() === (q.options[q.correctAnswerIndex] || '').trim().toLowerCase() ? "text-primary font-bold" : "text-danger font-bold"}>
                              {String(selected)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-line/40 pt-2">
                            <span className="text-ink-muted">Correct Answer:</span>
                            <span className="text-primary font-bold">{q.options[q.correctAnswerIndex]}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {q.options.map((option, optIdx) => {
                        const correct = q.correctAnswerIndex;
                        
                        let statusClass = '';
                        if (isAnswered && !isMockMode) {
                          if (optIdx === correct) {
                            statusClass = '!border-primary !bg-primary/10 !text-primary font-bold';
                          } else if (optIdx === selected && selected !== correct) {
                            statusClass = '!border-danger !bg-danger/10 !text-danger font-bold';
                          }
                        } else {
                          if (selected === optIdx) {
                            statusClass = 'border-primary bg-primary/5';
                          }
                        }
                        
                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered && !isMockMode}
                            className={`flex items-center py-3.5 px-4.5 rounded-xl border border-line bg-app text-ink cursor-pointer font-semibold transition-all duration-150 text-left hover:border-primary hover:bg-glass ${statusClass} ${isAnswered && !isMockMode ? 'cursor-default' : ''}`}
                            onClick={() => handleSelectAnswer(q.id, optIdx)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* AI Explanation Card */}
                  {isAnswered && !isMockMode && q.explanation && (
                    <div className="mt-4 bg-primary-soft/30 border border-primary-line/45 rounded-xl p-4 animate-in fade-in slide-in-from-top-3 duration-250">
                      <div className="flex items-center gap-2 mb-1.5 select-none">
                        <Trophy size={13} className="text-primary" />
                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">AI Explanation</span>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={onSubmit}
              className="btn btn-primary w-full justify-center p-4 mt-4"
            >
              Submit & Grade {isGroupQuizMode ? 'Group Results' : 'Quiz'} &rarr;
            </button>
          </>
        )
      ) : (
        <div className="quiz-results-card">
          {isGroupQuizMode && rankingsToRender.length > 0 ? (
            <div className="text-center mt-6">
              <div className="flex items-center gap-2 justify-center mb-2 text-primary">
                <Trophy size={32} />
                <h4 className="text-[1.75rem] m-0">Group Quiz Scorecard</h4>
              </div>
              <p className="text-ink-muted mb-6">
                Session on: {activeQuizModule.name} | Just now
              </p>

              <div className="grid grid-cols-2 gap-6 my-6 p-6 bg-app border border-line rounded-xl">
                <div>
                  <div className="text-[1.75rem] font-bold text-accent-cyan">
                    {avgScoreToRender}
                  </div>
                  <span className="text-[0.8rem] text-ink-muted">Group Average Accuracy</span>
                </div>
                <div>
                  <div className="text-[1.75rem] font-bold text-primary">
                    {quizScore} / {activeQuizModule.questions.length}
                  </div>
                  <span className="text-[0.8rem] text-ink-muted">Your Score</span>
                </div>
              </div>

              <table className="w-full border-collapse mt-4">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line text-center">Rank</th>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Name</th>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Score</th>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Accuracy</th>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingsToRender.map((rank, rankIdx) => {
                    const isCurrentUser = rank.isUser;
                    return (
                      <tr key={rankIdx} className={`hover:bg-glass transition-colors duration-150 ${isCurrentUser ? 'bg-primary-tint-1' : ''}`}>
                        <td className="py-3 px-3 text-sm border-b border-line">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mx-auto text-sm ${rankIdx + 1 === 1 ? 'bg-primary text-ink-on-primary' : rankIdx + 1 === 2 ? 'bg-rank-2 text-white' : rankIdx + 1 === 3 ? 'bg-rank-3 text-white' : 'bg-ink-soft text-ink-muted'}`}>
                            {rankIdx + 1}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm border-b border-line" style={{ fontWeight: isCurrentUser ? 700 : 500 }}>
                          {rank.name}
                        </td>
                        <td className="py-3 px-3 text-sm border-b border-line">{rank.score}</td>
                        <td className="py-3 px-3 text-sm border-b border-line" style={{ color: rank.percentage >= 70 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                          {rank.percentage}%
                        </td>
                        <td className="py-3 px-3 text-sm border-b border-line">
                          <span className="inline-flex items-center gap-1 text-[0.85rem] text-ink-muted">
                            <Clock size={12} /> {rank.time}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="text-[3.5rem] font-extrabold text-primary mb-3">
                {quizScore} / {activeQuizModule.questions.length}
              </div>
              <h4 className="text-2xl mb-4">
                {quizScore === activeQuizModule.questions.length ? 'Perfect Score!' : 'Keep Studying!'}
              </h4>
              <p className="text-ink-muted mb-10">
                You scored {(quizScore / activeQuizModule.questions.length * 100).toFixed(0)}% accuracy on this test.
              </p>
            </>
          )}

          <div className="text-left mb-12">
            <h5 className="text-[1.2rem] mb-6 border-b border-line pb-2">Question Review</h5>
            {activeQuizModule.questions.map((q, index) => {
              const selected = selectedAnswers[q.id];
              const correct = q.correctAnswerIndex;
              return (
                <div className="mb-10 text-left bg-glass border border-line/55 rounded-2xl p-6 shadow-sm" key={q.id}>
                  {/* Metadata header row: Type badge & Section Reference */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-line/40 pb-3 select-none">
                    <span className={`text-[0.62rem] font-extrabold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getQuestionTypeBadge(q.questionType)}`}>
                      {getQuestionTypeLabel(q.questionType)}
                    </span>
                    {q.reference && (
                      <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium text-ink-muted bg-glass-strong border border-line/50 px-2.5 py-0.5 rounded-full">
                        <BookOpen size={10} className="text-primary/70 shrink-0" />
                        Ref: {q.reference}
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="text-lg leading-snug mb-5 font-bold text-ink">
                    {index + 1}. {q.question}
                  </div>

                  {/* Options List / Text Review */}
                  {q.questionType === 'short_answer' ? (
                    <div className="flex flex-col gap-2.5">
                      <div className={`p-4 rounded-xl border flex items-center justify-between ${
                        String(selected || '').trim().toLowerCase() === (q.options[q.correctAnswerIndex] || '').trim().toLowerCase()
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-danger bg-danger/10 text-danger font-bold'
                      }`}>
                        <div className="flex-1">
                          <div className="text-[10px] uppercase font-bold text-ink-muted mb-1 select-none">Your Answer</div>
                          <div className="text-sm">{String(selected || '(No Answer)')}</div>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded select-none ${
                          String(selected || '').trim().toLowerCase() === (q.options[q.correctAnswerIndex] || '').trim().toLowerCase()
                            ? 'bg-primary-soft/50 text-primary'
                            : 'bg-danger-soft/50 text-danger'
                        }`}>
                          {String(selected || '').trim().toLowerCase() === (q.options[q.correctAnswerIndex] || '').trim().toLowerCase() ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      
                      <div className="p-4 rounded-xl border border-primary bg-primary/10 text-primary font-bold flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-[10px] uppercase font-bold text-ink-muted mb-1 select-none">Correct Answer</div>
                          <div className="text-sm">{q.options[q.correctAnswerIndex]}</div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-primary bg-primary-soft/50 px-2 py-0.5 rounded select-none">
                          Correct Answer
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {q.options.map((option, optIdx) => {
                        let statusClass = '';
                        if (optIdx === correct) {
                          statusClass = '!border-primary !bg-primary/10 !text-primary font-bold';
                        } else if (optIdx === selected && selected !== correct) {
                          statusClass = '!border-danger !bg-danger/10 !text-danger font-bold';
                        }
                        return (
                          <div key={optIdx} className={`flex items-center py-3.5 px-4.5 rounded-xl border border-line bg-app text-ink font-semibold transition-all duration-150 text-left ${statusClass}`} style={{ cursor: 'default' }}>
                            <span className="flex-1">{option}</span>
                            {optIdx === correct && (
                              <span className="text-[10px] uppercase font-bold text-primary bg-primary-soft/50 px-2 py-0.5 rounded ml-2 select-none">
                                Correct Answer
                              </span>
                            )}
                            {optIdx === selected && selected !== correct && (
                              <span className="text-[10px] uppercase font-bold text-danger bg-danger-soft/50 px-2 py-0.5 rounded ml-2 select-none">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* AI Explanation Card */}
                  {q.explanation && (
                    <div className="mt-4 bg-primary-soft/30 border border-primary-line/45 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1.5 select-none">
                        <Trophy size={13} className="text-primary" />
                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">AI Explanation</span>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                if (isGroupQuizMode) {
                  startGroupQuiz(activeQuizModule, selectedGroupId!);
                } else {
                  setIsQuizStarted(false);
                  setTimeLimit(0);
                  setIsMockMode(false);
                  setLinkedExamId(null);
                  setTimeLeft(0);
                  setTimerActive(false);
                  startQuiz(activeQuizModule);
                }
              }}
              className="btn btn-primary"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => { setActiveQuizModule(null); setIsGroupQuizMode(false); }}
              className="btn btn-outline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
