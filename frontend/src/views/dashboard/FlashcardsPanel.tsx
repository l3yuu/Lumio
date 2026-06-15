import React from 'react';
import { FlashcardsTool } from '../tools/FlashcardsTool';
import type { View } from '../../types';

interface FlashcardsPanelProps {
  setView: (view: View) => void;
}

export const FlashcardsPanel: React.FC<FlashcardsPanelProps> = ({ setView }) => {
  return <FlashcardsTool setView={setView} />;
};
