import React, { useState } from 'react';
import {
  Plus,
  Maximize2,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PersonalGoal } from '../types';
import { audioSynth } from '../utils/audio';

interface WidgetViewProps {
  goals: PersonalGoal[];
  onToggleHabitToday: (goalId: string, habitId: string) => void;
  onAddHabitInline: (goalId: string, title: string) => void;
  onExpandToFullWorkspace: () => void;
  soundEnabled: boolean;
}

export const WidgetView: React.FC<WidgetViewProps> = ({
  goals,
  onToggleHabitToday,
  onAddHabitInline,
  onExpandToFullWorkspace,
  soundEnabled,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];

  const activeGoals = goals.filter((g) => g.status === 'active');
  const topGoal = activeGoals[0] || goals[0];

  // Collect today's habits across active goals
  const todayHabits: { habit: any; goal: PersonalGoal }[] = [];
  activeGoals.forEach((goal) => {
    goal.habits.forEach((habit) => {
      todayHabits.push({ habit, goal });
    });
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !topGoal) return;
    onAddHabitInline(topGoal.id, quickTitle.trim());
    setQuickTitle('');
    audioSynth.playSnapSound(soundEnabled);
  };

  const handleToggle = (e: React.MouseEvent, goalId: string, habitId: string, isDone: boolean) => {
    e.stopPropagation();
    if (!isDone) {
      audioSynth.playSuccessChime(soundEnabled);
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#ffffff', '#e4e4e7', '#a1a1aa'],
      });
    } else {
      audioSynth.playSnapSound(soundEnabled);
    }
    onToggleHabitToday(goalId, habitId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] p-4 font-sans text-white">
      {/* Widget Container */}
      <div className="w-full max-w-[380px] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-black border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 inline-block" />
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-300 ml-1">
              Daily Desklet
            </span>
          </div>

          <button
            onClick={onExpandToFullWorkspace}
            title="Expand to Full Workspace [SUPER+1]"
            className="p-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Priority Goal */}
        {topGoal && (
          <div className="px-4 py-3 bg-zinc-900/40 border-b border-zinc-850 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{topGoal.icon}</span>
                <span className="font-semibold text-white truncate max-w-[220px]">
                  {topGoal.title}
                </span>
              </div>
              <span className="text-xs font-bold text-white tabular-nums shrink-0">
                {topGoal.progress}%
              </span>
            </div>

            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${topGoal.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Add Habit */}
        {topGoal && (
          <div className="p-3 border-b border-zinc-850 bg-black">
            <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="+ Add habit ritual..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Today's Habits Quick Checklist */}
        <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1 pb-1">
            <span>Today's Habits</span>
            <span className="text-white">
              {todayHabits.filter((h) => h.habit.lastCompletedDate === todayStr).length}/
              {todayHabits.length} Done
            </span>
          </div>

          {todayHabits.length === 0 ? (
            <div className="text-xs font-mono text-zinc-500 text-center py-6">
              No habits scheduled today.
            </div>
          ) : (
            todayHabits.map(({ habit, goal }) => {
              const isDone = habit.lastCompletedDate === todayStr;

              return (
                <div
                  key={habit.id}
                  onClick={(e) => handleToggle(e, goal.id, habit.id, isDone)}
                  className={`flex items-center justify-between gap-2.5 p-2 rounded-lg border transition cursor-pointer text-xs ${
                    isDone
                      ? 'bg-zinc-950 border-zinc-900 opacity-60'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isDone
                          ? 'bg-white text-black'
                          : 'border border-zinc-700 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <span
                      className={`truncate ${
                        isDone ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'
                      }`}
                    >
                      {habit.title}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 shrink-0">
                    <Flame className="w-3 h-3 text-zinc-400" />
                    <span>{habit.streak}d</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
