import React from 'react';

type ActiveTool = 'flashcards' | 'essay-grader' | 'condenser' | 'pomodoro';

const TOOL_KEY_MAP: Record<string, ActiveTool> = {
  'Flashcard Generator': 'flashcards',
  'AI Essay Grader': 'essay-grader',
  'Document Condenser': 'condenser',
  'Pomodoro Focus Timer': 'pomodoro',
};

interface ToolsPanelProps {
  studyTools: { title: string; desc: string; icon: React.ReactNode }[];
  setActiveTool: (tool: ActiveTool) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ studyTools, setActiveTool }) => {
  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <h3 className="text-[1.15rem] mb-4 flex items-center gap-2">Study Utilities</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
        {studyTools.map((t, idx) => (
          <div
            className="bg-app border border-line rounded-lg p-6 cursor-pointer text-center transition-all duration-200 hover:border-primary hover:bg-glass"
            key={idx}
            onClick={() => {
              const key = TOOL_KEY_MAP[t.title];
              if (key) setActiveTool(key);
            }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-soft text-primary mb-3 mx-auto">{t.icon}</div>
            <div className="text-[0.95rem] font-bold mb-2">{t.title}</div>
            <div className="text-[0.8rem] text-ink-muted">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
