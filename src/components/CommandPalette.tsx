import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Target,
  Sun,
  Calendar,
  Download,
  Settings,
  Repeat,
  CheckSquare,
} from 'lucide-react';
import { PersonalGoal, ActiveWorkspace, ThemePreset } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  goals: PersonalGoal[];
  onSelectGoal?: (goal: PersonalGoal) => void;
  onSelectWorkspace: (ws: ActiveWorkspace) => void;
  onOpenNewGoalModal: () => void;
  onOpenSettings: () => void;
  onToggleThemeMode: () => void;
  onSetThemePreset: (preset: ThemePreset) => void;
  onExportBackup: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  goals,
  onSelectGoal,
  onSelectWorkspace,
  onOpenNewGoalModal,
  onOpenSettings,
  onToggleThemeMode,
  onSetThemePreset,
  onExportBackup,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Base navigation commands
  const baseCommands = [
    {
      id: 'cmd-new-goal',
      title: 'Define New Personal Goal',
      subtitle: 'Clarify an objective, milestones & habits (SUPER+G)',
      icon: <Target className="w-4 h-4 text-zinc-400" />,
      action: () => onOpenNewGoalModal(),
    },
    {
      id: 'cmd-ws-1',
      title: 'Switch to Workspace 1: Goals & Sub-Goals',
      subtitle: 'Goal roadmaps and milestone progress (SUPER+1)',
      icon: <Target className="w-4 h-4 text-zinc-400" />,
      action: () => onSelectWorkspace(1),
    },
    {
      id: 'cmd-ws-2',
      title: "Switch to Workspace 2: Today's Daily Habits",
      subtitle: 'Execute and check off today’s habits (SUPER+2)',
      icon: <Sun className="w-4 h-4 text-zinc-400" />,
      action: () => onSelectWorkspace(2),
    },
    {
      id: 'cmd-ws-3',
      title: 'Switch to Workspace 3: Timeline & Deadlines',
      subtitle: 'Upcoming sub-goal milestone target dates (SUPER+3)',
      icon: <Calendar className="w-4 h-4 text-zinc-400" />,
      action: () => onSelectWorkspace(3),
    },
    {
      id: 'cmd-settings',
      title: 'Open Settings & Local Vault',
      subtitle: 'Daily reminder configuration, themes, and backup export',
      icon: <Settings className="w-4 h-4 text-zinc-400" />,
      action: () => onOpenSettings(),
    },
    {
      id: 'cmd-backup',
      title: 'Export JSON Local Storage Backup',
      subtitle: 'Download complete backup of personal goals and habits',
      icon: <Download className="w-4 h-4 text-zinc-400" />,
      action: () => onExportBackup(),
    },
    {
      id: 'cmd-theme-toggle',
      title: 'Toggle Dark / Light Mode',
      subtitle: 'Switch application color luminance',
      icon: <Sun className="w-4 h-4 text-zinc-400" />,
      action: () => onToggleThemeMode(),
    },
  ];

  // Match goals
  const matchedGoals = goals
    .filter((g) => {
      if (!query.trim()) return false;
      const q = query.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      );
    })
    .map((goal) => ({
      id: `goal-${goal.id}`,
      title: `${goal.icon} ${goal.title}`,
      subtitle: `Goal (${goal.progress}% done) · #${goal.category} · ${goal.subGoals.length} sub-goals`,
      icon: <Target className="w-4 h-4 text-zinc-400" />,
      action: () => {
        if (onSelectGoal) onSelectGoal(goal);
        onSelectWorkspace(1);
      },
    }));

  // Match sub-goals and habits
  const matchedSubItems: any[] = [];
  if (query.trim()) {
    const q = query.toLowerCase();
    goals.forEach((goal) => {
      goal.subGoals.forEach((sg) => {
        if (sg.title.toLowerCase().includes(q)) {
          matchedSubItems.push({
            id: `sg-${sg.id}`,
            title: sg.title,
            subtitle: `Sub-goal of ${goal.title} · ${sg.completed ? 'Completed' : 'Pending'}`,
            icon: <CheckSquare className="w-4 h-4 text-zinc-400" />,
            action: () => onSelectWorkspace(1),
          });
        }
      });

      goal.habits.forEach((hb) => {
        if (hb.title.toLowerCase().includes(q)) {
          matchedSubItems.push({
            id: `hb-${hb.id}`,
            title: hb.title,
            subtitle: `Daily Habit of ${goal.title} · ${hb.streak}d streak`,
            icon: <Repeat className="w-4 h-4 text-zinc-400" />,
            action: () => onSelectWorkspace(2),
          });
        }
      });
    });
  }

  const filteredCommands = baseCommands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return cmd.title.toLowerCase().includes(q) || cmd.subtitle.toLowerCase().includes(q);
  });

  const allItems = [...matchedGoals, ...matchedSubItems, ...filteredCommands];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((idx) => (idx + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allItems[selectedIndex];
      if (selected) {
        selected.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-xs p-4 pt-20 font-sans text-white"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 bg-black">
          <Search className="w-4 h-4 text-zinc-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search goals, habits, sub-goals, or commands..."
            className="flex-1 bg-transparent border-0 text-sm text-white placeholder-zinc-500 focus:outline-hidden font-mono"
          />
          <kbd className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-zinc-500">
              No matching goals, habits, or commands found.
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border border-zinc-700 text-white'
                      : 'hover:bg-zinc-900/50 text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{item.title}</div>
                      <div className="text-[11px] font-mono text-zinc-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-zinc-400 pl-2 shrink-0">
                      ↵ Enter
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-zinc-850 bg-black flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>·</span>
            <span>↵ Select</span>
          </div>
          <span>Mako Reminders</span>
        </div>
      </div>
    </div>
  );
};
