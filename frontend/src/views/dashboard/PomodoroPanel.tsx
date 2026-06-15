import React from 'react';
import { PomodoroTool } from '../tools/PomodoroTool';
import type { View } from '../../types';

interface PomodoroPanelProps {
  setView: (view: View) => void;
  onFocusSessionComplete?: (minutes: number) => void;
}

export const PomodoroPanel: React.FC<PomodoroPanelProps> = ({ setView, onFocusSessionComplete }) => {
  return <PomodoroTool setView={setView} onFocusSessionComplete={onFocusSessionComplete} />;
};
