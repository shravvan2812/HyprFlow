import React, { useState, useEffect } from 'react';
import {
  Sun,
  Calendar,
  Plus,
  Search,
  Bell,
  Moon,
  Maximize2,
  Settings,
  Flame,
  Target,
  PanelTopClose,
} from 'lucide-react';
import { ActiveWorkspace, AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface WaybarHeaderProps {
  activeWorkspace: ActiveWorkspace;
  onSelectWorkspace: (ws: ActiveWorkspace) => void;
  onOpenNewGoal: () => void;
  onOpenSearch: () => void;
  onToggleWidget: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  pendingHabitsTodayCount: number;
  currentStreak: number;
  onTriggerDailyReminderTest: () => void;
  onToggleQuickshellMode?: () => void;
  isQuickshellMode?: boolean;
}

export const WaybarHeader: React.FC<WaybarHeaderProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  onOpenNewGoal,
  onOpenSearch,
  onToggleWidget,
  onOpenSettings,
  settings,
  onUpdateSettings,
  pendingHabitsTodayCount,
  currentStreak,
  onTriggerDailyReminderTest,
  onToggleQuickshellMode,
  isQuickshellMode = false,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleThemeMode = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      themeMode: prev.themeMode === 'dark' ? 'light' : 'dark',
    }));
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md border-b border-zinc-800 px-3 py-1.5 transition-colors select-none font-sans">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left Section: Workspaces & New Goal */}
        <div className="flex items-center gap-2">
          {/* Clean Monochrome Workspaces: 1: Goals, 2: Habits, 3: Timeline */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs">
            <button
              onClick={() => onSelectWorkspace(1)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeWorkspace === 1
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Workspace 1: Goals & Sub-Goals [SUPER+1]"
            >
              <span>Goals</span>
            </button>

            <button
              onClick={() => onSelectWorkspace(2)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeWorkspace === 2
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Workspace 2: Today's Habits & Ritual [SUPER+2]"
            >
              <span>Habits</span>
              {pendingHabitsTodayCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    activeWorkspace === 2
                      ? 'bg-black text-white'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {pendingHabitsTodayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectWorkspace(3)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeWorkspace === 3
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Workspace 3: Timeline & Deadlines [SUPER+3]"
            >
              <span>Timeline</span>
            </button>
          </div>

          {/* Quick Define Goal */}
          <button
            onClick={onOpenNewGoal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-black font-semibold text-xs transition hover:bg-zinc-200 cursor-pointer shadow-xs"
            title="Define New Personal Goal"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Goal</span>
          </button>
        </div>

        {/* Center Section: Daily Streak & Search */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs"
            title="Daily Habit Consistency Streak"
          >
            <Flame className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold tabular-nums">{currentStreak}d streak</span>
          </div>

          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-mono transition cursor-pointer"
            title="Quick Search / Palette [Ctrl+K]"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <kbd className="text-[10px] bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded hidden sm:inline">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Section: Quickshell Mode, Daily Reminder, Theme, Settings, Widget, Clock */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton compact />

          {/* Quickshell Taskbar Compact Mode Toggle */}
          {onToggleQuickshellMode && (
            <button
              onClick={onToggleQuickshellMode}
              className={`p-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                isQuickshellMode
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800'
              }`}
              title="Quickshell Taskbar Mode: Toggle minimal compact bar [SUPER+B]"
            >
              <PanelTopClose className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Daily Reminder Indicator / Manual Trigger */}
          <button
            onClick={onTriggerDailyReminderTest}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono transition cursor-pointer ${
              settings.dailyReminderEnabled
                ? 'bg-zinc-900 text-white border-zinc-700 hover:bg-zinc-800'
                : 'bg-zinc-950 text-zinc-500 border-zinc-900'
            }`}
            title={`Daily Reminder: ${settings.dailyReminderEnabled ? settings.dailyReminderTime : 'Disabled'}`}
          >
            <Bell className="w-3 h-3 text-zinc-300" />
            <span className="hidden lg:inline text-[11px] text-zinc-400">{settings.dailyReminderTime}</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleThemeMode}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
            title={settings.themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {settings.themeMode === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-zinc-700" />
            )}
          </button>

          {/* Desktop Desklet Widget Toggle */}
          <button
            onClick={onToggleWidget}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Toggle Desklet Widget View [SUPER+W]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Settings & Local Vault */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Settings & Local Storage Vault"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Clock */}
          <div className="hidden sm:flex items-center px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 tabular-nums">
            <span className="text-white font-medium mr-1.5">{time || '00:00:00'}</span>
            <span className="text-[10px] text-zinc-500 hidden xl:inline">{date}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
