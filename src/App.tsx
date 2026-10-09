import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  PersonalGoal,
  AppSettings,
  ActiveWorkspace,
  UserStats,
  Task,
  ThemePreset,
} from './types';
import { storage, computeGoalProgress } from './utils/storage';
import { audioSynth } from './utils/audio';
import { useDailyReminder } from './hooks/useDailyReminder';
import { WaybarHeader } from './components/WaybarHeader';
import { GoalsView } from './components/GoalsView';
import { TodayHabitsView } from './components/TodayHabitsView';
import { TimelineView } from './components/TimelineView';
import { GoalModal } from './components/GoalModal';
import { WidgetView } from './components/WidgetView';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { DailyReminderBanner } from './components/DailyReminderBanner';

export default function App() {
  const [goals, setGoals] = useState<PersonalGoal[]>(() => storage.getGoals());
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [stats, setStats] = useState<UserStats>(() => storage.getStats());

  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace>(1);
  const [isWidgetMode, setIsWidgetMode] = useState<boolean>(false);
  const [isQuickshellMode, setIsQuickshellMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('quickshell') === 'true' || params.get('bar') === 'false') return true;
      return localStorage.getItem('quickshell_compact_mode') === 'true';
    }
    return false;
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [goalToEdit, setGoalToEdit] = useState<PersonalGoal | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to persist goals state
  const updateGoalsState = useCallback((newGoals: PersonalGoal[]) => {
    setGoals(newGoals);
    storage.saveGoals(newGoals);
  }, []);

  // Daily Reminder hook
  const {
    activeAlert,
    dismissAlert,
    snoozeAlert,
    triggerDailyReminder,
    notificationPermission,
    requestPermission,
  } = useDailyReminder(goals, settings, setSettings);

  // Sync theme changes to HTML element class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.themeMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    storage.saveSettings(settings);
  }, [settings]);

  // Handle URL query parameters (e.g. ?view=widget or ?action=quick_goal or ?workspace=2)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'widget') {
        setIsWidgetMode(true);
      }
      if (params.get('action') === 'quick_goal') {
        setGoalToEdit(null);
        setIsGoalModalOpen(true);
      }
      if (params.get('workspace')) {
        const ws = Number(params.get('workspace')) as ActiveWorkspace;
        if (ws >= 1 && ws <= 3) setActiveWorkspace(ws);
      }
      if (params.get('quickshell') === 'true' || params.get('bar') === 'false') {
        setIsQuickshellMode(true);
      }
    }
  }, []);

  // Save quickshell mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickshell_compact_mode', String(isQuickshellMode));
    }
  }, [isQuickshellMode]);

  // Keyboard Shortcuts (Arch & Hyprland ergonomics)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Ctrl + K or Super + Space -> Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.code === 'Space')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      // Super + B -> Toggle Quickshell Bar Minimal Mode
      if ((e.metaKey || e.altKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsQuickshellMode((prev) => !prev);
        return;
      }

      // Super + G or Alt + G -> Define New Personal Goal
      if ((e.metaKey || e.altKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setGoalToEdit(null);
        setIsGoalModalOpen(true);
        return;
      }

      // Super + W or Alt + W -> Toggle Desklet Widget View
      if ((e.metaKey || e.altKey) && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        setIsWidgetMode((prev) => !prev);
        return;
      }

      // Super + 1..3 -> Switch Workspaces
      if (e.metaKey || e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveWorkspace(1);
          setIsWidgetMode(false);
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveWorkspace(2);
          setIsWidgetMode(false);
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveWorkspace(3);
          setIsWidgetMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Goal handlers
  const handleSaveGoal = (goalData: Partial<PersonalGoal>) => {
    if (goalData.id) {
      const updated = goals.map((g) => {
        if (g.id === goalData.id) {
          const merged: PersonalGoal = { ...g, ...goalData } as PersonalGoal;
          merged.progress = computeGoalProgress(merged);
          return merged;
        }
        return g;
      });
      updateGoalsState(updated);
    } else {
      const newGoal: PersonalGoal = {
        id: 'goal-' + Date.now(),
        title: goalData.title || 'Untitled Goal',
        description: goalData.description || '',
        category: goalData.category || 'skills',
        status: goalData.status || 'active',
        targetDate: goalData.targetDate,
        color: goalData.color || '#06b6d4',
        icon: goalData.icon || '🎯',
        subGoals: goalData.subGoals || [],
        habits: goalData.habits || [],
        progress: 0,
        createdAt: new Date().toISOString(),
      };
      newGoal.progress = computeGoalProgress(newGoal);
      const updated = [newGoal, ...goals];
      updateGoalsState(updated);
      audioSynth.playSnapSound(settings.soundEnabled);
    }
    setIsGoalModalOpen(false);
    setGoalToEdit(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter((g) => g.id !== goalId);
    updateGoalsState(updated);
    audioSynth.playSnapSound(settings.soundEnabled);
  };

  const handleUpdateGoal = (goal: PersonalGoal) => {
    const recalculated = { ...goal, progress: computeGoalProgress(goal) };
    const updated = goals.map((g) => (g.id === goal.id ? recalculated : g));
    updateGoalsState(updated);
  };

  // Sub-goal handlers
  const handleAddSubGoalInline = (goalId: string, title: string, targetDate?: string, reminderTime?: string) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const newSubGoal = {
          id: 'sg-' + Date.now(),
          title: title.trim(),
          completed: false,
          targetDate,
          reminderTime,
        };
        const modified = { ...g, subGoals: [...g.subGoals, newSubGoal] };
        modified.progress = computeGoalProgress(modified);
        return modified;
      }
      return g;
    });
    updateGoalsState(updated);
  };

  const handleToggleSubGoal = (goalId: string, subGoalId: string) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const modifiedSubGoals = g.subGoals.map((sg) =>
          sg.id === subGoalId
            ? {
                ...sg,
                completed: !sg.completed,
                completedAt: !sg.completed ? new Date().toISOString() : undefined,
              }
            : sg
        );
        const modified = { ...g, subGoals: modifiedSubGoals };
        modified.progress = computeGoalProgress(modified);
        return modified;
      }
      return g;
    });
    updateGoalsState(updated);
  };

  const handleDeleteSubGoal = (goalId: string, subGoalId: string) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const filtered = g.subGoals.filter((sg) => sg.id !== subGoalId);
        const modified = { ...g, subGoals: filtered };
        modified.progress = computeGoalProgress(modified);
        return modified;
      }
      return g;
    });
    updateGoalsState(updated);
  };

  // Habit handlers
  const handleAddHabitInline = (goalId: string, title: string, reminderTime?: string) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const newHabit = {
          id: 'hb-' + Date.now(),
          goalId,
          title: title.trim(),
          frequency: 'daily' as const,
          streak: 0,
          bestStreak: 0,
          history: [],
          targetTime: reminderTime,
          reminderTime,
        };
        const modified = { ...g, habits: [...g.habits, newHabit] };
        modified.progress = computeGoalProgress(modified);
        return modified;
      }
      return g;
    });
    updateGoalsState(updated);
  };

  const handleToggleHabitToday = (goalId: string, habitId: string) => {
    let completedNow = false;

    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const modifiedHabits = g.habits.map((h) => {
          if (h.id === habitId) {
            const isDoneToday = h.lastCompletedDate === todayStr;
            completedNow = !isDoneToday;

            if (!isDoneToday) {
              const newStreak = h.streak + 1;
              return {
                ...h,
                streak: newStreak,
                bestStreak: Math.max(h.bestStreak, newStreak),
                lastCompletedDate: todayStr,
                history: [...(h.history || []), todayStr],
              };
            } else {
              // Uncomplete
              const newStreak = Math.max(0, h.streak - 1);
              return {
                ...h,
                streak: newStreak,
                lastCompletedDate: undefined,
                history: (h.history || []).filter((d) => d !== todayStr),
              };
            }
          }
          return h;
        });

        const modified = { ...g, habits: modifiedHabits };
        modified.progress = computeGoalProgress(modified);
        return modified;
      }
      return g;
    });

    updateGoalsState(updated);

    // Update global user stats
    setStats((prev) => {
      const newStats = {
        ...prev,
        totalHabitCompletions: completedNow
          ? prev.totalHabitCompletions + 1
          : Math.max(0, prev.totalHabitCompletions - 1),
        currentStreak: completedNow ? Math.max(prev.currentStreak, 1) : prev.currentStreak,
      };
      storage.saveStats(newStats);
      return newStats;
    });
  };

  const handleDeleteHabit = (goalId: string, habitId: string) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const filtered = g.habits.filter((h) => h.id !== habitId);
        const modified = { ...g, habits: filtered };
        modified.progress = computeGoalProgress(modified);
        return modified;
      }
      return g;
    });
    updateGoalsState(updated);
  };

  // Count pending habits across active goals for today
  const activeGoals = goals.filter((g) => g.status === 'active');
  const allHabits = activeGoals.flatMap((g) => g.habits);
  const pendingHabitsTodayCount = allHabits.filter((h) => h.lastCompletedDate !== todayStr).length;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        settings.themeMode === 'dark'
          ? 'bg-black text-white'
          : 'bg-white text-black'
      }`}
    >
      {/* Waybar / Quickshell Responsive Status Bar Header */}
      {!isQuickshellMode ? (
        <WaybarHeader
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={(ws) => {
            setActiveWorkspace(ws);
            setIsWidgetMode(false);
          }}
          onOpenNewGoal={() => {
            setGoalToEdit(null);
            setIsGoalModalOpen(true);
          }}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onToggleWidget={() => setIsWidgetMode((v) => !v)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          settings={settings}
          onUpdateSettings={setSettings}
          pendingHabitsTodayCount={pendingHabitsTodayCount}
          currentStreak={stats.currentStreak}
          onTriggerDailyReminderTest={() => triggerDailyReminder(true)}
          isQuickshellMode={isQuickshellMode}
          onToggleQuickshellMode={() => setIsQuickshellMode((prev) => !prev)}
        />
      ) : (
        /* Minimal Quickshell Floating Companion Dock (Ultra-compact) */
        <div className="sticky top-0 z-40 w-full px-4 py-2 flex items-center justify-between select-none">
          <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-xs font-mono backdrop-blur-md">
            <button
              onClick={() => setActiveWorkspace(1)}
              className={`px-2 py-0.5 rounded-md transition ${activeWorkspace === 1 ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
            >
              1: Goals
            </button>
            <button
              onClick={() => setActiveWorkspace(2)}
              className={`px-2 py-0.5 rounded-md transition ${activeWorkspace === 2 ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
            >
              2: Habits ({pendingHabitsTodayCount})
            </button>
            <button
              onClick={() => setActiveWorkspace(3)}
              className={`px-2 py-0.5 rounded-md transition ${activeWorkspace === 3 ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
            >
              3: Timeline
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-zinc-950/90 border border-zinc-800 backdrop-blur-md text-xs font-mono">
            <button
              onClick={() => setIsQuickshellMode(false)}
              className="px-2 py-0.5 text-zinc-400 hover:text-white rounded-md transition"
              title="Expand full header bar [SUPER+B]"
            >
              Restore Bar [Super+B]
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-4">
        {isWidgetMode ? (
          /* Floating Desklet Widget Companion */
          <WidgetView
            goals={goals}
            onToggleHabitToday={handleToggleHabitToday}
            onAddHabitInline={handleAddHabitInline}
            onExpandToFullWorkspace={() => setIsWidgetMode(false)}
            soundEnabled={settings.soundEnabled}
          />
        ) : (
          /* Full Workspaces */
          <>
            {/* Workspace 1: Goals (All goals, sub-goals roadmap, habits) */}
            {activeWorkspace === 1 && (
              <GoalsView
                goals={goals}
                onSelectGoal={(goal) => {
                  setGoalToEdit(goal);
                  setIsGoalModalOpen(true);
                }}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
                onOpenNewGoalModal={() => {
                  setGoalToEdit(null);
                  setIsGoalModalOpen(true);
                }}
                onAddSubGoalInline={handleAddSubGoalInline}
                onToggleSubGoal={handleToggleSubGoal}
                onDeleteSubGoal={handleDeleteSubGoal}
                onAddHabitInline={handleAddHabitInline}
                onToggleHabitToday={handleToggleHabitToday}
                onDeleteHabit={handleDeleteHabit}
                soundEnabled={settings.soundEnabled}
              />
            )}

            {/* Workspace 2: Today's Daily Habits & Ritual */}
            {activeWorkspace === 2 && (
              <TodayHabitsView
                goals={goals}
                onToggleHabitToday={handleToggleHabitToday}
                onOpenNewGoalModal={() => {
                  setGoalToEdit(null);
                  setIsGoalModalOpen(true);
                }}
                onAddHabitInline={handleAddHabitInline}
                soundEnabled={settings.soundEnabled}
              />
            )}

            {/* Workspace 3: Timeline & Deadlines */}
            {activeWorkspace === 3 && (
              <TimelineView
                goals={goals}
                onToggleSubGoal={handleToggleSubGoal}
              />
            )}
          </>
        )}
      </main>

      {/* Goal Define & Edit Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        onSave={handleSaveGoal}
        goalToEdit={goalToEdit}
      />

      {/* Settings & Local Storage Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        goals={goals}
        tasks={tasks}
        onRestoreData={(restoredGoals, restoredTasks) => {
          setGoals(restoredGoals);
          setTasks(restoredTasks);
        }}
        onTestReminder={() => triggerDailyReminder(true)}
        notificationPermission={notificationPermission}
        onRequestPermission={requestPermission}
      />

      {/* Rofi / Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        goals={goals}
        onSelectGoal={(goal) => {
          setGoalToEdit(goal);
          setIsGoalModalOpen(true);
        }}
        onSelectWorkspace={(ws) => {
          setActiveWorkspace(ws);
          setIsWidgetMode(false);
        }}
        onOpenNewGoalModal={() => {
          setGoalToEdit(null);
          setIsGoalModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleThemeMode={() => {
          setSettings((prev) => ({
            ...prev,
            themeMode: prev.themeMode === 'dark' ? 'light' : 'dark',
          }));
        }}
        onSetThemePreset={(preset: ThemePreset) => {
          setSettings((prev) => ({ ...prev, themePreset: preset }));
        }}
        onExportBackup={() => storage.exportBackupFile(goals, tasks, settings)}
      />

      {/* Daily Goal & Habit Reminder Banner */}
      <DailyReminderBanner
        alert={activeAlert}
        onCheckInNow={() => {
          dismissAlert();
          setActiveWorkspace(2);
          setIsWidgetMode(false);
        }}
        onSnooze={snoozeAlert}
        onDismiss={dismissAlert}
      />
    </div>
  );
}
