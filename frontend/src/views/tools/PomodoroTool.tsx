import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, CheckCircle, Clock } from 'lucide-react';
import type { View } from '../../types';

interface PomodoroToolProps {
  setView: (view: View) => void;
  onFocusSessionComplete?: (minutes: number) => void;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export const PomodoroTool: React.FC<PomodoroToolProps> = ({ setView: _setView, onFocusSessionComplete }) => {
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleCycleCompletionRef = useRef<() => void>(() => {});

  // Play a beautiful synthetic alert sound using the Web Audio API
  const playAlertSound = () => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

  // Switch mode and reset timer
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    const min = durations[newMode];
    setTimeLeft(min * 60);
    setTotalDuration(min * 60);
  };

  const handleCycleCompletion = () => {
    setIsRunning(false);
    playAlertSound();

    if (mode === 'focus') {
      setSessionsCompleted((prev) => prev + 1);
      setTotalFocusMinutes((prev) => prev + durations.focus);

      if (onFocusSessionComplete) {
        onFocusSessionComplete(durations.focus);
      }

      if ((sessionsCompleted + 1) % 4 === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('focus');
    }
  };

  // Keep ref in sync with latest handleCycleCompletion
  useEffect(() => {
    handleCycleCompletionRef.current = handleCycleCompletion;
  });

  // Main countdown timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCycleCompletionRef.current();
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
    if (mode === 'focus') {
      if ((sessionsCompleted + 1) % 4 === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('focus');
    }
  };

  // Custom durations settings submission
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newDurations = {
      focus: Math.max(1, Math.min(180, tempDurations.focus)),
      shortBreak: Math.max(1, Math.min(60, tempDurations.shortBreak)),
      longBreak: Math.max(1, Math.min(120, tempDurations.longBreak)),
    };
    setDurations(newDurations);
    setIsRunning(false);
    const min = newDurations[mode];
    setTimeLeft(min * 60);
    setTotalDuration(min * 60);
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
    <div className="max-w-180 mx-auto py-6 px-6 pb-10">
      <header className="text-center mb-5">
        <h1 className="text-[1.8rem] mb-1 tracking-[-0.02em] font-bold">Focus Timer</h1>
        <p className="text-[0.85rem] text-ink-muted leading-relaxed">
          Stay focused using the Pomodoro technique.
        </p>
      </header>

      <div className="flex gap-5 items-start">
        {/* Main card */}
        <div className="bg-card border border-line rounded-xl p-5 flex-1 relative overflow-hidden shadow-lg flex flex-col items-center">
          {/* Mode tab selectors */}
          <div className="flex gap-2 bg-app p-1 rounded-full border border-line mb-5 w-full max-w-72">
            {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((tab) => (
              <button
                key={tab}
                 onClick={() => switchMode(tab)}
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
          <div className="relative w-44 h-44 flex items-center justify-center mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r="100"
                className="stroke-line fill-none"
                strokeWidth="6"
              />
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
            
            <div className="absolute text-center">
              <div className="text-[2.2rem] font-bold tracking-tight select-none">
                {formatTime(timeLeft)}
              </div>
              <div className="text-[0.6rem] text-ink-muted uppercase tracking-wider font-semibold mt-1">
                {mode === 'focus' ? 'Study Session' : 'Time for a break'}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-5 mb-1">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="w-9 h-9 rounded-full border border-line bg-app flex items-center justify-center cursor-pointer transition-colors duration-150 text-ink-muted hover:text-ink hover:bg-glass"
              title={isSoundEnabled ? 'Disable Alert Sound' : 'Enable Alert Sound'}
            >
              {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            <button
              onClick={handleToggleStart}
              className={`w-12 h-12 rounded-full border-0 flex items-center justify-center cursor-pointer shadow-md transition-all duration-200 hover:scale-105 active:scale-95 ${
                isRunning 
                  ? 'bg-warning text-white' 
                  : 'bg-primary text-ink-on-primary font-bold'
              }`}
            >
              {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-0.5" fill="currentColor" />}
            </button>

            <button
              onClick={handleReset}
              className="w-9 h-9 rounded-full border border-line bg-app flex items-center justify-center cursor-pointer transition-colors duration-150 text-ink-muted hover:text-ink hover:bg-glass"
              title="Reset Timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {isRunning && (
            <button
              onClick={handleSkip}
              className="bg-transparent border-0 text-[0.75rem] text-ink-muted hover:text-primary mt-3 cursor-pointer transition-colors duration-150 font-medium"
            >
              Skip active interval &rarr;
            </button>
          )}

          <button
            onClick={() => {
              setTempDurations({ ...durations });
              setShowSettings(!showSettings);
            }}
            className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1.5 transition-colors duration-150"
            title="Configure Durations"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Stats sidebar */}
        <div className="w-40 flex flex-col gap-3">
          <div className="bg-card border border-line rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="bg-primary-soft text-primary p-2 rounded-lg">
              <CheckCircle size={18} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">{sessionsCompleted}</div>
              <div className="text-[0.65rem] text-ink-muted font-medium uppercase tracking-wider">Sessions</div>
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="bg-primary-soft text-primary p-2 rounded-lg">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">{totalFocusMinutes}m</div>
              <div className="text-[0.65rem] text-ink-muted font-medium uppercase tracking-wider">Focus Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel Overlay Drawer */}
      {showSettings && (
        <div className="bg-card border border-line rounded-xl p-4 mb-5 shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-line">
            <h3 className="text-[0.95rem] font-bold m-0 flex items-center gap-2">
              <Settings size={14} className="text-primary" />
              Configure Durations (minutes)
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer text-xs"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-ink-muted font-semibold mb-1">Study</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={tempDurations.focus}
                  onChange={(e) => setTempDurations({ ...tempDurations, focus: parseInt(e.target.value) || 25 })}
                  className="w-full bg-input border border-line rounded-lg px-2 py-1.5 text-ink text-sm outline-none focus:border-primary text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-ink-muted font-semibold mb-1">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempDurations.shortBreak}
                  onChange={(e) => setTempDurations({ ...tempDurations, shortBreak: parseInt(e.target.value) || 5 })}
                  className="w-full bg-input border border-line rounded-lg px-2 py-1.5 text-ink text-sm outline-none focus:border-primary text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-ink-muted font-semibold mb-1">Long Break</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={tempDurations.longBreak}
                  onChange={(e) => setTempDurations({ ...tempDurations, longBreak: parseInt(e.target.value) || 15 })}
                  className="w-full bg-input border border-line rounded-lg px-2 py-1.5 text-ink text-sm outline-none focus:border-primary text-center font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="btn btn-outline py-1.5 px-3 text-xs font-semibold"
              >
                Discard
              </button>
              <button
                type="submit"
                className="btn btn-primary py-1.5 px-4 text-xs font-bold"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
