import React from 'react';
import { EssayGraderTool } from '../tools/EssayGraderTool';
import type { View } from '../../types';

interface EssayGraderPanelProps {
  setView: (view: View) => void;
}

export const EssayGraderPanel: React.FC<EssayGraderPanelProps> = ({ setView }) => {
  return <EssayGraderTool setView={setView} />;
};
