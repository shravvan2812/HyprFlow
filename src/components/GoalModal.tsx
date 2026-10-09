import React, { useState, useEffect } from 'react';
import { X, Target, Trash2, CheckSquare, Repeat, Bell, Clock } from 'lucide-react';
import { PersonalGoal, GoalCategory, SubGoal, Habit } from '../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<PersonalGoal>) => void;
  goalToEdit?: PersonalGoal | null;
}

const CATEGORIES: { id: GoalCategory; label: string; icon: string }[] = [
  { id: 'skills', label: 'Craft & Skills', icon: '🎯' },
  { id: 'health', label: 'Health & Energy', icon: '⚡' },
  { id: 'career', label: 'Career & Projects', icon: '🚀' },
  { id: 'mind', label: 'Mind & Habits', icon: '🧘' },
  { id: 'freedom', label: 'Freedom & Life', icon: '💎' },
];

const ICONS = ['🎯', '⚡', '🚀', '🧘', '🏃', '📚', '💻', '💎', '🏆', '🔥', '⚙️', '🐧'];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  goalToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('skills');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('🎯');

  // Daily Mako reminder settings for this goal
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [dailyReminderTime, setDailyReminderTime] = useState('09:00');

  // Sub-goals (Milestones/Tasks)
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [newSubGoalTitle, setNewSubGoalTitle] = useState('');
  const [newSubGoalDate, setNewSubGoalDate] = useState('');
  const [newSubGoalReminder, setNewSubGoalReminder] = useState('10:00');

  // Daily Habits
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitTime, setNewHabitTime] = useState('08:30');

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setDescription(goalToEdit.description || '');
      setCategory(goalToEdit.category);
      setTargetDate(goalToEdit.targetDate || '');
      setIcon(goalToEdit.icon || '🎯');
      setDailyReminderEnabled(goalToEdit.dailyReminderEnabled !== false);
      setDailyReminderTime(goalToEdit.dailyReminderTime || '09:00');
      setSubGoals(goalToEdit.subGoals || []);
      setHabits(goalToEdit.habits || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('skills');
      const future = new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0];
      setTargetDate(future);
      setIcon('🎯');
      setDailyReminderEnabled(true);
      setDailyReminderTime('09:00');
      setSubGoals([]);
      setHabits([]);
      setNewSubGoalTitle('');
      setNewSubGoalDate('');
      setNewSubGoalReminder('10:00');
      setNewHabitTitle('');
      setNewHabitTime('08:30');
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSubGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubGoalTitle.trim()) return;
    setSubGoals((prev) => [
      ...prev,
      {
        id: 'sg-' + Date.now(),
        title: newSubGoalTitle.trim(),
        completed: false,
        targetDate: newSubGoalDate || undefined,
        reminderTime: newSubGoalReminder || undefined,
      },
    ]);
    setNewSubGoalTitle('');
    setNewSubGoalDate('');
    setNewSubGoalReminder('10:00');
  };

  const handleRemoveSubGoal = (id: string) => {
    setSubGoals((prev) => prev.filter((sg) => sg.id !== id));
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    setHabits((prev) => [
      ...prev,
      {
        id: 'hb-' + Date.now(),
        goalId: goalToEdit?.id || 'pending',
        title: newHabitTitle.trim(),
        frequency: 'daily',
        streak: 0,
        bestStreak: 0,
        history: [],
        targetTime: newHabitTime || '08:30',
        reminderTime: newHabitTime || '08:30',
      },
    ]);
    setNewHabitTitle('');
    setNewHabitTime('08:30');
  };

  const handleRemoveHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: goalToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      targetDate: targetDate || undefined,
      dailyReminderEnabled,
      dailyReminderTime: dailyReminderEnabled ? dailyReminderTime : undefined,
      color: '#ffffff',
      icon,
      subGoals,
      habits,
      status: goalToEdit?.status || 'active',
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto font-sans text-white"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl my-8 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-zinc-900 border border-zinc-800">{icon}</span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {goalToEdit ? 'Edit Personal Goal' : 'Define Goal & Reminders'}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Set daily Mako reminder times, milestones & daily habits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1">
              Goal Objective <span className="text-white">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Rust Systems Programming or Run 10km"
              className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              Motivation & Vision
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this goal critical to your life and focus?"
              className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500 transition"
            />
          </div>

          {/* Category & Target Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-850">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as GoalCategory;
                  setCategory(cat);
                  const matched = CATEGORIES.find((c) => c.id === cat);
                  if (matched) setIcon(matched.icon);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-200"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-200"
              />
            </div>

            {/* Custom Icon Picker */}
            <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 mr-2">Icon:</span>
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition cursor-pointer ${
                    icon === ic
                      ? 'bg-zinc-800 border border-zinc-600 scale-105'
                      : 'hover:bg-zinc-800/50 text-zinc-400'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Dedicated Daily Mako Reminder Configuration for this Goal */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-white" />
                <span>Daily Mako Reminder for this Goal</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-300">
                <input
                  type="checkbox"
                  checked={dailyReminderEnabled}
                  onChange={(e) => setDailyReminderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded-sm bg-black border-zinc-700 text-white accent-white cursor-pointer"
                />
                <span>Remind Daily</span>
              </label>
            </div>

            {dailyReminderEnabled && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <label className="text-zinc-400">Time (HH:MM):</label>
                  <input
                    type="time"
                    value={dailyReminderTime}
                    onChange={(e) => setDailyReminderTime(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-black border border-zinc-800 text-white text-xs font-mono focus:border-zinc-500"
                  />
                </div>
                <span className="text-zinc-400 text-[11px]">
                  Fires daily notification via Mako on your Arch system.
                </span>
              </div>
            )}
          </div>

          {/* Sub-Goals Section */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-zinc-400" />
                <span>Sub-Goals / Tasks ({subGoals.length})</span>
              </span>
              <span className="text-[10px] text-zinc-400">Set milestone deadline & Mako reminder</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newSubGoalTitle}
                onChange={(e) => setNewSubGoalTitle(e.target.value)}
                placeholder="e.g. Complete chapter 1 or build prototype..."
                className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-zinc-500"
              />
              <input
                type="date"
                value={newSubGoalDate}
                onChange={(e) => setNewSubGoalDate(e.target.value)}
                className="w-32 px-2 py-1.5 rounded-lg bg-black border border-zinc-800 text-[11px] text-zinc-300"
                title="Target Due Date"
              />
              <div className="flex items-center gap-1 bg-black px-2 py-1.5 rounded-lg border border-zinc-800">
                <Bell className="w-3 h-3 text-zinc-400" />
                <input
                  type="time"
                  value={newSubGoalReminder}
                  onChange={(e) => setNewSubGoalReminder(e.target.value)}
                  className="bg-transparent border-0 text-[11px] text-zinc-200 focus:outline-hidden w-20"
                  title="Daily Mako Reminder Time"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSubGoal}
                className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs font-mono transition hover:bg-zinc-200 cursor-pointer"
              >
                + Add Sub-Goal
              </button>
            </div>

            {subGoals.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                {subGoals.map((sg) => (
                  <div
                    key={sg.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                      <span className="truncate">{sg.title}</span>
                      {sg.targetDate && (
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          Due {sg.targetDate}
                        </span>
                      )}
                      {sg.reminderTime && (
                        <span className="text-[10px] text-white flex items-center gap-1 shrink-0 font-medium">
                          <Bell className="w-3 h-3 text-zinc-300" />
                          <span>{sg.reminderTime} Mako</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubGoal(sg.id)}
                      className="text-zinc-500 hover:text-white p-1 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Habits Section */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-zinc-400" />
                <span>Daily Habits to Achieve this Goal ({habits.length})</span>
              </span>
              <span className="text-[10px] text-zinc-400">Set daily Mako reminder time</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="e.g. Write Rust code for 45 mins, morning run..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-zinc-500"
              />
              <div className="flex items-center gap-1.5 bg-black px-2.5 py-1.5 rounded-lg border border-zinc-800 shrink-0">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="time"
                  value={newHabitTime}
                  onChange={(e) => setNewHabitTime(e.target.value)}
                  className="bg-transparent border-0 text-[11px] text-white focus:outline-hidden w-20"
                  title="Daily Mako Reminder Time"
                />
              </div>
              <button
                type="button"
                onClick={handleAddHabit}
                className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs font-mono transition hover:bg-zinc-200 cursor-pointer shrink-0"
              >
                + Add Habit
              </button>
            </div>

            {habits.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                {habits.map((hb) => (
                  <div
                    key={hb.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                      <span className="truncate">{hb.title}</span>
                      {hb.targetTime && (
                        <span className="text-[10px] text-white flex items-center gap-1 shrink-0 font-medium">
                          <Bell className="w-3 h-3 text-zinc-300" />
                          <span>{hb.targetTime} Mako</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveHabit(hb.id)}
                      className="text-zinc-500 hover:text-white p-1 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-xs"
            >
              <Target className="w-4 h-4" />
              <span>{goalToEdit ? 'Save Goal & Reminders' : 'Create Goal & Daily Reminders'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
