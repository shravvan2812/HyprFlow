import React from 'react';
import { Calendar, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { PersonalGoal, SubGoal } from '../types';

interface TimelineViewProps {
  goals: PersonalGoal[];
  onToggleSubGoal: (goalId: string, subGoalId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  goals,
  onToggleSubGoal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Extract all sub-goals that have a targetDate
  const milestoneList: { subGoal: SubGoal; goal: PersonalGoal }[] = [];

  goals.forEach((goal) => {
    goal.subGoals.forEach((sg) => {
      milestoneList.push({ subGoal: sg, goal });
    });
  });

  // Sort by targetDate (empty dates go to end)
  milestoneList.sort((a, b) => {
    if (!a.subGoal.targetDate) return 1;
    if (!b.subGoal.targetDate) return -1;
    return a.subGoal.targetDate.localeCompare(b.subGoal.targetDate);
  });

  const overdue = milestoneList.filter(
    (m) => !m.subGoal.completed && m.subGoal.targetDate && m.subGoal.targetDate < todayStr
  );
  const upcoming = milestoneList.filter(
    (m) => !m.subGoal.targetDate || m.subGoal.targetDate >= todayStr
  );

  const completedCount = milestoneList.filter((m) => m.subGoal.completed).length;

  return (
    <div className="flex flex-col space-y-6 max-w-3xl mx-auto py-4 font-sans text-white">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Milestone Schedule</span>
            <span aria-hidden="true">·</span>
            <span>Chronological</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Timeline & Deadlines
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Upcoming milestone deadlines across all active goals.
          </p>
        </div>

        <div className="font-mono text-xs text-zinc-400 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 tabular-nums">
          <span className="text-white font-bold">{completedCount}</span> / {milestoneList.length} Conquered
        </div>
      </div>

      {/* Overdue Milestones */}
      {overdue.length > 0 && (
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-white font-semibold">
            <AlertCircle className="w-4 h-4 text-zinc-400" />
            <span>Overdue Target Deadlines ({overdue.length})</span>
          </div>

          <div className="space-y-1.5">
            {overdue.map(({ subGoal, goal }) => (
              <div
                key={subGoal.id}
                onClick={() => onToggleSubGoal(goal.id, subGoal.id)}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 rounded-md border border-zinc-600 flex items-center justify-center shrink-0">
                    <Circle className="w-3.5 h-3.5 text-transparent" />
                  </div>
                  <span className="text-white font-medium truncate">{subGoal.title}</span>
                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline shrink-0">
                    · {goal.icon} {goal.title}
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-400 font-semibold shrink-0">
                  Due {subGoal.targetDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Milestones */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div className="text-xs font-mono font-semibold text-zinc-400">
          Upcoming Milestones ({upcoming.length})
        </div>

        {upcoming.length === 0 ? (
          <div className="text-xs font-mono text-zinc-500 text-center py-8">
            No upcoming milestones defined. Add sub-goals with deadlines in the Goals view.
          </div>
        ) : (
          <div className="space-y-1.5">
            {upcoming.map(({ subGoal, goal }) => (
              <div
                key={subGoal.id}
                onClick={() => onToggleSubGoal(goal.id, subGoal.id)}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition cursor-pointer text-xs ${
                  subGoal.completed
                    ? 'bg-zinc-950 border-zinc-900 opacity-60'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      subGoal.completed
                        ? 'bg-white text-black'
                        : 'border border-zinc-700'
                    }`}
                  >
                    {subGoal.completed ? '✓' : ''}
                  </div>
                  <span
                    className={`truncate ${
                      subGoal.completed ? 'line-through text-zinc-500' : 'text-white font-medium'
                    }`}
                  >
                    {subGoal.title}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline shrink-0">
                    · {goal.icon} {goal.title}
                  </span>
                </div>

                {subGoal.targetDate && (
                  <span className="text-xs font-mono text-zinc-400 shrink-0">
                    {subGoal.targetDate}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
