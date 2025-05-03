import React, { useState, useEffect, useRef } from "react";

const DEFAULT_WORK = 25; // minutes
const DEFAULT_BREAK = 5; // minutes

export function PomodoroWidget() {
  const [workDuration, setWorkDuration] = useState(DEFAULT_WORK);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [running, setRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWidget, setShowWidget] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play gentle sound
  const playSound = () => {
    if (!soundOn) return;
    const audio = new Audio(
      "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5c2.mp3"
    ); // gentle chime
    audio.volume = 0.2;
    audio.play();
  };

  // Timer logic
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t > 1) return t - 1;
        // Transition
        playSound();
        setIsWork((w) => !w);
        return isWork ? breakDuration * 60 : workDuration * 60;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
    // eslint-disable-next-line
  }, [running, isWork, workDuration, breakDuration, soundOn]);

  // Reset timer when durations/settings change
  useEffect(() => {
    setTimeLeft(isWork ? workDuration * 60 : breakDuration * 60);
  }, [workDuration, breakDuration, isWork]);

  // Format mm:ss
  const format = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Progress (0-100)
  const total = (isWork ? workDuration : breakDuration) * 60;
  const percent = 100 - Math.round((timeLeft / total) * 100);

  // Colors
  const barColor = isWork ? "bg-blue-500" : "bg-green-400";
  const bgColor = isWork ? "bg-white/90" : "bg-green-50/90";

  if (!showWidget) {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600 transition"
        onClick={() => setShowWidget(true)}
        aria-label="Show Pomodoro Widget"
      >
        🍅
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[95vw]">
      <div
        className={`rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 ${bgColor} backdrop-blur-md flex flex-col items-center relative`}
      >
        {/* Collapse button */}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-blue-500 text-lg"
          onClick={() => setShowWidget(false)}
          aria-label="Hide Pomodoro Widget"
        >
          ×
        </button>
        {/* Mode & Timer */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isWork ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
            }`}
          >
            {isWork ? "Work" : "Break"}
          </span>
          <span className="text-xl font-mono font-bold text-gray-800 dark:text-gray-100">
            {format(timeLeft)}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
          <div
            className={`h-3 ${barColor} transition-all duration-300 rounded-full`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {/* Controls */}
        <div className="flex gap-2 mb-2">
          <button
            className="px-3 py-1 rounded bg-blue-500 text-white text-xs font-semibold shadow hover:bg-blue-600 transition"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            onClick={() => {
              setRunning(false);
              setTimeLeft(isWork ? workDuration * 60 : breakDuration * 60);
            }}
          >
            Reset
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-semibold shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={() => setShowSettings((s) => !s)}
          >
            ⚙️
          </button>
        </div>
        {/* Sound toggle */}
        <button
          className={`text-xs mt-1 ${soundOn ? "text-blue-500" : "text-gray-400"}`}
          onClick={() => setSoundOn((s) => !s)}
        >
          {soundOn ? "🔔 Sound On" : "🔕 Sound Off"}
        </button>
        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded-2xl">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 w-64">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Settings</h3>
              <div className="mb-3">
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-200">Work Duration (min)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={workDuration}
                  onChange={e => setWorkDuration(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-200">Break Duration (min)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={breakDuration}
                  onChange={e => setBreakDuration(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <button
                className="w-full py-2 rounded bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
                onClick={() => setShowSettings(false)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 