export type GoalStatus = 'active' | 'achieved' | 'paused';

export type GoalCategory = 'skills' | 'health' | 'career' | 'mind' | 'freedom';

export interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string; // YYYY-MM-DD
  reminderTime?: string; // HH:MM for Mako notification
  completedAt?: string;
}

export interface Habit {
  id: string;
  goalId: string;
  title: string;
  frequency: 'daily' | 'weekdays';
  streak: number;
  bestStreak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  history: string[]; // Array of YYYY-MM-DD when completed
  targetTime?: string; // HH:MM daily reminder time for Mako
  reminderTime?: string; // HH:MM
}

export interface PersonalGoal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  targetDate?: string; // YYYY-MM-DD
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string; // HH:MM e.g. "09:00" for Mako notification
  lastRemindedDate?: string; // YYYY-MM-DD
  color: string;
  icon: string;
  subGoals: SubGoal[];
  habits: Habit[];
  progress: number; // 0 to 100
  createdAt: string;
  achievedAt?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: GoalCategory;
  goalId?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  completedAt?: string;
  createdAt: string;
}

export type ThemePreset = 'monochrome_dark' | 'monochrome_pitch_black' | 'monochrome_light';

export type ThemeMode = 'dark' | 'light';

export interface AppSettings {
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  soundEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // HH:MM e.g. "09:00"
  makoNotificationsEnabled: boolean;
  lastDailyReminderDate?: string; // YYYY-MM-DD
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  habitsCompletedToday: number;
  totalHabitCompletions: number;
  goalsAchievedCount: number;
}

export interface CloudSnapshot {
  id: string;
  timestamp: string;
  name: string;
  goalCount: number;
  data: string;
}

export type ActiveWorkspace = 1 | 2 | 3;
// 1: Goals & Sub-Goals
// 2: Today's Daily Habits
// 3: Timeline & Deadlines
