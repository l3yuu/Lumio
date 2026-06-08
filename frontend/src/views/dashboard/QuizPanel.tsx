import React from 'react';
import { Trophy, Clock } from 'lucide-react';
import type { Module, StudyGroup, GroupQuizSession } from '../../types';

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

      {!showQuizResults ? (
        <>
          {activeQuizModule.questions.map((q) => (
            <div className="mb-10" key={q.id}>
              <div className="text-xl leading-snug mb-5 font-bold">
                {q.id}. {q.question}
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
            onClick={handleSubmitQuiz}
            className="btn btn-primary w-full justify-center p-4 mt-4"
          >
            Submit & Grade {isGroupQuizMode ? 'Group Results' : 'Quiz'} &rarr;
          </button>
        </>
      ) : (
        <div className="quiz-results-card">
          {isGroupQuizMode && activeQuizSession ? (
            <div className="text-center mt-6">
              <div className="flex items-center gap-2 justify-center mb-2 text-primary">
                <Trophy size={32} />
                <h4 className="text-[1.75rem] m-0">Group Quiz Scorecard</h4>
              </div>
              <p className="text-ink-muted mb-6">
                Session on: {activeQuizSession.moduleName} | {activeQuizSession.date}
              </p>

              <div className="grid grid-cols-2 gap-6 my-6 p-6 bg-app border border-line rounded-xl">
                <div>
                  <div className="text-[1.75rem] font-bold text-accent-cyan">
                    {activeQuizSession.avgScore}
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
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Rank</th>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Name</th>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Score</th>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Accuracy</th>
                    <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {activeQuizSession.rankings.map((rank, rankIdx) => {
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
            {activeQuizModule.questions.map((q) => {
              const selected = selectedAnswers[q.id];
              const correct = q.correctAnswerIndex;
              return (
                <div className="mb-10" key={q.id}>
                  <div className="text-xl leading-snug mb-5 font-bold text-[1.15rem]">
                    {q.id}. {q.question}
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
