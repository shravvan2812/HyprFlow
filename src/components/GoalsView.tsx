import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Edit3,
  Trash2,
  CheckSquare,
  Repeat,
  Maximize2,
  Bell,
  Clock,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PersonalGoal, GoalCategory, SubGoal, Habit } from '../types';
import { audioSynth } from '../utils/audio';

interface GoalsViewProps {
  goals: PersonalGoal[];
  onSelectGoal: (goal: PersonalGoal) => void;
  onUpdateGoal: (goal: PersonalGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onOpenNewGoalModal: () => void;
  onAddSubGoalInline: (goalId: string, title: string, targetDate?: string, reminderTime?: string) => void;
  onToggleSubGoal: (goalId: string, subGoalId: string) => void;
  onDeleteSubGoal: (goalId: string, subGoalId: string) => void;
  onAddHabitInline: (goalId: string, title: string, reminderTime?: string) => void;
  onToggleHabitToday: (goalId: string, habitId: string) => void;
  onDeleteHabit: (goalId: string, habitId: string) => void;
  soundEnabled: boolean;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onSelectGoal,
  onUpdateGoal,
  onDeleteGoal,
  onOpenNewGoalModal,
  onAddSubGoalInline,
  onToggleSubGoal,
  onDeleteSubGoal,
  onAddHabitInline,
  onToggleHabitToday,
  onDeleteHabit,
  soundEnabled,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | 'all'>('all');
  const [activeFocusGoalId, setActiveFocusGoalId] = useState<string | null>(null);

  // Inline creation states per goal
  const [subGoalInputs, setSubGoalInputs] = useState<{
    [goalId: string]: { title: string; date: string; reminder: string };
  }>({});
  const [habitInputs, setHabitInputs] = useState<{
    [goalId: string]: { title: string; reminder: string };
  }>({});

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredGoals = goals.filter((g) => {
    if (activeFocusGoalId) return g.id === activeFocusGoalId;
    if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
    return true;
  });

  const handleSubGoalSubmit = (goalId: string, e: React.FormEvent) => {
    e.preventDefault();
    const current = subGoalInputs[goalId] || { title: '', date: '', reminder: '10:00' };
    const text = current.title.trim();
    if (!text) return;
    onAddSubGoalInline(goalId, text, current.date || undefined, current.reminder || undefined);
    setSubGoalInputs((prev) => ({
      ...prev,
      [goalId]: { title: '', date: '', reminder: '10:00' },
    }));
    audioSynth.playSnapSound(soundEnabled);
  };

  const handleHabitSubmit = (goalId: string, e: React.FormEvent) => {
    e.preventDefault();
    const current = habitInputs[goalId] || { title: '', reminder: '08:30' };
    const text = current.title.trim();
    if (!text) return;
    onAddHabitInline(goalId, text, current.reminder || undefined);
    setHabitInputs((prev) => ({
      ...prev,
      [goalId]: { title: '', reminder: '08:30' },
    }));
    audioSynth.playSnapSound(soundEnabled);
  };

  const handleSubGoalToggle = (goal: PersonalGoal, subGoal: SubGoal) => {
    if (!subGoal.completed) {
      audioSynth.playSuccessChime(soundEnabled);
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a'],
      });
    } else {
      audioSynth.playSnapSound(soundEnabled);
    }
    onToggleSubGoal(goal.id, subGoal.id);
  };

  const handleHabitToggle = (goal: PersonalGoal, habit: Habit) => {
    const isDoneToday = habit.lastCompletedDate === todayStr;
    if (!isDoneToday) {
      audioSynth.playSuccessChime(soundEnabled);
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.75 },
        colors: ['#ffffff', '#e4e4e7', '#a1a1aa'],
      });
    } else {
      audioSynth.playSnapSound(soundEnabled);
    }
    onToggleHabitToday(goal.id, habit.id);
  };

  const calculateDaysLeft = (targetDate?: string) => {
    if (!targetDate) return null;
    const target = new Date(targetDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col space-y-6 max-w-6xl mx-auto py-2 font-sans text-white">
      {/* Top Header & Minimal Monochrome Category Controls */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Personal Goals
              </h1>
              {activeFocusGoalId && (
                <button
                  onClick={() => setActiveFocusGoalId(null)}
                  className="text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 cursor-pointer"
                >
                  ← Show All Goals
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Set goals, actionable sub-goals, and daily habit reminders through Mako.
            </p>
          </div>

          <button
            onClick={onOpenNewGoalModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs transition hover:bg-zinc-200 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Define New Goal</span>
          </button>
        </div>

        {/* Minimal Monochrome Category Filter */}
        {!activeFocusGoalId && (
          <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            {(['all', 'skills', 'health', 'career', 'mind', 'freedom'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat === 'all' ? 'All Goals' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Strict Monochrome Grayscale Grid Layout */}
      {filteredGoals.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 text-center space-y-3">
          <h3 className="text-sm font-semibold text-white">No Goals in this Category</h3>
          <p className="text-xs text-zinc-400 font-mono max-w-sm mx-auto">
            Define a personal goal and schedule daily Mako reminders to start tracking your daily execution.
          </p>
          <button
            onClick={onOpenNewGoalModal}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs cursor-pointer hover:bg-zinc-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Define Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const daysLeft = calculateDaysLeft(goal.targetDate);
            const totalSubGoals = goal.subGoals.length;
            const completedSubGoals = goal.subGoals.filter((sg) => sg.completed).length;

            const curSg = subGoalInputs[goal.id] || { title: '', date: '', reminder: '10:00' };
            const curHb = habitInputs[goal.id] || { title: '', reminder: '08:30' };

            return (
              <div
                key={goal.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 transition hover:border-zinc-700"
              >
                {/* Top Section */}
                <div className="space-y-4">
                  {/* Goal Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="text-xl p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                        {goal.icon}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                          <span className="uppercase tracking-wider">#{goal.category}</span>
                          {daysLeft !== null && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className={daysLeft < 0 ? 'text-zinc-300 font-bold' : ''}>
                                {daysLeft < 0
                                  ? `${Math.abs(daysLeft)}d overdue`
                                  : daysLeft === 0
                                  ? 'Due today'
                                  : `${daysLeft}d left`}
                              </span>
                            </>
                          )}
                          {goal.dailyReminderEnabled !== false && goal.dailyReminderTime && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="flex items-center gap-1 text-zinc-300 font-semibold">
                                <Bell className="w-3 h-3 text-zinc-400" />
                                <span>{goal.dailyReminderTime} Mako</span>
                              </span>
                            </>
                          )}
                        </div>

                        <h2 className="text-sm font-bold text-white leading-snug truncate">
                          {goal.title}
                        </h2>
                        {goal.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          setActiveFocusGoalId(activeFocusGoalId === goal.id ? null : goal.id)
                        }
                        title={activeFocusGoalId === goal.id ? 'Exit Focus View' : 'Focus Goal'}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          activeFocusGoalId === goal.id
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectGoal(goal)}
                        title="Edit Goal & Reminders"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        title="Delete Goal"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Strict Monochrome Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Progress</span>
                      <span className="text-white font-bold tabular-nums">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Sub-Goals Section */}
                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-850 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Sub-Goals ({completedSubGoals}/{totalSubGoals})</span>
                      </span>
                    </div>

                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {goal.subGoals.map((sg) => (
                        <div
                          key={sg.id}
                          onClick={() => handleSubGoalToggle(goal, sg)}
                          className="group flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-850 transition cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {sg.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0 group-hover:text-zinc-400" />
                            )}
                            <span
                              className={`truncate ${
                                sg.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                              }`}
                            >
                              {sg.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-zinc-400">
                            {sg.targetDate && (
                              <span className="text-zinc-500">
                                {sg.targetDate}
                              </span>
                            )}
                            {sg.reminderTime && (
                              <span className="flex items-center gap-1 text-zinc-300">
                                <Bell className="w-2.5 h-2.5 text-zinc-400" />
                                <span>{sg.reminderTime}</span>
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSubGoal(goal.id, sg.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white p-0.5 rounded transition cursor-pointer"
                              title="Delete sub-goal"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {goal.subGoals.length === 0 && (
                        <div className="text-[11px] font-mono text-zinc-500 py-1">
                          No sub-goals added yet.
                        </div>
                      )}
                    </div>

                    {/* Inline Quick Add Sub-Goal with Reminder Input */}
                    <form
                      onSubmit={(e) => handleSubGoalSubmit(goal.id, e)}
                      className="flex flex-wrap items-center gap-1.5 pt-1"
                    >
                      <input
                        type="text"
                        value={curSg.title}
                        onChange={(e) =>
                          setSubGoalInputs((prev) => ({
                            ...prev,
                            [goal.id]: { ...curSg, title: e.target.value },
                          }))
                        }
                        placeholder="+ Add sub-goal..."
                        className="flex-1 min-w-[140px] px-2.5 py-1 rounded-lg bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500"
                      />
                      <input
                        type="date"
                        value={curSg.date}
                        onChange={(e) =>
                          setSubGoalInputs((prev) => ({
                            ...prev,
                            [goal.id]: { ...curSg, date: e.target.value },
                          }))
                        }
                        className="w-28 px-2 py-1 rounded-lg bg-black border border-zinc-800 text-[10px] text-zinc-300"
                        title="Due Date (optional)"
                      />
                      <div className="flex items-center gap-1 bg-black px-1.5 py-1 rounded-lg border border-zinc-800" title="Mako Reminder Time">
                        <Bell className="w-3 h-3 text-zinc-400" />
                        <input
                          type="time"
                          value={curSg.reminder}
                          onChange={(e) =>
                            setSubGoalInputs((prev) => ({
                              ...prev,
                              [goal.id]: { ...curSg, reminder: e.target.value },
                            }))
                          }
                          className="bg-transparent border-0 text-[10px] text-white focus:outline-hidden w-16 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono transition cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Daily Habits Section */}
                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-850 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Daily Habits ({goal.habits.length})</span>
                      </span>
                    </div>

                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {goal.habits.map((hb) => {
                        const isDoneToday = hb.lastCompletedDate === todayStr;

                        return (
                          <div
                            key={hb.id}
                            onClick={() => handleHabitToggle(goal, hb)}
                            className={`group flex items-center justify-between gap-2 p-1.5 rounded-lg transition cursor-pointer text-xs ${
                              isDoneToday
                                ? 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                                : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center shrink-0 text-[9px] font-bold ${
                                  isDoneToday
                                    ? 'bg-white text-black'
                                    : 'border border-zinc-700 text-transparent group-hover:border-zinc-400'
                                }`}
                              >
                                ✓
                              </span>
                              <span
                                className={`truncate ${
                                  isDoneToday ? 'line-through text-zinc-500' : 'text-zinc-200'
                                }`}
                              >
                                {hb.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-zinc-400">
                              <span className="flex items-center gap-0.5">
                                <Flame className="w-3 h-3 text-zinc-400" />
                                <span>{hb.streak}d</span>
                              </span>
                              {(hb.reminderTime || hb.targetTime) && (
                                <span className="flex items-center gap-1 text-zinc-300">
                                  <Bell className="w-2.5 h-2.5 text-zinc-400" />
                                  <span>{hb.reminderTime || hb.targetTime}</span>
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteHabit(goal.id, hb.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white p-0.5 rounded transition cursor-pointer"
                                title="Delete habit"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {goal.habits.length === 0 && (
                        <div className="text-[11px] font-mono text-zinc-500 py-1">
                          No daily habits defined yet.
                        </div>
                      )}
                    </div>

                    {/* Inline Quick Add Habit with Mako Reminder Time */}
                    <form
                      onSubmit={(e) => handleHabitSubmit(goal.id, e)}
                      className="flex items-center gap-1.5 pt-1"
                    >
                      <input
                        type="text"
                        value={curHb.title}
                        onChange={(e) =>
                          setHabitInputs((prev) => ({
                            ...prev,
                            [goal.id]: { ...curHb, title: e.target.value },
                          }))
                        }
                        placeholder="+ Add daily habit..."
                        className="flex-1 min-w-[140px] px-2.5 py-1 rounded-lg bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500"
                      />
                      <div className="flex items-center gap-1 bg-black px-1.5 py-1 rounded-lg border border-zinc-800 shrink-0" title="Mako Daily Reminder Time">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <input
                          type="time"
                          value={curHb.reminder}
                          onChange={(e) =>
                            setHabitInputs((prev) => ({
                              ...prev,
                              [goal.id]: { ...curHb, reminder: e.target.value },
                            }))
                          }
                          className="bg-transparent border-0 text-[10px] text-white focus:outline-hidden w-16 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono transition cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
