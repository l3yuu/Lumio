import React from 'react';
import { CondenserTool } from '../tools/CondenserTool';
import type { View } from '../../types';

interface CondenserPanelProps {
  setView: (view: View) => void;
}

export const CondenserPanel: React.FC<CondenserPanelProps> = ({ setView }) => {
  return <CondenserTool setView={setView} />;
};
