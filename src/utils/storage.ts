import { PersonalGoal, Task, AppSettings, UserStats, CloudSnapshot } from '../types';

const STORAGE_KEY_GOALS = 'hyprflow_personal_goals_v2';
const STORAGE_KEY_TASKS = 'hyprflow_personal_tasks_v2';
const STORAGE_KEY_SETTINGS = 'hyprflow_personal_settings_v2';
const STORAGE_KEY_STATS = 'hyprflow_personal_stats_v2';
const STORAGE_KEY_SNAPSHOTS = 'hyprflow_personal_snapshots_v2';

export const INITIAL_SETTINGS: AppSettings = {
  themeMode: 'dark',
  themePreset: 'monochrome_dark',
  soundEnabled: true,
  dailyReminderEnabled: true,
  dailyReminderTime: '09:00',
  makoNotificationsEnabled: true,
};

export const INITIAL_STATS: UserStats = {
  currentStreak: 3,
  longestStreak: 7,
  lastActiveDate: new Date().toISOString().split('T')[0],
  habitsCompletedToday: 1,
  totalHabitCompletions: 14,
  goalsAchievedCount: 1,
};

export const INITIAL_GOALS: PersonalGoal[] = [
  {
    id: 'goal-1',
    title: 'Master Systems Programming in Rust & Kernel Internals',
    description: 'Build robust, memory-safe CLI tools and study Linux EEVDF scheduler mechanics.',
    category: 'skills',
    status: 'active',
    targetDate: '2026-12-31',
    color: '#ffffff',
    icon: '🦀',
    progress: 60,
    createdAt: '2026-09-01T08:00:00.000Z',
    subGoals: [
      { id: 'sg-1', title: 'Complete Rust book & advanced lifetimes', completed: true, targetDate: '2026-10-15' },
      { id: 'sg-2', title: 'Implement eBPF packet monitor in Rust', completed: true, targetDate: '2026-11-01' },
      { id: 'sg-3', title: 'Profile EEVDF latency vs CFS on Arch', completed: false, targetDate: '2026-11-25' },
      { id: 'sg-4', title: 'Publish technical case study on GitHub', completed: false, targetDate: '2026-12-20' },
    ],
    habits: [
      {
        id: 'hb-1',
        goalId: 'goal-1',
        title: 'Write or review Rust code for 30 mins',
        frequency: 'daily',
        streak: 5,
        bestStreak: 12,
        lastCompletedDate: new Date().toISOString().split('T')[0],
        history: [new Date().toISOString().split('T')[0]],
        targetTime: '09:00',
      },
      {
        id: 'hb-2',
        goalId: 'goal-1',
        title: 'Study 1 Linux kernel subsystem or documentation page',
        frequency: 'daily',
        streak: 2,
        bestStreak: 6,
        history: [],
        targetTime: '21:00',
      },
    ],
  },
  {
    id: 'goal-2',
    title: 'Peak Physical Conditioning & 10km Endurance Run',
    description: 'Build sustained cardiovascular health, morning hydration, and run a sub-50min 10km.',
    category: 'health',
    status: 'active',
    targetDate: '2026-11-30',
    color: '#e4e4e7',
    icon: '⚡',
    progress: 45,
    createdAt: '2026-09-10T09:00:00.000Z',
    subGoals: [
      { id: 'sg-5', title: 'Establish baseline 5km run at 6:00/km pace', completed: true, targetDate: '2026-10-10' },
      { id: 'sg-6', title: 'Reach 8km continuous run threshold', completed: false, targetDate: '2026-11-10' },
      { id: 'sg-7', title: 'Complete official 10km endurance trial', completed: false, targetDate: '2026-11-28' },
    ],
    habits: [
      {
        id: 'hb-3',
        goalId: 'goal-2',
        title: 'Morning stretch & hydration ritual',
        frequency: 'daily',
        streak: 8,
        bestStreak: 14,
        lastCompletedDate: new Date().toISOString().split('T')[0],
        history: [new Date().toISOString().split('T')[0]],
        targetTime: '07:30',
      },
      {
        id: 'hb-4',
        goalId: 'goal-2',
        title: 'Afternoon cardio or 30-min recovery walk',
        frequency: 'daily',
        streak: 3,
        bestStreak: 7,
        history: [],
        targetTime: '18:00',
      },
    ],
  },
  {
    id: 'goal-3',
    title: 'Deliver Minimalist Personal Goal App to Production',
    description: 'Create zero-clutter, local-storage personal goal setting software with daily habits.',
    category: 'career',
    status: 'active',
    targetDate: '2026-10-31',
    color: '#a1a1aa',
    icon: '🎯',
    progress: 80,
    createdAt: '2026-09-20T10:00:00.000Z',
    subGoals: [
      { id: 'sg-8', title: 'Define Goal & Sub-Goal / Habit hierarchy', completed: true, targetDate: '2026-10-05' },
      { id: 'sg-9', title: 'Design daily reminder & desktop notification engine', completed: true, targetDate: '2026-10-15' },
      { id: 'sg-10', title: 'Build clean, distraction-free minimalist interface', completed: true, targetDate: '2026-10-25' },
    ],
    habits: [
      {
        id: 'hb-5',
        goalId: 'goal-3',
        title: 'Daily goal review & habit check-in',
        frequency: 'daily',
        streak: 11,
        bestStreak: 11,
        lastCompletedDate: new Date().toISOString().split('T')[0],
        history: [new Date().toISOString().split('T')[0]],
        targetTime: '09:30',
      },
    ],
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Review today’s goal habits & define top intention',
    description: 'Check active goals and complete habits for the day.',
    status: 'done',
    priority: 'high',
    category: 'mind',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Write test benchmark for sub-goal completion rate',
    description: 'Ensure accurate percentage computation on checklist toggle.',
    status: 'in_progress',
    priority: 'medium',
    category: 'skills',
    goalId: 'goal-1',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '15:00',
    createdAt: new Date().toISOString(),
  },
];

