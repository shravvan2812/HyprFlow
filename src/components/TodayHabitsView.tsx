import React, { useState, useMemo } from 'react';
import {
  Check,
  Circle,
  Flame,
  Clock,
  Plus,
  Repeat,
  Sparkles,
  ArrowUpDown,
  Bell,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PersonalGoal, Habit } from '../types';
import { audioSynth } from '../utils/audio';

interface TodayHabitsViewProps {
  goals: PersonalGoal[];
  onToggleHabitToday: (goalId: string, habitId: string) => void;
  onOpenNewGoalModal: () => void;
  onAddHabitInline?: (goalId: string, title: string, reminderTime?: string) => void;
  soundEnabled: boolean;
}

interface HabitItemWithMeta {
  habit: Habit;
  goal: PersonalGoal;
  isCompletedToday: boolean;
  smartScore: number;
  smartReason: string;
}

/**
 * Calculates deterministic priority score based on:
 * 1. Completion status today (uncompleted first)
 * 2. Active streak preservation (protecting streaks from breaking)
 * 3. Historical completion patterns over last 14 days
 * 4. Frequency (daily urgency)
 * 5. Time of day scheduled alignment
 */
function computeSmartPriority(habit: Habit, todayStr: string): { score: number; reason: string } {
  const isDoneToday = habit.lastCompletedDate === todayStr;
  if (isDoneToday) {
    return { score: -1000 + (habit.streak || 0), reason: 'Completed today' };
  }

  let score = 500;
  const reasons: string[] = [];

  // 1. Streak preservation priority: An active streak at risk of breaking today
  if (habit.streak > 0) {
    const streakBonus = Math.min(habit.streak * 25, 300);
    score += streakBonus;
    reasons.push(`${habit.streak}d streak at risk`);
  }

  // 2. Historical completion rate over past 14 days
  const historySet = new Set(habit.history || []);
  let completionsLast14 = 0;
  for (let i = 1; i <= 14; i++) {
    const past = new Date();
    past.setDate(past.getDate() - i);
    const dateStr = past.toISOString().split('T')[0];
    if (historySet.has(dateStr)) completionsLast14++;
  }

  // Habit consistency diagnosis
  if (habit.history && habit.history.length > 0 && completionsLast14 < 5) {
    score += 90;
    reasons.push('Consistency needed');
  } else if (completionsLast14 >= 10) {
    score += 40;
    reasons.push('High momentum');
  }

  // 3. Frequency factor
  if (habit.frequency === 'daily') {
    score += 35;
  }

  // 4. Time of day proximity
  const targetTime = habit.reminderTime || habit.targetTime;
  if (targetTime) {
    const [h, m] = targetTime.split(':').map(Number);
    const targetMinutes = h * 60 + (m || 0);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentMinutes >= targetMinutes - 60 && currentMinutes <= targetMinutes + 120) {
      score += 120;
      reasons.push(`Due now · ${targetTime}`);
    } else if (targetMinutes < currentMinutes) {
      score += 80;
      reasons.push(`Scheduled for ${targetTime}`);
    } else {
      score += Math.max(0, 40 - Math.floor((targetMinutes - currentMinutes) / 30));
      reasons.push(`Scheduled ${targetTime}`);
    }
  }

  const primaryReason =
    reasons[0] || (habit.streak > 0 ? `${habit.streak}d streak` : 'Pending execution');
  return { score, reason: primaryReason };
}

