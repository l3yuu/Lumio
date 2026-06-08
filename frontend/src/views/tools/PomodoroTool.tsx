import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, CheckCircle, Clock } from 'lucide-react';
import type { View } from '../../types';

interface PomodoroToolProps {
  setView: (view: View) => void;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export const PomodoroTool: React.FC<PomodoroToolProps> = ({ setView }) => {
  // Modes & Settings State
  const [mode, setMode] = useState<TimerMode>('focus');
  const [durations, setDurations] = useState({
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(durations.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState(durations.focus * 60);

  // Statistics State
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);

  // Settings & Sound toggles
  const [showSettings, setShowSettings] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [tempDurations, setTempDurations] = useState({ ...durations });

  // Refs for tracking timer interval
  const timerRef = useRef<any>(null);

  // Play a beautiful synthetic alert sound using the Web Audio API
  const playAlertSound = () => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.25); // A5
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.25);
      gain2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3);
      gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc2.start(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn('Audio Context failed to play alert: ', e);
    }
  };

  // Synchronize timer duration updates when changing tab modes
  useEffect(() => {
    const min = durations[mode];
    setTimeLeft(min * 60);
    setTotalDuration(min * 60);
    setIsRunning(false);
  }, [mode, durations]);

  // Main countdown timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCycleCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleCycleCompletion = () => {
    setIsRunning(false);
    playAlertSound();

    if (mode === 'focus') {
      setSessionsCompleted((prev) => prev + 1);
      setTotalFocusMinutes((prev) => prev + durations.focus);
      
      // Auto-suggest next state based on completed sessions
      if ((sessionsCompleted + 1) % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      setMode('focus');
    }
  };

  // Button controls
  const handleToggleStart = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
    setTotalDuration(durations[mode] * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      if ((sessionsCompleted + 1) % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      setMode('focus');
    }
  };

  // Custom durations settings submission
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setDurations({
      focus: Math.max(1, Math.min(180, tempDurations.focus)),
      shortBreak: Math.max(1, Math.min(60, tempDurations.shortBreak)),
      longBreak: Math.max(1, Math.min(120, tempDurations.longBreak)),
    });
    setShowSettings(false);
  };

  // Helper formats: time string display (e.g. 25:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG circular path calculation
  const strokeDashoffset = totalDuration > 0 
    ? 628 - (628 * (totalDuration - timeLeft)) / totalDuration 
    : 628;

  return (
    <div className="max-w-[720px] mx-auto py-12 px-6 pb-24">
      {/* Back button */}
      <button
        onClick={() => setView('tools')}
        className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong mb-8 px-3 py-1.5 text-xs"
      >
        &larr; Back to Utilities
      </button>

      <header className="text-center mb-10">
        <h1 className="text-[2.5rem] mb-3 tracking-[-0.02em] font-bold">Focus Timer</h1>
        <p className="text-[1.05rem] text-ink-muted leading-relaxed">
          Stay focused on your study modules using the Pomodoro technique.
        </p>
      </header>

      {/* Main card */}
      <div className="bg-card border border-line rounded-xl p-8 mb-8 relative overflow-hidden shadow-lg flex flex-col items-center">
        {/* Mode tab selectors */}
        <div className="flex gap-2 bg-app p-1 rounded-full border border-line mb-8 w-full max-w-[360px]">
          {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`flex-1 py-1.5 px-3 text-xs rounded-full border-0 font-medium transition-all duration-200 cursor-pointer text-center ${
                mode === tab
                  ? 'bg-primary text-ink-on-primary font-semibold shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab === 'focus' ? 'Study' : tab === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-[230px] h-[230px] flex items-center justify-center mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
            {/* Background circle */}
            <circle
              cx="110"
              cy="110"
              r="100"
              className="stroke-line fill-none"
              strokeWidth="6"
            />
            {/* Animated progress circle */}
            <circle
              cx="110"
              cy="110"
              r="100"
              className={`fill-none transition-all duration-300 ${
                mode === 'focus' 
                  ? 'stroke-primary' 
                  : mode === 'shortBreak' 
                    ? 'stroke-accent-cyan' 
                    : 'stroke-warning'
              }`}
              strokeWidth="7"
              strokeDasharray="628"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Inner content */}
          <div className="absolute text-center">
            <div className="text-[2.75rem] font-bold tracking-tight select-none">
              {formatTime(timeLeft)}
            </div>
            <div className="text-[0.65rem] text-ink-muted uppercase tracking-wider font-semibold mt-1">
              {mode === 'focus' ? 'Study Session' : 'Time for a break'}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-6 mb-2">
          {/* Sound toggle */}
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="w-10 h-10 rounded-full border border-line bg-app flex items-center justify-center cursor-pointer transition-colors duration-150 text-ink-muted hover:text-ink hover:bg-glass"
            title={isSoundEnabled ? 'Disable Alert Sound' : 'Enable Alert Sound'}
          >
            {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Start/Pause */}
          <button
            onClick={handleToggleStart}
            className={`w-14 h-14 rounded-full border-0 flex items-center justify-center cursor-pointer shadow-md transition-all duration-200 hover:scale-105 active:scale-95 ${
              isRunning 
                ? 'bg-warning text-white' 
                : 'bg-primary text-ink-on-primary font-bold'
            }`}
          >
            {isRunning ? <Pause size={22} fill="currentColor" /> : <Play size={22} className="ml-1" fill="currentColor" />}
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-full border border-line bg-app flex items-center justify-center cursor-pointer transition-colors duration-150 text-ink-muted hover:text-ink hover:bg-glass"
            title="Reset Timer"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Action helper bar (skip) */}
        {isRunning && (
          <button
            onClick={handleSkip}
            className="bg-transparent border-0 text-[0.8rem] text-ink-muted hover:text-primary mt-4 cursor-pointer transition-colors duration-150 font-medium"
          >
            Skip active interval &rarr;
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => {
            setTempDurations({ ...durations });
            setShowSettings(!showSettings);
          }}
          className="absolute top-5 right-5 bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1.5 transition-colors duration-150"
          title="Configure Durations"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Settings Panel Overlay Drawer */}
      {showSettings && (
        <div className="bg-card border border-line rounded-xl p-6 mb-8 shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-line">
            <h3 className="text-[1.05rem] font-bold m-0 flex items-center gap-2">
              <Settings size={16} className="text-primary" />
              Configure Timer Durations (minutes)
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer text-xs"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-ink-muted font-semibold mb-2">Study Interval</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={tempDurations.focus}
                  onChange={(e) => setTempDurations({ ...tempDurations, focus: parseInt(e.target.value) || 25 })}
                  className="w-full bg-input border border-line rounded-lg px-3 py-2 text-ink text-sm outline-none focus:border-primary text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-ink-muted font-semibold mb-2">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempDurations.shortBreak}
                  onChange={(e) => setTempDurations({ ...tempDurations, shortBreak: parseInt(e.target.value) || 5 })}
                  className="w-full bg-input border border-line rounded-lg px-3 py-2 text-ink text-sm outline-none focus:border-primary text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-ink-muted font-semibold mb-2">Long Break</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={tempDurations.longBreak}
                  onChange={(e) => setTempDurations({ ...tempDurations, longBreak: parseInt(e.target.value) || 15 })}
                  className="w-full bg-input border border-line rounded-lg px-3 py-2 text-ink text-sm outline-none focus:border-primary text-center font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="btn btn-outline py-2 px-4 text-xs font-semibold"
              >
                Discard
              </button>
              <button
                type="submit"
                className="btn btn-primary py-2 px-5 text-xs font-bold"
              >
                Save Durations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics widgets */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-line rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="bg-primary-soft text-primary p-3 rounded-lg">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">{sessionsCompleted}</div>
            <div className="text-[0.7rem] text-ink-muted font-medium uppercase tracking-wider">Completed Sessions</div>
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="bg-primary-soft text-primary p-3 rounded-lg">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">{totalFocusMinutes}m</div>
            <div className="text-[0.7rem] text-ink-muted font-medium uppercase tracking-wider">Total Focus Time</div>
          </div>
        </div>
      </div>
    </div>
  );
};