export function computeGoalProgress(goal: PersonalGoal): number {
  const totalSubGoals = goal.subGoals.length;
  const completedSubGoals = goal.subGoals.filter((sg) => sg.completed).length;

  if (totalSubGoals === 0 && goal.habits.length === 0) {
    return goal.status === 'achieved' ? 100 : 0;
  }

  // Weight sub-goals 70% and habits 30% if both exist
  if (totalSubGoals > 0 && goal.habits.length > 0) {
    const subGoalPct = completedSubGoals / totalSubGoals;
    const todayStr = new Date().toISOString().split('T')[0];
    const completedHabitsToday = goal.habits.filter(
      (h) => h.lastCompletedDate === todayStr
    ).length;
    const habitPct = completedHabitsToday / goal.habits.length;

    // Average streak factor
    const avgStreak =
      goal.habits.reduce((acc, h) => acc + Math.min(h.streak, 7), 0) /
      (goal.habits.length * 7);

    const habitContribution = habitPct * 0.5 + avgStreak * 0.5;
    return Math.min(100, Math.round(subGoalPct * 75 + habitContribution * 25));
  }

  if (totalSubGoals > 0) {
    return Math.round((completedSubGoals / totalSubGoals) * 100);
  }

  // If only habits
  const todayStr = new Date().toISOString().split('T')[0];
  const completedHabitsToday = goal.habits.filter((h) => h.lastCompletedDate === todayStr).length;
  return Math.round((completedHabitsToday / goal.habits.length) * 100);
}

export const storage = {
  getGoals(): PersonalGoal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_GOALS);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(INITIAL_GOALS));
        return INITIAL_GOALS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_GOALS;
    }
  },

  saveGoals(goals: PersonalGoal[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Failed to save goals:', e);
    }
  },

  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TASKS);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
        return INITIAL_TASKS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      return { ...INITIAL_SETTINGS, ...JSON.parse(data) };
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  getStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATS);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(INITIAL_STATS));
        return INITIAL_STATS;
      }
      return { ...INITIAL_STATS, ...JSON.parse(data) };
    } catch {
      return INITIAL_STATS;
    }
  },

  saveStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats:', e);
    }
  },

  getSnapshots(): CloudSnapshot[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  createSnapshot(goals: PersonalGoal[], tasks: Task[]): CloudSnapshot {
    const snapshots = this.getSnapshots();
    const newSnap: CloudSnapshot = {
      id: 'snap-' + Date.now(),
      timestamp: new Date().toISOString(),
      name: `Personal Vault Snapshot (${goals.length} goals)`,
      goalCount: goals.length,
      data: JSON.stringify({ goals, tasks }),
    };
    const updated = [newSnap, ...snapshots].slice(0, 10);
    try {
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save snapshot:', e);
    }
    return newSnap;
  },

  exportBackupFile(goals: PersonalGoal[], tasks: Task[], settings: AppSettings): void {
    const backupPayload = {
      app: 'Personal Goal Manager',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      goals,
      tasks,
      settings,
      stats: this.getStats(),
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goals_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