export const TodayHabitsView: React.FC<TodayHabitsViewProps> = ({
  goals,
  onToggleHabitToday,
  onOpenNewGoalModal,
  onAddHabitInline,
  soundEnabled,
}) => {
  const [isSmartSort, setIsSmartSort] = useState<boolean>(true);
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickGoalId, setQuickGoalId] = useState<string>('');
  const [quickReminder, setQuickReminder] = useState<string>('08:30');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const activeGoals = goals.filter((g) => g.status === 'active');

  const rawHabitItems: HabitItemWithMeta[] = useMemo(() => {
    const items: HabitItemWithMeta[] = [];
    activeGoals.forEach((goal) => {
      goal.habits.forEach((habit) => {
        const isDone = habit.lastCompletedDate === todayStr;
        const { score, reason } = computeSmartPriority(habit, todayStr);
        items.push({
          habit,
          goal,
          isCompletedToday: isDone,
          smartScore: score,
          smartReason: reason,
        });
      });
    });
    return items;
  }, [activeGoals, todayStr]);

  const sortedHabitItems = useMemo(() => {
    if (!isSmartSort) {
      return [...rawHabitItems].sort((a, b) => {
        if (a.isCompletedToday === b.isCompletedToday) return 0;
        return a.isCompletedToday ? 1 : -1;
      });
    }
    return [...rawHabitItems].sort((a, b) => b.smartScore - a.smartScore);
  }, [rawHabitItems, isSmartSort]);

  const completedTodayCount = rawHabitItems.filter((item) => item.isCompletedToday).length;
  const totalHabitsCount = rawHabitItems.length;
  const completionPercentage =
    totalHabitsCount > 0 ? Math.round((completedTodayCount / totalHabitsCount) * 100) : 0;

  const handleToggle = (goalId: string, habitId: string, isCurrentlyDone: boolean) => {
    if (!isCurrentlyDone) {
      audioSynth.playSuccessChime(soundEnabled);
      confetti({
        particleCount: completedTodayCount + 1 >= totalHabitsCount ? 35 : 18,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a'],
      });
    } else {
      audioSynth.playSnapSound(soundEnabled);
    }
    onToggleHabitToday(goalId, habitId);
  };

  const handleQuickAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !onAddHabitInline) return;
    const targetGoalId = quickGoalId || activeGoals[0]?.id;
    if (!targetGoalId) return;

    onAddHabitInline(targetGoalId, quickTitle.trim(), quickReminder || undefined);
    setQuickTitle('');
    setShowQuickAdd(false);
    audioSynth.playSnapSound(soundEnabled);
  };

  return (
    <div className="flex flex-col space-y-6 max-w-6xl mx-auto py-2 font-sans text-white">
      {/* Top Header: Strict Monochrome Grayscale Summary */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>Daily Ritual</span>
              <span aria-hidden="true">·</span>
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Today's Habits
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              Actionable micro-habits reminded through Mako to conquer your active goals.
            </p>
          </div>

          {/* Grayscale Progress Indicator */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
            <div className="text-right font-mono">
              <div className="text-sm font-bold text-white tabular-nums">
                {completedTodayCount} / {totalHabitsCount}
              </div>
              <div className="text-xs text-zinc-400">
                {completionPercentage}% complete
              </div>
            </div>

            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 flex items-center justify-center relative overflow-hidden bg-black shrink-0">
              <div
                className="absolute inset-x-0 bottom-0 bg-white transition-all duration-300"
                style={{ height: `${completionPercentage}%` }}
              />
              <span className="relative z-10 text-xs font-mono font-bold mix-blend-difference text-white">
                {completionPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Progress Line */}
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Controls Bar: Smart Sort Toggle & Add Habit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-900">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-400">
              <span>Sort:</span>
              <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSmartSort(false)}
                  className={`px-2.5 py-1 rounded-md transition text-xs cursor-pointer ${
                    !isSmartSort
                      ? 'bg-zinc-800 text-white font-medium shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setIsSmartSort(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs cursor-pointer ${
                    isSmartSort
                      ? 'bg-white text-black font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Automatically prioritize by streak protection, frequency, and historical patterns"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Smart Sort</span>
                </button>
              </div>
            </div>

            {isSmartSort && (
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                <span>Streak protection & time prioritization</span>
              </span>
            )}
          </div>

          {activeGoals.length > 0 && onAddHabitInline && (
            <button
              onClick={() => setShowQuickAdd((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono border border-zinc-800 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{showQuickAdd ? 'Close' : 'Add Habit & Reminder'}</span>
            </button>
          )}
        </div>

        {/* Quick Add Habit Form */}
        {showQuickAdd && activeGoals.length > 0 && (
          <form
            onSubmit={handleQuickAddHabit}
            className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-black border border-zinc-800 text-xs font-mono"
          >
            <input
              type="text"
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Habit name (e.g. 30m Deep Work, 5km Run)..."
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500"
            />
            <select
              value={quickGoalId || activeGoals[0]?.id}
              onChange={(e) => setQuickGoalId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200"
            >
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.icon} {g.title}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800" title="Daily Mako Reminder Time">
              <Clock className="w-3 h-3 text-zinc-400" />
              <input
                type="time"
                value={quickReminder}
                onChange={(e) => setQuickReminder(e.target.value)}
                className="bg-transparent border-0 text-white text-xs focus:outline-hidden w-20 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer"
            >
              Create Habit
            </button>
          </form>
        )}
      </div>

      {/* Strict Monochrome Grayscale Grid Layout */}
      {sortedHabitItems.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 text-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Repeat className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">No Habits Scheduled Today</h3>
            <p className="text-xs text-zinc-400 font-mono max-w-sm mx-auto">
              Define a goal and attach daily habits to receive Mako notifications and build streaks.
            </p>
          </div>
          <button
            onClick={onOpenNewGoalModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs transition hover:bg-zinc-200 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Define Goal with Habits</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sortedHabitItems.map(({ habit, goal, isCompletedToday, smartReason }) => {
            const reminderTime = habit.reminderTime || habit.targetTime;

            return (
              <div
                key={habit.id}
                onClick={() => handleToggle(goal.id, habit.id, isCompletedToday)}
                className={`group flex items-start justify-between gap-3.5 p-4 rounded-xl border transition cursor-pointer select-none ${
                  isCompletedToday
                    ? 'bg-zinc-950 border-zinc-900 opacity-60'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                }`}
              >
                {/* Left: Monochrome Checkbox & Titles */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition shrink-0 mt-0.5 ${
                      isCompletedToday
                        ? 'bg-white text-black'
                        : 'border border-zinc-700 bg-zinc-900/60 group-hover:border-zinc-400'
                    }`}
                    title={isCompletedToday ? 'Mark incomplete' : 'Mark done'}
                  >
                    {isCompletedToday ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Circle className="w-3 h-3 text-transparent group-hover:text-zinc-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <span
                      className={`text-sm font-medium transition block truncate ${
                        isCompletedToday
                          ? 'line-through text-zinc-400'
                          : 'text-white group-hover:text-zinc-100'
                      }`}
                    >
                      {habit.title}
                    </span>

                    {/* Unboxed Metadata: Goal name, Mako reminder time, smart reason */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-zinc-400">
                      <span>{goal.icon} {goal.title}</span>

                      {reminderTime && (
                        <>
                          <span aria-hidden="true" className="text-zinc-700">·</span>
                          <span className="flex items-center gap-1 text-zinc-300 font-semibold">
                            <Bell className="w-3 h-3 text-zinc-400" />
                            <span>{reminderTime} Mako</span>
                          </span>
                        </>
                      )}

                      {isSmartSort && !isCompletedToday && smartReason && (
                        <>
                          <span aria-hidden="true" className="text-zinc-700">·</span>
                          <span className="text-zinc-400">
                            {smartReason}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Streak & Status */}
                <div className="flex items-center gap-2 shrink-0 font-mono text-xs pt-0.5">
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300"
                    title={`Current streak: ${habit.streak} days`}
                  >
                    <Flame className="w-3 h-3 text-zinc-400" />
                    <span className="tabular-nums">{habit.streak}d</span>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded border text-[10px] hidden sm:inline ${
                      isCompletedToday
                        ? 'border-zinc-800 text-zinc-400 bg-zinc-900/50'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isCompletedToday ? 'Done' : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
