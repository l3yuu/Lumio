import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock } from 'lucide-react';
import type { Module, StudyGroup, GroupQuizSession, GroupQuizRank, GroupQuizRankResponse } from '../../types';

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
  selectedAnswers: { [questionId: number]: number };
  showQuizResults: boolean;
  quizScore: number;
  activeQuizSession: GroupQuizSession | null;
  setActiveQuizModule: (mod: Module | null) => void;
  setIsGroupQuizMode: (v: boolean) => void;
  handleSelectAnswer: (questionId: number, optionIndex: number) => void;
  handleSubmitQuiz: () => void;
  startQuiz: (module: Module) => void;
  startGroupQuiz: (module: Module, groupId: number) => void;
  selectedGroupId: number | null;
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
}) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [liveRankings, setLiveRankings] = useState<GroupQuizRank[]>([]);
  const [liveAvgScore, setLiveAvgScore] = useState<string>("0%");
  
  const startTimeRef = useRef<number>(0);

  // Reset timer on quiz startup or retake
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [activeQuizModule.id, showQuizResults]);

  // WebSocket connection for real-time multiplayer group quiz
  useEffect(() => {
    if (!isGroupQuizMode || !selectedGroupId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to FastAPI WebSockets endpoint
    const ws = new WebSocket(`ws://127.0.0.1:8000/api/groups/ws/${selectedGroupId}/quiz/${activeQuizModule.id}?token=${token}`);
    
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
      ws.close();
      socketRef.current = null;
    };
  }, [isGroupQuizMode, selectedGroupId, activeQuizModule.id]);

  const onSubmit = () => {
    let score = 0;
    activeQuizModule.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) score += 1;
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

    handleSubmitQuiz();
  };

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
        <>
          {activeQuizModule.questions.map((q, index) => (
            <div className="mb-10" key={q.id}>
              <div className="text-xl leading-snug mb-5 font-bold">
                {index + 1}. {q.question}
              </div>
              <div className="flex flex-col gap-3">
                {q.options.map((option, optIdx) => (
                  <button
                    key={optIdx}
                    className={`flex items-center py-4 px-5 rounded-lg border border-line bg-app text-ink cursor-pointer font-medium transition-all duration-150 text-left hover:border-primary hover:bg-glass ${selectedAnswers[q.id] === optIdx ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => handleSelectAnswer(q.id, optIdx)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={onSubmit}
            className="btn btn-primary w-full justify-center p-4 mt-4"
          >
            Submit & Grade {isGroupQuizMode ? 'Group Results' : 'Quiz'} &rarr;
          </button>
        </>
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
                <div className="mb-10" key={q.id}>
                  <div className="text-xl leading-snug mb-5 font-bold text-[1.15rem]">
                    {index + 1}. {q.question}
                  </div>
                  <div className="flex flex-col gap-3">
                    {q.options.map((option, optIdx) => {
                      let statusClass = '';
                      if (optIdx === correct) statusClass = '!border-primary !bg-primary/10 !text-primary';
                      else if (optIdx === selected && selected !== correct) statusClass = '!border-danger !bg-danger/10 !text-danger';
                      return (
                        <div key={optIdx} className={`flex items-center py-4 px-5 rounded-lg border border-line bg-app text-ink font-medium transition-all duration-150 text-left ${statusClass}`} style={{ cursor: 'default' }}>
                          {option}
                          {optIdx === correct && ' (Correct Answer)'}
                          {optIdx === selected && selected !== correct && ' (Your Choice)'}
                        </div>
                      );
                    })}
                  </div>
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
