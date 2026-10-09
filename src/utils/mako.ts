import { PersonalGoal, ThemePreset } from '../types';

/**
 * Generate a tailored ~/.config/mako/config file matching minimal monochrome aesthetics
 */
export function generateMakoConfig(preset: ThemePreset = 'monochrome_dark'): string {
  const themes: Record<ThemePreset, { bg: string; text: string; border: string; progress: string }> = {
    monochrome_dark: {
      bg: '#09090bee',
      text: '#fafafa',
      border: '#27272a',
      progress: '#ffffff',
    },
    monochrome_pitch_black: {
      bg: '#000000ee',
      text: '#ffffff',
      border: '#18181b',
      progress: '#e4e4e7',
    },
    monochrome_light: {
      bg: '#fffffffa',
      text: '#09090b',
      border: '#e4e4e7',
      progress: '#18181b',
    },
  };

  const current = themes[preset] || themes.monochrome_dark;

  return `# ==========================================================
# Mako Notification Daemon Config (Arch Linux + Wayland)
# Location: ~/.config/mako/config
# Minimal Monochrome Aesthetic
# ==========================================================

# Global Dimensions & Typography
max-history=50
sort=-time
font=Plus Jakarta Sans 10
width=360
height=160
margin=14
padding=14
border-size=1
border-radius=12
icons=1
max-icon-size=40
icon-location=left
default-timeout=6000
ignore-timeout=0

# Colors (Monochrome Grayscale)
background-color=${current.bg}
text-color=${current.text}
border-color=${current.border}
progress-color=over ${current.progress}

# Goal & Habit Manager Filter Criteria
[app-name="Goals"]
border-size=1
border-color=${current.border}
default-timeout=8000
on-button-left=invoke-default-action
on-button-right=dismiss

# High Urgency / Habit Daily Reminder
[urgency=high]
border-color=#ffffff
default-timeout=0
text-color=#ffffff
`;
}

/**
 * Generate a standalone bash reminder daemon for Arch Linux that sends Mako notifications
 * completely headlessly, without requiring any browser window or taskbar entry.
 */
export function generateMakoDaemonScript(goals: PersonalGoal[]): string {
  const activeGoals = goals.filter((g) => g.status === 'active');
  
  // Format items with their reminder times
  const lines: string[] = [];
  lines.push('#!/usr/bin/env bash');
  lines.push('# ==============================================================================');
  lines.push('# Native Mako Daily Reminder Script for Arch Linux');
  lines.push('# Location: ~/.local/bin/goal-mako-reminder.sh');
  lines.push('# Run silently via systemd user timer or cron. Zero taskbar / Quickshell presence.');
  lines.push('# ==============================================================================');
  lines.push('');
  lines.push('CURRENT_TIME=$(date +"%H:%M")');
  lines.push('TODAY_DATE=$(date +"%Y-%m-%d")');
  lines.push('STATE_FILE="$HOME/.cache/goal-reminders-state.txt"');
  lines.push('mkdir -p "$(dirname "$STATE_FILE")"');
  lines.push('touch "$STATE_FILE"');
  lines.push('');
  lines.push('# Helper function to trigger Mako notification via notify-send');
  lines.push('send_mako_alert() {');
  lines.push('    local tag="$1"');
  lines.push('    local title="$2"');
  lines.push('    local message="$3"');
  lines.push('    local key="${TODAY_DATE}_${tag}"');
  lines.push('');
  lines.push('    # Check if already triggered today');
  lines.push('    if ! grep -q "^$key$" "$STATE_FILE" 2>/dev/null; then');
  lines.push('        notify-send -a "Goals" -u normal -t 8000 "$title" "$message"');
  lines.push('        echo "$key" >> "$STATE_FILE"');
  lines.push('    fi');
  lines.push('}');
  lines.push('');
  lines.push('# Scheduled Goals, Habits, and Sub-Goals:');

  activeGoals.forEach((goal) => {
    // Goal reminder
    if (goal.dailyReminderEnabled !== false && goal.dailyReminderTime) {
      lines.push(
        `if [[ "$CURRENT_TIME" >= "${goal.dailyReminderTime}" ]]; then send_mako_alert "goal_${goal.id}" "Goal: ${goal.title.replace(/"/g, '\\"')}" "Daily check-in for goal: ${goal.category.toUpperCase()}"; fi`
      );
    }

    // Habits
    goal.habits.forEach((habit) => {
      const time = habit.reminderTime || habit.targetTime;
      if (time) {
        lines.push(
          `if [[ "$CURRENT_TIME" >= "${time}" ]]; then send_mako_alert "habit_${habit.id}" "Habit: ${habit.title.replace(/"/g, '\\"')}" "${goal.title.replace(/"/g, '\\"')} · Streak: ${habit.streak}d"; fi`
        );
      }
    });

    // Sub-Goals
    goal.subGoals.forEach((sg) => {
      if (!sg.completed && sg.reminderTime) {
        lines.push(
          `if [[ "$CURRENT_TIME" >= "${sg.reminderTime}" ]]; then send_mako_alert "subgoal_${sg.id}" "Sub-Goal: ${sg.title.replace(/"/g, '\\"')}" "Milestone due for ${goal.title.replace(/"/g, '\\"')}"; fi`
        );
      }
    });
  });

  lines.push('');
  lines.push('# Cleanup state entries older than today at midnight');
  lines.push('grep "^${TODAY_DATE}" "$STATE_FILE" > "${STATE_FILE}.tmp" 2>/dev/null && mv "${STATE_FILE}.tmp" "$STATE_FILE"');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate systemd user service and timer configuration
 */
export function generateSystemdService(): string {
  return `# ~/.config/systemd/user/goal-reminders.service
[Unit]
Description=Goal & Habit Daily Reminder Daemon for Mako
After=graphical-session.target

[Service]
Type=oneshot
ExecStart=%h/.local/bin/goal-mako-reminder.sh
StandardOutput=journal

[Install]
WantedBy=default.target
`;
}

export function generateSystemdTimer(): string {
  return `# ~/.config/systemd/user/goal-reminders.timer
[Unit]
Description=Check Daily Goal & Habit Reminders every minute
After=graphical-session.target

[Timer]
OnCalendar=*:0/1
Persistent=true

[Install]
WantedBy=timers.target
`;
}

/**
 * Hyprland window rules to prevent app window from ever showing in Quickshell or any taskbar
 */
export function generateHyprlandSkipTaskbarRules(): string {
  return `# ~/.config/hypr/hyprland.conf
# ----------------------------------------------------------------------
# Rule to completely hide the Goal Manager from Quickshell & any taskbar:
# ----------------------------------------------------------------------
windowrulev2 = skip_taskbar, class:^(goal-manager)$
windowrulev2 = noinitialfocus, class:^(goal-manager)$
windowrulev2 = float, class:^(goal-manager)$
windowrulev2 = size 1080 820, class:^(goal-manager)$
windowrulev2 = center, class:^(goal-manager)$

# Or assign to a hidden scratchpad (toggle on demand with SUPER+G):
# windowrulev2 = workspace special:goals, class:^(goal-manager)$
# bind = SUPER, G, togglespecialworkspace, goals
`;
}
