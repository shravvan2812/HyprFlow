import React from 'react';
import { Sun, X, ArrowRight } from 'lucide-react';
import { DailyReminderAlert } from '../hooks/useDailyReminder';

interface DailyReminderBannerProps {
  alert: DailyReminderAlert | null;
  onCheckInNow: () => void;
  onSnooze: (minutes?: number) => void;
  onDismiss: () => void;
}

export const DailyReminderBanner: React.FC<DailyReminderBannerProps> = ({
  alert,
  onCheckInNow,
  onSnooze,
  onDismiss,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed top-14 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-3 duration-200 font-sans text-white">
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span>Daily Reminder</span>
                <span aria-hidden="true">·</span>
                <span>{alert.timestamp}</span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                Daily Goal & Habit Check-In
              </h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                {alert.pendingHabitsCount > 0 ? (
                  <>
                    You have <strong className="text-white font-bold">{alert.pendingHabitsCount}</strong> pending habit{alert.pendingHabitsCount > 1 ? 's' : ''} across <strong className="text-white">{alert.activeGoalsCount}</strong> goal{alert.activeGoalsCount > 1 ? 's' : ''} to complete today.
                  </>
                ) : (
                  <>All daily habits are completed today. Excellent consistency.</>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-white p-1 rounded-lg transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900 text-xs font-mono">
          <button
            onClick={() => onSnooze(15)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition cursor-pointer"
          >
            Snooze 15m
          </button>
          <button
            onClick={onCheckInNow}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition cursor-pointer shadow-xs"
          >
            <span>Review Habits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
